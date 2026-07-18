import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, Star, ShoppingCart, Minus, Plus, Truck, Shield, RotateCcw,
  Store, ChevronLeft, ChevronRight, Share2, Facebook, Twitter, Phone,
  ChevronDown, HelpCircle, Info
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/productService";

const regions = [
  { name: "Greater Accra", cities: ["Abeka", "East Legon", "Madina", "Tema", "Accra Central"] },
  { name: "Ashanti", cities: ["Kumasi", "Adum", "Oforikrom", "Obuasi"] },
  { name: "Western", cities: ["Takoradi", "Sekondi", "Tarkwa"] },
  { name: "Central", cities: ["Cape Coast", "Kasoa", "Winneba"] },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch product data
  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
  });

  // Fetch related/sponsored products
  const { data: sponsoredProducts = [] } = useQuery({
    queryKey: ["sponsored-products", product?.category],
    queryFn: () => productService.getProducts({ category: product?.category, limit: 6 }),
    enabled: !!product?.category,
  });

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState(regions[0].name);
  const [selectedCity, setSelectedCity] = useState(regions[0].cities[0]);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { addItem } = useCart();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f1f2]">
        <Navbar />
        <div className="pt-32 flex justify-center pb-20">
          <div className="w-12 h-12 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#f1f1f2]">
        <Navbar />
        <div className="pt-32 text-center pb-20">
          <h2 className="text-2xl font-bold">Product not found</h2>
          <Button className="mt-4 bg-[#FF5500] hover:bg-[#e54a00] text-white rounded-none" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const productImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const productFeatures = product.features || [];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        vendor: product.vendor,
        vendorId: product.vendor_id,
      });
    }
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} has been added to your cart.`,
    });
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleRegionChange = (regionName: string) => {
    setSelectedRegion(regionName);
    const regionObj = regions.find(r => r.name === regionName);
    if (regionObj && regionObj.cities.length > 0) {
      setSelectedCity(regionObj.cities[0]);
    }
  };

  // Calculations for dates & discount
  const discountPct = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  // Mock estimated delivery dates (e.g. 3-4 days from today)
  const getDeliveryDateRange = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 3);
    const end = new Date(today);
    end.setDate(today.getDate() + 5);
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('en-US', options)} and ${end.toLocaleDateString('en-US', options)}`;
  };

  return (
    <div className="min-h-screen bg-[#f1f1f2]">
      <Navbar />

      <main className="py-4">
        <div className="max-w-[1280px] mx-auto px-3">
          
          {/* Breadcrumb trail */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link to="/" className="hover:text-gray-800 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <Link to="/products" className="hover:text-gray-800 transition-colors">Products</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-gray-800 transition-colors">{product.category}</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
          </div>

          {/* 3-Column main layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-start">
            
            {/* LEFT CARD: Takes 3/4 columns on desktop (Images + Details inside) */}
            <div className="lg:col-span-3 bg-white shadow-sm rounded-none p-3 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                
                {/* Column A: Gallery Images & Share tools (5/12 columns) */}
                <div className="md:col-span-5 flex flex-col">
                  {/* Main Product Image */}
                  <div className="relative aspect-square border border-gray-100 bg-gray-50 flex items-center justify-center p-2 mb-3">
                    <img
                      src={productImages[selectedImage] || product.image}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                    {discountPct > 0 && (
                      <span className="absolute top-2 right-2 bg-[#FF5500] text-white text-xs font-black px-2 py-0.5">
                        -{discountPct}%
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {productImages.length > 1 && (
                    <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                      {productImages.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`w-12 h-12 border transition-all flex items-center justify-center bg-white shrink-0 p-0.5 ${
                            selectedImage === index ? "border-[#FF5500] ring-1 ring-[#FF5500]" : "border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <img src={img} alt="" className="max-h-full max-w-full object-contain" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Share buttons */}
                  <div className="border-t border-gray-100 pt-4 mt-auto">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      Share this product
                    </span>
                    <div className="flex gap-2">
                      <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-gray-200 hover:border-blue-600 hover:bg-blue-50 text-gray-600 hover:text-blue-600 flex items-center justify-center transition-all">
                        <Facebook className="w-4 h-4" />
                      </a>
                      <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-900 hover:bg-gray-50 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-all">
                        <Twitter className="w-4 h-4" />
                      </a>
                      <a href="https://wa.me" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-gray-200 hover:border-green-500 hover:bg-green-50 text-gray-600 hover:text-green-500 flex items-center justify-center transition-all">
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                    <Link to="/report-issue" className="text-[11px] text-gray-400 hover:text-[#FF5500] underline hover:no-underline mt-4 block transition-colors">
                      Report incorrect product information
                    </Link>
                  </div>
                </div>

                {/* Column B: Product Details & Options (7/12 columns) */}
                <div className="md:col-span-7 flex flex-col">
                  
                  {/* Category Badges & Wishlist Trigger */}
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider rounded-sm">
                        Official Store
                      </span>
                      <span className="bg-[#DC143C] text-white text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider rounded-sm">
                        Pay on Delivery
                      </span>
                    </div>
                    <button
                      onClick={() => setIsWishlisted(!isWishlisted)}
                      className={`p-1.5 rounded-full hover:bg-gray-50 transition-colors border ${
                        isWishlisted ? "border-red-100 text-red-500 bg-red-50" : "border-gray-200 text-gray-400"
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isWishlisted ? "fill-red-500" : ""}`} />
                    </button>
                  </div>

                  {/* Title */}
                  <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-snug mb-1">
                    {product.name}
                  </h1>

                  {/* Brand link */}
                  <div className="text-xs text-gray-500 mb-3">
                    Brand: <Link to={`/products?brand=${encodeURIComponent(product.vendor)}`} className="text-blue-500 hover:underline">{product.vendor}</Link> | <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="text-blue-500 hover:underline">Similar products from {product.vendor}</Link>
                  </div>

                  {/* Ratings */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(product.rating || 4) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-blue-500 hover:underline cursor-pointer">
                      ({product.reviews || 12} verified ratings)
                    </span>
                  </div>

                  {/* Flash Sales Banner (If discounted) */}
                  {discountPct > 0 && (
                    <div className="bg-[#DC143C] text-white px-3 py-2 flex items-center justify-between rounded-sm mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        ⚡ Flash Sales
                      </span>
                      <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-sm">
                        Starts on: 18 Jul, 10:00am
                      </span>
                    </div>
                  )}

                  {/* Price Section */}
                  <div className="border-b border-gray-100 pb-4 mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-gray-900">
                        GH₵ {product.price.toLocaleString()}
                      </span>
                      {product.original_price && (
                        <>
                          <span className="text-sm text-gray-400 line-through font-medium">
                            GH₵ {product.original_price.toLocaleString()}
                          </span>
                          <span className="bg-orange-50 text-[#FF5500] text-xs font-bold px-1.5 py-0.5">
                            -{discountPct}%
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-[#FF5500] font-black mt-1">
                      {product.stock <= 5 ? "Few units left" : "In Stock"}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
                      <Info className="w-3 h-3 text-gray-400" />
                      Need advice or assistance to place an order? Contact us at <span className="font-bold text-gray-900">0302740642</span>
                    </p>
                  </div>

                  {/* Variation selection */}
                  <div className="mb-6">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      Variation Available
                    </span>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 border border-[#FF5500] text-[#FF5500] bg-orange-50 text-xs font-bold rounded-sm">
                        Default
                      </button>
                      <button className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium hover:border-gray-400 rounded-sm">
                        Standard Pack
                      </button>
                    </div>
                  </div>

                  {/* Quantity & Add to Cart button */}
                  <div className="flex gap-3 mt-auto">
                    <div className="flex items-center border border-gray-300 rounded-sm h-12">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className="px-3 h-full hover:bg-gray-50 transition-colors disabled:opacity-40"
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-gray-800">{quantity}</span>
                      <button
                        onClick={incrementQuantity}
                        disabled={quantity >= product.stock}
                        className="px-3 h-full hover:bg-gray-50 transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={product.stock === 0}
                      className="flex-1 h-12 bg-[#FF5500] hover:bg-[#e54a00] disabled:bg-gray-300 text-white font-bold text-sm uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 transition-all"
                    >
                      <ShoppingCart className="w-4 h-4 text-white" />
                      Add to Cart
                    </button>
                  </div>

                </div>
              </div>

              {/* Product description area */}
              <div className="border-t border-gray-100 mt-8 pt-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">Product Details</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6">
                  {product.description}
                </p>
                {productFeatures.length > 0 && (
                  <>
                    <h4 className="text-xs font-bold text-gray-800 uppercase mb-2">Key Features</h4>
                    <ul className="list-disc pl-4 space-y-1.5 mb-4">
                      {productFeatures.map((feat, i) => (
                        <li key={i} className="text-xs text-gray-600">{feat}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Sidebar (Delivery options + Seller Info) */}
            <div className="space-y-3">
              
              {/* Card A: Delivery & Returns */}
              <div className="bg-white shadow-sm rounded-none p-3">
                <h3 className="text-xs font-bold text-gray-900 uppercase border-b border-gray-100 pb-2 mb-3">
                  Delivery & Returns
                </h3>

                <div className="flex items-start gap-2 mb-4">
                  <div className="w-7 h-7 bg-orange-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Truck className="w-3.5 h-3.5 text-[#FF5500]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1">
                      Unimall Express
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      Enjoy fast delivery in main campus sectors.
                    </p>
                  </div>
                </div>

                {/* Location Selectors */}
                <div className="space-y-2 border-t border-gray-100 pt-3 mb-4">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Choose your location
                  </span>
                  
                  <div className="relative">
                    <select
                      value={selectedRegion}
                      onChange={(e) => handleRegionChange(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-sm appearance-none outline-none focus:border-[#FF5500] cursor-pointer"
                    >
                      {regions.map(r => (
                        <option key={r.name} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-sm appearance-none outline-none focus:border-[#FF5500] cursor-pointer"
                    >
                      {regions.find(r => r.name === selectedRegion)?.cities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Logistics details list */}
                <div className="space-y-3.5 border-t border-gray-100 pt-3">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Truck className="w-3 h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-xs font-bold text-gray-900">Door Delivery</span>
                        <span className="text-xs font-black text-gray-800">GH₵ 35</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-snug mt-0.5">
                        Ready for delivery between <span className="font-bold text-gray-800">{getDeliveryDateRange()}</span> if you place order today.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 border-t border-gray-50 pt-3">
                    <div className="w-5 h-5 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <RotateCcw className="w-3 h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-xs font-bold text-gray-900">Return Policy</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-snug mt-0.5">
                        Free return within 15 days for all eligible items. <span className="text-blue-500 cursor-pointer hover:underline">Details</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card B: Seller Information */}
              <div className="bg-white shadow-sm rounded-none p-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase">
                    Seller Information
                  </h3>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>

                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-xs font-black text-gray-900 truncate max-w-[120px]">
                      {product.vendor}
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">96% Seller Score</p>
                    <p className="text-[10px] text-gray-500">951 Followers</p>
                  </div>
                  <button className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold text-[10px] px-3 py-1.5 uppercase rounded-sm transition-colors shrink-0">
                    Follow
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Shipping speed:</span>
                    <span className="font-bold text-green-600">Excellent</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Quality score:</span>
                    <span className="font-bold text-green-600">Excellent</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* SPONSORED PRODUCTS GRID */}
          {sponsoredProducts.length > 0 && (
            <div className="bg-white shadow-sm rounded-none mt-4 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm md:text-base font-black text-gray-900 uppercase">
                  Sponsored Products
                </h2>
              </div>
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {sponsoredProducts
                  .filter((p: any) => p.id !== product.id)
                  .slice(0, 6)
                  .map((p: any) => (
                    <Link
                      key={p.id}
                      to={`/products/${p.id}`}
                      className="group flex flex-col bg-white overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100 p-2"
                    >
                      <div className="relative aspect-square overflow-hidden bg-gray-50 p-1 mb-2">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <h4 className="text-xs text-gray-700 line-clamp-1 font-medium mb-1">{p.name}</h4>
                      <p className="text-xs font-black text-gray-900">GH₵ {p.price.toLocaleString()}</p>
                    </Link>
                  ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
