-- Grant INSERT permission to anon role for loqatrs table (for finder messages)
GRANT INSERT ON public.loqatrs TO anon;

-- Grant INSERT permission to anon role for notifications table (for notifying owners)
GRANT INSERT ON public.notifications TO anon;

-- Ensure authenticated users can also insert
GRANT INSERT ON public.loqatrs TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;

-- Grant SELECT on items and qrcodes for the finder page context
GRANT SELECT ON public.items TO anon;
GRANT SELECT ON public.qrcodes TO anon;
GRANT SELECT ON public.item_details TO anon;
GRANT SELECT ON public.item_detail_fields TO anon;
GRANT SELECT ON public.users TO anon;