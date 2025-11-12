import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConciergeBookingSection } from "@/components/ConciergeBookingSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ContactForm } from "@/components/ContactForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { mockContactInfo, mockFAQs } from "@/data/mockData";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Contact() {
  const [faqs, setFaqs] = useState(mockFAQs);
  const [contactInfo, setContactInfo] = useState<any>(mockContactInfo);
  const [loadingContact, setLoadingContact] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      // Contact info
      try {
        const { data, error } = await supabase
          .from("contact_info")
          .select("address,emails,phones,facebook,instagram,whatsapp")
          .limit(1)
          .maybeSingle();
        if (!error && data && isMounted) {
          const mapped = {
            address: data.address,
            emails: Array.isArray(data.emails) ? data.emails : [],
            phones: Array.isArray(data.phones) ? data.phones : [],
            socialMedia: {
              facebook: data.facebook || mockContactInfo.socialMedia.facebook,
              instagram: data.instagram || mockContactInfo.socialMedia.instagram,
              whatsapp: data.whatsapp || mockContactInfo.socialMedia.whatsapp,
            },
          };
          setContactInfo(mapped);
        }
      } catch {}
      if (isMounted) setLoadingContact(false);

      try {
        const { data, error } = await supabase
          .from("faqs")
          .select("id,question,answer")
          .order("created_at", { ascending: false })
          .limit(50);
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
            src="https://media.istockphoto.com/id/2161029713/photo/payment-for-vip-membership-card.jpg?s=612x612&w=0&k=20&c=k-jwLqVuoTz3pYC-wASFgybroKU_MsX51P79N-b21IQ="
            alt="VIP membership card payment"
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          />
          {/* Black overlay at 45% */}
          <div className="absolute inset-0 bg-black/45" />

          <div className="container relative z-10 text-center">
            <div className="inline-block max-w-3xl mx-auto rounded-lg p-[32px] md:p-[50px] md:my-[150px] shadow-lg bg-[rgba(17,28,97,0.61)]">
              <h1 className="text-4xl md:text-5xl font-bold text-[#EDA732]">Get in Touch</h1>
              <p className="mt-3 text-lg md:text-xl text-background/95">
                We’re here to assist you with all your inquiries, feedback, and requests. Whether you need more information about our services or have a special requirement, we’re just a message away. Our team is committed to providing you with prompt and personalized assistance.
              </p>
              <p className="mt-2 text-sm md:text-base text-background/90">Feel free to reach out, and we’ll be happy to help you on your journey with us.</p>
            </div>
          </div>
        </section>

      {/* Contact Info Columns */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Location</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingContact ? (
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-muted-foreground">{contactInfo.address}</p>
                )}
              </CardContent>
            </Card>

            {/* Emails */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Emails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingContact ? (
                  <>
                    <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-28 bg-muted animate-pulse rounded" />
                  </>
                ) : (
                  contactInfo.emails.map((email: string) => (
                    <p key={email} className="text-muted-foreground">{email}</p>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Phone Numbers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Phone Numbers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingContact ? (
                  <>
                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  </>
                ) : (
                  contactInfo.phones.map((phone: string) => (
                    <p key={phone} className="text-muted-foreground">{phone}</p>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <ContactForm />

      {/* All FAQs Section */}
      <section className="py-16" id="faqs">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">All FAQs</h2>
            <p className="text-lg text-muted-foreground">Everything you need to know</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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