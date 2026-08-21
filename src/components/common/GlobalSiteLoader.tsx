import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const GlobalSiteLoader = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const isFirstRender = useRef(true);

  // Trigger ONLY on full site load / browser refresh (never on client-side route navigation)
  useEffect(() => {
    setIsLoading(true);
    setIsVisible(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
      // Smooth fadeout
      setTimeout(() => {
        setIsVisible(false);
      }, 350);
    }, 4000);

    return () => clearTimeout(timer);
  }, []); // Run ONLY once on mount / site refresh

  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] pointer-events-none flex items-center justify-center bg-black/25 dark:bg-black/40 backdrop-blur-[1.5px] transition-opacity duration-250 ease-out ${
        isLoading ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* ── EXACT DUAL-ARC SPINNER (MATCHES USER SCREENSHOT) ── */}
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg
          className="w-full h-full animate-spin"
          viewBox="0 0 50 50"
          style={{ animationDuration: "0.85s", animationTimingFunction: "linear" }}
        >
          {/* Outer Crisp White Arc */}
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="65 120"
            strokeDashoffset="0"
          />

          {/* Inner Vibrant Lime Green Arc */}
          <circle
            cx="25"
            cy="25"
            r="13.5"
            fill="none"
            stroke="#88E500"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeDasharray="45 80"
            strokeDashoffset="20"
          />
        </svg>
      </div>
    </div>
  );
};

export default GlobalSiteLoader;
