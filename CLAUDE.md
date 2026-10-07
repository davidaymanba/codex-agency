@AGENTS.md

# CODEX — project guide

Agency website + admin dashboard for **CODEX** (software, branding, marketing; AI agents & n8n automation).
Full brief: `CODEX_WEBSITE_PROMPT.md`. Brand sources: `_source/brand-guideline.pdf`, `_source/logo.jpeg`.
Work proceeds in the 9 phases of the brief — stop after each phase for approval.

## Decisions (beyond the brief)

- **Next.js 16** (not 15): `middleware.ts` is now `src/proxy.ts`; `revalidateTag(tag, profile)` takes 2 args. Read `node_modules/next/dist/docs/` before using unfamiliar APIs.
- **npm** is the package manager.
- Default locale **en** (`/` → `/en`, browser `Accept-Language` may pick `/ar`). Markets: EG, SA, AE, KW, OM → Arabic copy is light Modern Standard Arabic, never dialect. Western digits everywhere.
- Supabase runs **locally** (Docker + CLI) first, then is pushed to a cloud project.
- No anon INSERT policies: `leads` / `page_views` are written by server code (validation, honeypot, rate limit, Turnstile) with the service role.
- Dashboard lives at `/{locale}/dashboard` (shares i18n + RTL). Blog at `/{locale}/blog`.

## Brand rules

- Logo: `src/components/brand/logo.tsx` — rebuilt from the construction grid (viewBox 921×162, stroke 38, radius 38). Pieces are separate paths (`data-part="block" | "bracket"`) for animation. Never stretch, recolor outside the palette, or add effects. Logo is always LTR. `CMark` = standalone C (favicon, loaders, transition flash).
- Motifs: brackets `{ }`, blocks/pixels (square notches, block grids/reveals), code feel (mono labels, caret, grid bg).
- **Blue is the hero; yellow ≤ ~5% of a screen** (primary CTA, one highlighted word, active states). Text on yellow is always navy-950.
- In dark mode blue TEXT uses `blue-400` (`text-link`); `blue-600` is for fills.

## Tokens (`src/app/globals.css`)

- Primitives (only place hex lives): `navy-950 indigo-700 indigo-200 indigo-50 blue-600 blue-400 blue-300 blue-100 yellow-500 yellow-400 yellow-200 yellow-50` + white. Non-CSS contexts (metadata, OG, emails) use `src/config/brand.ts`.
- **Components use semantic tokens**: `bg surface surface-2 fg fg-muted border border-strong primary primary-fg link accent accent-hover accent-fg accent-soft glow focus`.
- Type scale: `text-display-xl text-display text-headline text-title text-lead text-micro` (fluid `clamp()`); tracking/leading switch per script via `--tracking-*` / `--leading-*` on `:lang(ar)`.
- Utilities: `container-x bg-grid glass label-mono glow-blue caret`.
- Theme: `next-themes` with `.dark` class (`storageKey: codex-theme`). Toggle = block-wipe View Transition from the button.

## Fonts (`src/lib/fonts.ts`)

- Neue Montreal → stand-in **Hanken Grotesk**; Morrison → stand-in **Barlow**; mono **JetBrains Mono**; Arabic **Rubik** + **Noto Sans Arabic**.
- When licensed files arrive in `/public/fonts`, swap to `next/font/local` keeping the same `variable` names (instructions in the file).

## i18n / RTL

- `next-intl` v4: `src/i18n/{routing,request,navigation}.ts`, messages in `messages/{en,ar}.json` (typed via `src/i18n/global.d.ts`). Always import `Link`, `usePathname`, `useRouter`, `redirect` from `@/i18n/navigation`.
- **Logical properties only** (`ms- me- ps- pe- start- end-`, `text-start`). Physical `left` is allowed only for pointer-coordinate positioning (cursor).
- Horizontal motion multiplies by `useDirection().sign` (1 LTR / -1 RTL).
- Arabic text animations are word/line level only — never character split/scramble (`RevealText` / `ScrambleText` enforce this).
- Brackets never flip: `BracketFrame` / `CodeLabel` isolate the bracket run as LTR; `BracketGlyph side` is physical.
- DB content: every translatable column has `_en` and `_ar`.

## Animation system

- Import GSAP only from `@/lib/animation/gsap` (registers ScrollTrigger, SplitText, ScrambleText, useGSAP once). Shared eases/durations in `@/lib/animation/constants`.
- Always animate inside `useGSAP(..., { scope, dependencies, revertOnUpdate: true })`. `revertOnUpdate` is mandatory whenever there are dependencies: media-query hooks flip right after hydration, and without it the old and new timelines fight over the same elements (animations freeze half-way).
- Lenis is created once in `SmoothScrollProvider` (public site only), driven by GSAP's ticker; `useSmoothScroll()` → `scrollTo / lock / unlock`.
- Primitives (`@/components/motion`): `RevealText ScrambleText Reveal BlockReveal BracketFrame Magnetic TiltCard Marquee Counter ParallaxLayer`; `MagneticButton / ButtonLink / Button` in `@/components/ui/button`; `CodeLabel` in `@/components/ui/code-label`.
- **No-JS safety**: initial hidden states use `data-reveal` (hidden only under `html.js`) or `.js-blocks`. A head script removes `html.js` if hydration hasn't happened in 4s. Never hide content with inline initial styles in SSR markup.
- Animate `transform`/`opacity` only (filters sparingly). Reduced motion: no Lenis, no cursor, no scramble/parallax/pinning, simple fades. Reveals 0.6–1.2s, hovers 0.2–0.3s, dashboard 150–400ms.
- Data: components never import `src/content/*` directly — they go through `src/lib/data/*` (server-only), which returns localized view models. Supabase replaces the bodies of those functions later.
- Page transitions: `PageTransition` intercepts same-origin link clicks in the capture phase; opt out with `data-no-transition`. Cursor labels: `data-cursor="view|drag|open"`.
- Never put Tailwind `scale-*`/`translate-*` classes on elements GSAP also transforms (Tailwind v4 uses the separate `scale`/`translate` properties, which stack with GSAP's `transform`).

## Folder structure

```
messages/                    en.json, ar.json
public/brand/                logo.svg
src/proxy.ts                 next-intl (+ Supabase session & /dashboard guard from Phase 2)
src/app/[locale]/layout.tsx  root <html lang dir>, fonts, theme, intl
src/app/[locale]/(site)/     public site (header, footer, Lenis, cursor, transitions)
src/app/[locale]/(site)/playground  internal QA page for primitives (noindex)
src/app/[locale]/(site)/{services,solutions,ai-automation,work,blog,about,contact}  inner pages
src/app/{sitemap,robots}.ts   SEO; per-page metadata via `pageMetadata()` in src/lib/seo.ts
src/content/                 typed placeholder rows (= future seed.sql)
src/lib/data/content.ts      the only reader of src/content (server-only, localized view models)
src/lib/schemas/lead.ts      contact-form zod schema shared by client + server action
src/components/brand/        Logo, CMark, BracketGlyph, social icons
src/components/motion/       animation primitives
src/components/site/         Header, MobileMenu, Footer, ThemeToggle, LocaleSwitch, Cursor, PageTransition, WhatsAppButton
src/components/ui/           Button, CodeLabel (+ restyled shadcn in Phase 6)
src/components/providers/    ThemeProvider, SmoothScrollProvider, HydrationMark
src/config/                  site.ts (placeholder contact data → site_settings later), brand.ts
src/hooks/                   useMedia / usePrefersReducedMotion / useFinePointer, useDirection
src/lib/                     fonts, utils (cn), animation/
```

## Dashboard (`/{locale}/dashboard`)

- **Temporary backend until Supabase:** `src/lib/dashboard/mock-db.ts` (in-memory, seeded, resets on restart) behind `src/lib/dashboard/repo.ts`. UI only calls repo functions / server actions — swap repo bodies for Supabase later.
- **Temporary auth:** signed httpOnly cookie (`src/lib/auth/session.ts`), dev-only logins (`admin|editor|viewer@codex.agency`, password `DEV_LOGIN_PASSWORD` = `codex-dev`). Disabled in production.
- Guards: `src/proxy.ts` (optimistic cookie check) → `requireUser()` in the dashboard layout → `authorize(role)` in EVERY server action (`src/app/[locale]/dashboard/actions.ts`) and API route.
- Roles: viewer < editor < admin. `useCan()` only hides UI; the server always re-checks.
- UI kit: `src/components/dashboard/ui/*` (DashButton, Card, Input, StatusBadge, Skeleton, EmptyState, overlays: Tip/Menu/Dialog/Sheet/ConfirmDialog, Segmented). Radix via `radix-ui`, cmdk, sonner, TanStack Table **v8**, dnd-kit, Recharts.
- Filters/pagination/panels live in the URL (`useQueryState`). Tables paginate server-side.
- Charts: one measure → one hue (`--link`); SVGs are forced `dir="ltr"` and mirrored via reversed axes (SVG text anchors break under RTL). No dual axes.
- Relative dates: next-intl `now` + `timeZone: Asia/Riyadh` are set in `src/i18n/request.ts` to avoid hydration mismatches.
- **Content is editable:** site content lives in the temporary store (seeded from `src/content/*`); `src/lib/data/content.ts` reads from it. Every content mutation calls `revalidatePublic()` (`src/lib/dashboard/revalidate.ts`).
- Content forms: shared zod schemas in `src/lib/schemas/content.ts` (form shape uses `{ en, ar }`, server maps to `_en/_ar`). Simple collections = one generic `CollectionManager` driven by `src/lib/dashboard/collections.ts` (server) + `collection-forms.tsx` (client). Projects/Posts have dedicated editors.
- Rich text = Tiptap JSON (`RichDoc`), edited with `RichField` (RTL for Arabic), rendered on the site by `src/components/ui/rich-text.tsx` (React elements only, URL allow-list).
- Media: uploads via `/api/dashboard/media` (magic-byte checked, no SVG, ≤ 8 MB), served by `/api/media/[id]` (TEMPORARY, in memory). Drafts preview via `/api/dashboard/preview` (Next draft mode).
- **Site settings** (`db.settings`, dashboard → Settings) drive contact details, WhatsApp number, socials, default SEO, the announcement bar and maintenance mode. Server code reads `getSettings()`; client components use `useSiteContact()`. Never hardcode contact data.
- Users & roles (admin): invite links (`/accept-invite?token=`), role changes and deactivation with guards (no self-changes, ≥ 1 active admin). Pages use `requireUser(locale, role)` (redirects); actions use `authorize(role)`.
- Analytics: cookie-less tracking via `PageTracker` → `/api/track` (DNT/GPC respected, bots skipped, salted daily visitor hash, no IPs stored).
- New lead "realtime": `LeadStreamProvider` polls every 15s (swap for Supabase Realtime later).

## Security & performance rules (Phase 9)

- Rate limits (`src/lib/rate-limit.ts`, in-memory until Supabase): login 5/15 min per account + 20 per IP, magic-link/forgot 5/15 min, contact form 5/10 min per IP, tracking 120/min, uploads 60/10 min. Optional Cloudflare Turnstile on the contact form (env keys).
- Session tokens are signed AND time-limited (7 days); `SESSION_SECRET` is mandatory in production.
- Cookie-auth POST routes check `sameOrigin()`; redirects only accept same-site paths (no `//host`).
- Security headers live in `next.config.ts` (`headers()`); dashboard is `no-store` + `noindex`.
- **LCP rule:** above-the-fold content is never hidden. `trigger="mount"` reveals animate visible text (move/blur/scramble), only `trigger="scroll"` content uses `data-reveal`. SplitText runs lazily when a heading nears the viewport.
- Keep `motion` out of always-loaded site components (use CSS or `useSpringPointer`); heavy below-the-fold sections are `next/dynamic`.
- Fonts: variable files where possible, only weights actually used.
- QA builds: `NEXT_DIST_DIR=.next-qa npx next build` so they never clash with a running `next dev`.

## Conventions

- TypeScript strict; Server Components by default, `"use client"` only where needed.
- `cn()` for class merging; `cva` for variants.
- Icon-only buttons need `aria-label`. Focus ring = 2px `--focus` outline, square corners.
- Placeholder copy must be realistic EN + natural AR (no lorem ipsum); mark it as placeholder in seed data.
- Checks before handing off: `npx tsc --noEmit`, `npm run lint`, `npm run build`.
