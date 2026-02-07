import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile, useInvalidateUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { BackButton, GradientButton, LoadingSpinner } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/PhoneInput";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, AlertCircle } from "lucide-react";

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  phone: z
    .string()
    .min(10, "Please enter a valid phone number")
    .max(20, "Phone number is too long")
    .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number"),
  email: z
    .string()
    .max(254, "Email is too long")
    .email("Please enter a valid email"),
});

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: profileLoading, error: profileError } = useUserProfile();
  const invalidateProfile = useInvalidateUserProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailPending, setEmailPending] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Populate form when profile loads
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setPhone(userProfile.phone || "");
      setEmail(userProfile.email || "");
    }
  }, [userProfile]);

  // Detect pending email change from auth metadata
  useEffect(() => {
    if (user?.new_email) {
      setEmailPending(true);
    }
  }, [user]);

  const hasChanges = useMemo(() => {
    if (!userProfile) return false;
    return (
      name !== (userProfile.name || "") ||
      phone !== (userProfile.phone || "") ||
      email !== (userProfile.email || "")
    );
  }, [name, phone, email, userProfile]);

  const emailChanged = useMemo(() => {
    if (!userProfile) return false;
    return email !== (userProfile.email || "");
  }, [email, userProfile]);

  const validate = (): boolean => {
    const result = profileSchema.safeParse({ name, phone, email });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSave = async () => {
    if (!validate() || !user || !userProfile) return;

    setIsSaving(true);

    try {
      // Update name & phone in public.users
      if (name !== userProfile.name || phone !== userProfile.phone) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ name, phone })
          .eq("auth_id", user.id);

        if (updateError) throw updateError;

        // Sync name to auth.users metadata (phone is only stored in public.users)
        const { error: authUpdateError } = await supabase.auth.updateUser({
          data: { name },
        });

        if (authUpdateError) {
          console.warn("Auth metadata sync warning:", authUpdateError.message);
          // Non-blocking — public.users is the source of truth
        }
      }

      // Handle email change via Supabase Auth
      if (emailChanged) {
        const { error: emailError } = await supabase.auth.updateUser({
          email,
        });

        if (emailError) throw emailError;

        setEmailPending(true);
        toast({
          title: "Verification email sent",
          description: "Please check your new email inbox to confirm the change.",
        });
      }

      // Refresh cached profile data
      invalidateProfile();

      if (!emailChanged) {
        toast({
          title: "Profile updated",
          description: "Your changes have been saved.",
        });
      }
    } catch (err: any) {
      console.error("Profile update error:", err);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16">
          <LoadingSpinner size="lg" text="Loading profile..." />
        </div>
      </AppLayout>
    );
  }

  if (profileError) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">Failed to load profile. Please try again.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Header */}
        <div className="mb-6">
          <BackButton to="/my-tags" label="Back" />
          <h1 className="text-2xl md:text-3xl font-bold mt-4">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                placeholder="Your name"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="profile-phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Phone Number
              </Label>
              {userProfile?.phone ? (
                <PhoneInput
                  key={userProfile.phone}
                  value={phone}
                  onChange={setPhone}
                  placeholder="Phone number"
                  maxLength={20}
                />
              ) : (
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="Phone number"
                  maxLength={20}
                />
              )}
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="profile-email" className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email
                {emailPending && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Pending verification
                  </Badge>
                )}
              </Label>
              <Input
                id="profile-email"
                type="email"
                placeholder="you@example.com"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailPending && (
                <p className="text-xs text-muted-foreground">
                  A verification email has been sent to your new address. Your email will update once confirmed.
                </p>
              )}
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Save button */}
            <div className="pt-2">
              <GradientButton
                className="w-full"
                disabled={!hasChanges}
                loading={isSaving}
                loadingText="Saving..."
                onClick={handleSave}
              >
                Save Changes
              </GradientButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
