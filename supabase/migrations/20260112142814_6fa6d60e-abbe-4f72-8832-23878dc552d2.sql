-- Enable REPLICA IDENTITY FULL for goods_movements to capture old values in UPDATE events
ALTER TABLE public.goods_movements REPLICA IDENTITY FULL;

-- Ensure goods_movements is in the supabase_realtime publication for realtime updates
DO $$
BEGIN
    -- Check if publication exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    -- Add the table to the publication if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'goods_movements'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.goods_movements;
    END IF;
END $$;