import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

export interface ShopHeroSlide {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  image: string;
  cta: string;
  ctaLink?: string;
}

const DEFAULT_SHOP_SLIDES: ShopHeroSlide[] = [
  {
    eyebrow: "Unimall Marketplace Event",
    title: "Hot Campus Deals",
    highlight: "Up to 40% off",
    subtitle: "Tech, fashion and essentials from verified student vendors.",
    image: "https://images.unsplash.com/photo-1526170315870-ef6876b84782?q=80&w=1200&auto=format&fit=crop",
    cta: "Shop Now",
    ctaLink: "/products",
  },
  {
    eyebrow: "New This Week",
    title: "Fresh Vendor Drops",
    highlight: "Just arrived",
    subtitle: "Be first to grab the newest listings before they sell out.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop",
    cta: "See What's New",
    ctaLink: "/products",
  },
  {
    eyebrow: "Student Exclusive",
    title: "Sell On Unimall",
    highlight: "Start earning today",
    subtitle: "Open your own storefront and reach thousands of students.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop",
    cta: "Become a Vendor",
    ctaLink: "/signup?role=vendor",
  },
];

const ShopHeroCarousel = () => {
  const { getSetting } = useSiteSettingsContext();
  const configuredSlides = getSetting("shop_slider_images", DEFAULT_SHOP_SLIDES);
  const slides: ShopHeroSlide[] = Array.isArray(configuredSlides) && configuredSlides.length > 0
    ? configuredSlides
    : DEFAULT_SHOP_SLIDES;

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const activeIndex = index >= slides.length ? 0 : index;
  const slide = slides[activeIndex] || DEFAULT_SHOP_SLIDES[0];

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <div className="relative w-full h-56 md:h-80 bg-gradient-to-r from-orange-600 via-[#FF5500] to-amber-600 rounded-none overflow-hidden mb-6 group shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20 z-10" />
      {slide.image && (
        <img
          key={slide.image}
          src={slide.image}
          className="absolute inset-0 w-full h-full object-cover opacity-65 transition-opacity duration-700"
          alt=""
          loading="eager"
        />
      )}

      <div className="relative z-20 h-full flex flex-col justify-center px-6 md:px-16">
        <div className="space-y-1 md:space-y-3 max-w-xl" key={activeIndex}>
          {slide.eyebrow && (
            <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-white/80 animate-fade-in-up">
              {slide.eyebrow}
            </p>
          )}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none uppercase animate-fade-in-up">
            {slide.title}
          </h2>
          <p className="text-white/95 text-sm md:text-xl font-bold tracking-tight animate-fade-in-up">
            {slide.highlight} <span className="text-white/70 font-semibold">— {slide.subtitle}</span>
          </p>
          <div className="pt-3">
            <Link to={slide.ctaLink || "/products"}>
              <Button className="h-10 md:h-12 px-8 md:px-10 bg-white text-black font-black text-xs md:text-sm uppercase tracking-widest rounded-none hover:bg-gray-100 transition-all shadow-xl">
                {slide.cta || "Shop Now"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white/15 hover:bg-white/30 text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white/15 hover:bg-white/30 text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Pagination dots */}
          <div className="absolute bottom-4 md:bottom-6 left-6 md:left-16 flex gap-1.5 md:gap-2 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-none transition-all ${i === activeIndex ? "bg-white w-6 md:w-8" : "bg-white/40 w-1.5 md:w-2"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ShopHeroCarousel;
