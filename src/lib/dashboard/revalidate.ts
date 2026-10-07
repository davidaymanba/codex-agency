import "server-only";
import { revalidatePath } from "next/cache";

/**
 * On-demand revalidation after any content change: every public page (both locales) is
 * re-rendered on its next request, so the live site reflects the edit immediately.
 * Backend phase: switch to per-table tags (`use cache` + cacheTag → updateTag).
 */
export function revalidatePublic() {
  revalidatePath("/[locale]", "layout");
}
