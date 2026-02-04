import { forwardRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GradientButtonProps extends Omit<ButtonProps, "variant"> {
  loading?: boolean;
  loadingText?: string;
}

/**
 * Primary action button with gradient styling.
 * Used for main CTAs like "Claim This Tag", "Update Item", etc.
 */
export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, children, loading, loadingText, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "gradient-loqatr text-white font-semibold h-12 text-base",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || "Loading..."}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

GradientButton.displayName = "GradientButton";
