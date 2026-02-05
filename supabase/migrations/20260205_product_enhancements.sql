-- Migration: Add extra columns to products table
-- This adds images (plural) and features for rich product displays

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
