import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";

/**
 * QRScanRouter - Smart entry point for all QR code scans
 * 
 * URL: /qr-codes/:code?scan=true
 * 
 * This page assesses the QR code's assignment status and redirects:
 * - Unclaimed tag → /tag/:code (claim page)
 * - Owner scans their own tag → /my-tags/:code (edit page)
 * - Someone else scans a claimed tag → /found/:code (finder page)
 */
export default function QRScanRouter() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const isScan = searchParams.get("scan") === "true";

  useEffect(() => {
    if (authLoading) return;

    const routeToDestination = async () => {
      if (!code) {
        navigate("/", { replace: true });
        return;
      }

      try {
        // Fetch QR code data
        const { data: qrData, error: qrError } = await supabase
          .from("qrcodes")
          .select("*")
          .eq("loqatr_id", code)
          .maybeSingle();

        if (qrError) throw qrError;

        // QR code doesn't exist
        if (!qrData) {
          setError("This QR code doesn't exist in our system.");
          return;
        }

        // Check if tag is unclaimed (no assignment or unassigned status)
        const isUnclaimed = !qrData.assigned_to || qrData.status === "unassigned";

        if (isUnclaimed) {
          // Redirect to claim page
          navigate(`/tag/${code}`, { replace: true });
          return;
        }

        // Tag is claimed - determine if current user is the owner
        let isOwner = false;

        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("id")
            .eq("auth_id", user.id)
            .maybeSingle();

          isOwner = userData?.id === qrData.assigned_to;
        }

        if (isOwner) {
          // Owner scans their own tag → edit page
          navigate(`/my-tags/${code}`, { replace: true });
        } else {
          // Someone else scans → finder page
          navigate(`/found/${code}`, { replace: true });
        }
      } catch (err) {
        console.error("Error routing QR scan:", err);
        setError("Failed to process this QR code. Please try again.");
      }
    };

    routeToDestination();
  }, [code, user, authLoading, navigate]);

  // Show loading state while redirecting
  if (!error) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="animate-pulse text-muted-foreground">Processing QR code...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show error state
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="text-primary underline hover:no-underline"
          >
            Go to Home
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
