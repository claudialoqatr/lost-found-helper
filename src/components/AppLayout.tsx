import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications, Notification } from "@/hooks/useNotifications";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Tag, MessageSquare, Bell, LogOut, Sun, Moon, Package, Scan, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
  const { resolvedTheme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.name) return user.user_metadata.name.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "there";
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === "message_received") {
      navigate("/messages");
    } else if (notification.qrcode_id) {
      // For tag-related notifications, navigate to the tag
      // First fetch the loqatr_id for this qrcode
      const { data } = await (await import("@/integrations/supabase/client")).supabase
        .from("qrcodes")
        .select("loqatr_id")
        .eq("id", notification.qrcode_id)
        .single();
      
      if (data?.loqatr_id) {
        navigate(`/my-tags/${data.loqatr_id}`);
      }
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "tag_assigned":
        return <Tag className="h-4 w-4 text-green-500" />;
      case "tag_unassigned":
        return <Tag className="h-4 w-4 text-muted-foreground" />;
      case "tag_scanned":
        return <Scan className="h-4 w-4 text-blue-500" />;
      case "message_received":
        return <MessageSquare className="h-4 w-4 text-accent" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const navItems = [
    { title: "My Tags", path: "/my-tags", icon: Tag },
    { title: "Messages", path: "/messages", icon: MessageSquare },
  ];

  const isActive = (path: string) => location.pathname === path;

  // NotificationItem subcomponent
  const NotificationItem = ({
    notification,
    onRead,
    onClick,
  }: {
    notification: Notification;
    onRead: (id: number) => void;
    onClick: () => void;
  }) => (
    <div
      className={`p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
        !notification.is_read ? "bg-accent/5" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.is_read ? "font-medium" : ""}`}>
            {notification.title}
          </p>
          {notification.message && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {notification.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 rounded-full bg-accent mt-1.5" />
        )}
      </div>
    </div>
  );

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

            {/* Sign out button - desktop */}
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="hidden sm:flex"
            >
              Sign out
            </Button>

            {/* Theme toggle - desktop only */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Notifications - mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative md:hidden">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="p-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-80">
                    {notifications.slice(0, 10).map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={markAsRead}
                        onClick={() => handleNotificationClick(notification)}
                      />
                    ))}
                  </ScrollArea>
                )}
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link to="/messages">View all messages</Link>
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
                      {item.path === "/messages" && unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                  ))}
                  <div className="border-t my-4" />
                  {/* Theme toggle in mobile menu */}
                  <button
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full text-left"
                  >
                    {resolvedTheme === "dark" ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                    {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
                  </button>
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
