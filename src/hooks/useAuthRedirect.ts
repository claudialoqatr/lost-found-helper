import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";

interface UseAuthRedirectOptions {
  /** The route to redirect to if not authenticated */
  redirectTo?: string;
  /** Path to store for post-auth redirect (e.g., /tag/ABC123) */
  returnPath?: string;
  /** If true, redirect authenticated users away (for auth pages) */
  redirectIfAuthenticated?: boolean;
  /** Where to redirect authenticated users */
  authenticatedRedirect?: string;
}

interface UseAuthRedirectReturn {
  user: ReturnType<typeof useAuth>["user"];
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook to handle authentication-based redirects consistently across the app.
 * 
 * Usage:
 * - Protected pages: useAuthRedirect({ returnPath: `/tag/${code}` })
 * - Auth page: useAuthRedirect({ redirectIfAuthenticated: true, authenticatedRedirect: "/my-tags" })
 */
export function useAuthRedirect(options: UseAuthRedirectOptions = {}): UseAuthRedirectReturn {
  const {
    redirectTo = "/auth",
    returnPath,
    redirectIfAuthenticated = false,
    authenticatedRedirect = "/my-tags",
  } = options;

  const { user, loading } = useAuth();
  const { isSuperAdmin, loading: adminLoading } = useSuperAdmin();
  const navigate = useNavigate();
  const isAuthenticated = !!user;
  const isLoading = loading || (isAuthenticated && adminLoading);

  useEffect(() => {
    if (isLoading) return;

    if (redirectIfAuthenticated && isAuthenticated) {
      // For auth pages - redirect authenticated users away
      const storedRedirect = sessionStorage.getItem("redirect_after_auth");
      if (storedRedirect) {
        sessionStorage.removeItem("redirect_after_auth");
        navigate(storedRedirect, { replace: true });
      } else {
        // Super admins go to admin dashboard, regular users to my-tags
        const defaultRedirect = isSuperAdmin ? "/admin/batches" : authenticatedRedirect;
        navigate(defaultRedirect, { replace: true });
      }
    } else if (!redirectIfAuthenticated && !isAuthenticated) {
      // For protected pages - redirect unauthenticated users to auth
      if (returnPath) {
        sessionStorage.setItem("redirect_after_auth", returnPath);
      }
      navigate(redirectTo, { replace: true });
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, redirectIfAuthenticated, navigate, returnPath, redirectTo, authenticatedRedirect]);

  return { user, loading: isLoading, isAuthenticated };
}
