import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PhoneInput } from "@/components/PhoneInput";
import { Turnstile } from "@/components/Turnstile";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import logoDark from "@/assets/logo-dark.svg";
import logoLight from "@/assets/logo-light.svg";

// Cloudflare Turnstile test key - replace with production key
const TURNSTILE_SITE_KEY = "1x00000000000000000000AA";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

type AuthMode = "login" | "signup" | "forgot-password";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { user, signIn, signUp, resetPassword } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", name: "", phone: "", confirmPassword: "" },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  // Dev bypass: Ctrl+Shift+D to skip auth
  const handleDevBypass = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === "D") {
      e.preventDefault();
      localStorage.setItem("dev_bypass", "true");
      toast({ title: "🔧 Dev mode enabled", description: "Redirecting..." });
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener("keydown", handleDevBypass);
    return () => window.removeEventListener("keydown", handleDevBypass);
  }, [handleDevBypass]);

  useEffect(() => {
    if (user) {
      // Check for redirect URL stored from QR scan flow
      const redirectUrl = sessionStorage.getItem("redirect_after_auth");
      if (redirectUrl) {
        sessionStorage.removeItem("redirect_after_auth");
        navigate(redirectUrl, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    setIsSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again."
          : error.message,
      });
    } else {
      toast({ title: "Welcome back!" });
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    if (!turnstileToken) {
      toast({
        variant: "destructive",
        title: "Verification required",
        description: "Please complete the captcha verification.",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(data.email, data.password, data.name, data.phone);
    setIsSubmitting(false);

    if (error) {
      let message = error.message;
      if (error.message.includes("already registered")) {
        message = "This email is already registered. Try logging in instead.";
      }
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: message,
      });
      // Reset captcha on error
      setTurnstileToken(null);
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account.",
      });
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    const { error } = await resetPassword(data.email);
    setIsSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Request failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      setMode("login");
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "Welcome back";
      case "signup": return "Create account";
      case "forgot-password": return "Reset password";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "login": return "Sign in to manage your tags and messages";
      case "signup": return "Start protecting your belongings today";
      case "forgot-password": return "Enter your email and we'll send you a reset link";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Gradient background accent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full gradient-loqatr opacity-5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full gradient-loqatr opacity-5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-4">
            <Link to="/my-tags">
              <img 
                src={resolvedTheme === "dark" ? logoLight : logoDark} 
                alt="LOQATR" 
                className="h-16 w-auto mx-auto"
              />
            </Link>
          </div>
          <CardTitle className="text-2xl">
            {getTitle()}
          </CardTitle>
          <CardDescription>
            {getDescription()}
          </CardDescription>
        </CardHeader>

        <CardContent key={mode}>
          {mode === "login" ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="you@example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode("forgot-password")}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
          ) : mode === "signup" ? (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <FormField
                  control={signupForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your name" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="you@example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <PhoneInput 
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Phone number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Turnstile Captcha */}
                <div className="flex justify-center py-2">
                  <Turnstile
                    siteKey={TURNSTILE_SITE_KEY}
                    onSuccess={setTurnstileToken}
                    onError={() => setTurnstileToken(null)}
                    onExpire={() => setTurnstileToken(null)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || !turnstileToken}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...forgotPasswordForm}>
              <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                <FormField
                  control={forgotPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="you@example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-6 text-center">
            {mode === "forgot-password" ? (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                Back to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  loginForm.reset();
                  signupForm.reset();
                  setTurnstileToken(null);
                }}
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                {mode === "login" 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
