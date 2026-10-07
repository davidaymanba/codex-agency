import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  Hash,
  Images,
  Inbox,
  LayoutDashboard,
  Layers,
  MessageSquareQuote,
  Newspaper,
  Settings,
  Shapes,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/dashboard/types";

export type NavKey =
  | "overview"
  | "leads"
  | "analytics"
  | "projects"
  | "services"
  | "posts"
  | "testimonials"
  | "team"
  | "stats"
  | "logos"
  | "media"
  | "users"
  | "settings"
  | "activity";

export type NavItem = { key: NavKey; href: string; icon: LucideIcon; min: Role };
export type NavGroup = { key: "main" | "content" | "admin"; items: NavItem[] };

/** Dashboard navigation. `min` = lowest role that can see the item. */
export const DASH_NAV: NavGroup[] = [
  {
    key: "main",
    items: [
      { key: "overview", href: "/dashboard", icon: LayoutDashboard, min: "viewer" },
      { key: "leads", href: "/dashboard/leads", icon: Inbox, min: "viewer" },
      { key: "analytics", href: "/dashboard/analytics", icon: BarChart3, min: "viewer" },
    ],
  },
  {
    key: "content",
    items: [
      { key: "projects", href: "/dashboard/projects", icon: BriefcaseBusiness, min: "viewer" },
      { key: "services", href: "/dashboard/services", icon: Layers, min: "viewer" },
      { key: "posts", href: "/dashboard/posts", icon: Newspaper, min: "viewer" },
      {
        key: "testimonials",
        href: "/dashboard/testimonials",
        icon: MessageSquareQuote,
        min: "viewer",
      },
      { key: "team", href: "/dashboard/team", icon: UsersRound, min: "viewer" },
      { key: "stats", href: "/dashboard/stats", icon: Hash, min: "viewer" },
      { key: "logos", href: "/dashboard/logos", icon: Shapes, min: "viewer" },
      { key: "media", href: "/dashboard/media", icon: Images, min: "viewer" },
    ],
  },
  {
    key: "admin",
    items: [
      { key: "users", href: "/dashboard/users", icon: Users, min: "admin" },
      { key: "settings", href: "/dashboard/settings", icon: Settings, min: "editor" },
      { key: "activity", href: "/dashboard/activity", icon: Activity, min: "editor" },
    ],
  },
];

export const ALL_NAV = DASH_NAV.flatMap((g) => g.items);
