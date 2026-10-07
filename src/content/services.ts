import type { ServiceRow } from "./types";

// PLACEHOLDER content — becomes seed data for `services`.
export const services: ServiceRow[] = [
  {
    id: "svc-development",
    slug: "development",
    title_en: "Development",
    title_ar: "البرمجة والتطوير",
    tagline_en: "Software that ships and scales.",
    tagline_ar: "برمجيات تُطلَق بثقة وتنمو معك.",
    description_en:
      "Custom web apps, platforms and integrations engineered for speed, security and the long run — from first commit to production.",
    description_ar:
      "تطبيقات ويب ومنصات وتكاملات مخصصة، مبنية للسرعة والأمان والاستمرارية — من أول سطر كود حتى الإطلاق.",
    sub_services: [
      { en: "Web & mobile apps", ar: "تطبيقات الويب والجوال" },
      { en: "E-commerce platforms", ar: "منصات التجارة الإلكترونية" },
      { en: "ERP & CRM systems", ar: "أنظمة ERP وCRM" },
      { en: "APIs & integrations", ar: "واجهات API والتكاملات" },
      { en: "AI agents & n8n automation", ar: "وكلاء ذكاء اصطناعي وأتمتة n8n" },
    ],
    illustration: "code",
    faqs: [
      {
        q: {
          en: "Do you build on platforms or custom code?",
          ar: "هل تبنون على منصات جاهزة أم بكود مخصص؟",
        },
        a: {
          en: "Both. We recommend Salla, Shopify or WordPress when they fit, and custom builds (Next.js, Laravel, Node) when you need something they can't do.",
          ar: "الاثنان. نرشّح سلة أو شوبيفاي أو ووردبريس عندما تناسب احتياجك، ونبني بكود مخصص عندما تحتاج ما لا توفره هذه المنصات.",
        },
      },
      {
        q: { en: "How long does a typical project take?", ar: "كم يستغرق المشروع عادةً؟" },
        a: {
          en: "A store or marketing site takes 4–8 weeks; platforms, ERP and CRM systems usually 3–6 months, delivered in weekly increments.",
          ar: "المتجر أو الموقع التعريفي من 4 إلى 8 أسابيع، والمنصات وأنظمة ERP وCRM عادةً من 3 إلى 6 أشهر، مع تسليمات أسبوعية.",
        },
      },
      {
        q: { en: "Who owns the code?", ar: "لمن تعود ملكية الكود؟" },
        a: {
          en: "You do. Source code, accounts and documentation are handed over at launch.",
          ar: "لك بالكامل. نسلّمك الكود والحسابات والتوثيق عند الإطلاق.",
        },
      },
    ],
    team_name_en: "Development team",
    team_name_ar: "فريق البرمجة",
    team_description_en:
      "Engineers who own the stack end to end — architecture, code, QA and DevOps.",
    team_description_ar: "مهندسون يتولّون المشروع من البنية حتى الإطلاق — كود واختبار وتشغيل.",
    team_deliverables: [
      { en: "Web & mobile apps", ar: "تطبيقات ويب وجوال" },
      { en: "Platforms & dashboards", ar: "منصات ولوحات تحكم" },
      { en: "Integrations & APIs", ar: "تكاملات وواجهات API" },
      { en: "AI agents & automations", ar: "وكلاء ذكاء اصطناعي وأتمتة" },
    ],
    icon: "code-xml",
    sort_order: 1,
    published: true,
  },
  {
    id: "svc-branding",
    slug: "branding",
    title_en: "Branding",
    title_ar: "الهوية التجارية",
    tagline_en: "Identities built on a system.",
    tagline_ar: "هويات مبنية على نظام واضح.",
    description_en:
      "Strategy, naming and visual identity designed as a system — so your brand stays sharp on every screen, shelf and campaign.",
    description_ar:
      "استراتيجية وتسمية وهوية بصرية مصممة كنظام متكامل، لتبقى علامتك واضحة وقوية على كل شاشة وكل حملة.",
    sub_services: [
      { en: "Brand strategy", ar: "استراتيجية العلامة" },
      { en: "Logo & visual identity", ar: "الشعار والهوية البصرية" },
      { en: "Brand guidelines", ar: "دليل استخدام الهوية" },
      { en: "Packaging & print", ar: "التغليف والمطبوعات" },
      { en: "UI design systems", ar: "أنظمة تصميم الواجهات" },
    ],
    illustration: "construction",
    faqs: [
      {
        q: {
          en: "What does a full brand identity include?",
          ar: "ماذا تشمل الهوية التجارية الكاملة؟",
        },
        a: {
          en: "Strategy, logo system, colour and type, imagery direction, key applications and a guidelines document your team can use.",
          ar: "الاستراتيجية ونظام الشعار والألوان والخطوط وأسلوب الصور وأهم التطبيقات، مع دليل استخدام يعتمد عليه فريقك.",
        },
      },
      {
        q: { en: "Do you design bilingual identities?", ar: "هل تصممون هويات ثنائية اللغة؟" },
        a: {
          en: "Yes — Arabic and English are designed together from day one so both feel native, not translated.",
          ar: "نعم، نصمم العربية والإنجليزية معًا من اليوم الأول حتى تبدو كل لغة أصلية لا مترجمة.",
        },
      },
      {
        q: {
          en: "Can you refresh an existing brand?",
          ar: "هل يمكن تطوير هوية موجودة بدل تغييرها؟",
        },
        a: {
          en: "Often that's the smarter move. We audit what works, keep the equity and modernise the rest.",
          ar: "غالبًا يكون هذا الخيار الأذكى. نراجع ما ينجح ونحافظ على قيمته ونحدّث الباقي.",
        },
      },
    ],
    team_name_en: "Brand team",
    team_name_ar: "فريق الهوية",
    team_description_en:
      "Strategists and designers who turn what you stand for into a system people remember.",
    team_description_ar: "استراتيجيون ومصممون يحوّلون ما تمثّله علامتك إلى نظام بصري لا يُنسى.",
    team_deliverables: [
      { en: "Brand strategy & naming", ar: "الاستراتيجية والتسمية" },
      { en: "Logo & identity systems", ar: "الشعار وأنظمة الهوية" },
      { en: "Guidelines & toolkits", ar: "الأدلة وأدوات العلامة" },
      { en: "Product & UI design", ar: "تصميم المنتجات والواجهات" },
    ],
    icon: "pen-tool",
    sort_order: 2,
    published: true,
  },
  {
    id: "svc-marketing",
    slug: "marketing",
    title_en: "Marketing",
    title_ar: "التسويق الرقمي",
    tagline_en: "Growth you can measure.",
    tagline_ar: "نمو تقيسه بالأرقام.",
    description_en:
      "Performance campaigns, content and social built around data — every dirham, riyal and pound tracked back to revenue.",
    description_ar:
      "حملات أداء ومحتوى وإدارة منصات اجتماعية مبنية على البيانات، مع تتبّع كل ميزانية حتى تتحول إلى مبيعات.",
    sub_services: [
      { en: "Performance ads", ar: "إعلانات الأداء" },
      { en: "Social media management", ar: "إدارة منصات التواصل" },
      { en: "Content & campaigns", ar: "المحتوى والحملات" },
      { en: "SEO & analytics", ar: "تحسين محركات البحث والتحليلات" },
      { en: "Marketing automation", ar: "أتمتة التسويق" },
    ],
    illustration: "chart",
    faqs: [
      {
        q: { en: "Which platforms do you advertise on?", ar: "على أي منصات تُطلقون الإعلانات؟" },
        a: {
          en: "Meta, Google, TikTok and Snapchat, chosen by where your customers actually are in each market.",
          ar: "ميتا وجوجل وتيك توك وسناب شات، ونختار حسب أماكن وجود عملائك فعلًا في كل سوق.",
        },
      },
      {
        q: { en: "How do you report results?", ar: "كيف تقدّمون تقارير النتائج؟" },
        a: {
          en: "A live dashboard plus a monthly review focused on revenue, cost per acquisition and return on ad spend.",
          ar: "لوحة متابعة مباشرة ومراجعة شهرية تركّز على المبيعات وتكلفة العميل والعائد على الإنفاق الإعلاني.",
        },
      },
      {
        q: { en: "Is there a minimum budget?", ar: "هل هناك حد أدنى للميزانية؟" },
        a: {
          en: "We'll tell you honestly what budget your goals need during the first call — no long-term lock-in.",
          ar: "نخبرك بصراحة في أول مكالمة بالميزانية التي تحتاجها أهدافك، ودون التزام طويل.",
        },
      },
    ],
    team_name_en: "Marketing team",
    team_name_ar: "فريق التسويق",
    team_description_en:
      "Media buyers, creators and analysts focused on one number: profitable growth.",
    team_description_ar: "مشترو إعلانات وصنّاع محتوى ومحللون يركّزون على رقم واحد: نمو مربح.",
    team_deliverables: [
      { en: "Paid media on Meta, Google & TikTok", ar: "إعلانات ميتا وجوجل وتيك توك" },
      { en: "Content & social calendars", ar: "خطط المحتوى والمنصات" },
      { en: "SEO & landing pages", ar: "تحسين البحث وصفحات الهبوط" },
      { en: "Reporting & attribution", ar: "التقارير وقياس الأثر" },
    ],
    icon: "trending-up",
    sort_order: 3,
    published: true,
  },
];
