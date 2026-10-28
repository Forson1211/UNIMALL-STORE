import { productService, StorefrontProduct } from "./productService";

export interface AIResponse {
  text: string;
  products?: StorefrontProduct[];
  links?: { label: string; url: string; external?: boolean }[];
  quickReplies?: string[];
}

// ── CAMPUS DIRECTORY KNOWLEDGE ──
const CAMPUS_DATA: Record<string, { name: string; hubs: string[]; dropoffTime: string }> = {
  legon: {
    name: "University of Ghana (UG Legon)",
    hubs: ["Pent (African Union)", "Evandy", "Bani", "TF Hostel", "Commonwealth", "Mensah Sarbah", "Volta Hall", "Akuafo", "Legon Hall", "Jean Nelson Aka", "Alexander Kwapong", "Hilla Limann", "Elizabeth Sey", "Night Market", "Central Cafeteria"],
    dropoffTime: "2 - 4 hours",
  },
  knust: {
    name: "KNUST (Kumasi)",
    hubs: ["Brunei Complex", "Unity Hall (Conti)", "University Hall (Katanga)", "Queen Elizabeth II", "Independence Hall", "Republic Hall", "Africa Hall", "Gaza Hostel", "Crystal Rose", "Ayeduase", "Kotei", "Commercial Area"],
    dropoffTime: "2 - 4 hours",
  },
  ucc: {
    name: "University of Cape Coast (UCC)",
    hubs: ["Casely Hayford (Casford)", "Atlantic Hall (ATL)", "Oguaa Hall", "Valco Hall", "Adehye Hall", "Kwame Nkrumah Hall", "Superannuation", "Amamoma", "Kwesimintsim"],
    dropoffTime: "3 - 5 hours",
  },
  upsa: {
    name: "UPSA (Accra)",
    hubs: ["Yaa Asantewaa Hostel", "Nelson Mandela Hostel", "Opoku Ampomah", "Access Point", "Hostel B", "Locker Area"],
    dropoffTime: "1 - 3 hours",
  },
};

// ── EXTRACT PRODUCT SEARCH INTENT ──
const PRODUCT_KEYWORDS = [
  "iphone", "phone", "samsung", "pixel", "laptop", "macbook", "dell", "hp", "lenovo",
  "sneaker", "shoe", "shoes", "crocs", "slide", "slides", "hoodie", "shirt", "t-shirt",
  "dress", "watch", "smartwatch", "airpods", "earbuds", "headphone", "headphones",
  "speaker", "charger", "powerbank", "power bank", "fridge", "fan", "gas", "cooker",
  "perfume", "cologne", "bag", "backpack", "calculator", "books", "gadgets", "deals"
];

function extractProductKeyword(query: string): string | null {
  const lower = query.toLowerCase();
  for (const kw of PRODUCT_KEYWORDS) {
    if (lower.includes(kw)) {
      return kw;
    }
  }
  return null;
}

export const chatbotAIService = {
  async processUserQuery(userQuery: string, siteName: string, whatsappNumber: string, supportPhone: string): Promise<AIResponse> {
    const q = userQuery.toLowerCase().trim();

    // 1. Check if user is asking for products / shopping recommendation
    const productKeyword = extractProductKeyword(q);
    if (productKeyword || q.includes("buy") || q.includes("sell") || q.includes("price") || q.includes("how much") || q.includes("recommend") || q.includes("looking for")) {
      try {
        const searchTerm = productKeyword || q.replace(/(buy|looking for|recommend|how much is|where can i find|do you have|show me)/g, "").trim();
        const results = await productService.getProducts({ search: searchTerm.slice(0, 20), limit: 4 });

        if (results && results.length > 0) {
          return {
            text: `Here are the top matches for "${searchTerm || "your search"}" currently available from verified campus vendors:`,
            products: results,
            links: [
              { label: "🔍 View All Search Results", url: `/products?search=${encodeURIComponent(searchTerm || "")}` },
              { label: "🔥 Browse Flash Deals", url: "/products?deals=true" }
            ],
            quickReplies: ["Show me tech deals", "How does delivery work?", "Can I pay with MoMo?"]
          };
        }
      } catch (err) {
        console.warn("Product search in AI chatbot failed:", err);
      }
    }

    // 2. Mobile Money & Payment Troubles
    if (q.includes("momo") || q.includes("pay") || q.includes("payment") || q.includes("telecel") || q.includes("at money") || q.includes("prompt") || q.includes("approval") || q.includes("card") || q.includes("visa")) {
      if (q.includes("prompt") || q.includes("delay") || q.includes("not showing") || q.includes("didn't receive") || q.includes("failed")) {
        return {
          text: `📱 **Mobile Money Prompt Troubleshooting:**\n\nIf the authorization prompt didn't appear automatically on your phone screen within 60 seconds:\n\n1. **MTN MoMo:** Dial **\`*170#\`** ➔ Select **Option 6 (My Wallet)** ➔ Select **Option 3 (My Approvals)** ➔ Enter your PIN to approve the pending payment.\n2. **Telecel Cash:** Dial **\`*110#\`** ➔ Select **Option 4 (My Account)** ➔ Select **Option 1 (Approvals)**.\n3. **AT Money:** Dial **\`*110#\`** ➔ Check Pending Approvals.\n\nAll funds are held in secure escrow until your item is delivered!`,
          links: [
            { label: "🔒 Payment Security Info", url: "/privacy" },
            { label: "💬 Contact Support on WhatsApp", url: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello, I need help with my payment on Unimall.")}`, external: true }
          ],
          quickReplies: ["Is my payment safe?", "How to track my order", "What are the refund rules?"]
        };
      }

      return {
        text: `💳 **Supported Payment Methods on ${siteName}:**\n\n- **Mobile Money:** MTN MoMo, Telecel Cash, and AT Money.\n- **Cards:** Visa, Mastercard, and Debit cards via secure Paystack encryption.\n- **Buyer Protection:** Your money is safely held in escrow and only released to the vendor after your item has been successfully dropped off on campus.`,
        links: [
          { label: "Shop Campus Items", url: "/products" },
          { label: "View Terms & Protection", url: "/terms" }
        ],
        quickReplies: ["How fast is campus delivery?", "What if item is broken?", "How to sell on Unimall"]
      };
    }

    // 3. Campus Logistics & Hall / Hostel Delivery
    if (q.includes("deliver") || q.includes("shipping") || q.includes("pickup") || q.includes("hostel") || q.includes("hall") || q.includes("legon") || q.includes("knust") || q.includes("ucc") || q.includes("upsa") || q.includes("pent") || q.includes("brunei") || q.includes("conti") || q.includes("katanga") || q.includes("casford") || q.includes("how long")) {
      let campusName = "your university campus";
      let campusHubs = "your hall of residence, hostel, or faculty department";
      let eta = "2 to 6 hours";

      if (q.includes("legon") || q.includes("pent") || q.includes("evandy") || q.includes("bani") || q.includes("sarbah") || q.includes("commonwealth")) {
        campusName = CAMPUS_DATA.legon.name;
        campusHubs = CAMPUS_DATA.legon.hubs.slice(0, 7).join(", ") + ", and all off-campus hostels";
        eta = CAMPUS_DATA.legon.dropoffTime;
      } else if (q.includes("knust") || q.includes("brunei") || q.includes("conti") || q.includes("katanga") || q.includes("ayeduase") || q.includes("kotei")) {
        campusName = CAMPUS_DATA.knust.name;
        campusHubs = CAMPUS_DATA.knust.hubs.slice(0, 7).join(", ") + ", and surrounding student residences";
        eta = CAMPUS_DATA.knust.dropoffTime;
      } else if (q.includes("ucc") || q.includes("casford") || q.includes("atl") || q.includes("valco")) {
        campusName = CAMPUS_DATA.ucc.name;
        campusHubs = CAMPUS_DATA.ucc.hubs.slice(0, 6).join(", ");
        eta = CAMPUS_DATA.ucc.dropoffTime;
      } else if (q.includes("upsa")) {
        campusName = CAMPUS_DATA.upsa.name;
        campusHubs = CAMPUS_DATA.upsa.hubs.join(", ");
        eta = CAMPUS_DATA.upsa.dropoffTime;
      }

      return {
        text: `🚚 **Campus Delivery at ${campusName}:**\n\n- **Dropoff Locations:** We deliver directly to ${campusHubs}.\n- **Delivery Speed:** Items tagged with the green **"Same-Day Dropoff"** badge arrive within **${eta}**!\n- **Delivery Fee:** Standard on-campus delivery is GH₵ 5 - GH₵ 15, with FREE dropoff on qualifying bundle orders.\n- **Direct Pickup:** You can also arrange direct pickup at central campus landmarks (e.g. Night Market, Central Cafeteria, Commercial Area).`,
        links: [
          { label: "⚡ Browse Same-Day Delivery Items", url: "/products" },
          { label: "📦 View Orders", url: "/orders" }
        ],
        quickReplies: ["How do I track my order?", "Can I inspect before paying?", "Show me campus deals"]
      };
    }

    // 4. Returns, Refunds, Broken Items & Order Cancellation
    if (q.includes("return") || q.includes("refund") || q.includes("cancel") || q.includes("broken") || q.includes("damaged") || q.includes("wrong size") || q.includes("defect") || q.includes("money back")) {
      return {
        text: `🛡️ **Buyer Guarantee & Returns Policy:**\n\n- **48-Hour Return Window:** If an item is defective, damaged, or not as described, you can request a return or full refund within 48 hours of delivery.\n- **Order Cancellation:** Pending orders that have not yet been dispatched by the vendor can be cancelled directly from your Orders dashboard.\n- **Escrow Refund:** Once a return is verified, funds are reversed immediately to your original Mobile Money wallet or card.`,
        links: [
          { label: "Manage My Orders", url: "/orders" },
          { label: "Read Refund Terms", url: "/terms" },
          { label: "💬 Message Dispute Team", url: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello Unimall, I have an issue with my order and need a return/refund.")}`, external: true }
        ],
        quickReplies: ["Check order status", "Contact vendor", "What payment methods work?"]
      };
    }

    // 5. Selling & Vendor Onboarding
    if (q.includes("sell") || q.includes("vendor") || q.includes("store") || q.includes("shop") || q.includes("register") || q.includes("business") || q.includes("payout") || q.includes("commission") || q.includes("earn") || q.includes("withdraw")) {
      return {
        text: `🏪 **Start Selling on ${siteName} Campus Hub:**\n\n- **Zero Listing Fees:** Create your student store and list unlimited campus items for free!\n- **Instant MoMo Payouts:** Withdraw your earnings directly to MTN MoMo, Telecel Cash, or AT Money anytime (minimum withdrawal only GH₵ 10.00).\n- **Verification Badge:** Submit your student ID or business registration to earn the blue **Verified Vendor** badge and gain student buyer trust.\n- **Flash Deals Tool:** Launch special discount deals directly to the homepage from your Vendor Dashboard.`,
        links: [
          { label: "🚀 Open Your Campus Store", url: "/signup" },
          { label: "📋 View Top Campus Vendors", url: "/vendors" }
        ],
        quickReplies: ["How do vendor payouts work?", "What are the seller fees?", "How to get verified?"]
      };
    }

    // 6. Flash Deals, Coupons & Discounts
    if (q.includes("deal") || q.includes("discount") || q.includes("coupon") || q.includes("promo") || q.includes("cheap") || q.includes("sale") || q.includes("flash")) {
      try {
        const deals = await productService.getDeals(4);
        return {
          text: `🔥 **Active Campus Flash Deals:**\n\nSave up to 50% on trending campus tech, dorm essentials, fashion, and books today!`,
          products: deals,
          links: [
            { label: "🛍️ Explore All Daily Deals", url: "/products?deals=true" }
          ],
          quickReplies: ["Show me laptops under GH₵ 2000", "Same-day delivery items", "How to use promo code"]
        };
      } catch (e) {
        return {
          text: `🔥 You can find Daily Flash Deals on our homepage and product catalog with discounts up to 50% off! Coupon codes can also be entered during checkout for extra savings.`,
          links: [
            { label: "Browse Flash Deals", url: "/products?deals=true" }
          ]
        };
      }
    }

    // 7. Greetings & General Conversational Intelligence
    if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("good morning") || q.includes("good afternoon") || q.includes("good evening") || q.includes("how are you") || q.includes("chale") || q.includes("kwasia") || q.includes("yo")) {
      return {
        text: `Hey there! Welcome to **${siteName}** — Ghana's premier campus marketplace. 🎓\n\nI can help you:\n- 🔍 Search for products & compare campus prices\n- 🚚 Track orders & calculate hall delivery times\n- 💳 Resolve Mobile Money payment questions\n- 🏪 Help you open a student vendor shop\n\nWhat can I do for you today?`,
        links: [
          { label: "⚡ Browse Campus Catalog", url: "/products" },
          { label: "🔥 View Flash Deals", url: "/products?deals=true" }
        ],
        quickReplies: ["Show me tech deals", "How does delivery work?", "Can I pay with MoMo?"]
      };
    }

    // 8. Contact & Real Human Support
    if (q.includes("human") || q.includes("agent") || q.includes("customer care") || q.includes("support") || q.includes("call") || q.includes("whatsapp") || q.includes("phone number") || q.includes("contact")) {
      return {
        text: `📞 **Need to speak with a human support agent?**\n\nOur campus support team is active 7 days a week:\n- **WhatsApp:** [Click here to message directly](https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello Unimall Support, I need assistance.")})\n- **Helpline Phone:** ${supportPhone}\n- **Response Time:** Typically under 5 minutes on WhatsApp!`,
        links: [
          { label: "💬 Chat on WhatsApp", url: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello Unimall Support, I need assistance.")}`, external: true },
          { label: "📞 Support Contact Page", url: "/contact" }
        ],
        quickReplies: ["Where is my order?", "How to make a return", "Browse products"]
      };
    }

    // 9. Intelligent General Fallback with Context
    return {
      text: `Thanks for asking! As your **${siteName} AI Assistant**, I can assist with finding items across Ghanaian campuses, tracking orders, resolving MoMo issues, or opening a vendor store.\n\nYou can select a topic below or chat directly with our campus support team on WhatsApp for immediate help.`,
      links: [
        { label: "💬 Chat on WhatsApp", url: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello ${siteName}, I need help with: ${userQuery}`)}`, external: true },
        { label: "🛍️ Browse Marketplace", url: "/products" },
        { label: "📦 View Orders", url: "/orders" }
      ],
      quickReplies: ["After-sales & returns", "How to pay with MoMo", "Same-day campus delivery", "Become a vendor"]
    };
  }
};
