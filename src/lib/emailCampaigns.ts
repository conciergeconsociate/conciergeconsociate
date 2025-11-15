import { supabase } from "@/lib/supabaseClient";

export async function sendCampaignEmail(params: { subject: string; html: string; to: string[] | string }) {
  const { subject, html, to } = params;
  return supabase.functions.invoke("campaigns", { body: { subject, html, to } });
}

export async function sendNotify(type: string, userEmail: string, data: Record<string, unknown> = {}) {
  return supabase.functions.invoke("notify", { body: { type, userEmail, data } });
}