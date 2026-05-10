import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, ShoppingBag, Globe, Menu, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/useProfile";
import SearchDialog from "./SearchDialog";
import CartDrawer from "./CartDrawer";

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ar", label: "العربية", flag: "🇪🇬" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

const Header = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signIn, signUp, signInWithGoogle, signInWithFacebook, signInWithTwitter, signOut } = useAuth();
  const { totalItems } = useCart();
  const { wishlist } = useWishlist();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { profile } = useProfile();

  const navItems = [
    { label: t("shopAll"), path: "/best-sellers" },
    { label: t("bestsellers"), path: "/best-sellers" },
    { label: t("aboutUs"), path: "/about-us" },
    { label: t("blog"), path: "/blog" },
    ...(isAdmin ? [{ label: t("dashboard"), path: "/dashboard" }] : []),
  ];

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: t("error"), description: t("invalidCredentials"), variant: "destructive" });
      console.warn("Sign in failed");
    } else {
      toast({ title: t("welcomeBack"), description: t("signedInSuccess") });
      setIsAuthOpen(false);
      resetForm();
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      toast({ title: t("error"), description: t("invalidCredentials"), variant: "destructive" });
      console.warn("Sign up failed");
    } else {
      toast({ title: t("welcome"), description: t("accountCreated") });
      setIsAuthOpen(false);
      resetForm();
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: t("signedOut"), description: t("seeYouSoon") });
    navigate("/");
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
  };

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "";

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex h-16 md:h-20 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <h1 className="text-xl md:text-2xl font-bold">
                <span className="text-primary">Eva</span>
                <span className="text-foreground"> Cosmetics</span>
              </h1>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-10">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors whitespace-nowrap"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary h-9 w-9">
                    <Globe className="h-[18px] w-[18px]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[160px]">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`gap-2 ${language === lang.code ? "bg-primary/10 text-primary font-semibold" : ""}`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      {lang.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary h-9 w-9" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-[18px] w-[18px]" />
              </Button>

              {user && (
                <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary relative h-9 w-9" onClick={() => navigate("/wishlist")}>
                  <Heart className={`h-[18px] w-[18px] ${wishlist.length > 0 ? "fill-primary text-primary" : ""}`} />
                  {wishlist.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">{wishlist.length}</Badge>
                  )}
                </Button>
              )}

              {user ? (
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 px-1 py-1 rounded-full hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={firstName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {firstName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground hidden sm:inline">{firstName}</span>
                </button>
              ) : (
                <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary h-9 w-9">
                      <User className="h-[18px] w-[18px]" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-center">{t("welcome")}</DialogTitle>
                      <DialogDescription className="text-center">{t("signInOrCreate")}</DialogDescription>
                    </DialogHeader>
                    <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">{t("login")}</TabsTrigger>
                        <TabsTrigger value="signup">{t("signUp")}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="login" className="space-y-4 mt-6">
                        <div className="space-y-2">
                          <Label htmlFor="email">{t("email")}</Label>
                          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">{t("password")}</Label>
                          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                        <Button className="w-full" size="lg" onClick={handleSignIn} disabled={loading}>{loading ? t("signingIn") : t("signIn")}</Button>
                        
                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">{t("orContinueWith")}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <Button variant="outline" onClick={() => signInWithGoogle()} className="w-full">
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          </Button>
                          <Button variant="outline" onClick={() => signInWithFacebook()} className="w-full">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </Button>
                          <Button variant="outline" onClick={() => signInWithTwitter()} className="w-full">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </Button>
                        </div>
                      </TabsContent>
                      <TabsContent value="signup" className="space-y-4 mt-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t("fullName")}</Label>
                          <Input id="name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">{t("email")}</Label>
                          <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">{t("password")}</Label>
                          <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                        <Button className="w-full" size="lg" onClick={handleSignUp} disabled={loading}>{loading ? t("creating") : t("createAccount")}</Button>
                        
                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">{t("orContinueWith")}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <Button variant="outline" onClick={() => signInWithGoogle()} className="w-full">
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          </Button>
                          <Button variant="outline" onClick={() => signInWithFacebook()} className="w-full">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </Button>
                          <Button variant="outline" onClick={() => signInWithTwitter()} className="w-full">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              )}

              <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary relative h-9 w-9" onClick={() => setIsCartOpen(true)}>
                <ShoppingBag className="h-[18px] w-[18px]" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">{totalItems}</Badge>
                )}
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-foreground/80 hover:text-primary h-9 w-9"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background/98 backdrop-blur animate-in slide-in-from-top-2 duration-200">
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                  className="block w-full text-start py-3 px-4 text-base font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                >
                  {item.label}
                </button>
              ))}
              {user && (
                <>
                  <button
                    onClick={() => { navigate("/wishlist"); setIsMobileMenuOpen(false); }}
                    className="block w-full text-start py-3 px-4 text-base font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                  >
                    ❤️ {t("wishlist")}
                  </button>
                  <button
                    onClick={() => { navigate("/profile"); setIsMobileMenuOpen(false); }}
                    className="block w-full text-start py-3 px-4 text-base font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                  >
                    {t("myProfile")}
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
};

export default Header;
