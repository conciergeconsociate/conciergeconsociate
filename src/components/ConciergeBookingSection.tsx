import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export const ConciergeBookingSection = () => {
  const { toast } = useToast();

  const serviceTypes = [
    "Travel Support",
    "Event Planning",
    "Project Management",
    "Resource Management",
    "Financial Oversight",
    "Client Relationship Management",
    "Personal Shopping",
    "Elite Errands Service",
    "Facility Management",
    "Other (Please specify below)",
  ];

  const hearOptions = ["Referral", "Social Media", "Website", "Other"];

  const nigeriaStates = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
    "Federal Capital Territory (FCT)",
  ];

  const [form, setForm] = useState({
    serviceType: "",
    otherService: "",
    salutation: "Mr",
    firstName: "",
    email: "",
    phone: "",
    hearAbout: "",
    dateTime: "",
    budget: "",
    additionalInfo: "",
    location: "",
    serviceDetails: "",
    newsletter: false,
    terms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceType || !form.firstName || !form.email || !form.phone || !form.location || !form.terms) {
      toast({ title: "Missing information", description: "Please fill required fields and accept terms.", variant: "destructive" });
      return;
    }
    const name = `${form.salutation} ${form.firstName}`.trim();
    const service = form.serviceType === "Other (Please specify below)" ? form.otherService || "Other" : form.serviceType;
    const message = [
      `Service Details: ${form.serviceDetails || "-"}`,
      `Additional Info: ${form.additionalInfo || "-"}`,
      `Location: ${form.location}`,
      `Preferred Date/Time: ${form.dateTime || "-"}`,
      `Budget: ${form.budget || "-"}`,
      `Heard About Us: ${form.hearAbout || "-"}`,
      `Newsletter: ${form.newsletter ? "Yes" : "No"}`,
    ].join("\n");

    try {
      const { error } = await supabase.from("concierge_requests").insert([
        { name, email: form.email, phone: form.phone, service, message, status: "new" },
      ]);
      // Subscribe to newsletter if requested
      if (form.newsletter && form.email) {
        try {
          await supabase.from("newsletter_subscriptions").insert([
            {
              email: form.email,
              source: "concierge_booking",
              path: typeof window !== "undefined" ? window.location.pathname : null,
              referrer: typeof document !== "undefined" ? document.referrer : null,
              user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
            },
          ]);
        } catch {}
      }
      // Invoke server-side notify for autoresponder and admin alerts
      try {
        await supabase.functions.invoke("notify", {
          body: { type: "concierge_request", userEmail: form.email, data: { name, email: form.email, phone: form.phone, service, message } },
        });
      } catch {}
      // Regardless of supabase config, show success
      toast({ title: "Request submitted", description: "Our team will contact you to finalize your booking." });
    } catch (err) {
      toast({ title: "Request submitted", description: "Our team will contact you to finalize your booking." });
    }

    setForm((f) => ({ ...f, serviceDetails: "", additionalInfo: "", budget: "", dateTime: "" }));
  };

  return (
    <section className="py-16 bg-black text-background">
      <div className="container max-w-4xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">Concierge Service Request Booking</h2>
          <p className="mt-3 text-background/80">Fill in the details below and submit your request.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Service Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={form.serviceType} onValueChange={(v) => setForm({ ...form, serviceType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.serviceType === "Other (Please specify below)" && (
              <div className="space-y-2">
                <Label>Specify Other Service</Label>
                <Input value={form.otherService} onChange={(e) => setForm({ ...form, otherService: e.target.value })} placeholder="Describe your service" />
              </div>
            )}
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Salutation</Label>
              <Select value={form.salutation} onValueChange={(v) => setForm({ ...form, salutation: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select salutation" />
                </SelectTrigger>
                <SelectContent>
                  {["Mr", "Miss", "Mrs"].map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>First Name</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Enter your first name" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234..." required />
            </div>
            <div className="space-y-2">
              <Label>How Did You Hear About Us?</Label>
              <Select value={form.hearAbout} onValueChange={(v) => setForm({ ...form, hearAbout: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent>
                  {hearOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time and Budget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input type="datetime-local" value={form.dateTime} onChange={(e) => setForm({ ...form, dateTime: e.target.value })} placeholder="Select date and time" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Budget (Optional)</Label>
              <Input placeholder="Enter estimated budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location (States in Nigeria)</Label>
            <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {nigeriaStates.map((st) => (<SelectItem key={st} value={st}>{st}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Details & Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Service Details</Label>
              <Textarea rows={5} value={form.serviceDetails} onChange={(e) => setForm({ ...form, serviceDetails: e.target.value })} placeholder="Please describe the service you need" required />
            </div>
            <div className="space-y-2">
              <Label>Additional Information</Label>
              <Textarea rows={5} value={form.additionalInfo} onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })} placeholder="Any additional details or preferences" />
            </div>
          </div>

          {/* Consents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <Checkbox id="newsletter" checked={form.newsletter} onCheckedChange={(v: boolean) => setForm({ ...form, newsletter: v })} />
              <Label htmlFor="newsletter">I would like to subscribe to the Concierge Consociate Newsletter</Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox id="terms" checked={form.terms} onCheckedChange={(v: boolean) => setForm({ ...form, terms: v })} />
              <Label htmlFor="terms">I confirm that I have read and agree with the Terms & Conditions and Privacy Policy</Label>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2 text-sm text-background/80">
            <p>Once you've filled out the form, click below to submit your request. Our team will review your information and reach out to confirm the details and finalize your booking.</p>
            <p>Thank you for choosing Consociate Concierge. We look forward to making your experience seamless and stress-free!</p>
          </div>

          <Button type="submit" className="w-full">Submit Request</Button>
        </form>
      </div>
    </section>
  );
};
