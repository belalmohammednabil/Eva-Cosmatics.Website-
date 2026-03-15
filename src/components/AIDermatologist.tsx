import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  AlertCircle,
  BookOpen,
  User,
  Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// CONSULTATION STATE MANAGEMENT
// ─────────────────────────────────────────────────────────────

interface PatientProfile {
  skinType?: "oily" | "dry" | "combination" | "normal" | "sensitive";
  skinTone?: "light" | "medium" | "olive" | "tan" | "dark";
  mainConcern?: string;
  concernDuration?: string;
  currentRoutine?: string;
  allergies?: string;
  age?: string;
}

type ConsultationStage = 
  | "greeting"
  | "ask_skin_type"
  | "ask_skin_tone"
  | "ask_main_concern"
  | "ask_duration"
  | "ask_routine"
  | "ask_allergies"
  | "diagnosis"
  | "follow_up";

interface ProductRecommendation {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  skinType: string;
}

interface Message {
  id: string;
  type: "user" | "bot" | "diagnosis" | "loading" | "options";
  content: string;
  products?: ProductRecommendation[];
  options?: { label: string; value: string }[];
}

// ─────────────────────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────────────────────

const translations = {
  title: {
    en: "Dr. Eva - Skin Consultation",
    ar: "د. إيڤا - استشارة جلدية",
  },
  subtitle: {
    en: "Professional Dermatology Consultation",
    ar: "استشارة طبية جلدية متخصصة",
  },
  greeting: {
    en: "Hello! I'm Dr. Eva, your dermatology consultant. Before I can provide you with personalized recommendations, I need to understand your skin better. Let's start with a few questions.\n\nWhat is your skin type?",
    ar: "مرحباً! أنا د. إيڤا، استشارية الجلدية الخاصة بك. قبل أن أتمكن من تقديم توصيات مخصصة لك، أحتاج لفهم بشرتك بشكل أفضل. دعنا نبدأ ببعض الأسئلة.\n\nما هو نوع بشرتك؟",
  },
  skinTypeOptions: {
    en: [
      { label: "Oily", value: "oily" },
      { label: "Dry", value: "dry" },
      { label: "Combination", value: "combination" },
      { label: "Normal", value: "normal" },
      { label: "Sensitive", value: "sensitive" },
    ],
    ar: [
      { label: "دهنية", value: "oily" },
      { label: "جافة", value: "dry" },
      { label: "مختلطة", value: "combination" },
      { label: "عادية", value: "normal" },
      { label: "حساسة", value: "sensitive" },
    ],
  },
  askSkinTone: {
    en: "Thank you. Now, what is your skin tone? This helps me recommend products that work best for your complexion.",
    ar: "شكراً لك. الآن، ما هي درجة لون بشرتك؟ هذا يساعدني في التوصية بمنتجات تناسب لون بشرتك.",
  },
  skinToneOptions: {
    en: [
      { label: "Light / Fair", value: "light" },
      { label: "Medium", value: "medium" },
      { label: "Olive", value: "olive" },
      { label: "Tan / Brown", value: "tan" },
      { label: "Dark / Deep", value: "dark" },
    ],
    ar: [
      { label: "فاتحة", value: "light" },
      { label: "متوسطة", value: "medium" },
      { label: "زيتونية", value: "olive" },
      { label: "سمراء", value: "tan" },
      { label: "داكنة", value: "dark" },
    ],
  },
  askMainConcern: {
    en: "Good. Now, what is your main skin concern that brought you here today? Please describe it in detail.",
    ar: "جيد. الآن، ما هي مشكلة بشرتك الرئيسية التي أتت بك إلى هنا اليوم؟ من فضلك صِفها بالتفصيل.",
  },
  askDuration: {
    en: "I understand. How long have you been experiencing this concern?",
    ar: "أفهم ذلك. منذ متى وأنت تعاني من هذه المشكلة؟",
  },
  durationOptions: {
    en: [
      { label: "Less than a week", value: "week" },
      { label: "1-4 weeks", value: "month" },
      { label: "1-6 months", value: "months" },
      { label: "More than 6 months", value: "chronic" },
    ],
    ar: [
      { label: "أقل من أسبوع", value: "week" },
      { label: "١-٤ أسابيع", value: "month" },
      { label: "١-٦ أشهر", value: "months" },
      { label: "أكثر من ٦ أشهر", value: "chronic" },
    ],
  },
  askRoutine: {
    en: "Do you currently follow any skincare routine? If yes, please briefly describe what products you use.",
    ar: "هل تتبع حالياً أي روتين للعناية بالبشرة؟ إذا نعم، من فضلك صِف بإيجاز المنتجات التي تستخدمها.",
  },
  askAllergies: {
    en: "One last important question: Do you have any known allergies or sensitivities to skincare ingredients?",
    ar: "سؤال أخير مهم: هل لديك أي حساسية معروفة أو تحسس لمكونات منتجات العناية بالبشرة؟",
  },
  analyzing: {
    en: "Analyzing your skin profile and preparing personalized recommendations...",
    ar: "جاري تحليل ملف بشرتك وإعداد توصيات مخصصة...",
  },
  diagnosisIntro: {
    en: "Based on my comprehensive assessment of your skin profile, here is my professional diagnosis and recommendations:",
    ar: "بناءً على تقييمي الشامل لملف بشرتك، إليك تشخيصي المهني وتوصياتي:",
  },
  recommendedProducts: {
    en: "Recommended Products",
    ar: "المنتجات الموصى بها",
  },
  sideEffects: {
    en: "Important Warnings",
    ar: "تحذيرات مهمة",
  },
  usage: {
    en: "Usage Instructions",
    ar: "تعليمات الاستخدام",
  },
  medicalAdvice: {
    en: "Medical Advice",
    ar: "نصيحة طبية",
  },
  followUp: {
    en: "Is there anything else you'd like to discuss about your skin concerns?",
    ar: "هل هناك أي شيء آخر تود مناقشته حول مشاكل بشرتك؟",
  },
  newConsultation: {
    en: "Start New Consultation",
    ar: "بدء استشارة جديدة",
  },
  typeMessage: {
    en: "Type your response...",
    ar: "اكتب ردك...",
  },
  disclaimer: {
    en: "This is an AI consultation for guidance only. For medical conditions, please consult a dermatologist.",
    ar: "هذه استشارة ذكاء اصطناعي للإرشاد فقط. للحالات الطبية، يرجى استشارة طبيب جلدية.",
  },
  noRoutine: {
    en: "No routine / First time",
    ar: "لا يوجد روتين / أول مرة",
  },
  noAllergies: {
    en: "No known allergies",
    ar: "لا توجد حساسية معروفة",
  },
  viewProduct: {
    en: "View Details",
    ar: "عرض التفاصيل",
  },
};

// ─────────────────────────────────────────────────────────────
// MEDICAL KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────

interface MedicalCondition {
  keywords: { en: string[]; ar: string[] };
  diagnosis: { en: string; ar: string };
  recommendedProducts: string[];
  sideEffects: { en: string[]; ar: string[] };
  usage: { en: string; ar: string };
  medicalAdvice: { en: string; ar: string };
}

const medicalKnowledgeBase: Record<string, MedicalCondition> = {
  acne: {
    keywords: {
      en: ["acne", "pimple", "pimples", "breakout", "breakouts", "zit", "zits", "blemish", "blemishes", "oily acne", "hormonal acne", "cystic"],
      ar: ["حب الشباب", "بثور", "حبوب", "بثرة", "حبة", "حبوب الوجه", "البثور", "حب شباب"],
    },
    diagnosis: {
      en: "Based on your description and skin profile, you appear to be experiencing acne vulgaris. This occurs when hair follicles become clogged with sebum and dead skin cells, leading to inflammatory or non-inflammatory lesions. Given your {skinType} skin type and {duration} duration, I recommend a targeted approach.",
      ar: "بناءً على وصفك وملف بشرتك، يبدو أنك تعاني من حب الشباب الشائع. يحدث هذا عندما تنسد بصيلات الشعر بالزهم وخلايا الجلد الميتة. بالنظر إلى نوع بشرتك {skinType} ومدة المشكلة {duration}، أوصي بنهج موجه.",
    },
    recommendedProducts: ["Pore Clearing Clay Mask 2X", "Lychee Soda Bubble Cleanser", "Gentle Exfoliating Toner", "Clarifying Emulsion"],
    sideEffects: {
      en: [
        "Initial purging period (2-4 weeks) where breakouts may temporarily increase",
        "Mild dryness or peeling - this indicates the product is working",
        "Increased photosensitivity - mandatory sun protection",
        "Potential irritation if overused - start with every other day application",
      ],
      ar: [
        "فترة تنقية أولية (2-4 أسابيع) قد تزداد فيها البثور مؤقتاً",
        "جفاف خفيف أو تقشر - هذا يدل على أن المنتج يعمل",
        "زيادة الحساسية للضوء - الحماية من الشمس إلزامية",
        "احتمال حدوث تهيج عند الإفراط في الاستخدام - ابدأ بالتطبيق يوماً بعد يوم",
      ],
    },
    usage: {
      en: "Evening Protocol: Cleanse with bubble cleanser for 60 seconds using gentle circular motions. Apply clay mask 2-3 times weekly, leaving for 10-15 minutes. Use exfoliating toner with cotton pad on affected areas. Finish with clarifying emulsion. Morning: Gentle cleanse and mandatory SPF application.",
      ar: "بروتوكول المساء: نظف بالغسول الرغوي لمدة 60 ثانية بحركات دائرية لطيفة. ضع قناع الطين 2-3 مرات أسبوعياً لمدة 10-15 دقيقة. استخدم التونر المقشر بقطن على المناطق المصابة. أنهِ بالمرطب المنقي. الصباح: تنظيف لطيف ووضع واقي شمس إلزامي.",
    },
    medicalAdvice: {
      en: "If your condition does not improve within 8-12 weeks of consistent treatment, or if you develop nodular/cystic acne, scarring, or psychological distress, I strongly recommend scheduling an appointment with a board-certified dermatologist.",
      ar: "إذا لم تتحسن حالتك خلال 8-12 أسبوعاً من العلاج المستمر، أو إذا ظهر لديك حب شباب عقدي/كيسي، أو ندبات، أو ضيق نفسي، أنصحك بشدة بحجز موعد مع طبيب جلدية معتمد.",
    },
  },
  dryness: {
    keywords: {
      en: ["dry", "dryness", "dehydrated", "flaky", "tight", "rough", "cracked", "scaling", "xerosis"],
      ar: ["جفاف", "جافة", "جاف", "متقشرة", "مشدودة", "خشنة", "متشققة", "بشرة جافة", "الجفاف"],
    },
    diagnosis: {
      en: "Your symptoms suggest xerosis cutis (dry skin), which occurs when the stratum corneum lacks adequate moisture. Given your {skinType} skin type, this can result from impaired barrier function, environmental factors, or transepidermal water loss. Proper hydration and barrier repair are essential.",
      ar: "تشير أعراضك إلى جفاف الجلد، والذي يحدث عندما تفتقر الطبقة القرنية إلى الرطوبة الكافية. بالنظر إلى نوع بشرتك {skinType}، يمكن أن ينتج هذا عن ضعف وظيفة الحاجز، أو العوامل البيئية. الترطيب المناسب وإصلاح الحاجز ضروريان.",
    },
    recommendedProducts: ["Super Aqua Cream", "Anti-Ageing Hyaluronic Acid Face Serum", "Dewy Glow Jelly Cream", "Rice Sheet Mask"],
    sideEffects: {
      en: [
        "Hyaluronic acid requires moisture to function - apply to damp skin",
        "Initial stickiness may occur - this dissipates upon absorption",
        "Rare allergic reactions - discontinue if irritation persists",
        "In very dry climates, HA may draw moisture from skin - layer with occlusive",
      ],
      ar: [
        "حمض الهيالورونيك يحتاج رطوبة ليعمل - ضعه على بشرة رطبة",
        "قد يحدث لزوجة أولية - تختفي عند الامتصاص",
        "ردود فعل تحسسية نادرة - توقف إذا استمر التهيج",
        "في المناخات الجافة جداً، قد يسحب الرطوبة من الجلد - ضع طبقة مانعة فوقه",
      ],
    },
    usage: {
      en: "Hydration Protocol: On damp skin post-cleansing, apply hyaluronic serum using pressing motions (not rubbing). Wait 30 seconds, then apply aqua cream. Use sheet mask 2-3 times weekly as intensive treatment. Apply jelly cream as final occlusive layer.",
      ar: "بروتوكول الترطيب: على بشرة رطبة بعد التنظيف، ضع سيروم الهيالورونيك بحركات ضغط (ليس فرك). انتظر 30 ثانية، ثم ضع كريم الأكوا. استخدم قناع الورقي 2-3 مرات أسبوعياً كعلاج مكثف.",
    },
    medicalAdvice: {
      en: "Persistent dryness despite proper skincare may indicate underlying conditions such as atopic dermatitis, ichthyosis, or thyroid dysfunction. If skin cracking, bleeding, or severe itching occurs, please consult a dermatologist.",
      ar: "الجفاف المستمر رغم العناية الصحيحة قد يشير إلى حالات كامنة مثل التهاب الجلد التأتبي، أو السماك، أو خلل الغدة الدرقية. إذا حدث تشقق أو نزيف أو حكة شديدة، يرجى استشارة طبيب جلدية.",
    },
  },
  oily: {
    keywords: {
      en: ["oily", "greasy", "shiny", "excess oil", "sebum", "large pores", "t-zone", "sebaceous"],
      ar: ["دهنية", "زيتية", "لامعة", "زيوت زائدة", "دهون", "مسام واسعة", "بشرة دهنية", "الدهون"],
    },
    diagnosis: {
      en: "Your description indicates seborrhea or excess sebum production. This occurs when sebaceous glands are hyperactive, often due to hormonal factors, genetics, or paradoxically, over-stripping the skin. The goal is to balance, not eliminate, sebum.",
      ar: "يشير وصفك إلى فرط الإفراز الدهني. يحدث هذا عندما تكون الغدد الدهنية مفرطة النشاط، غالباً بسبب عوامل هرمونية، أو وراثية. الهدف هو التوازن، وليس إزالة الدهون.",
    },
    recommendedProducts: ["Clarifying Emulsion", "Pore Clearing Clay Mask 2X", "Matte Priming UV Shield Sunscreen SPF 37", "Gentle Exfoliating Toner"],
    sideEffects: {
      en: [
        "Clay masks may cause temporary tightness - always follow with moisturizer",
        "Over-exfoliation can trigger rebound oiliness - limit to 2-3 times weekly",
        "Some matte products contain alcohol - may cause dryness",
        "Excessive use of oil-absorbing products can dehydrate skin",
      ],
      ar: [
        "أقنعة الطين قد تسبب شد مؤقت - اتبعها دائماً بمرطب",
        "الإفراط في التقشير يمكن أن يحفز دهنية ارتدادية - حدده بـ 2-3 مرات أسبوعياً",
        "بعض منتجات المات تحتوي على كحول - قد تسبب جفاف",
        "الاستخدام المفرط للمنتجات الماصة للزيوت يمكن أن يجفف البشرة",
      ],
    },
    usage: {
      en: "Sebum Control Protocol: Cleanse morning and evening with gentle cleanser (avoid stripping products). Apply clarifying emulsion - it hydrates without adding oil. Use clay mask 2x weekly. Apply matte sunscreen as final morning step.",
      ar: "بروتوكول التحكم بالدهون: نظف صباحاً ومساءً بغسول لطيف (تجنب المنتجات المجردة). ضع المرطب المنقي - يرطب دون إضافة زيوت. استخدم قناع الطين مرتين أسبوعياً. ضع واقي الشمس المات كخطوة صباحية أخيرة.",
    },
    medicalAdvice: {
      en: "If excessive oiliness is accompanied by irregular menstruation, hair growth changes, or persistent acne, this may indicate hormonal imbalances. I recommend consulting an endocrinologist or dermatologist.",
      ar: "إذا كانت الدهنية المفرطة مصحوبة بعدم انتظام الدورة الشهرية، أو تغيرات في نمو الشعر، أو حب شباب مستمر، فقد يشير هذا إلى اختلالات هرمونية. أنصح باستشارة طبيب غدد صماء أو جلدية.",
    },
  },
  aging: {
    keywords: {
      en: ["aging", "anti-aging", "wrinkle", "wrinkles", "fine lines", "sagging", "mature", "collagen", "elasticity", "crow's feet"],
      ar: ["شيخوخة", "تجاعيد", "خطوط دقيقة", "ترهل", "ناضجة", "كولاجين", "مرونة", "علامات تقدم السن", "التجاعيد", "مكافحة الشيخوخة"],
    },
    diagnosis: {
      en: "Your concerns relate to skin aging. Skin aging involves decreased collagen synthesis, reduced elastin, slower cell turnover, and accumulated UV damage. Given your {skinTone} skin tone and {skinType} skin type, a comprehensive approach targeting multiple aging pathways is most effective.",
      ar: "تتعلق مخاوفك بشيخوخة الجلد. شيخوخة الجلد تشمل انخفاض تخليق الكولاجين، وتقليل الإيلاستين، وبطء تجدد الخلايا، وتراكم أضرار الأشعة فوق البنفسجية. بالنظر إلى لون بشرتك {skinTone} ونوعها {skinType}، النهج الشامل هو الأكثر فعالية.",
    },
    recommendedProducts: ["Anti-Ageing Hyaluronic Acid Face Serum", "Skin Reinforcement Get Type Cream", "Soft Finish Sun Milk SPF50+/PA+++", "Fermented Soybean Bio Cellulose Mask"],
    sideEffects: {
      en: [
        "Active ingredients may cause initial sensitivity - introduce gradually",
        "Hyaluronic acid rarely causes reactions but patch test recommended",
        "Fermented products may have distinctive scent - this is normal",
        "Sun sensitivity increases with anti-aging actives - SPF is non-negotiable",
      ],
      ar: [
        "المكونات النشطة قد تسبب حساسية أولية - أدخلها تدريجياً",
        "حمض الهيالورونيك نادراً ما يسبب ردود فعل لكن يوصى باختبار رقعة",
        "المنتجات المخمرة قد يكون لها رائحة مميزة - هذا طبيعي",
        "تزداد الحساسية للشمس مع مضادات الشيخوخة - واقي الشمس غير قابل للتفاوض",
      ],
    },
    usage: {
      en: "Anti-Aging Protocol: Morning - Serum on damp skin, allow absorption, SPF50+ as final step. Evening - Serum, followed by reinforcement cream. Weekly bio cellulose mask for intensive hydration and firming.",
      ar: "بروتوكول مكافحة الشيخوخة: الصباح - سيروم على بشرة رطبة، اتركه يمتص، واقي شمس SPF50+ كخطوة أخيرة. المساء - سيروم، يليه كريم التعزيز. قناع السليلوز الحيوي أسبوعياً للترطيب المكثف والشد.",
    },
    medicalAdvice: {
      en: "For established wrinkles, volume loss, or significant skin laxity, topical products have limitations. Procedures such as retinoid prescriptions, botulinum toxin, dermal fillers, or laser resurfacing may be discussed with a dermatologist.",
      ar: "للتجاعيد الثابتة، أو فقدان الحجم، أو ترهل الجلد الكبير، المنتجات الموضعية لها حدود. الإجراءات مثل وصفات الريتينويد، أو توكسين البوتولينوم، أو الفيلر، أو التقشير بالليزر يمكن مناقشتها مع طبيب جلدية.",
    },
  },
  sensitive: {
    keywords: {
      en: ["sensitive", "irritated", "redness", "reactive", "burning", "stinging", "rosacea", "eczema", "itchy", "allergic"],
      ar: ["حساسة", "احمرار", "تهيج", "حارقة", "لاذعة", "وردية", "إكزيما", "حكة", "حساسية", "بشرة حساسة", "متهيجة"],
    },
    diagnosis: {
      en: "Your symptoms suggest sensitive or reactive skin, characterized by a compromised epidermal barrier. This may manifest as stinging, burning, redness, or dryness. Barrier repair and gentle formulations are paramount for your {skinType} skin type.",
      ar: "تشير أعراضك إلى بشرة حساسة أو تفاعلية، تتميز بحاجز بشري ضعيف. قد يظهر هذا كوخز، أو حرقان، أو احمرار، أو جفاف. إصلاح الحاجز والتركيبات اللطيفة أمر بالغ الأهمية لنوع بشرتك {skinType}.",
    },
    recommendedProducts: ["Clarifying Emulsion", "Rice Sheet Mask", "Dewy Glow Jelly Cream", "All-Around Safe Block Essence Sun SPF45+"],
    sideEffects: {
      en: [
        "Even gentle products may trigger reactions - always patch test 24-48 hours prior",
        "Introduce only ONE new product at a time, waiting 2 weeks between additions",
        "Fragrance-free does not mean allergen-free - check full ingredient list",
        "Physical sunscreens may leave white cast but are gentler than chemical filters",
      ],
      ar: [
        "حتى المنتجات اللطيفة قد تحفز ردود فعل - اختبر دائماً على منطقة صغيرة 24-48 ساعة قبل",
        "أدخل منتج واحد جديد فقط في كل مرة، وانتظر أسبوعين بين الإضافات",
        "خالي من العطور لا يعني خالي من المواد المسببة للحساسية - تحقق من قائمة المكونات كاملة",
        "واقيات الشمس الفيزيائية قد تترك طبقة بيضاء لكنها ألطف من الفلاتر الكيميائية",
      ],
    },
    usage: {
      en: "Sensitive Skin Protocol: Minimize routine to essentials only. Gentle cleanse (no rubbing), pat dry. Apply calming emulsion while skin is slightly damp. Rice mask 1-2x weekly for soothing. Mineral sunscreen for protection.",
      ar: "بروتوكول البشرة الحساسة: قلل الروتين للأساسيات فقط. تنظيف لطيف (بدون فرك)، جفف بالتربيت. ضع المرطب المهدئ والبشرة رطبة قليلاً. قناع الأرز 1-2 مرة أسبوعياً للتهدئة. واقي شمس معدني للحماية.",
    },
    medicalAdvice: {
      en: "If you experience persistent redness, pustules, flushing, or visible blood vessels, you may have rosacea requiring medical management. Please consult a dermatologist for proper diagnosis.",
      ar: "إذا كنت تعاني من احمرار مستمر، أو بثور، أو احمرار مفاجئ، أو أوعية دموية مرئية، فقد يكون لديك وردية تتطلب إدارة طبية. يرجى استشارة طبيب جلدية للتشخيص الصحيح.",
    },
  },
  pigmentation: {
    keywords: {
      en: ["dark spots", "pigmentation", "hyperpigmentation", "melasma", "sun spots", "uneven", "discoloration", "dark patches", "brightening"],
      ar: ["بقع داكنة", "تصبغ", "كلف", "بقع الشمس", "غير متساوي", "تلون", "بقع", "تفتيح"],
    },
    diagnosis: {
      en: "Your concerns relate to hyperpigmentation. This can result from sun damage, hormonal changes (melasma), or post-inflammatory hyperpigmentation. Given your {skinTone} skin tone, treatment must be approached carefully to avoid worsening pigmentation.",
      ar: "تتعلق مخاوفك بفرط التصبغ. يمكن أن ينتج عن أضرار الشمس، أو التغيرات الهرمونية (الكلف)، أو فرط التصبغ ما بعد الالتهابي. بالنظر إلى لون بشرتك {skinTone}، يجب التعامل مع العلاج بحذر لتجنب تفاقم التصبغ.",
    },
    recommendedProducts: ["Gentle Exfoliating Toner", "Anti-Ageing Hyaluronic Acid Face Serum", "Soft Finish Sun Milk SPF50+/PA+++", "Fermented Soybean Bio Cellulose Mask"],
    sideEffects: {
      en: [
        "Brightening ingredients increase sun sensitivity dramatically",
        "Results take 8-12 weeks minimum - patience is essential",
        "Over-aggressive treatment can worsen pigmentation in darker skin tones",
        "Some ingredients may cause initial purging",
      ],
      ar: [
        "مكونات التفتيح تزيد حساسية الشمس بشكل كبير",
        "النتائج تستغرق 8-12 أسبوعاً كحد أدنى - الصبر ضروري",
        "العلاج العدواني المفرط يمكن أن يفاقم التصبغ في البشرة الداكنة",
        "بعض المكونات قد تسبب تنقية أولية",
      ],
    },
    usage: {
      en: "Brightening Protocol: Evening - Exfoliating toner 2-3x weekly, followed by serum. Morning - SPF50+ is MANDATORY and must be reapplied every 2 hours during sun exposure. Weekly mask for additional support.",
      ar: "بروتوكول التفتيح: المساء - تونر مقشر 2-3 مرات أسبوعياً، يليه سيروم. الصباح - واقي الشمس SPF50+ إلزامي ويجب إعادة تطبيقه كل ساعتين أثناء التعرض للشمس. قناع أسبوعي لدعم إضافي.",
    },
    medicalAdvice: {
      en: "Melasma and deep pigmentation often require prescription treatments such as hydroquinone, tretinoin, or professional procedures like chemical peels. Consult a dermatologist for resistant pigmentation.",
      ar: "الكلف والتصبغ العميق غالباً يتطلب علاجات بوصفة طبية مثل الهيدروكينون أو التريتينوين، أو إجراءات مهنية مثل التقشير الكيميائي. استشر طبيب جلدية للتصبغ المقاوم.",
    },
  },
  darkCircles: {
    keywords: {
      en: ["dark circles", "under eye", "eye bags", "puffy eyes", "tired eyes", "hollow eyes", "eye area"],
      ar: ["هالات سوداء", "تحت العين", "انتفاخ العين", "عيون متعبة", "هالات", "منطقة العين", "سواد تحت العين"],
    },
    diagnosis: {
      en: "Periorbital hyperpigmentation (dark circles) has multiple etiologies: genetic predisposition, thin skin revealing underlying vasculature, hyperpigmentation, allergies, or lifestyle factors. Given your {skinTone} skin tone, treatment approach depends on the underlying cause.",
      ar: "فرط التصبغ حول العين (الهالات السوداء) له أسباب متعددة: الاستعداد الوراثي، رقة الجلد الكاشفة للأوعية الدموية، التصبغ، الحساسية، أو عوامل نمط الحياة. بالنظر إلى لون بشرتك {skinTone}، نهج العلاج يعتمد على السبب الكامن.",
    },
    recommendedProducts: ["Anti-Ageing Hyaluronic Acid Face Serum", "Dewy Glow Jelly Cream", "Rice Sheet Mask"],
    sideEffects: {
      en: [
        "Eye area skin is extremely thin - use only products formulated for this area",
        "Apply with ring finger using gentle tapping motions, never rubbing",
        "Some ingredients may cause milia if too heavy for eye area",
      ],
      ar: [
        "جلد منطقة العين رقيق جداً - استخدم فقط منتجات مصممة لهذه المنطقة",
        "ضع بإصبع البنصر بحركات تربيت لطيفة، لا تفرك أبداً",
        "بعض المكونات قد تسبب الميليا إذا كانت ثقيلة جداً لمنطقة العين",
      ],
    },
    usage: {
      en: "Eye Care Protocol: Apply serum gently around eye area after cleansing. Use ring finger with gentle tapping. Cold compress for 5-10 minutes in the morning can reduce puffiness. Ensure 7-8 hours sleep.",
      ar: "بروتوكول العناية بالعين: ضع السيروم بلطف حول منطقة العين بعد التنظيف. استخدم إصبع البنصر بتربيت لطيف. كمادات باردة لمدة 5-10 دقائق في الصباح تقلل الانتفاخ. تأكد من 7-8 ساعات نوم.",
    },
    medicalAdvice: {
      en: "Sudden onset of dark circles with other symptoms may indicate allergies, thyroid issues, or anemia. If dark circles are accompanied by significant hollowing, dermal fillers may be considered. Consult a dermatologist.",
      ar: "الظهور المفاجئ للهالات السوداء مع أعراض أخرى قد يشير إلى حساسية، أو مشاكل الغدة الدرقية، أو فقر الدم. إذا كانت الهالات مصحوبة بتجويف كبير، يمكن النظر في الفيلر. استشر طبيب جلدية.",
    },
  },
  pores: {
    keywords: {
      en: ["pores", "large pores", "enlarged pores", "visible pores", "blackheads", "sebaceous filaments", "open pores"],
      ar: ["مسام", "مسام واسعة", "مسام كبيرة", "مسام مرئية", "رؤوس سوداء", "فتحات", "حجم المسام"],
    },
    diagnosis: {
      en: "Pore size is primarily determined by genetics and sebum production. Enlarged pores often result from excess sebum, loss of skin elasticity, or sun damage. Given your {skinType} skin type, while pore size cannot be permanently changed, their appearance can be minimized.",
      ar: "حجم المسام يتحدد أساساً بالوراثة وإنتاج الدهون. المسام الواسعة غالباً تنتج عن الدهون الزائدة، أو فقدان مرونة الجلد، أو تلف الشمس. بالنظر إلى نوع بشرتك {skinType}، بينما لا يمكن تغيير حجم المسام بشكل دائم، يمكن تقليل مظهرها.",
    },
    recommendedProducts: ["Pore Clearing Clay Mask 2X", "Gentle Exfoliating Toner", "Clarifying Emulsion", "Lychee Soda Bubble Cleanser"],
    sideEffects: {
      en: [
        "Pore strips and harsh extractions can permanently enlarge pores",
        "Over-exfoliation triggers excess oil production",
        "Clay masks may be drying - limit to 2-3x weekly",
      ],
      ar: [
        "شرائط المسام والاستخراج القاسي يمكن أن يوسع المسام بشكل دائم",
        "الإفراط في التقشير يحفز إنتاج الزيوت الزائدة",
        "أقنعة الطين قد تكون مجففة - حددها بـ 2-3 مرات أسبوعياً",
      ],
    },
    usage: {
      en: "Pore Protocol: Double cleanse in evening. Exfoliating toner 2-3x weekly. Clay mask 2x weekly for deep cleaning. Always finish with lightweight moisturizer - dehydration worsens pore appearance.",
      ar: "بروتوكول المسام: تنظيف مزدوج في المساء. تونر مقشر 2-3 مرات أسبوعياً. قناع الطين مرتين أسبوعياً للتنظيف العميق. أنهِ دائماً بمرطب خفيف - الجفاف يفاقم مظهر المسام.",
    },
    medicalAdvice: {
      en: "For significant pore concerns unresponsive to topical care, professional treatments include: chemical peels, microneedling, or laser treatments. Consult a dermatologist.",
      ar: "لمخاوف المسام الكبيرة غير المستجيبة للعناية الموضعية، العلاجات المهنية تشمل: التقشير الكيميائي، الميكرونيدلنغ، أو علاجات الليزر. استشر طبيب جلدية.",
    },
  },
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
  const [consultationStage, setConsultationStage] = useState<ConsultationStage>("greeting");
  const [patientProfile, setPatientProfile] = useState<PatientProfile>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRTL = language === "ar";
  const lang = language as "en" | "ar";

  const t = useCallback((key: keyof typeof translations) => {
    return translations[key][lang] || translations[key].en;
  }, [lang]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize conversation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      startConsultation();
    }
  }, [isOpen]);

  const startConsultation = () => {
    setConsultationStage("ask_skin_type");
    setPatientProfile({});
    setMessages([
      {
        id: Date.now().toString(),
        type: "bot",
        content: t("greeting") as string,
      },
      {
        id: (Date.now() + 1).toString(),
        type: "options",
        content: "",
        options: translations.skinTypeOptions[lang],
      },
    ]);
  };

  const addBotMessage = (content: string, options?: { label: string; value: string }[]) => {
    const botMessage: Message = {
      id: Date.now().toString(),
      type: options ? "options" : "bot",
      content,
      options,
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  const showTypingThenRespond = async (
    responseContent: string,
    options?: { label: string; value: string }[],
    delay = 1500
  ) => {
    setIsTyping(true);
    const loadingId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: loadingId, type: "loading", content: "" },
    ]);

    await new Promise((resolve) => setTimeout(resolve, delay));

    setMessages((prev) => prev.filter((m) => m.id !== loadingId));
    setIsTyping(false);
    
    if (options) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), type: "bot", content: responseContent },
        { id: (Date.now() + 1).toString(), type: "options", content: "", options },
      ]);
    } else {
      addBotMessage(responseContent);
    }
  };

  const handleOptionSelect = async (value: string, label: string) => {
    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), type: "user", content: label },
    ]);

    switch (consultationStage) {
      case "ask_skin_type":
        setPatientProfile((prev) => ({ ...prev, skinType: value as PatientProfile["skinType"] }));
        setConsultationStage("ask_skin_tone");
        await showTypingThenRespond(
          t("askSkinTone") as string,
          translations.skinToneOptions[lang]
        );
        break;

      case "ask_skin_tone":
        setPatientProfile((prev) => ({ ...prev, skinTone: value as PatientProfile["skinTone"] }));
        setConsultationStage("ask_main_concern");
        await showTypingThenRespond(t("askMainConcern") as string);
        break;

      case "ask_duration":
        setPatientProfile((prev) => ({ ...prev, concernDuration: value }));
        setConsultationStage("ask_routine");
        await showTypingThenRespond(
          t("askRoutine") as string,
          [{ label: t("noRoutine") as string, value: "none" }]
        );
        break;

      case "ask_routine":
        setPatientProfile((prev) => ({ ...prev, currentRoutine: value }));
        setConsultationStage("ask_allergies");
        await showTypingThenRespond(
          t("askAllergies") as string,
          [{ label: t("noAllergies") as string, value: "none" }]
        );
        break;

      case "ask_allergies":
        setPatientProfile((prev) => ({ ...prev, allergies: value }));
        setConsultationStage("diagnosis");
        await generateDiagnosis();
        break;

      default:
        break;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userInput = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), type: "user", content: userInput },
    ]);
    setInput("");

    switch (consultationStage) {
      case "ask_main_concern":
        setPatientProfile((prev) => ({ ...prev, mainConcern: userInput }));
        setConsultationStage("ask_duration");
        await showTypingThenRespond(
          t("askDuration") as string,
          translations.durationOptions[lang]
        );
        break;

      case "ask_routine":
        setPatientProfile((prev) => ({ ...prev, currentRoutine: userInput }));
        setConsultationStage("ask_allergies");
        await showTypingThenRespond(
          t("askAllergies") as string,
          [{ label: t("noAllergies") as string, value: "none" }]
        );
        break;

      case "ask_allergies":
        setPatientProfile((prev) => ({ ...prev, allergies: userInput }));
        setConsultationStage("diagnosis");
        await generateDiagnosis();
        break;

      case "follow_up":
        // Handle follow-up questions
        await handleFollowUp(userInput);
        break;

      default:
        break;
    }
  };

  const findMatchingCondition = (concern: string): MedicalCondition | null => {
    const lowerConcern = concern.toLowerCase();
    for (const [, condition] of Object.entries(medicalKnowledgeBase)) {
      const allKeywords = [...condition.keywords.en, ...condition.keywords.ar];
      if (allKeywords.some((kw) => lowerConcern.includes(kw.toLowerCase()))) {
        return condition;
      }
    }
    return null;
  };

  const generateDiagnosis = async () => {
    setIsTyping(true);
    const loadingId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: loadingId, type: "loading", content: t("analyzing") as string },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 2500));

    setMessages((prev) => prev.filter((m) => m.id !== loadingId));
    setIsTyping(false);

    const condition = findMatchingCondition(patientProfile.mainConcern || "");

    if (!condition) {
      // General recommendation
      addBotMessage(
        lang === "ar"
          ? `بناءً على تقييمي لملف بشرتك (نوع البشرة: ${getSkinTypeLabel(patientProfile.skinType)}, لون البشرة: ${getSkinToneLabel(patientProfile.skinTone)})، أنصحك باستشارة متخصصة. مشكلتك "${patientProfile.mainConcern}" تحتاج تقييم شخصي أدق. يرجى زيارة طبيب جلدية للحصول على تشخيص دقيق.`
          : `Based on my assessment of your skin profile (Skin type: ${getSkinTypeLabel(patientProfile.skinType)}, Skin tone: ${getSkinToneLabel(patientProfile.skinTone)}), I recommend a specialized consultation. Your concern "${patientProfile.mainConcern}" requires a more detailed personal assessment. Please visit a dermatologist for an accurate diagnosis.`
      );
      setConsultationStage("follow_up");
      await showTypingThenRespond(t("followUp") as string, undefined, 1000);
      return;
    }

    // Personalize diagnosis
    let diagnosis = condition.diagnosis[lang];
    diagnosis = diagnosis
      .replace("{skinType}", getSkinTypeLabel(patientProfile.skinType))
      .replace("{skinTone}", getSkinToneLabel(patientProfile.skinTone))
      .replace("{duration}", getDurationLabel(patientProfile.concernDuration));

    // Build comprehensive response
    const diagnosisContent = `
${t("diagnosisIntro")}

**${lang === "ar" ? "التشخيص" : "Diagnosis"}:**
${diagnosis}

**${t("sideEffects")}:**
${condition.sideEffects[lang].map((e) => `• ${e}`).join("\n")}

**${t("usage")}:**
${condition.usage[lang]}

**${t("medicalAdvice")}:**
${condition.medicalAdvice[lang]}
`;

    // Get recommended products
    const recommendedProducts: ProductRecommendation[] = [];
    if (products) {
      for (const productName of condition.recommendedProducts) {
        const product = products.find(
          (p) =>
            p.name.toLowerCase().includes(productName.toLowerCase()) ||
            productName.toLowerCase().includes(p.name.toLowerCase())
        );
        if (product) {
          recommendedProducts.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: resolveProductImage(product.image),
            description: product.description,
            skinType: product.skin_type,
          });
        }
      }
    }

    // Add diagnosis message with products
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "diagnosis",
        content: diagnosisContent,
        products: recommendedProducts,
      },
    ]);

    setConsultationStage("follow_up");
    await showTypingThenRespond(t("followUp") as string, undefined, 1500);
  };

  const handleFollowUp = async (userInput: string) => {
    const condition = findMatchingCondition(userInput);
    
    if (condition) {
      setPatientProfile((prev) => ({ ...prev, mainConcern: userInput }));
      await generateDiagnosis();
    } else {
      await showTypingThenRespond(
        lang === "ar"
          ? "شكراً لسؤالك. إذا كنت تريد استشارة حول مشكلة جلدية أخرى، يمكنك وصفها لي أو بدء استشارة جديدة."
          : "Thank you for your question. If you want to consult about another skin concern, you can describe it to me or start a new consultation."
      );
    }
  };

  const getSkinTypeLabel = (type?: string): string => {
    const labels: Record<string, { en: string; ar: string }> = {
      oily: { en: "Oily", ar: "دهنية" },
      dry: { en: "Dry", ar: "جافة" },
      combination: { en: "Combination", ar: "مختلطة" },
      normal: { en: "Normal", ar: "عادية" },
      sensitive: { en: "Sensitive", ar: "حساسة" },
    };
    return labels[type || ""]?.[lang] || type || "";
  };

  const getSkinToneLabel = (tone?: string): string => {
    const labels: Record<string, { en: string; ar: string }> = {
      light: { en: "Light/Fair", ar: "فاتحة" },
      medium: { en: "Medium", ar: "متوسطة" },
      olive: { en: "Olive", ar: "زيتونية" },
      tan: { en: "Tan/Brown", ar: "سمراء" },
      dark: { en: "Dark/Deep", ar: "داكنة" },
    };
    return labels[tone || ""]?.[lang] || tone || "";
  };

  const getDurationLabel = (duration?: string): string => {
    const labels: Record<string, { en: string; ar: string }> = {
      week: { en: "less than a week", ar: "أقل من أسبوع" },
      month: { en: "1-4 weeks", ar: "١-٤ أسابيع" },
      months: { en: "1-6 months", ar: "١-٦ أشهر" },
      chronic: { en: "more than 6 months", ar: "أكثر من ٦ أشهر" },
    };
    return labels[duration || ""]?.[lang] || duration || "";
  };

  const resetConsultation = () => {
    setMessages([]);
    setConsultationStage("greeting");
    setPatientProfile({});
    setTimeout(startConsultation, 100);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 ${isRTL ? "left-6" : "right-6"} z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group`}
        aria-label="Open AI Dermatologist"
      >
        <Stethoscope className="h-6 w-6" />
        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
          {lang === "ar" ? "متاح" : "Online"}
        </span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 ${isRTL ? "left-6" : "right-6"} z-50 w-[400px] max-w-[calc(100vw-3rem)] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden`}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary-foreground/20">
                <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground">
                  <Stethoscope className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">{t("title")}</h3>
                <p className="text-xs text-primary-foreground/70 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {t("subtitle")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{t("disclaimer")}</span>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[350px] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.type === "loading" ? (
                    <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {message.content || (lang === "ar" ? "جاري التحليل..." : "Analyzing...")}
                      </span>
                    </div>
                  ) : message.type === "options" ? (
                    <div className="flex flex-wrap gap-2 w-full">
                      {message.options?.map((option) => (
                        <Button
                          key={option.value}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleOptionSelect(option.value, option.label)}
                          disabled={isTyping}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  ) : message.type === "user" ? (
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ) : message.type === "diagnosis" ? (
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[95%] space-y-4">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Stethoscope className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </div>
                      </div>

                      {/* Products */}
                      {message.products && message.products.length > 0 && (
                        <div className="border-t border-border pt-3">
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            {t("recommendedProducts")}
                          </h4>
                          <div className="space-y-2">
                            {message.products.map((product) => (
                              <Card
                                key={product.id}
                                className="p-3 hover:shadow-md transition-shadow"
                              >
                                <div className="flex gap-3">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded-lg"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium line-clamp-1">
                                      {translateProductName(product.name, lang)}
                                    </h5>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                      {translateProductDescription(product.description, lang)}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-sm font-bold text-primary">
                                        ${product.price}
                                      </span>
                                      <Link
                                        to={`/product/${product.id}`}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                      >
                                        {t("viewProduct")}
                                        <ExternalLink className="h-3 w-3" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 max-w-[85%]">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            <Stethoscope className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border p-4 space-y-3">
            {consultationStage === "follow_up" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={resetConsultation}
              >
                <ShieldCheck className="h-4 w-4 me-2" />
                {t("newConsultation")}
              </Button>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("typeMessage") as string}
                className="flex-1"
                disabled={isTyping || consultationStage === "ask_skin_type" || consultationStage === "ask_skin_tone"}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isTyping}
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIDermatologist;
