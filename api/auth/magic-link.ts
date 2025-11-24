import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getClients, badRequest, sendEmail, getBaseUrl } from "../_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return badRequest(res, "Method not allowed", 405);
  try {
    const { email, redirectTo } = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) || {};
    if (!email || !/.+@.+\..+/.test(email)) return badRequest(res, "Invalid email");
    const base = getBaseUrl(req);
    const redirect = typeof redirectTo === "string" && redirectTo.length > 0 ? redirectTo : `${base}/login`;

    const { supabase, resend, from, logoUrl } = getClients();
    const { data, error } = await supabase.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo: redirect } } as any);
    if (error) throw new Error(error.message);
    const actionLink = (data as any)?.action_link;
    if (!actionLink) throw new Error("No action link generated");

    const preheader = "Sign in securely with your one-time magic link";
    const logo = logoUrl ? `<img src="${logoUrl}" alt="Crafted Core" style="display:block;margin:0 auto 16px" width="120" height="auto" />` : "";
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
        <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0">${preheader}</span>
        ${logo}
        <h2>Sign in to Crafted Core</h2>
        <p>Click the button below to sign in instantly:</p>
        <p><a href="${actionLink}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#0ea5e9;color:#fff;text-decoration:none">Sign in</a></p>
        <p style="color:#666">If you did not request this, you can ignore this email.</p>
      </div>
    `;
    const text = `Sign in to Crafted Core\n\nUse this link: ${actionLink}\n\nIf you did not request this, ignore this email.`;
    await sendEmail(resend, from, email, "Your magic sign-in link", html, text);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("[api/auth/magic-link]", e);
    const msg = e?.message || "Magic link error";
    const code = /rate|too many|exceed/i.test(msg) ? 429 : 500;
    return badRequest(res, msg, code);
  }
}