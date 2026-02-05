# Vendor Approval System & Role-Based Access Control

## Overview
This document describes the implementation of the vendor approval workflow and enhanced role-based access control (RBAC) for the multi-vendor e-commerce platform.

## System Architecture

### User Roles
The platform supports three distinct user roles:
1. **Admin** - Full platform access, can manage all users and vendors
2. **Vendor** - Can manage their own products and orders (requires approval)
3. **Buyer** - Can browse and purchase products

### Vendor Status Workflow
Vendors have an additional status field that controls their access:
- **pending** - Initial state after registration, cannot access vendor features
- **approved** - Can access vendor dashboard and manage products
- **suspended** - Access revoked by admin, cannot access vendor features

## Implementation Details

### 1. Database Schema

#### Migration: `20260205_vendor_approval_system.sql`
Added the following to the database:

**New Enum Type:**
```sql
CREATE TYPE public.vendor_status_enum AS ENUM ('pending', 'approved', 'suspended');
```

**Schema Change:**
```sql
ALTER TABLE public.user_roles
ADD COLUMN vendor_status public.vendor_status_enum DEFAULT 'pending';
```

**Key Functions:**
- `get_vendor_status(_user_id UUID)` - Returns vendor status
- `update_vendor_status(_vendor_id UUID, _new_status vendor_status_enum)` - Admin function to change vendor status
- `is_vendor_approved(_user_id UUID)` - Check if vendor is approved
- `delete_vendor_account(_vendor_id UUID)` - Admin function to delete vendor accounts

**Database View:**
- `vendor_management_view` - Aggregates vendor data for admin dashboard (includes email, store info, product count, sales, status)

### 2. Frontend Implementation

#### AuthContext Enhancement (`src/contexts/AuthContext.tsx`)
Added vendor status tracking:
```typescript
type VendorStatus = "pending" | "approved" | "suspended" | null;

interface AuthContextType {
  // ... existing fields
  vendorStatus: VendorStatus;
  refreshAuth: () => Promise<void>;
}
```

The `fetchProfile` function now:
1. Fetches user role
2. If role is "vendor", additionally fetches vendor status via RPC
3. Updates the vendorStatus state

#### ProtectedRoute Component (`src/components/ProtectedRoute.tsx`)
Enhanced to check vendor approval status:

**For Vendor Routes:**
1. Checks if user has vendor role
2. If vendor is "pending" → Shows "Account Pending Approval" page
3. If vendor is "suspended" → Shows "Account Suspended" page
4. If vendor is "approved" → Grants access
5. Admins bypass all vendor status checks

**Access Control Pages:**
- **Pending Notice**: Informs vendors their account is under review (24-48 hours)
- **Suspended Notice**: Informs vendors their account has been suspended, suggests contacting support
- **Access Denied**: Standard unauthorized access page for role mismatches

### 3. Admin Vendor Management

#### AdminVendors Page (`src/pages/admin/AdminVendors.tsx`)
Fully functional vendor management dashboard with:

**Features:**
- View all vendors with real-time data from `vendor_management_view`
- Display vendor status with color-coded badges
- Product count and sales metrics per vendor

**Actions:**
- **Approve Vendor**: Changes status from pending → approved
- **Suspend Vendor**: Changes status from approved → suspended  
- **Reactivate Vendor**: Changes status from suspended → approved
- **Delete Account**: Permanently removes vendor and all related data

**UI Components:**
- Data table with sorting and search
- Dropdown menu for vendor actions
- Confirmation dialog for deletion
- Toast notifications for all actions

### 4. Signup Process Enhancement

#### Signup Page (`src/pages/Signup.tsx`)
Updated to inform vendors about the approval process:
- Vendor signups show specific message about admin review
- Estimated approval time communicated (24-48 hours)
- New vendors are automatically created with `vendor_status = 'pending'`

## Access Control Matrix

| Role   | Vendor Dashboard | Admin Dashboard | Account Pages | Marketplace |
|--------|-----------------|-----------------|---------------|-------------|
| Admin  | ✅ Full Access   | ✅ Full Access   | ✅ Full Access | ✅ Access    |
| Vendor (Approved) | ✅ Full Access | ❌ Denied | ✅ Access | ✅ Access |
| Vendor (Pending) | ❌ Denied | ❌ Denied | ✅ Access | ✅ Access |
| Vendor (Suspended) | ❌ Denied | ❌ Denied | ✅ Access | ✅ Access |
| Buyer  | ❌ Denied | ❌ Denied | ✅ Full Access | ✅ Access |

## Security Features

### Row Level Security (RLS)
1. **Vendor Status Checks**: Product management policies now verify vendor approval
2. **Admin-Only Functions**: All vendor status changes require admin role
3. **Audit Logging**: All vendor status changes logged to `system_logs`

### Frontend Protection
1. Route-level guards via `ProtectedRoute`
2. Real-time status checks on protected routes
3. Automatic redirect on status change

### Backend Protection
1. Database-level RLS policies
2. SECURITY DEFINER functions for role checks
3. Trigger-based audit logging

## User Flows

### New Vendor Registration
1. User selects "Vendor" role during signup
2. Enters store name and other details
3. Account created with `vendor_status = 'pending'`
4. User receives email verification + pending approval notice
5. Cannot access vendor dashboard until approved

### Admin Vendor Approval
1. Admin navigates to `/admin/vendors`
2. Views list of all vendors with status badges
3. Clicks on pending vendor → "Approve Vendor"
4. Vendor status updated to `approved`
5. System logs action in `system_logs`
6. Vendor can now access vendor dashboard

### Vendor Suspension
1. Admin identifies policy violation
2. Clicks "Suspend Vendor" in admin panel
3. Vendor status updated to `suspended`
4. Vendor immediately loses access to vendor dashboard
5. If logged in, vendor is redirected to suspended notice page

### Vendor Deletion
1. Admin clicks "Delete Account"
2. Confirmation dialog appears
3. Upon confirmation, `delete_vendor_account()` function executes
4. All vendor data deleted (CASCADE)
5. Action logged in system logs

## Testing Guide

### Test Vendor Registration Flow
1. Sign up as a new vendor
2. Verify you cannot access `/vendor`
3. Confirm "Pending Approval" page is shown
4. Log in as admin, approve the vendor
5. Refresh vendor account, verify `/vendor` is accessible

### Test Admin Controls
1. Log in as admin
2. Navigate to `/admin/vendors`
3. Test approval action on pending vendor
4. Test suspension action on approved vendor
5. Test reactivation action on suspended vendor
6. Test deletion with confirmation

### Test Access Restrictions
1. As buyer, attempt to access `/vendor` → Should show Access Denied
2. As buyer, attempt to access `/admin` → Should show Access Denied
3. As pending vendor, attempt to access `/vendor` → Should show Pending Approval
4. As suspended vendor, attempt to access `/vendor` → Should show Suspended Notice
5. As admin, verify can access all routes

## Migration Instructions

### Running the Migration
```bash
# 1. Apply the migration via Supabase CLI or Dashboard
supabase db push

# Or run the SQL file directly in Supabase SQL Editor
# File: supabase/migrations/20260205_vendor_approval_system.sql
```

### Post-Migration Steps
1. **Existing Vendors**: All existing vendors are auto-set to "approved" for backward compatibility
2. **Create First Admin**: Run SQL to promote a user to admin:
   ```sql
   UPDATE public.user_roles 
   SET role = 'admin' 
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
   ```
3. **Verify View Access**: Ensure `vendor_management_view` returns data for admin users

## API Reference

### Database Functions

#### `get_vendor_status(_user_id UUID)`
Returns the vendor status as text for a given user.
```sql
SELECT get_vendor_status('user-uuid-here');
-- Returns: 'pending' | 'approved' | 'suspended' | NULL
```

#### `update_vendor_status(_vendor_id UUID, _new_status vendor_status_enum)`
Admin-only function to update vendor status.
```sql
SELECT update_vendor_status('vendor-uuid-here', 'approved');
-- Returns: true (or throws error if not admin)
```

#### `is_vendor_approved(_user_id UUID)`
Boolean check if vendor is approved.
```sql
SELECT is_vendor_approved('user-uuid-here');
-- Returns: true | false
```

#### `delete_vendor_account(_vendor_id UUID)`
Admin-only function to permanently delete a vendor.
```sql
SELECT delete_vendor_account('vendor-uuid-here');
-- Returns: true (or throws error if not admin)
```

### Frontend Hooks

#### `useAuth()`
```typescript
const { vendorStatus, refreshAuth } = useAuth();

// vendorStatus: 'pending' | 'approved' | 'suspended' | null
// refreshAuth: async () => void - refetches user auth data
```

## Troubleshooting

### Vendor can't access dashboard after approval
- Check vendor_status in database: `SELECT * FROM user_roles WHERE user_id = '...'`
- Have vendor log out and log back in
- Or call `refreshAuth()` from the frontend

### View returns no data
- Ensure RLS is properly configured
- Check admin role is correctly set
- Verify view exists: `SELECT * FROM vendor_management_view`

### Migration fails
- Check for existing `vendor_status` column
- Ensure `vendor_status_enum` type doesn't already exist
- Review Supabase logs for specific error

## Future Enhancements

Potential improvements to consider:
1. **Email Notifications**: Auto-email vendors when approved/suspended
2. **Approval Reasons**: Add notes field for why vendor was suspended
3. **Multi-step Approval**: Require document verification before approval
4. **Vendor Dashboard Badge**: Show pending/approved status in vendor UI
5. **Analytics**: Track average approval time, suspension rates
6. **Bulk Actions**: Allow admins to approve/suspend multiple vendors at once

## Support

For issues or questions:
- Check system logs: `SELECT * FROM system_logs WHERE source = 'vendor_management'`
- Review RLS policies: Supabase Dashboard → Authentication → Policies
- Contact development team with specific error messages
