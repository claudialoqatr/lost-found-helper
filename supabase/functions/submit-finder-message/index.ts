import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Resend } from "https://esm.sh/resend@4.0.0";

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

// Email template function (inlined to avoid cross-function imports)
function generateFoundItemEmail({
  ownerName,
  itemName,
  finderName,
  finderEmail,
  finderPhone,
  finderMessage,
  locationAddress,
  messagesUrl,
}: {
  ownerName?: string;
  itemName: string;
  finderName: string;
  finderEmail?: string | null;
  finderPhone?: string | null;
  finderMessage?: string | null;
  locationAddress?: string | null;
  messagesUrl: string;
}): string {
  const year = new Date().getFullYear();
  const greeting = ownerName ? `Hi ${ownerName},` : 'Hi,';
  
  // Build contact info section
  let contactInfo = '';
  if (finderEmail) {
    contactInfo += `<li style="margin-bottom: 8px;"><strong>Email:</strong> <a href="mailto:${finderEmail}" style="color: #0ea5e9; text-decoration: none;">${finderEmail}</a></li>`;
  }
  if (finderPhone) {
    contactInfo += `<li style="margin-bottom: 8px;"><strong>Phone:</strong> <a href="tel:${finderPhone}" style="color: #0ea5e9; text-decoration: none;">${finderPhone}</a></li>`;
  }

  // Build optional message section
  const messageSection = finderMessage
    ? `
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="color: #6b7280; font-size: 13px; font-weight: 600; margin: 0 0 8px; text-transform: uppercase;">Message from finder:</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0; font-style: italic;">"${finderMessage}"</p>
      </div>
    `
    : '';

  // Build optional location section
  const locationSection = locationAddress
    ? `
      <div style="background-color: #ecfdf5; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
        <p style="color: #065f46; font-size: 14px; margin: 0;">
          📍 <strong>Found at:</strong> ${locationAddress}
        </p>
      </div>
    `
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Someone found your item!</title>
</head>
<body style="background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; margin: 0; padding: 20px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="background-color: #ffffff; margin: 0 auto; padding: 20px 0 48px; margin-bottom: 64px; max-width: 560px; width: 100%;">
    <tr>
      <td style="padding: 32px 40px 24px; border-bottom: 1px solid #e6ebf1;">
        <span style="font-size: 28px; font-weight: 700; color: #0ea5e9; margin: 0; letter-spacing: -0.5px;">LOQATR</span>
      </td>
    </tr>
    <tr>
      <td>
        <div style="padding: 32px 40px;">
          <h1 style="color: #1f2937; font-size: 24px; font-weight: 600; line-height: 1.3; margin: 0 0 24px;">🎉 Great news! Someone found your item!</h1>
          
          <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
            ${greeting}
          </p>
          
          <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
            <strong>${finderName}</strong> scanned the LOQATR tag on your <strong>"${itemName}"</strong> and wants to help return it to you!
          </p>
          
          ${locationSection}
          ${messageSection}
          
          <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 16px 0 8px;">
            <strong>Finder's contact details:</strong>
          </p>
          <ul style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px; padding-left: 24px; list-style: none;">
            ${contactInfo}
          </ul>
          
          <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
            Reach out to them as soon as possible to arrange collection of your item.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${messagesUrl}" style="background-color: #0ea5e9; border-radius: 8px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; text-align: center; display: inline-block; padding: 12px 32px;">
              View Message in LOQATR
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
            Thank you for using LOQATR to protect your belongings!
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 40px; border-top: 1px solid #e6ebf1;">
        <p style="font-size: 12px; color: #8898aa; margin: 0 0 4px;">© ${year} LOQATR. All rights reserved.</p>
        <p style="font-size: 12px; color: #8898aa; margin: 0;">Helping you protect what matters most.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

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

    // Get owner details for email
    let ownerEmail: string | null = null;
    let ownerName: string | null = null;
    if (body.owner_id) {
      const { data: ownerData } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", body.owner_id)
        .single();
      
      ownerEmail = ownerData?.email || null;
      ownerName = ownerData?.name || null;
    }

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

    // Send email notification to owner
    if (resendApiKey && ownerEmail) {
      try {
        const resend = new Resend(resendApiKey);
        
        // Construct the messages URL - use the preview URL pattern
        const messagesUrl = "https://app.loqatr.com/messages";

        const emailHtml = generateFoundItemEmail({
          ownerName: ownerName || undefined,
          itemName,
          finderName: body.name.trim(),
          finderEmail: body.email?.trim() || null,
          finderPhone: body.phone?.trim() || null,
          finderMessage: body.message?.trim() || null,
          locationAddress: body.location_address || null,
          messagesUrl,
        });

        const { error: emailError } = await resend.emails.send({
          from: "LOQATR <noreply@loqatr.com>",
          to: [ownerEmail],
          subject: `🎉 Great news! Someone found your "${itemName}"`,
          html: emailHtml,
        });

        if (emailError) {
          console.error("Error sending email:", emailError);
          // Don't fail the request if email fails
        } else {
          console.log("Email sent successfully to:", ownerEmail);
        }
      } catch (emailErr) {
        console.error("Email sending error:", emailErr);
        // Don't fail the request if email fails
      }
    } else {
      console.log("Email not sent - missing RESEND_API_KEY or owner email:", { 
        hasResendKey: !!resendApiKey, 
        ownerEmail 
      });
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
