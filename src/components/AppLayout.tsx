import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Menu, Tag, MessageSquare, Bell, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoDark from "@/assets/logo-dark.svg";
import logoLight from "@/assets/logo-light.svg";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const devBypass = localStorage.getItem("dev_bypass") === "true";
  
  // TODO: Fetch unread message count from database
  const unreadMessages = 0;

  const handleSignOut = () => {
    localStorage.removeItem("dev_bypass");
    signOut();
    navigate("/");
  };

  const getUserDisplayName = () => {
    if (devBypass) return "Dev";
    if (user?.user_metadata?.name) return user.user_metadata.name.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "there";
  };

  const navItems = [
    { title: "My Tags", path: "/my-tags", icon: Tag },
    { title: "Messages", path: "/messages", icon: MessageSquare },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Background accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full gradient-loqatr opacity-5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full gradient-loqatr opacity-5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Left: Logo + Greeting */}
          <div className="flex items-center gap-4">
            <Link to="/my-tags">
              <img 
                src={resolvedTheme === "dark" ? logoLight : logoDark} 
                alt="LOQATR" 
                className="h-16 md:h-20 w-auto"
              />
            </Link>
            <span className="text-lg md:text-xl font-medium hidden sm:inline">
              Hey, {getUserDisplayName()}!
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-1 mr-2">
              {navItems.map((item) => (
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

            {/* Sign out button */}
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="hidden sm:flex"
            >
              Sign out
            </Button>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Mobile menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <SheetHeader className="text-left">
                  <SheetTitle>
                    <img 
                      src={resolvedTheme === "dark" ? logoLight : logoDark} 
                      alt="LOQATR" 
                      className="h-12 w-auto"
                    />
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                      {item.path === "/messages" && unreadMessages > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {unreadMessages}
                        </Badge>
                      )}
                    </Link>
                  ))}
                  <div className="border-t my-4" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10">
        {children}
      </main>

    </div>
  );
}
