# Role-Based Access Control (RBAC) - Campus Connect Marketplace

## Overview
The application now has a complete role-based access control system with three user roles:
- **Admin** - Full platform access
- **Vendor** - Can manage their own store and products
- **Buyer** - Can browse and purchase products

## How It Works

### 1. User Roles
When a user signs up, they select their role:
- **Buyer** (default) - Regular shoppers
- **Vendor** - Store owners who sell products
- **Admin** - Platform administrators (must be manually assigned via SQL)

### 2. Access Control Rules

#### Admin Access
- ✅ Can access ALL routes (admin, vendor, and buyer pages)
- ✅ Can view and manage all users, vendors, products, and orders
- ✅ Full platform control

#### Vendor Access
- ✅ Can access `/vendor/*` routes (their dashboard)
- ✅ Can manage their own products and orders
- ❌ CANNOT access `/admin/*` routes
- ✅ Can access public pages and their account

#### Buyer Access
- ✅ Can access `/account/*` routes
- ✅ Can browse products, add to cart, and checkout
- ❌ CANNOT access `/admin/*` or `/vendor/*` routes
- ✅ Can access all public pages

### 3. Protected Routes

All sensitive routes are wrapped with `<ProtectedRoute>` component:

```tsx
// Admin only
<Route path="/admin" element={
  <ProtectedRoute allowedRoles={["admin"]}>
    <AdminDashboard />
  </ProtectedRoute>
} />

// Vendor only (but admins can also access)
<Route path="/vendor" element={
  <ProtectedRoute allowedRoles={["vendor"]}>
    <VendorDashboard />
  </ProtectedRoute>
} />

// Any authenticated user
<Route path="/account" element={
  <ProtectedRoute>
    <BuyerAccount />
  </ProtectedRoute>
} />
```

### 4. Navigation Visibility

The navbar automatically shows/hides menu items based on role:

**For Buyers:**
- My Account
- My Orders
- Wishlist

**For Vendors:**
- Vendor Portal (highlighted card)
- My Orders
- Wishlist

**For Admins:**
- Admin Dashboard (highlighted card)
- My Orders
- Wishlist

### 5. Access Denied Page

If a user tries to access a route they don't have permission for, they see a friendly "Access Denied" page with:
- Clear explanation of why access was denied
- Button to go home
- Button to go to their appropriate dashboard

## Making a User an Admin

Admins cannot be created through the signup form. You must manually assign the admin role via SQL:

```sql
-- Run this in Supabase SQL Editor
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

## Database Schema

### user_roles table
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role app_role NOT NULL, -- 'admin', 'vendor', or 'buyer'
  created_at TIMESTAMP
);
```

### Role Check Function
```sql
CREATE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$ LANGUAGE SQL;
```

## Testing the System

### Test as Buyer
1. Sign up with role "Buyer"
2. Try to access `/vendor` - should see "Access Denied"
3. Try to access `/admin` - should see "Access Denied"
4. Can access `/account` - should work ✅

### Test as Vendor
1. Sign up with role "Vendor"
2. Can access `/vendor` - should work ✅
3. Try to access `/admin` - should see "Access Denied"
4. Can access `/account` - should work ✅

### Test as Admin
1. Sign up as any role, then run SQL to make admin
2. Can access `/admin` - should work ✅
3. Can access `/vendor` - should work ✅
4. Can access `/account` - should work ✅

## Security Notes

- All role checks happen on BOTH frontend and backend
- Frontend checks prevent UI confusion
- Backend RLS policies enforce data security
- Admins have elevated privileges via Supabase RLS policies
- Users cannot change their own roles (only via SQL by database admin)
