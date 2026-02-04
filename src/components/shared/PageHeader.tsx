interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

/**
 * Consistent page header component with title and optional description.
 */
export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={className}>
      <h1 className="text-3xl lg:text-4xl font-bold mb-2">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
