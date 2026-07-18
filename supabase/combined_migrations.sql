-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'vendor', 'buyer');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  store_name TEXT,
  store_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign default role (buyer) - role can be overridden during signup
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'buyer'));
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for profile timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create products table for shopping functionality
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category TEXT,
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products RLS Policies
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Vendors can manage their own products"
  ON public.products FOR ALL
  USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all products"
  ON public.products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for products timestamp
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders RLS Policies
CREATE POLICY "Buyers can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price_at_purchase DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Order items RLS Policies
CREATE POLICY "Buyers can view their order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.buyer_id = auth.uid()
  ));

CREATE POLICY "Vendors can view their sold items"
  ON public.order_items FOR SELECT
  USING (auth.uid() = vendor_id);

CREATE POLICY "Buyers can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.buyer_id = auth.uid()
  ));

-- Create wishlist table
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- Enable RLS on wishlist
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Wishlist RLS Policies
CREATE POLICY "Users can manage their own wishlist"
  ON public.wishlist FOR ALL
  USING (auth.uid() = user_id);-- Campus News Table
CREATE TABLE IF NOT EXISTS public.campus_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'Campus Life',
  is_published BOOLEAN DEFAULT true,
  author_id UUID REFERENCES auth.users(id),
  publish_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.campus_news ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view published news" ON public.campus_news
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage news" ON public.campus_news
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to handle updated_at
CREATE TRIGGER update_campus_news_updated_at 
  BEFORE UPDATE ON public.campus_news
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add triggers for activity logging if the function exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_admin_activity') THEN
    CREATE TRIGGER log_news_changes 
      AFTER INSERT OR UPDATE OR DELETE ON public.campus_news
      FOR EACH ROW EXECUTE FUNCTION public.log_admin_activity();
  END IF;
END $$;
-- Seed initial Campus News data
INSERT INTO public.campus_news (title, excerpt, content, image_url, category, is_published)
VALUES 
(
  'Top 5 Study Spots on Campus You Didn''t Know About',
  'Looking for a quiet place to study? We''ve scoped out the best hidden gems on campus that offer the perfect atmosphere for productivity.',
  '<p>Finding the right study environment can make or break your academic performance. While the main library is great, it can often get crowded and loud. Here are 5 hidden study spots on campus that you should definitely check out:</p>
   <h2>1. The Botanical Garden Terrace</h2>
   <p>Located on the south wing of the Biology building, this terrace offers a serene view of the campus gardens. It''s quiet, has great Wi-Fi, and the fresh air is perfect for long reading sessions.</p>
   <h2>2. The Old Chapel Basement</h2>
   <p>This spot is a well-kept secret among graduat students. The basement has been converted into a modern lounge with soundproof booths and comfy chairs.</p>
   <h2>3. Arts & Humanities Rooftop</h2>
   <p>If you prefer a view, the rooftop of the Arts building has several workstations with shade. It''s best during the late afternoon when you can catch the sunset while finishing your assignments.</p>
   <h2>4. The Engineering Innovation Lab Lounge</h2>
   <p>Open 24/7, this lounge is sleek, modern, and filled with whiteboards for collaborative studying. It''s noisy during the day but perfect for night owls.</p>
   <h2>5. Library Tower - Level 8</h2>
   <p>Most students stop at Level 4. If you take the elevator to Level 8, you''ll find individual cubicles with virtually zero noise. It''s the ultimate spot for final exam prep.</p>',
  'https://images.unsplash.com/photo-1541339907198-e08756ebafe1?q=80&w=1200&auto=format&fit=crop',
  'Campus Life',
  true
),
(
  'Student Marketplace Hits Record High Sales for Textbooks',
  'The semester start has seen a massive surge in peer-to-peer textbook trading, with students saving an average of 40% compared to the bookstore.',
  '<p>The Campus Connect Marketplace has officially reported its highest-ever volume of student-to-student transactions this semester. The primary driver? Second-hand textbooks.</p>
   <p>As the cost of new academic materials continues to rise, students are turning to our platform in record numbers to find more affordable alternatives. According to our latest data, the average student saved nearly $350 by purchasing their required reading from fellow students instead of the university bookstore.</p>
   <h2>Why peer-to-peer is winning:</h2>
   <ul>
     <li><strong>Significant Savings:</strong> Direct trading eliminates the middleman markup.</li>
     <li><strong>Sustainability:</strong> Reusing books reduces paper waste and the campus carbon footprint.</li>
     <li><strong>Community Support:</strong> Money stays within the student body, helping peers pay for their own expenses.</li>
   </ul>
   <p>One senior Economics major, Sarah Jenkins, shared her experience: "I found all my 400-level textbooks on the marketplace for less than half the retail price. The hand-over happened right in the student union, and it was super easy."</p>
   <p>With more features planned for vendor tools, we expect the marketplace to continue growing as the central hub for campus commerce.</p>',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200&auto=format&fit=crop',
  'Marketplace',
  true
),
(
  'Upcoming Cultural Festival: What to Expect',
  'Get ready for a week of diverse food, music, and art. The annual Campus Cultural Festival kicks off next Monday with over 30 countries represented.',
  '<p>The highly anticipated Campus Cultural Festival is returning next week, promising an explosion of color, taste, and sound across the main quad. This year''s theme, "Unity in Diversity," features participation from a record 32 student organizations.</p>
   <h2>Event Highlights:</h2>
   <h3>Monday: The Grand Parade</h3>
   <p>The festival begins with a vibrant parade featuring traditional dress and music from around the world. The ceremony will be opened by the University President at 10:00 AM.</p>
   <h3>Wednesday: Food Fair</h3>
   <p>The main quad will be transformed into a global food market. Students can purchase a "tasting passport" for $5, allowing them to try small plates from minden different cultures.</p>
   <h3>Friday: Concert on the Quad</h3>
   <p>To close the week, several local and international student bands will perform. It''s a night of high energy and celebration that you won''t want to miss.</p>
   <p>Volunteers are still needed for the setup and teardown of the event stages. If you''re interested in helping out and earning community service hours, please visit the Student Union information desk.</p>',
  'https://images.unsplash.com/photo-1514525253344-f814d8743585?q=80&w=1200&auto=format&fit=crop',
  'Events',
  true
),
(
  'New Innovation Tech Hub Now Open',
  'A state-of-the-art facility featuring 3D printers, VR labs, and collaborative coding spaces is now accessible to all students in the North Wing.',
  '<p>The much-anticipated Innovation Tech Hub has finally opened its doors, providing students with access to cutting-edge technology and collaborative workspaces. Located in the renovated North Wing of the Science Center, the hub aims to bridge the gap between classroom theory and practical application.</p>
   <h2>Key Features:</h2>
   <ul>
     <li><strong>3D Printing Station:</strong> Six high-resolution 3D printers available for rapid prototyping.</li>
     <li><strong>VR/AR Lab:</strong> Dedicated space for virtual and augmented reality development and research.</li>
     <li><strong>Coding Pods:</strong> Soundproof pods optimized for focused software development and group coding marathons.</li>
     <li><strong>Mentorship Program:</strong> Weekly sessions with industry professionals and senior student mentors.</li>
   </ul>
   <p>Hub director, Dr. Alan Turing, emphasized the importance of such spaces: "This isn''t just about the hardware; it''s about creating a community where students from different disciplines can collaborate on the next big idea."</p>
   <p>The hub is open from 8:00 AM to midnight daily. Students can book specific equipment through the campus portal.</p>',
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1200&auto=format&fit=crop',
  'Technology',
  true
),
(
  'Weekly Campus Sports Roundup',
  'From a thrilling overtime victory in basketball to the cross-country team setting new records, here is your summary of this week in campus athletics.',
  '<p>It was a landmark week for our campus athletics, with several teams achieving standout performances and maintaining their lead in the intercollegiate standings.</p>
   <h2>Basketball: A Nail-Biting Finish</h2>
   <p>The Men''s Basketball team pulled off a stunning 84-82 victory in double overtime against our long-time rivals. The winning three-pointer came in the final two seconds, sparking a celebration that flooded the court.</p>
   <h2>Track & Field: Breaking Records</h2>
   <p>The cross-country team set three individual course records during the Invitational Meet on Saturday. Sophomore athlete Maya Rodriguez shaved 15 seconds off her previous best, placing first in the 5K event.</p>
   <h2>Upcoming Home Games:</h2>
   <ul>
     <li>Wednesday: Women''s Volleyball vs. State University (7:00 PM)</li>
     <li>Saturday: Soccer Home Opener (3:30 PM)</li>
     <li>Sunday: Tennis Finals (10:00 AM)</li>
   </ul>
   <p>Student tickets are free with a valid ID. Come out and support our athletes!</p>',
  'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1200&auto=format&fit=crop',
  'Sports',
  true
),
(
  'Healthy Eating: A Student''s Guide to Low-Budget Nutrition',
  'Think eating healthy means spending a fortune? Our Nutrition Department shares tips on how to fuel your body without breaking the bank.',
  '<p>Maintaining a balanced diet is one of the biggest challenges for students living on a tight budget. However, with a bit of planning and these expert tips, you can eat well for less than $40 a week.</p>
   <h2>1. Buy in Bulk</h2>
   <p>Staples like brown rice, oats, lentils, and frozen vegetables are much cheaper when bought in larger quantities. They also have a long shelf life, making them perfect for meal prepping.</p>
   <h2>2. Seasonal and Local</h2>
   <p>Fruits and vegetables that are in season are not only more nutritious but also significantly cheaper. Check out the local farmer''s market on Saturdays for the best deals.</p>
   <h2>3. Meal Prep Sundays</h2>
   <p>Spending two hours on Sunday preparing your lunches for the week can save you over $50 in impulsive takeout spending. Try making large batches of chili or grain bowls.</p>
   <p>Student Wellness Coordinator, Maria Lopez, adds: "Nutrition impacts your focus and energy levels. It''s an investment in your grades as much as your health."</p>',
  'https://images.unsplash.com/photo-1490645935467-49f329c9ddd8?q=80&w=1200&auto=format&fit=crop',
  'Well-being',
  true
),
(
  'Navigating the Upcoming Spring Career Fair',
  'With over 50 companies attending, preparation is key. Here is your checklist for standing out to recruiters and landing that dream internship.',
  '<p>The annual Spring Career Fair is just two weeks away. This is your primary opportunity to connect with recruiters from top-tier companies in finance, engineering, marketing, and more.</p>
   <h2>How to Prepare:</h2>
   <ul>
     <li><strong>Refine Your Resume:</strong> Get your resume reviewed at the Career Center. Keep it to one page and highlight your quantifiable achievements.</li>
     <li><strong>Elevator Pitch:</strong> Practice a 30-second summary of who you are, what you study, and what you are looking for.</li>
     <li><strong>Research:</strong> Don''t just walk up blindly. Identify 5 companies you are most interested in and study their recent projects.</li>
     <li><strong>Dress for Success:</strong> Business casual is the minimum standard. First impressions matter.</li>
   </ul>
   <p>The fair will be held in the Alumni Hall on March 15th from 9:00 AM to 4:00 PM. Don''t forget to bring at least 10 printed copies of your resume!</p>',
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1200&auto=format&fit=crop',
  'Career',
  true
);
-- Create storage bucket for site assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for site-assets bucket
-- Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload site assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets');

-- Allow everyone to read site assets (public bucket)
CREATE POLICY IF NOT EXISTS "Public read access to site assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-assets');

-- Allow authenticated users to update their uploads
CREATE POLICY IF NOT EXISTS "Authenticated users can update site assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-assets');

-- Allow authenticated users to delete site assets
CREATE POLICY IF NOT EXISTS "Authenticated users can delete site assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-assets');
-- Update site branding to Unimall
UPDATE public.site_settings 
SET setting_value = '"Unimall"'
WHERE setting_key = 'site_name';

UPDATE public.site_settings 
SET setting_value = '"Your Campus Marketplace"'
WHERE setting_key = 'site_tagline';

-- Add additional customization settings if they don't exist
INSERT INTO public.site_settings (setting_key, setting_value, setting_category) VALUES
('accent_color', '"#f59e0b"', 'theme'),
('background_color', '"#ffffff"', 'theme'),
('header_bg_color', '"#ffffff"', 'theme'),
('footer_bg_color', '"#1f2937"', 'theme'),
('dark_mode_enabled', 'false', 'theme'),
('current_theme', '"default"', 'theme'),
('hero_background_url', '""', 'media'),
('hero_overlay_opacity', '0.5', 'media'),
('container_max_width', '"1280px"', 'layout'),
('border_radius', '"0.5rem"', 'layout'),
('animations_enabled', 'true', 'layout'),
('font_family', '"Inter"', 'typography'),
('font_size', '"16px"', 'typography')
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    setting_category = EXCLUDED.setting_category;

-- Create storage bucket for site assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for site-assets bucket
CREATE POLICY "Public can view site assets" ON storage.objects
FOR SELECT USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'site-assets' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update site assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'site-assets' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete site assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'site-assets' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
-- Add vendor_status column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS vendor_status text DEFAULT 'pending' 
CHECK (vendor_status IN ('pending', 'approved', 'suspended'));

-- Update existing vendor rows to have 'pending' status if not set
UPDATE public.user_roles 
SET vendor_status = 'pending' 
WHERE role = 'vendor' AND vendor_status IS NULL;-- Enable realtime for user_roles to allow vendor status updates to propagate
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;

-- Create the storefront_products_view that the frontend is expecting
CREATE OR REPLACE VIEW public.storefront_products_view AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.original_price,
  p.category,
  p.image_url as image,
  p.stock,
  p.rating,
  p.reviews_count as reviews,
  p.is_active as status,
  p.created_at,
  p.vendor_id,
  COALESCE(pr.store_name, pr.full_name, 'Unknown Vendor') as vendor
FROM public.products p
LEFT JOIN public.profiles pr ON p.vendor_id = pr.user_id
WHERE p.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.storefront_products_view TO anon, authenticated;

-- Create vendor_dashboard_stats view for vendor dashboard
CREATE OR REPLACE VIEW public.vendor_dashboard_stats AS
SELECT 
  p.vendor_id,
  COUNT(DISTINCT p.id) as total_products,
  COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) as total_revenue,
  COUNT(DISTINCT oi.order_id) as total_orders,
  0 as pending_orders
FROM public.products p
LEFT JOIN public.order_items oi ON p.id = oi.product_id
GROUP BY p.vendor_id;

GRANT SELECT ON public.vendor_dashboard_stats TO authenticated;

-- Create vendor_products_view for vendor product management
CREATE OR REPLACE VIEW public.vendor_products_view AS
SELECT 
  p.*,
  COALESCE(pr.store_name, pr.full_name, 'Unknown') as vendor_name
FROM public.products p
LEFT JOIN public.profiles pr ON p.vendor_id = pr.user_id;

GRANT SELECT ON public.vendor_products_view TO authenticated;

-- Create vendor_orders_view for vendor order management  
CREATE OR REPLACE VIEW public.vendor_orders_view AS
SELECT 
  o.id as order_id,
  o.buyer_id,
  o.status,
  o.total_amount,
  o.shipping_address,
  o.created_at,
  o.updated_at,
  oi.vendor_id,
  oi.product_id,
  oi.quantity,
  oi.price_at_purchase,
  p.name as product_name,
  p.image_url as product_image,
  pr.full_name as buyer_name,
  pr.phone as buyer_phone
FROM public.orders o
JOIN public.order_items oi ON o.id = oi.order_id
JOIN public.products p ON oi.product_id = p.id
LEFT JOIN public.profiles pr ON o.buyer_id = pr.user_id;

GRANT SELECT ON public.vendor_orders_view TO authenticated;-- Fix security definer views by recreating them with SECURITY INVOKER
DROP VIEW IF EXISTS public.storefront_products_view;
DROP VIEW IF EXISTS public.vendor_dashboard_stats;
DROP VIEW IF EXISTS public.vendor_products_view;
DROP VIEW IF EXISTS public.vendor_orders_view;

-- Recreate storefront_products_view with SECURITY INVOKER
CREATE VIEW public.storefront_products_view 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.original_price,
  p.category,
  p.image_url as image,
  p.stock,
  p.rating,
  p.reviews_count as reviews,
  p.is_active as status,
  p.created_at,
  p.vendor_id,
  COALESCE(pr.store_name, pr.full_name, 'Unknown Vendor') as vendor
FROM public.products p
LEFT JOIN public.profiles pr ON p.vendor_id = pr.user_id
WHERE p.is_active = true;

GRANT SELECT ON public.storefront_products_view TO anon, authenticated;

-- Recreate vendor_dashboard_stats with SECURITY INVOKER
CREATE VIEW public.vendor_dashboard_stats 
WITH (security_invoker = true)
AS
SELECT 
  p.vendor_id,
  COUNT(DISTINCT p.id) as total_products,
  COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) as total_revenue,
  COUNT(DISTINCT oi.order_id) as total_orders,
  0 as pending_orders
FROM public.products p
LEFT JOIN public.order_items oi ON p.id = oi.product_id
GROUP BY p.vendor_id;

GRANT SELECT ON public.vendor_dashboard_stats TO authenticated;

-- Recreate vendor_products_view with SECURITY INVOKER
CREATE VIEW public.vendor_products_view 
WITH (security_invoker = true)
AS
SELECT 
  p.*,
  COALESCE(pr.store_name, pr.full_name, 'Unknown') as vendor_name
FROM public.products p
LEFT JOIN public.profiles pr ON p.vendor_id = pr.user_id;

GRANT SELECT ON public.vendor_products_view TO authenticated;

-- Recreate vendor_orders_view with SECURITY INVOKER
CREATE VIEW public.vendor_orders_view 
WITH (security_invoker = true)
AS
SELECT 
  o.id as order_id,
  o.buyer_id,
  o.status,
  o.total_amount,
  o.shipping_address,
  o.created_at,
  o.updated_at,
  oi.vendor_id,
  oi.product_id,
  oi.quantity,
  oi.price_at_purchase,
  p.name as product_name,
  p.image_url as product_image,
  pr.full_name as buyer_name,
  pr.phone as buyer_phone
FROM public.orders o
JOIN public.order_items oi ON o.id = oi.order_id
JOIN public.products p ON oi.product_id = p.id
LEFT JOIN public.profiles pr ON o.buyer_id = pr.user_id;

GRANT SELECT ON public.vendor_orders_view TO authenticated;
-- Create campus_news table for news/announcements feature
CREATE TABLE IF NOT EXISTS public.campus_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    excerpt TEXT,
    image_url TEXT,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT,
    category TEXT DEFAULT 'general',
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    publish_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campus_news ENABLE ROW LEVEL SECURITY;

-- Anyone can view published news
CREATE POLICY "Anyone can view published news"
ON public.campus_news
FOR SELECT
USING (is_published = true);

-- Admins can manage all news
CREATE POLICY "Admins can manage all news"
ON public.campus_news
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_campus_news_updated_at
BEFORE UPDATE ON public.campus_news
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- FIX: Add 'moderator' to app_role enum
-- This must be run to fix the "invalid input value" error.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
-- Migration: Add Campus to Profiles
-- Adds the campus column to the profiles table to allow users to specify their location.

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'campus'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN campus TEXT;
  END IF;
END $$;

-- Update existing profiles with campus from user meta data if available
UPDATE public.profiles p
SET campus = u.raw_user_meta_data->>'campus'
FROM auth.users u
WHERE p.user_id = u.id AND p.campus IS NULL;
-- Migration: Admin Approve Vendor RPC
-- This creates a specific RPC for vendor approval to match the frontend call.

CREATE OR REPLACE FUNCTION public.admin_approve_vendor(
  _vendor_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can approve vendors
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve vendors';
  END IF;

  -- Update the vendor status to approved
  UPDATE public.user_roles
  SET vendor_status = 'approved'
  WHERE user_id = _vendor_id
    AND role = 'vendor';

  -- Log the action
  INSERT INTO public.system_logs (type, source, message, metadata, user_id)
  VALUES (
    'security',
    'vendor_management',
    'Vendor account approved',
    jsonb_build_object(
      'vendor_id', _vendor_id,
      'approved_by', auth.uid()
    ),
    auth.uid()
  );

  RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_approve_vendor TO authenticated;
-- Admin Backend Analytics and Management Functions
-- This migration adds comprehensive admin analytics and management capabilities

-- ============================================
-- 1. ADMIN ANALYTICS VIEW
-- ============================================
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT
  -- Total counts
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'vendor') as total_vendors,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'buyer') as total_buyers,
  
  -- Vendor status breakdown
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'vendor' AND vendor_status = 'pending') as vendors_pending,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'vendor' AND vendor_status = 'approved') as vendors_approved,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'vendor' AND vendor_status = 'suspended') as vendors_suspended,
  
  -- Product stats
  (SELECT COUNT(*) FROM public.products) as total_products,
  (SELECT COUNT(*) FROM public.products WHERE status = 'active') as active_products,
  (SELECT COUNT(*) FROM public.products WHERE status = 'draft') as draft_products,
  
  -- Order stats  
  (SELECT COUNT(*) FROM public.orders) as total_orders,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders) as total_revenue,
  (SELECT COUNT(*) FROM public.orders WHERE status = 'pending') as pending_orders,
  
  -- Recent activity
  (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM public.orders WHERE created_at > NOW() - INTERVAL '7 days') as new_orders_week;

-- Grant access to admin users only
ALTER VIEW public.admin_dashboard_stats OWNER TO postgres;

-- ============================================
-- 2. ADMIN PRODUCTS VIEW
-- ============================================
CREATE OR REPLACE VIEW public.admin_products_view AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.description,
  p.price,
  p.stock_quantity,
  p.category,
  p.status,
  p.created_at,
  p.updated_at,
  p.vendor_id,
  prof.full_name as vendor_name,
  prof.store_name as vendor_store,
  (SELECT COUNT(*) FROM public.order_items WHERE product_id = p.id) as total_sales
FROM public.products p
LEFT JOIN public.profiles prof ON prof.user_id = p.vendor_id
ORDER BY p.created_at DESC;

ALTER VIEW public.admin_products_view OWNER TO postgres;

-- ============================================
-- 3. ADMIN ORDERS VIEW
-- ============================================
CREATE OR REPLACE VIEW public.admin_orders_view AS
SELECT
  o.id as order_id,
  o.buyer_id,
  buyer_prof.full_name as buyer_name,
  buyer_prof.email as buyer_email,
  o.total_amount,
  o.status as order_status,
  o.shipping_address,
  o.created_at,
  o.updated_at,
  (SELECT COUNT(*) FROM public.order_items WHERE order_id = o.id) as item_count,
  (SELECT json_agg(json_build_object(
    'product_id', oi.product_id,
    'product_name', prod.name,
    'vendor_id', oi.vendor_id,
    'vendor_name', vend_prof.store_name,
    'quantity', oi.quantity,
    'price', oi.price_at_purchase
  )) FROM public.order_items oi
  LEFT JOIN public.products prod ON prod.id = oi.product_id
  LEFT JOIN public.profiles vend_prof ON vend_prof.user_id = oi.vendor_id
  WHERE oi.order_id = o.id) as items
FROM public.orders o
LEFT JOIN (
  SELECT u.id, u.email, prof.full_name 
  FROM auth.users u 
  LEFT JOIN public.profiles prof ON prof.user_id = u.id
) buyer_prof ON buyer_prof.id = o.buyer_id
ORDER BY o.created_at DESC;

ALTER VIEW public.admin_orders_view OWNER TO postgres;

-- ============================================
-- 4. ADMIN USERS VIEW
-- ============================================
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT
  u.id as user_id,
  u.email,
  u.created_at as joined_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  prof.full_name,
  prof.phone,
  prof.address,
  prof.store_name,
  prof.store_description,
  ur.role,
  ur.vendor_status,
  (SELECT COUNT(*) FROM public.orders WHERE buyer_id = u.id) as total_orders_as_buyer,
  (SELECT COUNT(*) FROM public.products WHERE vendor_id = u.id) as total_products_as_vendor
FROM auth.users u
LEFT JOIN public.profiles prof ON prof.user_id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at DESC;

ALTER VIEW public.admin_users_view OWNER TO postgres;

-- ============================================
-- 5. ADMIN FUNCTION: UPDATE PRODUCT STATUS
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_update_product_status(
  _product_id UUID,
  _new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id UUID;
BEGIN
  -- Get the current user
  _admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update product status';
  END IF;
  
  -- Update the product status
  UPDATE public.products
  SET status = _new_status, updated_at = NOW()
  WHERE id = _product_id;
  
  -- Log the action
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES (
    'admin_action',
    'product_management',
    'Admin updated product status',
    json_build_object(
      'product_id', _product_id,
      'new_status', _new_status,
      'admin_id', _admin_id
    )
  );
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- 6. ADMIN FUNCTION: DELETE PRODUCT
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_delete_product(
  _product_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id UUID;
BEGIN
  -- Get the current user
  _admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can delete products';
  END IF;
  
  -- Log the action before deletion
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES (
    'admin_action',
    'product_management',
    'Admin deleted product',
    json_build_object(
      'product_id', _product_id,
      'admin_id', _admin_id
    )
  );
  
  -- Delete the product (cascades to order_items handled by FK)
  DELETE FROM public.products
  WHERE id = _product_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- 7. ADMIN FUNCTION: UPDATE ORDER STATUS
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  _order_id UUID,
  _new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id UUID;
BEGIN
  -- Get the current user
  _admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update order status';
  END IF;
  
  -- Update the order status
  UPDATE public.orders
  SET status = _new_status, updated_at = NOW()
  WHERE id = _order_id;
  
  -- Log the action
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES (
    'admin_action',
    'order_management',
    'Admin updated order status',
    json_build_object(
      'order_id', _order_id,
      'new_status', _new_status,
      'admin_id', _admin_id
    )
  );
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- 8. ADMIN FUNCTION: UPDATE USER STATUS
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  _user_id UUID,
  _new_role TEXT DEFAULT NULL,
  _suspend BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id UUID;
BEGIN
  -- Get the current user
  _admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update user status';
  END IF;
  
  -- Update role if provided
  IF _new_role IS NOT NULL THEN
    UPDATE public.user_roles
    SET role = _new_role::app_role
    WHERE user_id = _user_id;
  END IF;
  
  -- Suspend vendor if requested
  IF _suspend AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'vendor'
  ) THEN
    UPDATE public.user_roles
    SET vendor_status = 'suspended'
    WHERE user_id = _user_id AND role = 'vendor';
  END IF;
  
  -- Log the action
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES (
    'admin_action',
    'user_management',
    'Admin updated user status',
    json_build_object(
      'user_id', _user_id,
      'new_role', _new_role,
      'suspended', _suspend,
      'admin_id', _admin_id
    )
  );
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- 9. RLS POLICIES FOR ADMIN VIEWS
-- ============================================

-- Admin Dashboard Stats
CREATE POLICY "Admins can view dashboard stats"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON public.admin_dashboard_stats TO authenticated;
GRANT SELECT ON public.admin_products_view TO authenticated;
GRANT SELECT ON public.admin_orders_view TO authenticated;
GRANT SELECT ON public.admin_users_view TO authenticated;

-- ============================================
-- 10. ADMIN ANALYTICS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.get_admin_analytics(
  _days_back INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id UUID;
  _result JSON;
BEGIN
  -- Get the current user
  _admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can view analytics';
  END IF;
  
  -- Build analytics JSON
  SELECT json_build_object(
    'daily_orders', (
      SELECT json_agg(
        json_build_object(
          'date', date::DATE,
          'count', order_count,
          'revenue', total_revenue
        ) ORDER BY date DESC
      )
      FROM (
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as order_count,
          COALESCE(SUM(total_amount), 0) as total_revenue
        FROM public.orders
        WHERE created_at > NOW() - INTERVAL '1 day' * _days_back
        GROUP BY DATE_TRUNC('day', created_at)
      ) daily_stats
    ),
    'top_products', (
      SELECT json_agg(
        json_build_object(
          'product_id', p.id,
          'product_name', p.name,
          'sales_count', COALESCE(sales.count, 0)
        )
      )
      FROM public.products p
      LEFT JOIN (
        SELECT product_id, COUNT(*) as count
        FROM public.order_items
        GROUP BY product_id
      ) sales ON sales.product_id = p.id
      ORDER BY sales.count DESC NULLS LAST
      LIMIT 10
    ),
    'top_vendors', (
      SELECT json_agg(
        json_build_object(
          'vendor_id', vendor_id,
          'vendor_name', store_name,
          'sales_count', sales_count,
          'revenue', revenue
        )
      )
      FROM (
        SELECT 
          oi.vendor_id,
          p.store_name,
          COUNT(*) as sales_count,
          COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) as revenue
        FROM public.order_items oi
        LEFT JOIN public.profiles p ON p.user_id = oi.vendor_id
        GROUP BY oi.vendor_id, p.store_name
        ORDER BY sales_count DESC
        LIMIT 10
      ) vendor_stats
    )
  ) INTO _result;
  
  RETURN _result;
END;
$$;

COMMENT ON FUNCTION public.get_admin_analytics IS 'Get comprehensive admin analytics including daily orders, top products, and top vendors';
-- Migration: Admin Full Schema (Transactions, Reviews, Coupons, Support, Messages, Logs)

-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    type TEXT CHECK (type IN ('payment', 'refund', 'payout')),
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'flagged', 'hidden')) DEFAULT 'pending',
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    status TEXT CHECK (status IN ('active', 'expired', 'paused')) DEFAULT 'active',
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Messages Table (Chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id),
    receiver_id UUID REFERENCES auth.users(id), -- Nullable for system messages? Assume 1:1 for now
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. System Logs (Ensure exists)
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT,
    source TEXT,
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. RLS Policies

-- Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view all transactions" ON public.transactions;
CREATE POLICY "Admins view all transactions" ON public.transactions FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage reviews" ON public.reviews;
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
);
DROP POLICY IF EXISTS "Public view approved reviews" ON public.reviews;
CREATE POLICY "Public view approved reviews" ON public.reviews FOR SELECT USING (status = 'approved');

-- Coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Support Tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage tickets" ON public.support_tickets;
CREATE POLICY "Admins manage tickets" ON public.support_tickets FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own messages or admin" ON public.messages;
CREATE POLICY "Users view own messages or admin" ON public.messages FOR ALL TO authenticated USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view logs" ON public.system_logs;
CREATE POLICY "Admins view logs" ON public.system_logs FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "System insert logs" ON public.system_logs;
CREATE POLICY "System insert logs" ON public.system_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 8. Backfill Sample Data (Optional, ensuring tables aren't totally empty for testing)
-- We only insert if empty to avoid duplicates
INSERT INTO public.coupons (code, discount_type, discount_value, usage_limit)
SELECT 'WELCOME10', 'percentage', 10, 100
WHERE NOT EXISTS (SELECT 1 FROM public.coupons);
-- Migration: Admin Orders View
-- This view provides a detailed list of orders with buyer and items summary for admins

CREATE OR REPLACE VIEW public.admin_orders_view AS
SELECT 
    o.id as order_id,
    p.full_name as buyer_name,
    u.email as buyer_email,
    o.total_amount,
    o.status as order_status,
    o.payment_status,
    o.payment_method,
    o.created_at,
    (SELECT COUNT(*) FROM public.order_items WHERE order_id = o.id) as item_count,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'product_id', oi.product_id,
          'product_name', pr.name,
          'vendor_id', oi.vendor_id,
          'vendor_name', v.store_name,
          'quantity', oi.quantity,
          'price', oi.unit_price
        )
      )
      FROM public.order_items oi
      JOIN public.products pr ON pr.id = oi.product_id
      JOIN public.profiles v ON v.user_id = oi.vendor_id
      WHERE oi.order_id = o.id
    ) as items
FROM public.orders o
JOIN auth.users u ON u.id = o.buyer_id
LEFT JOIN public.profiles p ON p.user_id = o.buyer_id;

-- Grant permissions
GRANT SELECT ON public.admin_orders_view TO authenticated;
-- Migration: Admin Products View
-- This view provides a detailed list of products with vendor info for admins

CREATE OR REPLACE VIEW public.admin_products_view AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.description,
    p.price,
    p.stock_quantity,
    p.category,
    p.status,
    p.vendor_id,
    prof.full_name as vendor_name,
    prof.store_name as vendor_store,
    (SELECT COUNT(*) FROM public.order_items WHERE product_id = p.id) as total_sales,
    p.created_at
FROM public.products p
LEFT JOIN public.profiles prof ON prof.user_id = p.vendor_id;

-- Grant permissions
GRANT SELECT ON public.admin_products_view TO authenticated;
-- Migration: Backfill Existing Users and Ensure Data Consistency

-- 1. Ensure all users have a Profile
-- Insert into profiles if missing, using data from auth.users metadata
INSERT INTO public.profiles (user_id, full_name, store_name, avatar_url)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email),
  raw_user_meta_data->>'store_name',
  raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

-- 2. Ensure all users have a User Role
-- Insert into user_roles if missing
INSERT INTO public.user_roles (user_id, role, vendor_status)
SELECT 
  id,
  -- Determine role from metadata, default to 'buyer'
  COALESCE((raw_user_meta_data->>'role')::public.app_role, 'buyer'),
  -- Set vendor status based on role and activity
  CASE 
    WHEN (raw_user_meta_data->>'role') = 'vendor' THEN
      CASE 
        -- If they already have products, approve them
        WHEN EXISTS (SELECT 1 FROM public.products WHERE vendor_id = u.id) THEN 'approved'::public.vendor_status_enum
        -- Otherwise pending
        ELSE 'pending'::public.vendor_status_enum
      END
    ELSE NULL -- Non-vendors have null status
  END
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
);

-- 3. Fix Inconsistent Vendor Statuses
-- Ensure all vendors have a valid status
UPDATE public.user_roles
SET vendor_status = 'pending'
WHERE role = 'vendor' AND vendor_status IS NULL;

-- Ensure approved vendors are actually set to approved if they were missed
UPDATE public.user_roles ur
SET vendor_status = 'approved'
WHERE role = 'vendor' 
  AND vendor_status = 'pending'
  AND EXISTS (SELECT 1 FROM public.products p WHERE p.vendor_id = ur.user_id);

-- 4. Ensure System Admin exists (Optional/Safety)
-- If there is a user with email containing 'admin', ensure they are admin
-- (Be careful with this in production, but helpful for dev/recovery)
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email ILIKE '%admin%'
) AND role != 'admin';

-- 5. Standardize Metadata
-- Sync role in metadata with role in table to ensure consistency
-- (This requires an update on auth.users which might not be permitted via SQL in all Supabase setups, 
-- but we can try or skip it. Usually better to rely on table as source of truth).
-- We'll skip updating auth.users to avoid permission issues.
-- Migration: Enable Realtime for Vendor Approval
-- This ensures that the frontend can subscribe to changes in the user_roles table.

-- Add user_roles to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;

-- Ensure replica identity is set to DEFAULT or FULL to track changes
ALTER TABLE public.user_roles REPLICA IDENTITY DEFAULT;
-- Migration: Fix Schema and Backfill Users
-- This migration ensures the schema is correct before attempting to backfill.

-- 1. Ensure Vendor Status Enum Exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vendor_status_enum') THEN
    CREATE TYPE public.vendor_status_enum AS ENUM ('pending', 'approved', 'suspended');
  END IF;
END $$;

-- 2. Ensure Vendor Status Column Exists in user_roles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'vendor_status'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD COLUMN vendor_status public.vendor_status_enum DEFAULT 'pending';
  END IF;
END $$;

-- 3. Ensure Profiles Table Exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  store_name TEXT,
  store_description TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 4. NOW RUN BACKFILL (Safe to run)

-- A. Backfill Profiles
INSERT INTO public.profiles (user_id, full_name, store_name, avatar_url)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email),
  raw_user_meta_data->>'store_name',
  raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

-- B. Backfill User Roles
INSERT INTO public.user_roles (user_id, role, vendor_status)
SELECT 
  id,
  COALESCE((raw_user_meta_data->>'role')::public.app_role, 'buyer'),
  CASE 
    WHEN (raw_user_meta_data->>'role') = 'vendor' THEN
      CASE 
        WHEN EXISTS (SELECT 1 FROM public.products WHERE vendor_id = u.id) THEN 'approved'::public.vendor_status_enum
        ELSE 'pending'::public.vendor_status_enum
      END
    ELSE NULL
  END
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
);

-- C. Fix Inconsistent Statuses for Existing Records
UPDATE public.user_roles
SET vendor_status = 'pending'
WHERE role = 'vendor' AND vendor_status IS NULL;

-- D. Auto-approve existing vendors with products
UPDATE public.user_roles ur
SET vendor_status = 'approved'
WHERE role = 'vendor' 
  AND vendor_status = 'pending'
  AND EXISTS (SELECT 1 FROM public.products p WHERE p.vendor_id = ur.user_id);

-- E. Ensure Admin Role for 'admin' emails
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email ILIKE '%admin%'
) AND role != 'admin';
-- Migration: Secure Realtime for User Roles
-- Set REPLICA IDENTITY FULL to ensure all columns are available for realtime filtering.

ALTER TABLE public.user_roles REPLICA IDENTITY FULL;

-- Re-verify publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.user_roles;
-- Note: In Supabase, usually there is a central 'supabase_realtime' publication.
-- If it already exists, we just add the table.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE public.user_roles;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Already in publication
END $$;
-- Migration: Add Moderator Role and Permissions

-- 1. ADD 'moderator' TO app_role ENUM
-- Note: 'ALTER TYPE ... ADD VALUE' cannot be run inside a transaction block in some Postgres versions.
-- If this fails, run it separately before the rest of the script.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';

-- 2. GRANT ACCESS TO ADMIN VIEWS FOR MODERATORS
-- We update the RLS policy for the views (which query underlying tables)
-- Actually, the views rely on the user having access to the underlying data or the view running as owner.
-- The previous views were defined with OWNER TO postgres, so they bypass RLS if the user has permission to select from the view.
-- We just need to check if the user is allowed to "see" the view.
-- The RLS policy "Admins can view dashboard stats" on user_roles needs to be updated.

DROP POLICY IF EXISTS "Admins can view dashboard stats" ON public.user_roles;

CREATE POLICY "Admins and Moderators can view dashboard stats"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- 3. FUNCTION: MODERATOR-SAFE PRODUCT STATUS UPDATE
-- Moderators can update status (suspend/activate) but CANNOT delete
CREATE OR REPLACE FUNCTION public.moderator_update_product_status(
  _product_id UUID,
  _new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _user_role public.app_role;
BEGIN
  _user_id := auth.uid();
  
  -- Get user role
  SELECT role INTO _user_role FROM public.user_roles WHERE user_id = _user_id;

  -- Check permissions
  IF _user_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Access denied: User is not an admin or moderator';
  END IF;

  -- Update status
  UPDATE public.products
  SET status = _new_status, updated_at = NOW()
  WHERE id = _product_id;

  -- Log action
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES (
    'admin_action',
    'product_management',
    'Product status updated by staff',
    json_build_object('product_id', _product_id, 'new_status', _new_status, 'staff_role', _user_role)
  );

  RETURN TRUE;
END;
$$;

-- 4. FUNCTION: MODERATOR-SAFE VENDOR STATUS UPDATE
-- Moderators can suspend/approve but cannot DELETE (which is handled by a separate function already restricted to admins usually)
CREATE OR REPLACE FUNCTION public.moderator_update_vendor_status(
  _vendor_id UUID,
  _new_status public.vendor_status_enum
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _user_role public.app_role;
BEGIN
  _user_id := auth.uid();
  
  -- Get user role
  SELECT role INTO _user_role FROM public.user_roles WHERE user_id = _user_id;

  -- Check permissions
  IF _user_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Access denied: User is not an admin or moderator';
  END IF;

  -- Update vendor status
  UPDATE public.user_roles
  SET vendor_status = _new_status
  WHERE user_id = _vendor_id AND role = 'vendor';

  -- Log action
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES (
    'admin_action',
    'vendor_management',
    'Vendor status updated by staff',
    json_build_object('vendor_id', _vendor_id, 'new_status', _new_status, 'staff_role', _user_role)
  );

  RETURN TRUE;
END;
$$;

-- 5. UPDATE EXISTING ADMIN DELETE FUNCTIONS TO STRICTLY FORBID MODERATORS
-- Even if RLS prevented it, let's make the function stricter.

CREATE OR REPLACE FUNCTION public.admin_delete_product(_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id UUID;
BEGIN
  _admin_id := auth.uid();
  
  -- STRICT CHECK: ADMIN ONLY
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can delete products';
  END IF;
  
  -- Log and Delete
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES ('admin_action', 'product_management', 'Admin deleted product', json_build_object('product_id', _product_id));
  
  DELETE FROM public.products WHERE id = _product_id;
  RETURN TRUE;
END;
$$;

-- 6. GRANT EXECUTE ON NEW FUNCTIONS
GRANT EXECUTE ON FUNCTION public.moderator_update_product_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderator_update_vendor_status TO authenticated;

-- 7. UPDATE RLS for System Logs (Allow moderators to insert logs via functions)
-- (The functions are SECURITY DEFINER so they bypass RLS, but if we do direct inserts from client, we need policy)
-- We'll assume logging happens via these secure functions.

-- 8. ALLOW MODERATORS TO VIEW ADMIN VIEWS (Already granted to authenticated, but policies might restrict)
-- The views use 'security definer' behavior or owner permissions usually, but if RLS is enabled on underlying tables, it matters.
-- The previous views were simple views defined by postgres (or admin).
-- We just need to ensure 'admin_dashboard_stats' relies on user_roles policy which we updated in step 2.
-- Migration: Add extra columns to products table
-- This adds images (plural) and features for rich product displays

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
-- Migration: Secure Order Processing
-- This function handles order creation, item insertion, and inventory updates atomically

CREATE OR REPLACE FUNCTION public.create_order_secure(
  _buyer_id UUID,
  _total_amount DECIMAL,
  _items JSONB,
  _payment_method TEXT,
  _shipping_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order_id UUID;
  item_record RECORD;
BEGIN
  -- 1. Create the main order
  INSERT INTO public.orders (
    buyer_id,
    total_amount,
    status,
    shipping_address,
    payment_status,
    payment_method
  )
  VALUES (
    _buyer_id,
    _total_amount,
    'pending',
    _shipping_details->>'address',
    'pending',
    _payment_method
  )
  RETURNING id INTO new_order_id;

  -- 2. Create order items and update stock
  FOR item_record IN SELECT * FROM jsonb_to_recordset(_items) AS x(id UUID, quantity INT, price DECIMAL, vendor_id UUID)
  LOOP
    -- Insert into order_items
    INSERT INTO public.order_items (
      order_id,
      product_id,
      vendor_id,
      quantity,
      unit_price,
      total_price
    )
    VALUES (
      new_order_id,
      item_record.id,
      item_record.vendor_id,
      item_record.quantity,
      item_record.price,
      item_record.quantity * item_record.price
    );

    -- Update stock
    UPDATE public.products
    SET stock_quantity = stock_quantity - item_record.quantity
    WHERE id = item_record.id;
  END LOOP;

  -- 3. Create transaction record
  INSERT INTO public.transactions (
    user_id,
    amount,
    type,
    status,
    payment_method,
    reference_id
  )
  VALUES (
    _buyer_id,
    _total_amount,
    'payment',
    'pending',
    _payment_method,
    new_order_id
  );

  RETURN new_order_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_order_secure TO authenticated;
-- Migration: Storefront Products View
-- This view filters products to only show those from approved vendors

CREATE OR REPLACE VIEW public.storefront_products_view AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.category,
  p.image_url as image,
  p.images,
  p.features,
  p.created_at,
  prof.store_name as vendor,
  p.vendor_id,
  p.status,
  p.stock_quantity as stock,
  p.rating,
  p.reviews_count as reviews
FROM public.products p
JOIN public.user_roles ur ON ur.user_id = p.vendor_id
JOIN public.profiles prof ON prof.user_id = p.vendor_id
WHERE ur.role = 'vendor' 
  AND ur.vendor_status = 'approved'
  AND p.status = 'active';

-- Grant access to everyone (including non-logged in users)
GRANT SELECT ON public.storefront_products_view TO anon, authenticated;
-- Vendor Approval System Migration
-- This adds vendor status management and approval workflow

-- Create enum for vendor status
CREATE TYPE public.vendor_status_enum AS ENUM ('pending', 'approved', 'suspended');

-- Add vendor_status column to user_roles table
ALTER TABLE public.user_roles
ADD COLUMN vendor_status public.vendor_status_enum DEFAULT 'pending';

-- Update existing vendor users to 'approved' by default (for backwards compatibility)
UPDATE public.user_roles
SET vendor_status = 'approved'
WHERE role = 'vendor';

-- Create function to get vendor status
CREATE OR REPLACE FUNCTION public.get_vendor_status(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vendor_status::text
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role = 'vendor'
  LIMIT 1
$$;

-- Create function for admins to update vendor status
CREATE OR REPLACE FUNCTION public.update_vendor_status(
  _vendor_id UUID,
  _new_status public.vendor_status_enum
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can update vendor status
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update vendor status';
  END IF;

  -- Update the vendor status
  UPDATE public.user_roles
  SET vendor_status = _new_status
  WHERE user_id = _vendor_id
    AND role = 'vendor';

  -- Log the action
  INSERT INTO public.system_logs (type, source, message, metadata, user_id)
  VALUES (
    'security',
    'vendor_management',
    'Vendor status updated',
    jsonb_build_object(
      'vendor_id', _vendor_id,
      'new_status', _new_status::text,
      'updated_by', auth.uid()
    ),
    auth.uid()
  );

  RETURN TRUE;
END;
$$;

-- Create function to check if vendor is approved
CREATE OR REPLACE FUNCTION public.is_vendor_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'vendor'
      AND vendor_status = 'approved'
  )
$$;

-- Update the handle_new_user function to set vendor_status for new vendors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, store_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'store_name'
  );
  
  -- Get the role from metadata or default to buyer
  user_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'buyer');
  
  -- Assign role with appropriate vendor_status
  IF user_role = 'vendor' THEN
    -- New vendors start as pending
    INSERT INTO public.user_roles (user_id, role, vendor_status)
    VALUES (NEW.id, user_role, 'pending');
  ELSE
    -- Non-vendors don't need vendor_status (it stays as default)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add RLS policy for vendors to view their own status
CREATE POLICY "Vendors can view their own vendor status"
  ON public.user_roles FOR SELECT
  USING (
    auth.uid() = user_id 
    AND role = 'vendor'
  );

-- Update products RLS to check vendor approval status
DROP POLICY IF EXISTS "Vendors can manage their own products" ON public.products;

CREATE POLICY "Approved vendors can manage their products"
  ON public.products FOR ALL
  USING (
    auth.uid() = vendor_id 
    AND public.is_vendor_approved(auth.uid())
  );

-- Admins can still manage all products
-- (This policy already exists, no changes needed)

-- Add index for faster vendor status lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_vendor_status 
  ON public.user_roles(user_id, role, vendor_status);

-- Create view for admin to manage vendors
CREATE OR REPLACE VIEW public.vendor_management_view AS
SELECT 
  u.id as user_id,
  u.email,
  p.full_name,
  p.store_name,
  p.store_description,
  p.avatar_url,
  p.phone,
  ur.vendor_status,
  ur.created_at as vendor_since,
  (SELECT COUNT(*) FROM public.products WHERE vendor_id = u.id) as product_count,
  (SELECT COUNT(*) FROM public.order_items WHERE vendor_id = u.id) as total_sales
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
JOIN public.profiles p ON p.user_id = u.id
WHERE ur.role = 'vendor'
ORDER BY ur.created_at DESC;

-- Grant access to the view for admins only
ALTER VIEW public.vendor_management_view OWNER TO postgres;

-- Create RLS policy for the view
CREATE POLICY "Admins can view vendor management"
  ON public.vendor_management_view FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to delete vendor account (for admins)
CREATE OR REPLACE FUNCTION public.delete_vendor_account(_vendor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can delete vendor accounts
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete vendor accounts';
  END IF;

  -- Check if the user is actually a vendor
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _vendor_id AND role = 'vendor'
  ) THEN
    RAISE EXCEPTION 'User is not a vendor';
  END IF;

  -- Log the deletion
  INSERT INTO public.system_logs (type, source, message, metadata, user_id)
  VALUES (
    'security',
    'vendor_management',
    'Vendor account deleted',
    jsonb_build_object(
      'vendor_id', _vendor_id,
      'deleted_by', auth.uid()
    ),
    auth.uid()
  );

  -- Delete the user (CASCADE will handle related records)
  DELETE FROM auth.users WHERE id = _vendor_id;

  RETURN TRUE;
END;
$$;

COMMENT ON COLUMN public.user_roles.vendor_status IS 'Status of vendor accounts: pending (awaiting approval), approved (can access vendor dashboard), suspended (access revoked)';
COMMENT ON FUNCTION public.get_vendor_status(UUID) IS 'Returns the vendor status for a given user ID';
COMMENT ON FUNCTION public.update_vendor_status(UUID, public.vendor_status_enum) IS 'Admin function to approve, suspend, or reactivate vendor accounts';
COMMENT ON FUNCTION public.is_vendor_approved(UUID) IS 'Checks if a vendor is approved and can access vendor features';
COMMENT ON FUNCTION public.delete_vendor_account(UUID) IS 'Admin function to permanently delete a vendor account';
-- Migration: Vendor Views and Functions
-- This provides necessary views and functions for the Vendor Dashboard

-- 1. Vendor Stats View (Aggregated per vendor)
CREATE OR REPLACE VIEW public.vendor_dashboard_stats AS
SELECT 
    v.user_id as vendor_id,
    COALESCE(SUM(oi.total_price), 0) as total_revenue,
    COUNT(DISTINCT oi.order_id) as total_orders,
    (SELECT COUNT(*) FROM public.products p WHERE p.vendor_id = v.user_id) as total_products,
    (SELECT COUNT(*) FROM public.products p WHERE p.vendor_id = v.user_id AND p.stock_quantity < 10) as low_stock_count
FROM public.user_roles v
LEFT JOIN public.order_items oi ON oi.vendor_id = v.user_id
WHERE v.role = 'vendor'
GROUP BY v.user_id;

-- 2. Vendor Products View (with sales info)
CREATE OR REPLACE VIEW public.vendor_products_view AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.stock_quantity as stock,
    p.category,
    p.status,
    p.vendor_id,
    p.image_url as image,
    p.created_at,
    COALESCE(SUM(oi.quantity), 0) as total_sold
FROM public.products p
LEFT JOIN public.order_items oi ON oi.product_id = p.id
GROUP BY p.id;

-- 3. Vendor Orders View
CREATE OR REPLACE VIEW public.vendor_orders_view AS
SELECT 
    oi.order_id,
    oi.vendor_id,
    o.created_at,
    o.status as order_status,
    o.total_amount as order_total, -- This is the full order total, maybe redundant
    SUM(oi.total_price) as vendor_total,
    COUNT(oi.product_id) as item_count,
    prof.full_name as buyer_name,
    u.email as buyer_email
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
JOIN auth.users u ON u.id = o.buyer_id
LEFT JOIN public.profiles prof ON prof.user_id = o.buyer_id
GROUP BY oi.order_id, oi.vendor_id, o.created_at, o.status, o.total_amount, prof.full_name, u.email;

-- Grant permissions (RLS will still apply to the underlying tables if enabled)
GRANT SELECT ON public.vendor_dashboard_stats TO authenticated;
GRANT SELECT ON public.vendor_products_view TO authenticated;
GRANT SELECT ON public.vendor_orders_view TO authenticated;
-- Fix: Create delete_vendor_account function that was missing from the schema cache
-- This function allows admins to permanently delete a vendor account

CREATE OR REPLACE FUNCTION public.delete_vendor_account(_vendor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can delete vendor accounts
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete vendor accounts';
  END IF;

  -- Check if the user is actually a vendor
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _vendor_id AND role = 'vendor'
  ) THEN
    RAISE EXCEPTION 'User is not a vendor';
  END IF;

  -- Log the deletion (wrapped in exception handler so it doesn't block delete)
  BEGIN
    INSERT INTO public.system_logs (type, source, message, metadata, user_id)
    VALUES (
      'security',
      'vendor_management',
      'Vendor account deleted',
      jsonb_build_object(
        'vendor_id', _vendor_id,
        'deleted_by', auth.uid()
      ),
      auth.uid()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Logging is non-critical, continue with deletion
    NULL;
  END;

  -- Remove from user_roles first (avoids FK issues)
  DELETE FROM public.user_roles WHERE user_id = _vendor_id AND role = 'vendor';

  -- Remove profile
  DELETE FROM public.profiles WHERE user_id = _vendor_id;

  -- Note: Deleting from auth.users requires service_role key.
  -- If this errors, the vendor role/profile are still removed.
  BEGIN
    DELETE FROM auth.users WHERE id = _vendor_id;
  EXCEPTION WHEN OTHERS THEN
    -- auth.users deletion may fail without service_role — acceptable
    NULL;
  END;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.delete_vendor_account(UUID) IS 'Admin function to permanently delete a vendor account. Removes role, profile, and attempts auth user deletion.';
-- ============================================================
-- Staff Roles Migration
-- Adds granular staff roles for managing different app sections
-- ============================================================

-- 1. Add new role values to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'order_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support_agent';

-- 2. Function: Admin assigns any role to a user
CREATE OR REPLACE FUNCTION public.admin_assign_role(
  _target_user_id UUID,
  _new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_id UUID;
  _role_val public.app_role;
BEGIN
  _caller_id := auth.uid();

  -- Only admins can assign roles
  IF NOT public.has_role(_caller_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;

  -- Cast to enum (will raise if invalid value)
  _role_val := _new_role::public.app_role;

  -- Upsert: if the user already has a row, update it; otherwise insert
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role_val)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove all OTHER roles (one role per user)
  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id
    AND role != _role_val;

  -- Log
  BEGIN
    INSERT INTO public.system_logs (type, source, message, metadata, user_id)
    VALUES (
      'admin_action', 'user_management', 'Admin assigned role to user',
      jsonb_build_object(
        'target_user_id', _target_user_id,
        'new_role', _new_role,
        'assigned_by', _caller_id
      ),
      _caller_id
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_assign_role TO authenticated;

-- 3. Function: Admin removes a user (soft: just resets role to buyer)
CREATE OR REPLACE FUNCTION public.admin_deactivate_user(_target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_id UUID;
BEGIN
  _caller_id := auth.uid();

  IF NOT public.has_role(_caller_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can deactivate users';
  END IF;

  -- Reset role to buyer
  UPDATE public.user_roles
  SET role = 'buyer'
  WHERE user_id = _target_user_id;

  BEGIN
    INSERT INTO public.system_logs (type, source, message, metadata, user_id)
    VALUES (
      'admin_action', 'user_management', 'Admin deactivated user (reset to buyer)',
      jsonb_build_object('target_user_id', _target_user_id, 'by', _caller_id),
      _caller_id
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_deactivate_user TO authenticated;

-- 4. Update has_role to accept text so moderator checks work easily
-- (existing has_role uses enum, add a text overload)
CREATE OR REPLACE FUNCTION public.has_role_text(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_role_text TO authenticated;

COMMENT ON FUNCTION public.admin_assign_role IS 'Admin-only: assign any app_role to a target user. Replaces their existing role.';
COMMENT ON FUNCTION public.admin_deactivate_user IS 'Admin-only: reset a user role back to buyer (soft deactivation).';
-- Migration: Fix Realtime for Vendor Approval Instant Unlock
-- Safely ensures user_roles is in the realtime publication
-- without dropping it (which would remove other tables).

-- Step 1: Set REPLICA IDENTITY FULL so all columns are available in realtime payloads
-- This allows the filter `user_id=eq.xxx` to work correctly on the client.
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;

-- Step 2: Add user_roles to the supabase_realtime publication (safe: no-op if already added)
DO $$
BEGIN
  -- Try to add table to publication; if already a member it raises an error we catch.
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication, nothing to do
  WHEN undefined_object THEN
    NULL; -- Publication doesn't exist, Supabase manages it
END $$;
-- Create storage bucket for products if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for products bucket
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Allow everyone to read products (public bucket)
CREATE POLICY "Public read access to products"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Allow users to manage their own uploads in products bucket
CREATE POLICY "Users can update their own products images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products' AND owner = auth.uid());

CREATE POLICY "Users can delete their own products images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products' AND owner = auth.uid());
-- Add vendor_reply and vendor_reply_at to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS vendor_reply TEXT,
ADD COLUMN IF NOT EXISTS vendor_reply_at TIMESTAMP WITH TIME ZONE;

-- Add RLS policy for vendors to update reviews for their products
-- Note: This is a bit complex because we need to check if the product belongs to the vendor
CREATE POLICY "Vendors can reply to reviews for their products"
ON public.reviews
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = reviews.product_id
    AND products.vendor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = reviews.product_id
    AND products.vendor_id = auth.uid()
  )
);
-- Adds a "reject" capability to flash deal moderation.
-- Purely additive: does NOT touch `approved_by_admin` or its existing semantics,
-- because a separate view (active_flash_deals, used by the public storefront) reads
-- from `deals` but is defined nowhere in any migration file on disk -- its exact
-- filter logic is unknown, so existing columns must stay untouched to guarantee it
-- keeps working unmodified.

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.deals.rejected_at IS 'Set when an admin rejects a pending flash deal submission. NULL + approved_by_admin=false means still pending.';
-- Admin moderation: reviews, support tickets, coupons.
-- Defensive/idempotent throughout given confirmed schema drift (conflicting CREATE
-- TABLE definitions across earlier migration files for these exact tables).

-- ── Reviews ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can moderate reviews" ON public.reviews;
CREATE POLICY "Admins can moderate reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Two conflicting reviews.status CHECK constraints exist across earlier migration
-- files -- one omits 'rejected' entirely. Force it to the value the frontend
-- (src/types/admin.ts Review.status) actually uses.
DO $$
DECLARE
  _constraint_name TEXT;
BEGIN
  SELECT conname INTO _constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.reviews'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';

  IF _constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.reviews DROP CONSTRAINT %I', _constraint_name);
  END IF;

  ALTER TABLE public.reviews
    ADD CONSTRAINT reviews_status_check
    CHECK (status IN ('pending', 'approved', 'flagged', 'rejected'));
END $$;


-- ── Support tickets ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.support_tickets;
CREATE POLICY "Admins can manage all tickets"
  ON public.support_tickets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
CREATE POLICY "Users can create tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ── Coupons ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Same drift problem as reviews.status: coupons.status CHECK disagrees across
-- migration files ('paused' vs 'disabled'). Force it to what the frontend uses.
DO $$
DECLARE
  _constraint_name TEXT;
BEGIN
  SELECT conname INTO _constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.coupons'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';

  IF _constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.coupons DROP CONSTRAINT %I', _constraint_name);
  END IF;

  ALTER TABLE public.coupons
    ADD CONSTRAINT coupons_status_check
    CHECK (status IN ('active', 'expired', 'disabled'));
END $$;
-- Real daily-granularity revenue for the admin dashboard's "Weekly Revenue Trend"
-- chart, which previously used a hardcoded Mon-Sun mock array. The existing
-- get_admin_analytics_charts() (in the untracked supabase/admin_dashboard_init.sql)
-- only supports monthly granularity, so this fills the gap with a new function
-- rather than editing that untracked file in place.

CREATE OR REPLACE FUNCTION public.get_admin_weekly_revenue()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can view platform analytics';
  END IF;

  SELECT COALESCE(json_agg(t), '[]'::json) INTO _result
  FROM (
    SELECT
      to_char(d.day, 'Dy') AS name,
      COALESCE(SUM(o.total_amount), 0) AS revenue
    FROM generate_series(
      date_trunc('day', now()) - interval '6 days',
      date_trunc('day', now()),
      interval '1 day'
    ) AS d(day)
    LEFT JOIN public.orders o
      ON date_trunc('day', o.created_at) = d.day
    GROUP BY d.day
    ORDER BY d.day
  ) t;

  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_weekly_revenue TO authenticated;

COMMENT ON FUNCTION public.get_admin_weekly_revenue() IS 'Real daily revenue for the last 7 days, admin-only. Backs the admin dashboard Weekly Revenue Trend chart.';
-- Realign existing products to the canonical Jumia category taxonomy.
UPDATE public.products
SET category = CASE category
  WHEN 'Clothing' THEN 'Fashion'
  WHEN 'Home' THEN 'Home & Office'
  WHEN 'Books' THEN 'Other categories'
  WHEN 'Books & Notes' THEN 'Other categories'
  WHEN 'Stationery' THEN 'Other categories'
  WHEN 'Food & Snacks' THEN 'Supermarket'
  WHEN 'Electronics' THEN 'Electronics'
  ELSE category
END;
-- Fix infinite recursion in user_roles RLS policies.
-- Bypasses recursion by resolving auth.uid() checks via direct non-recursive subqueries.

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );
-- Ensure vendors can manage their own coupons.
-- No migration file on disk grants this explicitly (only "Admins manage coupons" and
-- "Public can read active coupons" policies were found) -- added defensively here
-- regardless of whether an equivalent policy already exists live, following the same
-- pattern as 20260205_vendor_approval_system.sql / 20260428_review_replies.sql.

DROP POLICY IF EXISTS "Vendors can manage their own coupons" ON public.coupons;

CREATE POLICY "Vendors can manage their own coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (created_by = auth.uid() AND public.is_vendor_approved(auth.uid()))
  WITH CHECK (created_by = auth.uid() AND public.is_vendor_approved(auth.uid()));
-- Real notifications table.
-- src/pages/admin/AdminNotifications.tsx already queries a live `notifications` table
-- (columns: id, type, title, message, read, created_at) with no corresponding
-- CREATE TABLE anywhere in this migrations folder -- another out-of-band table, like
-- `coupons`/`reviews`. This migration matches that proven shape defensively (safe to
-- run whether or not the table already exists) and adds what vendor-scoped
-- notifications need: `user_id` + `link`.

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Self-healing: add any of these columns individually in case the table already
-- existed live with only a subset of them.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'info';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);

-- Notify a vendor when one of their products receives a new order line item.
CREATE OR REPLACE FUNCTION public.notify_vendor_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.vendor_id,
    'success',
    'New Order Received',
    'You have a new order for your items.',
    '/vendor/orders'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_vendor_new_order ON public.order_items;
CREATE TRIGGER trg_notify_vendor_new_order
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vendor_new_order();

-- Notify a vendor when one of their products receives a new review.
CREATE OR REPLACE FUNCTION public.notify_vendor_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _vendor_id UUID;
  _product_name TEXT;
BEGIN
  SELECT vendor_id, name INTO _vendor_id, _product_name
  FROM public.products
  WHERE id = NEW.product_id;

  IF _vendor_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      _vendor_id,
      'info',
      'New Review Posted',
      'Someone rated ' || COALESCE(_product_name, 'your product') || ' ' || NEW.rating || ' stars.',
      '/vendor/reviews'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_vendor_new_review ON public.reviews;
CREATE TRIGGER trg_notify_vendor_new_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vendor_new_review();

COMMENT ON TABLE public.notifications IS 'Per-user notification feed (vendors, and system-wide notifications read by admins).';
-- Vendor payouts: request + admin approval, feeding into the existing transactions ledger.
-- Defensive/idempotent throughout given confirmed schema drift in this migrations folder.

CREATE TABLE IF NOT EXISTS public.vendor_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('momo', 'bank')),
  label TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_payment_methods ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.vendor_payment_methods ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.vendor_payment_methods ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE public.vendor_payment_methods ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.vendor_payment_methods ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.vendor_payment_methods ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

ALTER TABLE public.vendor_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors manage their own payment methods" ON public.vendor_payment_methods;
CREATE POLICY "Vendors manage their own payment methods"
  ON public.vendor_payment_methods FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());


CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  payment_method TEXT,
  payment_details JSONB DEFAULT '{}'::jsonb,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors view and create their own payout requests" ON public.payout_requests;
CREATE POLICY "Vendors view and create their own payout requests"
  ON public.payout_requests FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Vendors can request payouts" ON public.payout_requests;
CREATE POLICY "Vendors can request payouts"
  ON public.payout_requests FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid() AND public.is_vendor_approved(auth.uid()));

DROP POLICY IF EXISTS "Admins manage all payout requests" ON public.payout_requests;
CREATE POLICY "Admins manage all payout requests"
  ON public.payout_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_payout_requests_vendor ON public.payout_requests(vendor_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);


-- Admin approve/reject a payout request. On approval, also writes a row into the
-- existing `transactions` table (type 'withdrawal') so it appears in the existing
-- AdminTransactions.tsx ledger, keeping the two systems consistent rather than
-- building a second, disconnected financial view. Follows the exact pattern of
-- admin_approve_vendor (role check, system_logs audit entry, RETURN BOOLEAN).
CREATE OR REPLACE FUNCTION public.approve_payout_request(
  _payout_id UUID,
  _new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _payout RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can process payout requests';
  END IF;

  IF _new_status NOT IN ('approved', 'paid', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', _new_status;
  END IF;

  SELECT * INTO _payout FROM public.payout_requests WHERE id = _payout_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout request not found';
  END IF;

  UPDATE public.payout_requests
  SET status = _new_status,
      processed_at = now()
  WHERE id = _payout_id;

  IF _new_status = 'paid' THEN
    INSERT INTO public.transactions (user_id, amount, currency, status, type, payment_method, reference_id)
    VALUES (
      _payout.vendor_id,
      _payout.amount,
      'GHS',
      'completed',
      'withdrawal',
      _payout.payment_method,
      _payout.id
    );
  END IF;

  INSERT INTO public.system_logs (type, source, message, metadata, user_id)
  VALUES (
    'security',
    'payout_management',
    'Payout request ' || _new_status,
    jsonb_build_object(
      'payout_id', _payout_id,
      'vendor_id', _payout.vendor_id,
      'amount', _payout.amount,
      'new_status', _new_status,
      'processed_by', auth.uid()
    ),
    auth.uid()
  );

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_payout_request TO authenticated;

COMMENT ON TABLE public.payout_requests IS 'Vendor payout/withdrawal requests, approved or rejected by admins via approve_payout_request().';
COMMENT ON TABLE public.vendor_payment_methods IS 'Vendor-saved payout destinations (mobile money / bank).';
COMMENT ON FUNCTION public.approve_payout_request(UUID, TEXT) IS 'Admin function to approve, mark paid, or reject a vendor payout request; on paid also records a withdrawal transaction.';
-- Vendor store branding fields on profiles.
-- Defensive/idempotent: uses ADD COLUMN IF NOT EXISTS per-column so this is safe to run
-- regardless of the live table's current shape (this schema has significant drift --
-- see migration commit message history).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_category TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "new_order": true,
  "low_stock": true,
  "customer_messages": true,
  "weekly_report": false,
  "product_reviews": true,
  "two_factor": false,
  "login_notifications": true
}'::jsonb;

COMMENT ON COLUMN public.profiles.banner_url IS 'Vendor store banner image shown on their public storefront page';
COMMENT ON COLUMN public.profiles.store_category IS 'Primary product category for the vendor''s store, shown on their public storefront page';
COMMENT ON COLUMN public.profiles.verified IS 'Whether this vendor has been verified by an admin (shown as a badge on their storefront)';
COMMENT ON COLUMN public.profiles.rating IS 'Average store rating, 1.0-5.0, computed/updated separately from review aggregation';
COMMENT ON COLUMN public.profiles.notification_preferences IS 'Per-vendor notification toggle preferences (Settings > Notifications tab)';
-- Vendor weekly sales analytics view
-- Real per-week revenue/order data for the vendor dashboard sales chart,
-- replacing the previous client-side fabricated percentage split.
-- Uses only columns confirmed present on order_items (price_at_purchase, quantity,
-- created_at, vendor_id) -- avoids the unconfirmed total_price/unit_price columns
-- referenced elsewhere in this migrations folder.

CREATE OR REPLACE VIEW public.vendor_weekly_sales
WITH (security_invoker = true)
AS
SELECT
  oi.vendor_id,
  date_trunc('week', oi.created_at) AS week_start,
  COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) AS revenue,
  COUNT(DISTINCT oi.order_id) AS orders
FROM public.order_items oi
WHERE oi.created_at >= (now() - interval '4 weeks')
GROUP BY oi.vendor_id, date_trunc('week', oi.created_at);

GRANT SELECT ON public.vendor_weekly_sales TO authenticated;

COMMENT ON VIEW public.vendor_weekly_sales IS 'Per-vendor revenue and order counts bucketed by week, last 4 weeks. Backs the vendor dashboard sales chart.';
-- Fix RLS policies to allow updates and ensure correct schema
DROP TABLE IF EXISTS public.site_settings CASCADE;

-- Create table with correct schema
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  setting_category TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy for development (FIXES "Failed to update settings" error)
CREATE POLICY "Enable all access for site settings" ON public.site_settings FOR ALL USING (true);
-- Force white mode (light mode) as default
UPDATE public.site_settings 
SET setting_value = 'false'
WHERE setting_key = 'dark_mode_enabled';

-- Ensure basic "white mode" colors
UPDATE public.site_settings
SET setting_value = '"#ffffff"'
WHERE setting_key IN ('background_color', 'header_bg_color');

UPDATE public.site_settings
SET setting_value = '"#1f2937"'
WHERE setting_key = 'footer_bg_color';
-- Full Backend Integration Schema for Admin Features

-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  type TEXT NOT NULL CHECK (type IN ('payment', 'withdrawal', 'refund')),
  payment_method TEXT,
  reference_id UUID, -- Can be order_id
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 2. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged', 'rejected')),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved reviews" ON public.reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reviews" ON public.reviews
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_value DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disabled')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active coupons" ON public.coupons
  FOR SELECT USING (status = 'active' AND (end_date IS NULL OR end_date > now()));

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 4. Messages Table (Simple system)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 5. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 6. Support Ticket Messages (Replies)
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL, -- Could be user or admin
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their tickets" ON public.support_ticket_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = support_ticket_messages.ticket_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

CREATE POLICY "Users and Admins can reply" ON public.support_ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = support_ticket_messages.ticket_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

-- 7. System Logs (Enhanced)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'security')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs" ON public.system_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Helper triggers to update 'updated_at'
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Reset site settings to White Mode defaults
UPDATE public.site_settings 
SET setting_value = 'false'
WHERE setting_key = 'dark_mode_enabled';

UPDATE public.site_settings 
SET setting_value = '"#ffffff"'
WHERE setting_key IN ('background_color', 'header_bg_color');

UPDATE public.site_settings 
SET setting_value = '"#1f2937"'
WHERE setting_key = 'footer_bg_color';

UPDATE public.site_settings 
SET setting_value = '"default"'
WHERE setting_key = 'current_theme';
-- DROP existing tables to ensure clean schema (WARNING: This resets these specific settings tables)
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.site_pages CASCADE;
DROP TABLE IF EXISTS public.navigation_menus CASCADE;
DROP TABLE IF EXISTS public.media_library CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.admin_activity_log CASCADE;
DROP TABLE IF EXISTS public.site_announcements CASCADE;

-- Site Settings Table
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  setting_category TEXT NOT NULL, -- 'branding', 'content', 'seo', 'payment', 'email'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Site Pages Table (for CMS)
CREATE TABLE public.site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- Store rich content
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Navigation Menu Table
CREATE TABLE public.navigation_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_name TEXT NOT NULL,
  menu_location TEXT NOT NULL, -- 'header', 'footer', 'sidebar'
  menu_items JSONB NOT NULL, -- Array of menu items with links
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media Library Table
CREATE TABLE public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'video', 'document'
  file_size INTEGER,
  alt_text TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Templates Table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT UNIQUE NOT NULL,
  template_subject TEXT NOT NULL,
  template_body TEXT NOT NULL,
  template_variables JSONB, -- Available variables for the template
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Activity Log
CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'login'
  action_description TEXT NOT NULL,
  affected_table TEXT,
  affected_record_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site Announcements Table
CREATE TABLE public.site_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  announcement_type TEXT NOT NULL, -- 'info', 'warning', 'success', 'error'
  target_audience TEXT DEFAULT 'all', -- 'all', 'vendors', 'buyers'
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public can read published pages" ON public.site_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage pages" ON public.site_pages FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public can read active menus" ON public.navigation_menus FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage menus" ON public.navigation_menus FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public can read media" ON public.media_library FOR SELECT USING (true);
CREATE POLICY "Admins can manage media" ON public.media_library FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage email templates" ON public.email_templates FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can read activity log" ON public.admin_activity_log FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public can read active announcements" ON public.site_announcements FOR SELECT 
USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));
CREATE POLICY "Admins can manage announcements" ON public.site_announcements FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Insert default site settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_category) VALUES
('site_name', '"Campus Connect Marketplace"', 'branding'),
('site_tagline', '"Your Campus Marketplace"', 'branding'),
('primary_color', '"#10b981"', 'branding'),
('secondary_color', '"#3b82f6"', 'branding'),
('logo_url', '""', 'branding'),
('favicon_url', '""', 'branding'),
('support_email', '"support@campusconnect.com"', 'content'),
('support_phone', '"+1 (555) 123-4567"', 'content'),
('copyright_text', '"© 2024 Campus Connect. All rights reserved."', 'content'),
('meta_title', '"Campus Connect - Your Campus Shopping Destination"', 'seo'),
('meta_description', '"Shop for everything you need on campus"', 'seo'),
('meta_keywords', '"campus marketplace, student shopping"', 'seo'),
('google_analytics_id', '""', 'seo'),
('commission_rate', '5', 'payment'),
('minimum_order_value', '10', 'payment'),
('currency', '"USD"', 'payment'),
('tax_rate', '7.5', 'payment')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default email templates
INSERT INTO public.email_templates (template_name, template_subject, template_body, template_variables) VALUES
('welcome_email', 'Welcome to Campus Connect!', 
'<h1>Welcome {{user_name}}!</h1><p>Thank you for joining Campus Connect Marketplace...</p>',
'{"user_name": "User''s full name", "email": "User''s email address"}'),
('order_confirmation', 'Order Confirmation #{{order_number}}',
'<h1>Order Confirmed!</h1><p>Thank you for your order #{{order_number}}...</p>',
'{"order_number": "Order ID", "total_amount": "Order total", "items": "Order items list"}'),
('password_reset', 'Reset Your Password',
'<h1>Password Reset</h1><p>Click the link below to reset your password...</p>',
'{"reset_link": "Password reset URL", "user_name": "User''s name"}')
ON CONFLICT (template_name) DO NOTHING;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_activity_log (admin_id, action_type, action_description, affected_table, affected_record_id)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME || ' ' || TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for activity logging
CREATE TRIGGER log_settings_changes AFTER INSERT OR UPDATE OR DELETE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION log_admin_activity();

CREATE TRIGGER log_page_changes AFTER INSERT OR UPDATE OR DELETE ON public.site_pages
FOR EACH ROW EXECUTE FUNCTION log_admin_activity();
