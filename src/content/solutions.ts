import type { SolutionRow } from "./types";

// PLACEHOLDER content — becomes seed data for `solutions`.
export const solutions: SolutionRow[] = [
  {
    id: "sol-ecommerce",
    slug: "e-commerce",
    features: [
      { en: "Custom or platform-based stores", ar: "متاجر مخصصة أو على المنصات" },
      {
        en: "Payment gateways: Mada, Apple Pay, Tabby, Tamara",
        ar: "بوابات الدفع: مدى وApple Pay وتابي وتمارا",
      },
      { en: "Shipping & stock integrations", ar: "تكامل الشحن والمخزون" },
      { en: "Conversion-focused UX", ar: "تجربة شراء ترفع المبيعات" },
    ],
    kind: "solution",
    title_en: "E-commerce",
    title_ar: "التجارة الإلكترونية",
    description_en:
      "Stores that convert — custom or on Salla and Shopify, wired to payments, shipping and stock.",
    description_ar: "متاجر تحقق مبيعات — مخصصة أو على سلة وشوبيفاي، مربوطة بالدفع والشحن والمخزون.",
    icon: "shopping-bag",
    sort_order: 1,
    published: true,
  },
  {
    id: "sol-elearning",
    slug: "e-learning",
    features: [
      { en: "Video courses & live classes", ar: "دورات مسجّلة وحصص مباشرة" },
      { en: "Quizzes, certificates & progress tracking", ar: "اختبارات وشهادات وتتبع التقدّم" },
      { en: "Subscriptions & bundles", ar: "اشتراكات وباقات" },
      { en: "Arabic-first student experience", ar: "تجربة عربية أولًا للمتعلم" },
    ],
    kind: "solution",
    title_en: "E-learning",
    title_ar: "منصات التعليم الإلكتروني",
    description_en:
      "Course platforms with video, quizzes, certificates and subscriptions your students enjoy using.",
    description_ar:
      "منصات دورات بالفيديو والاختبارات والشهادات والاشتراكات، بتجربة يستمتع بها المتعلمون.",
    icon: "graduation-cap",
    sort_order: 2,
    published: true,
  },
  {
    id: "sol-erp",
    slug: "erp",
    features: [
      { en: "Inventory & warehouses", ar: "المخزون والمستودعات" },
      { en: "Purchasing & finance", ar: "المشتريات والمالية" },
      { en: "HR & payroll", ar: "الموارد البشرية والرواتب" },
      { en: "Role-based dashboards", ar: "لوحات تحكم حسب الصلاحيات" },
    ],
    kind: "solution",
    title_en: "ERP",
    title_ar: "أنظمة ERP",
    description_en:
      "Inventory, finance, HR and operations in one system shaped around how your company actually works.",
    description_ar:
      "المخزون والمالية والموارد البشرية والعمليات في نظام واحد مصمم حول طريقة عمل شركتك.",
    icon: "boxes",
    sort_order: 3,
    published: true,
  },
  {
    id: "sol-crm",
    slug: "crm",
    features: [
      { en: "Visual sales pipeline", ar: "مسار مبيعات مرئي" },
      { en: "WhatsApp & email in one inbox", ar: "واتساب والبريد في صندوق واحد" },
      { en: "Lead scoring with AI", ar: "تقييم العملاء بالذكاء الاصطناعي" },
      { en: "Automated follow-ups", ar: "متابعات تلقائية" },
    ],
    kind: "solution",
    title_en: "CRM",
    title_ar: "أنظمة CRM",
    description_en:
      "Pipelines, follow-ups and WhatsApp in one place, so no lead slips through the cracks.",
    description_ar: "مسارات البيع والمتابعات وواتساب في مكان واحد، حتى لا يضيع أي عميل محتمل.",
    icon: "contact",
    sort_order: 4,
    published: true,
  },
  {
    id: "sol-salla",
    slug: "salla",
    features: [
      { en: "Custom Salla themes", ar: "قوالب سلة مخصصة" },
      { en: "Salla apps & integrations", ar: "تطبيقات وتكاملات سلة" },
      { en: "Migration to Salla", ar: "النقل إلى سلة" },
      { en: "Speed & SEO optimisation", ar: "تحسين السرعة ومحركات البحث" },
    ],
    kind: "platform",
    title_en: "Salla",
    title_ar: "سلة",
    description_en:
      "Themes, apps and integrations for Salla stores across Saudi Arabia and the Gulf.",
    description_ar: "قوالب وتطبيقات وتكاملات لمتاجر سلة في السعودية والخليج.",
    icon: "si:siSalla",
    sort_order: 5,
    published: true,
  },
  {
    id: "sol-shopify",
    slug: "shopify",
    features: [
      { en: "Custom themes & sections", ar: "قوالب وأقسام مخصصة" },
      { en: "Checkout extensions", ar: "إضافات صفحة الدفع" },
      { en: "Headless storefronts", ar: "واجهات Headless" },
      { en: "Multi-currency for the Gulf", ar: "تعدد العملات لأسواق الخليج" },
    ],
    kind: "platform",
    title_en: "Shopify",
    title_ar: "شوبيفاي",
    description_en: "Custom themes, checkout extensions and headless storefronts built to scale.",
    description_ar: "قوالب مخصصة وإضافات للدفع وواجهات Headless قابلة للتوسع.",
    icon: "si:siShopify",
    sort_order: 6,
    published: true,
  },
  {
    id: "sol-wordpress",
    slug: "wordpress",
    features: [
      { en: "Fast custom WordPress themes", ar: "قوالب ووردبريس مخصصة وسريعة" },
      { en: "WooCommerce stores", ar: "متاجر ووكومرس" },
      { en: "Security & maintenance", ar: "الحماية والصيانة" },
      { en: "Easy editing for your team", ar: "تعديل سهل لفريقك" },
    ],
    kind: "platform",
    title_en: "WordPress",
    title_ar: "ووردبريس",
    description_en:
      "Fast, secure WordPress and WooCommerce sites your team can edit with confidence.",
    description_ar: "مواقع ووردبريس وووكومرس سريعة وآمنة، يسهل على فريقك تعديلها بثقة.",
    icon: "si:siWordpress",
    sort_order: 7,
    published: true,
  },
];
