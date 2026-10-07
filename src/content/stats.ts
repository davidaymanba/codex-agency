import type { StatRow } from "./types";

// PLACEHOLDER numbers — editable from the dashboard (`stats`).
export const stats: StatRow[] = [
  {
    id: "stat-projects",
    key: "projects",
    value: 180,
    suffix: "+",
    label_en: "projects delivered",
    label_ar: "مشروع منجز",
    sort_order: 1,
    published: true,
  },
  {
    id: "stat-clients",
    key: "clients",
    value: 95,
    suffix: "+",
    label_en: "happy clients",
    label_ar: "عميل راضٍ",
    sort_order: 2,
    published: true,
  },
  {
    id: "stat-years",
    key: "years",
    value: 8,
    suffix: "",
    label_en: "years of experience",
    label_ar: "سنوات خبرة",
    sort_order: 3,
    published: true,
  },
  {
    id: "stat-team",
    key: "team",
    value: 32,
    suffix: "",
    label_en: "team members",
    label_ar: "عضوًا في الفريق",
    sort_order: 4,
    published: true,
  },
];
