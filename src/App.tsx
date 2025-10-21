import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Membership from "./pages/Membership";
import AdminGuard from "./pages/AdminGuard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import { VirtualAssistantFAB } from "@/components/VirtualAssistantFAB";
import ConnectivityGate from "@/components/ConnectivityGate";
import IpTracker from "@/components/IpTracker";
import ServiceDetails from "./pages/ServiceDetails";
import VenueDetails from "./pages/VenueDetails";
import BlogView from "@/pages/BlogView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ConnectivityGate />
      <IpTracker />
      <BrowserRouter>
        {/* Floating Action Button for Virtual Assistant */}
        <VirtualAssistantFAB />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/admin" element={<AdminGuard />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/venue/:id" element={<VenueDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
