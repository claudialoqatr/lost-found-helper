import { useState, useRef, useEffect } from "react";
import QRCodeStyling from "qr-code-styling";
import JSZip from "jszip";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { qrCodeConfig, getBaseLoqatrIdURL } from "@/lib/qrCodeConfig";
import { QRCodeBatch } from "@/types";

interface QRCodeBuilderProps {
  batch: QRCodeBatch;
  loqatrIds: string[];
  onDownloaded: () => void;
}

/**
 * QR code preview and batch download component
 */
export function QRCodeBuilder({ batch, loqatrIds, onDownloaded }: QRCodeBuilderProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const qrCodePreview = useRef<QRCodeStyling | null>(null);

  const { toast } = useToast();
  const [gradient, setGradient] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [square, setSquare] = useState(true);
  const [progress, setProgress] = useState({ generate: 0, zip: 0 });
  const [isDownloading, setIsDownloading] = useState(false);

  const sampleUrl = loqatrIds.length > 0 
    ? `${getBaseLoqatrIdURL()}${loqatrIds[0]}?scan=true` 
    : getBaseLoqatrIdURL();

  // Initialize Preview
  useEffect(() => {
    if (!qrCodePreview.current && previewRef.current) {
      qrCodePreview.current = new QRCodeStyling(qrCodeConfig(sampleUrl, gradient, showLogo, square));
      qrCodePreview.current.append(previewRef.current);
    }
  }, [sampleUrl]);

  // Update Preview when toggles change
  useEffect(() => {
    qrCodePreview.current?.update(qrCodeConfig(sampleUrl, gradient, showLogo, square));
  }, [gradient, showLogo, square, sampleUrl]);

  async function downloadBatch() {
    if (!loqatrIds?.length) {
      return toast({ title: "Batch is empty", variant: "destructive" });
    }

    setIsDownloading(true);
    const files: { blob: Blob | Buffer; filename: string }[] = [];
    const generator = new QRCodeStyling(qrCodeConfig("", gradient, showLogo, square));

    try {
      // 1. Generation Phase
      for (let i = 0; i < loqatrIds.length; i++) {
        const qrValue = `${getBaseLoqatrIdURL()}${loqatrIds[i]}?scan=true`;
        generator.update(qrCodeConfig(qrValue, gradient, showLogo, square));

        const svg = await generator.getRawData("svg");
        if (svg) {
          files.push({ blob: svg, filename: `${loqatrIds[i]}.svg` });
        }

        setProgress((prev) => ({
          ...prev,
          generate: Math.round(((i + 1) / loqatrIds.length) * 100),
        }));
      }

      // 2. Zipping Phase
      const zip = new JSZip();
      files.forEach((f) => zip.file(f.filename, f.blob));

      const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
        setProgress((prev) => ({ ...prev, zip: Math.round(metadata.percent) }));
      });

      // 3. Download
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `batch-${batch.id}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      // 4. Update Status
      onDownloaded();

      toast({
        title: "Download complete",
        description: `${loqatrIds.length} QR codes downloaded as batch-${batch.id}.zip`,
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
          <div className="flex items-center justify-between">
            <Label htmlFor="gradient" className="flex flex-col gap-1">
              <span>Gradient Colors</span>
              <span className="font-normal text-xs text-muted-foreground">
                Use purple to blue gradient
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
                Add logo in center
              </span>
            </Label>
            <Switch
              id="logo"
              checked={showLogo}
              onCheckedChange={setShowLogo}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="square" className="flex flex-col gap-1">
              <span>Square Dots</span>
              <span className="font-normal text-xs text-muted-foreground">
                Use square instead of rounded
              </span>
            </Label>
            <Switch
              id="square"
              checked={square}
              onCheckedChange={setSquare}
            />
          </div>

          {/* Progress */}
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

          {/* Download Button */}
          <Button
            onClick={downloadBatch}
            disabled={isDownloading || loqatrIds.length === 0}
            className="w-full"
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
                {batch.is_downloaded ? "Re-Download" : "Download"} Batch ({loqatrIds.length} codes)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
