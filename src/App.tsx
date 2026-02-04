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
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import SiteCustomization from "./pages/admin/SiteCustomization";
import ContentManagement from "./pages/admin/ContentManagement";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";
import AdminNotifications from "./pages/admin/AdminNotifications";



// Vendor Pages
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorAnalytics from "./pages/vendor/VendorAnalytics";
import VendorSettings from "./pages/vendor/VendorSettings";

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

                    {/* Admin Routes - Protected for admin role only */}
                    <Route path="/admin" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminUsers />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/vendors" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminVendors />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/products" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminProducts />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/orders" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminOrders />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/analytics" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminAnalytics />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/settings" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminSettings />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/site-customization" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <SiteCustomization />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/content" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <ContentManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/notifications" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminNotifications />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/transactions" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminTransactions />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/reviews" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminReviews />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/coupons" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminCoupons />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/messages" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminMessages />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/support" element={
                      <ProtectedRoute allowedRoles={["admin"]}>
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
                    <Route path="/vendor/analytics" element={
                      <ProtectedRoute allowedRoles={["vendor"]}>
                        <VendorAnalytics />
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
