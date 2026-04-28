import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Facebook, Twitter, Instagram, Youtube, ExternalLink, ShieldCheck, Globe, ChevronDown } from "lucide-react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Footer = () => {
  const { siteName, logoUrl } = useSiteSettingsContext();
  const { user, role } = useAuth();
  const [footerNews, setFooterNews] = useState<any[]>([]);

  const isVendor = role === "vendor";
  const isAdmin = role === "admin";
  const showDashboard = user && (isVendor || isAdmin);
  const dashboardLink = isAdmin ? "/admin" : "/vendor";
  const dashboardLabel = isAdmin ? "Visit Admin Dashboard" : "Visit Vendor Dashboard";

  useEffect(() => {
    const fetchFooterNews = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("campus_news")
          .select("*")
          .eq("is_published", true)
          .order("publish_date", { ascending: false })
          .limit(2);

        if (!error && data) {
          setFooterNews(data);
        }
      } catch (err) {
        console.error("Error fetching footer news:", err);
      }
    };
    fetchFooterNews();
  }, []);

  const sections = [
    {
      title: "Marketplace",
      links: [
        { name: "Shop Products", path: "/products", aria: "Browse all products" },
        { name: "Top Vendors", path: "/vendors", aria: "View top rated campus vendors" },
        { name: "Campus Deals", path: "/products", aria: "View latest deals" },
        { name: "Featured Stores", path: "/vendors", aria: "Explore featured campus stores" },
        { name: "How it Works", path: "/how-it-works", aria: "Learn how to use the marketplace" },
      ]
    },
    {
      title: "Categories",
      links: [
        { name: "Electronics", path: "/products?category=Electronics", aria: "Shop electronics" },
        { name: "Books & Study", path: "/products?category=Books", aria: "Shop books and study materials" },
        { name: "Fashion", path: "/products?category=Fashion", aria: "Shop fashion items" },
        { name: "Home & Dorm", path: "/products?category=Home", aria: "Shop home and dorm essentials" },
        { name: "Services", path: "/products?category=Services", aria: "Browse campus services" },
      ]
    },
    {
      title: "My Account",
      links: [
        { name: "Buyer Profile", path: "/account", aria: "Go to your buyer profile" },
        { name: "Order History", path: "/account/orders", aria: "View your past orders" },
        { name: "Wishlist", path: "/account/wishlist", aria: "View your saved items" },
        { name: "Settings", path: "/account", aria: "Manage your account settings" },
        { name: "Track Order", path: "/account/orders", aria: "Track your active orders" },
      ]
    },
    {
      title: "Vendor Hub",
      links: [
        {
          name: showDashboard ? dashboardLabel : "Become a Vendor",
          path: showDashboard ? dashboardLink : "/signup?role=vendor",
          aria: showDashboard ? "Go to your dashboard" : "Apply to become a campus vendor"
        },
        { name: "Vendor Login", path: "/login", aria: "Log in to your vendor account" },
        { name: "Seller Dashboard", path: "/vendor", aria: "Access your seller tools" },
        { name: "Vendor Support", path: "/contact", aria: "Get help with your vendor account" },
        { name: "Selling Tips", path: "/how-it-works", aria: "Learn how to sell successfully" },
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", path: "/about", aria: "Learn more about us" },
        { name: "Our Mission", path: "/about", aria: "Read our mission statement" },
        { name: "Contact Us", path: "/contact", aria: "Get in touch with us" },
        { name: "Privacy Policy", path: "/about", aria: "Read our privacy policy" },
        { name: "Terms of Service", path: "/about", aria: "Read our terms of service" },
        { name: "Campus News", path: "/news", aria: "Read latest campus news" },
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", path: "/contact", aria: "Visit our help center" },
        { name: "FAQs", path: "/how-it-works", aria: "Read frequently asked questions" },
        { name: "Accessibility", path: "/about", aria: "Read our accessibility statement" },
        { name: "Safety Center", path: "/how-it-works", aria: "Learn about campus safety" },
        { name: "Community Rules", path: "/about", aria: "Read our community guidelines" },
      ]
    }
  ];

  return (
    <footer
      className="w-full pt-8 pb-6"
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
        <div className="flex flex-row items-center justify-between mb-6 md:mb-8 gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/FOOTER LOGO.png" alt={siteName} className="h-10 md:h-14 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4 md:gap-8">
            {[
              { Icon: Facebook, label: "Facebook" },
              { Icon: Instagram, label: "Instagram" },
              { Icon: Twitter, label: "Twitter" },
              { Icon: Youtube, label: "Youtube" }
            ].map(({ Icon, label }, idx) => (
              <a
                key={idx}
                href="#"
                className="opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary rounded-md p-1"
                aria-label={`Follow us on ${label}`}
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Middle Section: Desktop Grid / Mobile Accordion */}
        <div className="hidden lg:grid lg:grid-cols-6 gap-x-8 gap-y-8 mb-8">
          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-sm font-bold tracking-wide">{section.title}</h4>
              <div className="w-full h-[1px] bg-white/20 mb-6" />
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity block leading-tight py-0.5 focus:outline-none focus:text-white"
                      aria-label={(link as any).aria}
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
                <AccordionTrigger className="text-base font-bold py-4 hover:no-underline">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pb-4">
                    {section.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <Link
                          to={link.path}
                          className="text-sm opacity-70 block py-1.5 focus:text-white"
                          aria-label={(link as any).aria}
                        >
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
        <div className="grid lg:grid-cols-12 gap-6 items-center border-t border-white/10 pt-4 mb-6">
          <div className="lg:col-span-8 flex flex-col">
            <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-white/40 mb-2">Latest Updates</h4>
            <div className="flex flex-col md:flex-row gap-6">
              {footerNews.length >= 2 ? (
                <>
                  {footerNews.map((news, idx) => (
                    <Link
                      key={news.id}
                      to={`/news/${news.id}`}
                      className="bg-[#2a2a35] rounded-xl p-2 flex items-center gap-3 flex-1 border border-white/5 hover:bg-[#323240] transition-all group cursor-pointer"
                    >
                      <div className="w-20 h-14 rounded-md overflow-hidden shrink-0 border border-white/5">
                        {news.image_url ? (
                          <img
                            src={news.image_url}
                            alt={news.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className={cn(
                            "w-full h-full opacity-80",
                            idx === 0 ? "bg-gradient-to-tr from-primary to-orange-400" : "bg-gradient-to-tr from-blue-500 to-indigo-600"
                          )} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/90 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                          {news.title}
                        </p>
                      </div>
                      <div className="shrink-0 pr-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3.5 h-3.5 text-white" />
                      </div>
                    </Link>
                  ))}
                </>
              ) : (
                <>
                  <Link to="/news" className="bg-white/5 rounded-xl p-4 flex items-center gap-4 flex-1 border border-white/5 hover:bg-white/[0.08] transition-colors group cursor-pointer">
                    <div className="w-16 h-12 md:w-12 md:h-12 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                      <div className="w-full h-full bg-gradient-to-tr from-primary to-orange-400 opacity-80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold mb-1">Latest Community Hub Update</p>
                      <p className="text-xs opacity-60 line-clamp-1">How students are saving 40% on textbooks this semester...</p>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-50 md:opacity-0 md:group-hover:opacity-40 transition-opacity" />
                  </Link>
                  <Link to="/news" className="bg-white/5 rounded-xl p-4 flex items-center gap-4 flex-1 border border-white/5 hover:bg-white/[0.08] transition-colors group cursor-pointer">
                    <div className="w-16 h-12 md:w-12 md:h-12 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                      <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-indigo-600 opacity-80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold mb-1">New Vendor Features</p>
                      <p className="text-xs opacity-60 line-clamp-1">Optimizing your campus store for mobile users...</p>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-50 md:opacity-0 md:group-hover:opacity-40 transition-opacity" />
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6 lg:items-end">
            <div className="flex flex-wrap gap-6 items-center lg:justify-end">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-green-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2.5 shadow-xl transition-all duration-300 group-hover:bg-white/[0.08] group-hover:border-white/20">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <span className="text-xs font-bold tracking-[0.1em] uppercase text-white/90">Verified Merchant</span>
                </div>
              </div>
              <div className="flex items-center gap-6 opacity-80 hover:opacity-100 transition-all duration-500">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                  alt="PayPal"
                  className="h-4 w-auto"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                  alt="MasterCard"
                  className="h-6 w-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Apps */}
        <div className="flex flex-col gap-10 pt-4 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-2">
            {/* Left: Copyright & Language */}
            <div className="flex flex-col md:flex-row items-center gap-6 text-sm opacity-60">
              <p>© 2010-{new Date().getFullYear()} {siteName} LLC. All rights reserved.</p>
              <button className="flex items-center gap-2 hover:opacity-100 transition-opacity">
                <Globe className="w-4 h-4" />
                <span>English</span>
              </button>
            </div>

            {/* Center: Developers */}
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-[0.15em] uppercase text-white/40">
              <span className="whitespace-nowrap">Developed by</span>
              <a
                href="#"
                className="text-primary/90 hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4 focus:outline-none focus:text-primary"
                aria-label="Developer Forson's Profile"
              >
                Forson
              </a>
              <span>and</span>
              <a
                href="#"
                className="text-primary/90 hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4 focus:outline-none focus:text-primary"
                aria-label="Developer Abraham's Profile"
              >
                Abraham
              </a>
            </div>

            {/* Right: Apps */}
            <div className="flex flex-row items-center gap-4 w-full md:w-auto">
              <a href="#" className="flex-1 md:flex-none h-10 bg-black border border-white/20 rounded-xl px-4 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" alt="Apple" className="w-3.5" />
                <div className="text-left text-white">
                  <p className="text-[10px] leading-none opacity-60 uppercase">Download on the</p>
                  <p className="text-[14px] font-bold leading-none">App Store</p>
                </div>
              </a>
              <a href="#" className="flex-1 md:flex-none h-10 bg-black border border-white/20 rounded-xl px-4 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg" alt="Google Play" className="w-4" />
                <div className="text-left text-white">
                  <p className="text-[10px] leading-none opacity-60 uppercase">Get it on</p>
                  <p className="text-[14px] font-bold leading-none">Google Play</p>
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
