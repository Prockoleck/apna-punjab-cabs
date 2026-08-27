-- Grant table permissions so service_role (edge functions) can access all tables
grant select, insert, update, delete on public.notification_devices to service_role;
grant select on public.customers to service_role;
grant select on public.vehicles to service_role;
