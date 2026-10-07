import { Barlow, Hanken_Grotesk, JetBrains_Mono, Noto_Sans_Arabic, Rubik } from "next/font/google";

/**
 * Brand fonts.
 *
 * Neue Montreal (body/UI) and Morrison (display) are licensed and not on Google Fonts.
 * Until the files land in /public/fonts, close stand-ins are used:
 *   Neue Montreal → Hanken Grotesk   ·   Morrison → Barlow (DIN-like, uppercase display)
 *
 * To switch to the real fonts, replace `montreal` / `morrison` with:
 *   import localFont from "next/font/local";
 *   export const montreal = localFont({
 *     src: [
 *       { path: "../../public/fonts/NeueMontreal-Light.woff2", weight: "300" },
 *       { path: "../../public/fonts/NeueMontreal-Medium.woff2", weight: "500" },
 *       { path: "../../public/fonts/NeueMontreal-Bold.woff2", weight: "700" },
 *     ],
 *     variable: "--font-montreal",
 *     display: "swap",
 *   });
 * Keep the `variable` names — everything else reads from them.
 */
// Variable font: ONE file covers Light 300 → Bold 700 (instead of three static files).
export const montreal = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-montreal",
  display: "swap",
});

export const morrison = Barlow({
  subsets: ["latin"],
  weight: ["700"], // display headlines only use Bold
  variable: "--font-morrison",
  display: "swap",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-face",
  display: "swap",
  preload: false,
});

// Arabic faces are not preloaded so English pages don't pay for them.
export const rubik = Rubik({
  subsets: ["arabic", "latin"],
  variable: "--font-rubik",
  display: "swap",
  preload: false,
});

export const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  display: "swap",
  preload: false,
});

export const fontVariables = [montreal, morrison, mono, rubik, notoArabic]
  .map((f) => f.variable)
  .join(" ");
