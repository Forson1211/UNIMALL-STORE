import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { chatbotAIService } from "@/services/chatbotAI";
import { StorefrontProduct } from "@/services/productService";
import {
  X,
  ChevronRight,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  Star,
  Zap,
  ArrowRight
} from "lucide-react";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
  options?: ChatOption[];
  products?: StorefrontProduct[];
  links?: { label: string; url: string; external?: boolean }[];
  quickReplies?: string[];
}

interface ChatOption {
  id: string;
  label: string;
  category: "after_sales" | "shopping" | "payment" | "logistics" | "selling";
}

const GENERAL_CATEGORIES: ChatOption[] = [
  { id: "after_sales", label: "After-sales Issues", category: "after_sales" },
  { id: "shopping", label: "Shopping Problems", category: "shopping" },
  { id: "payment", label: "Payment Issues", category: "payment" },
  { id: "logistics", label: "Logistic Issues", category: "logistics" },
  { id: "selling", label: "Selling & Vendor Hub", category: "selling" },
];

const CATEGORY_RESPONSES: Record<string, {
  text: string;
  subOptions?: { label: string; response: string; links?: { label: string; url: string; external?: boolean }[] }[];
  links?: { label: string; url: string; external?: boolean }[];
}> = {
  after_sales: {
    text: "Here are common solutions for after-sales support:",
    subOptions: [
      {
        label: "How do returns and refunds work?",
        response: "You can request a return within 48 hours of receiving your item if it is defective or doesn't match the description. Contact the campus vendor directly or reach out to our admin support team on WhatsApp.",
        links: [
          { label: "View Terms & Refund Policy", url: "/terms" },
          { label: "Contact Support", url: "/contact" }
        ]
      },
      {
        label: "Item not received / Missing order",
        response: "If your order has not arrived within the estimated delivery window, check your order status in your profile or message the vendor directly.",
        links: [
          { label: "Check Orders Status", url: "/orders" }
        ]
      },
      {
        label: "Cancel an order",
        response: "Orders can be cancelled before the vendor marks them as 'Dispatched'. Go to your Orders page and select 'Cancel Order' on pending items.",
        links: [
          { label: "Manage Orders", url: "/orders" }
        ]
      }
    ]
  },
  shopping: {
    text: "What shopping help do you need today?",
    subOptions: [
      {
        label: "How do I find products on my campus?",
        response: "You can filter products by university campus (UG Legon, KNUST, UCC, UPSA, etc.) or browse categories like Electronics, Dorm Essentials, and Fashion.",
        links: [
          { label: "Explore Campus Deals", url: "/products" }
        ]
      },
      {
        label: "How to use coupon codes & discounts?",
        response: "Apply your discount or coupon code at checkout before making payment. Check our homepage for active Daily Flash Deals up to 50% off!",
        links: [
          { label: "Browse Flash Deals", url: "/products?deals=true" }
        ]
      },
      {
        label: "Are student vendors verified?",
        response: "Yes! Look for the blue 'Verified Vendor' badge on product cards and vendor profiles to ensure you are buying from authenticated campus sellers.",
        links: [
          { label: "View Top Campus Vendors", url: "/vendors" }
        ]
      }
    ]
  },
  payment: {
    text: "Here is all you need to know about payments on Unimall:",
    subOptions: [
      {
        label: "What payment methods are supported?",
        response: "We accept MTN Mobile Money (MoMo), Telecel Cash, AT Money, and major debit/credit cards via our secure Paystack gateway.",
        links: [
          { label: "Payment & Security Info", url: "/privacy" }
        ]
      },
      {
        label: "My MoMo prompt didn't show up",
        response: "If you didn't receive the mobile money authorization prompt on your phone within 60 seconds, check *170# (MTN Approvals) or *110# (Telecel Approvals) under 'My Approvals' to authorize the pending transaction.",
      },
      {
        label: "Is my payment protected?",
        response: "Yes! Funds are held in escrow until the vendor confirms dispatch, keeping campus buyers completely protected.",
      }
    ]
  },
  logistics: {
    text: "Find answers regarding campus delivery and pickup:",
    subOptions: [
      {
        label: "How fast is campus delivery?",
        response: "Items tagged with the green 'Same-Day Dropoff' badge are delivered to your hall or hostel within 2 to 6 hours on campus!",
        links: [
          { label: "Shop Same-Day Items", url: "/products" }
        ]
      },
      {
        label: "Where are pickup locations?",
        response: "Campus vendors can deliver directly to your Hall of Residence, Department, or a designated campus landmark (e.g. Night Market, Central Cafeteria, Commercial Area).",
      },
      {
        label: "How much is delivery?",
        response: "Standard on-campus delivery is typically GH₵ 5 - GH₵ 15, and many student vendors offer FREE delivery on orders over GH₵ 100.",
      }
    ]
  },
  selling: {
    text: "Learn how to start selling and making money on campus:",
    subOptions: [
      {
        label: "How do I become a vendor?",
        response: "Anyone with a valid student ID or campus business can register as a vendor. Complete your store profile, upload products, and start receiving orders immediately!",
        links: [
          { label: "Open Your Campus Store", url: "/signup" }
        ]
      },
      {
        label: "How do vendor payouts work?",
        response: "Earnings are credited to your vendor balance upon order delivery. You can request instant Mobile Money withdrawal anytime from your Vendor Dashboard.",
      },
      {
        label: "What are the seller fees?",
        response: "Listing products on Unimall is completely free with low transaction processing fees.",
      }
    ]
  }
};

// ── EXACT CUSTOM BOT HEADSET ICON (ORANGE BACKGROUND + SLEEK WHITE ICON) ──
const BotHeadsetIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Vibrant Orange solid background circle */}
    <circle cx="50" cy="50" r="50" fill="#FF5500" />

    {/* Crisp White headset arch (refined stroke) */}
    <path
      d="M27 47C27 34.297 37.297 24 50 24C62.703 24 73 34.297 73 47"
      stroke="#FFFFFF"
      strokeWidth="5.5"
      strokeLinecap="round"
    />

    {/* Left Earpiece */}
    <rect x="21" y="43" width="8" height="19" rx="4" fill="#FFFFFF" />

    {/* Right Earpiece */}
    <rect x="71" y="43" width="8" height="19" rx="4" fill="#FFFFFF" />

    {/* Left Vertical Eye */}
    <rect x="43" y="44" width="4.5" height="11" rx="2.25" fill="#FFFFFF" />

    {/* Right Vertical Eye */}
    <rect x="52.5" y="44" width="4.5" height="11" rx="2.25" fill="#FFFFFF" />

    {/* Microphone Boom curving from right ear to mouth */}
    <path
      d="M74 54C74 64.5 65.5 70.5 55 70.5H49"
      stroke="#FFFFFF"
      strokeWidth="4.5"
      strokeLinecap="round"
    />

    {/* Microphone Tip */}
    <rect x="44" y="66" width="9.5" height="9" rx="4.5" fill="#FFFFFF" />
  </svg>
);

export const CampusChatbot = () => {
  const { getSetting } = useSiteSettingsContext();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const whatsappNumber = (getSetting("whatsapp_number", "+233241234567") as string).replace(/[^0-9]/g, "");
  const supportPhone = getSetting("support_phone", "+233 24 123 4567") as string;
  const siteName = "Unimall";

  // Initialize bot greeting on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      resetChat();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const resetChat = () => {
    setMessages([
      {
        id: "msg-welcome",
        sender: "bot",
        text: "Hello! I'm the Unimall Sales Assistant. If you need help choosing a product or have any questions about all products, just let me know.",
        timestamp: new Date(),
        options: GENERAL_CATEGORIES,
      },
    ]);
  };

  const handleSelectOption = (option: ChatOption) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: option.label,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    const categoryData = CATEGORY_RESPONSES[option.category];

    setTimeout(() => {
      setIsThinking(false);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: categoryData?.text || "Here is the information for you:",
        timestamp: new Date(),
        links: categoryData?.links,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (categoryData?.subOptions) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `sub-${Date.now()}`,
              sender: "bot",
              text: "Select a specific topic or type your question below:",
              timestamp: new Date(),
              options: categoryData.subOptions?.map((sub, idx) => ({
                id: `sub_${option.category}_${idx}`,
                label: sub.label,
                category: option.category,
              })),
            },
          ]);
        }, 500);
      }
    }, 1400);
  };

  const handleSelectSubOption = (optionId: string, label: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: label,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    let answerText = "Thank you for asking. Our campus team is available to assist you.";
    let answerLinks: { label: string; url: string; external?: boolean }[] | undefined = undefined;

    Object.values(CATEGORY_RESPONSES).forEach((cat) => {
      cat.subOptions?.forEach((sub) => {
        if (sub.label === label) {
          answerText = sub.response;
          answerLinks = sub.links;
        }
      });
    });

    setTimeout(() => {
      setIsThinking(false);
      const botAnswer: Message = {
        id: `bot-ans-${Date.now()}`,
        sender: "bot",
        text: answerText,
        timestamp: new Date(),
        links: answerLinks,
      };

      setMessages((prev) => [...prev, botAnswer]);
    }, 1300);
  };

  const handleSendMessage = async (customQuery?: string) => {
    const query = (customQuery || inputMessage).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsThinking(true);

    try {
      // Process through the AI engine with a natural, measured typing delay (1.8s)
      const [aiResponse] = await Promise.all([
        chatbotAIService.processUserQuery(query, siteName, whatsappNumber, supportPhone),
        new Promise((r) => setTimeout(r, 1800)) // 3-dots typing indicator delay
      ]);

      const botReply: Message = {
        id: `bot-reply-${Date.now()}`,
        sender: "bot",
        text: aiResponse.text,
        timestamp: new Date(),
        products: aiResponse.products,
        links: aiResponse.links,
        quickReplies: aiResponse.quickReplies,
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (error) {
      const fallbackReply: Message = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: "I'm having a slight connection moment, but I'm here! You can browse products or reach our campus WhatsApp helpline directly.",
        timestamp: new Date(),
        links: [
          { label: "💬 Chat on WhatsApp", url: `https://wa.me/${whatsappNumber}`, external: true }
        ]
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* ── 1. FLOATING CHAT TRIGGER BUTTON ── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open Live Chat"
        className="fixed bottom-24 md:bottom-12 right-6 md:right-10 z-50 group flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none"
      >
        {/* Soft pulse effect */}
        <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping pointer-events-none" />

        {/* Orange Circle with Sleek White Headset Graphic */}
        <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-2xl drop-shadow-xl transition-all group-hover:ring-3 group-hover:ring-orange-400/50 group-hover:shadow-orange-500/30">
          <BotHeadsetIcon className="w-full h-full" />
        </div>
      </button>

      {/* ── 2. CHATBOT WINDOW DIALOG (EXPANDED HEIGHT & STRAIGHT SQUARE EDGES) ── */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:right-4 md:right-6 z-50 w-full sm:w-[420px] h-[92vh] max-h-[95vh] rounded-none bg-white dark:bg-card border border-gray-200 dark:border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* ── Header (Exact Replica) ── */}
          <div className="px-5 py-4 bg-white dark:bg-card flex items-center justify-between shrink-0 border-b border-gray-100 dark:border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-xs">
                <BotHeadsetIcon className="w-full h-full" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white tracking-tight">
                  Unimall Chat
                </h3>
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AI Online • Instant Answers
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={resetChat}
                className="text-sm font-bold text-gray-900 dark:text-white hover:text-[#FF5500] transition-colors cursor-pointer"
                title="Reset conversation"
              >
                Reset
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-900 dark:text-white hover:text-gray-500 transition-colors p-1 cursor-pointer"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* ── Message Area (Exact Replica) ── */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#F7F8FA] dark:bg-slate-900/60 text-xs">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2.5">

                {/* Bot Message Block */}
                {msg.sender === "bot" ? (
                  <div className="space-y-2.5">
                    {/* Bot Header Line */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 shadow-2xs">
                        <BotHeadsetIcon className="w-full h-full" />
                      </div>
                      <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                        Unimall
                      </span>
                      <span className="px-1.5 py-0.5 rounded-sm bg-[#FBF3E4] dark:bg-amber-950/80 text-[#C69234] dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        BOT
                      </span>
                    </div>

                    {/* Bot Message Bubble */}
                    <div className="p-4 rounded-2xl rounded-tl-none bg-white dark:bg-card border border-gray-100 dark:border-border text-gray-800 dark:text-gray-200 text-xs leading-relaxed shadow-xs max-w-[94%] whitespace-pre-line">
                      {msg.text}
                    </div>

                    {/* Live Product Cards (Live Search Results) */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="font-bold text-gray-800 dark:text-gray-200 text-[11px] flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#FF5500]" />
                          Campus Catalog Recommendations:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.products.map((product) => (
                            <Link
                              key={product.id}
                              to={`/product/${product.id}`}
                              onClick={() => setIsOpen(false)}
                              className="group p-2.5 rounded-xl bg-white dark:bg-card border border-gray-100 dark:border-border hover:border-[#FF5500]/50 hover:shadow-md transition-all flex flex-col justify-between"
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="w-14 h-14 rounded-lg bg-gray-50 dark:bg-muted overflow-hidden shrink-0 border border-gray-100 dark:border-border">
                                  <img
                                    src={product.image || product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-[#FF5500] transition-colors">
                                    {product.name}
                                  </h4>
                                  <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                                    By {product.vendor || "Campus Vendor"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-gray-50 dark:border-border/60 flex items-center justify-between">
                                <div className="flex items-baseline gap-1">
                                  <span className="font-black text-xs text-[#FF5500]">
                                    GH₵ {product.price?.toLocaleString()}
                                  </span>
                                  {product.original_price && product.original_price > product.price && (
                                    <span className="text-[10px] text-gray-400 line-through">
                                      GH₵ {product.original_price.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-bold text-[#FF5500] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                  View <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Links */}
                    {msg.links && msg.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.links.map((link, idx) => (
                          link.external ? (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                            >
                              {link.label} <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <Link
                              key={idx}
                              to={link.url}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold text-xs shadow-xs transition-all"
                            >
                              {link.label} <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          )
                        ))}
                      </div>
                    )}

                    {/* Quick Replies Chips */}
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {msg.quickReplies.map((qr, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(qr)}
                            className="px-3 py-1 rounded-full bg-white dark:bg-card border border-gray-200 dark:border-border hover:border-[#FF5500] text-gray-700 dark:text-gray-300 hover:text-[#FF5500] text-[11px] font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            💬 {qr}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* ── Category Option Cards (Exact Replica from Screenshot) ── */}
                    {msg.options && msg.options.length > 0 && (
                      <div className="p-5 rounded-2xl bg-white dark:bg-card border border-gray-100 dark:border-border shadow-xs space-y-1">
                        <p className="font-bold text-[13px] text-gray-900 dark:text-white mb-3">
                          For other general questions, select an option below.
                        </p>

                        <div className="divide-y divide-gray-100 dark:divide-border/60">
                          {msg.options.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => {
                                if (opt.id.startsWith("sub_")) {
                                  handleSelectSubOption(opt.id, opt.label);
                                } else {
                                  handleSelectOption(opt);
                                }
                              }}
                              className="w-full py-3 px-1 flex items-center justify-between text-left group hover:text-[#FF5500] transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white shrink-0 group-hover:bg-[#FF5500]" />
                                <span className="font-medium text-xs text-gray-800 dark:text-gray-200 group-hover:text-[#FF5500]">
                                  {opt.label}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#FF5500] group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* User Message Bubble */
                  <div className="flex justify-end">
                    <div className="p-3.5 rounded-2xl rounded-tr-none bg-black dark:bg-primary text-white text-xs leading-relaxed max-w-[85%] shadow-xs font-medium">
                      {msg.text}
                    </div>
                  </div>
                )}

              </div>
            ))}

            {/* 3 Moving Dots Replying Indicator */}
            {isThinking && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 shadow-2xs">
                    <BotHeadsetIcon className="w-full h-full" />
                  </div>
                  <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                    Unimall
                  </span>
                  <span className="px-1.5 py-0.5 rounded-sm bg-[#FBF3E4] dark:bg-amber-950/80 text-[#C69234] dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                    BOT
                  </span>
                </div>
                <div className="py-2.5 px-3.5 rounded-2xl rounded-tl-none bg-white dark:bg-card border border-gray-100 dark:border-border shadow-2xs inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-300 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.9s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-300 animate-bounce" style={{ animationDelay: "180ms", animationDuration: "0.9s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-300 animate-bounce" style={{ animationDelay: "360ms", animationDuration: "0.9s" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input Bar (Exact Replica from Screenshot) ── */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3.5 bg-white dark:bg-card border-t border-gray-100 dark:border-border flex items-center gap-2.5 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything (e.g., 'Find iPhone', 'How does delivery work?')..."
              className="flex-1 h-11 px-4 rounded-full border border-gray-200 dark:border-border bg-white dark:bg-muted text-xs focus:outline-none focus:border-[#FF5500] dark:focus:border-slate-500 font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isThinking}
              className="h-11 px-6 rounded-full bg-[#FF5500] text-white font-bold text-xs hover:bg-[#e54a00] disabled:bg-[#D1D5DB] dark:disabled:bg-muted disabled:text-gray-400 disabled:opacity-70 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>

        </div>
      )}
    </>
  );
};

export default CampusChatbot;
