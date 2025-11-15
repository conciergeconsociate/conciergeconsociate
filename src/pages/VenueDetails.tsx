import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { mockVenues } from "@/data/mockData";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { MembershipPlans } from "@/components/MembershipPlans";
import { ConciergeBookingSection } from "@/components/ConciergeBookingSection";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useAuth } from "@/hooks/useAuth";

export default function VenueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { flags } = useFeatureFlags();
  const { userId } = useAuth();

  const [venue, setVenue] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMedia, setModalMedia] = useState<{ type: 'image' | 'video'; src: string } | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    // Guard: if venue visibility is off, redirect to Home
    if (!flags.venueVisible) {
      navigate("/");
      return;
    }
    setLoading(true);
    (async () => {
      try {
        if (id) {
          const { data, error } = await supabase
            .from("venues")
            .select("id,name,short_description,detailed_description,category,niche,address,weekday_hours,sunday_hours,map_url,images,hidden")
            .eq("id", id)
            .limit(1)
            .maybeSingle();
          if (!error && data && isMounted) {
            setVenue({
              id: data.id,
              name: data.name,
              shortDescription: data.short_description,
              detailedDescription: data.detailed_description,
              category: data.category,
              niche: data.niche,
              address: data.address,
              weekdayHours: data.weekday_hours,
              sundayHours: data.sunday_hours,
              mapUrl: data.map_url,
              images: Array.isArray(data.images) ? data.images : [],
              hidden: !!data.hidden,
            });
          } else if (isMounted) {
            setVenue(null);
          }
        }
      } catch {
        if (isMounted) setVenue(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [id, flags.venueVisible]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <section className="container py-16">
            <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-10 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-10 bg-muted rounded w-40" />
              </div>
              <div className="h-64 md:h-[360px] bg-muted rounded" />
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary/10 animate-bounce mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">Nothing found</h2>
          <p className="text-muted-foreground mb-4">We couldn’t load this venue from Supabase.</p>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero: split layout, image to the right with dark overlay */}
        <section className="relative">
          <div className="container grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-12 md:py-16">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary">{venue.name}</h1>
              <p className="mt-3 text-muted-foreground">{venue.shortDescription}</p>
              <div className="mt-6 flex gap-3">
                <Button size="lg" onClick={() => navigate("/membership")}>Explore Membership</Button>
                <Button size="lg" variant="secondary" onClick={() => navigate("/contact")}>Contact Us</Button>
              </div>
            </div>
            <div className="relative h-64 md:h-[360px] rounded-lg overflow-hidden">
              <img
                src={venue.images?.[0]}
                alt={venue.name}
                onLoad={() => setHeroLoaded(true)}
                className={`w-full h-full object-cover transition duration-700 ease-out ${heroLoaded ? 'blur-0 scale-100' : 'blur-lg scale-105'}`}
              />
              <div className="absolute inset-0 bg-black/45" />
            </div>
          </div>
        </section>

        {/* Category and info strip */}
        <section className="py-8 bg-secondary text-secondary-foreground">
          <div className="container grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div>
              <p className="text-lg"><span className="font-semibold">Category:</span> {venue.category || "General"}</p>
            </div>
            <div>
              <p className="text-lg"><span className="font-semibold">Address:</span> {venue.address || "City, Country"}</p>
              <Button variant="secondary" size="sm" className="mt-2" onClick={() => venue.mapUrl && window.open(venue.mapUrl, "_blank")}>View Map</Button>
            </div>
            <div>
              <p className="text-lg"><span className="font-semibold">Open Times:</span> {venue.weekdayHours || "Mon-Sat: 9am-8pm"} {venue.sundayHours ? `| Sun: ${venue.sundayHours}` : ""}</p>
            </div>
          </div>
        </section>

        {/* Details: two columns (description left, images carousel right) */}
        <section className="py-12">
          <div className="container grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-primary">Details</h2>
              <p className="text-muted-foreground whitespace-pre-line">{venue.detailedDescription || venue.shortDescription}</p>
            </div>
            <div>
              <Carousel>
                <CarouselContent>
                  {(venue.images || []).map((img: string, idx: number) => (
                    <CarouselItem key={idx}>
                      <div className="h-56 md:h-64 rounded-lg overflow-hidden">
                        <img
                          src={img}
                          alt={`${venue.name} ${idx + 1}`}
                          onLoad={() => setImageLoaded((prev) => ({ ...prev, [idx]: true }))}
                          className={`w-full h-full object-cover transition duration-700 ease-out ${imageLoaded[idx] ? 'blur-0 scale-100' : 'blur-lg scale-105'}`}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-3xl font-bold text-primary mb-6">Our Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {(venue.images || []).map((img: string, idx: number) => (
                <div key={`img-${idx}`} className="rounded-lg overflow-hidden cursor-pointer" onClick={() => { setModalMedia({ type: 'image', src: img }); setModalOpen(true); }}>
                  <img src={img} alt={`${venue.name} image ${idx + 1}`} className="w-full h-56 object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Membership section (hidden when flag is off for non-auth) */}
        {(flags.membershipVisible || !!userId) && (
          <section className="py-16 bg-[#FBFBFB]">
            <div className="container">
              <MembershipPlans />
            </div>
          </section>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setModalOpen(false)}>
            <div className="relative max-w-5xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <button className="absolute -top-10 right-0 text-white" onClick={() => setModalOpen(false)}>Close ✕</button>
              {modalMedia?.type === 'image' ? (
                <img src={modalMedia.src} alt="Preview" className="w-full max-h-[80vh] object-contain" />
              ) : (
                <video src={modalMedia?.src || ''} controls autoPlay className="w-full max-h-[80vh] object-contain" />
              )}
            </div>
          </div>
        )}

        {/* Concierge request section */}
        <ConciergeBookingSection />
      </main>
      <Footer />
    </div>
  );
}