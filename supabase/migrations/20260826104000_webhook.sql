-- enable pg_net for webhooks
create extension if not exists pg_net with schema extensions;

-- webhook: notify edge function on new website bookings
create or replace function public.notify_new_booking() returns trigger
language plpgsql security definer as $$
begin
  if new.source = 'website' and tg_op = 'INSERT' then
    perform net.http_post(
      url := 'https://qzgvvfywjmspbbqglpdx.functions.supabase.co/notify-admin',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('booking_id', new.id, 'record', row_to_json(new))
    );
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists trg_bookings_notify on public.bookings;
create trigger trg_bookings_notify
  after insert on public.bookings
  for each row execute function public.notify_new_booking();
