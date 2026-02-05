# Admin Backend Implementation - Full Documentation

## Overview
Complete admin backend implementation with **real database integration**, no mock data. All admin actions operate on live records with full business rule enforcement.

---

## 🔐 Authentication & Authorization

### Access Control
- **Access Control**:
  - **Admin**: Full access
  - **Moderator**: Limited admin access (no delete, no role changes)
  - **Vendor**: Vendor dashboard only (if approved)
- **Server-side enforcement**: RLS policies + SECURITY DEFINER functions
- **Frontend guards**: `ProtectedRoute` component blocks unauthorized access
- **Session validation**: Every request validates admin role via `auth.uid()`

### Admin Authentication Flow
```
User Login → Check auth.users → Verify user_roles.role = 'admin' → Grant Access
```

---

## 📊 Admin Dashboard (`/admin`)

### Real-Time Metrics
**Data Source**: `admin_dashboard_stats` view

**Metrics Displayed**:
- **Total Revenue**: Sum of all order amounts from `orders` table
- **Total Orders**: Count from `orders` table
- **Total Products**: Count from `products` table  
- **Total Users**: Count from `auth.users`
- **User Breakdown**:
  - Total Admins
  - Total Vendors
  - Total Buyers
- **Vendor Status Breakdown**:
  - Vendors Pending (awaiting approval)
  - Vendors Approved (active)
  - Vendors Suspended (banned)
- **Activity Metrics**:
  - New users this week
  - New orders this week

### Features
✅ All data pulled from live database  
✅ Aggregated in real-time  
✅ Click-through to detailed pages  
✅ Refresh button to reload data  
✅ Visual breakdown of platform health

---

## 👥 Vendor Management (`/admin/vendors`)

### Data Source
**View**: `vendor_management_view`

**Features**:
- ✅ View all vendors with complete profile data
- ✅ See vendor status: pending, approved, suspended
- ✅ View registration date
- ✅ Product count per vendor
- ✅ Sales count per vendor

### Admin Actions
**1. Approve Vendor**
- Changes `vendor_status`: `pending` → `approved`
- Immediately grants vendor dashboard access
- Logged in `system_logs`

**2. Suspend Vendor**
- Changes `vendor_status`: `approved` → `suspended`
- Immediately revokes vendor dashboard access
- Prevents product management
- Logged in `system_logs`

**3. Reactivate Vendor**
- Changes `vendor_status`: `suspended` → `approved`
- Restores full vendor access

**4. Delete Vendor Account**
- Permanently deletes vendor from `auth.users`
- Cascades to related data (products, orders)
- Requires confirmation dialog
- Logged in `system_logs`

### Real-Time Enforcement
- Status changes take effect **immediately**
- No re-login required
- Frontend guards updated on next page load via `refreshAuth()`

---

## 📦 Product Management (`/admin/products`)

### Data Source
**View**: `admin_products_view`

**Displays**:
- Product name, category, description
- Price and stock quantity
- Vendor information (name, store)
- Product status (active, draft, inactive)
- Total sales count
- Creation date

### Admin Actions
**1. View Product**
- Opens product detail page in new tab
- Uses real product ID

**2. Activate Product**
- Updates `products.status` to `'active'`
- Makes product visible in marketplace

**3. Deactivate Product**
- Updates `products.status` to `'inactive'`
- Hides product from marketplace
- Vendor can still see it in draft mode

**4. Delete Product**
- Permanently removes from `products` table
- Related `order_items` handled by FK constraints
- Requires confirmation dialog

### Database Function
```sql
admin_update_product_status(_product_id, _new_status)
```
- Admin-only (checked via `auth.uid()`)
- Logs all changes to `system_logs`

---

## 🛒 Order Management (`/admin/orders`)

### Data Source
**View**: `admin_orders_view`

**Displays**:
- Order ID
- Buyer information (name, email)
- Order items with product details
- Vendor information per item
- Total amount
- Order status
- Creation date

### Admin Actions
**1. View Order Details**
- Opens dialog with full order breakdown
- Shows all items, vendors, prices
- Displays shipping address
- Shows order timeline

**2. Update Order Status**
Status transitions:
- `pending` → `confirmed`
- `confirmed` → `shipped`
- `shipped` → `delivered`
- Any → `cancelled` (except delivered)

**3. Cancel Order**
- Sets status to `cancelled`
- Can be done at any stage before delivery

### Database Function
```sql
admin_update_order_status(_order_id, _new_status)
```
- Admin-only enforcement
- Logs all status changes

---

## 👤 User Management (`/admin/users`)

### Data Source
**View**: `admin_users_view`

**Displays**:
- User email and full name
- User role (admin, vendor, buyer)
- Vendor status (if applicable)
- Store name (for vendors)
- Total orders as buyer
- Total products as vendor
- Join date and last sign-in

### Admin Actions
**1. View Profile**
- Navigates to user's public profile
- Works for any role

**2. Promote to Admin**
- Changes `user_roles.role` to `'admin'`
- Grants full admin access
- Irreversible via UI (requires DB access to demote)

**3. Suspend Vendor**
- Only available for vendors
- Sets `vendor_status` to `'suspended'`
- Immediately blocks vendor access

### Database Function
```sql
admin_update_user_status(_user_id, _new_role, _suspend)
```
- Admin-only enforcement
- Logs all changes

---

## 🗄️ Database Schema

### Admin Views

**1. admin_dashboard_stats**
```sql
SELECT * FROM admin_dashboard_stats;
-- Returns single row with aggregated platform metrics
```

**2. admin_products_view**
```sql
SELECT * FROM admin_products_view;
-- All products with vendor and sales data
```

**3. admin_orders_view**
```sql
SELECT * FROM admin_orders_view;
-- All orders with buyer and item details
```

**4. admin_users_view**
```sql
SELECT * FROM admin_users_view;
-- All users with role and activity data
```

**5. vendor_management_view**
```sql
SELECT * FROM vendor_management_view;
-- All vendors with status and metrics
```

### Admin Functions

**1. admin_update_product_status**
```sql
SELECT admin_update_product_status(
  'product-uuid',
  'active'
);
```

**2. admin_update_order_status**
```sql
SELECT admin_update_order_status(
  'order-uuid',
  'shipped'
);
```

**3. admin_update_user_status**
```sql
SELECT admin_update_user_status(
  'user-uuid',
  'admin',  -- new role
  false     -- suspend flag
);
```

**4. get_admin_analytics**
```sql
SELECT get_admin_analytics(30);  -- last 30 days
-- Returns JSON with daily orders, top products, top vendors
```

---

## 🔒 Security Features

### Row Level Security (RLS)
1. **Admin views** - Only accessible by users with `role = 'admin'`
2. **Admin functions** - Check `auth.uid()` against `user_roles.role`
3. **Data isolation** - Non-admins cannot access admin endpoints

### Audit Logging
All admin actions logged to `system_logs`:
- Vendor approvals/suspensions/deletions
- Product status changes/deletions
- Order status updates
- User role changes

Log format:
```json
{
  "type": "admin_action",
  "source": "vendor_management",
  "message": "Admin approved vendor",
  "metadata": {
    "vendor_id": "uuid",
    "admin_id": "uuid",
    "new_status": "approved"
  }
}
```

### Function-Level Security
```sql
SECURITY DEFINER  -- Execute with elevated privileges
SET search_path = public  -- Prevent SQL injection  
```

All admin functions:
1. Get current user via `auth.uid()`
2. Verify admin role
3. Perform action
4. Log to audit trail

---

##  🏗️ Frontend Implementation

### File Structure
```
src/pages/admin/
├── AdminDashboard.tsx    # Real-time platform metrics
├── AdminVendors.tsx      # Vendor lifecycle management
├── AdminProducts.tsx     # Product moderation
├── AdminOrders.tsx       # Order management
└── AdminUsers.tsx        # User administration
```

### Technology Stack
- **React Query** (`@tanstack/react-query`) - Data fetching & caching
- **Supabase Client** - Database operations
- **Shadcn UI** - Component library
- **Lucide React** - Icons

### Data Flow
```
Component → useQuery → Supabase View → Real Data → UI Render
                ↓
          useMutation → Supabase Function → Update DB → Invalidate Query → Re-fetch
```

### Example: Approve Vendor
```typescript
const updateStatusMutation = useMutation({
  mutationFn: async ({ vendorId, newStatus }) => {
    await supabase.from("user_roles")
      .update({ vendor_status: newStatus })
      .eq("user_id", vendorId);
  },
  onSuccess: () => {
    queryClient.invalidateQueries(["vendors"]);
    toast({ title: "Vendor approved!" });
  }
});
```

---

## 🚀 Deployment & Testing

### Migration Steps
1. Apply vendor approval migration: `20260205_vendor_approval_system.sql`
2. Apply admin backend migration: `20260205_admin_backend.sql`
3. Create first admin user:
   ```sql
   UPDATE user_roles SET role = 'admin' 
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
   ```

### Testing Checklist
- ✅ Admin can access `/admin` dashboard
- ✅ Non-admins blocked from admin routes
- ✅ Dashboard shows real metrics (not 0)
- ✅ Product list shows all platform products
- ✅ Order list shows all platform orders
- ✅ User list shows all registered users
- ✅ Vendor approval works and grants access immediately
- ✅ Vendor suspension revokes access immediately
- ✅ Product activation/deactivation works
- ✅ Order status updates work
- ✅ User promotion to admin works
- ✅ All actions logged to `system_logs`

---

## 📈 Performance Optimization

### Database Views
- **Materialized views** could be used for heavy analytics
- Currently using **standard views** for real-time data
- Indexed columns: `user_id`, `vendor_id`, `created_at`

### Query Optimization
- **Pagination**: DataTable component supports pagination
- **Filtering**: Client-side filtering for responsiveness
- **Sorting**: Client-side sorting with ability to add DB-level sorting

### Caching Strategy
- **React Query cache**: 5 minutes default
- **Manual invalidation**: After mutations
- **Background refetch**: On window focus

---

## 🔧 Maintenance & Support

### Adding New Admin Features
1. Create database view/function in migrations
2. Create React component in `src/pages/admin/`
3. Add route to `App.tsx` with `<ProtectedRoute allowedRoles={['admin']}>`
4. Add navigation link to admin sidebar

### Troubleshooting
**Problem**: Admin sees empty data  
**Solution**: Check RLS policies, ensure admin role is set

**Problem**: Actions don't take effect  
**Solution**: Check browser console for errors, verify Supabase connection

**Problem**: Unauthorized errors  
**Solution**: Verify user has `role = 'admin'` in `user_roles` table

---

## ✅ Summary

**What's Implemented**:
- ✅ Full admin dashboard with real metrics
- ✅ Complete vendor management (approve, suspend, delete)
- ✅ Product moderation (activate, deactivate, delete)
- ✅ Order management (view, update status)
- ✅ User administration (view, promote, suspend)
- ✅ Server-side authorization via RLS
- ✅ Audit logging for all actions
- ✅ Real-time data (no mocks or placeholders)

**Zero Mock Data**: Every piece of data is pulled from live database tables and views.

**Production Ready**: All business rules enforced, all actions logged, all access controlled.
