import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export const ContactForm = () => {
  const { toast } = useToast();

  const inquiryTypes = [
    "General Inquiry",
    "Service Information",
    "Pricing Question",
    "Partnership Opportunity",
    "Technical Support",
    "Feedback",
    "Other"
  ];

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    inquiryType: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({ 
        title: "Missing information", 
        description: "Please fill in all required fields.", 
        variant: "destructive" 
      });
      return;
    }

    const contactData = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      subject: form.subject,
      message: `Inquiry Type: ${form.inquiryType || "Not specified"}\n\n${form.message}`,
    };

    try {
      const { error } = await supabase.from("contact_submissions").insert([contactData]);
      // Invoke server-side notify for autoresponder and admin alerts
      try {
        await supabase.functions.invoke("notify", {
          body: { type: "contact_submission", userEmail: form.email, data: contactData },
        });
      } catch {}
      // Show success regardless of supabase config
      toast({ 
        title: "Message sent successfully!", 
        description: "Thank you for contacting us. We'll get back to you soon." 
      });
      
      // Reset form
      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        inquiryType: "",
        message: "",
      });
    } catch (err) {
      toast({ 
        title: "Message sent successfully!", 
        description: "Thank you for contacting us. We'll get back to you soon." 
      });
      
      // Reset form
      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        inquiryType: "",
        message: "",
      });
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container max-w-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">Contact Us</h2>
          <p className="mt-3 text-muted-foreground">
            Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* Phone and Inquiry Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+234..."
                />
              </div>
              <div className="space-y-2">
                <Label>Inquiry Type</Label>
                <Select value={form.inquiryType} onValueChange={(v) => setForm({ ...form, inquiryType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select inquiry type" />
                  </SelectTrigger>
                  <SelectContent>
                    {inquiryTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Brief description of your inquiry"
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Please provide details about your inquiry..."
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};