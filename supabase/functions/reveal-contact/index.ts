import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RevealRequest {
  scan_id: number;
  qr_identifier: string;
  turnstile_token: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: RevealRequest = await req.json();
    const { scan_id, qr_identifier, turnstile_token } = body;

    if (!scan_id || !qr_identifier || !turnstile_token) {
      console.error("Missing required fields:", { scan_id, qr_identifier, hasTurnstileToken: !!turnstile_token });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the client IP from request headers
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("cf-connecting-ip") 
      || req.headers.get("x-real-ip")
      || "0.0.0.0";

    console.log("Reveal contact request:", { scan_id, qr_identifier, clientIp });

    // Verify Turnstile token with Cloudflare
    const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!turnstileSecret) {
      console.error("TURNSTILE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const turnstileResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: turnstile_token,
        remoteip: clientIp,
      }),
    });

    const turnstileResult = await turnstileResponse.json();
    console.log("Turnstile verification result:", turnstileResult);

    if (!turnstileResult.success) {
      console.error("Turnstile verification failed:", turnstileResult);
      return new Response(
        JSON.stringify({ error: "Captcha verification failed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, update the scan with the IP address (for rate limiting)
    const { error: updateError } = await supabase
      .from("scans")
      .update({ ip_address: clientIp })
      .eq("id", scan_id);

    if (updateError) {
      console.error("Failed to update scan with IP:", updateError);
      // Continue anyway, rate limiting will still work for future requests
    }

    // Call the secure reveal function
    const { data, error } = await supabase.rpc("reveal_item_contact", {
      target_qr_id: qr_identifier,
      current_scan_id: scan_id,
    });

    if (error) {
      console.error("Reveal function error:", error);
      
      // Check for rate limit error
      if (error.message?.includes("Rate limit exceeded")) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: error.message || "Failed to reveal contact" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data || data.length === 0) {
      console.log("No contact data found for QR:", qr_identifier);
      return new Response(
        JSON.stringify({ error: "Contact information not available" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Contact revealed successfully for scan:", scan_id);
    return new Response(
      JSON.stringify({ success: true, contact: data[0] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
