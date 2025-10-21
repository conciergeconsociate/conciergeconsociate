import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { userId, isAdmin, signOut } = useAuth();

  // Robust dev fallback: if Supabase isn't configured, reflect local dev session
  const hasSupabase = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const devRaw = !hasSupabase && typeof localStorage !== "undefined" ? localStorage.getItem("dev_admin_session") : null;
  let devSession: { userId?: string; email?: string } | null = null;
  try { devSession = devRaw ? JSON.parse(devRaw) : null; } catch {}

  const effectiveUserId = userId || (!hasSupabase ? devSession?.userId || null : null);
  const effectiveIsAdmin = isAdmin || (!hasSupabase && !!devSession);
  const isLoggedIn = !!effectiveUserId;

  const menuItems = [
    { label: "Home", path: "/" },
    { label: "Services", path: "/services" },
    { label: "Membership", path: "/membership" },
    { label: "Blog", path: "/blog" },
    { label: "About Us", path: "/about" },
    { label: "Contact Us", path: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/brand-logo.svg" alt="Consociate Concierge logo" className="h-8 w-8" />
          <span className="text-xl font-bold text-primary">Consociate Concierge</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {effectiveIsAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>Admin Panel</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("/membership")}>Membership</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" onClick={() => navigate("/login")}>Login</Button>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block text-sm font-medium hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                {effectiveIsAdmin && (
                  <Button variant="outline" onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}>Admin Panel</Button>
                )}
                <Button
                  variant="default"
                  onClick={async () => {
                    await signOut();
                    setMobileMenuOpen(false);
                    navigate("/");
                  }}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="default" onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}>Login</Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
