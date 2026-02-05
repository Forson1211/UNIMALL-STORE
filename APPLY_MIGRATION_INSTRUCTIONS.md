# ⚠️ IMPORTANT: Apply Database Migration First

## The TypeScript errors you're seeing are because the database migration hasn't been applied yet.

### Step 1: Apply the Migration to Supabase

You have two options:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file: `supabase/migrations/20260205_vendor_approval_system.sql`
5. Copy the ENTIRE contents of that file
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for confirmation that the migration succeeded

#### Option B: Using Supabase CLI (if you have it installed)
```bash
# From your project root
supabase db push
```

### Step 2: Verify the Migration Worked

Run this query in Supabase SQL Editor to verify:
```sql
-- Check if vendor_status column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
  AND column_name = 'vendor_status';

-- Should return one row showing the vendor_status column
```

### Step 3: After Migration is Applied

Once the migration is successfully applied, the TypeScript errors should resolve because:
- The `vendor_status` column will exist in `user_roles` table
- The `system_logs` table will exist
- All the RPC functions will be created

### If Errors Persist After Migration

If you still see TypeScript errors after applying the migration, you may need to regenerate the Supabase types:

```bash
# If you have Supabase CLI installed
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

---

## Quick Test After Migration

After applying the migration, test it with this SQL query:

```sql
-- View all vendors and their status
SELECT 
  u.email,
  ur.role,
  ur.vendor_status
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'vendor';
```

This should show all vendors with their approval status.
