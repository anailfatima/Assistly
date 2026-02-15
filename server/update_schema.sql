-- Run this in your Supabase SQL Editor to enable the new deletion features

-- Add is_removed column for soft deletes
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT FALSE;

-- If you want to migrate existing deleted flags (optional, depending on previous usage)
-- UPDATE public.chats SET is_removed = TRUE WHERE admin_deleted = TRUE OR user_deleted = TRUE;
