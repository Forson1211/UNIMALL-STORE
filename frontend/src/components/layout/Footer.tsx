import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, Globe, Truck, Headset, ShieldCheck } from "lucide-react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import ManagedNavigation from "./ManagedNavigation";

const Footer = () => {
  const { siteName, logoUrl, footerLogoUrl } = useSiteSettingsContext();
  const { user, role } = useAuth();

  const isVendor = role === "vendor";
  const isAdmin = role === "admin";
  const showDashboard = user && (isVendor || isAdmin);
  const dashboardLink = isAdmin ? "/admin" : "/vendor";
  const dashboardLabel = isAdmin ? "Visit Admin Dashboard" : "Visit Vendor Dashboard";


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

  const footerVars = {
    backgroundColor: "hsl(var(--footer-background))",
    color: "hsl(var(--footer-foreground))",
    "--background": "var(--footer-background)",
    "--foreground": "var(--footer-foreground)",
    "--muted": "var(--footer-background)",
    "--muted-foreground": "var(--footer-foreground)",
    "--border": "var(--footer-foreground)",
  } as React.CSSProperties;

  return (
    <>
      <ManagedNavigation location="footer" />
      <footer
        className="full-width-breakout pt-8 pb-6 hidden lg:block"
        style={footerVars}
      >
        <div className="max-w-[1280px] mx-auto px-4 xl:px-0">
          {/* Top Bar: Brand & Socials */}
          <div className="flex flex-row items-center justify-between mb-6 md:mb-8 gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={footerLogoUrl || logoUrl || "/FOOTER LOGO.png"} alt={siteName} className="h-10 md:h-14 w-auto object-contain" />
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

          {/* Trust Features Bar */}
          <div className="border-t border-white/10 py-7 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
              {/* Feature 1: Free Shipping & Return */}
              <div className="flex items-center gap-4 justify-start">
                <Truck className="w-10 h-10 sm:w-11 sm:h-11 text-white shrink-0 stroke-[1.5]" />
                <div className="min-w-0">
                  <h4 className="text-[15px] sm:text-[16px] font-bold text-white tracking-tight leading-snug">
                    Free Shipping &amp; Return
                  </h4>
                  <p className="text-[12px] sm:text-[13px] text-white/60 leading-snug mt-0.5">
                    Free shipping on orders over $99
                  </p>
                </div>
              </div>

              {/* Feature 2: Customer Support 24/7 */}
              <div className="flex items-center gap-4 md:justify-center md:border-x md:border-white/10 md:px-4">
                <Headset className="w-10 h-10 sm:w-11 sm:h-11 text-white shrink-0 stroke-[1.5]" />
                <div className="min-w-0">
                  <h4 className="text-[15px] sm:text-[16px] font-bold text-white tracking-tight leading-snug">
                    Customer Support 24/7
                  </h4>
                  <p className="text-[12px] sm:text-[13px] text-white/60 leading-snug mt-0.5">
                    Instant access to perfect support
                  </p>
                </div>
              </div>

              {/* Feature 3: 100% Secure Payment */}
              <div className="flex items-center gap-4 md:justify-end">
                <ShieldCheck className="w-10 h-10 sm:w-11 sm:h-11 text-white shrink-0 stroke-[1.5]" />
                <div className="min-w-0">
                  <h4 className="text-[15px] sm:text-[16px] font-bold text-white tracking-tight leading-snug">
                    100% Secure Payment
                  </h4>
                  <p className="text-[12px] sm:text-[13px] text-white/60 leading-snug mt-0.5">
                    We ensure secure payment!
                  </p>
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
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/50">
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
                <a href="#" className="flex-1 md:flex-none h-10 bg-black border border-white/20 rounded-none px-4 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" alt="Apple" className="w-3.5" />
                  <div className="text-left text-white">
                    <p className="text-[10px] leading-none opacity-60 uppercase">Download on the</p>
                    <p className="text-[14px] font-bold leading-none">App Store</p>
                  </div>
                </a>
                <a href="#" className="flex-1 md:flex-none h-10 bg-black border border-white/20 rounded-none px-4 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
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
    </>
  );
};

export default Footer;
