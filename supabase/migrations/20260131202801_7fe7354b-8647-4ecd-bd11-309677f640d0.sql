-- Insert test users
INSERT INTO public.users (auth_id, name, email, phone) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test User', 'test@loqatr.com', '0821234567'),
  ('00000000-0000-0000-0000-000000000002', 'Claudia Schwaeble', 'cschwaeble@live.co.za', '0729117850'),
  ('00000000-0000-0000-0000-000000000003', 'James Wilson', 'james@example.com', '0836388389')
ON CONFLICT DO NOTHING;

-- Insert item detail field types
INSERT INTO public.item_detail_fields (id, type) VALUES
  (1, 'Emergency contact'),
  (2, 'Return address'),
  (3, 'Reward offer'),
  (4, 'Medical info'),
  (5, 'Pet info'),
  (6, 'Other')
ON CONFLICT DO NOTHING;

-- Insert test items
INSERT INTO public.items (id, name, description) VALUES
  (1, 'Scooter', 'If an emergency, please contact James on 0836388389. Otherwise Claudia.'),
  (2, 'Laptop Bag', 'Contains important work documents. Please return!'),
  (3, 'House Keys', NULL)
ON CONFLICT DO NOTHING;

-- Insert item details for the scooter
INSERT INTO public.item_details (item_id, field_id, value) VALUES
  (1, 1, 'James - 08363'),
  (1, 2, 'Workshop17, Woodstock')
ON CONFLICT DO NOTHING;

-- Insert test QR codes (mix of claimed and unclaimed)
INSERT INTO public.qrcodes (loqatr_id, status, is_public, assigned_to, item_id) VALUES
  ('LOQ-76-kf2r4f', 'active', true, 2, 1),
  ('LOQ-TEST-001', 'assigned', false, NULL, NULL),
  ('LOQ-TEST-002', 'assigned', false, NULL, NULL),
  ('LOQ-TEST-003', 'active', true, 2, 2),
  ('LOQ-TEST-004', 'active', false, 3, 3)
ON CONFLICT DO NOTHING;

-- Insert some test scans
INSERT INTO public.scans (qr_code_id, latitude, longitude, address, is_owner, scanned_at) VALUES
  (1, -33.9249, 18.4241, 'Cape Town, South Africa', false, NOW() - INTERVAL '2 days'),
  (1, -33.9180, 18.4232, 'Woodstock, Cape Town', true, NOW() - INTERVAL '1 day'),
  (4, -26.2041, 28.0473, 'Johannesburg, South Africa', false, NOW())
ON CONFLICT DO NOTHING;