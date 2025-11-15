-- Seed recommended feature toggles and page hero defaults
-- Run in Supabase SQL editor after creating tables

begin;

-- Feature toggles used across the main website navigation and sections
insert into public.site_settings (group_name, key, value_bool, value_text, value_json) values
  ('nav', 'login.visible', true, null, null),
  ('nav', 'membership.visible', true, null, null),
  ('nav', 'venue.visible', true, null, null),
  ('nav', 'blog.visible', true, null, null),
  ('nav', 'services.visible', true, null, null),

  ('features', 'auth.login.visible', true, null, null),
  ('features', 'membership.buttons.visible', true, null, null),
  ('features', 'venue.buttons.visible', true, null, null),

  ('home', 'hero.membership_cta.visible', true, null, null),
  ('home', 'featured_venues.visible', true, null, null),
  ('home', 'membership.visible', true, null, null),
  ('home', 'faq.visible', true, null, null),
  ('home', 'virtual_assistance.visible', true, null, null),

  ('services', 'concierge.visible', true, null, null),

  ('service_details', 'membership_cta.visible', true, null, null),

  ('venue_details', 'open_times.visible', true, null, null),

  ('about', 'tabs.visible', true, null, null),

  ('contact', 'faq.visible', true, null, null),

  ('membership', 'hero.visible', true, null, null),
  ('membership', 'plans.visible', true, null, null),

  ('global', 'testimonials.visible', true, null, null),
  ('footer', 'social.visible', true, null, null)

on conflict (group_name, key)
  do update set
    value_bool = excluded.value_bool,
    value_text = excluded.value_text,
    value_json = excluded.value_json;

-- Seed default contact info (if none exists, this provides initial values)
insert into public.contact_info (address, emails, phones, facebook, instagram, whatsapp)
values (
  '123 Crafted Ave, Lagos, Nigeria',
  ARRAY['hello@craftedcore.com'],
  ARRAY['+2348012345678'],
  'https://facebook.com/craftedcore',
  'https://instagram.com/craftedcore',
  'https://wa.me/2348012345678'
)
on conflict do nothing;

-- Seed extended social links
insert into public.social_links (platform, url, is_active) values
  ('facebook', 'https://facebook.com/craftedcore', true),
  ('instagram', 'https://instagram.com/craftedcore', true),
  ('whatsapp', 'https://wa.me/2348012345678', true),
  ('twitter', 'https://twitter.com/craftedcore', true),
  ('linkedin', 'https://www.linkedin.com/company/craftedcore', true),
  ('youtube', 'https://www.youtube.com/@craftedcore', true)
on conflict (platform) do update set
  url = excluded.url,
  is_active = excluded.is_active;

-- Page hero defaults for main pages
insert into public.pages (slug, title, path, is_main, is_visible, hero_title, hero_subtitle, hero_background_image, metadata) values
  ('home', 'Home', '/', true, true, 'Crafted Core', 'Elite services and venues, tailored to you.', '/placeholder.svg', '{}'::jsonb),
  ('services', 'Services', '/services', false, true, 'Explore Our Services', 'Premium offerings across categories.', '/placeholder.svg', '{}'::jsonb),
  ('service-details', 'Service Details', '/services/:id', false, true, 'Service Details', 'Description, images, and category.', '/placeholder.svg', '{}'::jsonb),
  ('venues', 'Venues', '/venues', false, true, 'Featured Venues', 'Discover curated locations and experiences.', '/placeholder.svg', '{}'::jsonb),
  ('venue-details', 'Venue Details', '/venues/:id', false, true, 'Venue Details', 'Address, map, and opening times.', '/placeholder.svg', '{}'::jsonb),
  ('blog', 'Blog', '/blog', false, true, 'Latest Insights', 'News and stories from our community.', '/placeholder.svg', '{}'::jsonb),
  ('about', 'About Us', '/about', false, true, 'About Crafted Core', 'Our vision and mission.', '/placeholder.svg', '{}'::jsonb),
  ('contact', 'Contact Us', '/contact', false, true, 'Get In Touch', 'We are here to help.', '/placeholder.svg', '{}'::jsonb),
  ('membership', 'Membership', '/membership', false, true, 'Membership Plans', 'Exclusive benefits for members.', '/placeholder.svg', '{}'::jsonb)

on conflict (slug)
  do update set
    title = excluded.title,
    path = excluded.path,
    is_main = excluded.is_main,
    is_visible = excluded.is_visible,
    hero_title = excluded.hero_title,
    hero_subtitle = excluded.hero_subtitle,
    hero_background_image = excluded.hero_background_image,
    metadata = excluded.metadata;

commit;