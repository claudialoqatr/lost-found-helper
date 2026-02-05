import { supabase } from "@/integrations/supabase/client";

type NotificationType = "tag_assigned" | "tag_unassigned" | "tag_scanned" | "message_received";

interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message?: string | null;
  qrcodeId?: number | null;
  loqatrMessageId?: number | null;
  location?: string | null;
}

export async function createNotification({
  userId,
  type,
  title,
  message = null,
  qrcodeId = null,
  loqatrMessageId = null,
  location = null,
}: CreateNotificationParams) {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message,
      qrcode_id: qrcodeId,
      loqatr_message_id: loqatrMessageId,
      location,
    });

    if (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

// Helper to create a tag assigned notification
export async function notifyTagAssigned(
  userId: number,
  itemName: string,
  qrcodeId: number
) {
  await createNotification({
    userId,
    type: "tag_assigned",
    title: `Tag claimed: ${itemName}`,
    message: `You have successfully claimed and set up your tag for "${itemName}".`,
    qrcodeId,
  });
}

// Helper to create a tag unassigned notification
export async function notifyTagUnassigned(userId: number, itemName: string) {
  await createNotification({
    userId,
    type: "tag_unassigned",
    title: `Tag unassigned: ${itemName}`,
    message: `You have unassigned your tag from "${itemName}". The tag is now available to be claimed again.`,
  });
}

// Helper to create a tag scanned notification (for owner when their tag is scanned)
// Rate limited to one notification per item per day
export async function notifyTagScanned(
  ownerId: number,
  itemName: string,
  qrcodeId: number,
  locationAddress?: string | null
) {
  try {
    // Check if there's already a tag_scanned notification for this qrcode in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: existingNotification } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", ownerId)
      .eq("qrcode_id", qrcodeId)
      .eq("type", "tag_scanned")
      .gte("created_at", twentyFourHoursAgo)
      .limit(1)
      .single();

    if (existingNotification) {
      console.log("Skipping tag_scanned notification - already sent within 24 hours for qrcode:", qrcodeId);
      return;
    }

    const locationText = locationAddress
      ? `\n📍 Scanned at: ${locationAddress}`
      : "";

    await createNotification({
      userId: ownerId,
      type: "tag_scanned",
      title: `Your tag was scanned: ${itemName}`,
      message: `Someone scanned the QR code for your "${itemName}".${locationText}`,
      qrcodeId,
      location: locationAddress,
    });
  } catch (error) {
    console.error("Error in notifyTagScanned:", error);
  }
}

// Helper to create a message received notification
export async function notifyMessageReceived(
  ownerId: number,
  itemName: string,
  finderName: string,
  qrcodeId: number,
  loqatrMessageId: number,
  locationAddress?: string | null
) {
  const locationText = locationAddress
    ? `\n📍 Location: ${locationAddress}`
    : "";

  await createNotification({
    userId: ownerId,
    type: "message_received",
    title: `New message about: ${itemName}`,
    message: `${finderName} found your "${itemName}" and sent you a message.${locationText}`,
    qrcodeId,
    loqatrMessageId,
    location: locationAddress,
  });
}
