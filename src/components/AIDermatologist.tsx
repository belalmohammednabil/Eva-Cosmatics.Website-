import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCart } from "@/contexts/CartContext";
import { resolveProductImage, translateProductName, translateProductDescription } from "@/lib/productImages";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  X, Send, Stethoscope, Loader2, ShieldCheck, ExternalLink,
  AlertCircle, User, Sparkles, ShoppingCart, LogIn, UserCog,
} from "lucide-react";

interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
  description: string | null;
  skin_type: string | null;
  category: string | null;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  stage?: "questioning" | "diagnosis" | "recommendation" | "checkout";
  warnings?: string[];
  products?: RecommendedProduct[];
}

const labels = {
  title: { en: "Dr. Eva", ar: "د. إيڤا", fr: "Dr. Eva", es: "Dra. Eva", tr: "Dr. Eva" },
  subtitle: {
    en: "Professional Skincare Consultation",
    ar: "استشارة طبية متخصصة للعناية بالبشرة",
    fr: "Consultation Dermatologique Professionnelle",
    es: "Consulta Dermatológica Profesional",
    tr: "Profesyonel Cilt Bakım Konsültasyonu",
  },
  greeting: {
    en: "Hello, I'm Dr. Eva. Tell me about your skin concern — I'll ask a few questions and recommend a personalized treatment from Eva Cosmetics.",
    ar: "أهلاً بك، أنا د. إيڤا. احكيلي عن مشكلة بشرتك — هسألك كام سؤال وأوصيلك بعلاج مخصص من Eva Cosmetics.",
    fr: "Bonjour, je suis le Dr. Eva. Parlez-moi de votre problème de peau — je poserai quelques questions et recommanderai un traitement personnalisé.",
    es: "Hola, soy la Dra. Eva. Cuéntame tu problema de piel — te haré preguntas y recomendaré un tratamiento personalizado.",
    tr: "Merhaba, ben Dr. Eva. Cilt sorununuzu anlatın — birkaç soru sorup kişiselleştirilmiş bir tedavi önereceğim.",
  },
  placeholder: {
    en: "Describe your skin concern...",
    ar: "اوصف مشكلة بشرتك...",
    fr: "Décrivez votre problème de peau...",
    es: "Describe tu problema...",
    tr: "Cilt sorununuzu tarif edin...",
  },
  prescribed: { en: "Recommended for you", ar: "موصى به لك", fr: "Recommandé pour vous", es: "Recomendado", tr: "Sizin için önerilen" },
  warnings: { en: "Precautions", ar: "تحذيرات", fr: "Précautions", es: "Precauciones", tr: "Önlemler" },
  addToCart: { en: "Add to Cart", ar: "أضف للسلة", fr: "Ajouter", es: "Añadir", tr: "Sepete Ekle" },
  view: { en: "View", ar: "عرض", fr: "Voir", es: "Ver", tr: "Görüntüle" },
  thinking: { en: "Dr. Eva is analyzing...", ar: "د. إيڤا تحلل حالتك...", fr: "Analyse en cours...", es: "Analizando...", tr: "Analiz ediliyor..." },
  disclaimer: {
    en: "Informational only. Consult a licensed dermatologist for serious conditions.",
    ar: "للإرشاد فقط. للحالات الجدية راجع طبيب جلدية مرخص.",
    fr: "Informatif uniquement. Consultez un dermatologue pour les cas graves.",
    es: "Solo informativo. Consulta a un dermatólogo para casos graves.",
    tr: "Sadece bilgilendirme. Ciddi durumlar için dermatoloğa başvurun.",
  },
  loginRequired: {
    en: "Please sign in to place an order",
    ar: "سجل دخول لتقدر تطلب",
    fr: "Connectez-vous pour commander",
    es: "Inicia sesión para pedir",
    tr: "Sipariş için giriş yapın",
  },
  profileIncomplete: {
    en: "Complete your profile (phone & address) before ordering",
    ar: "أكمل بياناتك (تليفون وعنوان) قبل الطلب",
    fr: "Complétez votre profil (téléphone & adresse)",
    es: "Completa tu perfil (teléfono y dirección)",
    tr: "Profilinizi tamamlayın (telefon ve adres)",
  },
  signIn: { en: "Sign In", ar: "تسجيل الدخول", fr: "Connexion", es: "Iniciar sesión", tr: "Giriş Yap" },
  goProfile: { en: "Update Profile", ar: "تحديث الملف الشخصي", fr: "Modifier Profil", es: "Editar Perfil", tr: "Profili Güncelle" },
};

const AIDermatologist = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRTL = language === "ar";
  const lang = language as keyof typeof labels.title;
  const t = (key: keyof typeof labels) => labels[key][lang] || labels[key].en;

  const profileComplete = !!(user && profile?.phone?.trim() && profile?.address?.trim());

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ id: "greet", role: "assistant", content: t("greeting"), stage: "questioning" }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      // Send only role+content to AI
      const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("dr-eva-chat", {
        body: {
          messages: apiMessages,
          language,
          userProfile: user
            ? { full_name: profile?.full_name, phone: profile?.phone, address: profile?.address }
            : null,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Dr. Eva", description: data.error, variant: "destructive" });
        setIsTyping(false);
        return;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "...",
        stage: data.stage,
        warnings: data.warnings || [],
        products: data.recommendedProducts || [],
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error("Dr. Eva error:", err);
      toast({
        title: "Connection error",
        description: err?.message || "Could not reach Dr. Eva",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddToCart = (p: RecommendedProduct) => {
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      image: resolveProductImage(p.image),
    });
    toast({ title: "✓", description: `${p.name} added to cart` });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 ${isRTL ? "left-6" : "right-6"} z-50 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
        aria-label="Open Dr. Eva"
      >
        <Stethoscope className="h-5 w-5" />
        <span className="font-medium hidden sm:inline">{t("title")}</span>
      </button>

      <div
        dir={isRTL ? "rtl" : "ltr"}
        className={`fixed bottom-0 ${isRTL ? "left-0 sm:left-6" : "right-0 sm:right-6"} sm:bottom-6 z-50 w-full sm:w-[420px] h-[100dvh] sm:h-[640px] sm:max-h-[85vh] bg-card border border-border sm:rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-full sm:translate-y-8 opacity-0 pointer-events-none"}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 sm:rounded-t-2xl flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-primary-foreground/30">
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                <Stethoscope className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <span className={`absolute bottom-0 ${isRTL ? "left-0" : "right-0"} h-3 w-3 bg-green-400 rounded-full border-2 border-primary`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{t("title")}</h3>
            <p className="text-xs opacity-90 truncate">{t("subtitle")}</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-primary-foreground/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id}>
                {m.role === "user" ? (
                  <div className={`flex ${isRTL ? "justify-start" : "justify-end"}`}>
                    <div className={`flex items-start gap-2 max-w-[85%] ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className={`bg-primary text-primary-foreground rounded-2xl ${isRTL ? "rounded-bl-md" : "rounded-br-md"} px-4 py-2`}>
                        <p className="text-sm whitespace-pre-line">{m.content}</p>
                      </div>
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                ) : (
                  <div className={`flex ${isRTL ? "justify-end" : "justify-start"}`}>
                    <div className={`flex items-start gap-2 w-full max-w-[95%] ${isRTL ? "flex-row-reverse" : ""}`}>
                      <Avatar className="h-8 w-8 flex-shrink-0 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Stethoscope className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className={`bg-secondary text-secondary-foreground rounded-2xl ${isRTL ? "rounded-br-md" : "rounded-bl-md"} px-4 py-3`}>
                          <p className="text-sm whitespace-pre-line leading-relaxed">{m.content}</p>
                        </div>

                        {m.products && m.products.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                              <Sparkles className="h-3 w-3" />
                              {t("prescribed")}
                            </div>
                            <div className="grid gap-2">
                              {m.products.map((p) => (
                                <Card key={p.id} className="p-3 hover:shadow-md transition-shadow">
                                  <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                                    <img
                                      src={resolveProductImage(p.image)}
                                      alt={translateProductName(p.name, language)}
                                      className="w-16 h-16 object-contain rounded-lg bg-secondary/50 flex-shrink-0"
                                    />
                                    <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
                                      <h4 className="font-medium text-sm truncate">{translateProductName(p.name, language)}</h4>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                        {translateProductDescription(p.description, p.name, language)}
                                      </p>
                                      <div className={`flex items-center justify-between mt-2 gap-2 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                                        <span className="font-bold text-primary">${p.price.toFixed(2)}</span>
                                        <div className="flex gap-1">
                                          <Link to={`/product/${p.id}`}>
                                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                              {t("view")}
                                              <ExternalLink className="h-3 w-3" />
                                            </Button>
                                          </Link>
                                          <Button
                                            size="sm"
                                            className="h-7 text-xs gap-1"
                                            onClick={() => handleAddToCart(p)}
                                          >
                                            <ShoppingCart className="h-3 w-3" />
                                            {t("addToCart")}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {m.warnings && m.warnings.length > 0 && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
                              <AlertCircle className="h-3 w-3" />
                              {t("warnings")}
                            </div>
                            <ul className={`text-xs text-amber-800 dark:text-amber-300 space-y-1 ${isRTL ? "pr-2" : "pl-2"}`}>
                              {m.warnings.map((w, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                                  <span>{w}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Checkout gate */}
                        {(m.stage === "recommendation" || m.stage === "checkout") && m.products && m.products.length > 0 && (
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                            {!user ? (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs text-foreground">
                                  <ShieldCheck className="h-4 w-4 text-primary" />
                                  <span>{t("loginRequired")}</span>
                                </div>
                                <Link to="/auth">
                                  <Button size="sm" className="h-7 text-xs gap-1">
                                    <LogIn className="h-3 w-3" /> {t("signIn")}
                                  </Button>
                                </Link>
                              </div>
                            ) : !profileComplete ? (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs text-foreground">
                                  <UserCog className="h-4 w-4 text-primary" />
                                  <span>{t("profileIncomplete")}</span>
                                </div>
                                <Link to="/profile">
                                  <Button size="sm" className="h-7 text-xs gap-1">
                                    <UserCog className="h-3 w-3" /> {t("goProfile")}
                                  </Button>
                                </Link>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-primary font-medium">
                                <ShieldCheck className="h-4 w-4" />
                                <span>{lang === "ar" ? "بياناتك مكتملة — جاهز للطلب ✓" : "Profile complete — ready to order ✓"}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className={`flex ${isRTL ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-start gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Stethoscope className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className={`bg-secondary text-secondary-foreground rounded-2xl ${isRTL ? "rounded-br-md" : "rounded-bl-md"} px-4 py-3 flex items-center gap-2`}>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{t("thinking")}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t("placeholder")}
              className="flex-1"
              disabled={isTyping}
              dir={isRTL ? "rtl" : "ltr"}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="icon">
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">{t("disclaimer")}</p>
        </div>
      </div>
    </>
  );
};

export default AIDermatologist;
