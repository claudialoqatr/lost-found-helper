/**
 * Shared types and interfaces used across the application.
 * Centralizing these types improves maintainability and type safety.
 */

// ============ User Types ============

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  auth_id?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

// ============ QR Code Types ============

export interface QRCodeData {
  id: number;
  loqatr_id: string;
  is_public: boolean;
  item_id: number | null;
  assigned_to: number | null;
  status: string;
  batch_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TagWithItem extends Omit<QRCodeData, 'batch_id'> {
  last_scanned_at: string | null;
  item: ItemInfo | null;
}

// ============ Item Types ============

export interface ItemInfo {
  id: number;
  name: string;
  description: string | null;
  icon_name: string | null;
}

export interface ItemDetail {
  id: string;
  fieldType: string;
  value: string;
}

export interface ItemDetailFromDB {
  id: number;
  item_id: number | null;
  field_id: number | null;
  value: string;
  created_at?: string | null;
  item_detail_fields?: {
    id: number;
    type: string;
  } | null;
}

// ============ Location Types ============

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

// ============ Contact Types ============

export interface RevealedContact {
  owner_name: string;
  owner_email: string;
  owner_phone: string | null;
  whatsapp_url: string | null;
}

// ============ Message Types ============

export interface MessageWithItem {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  created_at: string | null;
  item_id: number | null;
  item?: {
    id: number;
    name: string;
  } | null;
}

// ============ Field Types Constant ============

export const ITEM_DETAIL_FIELD_TYPES = [
  "Item owner name",
  "Emergency contact", 
  "Return address",
  "Reward offer",
  "Medical info",
  "Pet info",
  "Other"
] as const;

export type ItemDetailFieldType = typeof ITEM_DETAIL_FIELD_TYPES[number];

// ============ QR Code Batch Types ============

export interface QRCodeBatch {
  id: number;
  rand_value: number;
  retailer_id: number | null;
  staff_id: number | null;
  notes: string | null;
  status: string;
  is_downloaded: boolean;
  is_printed: boolean;
  created_at: string | null;
  updated_at: string | null;
  qrcode_count?: number;
}
