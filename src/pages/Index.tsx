import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LogOut, Tag, MessageSquare, LayoutDashboard } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient background accent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full gradient-loqatr opacity-5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold gradient-loqatr-text">LOQATR</h1>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            ) : (
              <Button asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          {user ? (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Welcome back!</h2>
                <p className="text-muted-foreground">
                  Manage your tags and stay connected with your belongings
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
                <div className="p-6 rounded-lg border border-border/50 bg-card hover:border-accent/50 transition-colors">
                  <LayoutDashboard className="h-8 w-8 text-accent mb-4" />
                  <h3 className="font-semibold mb-2">Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    View your stats and recent activity
                  </p>
                </div>

                <div className="p-6 rounded-lg border border-border/50 bg-card hover:border-accent/50 transition-colors">
                  <Tag className="h-8 w-8 text-accent mb-4" />
                  <h3 className="font-semibold mb-2">My Tags</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your claimed QR tags
                  </p>
                </div>

                <div className="p-6 rounded-lg border border-border/50 bg-card hover:border-accent/50 transition-colors">
                  <MessageSquare className="h-8 w-8 text-accent mb-4" />
                  <h3 className="font-semibold mb-2">Messages</h3>
                  <p className="text-sm text-muted-foreground">
                    Finder messages awaiting response
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-8 max-w-2xl mx-auto">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight">
                  Reconnect with your <span className="gradient-loqatr-text">belongings</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  LOQATR uses smart QR tags to help you recover lost items through 
                  community collaboration. Simple, secure, effective.
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <Button asChild size="lg">
                  <Link to="/auth">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/auth">Learn More</Link>
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-3 pt-8">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full gradient-loqatr mx-auto flex items-center justify-center">
                    <Tag className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold">Tag Your Items</h3>
                  <p className="text-sm text-muted-foreground">
                    Apply QR tags to your valuable belongings
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full gradient-loqatr mx-auto flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold">Get Notified</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive messages when someone finds your item
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full gradient-loqatr mx-auto flex items-center justify-center">
                    <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold">Reunite</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with finders and recover your belongings
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
