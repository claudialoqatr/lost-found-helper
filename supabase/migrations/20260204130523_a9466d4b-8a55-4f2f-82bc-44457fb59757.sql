-- Add icon_name column to items table for storing Lucide icon names
ALTER TABLE public.items 
ADD COLUMN icon_name text DEFAULT 'Package';