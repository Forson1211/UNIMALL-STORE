-- FIX: Add 'moderator' to app_role enum
-- This must be run to fix the "invalid input value" error.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
