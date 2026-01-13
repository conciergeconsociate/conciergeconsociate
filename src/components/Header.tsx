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
import { useAuth } from "@/hooks/useAuth.tsx";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { EditProfileModal } from "@/components/modals/EditProfileModal";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { userId, isAdmin, signOut } = useAuth();
  const { flags } = useFeatureFlags();

  const isLoggedIn = !!userId;

  const baseMenu = [
    { label: "Home", path: "/" },
    { label: "Services", path: "/services" },
    { label: "Blog", path: "/blog" },
    { label: "About Us", path: "/about" },
    { label: "Contact Us", path: "/contact" },
  ];
  const menuItems = [
    ...baseMenu,
    // Show Membership link for logged-in users or when flag is visible
    ...(flags.membershipVisible ? [{ label: "Membership", path: "/membership" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/brand-logo.svg" alt="Consociate Concierge logo" className="h-10 w-10 md:h-8 md:w-8" />
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
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>Admin Panel</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setEditProfileOpen(true)}>Edit Profile</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await signOut();
                    } catch (e) {
                      console.error("Logout error", e);
                    } finally {
                      navigate("/");
                    }
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            flags.loginVisible ? (
              <Button variant="default" onClick={() => navigate("/login")}>Login</Button>
            ) : null
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
        <div className="md:hidden border-t p-4 bg-background">
          <nav className="flex flex-col space-y-4">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm font-medium transition-colors hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <>
                <div className="border-t my-2" />
                {isAdmin && (
                  <Button variant="ghost" className="justify-start px-0" onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}>
                    Admin Panel
                  </Button>
                )}
                <Button variant="ghost" className="justify-start px-0" onClick={() => { setEditProfileOpen(true); setMobileMenuOpen(false); }}>
                  Edit Profile
                </Button>
                <Button variant="ghost" className="justify-start px-0 text-destructive" onClick={async () => { await signOut(); navigate("/"); setMobileMenuOpen(false); }}>
                  Logout
                </Button>
              </>
            ) : (
              flags.loginVisible && (
                <Button variant="default" onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}>
                  Login
                </Button>
              )
            )}
          </nav>
        </div>
      )}

      <EditProfileModal open={editProfileOpen} onOpenChange={setEditProfileOpen} />
    </header>
  );
};
