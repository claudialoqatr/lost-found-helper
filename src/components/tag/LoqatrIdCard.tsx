import { Card, CardContent } from "@/components/ui/card";

interface LoqatrIdCardProps {
  loqatrId: string;
}

export function LoqatrIdCard({ loqatrId }: LoqatrIdCardProps) {
  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <h3 className="font-semibold">Loqatr ID</h3>
        <p className="text-loqatr-midnight dark:text-accent font-mono text-lg">{loqatrId}</p>
      </CardContent>
    </Card>
  );
}
