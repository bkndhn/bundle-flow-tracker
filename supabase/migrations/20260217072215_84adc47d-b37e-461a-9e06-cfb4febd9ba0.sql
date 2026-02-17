
-- Add created_by_user column to track which app_user created each dispatch
ALTER TABLE public.goods_movements 
ADD COLUMN created_by_user uuid REFERENCES public.app_users(id);
