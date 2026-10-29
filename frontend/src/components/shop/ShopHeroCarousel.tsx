import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import shopBanner from "../../../dist/Images/6.png";

export interface ShopHeroSlide {
  banner?: boolean;
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  image?: string;
  src?: string;
  cta: string;
  ctaLink?: string;
}

const DEFAULT_SHOP_SLIDES: ShopHeroSlide[] = [
  {
    eyebrow: "",
    title: "Find it.\nLove it.",
    highlight: "",
    subtitle: "Your next favourite is here.",
    image: shopBanner,
    cta: "Shop Now!",
    ctaLink: "#all-products",
    banner: true,
  },
];

const ShopHeroCarousel = () => {
  const { getSetting } = useSiteSettingsContext();
  const configuredSlides = getSetting("shop_slider_images", DEFAULT_SHOP_SLIDES);
  const slides: ShopHeroSlide[] = Array.isArray(configuredSlides) && configuredSlides.length > 0
    ? configuredSlides.map((s, idx) => ({
        ...DEFAULT_SHOP_SLIDES[idx % DEFAULT_SHOP_SLIDES.length],
        ...s,
        image: s.image || (s as any).src || DEFAULT_SHOP_SLIDES[idx % DEFAULT_SHOP_SLIDES.length]?.image
      }))
    : DEFAULT_SHOP_SLIDES;

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const activeIndex = index >= slides.length ? 0 : index;
  const slide = slides[activeIndex] || DEFAULT_SHOP_SLIDES[0];
  const slideImage = slide.image || slide.src || DEFAULT_SHOP_SLIDES[0].image;

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  if (slide.banner) {
    return (
      <section aria-label="Shop banner" className="relative mb-6 w-full overflow-hidden bg-[#ffda9b]">
        <img src={slideImage} alt="Shopping trolley filled with colourful bags" className="block h-auto w-full" loading="eager" fetchPriority="high" />
        <div className="absolute inset-0 mx-auto grid max-w-[1280px] grid-cols-2 items-center px-4 xl:px-0">
          <div className="space-y-2 py-2 text-left md:space-y-4 md:py-6">
            <h1 className="whitespace-pre-line text-[clamp(1.125rem,5.2vw,1.75rem)] font-black leading-[1.05] tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
            <p className="text-[9px] font-medium text-gray-700 sm:text-xs md:text-base lg:text-lg">{slide.subtitle}</p>
            <a href={slide.ctaLink || "#all-products"} className="inline-flex items-center gap-1 bg-[#FF5500] px-3 py-2 text-[8px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#df4900] sm:text-[10px] md:px-6 md:py-3 md:text-xs">
              {slide.cta}
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-[320px] bg-gradient-to-r from-orange-600 via-[#FF5500] to-amber-600 rounded-none overflow-hidden mb-6 group shadow-md">
      {/* ── 1. Full-Bleed Background Image & Gradients (100% Screen Width) ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25 z-10" />
      {slideImage && (
        <img
          key={slideImage}
          src={slideImage}
          className="absolute inset-0 w-full h-full object-cover opacity-65 transition-opacity duration-700"
          alt=""
          loading="eager"
        />
      )}

      {/* ── 2. Content Container Aligned Exactly with the Logo & Grid (max-w-[1280px]) ── */}
      <div className="max-w-[1280px] mx-auto px-4 xl:px-0 h-full relative z-20 flex flex-col justify-center">
        <div className="space-y-1.5 md:space-y-3 max-w-xl" key={activeIndex}>
          {slide.eyebrow && (
            <p className="text-[9.5px] md:text-[11px] font-black uppercase tracking-[0.4em] text-white/80 animate-fade-in-up">
              {slide.eyebrow}
            </p>
          )}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none uppercase animate-fade-in-up drop-shadow-sm">
            {slide.title}
          </h2>
          <p className="text-white/95 text-sm md:text-lg font-bold tracking-tight animate-fade-in-up">
            {slide.highlight} <span className="text-white/70 font-semibold">— {slide.subtitle}</span>
          </p>
          <div className="pt-2 sm:pt-3">
            <Link to={slide.ctaLink || "/products"}>
              <Button className="h-10 md:h-11 px-8 md:px-9 bg-white text-gray-950 font-black text-xs md:text-sm uppercase tracking-widest rounded-none hover:bg-gray-100 transition-all shadow-xl">
                {slide.cta || "Shop Now"}
              </Button>
            </Link>
          </div>
        </div>

        {/* Pagination Dots (Aligned inside the 1280px container) */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 md:bottom-6 left-4 xl:left-0 flex gap-1.5 md:gap-2 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-none transition-all cursor-pointer ${
                  i === activeIndex ? "bg-white w-6 md:w-8" : "bg-white/40 w-1.5 md:w-2"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 3. Prev / Next Navigation Arrows (Flanking outer edges) ── */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};

export default ShopHeroCarousel;
