import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getClients, badRequest, sendEmail, getBaseUrl } from "../_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return badRequest(res, "Method not allowed", 405);
  try {
    const { email, redirectTo } = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) || {};
    if (!email || !/.+@.+\..+/.test(email)) return badRequest(res, "Invalid email");
    const base = getBaseUrl(req);
    const redirect = typeof redirectTo === "string" && redirectTo.length > 0 ? redirectTo : `${base}/reset-password`;

    const { supabase, resend, from } = getClients();
    const { data, error } = await supabase.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: redirect } } as any);
    if (error) throw new Error(error.message);
    const actionLink = (data as any)?.action_link;
    if (!actionLink) throw new Error("No action link generated");

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
        <h2>Reset your password</h2>
        <p>Click the button below to reset your password:</p>
        <p><a href="${actionLink}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#0ea5e9;color:#fff;text-decoration:none">Reset Password</a></p>
        <p style="color:#666">If you did not request this, you can ignore this email.</p>
      </div>
    `;
    await sendEmail(resend, from, email, "Reset your password", html);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("[api/auth/reset-password]", e);
    return badRequest(res, e?.message || "Reset password error", 500);
  }
}