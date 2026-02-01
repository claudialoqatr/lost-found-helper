import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface ContactDetailsCardProps {
  user: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

export function ContactDetailsCard({ user }: ContactDetailsCardProps) {
  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <h3 className="font-semibold text-lg mb-4">Your Contact Details</h3>

        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-sm">Name</Label>
            <p className="text-loqatr-midnight dark:text-foreground font-medium">
              {user?.name || "—"}
            </p>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Email</Label>
            <p className="text-loqatr-midnight dark:text-foreground font-medium">
              {user?.email || "—"}
            </p>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Phone</Label>
            <p className="text-loqatr-midnight dark:text-foreground font-medium">
              {user?.phone || "Not set"}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground italic mt-4 pt-4 border-t">
          These details will be visible to anyone who scans your QR code when in public mode.
        </p>
      </CardContent>
    </Card>
  );
}
