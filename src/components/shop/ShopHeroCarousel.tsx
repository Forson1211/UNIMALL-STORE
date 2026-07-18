import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    eyebrow: "Unimall Marketplace Event",
    title: "Hot Campus Deals",
    highlight: "Up to 40% off",
    subtitle: "Tech, fashion and essentials from verified student vendors.",
    image: "https://images.unsplash.com/photo-1526170315870-ef6876b84782?q=80&w=1200&auto=format&fit=crop",
    cta: "Shop Now",
  },
  {
    eyebrow: "New This Week",
    title: "Fresh Vendor Drops",
    highlight: "Just arrived",
    subtitle: "Be first to grab the newest listings before they sell out.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop",
    cta: "See What's New",
  },
  {
    eyebrow: "Student Exclusive",
    title: "Sell On Unimall",
    highlight: "Start earning today",
    subtitle: "Open your own storefront and reach thousands of students.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop",
    cta: "Become a Vendor",
  },
];

const ShopHeroCarousel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[index];
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <div className="relative w-full h-56 md:h-80 bg-[#FF5500] rounded-none overflow-hidden mb-6 group shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent z-10" />
      <img
        key={slide.image}
        src={slide.image}
        className="absolute inset-0 w-full h-full object-cover opacity-60 animate-fade-in"
        alt={slide.title}
      />

      <div className="relative z-20 h-full flex flex-col justify-center px-6 md:px-16">
        <div className="space-y-1 md:space-y-3 max-w-xl" key={index}>
          <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-white/70 animate-fade-in-up">
            {slide.eyebrow}
          </p>
          <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter leading-none uppercase animate-fade-in-up">
            {slide.title}
          </h2>
          <p className="text-white/90 text-sm md:text-xl font-bold tracking-tight animate-fade-in-up">
            {slide.highlight} <span className="text-white/60 font-semibold">— {slide.subtitle}</span>
          </p>
          <div className="pt-3">
            <Link to="/products">
              <Button className="h-10 md:h-12 px-8 md:px-10 bg-white text-black font-black text-xs md:text-sm uppercase tracking-widest rounded-none hover:bg-gray-100 transition-all shadow-xl">
                {slide.cta}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
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
            className={`h-1.5 rounded-none transition-all ${i === index ? "bg-white w-6 md:w-8" : "bg-white/40 w-1.5 md:w-2"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ShopHeroCarousel;
