import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import phoneBanner from "../../../dist/Images/2.png";

const FeaturesSection = () => {

  const instagramPosts = [
    {
      title: "Comprehensive Safety for Campus Devices",
      subtitle: "Dual Fuse & Multiple Protection",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
      tag: "Tech & Audio",
    },
    {
      title: "Hide More, Store Better",
      subtitle: "Extra Large Dorm Storage Space",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80",
      tag: "Dorm & Living",
    },
    {
      title: "Crystal Clear Visuals That Last",
      subtitle: "1.93\" AMOLED Panda Glass",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
      tag: "Wearables",
    },
    {
      title: "Power That Lasts",
      subtitle: "30-Day Standby Battery",
      image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80",
      tag: "Smart Fitness",
    },
  ];

  return (
    <section className="pb-12 md:pb-20 bg-[#F7F8FA] dark:bg-background border-t border-gray-100 dark:border-border">

        <section aria-label="Campus phone deals" className="relative overflow-hidden bg-[#ff8500]">
          <img
            src={phoneBanner}
            alt="Two smartphones on a bright orange and yellow background"
            className="block h-auto w-full"
            loading="lazy"
          />
          <div className="absolute inset-0 z-10 mx-auto grid max-w-[1280px] grid-cols-[56%_44%] items-center px-3 md:grid-cols-2 md:px-4 xl:px-0">
            <div className="col-start-2 w-full max-w-[420px] justify-self-end py-2 pl-2 sm:py-4 md:py-8 md:pl-0">
              <p className="mb-1.5 text-[8px] font-black uppercase tracking-[0.08em] text-white sm:text-[10px] md:mb-3 md:text-sm md:tracking-[0.16em]">
                YOUR NEXT UPGRADE
              </p>
              <h2 className="mb-2 text-[clamp(1.125rem,5.5vw,1.5rem)] font-black leading-[1.05] tracking-tight text-white sm:mb-3 sm:text-4xl md:mb-4 md:text-5xl lg:text-6xl">
                New phone.<br />Who dis?
              </h2>
              <p className="mb-3 max-w-sm text-[10px] font-medium leading-snug text-white sm:text-sm md:mb-7 md:text-base lg:text-lg">
                Fresh tech for campus life. Find your next favourite.
              </p>
              <Link
                to="/products?category=Phones%20%26%20Tablets"
                className="inline-flex items-center gap-1 bg-white px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#FF5500] transition-colors hover:bg-orange-50 sm:px-3 sm:py-2 sm:text-[10px] md:gap-2 md:px-6 md:py-3 md:text-xs"
              >
                Shop Now! <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
              </Link>
            </div>
          </div>
        </section>

      <div className="max-w-[1280px] mx-auto mt-16 px-4 sm:mt-20 xl:px-0">
        {/* ═══════════════════ PART 2: SOCIAL COMMUNITY & LIFESTYLE SHOWCASE ═══════════════════ */}
        <div className="space-y-6 pt-4 border-t border-gray-200/60 dark:border-border">
          
          {/* Header & Description */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl sm:text-3xl text-gray-900 dark:text-white font-black tracking-tight not-italic">
                @unimallghana
              </h3>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#FF5500] hover:bg-[#e54a00] text-white text-xs font-bold transition-all shadow-xs"
              >
                Follow NOW
              </a>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
              Hey there, campus shopper! We're thrilled to invite you to join us on Instagram for an exclusive inside look into the Unimall universe!
            </p>

            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5 pt-1">
              <p className="font-bold text-gray-900 dark:text-white">Why Follow us:</p>
              <p>• Be part of a vibrant campus community</p>
              <p>• Stay updated on new releases and exciting student deals</p>
              <p>• Exclusive insights and special giveaways just for our campus fam!</p>
            </div>
          </div>

          {/* 4 Square Instagram-Style Lifestyle Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {instagramPosts.map((post, idx) => (
              <div
                key={idx}
                className="group relative aspect-square rounded-none overflow-hidden bg-gray-900 shadow-xs cursor-pointer"
              >
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                
                {/* Subtle vignette gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                {/* Top Badge */}
                <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10">
                  <span className="px-2 py-0.5 rounded-none bg-black/60 backdrop-blur-xs text-white text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-wider">
                    {post.tag}
                  </span>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 z-10 text-white space-y-0.5">
                  <p className="text-[10px] text-white/80 font-medium tracking-tight">
                    {post.subtitle}
                  </p>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight line-clamp-2">
                    {post.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;
