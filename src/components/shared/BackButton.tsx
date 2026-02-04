import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  /** Custom label for the button */
  label?: string;
  /** Custom path to navigate to. If not provided, uses history.back() */
  to?: string;
  className?: string;
}

/**
 * Consistent back navigation button.
 */
export function BackButton({ label = "Go Back", to, className }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button variant="outline" size="sm" className={className} onClick={handleClick}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}
