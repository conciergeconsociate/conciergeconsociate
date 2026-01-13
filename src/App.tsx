import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Venues from "./pages/Venues";
import Membership from "./pages/Membership";
import AdminGuard from "./pages/AdminGuard";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
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
import ThankYou from "./pages/ThankYou";
import { FeatureFlagsProvider } from "@/hooks/useFeatureFlags";
import { AuthProvider } from "@/hooks/useAuth.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: async (error: any) => {
      // Global error handler for queries
      // If we encounter a JWT/Auth error, clear the session and reload
      // This fixes issues where a stale token in localStorage breaks the app
      if (
        error?.message?.includes("JWT") ||
        error?.message?.includes("token") ||
        error?.code === "PGRST301" || 
        error?.status === 401 ||
        error?.status === 403
      ) {
        console.warn("Detected stale/invalid session, clearing auth...", error);
        await supabase.auth.signOut();
        // Optional: clear localStorage explicitly if needed
        localStorage.removeItem(`sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`);
        window.location.reload();
      }
    },
  }),
});

const AssistantFABGate = () => {
  const loc = useLocation();
  return loc.pathname.startsWith("/admin") ? null : <VirtualAssistantFAB />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ConnectivityGate />
      <IpTracker />
      <FeatureFlagsProvider>
        <AuthProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
          {/* Floating Action Button for Virtual Assistant (hidden on admin routes) */}
          <AssistantFABGate />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/admin" element={<AdminGuard />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogView />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/services/:id" element={<ServiceDetails />} />
            <Route path="/venue/:id" element={<VenueDetails />} />
            <Route path="/thank-you" element={<ThankYou />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </FeatureFlagsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
