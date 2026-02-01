import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Tag, MessageSquare, QrCode, Shield, Users } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const devBypass = localStorage.getItem("dev_bypass") === "true";
  const isAuthenticated = user || devBypass;

  // Redirect authenticated users to My Tags
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/my-tags", { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Only show landing page for unauthenticated users
  if (isAuthenticated) {
    return null; // Will redirect
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
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </header>

        {/* Main Content - Landing Page */}
        <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-16">
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
        </main>

      </div>
    </div>
  );
};

export default Index;
