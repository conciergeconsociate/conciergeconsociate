import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle } from "lucide-react";
import { mockContactInfo } from "@/data/mockData";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [info, setInfo] = useState<any>(mockContactInfo);
  const [loading, setLoading] = useState(true);
  const { flags } = useFeatureFlags();
  const [social, setSocial] = useState<{ facebook?: string; instagram?: string; twitter?: string; linkedin?: string; youtube?: string; whatsapp?: string }>({});

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("contact_info")
          .select("address,emails,phones")
          .limit(1)
          .maybeSingle();
        if (!error && data && isMounted) {
          const mapped = {
            address: Array.isArray(data.address) ? data.address : (data.address ? [data.address] : []),
            emails: Array.isArray(data.emails) ? data.emails : [],
            phones: Array.isArray(data.phones) ? data.phones : [],
          };
          setInfo(mapped);
        }
      } catch {}
      // Load social links from dedicated table and hide absent ones
      try {
        const { data: sData, error: sErr } = await supabase
          .from("social_links")
          .select("facebook,instagram,twitter,linkedin,youtube,whatsapp")
          .limit(1)
          .maybeSingle();
        if (!sErr && sData && isMounted) {
          const clean = (v: any) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined);
          setSocial({
            facebook: clean(sData.facebook),
            instagram: clean(sData.instagram),
            twitter: clean(sData.twitter),
            linkedin: clean(sData.linkedin),
            youtube: clean(sData.youtube),
            whatsapp: clean(sData.whatsapp),
          });
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
              {flags.membershipVisible && (
                <Link to="/membership" className="text-sm opacity-80 hover:text-primary transition-colors">
                  Membership
                </Link>
              )}
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
                  {Array.isArray(info.address) && info.address.length > 0 ? (
                    info.address.map((line: string, idx: number) => <p key={idx}>{line}</p>)
                  ) : (
                    <p>{info.address}</p>
                  )}
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
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {social.twitter && (
                <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {social.linkedin && (
                <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:text-primary transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:text-primary transition-colors">
                  <Youtube className="h-5 w-5" />
                </a>
              )}
              {social.whatsapp && (
                <a href={social.whatsapp} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:text-primary transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
