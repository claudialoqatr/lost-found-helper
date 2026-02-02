import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { render } from "https://esm.sh/@react-email/render@0.0.12?deps=react@18.3.1,react-dom@18.3.1";
import * as React from "https://esm.sh/react@18.3.1";

import { WelcomeEmail } from "./_templates/welcome.tsx";
import { OtpEmail } from "./_templates/otp.tsx";
import { PasswordResetEmail } from "./_templates/password-reset.tsx";
import { EmailChangeEmail } from "./_templates/email-change.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Email types that Supabase Auth can trigger
type EmailActionType = 
  | "signup" 
  | "magiclink" 
  | "recovery" 
  | "invite" 
  | "email_change" 
  | "email";

interface AuthEmailPayload {
  user: {
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: EmailActionType;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("RESEND_API_KEY is not configured");
    }

    const SEND_EMAIL_HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
    if (!SEND_EMAIL_HOOK_SECRET) {
      console.error("SEND_EMAIL_HOOK_SECRET is not configured");
      throw new Error("SEND_EMAIL_HOOK_SECRET is not configured");
    }

    const resend = new Resend(RESEND_API_KEY);

    // Get the raw payload for signature verification
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Verify webhook signature
    // Supabase webhook secrets are in format: v1,whsec_<base64secret>
    // The standardwebhooks library only needs the base64 secret part
    let webhookSecret = SEND_EMAIL_HOOK_SECRET;
    if (webhookSecret.includes("whsec_")) {
      webhookSecret = webhookSecret.split("whsec_")[1];
    }
    const wh = new Webhook(webhookSecret);
    let authPayload: AuthEmailPayload;

    try {
      authPayload = wh.verify(payload, headers) as AuthEmailPayload;
    } catch (verifyError) {
      console.error("Webhook signature verification failed:", verifyError);
      return new Response(
        JSON.stringify({
          error: {
            http_code: 401,
            message: "Invalid webhook signature",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { user, email_data } = authPayload;
    const { token, token_hash, redirect_to, email_action_type, site_url } = email_data;

    console.log("Processing auth email:", {
      email: user.email,
      action_type: email_action_type,
    });

    // Build the verification URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? site_url;
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    // Render the appropriate email template based on action type
    let html: string;
    let subject: string;

    switch (email_action_type) {
      case "signup":
      case "invite":
        html = await render(
          React.createElement(WelcomeEmail, {
            userName: user.user_metadata?.name,
            confirmUrl: verifyUrl,
          })
        );
        subject = "Welcome to LOQATR - Confirm your email";
        break;

      case "magiclink":
      case "email":
        html = await render(
          React.createElement(OtpEmail, {
            token,
            email_action_type,
          })
        );
        subject = `Your LOQATR login code: ${token}`;
        break;

      case "recovery":
        html = await render(
          React.createElement(PasswordResetEmail, {
            resetUrl: verifyUrl,
          })
        );
        subject = "Reset your LOQATR password";
        break;

      case "email_change":
        html = await render(
          React.createElement(EmailChangeEmail, {
            confirmUrl: verifyUrl,
          })
        );
        subject = "Confirm your new email address";
        break;

      default:
        console.warn("Unknown email action type:", email_action_type);
        // Fallback to a simple verification email
        html = await render(
          React.createElement(WelcomeEmail, {
            confirmUrl: verifyUrl,
          })
        );
        subject = "Verify your LOQATR account";
    }

    // Send the email via Resend
    const { data, error: sendError } = await resend.emails.send({
      from: "LOQATR <onboarding@resend.dev>", // Replace with your verified domain
      to: [user.email],
      subject,
      html,
    });

    if (sendError) {
      console.error("Failed to send email:", sendError);
      throw new Error(`Failed to send email: ${sendError.message}`);
    }

    console.log("Email sent successfully:", {
      id: data?.id,
      to: user.email,
      type: email_action_type,
    });

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-email function:", errorMessage);

    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: errorMessage,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
