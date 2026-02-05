
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
