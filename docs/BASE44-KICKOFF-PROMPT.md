# The first Base44 prompt

Paste everything inside the block into Base44's chat. Nothing else, nothing before it.

It is deliberately a **bones-only** prompt. Base44's builder will cheerfully produce twenty templated tool pages if you let it, and every one of them would be something I then delete. This gets the foundation right (tokens, type, entities, access rules, analytics) and stops. Then you connect GitHub and I take over.

**After it runs:** connect the GitHub repo (2-way sync), then tell me and I will pull and start committing.

**One flag:** this sets **Jost**, matching v1. Your taste page and your own kickoff prompt both name IBM Plex. I have not overridden your v1 choice. It routes through `--font-heading` / `--font-body`, so swapping is a two-file change whenever you say.

---

```
Before you write any code, read this whole message.

WHAT THIS IS
ColourPantry: a colour tool for designers, developers and artists. Saved palettes,
called "stashes", are the core object of the product. This is a rebuild of an app
that is already live, so the brand already exists and is not up for reinterpretation.

BUILD PHASE 1 ONLY: THE BONES
Build the foundation and then stop. Do not build features. I am connecting GitHub
after this and every tool page ships as a git commit from my side. If you build tool
pages now I will delete them, so do not build them.

1. DESIGN TOKENS FIRST, BEFORE ANY COMPONENT

Put these in src/index.css on both :root and .dark, and register every one of them in
tailwind.config.js under theme.extend.colors so they are usable as bg-canvas, text-ink,
border-line and so on. Do not skip the tailwind registration. If the tokens are not
registered, every later change becomes a thirty file hunt instead of a one line edit.

Light:
  canvas  #FAF7F2
  surface #FFFFFF
  ink     #1A1A1A
  line    #E8E2D5
  muted   #7A7468
  gold    #D4A574

Dark:
  canvas  #0E0E0E
  surface #161616
  ink     #FAF7F2
  line    #262626
  muted   #9A9A9A
  gold    #D4A574

Gold is punctuation only. It marks arrival and achievement. Never use it as a
background, a wallpaper accent, or a default.

2. TYPE

Jost for everything, sans and display. Import it with @import at the very top of
src/index.css, before @tailwind base. Map it to --font-heading and --font-body, and to
fontFamily.sans and fontFamily.display in tailwind.config.js.

Do not use Cormorant Garamond, Playfair Display, Inter, or Caveat anywhere. If any of
them are in the scaffold, remove them.

3. CLEAR THE SCAFFOLD RESIDUE

- Set the real app name in config.jsonc. It must not say "untitled".
- Do not ship the default Base44 favicon. Use a plain neutral placeholder; I am
  committing the real one.
- If the shadcn .dark block contains purple or pink chart tokens, delete them. They are
  not our brand and they are the single most obvious sign of an untouched scaffold.
- One motion curve for the entire app: cubic-bezier(0.16, 1, 0.3, 1), between 0.9s and
  1.4s. No easeOut defaults, no index times 0.08 staggers, nothing that bounces forever.

4. THE SHELL

- A Layout component using <Outlet />, with Header, Footer, and a light and dark theme
  toggle that persists across reloads.
- Header: wordmark, nav, theme toggle. Footer: minimal.
- Add the routes below to src/App.jsx surgically. Preserve AuthProvider,
  QueryClientProvider, BrowserRouter, Toaster and ProtectedRoute exactly as they are.
  <Routes> may contain only <Route> elements as direct children.

Public:    /  /login  /register  /forgot-password  /reset-password  /privacy  /terms
Protected: /stashes

Every page except the shell renders a real empty state saying what will go there.
Phase 1 is bones, not features. "/" is a placeholder. Do not design a landing page on it.

5. ENTITIES

Create the entity schemas below. For every entity that holds user or personal data, set
the access rules so a record is readable only by the person who created it, unless it is
explicitly meant to be public. Never expose author_email or created_by in any public read
rule. When you are done, list the rules you applied per entity and call out anything that
is still readable by everyone, so I can decide on purpose.

Stash
  name       string, required
  colors     array of objects, each { hex: string, label: string }
  source     enum: manual, extract, generate, glaze, extension. Default manual.
  is_public  boolean, default false
  notes      string
  Access: the creator reads, updates and deletes their own. Any signed in user creates
  their own. Others read a record only when is_public is true, and even then it must not
  expose the creator's email or id.

Feedback
  message  string, required
  page     string
  mood     enum: love, confused, bug, idea
  Access: any signed in user creates. A user reads only their own. Admins read all.
  Nobody else reads anything.

ExtensionPick
  hex         string, required
  source_url  string
  stash_id    string
  Access: owner only, on all four operations. Never public.

Do not create a User entity. It is built in. Do not insert User records.
Do not declare id, created_date, updated_date or created_by_id on any entity. They are
automatic and declaring them breaks things.

6. ANALYTICS, ON FROM DAY ONE

Wire base44.analytics.track and fire a page_view event on every route change. No personal
data in the properties. This is not optional and it does not go last. The current app has
zero instrumentation and I am not repeating that mistake.

DO NOT
- Do not build the landing page. I am building it.
- Do not build a loading screen, splash, or skeleton. I am building it.
- Do not build any tool page: palette generator, contrast checker, image extract,
  gradients, collage, library, glaze, variations, harmony. They come later as commits.
- Do not install any npm package. Use only what is already available.
- Do not create, recreate, or restyle the pre-built auth pages (Login, Register,
  ForgotPassword, ResetPassword). Leave them exactly as they are.
- Do not write seed data, fake stashes, or placeholder content with invented names.
- Do not use emojis anywhere, including code comments.
- Do not use em dashes in any user facing copy.
- Do not put hardcoded colour values in JSX. Everything goes through the tokens.
- Do not add extra pages, sections, animations or features I did not ask for.

WHEN YOU ARE DONE
Print a checklist of exactly what I have to do myself, in order: what to connect, what to
publish, what to set, and where. Then stop. I am connecting GitHub next and taking over
from there.
```

---

## Why each part is there

| Section | Why |
|---|---|
| Tokens before components | The fingerprint-pass lesson. The Advocate's Table shipped ~130 inline `style={{ backgroundColor: 'var(--x)' }}` because the vars were never registered in tailwind.config. Doing it first makes every later pass a one-line change. |
| Kill Cormorant/Playfair/Inter/Caveat | That trio is what Base44 ships by default and it is the loudest tell that a build is untouched. Playfair is a hard no on your taste page regardless. |
| Scaffold residue | Base44 favicon, `name: "untitled"`, and the shadcn `.dark` purple/pink chart tokens all ship by default. They are the price tag left on. |
| One motion curve | Default `easeOut` + `delay: i * 0.08` reads generated. Pacing is the cheapest strong signal of human craft. |
| RLS wording | Lifted from your `base44-rls-first` prompt. It forces the access rules in the same pass as the schema and demands a report of what is still open, so nothing ships wide open by accident. |
| Analytics in phase 1 | The competitive brief's top finding. There is currently zero instrumentation across 20 tool pages. Note: `PrivacyPage` currently promises no tracking, so that copy changes when this lands. |
| The Do-NOT list | Base44 builds everything at once given the chance. The landing page and loader are craft surfaces and belong in git, not in a chat builder. |
| Manual checklist + hard stop | The real trick from your phase-gated prompt. Making it print what you must do by hand stops it guessing at your env wiring. |
