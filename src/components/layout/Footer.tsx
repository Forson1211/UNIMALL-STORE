import { Link } from "react-router-dom";
import { ShoppingBag, Facebook, Twitter, Instagram, Youtube, ExternalLink, ShieldCheck, Globe, ChevronDown } from "lucide-react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Footer = () => {
  const { siteName, logoUrl } = useSiteSettingsContext();

  const sections = [
    {
      title: "Marketplace",
      links: [
        { name: "Shop Products", path: "/products" },
        { name: "Top Vendors", path: "/vendors" },
        { name: "Campus Deals", path: "/products" },
        { name: "Featured Stores", path: "/vendors" },
        { name: "How it Works", path: "/how-it-works" },
      ]
    },
    {
      title: "Categories",
      links: [
        { name: "Electronics", path: "/products?category=electronics" },
        { name: "Books & Study", path: "/products?category=books" },
        { name: "Fashion", path: "/products?category=fashion" },
        { name: "Home & Dorm", path: "/products?category=home" },
        { name: "Services", path: "/products?category=services" },
      ]
    },
    {
      title: "My Account",
      links: [
        { name: "Buyer Profile", path: "/account" },
        { name: "Order History", path: "/account/orders" },
        { name: "Wishlist", path: "/account/wishlist" },
        { name: "Settings", path: "/account" },
        { name: "Track Order", path: "/account/orders" },
      ]
    },
    {
      title: "Vendor Hub",
      links: [
        { name: "Become a Vendor", path: "/signup?role=vendor" },
        { name: "Vendor Login", path: "/login" },
        { name: "Seller Dashboard", path: "/vendor" },
        { name: "Vendor Support", path: "/contact" },
        { name: "Selling Tips", path: "/how-it-works" },
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", path: "/about" },
        { name: "Our Mission", path: "/about" },
        { name: "Contact Us", path: "/contact" },
        { name: "Privacy Policy", path: "/privacy" },
        { name: "Terms of Service", path: "/terms" },
        { name: "Campus News", path: "/news" },
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", path: "/contact" },
        { name: "FAQs", path: "/faqs" },
        { name: "Accessibility", path: "/contact" },
        { name: "Safety Center", path: "/how-it-works" },
        { name: "Community Rules", path: "/terms" },
      ]
    }
  ];

  return (
    <footer
      className="w-full pt-12 md:pt-16 pb-8 md:pb-12"
      style={{
        backgroundColor: "hsl(var(--footer-background))",
        color: "hsl(var(--footer-foreground))",
        "--background": "var(--footer-background)",
        "--foreground": "var(--footer-foreground)",
        "--muted": "var(--footer-background)",
        "--muted-foreground": "var(--footer-foreground)",
        "--border": "var(--footer-foreground)",
      } as React.CSSProperties}
    >
      <div className="container mx-auto px-6 max-w-[1400px]">
        {/* Top Bar: Brand & Socials */}
        <div className="flex flex-row items-center justify-between mb-8 md:mb-12 gap-4">
          <Link to="/" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-8 md:h-10 w-auto object-contain" />
            ) : (
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
            )}
            <span className="text-xl md:text-2xl font-bold tracking-tight">{siteName.toLowerCase()}</span>
          </Link>
          <div className="flex items-center gap-4 md:gap-8">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, idx) => (
              <a key={idx} href="#" className="opacity-70 hover:opacity-100 transition-opacity">
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Middle Section: Desktop Grid / Mobile Accordion */}
        <div className="hidden lg:grid lg:grid-cols-6 gap-x-8 gap-y-12 mb-20">
          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-sm font-bold tracking-wide">{section.title}</h4>
              <div className="w-full h-[1px] bg-white/20 mb-6" />
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-[13px] opacity-70 hover:opacity-100 transition-opacity block leading-tight py-0.5"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile Accordion Links */}
        <div className="lg:hidden mb-12">
          <Accordion type="single" collapsible className="w-full border-t border-white/10">
            {sections.map((section, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-white/10">
                <AccordionTrigger className="text-base font-bold py-5 hover:no-underline">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-4 pb-4">
                    {section.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <Link to={link.path} className="text-sm opacity-70 block">
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Feature Row: Updates & Badges */}
        <div className="grid lg:grid-cols-12 gap-12 items-end border-t border-white/10 pt-10 md:pt-16 mb-12 md:mb-16">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <h4 className="text-sm font-bold tracking-wide md:hidden">Community Updates</h4>
            <div className="flex flex-col md:flex-row gap-6">
              <Link to="/news" className="bg-white/5 rounded-xl p-4 flex items-center gap-4 flex-1 border border-white/5 hover:bg-white/[0.08] transition-colors group cursor-pointer">
                <div className="w-16 h-12 md:w-12 md:h-12 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                  <div className="w-full h-full bg-gradient-to-tr from-primary to-orange-400 opacity-80" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold mb-1">Latest Community Hub Update</p>
                  <p className="text-[11px] opacity-60 line-clamp-1">How students are saving 40% on textbooks this semester...</p>
                </div>
                <ExternalLink className="w-4 h-4 opacity-50 md:opacity-0 md:group-hover:opacity-40 transition-opacity" />
              </Link>
              <Link to="/news" className="bg-white/5 rounded-xl p-4 flex items-center gap-4 flex-1 border border-white/5 hover:bg-white/[0.08] transition-colors group cursor-pointer">
                <div className="w-16 h-12 md:w-12 md:h-12 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                  <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-indigo-600 opacity-80" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold mb-1">New Vendor Features</p>
                  <p className="text-[11px] opacity-60 line-clamp-1">Optimizing your campus store for mobile users...</p>
                </div>
                <ExternalLink className="w-4 h-4 opacity-50 md:opacity-0 md:group-hover:opacity-40 transition-opacity" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-8 lg:items-end">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="bg-white/5 border border-white/10 rounded px-3 py-1.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span className="text-[10px] font-black tracking-tighter uppercase">Verified Merchant</span>
              </div>
              <div className="flex gap-4 opacity-30 grayscale brightness-200">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-3.5" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg" alt="MasterCard" className="h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Apps */}
        <div className="flex flex-col gap-10 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex flex-col md:flex-row items-center gap-6 text-[13px] opacity-60">
              <p>© 2010-{new Date().getFullYear()} {siteName} LLC. All rights reserved.</p>
              <button className="flex items-center gap-2 hover:opacity-100 transition-opacity">
                <Globe className="w-4 h-4" />
                <span>English</span>
              </button>
            </div>
            <div className="flex flex-row md:flex-row items-center gap-4 w-full md:w-auto">
              <a href="#" className="flex-1 md:flex-none h-[52px] md:h-10 bg-black border border-white/20 rounded-xl px-4 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/ab/Apple-logo.png" alt="Apple" className="w-5 md:w-3 invert" />
                <div className="text-left text-white">
                  <p className="text-[8px] leading-none opacity-60 uppercase">Download on the</p>
                  <p className="text-[16px] md:text-[14px] font-bold leading-none">App Store</p>
                </div>
              </a>
              <a href="#" className="flex-1 md:flex-none h-[52px] md:h-10 bg-black border border-white/20 rounded-xl px-4 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg" alt="Google Play" className="w-5 md:w-4" />
                <div className="text-left text-white">
                  <p className="text-[8px] leading-none opacity-60 uppercase">Get it on</p>
                  <p className="text-[16px] md:text-[14px] font-bold leading-none">Google Play</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
