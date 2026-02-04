import { useEffect, useState } from "react";
import { MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Scan {
  id: number;
  scanned_at: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_owner: boolean | null;
}

interface ScanHistoryProps {
  qrCodeId: number;
}

export function ScanHistory({ qrCodeId }: ScanHistoryProps) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("scans")
          .select("id, scanned_at, address, latitude, longitude, is_owner")
          .eq("qr_code_id", qrCodeId)
          .order("scanned_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setScans(data || []);
      } catch (error) {
        console.error("Error fetching scan history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [qrCodeId]);

  if (loading) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Scan History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse text-muted-foreground text-sm">
            Loading scan history...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg">Scan History</CardTitle>
      </CardHeader>
      <CardContent>
        {scans.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">
            No scans recorded yet.
          </p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">
                      {scan.scanned_at
                        ? format(new Date(scan.scanned_at), "MMM d, yyyy 'at' h:mm a")
                        : "Unknown time"}
                    </span>
                    {scan.is_owner && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  {scan.address ? (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{scan.address}</span>
                    </div>
                  ) : scan.latitude && scan.longitude ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>
                        {scan.latitude.toFixed(4)}, {scan.longitude.toFixed(4)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="italic">Location not available</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
