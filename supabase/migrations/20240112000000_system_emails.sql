-- Create system_emails table
create table if not exists public.system_emails (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  subject text not null,
  html_body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed data
insert into public.system_emails (key, name, subject, html_body)
values
  ('signin_alert', 'Sign In Alert', 'New Sign-In Detected', '<p>Hello {{name}},</p><p>We detected a new sign-in to your account.</p><ul><li><strong>IP Address:</strong> {{ip}}</li><li><strong>Device:</strong> {{device}}</li><li><strong>Time:</strong> {{time}}</li></ul><p>If this was you, you can ignore this email. If not, please reset your password immediately.</p>'),
  ('invite_user', 'Invite User (Credentials)', 'You have been invited to Consociate Concierge', '<p>Hello {{name}},</p><p>You have been invited to join Consociate Concierge.</p><p><strong>Your Login Credentials:</strong></p><ul><li><strong>Email:</strong> {{email}}</li><li><strong>Temporary Password:</strong> {{password}}</li></ul><p>Please <a href="{{login_url}}">login here</a> and change your password immediately.</p>'),
  ('welcome_invite', 'Welcome (Invited User)', 'Welcome to Consociate Concierge!', '<p>Welcome {{name}}!</p><p>We are thrilled to have you as a member of Consociate Concierge. Your account is now active.</p><p>Explore our services and let us know how we can assist you.</p>'),
  ('booking_autoresponder', 'Booking Autoresponder (User)', 'We received your booking request', '<p>Hi {{name}},</p><p>Thank you for your booking request for <strong>{{service}}</strong>.</p><p>We have received your details and our team is reviewing them. We will get back to you shortly to confirm.</p>'),
  ('va_autoresponder', 'VA Request Autoresponder (User)', 'VA Request Received', '<p>Hi {{name}},</p><p>We have received your Virtual Assistant request.</p><ul><li><strong>Priority:</strong> {{priority}}</li><li><strong>Deadline:</strong> {{deadline}}</li></ul><p>Our team will be in touch soon.</p>'),
  ('contact_autoresponder', 'Contact Autoresponder (User)', 'We received your message', '<p>Hi {{name}},</p><p>Thank you for contacting us.</p><p>We have received your message regarding "<strong>{{subject}}</strong>" and will respond as soon as possible.</p>'),
  ('admin_notification_booking', 'Admin Notification - New Booking', 'New Booking: {{service}}', '<p><strong>New Booking Request</strong></p><ul><li><strong>User:</strong> {{name}} ({{email}})</li><li><strong>Service:</strong> {{service}}</li><li><strong>Date:</strong> {{date}}</li></ul><p><a href="{{admin_url}}">View in Admin Panel</a></p>'),
  ('admin_notification_va', 'Admin Notification - New VA Request', 'New VA Request from {{name}}', '<p><strong>New VA Request</strong></p><ul><li><strong>User:</strong> {{name}} ({{email}})</li><li><strong>Priority:</strong> {{priority}}</li><li><strong>Deadline:</strong> {{deadline}}</li></ul><p><a href="{{admin_url}}">View in Admin Panel</a></p>'),
  ('admin_notification_contact', 'Admin Notification - New Contact', 'New Contact Message: {{subject}}', '<p><strong>New Contact Submission</strong></p><ul><li><strong>Name:</strong> {{name}}</li><li><strong>Email:</strong> {{email}}</li><li><strong>Subject:</strong> {{subject}}</li></ul><p><strong>Message:</strong><br>{{message}}</p><p><a href="{{admin_url}}">View in Admin Panel</a></p>')
on conflict (key) do update set
  name = excluded.name,
  subject = excluded.subject,
  html_body = excluded.html_body;

-- RLS
alter table public.system_emails enable row level security;
create policy "Allow read access to everyone" on public.system_emails for select using (true);
create policy "Allow update access to admins" on public.system_emails for update using (public.is_admin());
