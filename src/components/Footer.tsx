import { Link } from "react-router-dom";
import { Facebook, Instagram, MessageCircle } from "lucide-react";
import { mockContactInfo } from "@/data/mockData";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [info, setInfo] = useState<any>(mockContactInfo);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
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
          setInfo(mapped);
        }
      } catch {}
      if (isMounted) setLoading(false);
    })();
    return () => { isMounted = false; };
  }, []);

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
              {loading ? (
                <>
                  <div className="h-3 w-40 bg-background/20 animate-pulse rounded" />
                  <div className="h-3 w-28 bg-background/20 animate-pulse rounded" />
                  <div className="h-3 w-24 bg-background/20 animate-pulse rounded" />
                </>
              ) : (
                <>
                  <p>{info.address}</p>
                  {info.emails.map((email: string, index: number) => (
                    <p key={index}>
                      <a href={`mailto:${email}`} className="hover:text-primary transition-colors">
                        {email}
                      </a>
                    </p>
                  ))}
                  {info.phones.map((phone: string, index: number) => (
                    <p key={index}>
                      <a href={`tel:${phone}`} className="hover:text-primary transition-colors">
                        {phone}
                      </a>
                    </p>
                  ))}
                </>
              )}
            </div>
            <div className="flex space-x-4 mt-4">
              <a
                href={info.socialMedia.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={info.socialMedia.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:text-primary transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href={info.socialMedia.instagram}
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
