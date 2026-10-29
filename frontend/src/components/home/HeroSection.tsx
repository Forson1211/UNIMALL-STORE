import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import campusBanner from "../../../dist/Images/4.png";
import sellerBanner from "../../../dist/Images/1.png";

interface HeroSlide {
  tagline: string;
  headline: string;
  subtext: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  alt: string;
  banner?: boolean;
  textSide?: "left" | "right";
  background?: string;
  lightText?: boolean;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    tagline: "YOUR CAMPUS. YOUR MARKETPLACE.",
    headline: "Find your next\ncampus favourite.",
    subtext: "Shop everyday favourites from student sellers.",
    buttonText: "SHOP NOW",
    buttonLink: "/products",
    image: campusBanner,
    alt: "Happy student in a yellow sweater",
    banner: true,
  },
  {
    tagline: "DISCOVER STUDENT STORES",
    headline: "Your Campus\nShoping Mall!",
    subtext: "Discover great finds from student sellers.",
    buttonText: "MEET THE VENDORS",
    buttonLink: "/vendors",
    image: sellerBanner,
    alt: "Student seller stocking her campus store",
    banner: true,
    textSide: "left",
    background: "#f28a00",
    lightText: true,
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
      {slide.banner ? (
        <div className="relative" style={{ backgroundColor: slide.background || "#ffe7c4" }}>
          <img
            src={slide.image}
            alt={slide.alt}
            className={`block h-[220px] w-full object-cover sm:h-[280px] md:h-auto ${slide.textSide === "left" ? "object-[75%_center] md:object-right" : "object-[40%_center] md:object-left"}`}
            loading="eager"
            fetchPriority="high"
            draggable={false}
          />
          {slide.lightText && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 md:hidden"
              style={{ background: "linear-gradient(90deg, #ea7900 0%, rgba(234,121,0,0.97) 35%, rgba(234,121,0,0.65) 48%, transparent 70%)" }}
            />
          )}
          <div className="absolute inset-0 mx-auto grid max-w-[1280px] grid-cols-[45%_45%] items-center gap-x-[10%] px-3 pb-10 md:grid-cols-2 md:gap-x-0 md:px-6 min-[1440px]:pb-0 xl:px-0">
            <div className={`min-w-0 py-4 text-left xl:py-8 ${slide.textSide === "left" ? "col-start-1 pr-2 md:pr-8 lg:pr-12" : "col-start-2 pl-2 md:pl-8 lg:pl-12"}`}>
              <p className={`mb-1.5 text-[8px] font-black uppercase tracking-[0.08em] sm:text-[10px] md:mb-3 md:tracking-[0.16em] ${slide.lightText ? "text-white md:text-sm" : "text-gray-700 md:text-xs"}`}>
                {slide.tagline}
              </p>
              <h1 className={`mb-2 font-black leading-[1.05] tracking-tight sm:mb-3 sm:text-4xl md:mb-4 md:text-5xl lg:text-6xl ${slide.lightText ? "text-[clamp(1.125rem,5.5vw,1.5rem)] text-white" : "text-[clamp(1.125rem,5.2vw,1.5rem)] text-gray-900"}`}>
                {slide.headline.split("\n").map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </h1>
              <p className={`mb-3 max-w-sm text-[10px] font-medium leading-snug sm:text-sm md:mb-7 ${slide.lightText ? "text-white md:text-lg" : "text-gray-700 md:text-base"}`}>
                {slide.subtext}
              </p>
              <Link to={slide.buttonLink} className={`inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-[8px] font-bold uppercase tracking-wider transition-colors sm:text-[10px] lg:gap-2 lg:px-6 lg:py-3 lg:text-xs ${slide.lightText ? "bg-white text-[#FF5500] hover:bg-orange-50" : "bg-[#FF5500] text-white hover:bg-[#df4900]"}`}>
                {slide.buttonText}
                <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
      <div className="max-w-[1280px] mx-auto px-4 xl:px-0 pt-10 pb-24 md:pt-12 min-[1440px]:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 md:gap-8 md:min-h-[380px]">
          
          {/* Left Column: Text Content matching RIODE styling */}
          <div className="md:col-span-6 lg:col-span-5 min-w-0 flex flex-col items-center md:items-start justify-center text-center md:text-left z-10">
            {/* Tagline */}
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.18em] text-gray-700 dark:text-gray-300 mb-1.5 md:mb-3">
              {slide.tagline}
            </span>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight text-gray-900 dark:text-white leading-[1.05] mb-2 sm:mb-3 whitespace-pre-line">
              {slide.headline}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium mb-3 md:mb-7">
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

      </div>
      )}

        {/* Minimalist Navigation Arrows (Left & Right margins) */}
        <button
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="absolute left-4 bottom-2 min-[1440px]:left-2 min-[1440px]:bottom-auto min-[1440px]:top-1/2 min-[1440px]:-translate-y-1/2 w-8 h-8 min-[1440px]:w-11 min-[1440px]:h-11 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5500] transition-colors z-20 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.5]" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next Slide"
          className="absolute right-4 bottom-2 min-[1440px]:right-2 min-[1440px]:bottom-auto min-[1440px]:top-1/2 min-[1440px]:-translate-y-1/2 w-8 h-8 min-[1440px]:w-11 min-[1440px]:h-11 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5500] transition-colors z-20 cursor-pointer"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.5]" />
        </button>

        {/* Slide Indicator Dots */}
        <div className="absolute bottom-5 min-[1440px]:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
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
    </section>
  );
};

export default HeroSection;
