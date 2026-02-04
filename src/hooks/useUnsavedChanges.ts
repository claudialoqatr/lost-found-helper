import { useEffect, useState, useCallback } from "react";
import { useBlocker } from "react-router-dom";

interface UseUnsavedChangesOptions {
  /** Function that returns true if there are unsaved changes */
  hasChanges: () => boolean;
  /** Optional message for the browser's beforeunload event */
  message?: string;
}

/**
 * Hook to detect and block navigation when there are unsaved changes.
 * Handles both in-app navigation (react-router) and browser navigation (beforeunload).
 */
export function useUnsavedChanges({ hasChanges, message = "You have unsaved changes. Are you sure you want to leave?" }: UseUnsavedChangesOptions) {
  const [showDialog, setShowDialog] = useState(false);

  // Block in-app navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChanges() && currentLocation.pathname !== nextLocation.pathname
  );

  // Show dialog when blocker is triggered
  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowDialog(true);
    }
  }, [blocker.state]);

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
    blocker.proceed?.();
  }, [blocker]);

  const cancelNavigation = useCallback(() => {
    setShowDialog(false);
    blocker.reset?.();
  }, [blocker]);

  return {
    showDialog,
    confirmNavigation,
    cancelNavigation,
  };
}
