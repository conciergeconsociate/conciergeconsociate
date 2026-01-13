// Supabase Edge Function: notify
// Sends autoresponder to user and admin notifications via Resend

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev"; // safe default
const FROM_NAME = Deno.env.get("FROM_NAME") ?? "Consociate Concierge";
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "").split(",").map((e) => e.trim()).filter(Boolean);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const MASTER_EMAIL_TEMPLATE = `<!doctype html> 
 <html lang="en"> 
   <head> 
     <meta charset="utf-8" /> 
     <meta name="viewport" content="width=device-width, initial-scale=1" /> 
     <meta http-equiv="x-ua-compatible" content="ie=edge" /> 
     <title>{{ .EmailTitle }}</title> 
  
     <style> 
       :root { color-scheme: light; supported-color-schemes: light; } 
       body { margin:0; padding:0; background:#f7f7f7; } 
       table { border-collapse:collapse; } 
       a { text-decoration:none; } 
       @media only screen and (max-width: 600px) { 
         .container { width:100% !important; } 
         .p-24 { padding:16px !important; } 
         .brand-title { font-size:20px !important; } 
         .h1 { font-size:22px !important; } 
         .logo { width:120px !important; } 
       } 
     </style> 
   </head> 
  
   <body style="margin:0; padding:0; background:#f7f7f7;"> 
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0"> 
       <tr> 
         <td align="center"> 
  
           <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background:#ffffff; margin:24px 0; border:1px solid #eaeaea; border-radius:8px; overflow:hidden;"> 
  
             <!-- Header --> 
             <tr> 
               <td style="background:#1B2A62; padding:20px; text-align:center;"> 
  
                 <!-- SVG Logo -->
                <div style="display:block; margin:0 auto 10px; max-width:130px;">
                  <?xml version="1.0" standalone="no"?> 
                  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" 
                    "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd"> 
                  <svg version="1.0" 
                       xmlns="http://www.w3.org/2000/svg" 
                       width="130" 
                       height="130" 
                       viewBox="0 0 500.000000 500.000000" 
                       preserveAspectRatio="xMidYMid meet"> 
                   
                    <g transform="translate(0.000000,500.000000) scale(0.100000,-0.100000)" 
                       stroke="none"> 
                   
                      <!-- TOP RING --> 
                      <path fill="#f6ae3d" d="M1761 3349 c-251 -49 -473 -208 -598 -428 -61 -106 -58 -98 -35 -104 14 -4 13 -5 -3 -6 -22 -1 -65 -119 -65 -176 l0 -25 155 0 c166 0 162 -1 169 51 2 13 8 37 15 52 6 16 11 32 11 37 0 14 -132 60 -200 70 l-65 9 72 -3 c54 -2 87 -11 137 -34 l65 -31 30 48 c165 268 526 330 791 135 80 -58 83 -67 54 -134 -32 -74 -31 -90 4 -57 101 97 281 97 400 0 49 -40 50 -37 16 57 l-27 72 39 35 c298 265 792 131 888 -241 9 -32 17 -60 18 -62 13 -13 318 -7 318 6 0 81 -81 280 -155 385 -276 388 -853 474 -1207 181 -80 -67 -78 -66 -137 -18 -194 161 -451 228 -690 181z"/> 
                   
                      <!-- BELL DETAILS --> 
                      <path fill="#ffffff" d="M2460 2726 c-14 -7 -50 -19 -80 -26 -70 -16 -97 -29 -80 -40 17 -11 101 0 125 16 20 15 74 18 113 8 44 -12 21 -20 -49 -16 -85 5 -96 -18 -14 -30 30 -4 57 -16 74 -32 23 -22 65 -38 144 -53 25 -5 27 -3 27 29 0 62 -18 98 -49 96 -14 -1 -46 11 -70 26 -52 33 -106 42 -141 22z"/> 
                   
                      <path fill="#ffffff" d="M2482 2579 c3 -29 -1 -33 -39 -46 -34 -12 -48 -24 -70 -63 -15 -27 -30 -47 -33 -45 -3 2 -10 -8 -17 -21 -6 -13 -7 -24 -2 -24 5 0 9 5 9 10 0 6 7 10 16 10 8 0 12 -4 9 -10 -4 -7 52 -10 159 -10 104 0 166 4 166 10 0 6 -6 10 -14 10 -8 0 -12 7 -10 18 8 31 -32 79 -95 112 -60 32 -72 45 -49 52 15 5 1 28 -18 28 -10 0 -13 -10 -12 -31z"/> 
                   
                      <!-- BOTTOM RING --> 
                      <path fill="#f6ae3d" d="M1060 2358 c1 -118 104 -331 224 -465 294 -327 873 -356 1184 -60 l32 31 33 -31 c225 -215 630 -269 932 -124 173 83 323 233 410 411 22 47 75 223 75 251 0 5 -72 9 -159 9 l-160 0 -11 -53 c-65 -315 -457 -498 -755 -353 -72 36 -170 118 -168 142 0 10 13 52 28 92 31 86 27 97 -18 55 -108 -103 -281 -110 -404 -16 l-46 35 7 -29 c4 -15 18 -54 31 -87 29 -72 29 -72 -50 -130 -196 -144 -425 -152 -626 -23 -113 72 -218 215 -235 318 l-6 36 -112 6 c-192 12 -206 11 -206 -15z"/> 
                   
                      <!-- CLAPPER / BASE --> 
                      <path fill="#ffffff" d="M2286 2354 c-11 -28 0 -29 217 -26 189 3 208 5 205 20 -5 26 -412 31 -422 6z"/> 
                   
                    </g> 
                  </svg>
                </div> 
  
                 <div class="brand-title" style="font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:700; color:#ffffff;"> 
                   Consociate Concierge 
                 </div> 
  
               </td> 
             </tr> 
  
             <!-- BODY WRAPPER --> 
             <tr> 
               <td class="p-24" style="padding:24px;"> 
                 <table role="presentation" width="100%"> 
  
                   <!-- 🔁 DYNAMIC EMAIL CONTENT START --> 
                   <!-- Inject title, text, buttons, links here --> 
                   {{ .EmailBody }} 
                   <!-- 🔁 DYNAMIC EMAIL CONTENT END --> 
  
                 </table> 
               </td> 
             </tr> 
  
             <!-- Footer --> 
             <tr> 
               <td style="background:#fafafa; padding:16px; border-top:1px solid #eaeaea;"> 
                 <table role="presentation" width="100%"> 
                   <tr> 
                     <td style="font-family:Arial, Helvetica, sans-serif; font-size:12px; text-align:center; color:#6b6b6b;"> 
                       © {{ .CurrentYear }} Consociate Concierge • All rights reserved 
                     </td> 
                   </tr> 
                 </table> 
               </td> 
             </tr> 
  
           </table> 
  
         </td> 
       </tr> 
     </table> 
   </body> 
 </html>`;

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
  if (!res.ok) {
      console.error("Resend API error:", data);
  }
  return { ok: res.ok, status: res.status, data };
}

async function getTemplate(key: string) {
  const { data, error } = await supabase.from("system_emails").select("subject, html_body").eq("key", key).maybeSingle();
  if (error) {
    console.error(`Failed to fetch template for key ${key}:`, error);
    return null;
  }
  return data;
}

async function getMasterTemplate() {
  const { data, error } = await supabase.from("system_emails").select("html_body").eq("key", "master_template").maybeSingle();
  if (error || !data) {
    return MASTER_EMAIL_TEMPLATE;
  }
  return data.html_body;
}

async function applyMasterTemplate(subject: string, body: string) {
  const template = await getMasterTemplate();
  const currentYear = new Date().getFullYear().toString();
  return template
    .replace(/\{\{\s*[.]EmailTitle\s*\}\}/g, subject)
    .replace(/\{\{\s*[.]EmailBody\s*\}\}/g, body)
    .replace(/\{\{\s*[.]CurrentYear\s*\}\}/g, currentYear);
}

function replacePlaceholders(tpl: string, data: Record<string, any>) {
  return tpl.replace(/\{\{([\w\.]+)\}\}/g, (match, k) => {
    return data[k] !== undefined ? String(data[k]) : match;
  });
}

function renderUserTemplate(type: string, data: Record<string, unknown>) {
  switch (type) {
    case "signin_alert": {
      return {
        subject: "New Sign-In Detected",
        html: `
          <p>Hello ${data.name || "User"},</p>
          <p>We detected a new sign-in to your account.</p>
          <ul>
            <li><strong>IP Address:</strong> ${data.ip || "Unknown"}</li>
            <li><strong>Device:</strong> ${data.device || "Unknown"}</li>
            <li><strong>Time:</strong> ${data.time || new Date().toLocaleString()}</li>
          </ul>
          <p>If this was you, you can ignore this email. If not, please reset your password immediately.</p>
        `
      };
    }
    case "virtual_assistance_request": {
      const name = `${data.salutation ?? ""} ${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
      return {
        subject: "We received your virtual assistant request",
        html: `
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
        `,
      };
    }
    case "newsletter_subscription": {
      return {
        subject: "Welcome to Consociate Concierge Newsletter",
        html: `
            <p>Thank you for subscribing to our newsletter.</p>
            <p>You will receive curated insights and updates from our team.</p>
            <p>Best regards,<br/>Consociate Concierge</p>
        `,
      };
    }
    case "contact_submission": {
      return {
        subject: "We received your message",
        html: `
            <p>Thank you for contacting Consociate Concierge.</p>
            <p>Our team will respond to your inquiry shortly.</p>
            <p>Subject: ${data.subject ?? "-"}</p>
            <p>Best regards,<br/>Consociate Concierge</p>
        `,
      };
    }
    case "concierge_request": {
      return {
        subject: "Your concierge request was received",
        html: `
            <p>Thank you for your concierge request.</p>
            <p>We will contact you to finalize your booking.</p>
            <p>Service: ${data.service ?? "-"}</p>
            <p>Best regards,<br/>Consociate Concierge</p>
        `,
      };
    }
    case "password_reset_requested": {
      return {
        subject: "Password reset requested",
        html: `
            <p>We received a request to reset the password for your account.</p>
            <p>If you initiated this request, please check your inbox for the official reset link.</p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
            <p>Best regards,<br/>Consociate Concierge</p>
        `,
      };
    }
    case "subscription_purchase": {
      const planName = data.plan_name ?? data.plan?.name ?? "your selected plan";
      const price = data.discounted_price ?? data.final_price ?? data.price ?? "";
      return {
        subject: `Welcome — ${String(planName)}`,
        html: `
            <p>Thank you for choosing Consociate Concierge.</p>
            <p>Your subscription to <strong>${planName}</strong> was received.</p>
            ${price ? `<p>Amount: ₦${Number(price).toLocaleString()}</p>` : ""}
            <p>We’ve sent you a password reset link to set your account password.</p>
            <p>We’re excited to serve you.</p>
            <p>Best regards,<br/>Consociate Concierge</p>
        `,
      };
    }
    case "account_created": {
      const name = data.full_name ?? data.name ?? "there";
      return {
        subject: "Your account has been created",
        html: `
            <p>Hi ${name},</p>
            <p>Your account was successfully created. A password reset link has been emailed separately so you can set your password.</p>
            <p>If you need assistance, just reply to this email.</p>
            <p>Best regards,<br/>Consociate Concierge</p>
        `,
      };
    }
    case "login_information": {
      const name = data.full_name ?? data.name ?? "User";
      return {
        subject: "Your Login Information - Concierge Consociate",
        html: `
            <p>Hello ${name},</p>
            <p>Thank you for subscribing to the <strong>${data.plan_name}</strong> plan.</p>
            <p>Your account has been successfully created. You can log in using the link below:</p>
            <p><a href="${data.login_link}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a></p>
            <p><strong>Plan Details:</strong></p>
            <ul>
              <li>Plan: ${data.plan_name}</li>
              <li>Duration: ${data.duration}</li>
              <li>Price: ${data.price}</li>
            </ul>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Best regards,<br>Concierge Consociate Team</p>
        `,
      };
    }
    case "subscription_updated": {
      const name = data.full_name ?? data.name ?? "User";
      return {
        subject: "Your subscription has been updated",
        html: `
            <p>Hello ${name},</p>
            <p>Your subscription has been successfully upgraded to <strong>${data.plan_name}</strong>.</p>
            <p><strong>Plan Details:</strong></p>
            <ul>
              <li>Plan: ${data.plan_name}</li>
              <li>Duration: ${data.duration}</li>
              <li>Price: ${data.price}</li>
            </ul>
            <p>You can now enjoy the benefits of your new plan.</p>
            <p>Best regards,<br>Concierge Consociate Team</p>
        `,
      };
    }
    default:
      console.warn(`Unknown email type: ${type}`);
      return { subject: "We received your submission", html: "<p>Thank you (Fallback).</p>" };
  }
}

function renderAdminTemplate(type: string, data: Record<string, unknown>) {
  const ts = new Date().toISOString();
  return {
    subject: `[New ${type}] ${data.email ?? data.name ?? "submission"}`,
    html: `
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Timestamp:</strong> ${ts}</p>
        <pre style="background:#f7f7f7;padding:12px;border:1px solid #eee">${JSON.stringify(data, null, 2)}</pre>
    `,
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }
  let body: { type?: string; data?: Record<string, unknown>; userEmail?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: corsHeaders });
  }
  const { type, data = {}, userEmail } = body;
  if (!type) return new Response(JSON.stringify({ error: "missing_type" }), { status: 400, headers: corsHeaders });

  // Normalise data for templates
  if (data.full_name && !data.name) data.name = data.full_name;

  // Determine template keys
  let userKey = "";
  let adminKey = "";
  if (type === "virtual_assistance_request") { userKey = "va_autoresponder"; adminKey = "admin_notification_va"; }
  else if (type === "contact_submission") { userKey = "contact_autoresponder"; adminKey = "admin_notification_contact"; }
  else if (type === "concierge_request") { userKey = "booking_autoresponder"; adminKey = "admin_notification_booking"; }
  else if (type === "signin_alert") { userKey = "signin_alert"; }
  else if (type === "account_created") { userKey = "account_created"; }
  else if (type === "subscription_purchase") { userKey = "subscription_purchase"; }
  else if (type === "subscription_updated") { userKey = "subscription_updated"; }
  else if (type === "newsletter_subscription") { userKey = "newsletter_welcome"; }
  else if (type === "password_reset_requested") { userKey = "password_reset"; }
  else if (type === "login_information") { userKey = "login_information"; }

  // Fetch templates from DB
  let userTpl: { subject: string; html: string } | null = null;
  let adminTpl: { subject: string; html: string } | null = null;

  if (userKey) {
    const dbTpl = await getTemplate(userKey);
    if (dbTpl) {
      userTpl = {
        subject: replacePlaceholders(dbTpl.subject, data),
        html: replacePlaceholders(dbTpl.html_body, data),
      };
    }
  }

  if (adminKey) {
    const dbTpl = await getTemplate(adminKey);
    if (dbTpl) {
      const adminData = { ...data, details: JSON.stringify(data, null, 2) };
      adminTpl = {
        subject: replacePlaceholders(dbTpl.subject, adminData),
        html: replacePlaceholders(dbTpl.html_body, adminData),
      };
    }
  }

  // Fallback to hardcoded if not found in DB
  if (!userTpl && userEmail) {
    userTpl = renderUserTemplate(type, data);
  }
  if (!adminTpl && ADMIN_EMAILS.length > 0) {
    adminTpl = renderAdminTemplate(type, data);
  }

  // Send autoresponder to user (if email present)
  let userResult: unknown = null;
  if (userEmail && userTpl) {
    const finalHtml = await applyMasterTemplate(userTpl.subject, userTpl.html);
    userResult = await sendResendEmail(userEmail, userTpl.subject, finalHtml);
  }

  // Send admin notification if configured
  let adminResult: unknown = null;
  if (ADMIN_EMAILS.length > 0 && adminTpl) {
    const finalHtml = await applyMasterTemplate(adminTpl.subject, adminTpl.html);
    adminResult = await sendResendEmail(ADMIN_EMAILS, adminTpl.subject, finalHtml);
  }

  return new Response(JSON.stringify({ ok: true, user: userResult, admin: adminResult }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
