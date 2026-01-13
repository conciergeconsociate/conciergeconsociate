import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConciergeBookingSection } from "@/components/ConciergeBookingSection";
import { mockVenues } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth.tsx";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import NotFound from "@/pages/NotFound";

function BlurImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full h-full">
      {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`${className ?? ''} w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

export default function Venues() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const { flags, loading: flagsLoading } = useFeatureFlags();

  const [venues, setVenues] = useState(mockVenues);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("venues")
          .select("id,name,short_description,images,category,hidden,created_at")
          .eq("hidden", false)
          .order("created_at", { ascending: false })
          .limit(100);
        if (!error && data && isMounted) {
          if (data.length > 0) {
            const mapped = (data as any[]).map((v) => ({
              id: v.id,
              name: v.name,
              shortDescription: v.short_description,
              images: Array.isArray(v.images) ? v.images : [],
              category: v.category,
              hidden: !!v.hidden,
            }));
            setVenues(mapped as any);
          } else {
            setVenues([] as any);
          }
        }
      } catch {}
      if (isMounted) setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [authLoading]);

  const categories = useMemo(() => [...new Set(venues.map((v) => v.category || "General"))], [venues]);

  // If flags are loaded and venue is hidden, show 404
  if (!flagsLoading && !flags.venueVisible) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[400px] flex items-center justify-center">
          {/* Background image */}
          <img
            src="https://media.istockphoto.com/id/1502316809/photo/professional-hotel-staff-check-guests-in.jpg?s=612x612&w=0&k=20&c=zgrwrXqYiyT1Y_IaGwAwucuF1-uPE8_E78j_km3rm2U="
            alt="Luxury Venue"
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          />
          {/* Black overlay at 45% */}
          <div className="absolute inset-0 bg-black/45" />

          <div className="container relative z-10 text-center">
            <div className="inline-block max-w-3xl mx-auto rounded-lg p-[32px] md:p-[50px] md:my-[150px] shadow-lg bg-[rgba(17,28,97,0.61)]">
              <h1 className="text-4xl md:text-5xl font-bold text-[#EDA732]">Our Venues</h1>
              <p className="mt-3 text-lg md:text-xl text-background/95">
                Discover our exclusive partner venues, chosen for their elegance, service, and ability to create unforgettable experiences.
              </p>
              <p className="mt-2 text-sm md:text-base text-background/90">Explore our venues and book your next event.</p>
            </div>
          </div>
        </section>

        {/* Venues Grid */}
        <section className="py-16">
          <div className="container">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : venues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <HelpCircle className="h-10 w-10 mb-3" />
                <p>No venues found.</p>
              </div>
            ) : (
              categories.map((category) => (
                <div key={category} className="mb-12">
                  <h2 className="text-2xl font-bold text-primary mb-6">{category}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {venues
                      .filter((venue) => (venue.category || "General") === category && !venue.hidden)
                      .map((venue) => (
                        <Card
                          key={venue.id}
                          className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group animate-fade-in"
                          onClick={() => navigate(`/venue/${venue.id}`)}
                        >
                          <div className="relative h-64">
                            <BlurImage src={venue.images?.[0]} alt={venue.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/57 to-transparent flex items-end p-6">
                              <h3 className="text-2xl font-bold text-background group-hover:text-primary transition-colors">
                                {venue.name}
                              </h3>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <TestimonialsSection />
        <ConciergeBookingSection />
      </main>

      <Footer />
    </div>
  );
}
