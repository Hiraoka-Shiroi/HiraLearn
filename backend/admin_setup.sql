
-- SQL to create an admin user and set the role
-- 1. Insert user into auth.users (Supabase handles this usually via API, but we can seed)
-- Note: Replace 'admin@hiralearn.com' and 'AdminPassword123!' if needed.
-- Since I can't generate the bcrypt hash here easily for a raw insert into auth.users,
-- I will provide the instruction to create the account via UI and then run this SQL to upgrade it.

-- Update the profile to admin role for a specific email
UPDATE profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'shiroihiraoka@gmail.com'
);

-- If the profile doesn't exist yet, it will be created by the trigger on first login.
-- But if we want to be sure:
INSERT INTO profiles (id, full_name, role)
SELECT id, 'Zen Admin', 'admin'
FROM auth.users
WHERE email = 'admin@hiralearn.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
