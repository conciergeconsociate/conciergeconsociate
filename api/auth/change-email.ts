import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getClients, badRequest, sendEmail, getBaseUrl } from "../_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return badRequest(res, "Method not allowed", 405);
  try {
    const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string | undefined;
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) return badRequest(res, "Missing Authorization bearer token", 401);
    const accessToken = authHeader.split(" ")[1];

    const { newEmail, redirectTo } = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) || {};
    if (!newEmail || !/.+@.+\..+/.test(newEmail)) return badRequest(res, "Invalid email");
    const base = getBaseUrl(req);
    const redirect = typeof redirectTo === "string" && redirectTo.length > 0 ? redirectTo : `${base}/login`;

    const { supabase, resend, from, logoUrl } = getClients();
    const { data: userRes, error: userErr } = await supabase.auth.getUser(accessToken);
    if (userErr || !userRes?.user?.id) return badRequest(res, "Invalid user token", 401);
    const userId = userRes.user.id;

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "email_change",
      newEmail,
      userId,
      options: { redirectTo: redirect },
    } as any);
    if (error) throw new Error(error.message);
    const actionLink = (data as any)?.action_link;
    if (!actionLink) throw new Error("No action link generated");

    const preheader = "Confirm your email change";
    const logo = logoUrl ? `<img src="${logoUrl}" alt="Crafted Core" style="display:block;margin:0 auto 16px" width="120" height="auto" />` : "";
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
        <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0">${preheader}</span>
        ${logo}
        <h2>Confirm your email change</h2>
        <p>Click the button below to confirm your new email address:</p>
        <p><a href="${actionLink}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#0ea5e9;color:#fff;text-decoration:none">Confirm Email</a></p>
        <p style="color:#666">If you did not request this, you can ignore this email.</p>
      </div>
    `;
    const text = `Confirm your email change\n\nUse this link: ${actionLink}\n\nIf you did not request this, ignore this email.`;
    await sendEmail(resend, from, newEmail, "Confirm your email change", html, text);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("[api/auth/change-email]", e);
    return badRequest(res, e?.message || "Change email error", 500);
  }
}