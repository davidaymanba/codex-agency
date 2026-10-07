import type { ProjectCategoryRow, ProjectRow } from "./types";

export const projectCategories: ProjectCategoryRow[] = [
  { id: "cat-dev", slug: "development", name_en: "Development", name_ar: "برمجة", sort_order: 1 },
  { id: "cat-brand", slug: "branding", name_en: "Branding", name_ar: "هوية", sort_order: 2 },
  { id: "cat-mkt", slug: "marketing", name_en: "Marketing", name_ar: "تسويق", sort_order: 3 },
  { id: "cat-ai", slug: "ai", name_en: "AI", name_ar: "ذكاء اصطناعي", sort_order: 4 },
];

const base = { cover_image: null, live_url: null, status: "published" as const };

// PLACEHOLDER case studies (fictional clients) — becomes seed data for `projects`.
export const projects: ProjectRow[] = [
  {
    ...base,
    id: "prj-1",
    slug: "nakhla-salla-store",
    challenge_en:
      "Nakhla's old store was slow on mobile, gifting was buried in notes, and most orders arrived by WhatsApp instead of checkout.",
    challenge_ar:
      "كان متجر نخلة القديم بطيئًا على الجوال، وخيار الإهداء مخفيًا في الملاحظات، ومعظم الطلبات تصل عبر واتساب بدل صفحة الدفع.",
    approach_en:
      "We designed a custom Salla theme around gifting: a guided gift builder, delivery-slot picker and one-page checkout with Mada, Apple Pay and Tabby.",
    approach_ar:
      "صممنا قالب سلة مخصصًا يتمحور حول الإهداء: أداة لتجهيز الهدية خطوة بخطوة، واختيار موعد التوصيل، ودفع من صفحة واحدة عبر مدى وApple Pay وتابي.",
    results: [
      { value: "+64%", label: { en: "conversion rate", ar: "معدل التحويل" } },
      { value: "2.1s", label: { en: "mobile load time", ar: "زمن التحميل على الجوال" } },
      { value: "-40%", label: { en: "WhatsApp order requests", ar: "طلبات الشراء عبر واتساب" } },
    ],
    services: ["development", "branding"],
    title_en: "Nakhla — Salla store rebuild",
    title_ar: "نخلة — إعادة بناء متجر سلة",
    summary_en:
      "A premium dates brand moved to a custom Salla theme with gifting flows and same-day delivery slots.",
    summary_ar:
      "علامة تمور فاخرة انتقلت إلى قالب سلة مخصص مع تجربة إهداء ومواعيد توصيل في نفس اليوم.",
    category: "development",
    tags: ["Salla", "E-commerce", "UX"],
    client_name: "Nakhla",
    year: 2025,
    cover_style: "blocks",
    featured: true,
    sort_order: 1,
  },
  {
    ...base,
    id: "prj-2",
    slug: "skyline-lead-agent",
    challenge_en:
      "Skyline received hundreds of property enquiries a week on WhatsApp; agents spent hours answering the same questions and missed hot leads.",
    challenge_ar:
      "كانت سكايلاين تستقبل مئات الاستفسارات العقارية أسبوعيًا على واتساب، ويقضي الوكلاء ساعات في الرد على الأسئلة نفسها فتضيع الفرص الجادة.",
    approach_en:
      "We built an n8n workflow with an LLM agent that answers in Arabic and English, asks budget and area, scores the lead and books viewings straight into the CRM.",
    approach_ar:
      "بنينا مسار عمل على n8n مع وكيل ذكي يرد بالعربية والإنجليزية، ويسأل عن الميزانية والمنطقة، ويقيّم العميل، ويحجز المعاينة مباشرة في نظام CRM.",
    results: [
      { value: "< 30s", label: { en: "first response time", ar: "زمن أول رد" } },
      { value: "3×", label: { en: "qualified viewings", ar: "معاينات مؤهلة" } },
      { value: "24/7", label: { en: "coverage", ar: "تغطية على مدار الساعة" } },
    ],
    services: ["development"],
    title_en: "Skyline — WhatsApp lead agent",
    title_ar: "سكايلاين — وكيل واتساب للعملاء",
    summary_en:
      "An n8n + LLM agent that qualifies property leads on WhatsApp and books viewings into the CRM.",
    summary_ar:
      "وكيل مبني على n8n ونموذج لغوي يؤهل عملاء العقارات على واتساب ويحجز المعاينات في نظام CRM.",
    category: "ai",
    tags: ["n8n", "AI Agent", "WhatsApp", "CRM"],
    client_name: "Skyline Realty",
    year: 2025,
    cover_style: "flow",
    featured: true,
    sort_order: 2,
  },
  {
    ...base,
    id: "prj-3",
    slug: "fitbox-rebrand",
    challenge_en:
      "Fitbox had grown to nine branches with nine slightly different logos and no system to hold the brand together.",
    challenge_ar: "توسعت فيت بوكس إلى تسعة فروع بتسعة أشكال مختلفة للشعار، دون نظام يجمع الهوية.",
    approach_en:
      "A bold block-based identity, a signage and wayfinding system, and a launch campaign that turned the rebrand into a reason to visit.",
    approach_ar:
      "هوية جريئة مبنية على المكعبات، ونظام لافتات وإرشاد داخلي، وحملة إطلاق جعلت الهوية الجديدة سببًا لزيارة النادي.",
    results: [
      { value: "9", label: { en: "branches rolled out", ar: "فروع طُبّقت فيها الهوية" } },
      {
        value: "+38%",
        label: { en: "new memberships in launch month", ar: "اشتراكات جديدة في شهر الإطلاق" },
      },
      {
        value: "1",
        label: { en: "system for every touchpoint", ar: "نظام واحد لكل نقاط التواصل" },
      },
    ],
    services: ["branding", "marketing"],
    title_en: "Fitbox — rebrand & launch",
    title_ar: "فيت بوكس — هوية جديدة وإطلاق",
    summary_en:
      "A gym chain's new identity, signage system and launch campaign across three cities.",
    summary_ar: "هوية جديدة لسلسلة نوادٍ رياضية، مع نظام لافتات وحملة إطلاق في ثلاث مدن.",
    category: "branding",
    tags: ["Identity", "Guidelines", "Campaign"],
    client_name: "Fitbox",
    year: 2024,
    cover_style: "brackets",
    featured: true,
    sort_order: 3,
  },
  {
    ...base,
    id: "prj-4",
    slug: "gulf-supply-erp",
    challenge_en:
      "Inventory lived in spreadsheets, purchasing in email, and finance closed the month by hand — a week of work every month.",
    challenge_ar:
      "كان المخزون في جداول، والمشتريات في البريد، والمالية تغلق الشهر يدويًا — أسبوع عمل كامل كل شهر.",
    approach_en:
      "A custom ERP with Arabic-first dashboards, approval flows and role-based access, integrated with their accounting system and barcode scanners.",
    approach_ar:
      "نظام ERP مخصص بلوحات تحكم عربية أولًا، ومسارات موافقة، وصلاحيات حسب الدور، مع ربطه بنظام المحاسبة وقارئات الباركود.",
    results: [
      { value: "1 day", label: { en: "month-end close", ar: "لإغلاق نهاية الشهر" } },
      { value: "-27%", label: { en: "stock-outs", ar: "نفاد المخزون" } },
      { value: "120", label: { en: "daily active users", ar: "مستخدم يومي" } },
    ],
    services: ["development"],
    title_en: "Gulf Supply — custom ERP",
    title_ar: "الخليج للتوريد — نظام ERP مخصص",
    summary_en:
      "Inventory, purchasing and finance in one system with Arabic-first dashboards and role-based access.",
    summary_ar:
      "المخزون والمشتريات والمالية في نظام واحد، بلوحات تحكم عربية أولًا وصلاحيات حسب الدور.",
    category: "development",
    tags: ["ERP", "Next.js", "Dashboards"],
    client_name: "Gulf Supply Co.",
    year: 2024,
    cover_style: "grid",
    featured: true,
    sort_order: 4,
  },
  {
    ...base,
    id: "prj-5",
    slug: "maharat-performance",
    challenge_en:
      "Maharat needed to fill two intakes in a crowded market where cost per lead kept rising every season.",
    challenge_ar: "احتاجت مهارات لملء دفعتين في سوق مزدحم ترتفع فيه تكلفة العميل المحتمل كل موسم.",
    approach_en:
      "Full-funnel Meta and Google campaigns, fast bilingual landing pages and an automated WhatsApp follow-up that booked placement calls.",
    approach_ar:
      "حملات متكاملة على ميتا وجوجل، وصفحات هبوط سريعة باللغتين، ومتابعة تلقائية على واتساب لحجز مكالمات تحديد المستوى.",
    results: [
      { value: "-46%", label: { en: "cost per lead", ar: "تكلفة العميل المحتمل" } },
      { value: "2", label: { en: "intakes filled early", ar: "دفعات اكتملت مبكرًا" } },
      { value: "5.4×", label: { en: "return on ad spend", ar: "العائد على الإنفاق الإعلاني" } },
    ],
    services: ["marketing", "development"],
    title_en: "Maharat — enrolment campaign",
    title_ar: "مهارات — حملة التسجيل",
    summary_en: "Full-funnel Meta and Google campaigns that filled two intakes ahead of schedule.",
    summary_ar: "حملات متكاملة على ميتا وجوجل ملأت دفعتين من الطلاب قبل الموعد المحدد.",
    category: "marketing",
    tags: ["Meta Ads", "Google Ads", "Landing pages"],
    client_name: "Maharat Academy",
    year: 2025,
    cover_style: "chart",
    featured: true,
    sort_order: 5,
  },
  {
    ...base,
    id: "prj-6",
    slug: "souq-ops-automation",
    challenge_en:
      "Every Shopify order was copied by hand into the ERP, invoiced, then booked with a courier — slow and error-prone at peak season.",
    challenge_ar:
      "كان كل طلب على شوبيفاي يُنسخ يدويًا إلى نظام ERP ثم تُصدر فاتورته ويُحجز شحنه — عملية بطيئة وكثيرة الأخطاء في المواسم.",
    approach_en:
      "n8n workflows that sync orders, issue e-invoices, book couriers and send WhatsApp tracking updates automatically.",
    approach_ar:
      "مسارات عمل على n8n تزامن الطلبات، وتُصدر الفواتير الإلكترونية، وتحجز الشحن، وترسل تحديثات التتبع على واتساب تلقائيًا.",
    results: [
      { value: "0", label: { en: "manual order entries", ar: "إدخال يدوي للطلبات" } },
      { value: "6 h", label: { en: "saved every day", ar: "توفير يومي" } },
      { value: "99.8%", label: { en: "order accuracy", ar: "دقة الطلبات" } },
    ],
    services: ["development"],
    title_en: "Souq Box — order automation",
    title_ar: "سوق بوكس — أتمتة الطلبات",
    summary_en:
      "Orders, invoices and courier bookings synced automatically between Shopify, the ERP and WhatsApp.",
    summary_ar: "مزامنة تلقائية للطلبات والفواتير وحجوزات الشحن بين شوبيفاي ونظام ERP وواتساب.",
    category: "ai",
    tags: ["n8n", "Shopify", "Automation"],
    client_name: "Souq Box",
    year: 2025,
    cover_style: "flow",
    featured: true,
    sort_order: 6,
  },
];
