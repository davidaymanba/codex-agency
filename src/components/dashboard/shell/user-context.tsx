"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Profile, Role } from "@/lib/dashboard/types";

const RANK: Record<Role, number> = { viewer: 0, editor: 1, admin: 2 };
const Ctx = createContext<Profile | null>(null);

export function DashUserProvider({ user, children }: { user: Profile; children: ReactNode }) {
  return <Ctx.Provider value={user}>{children}</Ctx.Provider>;
}

export function useDashUser() {
  const u = useContext(Ctx);
  if (!u) throw new Error("useDashUser outside dashboard");
  return u;
}

/** UI-level role check (cosmetic only — server actions re-check). */
export function useCan(min: Role) {
  return RANK[useDashUser().role] >= RANK[min];
}
