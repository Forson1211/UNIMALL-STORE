# 🎯 Role-Based Access Control - Quick Reference

## User Roles & Access Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ROLE HIERARCHY                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ADMIN (Full Platform Access)                                      │
│      │                                                               │
│      ├──► Admin Dashboard     ✅                                    │
│      ├──► Vendor Dashboard    ✅ (for monitoring)                   │
│      ├──► Account Pages       ✅                                    │
│      └──► Marketplace         ✅                                    │
│                                                                      │
│   VENDOR (Approval Required)                                         │
│      │                                                               │
│      ├──► Pending Status                                            │
│      │     ├── Vendor Dashboard    ❌ (shows pending notice)        │
│      │     ├── Product Management  ❌                               │
│      │     ├── Account Pages       ✅                               │
│      │     └── Marketplace         ✅                               │
│      │                                                               │
│      ├──► Approved Status                                           │
│      │     ├── Vendor Dashboard    ✅                               │
│      │     ├── Product Management  ✅                               │
│      │     ├── Account Pages       ✅                               │
│      │     └── Marketplace         ✅                               │
│      │                                                               │
│      └──► Suspended Status                                          │
│            ├── Vendor Dashboard    ❌ (shows suspended notice)      │
│            ├── Product Management  ❌                               │
│            ├── Account Pages       ✅                               │
│            └── Marketplace         ✅                               │
│                                                                      │
│   BUYER (Standard User)                                              │
│      │                                                               │
│      ├──► Admin Dashboard     ❌                                    │
│      ├──► Vendor Dashboard    ❌                                    │
│      ├──► Account Pages       ✅                                    │
│      └──► Marketplace         ✅                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Vendor Lifecycle Flow

```
┌──────────────┐
│  User Signs  │
│  Up as       │
│  Vendor      │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ Status: PENDING              │
│ • Email verification sent    │
│ • Cannot access /vendor      │
│ • Sees "Pending" notice      │
└──────┬───────────────────────┘
       │
       │ ◄─── Admin Reviews
       │
       ▼
┌──────────────────────────────┐
│ Admin Action Required        │
│                              │
│ Options:                     │
│  1. Approve   ───────┐       │
│  2. Reject/Suspend   │       │
│  3. Delete           │       │
└──────────────────────┼───────┘
                       │
       ┌───────────────┴────────────────┐
       │                                │
       ▼                                ▼
┌─────────────────┐          ┌──────────────────┐
│ Status: APPROVED│          │ Status: SUSPENDED│
│ • Full access   │          │ • Access revoked │
│ • Can sell      │          │ • Cannot sell    │
│ • Manage orders │          │ • See notice     │
└─────────────────┘          └──────────────────┘
       │                                │
       │                                │
       │ Admin suspends                 │ Admin reactivates
       └────────────────────────────────┘
```

## Admin Vendor Management Actions

```
┌────────────────────────────────────────────────────────────┐
│              ADMIN VENDOR DASHBOARD                        │
│  /admin/vendors                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📊 Vendor List                                            │
│  ┌─────────┬──────────────┬────────┬──────────┐          │
│  │ Name    │ Store        │ Status │ Actions  │          │
│  ├─────────┼──────────────┼────────┼──────────┤          │
│  │ John D. │ Tech Store   │ 🟡 Pending        │          │
│  │         │              │        │ ✓ Approve │          │
│  ├─────────┼──────────────┼────────┼──────────┤          │
│  │ Jane S. │ Fashion Hub  │ 🟢 Approved       │          │
│  │         │              │        │ ⊗ Suspend │          │
│  ├─────────┼──────────────┼────────┼──────────┤          │
│  │ Bob M.  │ Gaming Zone  │ 🔴 Suspended      │          │
│  │         │              │        │ ↻ Reactivate        │
│  └─────────┴──────────────┴────────┴──────────┘          │
│                                                            │
│  Actions Available:                                        │
│  ✓  Approve Vendor     (pending → approved)                │
│  ⊗  Suspend Vendor     (approved → suspended)              │
│  ↻  Reactivate Vendor  (suspended → approved)              │
│  🗑  Delete Account     (permanently remove)               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Route Protection Logic

```javascript
// Simplified ProtectedRoute Logic

if (user is not authenticated) {
  → Redirect to /login
}

if (route requires specific role) {
  if (user is admin) {
    → Allow access (admins can access everything)
  }
  
  if (route is for vendors) {
    if (user is vendor) {
      if (vendorStatus === 'pending') {
        → Show "Pending Approval" page
      }
      else if (vendorStatus === 'suspended') {
        → Show "Account Suspended" page
      }
      else if (vendorStatus === 'approved') {
        → Allow access
      }
    }
    else {
      → Show "Access Denied" page
    }
  }
  
  if (user role does not match required role) {
    → Show "Access Denied" page
  }
}

→ Render protected content
```

## Database Schema Overview

```sql
┌────────────────────────┐
│  auth.users            │
│  ├── id (PK)           │
│  ├── email             │
│  └── ...               │
└────────┬───────────────┘
         │
         │ (1:1)
         ▼
┌────────────────────────┐
│  public.profiles       │
│  ├── id (PK)           │
│  ├── user_id (FK)      │
│  ├── full_name         │
│  ├── store_name        │
│  └── ...               │
└────────────────────────┘

         │
         │ (1:1)
         ▼
┌────────────────────────┐
│  public.user_roles     │
│  ├── id (PK)           │
│  ├── user_id (FK)      │
│  ├── role              │◄─── 'admin' | 'vendor' | 'buyer'
│  └── vendor_status     │◄─── 'pending' | 'approved' | 'suspended'
└────────────────────────┘
```

## Key Functions

```sql
-- Check vendor status
get_vendor_status(user_id) → 'pending' | 'approved' | 'suspended'

-- Update vendor status (admin only)
update_vendor_status(vendor_id, new_status) → boolean

-- Check if vendor is approved
is_vendor_approved(user_id) → boolean

-- Delete vendor account (admin only)
delete_vendor_account(vendor_id) → boolean
```

## Frontend Usage

```typescript
// In any component
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { role, vendorStatus } = useAuth();
  
  // Check role
  if (role === 'admin') {
    // Admin-specific UI
  }
  
  // Check vendor status
  if (role === 'vendor') {
    if (vendorStatus === 'pending') {
      // Show pending notice
    } else if (vendorStatus === 'approved') {
      // Show vendor features
    } else if (vendorStatus === 'suspended') {
      // Show suspended notice
    }
  }
}
```

## Security Layers

```
┌─────────────────────────────────────────┐
│         1. FRONTEND GUARDS              │
│  • ProtectedRoute component             │
│  • Role and status checks               │
│  • Automatic redirects                  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         2. RLS POLICIES                 │
│  • Row-level security on all tables    │
│  • Vendor approval checks on products  │
│  • Admin-only access to user_roles     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         3. SECURITY DEFINER FUNCTIONS   │
│  • Role checks with elevated privileges│
│  • Admin-only status updates           │
│  • Audit logging                       │
└─────────────────────────────────────────┘
```

## Status Badge Colors

```
🟢 APPROVED   → Green  → bg-primary/10 text-primary
🟡 PENDING    → Yellow → bg-gold/10 text-gold  
🔴 SUSPENDED  → Red    → bg-destructive/10 text-destructive
```

## Implementation Checklist

- ✅ Database migration applied
- ✅ AuthContext updated with vendorStatus
- ✅ ProtectedRoute enhanced with status checks
- ✅ AdminVendors page functional
- ✅ Signup process updated
- ✅ Documentation created
- ⬜ First admin user created (ACTION REQUIRED)
- ⬜ System tested with all user types
- ⬜ Ready for production

---

**Last Updated**: 2026-02-05  
**Version**: 1.0.0  
**Status**: ✅ Implementation Complete
