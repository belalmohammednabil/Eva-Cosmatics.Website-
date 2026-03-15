import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { resolveProductImage, translateProductName, translateProductDescription } from "@/lib/productImages";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  X,
  Send,
  Stethoscope,
  Loader2,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  AlertCircle,
  ChevronDown,
  User,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// COMPREHENSIVE SKINCARE KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────

interface SkinCondition {
  keywords: string[];
  response: string;
  recommendedProducts: string[];
  sideEffects?: string[];
  usage?: string;
  doctorNote?: string;
}

const skinConditions: Record<string, SkinCondition> = {
  acne: {
    keywords: ["acne", "pimple", "pimples", "breakout", "breakouts", "zit", "zits", "blemish", "blemishes", "حب الشباب", "بثور", "acné", "boutons", "espinillas", "sivilce"],
    response: "Based on your concern about acne, I recommend a targeted approach combining gentle cleansing with pore-clearing treatments. Acne occurs when pores become clogged with oil and dead skin cells.",
    recommendedProducts: ["Pore Clearing Clay Mask 2X", "Lychee Soda Bubble Cleanser", "Gentle Exfoliating Toner"],
    sideEffects: ["Initial purging may occur for 2-4 weeks", "Slight dryness is normal - use a light moisturizer", "Sun sensitivity may increase - always use SPF"],
    usage: "Use the clay mask 2-3 times per week. Cleanse morning and evening with the bubble cleanser. Apply toner after cleansing.",
    doctorNote: "If acne persists after 8 weeks of consistent use, or if you experience cystic acne, please consult a board-certified dermatologist for prescription options.",
  },
  dryness: {
    keywords: ["dry", "dryness", "dehydrated", "flaky", "tight", "rough", "جفاف", "جافة", "sécheresse", "peau sèche", "sequedad", "kuru", "kuruluk"],
    response: "For dry and dehydrated skin, deep hydration is essential. Your skin barrier may be compromised, which leads to moisture loss. I recommend layering hydrating products.",
    recommendedProducts: ["Super Aqua Cream", "Anti-Ageing Hyaluronic Acid Face Serum", "Dewy Glow Jelly Cream", "Rice Sheet Mask"],
    sideEffects: ["Hyaluronic acid may feel sticky initially - this is normal", "Apply on damp skin for best absorption", "No significant side effects expected"],
    usage: "Apply serum on damp skin, follow with cream. Use sheet mask 2-3 times weekly for intensive hydration.",
    doctorNote: "Persistent dryness despite proper skincare may indicate an underlying condition like eczema. If irritation or cracking occurs, consult a dermatologist.",
  },
  oily: {
    keywords: ["oily", "greasy", "shiny", "excess oil", "sebum", "دهنية", "زيتية", "grasse", "brillante", "grasa", "yağlı"],
    response: "Oily skin requires balancing hydration without adding excess oil. Over-stripping can actually cause more oil production, so gentle cleansing is key.",
    recommendedProducts: ["Clarifying Emulsion", "Pore Clearing Clay Mask 2X", "Matte Priming UV Shield Sunscreen SPF 37", "Gentle Exfoliating Toner"],
    sideEffects: ["Clay mask may cause temporary tightness - follow with moisturizer", "Avoid over-exfoliating which can trigger more oil production"],
    usage: "Cleanse twice daily, use clay mask 2-3 times weekly, apply matte sunscreen as final step in morning routine.",
    doctorNote: "If oiliness is accompanied by hormonal acne, consider consulting with a dermatologist about hormonal treatments.",
  },
  aging: {
    keywords: ["aging", "anti-aging", "wrinkle", "wrinkles", "fine lines", "sagging", "mature", "شيخوخة", "تجاعيد", "anti-âge", "rides", "arrugas", "yaşlanma", "kırışıklık"],
    response: "For anti-aging concerns, a combination of hydration, antioxidants, and sun protection is crucial. Consistent use is key for visible results.",
    recommendedProducts: ["Anti-Ageing Hyaluronic Acid Face Serum", "Skin Reinforcement Get Type Cream", "Soft Finish Sun Milk SPF50+/PA+++", "Fermented Soybean Bio Cellulose Mask"],
    sideEffects: ["Some active ingredients may cause initial sensitivity", "Start with lower frequency and build up", "Always patch test new products"],
    usage: "Apply serum morning and night, use reinforcement cream at night, sunscreen is mandatory during the day. Use bio cellulose mask weekly.",
    doctorNote: "For more pronounced wrinkles or sagging, professional treatments like retinoids, botox, or fillers may be discussed with a certified dermatologist.",
  },
  sensitive: {
    keywords: ["sensitive", "irritated", "redness", "reactive", "burning", "stinging", "حساسة", "احمرار", "sensible", "irritée", "sensible", "hassas", "kızarıklık"],
    response: "Sensitive skin requires gentle, fragrance-free products. Building up your skin barrier is essential. Avoid over-exfoliating and introduce new products slowly.",
    recommendedProducts: ["Clarifying Emulsion", "Rice Sheet Mask", "Dewy Glow Jelly Cream", "All-Around Safe Block Essence Sun SPF45+"],
    sideEffects: ["Always patch test new products on inner arm first", "Introduce one new product at a time, waiting 2 weeks between each"],
    usage: "Use gentle cleanser, apply calming products, minimal active ingredients. Sunscreen is essential as sensitive skin is more prone to UV damage.",
    doctorNote: "If you experience persistent redness, burning, or rash, discontinue all products and consult a dermatologist. You may have rosacea or contact dermatitis.",
  },
  sunProtection: {
    keywords: ["sun", "sunscreen", "spf", "uv", "protection", "tanning", "sunburn", "شمس", "واقي", "solaire", "protección solar", "güneş"],
    response: "Sun protection is the most important step in any skincare routine. UV damage causes 80% of visible skin aging and increases skin cancer risk.",
    recommendedProducts: ["Soft Finish Sun Milk SPF50+/PA+++", "Matte Priming UV Shield Sunscreen SPF 37", "All-Around Safe Block Essence Sun SPF45+"],
    sideEffects: ["Some sunscreens may leave a white cast - mineral sunscreens are more likely to do this", "Reapply every 2 hours when outdoors"],
    usage: "Apply sunscreen as the last step of morning skincare. Use 2 finger-lengths for face and neck. Reapply every 2 hours during sun exposure.",
    doctorNote: "No sunscreen provides 100% protection. Combine with protective clothing, hats, and seeking shade during peak UV hours (10am-4pm).",
  },
  dullness: {
    keywords: ["dull", "dullness", "tired", "uneven", "dark spots", "pigmentation", "brightening", "glow", "باهتة", "تصبغ", "terne", "opaca", "donuk", "leke"],
    response: "Dull skin often needs exfoliation and brightening ingredients. Vitamin C, niacinamide, and regular exfoliation can restore radiance.",
    recommendedProducts: ["Dewy Glow Jelly Cream", "Gentle Exfoliating Toner", "Fermented Soybean Bio Cellulose Mask", "Anti-Ageing Hyaluronic Acid Face Serum"],
    sideEffects: ["Exfoliating products may cause initial sensitivity", "Brightening ingredients increase sun sensitivity - always use SPF"],
    usage: "Use exfoliating toner 2-3 times weekly, apply glow cream daily, use fermented mask weekly for intensive treatment.",
    doctorNote: "Persistent dark spots may require professional treatments like chemical peels or laser therapy. Consult a dermatologist for stubborn pigmentation.",
  },
  hairCare: {
    keywords: ["hair", "scalp", "dandruff", "dry hair", "damaged hair", "شعر", "فروة الرأس", "cheveux", "cuir chevelu", "cabello", "saç"],
    response: "Healthy hair starts with a healthy scalp. Using the right shampoo and conditioner for your hair type is essential.",
    recommendedProducts: ["Aromatica Recipe Shampoo", "Advanced Care Clinic Conditioner"],
    sideEffects: ["Some ingredients may cause buildup over time - clarify monthly", "If scalp irritation occurs, discontinue use"],
    usage: "Shampoo 2-3 times weekly (daily if oily scalp), condition ends only, use lukewarm water to preserve natural oils.",
    doctorNote: "Persistent dandruff, hair loss, or scalp conditions should be evaluated by a dermatologist or trichologist.",
  },
  bodyCare: {
    keywords: ["body", "body lotion", "dry body", "rough skin", "body care", "جسم", "لوشن", "corps", "cuerpo", "vücut"],
    response: "Body skin also needs attention and hydration. Look for nourishing ingredients that lock in moisture.",
    recommendedProducts: ["Aromatica Recipe Body Lotion"],
    sideEffects: ["Apply on slightly damp skin for better absorption", "Avoid applying on broken skin"],
    usage: "Apply body lotion after showering while skin is still slightly damp. Focus on dry areas like elbows, knees, and heels.",
    doctorNote: "Extremely dry or scaly body skin may indicate conditions like keratosis pilaris or eczema requiring medical attention.",
  },
  pores: {
    keywords: ["pores", "large pores", "minimize pores", "مسام", "pores dilatés", "poros", "gözenekler"],
    response: "While pore size is largely genetic, keeping them clean and using certain ingredients can minimize their appearance.",
    recommendedProducts: ["Pore Clearing Clay Mask 2X", "Gentle Exfoliating Toner", "Clarifying Emulsion"],
    sideEffects: ["Over-exfoliating can irritate skin and make pores appear larger", "Clay masks may cause temporary tightness"],
    usage: "Use clay mask 1-2 times weekly, follow with toner to balance skin. Consistent cleansing prevents pore congestion.",
    doctorNote: "For significantly enlarged pores, professional treatments like laser therapy or microneedling may be options to discuss with a dermatologist.",
  },
};

// ─────────────────────────────────────────────────────────────
// MESSAGE TYPES
// ─────────────────────────────────────────────────────────────

interface Message {
  id: string;
  type: "user" | "bot" | "products" | "loading";
  content: string;
  products?: ProductRecommendation[];
  sideEffects?: string[];
  usage?: string;
  doctorNote?: string;
}

interface ProductRecommendation {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string | null;
  skinType: string | null;
}

// ─────────────────────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────────────────────

const dermatologistTranslations = {
  title: { en: "Dr. Eva - AI Dermatologist", ar: "د. إيڤا - طبيبة الجلدية الذكية", fr: "Dr. Eva - Dermatologue IA", es: "Dra. Eva - Dermatóloga IA", tr: "Dr. Eva - Yapay Zeka Dermatoloğu" },
  subtitle: { en: "Board-Certified Virtual Skin Consultation", ar: "استشارة جلدية افتراضية معتمدة", fr: "Consultation cutanée virtuelle certifiée", es: "Consulta virtual certificada de la piel", tr: "Sertifikalı Sanal Cilt Konsültasyonu" },
  greeting: { en: "Hello! I'm Dr. Eva, your AI dermatologist. I'm here to help you find the perfect skincare products for your specific needs. Please describe your skin concerns, type, or any conditions you're experiencing.", ar: "مرحباً! أنا د. إيڤا، طبيبة الجلدية الذكية الخاصة بك. أنا هنا لمساعدتك في العثور على منتجات العناية بالبشرة المثالية لاحتياجاتك. يرجى وصف مخاوفك الجلدية أو نوع بشرتك أو أي حالات تعاني منها.", fr: "Bonjour! Je suis Dr. Eva, votre dermatologue IA. Je suis là pour vous aider à trouver les produits de soins parfaits. Décrivez vos préoccupations cutanées.", es: "¡Hola! Soy la Dra. Eva, tu dermatóloga IA. Estoy aquí para ayudarte a encontrar los productos perfectos. Describe tus preocupaciones de la piel.", tr: "Merhaba! Ben Dr. Eva, yapay zeka dermatoloğunuz. Size mükemmel cilt bakım ürünlerini bulmanıza yardımcı olmak için buradayım. Cilt endişelerinizi açıklayın." },
  placeholder: { en: "Describe your skin concern...", ar: "صف مشكلتك الجلدية...", fr: "Décrivez votre problème de peau...", es: "Describe tu problema de piel...", tr: "Cilt sorununuzu açıklayın..." },
  recommendedProducts: { en: "Recommended Products", ar: "المنتجات الموصى بها", fr: "Produits recommandés", es: "Productos recomendados", tr: "Önerilen Ürünler" },
  sideEffects: { en: "Potential Side Effects & Notes", ar: "الآثار الجانبية المحتملة والملاحظات", fr: "Effets secondaires potentiels", es: "Posibles efectos secundarios", tr: "Olası Yan Etkiler" },
  howToUse: { en: "How to Use", ar: "طريقة الاستخدام", fr: "Comment utiliser", es: "Cómo usar", tr: "Nasıl Kullanılır" },
  doctorNote: { en: "Professional Recommendation", ar: "توصية طبية", fr: "Recommandation professionnelle", es: "Recomendación profesional", tr: "Profesyonel Öneri" },
  viewProduct: { en: "View Product", ar: "عرض المنتج", fr: "Voir le produit", es: "Ver producto", tr: "Ürünü Gör" },
  analyzing: { en: "Analyzing your skin concern...", ar: "جاري تحليل مشكلتك الجلدية...", fr: "Analyse de votre problème de peau...", es: "Analizando tu problema de piel...", tr: "Cilt sorununuz analiz ediliyor..." },
  disclaimer: { en: "This is AI-assisted advice. For serious conditions, consult a dermatologist.", ar: "هذه نصيحة بمساعدة الذكاء الاصطناعي. للحالات الخطيرة، استشر طبيب جلدية.", fr: "Ceci est un conseil assisté par IA. Pour les conditions sérieuses, consultez un dermatologue.", es: "Este es un consejo asistido por IA. Para condiciones serias, consulta a un dermatólogo.", tr: "Bu yapay zeka destekli bir tavsiyedir. Ciddi durumlar için bir dermatoloğa danışın." },
  noMatch: { en: "I understand you're looking for skincare advice. To give you the best recommendations, could you please describe your specific skin concern? For example: acne, dryness, oily skin, aging concerns, sensitivity, sun protection needs, or any other skin condition you'd like help with.", ar: "أفهم أنك تبحث عن نصيحة للعناية بالبشرة. لإعطائك أفضل التوصيات، هل يمكنك وصف مشكلتك الجلدية المحددة؟ مثال: حب الشباب، الجفاف، البشرة الدهنية، مخاوف الشيخوخة، الحساسية، أو احتياجات الحماية من الشمس.", fr: "Je comprends que vous cherchez des conseils de soins de la peau. Pour vous donner les meilleures recommandations, pourriez-vous décrire votre problème de peau spécifique?", es: "Entiendo que buscas consejos de cuidado de la piel. Para darte las mejores recomendaciones, ¿podrías describir tu problema de piel específico?", tr: "Cilt bakımı tavsiyesi aradığınızı anlıyorum. Size en iyi önerileri vermek için, özel cilt sorununuzu açıklar mısınız?" },
  allProducts: { en: "All Available Products", ar: "جميع المنتجات المتاحة", fr: "Tous les produits disponibles", es: "Todos los productos disponibles", tr: "Tüm Mevcut Ürünler" },
  showAllProducts: { en: "Show All Products", ar: "عرض جميع المنتجات", fr: "Afficher tous les produits", es: "Mostrar todos los productos", tr: "Tüm Ürünleri Göster" },
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const AIDermatologist = () => {
  const { language } = useLanguage();
  const { data: products, isLoading: productsLoading } = useProducts();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = (key: keyof typeof dermatologistTranslations) => {
    return dermatologistTranslations[key][language] || dermatologistTranslations[key].en;
  };

  // Initialize with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          type: "bot",
          content: t("greeting"),
        },
      ]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const findMatchingConditions = (text: string): SkinCondition[] => {
    const lowerText = text.toLowerCase();
    const matches: SkinCondition[] = [];

    for (const condition of Object.values(skinConditions)) {
      for (const keyword of condition.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matches.push(condition);
          break;
        }
      }
    }

    return matches;
  };

  const getProductRecommendations = (productNames: string[]): ProductRecommendation[] => {
    if (!products) return [];

    const recommendations: ProductRecommendation[] = [];

    for (const name of productNames) {
      const product = products.find(
        (p) => p.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(p.name.toLowerCase())
      );
      if (product) {
        recommendations.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: resolveProductImage(product.image),
          description: product.description,
          skinType: product.skin_type,
        });
      }
    }

    return recommendations;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Add loading message
    const loadingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: loadingId, type: "loading", content: t("analyzing") },
    ]);

    // Simulate AI thinking time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Remove loading message
    setMessages((prev) => prev.filter((m) => m.id !== loadingId));

    const matchedConditions = findMatchingConditions(input);

    if (matchedConditions.length > 0) {
      // Combine all matched conditions
      const allProductNames = [...new Set(matchedConditions.flatMap((c) => c.recommendedProducts))];
      const recommendations = getProductRecommendations(allProductNames);
      const combinedResponse = matchedConditions.map((c) => c.response).join("\n\n");
      const combinedSideEffects = [...new Set(matchedConditions.flatMap((c) => c.sideEffects || []))];
      const combinedUsage = matchedConditions.map((c) => c.usage).filter(Boolean).join("\n\n");
      const combinedDoctorNote = matchedConditions.map((c) => c.doctorNote).filter(Boolean).join("\n\n");

      const botMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: "products",
        content: combinedResponse,
        products: recommendations,
        sideEffects: combinedSideEffects,
        usage: combinedUsage,
        doctorNote: combinedDoctorNote,
      };

      setMessages((prev) => [...prev, botMessage]);
    } else {
      // Check for "all products" or "show products" requests
      const showAllKeywords = ["all products", "show products", "list products", "what products", "available products", "جميع المنتجات", "tous les produits", "todos los productos", "tüm ürünler"];
      const wantsAllProducts = showAllKeywords.some((kw) => input.toLowerCase().includes(kw));

      if (wantsAllProducts && products) {
        const allRecommendations: ProductRecommendation[] = products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: resolveProductImage(p.image),
          description: p.description,
          skinType: p.skin_type,
        }));

        const botMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: "products",
          content: t("allProducts"),
          products: allRecommendations,
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        const botMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: "bot",
          content: t("noMatch"),
        };

        setMessages((prev) => [...prev, botMessage]);
      }
    }

    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showAllProducts = () => {
    if (!products || productsLoading) return;

    setIsTyping(true);

    const loadingId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: loadingId, type: "loading", content: t("analyzing") },
    ]);

    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== loadingId));

      const allRecommendations: ProductRecommendation[] = products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: resolveProductImage(p.image),
        description: p.description,
        skinType: p.skin_type,
      }));

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "products",
        content: t("allProducts"),
        products: allRecommendations,
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 end-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
        aria-label="Open AI Dermatologist"
      >
        <Stethoscope className="h-5 w-5" />
        <span className="font-medium hidden sm:inline">Dr. Eva</span>
        <Sparkles className="h-4 w-4 animate-pulse" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-0 end-0 sm:bottom-6 sm:end-6 z-50 w-full sm:w-[420px] h-[100dvh] sm:h-[600px] sm:max-h-[80vh] bg-card border border-border sm:rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-full sm:translate-y-8 opacity-0 pointer-events-none"}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 sm:rounded-t-2xl flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-primary-foreground/30">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                <Stethoscope className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 end-0 h-3 w-3 bg-green-400 rounded-full border-2 border-primary" />
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
            {messages.map((message) => (
              <div key={message.id}>
                {message.type === "user" && (
                  <div className="flex justify-end">
                    <div className="flex items-start gap-2 max-w-[85%]">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2">
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                )}

                {message.type === "bot" && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2 max-w-[85%]">
                      <Avatar className="h-8 w-8 flex-shrink-0 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Stethoscope className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md px-4 py-2">
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                      </div>
                    </div>
                  </div>
                )}

                {message.type === "loading" && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2">
                      <Avatar className="h-8 w-8 flex-shrink-0 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Stethoscope className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">{message.content}</p>
                      </div>
                    </div>
                  </div>
                )}

                {message.type === "products" && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2 w-full max-w-[95%]">
                      <Avatar className="h-8 w-8 flex-shrink-0 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Stethoscope className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        {/* Response text */}
                        <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md px-4 py-2">
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                        </div>

                        {/* Products */}
                        {message.products && message.products.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                              <Sparkles className="h-3 w-3" />
                              {t("recommendedProducts")}
                            </div>
                            <div className="grid gap-2">
                              {message.products.map((product) => (
                                <Card key={product.id} className="p-3 hover:shadow-md transition-shadow">
                                  <div className="flex gap-3">
                                    <img
                                      src={product.image}
                                      alt={translateProductName(product.name, language)}
                                      className="w-16 h-16 object-contain rounded-lg bg-secondary/50"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-sm truncate">
                                        {translateProductName(product.name, language)}
                                      </h4>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                        {translateProductDescription(product.description, product.name, language)}
                                      </p>
                                      <div className="flex items-center justify-between mt-2">
                                        <span className="font-bold text-primary">${product.price.toFixed(2)}</span>
                                        <Link to={`/product/${product.id}`}>
                                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                            {t("viewProduct")}
                                            <ExternalLink className="h-3 w-3" />
                                          </Button>
                                        </Link>
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Side Effects */}
                        {message.sideEffects && message.sideEffects.length > 0 && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
                              <AlertCircle className="h-3 w-3" />
                              {t("sideEffects")}
                            </div>
                            <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                              {message.sideEffects.map((effect, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-amber-500 mt-0.5">•</span>
                                  {effect}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Usage */}
                        {message.usage && (
                          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
                              <ChevronDown className="h-3 w-3" />
                              {t("howToUse")}
                            </div>
                            <p className="text-xs text-blue-800 dark:text-blue-300 whitespace-pre-line">{message.usage}</p>
                          </div>
                        )}

                        {/* Doctor Note */}
                        {message.doctorNote && (
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
                              <ShieldCheck className="h-3 w-3" />
                              {t("doctorNote")}
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-pre-line">{message.doctorNote}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t border-border flex gap-2 overflow-x-auto">
          <Button
            size="sm"
            variant="outline"
            className="text-xs whitespace-nowrap flex-shrink-0"
            onClick={showAllProducts}
            disabled={isTyping || productsLoading}
          >
            {productsLoading ? <Loader2 className="h-3 w-3 animate-spin me-1" /> : null}
            {t("showAllProducts")}
          </Button>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder")}
              className="flex-1"
              disabled={isTyping}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="icon">
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">{t("disclaimer")}</p>
        </div>
      </div>
    </>
  );
};

export default AIDermatologist;
