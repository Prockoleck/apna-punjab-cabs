-- ================================================================== --
--  Apna Punjab Cab Service — Supabase (PostgreSQL) schema             --
--                                                                     --
--  ONE source of truth. Website bookings and admin (CRM) bookings     --
--  both write to the same `bookings` table; the admin CRM subscribes  --
--  to Supabase Realtime on this table so new website bookings appear  --
--  instantly, without refresh.                                        --
--                                                                     --
--  Run in the Supabase SQL editor, then:                              --
--    1. Storage: create a public bucket `fleet-media`                 --
--    2. Realtime: enable publication for bookings + vehicles          --
--    3. Deploy the notify-admin edge function (functions/notify-admin) --
--    4. Enable the `pg_net` extension for the DB webhook below        --
-- ================================================================== --

create extension if not exists "pgcrypto";

-- ------------------------------ profiles ---------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Admin',
  phone text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

-- ------------------------------ vehicles ---------------------------
create table if not exists public.vehicles (
  id text primary key,
  name text not null,
  tag text not null default 'Sedan',
  seats text not null default '4+1',
  bags text not null default '2 bags',
  per_km numeric(8,2) not null check (per_km > 0),
  base_fare numeric(8,2) not null default 300,
  city_from numeric(8,2) not null default 199,
  available boolean not null default true,
  archived boolean not null default false,
  description text not null default '',
  transmission text not null default 'Manual',
  fuel text not null default 'Petrol',
  features text[] not null default '{}',
  tone text not null default 'from-sky-100 to-sky-200',
  ribbon text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text not null references public.vehicles (id) on delete cascade,
  url text not null,               -- Supabase Storage public URL
  alt text not null default '',
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists vehicle_images_vehicle_idx on public.vehicle_images (vehicle_id, sort_order);

-- ------------------------------ customers --------------------------
create table if not exists public.customers (
  id text primary key,
  name text not null,
  phone text not null,
  email text,
  alt_phone text,
  area text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (phone)                   -- normalized: no duplicate records
);

-- ------------------------------ drivers ----------------------------
create table if not exists public.drivers (
  id text primary key,
  name text not null,
  phone text not null,
  vehicle_id text references public.vehicles (id),
  on_duty boolean not null default true,
  rating numeric(3,2) not null default 4.5 check (rating between 0 and 5),
  trips int not null default 0
);

-- ------------------------------ bookings ---------------------------
-- The single authoritative booking record. `source` tells you where it
-- came from ('website' | 'phone' | 'whatsapp' | 'walk-in' | 'admin')
-- but every row flows through the exact same table + status system.
create table if not exists public.bookings (
  id text primary key,
  customer_id text not null references public.customers (id),
  driver_id text references public.drivers (id),
  vehicle_id text not null references public.vehicles (id),
  pickup text not null,
  dropoff text not null,
  route text generated always as (pickup || ' → ' || dropoff) stored,
  km int not null check (km > 0),
  trip_type text not null default 'one-way' check (trip_type in ('one-way','round')),
  pickup_at timestamptz not null,
  return_at timestamptz,
  passengers int not null default 2 check (passengers > 0),
  status text not null default 'pending'
    check (status in ('pending','confirmed','enroute','completed','cancelled','rejected')),
  fare numeric(10,2) not null default 0,
  pay_status text not null default 'pending' check (pay_status in ('paid','pending')),
  source text not null default 'website',
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists bookings_vehicle_window_idx
  on public.bookings (vehicle_id, status, pickup_at);
create index if not exists bookings_customer_idx on public.bookings (customer_id);

create table if not exists public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null references public.bookings (id) on delete cascade,
  from_status text not null default 'created',
  to_status text not null,
  changed_by text not null default 'Admin',
  changed_at timestamptz not null default now()
);

-- --------------------- availability guard (server-side) -------------
-- Prevents double-booking the same vehicle for overlapping windows.
-- Trips occupy [pickup_at, pickup_at + span], span derived from km.
create or replace function public.trip_span_hours(b_km int, b_type text, b_pickup timestamptz, b_return timestamptz)
returns interval language sql immutable as $$
  select case
    when b_type = 'round' and b_return is not null and b_return > b_pickup then b_return - b_pickup
    when b_type = 'round' then interval '24 hours'
    else (least(12, greatest(2, ceil(b_km / 45.0))) || ' hours')::interval
  end;
$$;

create or replace function public.check_vehicle_available(
  p_vehicle_id text,
  p_pickup_at timestamptz,
  p_return_at timestamptz default null,
  p_km int default 100,
  p_trip_type text default 'one-way',
  p_ignore_booking text default null
) returns boolean language sql stable as $$
  select not exists (
    select 1 from public.bookings b
    where b.vehicle_id = p_vehicle_id
      and b.id is distinct from p_ignore_booking
      and b.status in ('pending','confirmed','enroute')
      and p_pickup_at < b.pickup_at + public.trip_span_hours(b.km, b.trip_type, b.pickup_at, b.return_at)
      and b.pickup_at < p_pickup_at + public.trip_span_hours(p_km, p_trip_type, p_pickup_at, p_return_at)
  );
$$;

-- Enforce on every insert/update, whoever writes (website or CRM):
create or replace function public.enforce_availability() returns trigger
language plpgsql as $$
begin
  if new.status in ('pending','confirmed','enroute')
     and not public.check_vehicle_available(
           new.vehicle_id, new.pickup_at, new.return_at, new.km, new.trip_type, new.id)
  then
    raise exception 'Vehicle already booked for an overlapping time window';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bookings_availability on public.bookings;
create trigger trg_bookings_availability
  before insert or update on public.bookings
  for each row execute function public.enforce_availability();

-- Auto status history row on every status change:
create or replace function public.log_status_change() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_status_history (booking_id, from_status, to_status, changed_by)
    values (new.id, 'created', new.status, coalesce(current_setting('request.jwt.claims', true)::json->>'actor', 'System'));
  elsif new.status is distinct from old.status then
    insert into public.booking_status_history (booking_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, coalesce(current_setting('request.jwt.claims', true)::json->>'actor', 'Admin'));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bookings_history on public.bookings;
create trigger trg_bookings_history
  after insert or update on public.bookings
  for each row execute function public.log_status_change();

-- ------------------------ website content ---------------------------
create table if not exists public.hero_sections (
  id text primary key default 'HERO-1',
  active boolean not null default true,
  badge text not null default '',
  title text not null,
  subtitle text not null default '',
  cta_text text not null default 'Call now',
  cta_link text not null default 'tel:+919914291112',
  cta2_text text not null default '',
  cta2_link text not null default '#/booking',
  promo text not null default '',
  image_url text not null default '',
  image_pos text not null default '50% 38%',
  updated_at timestamptz not null default now()
);

create table if not exists public.website_settings (
  id int primary key default 1 check (id = 1),
  tagline text not null default '',
  phone_display text not null default '',
  phone_raw text not null default '',
  instagram_handle text not null default '',
  instagram text not null default '',
  address text not null default '',
  email text not null default '',
  wa_greeting text not null default '',
  theme_accent text not null default '#0EA5E9',
  theme_font text not null default 'bricolage',
  theme_radius int not null default 16
);

-- --------------------- notification devices -------------------------
create table if not exists public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  fcm_token text not null,
  label text not null default 'Admin device',
  created_at timestamptz not null default now(),
  unique (fcm_token)
);

-- ------------------------------ security ----------------------------
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.customers enable row level security;
alter table public.drivers enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.hero_sections enable row level security;
alter table public.website_settings enable row level security;
alter table public.notification_devices enable row level security;

-- public read for website-facing content + fleet
create policy "public read vehicles" on public.vehicles for select using (true);
create policy "public read vehicle_images" on public.vehicle_images for select using (true);
create policy "public read hero" on public.hero_sections for select using (true);
create policy "public read settings" on public.website_settings for select using (true);

-- anonymous customers may create bookings (validated by triggers/RPC);
-- everything sensitive is admin-only (Supabase Auth).
create policy "public create booking" on public.bookings
  for insert with check (source = 'website' and status = 'pending');

create policy "admin all bookings" on public.bookings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all customers" on public.customers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all drivers" on public.drivers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all vehicles" on public.vehicles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all vehicle_images" on public.vehicle_images
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin read history" on public.booking_status_history
  for select using (auth.role() = 'authenticated');
create policy "admin all hero" on public.hero_sections
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all settings" on public.website_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all devices" on public.notification_devices
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "profiles self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- booking creation RPC: validated + availability-checked server-side,
-- returns the new booking id (used by both website and CRM).
create or replace function public.create_booking(
  p_name text, p_phone text, p_email text default null, p_alt_phone text default null,
  p_vehicle_id text default null, p_pickup text default '', p_dropoff text default '',
  p_km int default 100, p_trip_type text default 'one-way',
  p_pickup_at timestamptz default now(), p_return_at timestamptz default null,
  p_passengers int default 2, p_notes text default '', p_source text default 'website'
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_customer public.customers%rowtype;
  v_vehicle public.vehicles%rowtype;
  v_fare numeric;
  v_id text;
begin
  select * into v_vehicle from vehicles where id = p_vehicle_id and not archived;
  if v_vehicle.id is null then raise exception 'Vehicle not found'; end if;
  if not v_vehicle.available then raise exception 'Vehicle unavailable'; end if;
  if not public.check_vehicle_available(p_vehicle_id, p_pickup_at, p_return_at, p_km, p_trip_type) then
    raise exception 'Vehicle already booked for an overlapping time window';
  end if;

  select * into v_customer from customers where phone = p_phone;
  if v_customer.id is null then
    insert into customers (id, name, phone, email, alt_phone, area)
    values ('CU-' || substr(gen_random_uuid()::text, 1, 6), p_name, p_phone, p_email, p_alt_phone, split_part(p_pickup, ',', 1))
    returning * into v_customer;
  end if;

  v_fare := round((p_km * v_vehicle.per_km + v_vehicle.base_fare) / 50.0) * 50;
  if p_trip_type = 'round' then v_fare := round((v_fare * 1.75) / 50.0) * 50; end if;

  v_id := 'BK-' || extract(epoch from now())::bigint;
  insert into bookings (id, customer_id, vehicle_id, pickup, dropoff, km, trip_type,
                        pickup_at, return_at, passengers, fare, source, notes)
  values (v_id, v_customer.id, p_vehicle_id, p_pickup, p_dropoff, p_km, p_trip_type,
          p_pickup_at, p_return_at, p_passengers, v_fare, p_source, p_notes);
  return v_id;
end;
$$;
grant execute on function public.create_booking(text, text, text, text, text, text, text, int, text, timestamptz, timestamptz, int, text, text) to anon, authenticated;

-- ------------------------------ realtime ----------------------------
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.vehicles;
alter publication supabase_realtime add table public.hero_sections;

-- ----------------- push: DB webhook → FCM edge function -------------
-- Requires the pg_net extension. FIREBASE_SERVER_KEY lives ONLY in the
-- edge function's secrets (supabase secrets set FIREBASE_SERVER_KEY=...).
create or replace function public.notify_new_booking() returns trigger
language plpgsql security definer as $$
begin
  if new.source = 'website' and tg_op = 'INSERT' then
    perform net.http_post(
      url := 'https://' || current_setting('app.settings.project_ref', true) || '.functions.supabase.co/notify-admin',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('booking_id', new.id, 'record', row_to_json(new))
    );
  end if;
  return new;
exception when others then
  -- notification failure must NEVER fail the booking insert
  return new;
end;
$$;

drop trigger if exists trg_bookings_notify on public.bookings;
create trigger trg_bookings_notify
  after insert on public.bookings
  for each row execute function public.notify_new_booking();

-- ------------------------------ storage -----------------------------
-- Bucket `fleet-media` (public read). Policies:
insert into storage.buckets (id, name, public) values ('fleet-media', 'fleet-media', true)
on conflict do nothing;

create policy "public read fleet media" on storage.objects
  for select using (bucket_id = 'fleet-media');
create policy "admin upload fleet media" on storage.objects
  for insert with check (bucket_id = 'fleet-media' and auth.role() = 'authenticated');
create policy "admin delete fleet media" on storage.objects
  for delete using (bucket_id = 'fleet-media' and auth.role() = 'authenticated');
