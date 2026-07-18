import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const { siteName } = useSiteSettingsContext();

  // Scroll to top or anchor logic
  useEffect(() => {
    if (hash) {
      const id = window.setTimeout(() => {
        const el = document.getElementById(hash.slice(1));
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return () => window.clearTimeout(id);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, hash]);

  // Centralized Page Title updater
  useEffect(() => {
    const baseName = siteName || "Campus Marketplace";
    
    if (pathname === "/") {
      document.title = baseName;
      return;
    }

    let pageTitle = "Page";

    // Dynamic mapping of routes to page titles
    if (pathname === "/login") {
      pageTitle = "Sign In";
    } else if (pathname === "/signup") {
      pageTitle = "Create Account";
    } else if (pathname === "/products") {
      pageTitle = "Catalog";
    } else if (pathname === "/faqs") {
      pageTitle = "FAQs";
    } else if (pathname === "/about") {
      pageTitle = "About Us";
    } else if (pathname === "/contact") {
      pageTitle = "Contact Support";
    } else if (pathname === "/checkout") {
      pageTitle = "Checkout";
    } else if (pathname === "/how-it-works") {
      pageTitle = "How It Works";
    } else if (pathname === "/terms") {
      pageTitle = "Terms of Service";
    } else if (pathname === "/privacy") {
      pageTitle = "Privacy Policy";
    } else if (pathname === "/news") {
      pageTitle = "Campus News";
    } else if (pathname === "/vendors") {
      pageTitle = "Campus Stores";
    } else if (pathname.startsWith("/product/")) {
      pageTitle = "Product Details";
    } else if (pathname.startsWith("/vendor-store/")) {
      pageTitle = "Storefront";
    } else if (pathname.startsWith("/admin/")) {
      const section = pathname.replace("/admin/", "");
      const formattedSection = section
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      pageTitle = `Admin - ${formattedSection || "Dashboard"}`;
    } else if (pathname.startsWith("/vendor/")) {
      const section = pathname.replace("/vendor/", "");
      const formattedSection = section
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      pageTitle = `Vendor - ${formattedSection || "Dashboard"}`;
    } else if (pathname.startsWith("/account/")) {
      const section = pathname.replace("/account/", "");
      const formattedSection = section
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      pageTitle = `Profile - ${formattedSection || "Dashboard"}`;
    } else if (pathname === "/account") {
      pageTitle = "Profile";
    }

    document.title = `${baseName} - ${pageTitle}`;
  }, [pathname, siteName]);

  return null;
};

export default ScrollToTop;
