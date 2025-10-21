import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { mockServices } from "@/data/mockData";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { MembershipPlans } from "@/components/MembershipPlans";
import { ConciergeBookingSection } from "@/components/ConciergeBookingSection";

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState<any | null>(null);
  const [moreServices, setMoreServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMedia, setModalMedia] = useState<{ type: 'image' | 'video'; src: string } | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [moreImageLoaded, setMoreImageLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    (async () => {
      try {
        if (id) {
          const { data, error } = await supabase
            .from("services")
            .select("id,title,short_description,detailed_description,images,videos,category,hidden")
            .eq("id", id)
            .limit(1)
            .maybeSingle();
          if (!error && data && isMounted) {
            setService({
              id: data.id,
              title: data.title,
              shortDescription: data.short_description,
              detailedDescription: data.detailed_description,
              images: Array.isArray(data.images) ? data.images : [],
              videos: Array.isArray(data.videos) ? data.videos : [],
              category: data.category,
              hidden: !!data.hidden,
            });
            const { data: more, error: moreErr } = await supabase
              .from("services")
              .select("id,title,short_description,images,category,hidden")
              .eq("hidden", false)
              .order("created_at", { ascending: false })
              .limit(6);
            if (!moreErr && Array.isArray(more) && isMounted) {
              setMoreServices(
                more.map((s: any) => ({
                  id: s.id,
                  title: s.title,
                  shortDescription: s.short_description,
                  images: Array.isArray(s.images) ? s.images : [],
                  category: s.category,
                }))
              );
            } else if (isMounted) {
              setMoreServices([]);
            }
          } else if (isMounted) {
            setService(null);
            setMoreServices([]);
          }
        }
      } catch {
        if (isMounted) {
          setService(null);
          setMoreServices([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [id]);

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

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary/10 animate-bounce mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">Nothing found</h2>
          <p className="text-muted-foreground mb-4">We couldn’t load this service from Supabase.</p>
          <Button onClick={() => navigate("/services")}>Back to Services</Button>
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
              <h1 className="text-4xl md:text-5xl font-bold text-primary">{service.title}</h1>
              <p className="mt-3 text-muted-foreground">{service.shortDescription}</p>
              <div className="mt-6 flex gap-3">
                <Button size="lg" onClick={() => navigate("/membership")}>Explore Membership</Button>
                <Button size="lg" variant="secondary" onClick={() => navigate("/contact")}>Contact Us</Button>
              </div>
            </div>
            <div className="relative h-64 md:h-[360px] rounded-lg overflow-hidden">
              <img
                src={service.images?.[0]}
                alt={service.title}
                onLoad={() => setHeroLoaded(true)}
                className={`w-full h-full object-cover transition duration-700 ease-out ${heroLoaded ? 'blur-0 scale-100' : 'blur-lg scale-105'}`}
              />
              <div className="absolute inset-0 bg-black/45" />
            </div>
          </div>
        </section>

        {/* Category section */}
        <section className="py-8 bg-secondary text-secondary-foreground">
          <div className="container">
            <p className="text-white text-lg"><span className="font-semibold">Category:</span> {service.category || "General"}</p>
          </div>
        </section>

        {/* Details: two columns (description left, images carousel right) */}
        <section className="py-12">
          <div className="container grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-primary">Details</h2>
              <p className="text-muted-foreground whitespace-pre-line">{service.detailedDescription || service.shortDescription}</p>
            </div>
            <div>
              <Carousel>
                <CarouselContent>
                  {(service.images || []).map((img: string, idx: number) => (
                    <CarouselItem key={idx}>
                      <div className="h-56 md:h-64 rounded-lg overflow-hidden">
                        <img
                          src={img}
                          alt={`${service.title} ${idx + 1}`}
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

        {/* Services section (like on Home) */}
        <section className="py-16 bg-[#111C61] text-white">
          <div className="container">
             <div className="text-center mb-10">
               <h2 className="text-3xl md:text-4xl font-bold mb-3">Services</h2>
               <p className="text-lg text-white/90">Explore tailored solutions — one at a time</p>
             </div>
             <Carousel className="max-w-5xl mx-auto">
               <CarouselContent>
                 {moreServices.length === 0 ? (
                   <div className="col-span-1 md:col-span-2 text-center py-12">
                     <div className="mx-auto w-16 h-16 rounded-full bg-white/10 animate-pulse mb-4" />
                     <p className="text-white/90">No services found</p>
                   </div>
                 ) : (
                   moreServices.map((s) => (
                     <CarouselItem key={s.id}>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                         <div className="h-64 md:h-80 rounded-lg overflow-hidden">
                           <img
                             src={s.images?.[0]}
                             alt={s.title}
                             onLoad={() => setMoreImageLoaded((prev) => ({ ...prev, [s.id]: true }))}
                             className={`w-full h-full object-cover transition duration-700 ease-out ${moreImageLoaded[s.id] ? 'blur-0 scale-100' : 'blur-lg scale-105'}`}
                           />
                         </div>
                         <div>
                           <h3 className="text-2xl font-bold">{s.title}</h3>
                           <p className="mt-3 text-white/90">{s.shortDescription}</p>
                           <Button className="mt-6 bg-[#111C61] text-white ring-2 ring-white hover:bg-[#0E1650]" onClick={() => navigate(`/services/${s.id}`)}>
                             Learn More
                           </Button>
                         </div>
                       </div>
                     </CarouselItem>
                   ))
                 )}
               </CarouselContent>
               <CarouselPrevious />
               <CarouselNext />
             </Carousel>
           </div>
         </section>

        {/* Membership section */}
        <section className="py-16 bg-[#FBFBFB]">
          <div className="container">
            <MembershipPlans />
          </div>
        </section>

        {/* Gallery: images and videos */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-3xl font-bold text-primary mb-6">Our Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {(service.images || []).map((img: string, idx: number) => (
                <div key={`img-${idx}`} className="rounded-lg overflow-hidden cursor-pointer" onClick={() => { setModalMedia({ type: 'image', src: img }); setModalOpen(true); }}>
                  <img src={img} alt={`${service.title} image ${idx + 1}`} className="w-full h-56 object-cover" />
                </div>
              ))}
              {(service.videos || []).map((vid: string, idx: number) => (
                <div key={`vid-${idx}`} className="rounded-lg overflow-hidden cursor-pointer" onClick={() => { setModalMedia({ type: 'video', src: vid }); setModalOpen(true); }}>
                  <video controls src={vid} className="w-full h-56 object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>

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