import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Check, PackageOpen } from "lucide-react";
import { mockMembershipPlans } from "@/data/mockData";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CheckoutModal } from "@/components/modals/CheckoutModal";

export const MembershipPlans = () => {
  type Plan = {
    id: string;
    name: string;
    duration: string;
    price: number;
    currency?: string;
    benefits: string[];
    cover_image?: string;
    show_on_website?: boolean;
  };
  const [plans, setPlans] = useState<Plan[]>(mockMembershipPlans as Plan[]);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("membership_plans")
          .select("id,name,duration,price,currency,benefits,cover_image,show_on_website")
          .eq("show_on_website", true)
          .order("price", { ascending: true })
          .limit(12);
        if (!error && data && isMounted) {
          if (data.length > 0) {
            setPlans(data as Plan[]);
          } else {
            setPlans([]);
          }
        }
      } catch {
        // keep mock fallback on error
      }
      if (isMounted) setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-16 bg-[#FBFBFB]">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Our Membership Plans
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan that suits your lifestyle needs
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <PackageOpen className="h-8 w-8 mb-2" />
            <p>No membership plans found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="hover:shadow-lg transition-shadow animate-fade-in"
              >
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">{plan.name}</CardTitle>
                  <CardDescription>{plan.duration}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">₦{plan.price.toLocaleString()}</span>
                    <span className="text-muted-foreground">/{plan.duration.toLowerCase()}</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => { setSelectedPlan(plan); setCheckoutOpen(true); }}>Choose {plan.name}</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      <CheckoutModal open={checkoutOpen} onOpenChange={setCheckoutOpen} plan={selectedPlan} />
    </section>
  );
};
