interface LoqatrIdCardProps {
  loqatrId: string;
}

export function LoqatrIdCard({ loqatrId }: LoqatrIdCardProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Tag ID:</span>
      <span className="font-mono text-foreground">{loqatrId}</span>
    </div>
  );
}
