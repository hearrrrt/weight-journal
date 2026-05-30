-- Add invite_code column to profiles for partner binding
ALTER TABLE profiles ADD COLUMN invite_code text UNIQUE;

-- Generate invite codes for existing profiles (6 random digits)
UPDATE profiles SET invite_code = substring(md5(random()::text || id::text) from 1 for 6)
WHERE invite_code IS NULL;

-- Update the handle_new_user trigger to auto-generate invite code
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SET search_path = ''
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, invite_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', '新朋友'),
    substring(md5(random()::text || NEW.id::text) from 1 for 6)
  );
  RETURN NEW;
END;
$$;
