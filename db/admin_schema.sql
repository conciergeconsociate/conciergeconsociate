-- Admin and extended schema for Crafted Core
-- Run in Supabase SQL editor or via Supabase CLI

-- Ensure pgcrypto is available for UUID generation
create extension if not exists pgcrypto;

-- Create enum for user roles if missing
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin','member','user');
  end if;
end$$;

-- Profiles table (links to auth.users by id)
create table if not exists public.profiles (
  id uuid primary key, -- should equal auth.uid()
  created_at timestamptz not null default now(),
  email text,
  full_name text,
  phone text,
  role user_role not null default 'user'
);
create index if not exists profiles_role_idx on public.profiles(role);
create unique index if not exists profiles_email_unique on public.profiles(email);

-- Helper function to check admin role
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Website visits analytics
create table if not exists public.website_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  ip inet,
  country text,
  region text,
  city text,
  path text,
  referrer text,
  user_agent text
);
create index if not exists website_visits_created_at_idx on public.website_visits(created_at);
create index if not exists website_visits_ip_idx on public.website_visits(ip);

-- Contact submissions (Contact Us)
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status text not null default 'open' check (status in ('open','closed'))
);
create index if not exists contact_submissions_status_idx on public.contact_submissions(status);

-- Email campaigns (bulk emails to contacts or users)
create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft','scheduled','sent','failed')),
  scheduled_at timestamptz
);
create table if not exists public.email_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  email text not null,
  name text,
  status text not null default 'pending' check (status in ('pending','sent','failed'))
);
create index if not exists email_campaign_recipients_campaign_idx on public.email_campaign_recipients(campaign_id);

-- Accounts and transfers (for admin account overview and balance transfers)
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  owner_id uuid references public.profiles(id) on delete set null,
  currency text not null default 'NGN',
  balance numeric(14,2) not null default 0
);
create index if not exists accounts_owner_idx on public.accounts(owner_id);

create table if not exists public.account_transfers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  from_account_id uuid references public.accounts(id) on delete set null,
  to_account_id uuid references public.accounts(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  reason text
);
create index if not exists account_transfers_from_idx on public.account_transfers(from_account_id);
create index if not exists account_transfers_to_idx on public.account_transfers(to_account_id);

-- Media library
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('image','video')),
  url text not null,
  page_slug text,
  alt_text text,
  tags text[] not null default '{}',
  is_published boolean not null default true
);

-- Virtual Assistance Requests
create table if not exists public.virtual_assistance_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid,
  name text not null,
  email text not null,
  phone text,
  topic text not null,
  details text not null,
  status text not null default 'pending' check (status in ('pending','reviewed','contacted','closed'))
);
create index if not exists virtual_assistance_status_idx on public.virtual_assistance_requests(status);

-- Vouchers
create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  code text unique not null,
  type text not null check (type in ('percentage','fixed')),
  value numeric(10,2) not null,
  currency text not null default 'NGN',
  description text,
  valid_from timestamptz,
  valid_to timestamptz,
  usage_limit integer,
  usage_count integer not null default 0,
  is_active boolean not null default true,
  assigned_to uuid references public.profiles(id) on delete set null
);
create table if not exists public.voucher_redemptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  voucher_id uuid not null references public.vouchers(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  amount_applied numeric(10,2),
  notes text
);
create index if not exists voucher_redemptions_voucher_idx on public.voucher_redemptions(voucher_id);

-- Pages (for hero message editing and link management)
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  slug text unique not null,
  title text not null,
  path text not null,
  is_main boolean not null default false,
  is_visible boolean not null default true,
  hero_title text,
  hero_subtitle text,
  hero_background_image text,
  metadata jsonb not null default '{}'::jsonb
);

-- Site settings and feature toggles
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  group_name text not null,
  key text not null,
  value_bool boolean,
  value_text text,
  value_json jsonb,
  unique(group_name, key)
);

-- Minor extensions to existing tables for requested toggles
alter table if exists public.venues
  add column if not exists is_featured boolean not null default false;

alter table if exists public.concierge_requests
  add column if not exists updated_at timestamptz not null default now();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.website_visits enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.email_campaigns enable row level security;
alter table public.email_campaign_recipients enable row level security;
alter table public.accounts enable row level security;
alter table public.account_transfers enable row level security;
alter table public.media_assets enable row level security;
alter table public.virtual_assistance_requests enable row level security;
alter table public.vouchers enable row level security;
alter table public.voucher_redemptions enable row level security;
alter table public.pages enable row level security;
alter table public.site_settings enable row level security;

-- Policies
-- Profiles: owners manage own, admins manage all
create policy if not exists profiles_owner_select on public.profiles
  for select using (id = auth.uid());
create policy if not exists profiles_owner_update on public.profiles
  for update using (id = auth.uid());
create policy if not exists profiles_admin_all on public.profiles
  for all using (public.is_admin());

-- Public content read, admin write
create policy if not exists public_select_services on public.services
  for select using (true);
create policy if not exists admin_all_services on public.services
  for all using (public.is_admin());

create policy if not exists public_select_venues on public.venues
  for select using (true);
create policy if not exists admin_all_venues on public.venues
  for all using (public.is_admin());

create policy if not exists public_select_blogs on public.blogs
  for select using (true);
create policy if not exists admin_all_blogs on public.blogs
  for all using (public.is_admin());

create policy if not exists public_select_membership_plans on public.membership_plans
  for select using (true);
create policy if not exists admin_all_membership_plans on public.membership_plans
  for all using (public.is_admin());

create policy if not exists public_select_faqs on public.faqs
  for select using (true);
create policy if not exists admin_all_faqs on public.faqs
  for all using (public.is_admin());

create policy if not exists public_select_testimonials on public.testimonials
  for select using (true);
create policy if not exists admin_all_testimonials on public.testimonials
  for all using (public.is_admin());

create policy if not exists public_select_contact_info on public.contact_info
  for select using (true);
create policy if not exists admin_all_contact_info on public.contact_info
  for all using (public.is_admin());

create policy if not exists public_select_pages on public.pages
  for select using (true);
create policy if not exists admin_all_pages on public.pages
  for all using (public.is_admin());

create policy if not exists public_select_media_assets on public.media_assets
  for select using (true);
create policy if not exists admin_all_media_assets on public.media_assets
  for all using (public.is_admin());

create policy if not exists public_select_site_settings on public.site_settings
  for select using (true);
create policy if not exists admin_all_site_settings on public.site_settings
  for all using (public.is_admin());

-- Concierge requests: allow insert (public), owners read own, admins read all
create policy if not exists concierge_requests_public_insert on public.concierge_requests
  for insert with check (true);
create policy if not exists concierge_requests_owner_select on public.concierge_requests
  for select using (user_id = auth.uid());
create policy if not exists concierge_requests_admin_all on public.concierge_requests
  for all using (public.is_admin());

-- Website visits: allow insert (public), admins read
create policy if not exists website_visits_public_insert on public.website_visits
  for insert with check (true);
create policy if not exists website_visits_admin_select on public.website_visits
  for select using (public.is_admin());

-- Contact submissions: allow insert (public), admins read
create policy if not exists contact_submissions_public_insert on public.contact_submissions
  for insert with check (true);
create policy if not exists contact_submissions_admin_select on public.contact_submissions
  for select using (public.is_admin());

-- Email campaigns: admins only
create policy if not exists email_campaigns_admin_all on public.email_campaigns
  for all using (public.is_admin());
create policy if not exists email_campaign_recipients_admin_all on public.email_campaign_recipients
  for all using (public.is_admin());

-- Accounts: owners read, admins manage; transfers: admins manage
create policy if not exists accounts_owner_select on public.accounts
  for select using (owner_id = auth.uid());
create policy if not exists accounts_admin_all on public.accounts
  for all using (public.is_admin());

create policy if not exists account_transfers_admin_all on public.account_transfers
  for all using (public.is_admin());

-- Virtual assistance requests: allow insert (public), owner read, admin all
create policy if not exists virtual_assistance_public_insert on public.virtual_assistance_requests
  for insert with check (true);
create policy if not exists virtual_assistance_owner_select on public.virtual_assistance_requests
  for select using (user_id = auth.uid());
create policy if not exists virtual_assistance_admin_all on public.virtual_assistance_requests
  for all using (public.is_admin());

-- Vouchers and redemptions: admins manage
create policy if not exists vouchers_admin_all on public.vouchers
  for all using (public.is_admin());
create policy if not exists voucher_redemptions_admin_all on public.voucher_redemptions
  for all using (public.is_admin());

-- Newsletter subscriptions
create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  source text,
  path text,
  referrer text,
  user_agent text,
  status text not null default 'active' check (status in ('active','unsubscribed'))
);
alter table public.newsletter_subscriptions enable row level security;
create policy if not exists newsletter_public_insert on public.newsletter_subscriptions
  for insert with check (true);
create policy if not exists newsletter_admin_all on public.newsletter_subscriptions
  for all using (public.is_admin());