import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export function badRequest(res: VercelResponse, message: string, code = 400) {
  return res.status(code).json({ ok: false, error: message });
}

export function getClients() {
  const SUPABASE_URL = process.env.SUPABASE_URL as string | undefined;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  const RESEND_API_KEY = process.env.RESEND_API_KEY as string | undefined;
  const FROM_EMAIL = process.env.FROM_EMAIL as string | undefined;
  const FROM_NAME = process.env.FROM_NAME as string | undefined;
  const EMAIL_LOGO_URL = process.env.EMAIL_LOGO_URL as string | undefined;
  const RESEND_FROM = (process.env.RESEND_FROM as string | undefined) || (FROM_EMAIL && FROM_NAME ? `${FROM_NAME} <${FROM_EMAIL}>` : FROM_EMAIL || "no-reply@craftedcore.local");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variable");
  }
  if (!RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY env variable");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const resend = new Resend(RESEND_API_KEY);

  return { supabase, resend, from: RESEND_FROM, logoUrl: EMAIL_LOGO_URL };
}

export function getBaseUrl(req: VercelRequest) {
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = (req.headers["host"] as string) || process.env.VERCEL_URL || process.env.SITE_URL || "";
  // If host already includes protocol, avoid double-prepending
  if (/^https?:\/\//i.test(host)) return host;
  return host ? `${proto}://${host}` : `${proto}://localhost:3000`;
}

export async function sendEmail(resend: Resend, from: string, to: string, subject: string, html: string, text?: string) {
  const result = await resend.emails.send({ from, to, subject, html, text });
  if ((result as any)?.error) {
    throw new Error((result as any).error?.message || "Resend send failed");
  }
  return result;
}