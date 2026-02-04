import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ContactDetailsCardProps {
  user: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
  /** Compact mode for mobile - shows inline */
  compact?: boolean;
}

export function ContactDetailsCard({ user, compact = false }: ContactDetailsCardProps) {
  if (compact) {
    return (
      <div className="p-3 rounded-lg bg-muted/50 border">
        <p className="text-xs text-muted-foreground mb-1">Your contact details (shown when found)</p>
        <p className="text-sm font-medium">
          {user?.name || "—"} • {user?.email || "—"}{user?.phone ? ` • ${user.phone}` : ""}
        </p>
      </div>
    );
  }

  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <h3 className="font-semibold text-lg mb-4">Your Contact Details</h3>

        <div className="space-y-4">
          <div>
            <p className="text-muted-foreground text-xs">Name</p>
            <p className="text-foreground font-medium">
              {user?.name || "—"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="text-foreground font-medium">
              {user?.email || "—"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">Phone</p>
            <p className="text-foreground font-medium">
              {user?.phone || "Not set"}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic mt-4 pt-4 border-t">
          These details will be visible to anyone who scans your QR code when in public mode.
        </p>
      </CardContent>
    </Card>
  );
}
