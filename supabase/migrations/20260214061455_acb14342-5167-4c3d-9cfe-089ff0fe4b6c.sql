-- Add is_active column to staff for soft delete
ALTER TABLE public.staff ADD COLUMN is_active boolean NOT NULL DEFAULT true;