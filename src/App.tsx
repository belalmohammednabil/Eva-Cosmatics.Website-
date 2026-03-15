import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import ScrollToTop from "./components/ScrollToTop";
import AIDermatologist from "./components/AIDermatologist";
import Index from "./pages/Index";
import BestSellers from "./pages/BestSellers";
import AboutUs from "./pages/AboutUs";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Wishlist from "./pages/Wishlist";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            <WishlistProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <AIDermatologist />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/best-sellers" element={<BestSellers />} />
                  <Route path="/product/:productId" element={<ProductDetail />} />
                  <Route path="/about-us" element={<AboutUs />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:articleId" element={<BlogArticle />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </WishlistProvider>
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
