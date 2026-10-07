import type { Activity } from "./types";

type T = { (key: string, values?: Record<string, string>): string; has: (key: string) => boolean };

/** Localized one-line description of an activity row (falls back to the stored English summary). */
export function activityText(a: Activity, ta: T, statusLabel: (s: string) => string) {
  if (!a.meta) return a.summary;
  const meta: Record<string, string> = { ...a.meta };
  if (meta.status) meta.status = statusLabel(meta.status);
  if (meta.section && ta.has(`sections.${meta.section}`))
    meta.section = ta(`sections.${meta.section}`);
  if (meta.role && ta.has(`users.roles.${meta.role}`)) meta.role = ta(`users.roles.${meta.role}`);
  return ta.has(`activity.${a.action}`) ? ta(`activity.${a.action}`, meta) : a.summary;
}
