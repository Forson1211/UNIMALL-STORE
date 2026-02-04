-- Campus News Table
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
