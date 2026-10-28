import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SearchDialog } from "@/components/search/SearchDialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import PageTransition from "@/components/PageTransition";
import BottomTabBar from "@/components/layout/BottomTabBar";
import CampusChatbot from "@/components/chat/CampusChatbot";
import GlobalSiteLoader from "@/components/common/GlobalSiteLoader";

const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Vendors = lazy(() => import("./pages/Vendors"));
const VendorStore = lazy(() => import("./pages/VendorStore"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const About = lazy(() => import("./pages/About"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Contact = lazy(() => import("./pages/Contact"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Cart = lazy(() => import("./pages/Cart"));
const PasswordRecovery = lazy(() => import("./pages/PasswordRecovery"));
const ContentPage = lazy(() => import("./pages/ContentPage"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Faqs = lazy(() => import("./pages/Faqs"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const CommerceAnalytics = lazy(() => import("./pages/CommerceAnalytics"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminVendors = lazy(() => import("./pages/admin/AdminVendors"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const SiteCustomization = lazy(() => import("./pages/admin/SiteCustomization"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const AdminTransactions = lazy(() => import("./pages/admin/AdminTransactions"));
const AdminPayouts = lazy(() => import("./pages/admin/AdminPayouts"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminDeals = lazy(() => import("./pages/admin/AdminDeals"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));



// Vendor Pages
const VendorDashboard = lazy(() => import("./pages/vendor/VendorDashboard"));
const VendorProducts = lazy(() => import("./pages/vendor/VendorProducts"));
const VendorOrders = lazy(() => import("./pages/vendor/VendorOrders"));
const VendorSettings = lazy(() => import("./pages/vendor/VendorSettings"));
const VendorCoupons = lazy(() => import("./pages/vendor/VendorCoupons"));
const VendorReviews = lazy(() => import("./pages/vendor/VendorReviews"));
const VendorNotifications = lazy(() => import("./pages/vendor/VendorNotifications"));
const VendorProfile = lazy(() => import("./pages/vendor/VendorProfile"));
const VendorFeaturePage = lazy(() => import("./pages/vendor/VendorFeaturePage"));

// Buyer Account Pages
const BuyerAccount = lazy(() => import("./pages/account/BuyerAccount"));
const BuyerOrders = lazy(() => import("./pages/account/BuyerOrders"));
const BuyerWishlist = lazy(() => import("./pages/account/BuyerWishlist"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes (data considers fresh for 5 mins)
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (keep unused data in cache)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: 1,
    },
  },
});

function MarketplaceChatbot() {
  const { pathname } = useLocation();
  return /^\/(?:admin|vendor|login|signup|forgot-password|reset-password)(?:\/|$)/.test(pathname) ? null : <CampusChatbot />;
}

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
                  <ScrollToTop />
                  <GlobalSiteLoader />
                  <Suspense fallback={<div role="status" className="min-h-screen flex items-center justify-center text-muted-foreground">Loading page...</div>}>
                  <PageTransition>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/vendors" element={<Vendors />} />
                    <Route path="/vendors/:id" element={<VendorStore />} />
                    <Route path="/vendor/:id" element={<VendorStore />} />
                    <Route path="/vendor/store/:id" element={<VendorStore />} />
                    <Route path="/store/:id" element={<VendorStore />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<PasswordRecovery />} />
                    <Route path="/reset-password" element={<PasswordRecovery reset />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/pages/:slug" element={<ContentPage />} />
                    <Route path="/about" element={<ContentPage slug="about" fallback={<About />} />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                    <Route path="/news" element={<News />} />
                    <Route path="/news/:id" element={<NewsDetail />} />
                    <Route path="/privacy" element={<ContentPage slug="privacy" fallback={<Privacy />} />} />
                    <Route path="/terms" element={<ContentPage slug="terms" fallback={<Terms />} />} />
                    <Route path="/faqs" element={<ContentPage slug="faqs" fallback={<Faqs />} />} />

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
                    <Route path="/admin/analytics" element={
                      <ProtectedRoute allowedRoles={["admin", "order_manager"]}>
                        <CommerceAnalytics scope="admin" />
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
                    <Route path="/admin/payouts" element={
                      <ProtectedRoute allowedRoles={["admin", "order_manager"]}>
                        <AdminPayouts />
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
                    <Route path="/vendor/catalog-health" element={
                      <ProtectedRoute allowedRoles={["vendor"]}>
                        <VendorFeaturePage feature="catalog" />
                      </ProtectedRoute>
                    } />
                    <Route path="/vendor/sales-insights" element={
                      <ProtectedRoute allowedRoles={["vendor"]}>
                        <CommerceAnalytics scope="vendor" />
                      </ProtectedRoute>
                    } />
                    <Route path="/vendor/inventory" element={
                      <ProtectedRoute allowedRoles={["vendor"]}>
                        <VendorFeaturePage feature="inventory" />
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
                    <Route path="/vendor/profile" element={
                      <ProtectedRoute allowedRoles={["vendor"]}>
                        <VendorProfile />
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
                  </PageTransition>
                  </Suspense>
                  <BottomTabBar />
                  <MarketplaceChatbot />
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
