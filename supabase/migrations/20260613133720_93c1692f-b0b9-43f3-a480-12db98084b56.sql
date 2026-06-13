SELECT cron.schedule(
  'b2-cleanup-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zdkstkgwgggssvyjipqp.supabase.co/functions/v1/b2-cleanup',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpka3N0a2d3Z2dnc3N2eWppcHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODM4MjUsImV4cCI6MjA5Njg1OTgyNX0.4-rY2yhzOR_WGp1MCcKBRuLT_RCRaRVt-y5KiRiZY9s"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);