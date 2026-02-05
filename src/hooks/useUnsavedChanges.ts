import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface UseUnsavedChangesOptions {
  /** Function that returns true if there are unsaved changes */
  hasChanges: () => boolean;
  /** Function to save changes - should return a promise */
  onSave?: () => Promise<void>;
  /** Optional message for the browser's beforeunload event */
  message?: string;
}

/**
 * Hook to detect and prompt when navigating away with unsaved changes.
 * Supports save, discard, and cancel actions.
 */
export function useUnsavedChanges({ 
  hasChanges, 
  onSave,
  message = "You have unsaved changes. Are you sure you want to leave?" 
}: UseUnsavedChangesOptions) {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

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

  const navigateToPending = useCallback(() => {
    setShowDialog(false);
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  }, [navigate, pendingPath]);

  const handleSave = useCallback(async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave();
        navigateToPending();
      } catch (error) {
        console.error("Failed to save:", error);
        // Keep dialog open on error
      } finally {
        setIsSaving(false);
      }
    } else {
      navigateToPending();
    }
  }, [onSave, navigateToPending]);

  const handleDiscard = useCallback(() => {
    navigateToPending();
  }, [navigateToPending]);

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
    handleSave,
    handleDiscard,
    cancelNavigation,
    safeNavigate,
    isSaving,
  };
}
