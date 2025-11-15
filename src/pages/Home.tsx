import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MembershipPlans } from "@/components/MembershipPlans";
import { ConciergeBookingSection } from "@/components/ConciergeBookingSection";
import { mockServices, mockVenues, mockFAQs } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ChevronLeft, ChevronRight, ImageOff, HelpCircle } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useAuth } from "@/hooks/useAuth";

// Simple blur-up image helper
function BlurImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`${className ?? ''} w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} `}
      />
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { flags } = useFeatureFlags();
  const { userId } = useAuth();
  const isLoggedIn = !!userId;

  const [venues, setVenues] = useState(mockVenues);
  const [services, setServices] = useState(mockServices);
  const [faqs, setFaqs] = useState(mockFAQs);

  const [loadingVenues, setLoadingVenues] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      // Featured Venues
      try {
        const { data, error } = await supabase
          .from("venues")
          .select("id,name,short_description,images,hidden,featured")
          .eq("featured", true)
          .eq("hidden", false)
          .order("created_at", { ascending: false })
          .limit(12);
        if (!error && data && isMounted) {
          if (data.length > 0) {
            const mapped = (data as any[]).map((v) => ({
              id: v.id,
              name: v.name,
              shortDescription: v.short_description,
              images: Array.isArray(v.images) ? v.images : [],
            }));
            setVenues(mapped as any);
          } else {
            setVenues([] as any);
          }
        }
      } catch {}
      if (isMounted) setLoadingVenues(false);

      // Services (carousel)
      try {
        const { data, error } = await supabase
          .from("services")
          .select("id,title,short_description,images,category,hidden")
          .eq("hidden", false)
          .order("created_at", { ascending: false })
          .limit(12);
        if (!error && data && isMounted) {
          if (data.length > 0) {
            const mapped = (data as any[]).map((s) => ({
              id: s.id,
              title: s.title,
              shortDescription: s.short_description,
              images: Array.isArray(s.images) ? s.images : [],
              category: s.category,
              hidden: !!s.hidden,
            }));
            setServices(mapped as any);
          } else {
            setServices([] as any);
          }
        }
      } catch {}
      if (isMounted) setLoadingServices(false);

      // FAQs
      try {
        const { data, error } = await supabase
          .from("faqs")
          .select("id,question,answer")
          .order("created_at", { ascending: false })
          .limit(20);
        if (!error && data && isMounted) {
          if (data.length > 0) {
            const mapped = (data as any[]).map((f) => ({ id: String(f.id), question: f.question, answer: f.answer }));
            setFaqs(mapped as any);
          } else {
            setFaqs([] as any);
          }
        }
      } catch {}
      if (isMounted) setLoadingFaqs(false);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const venuesScrollRef = useRef<HTMLDivElement>(null);
  const scrollVenues = (dir: "left" | "right") => {
    const el = venuesScrollRef.current;
    if (!el) return;
    const scrollAmount = Math.ceil(el.clientWidth * 0.9);
    el.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center justify-center">
          <div className="absolute inset-0 bg-[url('https://media.istockphoto.com/id/1502316809/photo/professional-hotel-staff-check-guests-in.jpg?s=612x612&w=0&k=20&c=zgrwrXqYiyT1Y_IaGwAwucuF1-uPE8_E78j_km3rm2U=')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-[hsl(var(--overlay-black-57))]" />
          <div className="container relative z-10 text-center space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-primary">
              Welcome to Consociate Concierge
            </h1>
            <p className="text-xl md:text-2xl text-background max-w-3xl mx-auto">
              Where Every Detail is Designed with You in Mind—Experience unparalleled service, tailored solutions, and a commitment to making every moment seamless and stress-free.
            </p>
            <Button size="lg" onClick={() => navigate("/membership")}>
              Explore Membership
            </Button>
          </div>
        </section>

        {/* Featured Venues Section */}
        {flags.venueVisible && (
        <section className="py-16 bg-secondary/10">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  Featured Venues
                </h2>
                <p className="text-lg text-muted-foreground">
                  Discover our exclusive partner venues
                </p>
              </div>
              <Button onClick={() => navigate("/contact")}>Contact Us</Button>
            </div>

            <div className="relative">
              {loadingVenues ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="min-w-[280px] md:min-w-[340px] h-64 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : venues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <ImageOff className="h-10 w-10 mb-3" />
                  <p>No featured venues found.</p>
                </div>
              ) : (
                <div className="relative">
                  <div ref={venuesScrollRef} className="flex gap-6 overflow-x-auto scroll-smooth pb-2 snap-x">
                    {venues.map((venue) => (
                      <Card
                        key={venue.id}
                        className="min-w-[280px] md:min-w-[340px] overflow-hidden hover:shadow-lg transition-shadow cursor-pointer snap-start"
                        onClick={() => navigate(`/venue/${venue.id}`)}
                      >
                        <div className="relative h-48 bg-gradient-to-br from-secondary/20 to-muted">
                          <BlurImage src={venue.images[0]} alt={venue.name} className="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent flex items:end p-4">
                            <h3 className="text-xl font-bold text-background">{venue.name}</h3>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">{venue.shortDescription}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollVenues("left")}
                    className="absolute -left-3 top-1/2 -translate-y-1/2 bg-background/90"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollVenues("right")}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 bg-background/90"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        {/* About Section */}
        <section className="py-16">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-3xl md:text-4xl font-bold text-primary">
                  Excellence in Service, Precision in Execution.
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  At Consociate Concierge, we are committed to providing exceptional service tailored to meet your unique needs. Whether you're managing a complex project, traveling, or looking for expert assistance in any aspect of your life, we deliver solutions with precision and care. Our team of dedicated professionals works tirelessly to ensure every detail is handled with the utmost attention, so you can focus on what matters most. With years of experience and a passion for excellence, we pride ourselves on transforming challenges into seamless experiences. Your success and satisfaction are our ultimate goals, and we strive to exceed your expectations at every turn.
                </p>
              </div>
              <div className="relative h-[400px] rounded-lg overflow-hidden">
                <BlurImage
                  src="https://images.pexels.com/photos/7869055/pexels-photo-7869055.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Concierge service"
                  className=""
                />
              </div>
            </div>
          </div>
        </section>

        {/* Services Section (Carousel) */}
        <section className="py-16 bg-[#111C61]">
          <div className="container text-background">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Services</h2>
              <p className="text-lg text-background/80">Explore tailored solutions — one at a time</p>
            </div>

            {loadingServices ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 md:h-80 rounded-lg bg-background/20 animate-pulse" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-background/80">
                <HelpCircle className="h-10 w-10 mb-3" />
                <p>No services found.</p>
              </div>
            ) : (
              <Carousel className="max-w-5xl mx-auto">
                <CarouselContent>
                  {services.map((service) => (
                    <CarouselItem key={service.id}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="h-64 md:h-80 rounded-lg overflow-hidden">
                          <BlurImage src={service.images[0]} alt={service.title} className="" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{service.title}</h3>
                          <p className="mt-3 text-background/80">{service.shortDescription}</p>
                          <Button variant="secondary" className="mt-6" onClick={() => navigate(`/services/${service.id}`)}>
                            Learn More
                          </Button>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="border-background/30 text-background" />
                <CarouselNext className="border-background/30 text-background" />
              </Carousel>
            )}
          </div>
        </section>

        {/* Membership Section (hidden when flag is off for non-auth) */}
        {(isLoggedIn || flags.membershipVisible) && <MembershipPlans />}

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground">
                Find answers to common questions
              </p>
            </div>

            {loadingFaqs ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : faqs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <HelpCircle className="h-8 w-8 mb-2" />
                <p>No FAQs found.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.slice(0, 5).map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}

            <div className="text-center mt-8">
              <Button onClick={() => navigate("/contact#faqs")}>
                View All FAQs
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Concierge Service Request Booking Section */}
        <ConciergeBookingSection />
      </main>

      <Footer />
    </div>
  );
}
