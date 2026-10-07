import type { TeamMemberRow } from "./types";

// PLACEHOLDER team (fictional people) — becomes seed data for `team_members`.
const m = (
  i: number,
  name_en: string,
  name_ar: string,
  role_en: string,
  role_ar: string,
  team: TeamMemberRow["team"],
): TeamMemberRow => ({
  id: `tm-${i}`,
  name_en,
  name_ar,
  role_en,
  role_ar,
  team,
  photo_url: null,
  sort_order: i,
  published: true,
});

export const teamMembers: TeamMemberRow[] = [
  m(1, "Youssef Nabil", "يوسف نبيل", "Founder & CEO", "المؤسس والرئيس التنفيذي", "development"),
  m(2, "Lina Farouk", "لينا فاروق", "Head of Brand", "رئيسة فريق الهوية", "branding"),
  m(3, "Karim Adel", "كريم عادل", "Lead Engineer", "كبير المهندسين", "development"),
  m(
    4,
    "Reem Al-Harbi",
    "ريم الحربي",
    "Performance Marketing Lead",
    "قائدة التسويق بالأداء",
    "marketing",
  ),
  m(
    5,
    "Omar Said",
    "عمر سعيد",
    "AI & Automation Engineer",
    "مهندس الذكاء الاصطناعي والأتمتة",
    "development",
  ),
  m(6, "Nadine Kamal", "نادين كمال", "Senior Brand Designer", "مصممة هوية أولى", "branding"),
];
