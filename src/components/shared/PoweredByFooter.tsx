interface PoweredByFooterProps {
  className?: string;
}

/**
 * Consistent footer component showing "Powered by Waterfall Digital".
 */
export function PoweredByFooter({ className }: PoweredByFooterProps) {
  return (
    <p className={`text-center text-sm text-muted-foreground ${className || ""}`}>
      Powered by <span className="font-semibold">Waterfall Digital</span>
    </p>
  );
}
