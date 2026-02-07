import { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { PageLoadingState } from "@/components/shared";
import { Package, ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout wrapper for admin pages.
 * Redirects non-super-admins to home page.
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: adminLoading } = useSuperAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading && !adminLoading && !isSuperAdmin) {
      navigate("/my-tags");
    }
  }, [user, authLoading, isSuperAdmin, adminLoading, navigate]);

  if (authLoading || adminLoading) {
    return <PageLoadingState message="Checking permissions..." />;
  }

  if (!user || !isSuperAdmin) {
    return null;
  }

  const adminNavItems = [
    { title: "QR Batches", path: "/admin/batches", icon: Package },
    { title: "Retailers", path: "/admin/retailers", icon: Store },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Admin Navigation */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/my-tags">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Tags
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <nav className="flex items-center gap-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        {/* Content */}
        {children}
      </div>
    </AppLayout>
  );
}
