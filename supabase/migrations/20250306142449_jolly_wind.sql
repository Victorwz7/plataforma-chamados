/*
  # Create Admin User

  1. Creates initial admin user in auth.users
  2. Creates corresponding profile in public.profiles
*/

-- First, create the admin user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert the user and get their ID
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    'victorsla2244@gmail.com',
    crypt('123456', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    'authenticated',
    'authenticated'
  )
  RETURNING id INTO new_user_id;

  -- Create their profile
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'Admin User',
    'admin',
    now(),
    now()
  );
END $$;