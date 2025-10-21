import { Link } from "react-router-dom";
import { Facebook, Instagram, MessageCircle } from "lucide-react";
import { mockContactInfo } from "@/data/mockData";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Copyright */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/brand-logo.svg" alt="Consociate Concierge logo" className="h-7 w-7" />
              <h3 className="text-2xl font-bold text-primary">Consociate Concierge</h3>
            </div>
            <p className="text-sm opacity-80">
              © {currentYear} Consociate Concierge. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-primary">Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              <Link to="/" className="text-sm opacity-80 hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/services" className="text-sm opacity-80 hover:text-primary transition-colors">
                Services
              </Link>
              <Link to="/membership" className="text-sm opacity-80 hover:text-primary transition-colors">
                Membership
              </Link>
              <Link to="/blog" className="text-sm opacity-80 hover:text-primary transition-colors">
                Blog
              </Link>
              <Link to="/about" className="text-sm opacity-80 hover:text-primary transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="text-sm opacity-80 hover:text-primary transition-colors">
                Contact Us
              </Link>
            </nav>
          </div>

          {/* Reach Us */}
          <div>
            <h4 className="font-semibold mb-4 text-primary">Reach Us</h4>
            <div className="space-y-2 text-sm opacity-80">
              <p>{mockContactInfo.address}</p>
              {mockContactInfo.emails.map((email, index) => (
                <p key={index}>
                  <a href={`mailto:${email}`} className="hover:text-primary transition-colors">
                    {email}
                  </a>
                </p>
              ))}
              {mockContactInfo.phones.map((phone, index) => (
                <p key={index}>
                  <a href={`tel:${phone}`} className="hover:text-primary transition-colors">
                    {phone}
                  </a>
                </p>
              ))}
            </div>
            <div className="flex space-x-4 mt-4">
              <a
                href={mockContactInfo.socialMedia.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={mockContactInfo.socialMedia.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:text-primary transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href={mockContactInfo.socialMedia.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
