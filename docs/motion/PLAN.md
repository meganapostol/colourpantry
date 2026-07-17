# Motion orchestration plan — for the next execution session

Written 2026-07-18, from the motion session in the v1 repo. Megan's verdicts in
that session are binding here and postdate the frozen copies of the older plans.

**Read first, in order:** `colourshark/docs/MASTER-PLAN.md` (the entry point;
carries the contest verdicts) → this file. The contest build lives in
`colourshark` (Base44, 2-way GitHub sync, deploys on push to main). This file
plans the motion workstream only; it defers to the master plan on everything
about the contest cut.

## Megan's verdicts (2026-07-18, this session — do not relitigate)

1. **The wax direction is approved, the layout is not.** The procedural wax
   look (specular beads, surface tension, droplets that detach and pool) is
   right. But the crayons must be **packed edge to edge and melting as one
   piece** — the tumblr hair-dryer canvases — not isolated parallel strings.
   This matches MASTER-PLAN workstream 2's art direction word for word.
2. **Melt is canvas** (Megan, colourshark `b0be102`). The wax realism gets
   implemented in the existing Canvas 2D melt (`crayonArt.js` /
   `BootLoader.jsx`), not by swapping in WebGL. The WebGL lab is reference
   math, not the shipping renderer.
3. **No real-footage shoot. Ever.**
4. **If a generated video is ever needed** (fallback only): prompt it through
   Base44 — `GenerateVideo` exists in Core integrations (4/6/8 s, 16:9,
   5 credits/s), or via the Base44 chat as Megan prefers. The art-directed
   prompt lives in v1 `docs/loader/README.md` ("Melt v2" section). Frame 0
   must stay unmelted or the poster rule dies.
5. **The ambient backdrop ships restrained** (lamp + Home-only bloom, hard-off
   on colour-judging routes). Do not make it louder without Megan.
6. **Never host locally. Never verify on localhost.** All verification happens
   on the Base44 preview URL through Claude in Chrome (pinned in colourshark's
   CLAUDE.md). Vercel is v1-only and irrelevant to this workstream.

## What already exists (do not rebuild)

| Thing | Where | State |
|---|---|---|
| Wax reference math: height-field shading, bead swell/detach, squash-stretch droplets, pool mounds, shortening crayons, stick-slip | v1 repo `public/melt-lab.html` (motion branch) | Working; contact-sheet verified; `__labShot(t, p)` renders deterministic frames headlessly |
| v2 canvas melt with columns, exponents, THE INVARIANT | `colourshark/src/components/loader/crayonArt.js` + `BootLoader.jsx` | Live lane; MASTER-PLAN workstream 2 owns it through the contest cut |
| v1 loader harness (boot tasks, fast-skip, watchdogs, `?melt=` params) | v1 repo `index.html` (motion branch) | Shipped on branch; v1-only |
| Ambient backdrop (lamp + bloom) | v1 repo `src/components/Backdrop.tsx` + `index.css` (motion branch) | Shipped on branch; port target is v2, post-contest |
| Video assets + regen pipeline + prompt | v1 `docs/loader/` and copied to `colourshark/docs/loader/` | Superseded as the shipping path; fallback only |

## Phase 0 — preflight (every session, no exceptions)

- `git pull` in colourshark before touching anything (Base44-side edits land as
  remote commits). Check `docs/BUILDLOG.md` for active lanes; `BootLoader.jsx`
  was mid-flight on another lane at the time of writing. If a lane owns your
  file, coordinate through BUILDLOG or stop.
- Deadline discipline while the contest window is open (closes July 19,
  3:00 p.m. PT): MASTER-PLAN's rule stands — a change to the loader that
  cannot be verified in time gets reverted, not shipped. A loader that never
  closes is a submission-losing bug; an ugly one is not.
- The platform reference (`~/.claude/base44/BASE44-PLATFORM.md`) is ground
  truth. Confirmed there: `index.html` is editable (preserve head, root div,
  module script), framer-motion and three.js are whitelisted, `GenerateVideo`
  exists. Still unanswered there: whether repo `public/` assets are CDN-backed
  — measure, don't assume, if an asset ever goes on the critical path.

## Phase 1 — wax realism into the canvas melt (the main event)

Port the melt-lab's wax behaviour into `crayonArt.js`, translated from SDF/GL
to Canvas 2D, preserving every invariant workstream 2 names:

- progress-driven, never a clock; a stalled fetch freezes the wax mid-drip
- at `progress = 1` every column reaches exactly `m = 1` (the curtain closes)
- synchronous first paint in the layout effect; mulberry32 seeding so resize
  rebuilds identical geometry; reduced motion honoured

What to add, in order of visual payoff (each one is independently shippable):

1. **The bead.** Each stream front is a bulb, not a line end: radial gradient
   (colour → darkened colour), a white specular dot offset upper-left, a
   soft dark ellipse under it as contact shadow. Swell before advance
   (stick-slip): the front pauses while bead radius grows, then surges.
2. **Packed curtain.** Columns sit edge to edge (they already tile the
   viewport; the crayon row must too — no gutters). Adjacent streams widen
   near the tips so neighbours touch and merge; where they overlap, blend
   colour (Canvas: draw wide-to-narrow tapered trail paths in column order,
   slight overlap, no gaps at the top — the "one piece of wax" read).
3. **Droplets.** At seeded melt milestones a droplet detaches: ellipse that
   stretches with velocity, falls under gravity, lands in the pool. Cap
   concurrent droplets; reduced motion spawns none.
4. **The pool.** Landed droplets and finished streams feed per-column volume;
   render as flat mounds (wide, low ellipses) that merge into one
   multicoloured band as volume grows. At `progress = 1` the pool is part of
   the closed curtain, not a separate object.
5. **Gloss pass.** A moving highlight along each trail edge (thin lighter
   stroke offset toward the light) and slight darkening at trail edges. This
   is the single cheapest "it's wet" signal.
6. **Consumption.** Crayon tips shorten as their column melts (~10% of melt
   distance). Wax comes from somewhere.

Reference implementation for all six: v1 `public/melt-lab.html` — the sim
(`stepSim`) is plain JS and ports almost verbatim; only the rendering needs
translating from shader to 2D calls.

**Verification:** the melt-lab pattern — expose a deterministic
`__shot(t, progress)` hook on the loader in dev, render contact sheets at
p ∈ {0.2, 0.5, 0.75, 1.0}, and eyeball them. Then the Base44 preview URL via
Claude in Chrome for the live run. Acceptance gate: Megan looks at the preview
and says the word. Do not self-certify the look.

## Phase 2 — fallback only: generated video

Only if Megan judges the canvas wax still too flat after Phase 1:

- Generate via Base44 (`GenerateVideo`, 8 s, 16:9) or the Base44 chat with the
  prompt from v1 `docs/loader/README.md`. Requirements: macro light, hard
  speculars, surface-tension beads, contact shadows, clean unmelted frame 0.
- The v1 ffmpeg pipeline (delogo if watermarked, retime, poster extraction)
  applies unchanged; rebuild commands are in that README.
- This path resurrects the servo. That cost is why it's the fallback.

## Phase 3 — backdrop port to v2 (post-contest)

- Port `Backdrop.tsx` → `.jsx`, default export, split to respect the ~50-line
  component convention. Gradient values live in `src/index.css` (index.css
  owns token values; no hex in JSX — colourshark house rule).
- Quiet-route list maps to the real IA: bloom on Home only; hard-off on
  Taste, Pair/contrast, Skin, family drill-ins — anywhere colours get judged.
- Bloom hook: the Home waffle/family cells dispatch the same
  `cp:bloom` CustomEvent contract on hover/focus.
- Keep the restraint: lamp is luminance-only, bloom ≤ ~9% opacity.

## Phase 4 — motion menu on v2 (post-contest backlog, in order)

1. **The logo trick (Megan's ask, 2026-07-18).** The wordmark sits **plain**
   at rest — ink colour, matching theme, no rainbow. On mouseover it comes
   alive: a **multicolour confetti burst** fires from the logo (through the
   one shared particle engine's `confettiBurst()` lane — never a second
   system), and **colour shifts through the letters**: each letter takes a
   hue offset by its index and the hues rotate while hovered, so a wave of
   colour travels through "colour pantry". On mouse leave the letters ease
   back to plain ink. Details: keyboard focus triggers it too; on touch, a
   tap fires the same burst once; rate-limit the burst (~once per 2 s, same
   as the Saffron rule) so hover-jitter can't spam particles; reduced motion
   gets no confetti and a static colourized wordmark instead of the cycling
   wave, so the joke survives with the motion off. Note for the port: the v1
   header renders the letters permanently rainbow — plain-at-rest is a
   deliberate change of the resting state, not an accident.
2. **Wax bursts on stash-add/copy** — through **the one shared particle
   engine** (SHARKTANK-PLAN section 4) via the existing `confettiBurst()`
   lane. Never a second particle system — standing rule. Reduced motion
   already no-ops bursts there.
3. **Fly-to-stash chip** — FLIP animation from cell rect to the stash UI;
   teaches where the stash lives.
4. **View Transitions API route morphs** — family card colour expands into
   the family view. Progressive enhancement, no-op where unsupported, no new
   packages (framer-motion is whitelisted if ever genuinely needed).
5. **Home grid stagger-in** — coordinate with the "all 24 cubes in one look"
   fit work that just landed; CSS delays only.
6. **Melting hover on family cards** — pseudo-element drips in card colour.
7. All of it behind one shared `prefers-reduced-motion` kill switch.

## Orchestration shape

Serial through Phase 1 (one builder; one adversarial looker judging contact
sheets against the tumblr reference before Megan sees anything). Phases 3-4
can fan out only where file ownership is disjoint, BUILDLOG-coordinated, per
the master plan's lane rules. Megan gates: the Phase 1 look, any Phase 2
credit spend, the backdrop port, anything that adds a package.

## Never

- Host or verify locally. Base44 preview via Claude in Chrome only.
- Copy code from the Khroma reference files sitting untracked in the v1 repo
  root (concepts fine, code never; do not commit those files).
- Break THE INVARIANT, ship an unverifiable loader change during the contest
  window, or add a second particle system.
