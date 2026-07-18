import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft, Menu, Phone, Store, Truck } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

const categories = PRODUCT_CATEGORIES.map((cat) => ({ name: cat.label, icon: cat.icon }));

const slides = [
  {
    title: ["Shopping", "Spree"],
    subtitle: "Fresh Deals, Hot Prices",
    discount: "-45%",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: ["Campus", "Essentials"],
    subtitle: "Everything for the semester",
    discount: "-30%",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: ["Fashion", "Week"],
    subtitle: "Look sharp for less",
    discount: "-60%",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: ["Tech", "Deals"],
    subtitle: "Upgrade your gear",
    discount: "-40%",
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2070&auto=format&fit=crop",
  },
];

const SWIPE_THRESHOLD = 40;

const HeroSection = () => {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const goTo = (i: number) => setIndex((i + slides.length) % slides.length);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => {
    if (isDragging) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    touchStartX.current = e.clientX;
    dragDeltaX.current = 0;
    setIsDragging(true);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (touchStartX.current == null) return;
    dragDeltaX.current = e.clientX - touchStartX.current;
    setDragOffset(dragDeltaX.current);
  };
  const endDrag = () => {
    if (touchStartX.current != null) {
      if (dragDeltaX.current > SWIPE_THRESHOLD) prev();
      else if (dragDeltaX.current < -SWIPE_THRESHOLD) next();
    }
    touchStartX.current = null;
    dragDeltaX.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  };

  return (
    <section className="bg-[#f1f1f2] pt-3 pb-2">
      <div className="max-w-[1280px] mx-auto px-3">
        <div className="flex gap-2 h-[380px]">

          {/* ── LEFT: Category Sidebar ── */}
          <div className="hidden lg:block w-[230px] shrink-0 h-full">
            <div className="flex flex-col w-full h-full bg-white shadow-sm overflow-hidden py-0.5 justify-between">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="flex items-center gap-3 px-4 py-[5.5px] transition-colors group text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  <cat.icon className="w-[18px] h-[18px] shrink-0 transition-colors text-gray-500 group-hover:text-gray-900" strokeWidth={1.5} />
                  <span className="text-[12px] leading-tight flex-1 font-medium">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── CENTER: Hero Banner ── */}
          <div
            className="flex-1 relative overflow-hidden shadow-sm group min-h-[200px] select-none touch-pan-y cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onPointerCancel={endDrag}
          >
            {/* Sliding strip: all slides sit side by side, the strip translates smoothly between them */}
            <div
              className="absolute inset-0 flex h-full"
              style={{
                width: `${slides.length * 100}%`,
                transform: `translateX(calc(${-index * (100 / slides.length)}% + ${dragOffset}px))`,
                transition: isDragging ? "none" : "transform 550ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {slides.map((s, i) => (
                <div key={s.image} className="relative h-full shrink-0" style={{ width: `${100 / slides.length}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF5500]/90 via-[#FF5500]/60 to-transparent z-10" />
                  <img
                    src={s.image}
                    alt={`${s.title.join(" ")} Promotion`}
                    draggable={false}
                    className={`absolute inset-0 w-full h-full object-cover ${i === index ? "animate-kenburns" : ""}`}
                  />
                  <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-12 py-8 space-y-3 pointer-events-none">
                    <div>
                      <h2 className="text-white text-4xl md:text-5xl font-black tracking-tight leading-tight uppercase drop-shadow-sm">
                        {s.title[0]}<br />{s.title[1]}
                      </h2>
                      <p className="text-white/95 text-base md:text-lg font-semibold mt-2">
                        {s.subtitle}
                      </p>
                    </div>
                    <div className="bg-[#FF5500] border-2 border-white/30 inline-flex items-center px-3 py-1.5 w-fit">
                      <span className="text-white font-black text-xl md:text-2xl tracking-tight">
                        UP TO <span className="text-yellow-300">{s.discount}</span>
                      </span>
                    </div>
                    <p className="text-white/80 text-xs font-medium">Limited time offer. T&Cs apply</p>
                    <Link
                      to="/products"
                      className="mt-1 inline-flex items-center justify-center bg-white text-gray-900 font-black text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-gray-100 transition-colors shadow-lg w-fit pointer-events-auto"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Prev / Next arrows */}
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center bg-white/15 hover:bg-white/30 text-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center bg-white/15 hover:bg-white/30 text-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "bg-white w-4" : "bg-white/40 w-1.5"}`}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT: Quick Links + Mini Banner ── */}
          <div className="hidden xl:flex flex-col w-[200px] shrink-0 gap-2">
            {/* Quick Links Card */}
            <div className="bg-white shadow-sm p-3 flex flex-col divide-y divide-gray-100">
              <div className="flex items-center gap-3 py-3 first:pt-0 group cursor-pointer hover:text-[#FF5500] transition-colors">
                <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase leading-none mb-0.5">Call / WhatsApp</p>
                  <p className="text-xs font-black text-gray-900">0302740642</p>
                </div>
              </div>
              <Link to="/vendor" className="flex items-center gap-3 py-3 group hover:text-[#FF5500] transition-colors">
                <div className="w-9 h-9 bg-orange-50 rounded-full flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-[#FF5500]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase leading-none mb-0.5">Sell on Unimall</p>
                  <p className="text-xs font-black text-gray-900">Make more money</p>
                </div>
              </Link>
              <Link to="/account/orders" className="flex items-center gap-3 py-3 group hover:text-[#FF5500] transition-colors">
                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase leading-none mb-0.5">Track your order</p>
                  <p className="text-xs font-black text-gray-900">Stay up to date</p>
                </div>
              </Link>
            </div>

            {/* Mini Promo Banner */}
            <div className="flex-1 bg-[#FF5500] shadow-sm overflow-hidden relative group">
              <img
                src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800&auto=format&fit=crop"
                alt="Home Makeover"
                className="absolute inset-0 w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-3">
                <h3 className="text-white text-lg font-black leading-tight uppercase tracking-tight">
                  Shopping<br />Spree
                </h3>
                <div className="mt-2 bg-white/20 border border-white/30 px-2 py-1">
                  <span className="text-white font-black text-sm">UP TO</span>
                  <span className="text-yellow-300 font-black text-xl ml-1">-40%</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Mobile Horizontal Category Chips ── */}
        <div className="lg:hidden flex overflow-x-auto gap-2 py-2 no-scrollbar mt-2">
          {categories.map((cat, i) => (
            <Link
              key={i}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="shrink-0 flex flex-col items-center justify-center w-[72px] h-[72px] bg-white shadow-sm gap-1.5 border border-gray-100 hover:border-[#FF5500]/30 transition-colors"
            >
              <cat.icon className="w-5 h-5 text-[#FF5500]" />
              <span className="text-[10px] font-bold text-center leading-tight px-1 text-gray-700">{cat.name.split(" ")[0]}</span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
