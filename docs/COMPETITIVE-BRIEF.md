> **FROZEN COPY.** The live version of this document moved to the colourshark repo (docs/) on 2026-07-17. Edit it there; this copy stays as v1-era history.

# ColourPantry: competitive brief

**Produced 2026-07-17** for the v2 Base44 rebuild. Coolors excluded from research on request (already covered in prior work), which is a real limitation and is flagged where it bites.

**Method:** 69 agents across two rounds. Every factual claim was handed to an adversarial verifier told to refute it. A completeness critic then attacked the round-1 synthesis and found a blind spot big enough to justify a second round. Claims that could not be sourced to a first-party page are marked unverified and listed in "Do not claim". Repo claims were checked against the actual code, not inferred.

---

## The headline

The rebuild premise needs adjusting. "Bigger and better" assumes the problem is the product. It is not.

ColourPantry has 20 tool pages, no analytics of any kind, no email capture, no acquisition loop, and a tip jar for monetisation. Every serious rival is free and has millions of users. The signature feature is not in the sitemap and not on the homepage.

**This is not a product with a positioning problem. It is a well-crafted toolbox with no front door.** Tool 21 does not fix that.

Verified against the codebase, not asserted:

| Claim | Status |
|---|---|
| No analytics package anywhere | **Confirmed.** Nothing in package.json. The only "analytics" string in `src/` is `PrivacyPage.tsx` promising there is none. |
| `/glaze` missing from the sitemap | **Confirmed.** `public/sitemap.xml` has 16 URLs. Glaze is not one of them. |
| Glaze not linked from the homepage | **Confirmed.** Zero references in `HomePage.tsx`. Reachable only from header nav. |
| Monetisation | Stripe appears in 3 files, one of which is `Footer.tsx` (tip jar link). |

The cheapest useful thing in this entire brief costs one script tag. Two rounds of research argued about whether Glaze is unique while nobody has ever measured whether a single person uses it.

Note: `PrivacyPage.tsx` currently promises "We do not run our own backend, analytics, or tracking scripts" and commits to updating that page if it changes. Adding analytics is a copy change and a trust decision, not only a technical one.

---

## Market shape

The market splits into four camps that almost never overlap.

1. **Generation.** Adobe Color, Huemint, Khroma, Colormind, Paletton. They compete on how palettes get made (wheel maths, GANs, transformers, trained taste). All free, no meaningful paid tier.
2. **Context preview.** Realtime Colors, Happy Hues, Colormind's Bootstrap page, PaletteMaker, Coolors Visualizer. All promise "see your colours on a real design", and all of them mean *their* design, not yours.
3. **Capture.** ColorZilla (4,000,000 Chrome users, per the Web Store listing, which reports rounded buckets) and ColorPick Eyedropper (800,000). They own the eyedropper habit outright, and the pick is a dead end: no palette library, no accessibility layer, no image output.
4. **Accessibility.** WebAIM, WhoCanUse, Coblis, Accessible Colors, Stark. They work on colour pairs or on CVD simulation of an image, never on a palette applied to a real screen.

Two through-lines matter:

- **Everyone runs one direction.** Colours come *out* of images. Almost nothing puts a saved palette *back into* a raster image.
- **Persistence is the only thing anyone charges for.** Coolors gates saved palettes. Stark gates team accessibility infrastructure. Everything else is ad-funded, donation-funded, or a funnel into a paid suite.

That second point is the commercially interesting one, and it points at the stash, not at Glaze.

---

## The Glaze verdict

**Glaze is a well-built feature with a genuinely uncommon mechanic and no evidence of demand. Both halves are true. The second one decides it.**

### On mechanics, Glaze is better than round 1 said

The completeness critic charged that Photoshop's gradient map has shipped Glaze's mechanic for twenty years. That is false, and the error is load-bearing, so it is worth being precise.

Gradient map is a **1D luminance-to-ramp lookup**. It reduces each pixel to one scalar and indexes a gradient with it, discarding hue and saturation before the lookup. Two consequences on a UI screenshot:

- A red button and a blue button at equal luminance collapse to the **same** output colour.
- Whites and blacks are recoloured **by definition**, because they are the ramp endpoints.

Glaze (verified by reading `src/pages/GlazePage.tsx` lines 74 to 132) is a **3D OKLab nearest-neighbour quantiser with a chroma gate**:

- Matches across all three axes (L, a, b) in OKLab, so equal-luminance different-hue pixels stay distinct.
- Computes chroma `c = sqrt(a² + b²)` and skips the pixel when `c < 0.03`, with a soft fade to `0.08` so near-greys do not pop at the threshold edge. That is the white/black protection, and it is conditioned on **saturation**, not lightness, which nobody else does.
- Weights `dL` by 1.5x in flat mode so a dark pixel prefers a dark stash colour, preserving shadow and highlight structure.
- Ships a **tone mode** that keeps the pixel's own lightness and transplants only the palette's chroma.

Gradient map structurally cannot do this. "Adobe tried this for twenty years" is wrong as stated.

### On market, Glaze is worse than round 1 said

That argument only proves Glaze is not the gradient map. It does not prove anyone wants it.

The mechanic that *is* Glaze's (nearest-neighbour remap to an arbitrary palette) shipped decades ago in **ImageMagick `-remap`**, **GIMP Indexed mode**, **Photoshop Indexed Color**, and **Krita Palettize**, which does it in Lab and is therefore lightness-aware by construction. The two headline refinements are thinner than they feel:

- White/black protection is approximable by anyone who thinks to put `#fff`, `#000` and a grey ramp into a remap palette. It is a very good default, not an invention.
- Lightness weighting is a 1.5x taste tweak on top of something Krita's Lab mode already does structurally.

**The only thing in this landscape with no equivalent anywhere is tone mode**, and it is the mode the product markets least.

### The demand evidence is bad

The *job* is real and peer-reviewed. CHI 2024 (Hegemann and Oulasvirta, 12 designers interviewed) records that designers report colours not appearing as expected once a palette meets a real screen, and explicitly calls for tools integrating palette and prototype.

The pull for **Glaze's answer** to that job is not visible anywhere across six directions of search:

1. **Five-way convergence.** Coolors, Huemint, PaletteMaker, Paletton and Adobe all independently built palette-in-UI-context, and all five chose canned templates over user uploads. The two that touched uploads constrained them to death (Huemint's own About page says the image must contain flat colour only, no photos or gradients; Coolors is SVG-only) or ran the opposite direction (PaletteMaker uploads to extract). Either all five missed the same opening for a decade, or all five learned the upload step kills it.
2. **Direction asymmetry, roughly 20x.** pywal (image to palette) has 9,082 GitHub stars. Palettum, the best palette-to-image tool found, has 489 stars, 4 forks, and no push in a year.
3. **The launch graveyard.** Every recolour launch on Hacker News scores single digits. `pagerecolor.com`, whose pitch was Glaze's pitch, got 1 point and 0 comments, and the domain no longer resolves. Palette generators on the same site score 497, 343, 291, 209. Palette-thinking posts score 1,019 and 705.
4. **Builder's-itch signature.** Twenty-plus GitHub repos implement this mechanic. Top one at 489 stars, long tail at literally zero (image-recolor 0, autoRecolor 0, palette-recolor-studio 0, nordify 0). High builder interest plus near-zero user interest is the signature of a fun thing to build.
5. **The request nobody needed filled.** Figma's Gradient Map plugin has 20,100 users. Its top comment, three years old, asks for saved presets. The creator said soon. It never shipped and the plugin was abandoned. 20,100 people kept using it anyway. Saved palettes are not load-bearing for the recolour job: people explore a look, then throw the stops away.

**The one real piece of counter-evidence, and it is good:** on Image Colorizer (63,600 users, the most-installed plugin in the category) two users independently asked for exactly Glaze's two features. One asked for multiple colours at once. One asked, verbatim, how to change only the tints and not the white parts. Both were told no. That is unmet demand in users' own words on a competitor's page, for precisely what commit fa5ded2 shipped. It is also two comments.

### Verdict

Glaze is a **feature, not a wedge and not a moat**. It is the most interesting code in the repo and the least evidenced part of the product. Keep it. Ship it. Stop leading with it.

---

## Who actually threatens it

- **Coolors Visualizer.** The real one. Free, zero steps, palette already on a mobile and web UI mockup at page load, spacebar to reroll, and the output is role-correct because the template knows which shape is a button. It answers "what does my palette look like on a UI" better than Glaze does, with no upload and no download. Coolors is not a competitor that missed this. It is the competitor that considered it and shipped templates instead. (Flagged: Coolors was excluded from research on request, so this rests on round-1 inference plus verified Visualizer page content, not a full teardown. It is the single biggest gap in this brief.)
- **Figma variable modes.** Zero steps, native, free, re-themes the entire prototype live in the real file with correct role allocation. Anyone who owns the file has no reason to screenshot it.
- **The Figma Gradient Map plugin** (20,100 users), Gradient Mapper (4,200), and the free standalone `gradientmap.app`. Wrong mechanic, right friction: drag, drop, up to 8 hexes, done, inside the file the screenshot already lives in. The honest answer to "why not just use Gradient Map" is currently "no good reason", because most people will never perceive the hue collapse. Being right about OKLab does not win a user who likes the duotone.
- **Canva Duotone and Adobe Express Duotone.** Free, browser, already open, exact hex on both stops, deterministic, about five clicks. Capped at two colours and destroys whites and blacks by construction, which is the only reason Glaze beats them. Real gap, small one.
- **The export, upload, download round-trip.** Not a competitor, but it beats Glaze more often than anything above. Every rival living inside the design tool wins by default on anyone whose screenshot originated there, which is most of them.

---

## What is genuinely unique (survived both critiques)

1. **Tone mode.** Preserve the pixel's OKLab lightness, transplant only the palette colour's chroma. No equivalent found in ImageMagick, GIMP, Krita, Photoshop, Photopea, the Figma recolour cluster, or the ricing tools. The only survivor of both critiques, and the least-marketed part of Glaze.
2. **The chroma gate as a UI-specific insight.** Skipping pixels below chroma 0.03 with a soft fade. Nobody else conditions protection on saturation rather than lightness. Approximable in 60 seconds by someone who knows the trick, so it is the difference between a tool that works first try and a tool that needs you to know a trick. Sell it as a default, not an invention.
3. **Saved stash times arbitrary raster screenshot.** Figma's raster recolour plugins have no saved palettes; the one plugin with saved palettes is layer-based and cannot touch a flat screenshot. Genuinely unoccupied territory. Unoccupied is not the same as wanted.
4. **Determinism against the AI cohort.** Diffusion recolour garbles UI text and cannot be trusted on a screenshot. This gap is structural, not a feature-parity gap that ships next quarter. It is also a defence against a competitor that was never coming.

---

## Do not claim (binding on the landing page)

The copy rules forbid fabricated stats. These are the claims that failed verification or are outright false.

- **"AI cannot hit exact hex codes."** Falsified. A Google Cloud study on Gemini 2.5 Flash Image measured hex adherence at delta-E 0.90 when the target is supplied as a swatch reference image, below the study's own imperceptibility threshold. Text-supplied hex averaged 11.25, which is where the belief came from. The defensible claim is that AI recolour cannot preserve a screenshot, which is about determinism and text, not colour precision.
- **"Nobody has tried recolouring images for designers."** Coolors, Huemint and PaletteMaker all tried and all retreated to templates.
- **"The first tool that recolours your screenshot to your palette."** Roughly 24,000 Figma users do a version of this today, free, without leaving the file.
- **"Photoshop is expensive, we're free."** The mechanic is free in Photopea, Krita, GIMP, gradientmap.app and a Figma plugin. Never benchmark against Adobe's price. Benchmark against Photopea's output. (Photoshop pricing was never verified from a first-party page. Adobe's pricing pages refused automated fetches across five attempts.)
- **"Free, browser-based, no install, runs locally."** Photopea is a free browser Photoshop clone that processes client-side and opens 40 formats. Every one of those words is table stakes.
- **"Uses OKLab for perceptual accuracy."** Krita's Palettize already matches in Lab. Recolor Anything already uses OKLCH. Nobody outside this repo cares about the colour space, and the ones who do already have it.
- **"Protects whites and blacks"** as a technical moat. Good default, not an invention.
- **Any install count, star count, user count or price not in this brief.** Adobe's, Recraft's and Canva's prices were never verified from a first-party source. Chrome Web Store install counts are rounded display buckets, not exact figures.
- **Color Hunt traffic figures** (200,000 monthly users, 20,000 daily, 3,000 mailing list) are from an October 2017 Medium post, roughly nine years stale. Do not cite as current. Separately, the Chrome Web Store's "200,000 users" for Color Tab is an install count that coincidentally matches the unrelated 2017 web figure. Do not conflate.
- **Paletton's "~20 million visitors"** could not be found on any live Paletton page. The "93,720" figure circulating is a MediaWiki page-view counter for a wiki article, not a user count.
- **Adobe Color being free in all respects** is well-supported but not first-party verified. The Adobe Express rebrand may introduce Express's free/premium split into these tools.

---

## Landing page implication

**Do not lead with Glaze. Lead with the stash.**

In order of weight:

1. Glaze loses a head-to-head with a free plugin that lives where the work already is. Any headline claim about recolouring a screenshot invites exactly that comparison. Glaze wins it only on inspection, only on UI screenshots with multiple equal-luminance hues, and only when demonstrated. A landing page gets one scroll. It cannot demonstrate.
2. Every "nobody does this" claim in the space is factually dead, and a designer disproves it in one tab.
3. The evidence says the pull is in choosing, extracting and organising palettes, not spraying them onto pictures. Lead with the direction the market is walking.
4. The product's own information architecture already agrees. `/glaze` is not in the sitemap and not on the homepage.

**What to do with Glaze instead:** keep it one click deep, as the payoff for having a saved stash, and demo it on the one case it visibly wins. Not a photo, where a gradient map looks better. A UI screenshot with a red button and a blue button at matched luminance, side by side against a gradient map, where the rival's buttons turn identical and mud-coloured and Glaze's stay distinct and the whites stay white. That is the only frame where the advantage is perceptible in under two seconds. It is also a strong candidate for the hero demo, because it is a *moving* proof rather than a claim.

**If a Glaze line must exist above the fold**, it is subordinate, and it is about survival rather than recolouring, because the recolour half is commodity and the survival half is not. Shape of it: *I keep your whites white, your text black, and your buttons telling each other apart.* Never "recolour your screenshot."

---

## The real constraint

Ranked, and it is not close.

1. **Distribution.** Problem one by an order of magnitude. Glaze cannot acquire, because nobody searches for a verb they do not know, and the searches that do exist ("recolor image palette") land on free tools with a decade of SEO. Glaze cannot monetise, because the landscape is free and the closest paid analogue charges $2 once. Glaze cannot retain, because the output is a raster PNG: unshippable, uneditable, consumed by nothing downstream. It is a dead-end artifact.
2. **Measurement.** Zero instrumentation, confirmed in the code. This is embarrassing and it is one script tag away from fixed. It also gates every other decision, including whether Glaze deserves the rebuild attention two research rounds just spent on it.
3. **Retention.** No reason to come back tomorrow. No email capture. No account (v2 fixes the account part).
4. **Competitive differentiation.** Problem five or six. Two adversarial passes have now been burned relitigating whether a feature is unique, while the actual question (does anyone arrive, does anyone come back) has never been instrumented.

**The strategic irony worth sitting with:** ColourPantry's own gravity is toward the stash. Every piece of evidence here says demand is in choosing, extracting and organising palettes. The stash is the product. Glaze is the thing that makes the stash worth having kept. That is a retention feature, and retention features are worthless until you have someone to retain.

---

## What this changes in the rebuild plan

Concrete amendments to `BASE44-REBUILD-PLAN.md`:

- **New, and it goes first: ship analytics.** `base44.analytics.track` is on the platform already (plan section F6 has it at the end). Move it to Workstream A. Instrument `stash_created`, `palette_extracted`, `glaze_applied`, `onboarding_completed`, `extension_paired` from day one. Update `PrivacyPage` copy to match, since it currently promises no tracking. Let the data end the Glaze argument instead of a round three.
- **C1 (landing copy): lead with the stash, not Glaze.** The plan currently says "Glaze is the differentiator, lead with it". That is now contradicted by the evidence. Glaze becomes a one-click-deep payoff with a demo, not the hero claim.
- **B3 (stashes) is the priority build, not B6 (Glaze).** The stash is the product and the only thing in the market anyone charges for. Reorder Workstream B accordingly.
- **B6 (Glaze): market tone mode.** It is the only genuinely unique thing that survived scrutiny and it is currently the least-marketed. Also worth building the side-by-side-against-a-gradient-map demo, because that is the only two-second proof.
- **D3 (feature kills) now has evidence.** 20 tool pages with no analytics is the problem, not the solution. The rebuild should probably not add tools until something measures which of the 20 anyone touches.
- **Distribution is missing from the plan entirely.** There is no workstream for acquisition. That is the number one constraint and the plan has nothing on it. Needs a Workstream G, or the rebuild ships a better toolbox with the same empty front door.

---

## Open gaps (honest)

- **Coolors was never researched**, on instruction. It is named the closest commercial threat and the operator of the best-in-market answer to Glaze's job. This is the largest hole in the brief. If prior Coolors work exists, reconcile it against the Visualizer finding before writing landing copy.
- Reddit refused all automated fetches, so there is no thread-level data from r/web_design or r/unixporn.
- Figma Community and Product Hunt 403 automated fetches; install counts were read from search indexes and live pages where possible, but upvote counts were not obtained.
- Adobe, Recraft and Canva pricing was never confirmed first-party.
- Glaze's *output quality* was never compared side by side against Repalette or ImageGoNord. The craft argument rests on reading the source, which is strong evidence of intent and weaker evidence of result.

---

*Sources: 69 agents, 1,155 tool calls, two rounds, adversarial verification on every factual claim. Round 1 run `wf_023a98b9-f8f`, round 2 run `wf_796f7835-883`. Per-agent returns in the workflow journals.*
