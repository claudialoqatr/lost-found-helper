
-- Sync all primary key sequences to the current max id in each table
SELECT setval(pg_get_serial_sequence('public.retailers', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.retailers), 1));
SELECT setval(pg_get_serial_sequence('public.users', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.users), 1));
SELECT setval(pg_get_serial_sequence('public.qrcodes', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.qrcodes), 1));
SELECT setval(pg_get_serial_sequence('public.items', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.items), 1));
SELECT setval(pg_get_serial_sequence('public.qrcode_batches', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.qrcode_batches), 1));
SELECT setval(pg_get_serial_sequence('public.item_details', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.item_details), 1));
SELECT setval(pg_get_serial_sequence('public.scans', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.scans), 1));
SELECT setval(pg_get_serial_sequence('public.loqatrs', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.loqatrs), 1));
SELECT setval(pg_get_serial_sequence('public.user_roles', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.user_roles), 1));
SELECT setval(pg_get_serial_sequence('public.notifications', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.notifications), 1));
SELECT setval(pg_get_serial_sequence('public.item_detail_fields', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.item_detail_fields), 1));
SELECT setval(pg_get_serial_sequence('public.role_permissions', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.role_permissions), 1));
