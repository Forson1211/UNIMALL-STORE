import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SearchDialog } from "@/components/search/SearchDialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Vendors from "./pages/Vendors";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Faqs from "./pages/Faqs";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminSettings from "./pages/admin/AdminSettings";
import SiteCustomization from "./pages/admin/SiteCustomization";
import ContentManagement from "./pages/admin/ContentManagement";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminDeals from "./pages/admin/AdminDeals";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";
import AdminNotifications from "./pages/admin/AdminNotifications";



// Vendor Pages
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorSettings from "./pages/vendor/VendorSettings";
import VendorCoupons from "./pages/vendor/VendorCoupons";
import VendorReviews from "./pages/vendor/VendorReviews";
import VendorNotifications from "./pages/vendor/VendorNotifications";

// Buyer Account Pages
import BuyerAccount from "./pages/account/BuyerAccount";
import BuyerOrders from "./pages/account/BuyerOrders";
import BuyerWishlist from "./pages/account/BuyerWishlist";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes (data considers fresh for 5 mins)
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (keep unused data in cache)
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SiteSettingsProvider>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <SearchProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <CartDrawer />
                  <SearchDialog />
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/vendors" element={<Vendors />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/news/:id" element={<NewsDetail />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/faqs" element={<Faqs />} />

                    {/* Buyer Account Routes - Protected for authenticated users */}
                    <Route path="/account" element={
                      <ProtectedRoute>
                        <BuyerAccount />
                      </ProtectedRoute>
                    } />
                    <Route path="/account/orders" element={
                      <ProtectedRoute>
                        <BuyerOrders />
                      </ProtectedRoute>
                    } />
                    <Route path="/account/wishlist" element={
                      <ProtectedRoute>
                        <BuyerWishlist />
                      </ProtectedRoute>
                    } />

                    {/* Admin Routes - Protected for staff roles  */}
                    <Route path="/admin" element={
                      <ProtectedRoute allowedRoles={["admin", "moderator", "vendor_manager", "order_manager", "content_manager", "support_agent"]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                      <ProtectedRoute allowedRoles={["admin", "support_agent", "moderator"]}>
                        <AdminUsers />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/vendors" element={
                      <ProtectedRoute allowedRoles={["admin", "vendor_manager", "moderator", "support_agent"]}>
                        <AdminVendors />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/products" element={
                      <ProtectedRoute allowedRoles={["admin", "vendor_manager", "moderator", "support_agent"]}>
                        <AdminProducts />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/orders" element={
                      <ProtectedRoute allowedRoles={["admin", "order_manager"]}>
                        <AdminOrders />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/settings" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminSettings />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/site-customization" element={
                      <ProtectedRoute allowedRoles={["admin", "content_manager"]}>
                        <SiteCustomization />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/content" element={
                      <ProtectedRoute allowedRoles={["admin", "content_manager"]}>
                        <ContentManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/notifications" element={
                      <ProtectedRoute allowedRoles={["admin", "support_agent", "content_manager"]}>
                        <AdminNotifications />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/transactions" element={
                      <ProtectedRoute allowedRoles={["admin", "order_manager"]}>
                        <AdminTransactions />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/reviews" element={
                      <ProtectedRoute allowedRoles={["admin", "moderator", "content_manager"]}>
                        <AdminReviews />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/coupons" element={
                      <ProtectedRoute allowedRoles={["admin", "content_manager"]}>
                        <AdminCoupons />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/deals" element={
                      <ProtectedRoute allowedRoles={["admin", "vendor_manager", "content_manager"]}>
                        <AdminDeals />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/messages" element={
                      <ProtectedRoute allowedRoles={["admin", "support_agent"]}>
                        <AdminMessages />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/support" element={
                      <ProtectedRoute allowedRoles={["admin", "support_agent"]}>
                        <AdminSupport />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/logs" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminLogs />
                      </ProtectedRoute>
                    } />

                    {/* Vendor Routes - Protected for vendor role only */}
                    <Route path="/vendor" element={
                      <ProtectedRoute allowedRoles={["vendor"]}>
                        <VendorDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/vendor/products" element={
                      <ProtectedRoute allowedRoles={["vendor"]}>
                        <VendorProducts />
                      </ProtectedRoute>
                    } />
                    <Route path="/vendor/orders" element={
                      <ProtectedRoute allowedRoles={["vendor"]}>
                        <VendorOrders />
                      </ProtectedRoute>
                    } />
                    <Route path="/vendor/coupons" element={
                      <ProtectedRoute allowedRoles={["vendor"]}>
                        <VendorCoupons />
                      </ProtectedRoute>
                    } />
                    <Route path="/vendor/reviews" element={
                      <ProtectedRoute allowedRoles={["vendor"]}>
                        <VendorReviews />
                      </ProtectedRoute>
                    } />
                    <Route path="/vendor/notifications" element={
                      <ProtectedRoute allowedRoles={["vendor"]}>
                        <VendorNotifications />
                      </ProtectedRoute>
                    } />
                    <Route path="/vendor/settings" element={
                      <ProtectedRoute allowedRoles={["vendor"]}>
                        <VendorSettings />
                      </ProtectedRoute>
                    } />

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </TooltipProvider>
              </SearchProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </SiteSettingsProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
