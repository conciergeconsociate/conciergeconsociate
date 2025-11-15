import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MembershipPlans } from "@/components/MembershipPlans";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Membership() {
  const { flags } = useFeatureFlags();
  const { userId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!flags.membershipVisible && !userId) {
      navigate("/");
    }
  }, [flags.membershipVisible, userId]);

  if (!flags.membershipVisible && !userId) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[400px] flex items-center justify-center">
          {/* Background image switched to <img> for precise object positioning */}
          <img
            src="https://media.istockphoto.com/id/1428672350/photo/wealthy-couple-with-smartphone-in-hotel-lounge.jpg?s=612x612&w=0&k=20&c=X8mwYrX1BpIRuRS-0mEAkERfqqUdQQmRZ0F79vYlewQ="
            alt="Wealthy couple in hotel lounge"
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          />
          {/* Black overlay at 45% */}
          <div className="absolute inset-0 bg-black/45" />
          <div className="container relative z-10 text-center">
            <div className="inline-block max-w-3xl mx-auto rounded-lg p-[32px] md:p-[50px] md:my-[150px] shadow-lg bg-[rgba(17,28,97,0.61)]">
              <h1 className="text-4xl md:text-5xl font-bold text-[#EDA732]">Our Memberships</h1>
              <p className="mt-3 text-lg md:text-xl text-background/95">
                Experience premium services, tailored just for you. Join our community today and enjoy a seamless, stress-free lifestyle.
              </p>
              <p className="mt-3 text-base md:text-lg text-background/90">Explore Our Membership Options</p>
            </div>
          </div>
        </section>

        {/* New Two-Column Section */}
        <section className="py-16">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="relative h-[300px] rounded-lg overflow-hidden">
                <img
                  src="https://media.istockphoto.com/id/1474088682/photo/happy-businessman-in-hotel-on-smartphone-call-and-business-communication-for-work-in-atlanta.jpg?s=612x612&w=0&k=20&c=Jt5GwVh4AI5Z-7wqw4atjZxXTA-u8ootsd7pgUJVjwo="
                  alt="Membership growth"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-primary">Unlock Your Full Potential with Our Exclusive Membership</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Join our community and gain access to a wealth of resources, expert guidance, and valuable networking opportunities. Our membership is designed for those looking to grow their business, expand their skills, and connect with like-minded professionals.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  With personalized support, exclusive resources, and invitations to members-only events, you'll have everything you need to thrive. As a member, you'll enjoy tailored strategies, industry insights, and access to a network of professionals who can help propel you forward.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Take the next step in your growth journey—join today and experience the transformation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {(!!userId || flags.membershipVisible) && <MembershipPlans />}
        <TestimonialsSection />
      </main>

      <Footer />
    </div>
  );
}
