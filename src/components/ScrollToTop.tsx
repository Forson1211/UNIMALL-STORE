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
    const baseName = siteName || "Unimall";
    let title = "Campus Marketplace";

    // Dynamic mapping of routes to page titles
    if (pathname === "/") {
      title = "Campus Marketplace";
    } else if (pathname === "/login") {
      title = "Sign In";
    } else if (pathname === "/signup") {
      title = "Create Account";
    } else if (pathname === "/products") {
      title = "Catalog";
    } else if (pathname === "/faqs") {
      title = "FAQs";
    } else if (pathname === "/about") {
      title = "About Us";
    } else if (pathname === "/contact") {
      title = "Contact Support";
    } else if (pathname === "/checkout") {
      title = "Checkout";
    } else if (pathname === "/how-it-works") {
      title = "How It Works";
    } else if (pathname === "/terms") {
      title = "Terms of Service";
    } else if (pathname === "/privacy") {
      title = "Privacy Policy";
    } else if (pathname === "/news") {
      title = "Campus News";
    } else if (pathname === "/vendors") {
      title = "Campus Stores";
    } else if (pathname.startsWith("/product/")) {
      title = "Product Details";
    } else if (pathname.startsWith("/vendor-store/")) {
      title = "Storefront";
    } else if (pathname.startsWith("/admin/")) {
      const section = pathname.replace("/admin/", "");
      const formattedSection = section
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      title = `Admin | ${formattedSection || "Dashboard"}`;
    } else if (pathname.startsWith("/vendor/")) {
      const section = pathname.replace("/vendor/", "");
      const formattedSection = section
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      title = `Vendor | ${formattedSection || "Dashboard"}`;
    } else if (pathname.startsWith("/account/")) {
      const section = pathname.replace("/account/", "");
      const formattedSection = section
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      title = `My Account | ${formattedSection || "Profile"}`;
    }

    document.title = `${title} | ${baseName}`;
  }, [pathname, siteName]);

  return null;
};

export default ScrollToTop;
