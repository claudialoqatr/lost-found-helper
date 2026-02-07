import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logoDark from "@/assets/logo-dark.svg";
import logoLight from "@/assets/logo-light.svg";

interface FinderHeaderProps {
  retailerLogoUrl?: string | null;
}

/**
 * Header component for the finder page.
 * Displays retailer logo if available, otherwise the standard LOQATR logo.
 * Shows authentication buttons for unauthenticated users.
 */
export function FinderHeader({ retailerLogoUrl }: FinderHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();

  const logoSrc = retailerLogoUrl || (resolvedTheme === "dark" ? logoLight : logoDark);
  const logoAlt = retailerLogoUrl ? "Partner" : "LOQATR";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between px-4">
        <Link to="/my-tags">
          <img
            src={logoSrc}
            alt={logoAlt}
            className="h-14 w-auto max-w-[180px] object-contain"
          />
        </Link>
        <div className="flex items-center gap-2">
          {!user && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                Sign in
              </Button>
              <Button
                size="sm"
                className="gradient-retailer font-semibold"
                onClick={() => navigate("/auth")}
              >
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
