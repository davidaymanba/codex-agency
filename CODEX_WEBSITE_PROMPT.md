# CODEX — Agency Website Build Brief

You are a senior creative developer and UI engineer (Awwwards / FWA level). Build the official website for **CODEX**, a digital agency offering Software Development, Branding, and Marketing, **plus a full admin dashboard** to manage all site content and incoming leads, with **Supabase** as the backend. Both the public site and the dashboard must feel premium, bold, technical, and alive — heavy, purposeful animation everywhere, but never at the cost of performance, readability, usability, or accessibility.

Work in **phases** (see the end of this file). After each phase, stop, summarize what you built, and wait for my approval before continuing.

---

## 1. About the company

- **CODEX** is a full-service digital agency with three dedicated in-house teams:
  - **Development team** — custom software, web apps, platforms.
  - **Brand team** — brand strategy, visual identity, logo, guidelines.
  - **Marketing team** — digital marketing, social media, campaigns, performance ads.
- **Solutions we build:** E-commerce, E-learning platforms, ERP systems, CRM systems.
- **Platforms we work with:** Salla, Shopify, WordPress, plus fully custom builds.
- **AI & Automation:** we build AI agents and automation workflows using **n8n**, and have delivered many real projects in this area.
- We have delivered a large number of projects across all of these areas.
- Tone of voice: confident, modern, technical but human. Short punchy headlines, clear supporting copy. No buzzword soup.

---

## 2. Brand identity (follow strictly)

### 2.1 Logo
- The wordmark is blocky and geometric. The **"O" is formed by curly brackets `{ }`** (a nod to code), and letters like **C** and **D** have **square notches / cut blocks**.
- Logo file: `/public/brand/logo.svg` (I will provide it; use a placeholder until then). Build it as an inline SVG component so parts can be animated individually (the brackets and the blocks).
- Never stretch, recolor outside the palette, or add effects to the logo.

### 2.2 Visual motifs (derived from the logo — use them as the site's design language)
1. **Brackets `{ }`** — open/close to reveal content, frame key headlines, appear on card hover, used in section labels like `{ 01 — Services }`.
2. **Blocks / pixels** — square notches, block grids, block-based reveals and page transitions. Corners: mostly sharp, with occasional rounded corners mirroring the logo's rounded outer edges.
3. **Code feel** — monospace-style micro labels, line numbers, blinking caret, subtle grid backgrounds.

### 2.3 Color palette
Define everything as CSS variables / Tailwind theme tokens. Never hardcode hex values in components.

| Token | Hex | Usage |
|---|---|---|
| `navy-950` | `#0E0F31` | Dark mode background, light mode main text |
| `indigo-700` | `#4B4D83` | Dark surfaces, borders, muted elements |
| `indigo-200` | `#C5C6E3` | Muted text on dark, light borders |
| `indigo-50` | `#F2F3FF` | Light mode background |
| `blue-600` | `#0049B2` | **Primary brand color** (logo color) |
| `blue-400` | `#4E94FF` | Glows, highlights, links/accents on dark backgrounds |
| `blue-300` | `#99C2FF` | Secondary highlights, gradients |
| `blue-100` | `#CCE0FF` | Light mode surfaces / tints |
| `yellow-500` | `#FFC100` | **Accent — use sparingly** (primary CTA, single highlighted word, active states) |
| `yellow-400` | `#FFCF48` | Accent hover |
| `yellow-200` | `#FFE197` | Soft accent backgrounds |
| `yellow-50` | `#FFF1D2` | Very soft accent tint |

**Color rules:**
- Blue is the hero. Yellow is a spice: max ~5% of any screen. Never large yellow areas.
- Text on yellow is always `navy-950`.
- In dark mode, `blue-600` is for fills/shapes; use `blue-400` for blue text to keep WCAG AA contrast.
- Glows: soft radial gradients of `blue-600` → `blue-400` at low opacity behind key elements.

### 2.4 Themes (Dark + Light with toggle)
- Default: respect the system preference; dark is the brand-preferred look.
- Toggle in the header (animated icon morph). Persist choice. No flash of wrong theme on load (use `next-themes`).
- **Dark:** background `navy-950`, surfaces slightly lighter navy / `indigo-700` at low opacity, text white / `indigo-200`.
- **Light:** background `indigo-50`, surfaces white and `blue-100`, text `navy-950`, borders `indigo-200`.
- Theme switch transition: a block-wipe or circular reveal from the toggle position (View Transitions API with fallback).

### 2.5 Typography
- **English:** `Neue Montreal` (Light 300 / Medium 500 / Bold 700) for body and UI. `Morrison` for large display headlines.
- **Arabic:** `Rubik` (Light / Medium / Bold) as primary, `Noto Sans Arabic` as fallback.
- Neue Montreal and Morrison are not on Google Fonts: load them locally from `/public/fonts/` via `next/font/local` (I will add the files; use sensible fallbacks until then). Load Rubik and Noto Sans Arabic via `next/font/google`.
- Fluid type scale using `clamp()`. Display headlines are huge (up to ~10vw on desktop), tight letter-spacing for English, normal for Arabic.
- Arabic line-height must be more generous than English.

---

## 3. Tech stack

- **Next.js 15 (App Router) + TypeScript**
- **Tailwind CSS v4** with the tokens above
- **GSAP + ScrollTrigger + SplitText** for scroll and timeline animations
- **Lenis** for smooth scrolling (synced with ScrollTrigger)
- **Motion (Framer Motion)** for component-level micro-interactions and layout animations
- **next-intl** for i18n (`/ar` and `/en` routes)
- **next-themes** for theming
- **Supabase** — PostgreSQL database, Auth, Storage, Realtime (via `@supabase/ssr` for Next.js)
- **react-hook-form + zod** for every form (public and dashboard); the same zod schemas validate on client and server
- **Resend** for transactional emails (new lead notifications, user invites)
- **shadcn/ui** (Radix) as the base for dashboard primitives, fully restyled to the CODEX brand — it must not look like default shadcn
- **TanStack Table** for data tables, **dnd-kit** for drag and drop, **Recharts** for charts, **Tiptap** for rich text (with RTL support), **cmdk** for the command palette, **sonner** for toasts
- **lucide-react** for icons
- Deployable on Vercel. ESLint + Prettier configured.

All content (services, solutions, projects, team, stats, testimonials, posts, settings) lives in **Supabase** and is managed from the dashboard, with `_en` and `_ar` fields for every translatable text.

---

## 4. Bilingual & RTL (very important)

- Routes: `/en/...` and `/ar/...`. Language switcher in header, keeps the user on the same page.
- `<html lang dir>` set correctly per locale. Arabic = `dir="rtl"`.
- Use **logical CSS properties only** (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`), never `left/right` for layout.
- **Mirror directional animations in RTL**: horizontal scroll sections, marquees, slide-ins, arrows, and the cursor trail all flip direction.
- **Text animations per script:** character-level scramble/split effects break Arabic letter joining. For Arabic use **word-level or line-level** reveals (mask slide, blur-to-sharp, fade-up). Use character-level effects only for English and Latin labels.
- Brackets `{ }` must visually stay correct in RTL (do not let them flip into `} {`).
- Numbers: use Western digits in both languages unless I say otherwise.

---

## 5. Site map

1. **Home** (`/`)
2. **Services** (`/services`) + detail pages: `/services/development`, `/services/branding`, `/services/marketing`
3. **Solutions** (`/solutions`): E-commerce, E-learning, ERP, CRM, Platforms (Salla / Shopify / WordPress)
4. **AI & Automation** (`/ai-automation`)
5. **Work** (`/work`) + case study template (`/work/[slug]`)
6. **About** (`/about`) — story, the three teams, values, process
7. **Contact** (`/contact`)
8. Custom **404** page (animated, on-brand: e.g. `{ 404 }` with blocks falling apart)

Global: sticky header (hides on scroll down, shows on scroll up, glass blur background), full-screen animated mobile menu, rich footer with big CTA, social links, and a floating **WhatsApp** button.

---

## 6. Home page — section by section

### 6.1 Preloader
- The CODEX logo **assembles block by block**, then the `{ }` brackets open wide and the page is revealed through the gap.
- A small counter 0 → 100 in a mono-style label.
- Show only on the first visit per session; total under ~2s; never blocks content longer than needed.

### 6.2 Hero
- Huge display headline, e.g. EN: "We build brands, code, and growth." / AR equivalent written naturally in Arabic (not a literal translation).
- English: text-scramble effect (characters cycle like code, then settle). Arabic: line mask reveal.
- Background: an interactive **block grid** — squares light up in `blue-600`/`blue-400` near the cursor and fade out; a soft blue glow follows the cursor.
- Floating `{ }` brackets with subtle parallax.
- Two CTAs: primary yellow "Start a project" (magnetic button), secondary outline "See our work".
- Scroll indicator with a blinking caret.

### 6.3 Tech / platform marquee
- Infinite marquee of logos and names: Shopify, Salla, WordPress, n8n, Next.js, React, Laravel/Node, Flutter, OpenAI, etc. (monochrome, colorize on hover).
- Two rows moving in opposite directions; speed reacts to scroll velocity.

### 6.4 Services (Development / Branding / Marketing)
- Pinned section: three large panels that transition as you scroll (stacking cards or horizontal scroll — mirrored in RTL).
- Each panel: number label `{ 01 }`, title, short description, list of sub-services, and an animated illustration built from blocks (code window for Development, logo construction grid for Branding, rising chart for Marketing).
- Link to each service detail page.

### 6.5 Solutions
- Grid of cards: E-commerce, E-learning, ERP, CRM, Salla, Shopify, WordPress.
- Cards: 3D tilt on hover, brackets slide in around the title, animated icon, blue glow border following the cursor.
- Staggered reveal on scroll.

### 6.6 AI Agents & n8n Automation (signature section — make this the most impressive part)
- An animated **workflow canvas inspired by n8n**: nodes (Trigger → AI Agent → Tools → CRM / WhatsApp / Email) connect one by one as the user scrolls; glowing data packets travel along the connection lines.
- Short copy explaining what we automate, plus 3–4 example use cases (customer support agent, lead qualification, order automation, internal reporting).
- Nodes are hoverable and show a tooltip with a one-line description.
- Build it with SVG + GSAP (no heavy canvas libraries).

### 6.7 Stats
- Counters that count up when in view: projects delivered, happy clients, years of experience, team members (editable from the dashboard).
- Numbers in the display font, labels in brackets style.

### 6.8 Featured work
- 4–6 projects. Cards with image **pixel/block reveal** on scroll, hover shows category tags and a custom cursor "View" state.
- Filter chips: All / Development / Branding / Marketing / AI (animated layout transitions).

### 6.9 Teams
- Three team blocks (Brand, Marketing, Development), each with its own accent from the palette, a short description and what they deliver.
- Hover expands the block (accordion-like on mobile).

### 6.10 Process
- Steps: Discover → Strategy → Design → Build → Launch → Grow.
- A vertical (or horizontal on desktop) line that draws itself on scroll, with each step lighting up.

### 6.11 Testimonials
- Slider with draggable cards, quote marks styled as brackets. Placeholder content.

### 6.12 Final CTA
- Full-width block: huge headline "Let's build something { great }." with the bracket word animated, big magnetic yellow button, and WhatsApp link.

---

## 7. Global animation system

- One central animation setup: Lenis + GSAP ScrollTrigger registered once, cleaned up properly on route change (no memory leaks, no duplicated triggers).
- Reusable primitives/components: `<RevealText>`, `<ScrambleText>` (EN only), `<BlockReveal>`, `<BracketFrame>`, `<MagneticButton>`, `<TiltCard>`, `<Marquee>`, `<Counter>`, `<ParallaxLayer>`.
- **Page transitions:** a grid of blocks covers the screen and uncovers the new page (staggered), with the logo mark flashing briefly in the middle.
- **Custom cursor** (desktop only): small square block that grows into a label ("View", "Drag", "Open") over interactive elements; hidden on touch devices.
- Easing: consistent custom eases (e.g. expo.out / power4.out). Durations 0.6–1.2s for reveals, 0.2–0.3s for hovers.
- Every section must have entrance animation; nothing just "pops" in.

**Animation rules:**
- Animate only `transform` and `opacity` (and filters sparingly). No layout-thrashing animations.
- Respect `prefers-reduced-motion`: disable scramble, parallax, pinning, smooth scroll and cursor; keep simple fades.
- On mobile: lighter versions (no cursor effects, reduced grid, fewer simultaneous animations), but still feel animated.
- Content must be readable and indexable even if JavaScript fails (no text hidden permanently by initial animation states).

---

## 8. Performance, accessibility, SEO

- Target Lighthouse ≥ 90 on Performance, Accessibility, Best Practices, SEO (mobile).
- Lazy-load heavy sections and below-the-fold animation code (dynamic imports).
- Images via `next/image`, AVIF/WebP, proper sizes.
- WCAG AA contrast in both themes and both languages. Keyboard navigation, visible focus states (on-brand: blue outline with block corners), semantic HTML, aria labels on icon buttons.
- SEO: metadata per page and per locale, `hreflang` alternates, Open Graph images, sitemap.xml, robots.txt, JSON-LD (Organization + Service).

---

## 9. Quality bar — do / don't

**Do:**
- Make it feel like a top-tier agency site: generous whitespace, strong grid, big typography, precise alignment, rich but controlled motion.
- Use the logo motifs (brackets + blocks) consistently so the site feels like it was born from the brand.
- Keep components clean, typed, reusable, and documented briefly.

**Don't:**
- No generic template look, no stock "purple gradient SaaS" style, no random emojis.
- No colors outside the palette. No overuse of yellow.
- No lorem ipsum: write realistic placeholder copy in both English and natural Arabic, clearly marked as placeholder in the Supabase seed data.

---

## 10. Backend — Supabase

### 10.1 Setup
- Use the Supabase CLI with versioned SQL migrations in `supabase/migrations/` and a `supabase/seed.sql` with realistic bilingual placeholder data.
- Generate TypeScript types from the schema (`supabase gen types`) and use them everywhere.
- Clients: browser client, server client (cookies, via `@supabase/ssr`), and an admin client using the service role key **only on the server** (never exposed to the browser).
- Provide a `.env.example` with all required variables.

### 10.2 Database schema (adjust if you see a better design, but explain why)
- `profiles` — linked to `auth.users`: full name, avatar, role (`admin` | `editor` | `viewer`), language and theme preference.
- `services` — slug, title/description (en/ar), sub-services list, icon, order, published.
- `solutions` — same pattern (E-commerce, E-learning, ERP, CRM, Salla, Shopify, WordPress…).
- `projects` — slug, title/summary/rich content (en/ar), category, tags, client name, year, cover image, gallery, live URL, featured flag, status (`draft` | `published`), order, SEO fields.
- `project_categories`, `testimonials`, `team_members`, `stats`, `tech_logos` (marquee).
- `posts` — blog/articles: slug, title/excerpt/content (en/ar), cover, author, tags, status, published_at, SEO fields.
- `leads` — name, email, phone, company, service of interest, budget range, message, locale, source page, UTM params, status (`new` | `contacted` | `qualified` | `proposal` | `won` | `lost`), assigned_to, estimated value, created_at.
- `lead_notes` — timeline notes and activity on each lead.
- `site_settings` — single row: contact info, WhatsApp number, social links, default SEO, announcement bar, maintenance toggle.
- `media` — uploaded files metadata (Supabase Storage).
- `page_views` — lightweight first-party analytics (path, locale, referrer, device, country, session hash, timestamp). Use SQL views/functions for aggregates.
- `activity_log` — who changed what and when, across all dashboard actions.
- `updated_at` triggers on all tables; slugs unique per table.

### 10.3 Security (non-negotiable)
- **Row Level Security enabled on every table.** Public (anon) can only read `published` content and can only insert into `leads` and `page_views`.
- Role-based policies: `admin` full access + user management; `editor` manages content and leads; `viewer` read-only.
- Storage buckets (`projects`, `posts`, `team`, `media`) with matching policies; image upload validation (type and size).
- Contact form: zod validation, honeypot field, rate limiting, and Cloudflare Turnstile (optional via env).
- Next.js middleware protects every `/dashboard` route; server actions re-check the user's role on every mutation.

### 10.4 Data flow to the public site
- Public pages fetch from Supabase in Server Components with caching (tags per content type).
- When content is saved in the dashboard, trigger **on-demand revalidation** (`revalidateTag`) so the live site updates instantly while staying fast.
- New lead: saved to `leads` → email notification to the team via Resend → realtime toast in the dashboard via Supabase Realtime.

---

## 11. Admin Dashboard (`/dashboard`)

The dashboard must feel like a premium product (think Linear / Vercel / Stripe level), built in the CODEX brand: same tokens, fonts, bracket and block motifs, **Dark + Light toggle**, and **fully bilingual with RTL**.

### 11.1 Auth screens
- Login, forgot password, reset password, accept invite. Email + password and magic link via Supabase Auth.
- Split-screen design: form on one side, animated block grid with the CODEX logo assembling on the other.

### 11.2 Layout
- Collapsible sidebar with animated active indicator (shared layout animation that slides between items), grouped navigation, tooltips when collapsed.
- Top bar: breadcrumbs, global search, **command palette (Ctrl/Cmd + K)** to jump to any page or create anything, notifications bell (realtime), language switch, theme toggle, profile menu.
- Fully responsive: on mobile the sidebar becomes an animated drawer, tables become cards.

### 11.3 Modules
1. **Overview** — KPI cards (new leads, conversion rate, pipeline value, page views, published projects) with count-up numbers and trend badges; animated charts: leads over time, leads by service, traffic by page, traffic by device; recent leads; recent activity feed; date range picker.
2. **Leads (mini CRM)** — two views: **Kanban pipeline** (drag cards between statuses with smooth layout animation) and **data table** (search, filters, sorting, column visibility, bulk actions, CSV export). Lead detail side panel: info, status, assignee, estimated value, notes timeline, quick actions (WhatsApp, email, call).
3. **Projects** — table + grid view, create/edit form with en/ar tabs side by side, rich text editor, cover and gallery upload with drag to reorder, featured toggle, draft/publish, live preview link, drag to reorder projects.
4. **Services & Solutions** — CRUD with ordering and publish toggle.
5. **Blog / Posts** — rich editor (Tiptap, RTL aware), cover, tags, SEO fields, schedule publishing.
6. **Testimonials, Team, Stats, Tech logos** — simple CRUD with drag ordering.
7. **Media library** — grid of all uploads, drag and drop upload with progress, search, copy URL, delete with usage warning.
8. **Analytics** — traffic over time, top pages, referrers, locales, devices, and a funnel: page view → contact form view → lead.
9. **Users & Roles** (admin only) — invite users by email, change roles, deactivate.
10. **Settings** — site settings form, SEO defaults, social links, WhatsApp number, maintenance mode.
11. **Activity log** — filterable list of every change.

### 11.4 Dashboard UX rules
- Every list has: loading skeletons with shimmer, empty states with an on-brand illustration (blocks / brackets) and a clear call to action, and friendly error states.
- Optimistic updates for quick actions (status change, toggles, reorder) with rollback on failure.
- Every form: inline validation, unsaved-changes warning, Ctrl/Cmd + S to save, success/error toasts.
- Destructive actions require a confirmation dialog.
- All tables paginate server-side.

### 11.5 Dashboard animation
The dashboard should be heavily animated but **fast** — it is a work tool, so motion must feel snappy (mostly 150–400ms) and never slow the user down:
- Route transitions: content fades and slides in with staggered children.
- KPI numbers count up, charts draw in on load and animate between date ranges.
- Table rows and cards enter with a stagger; filtering and sorting animate with layout transitions.
- Kanban drag: lifted card with shadow and slight tilt, other cards smoothly make room.
- Modals, drawers and the command palette open with spring physics; toasts slide and stack.
- Sidebar active indicator, tabs, and toggles use shared layout animations.
- Hover states on everything interactive: subtle glow, bracket accents, micro-scale.
- Realtime events (new lead) arrive with a highlight pulse.
- Same reduced-motion rules as the public site.

---

## 12. Build phases (stop after each and wait for approval)

1. **Foundation:** project setup, design tokens, fonts, themes, i18n + RTL, layout (header, footer, mobile menu), Lenis + GSAP setup, animation primitives, custom cursor, page transition.
2. **Supabase backend:** migrations for the full schema, RLS policies, storage buckets, auth setup, generated types, Supabase clients, seed data, middleware.
3. **Home page part 1:** preloader, hero, marquee, services, solutions — reading from Supabase.
4. **Home page part 2:** AI & n8n workflow section, stats, featured work, teams, process, testimonials, final CTA.
5. **Inner pages:** Services + details, Solutions, AI & Automation, Work + case study, Blog + post page, About, Contact (working form → leads + email), 404, page view tracking.
6. **Dashboard core:** auth screens, dashboard layout, command palette, notifications (realtime), Overview, Leads (kanban + table + detail panel).
7. **Dashboard content modules:** Projects, Services & Solutions, Posts, Testimonials, Team, Stats, Tech logos, Media library, with on-demand revalidation of the public site.
8. **Dashboard admin modules:** Analytics, Users & Roles, Settings, Activity log.
9. **Polish:** responsive pass on all breakpoints, RTL review of every page and dashboard screen, reduced-motion pass, security review of every RLS policy and server action, performance optimization, SEO, final QA. Report Lighthouse results.

At the start, also create a `CLAUDE.md` in the repo summarizing the brand rules, tokens, folder structure, and conventions from this brief so they stay consistent across sessions.
