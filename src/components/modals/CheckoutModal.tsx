import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

type Plan = {
  id: string;
  name: string;
  duration: string;
  price: number;
  currency?: string;
  benefits: string[];
};

export function CheckoutModal({ open, onOpenChange, plan }: { open: boolean; onOpenChange: (v: boolean) => void; plan: Plan | null }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [voucher, setVoucher] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<{ type: "percentage" | "fixed"; value: number; code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!plan) return null;

  const finalPrice = (() => {
    if (!appliedVoucher) return plan.price;
    if (appliedVoucher.type === "percentage") {
      const pct = Math.min(Math.max(appliedVoucher.value, 0), 90);
      return Math.max(0, Math.round(plan.price * (1 - pct / 100)));
    }
    // fixed amount in NGN
    return Math.max(0, plan.price - Math.round(appliedVoucher.value));
  })();

  const applyVoucher = async () => {
    setError(null);
    if (!voucher.trim()) {
      setAppliedVoucher(null);
      return;
    }
    setApplyingVoucher(true);
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("id,code,type,value,currency,is_active,valid_from,valid_to,usage_limit,usage_count")
        .eq("code", voucher.trim())
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data || data.is_active === false) {
        throw new Error("Invalid or inactive voucher code");
      }
      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        throw new Error("Voucher is not yet valid");
      }
      if (data.valid_to && new Date(data.valid_to) < now) {
        throw new Error("Voucher has expired");
      }
      if (typeof data.usage_limit === "number" && typeof data.usage_count === "number" && data.usage_limit > 0 && data.usage_count >= data.usage_limit) {
        throw new Error("Voucher usage limit reached");
      }
      const normalizedType = String(data.type).toLowerCase();
      const type: "percentage" | "fixed" = normalizedType === "percent" || normalizedType === "percentage" ? "percentage" : "fixed";
      // Handle numeric strings like "50%" or " 50 "
      const rawVal = typeof data.value === "string" ? data.value : String(data.value ?? "0");
      const parsedVal = parseFloat(String(rawVal).replace(/[^0-9.]/g, ""));
      const value = isNaN(parsedVal) ? 0 : parsedVal;
      if (type === "percentage") {
        if (value <= 0) throw new Error("Unsupported voucher discount");
        // Clamp to a sensible maximum without erroring
        setAppliedVoucher({ type, value: Math.min(value, 90), code: data.code });
      } else {
        if (value <= 0) throw new Error("Unsupported voucher value");
        setAppliedVoucher({ type, value: Math.round(value), code: data.code });
      }
    } catch (e: any) {
      setError(e?.message ?? "Unable to apply voucher");
      setAppliedVoucher(null);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const genPassword = (length = 12) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < length; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    return pwd;
  };

  const handleCheckout = async () => {
    setError(null);
    setSuccessMessage(null);
    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      setError("Please enter a valid phone number");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setProcessing(true);
    try {
      // TODO: Integrate payment processor here; currently simulates success
      const randomPassword = genPassword();

      // Create account for the user with random password
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: randomPassword,
        options: {
          data: {
            plan_id: plan.id,
            plan_name: plan.name,
            duration: plan.duration,
            price: plan.price,
            discounted_price: finalPrice,
            voucher_code: appliedVoucher?.code || voucher || null,
            full_name: name,
            phone: phone,
          },
        },
      });
      if (signUpError && !String(signUpError.message).includes("already registered")) {
        throw new Error(signUpError.message);
      }

      // Send reset password email so the user can set their own
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (resetError) throw new Error(resetError.message);

      // Send user welcome/subscription email via Resend
      try {
        await supabase.functions.invoke("notify", {
          body: {
            type: "subscription_purchase",
            userEmail: email,
            data: {
              plan_id: plan.id,
              plan_name: plan.name,
              duration: plan.duration,
              price: plan.price,
              discounted_price: finalPrice,
              voucher_code: appliedVoucher?.code || voucher || null,
              full_name: name,
              phone: phone,
            },
          },
        });
      } catch {}

      setSuccessMessage("Payment completed. Account created and reset link sent to your email.");
    } catch (e: any) {
      setError(e?.message ?? "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Checkout — {plan.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md p-4 bg-muted">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-primary">{plan.name}</p>
                <p className="text-sm text-muted-foreground">{plan.duration}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">₦{finalPrice.toLocaleString()}</p>
                {appliedVoucher && (
                  <p className="text-xs text-muted-foreground">
                    Applied {appliedVoucher.type === "percentage" ? `${appliedVoucher.value}%` : `₦${Math.round(appliedVoucher.value).toLocaleString()}`} voucher
                  </p>
                )}
              </div>
            </div>
            <ul className="mt-3 text-sm list-disc pl-5">
              {plan.benefits.map((b, i) => (<li key={i}>{b}</li>))}
            </ul>
          </div>

          <div>
            <label className="block text-sm mb-1">Voucher Code</label>
            <div className="flex gap-2">
              <Input value={voucher} onChange={(e) => setVoucher(e.target.value)} placeholder="Optional" />
              <Button variant="outline" onClick={applyVoucher} disabled={applyingVoucher}>{applyingVoucher ? "Applying…" : "Apply"}</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Full Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone Number</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Email Address</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <p className="text-xs text-muted-foreground mt-1">We’ll create your account and email a reset link after successful payment.</p>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {successMessage && <div className="text-sm text-green-600">{successMessage}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>Cancel</Button>
          <Button onClick={handleCheckout} disabled={processing || !plan}>{processing ? "Processing…" : "Pay & Create Account"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}