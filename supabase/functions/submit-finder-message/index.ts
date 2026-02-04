import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FinderMessageRequest {
  item_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  qrcode_id: number;
  owner_id: number;
  location_address?: string | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create Supabase client with service role for bypassing RLS
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const body: FinderMessageRequest = await req.json();
    console.log("Received finder message request:", JSON.stringify(body));

    // Validate required fields
    if (!body.item_id || !body.name?.trim()) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Name and item_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.email?.trim() && !body.phone?.trim()) {
      console.error("Missing contact info");
      return new Response(
        JSON.stringify({ error: "Email or phone is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert the finder message (loqatr)
    const { data: loqatrData, error: loqatrError } = await supabase
      .from("loqatrs")
      .insert({
        item_id: body.item_id,
        name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        message: body.message?.trim() || null,
      })
      .select()
      .single();

    if (loqatrError) {
      console.error("Error inserting loqatr:", loqatrError);
      return new Response(
        JSON.stringify({ error: "Failed to save message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Loqatr inserted successfully:", loqatrData);

    // Get item name for notification
    const { data: itemData } = await supabase
      .from("items")
      .select("name")
      .eq("id", body.item_id)
      .single();

    const itemName = itemData?.name || "Unknown Item";

    // Create notification for the owner
    if (body.owner_id && body.qrcode_id) {
      const locationText = body.location_address
        ? `\n📍 Location: ${body.location_address}`
        : "";

      const { error: notifyError } = await supabase
        .from("notifications")
        .insert({
          user_id: body.owner_id,
          type: "message_received",
          title: `New message about: ${itemName}`,
          message: `${body.name.trim()} found your "${itemName}" and sent you a message.${locationText}`,
          qrcode_id: body.qrcode_id,
          loqatr_message_id: loqatrData.id,
          location: body.location_address || null,
        });

      if (notifyError) {
        console.error("Error creating notification:", notifyError);
        // Don't fail the request if notification fails
      } else {
        console.log("Notification created for owner:", body.owner_id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, loqatr_id: loqatrData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in submit-finder-message:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
