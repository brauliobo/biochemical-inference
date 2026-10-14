# Usability (ISO 9241-11)

ISO 9241-11 defines usability as the extent to which specified users can achieve
specified goals with **effectiveness**, **efficiency** and **satisfaction** in a
**specified context of use**. This file fixes that context and the measurable
targets for the knowledge site. Targets are release criteria: a change that
breaks one is a bug.

## Context of use

**Users**

| Group | Characteristics | Needs |
|---|---|---|
| Learners (students of biochemistry, nutrition, medicine) | Primary. Some background, short study sessions | Accurate definitions, relationships between entities, sources |
| Interested lay readers | Arrive from search or a shared link, little background, may read English as a second language | Plain language, terms explained on first use, an unmissable "not medical advice" |
| Educators and researchers | Use it as a reference and cite it | Stable deep links, sources and evidence on every claim |
| Contributors | Edit content and views | Conventions in `docs/CONVENTIONS.md`, fast feedback from tests |

Users include people with low vision, colour-vision deficiency, blindness
(screen reader), motor impairment (keyboard, switch, voice), vestibular
sensitivity, and cognitive or reading difficulties.

**Tasks** (the success list used below)

- T1 Learn what an entity is (for example "what is betaine?").
- T2 Find an entity by name or by browsing.
- T3 Follow relationships (enzyme, reaction, pathway, condition, outcome).
- T4 Compare under- and over-methylation.
- T5 Check the evidence or source behind a statement.
- T6 Return to, bookmark or share a specific page.
- T7 Run a workbench model (needs the API; local installation only).
- T8 Understand what the site is not (educational, not medical advice).
- T9 Follow a guided path from Home to its last step, and return to a step from a shared link or from an entity page.

**Equipment**: phone (320 CSS px wide and up), tablet, laptop and desktop; touch,
mouse and keyboard-only input; the current and previous major versions of
Chrome, Firefox, Safari and Edge (the CSS uses `light-dark()`, so Chrome 123,
Firefox 120 and Safari 17.5 or newer); NVDA with Firefox, VoiceOver with
Safari, TalkBack with Chrome; browser zoom to 400 percent; forced-colours and
reduced-motion settings. The published site is static: no server, no login, no
cookies.

**Environment**: short sessions, often interrupted; bright light and dark rooms;
mid-range phones on 4G; a shared link may be the first page seen, so every page
must make sense on its own.

## Targets

### Effectiveness

| ID | Measure | Target | How measured |
|---|---|---|---|
| E1 | Unassisted task success, T1 to T6 | at least 90 percent per task | Moderated test, 5 or more participants per round, including at least 2 assistive-technology users |
| E2 | Participants who, after T8, say the site is educational and not medical advice | at least 95 percent | Same test, one question |
| E3 | Entities reachable from Home | 100 percent in 3 or fewer interactions | Automated: Home links to every kind (`usability-tasks.spec.js`, E3) and each kind's listing links to every entry (`tests/component/kb-link-integrity.test.js`), so every entity is 2 interactions away |
| E4 | Link integrity | 0 broken internal links, every page has at least one outgoing content link | Automated: `tests/component/kb-link-integrity.test.js` renders every entity page and resolves every link to a route and an entity; `tests/unit/kb-links.test.js` does the same on the page models (`KB_STRICT_LINKS=1` also fails on dangling data references) |
| E5 | Deep links | A URL copied from the address bar reopens the same page after reload, at the Pages sub-path | `tests/e2e/shell.spec.js`; static build checked by hand |
| E6 | Unknown routes | A 404 page with a way out, never a blank screen | `tests/component/shell.test.js`, `shell.spec.js` |

An interaction is one activation of a link or control (click, tap, or Enter).

### Efficiency

| ID | Measure | Target | How measured |
|---|---|---|---|
| F1 | Interactions to reach an entity from Home | 3 or fewer; 1 per relationship hop | E3 |
| F2 | Median time on task | T2 under 30 s; T1 under 60 s | Moderated test |
| F3 | Largest Contentful Paint / Interaction to Next Paint / Cumulative Layout Shift | 2.5 s / 200 ms / 0.1 or better, mid-range mobile, throttled 4G | Lighthouse or WebPageTest per release |
| F4 | Initial JavaScript, home route | 100 kB gzip or less before the first heading renders (the knowledge data, about 182 kB gzip, loads lazily after first paint, see `src/kb/knowledge-lazy.js`); workbench code never loads on knowledge pages | `npm run build:static` output, network log (see Results) |
| F5 | Keyboard cost | Skip link first; primary navigation within 5 Tab presses of page load (the navigation has six links: Home, Dashboards, Atlas, Evidence, Knowledge base, Workbenches) | `shell.spec.js` |

### Satisfaction

| ID | Measure | Target |
|---|---|---|
| S1 | System Usability Scale | 80 or higher (n of 8 or more) |
| S2 | Single Ease Question per task | 5.5 of 7 or higher |
| S3 | "I understand where this information comes from" | 4 of 5 or higher |
| S4 | "I am confident I understood the topic" after T1 | 4 of 5 or higher |

### Accessibility, readability and safety

| ID | Requirement | Enforced by |
|---|---|---|
| A1 | WCAG 2.2 Level AA on every route, including all workbenches in their working states | axe in `tests/e2e/shell.spec.js` over every route, the 15 registered workbenches included (0 violations, light and dark, desktop and mobile; there each workbench shows its API-required notice); axe in jsdom over every route as a page (`tests/component/route-accessibility.test.js`) and over each workbench with mocked API data in a populated state (`expectAccessible()` from `tests/helpers/axe.js`, one test per `tests/component/*workbench*.test.js`); `tests/e2e/populated-states.spec.js` replays those same populated states in the browser with the built stylesheet (colour contrast, target size, no horizontal overflow; light and dark, desktop and mobile); manual checks below |
| A2 | Text contrast 4.5:1, non-text 3:1, both colour schemes | `tests/unit/design-contrast.test.js` |
| A3 | Everything operable from the keyboard, no traps, focus always visible | `shell.spec.js`, `base.css` `:focus-visible` |
| A4 | Touch targets at least 44 px (WCAG 2.2 requires 24 px at AA) | `--target-min`, checked in `shell.spec.js` |
| A5 | No horizontal scroll at 320 CSS px; works at 400 percent zoom | rem units, `.grid`/`.sidebar` reflow; manual |
| A6 | `prefers-reduced-motion` honoured; no information conveyed by colour alone | `base.css`, motion tokens; nav "current" also changes weight and underline |
| A7 | One `h1` per page, headings in order, document title set per route, route changes announced and focus moved to `main` | `src/App.vue`, `shell.test.js` |
| R1 | Body text at least 16 px; line length at most 68 characters | `--text-body`, `--measure` |
| R2 | Prose reading level: Flesch-Kincaid grade 10 or lower; the summary at the top of each page grade 8 or lower; every technical term defined or linked at first use; abbreviations expanded at first use | Content review; automated readability check with the entity data |
| R3 | Every claim sourced, or labelled as illustrative; disclaimer on every page | `shell.test.js` (footer); content review |

## Baked into the shell

| Requirement | Where |
|---|---|
| Landmarks: banner, `nav` "Primary", `main`, contentinfo | `src/App.vue` |
| Skip link (works without changing the route) | `src/App.vue`, `.skip-link` in `components.css`; router ignores `#main` |
| Visible focus on every control | `base.css` |
| Page title and live announcement on navigation, focus moved to `main` | `src/App.vue` |
| 44 px targets, nav, buttons, inputs, `summary` | `--target-min` in `base.css`, `components.css` |
| Reduced motion | `base.css`, `--motion-*` tokens |
| Contrast and dark mode | semantic tokens, verified by test |
| Reflow without breakpoints | `.grid`, `.sidebar`, `.cluster` |
| `lang`, viewport, `color-scheme`, `noscript` message | `index.html` |
| Not-medical-advice footer on every page | `src/App.vue` |
| Works with no server and under a sub-path | hash router, `docs/CONVENTIONS.md` |

## Verification

Automated, on every change: `npm test` (contrast, tokens, router, shell, knowledge
views, link integrity, and the jsdom axe audit of every route and of each workbench in
a populated state; jsdom has no layout, so colour contrast is covered by the token
test and the browser scan) and `npm run test:acceptance:e2e` (`shell.spec.js`, axe,
keyboard, targets). The same browser specs run against the static build, with no API, through
`npm run build:static && npm run test:e2e:static` (`shell.spec.js`,
`usability-tasks.spec.js` and `populated-states.spec.js`, desktop and mobile projects).
The last one first runs the component tests with `A11Y_SNAPSHOT_DIR` set, about a minute,
to capture the populated states it replays.

Manual, each release, on the home page, one entity page and one workbench page:

1. Keyboard only: reach and operate every control; check no trap and a visible focus.
2. Screen reader: NVDA with Firefox and VoiceOver with Safari; landmarks, headings,
   link names, route-change announcement; complete T1 to T3.
3. Zoom 200 and 400 percent, 320 px width, text-spacing override, forced colours.
4. `prefers-reduced-motion: reduce` and `prefers-color-scheme: dark`.
5. Performance (F3, F4) on a throttled mid-range mobile profile.

Moderated usability round, before each major content release: 5 to 8 participants
across the user groups, T1 to T6 with think-aloud, record success, time, errors,
SEQ per task, SUS at the end; fix every task that misses E1 before release.

## Results

Automated task measures, static build, Chromium desktop (1280 x 720) and the mobile
project (360 x 740), 2026-10-13, 58 browser tests passing. An interaction is one
click, tap or Enter. Source: `tests/e2e/usability-tasks.spec.js` (prints a `MEASURE` line
per measure) and `tests/e2e/shell.spec.js`.

| Measure | Target | Result |
|---|---|---|
| T1 learn what betaine is, from Home | 3 or fewer | 1 interaction (Start here link); page shows plain summary and the evidence grade explained in words |
| T2 reach GNMT by search | 3 or fewer | 2 interactions (focus the box, choose the result); 1 interaction with the keyboard (type, Enter) |
| T2 reach GNMT by browsing | 3 or fewer | 2 interactions (Enzymes, then GNMT) |
| T2 filter the enzyme list by "methyltransferase" | n/a | 11 matches of 58 |
| T3 enzyme to the reaction it catalyses, then to a compound | 3 or fewer | 2 interactions |
| T3 "what links glycine to belching": guided link on Home | 3 or fewer | 1 interaction, a 2-step chain with a named relationship on every step |
| T3 same question, choosing the target on the Glycine page | 4 (open, focus, choose + page) | 4 interactions |
| T4 under- to over-methylation, with the relationship between them | 4 | 4 interactions |
| T5 evidence behind a statement | 3 or fewer | 2 interactions (claims audit, a claim with status and both evidence sections) |
| E3 every kind from Home | 1 interaction | 11 of 11 kinds, each first entry 2 interactions |
| E4 link integrity, all entity pages rendered | 0 broken links | 0 broken, 0 unnamed links on 411 pages; every page links onward |
| T6 deep link (`?to=`) reopened in a fresh browser | same page and result | passes |
| T9 follow the glycine-belching guided path from Home to its last step, keyboard only (no pointer) | operable | passes: 10 Tab presses from page load to the path link on Home, Enter, then 3 Tab presses and Enter per step (Read the page, Previous, Next) for 10 steps; 42 Tab presses in all for the 11 steps. Focus lands on the step heading after each step, the URL carries `?step=N`, the progress bar reads "Step N of 11", and the last step has no Next link |
| T9 a step link (`?step=5`) reopened in a fresh browser; the entity page's "Part of guided paths" link back to its step | same step | passes (a link from the GNMT page opens step 5 of the glycine-belching path) |
| E5 sub-path build (`VITE_BASE=/biochemical-inference/ npm run build:static`, `vite preview --base /biochemical-inference/`), 2026-10-13: Home, `#/kb/state/undermethylation` (also after reload), Glycine, a reaction, the path list, a path step, the map, a workbench notice page, search to GNMT and a Home-to-path click-through, light and 360 px mobile (dark for three pages) | 0 console errors or warnings, 0 failed or 4xx requests | 0 of each |
| T8 "not medical advice" notice fully inside the first screen | visible without scrolling | passes at 1280 x 720 (bottom edge 352 px) and 360 x 740 (591 px of 740) |
| Keyboard only: Tab presses to the search box on Home | n/a | 8 |
| Keyboard only: search, Down/Up/Escape through results, Enter | operable | passes |
| Keyboard only: Tab to a reaction link on an entity page, then the "connected to" control | operable | 20 Tab presses to the first reaction or enzyme link; control opens and chooses with Enter |
| F5 Tab presses to the primary navigation (Home, entity page) | 5 or fewer | 3 and 3 |
| Focus indicator on every Tab stop (Home, claims, reaction) | always visible | 0 stops without an outline |
| A1 axe WCAG 2.2 AA, 39 routes (knowledge site including the guided-path list, first, middle and last step and an unknown path; workbench index, all 15 workbenches, unknown routes), light and dark, desktop and mobile | 0 violations | 0 (also with search results, every disclosure open and a filtered listing) |
| A1 axe WCAG 2.2 AA + best practices in jsdom, 28 routes as pages (guided-path list, a step and an unknown path included; steps 1, 5 and 11 of a path audited again in `tests/component/kb-paths.test.js`) and 16 workbench states with mocked API data | 0 violations | 0 (the audit is checked to find unlabelled controls, unnamed buttons, bad lists and missing alternatives, `tests/component/axe-helper.test.js`) |
| A1 the same 16 populated workbench states in Chromium with the built CSS (contrast, target size, reflow), light and dark, desktop and 360 px | 0 violations, no horizontal overflow | 0 violations. It found one defect, fixed: a long digest in the single-page workbench's "Controlled run" grid widened the page by 303 px at 360 px (`.grid > *` now has `min-inline-size: 0` and wraps long identifiers) |
| A4 buttons, fields, disclosure summaries in `main` on 5 key pages (a guided-path step included: Previous / Next and Read the page are buttons-as-links at 44 px) | 44 px or more | 0 under 44 px |
| A5 horizontal overflow at 320 px, 10 key routes (the guided-path list and a step included) | none | 0 routes overflow |
| F4 JavaScript before the first heading, Home | 100 kB gzip or less | 53.1 kB with the dashboard home (map hero, question cards and counters load after the first paint; `tests/e2e/dashboards.spec.js` measures it and asserts that the home page never fetches the simulator or the literature tables); before that redesign 47.4 kB (index 33.0 kB; the guided-path cards add the 7.9 kB gzip paths data); the knowledge data chunk follows lazily |

Not measured here (needs people or devices): E1, E2, F2, F3, S1 to S4, screen readers,
zoom to 400 percent, forced colours. They stay on the manual list above.

Findings from running the guided-path measures: a path step changes only `?step=`, so the shell does not move focus (it reacts to path changes) and a keyboard user would stay on a link that has just changed meaning; the step view therefore focuses its own step heading after each move, and the page title (announced by the shell) names the step. From `<main>` the first Next link is 5 Tab presses away (three breadcrumb links, Read the page, Next); from the heading it is 3. The cards load the small paths data, not the entity data, so the cards render at first paint.

Findings from running these measures that changed the design: the first build put the
knowledge data in the home route's initial JavaScript (255 kB, over F4), so the home page
and its search box now load it lazily; the "not medical advice" notice was below the first
screen on a phone (923 px), so it now sits directly under the page heading; long relation
lists made entity pages very long on a phone (Glycine was about 16,000 px tall on a phone, now about 11,600 px), so groups
show 8 items and fold the rest behind "Show N more".

## Definition of done for a new view

- One `h1`; headings nest without skipping levels; the title is set
  (`setPageTitle`) once the entity is known.
- Reachable in 3 or fewer interactions from Home; no dead end (links onward).
- Navigation is a real link (`RouterLink`), never a button or click handler.
- A plain-language summary first, terms defined or linked on first use.
- Sources visible for every claim; illustrative content labelled.
- Tables have captions and header cells; images have `alt` text or are
  decorative (`alt=""`); charts have a text alternative or table.
- Only layout primitives, component classes and semantic tokens; the new route is
  added to `ROUTES` in `tests/e2e/shell.spec.js`.
