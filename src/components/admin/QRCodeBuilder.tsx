import { useState, useRef, useEffect } from "react";
import QRCodeStyling from "qr-code-styling";
import JSZip from "jszip";
import { Download, Loader2, Printer, Palette, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { qrCodeConfig, getBaseLoqatrIdURL, ErrorCorrectionLevel } from "@/lib/qrCodeConfig";
import { QRCodeBatch } from "@/types";

interface QRCodeBuilderProps {
  batch: QRCodeBatch;
  loqatrIds: string[];
  onDownloaded: () => void;
  onPrinted: () => void;
}

// Process QR codes in parallel chunks for better performance
const CHUNK_SIZE = 10;

/**
 * Generate a single QR code SVG using its own QRCodeStyling instance
 */
async function generateSingleQRCode(
  loqatrId: string,
  gradient: boolean,
  showLogo: boolean,
  square: boolean,
  errorLevel: ErrorCorrectionLevel
): Promise<{ id: string; svg: Blob | null }> {
  const qrValue = `${getBaseLoqatrIdURL()}${loqatrId}?scan=true`;
  const generator = new QRCodeStyling(
    qrCodeConfig(qrValue, gradient, showLogo, square, errorLevel)
  );
  const rawData = await generator.getRawData("svg");
  // getRawData can return Blob or Buffer - ensure we have a Blob
  const svg = rawData instanceof Blob ? rawData : null;
  return { id: loqatrId, svg };
}

/**
 * Process a chunk of QR codes in parallel
 */
async function processChunk(
  chunk: string[],
  gradient: boolean,
  showLogo: boolean,
  square: boolean,
  errorLevel: ErrorCorrectionLevel
): Promise<Map<string, Blob>> {
  const results = await Promise.all(
    chunk.map((id) => generateSingleQRCode(id, gradient, showLogo, square, errorLevel))
  );

  const map = new Map<string, Blob>();
  for (const result of results) {
    if (result.svg) {
      map.set(result.id, result.svg);
    }
  }
  return map;
}

/**
 * QR code preview and batch download component with advanced styling controls
 */
export function QRCodeBuilder({ batch, loqatrIds, onDownloaded, onPrinted }: QRCodeBuilderProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const qrCodePreview = useRef<QRCodeStyling | null>(null);

  const { toast } = useToast();
  const [gradient, setGradient] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [square, setSquare] = useState(false); // Default to circular/liquid for modern look
  const [errorLevel, setErrorLevel] = useState<ErrorCorrectionLevel>("M");
  const [progress, setProgress] = useState({ generate: 0, zip: 0 });
  const [isDownloading, setIsDownloading] = useState(false);

  const sampleUrl = loqatrIds.length > 0 
    ? `${getBaseLoqatrIdURL()}${loqatrIds[0]}?scan=true` 
    : getBaseLoqatrIdURL();

  // Initialize Preview
  useEffect(() => {
    if (!qrCodePreview.current && previewRef.current) {
      qrCodePreview.current = new QRCodeStyling(
        qrCodeConfig(sampleUrl, gradient, showLogo, square, errorLevel)
      );
      qrCodePreview.current.append(previewRef.current);
    }
  }, [sampleUrl]);

  // Update Preview when toggles change
  useEffect(() => {
    qrCodePreview.current?.update(
      qrCodeConfig(sampleUrl, gradient, showLogo, square, errorLevel)
    );
  }, [gradient, showLogo, square, errorLevel, sampleUrl]);

  async function downloadBatch() {
    if (!loqatrIds?.length) {
      return toast({ title: "Batch is empty", variant: "destructive" });
    }

    setIsDownloading(true);
    const zip = new JSZip();

    try {
      // Split loqatrIds into chunks for parallel processing
      const chunks: string[][] = [];
      for (let i = 0; i < loqatrIds.length; i += CHUNK_SIZE) {
        chunks.push(loqatrIds.slice(i, i + CHUNK_SIZE));
      }

      // Track unique IDs to prevent any possibility of duplication
      const processedIds = new Set<string>();
      let completed = 0;

      // Process chunks sequentially, but QR codes within each chunk in parallel
      for (const chunk of chunks) {
        const results = await processChunk(chunk, gradient, showLogo, square, errorLevel);

        // Add to ZIP, ensuring no duplicates
        for (const [id, svg] of results) {
          if (!processedIds.has(id)) {
            processedIds.add(id);
            zip.file(`${id}.svg`, svg);
          }
        }

        completed += chunk.length;
        setProgress((prev) => ({
          ...prev,
          generate: Math.round((completed / loqatrIds.length) * 100),
        }));
      }

      // Generate ZIP with progress tracking
      const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
        setProgress((prev) => ({ ...prev, zip: Math.round(metadata.percent) }));
      });

      // Trigger download
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `batch-${batch.id}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      // Update database status
      onDownloaded();

      toast({
        title: "Download complete",
        description: `${processedIds.size} QR codes downloaded as batch-${batch.id}.zip`,
      });
    } catch (error) {
      toast({
        title: "Error generating batch",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setProgress({ generate: 0, zip: 0 });
      }, 2000);
    }
  }

  function handleMarkPrinted() {
    onPrinted();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">QR Code Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div
            ref={previewRef}
            className="border rounded-lg p-4 bg-white"
          />
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Style Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Design Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Palette className="h-4 w-4" />
              <span>DESIGN</span>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="square" className="flex flex-col gap-1">
                <span>Circular Shape</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Round shape with transparent background
                </span>
              </Label>
              <Switch
                id="square"
                checked={!square}
                onCheckedChange={(checked) => setSquare(!checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="gradient" className="flex flex-col gap-1">
                <span>Brand Gradient</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Purple to blue gradient
                </span>
              </Label>
              <Switch
                id="gradient"
                checked={gradient}
                onCheckedChange={setGradient}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="logo" className="flex flex-col gap-1">
                <span>Show Logo</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Display logo in center
                </span>
              </Label>
              <Switch
                id="logo"
                checked={showLogo}
                onCheckedChange={setShowLogo}
              />
            </div>
          </div>

          {/* Technical Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Settings2 className="h-4 w-4" />
              <span>TECHNICAL</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="errorLevel">Error Correction</Label>
              <Select value={errorLevel} onValueChange={(v) => setErrorLevel(v as ErrorCorrectionLevel)}>
                <SelectTrigger id="errorLevel" className="w-full">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Low (7%)</SelectItem>
                  <SelectItem value="M">Medium (15%)</SelectItem>
                  <SelectItem value="Q">Quartile (25%)</SelectItem>
                  <SelectItem value="H">High (30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress Bars */}
          {isDownloading && (
            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Generating SVGs</span>
                  <span>{progress.generate}%</span>
                </div>
                <Progress value={progress.generate} />
              </div>
              {progress.generate === 100 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Creating ZIP</span>
                    <span>{progress.zip}%</span>
                  </div>
                  <Progress value={progress.zip} />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={downloadBatch}
              disabled={isDownloading || loqatrIds.length === 0}
              className="flex-1"
              size="lg"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {batch.is_downloaded ? "Re-Download" : "Download"} ({loqatrIds.length})
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleMarkPrinted}
              disabled={batch.is_printed || isDownloading}
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
