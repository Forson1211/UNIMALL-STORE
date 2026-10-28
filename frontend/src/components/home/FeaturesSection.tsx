import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Crown, Sparkles, CheckCircle2, QrCode,
  Truck, MapPin, Headphones, ArrowUpRight, MessageCircle,
  Coins, HeartHandshake, Zap
} from "lucide-react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

const FeaturesSection = () => {
  const { siteName } = useSiteSettingsContext();

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
    <section className="py-12 md:py-20 bg-[#F7F8FA] dark:bg-background border-t border-gray-100 dark:border-border">
      <div className="max-w-[1280px] mx-auto px-4 xl:px-0 space-y-16 sm:space-y-20">

        {/* ═══════════════════ PART 1: BENTO TRUST GRID ═══════════════════ */}
        <div className="space-y-3.5 sm:space-y-4">
          
          {/* Top Row: 3 Blocks (100% Protection + Big Center Radiant Banner + Reward Points) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4">
            
            {/* Block 1: 100% Buyer Warranty / Buyer Protection (md:col-span-3) */}
            <div className="md:col-span-3 bg-white dark:bg-card p-5 sm:p-6 rounded-none shadow-2xs border border-gray-100 dark:border-border/60 flex flex-col justify-between min-h-[170px] sm:min-h-[210px] group hover:border-gray-300 transition-all">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                100% BUYER WARRANTY,
                <br />
                VERIFIED STUDENT REFUND
              </span>
              <div className="text-center my-auto py-2">
                <span className="block text-4xl sm:text-6xl font-black text-[#FF5500] leading-none tracking-tight">
                  100%
                </span>
                <span className="block font-black text-xs sm:text-sm text-gray-900 dark:text-white uppercase tracking-widest mt-1">
                  PROTECTED
                </span>
              </div>
            </div>

            {/* Block 2: Wide Radiant Hero Banner — Ghana's No. 1 Student Marketplace (md:col-span-6) */}
            <div className="md:col-span-6 relative overflow-hidden bg-gradient-to-br from-[#FF5500] via-[#FF6600] to-[#e54a00] text-white p-6 sm:p-8 rounded-none shadow-2xs flex flex-col items-center justify-center text-center min-h-[190px] sm:min-h-[210px] group">
              {/* Concentric ripple rings graphic */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                <div className="w-48 h-48 rounded-full border-2 border-white/60" />
                <div className="absolute w-72 h-72 rounded-full border-2 border-white/40" />
                <div className="absolute w-96 h-96 rounded-full border-2 border-white/20" />
              </div>

              <div className="relative z-10 space-y-1.5">
                <span className="text-xs sm:text-sm font-bold tracking-widest uppercase opacity-90 block">
                  {siteName || "unimall"}
                </span>
                
                <div className="flex items-center justify-center gap-1 text-[11px] sm:text-xs font-black uppercase tracking-widest text-white/95">
                  <Crown className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                  <span>GHANA'S</span>
                </div>

                <div className="flex items-center justify-center">
                  <h3 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-white drop-shadow-sm">
                    NO.1
                  </h3>
                </div>

                <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-white/90 pt-1">
                  CAMPUS MARKETPLACE & STUDENT STORE
                </p>
              </div>
            </div>

            {/* Block 3: Student Points & Rewards (md:col-span-3) */}
            <div className="md:col-span-3 bg-white dark:bg-card p-5 sm:p-6 rounded-none shadow-2xs border border-gray-100 dark:border-border/60 flex flex-col justify-between min-h-[170px] sm:min-h-[210px] group hover:border-gray-300 transition-all">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                BUY TO GET UNIMALL REWARD
                <br />
                POINTS, EXTRA DISCOUNTS FOR MEMBERS
              </span>
              <div className="flex items-center justify-center gap-2 my-auto py-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-2 border-yellow-100 shadow-md flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-transform duration-500">
                  <span className="font-black text-amber-900 text-xs sm:text-sm tracking-tight">₵ COIN</span>
                </div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-100 border border-yellow-100 shadow-xs flex items-center justify-center rotate-12 -ml-3 group-hover:rotate-0 transition-transform duration-500">
                  <span className="font-black text-amber-800 text-[10px] sm:text-xs">PTS</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Grid: Support Photo Card + 4 Sub Service Badges */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4">
            
            {/* Tall Card: Accessible Customer Service (md:col-span-4) */}
            <div className="md:col-span-4 bg-white dark:bg-card rounded-none shadow-2xs border border-gray-100 dark:border-border/60 overflow-hidden flex flex-col justify-between min-h-[280px] sm:min-h-[340px] group">
              <div className="p-5 sm:p-6 pb-0">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  ACCESSIBLE CAMPUS SUPPORT
                </span>
              </div>
              <div className="relative w-full h-[220px] sm:h-[270px] mt-2 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=85"
                  alt="Unimall Support"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </div>

            {/* 2x2 Sub-Grid of Trust Tiles (md:col-span-8) */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              
              {/* Tile A: Authenticity & Best Price */}
              <div className="bg-white dark:bg-card p-5 sm:p-6 rounded-none shadow-2xs border border-gray-100 dark:border-border/60 flex flex-col justify-between min-h-[135px] sm:min-h-[160px] group hover:border-gray-300 transition-all">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  UNIMALL AUTHENTICITY & BEST PRICE GUARANTEED
                </span>
                <div className="flex items-center gap-2.5 my-auto pt-2">
                  <div className="w-8 h-8 rounded-md bg-orange-50 dark:bg-orange-950/40 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-[#FF5500]" />
                  </div>
                  <div>
                    <span className="block font-black text-xs sm:text-sm text-[#FF5500] uppercase tracking-wide leading-tight">
                      AUTHENTICITY
                    </span>
                    <span className="block font-black text-[10px] sm:text-xs text-[#FF5500] uppercase tracking-wide leading-tight">
                      & BEST PRICE
                    </span>
                  </div>
                </div>
              </div>

              {/* Tile B: Community Events & WhatsApp QR Code */}
              <div className="bg-white dark:bg-card p-5 sm:p-6 rounded-none shadow-2xs border border-gray-100 dark:border-border/60 flex flex-col justify-between min-h-[135px] sm:min-h-[160px] group hover:border-gray-300 transition-all">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  CAMPUS COMMUNITY, JOIN UNIMALL GHANA
                </span>
                <div className="flex items-center justify-between gap-3 my-auto pt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed border-[#FF5500] text-[#FF5500] font-extrabold text-xs">
                    <MessageCircle className="w-4 h-4 fill-[#FF5500] text-white" />
                    <span>U-CLUB GH</span>
                  </div>
                  <div className="w-11 h-11 border border-gray-200 dark:border-border p-1 bg-white flex items-center justify-center shadow-2xs">
                    <QrCode className="w-full h-full text-gray-800" />
                  </div>
                </div>
              </div>

              {/* Tile C: Free Campus Delivery */}
              <div className="bg-white dark:bg-card p-5 sm:p-6 rounded-none shadow-2xs border border-gray-100 dark:border-border/60 flex flex-col justify-between min-h-[135px] sm:min-h-[160px] group hover:border-gray-300 transition-all">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  FREE SHIPPING OVER ₵ 100 DOOR TO DOOR CAMPUS DELIVERY
                </span>
                <div className="flex items-center justify-center gap-2 my-auto pt-2">
                  <div className="h-0.5 w-6 bg-[#FF5500]/40" />
                  <span className="font-black text-2xl sm:text-3xl text-[#FF5500] tracking-wider not-italic">
                    FREE
                  </span>
                  <div className="h-0.5 w-6 bg-[#FF5500]/40" />
                </div>
              </div>

              {/* Tile D: Nationwide University Pickup Hubs */}
              <div className="bg-white dark:bg-card p-5 sm:p-6 rounded-none shadow-2xs border border-gray-100 dark:border-border/60 flex flex-col justify-between min-h-[135px] sm:min-h-[160px] group hover:border-gray-300 transition-all">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  ALL MAJOR UNIVERSITY HUBS & PICKUP OUTLETS
                </span>
                <div className="flex items-center gap-2 my-auto pt-2">
                  <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-[#FF5500] font-black text-xs shrink-0">
                    <MapPin className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="leading-tight">
                    <span className="block font-black text-xs sm:text-sm text-[#FF5500] tracking-wide">
                      CAMPUS CARE
                    </span>
                    <span className="block font-bold text-[10px] text-[#FF5500]/90 tracking-widest uppercase">
                      LEGON • KNUST • UCC • UPSA
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

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
