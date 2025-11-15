// Supabase Edge Function: notify
// Sends autoresponder to user and admin notifications via Resend

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev"; // safe default
const FROM_NAME = Deno.env.get("FROM_NAME") ?? "Consociate Concierge";
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "").split(",").map((e) => e.trim()).filter(Boolean);

async function sendResendEmail(to: string | string[], subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return { ok: false, error: "missing_api_key" };
  }
  const recipients = Array.isArray(to) ? to : [to];
  const payload = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: recipients,
    subject,
    html,
  };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function renderUserTemplate(type: string, data: Record<string, unknown>) {
  switch (type) {
    case "virtual_assistance_request": {
      const name = `${data.salutation ?? ""} ${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
      return {
        subject: "We received your virtual assistant request",
        html: `
          <div style="font-family:Arial, sans-serif">
            <p>Hi ${name || "there"},</p>
            <p>Thank you for submitting your Virtual Assistant request to Consociate Concierge.</p>
            <p>Our team will review your details and reach out shortly.</p>
            <p><strong>Summary:</strong></p>
            <ul>
              <li>Service: ${data.service ?? "-"}</li>
              <li>Priority: ${data.priority ?? "-"}</li>
              <li>Deadline: ${data.deadline ?? "-"}</li>
            </ul>
            <p>Best regards,<br/>Consociate Concierge</p>
          </div>
        `,
      };
    }
    case "newsletter_subscription": {
      return {
        subject: "Welcome to Consociate Concierge Newsletter",
        html: `
          <div style="font-family:Arial, sans-serif">
            <p>Thank you for subscribing to our newsletter.</p>
            <p>You will receive curated insights and updates from our team.</p>
            <p>Best regards,<br/>Consociate Concierge</p>
          </div>
        `,
      };
    }
    case "contact_submission": {
      return {
        subject: "We received your message",
        html: `
          <div style="font-family:Arial, sans-serif">
            <p>Thank you for contacting Consociate Concierge.</p>
            <p>Our team will respond to your inquiry shortly.</p>
            <p>Subject: ${data.subject ?? "-"}</p>
            <p>Best regards,<br/>Consociate Concierge</p>
          </div>
        `,
      };
    }
    case "concierge_request": {
      return {
        subject: "Your concierge request was received",
        html: `
          <div style="font-family:Arial, sans-serif">
            <p>Thank you for your concierge request.</p>
            <p>We will contact you to finalize your booking.</p>
            <p>Service: ${data.service ?? "-"}</p>
            <p>Best regards,<br/>Consociate Concierge</p>
          </div>
        `,
      };
    }
    default:
      return { subject: "We received your submission", html: "<p>Thank you.</p>" };
    case "password_reset_requested": {
      return {
        subject: "Password reset requested",
        html: `
          <div style="font-family:Arial, sans-serif">
            <p>We received a request to reset the password for your account.</p>
            <p>If you initiated this request, please check your inbox for the official reset link.</p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
            <p>Best regards,<br/>Consociate Concierge</p>
          </div>
        `,
      };
    }
    case "subscription_purchase": {
      const planName = data.plan_name ?? data.plan?.name ?? "your selected plan";
      const price = data.discounted_price ?? data.final_price ?? data.price ?? "";
      return {
        subject: `Welcome — ${String(planName)}`,
        html: `
          <div style="font-family:Arial, sans-serif">
            <p>Thank you for choosing Consociate Concierge.</p>
            <p>Your subscription to <strong>${planName}</strong> was received.</p>
            ${price ? `<p>Amount: ₦${Number(price).toLocaleString()}</p>` : ""}
            <p>We’ve sent you a password reset link to set your account password.</p>
            <p>We’re excited to serve you.</p>
            <p>Best regards,<br/>Consociate Concierge</p>
          </div>
        `,
      };
    }
    case "account_created": {
      const name = data.full_name ?? data.name ?? "there";
      return {
        subject: "Your account has been created",
        html: `
          <div style="font-family:Arial, sans-serif">
            <p>Hi ${name},</p>
            <p>Your account was successfully created. A password reset link has been emailed separately so you can set your password.</p>
            <p>If you need assistance, just reply to this email.</p>
            <p>Best regards,<br/>Consociate Concierge</p>
          </div>
        `,
      };
    }
  }
}

function renderAdminTemplate(type: string, data: Record<string, unknown>) {
  const ts = new Date().toISOString();
  return {
    subject: `[New ${type}] ${data.email ?? data.name ?? "submission"}`,
    html: `
      <div style="font-family:Arial, sans-serif">
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Timestamp:</strong> ${ts}</p>
        <pre style="background:#f7f7f7;padding:12px;border:1px solid #eee">${JSON.stringify(data, null, 2)}</pre>
      </div>
    `,
  };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  let body: { type?: string; data?: Record<string, unknown>; userEmail?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 });
  }
  const { type, data = {}, userEmail } = body;
  if (!type) return new Response(JSON.stringify({ error: "missing_type" }), { status: 400 });

  // Send autoresponder to user (if email present)
  let userResult: unknown = null;
  if (userEmail) {
    const userTpl = renderUserTemplate(type, data);
    userResult = await sendResendEmail(userEmail, userTpl.subject, userTpl.html);
  }

  // Send admin notification if configured
  let adminResult: unknown = null;
  if (ADMIN_EMAILS.length > 0) {
    const adminTpl = renderAdminTemplate(type, data);
    adminResult = await sendResendEmail(ADMIN_EMAILS, adminTpl.subject, adminTpl.html);
  }

  return new Response(JSON.stringify({ ok: true, user: userResult, admin: adminResult }), {
    headers: { "Content-Type": "application/json" },
  });
});