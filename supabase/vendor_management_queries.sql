-- Vendor Management Quick Reference SQL
-- Run these queries in Supabase SQL Editor for common admin tasks

-- ============================================
-- 1. CREATE FIRST ADMIN USER
-- ============================================
-- Replace 'your-email@example.com' with actual admin email
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com'
);


-- ============================================
-- 2. VIEW ALL VENDORS WITH STATUS
-- ============================================
SELECT 
  u.email,
  p.full_name,
  p.store_name,
  ur.vendor_status,
  ur.created_at as vendor_since
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
JOIN public.profiles p ON p.user_id = u.id
WHERE ur.role = 'vendor'
ORDER BY ur.created_at DESC;


-- ============================================
-- 3. MANUALLY APPROVE A VENDOR
-- ============================================
-- Replace 'vendor@example.com' with vendor's email
UPDATE public.user_roles 
SET vendor_status = 'approved' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'vendor@example.com'
)
AND role = 'vendor';


-- ============================================
-- 4. MANUALLY SUSPEND A VENDOR
-- ============================================
-- Replace 'vendor@example.com' with vendor's email
UPDATE public.user_roles 
SET vendor_status = 'suspended' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'vendor@example.com'
)
AND role = 'vendor';


-- ============================================
-- 5. CHECK VENDOR STATUS
-- ============================================
-- Replace 'vendor@example.com' with vendor's email
SELECT 
  u.email,
  p.full_name,
  ur.role,
  ur.vendor_status
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'vendor@example.com';


-- ============================================
-- 6. GET VENDOR STATISTICS
-- ============================================
SELECT 
  vendor_status,
  COUNT(*) as count
FROM public.user_roles
WHERE role = 'vendor'
GROUP BY vendor_status
ORDER BY vendor_status;


-- ============================================
-- 7. VIEW PENDING VENDORS
-- ============================================
SELECT 
  u.email,
  p.full_name,
  p.store_name,
  ur.created_at as registered_at,
  EXTRACT(EPOCH FROM (now() - ur.created_at))/3600 as hours_pending
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
JOIN public.profiles p ON p.user_id = u.id
WHERE ur.role = 'vendor' 
  AND ur.vendor_status = 'pending'
ORDER BY ur.created_at ASC;


-- ============================================
-- 8. VIEW SUSPENDED VENDORS
-- ============================================
SELECT 
  u.email,
  p.full_name,
  p.store_name,
  (SELECT COUNT(*) FROM public.products WHERE vendor_id = u.id) as product_count
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
JOIN public.profiles p ON p.user_id = u.id
WHERE ur.role = 'vendor' 
  AND ur.vendor_status = 'suspended'
ORDER BY p.full_name;


-- ============================================
-- 9. VENDOR APPROVAL HISTORY (from logs)
-- ============================================
SELECT 
  created_at,
  message,
  metadata->>'vendor_id' as vendor_id,
  metadata->>'new_status' as new_status,
  metadata->>'updated_by' as admin_id
FROM public.system_logs
WHERE source = 'vendor_management'
ORDER BY created_at DESC
LIMIT 50;


-- ============================================
-- 10. DELETE A VENDOR (use with caution!)
-- ============================================
-- This will CASCADE delete all vendor's products, orders, etc.
-- Replace 'vendor@example.com' with vendor's email
DELETE FROM auth.users 
WHERE email = 'vendor@example.com' 
  AND id IN (
    SELECT user_id FROM public.user_roles WHERE role = 'vendor'
  );


-- ============================================
-- 11. BULK APPROVE ALL PENDING VENDORS
-- ============================================
-- USE WITH CAUTION - Approves ALL pending vendors
UPDATE public.user_roles 
SET vendor_status = 'approved' 
WHERE role = 'vendor' 
  AND vendor_status = 'pending';


-- ============================================
-- 12. REACTIVATE A SUSPENDED VENDOR
-- ============================================
-- Replace 'vendor@example.com' with vendor's email
UPDATE public.user_roles 
SET vendor_status = 'approved' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'vendor@example.com'
)
AND role = 'vendor'
AND vendor_status = 'suspended';


-- ============================================
-- 13. GET VENDOR WITH MOST PRODUCTS
-- ============================================
SELECT 
  p.full_name,
  p.store_name,
  ur.vendor_status,
  COUNT(pr.id) as product_count
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.user_id
LEFT JOIN public.products pr ON pr.vendor_id = p.user_id
WHERE ur.role = 'vendor'
GROUP BY p.full_name, p.store_name, ur.vendor_status
ORDER BY product_count DESC
LIMIT 10;


-- ============================================
-- 14. VIEW ALL USER ROLES
-- ============================================
SELECT 
  u.email,
  p.full_name,
  ur.role,
  ur.vendor_status,
  ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.profiles p ON p.user_id = u.id
ORDER BY ur.created_at DESC;


-- ============================================
-- 15. CHECK IF USER IS ADMIN
-- ============================================
-- Replace 'user@example.com' with user's email
SELECT 
  u.email,
  ur.role,
  CASE 
    WHEN ur.role = 'admin' THEN 'Yes'
    ELSE 'No'
  END as is_admin
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'user@example.com';


-- ============================================
-- NOTES AND TIPS
-- ============================================
/*
1. Always backup your database before running bulk operations
2. Use the admin dashboard UI for vendor management when possible
3. Direct SQL should be used for:
   - Creating first admin user
   - Emergency vendor approvals
   - Database inspection and debugging
4. All vendor status changes are logged in system_logs table
5. Deleting a vendor will CASCADE delete their products and order items
*/
