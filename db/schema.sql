-- Enable UUID generation
create extension if not exists pgcrypto;

-- Services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  short_description text not null,
  detailed_description text not null,
  category text not null,
  images text[] not null default '{}',
  videos text[] not null default '{}',
  hidden boolean not null default false
);
alter table public.services enable row level security;
create policy "Allow public read" on public.services for select using (true);

-- Venues
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  short_description text not null,
  detailed_description text not null,
  category text not null,
  niche text,
  address text,
  weekday_hours text,
  sunday_hours text,
  map_url text,
  images text[] not null default '{}',
  hidden boolean not null default false
);
alter table public.venues enable row level security;
create policy "Allow public read" on public.venues for select using (true);

-- Blogs
create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  excerpt text,
  content text not null,
  author text,
  date date,
  image text,
  category text
);
alter table public.blogs enable row level security;
create policy "Allow public read" on public.blogs for select using (true);

-- Membership Plans
create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  duration text not null,
  price integer not null,
  currency text not null,
  benefits text[] not null default '{}',
  cover_image text,
  show_on_website boolean not null default true
);
alter table public.membership_plans enable row level security;
create policy "Allow public read" on public.membership_plans for select using (true);

-- FAQs
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  question text not null,
  answer text not null
);
alter table public.faqs enable row level security;
create policy "Allow public read" on public.faqs for select using (true);

-- Testimonials
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  role text,
  content text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  image text
);
alter table public.testimonials enable row level security;
create policy "Allow public read" on public.testimonials for select using (true);

-- Contact Info
create table if not exists public.contact_info (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  address text not null,
  emails text[] not null default '{}',
  phones text[] not null default '{}',
  facebook text,
  instagram text,
  whatsapp text
);
alter table public.contact_info enable row level security;
create policy "Allow public read" on public.contact_info for select using (true);

-- Concierge Requests
create table if not exists public.concierge_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid,
  name text not null,
  email text not null,
  phone text not null,
  service text not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending','reviewed','contacted','closed'))
);
alter table public.concierge_requests enable row level security;
create policy "Allow public insert" on public.concierge_requests for insert with check (true);
create policy "Read own requests" on public.concierge_requests for select using (user_id = auth.uid());