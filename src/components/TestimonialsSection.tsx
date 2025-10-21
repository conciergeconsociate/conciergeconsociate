import { Card, CardContent } from "@/components/ui/card";
import { mockTestimonials } from "@/data/mockData";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function TestimonialsSection({ title = "What Our Clients Say" }: { title?: string }) {
  type Testimonial = { id: string; name: string; role?: string; content: string; rating: number; image?: string };
  const [items, setItems] = useState<Testimonial[]>(mockTestimonials as Testimonial[]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(12);
        if (!error && data && data.length > 0 && isMounted) {
          setItems(data as Testimonial[]);
        }
      } catch {
        // keep mock fallback on error
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">{title}</h2>
          <p className="text-lg text-muted-foreground">Real feedback from our happy clients</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {items.map((t) => (
            <Card key={t.id} className="overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.role}</div>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">“{t.content}”</p>
                <div className="flex" aria-label={`Rating ${t.rating} out of 5`}>
                  {Array.from({ length: Math.max(0, Math.min(5, t.rating || 0)) }).map((_, i) => (
                    <span key={i} className="text-primary">★</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}