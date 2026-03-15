import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  X,
  Send,
  Stethoscope,
  Loader2,
  ShieldCheck,
  User,
  Sparkles,
  Heart,
  Clock,
  AlertTriangle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─────────────────────────────────────────────────────────────
// AI DERMATOLOGIST COMPONENT
// ─────────────────────────────────────────────────────────────

const AIDermatologist = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: `مرحباً بكِ في عيادة إيڤا للعناية بالبشرة 💜

أنا **د. إيڤا**، طبيبة جلدية استشارية متخصصة. سعيدة بتواصلك معي اليوم.

كيف يمكنني مساعدتك؟ يمكنك إخباري عن:
- مشكلة جلدية تواجهينها
- نوع بشرتك واحتياجاتها
- استفسار عن منتج معين
- طلب روتين عناية مخصص

أنا هنا للاستماع إليكِ وتقديم النصيحة الطبية المناسبة.`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Parse SSE stream
  async function* parseSSEStream(response: Response) {
    if (!response.body) throw new Error("No response body");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data:")) {
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") return;
          try {
            yield JSON.parse(data);
          } catch {
            /* Skip invalid JSON */
          }
        }
      }
    }
  }

  // Send message with AI streaming
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);
    setStreamingContent("");

    try {
      // Prepare messages for API
      const apiMessages = messages
        .filter((m) => m.id !== "welcome")
        .concat(userMessage)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch("/api/dermatologist/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      let fullContent = "";

      // Stream the response
      for await (const chunk of parseSSEStream(response)) {
        if (chunk.type === "text-delta" && chunk.delta) {
          fullContent += chunk.delta;
          setStreamingContent(fullContent);
        }
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fullContent || "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (error) {
      console.error("Error:", error);
      // Fallback to local response
      const fallbackResponse = generateLocalResponse(input.trim());
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallbackResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Local fallback response generator
  const generateLocalResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    // Acne
    if (
      input.includes("حب") ||
      input.includes("بثور") ||
      input.includes("acne") ||
      input.includes("pimple")
    ) {
      return `شكراً لمشاركتي مخاوفك 💜

**التشخيص المبدئي:**
بناءً على وصفك، يبدو أنكِ تعانين من **حب الشباب** (Acne Vulgaris). هذه حالة جلدية شائعة تحدث عندما تنسد بصيلات الشعر بالزهم وخلايا الجلد الميتة، مما يؤدي إلى ظهور البثور.

**المنتجات الموصوفة:**
1. [قناع الطين لتنظيف المسام](/product/pore-clearing-clay-mask) - للتنظيف العميق وامتصاص الزيوت
2. [غسول الليتشي الفوار](/product/lychee-soda-bubble-cleanser) - تنظيف يومي لطيف
3. [تونر التقشير اللطيف](/product/gentle-exfoliating-toner) - لإزالة خلايا الجلد الميتة
4. [المرطب المنقي](/product/clarifying-emulsion) - ترطيب دون زيوت إضافية

**تعليمات الاستخدام:**
- **صباحاً:** غسول → تونر → مرطب → واقي شمس
- **مساءً:** غسول → قناع الطين (2-3 مرات أسبوعياً) → تونر → مرطب

**⚠️ تحذيرات مهمة:**
- قد تظهر بثور إضافية في أول 2-4 أسابيع (فترة التنقية) - هذا طبيعي
- واقي الشمس إلزامي لأن هذه المنتجات تزيد حساسية البشرة للشمس
- لا تعصري البثور أبداً لتجنب الندبات

**متى تراجعين طبيب جلدية؟**
إذا لم تتحسن الحالة خلال 8-12 أسبوعاً، أو ظهرت ندبات، أو كان حب الشباب كيسياً ومؤلماً.

هل لديكِ أسئلة أخرى عن روتين العناية؟`;
    }

    // Dryness
    if (
      input.includes("جفاف") ||
      input.includes("جاف") ||
      input.includes("dry") ||
      input.includes("dehydrat")
    ) {
      return `أفهم مشكلتك تماماً 💜

**التشخيص المبدئي:**
تشير أعراضك إلى **جفاف البشرة** (Xerosis). يحدث عندما تفقد الطبقة الخارجية للبشرة رطوبتها، وقد يكون السبب عوامل بيئية أو ضعف في الحاجز الجلدي.

**المنتجات الموصوفة:**
1. [سيروم حمض الهيالورونيك](/product/anti-ageing-hyaluronic-acid-face-serum) - ترطيب عميق
2. [كريم الترطيب الفائق](/product/super-aqua-cream) - حبس الرطوبة
3. [جيلي كريم التوهج](/product/dewy-glow-jelly-cream) - طبقة حماية
4. [قناع الأرز الورقي](/product/rice-sheet-mask) - ترطيب مكثف أسبوعي

**تعليمات الاستخدام:**
- ضعي السيروم على بشرة **رطبة** (هذا مهم جداً!)
- طبقي الكريمات بحركات ضغط وليس فرك
- استخدمي القناع 1-2 مرة أسبوعياً

**نصائح إضافية:**
- تجنبي الماء الساخن عند غسل الوجه
- استخدمي مرطب الهواء في الغرفة إن أمكن
- اشربي كمية كافية من الماء

هل تريدين أن أشرح لكِ المزيد عن أي منتج؟`;
    }

    // Oily skin
    if (
      input.includes("دهن") ||
      input.includes("زيت") ||
      input.includes("لامع") ||
      input.includes("oily") ||
      input.includes("greasy")
    ) {
      return `مشكلة شائعة وقابلة للحل 💜

**التشخيص المبدئي:**
تعانين من **فرط إفراز الدهون** (Seborrhea). الغدد الدهنية لديكِ نشطة أكثر من اللازم، وقد يكون السبب هرموني أو حتى الإفراط في تجفيف البشرة!

**المنتجات الموصوفة:**
1. [المرطب المنقي](/product/clarifying-emulsion) - يرطب دون زيوت
2. [قناع الطين](/product/pore-clearing-clay-mask) - يمتص الدهون الزائدة
3. [واقي الشمس المات](/product/matte-priming-uv-shield-sunscreen-spf-37) - حماية بلمسة جافة
4. [تونر التقشير](/product/gentle-exfoliating-toner) - ينظف المسام

**⚠️ خطأ شائع يجب تجنبه:**
الإفراط في التنظيف والتجفيف يجعل البشرة تنتج المزيد من الدهون! الحل هو التوازن.

**روتين مقترح:**
- **صباحاً:** غسول لطيف → مرطب منقي → واقي شمس مات
- **مساءً:** غسول → تونر → قناع طين (مرتين أسبوعياً) → مرطب

هل لديكِ أسئلة عن هذا الروتين؟`;
    }

    // Aging
    if (
      input.includes("تجاعيد") ||
      input.includes("شيخوخ") ||
      input.includes("خطوط") ||
      input.includes("wrinkle") ||
      input.includes("aging")
    ) {
      return `موضوع مهم للعناية الوقائية 💜

**التشخيص:**
علامات التقدم بالعمر تشمل انخفاض إنتاج الكولاجين والإيلاستين، وتراكم أضرار الشمس. الوقاية والعلاج المبكر يحدثان فرقاً كبيراً.

**المنتجات الموصوفة:**
1. [سيروم حمض الهيالورونيك](/product/anti-ageing-hyaluronic-acid-face-serum) - ملء الخطوط الدقيقة
2. [كريم تعزيز البشرة](/product/skin-reinforcement-get-type-cream) - شد وتحسين المرونة
3. [واقي شمس SPF50+](/product/soft-finish-sun-milk-spf50) - **الأهم على الإطلاق!**
4. [قناع الصويا المخمر](/product/fermented-soybean-bio-cellulose-mask) - تغذية مكثفة

**حقيقة طبية مهمة:**
80% من شيخوخة البشرة سببها الشمس. واقي الشمس هو أفضل منتج مضاد للشيخوخة!

**روتين مكافحة الشيخوخة:**
- **صباحاً:** سيروم على بشرة رطبة → كريم → **واقي شمس** (أعيدي التطبيق كل ساعتين)
- **مساءً:** سيروم → كريم التعزيز → قناع أسبوعي

هل تريدين نصائح إضافية لمنطقة معينة مثل العين أو الرقبة؟`;
    }

    // Sensitive skin
    if (
      input.includes("حساس") ||
      input.includes("تهيج") ||
      input.includes("احمرار") ||
      input.includes("sensitive") ||
      input.includes("irritat")
    ) {
      return `البشرة الحساسة تحتاج عناية خاصة 💜

**التشخيص:**
بشرتك لديها حاجز جلدي ضعيف وتتفاعل بسهولة مع المحفزات. الهدف هو تقوية الحاجز وتجنب المهيجات.

**المنتجات الموصوفة:**
1. [المرطب المنقي](/product/clarifying-emulsion) - لطيف ومهدئ
2. [قناع الأرز](/product/rice-sheet-mask) - تهدئة وترطيب
3. [جيلي كريم](/product/dewy-glow-jelly-cream) - حماية خفيفة
4. [واقي الشمس الآمن](/product/all-around-safe-block-essence-sun-spf45) - للبشرة الحساسة

**⚠️ قواعد ذهبية للبشرة الحساسة:**
- أدخلي منتج واحد جديد فقط كل أسبوعين
- اختبري أي منتج جديد على منطقة صغيرة أولاً
- تجنبي: العطور، الكحول، المقشرات القوية، الماء الساخن

**متى تراجعين طبيب؟**
إذا كان الاحمرار مستمراً مع ظهور أوعية دموية أو بثور، فقد تكون "الوردية" وتحتاج علاج طبي.

هل تريدين أن أساعدك في بناء روتين بسيط؟`;
    }

    // Sun protection
    if (
      input.includes("شمس") ||
      input.includes("واقي") ||
      input.includes("spf") ||
      input.includes("sun")
    ) {
      return `الحماية من الشمس أساس العناية بالبشرة! 💜

**لماذا واقي الشمس مهم؟**
الأشعة فوق البنفسجية مسؤولة عن:
- 80% من شيخوخة البشرة
- البقع الداكنة والكلف
- زيادة خطر سرطان الجلد

**واقيات الشمس المتوفرة:**
1. [حليب الشمس SPF50+](/product/soft-finish-sun-milk-spf50) - حماية قصوى، لمسة ناعمة
2. [واقي الشمس المات SPF37](/product/matte-priming-uv-shield-sunscreen-spf-37) - للبشرة الدهنية
3. [واقي الشمس الآمن SPF45](/product/all-around-safe-block-essence-sun-spf45) - للبشرة الحساسة

**طريقة الاستخدام الصحيحة:**
- الكمية: طول إصبعين للوجه والرقبة
- ضعيه قبل 15-30 دقيقة من الخروج
- **أعيدي التطبيق كل ساعتين** - هذا ضروري!
- لا تنسي: الأذنين، الرقبة، ظهر اليدين

هل تريدين مساعدة في اختيار الأنسب لنوع بشرتك؟`;
    }

    // Products inquiry
    if (
      input.includes("منتج") ||
      input.includes("product") ||
      input.includes("ايش عندكم") ||
      input.includes("شو عندكم")
    ) {
      return `سعيدة بتقديم منتجاتنا لكِ 💜

**منتجات إيڤا كوزماتكس:**

**للتنظيف:**
- [غسول الليتشي الفوار](/product/lychee-soda-bubble-cleanser)
- [قناع الطين](/product/pore-clearing-clay-mask)
- [تونر التقشير](/product/gentle-exfoliating-toner)

**للترطيب:**
- [سيروم الهيالورونيك](/product/anti-ageing-hyaluronic-acid-face-serum)
- [كريم الترطيب الفائق](/product/super-aqua-cream)
- [جيلي كريم التوهج](/product/dewy-glow-jelly-cream)
- [المرطب المنقي](/product/clarifying-emulsion)

**للحماية من الشمس:**
- [حليب الشمس SPF50+](/product/soft-finish-sun-milk-spf50)
- [واقي الشمس المات SPF37](/product/matte-priming-uv-shield-sunscreen-spf-37)
- [واقي الشمس الآمن SPF45](/product/all-around-safe-block-essence-sun-spf45)

**للأقنعة والعلاج المكثف:**
- [قناع الأرز](/product/rice-sheet-mask)
- [قناع الصويا المخمر](/product/fermented-soybean-bio-cellulose-mask)
- [كريم تعزيز البشرة](/product/skin-reinforcement-get-type-cream)

**للشعر والجسم:**
- [أمبول إصلاح الشعر](/product/repair-ex-damage-care-hair-fill-up-ampoule)
- [جل تقشير الجسم](/product/spa-body-peeling-gel)

أخبريني عن نوع بشرتك ومخاوفك، وسأساعدك في اختيار الأنسب لكِ!`;
    }

    // Greeting
    if (
      input.includes("مرحب") ||
      input.includes("السلام") ||
      input.includes("اهلا") ||
      input.includes("هلا") ||
      input.includes("hello") ||
      input.includes("hi")
    ) {
      return `أهلاً وسهلاً بكِ! 💜

سعيدة بتواصلك مع عيادة إيڤا. أنا د. إيڤا، طبيبة جلدية متخصصة.

كيف يمكنني مساعدتك اليوم؟ يمكنكِ إخباري عن:
- أي مشكلة جلدية تواجهينها
- نوع بشرتك واحتياجاتها
- استفسار عن منتج معين
- طلب روتين عناية مخصص

أنا هنا للاستماع إليكِ 🌸`;
    }

    // Default response
    return `شكراً لسؤالك 💜

لأتمكن من مساعدتك بشكل أفضل، هل يمكنكِ إخباري المزيد عن:

1. **نوع بشرتك:** جافة، دهنية، مختلطة، حساسة؟
2. **المشكلة الرئيسية:** حب شباب، جفاف، تجاعيد، بقع داكنة؟
3. **عمرك:** يساعدني في تقديم نصائح مناسبة
4. **روتينك الحالي:** هل تستخدمين منتجات معينة؟

كلما عرفت أكثر، كلما استطعت وصف العلاج المناسب لكِ.

أو يمكنكِ ببساطة وصف ما تلاحظينه على بشرتك 🌸`;
  };

  // Format message with links
  const formatMessage = (content: string) => {
    // Convert markdown links to React Router links
    const parts = content.split(/(\[.*?\]\(.*?\))/g);
    
    return parts.map((part, index) => {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const [, text, url] = linkMatch;
        return (
          <Link
            key={index}
            to={url}
            className="text-[#7c3aed] hover:text-[#6d28d9] underline underline-offset-2 font-medium"
            onClick={() => setIsOpen(false)}
          >
            {text}
          </Link>
        );
      }
      // Handle bold text
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((boldPart, boldIndex) => {
        const boldMatch = boldPart.match(/\*\*(.*?)\*\*/);
        if (boldMatch) {
          return <strong key={`${index}-${boldIndex}`}>{boldMatch[1]}</strong>;
        }
        return <span key={`${index}-${boldIndex}`}>{boldPart}</span>;
      });
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
          isOpen ? "hidden" : "flex"
        }`}
        style={{ padding: "14px 20px" }}
        dir="rtl"
      >
        <div className="relative">
          <Stethoscope className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-bold text-sm">د. إيڤا</span>
          <span className="text-xs opacity-90">طبيبة جلدية</span>
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <Card
          className="fixed bottom-6 left-6 z-50 w-[380px] h-[580px] flex flex-col shadow-2xl border-0 overflow-hidden"
          style={{ 
            background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
            borderRadius: "24px"
          }}
          dir="rtl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2 border-white/30">
                    <AvatarImage src="/doctor-eva.png" />
                    <AvatarFallback className="bg-white/20 text-white font-bold">
                      <Stethoscope className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#7c3aed]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">د. إيڤا</h3>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    طبيبة جلدية استشارية
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    {message.role === "assistant" ? (
                      <>
                        <AvatarImage src="/doctor-eva.png" />
                        <AvatarFallback className="bg-[#7c3aed] text-white">
                          <Stethoscope className="w-4 h-4" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-gray-200">
                        <User className="w-4 h-4 text-gray-600" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-[#7c3aed] text-white rounded-tr-none"
                        : "bg-white shadow-sm rounded-tl-none"
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.role === "assistant"
                        ? formatMessage(message.content)
                        : message.content}
                    </div>
                    <div
                      className={`text-[10px] mt-2 flex items-center gap-1 ${
                        message.role === "user" ? "text-white/70" : "text-gray-400"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {message.timestamp.toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Streaming message */}
              {streamingContent && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-[#7c3aed] text-white">
                      <Stethoscope className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-none px-4 py-3 bg-white shadow-sm">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {formatMessage(streamingContent)}
                    </div>
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              {isTyping && !streamingContent && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-[#7c3aed] text-white">
                      <Stethoscope className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-sm text-gray-500">د. إيڤا تكتب...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {[
                  "عندي حب شباب",
                  "بشرتي جافة",
                  "أريد واقي شمس",
                  "روتين للبشرة الدهنية",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      setTimeout(() => sendMessage(), 100);
                    }}
                    className="text-xs bg-white hover:bg-[#7c3aed] hover:text-white text-[#7c3aed] border border-[#7c3aed]/30 rounded-full px-3 py-1.5 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white/50 border-t border-[#7c3aed]/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتبي سؤالك هنا..."
                className="flex-1 rounded-full border-[#7c3aed]/30 focus-visible:ring-[#7c3aed] text-right"
                disabled={isLoading}
                dir="rtl"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] w-10 h-10"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
            <p className="text-[10px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              استشارة أولية - لا تغني عن زيارة الطبيب
            </p>
          </div>
        </Card>
      )}
    </>
  );
};

export default AIDermatologist;
