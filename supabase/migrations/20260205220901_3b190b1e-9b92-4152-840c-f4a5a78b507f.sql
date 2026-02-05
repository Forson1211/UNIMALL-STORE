-- Add vendor_status column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS vendor_status text DEFAULT 'pending' 
CHECK (vendor_status IN ('pending', 'approved', 'suspended'));

-- Update existing vendor rows to have 'pending' status if not set
UPDATE public.user_roles 
SET vendor_status = 'pending' 
WHERE role = 'vendor' AND vendor_status IS NULL;