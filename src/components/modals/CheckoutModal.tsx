import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
// Removed usePaystackPayment to use manual implementation for better control
// import { usePaystackPayment } from "react-paystack"; 
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";

type Plan = {
  id: string;
  name: string;
  duration: number;
  price: number;
  currency?: string;
  benefits: string[];
};

export function CheckoutModal({ open, onOpenChange, plan }: { open: boolean; onOpenChange: (v: boolean) => void; plan: Plan | null }) {
  const [reference, setReference] = useState(() => new Date().getTime().toString());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [voucher, setVoucher] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<{ type: "percentage" | "fixed"; value: number; code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [currentMembership, setCurrentMembership] = useState<any | null>(null);
  const [isCurrentPlan, setIsCurrentPlan] = useState(false);
  const [isPlanValid, setIsPlanValid] = useState(false);
  const [currentPlanPrice, setCurrentPlanPrice] = useState(0);
  const [currentPlanName, setCurrentPlanName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    // Load Paystack script manually
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
        if (document.body.contains(script)) {
            document.body.removeChild(script);
        }
    };
  }, []);
  useEffect(() => {
    if (open) {
      // Regenerate reference on open to ensure uniqueness for every attempt
      setReference(new Date().getTime().toString());
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser(data.user);
        
        // Fetch latest profile data to ensure we have up-to-date info
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", data.user.id)
          .maybeSingle();

        // Fetch current active membership from user_memberships table
        const { data: membership } = await supabase
          .from("user_memberships")
          .select(`
            *,
            plan:membership_plans (
              name,
              price
            )
          `)
          .eq("user_id", data.user.id)
          .eq("active", true)
          .maybeSingle();

        setCurrentMembership(membership);

        if (profile) {
          setName(profile.full_name || data.user.user_metadata.full_name || "");
          setPhone(profile.phone || data.user.user_metadata.phone || "");
        } else {
          setName(data.user.user_metadata.full_name || data.user.user_metadata.name || "");
          setPhone(data.user.user_metadata.phone || "");
        }
        
        setEmail(data.user.email || "");
        
        if (membership && membership.plan) {
          setCurrentPlanPrice(Number(membership.plan.price || 0));
          setCurrentPlanName(membership.plan.name || "");
        } else {
          setCurrentPlanPrice(0);
          setCurrentPlanName("");
        }
      }
    });
  }, [open]);

  useEffect(() => {
    if (user && plan) {
      // Use membership table data if available, otherwise assume no plan
      if (currentMembership) {
        const samePlan = currentMembership.plan_id === plan.id;
        setIsCurrentPlan(samePlan);

        if (samePlan && currentMembership.end_date) {
          const endDate = new Date(currentMembership.end_date);
          setIsPlanValid(endDate > new Date());
        } else {
          setIsPlanValid(false);
        }
      } else {
        // If no membership record, do NOT fallback to metadata. 
        // Metadata can be stale. The single source of truth is user_memberships.
        setIsCurrentPlan(false);
        setIsPlanValid(false);
      }
    }
  }, [user, plan, currentMembership]);

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
      const rawVal = typeof data.value === "string" ? data.value : String(data.value ?? "0");
      const parsedVal = parseFloat(String(rawVal).replace(/[^0-9.]/g, ""));
      const value = isNaN(parsedVal) ? 0 : parsedVal;
      if (type === "percentage") {
        if (value <= 0) throw new Error("Unsupported voucher discount");
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

  const calculateEndDate = (duration: number) => {
    const date = new Date();
    date.setDate(date.getDate() + duration);
    return date.toISOString();
  };

  /*
  const config = {
    reference: reference || new Date().getTime().toString(),
    email: email,
    amount: finalPrice * 100, // Paystack expects amount in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
  };

  const initializePayment = usePaystackPayment(config);
  */

  const onSuccess = async (paymentResponse: any) => {
    console.log("Payment successful, starting post-processing...", paymentResponse);
    setProcessing(true); // Keep processing true until we are done
    setSuccessMessage("Payment successful! Finalizing your account...");

    // 15-second timeout to force redirect if things get stuck
    const safetyTimeout = setTimeout(() => {
         console.warn("Payment processing timed out, forcing completion");
         setProcessing(false);
         navigate("/thank-you");
         onOpenChange(false);
    }, 15000);

    try {
      const planEndDate = calculateEndDate(plan.duration);
      const metadata = {
        plan_id: plan.id,
        plan_name: plan.name,
        duration: plan.duration,
        price: plan.price,
        discounted_price: finalPrice,
        voucher_code: appliedVoucher?.code || voucher || null,
        full_name: name,
        phone: phone,
        plan_start_date: new Date().toISOString(),
        plan_end_date: planEndDate,
      };

      // --- LOGGED IN USER FLOW ---
      if (user) {
        console.log("Processing for logged-in user:", user.id);
        
        // 1. Update Auth Metadata
        const { error: updateError } = await supabase.auth.updateUser({ data: metadata });
        if (updateError) {
            console.error("Auth update failed:", updateError);
            // Continue anyway, this is not fatal
        }

        // 2. Use Edge Function for reliable DB update (Bypasses RLS issues)
        // We use the 'handle-checkout' function we created to ensure the DB is updated with service-role privileges
        supabase.functions.invoke("handle-checkout", {
            body: { 
                user_id: user.id, 
                plan_id: plan.id, 
                end_date: planEndDate,
                full_name: name,
                email: email
            }
        }).then(async ({ data, error }) => {
            if (error) {
                console.error("Handle-checkout function error object:", error);
                // Try to read the error body if available
                if (error instanceof Error && 'context' in error) {
                     // @ts-ignore
                     const context = error.context;
                     if (context && typeof context.json === 'function') {
                         try {
                             const body = await context.json();
                             console.error("Handle-checkout function error body:", body);
                         } catch (e) {
                             console.error("Could not parse error body", e);
                         }
                     }
                }
                
                // Fallback to direct DB update if function fails (though function is preferred)
                 supabase.from("user_memberships").update({ active: false }).eq("user_id", user.id).then(() => {
                     supabase.from("user_memberships").insert({
                        user_id: user.id,
                        plan_id: plan.id,
                        start_date: new Date().toISOString(),
                        end_date: planEndDate,
                        active: true,
                        status: 'active'
                    });
                 });
            } else {
                console.log("Handle-checkout function executed successfully", data);
            }
        });

        /* 
        // OLD DIRECT DB UPDATE (Prone to RLS issues)
        // 2. Deactivate old memberships
        await supabase.from("user_memberships").update({ active: false }).eq("user_id", user.id);

        // 3. Insert new membership
        const { error: insertError } = await supabase.from("user_memberships").insert({
          user_id: user.id,
          plan_id: plan.id,
          start_date: new Date().toISOString(),
          end_date: planEndDate,
          active: true,
          status: 'active'
        });

        if (insertError) {
             console.error("Membership creation failed", insertError);
             // We alert but don't block the user from seeing success
             // throw new Error("Failed to update membership record"); 
        }
        */

        // 4. Send Email (Fire & Forget)
        supabase.functions.invoke("notify", {
            body: {
              type: "subscription_updated", // Ensure this type is handled in notify function
              userEmail: email,
              data: {
                plan_name: plan.name,
                duration: plan.duration,
                price: `₦${finalPrice.toLocaleString()}`,
                full_name: name,
              },
            },
        }).then(({ error }) => {
            if (error) console.error("Notify function error:", error);
        });

      } 
      // --- NEW GUEST USER FLOW ---
      else {
        console.log("Processing for new guest user");
        
        // 1. Create User Account
        const randomPassword = genPassword();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: randomPassword,
          options: { data: metadata },
        });

        if (signUpError && !String(signUpError.message).includes("already registered")) {
          throw new Error(signUpError.message);
        }

        // 1b. Create Membership Record & Profile via Edge Function
        // This is critical: The guest user needs a profile and membership record immediately.
        if (signUpData.user) {
            await supabase.functions.invoke("handle-checkout", {
                body: { 
                    user_id: signUpData.user.id, 
                    plan_id: plan.id, 
                    end_date: planEndDate,
                    full_name: name,
                    email: email
                }
            });
        }

        // 2. Send Emails (Fire & Forget)
        // We use .then() chaining instead of await Promise.all to prevent blocking
        const emailPromises = [
            supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }),
            supabase.functions.invoke("notify", {
                body: {
                    type: "subscription_purchase",
                    userEmail: email,
                    data: { plan_name: plan.name, price: finalPrice, discounted_price: finalPrice }
                }
            }),
            supabase.functions.invoke("notify", {
                body: {
                    type: "login_information",
                    userEmail: email,
                    data: {
                        plan_name: plan.name,
                        duration: `${plan.duration} days`,
                        price: `₦${finalPrice.toLocaleString()}`,
                        full_name: name,
                        login_link: `${window.location.origin}/login`,
                    },
                },
            })
        ];
        
        Promise.allSettled(emailPromises).then((results) => {
            console.log("Email sending results:", results);
        });
      }

      // Final Success State
      console.log("Checkout flow completed successfully");
      clearTimeout(safetyTimeout);
      setSuccessMessage("Success! Redirecting...");
      
      // Short delay for user to read message
      setTimeout(() => {
        setProcessing(false);
        onOpenChange(false);
        navigate("/thank-you");
      }, 1500);

    } catch (e: any) {
      console.error("Post-payment processing error:", e);
      // Even if there is an error in our DB logic, the user PAID. 
      // We should probably still thank them but show a warning?
      // For now, let's show the error so they know something went wrong.
      setError("Payment received, but account setup had an issue: " + (e?.message ?? "Unknown error"));
      setProcessing(false);
      clearTimeout(safetyTimeout);
    }
  };

  const onClose = () => {
    console.log("Paystack closed by user");
    setProcessing(false);
    // Regenerate reference on cancel so retry uses a new one
    setReference(new Date().getTime().toString());
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

    if (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
        try {
            // Manual Paystack Initialization
            // @ts-ignore
            const PaystackPop = window.PaystackPop;
            if (!PaystackPop) {
                throw new Error("Paystack script not loaded");
            }

            const paystack = PaystackPop.setup({
                key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
                email: email,
                amount: finalPrice * 100, // kobo
                currency: "NGN",
                ref: reference, // Unique reference
                metadata: {
                    custom_fields: [
                        { display_name: "Mobile Number", variable_name: "mobile_number", value: phone },
                        { display_name: "Full Name", variable_name: "full_name", value: name },
                        { display_name: "Plan", variable_name: "plan_name", value: plan.name }
                    ]
                },
                callback: function(response: any) {
                    console.log("Paystack success callback fired", response);
                    onSuccess(response);
                },
                onClose: function() {
                    console.log("Paystack close callback fired");
                    onClose();
                }
            });
            
            paystack.openIframe();
        } catch (err) {
            console.error("Paystack initialization failed", err);
            setError("Could not initialize payment provider. Please try again.");
            setProcessing(false);
        }
    } else {
        setError("Paystack configuration is missing. Please contact support.");
        setProcessing(false);
    }
  };

  // Determine if the user has ANY active plan (not just the selected one)
  const hasActivePlan = (() => {
    if (!user) return false;
    if (currentMembership) {
      return new Date(currentMembership.end_date) > new Date();
    }
    if (user.user_metadata?.plan_end_date) {
      return new Date(user.user_metadata.plan_end_date) > new Date();
    }
    return false;
  })();

  const isHigherPlan = user && plan.price > currentPlanPrice;
  
  const canPurchase = (() => {
      if (!user) return true;
      if (isCurrentPlan) return !hasActivePlan; // Can only renew if expired
      if (!hasActivePlan) return true; // Can buy anything if no active plan
      return isHigherPlan; // Can only upgrade if active plan exists
  })();

  const getButtonText = () => {
    if (processing) return "Processing…";
    if (!user) return "Pay & Create Account";
    
    if (isCurrentPlan) {
        return hasActivePlan ? "Current Plan Active" : "Renew Plan";
    }
    
    if (!hasActivePlan) return "Subscribe";
    
    if (isHigherPlan) return "Upgrade Plan";
    return "Downgrade Unavailable";
  };
  
  // Allow user to manually reset processing state if it gets stuck
  const handleManualCancel = () => {
      if (processing) {
          onClose();
      } else {
          onOpenChange(false);
      }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
        if (!v && processing) {
            // If trying to close while processing, warn or allow?
            // Let's allow closing, which effectively cancels
            onClose();
        }
        onOpenChange(v);
    }} modal={false}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Checkout — {plan.name}</DialogTitle>
          <DialogDescription>
            Complete your purchase securely.
          </DialogDescription>
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

          {user && (
             <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm space-y-1">
               <p><strong>Current Plan:</strong> {currentPlanName || "None"} {currentPlanPrice > 0 && `(₦${currentPlanPrice.toLocaleString()})`}</p>
               
               {hasActivePlan ? (
                   isCurrentPlan ? (
                       <p className="text-green-700 font-medium">You are currently subscribed to this plan.</p>
                   ) : (
                       isHigherPlan ? (
                           <p className="text-green-700">You can upgrade to this plan.</p>
                       ) : (
                           <p className="text-red-600">You are on a higher or equal plan. You cannot downgrade while your current plan is active.</p>
                       )
                   )
               ) : (
                   <p className="text-yellow-700">
                     {isCurrentPlan ? "Your plan has expired. Please renew." : "You have no active plan. Subscribe now."}
                   </p>
               )}
             </div>
          )}

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
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" disabled={!!user} />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone Number</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Email Address</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={!!user} />
            {!user && <p className="text-xs text-muted-foreground mt-1">We’ll create your account and email a reset link after successful payment.</p>}
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {successMessage && <div className="text-sm text-green-600">{successMessage}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleManualCancel} disabled={false}>
              {processing ? "Cancel Payment" : "Cancel"}
          </Button>
          <Button onClick={handleCheckout} disabled={processing || !canPurchase}>
            {getButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
