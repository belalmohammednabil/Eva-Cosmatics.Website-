import { useState, useRef, useEffect } from "react";
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
// PROFESSIONAL MEDICAL KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────

interface MedicalCondition {
  keywords: {
    en: string[];
    ar: string[];
  };
  diagnosis: {
    en: string;
    ar: string;
  };
  recommendedProducts: string[];
  sideEffects: {
    en: string[];
    ar: string[];
  };
  usage: {
    en: string;
    ar: string;
  };
  medicalAdvice: {
    en: string;
    ar: string;
  };
}

const medicalKnowledgeBase: Record<string, MedicalCondition> = {
  acne: {
    keywords: {
      en: ["acne", "pimple", "pimples", "breakout", "breakouts", "zit", "zits", "blemish", "blemishes", "oily acne", "hormonal acne", "cystic"],
      ar: ["حب الشباب", "بثور", "حبوب", "بثرة", "حبة", "حبوب الوجه", "البثور", "حب شباب"],
    },
    diagnosis: {
      en: "Based on your description, you appear to be experiencing acne-related concerns. Acne vulgaris occurs when hair follicles become clogged with sebum and dead skin cells, leading to inflammatory or non-inflammatory lesions. This is a common dermatological condition affecting the pilosebaceous unit.",
      ar: "بناءً على وصفك، يبدو أنك تعاني من مشكلة متعلقة بحب الشباب. يحدث حب الشباب الشائع عندما تنسد بصيلات الشعر بالزهم وخلايا الجلد الميتة، مما يؤدي إلى آفات التهابية أو غير التهابية. هذه حالة جلدية شائعة تؤثر على الوحدة الشعرية الدهنية.",
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
      en: "If your condition does not improve within 8-12 weeks of consistent treatment, or if you develop nodular/cystic acne, scarring, or psychological distress, I strongly recommend scheduling an appointment with a board-certified dermatologist. Prescription-strength retinoids, antibiotics, or hormonal therapies may be indicated.",
      ar: "إذا لم تتحسن حالتك خلال 8-12 أسبوعاً من العلاج المستمر، أو إذا ظهر لديك حب شباب عقدي/كيسي، أو ندبات، أو ضيق نفسي، أنصحك بشدة بحجز موعد مع طبيب جلدية معتمد. قد تكون هناك حاجة للريتينويدات أو المضادات الحيوية أو العلاجات الهرمونية بوصفة طبية.",
    },
  },
  dryness: {
    keywords: {
      en: ["dry", "dryness", "dehydrated", "flaky", "tight", "rough", "cracked", "scaling", "xerosis"],
      ar: ["جفاف", "جافة", "جاف", "متقشرة", "مشدودة", "خشنة", "متشققة", "بشرة جافة", "الجفاف"],
    },
    diagnosis: {
      en: "Your symptoms suggest xerosis cutis (dry skin), which occurs when the stratum corneum lacks adequate moisture. This can result from impaired barrier function, environmental factors, or transepidermal water loss (TEWL). Proper hydration and barrier repair are essential.",
      ar: "تشير أعراضك إلى جفاف الجلد، والذي يحدث عندما تفتقر الطبقة القرنية إلى الرطوبة الكافية. يمكن أن ينتج هذا عن ضعف وظيفة الحاجز، أو العوامل البيئية، أو فقدان الماء عبر البشرة. الترطيب المناسب وإصلاح الحاجز ضروريان.",
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
      en: "Hydration Protocol: On damp skin post-cleansing, apply hyaluronic serum using pressing motions (not rubbing). Wait 30 seconds, then apply aqua cream. Use sheet mask 2-3 times weekly as intensive treatment. Apply jelly cream as final occlusive layer. Avoid hot water during cleansing.",
      ar: "بروتوكول الترطيب: على بشرة رطبة بعد التنظيف، ضع سيروم الهيالورونيك بحركات ضغط (ليس فرك). انتظر 30 ثانية، ثم ضع كريم الأكوا. استخدم قناع الورقي 2-3 مرات أسبوعياً كعلاج مكثف. ضع الجيلي كريم كطبقة أخيرة. تجنب الماء الساخن عند التنظيف.",
    },
    medicalAdvice: {
      en: "Persistent dryness despite proper skincare may indicate underlying conditions such as atopic dermatitis, ichthyosis, or thyroid dysfunction. If skin cracking, bleeding, or severe itching occurs, please consult a dermatologist for evaluation and prescription emollients if necessary.",
      ar: "الجفاف المستمر رغم العناية الصحيحة قد يشير إلى حالات كامنة مثل التهاب الجلد التأتبي، أو السماك، أو خلل الغدة الدرقية. إذا حدث تشقق أو نزيف أو حكة شديدة، يرجى استشارة طبيب جلدية للتقييم ووصف المطريات إذا لزم الأمر.",
    },
  },
  oily: {
    keywords: {
      en: ["oily", "greasy", "shiny", "excess oil", "sebum", "large pores", "t-zone", "sebaceous"],
      ar: ["دهنية", "زيتية", "لامعة", "زيوت زائدة", "دهون", "مسام ��اسعة", "بشرة دهنية", "الدهون"],
    },
    diagnosis: {
      en: "Your description indicates seborrhea or excess sebum production. This occurs when sebaceous glands are hyperactive, often due to hormonal factors, genetics, or paradoxically, over-stripping the skin which triggers compensatory oil production. The goal is to balance, not eliminate, sebum.",
      ar: "يشير وصفك إلى فرط الإفراز الدهني. يحدث هذا عندما تكون الغدد الدهنية مفرطة النشاط، غالباً بسبب عوامل هرمونية، أو وراثية، أو على العكس، الإفراط في تجريد البشرة مما يحفز إنتاج زيت تعويضي. الهدف هو التوازن، وليس إزالة الدهون.",
    },
    recommendedProducts: ["Clarifying Emulsion", "Pore Clearing Clay Mask 2X", "Matte Priming UV Shield Sunscreen SPF 37", "Gentle Exfoliating Toner"],
    sideEffects: {
      en: [
        "Clay masks may cause temporary tightness - always follow with moisturizer",
        "Over-exfoliation can trigger rebound oiliness - limit to 2-3 times weekly",
        "Some matte products contain alcohol - may cause dryness in some individuals",
        "Excessive use of oil-absorbing products can dehydrate skin",
      ],
      ar: [
        "أقنعة الطين قد تسبب شد مؤقت - اتبعها دائماً بمرطب",
        "الإفراط في التقشير يمكن أن يحفز دهنية ارتدادية - حدده بـ 2-3 مرات أسبوعياً",
        "بعض منتجات المات تحتوي على كحول - قد تسبب جفاف لبعض الأشخاص",
        "الاستخدام المفرط للمنتجات الماصة للزيوت يمكن أن يجفف البشرة",
      ],
    },
    usage: {
      en: "Sebum Control Protocol: Cleanse morning and evening with gentle cleanser (avoid stripping products). Apply clarifying emulsion - it hydrates without adding oil. Use clay mask 2x weekly. Apply matte sunscreen as final morning step. Blotting papers during day as needed.",
      ar: "بروتوكول التحكم بالدهون: نظف صباحاً ومساءً بغسول لطيف (تجنب المنتجات المجردة). ضع المرطب المنقي - يرطب دون إضافة زيوت. استخدم قناع الطين مرتين أسبوعياً. ضع واقي الشمس المات كخطوة صباحية أخيرة. أوراق التنشيف خلال اليوم حسب الحاجة.",
    },
    medicalAdvice: {
      en: "If excessive oiliness is accompanied by irregular menstruation, hair growth changes, or persistent acne, this may indicate hormonal imbalances such as PCOS. I recommend consulting an endocrinologist or dermatologist for comprehensive evaluation.",
      ar: "إذا كانت الدهنية المفرطة مصحوبة بعدم انتظام الدورة الشهرية، أو تغيرات في نمو الشعر، أو حب شباب مستمر، فقد يشير هذا إلى اختلالات هرمونية مثل متلازمة تكيس المبايض. أنصح باستشارة طبيب غدد صماء أو جلدية للتقييم الشامل.",
    },
  },
  aging: {
    keywords: {
      en: ["aging", "anti-aging", "wrinkle", "wrinkles", "fine lines", "sagging", "mature", "collagen", "elasticity", "crow's feet"],
      ar: ["شيخوخة", "تجاعيد", "خطوط دقيقة", "ترهل", "ناضجة", "كولاجين", "مرونة", "علامات تقدم السن", "التجاعيد", "مكافحة الشيخوخة"],
    },
    diagnosis: {
      en: "Your concerns relate to chronological and/or photoaging. Skin aging involves decreased collagen synthesis, reduced elastin, slower cell turnover, and accumulated UV damage. A comprehensive approach targeting multiple aging pathways is most effective. Prevention is equally important as treatment.",
      ar: "تتعلق مخاوفك بالشيخوخة الزمنية و/أو الضوئية. شيخوخة الجلد تشمل انخفاض تخليق الكولاجين، وتقليل الإيلاستين، وبطء تجدد الخلايا، وتراكم أضرار الأشعة فوق البنفسجية. النهج الشامل الذي يستهدف مسارات شيخوخة متعددة هو الأكثر فعالية. الوقاية مهمة بقدر العلاج.",
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
      en: "Anti-Aging Protocol: Morning - Serum on damp skin, allow absorption, SPF50+ as final step (reapply every 2 hours in sun). Evening - Serum, followed by reinforcement cream focusing on areas of concern. Weekly bio cellulose mask for intensive hydration and firming.",
      ar: "بروتوكول مكافحة الشيخوخة: الصباح - سيروم على بشرة رطبة، اتركه يمتص، واقي شمس SPF50+ كخطوة أخيرة (أعد التطبيق كل ساعتين في الشمس). المساء - سيروم، يليه كريم التعزيز مع التركيز على مناطق القلق. قناع السليلوز الحيوي أسبوعياً للترطيب المكثف والشد.",
    },
    medicalAdvice: {
      en: "For established wrinkles, volume loss, or significant skin laxity, topical products have limitations. Procedures such as retinoid prescriptions, botulinum toxin, dermal fillers, laser resurfacing, or microneedling may be discussed with a board-certified dermatologist or plastic surgeon.",
      ar: "للتجاعيد الثابتة، أو فقدان الحجم، أو ترهل الجلد الكبير، المنتجات الموضعية لها حدود. الإجراءات مثل وصفات الريتينويد، أو توكسين البوتولينوم، أو الفيلر، أو التقشير بالليزر، أو الميكرونيدلنغ يمكن مناقشتها مع طبيب جلدية أو جراح تجميل معتمد.",
    },
  },
  sensitive: {
    keywords: {
      en: ["sensitive", "irritated", "redness", "reactive", "burning", "stinging", "rosacea", "eczema", "itchy", "allergic"],
      ar: ["حساسة", "احمرار", "تهيج", "حارقة", "لاذعة", "وردية", "إكزيما", "حكة", "حساسية", "بشرة حساسة", "متهيجة"],
    },
    diagnosis: {
      en: "Your symptoms suggest sensitive or reactive skin, characterized by a compromised epidermal barrier and heightened immune response. This may manifest as stinging, burning, redness, or dryness in response to environmental or product triggers. Barrier repair and gentle formulations are paramount.",
      ar: "تشير أعراضك إلى بشرة حساسة أو تفاعلية، تتميز بحاجز بشري ضعيف واستجابة مناعية متزايدة. قد يظهر هذا كوخز، أو حرقان، أو احمرار، أو جفاف استجابةً للمحفزات البيئية أو المنتجات. إصلاح الحاجز والتركيبات اللطيفة أمر بالغ الأهمية.",
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
      en: "Sensitive Skin Protocol: Minimize routine to essentials only. Gentle cleanse (no rubbing), pat dry. Apply calming emulsion while skin is slightly damp. Rice mask 1-2x weekly for soothing. Mineral sunscreen for protection. Avoid: hot water, scrubs, alcohol-based products, fragrance.",
      ar: "بروتوكول البشرة الحساسة: قلل الروتين للأساسيات فقط. تنظيف لطيف (بدون فرك)، جفف بالتربيت. ضع المرطب المهدئ والبشرة رطبة قليلاً. قناع الأرز 1-2 مرة أسبوعياً للتهدئة. واقي شمس معدني للحماية. تجنب: الماء الساخن، المقشرات، منتجات الكحول، العطور.",
    },
    medicalAdvice: {
      en: "If you experience persistent redness, pustules, flushing, or visible blood vessels, you may have rosacea requiring medical management. Chronic itching, scaling, or oozing may indicate eczema or contact dermatitis. Please consult a dermatologist for proper diagnosis and prescription treatments.",
      ar: "إذا كنت تعاني من احمرار مستمر، أو بثور، أو احمرار مفاجئ، أو أوعية دموية مرئية، فقد يكون لديك وردية تتطلب إدارة طبية. الحكة المزمنة، أو التقشر، أو الإفرازات قد تشير إلى إكزيما أو التهاب جلدي تماسي. يرجى استشارة طبيب جلدية للتشخيص الصحيح والعلاجات الموصوفة.",
    },
  },
  sunProtection: {
    keywords: {
      en: ["sun", "sunscreen", "spf", "uv", "protection", "tanning", "sunburn", "dark spots", "hyperpigmentation", "melasma"],
      ar: ["شمس", "واقي شمس", "حماية", "أشعة", "تسمير", "حروق شمس", "بقع داكنة", "تصبغ", "كلف", "الشمس"],
    },
    diagnosis: {
      en: "Sun protection is the cornerstone of dermatological care. UV radiation causes 80% of extrinsic skin aging, increases melanoma risk, and exacerbates hyperpigmentation. Adequate SPF use is the single most effective anti-aging and preventive measure available.",
      ar: "الحماية من الشمس هي حجر الزاوية في العناية بالبشرة. الأشعة فوق البنفسجية تسبب 80% من شيخوخة الجلد الخارجية، وتزيد من خطر الميلانوما، وتفاقم التصبغ. استخدام واقي الشمس الكافي هو أكثر إجراء فعال لمكافحة الشيخوخة والوقاية المتاحة.",
    },
    recommendedProducts: ["Soft Finish Sun Milk SPF50+/PA+++", "Matte Priming UV Shield Sunscreen SPF 37", "All-Around Safe Block Essence Sun SPF45+"],
    sideEffects: {
      en: [
        "Chemical sunscreens may sting sensitive eyes - choose mineral formulas for eye area",
        "White cast from mineral sunscreens varies by formulation",
        "Some individuals may experience comedogenic effects - choose non-comedogenic formulas",
        "Reapplication is essential - single morning application is insufficient for sun exposure",
      ],
      ar: [
        "واقيات الشمس الكيميائية قد تلسع العيون الحساسة - اختر تركيبات معدنية لمنطقة العين",
        "الطبقة البيضاء من واقيات الشمس المعدنية تختلف حسب التركيبة",
        "بعض الأشخاص قد يعانون من آثار مسببة للكوميدونات - اختر تركيبات غير كوميدوجينية",
        "إعادة التطبيق ضرورية - التطبيق الصباحي الواحد غير كافٍ للتعرض للشمس",
      ],
    },
    usage: {
      en: "SPF Protocol: Apply 2 finger-lengths (1/4 teaspoon) for face and neck as final skincare step. Apply 15-30 minutes before sun exposure. Reapply every 2 hours during exposure, or immediately after swimming/sweating. Don't forget: ears, neck, décolletage, backs of hands.",
      ar: "بروتوكول واقي الشمس: ضع طول إصبعين (1/4 ملعقة صغيرة) للوجه والرقبة كخطوة أخيرة للعناية. ضعه قبل 15-30 دقيقة من التعرض للشمس. أعد التطبيق كل ساعتين أثناء التعرض، أو فوراً بعد السباحة/التعرق. لا تنسَ: الأذنين، الرقبة، منطقة الصدر، ظهر اليدين.",
    },
    medicalAdvice: {
      en: "No sunscreen provides 100% protection. Combine with protective clothing, wide-brimmed hats, and seeking shade during peak UV hours (10am-4pm). Annual skin cancer screenings are recommended, especially for those with fair skin, history of sunburns, or family history of melanoma.",
      ar: "لا يوفر أي واقي شمس حماية 100%. اجمع مع الملابس الواقية، والقبعات عريضة الحواف، والبحث عن الظل خلال ساعات الذروة للأشعة فوق البنفسجية (10 صباحاً - 4 مساءً). يوصى بفحوصات سرطان الجلد السنوية، خاصة لذوي البشرة الفاتحة، أو تاريخ حروق الشمس، أو التاريخ العائلي للميلانوما.",
    },
  },
  dullness: {
    keywords: {
      en: ["dull", "dullness", "tired", "uneven", "dark spots", "pigmentation", "brightening", "glow", "radiance", "lackluster", "sallow"],
      ar: ["باهتة", "تصبغ", "بقع داكنة", "غير متساوية", "متعبة", "إشراق", "توهج", "بهتان", "لون غير موحد", "شاحبة"],
    },
    diagnosis: {
      en: "Dull, lackluster skin typically results from accumulated dead skin cells, dehydration, oxidative stress, or post-inflammatory hyperpigmentation. Restoring radiance requires exfoliation to accelerate cell turnover, antioxidants to combat free radical damage, and proper hydration.",
      ar: "البشرة الباهتة عادة تنتج عن تراكم خلايا الجلد الميتة، أو الجفاف، أو الإجهاد التأكسدي، أو التصبغ ما بعد الالتهابي. استعادة الإشراق تتطلب التقشير لتسريع تجدد الخلايا، ومضادات الأكسدة لمكافحة أضرار الجذور الحرة، والترطيب المناسب.",
    },
    recommendedProducts: ["Dewy Glow Jelly Cream", "Gentle Exfoliating Toner", "Fermented Soybean Bio Cellulose Mask", "Anti-Ageing Hyaluronic Acid Face Serum"],
    sideEffects: {
      en: [
        "Exfoliating acids may cause temporary tingling - this should subside within minutes",
        "Over-exfoliation causes more harm than benefit - do not exceed recommended frequency",
        "Brightening ingredients increase photosensitivity significantly",
        "Results are gradual - expect 4-8 weeks for visible improvement",
      ],
      ar: [
        "أحماض التقشير قد تسبب وخز مؤقت - يجب أن يختفي خلال دقائق",
        "الإفراط في التقشير يسبب ضرراً أكثر من الفائدة - لا تتجاوز التردد الموصى به",
        "مكونات التفتيح تزيد الحساسية للضوء بشكل كبير",
        "النتائج تدريجية - توقع 4-8 أسابيع للتحسن المرئي",
      ],
    },
    usage: {
      en: "Brightening Protocol: Evening - Apply exfoliating toner 2-3x weekly (not daily) with cotton pad using gentle sweeping motions. Follow with serum and glow cream. Weekly fermented mask for intensive treatment. Morning - Gentle cleanse, hydrating serum, MANDATORY SPF.",
      ar: "بروتوكول التفتيح: المساء - ضع تونر التقشير 2-3 مرات أسبوعياً (ليس يومياً) بقطن بحركات مسح لطيفة. يليه السيروم والكريم المتوهج. قناع مخمر أسبوعياً للعلاج المكثف. الصباح - تنظيف لطيف، سيروم مرطب، واقي شمس إلزامي.",
    },
    medicalAdvice: {
      en: "Persistent pigmentation, especially if asymmetric or rapidly changing, should be evaluated by a dermatologist to rule out melanoma. Melasma (hormonally-driven pigmentation) may require prescription treatments such as hydroquinone, tretinoin, or procedures like chemical peels.",
      ar: "التصبغ المستمر، خاصة إذا كان غير متماثل أو يتغير بسرعة، يجب تقييمه من قبل طبيب جلدية لاستبعاد الميلانوما. الكلف (التصبغ الهرموني) قد يتطلب علاجات بوصفة طبية مثل الهيدروكينون، أو التريتينوين، أو إجراءات مثل التقشير الكيميائي.",
    },
  },
  hairCare: {
    keywords: {
      en: ["hair", "scalp", "dandruff", "dry hair", "damaged hair", "hair loss", "thinning", "frizzy", "oily scalp"],
      ar: ["شعر", "فروة الرأس", "قشرة", "شعر جاف", "شعر تالف", "تساقط الشعر", "ترقق", "هايش", "فروة دهنية"],
    },
    diagnosis: {
      en: "Hair and scalp health are interconnected. Issues may stem from seborrheic dermatitis (dandruff), over-processing, environmental damage, nutritional deficiencies, or underlying conditions. A healthy scalp is essential for healthy hair growth.",
      ar: "صحة الشعر وفروة الرأس مترابطتان. قد تنبع المشاكل من التهاب الجلد الدهني (القشرة)، أو الإفراط في المعالجة، أو الأضرار البيئية، أو نقص التغذية، أو حالات كامنة. فروة الرأس الصحية ضرورية لنمو شعر صحي.",
    },
    recommendedProducts: ["Aromatica Recipe Shampoo", "Advanced Care Clinic Conditioner"],
    sideEffects: {
      en: [
        "New hair products may cause an adjustment period of 1-2 weeks",
        "Clarifying shampoos should not be used daily - they may strip natural oils",
        "Conditioner should be applied mid-length to ends, not on scalp",
        "Some ingredients may cause buildup over time - clarify monthly",
      ],
      ar: [
        "منتجات الشعر الجديدة قد تسبب فترة تكيف من 1-2 أسبوع",
        "الشامبو المنقي لا يجب استخدامه يومياً - قد يجرد الزيوت الطبيعية",
        "البلسم يجب وضعه من منتصف الطول للأطراف، وليس على الفروة",
        "بعض المكونات قد تسبب تراكم مع الوقت - نظف شهرياً",
      ],
    },
    usage: {
      en: "Hair Care Protocol: Shampoo 2-3x weekly (daily if very oily scalp), focusing on scalp massage for 60 seconds to stimulate circulation. Condition ends only, leave 2-3 minutes. Rinse with lukewarm water - hot water strips oils and can damage cuticles.",
      ar: "بروتوكول العناية بالشعر: الشامبو 2-3 مرات أسبوعياً (يومياً إذا كانت الفروة دهنية جداً)، مع التركيز على تدليك الفروة لمدة 60 ثانية لتحفيز الدورة الدموية. البلسم للأطراف فقط، اتركه 2-3 دقائق. اشطف بماء فاتر - الماء الساخن يجرد الزيوت ويمكن أن يتلف القشرة.",
    },
    medicalAdvice: {
      en: "Sudden or patchy hair loss, scalp pain, or persistent dandruff unresponsive to OTC treatments should be evaluated by a dermatologist or trichologist. Conditions like alopecia areata, telogen effluvium, or androgenetic alopecia require medical diagnosis and treatment.",
      ar: "تساقط الشعر المفاجئ أو المتقطع، أو ألم فروة الرأس، أو القشرة المستمرة التي لا تستجيب للعلاجات المتاحة يجب تقييمها من قبل طبيب جلدية أو أخصائي شعر. حالات مثل الثعلبة البقعية، أو تساقط الشعر الكربي، أو الصلع الوراثي تتطلب تشخيصاً وعلاجاً طبياً.",
    },
  },
  bodyCare: {
    keywords: {
      en: ["body", "body lotion", "dry body", "rough skin", "body care", "elbows", "knees", "heels", "keratosis pilaris", "chicken skin"],
      ar: ["جسم", "لوشن", "جسم جاف", "جلد خشن", "العناية بالجسم", "الكوعين", "الركبتين", "الكعبين", "جلد الدجاجة"],
    },
    diagnosis: {
      en: "Body skin, while more resilient than facial skin, also requires proper care. Common concerns include xerosis (dry skin), keratosis pilaris (rough bumps), and areas of hyperkeratosis (thickened skin on elbows, knees, heels). Consistent moisturization and gentle exfoliation are key.",
      ar: "جلد الجسم، رغم أنه أكثر مرونة من جلد الوجه، يتطلب أيضاً عناية مناسبة. المخاوف الشائعة تشمل الجفاف، وتقرن الجلد الشعري (نتوءات خشنة)، ومناطق فرط التقرن (جلد سميك على الكوعين والركبتين والكعبين). ��لترطيب المستمر والتقشير اللطيف هما المفتاح.",
    },
    recommendedProducts: ["Aromatica Recipe Body Lotion"],
    sideEffects: {
      en: [
        "Apply to slightly damp skin post-shower for optimal absorption",
        "Avoid application on broken or irritated skin",
        "Some fragranced products may not suit sensitive individuals",
        "Consistent daily use required for best results",
      ],
      ar: [
        "ضعه على بشرة رطبة قليلاً بعد الاستحمام لامتصاص أمثل",
        "تجنب التطبيق على جلد متشقق أو متهيج",
        "بعض المنتجات المعطرة قد لا تناسب الأشخاص الحساسين",
        "الاستخدام اليومي المستمر مطلوب لأفضل النتائج",
      ],
    },
    usage: {
      en: "Body Care Protocol: After showering, pat skin until slightly damp (not fully dry). Apply lotion using upward strokes towards the heart. Focus extra product on dry areas: elbows, knees, heels. For rough areas, gentle physical exfoliation 1-2x weekly can help.",
      ar: "بروتوكول العناية بالجسم: بعد الاستحمام، جفف البشرة حتى تصبح رطبة قليلاً (ليس جافة تماماً). ضع اللوشن بحركات صاعدة نحو القلب. ركز على المنتج الإضافي على المناطق الجافة: الكوعين، الركبتين، الكعبين. للمناطق الخشنة، التقشير الفيزيائي اللطيف 1-2 مرة أسبوعياً يمكن أن يساعد.",
    },
    medicalAdvice: {
      en: "Extremely dry, scaly, or itchy body skin may indicate conditions like eczema, psoriasis, or ichthyosis requiring prescription treatments. Red, raised, or persistent bumps should be evaluated to rule out other dermatological conditions.",
      ar: "الجلد الجاف للغاية، أو المتقشر، أو الحاك قد يشير إلى حالات مثل الإكزيما، أو الصدفية، أو السماك التي تتطلب علاجات بوصفة طبية. النتوءات الحمراء، أو البارزة، أو المستمرة يجب تقييمها لاستبعاد حالات جلدية أخرى.",
    },
  },
  pores: {
    keywords: {
      en: ["pores", "large pores", "minimize pores", "visible pores", "open pores", "clogged pores", "blackheads", "whiteheads"],
      ar: ["مسام", "مسام واسعة", "تقليل المسام", "مسام مرئية", "مسام مفتوحة", "مسام مسدودة", "رؤوس سوداء", "رؤوس بيضاء"],
    },
    diagnosis: {
      en: "Pore size is primarily determined by genetics and cannot be permanently changed. However, pores can appear larger when dilated by sebum, debris, or loss of surrounding skin elasticity. Keeping pores clean and maintaining skin firmness can minimize their appearance.",
      ar: "حجم المسام يحدده الجينات بشكل أساسي ولا يمكن تغييره بشكل دائم. ومع ذلك، يمكن أن تظهر المسام أكبر عند توسعها بالزهم، أو الشوائب، أو فقدان مرونة الجلد المحيط. الحفاظ على نظافة المسام والحفاظ على صلابة الجلد يمكن أن يقلل من مظهرها.",
    },
    recommendedProducts: ["Pore Clearing Clay Mask 2X", "Gentle Exfoliating Toner", "Clarifying Emulsion", "Lychee Soda Bubble Cleanser"],
    sideEffects: {
      en: [
        "Clay masks may cause temporary skin tightness - follow with moisturizer",
        "Over-cleansing or over-exfoliating will worsen the condition",
        "Avoid pore strips - they can damage skin and worsen pore appearance long-term",
        "Physical extraction should only be performed by professionals",
      ],
      ar: [
        "أقنعة الطين قد تسبب شد مؤقت للجلد - اتبعها بمرطب",
        "الإفراط في التنظيف أو التقشير سيزيد الحالة سوءاً",
        "تجنب شرائط المسام - يمكن أن تتلف الجلد وتزيد مظهر المسام سوءاً على المدى الطويل",
        "الاستخراج الفيزيائي يجب أن يقوم به محترفون فقط",
      ],
    },
    usage: {
      en: "Pore Minimizing Protocol: Double cleanse in evening (oil-based then water-based). Use clay mask 1-2x weekly maximum. Apply exfoliating toner to T-zone. Never skip moisturizer - dehydrated skin makes pores more visible. Consistent SPF prevents collagen loss around pores.",
      ar: "بروتوكول تقليل المسام: تنظيف مزدوج في المساء (زيتي ثم مائي). استخدم قناع الطين 1-2 مرة أسبوعياً كحد أقصى. ضع تونر التقشير على منطقة T. لا تتخطى المرطب أبداً - الجلد الجاف يجعل المسام أكثر وضوحاً. واقي الشمس المستمر يمنع فقدان الكولاجين حول المسام.",
    },
    medicalAdvice: {
      en: "For significantly enlarged pores or persistent blackheads unresponsive to skincare, dermatological procedures such as chemical peels, microneedling, laser treatments, or prescription retinoids may provide more dramatic results. Consult a dermatologist for options.",
      ar: "للمسام المتضخمة بشكل كبير أو الرؤوس السوداء المستمرة التي لا تستجيب للعناية بالبشرة، الإجراءات الجلدية مثل التقشير الكيميائي، أو الميكرونيدلنغ، أو علاجات الليزر، أو الريتينويدات الموصوفة قد توفر نتائج أكثر دراماتيكية. استشر طبيب جلدية للخيارات.",
    },
  },
};

// ─────────────────────────────────────────────────────────────
// MESSAGE TYPES
// ─────────────────────────────────────────────────────────────

interface Message {
  id: string;
  type: "user" | "bot" | "diagnosis" | "loading";
  content: string;
  products?: ProductRecommendation[];
  sideEffects?: string[];
  usage?: string;
  medicalAdvice?: string;
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

const translations = {
  title: {
    en: "Dr. Eva - Dermatology Consultation",
    ar: "د. إيڤا - استشارة طبية جلدية",
  },
  subtitle: {
    en: "Professional Skincare Guidance",
    ar: "إرشادات طبية متخصصة للعناية بالبشرة",
  },
  greeting: {
    en: "Good day. I am Dr. Eva, your virtual dermatology consultant. I am here to provide professional guidance on skincare concerns and recommend appropriate products based on your specific condition. Please describe your skin concern, symptoms, or the area affected, and I will provide a thorough assessment with evidence-based recommendations.",
    ar: "مرحباً بك. أنا د. إيڤا، استشارية الأمراض الجلدية الافتراضية الخاصة بك. أنا هنا لتقديم إرشادات مهنية حول مخاوف العناية بالبشرة والتوصية بالمنتجات المناسبة بناءً على حالتك المحددة. يرجى وصف مشكلتك الجلدية، أو الأعراض، أو المنطقة المصابة، وسأقدم تقييماً شاملاً مع توصيات قائمة على الأدلة.",
  },
  placeholder: {
    en: "Describe your skin condition or concern...",
    ar: "صف حالتك الجلدية أو مشكلتك...",
  },
  prescribedTreatment: {
    en: "Prescribed Treatment",
    ar: "العلاج الموصوف",
  },
  sideEffectsTitle: {
    en: "Important Precautions & Side Effects",
    ar: "احتياطات مهمة وآثار جانبية",
  },
  usageInstructions: {
    en: "Usage Instructions",
    ar: "تعليمات الاستخدام",
  },
  medicalAdviceTitle: {
    en: "Medical Recommendation",
    ar: "التوصية الطبية",
  },
  viewProduct: {
    en: "View Details",
    ar: "عرض التفاصيل",
  },
  analyzing: {
    en: "Analyzing your condition...",
    ar: "جاري تحليل حالتك...",
  },
  disclaimer: {
    en: "This consultation is for informational purposes. For serious conditions, consult a licensed dermatologist.",
    ar: "هذه الاستشارة لأغراض إرشادية. للحالات الجدية، راجع طبيب جلدية مرخص.",
  },
  noMatch: {
    en: "I appreciate you reaching out. To provide you with an accurate assessment and appropriate treatment recommendations, I need more specific information about your concern. Could you please describe:\n\n• The specific skin issue (e.g., acne, dryness, sensitivity, aging concerns)\n• The affected area\n• How long you have been experiencing this\n• Any products you are currently using\n\nThis information will help me provide you with a thorough and personalized consultation.",
    ar: "أقدر تواصلك معي. لتقديم تقييم دقيق وتوصيات علاجية مناسبة، أحتاج معلومات أكثر تحديداً عن مشكلتك. هل يمكنك وصف:\n\n• المشكلة الجلدية المحددة (مثال: حب الشباب، الجفاف، الحساسية، علامات الشيخوخة)\n• المنطقة المصابة\n• منذ متى تعاني من هذه المشكلة\n• أي منتجات تستخدمها حالياً\n\nهذه المعلومات ستساعدني في تقديم استشارة شاملة ومخصصة لك.",
  },
  allProducts: {
    en: "Complete Product Catalog",
    ar: "كتالوج المنتجات الكامل",
  },
  showAllProducts: {
    en: "View All Products",
    ar: "عرض جميع المنتجات",
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRTL = language === "ar";

  const t = (key: keyof typeof translations) => {
    return translations[key][language as "en" | "ar"] || translations[key].en;
  };

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
  }, [isOpen, language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const findMatchingConditions = (text: string): MedicalCondition[] => {
    const lowerText = text.toLowerCase();
    const matches: MedicalCondition[] = [];

    for (const condition of Object.values(medicalKnowledgeBase)) {
      const keywords = [...condition.keywords.en, ...condition.keywords.ar];
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          if (!matches.includes(condition)) {
            matches.push(condition);
          }
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

    const loadingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: loadingId, type: "loading", content: t("analyzing") },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setMessages((prev) => prev.filter((m) => m.id !== loadingId));

    const matchedConditions = findMatchingConditions(input);

    if (matchedConditions.length > 0) {
      const allProductNames = [...new Set(matchedConditions.flatMap((c) => c.recommendedProducts))];
      const recommendations = getProductRecommendations(allProductNames);
      
      const lang = language as "en" | "ar";
      const combinedDiagnosis = matchedConditions.map((c) => c.diagnosis[lang] || c.diagnosis.en).join("\n\n");
      const combinedSideEffects = [...new Set(matchedConditions.flatMap((c) => c.sideEffects[lang] || c.sideEffects.en))];
      const combinedUsage = matchedConditions.map((c) => c.usage[lang] || c.usage.en).join("\n\n");
      const combinedMedicalAdvice = matchedConditions.map((c) => c.medicalAdvice[lang] || c.medicalAdvice.en).join("\n\n");

      const botMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: "diagnosis",
        content: combinedDiagnosis,
        products: recommendations,
        sideEffects: combinedSideEffects,
        usage: combinedUsage,
        medicalAdvice: combinedMedicalAdvice,
      };

      setMessages((prev) => [...prev, botMessage]);
    } else {
      const showAllKeywords = ["all products", "show products", "list products", "what products", "available products", "جميع المنتجات", "كل المنتجات", "عرض المنتجات", "المنتجات المتاحة"];
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
          type: "diagnosis",
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
        type: "diagnosis",
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
        className={`fixed bottom-6 ${isRTL ? "left-6" : "right-6"} z-50 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
        aria-label="Open Dermatology Consultation"
      >
        <Stethoscope className="h-5 w-5" />
        <span className="font-medium hidden sm:inline">{isRTL ? "د. إيڤا" : "Dr. Eva"}</span>
      </button>

      {/* Chat Window */}
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className={`fixed bottom-0 ${isRTL ? "left-0 sm:left-6" : "right-0 sm:right-6"} sm:bottom-6 z-50 w-full sm:w-[420px] h-[100dvh] sm:h-[600px] sm:max-h-[80vh] bg-card border border-border sm:rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-full sm:translate-y-8 opacity-0 pointer-events-none"}`}
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
            {messages.map((message) => (
              <div key={message.id}>
                {message.type === "user" && (
                  <div className={`flex ${isRTL ? "justify-start" : "justify-end"}`}>
                    <div className={`flex items-start gap-2 max-w-[85%] ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className={`bg-primary text-primary-foreground rounded-2xl ${isRTL ? "rounded-bl-md" : "rounded-br-md"} px-4 py-2`}>
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
                  <div className={`flex ${isRTL ? "justify-end" : "justify-start"}`}>
                    <div className={`flex items-start gap-2 max-w-[85%] ${isRTL ? "flex-row-reverse" : ""}`}>
                      <Avatar className="h-8 w-8 flex-shrink-0 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Stethoscope className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className={`bg-secondary text-secondary-foreground rounded-2xl ${isRTL ? "rounded-br-md" : "rounded-bl-md"} px-4 py-2`}>
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                      </div>
                    </div>
                  </div>
                )}

                {message.type === "loading" && (
                  <div className={`flex ${isRTL ? "justify-end" : "justify-start"}`}>
                    <div className={`flex items-start gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <Avatar className="h-8 w-8 flex-shrink-0 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Stethoscope className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className={`bg-secondary text-secondary-foreground rounded-2xl ${isRTL ? "rounded-br-md" : "rounded-bl-md"} px-4 py-3 flex items-center gap-2`}>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">{message.content}</p>
                      </div>
                    </div>
                  </div>
                )}

                {message.type === "diagnosis" && (
                  <div className={`flex ${isRTL ? "justify-end" : "justify-start"}`}>
                    <div className={`flex items-start gap-2 w-full max-w-[95%] ${isRTL ? "flex-row-reverse" : ""}`}>
                      <Avatar className="h-8 w-8 flex-shrink-0 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Stethoscope className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        {/* Diagnosis */}
                        <div className={`bg-secondary text-secondary-foreground rounded-2xl ${isRTL ? "rounded-br-md" : "rounded-bl-md"} px-4 py-3`}>
                          <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                        </div>

                        {/* Products */}
                        {message.products && message.products.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                              <Sparkles className="h-3 w-3" />
                              {t("prescribedTreatment")}
                            </div>
                            <div className="grid gap-2">
                              {message.products.map((product) => (
                                <Card key={product.id} className="p-3 hover:shadow-md transition-shadow">
                                  <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                                    <img
                                      src={product.image}
                                      alt={translateProductName(product.name, language)}
                                      className="w-16 h-16 object-contain rounded-lg bg-secondary/50"
                                    />
                                    <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
                                      <h4 className="font-medium text-sm truncate">
                                        {translateProductName(product.name, language)}
                                      </h4>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                        {translateProductDescription(product.description, product.name, language)}
                                      </p>
                                      <div className={`flex items-center justify-between mt-2 ${isRTL ? "flex-row-reverse" : ""}`}>
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
                              {t("sideEffectsTitle")}
                            </div>
                            <ul className={`text-xs text-amber-800 dark:text-amber-300 space-y-1 ${isRTL ? "pr-2" : "pl-2"}`}>
                              {message.sideEffects.map((effect, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                                  <span>{effect}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Usage */}
                        {message.usage && (
                          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
                              <BookOpen className="h-3 w-3" />
                              {t("usageInstructions")}
                            </div>
                            <p className="text-xs text-blue-800 dark:text-blue-300 whitespace-pre-line leading-relaxed">{message.usage}</p>
                          </div>
                        )}

                        {/* Medical Advice */}
                        {message.medicalAdvice && (
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
                              <ShieldCheck className="h-3 w-3" />
                              {t("medicalAdviceTitle")}
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{message.medicalAdvice}</p>
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
          <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
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

