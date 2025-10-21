import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConciergeBookingSection } from "@/components/ConciergeBookingSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { mockFAQs } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function About() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState(mockFAQs);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("faqs")
          .select("id,question,answer")
          .order("created_at", { ascending: false })
          .limit(20);
        if (!error && data && data.length > 0 && isMounted) {
          const mapped = (data as any[]).map((f) => ({ id: String(f.id), question: f.question, answer: f.answer }));
          setFaqs(mapped as any);
        }
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[400px] flex items-center justify-center">
          {/* Background image switched to <img> for precise object positioning */}
          <img
            src="https://media.istockphoto.com/id/1500823465/photo/front-desk-staff-managing-guest-check-in.jpg?s=612x612&w=0&k=20&c=Q3J4c4Z5aTGE54iRq3cixIuoFN0wJxflYBUyW5aZl7Q="
            alt="Front desk staff managing guest check-in"
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          />
          {/* Black overlay at 45% to match others */}
          <div className="absolute inset-0 bg-black/45" />
          
          <div className="container relative z-10 text-center">
            <div className="inline-block max-w-3xl mx-auto rounded-lg p-[32px] md:p-[50px] md:my-[150px] shadow-lg bg-[rgba(17,28,97,0.61)]">
              <h1 className="text-4xl md:text-5xl font-bold text-[#EDA732]">About Us</h1>
              <p className="mt-3 text-lg md:text-xl text-background/95">
                At Consociate Concierge, we specialize in offering tailored services to simplify your life and help you achieve your goals. With a keen eye for detail and a dedication to excellence, we handle everything from project management to personalized travel assistance, ensuring your experience is effortless and stress-free.
              </p>
            </div>
          </div>
        </section>

        {/* Top Paragraph Section */}
        <section className="py-16">
          <div className="container max-w-5xl">
            <p className="text-lg text-muted-foreground leading-relaxed">
              At Consociate Concierge, we are more than a service provider—we are your trusted partner in simplifying life’s complexities and ensuring seamless execution across every aspect of your professional and personal needs. With a steadfast commitment to excellence, we specialize in delivering bespoke solutions that empower our clients to focus on what truly matters to them.
            </p>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Driven by a client-centric ethos, we take pride in understanding the unique needs of each individual and organization we work with. Whether it’s crafting unforgettable travel experiences, curating exceptional events, managing critical projects, or handling day-to-day errands, we approach every task with meticulous attention to detail and a passion for delivering unparalleled satisfaction.
            </p>
          </div>
        </section>

        {/* Statements Section */}
        <section className="py-16">
          <div className="container max-w-5xl">
            <div className="space-y-4 text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">Vision & Mission</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Our compass for excellence and client satisfaction.
              </p>
            </div>

            <Tabs defaultValue="vision" className="max-w-3xl mx-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="vision">Vision Statement</TabsTrigger>
                <TabsTrigger value="mission">Mission Statement</TabsTrigger>
              </TabsList>
              <TabsContent value="vision" className="mt-6">
                <p className="text-muted-foreground leading-relaxed">
                  To be the premier concierge service provider—setting the standard for excellence in every aspect of our work. We aim to be the first choice for clients seeking innovative, efficient, and personalized solutions, consistently exceeding expectations and delivering exceptional value. Through our unwavering commitment to quality and client satisfaction, we strive to lead the industry in delivering seamless, tailored services that enhance the lives and businesses of those we serve.
                </p>
              </TabsContent>
              <TabsContent value="mission" className="mt-6">
                <p className="text-muted-foreground leading-relaxed">
                  To simplify life and business for our clients through tailored solutions, exceptional service, and a deep understanding of their evolving needs in an ever-changing world. As champions of growth and adaptability, we are attuned to the opportunities brought by technological advancement, ensuring that our services remain innovative and relevant. We leverage cutting-edge tools to provide seamless and efficient solutions, always staying ahead of industry trends to serve our clients better.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  At the heart of everything we do is our unwavering dedication to making our clients feel at ease. Whether managing intricate logistics or handling everyday tasks, we ensure a smooth, stress-free experience, so you can relax and trust that your goals are in expert hands. Consociate Concierge—your partner in excellence, growth, and peace of mind.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Next Body Texts */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-5xl">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">Elevating Your Experience Every Step of the Way</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                At Consociate Concierge, we believe that hospitality goes beyond comfort—it’s about creating lasting impressions. Our personalized services are designed to anticipate your needs and exceed your expectations. Whether it’s a seamless airport experience, exclusive events, or tailored business support, we ensure every detail is handled with care, professionalism, and a touch of luxury. Let us bring you a world of exceptional service, where your satisfaction is our priority.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section (5 items) */}
        <section className="py-16" id="faq">
          <div className="container max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Frequently Asked Questions</h2>
              <p className="text-lg text-muted-foreground">Quick answers to common questions</p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.slice(0, 5).map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="text-center mt-8">
              <Button onClick={() => navigate("/contact#faqs")}>Learn More</Button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Concierge Service Request */}
        <ConciergeBookingSection />
      </main>

      <Footer />
    </div>
  );
}