-- Create notifications table
CREATE TABLE public.notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('tag_assigned', 'tag_unassigned', 'tag_scanned', 'message_received')),
  title TEXT NOT NULL,
  message TEXT,
  qrcode_id INTEGER REFERENCES public.qrcodes(id) ON DELETE SET NULL,
  loqatr_message_id INTEGER REFERENCES public.loqatrs(id) ON DELETE SET NULL,
  location TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications"
ON public.notifications
FOR SELECT
USING (user_id = get_user_id());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = get_user_id());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (user_id = get_user_id());

-- System can insert notifications (via service role or triggers)
CREATE POLICY "Anyone can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;