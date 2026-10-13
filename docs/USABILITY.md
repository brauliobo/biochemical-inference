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
| E3 | Entities reachable from Home | 100 percent in 3 or fewer interactions | Automated: breadth-first search over the rendered link graph from `#/` (to be added with the entity views) |
| E4 | Link integrity | 0 broken internal links, every page has at least one outgoing content link | Automated link-graph test (with E3) |
| E5 | Deep links | A URL copied from the address bar reopens the same page after reload, at the Pages sub-path | `tests/e2e/shell.spec.js`; static build checked by hand |
| E6 | Unknown routes | A 404 page with a way out, never a blank screen | `tests/component/shell.test.js`, `shell.spec.js` |

An interaction is one activation of a link or control (click, tap, or Enter).

### Efficiency

| ID | Measure | Target | How measured |
|---|---|---|---|
| F1 | Interactions to reach an entity from Home | 3 or fewer; 1 per relationship hop | E3 |
| F2 | Median time on task | T2 under 30 s; T1 under 60 s | Moderated test |
| F3 | Largest Contentful Paint / Interaction to Next Paint / Cumulative Layout Shift | 2.5 s / 200 ms / 0.1 or better, mid-range mobile, throttled 4G | Lighthouse or WebPageTest per release |
| F4 | Initial JavaScript, home route | 100 kB gzip or less (about 67 kB today); workbench code never loads on knowledge pages | `npm run build:static` output |
| F5 | Keyboard cost | Skip link first; primary navigation within 5 Tab presses of page load | `shell.spec.js` |

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
| A1 | WCAG 2.2 Level AA on every route | axe in `tests/e2e/shell.spec.js` (0 violations, light and dark, desktop and mobile); manual checks below |
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

Automated, on every change: `npm test` (contrast, tokens, router, shell) and
`npm run test:acceptance:e2e` (`shell.spec.js`, axe, keyboard, targets).

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
