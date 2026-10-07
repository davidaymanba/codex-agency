import { notFound } from "next/navigation";

/** Unknown paths under a locale render the localized not-found page inside the site chrome. */
export default function CatchAll() {
  notFound();
}
