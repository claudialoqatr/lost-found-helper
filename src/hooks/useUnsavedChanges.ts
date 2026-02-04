import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface UseUnsavedChangesOptions {
  /** Function that returns true if there are unsaved changes */
  hasChanges: () => boolean;
  /** Optional message for the browser's beforeunload event */
  message?: string;
}

/**
 * Hook to detect and prompt when navigating away with unsaved changes.
 * Works with BrowserRouter (doesn't require data router).
 */
export function useUnsavedChanges({ hasChanges, message = "You have unsaved changes. Are you sure you want to leave?" }: UseUnsavedChangesOptions) {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle browser navigation (refresh, close tab, external links)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges()) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges, message]);

  const confirmNavigation = useCallback(() => {
    setShowDialog(false);
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  }, [navigate, pendingPath]);

  const cancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingPath(null);
  }, []);

  /**
   * Use this instead of navigate() when you want to check for unsaved changes
   */
  const safeNavigate = useCallback((path: string) => {
    if (hasChanges()) {
      setPendingPath(path);
      setShowDialog(true);
    } else {
      navigate(path);
    }
  }, [hasChanges, navigate]);

  return {
    showDialog,
    confirmNavigation,
    cancelNavigation,
    safeNavigate,
  };
}
