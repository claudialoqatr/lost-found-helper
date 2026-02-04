import { AppLayout } from "@/components/AppLayout";

interface PageLoadingStateProps {
  /** Message to display while loading */
  message?: string;
  /** Whether to wrap in AppLayout */
  withLayout?: boolean;
}

/**
 * Consistent loading state component for pages.
 * Used across ClaimTagPage, EditTagPage, MyTagsPage, etc.
 */
export function PageLoadingState({ 
  message = "Loading...", 
  withLayout = true 
}: PageLoadingStateProps) {
  const content = (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
      <div className="animate-pulse text-muted-foreground">{message}</div>
    </div>
  );

  if (withLayout) {
    return <AppLayout>{content}</AppLayout>;
  }

  return content;
}
