# ColourPantry v2: Base44 Rebuild Orchestration Plan

**Status:** Plan only. No production code has been written.
**Audience:** The implementation model executing this rebuild. Read this whole file before writing anything.
**Author context:** Plan produced 2026-07-17 against colourpantry main @ fa5ded2.

---

> **READ `docs/COMPETITIVE-BRIEF.md` BEFORE THIS FILE.** The brief (produced 2026-07-17, 69 agents, adversarially verified) materially contradicts parts of this plan and wins where they conflict. The three that matter:
> 1. **Do not lead the landing page with Glaze.** Lead with the stash. The evidence is in the brief and it is not close.
> 2. **Ship analytics in Workstream A, not F6.** There is currently zero instrumentation in the repo (verified). Every prioritisation argument below is uninstrumented guesswork until that changes.
> 3. **Distribution is the number one constraint and this plan has no workstream for it.** See Workstream G.

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
8. **Copy rules (house style, strict, from `voice-and-copy/copy-rules`).** Apply to every word that ships: UI, marketing, blog, errors, commits, code comments.
   - No emojis. Anywhere. Including commit messages and comments.
   - No em dashes. Use commas, parens, colons, or split the sentence.
   - No AI-hedge phrases ("I hope this helps", "feel free to", "please let me know if", "thanks for reaching out").
   - No fabricated stats. If a number cannot be verified, leave it out. This binds the competitive brief and the landing page hardest.
   - Solo first-person voice. The copy reads as if Megan does everything herself. Never name or hint at a technical partner or dev.
8b. **Design taste filter (from `junk-drawer/design-taste`), run before any visual call.** Warm Notion/Are.na: warm tones over cold, typography-driven over effects-driven, functional beauty (it looks good because it does its job). Hard nos: Playfair Display specifically; vibe-code colour (trendy dark mode with neon accents, purple/pink gradients, glassmorphism); decoration for its own sake. If a mockup drifts toward neon-on-dark or gradient soup, it is wrong before anyone looks at it.
8c. **Show, do not tell.** Megan has said plainly she cannot visualise prose. Any design or UI direction gets built as a real mockup (the artifact is the deliverable, not the paragraph about it). Reference styles by a built example or screenshot, never by brand name. The C3 loader mockup is the pattern to follow for the landing page too.
8d. **Media asset standards (from AJ, 2026-07-17, saved at `build-bible/lessons/video-assets-no-lag`).** Binding on every video, hero, background and loading surface.
   - **Ship frame one as a still image, as the default.** The still shows instantly, the video loads behind it, then takes over. The viewer never sees an empty box. This is the move that takes a video's weight off the critical path and turns it into an upgrade.
   - **The poster must match frame one exactly**, same dimensions and same crop, or the handover flickers and reads worse than no video at all.
   - **720p or 1080p, not 4K.** A hero gets scaled, dimmed, cropped and sat behind text. 720p is invisible from 1080p at that job and costs a fraction.
   - **Fast CDN.** See the Base44 caveat below, which is unresolved.
   - `<video autoplay muted loop playsinline preload="metadata">`. `muted` and `playsinline` are what permit autoplay on iOS at all; without them it silently never starts.
   - **Never extract video to a frame sequence or sprite sheet.** Video is small because of interframe compression, and static-background-plus-small-moving-region is the best case for it. Extracting to PNG/webp frames throws that saving away and costs multiples more.
   - If progress or scroll drives the video, prefer `playbackRate` over seeking `currentTime`. Seeking every frame is janky, worst on iOS Safari, and smooth seeking needs dense keyframes that inflate the file.
   - Respect `prefers-reduced-motion`: hold the poster, do not play.
   - **UNRESOLVED, and it needs answering before any video ships:** AJ's "fast CDN" step has no obvious Base44 answer. `~/.claude/base44/BASE44-PLATFORM.md` is silent on whether repo assets in `public/` or files stored via `UploadFile` are CDN-backed, and on their edge behaviour. Do not assume either way. Check https://docs.base44.com/ or measure it. The poster-frame move works regardless of the answer, which is a good reason to lead with it.
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
| S1 | `/baseics` | Build-start ritual: platform model, RLS traps, setup checklist. Load at the very start of the Base44 session. | **RUN 2026-07-17.** Findings folded into sections 1 and 5. Key: RLS is default-suspect, `asServiceRole` does not reliably bypass it, confirm app ownership before promising a publish, audit before launch. |
| S2 | `/build-bible` | Pull Megan's saved prompts, design taste, references from `C:\Users\megan\Downloads\build-bible` | **RUN 2026-07-17.** Pages pulled: `design-taste`, `whimsical-tech`, `gotchas`, `base44-fingerprint-pass`, `anti-ai-craft-tells`, `base44-rls-first`, `one-cta-marketing-site`, `copy-rules`, `how-you-work`. Folded into sections 1.8, 1.8b, 1.8c, A6, A6b, C1, C2, C3, D6. Materially corrected the C3 spec (canvas not SVG; exponent > 1 not < 1). |
| S3 | `/competitive-brief` (marketing plugin) | Competitor positioning scan. **Skip Coolors (already covered).** Cover: Adobe Color, Realtime Colors, Khroma, Huemint, Colormind, Happy Hues, ColorHunt, Paletton; plus extension-space competitors ColorZilla and ColorPick Eyedropper (directly informs Workstream E). Plus the load-bearing question: does anyone already do Glaze? | Positioning gaps, messaging angles, feature threats/opportunities. Feeds landing page copy (C1) and feature prioritization. Every factual claim adversarially verified because copy rules forbid fabricated stats. → `docs/COMPETITIVE-BRIEF.md` |
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

- **`Stash`**: `name` (string, req), `colors` (array of `{ hex, label? }`), `source` (enum: `manual | extract | generate | glaze | extension`), `is_public` (boolean, default false), `notes` (string). RLS: owner read/write; public read only when `is_public`. **Do not store images in the entity**; screenshots go through `UploadFile`, store `file_url`.
- **`Feedback`**: `message` (req), `page`, `mood` (enum). RLS: creator can create/read own; admin reads all. Watch the like-via-update trap if any reaction feature is added.
- **`ExtensionPick`**: colours captured by the Chrome extension: `hex` (req), `source_url`, `stash_id` (optional link). RLS: owner only. (Exists so the extension can write through one narrow backend function.)
- **User profile data**: do NOT create a User entity (built-in). Onboarding answers, theme preference, CVD setting, `onboarding_completed`, `has_seen_extension_promo` persist via `base44.auth.updateMe(...)`. Handle just-registered users with none of these set.
- **`BlogPost`**: only if decision D4 lands on entity-backed blog; otherwise blog stays as in-repo markdown.

Schema changes always: MCP `update_entity_schema` + repo `base44/entities/*.jsonc` + publish.

---

## 6. Workstreams and tasks

### Workstream A: Platform setup and scaffold (serial, blocks everything)

- **A1.** Confirm decisions D1–D5 with Megan (section 8) if not already answered.
- **A2.** Create the Base44 app (via MCP `create_base44_app` or dashboard), name it ColourPantry. Confirm Megan owns the app.
- **A3.** Link the app to a NEW GitHub repo (2-way sync). Do not reuse the current `colourpantry` repo (it stays live on Vercel serving v1 until cutover; decision D1 covers repo naming).
- **A4.** Clone locally; paste `~/.claude/base44/PROJECT-CLAUDE-SNIPPET.md` at the top of the new repo's `CLAUDE.md` (create it). Add a short project header noting v1 lives at the old repo.
- **A5.** Run `/baseics` setup ritual. Verify preview URL loads through Claude in Chrome.
- **A6.** Design tokens: port ColourPantry's brand palette and type scale from v1 `src/index.css` + `tailwind.config.js` into the new ones (`:root` + `.dark`), folded together with Build Bible direction (S2). This gates all UI work. **Register every brand var in `tailwind.config.js` BEFORE any visual work.** The fingerprint-pass lesson is explicit that skipping this is how The Advocate's Table ended up with ~130 inline `style={{ backgroundColor: 'var(--x)' }}`, turning every later pass into a 30-file hunt instead of a one-line change. The live v1 values to carry over: canvas `#FAF7F2` / `#0E0E0E`, surface `#FFFFFF` / `#161616`, ink `#1A1A1A` / `#FAF7F2`, line `#E8E2D5` / `#262626`, muted `#7A7468` / `#9A9A9A`, gold `#D4A574`. Gold is punctuation only (it marks arrival and achievement), never wallpaper.
- **A6b.** **Base44 fingerprint pass** (run at scaffold time, not as a later cleanup). From `lessons/base44-fingerprint-pass`:
  - Swap the stock AI-elegant type trio (Cormorant Garamond or Playfair + Inter + Caveat) off the build immediately. Playfair is a hard no. See decision D6 for what replaces it.
  - Clear scaffold residue: the Base44 favicon (port v1's `public/favicon.svg`), `name: "untitled"` in config.jsonc, and the untouched shadcn `.dark` block with purple/pink chart tokens sitting in it. That block is vibe-code colour and it ships by default.
  - Real SVG `feTurbulence` grain, not a CSS dot grid. (v1's `.canvas-grain` is currently two radial-gradients; the mockup has a working feTurbulence data-URI to lift.)
  - One house motion curve `cubic-bezier(0.16, 1, 0.3, 1)`, 0.9-1.4s. No infinite bouncing anything.
  - One card everywhere is a tell: give each content type its native form. Reserve the card for where the shape means something.
- **A7.** App shell: layout route with `<Outlet>`, header, sidebar, footer (with tip jar link per D5), theme toggle, toast system (platform `<Toaster />`), route skeleton in `App.jsx` (surgical edits, preserve scaffold). Public vs. protected route split per D2.
- **A8.** Entity schemas from section 5 created in both places. Publish once so RLS is live in preview testing.
- **A9. Ship analytics. This is now the highest-value task in the plan and it is nearly free.** Moved up from F6 on the brief's evidence. `base44.analytics.track` is already on the platform. Instrument from the first deploy: `stash_created`, `palette_extracted`, `glaze_applied`, `onboarding_completed`, `extension_paired`, plus a page view on every tool route. No PII in properties. **Also update the Privacy page copy in the same change**, because v1's `PrivacyPage.tsx` currently promises "We do not run our own backend, analytics, or tracking scripts" and explicitly commits to updating that page if it changes. Honour that promise. Why this ranks first: the repo has zero instrumentation today (verified), so nobody knows which of the 20 tool pages anyone touches, and every feature-priority call in Workstream B is guesswork until this lands.

### Workstream G: Distribution (the missing workstream)

The brief's blunt finding: ColourPantry is a well-crafted toolbox with no front door, and distribution outranks every feature question by an order of magnitude. This plan originally had nothing on it. It cannot ship without at least a position on:

- **G1.** Acquisition. Nobody searches for a verb they do not know. The searches that exist ("recolor image palette", "colour palette generator") land on free tools with a decade of SEO. What is the actual arrival path? The blog is the only owned surface and it currently has one post in the sitemap.
- **G2.** The sitemap is 16 URLs and omits `/glaze`. Fix the sitemap, then decide what is worth indexing at all.
- **G3.** Retention. There is no reason to return tomorrow, no email capture, no notification surface. v2's accounts help, but an account is not a reason. (Note the wrapper limit: Base44's web wrapper does no native push. In-app inbox, email, or a digest are the options.)
- **G4.** Monetisation reality check. Every rival is free. The closest paid analogue in the recolour space charges $2 once. Persistence is the only thing anyone in this market charges for, which points at the stash. Decide whether v2 is a business or a portfolio piece, and say so out loud, because it changes the whole plan.

**This workstream has no owner and no answers yet. That is the honest status, and it is more important than anything in B or C.**

### Workstream B: Core library + feature migration (parallelizable after A6)

Order within B: B1 first (everything imports it), then B2–B10 in any order, roughly by user value.

- **B1.** `src/lib/` port: colour math (4.1), contrast/WCAG, harmony, curated data, font pairs, export serializers (no PDF), paste-image hook, canvas palette extractor (4.2), canvas poster renderer (4.3). Acceptance: a scratch page can round-trip hex↔HSL↔OKLCH, extract a 6-colour palette from an uploaded image, and render a stash poster to PNG without descender clipping.
- **B2.** Home + colour families + family detail pages.
- **B3.** Stashes: list, create, edit, reorder, poster export. Reads/writes `Stash` entity via user-scoped SDK; anonymous users get localStorage drafts with a "sign in to save" nudge (per D2).
- **B4.** Extract page (image upload + paste + palette extraction → save to stash).
- **B5.** Generate + Variations + Harmony surfaces.
- **B6.** Glaze: upload/paste screenshot, apply stash colours, white/black protection default, lightness weighting in flat mode. Parity with v1 commits fa5ded2 and 6181bd7 is the acceptance bar. **Demoted from "the signature feature" on the brief's evidence** (feature, not a wedge, not a moat, and no demand evidence). Two amendments:
  - **Market tone mode.** Keeping the pixel's OKLab lightness and transplanting only the palette's chroma is the single thing in this whole landscape with no equivalent anywhere, and it is currently the mode the product talks about least. It is the only claim that survived both adversarial rounds.
  - **Build the two-second proof.** A UI screenshot with a red button and a blue button at matched luminance, side by side against a gradient map: the rival's buttons collapse to the same mud colour and its whites get tinted, Glaze's stay distinct and the whites stay white. That comparison is the only frame where the advantage is perceptible without explanation. It belongs in the product, not just the marketing.
- **B7.** Contrast checker + CVD simulation (SVG filter matrices port as-is) + hex tooltips.
- **B8.** Visualize + Collage + Gradients.
- **B9.** Library (curated) with pagination/lazy-load (4.5). Lookup page.
- **B10.** Blog (per D4), Feedback (entity-backed, admin view gated on `user.role === 'admin'`), Privacy + Terms rewrite, footer tip jar.

### Workstream C: Landing page + loading screen (after A6; copy blocked on S3)

- **C1.** Landing page copy: positioning from the competitive brief (S3) + Build Bible voice. **S3 has now answered the lead question: lead with the stash, not Glaze.** Read `docs/COMPETITIVE-BRIEF.md` section "Landing page implication" and its "Do not claim" list before writing a word; that list is binding and several obvious lines are factually dead. Sections: hero (the stash), feature showcase, Glaze as a one-click-deep payoff with the gradient-map comparison demo, extension teaser, CTA to register. Copy rules in section 1.8 are binding: no em dashes, no emoji, no hedge, solo first-person voice, and **no fabricated stats** (no invented user counts, no "trusted by N designers"). Drop the social-proof placeholder unless there is something real to put in it. Draft with the `content-writer` agent if orchestrating multi-agent.
- **C2.** Landing page build: public `/` route (app home moves per D2), shadcn + framer-motion, blocks via `/component-tap`. Responsive, dark-mode aware, real copy from C1. **Marketing-site conventions from `prompts/one-cta-marketing-site`:** brand tokens in one theme block, token classes never hardcoded hex, one CTA per section, no carousels. Keep fallback content in the repo so the page renders complete before any entity has rows. Build it as a mockup first and show it (section 1.8c). **Any video on this page follows section 8d**: poster frame first, 720p, iOS autoplay flags, reduced-motion holds the poster. That applies to a hero background and to the Glaze-versus-gradient-map comparison demo, which is a strong video candidate because it is a moving proof rather than a claim.
- **C3.** **Crayon-melt loading screen.** Built and verified as an interactive mockup on 2026-07-17: https://claude.ai/code/artifact/12fb6446-6bf1-448a-b7b1-13218fbfc97e (source of truth for the behaviour). Port that, do not re-derive it. Spec:
  - **Reference:** melted-crayon-art. Dozens of real crayons packed edge to edge and fixed at the top, tips down, thin irregular wax running down. The crayons never move, because in real melted crayon art they are glued to the canvas and only the wax runs. No line art, no silhouettes, no figures. Asset and pipeline in `docs/loader/`.
  - **DECIDED 2026-07-17: video. It was measured, not argued.** The poster (frame 0, unmelted crayons) is **46 KB**, against **154 KB** for the finished-melt still the mask approach needed. Unmelted crayons are mostly flat canvas; a finished melt is detail everywhere. So the video path has a **lighter first paint than the still it replaces**, and real wax on top. It won on both axes. AJ's poster-frame rule pays twice: it takes the video off the critical path, and the frame it wants is the cheap one. Assets, servo, encode recipe and traps in `docs/loader/README.md`. The mask approach is kept as `superseded-mask-still.webp` in case the CDN question kills video.
  - *Superseded reasoning, kept so nobody relitigates it:*
    - *What exists today:* one photo of the finished melt, each drip revealed downward by a per-column mask. 154 KB, exact progress tracking, zero risk. Its weakness is real: **the drips do not form, they are unmasked.** Every drip's shape is baked in, so there is no wet bulbous head with surface tension, no drop detaching, no pooling. It is a reveal wearing a melt costume.
    - *What video buys:* actual wax physics, actual formation, light moving on a wet edge. Temporal coherence is what video models are for, so the frame-consistency objection does not apply to them (it applies to image models generating frames one at a time, which is what an earlier draft of this plan was arguing against).
    - *Why the weight objection is dead:* poster frame. The still shows instantly, the video upgrades it. The loader is never empty.
    - **The catch, and it is not small.** The two approaches need *different* stills, so they do not compose. The mask approach needs a photo of the **finished** melt (there must be wax to reveal). A video's poster must be **frame one**, which is **unmelted** crayons. Same subject, opposite state. So this is a fork, not a stack:
      - **Video path:** poster = unmelted crayons, video plays the melt, `playbackRate` driven by progress velocity (stall to 0, rush to 2x). If the video never lands or reduced-motion is on, the fallback is static crayons plus the percentage readout. No melt. That is an acceptable fallback but it is a real downgrade.
      - **Mask path:** what is built. Always works, no fallback needed, no CDN question, but the wax never truly forms.
  - **Where it actually landed:** poster 46 KB blocking, `melt.webm` 314 KB as an upgrade, `melt.mp4` 248 KB fallback. Progress drives `playbackRate` through a proportional servo, never seeking: `err = progress^2.2 * duration - currentTime`, then `playbackRate = clamp(err * 3, 0.25, 4)`, pause when caught up. A stalled fetch freezes the wax mid-drip. Verified 70% loaded maps to 46% through the clip, so the last third rushes.
  - **Two traps recorded in `docs/loader/README.md`:** retiming without `fps=24` silently doubles the framerate to 48 and roughly doubles the file; and Chrome pauses video-only media in background tabs, so `play()` rejects with `AbortError` and must be caught (the poster covers it).
  - **Still blocked on the Base44 CDN question in 8d**, which is the only thing that could send this back to the mask path.
  - **Nobody has watched it play yet.** Verified: loads to `readyState 4`, duration 5.00s, 1280x720, poster set, VP9 selected with the mp4 fallback present, servo math correct. Playback itself needs a human, because the preview pane backgrounds the tab and that is the exact condition that pauses video-only media.
  - **Canvas, not SVG.** One canvas redrawn per frame. This is the `gotchas` rule (prefer canvas effects over SVG-manipulation; canvas does not fight React's reconciler) and it matters doubly here: a loader unmounts the instant loading finishes, which is exactly the SVGFollower/Chromatica crash shape (pending timer fires after unmount, touches a cleared node, `insertBefore` throws). No manual DOM, no timers holding element refs.
  - **Melt curve: `melt = progress ^ 2.2`. The exponent must be GREATER than 1.** An earlier draft of this plan said `p < 1`; that is wrong and would decelerate. `d(melt)/d(progress) = p · progress^(p-1)`, which only increases when p > 1. Verified in the mockup by pixel sampling: at 35% progress the wax is 9.5% melted, at 70% it is 45.6%, at 100% it is 100%. The second half of the load does about 90% of the melting, which is the "faster as it loads" brief. The mockup ships an exponent slider so Megan can pick the final number by feel.
  - **Progress signal:** `registerBootTask(promise)` → fraction settled. Real boot promises (session check `isAuthenticated()`, stashes fetch, curated library, `document.fonts.ready`, colour engine). Never a timer. `shown` lerps toward `target` frame-rate-independently (`k = 1 - 0.0045^(dt/1000)`, dt clamped to 64ms) so step arrivals ease instead of snapping, and a stalled entity fetch visibly stalls the wax.
  - **Paint once synchronously on init, before the first `requestAnimationFrame`.** Found during mockup verification: rAF does not fire in a hidden or backgrounded tab, so a loader that only paints inside rAF shows an empty canvas. Also resync the clock on `visibilitychange` so a long hidden stretch does not jump the melt.
  - Implement as a `<BootLoader>` gate in the layout; reuse a mini crayon as the inline loader for slow integration calls (platform rule: show loading indicators during integration calls).
  - framer-motion only for the DOM-side wipe (whitelisted); the melt itself is canvas. No lottie, no gsap, no external animation libs.
  - **Motion:** one house curve `cubic-bezier(0.16, 1, 0.3, 1)`, 0.9-1.4s, per the fingerprint pass. Hold a beat of stillness at 100% before the wipe (pacing is the cheapest strong signal of human craft). Kill any `ease: 'easeOut'` + `delay: i * 0.08` default stagger.
  - **Reduced motion is a real fallback, not a disabled animation:** no drips, no per-frame melt, strip fills and the count runs. Respect `prefers-reduced-motion`.
  - Acceptance: throttled network shows the melt tracking real progress and visibly accelerating; the strip completes into a clean palette; no blank first paint; reduced-motion path still communicates position.

### Workstream D: Onboarding workflow (after A7 + B3; load S4 first)

- **D1.** Load `/base44-onboarding-ux`. Design a first-run wizard for verified new users: welcome → "what do you make?" (designer/dev/artist/curious) → theme + CVD preference → create-first-stash moment (pick 3 colours or extract from an image) → extension teaser (links to Workstream E install page).
- **D2.** Persist wizard state via `auth.updateMe({ onboarding_completed: true, ... })`. Guard: layout checks the flag and routes to `/welcome` when unset. Handle brand-new users with zero saved fields.
- **D3.** Post-register flow check: register → OTP → verifyOtp → setToken → hard redirect → onboarding fires. Do not touch the pre-built auth pages beyond visible-string styling needs, and only if required.
- **D4.** Empty states everywhere reference onboarding actions (empty stash list → "extract your first palette").

### Workstream E: Chrome extension colour picker (independent after A8; SEPARATE REPO)

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

### Workstream F: Migration, hardening, launch (after B, C, D complete; E can trail)

- **F1.** `/base44-security-audit` (S6). Fix every world-readable/PII finding. Re-check `Stash.is_public` exposes only colours, never email/created_by-derived PII.
- **F2.** QA pass through Claude in Chrome on the preview URL: every route, mobile viewport, dark mode, CVD filters, paste flows, poster export, onboarding end-to-end with a fresh account.
- **F3.** v1 data import: on first login, offer "import your local stashes": read v1's IndexedDB (only works on the v1 origin), so ship a tiny export button ON v1 (one last Vercel deploy: "Download my stashes as JSON") + import-JSON on v2. Also keep plain JSON import permanently (nice feature anyway).
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

**Critical path:** A2→A9 → B1 → B3 → D → F. (A9 is analytics. B6/Glaze is off the critical path now.)
**Parallel lanes once A6 lands:** (B features) ∥ (C landing+loader) ∥ (E extension scaffold).
**Recommended phase order for a single implementation model:** S1+S2+S3 → A (ending on A9, analytics) → B1 → **B3 (stashes, the product)** → B2/B4 → C (landing+loader) → D (onboarding) → B6 (Glaze) → B5/B7/B8/B9/B10 (long tail) → F → E (extension can ship 1-2 weeks post-launch; only the `/extension` teaser page ships at launch).

**Reordered on the brief's evidence.** B3 (stashes) is now the priority build, not B6 (Glaze). The stash is the product, it is the direction the market walks (extraction and organisation, not application), and persistence is the only thing anyone in this market charges for. Glaze is what makes a saved stash worth having kept, which makes it a retention feature, and retention features are worthless until there is someone to retain.

**Workstream G (distribution) runs alongside everything and is more important than all of it.** It has no answers yet. That is the honest status.

If orchestrating multi-agent: B2–B10 are independent page builds sharing only B1 + tokens, safe to fan out; C1 goes to a content agent; S3 to a market-research agent; E is a separate-repo agent lane.

---

## 8. Decisions needed from Megan (D1–D5)

- **D1. Repo + domain strategy.** New repo name for the Base44 app (suggest `colourpantry-app`), extension repo (`colourpantry-extension`), what happens to the current Vercel deployment and domain at cutover. Plan assumes: new repo, domain moves to Base44, v1 lingers on legacy subdomain for the export window.
- **D2. Auth posture.** Recommended: browse/play anonymous (localStorage drafts), account required to save stashes to cloud, sync, and pair the extension. Alternative: hard login-gate the whole app. Plan assumes the recommended split.
- **D3. Feature kills.** Anything from the v1 route list NOT worth rebuilding (candidates to question: Collage, Skin, Lookup as a separate page vs. merged into search). Plan assumes everything migrates.
- **D4. Blog storage.** In-repo markdown (simple, versioned, no entity) vs. `BlogPost` entity (editable from dashboard). Plan assumes in-repo markdown.
- **D5. Tip jar.** Keep the existing Stripe payment link (zero work) vs. Base44 payments provider. Plan assumes: keep the Stripe link.
- **D6. Type.** Genuine tension, surfaced rather than decided. v1 ships **Jost** (set in `tailwind.config.js` as both sans and display). The design-taste page names **IBM Plex Serif / IBM Plex Sans** as the fingerprint, and the fingerprint-pass lesson says type is the loudest tell and to swap the stack to Plex. But Jost is not a Base44 default tell (the tells are Cormorant/Playfair + Inter + Caveat), so v1's type is a deliberate choice, not template residue. Options: (a) keep Jost, v2 stays visually continuous with v1; (b) move to IBM Plex Serif headings over Plex Sans body, matching the fingerprint. Either way it is a 2-file change (index.html + index.css) because everything routes through `--font-heading` / `--font-body`. **Plan assumes (a) keep Jost** until Megan says otherwise. Not a blocker for anything except A6b.

Answer these before Workstream A; none block the S1-S3 skill runs.

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
| Base44's asset delivery is an unknown (CDN? edge?) | Any video hero or loader could be slow in exactly the place it must not be | Section 8d. Answer it before committing to video. Poster frame works regardless, so lead with that. Do not assume; the platform reference is silent. |
| Video assets balloon past their budget | The loader or hero becomes the thing you wait for | 720p not 4K, encode for static-background footage, never extract to frame sequences, measure before committing (8d) |

---

*End of plan. Implementation model: start with section 1, then run S1/S2/S3, then confirm D1–D5, then Workstream A.*
