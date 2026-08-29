import { useState, useRef, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  X, 
  Upload, 
  Loader2, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Package,
  Layers,
  Sparkles,
  Camera
} from "lucide-react";
import { Product } from "@/types/dashboard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { analyzeImageWithAI, ProductIntelliSenseResult } from "@/services/imageIntelliSense";
import { uploadOptimizedImage, optimizeImageForUpload, IMAGE_PRESETS, validateImageFile } from "@/lib/imageOptimizer";

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product?: Product;
  onSave: (product: any) => void;
  isSubmitting?: boolean;
}

export const ProductForm = ({ open, onClose, product, onSave, isSubmitting = false }: ProductFormProps) => {
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<ProductIntelliSenseResult[]>([]);
  
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const slotFileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<number>(0);
  
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    original_price: (product as any)?.original_price?.toString() || "",
    category: product?.category || "Electronics",
    condition: (product as any)?.condition || "Brand New",
    stock: product?.stock?.toString() || "5",
    status: product?.status || "active",
    image_url: product?.image_url || (product as any)?.image || "",
    same_day_delivery: (product as any)?.same_day_delivery ?? true,
    is_negotiable: (product as any)?.is_negotiable ?? false,
    highlight: (product as any)?.highlight || "",
  });

  // Up to 4 preview images
  const [previewImages, setPreviewImages] = useState<string[]>(["", "", "", ""]);

  useEffect(() => {
    if (product) {
      const existingGallery = (product as any)?.images || (product as any)?.gallery || [];
      const previews = ["", "", "", ""];
      if (Array.isArray(existingGallery) && existingGallery.length > 1) {
        existingGallery.slice(1, 5).forEach((url: string, idx: number) => {
          previews[idx] = url || "";
        });
      }

      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price ? product.price.toString() : "",
        original_price: (product as any)?.original_price ? (product as any).original_price.toString() : "",
        category: product.category || "Electronics",
        condition: (product as any)?.condition || "Brand New",
        stock: product.stock !== undefined ? product.stock.toString() : "5",
        status: product.status || "active",
        image_url: product.image_url || (product as any)?.image || "",
        same_day_delivery: (product as any)?.same_day_delivery ?? true,
        is_negotiable: (product as any)?.is_negotiable ?? false,
        highlight: (product as any)?.highlight || "",
      });
      setPreviewImages(previews);
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        original_price: "",
        category: "Electronics",
        condition: "Brand New",
        stock: "5",
        status: "active",
        image_url: "",
        same_day_delivery: true,
        is_negotiable: false,
        highlight: "Same-Day Hostel Dropoff",
      });
      setPreviewImages(["", "", "", ""]);
    }
  }, [product, open]);

  // Fast direct storage upload helper with client-side WebP compression and 1-year cache
  const processFileUpload = async (file: File, isSlot = false): Promise<string> => {
    const filePath = `products/prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.webp`;
    const preset = isSlot ? IMAGE_PRESETS.productSlot : IMAGE_PRESETS.productMain;

    const { publicUrl, error } = await uploadOptimizedImage('products', filePath, file, {
      ...preset,
      cacheControl: '31536000, immutable',
    });

    if (!error && publicUrl) {
      return publicUrl;
    }
    return "";
  };

  // Instant Main Image Upload Handler (0ms perceived latency with WebP optimization)
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { valid, error: valErr } = validateImageFile(file, 15 * 1024 * 1024);
    if (!valid) {
      toast.error(valErr || "Invalid image file");
      return;
    }

    try {
      // 1. Instant client-side optimized WebP preview (< 15ms)
      const { dataUrl } = await optimizeImageForUpload(file, IMAGE_PRESETS.productMain);
      if (dataUrl) {
        setFormData((prev) => ({ ...prev, image_url: dataUrl }));
      }

      // 2. Background Cloud Storage Upload (Non-blocking with 1-year cache)
      processFileUpload(file, false).then((publicUrl) => {
        if (publicUrl) {
          setFormData((prev) => ({ ...prev, image_url: publicUrl }));
        }
      }).catch(() => {});

      // 3. Parallel AI Neural Vision Analysis
      const targetToAnalyze = dataUrl || file;
      analyzeImageWithAI(targetToAnalyze, formData.category).then((suggestions) => {
        if (suggestions.length > 0) {
          setAiSuggestions(suggestions);
          setFormData((prev) => {
            if (!prev.name.trim()) {
              return {
                ...prev,
                name: suggestions[0].title,
                category: suggestions[0].category,
                highlight: prev.highlight || suggestions[0].suggestedHighlight,
                price: prev.price || (suggestions[0].suggestedPrice ? suggestions[0].suggestedPrice.toString() : ""),
              };
            }
            return prev;
          });
          const detectedInfo = suggestions[0].aiDetectedTag ? ` (${suggestions[0].aiDetectedTag})` : "";
          toast.success(`✨ AI Vision: "${suggestions[0].title}"${detectedInfo}`);
        }
      }).catch((err) => {
        console.warn("AI Vision analysis failed:", err);
      });

    } catch (err: any) {
      console.warn("Image processing error:", err);
    } finally {
      if (mainFileInputRef.current) mainFileInputRef.current.value = "";
    }
  };

  // Instant Preview Angles Image Upload Handler
  const handleSlotImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { valid, error: valErr } = validateImageFile(file, 15 * 1024 * 1024);
    if (!valid) {
      toast.error(valErr || "Invalid image file");
      return;
    }

    const slotIndex = activeSlotRef.current;

    try {
      // 1. Instant preview (< 15ms)
      const { dataUrl } = await optimizeImageForUpload(file, IMAGE_PRESETS.productSlot);
      if (dataUrl) {
        setPreviewImages((prev) => {
          const copy = [...prev];
          copy[slotIndex] = dataUrl;
          return copy;
        });
      }

      // 2. Background Cloud Storage Upload (Non-blocking with 1-year cache)
      processFileUpload(file, true).then((publicUrl) => {
        if (publicUrl) {
          setPreviewImages((prev) => {
            const copy = [...prev];
            copy[slotIndex] = publicUrl;
            return copy;
          });
        }
      }).catch(() => {});

    } catch (err: any) {
      console.warn("Slot image processing error:", err);
    } finally {
      if (slotFileInputRef.current) slotFileInputRef.current.value = "";
    }
  };

  const removePreviewSlot = (index: number) => {
    setPreviewImages((prev) => {
      const copy = [...prev];
      copy[index] = "";
      return copy;
    });
  };

  const calculateDiscount = () => {
    const priceNum = parseFloat(formData.price);
    const origPriceNum = parseFloat(formData.original_price);
    if (priceNum > 0 && origPriceNum > priceNum) {
      return Math.round(((origPriceNum - priceNum) / origPriceNum) * 100);
    }
    return 0;
  };

  const discountPercent = calculateDiscount();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Please enter a valid selling price");
      return;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    const priceNum = parseFloat(formData.price);
    const origPriceNum = formData.original_price ? parseFloat(formData.original_price) : undefined;
    const mainImg = formData.image_url || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80";
    
    const validPreviews = previewImages.filter((url) => Boolean(url && url.trim()));
    const fullGallery = [mainImg, ...validPreviews];

    const words = formData.name.trim().split(/\s+/).filter(Boolean);
    const cleanedName = words.slice(0, 8).join(" ");

    onSave({
      ...product,
      name: cleanedName,
      description: formData.description.trim(),
      price: priceNum,
      original_price: origPriceNum && origPriceNum > priceNum ? origPriceNum : undefined,
      category: formData.category,
      condition: formData.condition,
      stock: parseInt(formData.stock) || 1,
      status: formData.status,
      is_active: formData.status === 'active' || formData.status === 'out_of_stock',
      image_url: mainImg,
      image: mainImg,
      images: fullGallery,
      gallery: fullGallery,
      same_day_delivery: formData.same_day_delivery,
      is_negotiable: formData.is_negotiable,
      highlight: formData.highlight || (formData.same_day_delivery ? "Same-Day Hostel Dropoff" : undefined),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="w-[90vw] sm:w-[860px] max-w-[860px] p-0 overflow-hidden rounded-none sm:rounded-none !rounded-none border border-gray-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xl">
        
        {/* Scrollable interior with guaranteed 36px-48px padding on all 4 sides */}
        <div className="p-6 sm:p-9 md:p-11 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* Header */}
          <DialogHeader className="border-b border-gray-100 dark:border-slate-800/60 pb-4 mb-4 w-full pr-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF5500] text-white flex items-center justify-center font-black shadow-md shadow-orange-500/20 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-left">
                <DialogTitle className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight truncate">
                  {product ? "Edit Campus Listing" : "Add New Campus Product"}
                </DialogTitle>
                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                  Upload your main cover photo, 4 preview angles, pricing, and campus delivery
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-5 pt-1 w-full">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-7 md:gap-8 w-full">
              
              {/* ═══ LEFT COLUMN: Media Studio (5 cols) ═══ */}
              <div className="md:col-span-5 w-full space-y-4">
                
                {/* 1. Main Cover Image */}
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <span>Main Cover Photo *</span>
                    </Label>
                    <span className="text-[10px] font-bold text-gray-400">1:1 Square</span>
                  </div>
                  
                  {/* Main Upload Dropzone */}
                  <div 
                    onClick={() => !isUploadingMain && mainFileInputRef.current?.click()}
                    className={`relative w-full border-2 border-dashed rounded-xl p-3 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden
                      ${formData.image_url ? 'border-[#FF5500]/50 bg-orange-50/20' : 'border-gray-200 dark:border-slate-700 hover:border-[#FF5500] bg-gray-50/70 dark:bg-muted/30'}
                      ${isUploadingMain ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {isUploadingMain ? (
                      <div className="flex flex-col items-center gap-2 py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-[#FF5500]" />
                        <p className="text-xs text-gray-500 font-bold uppercase">Uploading Photo...</p>
                      </div>
                    ) : formData.image_url ? (
                      <div className="relative w-full aspect-square max-h-44 rounded-lg overflow-hidden group bg-white border border-gray-100 shadow-xs">
                        <img 
                          src={formData.image_url} 
                          alt="Product Preview" 
                          className="w-full h-full object-contain p-1.5"
                        />
                        {discountPercent > 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-[#FF5500] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                            -{discountPercent}% OFF
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm"
                            className="rounded-lg text-xs font-bold h-8 px-3 bg-white/95 hover:bg-white text-gray-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              mainFileInputRef.current?.click();
                            }}
                          >
                            Change
                          </Button>
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            className="rounded-lg text-xs font-bold h-8 px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData((p) => ({ ...p, image_url: "" }));
                              setAiSuggestions([]);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-6 text-center">
                        <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-[#FF5500] flex items-center justify-center shadow-xs">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-800 dark:text-gray-200">Click to Upload Main Photo</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP (Up to 5MB)</p>
                        </div>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={mainFileInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={handleMainImageUpload}
                    />
                  </div>

                  {/* Direct Main URL input */}
                  <div className="relative pt-0.5 w-full">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input 
                      className="w-full pl-8 pr-3 text-xs rounded-xl border-gray-200 dark:border-slate-700 h-8.5 bg-gray-50/50 focus:bg-white"
                      placeholder="Or paste main image URL (https://...)"
                      value={formData.image_url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, image_url: val });
                        if (!val) setAiSuggestions([]);
                      }}
                    />
                  </div>
                </div>

                {/* 2. 4 Additional Preview Images Slots */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800 w-full">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#FF5500]" />
                      <span>4 Preview Angles</span>
                    </Label>
                    <span className="text-[10px] font-bold text-[#FF5500]">Gallery Views</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 w-full">
                    {previewImages.map((slotUrl, index) => {
                      const isCurrentUploading = uploadingSlot === index;
                      return (
                        <div key={index} className="relative flex flex-col items-center">
                          <div 
                            onClick={() => {
                              if (!isCurrentUploading) {
                                activeSlotRef.current = index;
                                slotFileInputRef.current?.click();
                              }
                            }}
                            className={`w-full aspect-square rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden relative group
                              ${slotUrl ? 'border-gray-200 bg-white' : 'border-gray-200 hover:border-[#FF5500] bg-gray-50/80 hover:bg-orange-50/30'}
                            `}
                          >
                            {isCurrentUploading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#FF5500]" />
                            ) : slotUrl ? (
                              <>
                                <img src={slotUrl} alt={`Angle ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePreviewSlot(index);
                                  }}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-0.5 text-gray-400 group-hover:text-[#FF5500]">
                                <Plus className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase">P{index + 1}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] font-medium text-gray-400 mt-1 truncate">
                            Angle {index + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <input 
                    type="file" 
                    ref={slotFileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleSlotImageUpload}
                  />
                </div>

                {/* Campus Delivery Logistics Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs w-full">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.same_day_delivery}
                      onChange={(e) => setFormData({ ...formData, same_day_delivery: e.target.checked })}
                      className="w-4 h-4 rounded-md accent-[#FF5500] cursor-pointer shrink-0"
                    />
                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate">Same-Day Hostel Delivery</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_negotiable}
                      onChange={(e) => setFormData({ ...formData, is_negotiable: e.target.checked })}
                      className="w-4 h-4 rounded-md accent-[#FF5500] cursor-pointer shrink-0"
                    />
                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate">Price Negotiable on WhatsApp</span>
                  </label>
                </div>

              </div>

              {/* ═══ RIGHT COLUMN: Details & Taxonomy (7 cols) ═══ */}
              <div className="md:col-span-7 w-full space-y-3.5">
                
                {/* Product Title (Max 8 Words) */}
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                      Product Title (7 - 8 Words) *
                    </Label>
                    <span className={`text-[10px] font-bold ${
                      formData.name.trim().split(/\s+/).filter(Boolean).length > 8 
                        ? "text-red-500 font-extrabold" 
                        : "text-gray-400"
                    }`}>
                      {formData.name.trim().split(/\s+/).filter(Boolean).length} / 8 words
                    </span>
                  </div>
                  <Input
                    id="name"
                    placeholder="e.g. Nike Air Max Sneaker"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border-gray-200 dark:border-slate-700 h-10 font-bold text-xs bg-gray-50/50 focus:bg-white"
                    required
                  />

                  {/* ── AI IntelliSense Suggestions (Click to Apply) ── */}
                  {aiSuggestions.length > 0 && (
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-[#FF5500]/25 space-y-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-[#FF5500] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#FF5500]" />
                          AI Suggestions from Photo (Click to Apply)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const target = formData.image_url || formData.name || "item";
                              const fresh = await analyzeImageWithAI(target, formData.category);
                              setAiSuggestions(fresh);
                              toast.success("AI Suggestions Refreshed! ⚡");
                            }}
                            className="text-[10px] font-bold text-gray-500 hover:text-[#FF5500] flex items-center gap-1 cursor-pointer"
                          >
                            Refresh
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiSuggestions([])}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                            title="Dismiss suggestions"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {aiSuggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                name: sug.title,
                                category: sug.category,
                                highlight: sug.suggestedHighlight || prev.highlight,
                                price: !prev.price && sug.suggestedPrice ? sug.suggestedPrice.toString() : prev.price,
                              }));
                              setAiSuggestions([]);
                              toast.success(`✨ Applied: "${sug.title}" (${sug.category})`);
                            }}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-white dark:bg-card text-gray-800 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-[#FF5500] hover:text-[#FF5500] shadow-2xs hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-1.5 text-left"
                          >
                            <Sparkles className="w-3 h-3 text-[#FF5500] opacity-90 shrink-0" />
                            <span>{sug.title}</span>
                            <span className="text-[10px] opacity-70 ml-1 font-normal bg-black/10 dark:bg-white/10 px-1.5 py-0.2 rounded-md">
                              {sug.category}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Category & Condition Row */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="space-y-1">
                    <Label htmlFor="category" className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 truncate block">
                      Category *
                    </Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category" className="w-full rounded-xl border-gray-200 dark:border-slate-700 h-10 text-xs bg-gray-50/50">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-gray-200">
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.label} value={cat.label} className="rounded-lg text-xs">
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="condition" className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 truncate block">
                      Condition
                    </Label>
                    <Select 
                      value={formData.condition} 
                      onValueChange={(value) => setFormData({ ...formData, condition: value })}
                    >
                      <SelectTrigger id="condition" className="w-full rounded-xl border-gray-200 dark:border-slate-700 h-10 text-xs bg-gray-50/50">
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-gray-200">
                        <SelectItem value="Brand New" className="rounded-lg text-xs">Brand New (Sealed)</SelectItem>
                        <SelectItem value="Refurbished" className="rounded-lg text-xs">Refurbished / Certified</SelectItem>
                        <SelectItem value="Like New" className="rounded-lg text-xs">Gently Used (Like New)</SelectItem>
                        <SelectItem value="Fair Condition" className="rounded-lg text-xs">Fair Condition (Usable)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Pricing Row */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="space-y-1">
                    <Label htmlFor="price" className="text-xs font-black text-gray-900 dark:text-white uppercase truncate block">
                      Selling Price *
                    </Label>
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none select-none">
                        GH₵
                      </span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-12 pr-3 font-black text-xs rounded-xl border-gray-200 dark:border-slate-700 h-10 bg-gray-50/50 focus:bg-white"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="original_price" className="text-xs font-bold text-gray-500 uppercase truncate block">
                      Regular Price
                    </Label>
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none select-none">
                        GH₵
                      </span>
                      <Input
                        id="original_price"
                        type="number"
                        step="0.01"
                        placeholder="Optional"
                        className={`w-full pl-12 pr-3 text-xs rounded-xl border-gray-200 dark:border-slate-700 h-10 bg-gray-50/50 focus:bg-white ${
                          formData.original_price ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-200"
                        }`}
                        value={formData.original_price}
                        onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {discountPercent > 0 && (
                  <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold w-full">
                    <span>Student Discount Activated</span>
                    <span className="font-black text-emerald-600">Save {discountPercent}% OFF</span>
                  </div>
                )}

                {/* Stock Quantity & Status Row */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="space-y-1">
                    <Label htmlFor="stock" className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 truncate block">
                      Stock Quantity *
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      placeholder="5"
                      className="w-full rounded-xl border-gray-200 dark:border-slate-700 h-10 text-xs bg-gray-50/50 focus:bg-white"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="status" className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 truncate block">
                      Listing Status
                    </Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: "active" | "draft" | "out_of_stock") => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger id="status" className="w-full rounded-xl border-gray-200 dark:border-slate-700 h-10 text-xs bg-gray-50/50">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-gray-200">
                        <SelectItem value="active" className="rounded-lg text-xs text-emerald-600 font-bold">Active (Live in Store)</SelectItem>
                        <SelectItem value="draft" className="rounded-lg text-xs text-gray-500">Draft (Hidden)</SelectItem>
                        <SelectItem value="out_of_stock" className="rounded-lg text-xs text-destructive">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Feature Highlight Badge */}
                <div className="space-y-1 w-full">
                  <Label htmlFor="highlight" className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">
                    Feature Highlight Badge
                  </Label>
                  <Input
                    id="highlight"
                    placeholder="e.g. 6 Months Warranty, Free Delivery"
                    value={formData.highlight}
                    onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
                    className="w-full rounded-xl border-gray-200 dark:border-slate-700 h-10 text-xs bg-gray-50/50 focus:bg-white"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1 w-full">
                  <Label htmlFor="description" className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Description & Specifications
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide specifications, warranty terms, accessories included, or meeting instructions..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border-gray-200 dark:border-slate-700 text-xs leading-relaxed bg-gray-50/50 focus:bg-white resize-none"
                  />
                </div>

              </div>

            </div>

            <DialogFooter className="border-t border-gray-100 dark:border-slate-800/60 pt-4 mt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 w-full">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isSubmitting}
                className="rounded-xl border-gray-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider h-10 px-6 cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-xl bg-[#FF5500] hover:bg-[#e54a00] text-white text-xs font-black uppercase tracking-wider h-10 px-8 shadow-md shadow-orange-500/20 cursor-pointer flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving Product...
                  </>
                ) : (
                  product ? "Update Product" : "Publish Product →"
                )}
              </Button>
            </DialogFooter>
          </form>

        </div>
      </DialogContent>
    </Dialog>
  );
};
