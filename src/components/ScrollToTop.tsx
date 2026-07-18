import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Wait a tick for the target page to render before locating the anchor.
      const id = window.setTimeout(() => {
        const el = document.getElementById(hash.slice(1));
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return () => window.clearTimeout(id);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
