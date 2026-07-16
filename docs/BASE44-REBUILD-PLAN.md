# ColourPantry v2 — Base44 Rebuild Orchestration Plan

**Status:** Plan only. No production code has been written.
**Audience:** The implementation model executing this rebuild. Read this whole file before writing anything.
**Author context:** Plan produced 2026-07-17 against colourpantry main @ fa5ded2.

---

## 0. Objective

Rebuild ColourPantry from scratch as a bigger, better product hosted on Base44, replacing the current Vite + React + TypeScript client-only app (deployed on Vercel, all user data in local IndexedDB). The rebuild adds four new surfaces on top of the migrated feature set:

1. A proper **landing page**.
2. A **loading screen**: crayons melting, where the melt speed is driven by actual load progress (faster as loading completes).
3. An **onboarding workflow** for new users.
4. A **Chrome extension** version of the colour picker that users can summon from the web app ("summon with a link").

And one strategic input: a **competitive brief** on other colour platforms (Coolors is already covered from prior work; explicitly skip it).

---

## 1. Ground rules for the implementation model (non-negotiable)

1. **This is a Base44 build.** Before writing any Base44 code, read `~/.claude/base44/BASE44-PLATFORM.md` (canonical platform reference, v1 2026-07-11). Never assert Base44 capabilities from memory. The hard-rules digest also lives in `~/.claude/CLAUDE.md`.
2. **Frontend npm whitelist only:** React, Tailwind, shadcn/ui, lucide-react, framer-motion, recharts, react-router-dom, react-hook-form, @tanstack/react-query, moment, date-fns, lodash, react-markdown, react-quill, three.js, react-leaflet, @hello-pangea/dnd. Nothing else unless Megan explicitly requests a package by name (then only via Base44's `install_npm_package`). **Never hand-edit package.json.**
3. **The current repo's dependencies do NOT carry over.** chroma-js, colorthief, html2canvas, jspdf, react-window are all off-whitelist. Section 4 defines the replacement strategy for each. This is the single biggest migration risk; do not "just import" any of them.
4. **Language:** Base44 convention is JSX/JavaScript, `@/` alias imports, default exports named after the file, components ~50 lines each, one component per file. The current codebase is TypeScript; you are rebuilding, not copying files across.
5. **Design tokens:** all colours/fonts via `src/index.css` tokens + `tailwind.config.js` mappings. Literal Tailwind class strings only. Ironic for a colour app, but user-generated colours are runtime values: render those with inline `style={{ background: hex }}` on swatch elements only (runtime data is the sanctioned exception), never dynamic Tailwind class names.
6. **Build flow:** app created in Base44 → linked GitHub repo (2-way sync) → cloned locally → work in Claude Code → push to `main` deploys. Pull before every edit session. Preview ≠ published; schema/RLS changes take effect on publish. Schema changes go in BOTH the MCP (`update_entity_schema`) and `base44/entities/*.jsonc`.
7. **Auth is platform-owned.** Pre-built Login/Register/ForgotPassword/ResetPassword pages already exist; never recreate them. Register does not log in: register → OTP → `verifyOtp` → `setToken` → hard redirect via `window.location.href`.
8. **Copy rule (Megan's standing preference):** no em dashes in any blog, marketing, or in-app copy. Use commas, parens, colons, or split sentences.
9. **Ship-to-live default:** commit and push to `main` without asking. But for THIS project, publish-to-users is a separate Base44 action; confirm Base44 app ownership before promising a publish.
10. **Pre-launch security audit is mandatory** (`base44-security-audit` skill) before publishing. Public REST + loose RLS leaks PII.
11. `asServiceRole` does NOT reliably bypass RLS. Prefer client-side operations under the acting user, or design RLS so the operation is permitted.

---

## 2. What exists today (migration inventory)

Current stack: Vite, React 19, TypeScript, Tailwind 3, react-router 7, IndexedDB via `idb`. Client-only, no accounts, no backend. Deployed on Vercel with a Stripe tip-jar payment link in the footer.

### Routes / features to disposition

| Current route | Feature | Disposition |
|---|---|---|
| `/` | Home (colour families browser) | Rebuild; becomes the app home behind the new landing page |
| `/family/:familyId` | Colour family detail | Rebuild |
| `/skin` | Skin tone palettes | Rebuild |
| `/extract` | Image → palette extraction (colorthief) | Rebuild with in-repo canvas sampler (see 4.2) |
| `/stashes` | Saved palettes ("stashes") + poster export | Rebuild; stashes move from IndexedDB to a `Stash` entity (cloud, per-user) |
| `/generate` | Palette generator | Rebuild |
| `/variations` | Colour variations (tints/shades/tones) | Rebuild |
| `/contrast` | WCAG contrast checker | Rebuild (`src/lib/contrast.ts` logic ports cleanly, it is dependency-free math) |
| `/visualize` | Palette on UI mockups | Rebuild |
| `/collage` | Collage builder | Rebuild |
| `/gradients` | Gradient builder | Rebuild |
| `/library` | Curated library (react-window virtualized) | Rebuild; replace virtualization (see 4.5) |
| `/lookup` | Colour lookup / hex tooltip | Rebuild |
| `/glaze` | Apply a stash's colours to an uploaded screenshot, with white/black protection + lightness weighting | Rebuild; this is the signature feature, port `src/lib/color.ts` + glaze logic carefully |
| `/blog`, `/blog/:slug` | Blog (posts in `src/lib/blogPosts.tsx`) | Rebuild as react-markdown-rendered content; consider a `BlogPost` entity vs. in-repo content (decision D4) |
| `/feedback`, `/admin/feedback` | Feedback form + admin view | Rebuild on a `Feedback` entity + admin-role gate (real auth now exists) |
| `/privacy`, `/terms` | Legal pages | Rewrite for the new reality: accounts, cloud storage, extension |
| Cross-cutting | Theme (light/dark), CVD simulation filters, paste-image-anywhere, hex tooltips, toasts, Stripe tip jar | All rebuild; tip jar keeps the existing Stripe payment link, or moves to Base44 payments (decision D5) |

### Pure-logic modules worth porting (rewrite as plain JS in `src/lib/`)

`color.ts` (conversions, distance, lightness weighting), `contrast.ts` (WCAG), `harmony.ts`, `curated.ts` + `fontPairs.ts` (data), `exports.ts` / `advancedExports.ts` (format serializers: minus the PDF path), `usePasteImage.ts`. These are dependency-free or near-free; port the algorithms, not the imports.

---

## 3. Skills pipeline (run these in this order before building)

| Step | Skill | Purpose | Output |
|---|---|---|---|
| S1 | `/baseics` | Build-start ritual: platform model, RLS traps, setup checklist. Load at the very start of the Base44 session. | Session primed; setup ritual checklist |
| S2 | `/build-bible` | Pull Megan's saved prompts, design taste, references from `C:\Users\megan\Downloads\build-bible` | Design direction for landing page, loading screen, app shell |
| S3 | `/competitive-brief` (marketing plugin) | Competitor positioning scan. **Skip Coolors (already covered).** Cover: Adobe Color, Realtime Colors, Khroma, Huemint, Colormind, Happy Hues, ColorHunt, Paletton; plus extension-space competitors ColorZilla and ColorPick Eyedropper (directly informs Workstream E). | Positioning gaps, messaging angles, feature threats/opportunities. Feeds landing page copy (C1) and feature prioritization |
| S4 | `/base44-onboarding-ux` | When building Workstream D (onboarding). | First-run wizard patterns, profile-completion approach |
| S5 | `/component-tap` | During UI build, for hero/nav/pricing/section blocks. | Component sources compatible with the whitelist (shadcn-based only) |
| S6 | `/base44-security-audit` | Before publish (Workstream F). | RLS/PII audit report |

S1, S2, S3 can run in parallel at kickoff. S3's output must exist before landing-page copy is written but does not block engineering foundation work.

---

## 4. Dependency replacement strategy (the hard part)

| Current dep | Used for | Replacement in Base44 |
|---|---|---|
| 4.1 `chroma-js` | Colour math, scales, conversions | Write `src/lib/color.js`: hex/RGB/HSL/OKLCH conversions, deltaE, luminance, scale interpolation. The current `src/lib/color.ts` already wraps most of this; expand it to cover every chroma call site. Zero-dependency, pure functions |
| 4.2 `colorthief` | Dominant-colour extraction from images | In-repo canvas sampler: draw image to `<canvas>`, `getImageData`, downsample, median-cut or k-means quantization in plain JS (~120 lines). Native browser APIs only |
| 4.3 `html2canvas` | Poster/collage export to image | Render posters directly to `<canvas>` with 2D drawing code instead of DOM-screenshotting. More work, better output (the descender-clipping bug from af2a98e disappears when you own the text layout). `canvas.toBlob()` → download |
| 4.4 `jspdf` | PDF export | Drop PDF as a v2.0 launch feature; offer PNG + SVG + text formats (CSS/JSON/ASE-text). If Megan explicitly wants PDF back, she can request `install_npm_package jspdf` by name; do not preemptively install |
| 4.5 `react-window` | Virtualized curated library list | Paginate or lazy-load with IntersectionObserver ("load more" sentinel). @tanstack/react-query is whitelisted and handles the paging state |
| 4.6 `idb` (IndexedDB) | All user data (stashes) | Base44 entities (cloud, per-user). Keep a thin localStorage layer ONLY for anonymous-user drafts and the one-time import (see 5, `Stash` + task F3) |

---

## 5. Data model (Base44 entities)

Built-in fields (`id`, `created_date`, `updated_date`, `created_by_id`) are automatic; never declare them. `.jsonc` files are always written whole with `write_file`.

- **`Stash`** — `name` (string, req), `colors` (array of `{ hex, label? }`), `source` (enum: `manual | extract | generate | glaze | extension`), `is_public` (boolean, default false), `notes` (string). RLS: owner read/write; public read only when `is_public`. **Do not store images in the entity**; screenshots go through `UploadFile`, store `file_url`.
- **`Feedback`** — `message` (req), `page`, `mood` (enum). RLS: creator can create/read own; admin reads all. Watch the like-via-update trap if any reaction feature is added.
- **`ExtensionPick`** — colours captured by the Chrome extension: `hex` (req), `source_url`, `stash_id` (optional link). RLS: owner only. (Exists so the extension can write through one narrow backend function.)
- **User profile data** — do NOT create a User entity (built-in). Onboarding answers, theme preference, CVD setting, `onboarding_completed`, `has_seen_extension_promo` persist via `base44.auth.updateMe(...)`. Handle just-registered users with none of these set.
- **`BlogPost`** — only if decision D4 lands on entity-backed blog; otherwise blog stays as in-repo markdown.

Schema changes always: MCP `update_entity_schema` + repo `base44/entities/*.jsonc` + publish.

---

## 6. Workstreams and tasks

### Workstream A — Platform setup and scaffold (serial, blocks everything)

- **A1.** Confirm decisions D1–D5 with Megan (section 8) if not already answered.
- **A2.** Create the Base44 app (via MCP `create_base44_app` or dashboard), name it ColourPantry. Confirm Megan owns the app.
- **A3.** Link the app to a NEW GitHub repo (2-way sync). Do not reuse the current `colourpantry` repo (it stays live on Vercel serving v1 until cutover; decision D1 covers repo naming).
- **A4.** Clone locally; paste `~/.claude/base44/PROJECT-CLAUDE-SNIPPET.md` at the top of the new repo's `CLAUDE.md` (create it). Add a short project header noting v1 lives at the old repo.
- **A5.** Run `/baseics` setup ritual. Verify preview URL loads through Claude in Chrome.
- **A6.** Design tokens: port ColourPantry's brand palette and type scale from v1 `src/index.css` into the new `src/index.css` (`:root` + `.dark`) and `tailwind.config.js`, folded together with Build Bible direction (S2). This gates all UI work.
- **A7.** App shell: layout route with `<Outlet>`, header, sidebar, footer (with tip jar link per D5), theme toggle, toast system (platform `<Toaster />`), route skeleton in `App.jsx` (surgical edits, preserve scaffold). Public vs. protected route split per D2.
- **A8.** Entity schemas from section 5 created in both places. Publish once so RLS is live in preview testing.

### Workstream B — Core library + feature migration (parallelizable after A6)

Order within B: B1 first (everything imports it), then B2–B10 in any order, roughly by user value.

- **B1.** `src/lib/` port: colour math (4.1), contrast/WCAG, harmony, curated data, font pairs, export serializers (no PDF), paste-image hook, canvas palette extractor (4.2), canvas poster renderer (4.3). Acceptance: a scratch page can round-trip hex↔HSL↔OKLCH, extract a 6-colour palette from an uploaded image, and render a stash poster to PNG without descender clipping.
- **B2.** Home + colour families + family detail pages.
- **B3.** Stashes: list, create, edit, reorder, poster export. Reads/writes `Stash` entity via user-scoped SDK; anonymous users get localStorage drafts with a "sign in to save" nudge (per D2).
- **B4.** Extract page (image upload + paste + palette extraction → save to stash).
- **B5.** Generate + Variations + Harmony surfaces.
- **B6.** Glaze: upload/paste screenshot, apply stash colours, white/black protection default, lightness weighting in flat mode. Parity with v1 commits fa5ded2 and 6181bd7 is the acceptance bar.
- **B7.** Contrast checker + CVD simulation (SVG filter matrices port as-is) + hex tooltips.
- **B8.** Visualize + Collage + Gradients.
- **B9.** Library (curated) with pagination/lazy-load (4.5). Lookup page.
- **B10.** Blog (per D4), Feedback (entity-backed, admin view gated on `user.role === 'admin'`), Privacy + Terms rewrite, footer tip jar.

### Workstream C — Landing page + loading screen (after A6; copy blocked on S3)

- **C1.** Landing page copy: positioning from the competitive brief (S3) + Build Bible voice. No em dashes. Sections: hero, feature showcase (Glaze is the differentiator, lead with it), extension teaser, social proof placeholder, CTA to register. Draft with the `content-writer` agent if orchestrating multi-agent.
- **C2.** Landing page build: public `/` route (app home moves per D2), shadcn + framer-motion, blocks via `/component-tap`. Responsive, dark-mode aware, real copy from C1.
- **C3.** **Crayon-melt loading screen.** Spec:
  - A row of 6-8 crayons in brand colours; each melts downward (wax drip = animated SVG path / framer-motion scaleY + drip blobs).
  - Melt progress maps to REAL load progress, and the melt rate accelerates as progress climbs (ease-in mapping: `meltAmount = progress^p` with p < 1 early feel, or spring with stiffness scaled by progress). Faster as it loads is the requirement.
  - Progress signal: count of settled boot promises (auth check `isAuthenticated()`, initial entity fetches, font load via `document.fonts.ready`, image preloads). Expose as a small context: `registerBootTask(promise)` → fraction settled.
  - Implement as `<BootLoader>` gate in the layout; also reusable as an inline loader (mini crayon) for slow integration calls (platform design rule: show loading indicators during integration calls).
  - framer-motion only (whitelisted). No lottie, no gsap, no external animation libs.
  - Acceptance: throttled network in devtools shows melt tracking real progress and visibly accelerating; completes with a satisfying "fully melted → wipe" transition; respects `prefers-reduced-motion` (crossfade fallback).

### Workstream D — Onboarding workflow (after A7 + B3; load S4 first)

- **D1.** Load `/base44-onboarding-ux`. Design a first-run wizard for verified new users: welcome → "what do you make?" (designer/dev/artist/curious) → theme + CVD preference → create-first-stash moment (pick 3 colours or extract from an image) → extension teaser (links to Workstream E install page).
- **D2.** Persist wizard state via `auth.updateMe({ onboarding_completed: true, ... })`. Guard: layout checks the flag and routes to `/welcome` when unset. Handle brand-new users with zero saved fields.
- **D3.** Post-register flow check: register → OTP → verifyOtp → setToken → hard redirect → onboarding fires. Do not touch the pre-built auth pages beyond visible-string styling needs, and only if required.
- **D4.** Empty states everywhere reference onboarding actions (empty stash list → "extract your first palette").

### Workstream E — Chrome extension colour picker (independent after A8; SEPARATE REPO)

**Architecture constraint (why this is separate):** the Base44 frontend cannot contain extension code (whitelist, build pipeline, MV3 packaging). The extension is its own plain repo (`colourpantry-extension`), vanilla JS + MV3, built/zipped independently, published to the Chrome Web Store by Megan. It talks to ColourPantry through ONE Base44 backend function.

- **E1.** Scaffold `colourpantry-extension`: MV3 manifest, action popup, `EyeDropper` API for picking (Chrome 95+, no content-script screen math needed), fallback message for unsupported browsers.
- **E2.** Popup UI: pick colour → shows hex/RGB/HSL → copy buttons → "save to stash" (when paired) → recent picks (extension local storage).
- **E3.** **Pairing ("summon with a link") flow.** A normal web link cannot launch an extension; the sanctioned pattern is the reverse handshake:
  - Web app has `/extension` page: install CTA (Web Store link) + "Connect extension" button.
  - Extension content script runs ONLY on the ColourPantry origin; the page detects it via a `window.postMessage` handshake (this is how "summon with a link" behaves for users: click link on site → extension responds/opens).
  - Pairing: logged-in web page generates a short-lived pairing code via backend function `extensionPair` (function creates a scoped token record); user confirms in the popup; extension stores the token.
  - The `/extension` page can also carry `?code=` so a shared link pre-fills pairing.
- **E4.** Backend function `extensionSync` (`base44/functions/extensionSync/entry.ts`, Deno.serve pattern, Response objects, everything in-handler): validates the pairing token, writes `ExtensionPick` records / appends to a chosen `Stash`. This is the ONLY write path from the extension. Never expose service-role behaviour; validate auth per request.
  - **Platform check required:** BASE44-PLATFORM.md documents `createClientFromRequest`-based user auth; a token-pairing pattern for third-party clients is NOT explicitly documented. Before building E3/E4, verify against https://docs.base44.com/ how an external client authenticates to a backend function (API key per function? user token pass-through?). If the platform offers function endpoint URLs with their own auth (dashboard → Functions → API/webhook usage), prefer that. Do not invent SDK methods.
- **E5.** Web app integration: picks from the extension appear in a "From your extension" tray on `/stashes` (realtime via `base44.entities.ExtensionPick.subscribe`).
- **E6.** Store packaging: icons, screenshots, privacy policy URL (reuse app `/privacy`, updated in B10 to cover the extension), listing copy (no em dashes). Megan submits to the Web Store herself.

### Workstream F — Migration, hardening, launch (after B, C, D complete; E can trail)

- **F1.** `/base44-security-audit` (S6). Fix every world-readable/PII finding. Re-check `Stash.is_public` exposes only colours, never email/created_by-derived PII.
- **F2.** QA pass through Claude in Chrome on the preview URL: every route, mobile viewport, dark mode, CVD filters, paste flows, poster export, onboarding end-to-end with a fresh account.
- **F3.** v1 data import: on first login, offer "import your local stashes": read v1's IndexedDB (only works on the v1 origin) — so ship a tiny export button ON v1 (one last Vercel deploy: "Download my stashes as JSON") + import-JSON on v2. Also keep plain JSON import permanently (nice feature anyway).
- **F4.** Cutover: publish the Base44 app; decide domain strategy per D1 (point colourpantry domain at Base44 app, keep Vercel v1 on a `legacy.` subdomain for 60 days with a migration banner linking the F3 export flow).
- **F5.** SEO/meta: index.html title, OG tags, favicon (port `public/favicon.svg`), blog URLs preserved or 301-mapped.
- **F6.** Analytics: `base44.analytics.track` on key events (`palette_extracted`, `stash_created`, `glaze_applied`, `onboarding_completed`, `extension_paired`). No PII in properties.
- **F7.** Launch checks: tip jar link works on published app, feedback entity writes, admin view gated, legal pages current.

---

## 7. Dependency graph and execution order

```
S1 baseics ─┐
S2 bible ───┼─► A2..A8 scaffold ─► B1 lib ─► B2..B10 features ─┐
S3 brief ───┘        │                                          ├─► F1..F7 launch
                     ├─► C2 landing ◄─ C1 copy ◄─ S3            │
                     ├─► C3 loader                              │
                     ├─► D1..D4 onboarding ◄─ S4 (needs B3)     │
                     └─► E1..E6 extension (needs A8; E4 needs platform check) ─► trails into post-launch
```

**Critical path:** A2→A8 → B1 → B3/B6 → D → F. 
**Parallel lanes once A6 lands:** (B features) ∥ (C landing+loader) ∥ (E extension scaffold). 
**Recommended phase order for a single implementation model:** S1+S2+S3 → A → B1 → B2/B3/B4/B6 (core value) → C (landing+loader) → D (onboarding) → B5/B7/B8/B9/B10 (long tail) → F → E (extension can ship 1-2 weeks post-launch without blocking anything; only the `/extension` teaser page ships at launch).

If orchestrating multi-agent: B2–B10 are independent page builds sharing only B1 + tokens, safe to fan out; C1 goes to a content agent; S3 to a market-research agent; E is a separate-repo agent lane.

---

## 8. Decisions needed from Megan (D1–D5)

- **D1. Repo + domain strategy.** New repo name for the Base44 app (suggest `colourpantry-app`), extension repo (`colourpantry-extension`), what happens to the current Vercel deployment and domain at cutover. Plan assumes: new repo, domain moves to Base44, v1 lingers on legacy subdomain for the export window.
- **D2. Auth posture.** Recommended: browse/play anonymous (localStorage drafts), account required to save stashes to cloud, sync, and pair the extension. Alternative: hard login-gate the whole app. Plan assumes the recommended split.
- **D3. Feature kills.** Anything from the v1 route list NOT worth rebuilding (candidates to question: Collage, Skin, Lookup as a separate page vs. merged into search). Plan assumes everything migrates.
- **D4. Blog storage.** In-repo markdown (simple, versioned, no entity) vs. `BlogPost` entity (editable from dashboard). Plan assumes in-repo markdown.
- **D5. Tip jar.** Keep the existing Stripe payment link (zero work) vs. Base44 payments provider. Plan assumes: keep the Stripe link.

Answer these before Workstream A; none block the S1–S3 skill runs.

---

## 9. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Off-whitelist deps assumed portable | App-breaking | Section 4 strategy; B1 acceptance test before any feature work |
| Extension auth pattern not documented on platform | E4 blocked | E4 platform check task; fall back to dashboard function endpoint auth; ask Base44 support if silent |
| RLS surprises (writes that don't stick) | Silent data bugs | Per-operation RLS design in A8; audit in F1; never mutate another owner's record |
| Preview vs published drift on schema | "Works in preview" lies | Publish after every schema change; verify on published app |
| Losing v1 users' local stashes at cutover | Trust damage | F3 export-on-v1 + import-on-v2, legacy window |
| 50-line component convention vs complex pages (Glaze) | Structure churn | Decompose aggressively during B6, not after |
| Loading screen tied to fake progress | Feels gimmicky | C3 real boot-task registry; reduced-motion fallback |

---

*End of plan. Implementation model: start with section 1, then run S1/S2/S3, then confirm D1–D5, then Workstream A.*
