import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LogOut, Tag, MessageSquare, LayoutDashboard, QrCode, Shield, Users } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const devBypass = localStorage.getItem("dev_bypass") === "true";
  const isAuthenticated = user || devBypass;

  const handleSignOut = () => {
    localStorage.removeItem("dev_bypass");
    signOut();
  };

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
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl lg:text-3xl font-bold gradient-loqatr-text">LOQATR</h1>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden md:inline">
                  {devBypass ? "🔧 Dev Mode" : user?.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sign out</span>
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
        <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-16">
          {isAuthenticated ? (
            <div className="space-y-8 lg:space-y-12">
              <div className="text-center space-y-2 lg:space-y-4">
                <h2 className="text-3xl lg:text-5xl font-bold">Welcome back!</h2>
                <p className="text-muted-foreground text-lg lg:text-xl max-w-2xl mx-auto">
                  Manage your tags and stay connected with your belongings
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                <Link 
                  to="/dashboard"
                  className="group p-6 lg:p-8 rounded-xl border border-border/50 bg-card hover:border-accent/50 hover:shadow-lg transition-all"
                >
                  <LayoutDashboard className="h-8 w-8 lg:h-10 lg:w-10 text-accent mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-lg lg:text-xl mb-2">Dashboard</h3>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    View your stats and recent activity
                  </p>
                </Link>

                <Link 
                  to="/my-tags"
                  className="group p-6 lg:p-8 rounded-xl border border-border/50 bg-card hover:border-accent/50 hover:shadow-lg transition-all"
                >
                  <Tag className="h-8 w-8 lg:h-10 lg:w-10 text-accent mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-lg lg:text-xl mb-2">My Tags</h3>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Manage your claimed QR tags
                  </p>
                </Link>

                <Link 
                  to="/messages"
                  className="group p-6 lg:p-8 rounded-xl border border-border/50 bg-card hover:border-accent/50 hover:shadow-lg transition-all sm:col-span-2 lg:col-span-1"
                >
                  <MessageSquare className="h-8 w-8 lg:h-10 lg:w-10 text-accent mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-lg lg:text-xl mb-2">Messages</h3>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Finder messages awaiting response
                  </p>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto pt-8 border-t">
                <div className="text-center p-4">
                  <p className="text-3xl lg:text-4xl font-bold text-accent">0</p>
                  <p className="text-sm text-muted-foreground">Active Tags</p>
                </div>
                <div className="text-center p-4">
                  <p className="text-3xl lg:text-4xl font-bold text-accent">0</p>
                  <p className="text-sm text-muted-foreground">Recent Scans</p>
                </div>
                <div className="text-center p-4">
                  <p className="text-3xl lg:text-4xl font-bold text-accent">0</p>
                  <p className="text-sm text-muted-foreground">Messages</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-16 lg:space-y-24">
              {/* Hero Section */}
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 max-w-6xl mx-auto">
                <div className="flex-1 text-center lg:text-left space-y-6">
                  <h2 className="text-4xl lg:text-6xl font-bold tracking-tight">
                    Reconnect with your{" "}
                    <span className="gradient-loqatr-text">belongings</span>
                  </h2>
                  <p className="text-lg lg:text-xl text-muted-foreground max-w-xl">
                    LOQATR uses smart QR tags to help you recover lost items through
                    community collaboration. Simple, secure, effective.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                    <Button asChild size="lg" className="text-base">
                      <Link to="/auth">Get Started</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="text-base">
                      <Link to="/auth">Learn More</Link>
                    </Button>
                  </div>
                </div>

                {/* Hero Visual */}
                <div className="flex-1 flex justify-center">
                  <div className="relative w-64 h-64 lg:w-80 lg:h-80">
                    <div className="absolute inset-0 gradient-loqatr rounded-3xl opacity-20 blur-2xl" />
                    <div className="relative w-full h-full rounded-3xl border-2 border-border/50 bg-card flex items-center justify-center">
                      <QrCode className="w-32 h-32 lg:w-40 lg:h-40 text-accent" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="max-w-6xl mx-auto">
                <h3 className="text-2xl lg:text-3xl font-bold text-center mb-12">
                  How It Works
                </h3>
                <div className="grid gap-8 md:grid-cols-3">
                  <div className="text-center lg:text-left space-y-4 p-6">
                    <div className="w-16 h-16 rounded-2xl gradient-loqatr mx-auto lg:mx-0 flex items-center justify-center">
                      <Tag className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h4 className="font-semibold text-xl">Tag Your Items</h4>
                    <p className="text-muted-foreground">
                      Apply our unique QR tags to your valuable belongings. Each tag links
                      directly to your secure profile.
                    </p>
                  </div>

                  <div className="text-center lg:text-left space-y-4 p-6">
                    <div className="w-16 h-16 rounded-2xl gradient-loqatr mx-auto lg:mx-0 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h4 className="font-semibold text-xl">Get Notified</h4>
                    <p className="text-muted-foreground">
                      When someone finds your item and scans the tag, you receive an instant
                      notification with their contact details.
                    </p>
                  </div>

                  <div className="text-center lg:text-left space-y-4 p-6">
                    <div className="w-16 h-16 rounded-2xl gradient-loqatr mx-auto lg:mx-0 flex items-center justify-center">
                      <Users className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h4 className="font-semibold text-xl">Reunite</h4>
                    <p className="text-muted-foreground">
                      Connect with finders through our secure messaging platform and arrange
                      to get your belongings back.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust Section */}
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Secure & Private</span>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Your contact information is only shared when you choose. Control what
                  finders see with public or private modes.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t mt-16">
          <div className="container mx-auto px-4 lg:px-8 py-8 text-center text-sm text-muted-foreground">
            <p>Powered by <span className="font-semibold">Waterfall Digital</span></p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
