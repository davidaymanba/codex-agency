import type { PostSeed } from "./types";

// PLACEHOLDER articles — becomes seed data for `posts`.
export const posts: PostSeed[] = [
  {
    id: "post-1",
    slug: "whatsapp-ai-agent-n8n",
    title_en: "How a WhatsApp AI agent built on n8n qualifies leads while you sleep",
    title_ar: "كيف يؤهل وكيل ذكاء اصطناعي على واتساب ومبني بـ n8n عملاءك وأنت نائم",
    excerpt_en:
      "Most Gulf and Egyptian customers start on WhatsApp. Here's the workflow we use to answer instantly, ask the right questions and hand sales a qualified lead.",
    excerpt_ar:
      "معظم العملاء في الخليج ومصر يبدؤون من واتساب. هذا هو مسار العمل الذي نستخدمه للرد فورًا وطرح الأسئلة الصحيحة وتسليم فريق المبيعات عميلًا جاهزًا.",
    content_en: [
      {
        type: "p",
        text: "WhatsApp is where buying conversations start in our markets. The problem is speed: a lead that waits an hour is often a lead lost to a competitor who replied in five minutes.",
      },
      { type: "h2", text: "The workflow" },
      {
        type: "ul",
        items: [
          "A WhatsApp message triggers the n8n workflow.",
          "An AI agent detects the language and intent.",
          "It asks two or three qualifying questions — budget, timeline, location.",
          "The lead is scored and created in the CRM.",
          "Hot leads are routed to a human with the full conversation.",
        ],
      },
      { type: "h2", text: "Why n8n" },
      {
        type: "p",
        text: "n8n gives us visual workflows, self-hosting for data-sensitive clients and hundreds of integrations — so the agent can check stock, prices or bookings in your real systems instead of guessing.",
      },
      {
        type: "quote",
        text: "The best automation doesn't replace your team. It makes sure they only spend time on conversations that matter.",
      },
      {
        type: "p",
        text: "If your team answers the same ten questions every day, that's the first workflow worth automating.",
      },
    ],
    content_ar: [
      {
        type: "p",
        text: "واتساب هو المكان الذي تبدأ منه محادثات الشراء في أسواقنا. المشكلة في السرعة: العميل الذي ينتظر ساعة غالبًا يذهب لمنافس ردّ عليه خلال خمس دقائق.",
      },
      { type: "h2", text: "مسار العمل" },
      {
        type: "ul",
        items: [
          "رسالة واتساب تُطلق مسار العمل على n8n.",
          "وكيل ذكي يحدد اللغة والمقصود من الرسالة.",
          "يطرح سؤالين أو ثلاثة للتأهيل: الميزانية والتوقيت والموقع.",
          "يُقيَّم العميل ويُسجَّل في نظام CRM.",
          "العملاء الجاهزون يُحوَّلون لموظف مع المحادثة كاملة.",
        ],
      },
      { type: "h2", text: "لماذا n8n" },
      {
        type: "p",
        text: "يمنحنا n8n مسارات عمل مرئية، وإمكانية التشغيل على خوادم العميل للبيانات الحساسة، ومئات التكاملات — فيستطيع الوكيل التحقق من المخزون أو الأسعار أو الحجوزات في أنظمتك الحقيقية بدل التخمين.",
      },
      {
        type: "quote",
        text: "أفضل أتمتة لا تستبدل فريقك، بل تضمن أن وقته يذهب فقط للمحادثات المهمة.",
      },
      {
        type: "p",
        text: "إذا كان فريقك يجيب على الأسئلة العشرة نفسها كل يوم، فهذا أول مسار يستحق الأتمتة.",
      },
    ],
    cover_image: null,
    cover_style: "flow",
    author_name: "CODEX Team",
    tags: ["AI", "n8n", "WhatsApp"],
    reading_minutes: 4,
    status: "published",
    published_at: "2026-09-18T09:00:00Z",
  },
  {
    id: "post-2",
    slug: "salla-vs-shopify-2026",
    title_en: "Salla or Shopify? Choosing the right platform for a Gulf store",
    title_ar: "سلة أم شوبيفاي؟ كيف تختار المنصة المناسبة لمتجرك في الخليج",
    excerpt_en:
      "Both are excellent — for different businesses. A practical comparison on payments, shipping, apps and growth.",
    excerpt_ar:
      "كلتاهما ممتازة — لكن لأنشطة مختلفة. مقارنة عملية في الدفع والشحن والتطبيقات والنمو.",
    content_en: [
      {
        type: "p",
        text: "We build on both every month, so we get this question a lot. The honest answer: it depends on where you sell and how fast you plan to grow.",
      },
      { type: "h2", text: "Choose Salla when" },
      {
        type: "ul",
        items: [
          "Saudi Arabia is your main market.",
          "You want local payments and shipping working out of the box.",
          "Your team prefers an Arabic-first dashboard.",
        ],
      },
      { type: "h2", text: "Choose Shopify when" },
      {
        type: "ul",
        items: [
          "You sell across several countries and currencies.",
          "You need advanced apps or a headless storefront.",
          "You plan to scale catalogue and traffic quickly.",
        ],
      },
      {
        type: "p",
        text: "Either way, the theme, speed and checkout experience decide most of your conversion rate — that's where custom work pays off.",
      },
    ],
    content_ar: [
      {
        type: "p",
        text: "نبني على المنصتين كل شهر، لذلك يتكرر علينا هذا السؤال كثيرًا. الإجابة الصادقة: يعتمد الأمر على أين تبيع وبأي سرعة تخطط للنمو.",
      },
      { type: "h2", text: "اختر سلة عندما" },
      {
        type: "ul",
        items: [
          "تكون السعودية سوقك الأساسي.",
          "تريد الدفع والشحن المحليين جاهزين من البداية.",
          "يفضّل فريقك لوحة تحكم عربية أولًا.",
        ],
      },
      { type: "h2", text: "اختر شوبيفاي عندما" },
      {
        type: "ul",
        items: [
          "تبيع في عدة دول وبعملات مختلفة.",
          "تحتاج تطبيقات متقدمة أو واجهة Headless.",
          "تخطط لتوسيع المنتجات والزيارات بسرعة.",
        ],
      },
      {
        type: "p",
        text: "في الحالتين، القالب والسرعة وتجربة الدفع تحدد معظم نسبة التحويل — وهنا يظهر أثر العمل المخصص.",
      },
    ],
    cover_image: null,
    cover_style: "blocks",
    author_name: "CODEX Team",
    tags: ["E-commerce", "Salla", "Shopify"],
    reading_minutes: 5,
    status: "published",
    published_at: "2026-08-27T09:00:00Z",
  },
  {
    id: "post-3",
    slug: "bilingual-brand-identity",
    title_en: "Designing a brand that feels native in Arabic and English",
    title_ar: "كيف تصمم هوية تبدو أصلية بالعربية والإنجليزية معًا",
    excerpt_en:
      "Translation is not localisation. Five rules we follow so both languages carry the same personality.",
    excerpt_ar: "الترجمة ليست توطينًا. خمس قواعد نتبعها لتحمل اللغتان الشخصية نفسها.",
    content_en: [
      {
        type: "p",
        text: "Too many regional brands design in English first and 'add Arabic' at the end. The result always shows: cramped type, broken rhythm and a voice that sounds translated.",
      },
      { type: "h2", text: "Five rules" },
      {
        type: "ul",
        items: [
          "Pick both typefaces together and test them side by side.",
          "Give Arabic more line-height — it needs room to breathe.",
          "Write copy natively in each language; never translate taglines.",
          "Mirror layouts properly in RTL, but never mirror the logo.",
          "Check every motion and icon for direction.",
        ],
      },
      {
        type: "p",
        text: "Done right, customers in Riyadh, Dubai and Cairo feel the brand was made for them — because it was.",
      },
    ],
    content_ar: [
      {
        type: "p",
        text: "كثير من العلامات في المنطقة تُصمَّم بالإنجليزية أولًا ثم 'تُضاف' العربية في النهاية. والنتيجة تظهر دائمًا: خطوط مزدحمة وإيقاع مكسور ونبرة تبدو مترجمة.",
      },
      { type: "h2", text: "خمس قواعد" },
      {
        type: "ul",
        items: [
          "اختر الخطين معًا واختبرهما جنبًا إلى جنب.",
          "امنح العربية تباعدًا أكبر بين الأسطر — فهي تحتاج مساحة.",
          "اكتب النصوص بكل لغة مباشرة، ولا تترجم الشعارات.",
          "اعكس التصميم بشكل صحيح من اليمين لليسار، لكن لا تعكس الشعار أبدًا.",
          "راجع اتجاه كل حركة وكل أيقونة.",
        ],
      },
      {
        type: "p",
        text: "عندما يُنفَّذ ذلك جيدًا، يشعر العملاء في الرياض ودبي والقاهرة أن العلامة صُممت لهم — لأنها كذلك فعلًا.",
      },
    ],
    cover_image: null,
    cover_style: "brackets",
    author_name: "CODEX Team",
    tags: ["Branding", "RTL", "Arabic"],
    reading_minutes: 3,
    status: "published",
    published_at: "2026-08-05T09:00:00Z",
  },
];
