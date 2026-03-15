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
  Globe,
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

type Language = "ar" | "en";

// ─────────────────────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────────────────────

const translations = {
  ar: {
    doctorName: "د. إيڤا",
    doctorTitle: "طبيبة جلدية استشارية",
    typing: "د. إيڤا تكتب...",
    placeholder: "اكتبي سؤالك هنا...",
    disclaimer: "استشارة أولية - لا تغني عن زيارة الطبيب",
    showAllProducts: "عرض جميع المنتجات",
    suggestions: [
      "عندي حب شباب",
      "بشرتي جافة",
      "أريد واقي شمس",
      "روتين للبشرة الدهنية",
    ],
    welcome: `مرحباً بكِ في عيادة إيڤا للعناية بالبشرة

أنا **د. إيڤا**، طبيبة جلدية استشارية متخصصة. سعيدة بتواصلك معي اليوم.

كيف يمكنني مساعدتك؟ يمكنك إخباري عن:
- مشكلة جلدية تواجهينها
- نوع بشرتك واحتياجاتها
- استفسار عن منتج معين
- طلب روتين عناية مخصص

أنا هنا للاستماع إليكِ وتقديم النصيحة الطبية المناسبة.`,
  },
  en: {
    doctorName: "Dr. Eva",
    doctorTitle: "Consultant Dermatologist",
    typing: "Dr. Eva is typing...",
    placeholder: "Type your question here...",
    disclaimer: "Initial consultation - does not replace a doctor's visit",
    showAllProducts: "Show All Products",
    suggestions: [
      "I have acne",
      "My skin is dry",
      "I need sunscreen",
      "Routine for oily skin",
    ],
    welcome: `Welcome to Eva Skincare Clinic

I'm **Dr. Eva**, a specialist consultant dermatologist. I'm happy to connect with you today.

How can I help you? You can tell me about:
- Any skin concern you're facing
- Your skin type and needs
- Questions about a specific product
- Request a personalized skincare routine

I'm here to listen and provide appropriate medical advice.`,
  },
};

// ─────────────────────────────────────────────────────────────
// RESPONSES DATABASE
// ─────────────────────────────────────────────────────────────

const responses = {
  ar: {
    acne: `شكراً لمشاركتي مخاوفك

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

**تحذيرات مهمة:**
- قد تظهر بثور إضافية في أول 2-4 أسابيع (فترة التنقية) - هذا طبيعي
- واقي الشمس إلزامي لأن هذه المنتجات تزيد حساسية البشرة للشمس
- لا تعصري البثور أبداً لتجنب الندبات

**متى تراجعين طبيب جلدية؟**
إذا لم تتحسن الحالة خلال 8-12 أسبوعاً، أو ظهرت ندبات، أو كان حب الشباب كيسياً ومؤلماً.

هل لديكِ أسئلة أخرى عن روتين العناية؟`,

    dry: `أفهم مشكلتك تماماً

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

هل تريدين أن أشرح لكِ المزيد عن أي منتج؟`,

    oily: `مشكلة شائعة وقابلة للحل

**التشخيص المبدئي:**
تعانين من **فرط إفراز الدهون** (Seborrhea). الغدد الدهنية لديكِ نشطة أكثر من اللازم، وقد يكون السبب هرموني أو حتى الإفراط في تجفيف البشرة!

**المنتجات الموصوفة:**
1. [المرطب المنقي](/product/clarifying-emulsion) - يرطب دون زيوت
2. [قناع الطين](/product/pore-clearing-clay-mask) - يمتص الدهون الزائدة
3. [واقي الشمس المات](/product/matte-priming-uv-shield-sunscreen-spf-37) - حماية بلمسة جافة
4. [تونر التقشير](/product/gentle-exfoliating-toner) - ينظف المسام

**خطأ شائع يجب تجنبه:**
الإفراط في التنظيف والتجفيف يجعل البشرة تنتج المزيد من الدهون! الحل هو التوازن.

**روتين مقترح:**
- **صباحاً:** غسول لطيف → مرطب منقي → واقي شمس مات
- **مساءً:** غسول → تونر → قناع طين (مرتين أسبوعياً) → مرطب

هل لديكِ أسئلة عن هذا الروتين؟`,

    aging: `موضوع مهم للعناية الوقائية

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

هل تريدين نصائح إضافية لمنطقة معينة مثل العين أو الرقبة؟`,

    sensitive: `البشرة الحساسة تحتاج عناية خاصة

**التشخيص:**
بشرتك لديها حاجز جلدي ضعيف وتتفاعل بسهولة مع المحفزات. الهدف هو تقوية الحاجز وتجنب المهيجات.

**المنتجات الموصوفة:**
1. [المرطب المنقي](/product/clarifying-emulsion) - لطيف ومهدئ
2. [قناع الأرز](/product/rice-sheet-mask) - تهدئة وترطيب
3. [جيلي كريم](/product/dewy-glow-jelly-cream) - حماية خفيفة
4. [واقي الشمس الآمن](/product/all-around-safe-block-essence-sun-spf45) - للبشرة الحساسة

**قواعد ذهبية للبشرة الحساسة:**
- أدخلي منتج واحد جديد فقط كل أسبوعين
- اختبري أي منتج جديد على منطقة صغيرة أولاً
- تجنبي: العطور، الكحول، المقشرات القوية، الماء الساخن

**متى تراجعين طبيب؟**
إذا كان الاحمرار مستمراً مع ظهور أوعية دموية أو بثور، فقد تكون "الوردية" وتحتاج علاج طبي.

هل تريدين أن أساعدك في بناء روتين بسيط؟`,

    sun: `الحماية من الشمس أساس العناية بالبشرة!

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

هل تريدين مساعدة في اختيار الأنسب لنوع بشرتك؟`,

    products: `سعيدة بتقديم منتجاتنا لكِ

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

أخبريني عن نوع بشرتك ومخاوفك، وسأساعدك في اختيار الأنسب لكِ!`,

    greeting: `أهلاً وسهلاً بكِ!

سعيدة بتواصلك مع عيادة إيڤا. أنا د. إيڤا، طبيبة جلدية متخصصة.

كيف يمكنني مساعدتك اليوم؟ يمكنكِ إخباري عن:
- أي مشكلة جلدية تواجهينها
- نوع بشرتك واحتياجاتها
- استفسار عن منتج معين
- طلب روتين عناية مخصص

أنا هنا للاستماع إليكِ`,

    default: `شكراً لسؤالك

لأتمكن من مساعدتك بشكل أفضل، هل يمكنكِ إخباري المزيد عن:

1. **نوع بشرتك:** جافة، دهنية، مختلطة، حساسة؟
2. **المشكلة الرئيسية:** حب شباب، جفاف، تجاعيد، بقع داكنة؟
3. **عمرك:** يساعدني في تقديم نصائح مناسبة
4. **روتينك الحالي:** هل تستخدمين منتجات معينة؟

كلما عرفت أكثر، كلما استطعت وصف العلاج المناسب لكِ.

أو يمكنكِ ببساطة وصف ما تلاحظينه على بشرتك`,
  },
  en: {
    acne: `Thank you for sharing your concerns

**Initial Diagnosis:**
Based on your description, it appears you're experiencing **Acne Vulgaris**. This is a common skin condition that occurs when hair follicles become clogged with sebum and dead skin cells, leading to pimples.

**Prescribed Products:**
1. [Pore Clearing Clay Mask](/product/pore-clearing-clay-mask) - Deep cleansing and oil absorption
2. [Lychee Soda Bubble Cleanser](/product/lychee-soda-bubble-cleanser) - Gentle daily cleansing
3. [Gentle Exfoliating Toner](/product/gentle-exfoliating-toner) - Remove dead skin cells
4. [Clarifying Emulsion](/product/clarifying-emulsion) - Oil-free hydration

**Usage Instructions:**
- **Morning:** Cleanser → Toner → Moisturizer → Sunscreen
- **Evening:** Cleanser → Clay Mask (2-3 times weekly) → Toner → Moisturizer

**Important Warnings:**
- You may experience purging (more breakouts) in the first 2-4 weeks - this is normal
- Sunscreen is mandatory as these products increase sun sensitivity
- Never squeeze pimples to avoid scarring

**When to see a dermatologist?**
If condition doesn't improve within 8-12 weeks, scarring appears, or acne is cystic and painful.

Do you have any other questions about the skincare routine?`,

    dry: `I completely understand your concern

**Initial Diagnosis:**
Your symptoms indicate **Xerosis** (dry skin). This occurs when the outer layer of skin loses moisture, which can be caused by environmental factors or a weakened skin barrier.

**Prescribed Products:**
1. [Hyaluronic Acid Face Serum](/product/anti-ageing-hyaluronic-acid-face-serum) - Deep hydration
2. [Super Aqua Cream](/product/super-aqua-cream) - Lock in moisture
3. [Dewy Glow Jelly Cream](/product/dewy-glow-jelly-cream) - Protective layer
4. [Rice Sheet Mask](/product/rice-sheet-mask) - Weekly intensive hydration

**Usage Instructions:**
- Apply serum on **damp skin** (this is very important!)
- Pat creams gently, don't rub
- Use the mask 1-2 times weekly

**Additional Tips:**
- Avoid hot water when washing your face
- Use a humidifier in your room if possible
- Drink adequate water

Would you like me to explain more about any product?`,

    oily: `A common but solvable problem

**Initial Diagnosis:**
You're experiencing **Seborrhea** (excess oil production). Your sebaceous glands are overactive, which could be hormonal or even caused by over-drying the skin!

**Prescribed Products:**
1. [Clarifying Emulsion](/product/clarifying-emulsion) - Oil-free hydration
2. [Clay Mask](/product/pore-clearing-clay-mask) - Absorbs excess oil
3. [Matte Sunscreen SPF37](/product/matte-priming-uv-shield-sunscreen-spf-37) - Protection with matte finish
4. [Exfoliating Toner](/product/gentle-exfoliating-toner) - Cleans pores

**Common Mistake to Avoid:**
Over-cleansing and over-drying makes skin produce MORE oil! Balance is key.

**Suggested Routine:**
- **Morning:** Gentle cleanser → Clarifying moisturizer → Matte sunscreen
- **Evening:** Cleanser → Toner → Clay mask (twice weekly) → Moisturizer

Do you have questions about this routine?`,

    aging: `An important topic for preventive care

**Diagnosis:**
Signs of aging include decreased collagen and elastin production, and accumulated sun damage. Prevention and early treatment make a significant difference.

**Prescribed Products:**
1. [Hyaluronic Acid Serum](/product/anti-ageing-hyaluronic-acid-face-serum) - Fill fine lines
2. [Skin Reinforcement Cream](/product/skin-reinforcement-get-type-cream) - Firming and elasticity
3. [Sunscreen SPF50+](/product/soft-finish-sun-milk-spf50) - **The most important product!**
4. [Fermented Soybean Mask](/product/fermented-soybean-bio-cellulose-mask) - Intensive nourishment

**Important Medical Fact:**
80% of skin aging is caused by the sun. Sunscreen is the best anti-aging product!

**Anti-Aging Routine:**
- **Morning:** Serum on damp skin → Cream → **Sunscreen** (reapply every 2 hours)
- **Evening:** Serum → Reinforcement cream → Weekly mask

Would you like additional tips for specific areas like eyes or neck?`,

    sensitive: `Sensitive skin needs special care

**Diagnosis:**
Your skin has a weakened barrier and reacts easily to triggers. The goal is to strengthen the barrier and avoid irritants.

**Prescribed Products:**
1. [Clarifying Emulsion](/product/clarifying-emulsion) - Gentle and soothing
2. [Rice Sheet Mask](/product/rice-sheet-mask) - Calming and hydrating
3. [Jelly Cream](/product/dewy-glow-jelly-cream) - Light protection
4. [Safe Block Sunscreen SPF45](/product/all-around-safe-block-essence-sun-spf45) - For sensitive skin

**Golden Rules for Sensitive Skin:**
- Introduce only one new product every two weeks
- Patch test any new product first
- Avoid: fragrances, alcohol, harsh exfoliants, hot water

**When to see a doctor?**
If redness persists with visible blood vessels or pustules, it might be "Rosacea" requiring medical treatment.

Would you like help building a simple routine?`,

    sun: `Sun protection is the foundation of skincare!

**Why is sunscreen important?**
UV rays are responsible for:
- 80% of skin aging
- Dark spots and melasma
- Increased skin cancer risk

**Available Sunscreens:**
1. [Sun Milk SPF50+](/product/soft-finish-sun-milk-spf50) - Maximum protection, soft finish
2. [Matte Sunscreen SPF37](/product/matte-priming-uv-shield-sunscreen-spf-37) - For oily skin
3. [Safe Block Sunscreen SPF45](/product/all-around-safe-block-essence-sun-spf45) - For sensitive skin

**Proper Application:**
- Amount: Two finger lengths for face and neck
- Apply 15-30 minutes before going outside
- **Reapply every 2 hours** - this is essential!
- Don't forget: ears, neck, back of hands

Would you like help choosing the best one for your skin type?`,

    products: `Happy to present our products to you

**Eva Cosmetics Products:**

**For Cleansing:**
- [Lychee Soda Bubble Cleanser](/product/lychee-soda-bubble-cleanser)
- [Clay Mask](/product/pore-clearing-clay-mask)
- [Exfoliating Toner](/product/gentle-exfoliating-toner)

**For Hydration:**
- [Hyaluronic Acid Serum](/product/anti-ageing-hyaluronic-acid-face-serum)
- [Super Aqua Cream](/product/super-aqua-cream)
- [Dewy Glow Jelly Cream](/product/dewy-glow-jelly-cream)
- [Clarifying Emulsion](/product/clarifying-emulsion)

**For Sun Protection:**
- [Sun Milk SPF50+](/product/soft-finish-sun-milk-spf50)
- [Matte Sunscreen SPF37](/product/matte-priming-uv-shield-sunscreen-spf-37)
- [Safe Block Sunscreen SPF45](/product/all-around-safe-block-essence-sun-spf45)

**For Masks & Intensive Treatment:**
- [Rice Sheet Mask](/product/rice-sheet-mask)
- [Fermented Soybean Mask](/product/fermented-soybean-bio-cellulose-mask)
- [Skin Reinforcement Cream](/product/skin-reinforcement-get-type-cream)

**For Hair & Body:**
- [Hair Repair Ampoule](/product/repair-ex-damage-care-hair-fill-up-ampoule)
- [Body Peeling Gel](/product/spa-body-peeling-gel)

Tell me about your skin type and concerns, and I'll help you choose the best products!`,

    greeting: `Hello and welcome!

Happy to have you at Eva Clinic. I'm Dr. Eva, a specialized dermatologist.

How can I help you today? You can tell me about:
- Any skin concern you're facing
- Your skin type and needs
- Questions about a specific product
- Request a personalized skincare routine

I'm here to listen`,

    default: `Thank you for your question

To help you better, could you tell me more about:

1. **Your skin type:** Dry, oily, combination, sensitive?
2. **Main concern:** Acne, dryness, wrinkles, dark spots?
3. **Your age:** Helps me provide appropriate advice
4. **Current routine:** Are you using any specific products?

The more I know, the better I can prescribe the right treatment for you.

Or you can simply describe what you notice on your skin`,
  },
};

// ─────────────────────────────────────────────────────────────
// AI DERMATOLOGIST COMPONENT
// ─────────────────────────────────────────────────────────────

const AIDermatologist = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState<Language | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = language ? translations[language] : null;
  const isRTL = language === "ar";

  // Detect language from text
  const detectLanguage = (text: string): Language => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text) ? "ar" : "en";
  };

  // Welcome message when language is selected
  useEffect(() => {
    if (isOpen && language && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: translations[language].welcome,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, language, messages.length]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && language) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, language]);

  // Reset on close
  const handleClose = () => {
    setIsOpen(false);
    setMessages([]);
    setLanguage(null);
  };

  // Generate local response
  const generateResponse = (userInput: string, lang: Language): string => {
    const input = userInput.toLowerCase();
    const r = responses[lang];

    // Acne
    if (
      input.includes("حب") ||
      input.includes("بثور") ||
      input.includes("acne") ||
      input.includes("pimple") ||
      input.includes("breakout")
    ) {
      return r.acne;
    }

    // Dry skin
    if (
      input.includes("جفاف") ||
      input.includes("جاف") ||
      input.includes("dry") ||
      input.includes("dehydrat")
    ) {
      return r.dry;
    }

    // Oily skin
    if (
      input.includes("دهن") ||
      input.includes("زيت") ||
      input.includes("لامع") ||
      input.includes("oily") ||
      input.includes("greasy") ||
      input.includes("shiny")
    ) {
      return r.oily;
    }

    // Aging
    if (
      input.includes("تجاعيد") ||
      input.includes("شيخوخ") ||
      input.includes("خطوط") ||
      input.includes("wrinkle") ||
      input.includes("aging") ||
      input.includes("fine line")
    ) {
      return r.aging;
    }

    // Sensitive skin
    if (
      input.includes("حساس") ||
      input.includes("تهيج") ||
      input.includes("احمرار") ||
      input.includes("sensitive") ||
      input.includes("irritat") ||
      input.includes("redness")
    ) {
      return r.sensitive;
    }

    // Sun protection
    if (
      input.includes("شمس") ||
      input.includes("واقي") ||
      input.includes("spf") ||
      input.includes("sun") ||
      input.includes("protect")
    ) {
      return r.sun;
    }

    // Products
    if (
      input.includes("منتج") ||
      input.includes("product") ||
      input.includes("جميع") ||
      input.includes("كل") ||
      input.includes("all") ||
      input.includes("show")
    ) {
      return r.products;
    }

    // Greeting
    if (
      input.includes("مرحب") ||
      input.includes("السلام") ||
      input.includes("اهلا") ||
      input.includes("هلا") ||
      input.includes("hello") ||
      input.includes("hi") ||
      input.includes("hey")
    ) {
      return r.greeting;
    }

    return r.default;
  };

  // Simulate typing effect - quick 1.5 second delay
  const simulateTyping = async (): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, 1500));
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();

    // Detect language from first message
    if (!language) {
      const detectedLang = detectLanguage(userText);
      setLanguage(detectedLang);
    }

    const currentLang = language || detectLanguage(userText);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);

    // Add typing delay (1.5 seconds)
    await simulateTyping();

    // Generate response locally
    const localResponse = generateResponse(userText, currentLang);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: localResponse,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
    setIsTyping(false);
  };

  // Format message with links and bold
  const formatMessage = (content: string) => {
    const parts = content.split(/(\[.*?\]\(.*?\))/g);

    return parts.map((part, index) => {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const [, text, url] = linkMatch;
        return (
          <Link
            key={index}
            to={url}
            className="text-pink-600 hover:text-pink-700 underline underline-offset-2 font-medium"
            onClick={() => setIsOpen(false)}
          >
            {text}
          </Link>
        );
      }
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
        className={`fixed bottom-6 ${isRTL ? "left-6" : "right-6"} z-50 flex items-center gap-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
          isOpen ? "hidden" : "flex"
        }`}
        style={{ padding: "14px 20px" }}
      >
        <div className="relative">
          <Stethoscope className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-bold text-sm">Dr. Eva</span>
          <span className="text-xs opacity-90">Dermatologist</span>
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <Card
          className={`fixed bottom-6 ${isRTL ? "left-6" : "right-6"} z-50 w-[380px] h-[580px] flex flex-col shadow-2xl border-0 overflow-hidden`}
          style={{
            background: "linear-gradient(135deg, #fff5f7 0%, #ffe4e8 100%)",
            borderRadius: "24px",
          }}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2 border-white/30">
                    <AvatarImage src="/doctor-eva.png" />
                    <AvatarFallback className="bg-white/20 text-white font-bold">
                      <Stethoscope className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-pink-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {t?.doctorName || "Dr. Eva"}
                  </h3>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {t?.doctorTitle || "Consultant Dermatologist"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Language Selection */}
          {!language && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
              <div className="text-center">
                <Globe className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Choose Your Language
                </h3>
                <p className="text-gray-500 text-sm">
                  اختر لغتك المفضلة
                </p>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => setLanguage("ar")}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-6 rounded-2xl text-lg font-bold"
                >
                  العربية
                </Button>
                <Button
                  onClick={() => setLanguage("en")}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-6 rounded-2xl text-lg font-bold"
                >
                  English
                </Button>
              </div>
            </div>
          )}

          {/* Chat Area */}
          {language && (
            <>
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
                            <AvatarFallback className="bg-pink-500 text-white">
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
                            ? `bg-pink-500 text-white ${isRTL ? "rounded-tr-none" : "rounded-tl-none"}`
                            : `bg-white shadow-sm ${isRTL ? "rounded-tl-none" : "rounded-tr-none"}`
                        }`}
                      >
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.role === "assistant"
                            ? formatMessage(message.content)
                            : message.content}
                        </div>
                        <div
                          className={`text-[10px] mt-2 flex items-center gap-1 ${
                            message.role === "user"
                              ? "text-white/70"
                              : "text-gray-400"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {message.timestamp.toLocaleTimeString(
                            isRTL ? "ar-SA" : "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-pink-500 text-white">
                          <Stethoscope className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className={`bg-white rounded-2xl ${isRTL ? "rounded-tl-none" : "rounded-tr-none"} px-4 py-3 shadow-sm`}>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span
                              className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <span
                              className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <span
                              className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">
                            {t.typing}
                          </span>
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
                    {t.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion);
                          setTimeout(() => sendMessage(), 100);
                        }}
                        className="text-xs bg-white hover:bg-pink-500 hover:text-white text-pink-600 border border-pink-200 rounded-full px-3 py-1.5 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setInput(
                          language === "ar"
                            ? "عرض جميع المنتجات"
                            : "Show all products"
                        );
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="text-xs bg-pink-500 text-white hover:bg-pink-600 rounded-full px-3 py-1.5 transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {t.showAllProducts}
                    </button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 bg-white/50 border-t border-pink-100">
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
                    placeholder={t.placeholder}
                    className={`flex-1 rounded-full border-pink-200 focus-visible:ring-pink-500 ${isRTL ? "text-right" : "text-left"}`}
                    disabled={isLoading}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className="rounded-full bg-pink-500 hover:bg-pink-600 w-10 h-10"
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
                  {t.disclaimer}
                </p>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
};

export default AIDermatologist;
