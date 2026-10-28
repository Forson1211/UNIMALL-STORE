import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface HeroSlide {
  tagline: string;
  headline: string;
  subtext: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  alt: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    tagline: "FROM ONLINE STORE",
    headline: "Originals Comper\nStar. Xbox",
    subtext: "Free Shipping on all orders over GH₵150.00",
    buttonText: "SHOP NOW",
    buttonLink: "/products?category=Gaming",
    image: "/assets/hero-gaming-cutout.png",
    alt: "Originals Gaming Gear",
  },
  {
    tagline: "CAMPUS TECH DEALS",
    headline: "Pro Laptops &\nWireless Audio",
    subtext: "Student verified discounts up to 40% OFF",
    buttonText: "EXPLORE NOW",
    buttonLink: "/products?category=Computing",
    image: "/assets/hero-tech-cutout.png",
    alt: "Campus Laptops and Audio",
  },
];

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? DEFAULT_SLIDES.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === DEFAULT_SLIDES.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = DEFAULT_SLIDES[currentSlide];

  return (
    <section
      aria-label="Featured products"
      aria-roledescription="carousel"
      className="relative bg-[#e9edf2] dark:bg-[#141b24] overflow-hidden transition-colors duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current !== null) {
          const deltaX = e.changedTouches[0].clientX - touchStartX.current;
          if (deltaX > 40) prevSlide();
          else if (deltaX < -40) nextSlide();
          touchStartX.current = null;
        }
      }}
    >
      <div className="max-w-[1280px] mx-auto px-4 xl:px-0 pt-10 pb-24 md:pt-12 min-[1440px]:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 md:gap-8 md:min-h-[380px]">
          
          {/* Left Column: Text Content matching RIODE styling */}
          <div className="md:col-span-6 lg:col-span-5 min-w-0 flex flex-col items-center md:items-start justify-center text-center md:text-left z-10">
            {/* Tagline */}
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.18em] text-gray-700 dark:text-gray-300 mb-2">
              {slide.tagline}
            </span>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight text-gray-900 dark:text-white leading-[1.08] mb-3 whitespace-pre-line">
              {slide.headline}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium mb-6">
              {slide.subtext}
            </p>

            {/* CTA Button */}
            <Link
              to={slide.buttonLink}
              className="group inline-flex items-center gap-2 border-2 border-gray-900 dark:border-white bg-transparent text-gray-900 dark:text-white hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 text-xs sm:text-sm font-bold uppercase tracking-wider px-7 py-3 transition-all duration-200 shadow-xs"
            >
              <span>{slide.buttonText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Right Column: Hero Product Cutout Image */}
          <div className="md:col-span-6 lg:col-span-7 min-w-0 flex items-center justify-center md:justify-end relative">
            <div className="relative w-full max-w-[520px] h-[200px] sm:h-[260px] md:h-[320px] flex items-center justify-center">
              <img
                src={slide.image}
                alt={slide.alt}
                key={slide.image}
                className="w-full h-full max-w-[480px] max-h-[300px] lg:max-h-[320px] object-contain bg-transparent drop-shadow-[0_16px_14px_rgba(15,23,42,0.12)] animate-in fade-in zoom-in-95 duration-500 select-none"
                loading="eager"
                decoding="async"
                draggable={false}
              />
            </div>
          </div>

        </div>

        {/* Minimalist Navigation Arrows (Left & Right margins) */}
        <button
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="absolute left-4 bottom-5 min-[1440px]:left-2 min-[1440px]:bottom-auto min-[1440px]:top-1/2 min-[1440px]:-translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5500] transition-colors z-20 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.5]" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next Slide"
          className="absolute right-4 bottom-5 min-[1440px]:right-2 min-[1440px]:bottom-auto min-[1440px]:top-1/2 min-[1440px]:-translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5500] transition-colors z-20 cursor-pointer"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.5]" />
        </button>

        {/* Slide Indicator Dots */}
        <div className="absolute bottom-9 min-[1440px]:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {DEFAULT_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={currentSlide === i ? "true" : undefined}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === i
                  ? "w-6 bg-[#FF5500]"
                  : "w-2 bg-gray-400/50 hover:bg-gray-500"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
