// Supabase Edge Function: campaigns
// Sends single or bulk marketing emails via Resend

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev";
const FROM_NAME = Deno.env.get("FROM_NAME") ?? "Consociate Concierge";

async function sendResend(to: string[], subject: string, html: string) {
  if (!RESEND_API_KEY) return { ok: false, status: 500, error: "missing_api_key" };
  const payload = { from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject, html };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body: { subject?: string; html?: string; to?: string[] | string } = {};
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 }); }

  const subject = (body.subject ?? "").toString().trim();
  const html = (body.html ?? "").toString();
  const to = Array.isArray(body.to) ? body.to.filter(Boolean) : typeof body.to === "string" ? [body.to] : [];

  if (!subject || !html || to.length === 0) {
    return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400 });
  }

  // Basic batching to avoid extremely large recipient arrays in one call
  const batchSize = 50;
  const batches: string[][] = [];
  for (let i = 0; i < to.length; i += batchSize) batches.push(to.slice(i, i + batchSize));

  const results = [] as any[];
  for (const batch of batches) {
    const r = await sendResend(batch, subject, html);
    results.push(r);
    await new Promise((resolve) => setTimeout(resolve, 200)); // small delay
  }

  return new Response(JSON.stringify({ ok: results.every((r) => r.ok), results }), { headers: { "Content-Type": "application/json" } });
});