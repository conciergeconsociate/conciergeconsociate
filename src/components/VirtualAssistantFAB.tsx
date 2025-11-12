import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export const VirtualAssistantFAB = () => {
  const [open, setOpen] = useState(false);
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
  const salutationOptions = ["Mr", "Miss", "Mrs"];
  const hearOptions = ["Referral", "Social Media", "Website", "Other"];
  const priorityLevels = ["Low", "Medium", "High", "Urgent"];

  const [form, setForm] = useState({
    serviceType: "",
    otherService: "",
    salutation: "",
    priority: "",
    firstName: "",
    lastName: "",
    email: "",
    duration: "",
    hearAbout: "",
    deadline: "",
    budget: "",
    additionalInfo: "",
    taskDetails: "",
    newsletter: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceType || !form.firstName || !form.lastName || !form.email || !form.taskDetails) {
      toast({ title: "Missing required fields", description: "Please fill in required fields before submitting.", variant: "destructive" });
      return;
    }

    const service = form.serviceType === "Other (Please specify below)" ? (form.otherService || "Other") : form.serviceType;
    const payload = {
      name: `${form.salutation ? form.salutation + " " : ""}${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
      phone: null,
      service,
      status: "pending",
    };

    try {
      const { error } = await supabase.from("virtual_assistance_requests").insert([payload]);
      if (error) {
        toast({ title: "Submission failed", description: error.message || "Could not save your request.", variant: "destructive" });
        return;
      }
      // Optional: subscribe to newsletter if requested
      if (form.newsletter && form.email) {
        try {
          await supabase.from("newsletter_subscriptions").insert([
            {
              email: form.email,
              source: "virtual_assistant",
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
          body: { type: "virtual_assistance_request", userEmail: form.email, data: {
            ...payload,
            other_service: form.otherService || null,
            priority: form.priority || null,
            duration: form.duration || null,
            hear_about: form.hearAbout || null,
            deadline: form.deadline ? form.deadline : null,
            budget: form.budget || null,
            additional_info: form.additionalInfo || null,
            task_details: form.taskDetails,
          } },
        });
      } catch {}
      // Show success
      toast({ title: "Request submitted", description: "Our team will review your request and reach out shortly." });
    } catch (err: any) {
      toast({ title: "Submission failed", description: err?.message || "Could not submit your request.", variant: "destructive" });
    }

    setOpen(false);
    setForm({
      serviceType: "",
      otherService: "",
      salutation: "",
      priority: "",
      firstName: "",
      lastName: "",
      email: "",
      duration: "",
      hearAbout: "",
      deadline: "",
      budget: "",
      additionalInfo: "",
      taskDetails: "",
      newsletter: false,
    });
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Virtual Assistant Request"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-black text-background max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">Virtual Assistant Task Request</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-background/80">
            <p>
              Welcome to Consociate Concierge’s Virtual Assistant Services! Our expert virtual assistants are here to help you manage your busy schedule, streamline your tasks, and provide seamless support for both personal and professional needs. To get started, simply fill out the form below to request assistance. Our team will review your request and connect with you to discuss the details and tailor the support to suit your needs.
            </p>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Type of Task / Service Required</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Salutation</Label>
                  <Select value={form.salutation} onValueChange={(v) => setForm({ ...form, salutation: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select salutation" />
                    </SelectTrigger>
                    <SelectContent>
                      {salutationOptions.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                    </SelectContent>
                  </Select>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Enter your first name" required />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Enter your last name" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Duration (Optional)</Label>
                  <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="How long do you anticipate the task to take?" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Deadline or Time Frame</Label>
                  <Input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="Select date and time" />
                </div>
                <div className="space-y-2">
                  <Label>Budget (Optional)</Label>
                  <Input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="If you have a specific budget in mind, please let us know..." />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Additional Information or Special Instructions</Label>
                  <Textarea rows={5} value={form.additionalInfo} onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })} placeholder="Any specific requirements or extra details" />
                </div>
                <div className="space-y-2">
                  <Label>Task Details</Label>
                  <Textarea rows={5} value={form.taskDetails} onChange={(e) => setForm({ ...form, taskDetails: e.target.value })} placeholder="Detailed description of tasks or projects" required />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox id="newsletter-va" checked={form.newsletter} onCheckedChange={(v: boolean) => setForm({ ...form, newsletter: v })} />
                <Label htmlFor="newsletter-va">I would like to subscribe to the Concierge Consociate Newsletter</Label>
              </div>

              <div className="space-y-2 text-sm text-background/80">
                <p>Once you’ve filled out the form, click below to submit your request. Our team will review your information and reach out to confirm the details and finalize your booking.</p>
                <p>Thank you for choosing Consociate Concierge. Let us handle the tasks so you can focus on what matters most!</p>
              </div>

              <Button type="submit" className="w-full">Submit Request</Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};