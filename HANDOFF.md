# Handoff: Training Plan Progression Section

## What was built

A new **04 — Training Plan Progression** section added to both the Run and Tri tabs, sitting below the existing weekly summary. It shows the full 16-week training arc at a glance: weekly mileage as a bar chart, colored by phase, with the current week highlighted and the race date in the heading.

---

## Files changed

| File | What changed |
|------|-------------|
| `index.html` | Added progression section HTML to Run + Tri tabs; added `runPlan` / `triPlan` data objects and `renderProgression()` JS function |
| `styles.css` | Added `--color-sport-*` and `--color-phase-*` custom properties; added all progression section CSS including responsive overrides |
| `tests/progression.test.html` | Browser-runnable test suite (open in browser to run) |

---

## Architecture

### Data (`index.html`, inside `DOMContentLoaded`)

```js
const runPlan = { raceDate, raceName, currentWeek, weeks: [{ week, miles, phase }] }
const triPlan = { raceDate, raceName, currentWeek, weeks: [{ week, swim, bike, run, phase }] }
```

Both plans are 16 weeks. `currentWeek: 14` matches the weekly data displayed in sections 01–03.

### Rendering

```js
renderProgression(plan, tabPrefix, isTri)
// tabPrefix = 'run' or 'tri'
// Looks up: #{tabPrefix}-progression-chart, #{tabPrefix}-progression-phases, #{tabPrefix}-race-date
```

The function:
1. Pre-computes week totals once (avoids redundant swim yd→mi conversion)
2. Builds `.prog-week` bar elements with phase class + current/future modifiers
3. Tri tab: stacked `.prog-bar-stack` with swim/bike/run segments sized by `flex-grow`
4. Builds proportional `.phase-span` labels below the chart using `flex: N` (N = weeks in phase)

### CSS key points

- **Bar height**: `height: calc(var(--prog-pct) * var(--bar-scale))` — scale is responsive:
  - Desktop (180px chart): `1.3px`
  - 900px (140px chart): `0.90px`
  - 600px (120px chart): `0.72px`
- **`padding-top: 6px`** on `.progression-chart` — required because `overflow-x: auto` forces `overflow-y: auto` per CSS spec, which would clip the current-week outline. The padding gives the 4px outline+offset room to render.
- **Sport colors** — defined once as `--color-sport-swim/bike/run` in `:root`, used by `.tri-summary-bar--*`, `.prog-seg--*`, and `.legend-swatch--*`
- **Phase colors** — `--color-phase-base/build/peak/taper` in `:root`

---

## Updating the plan data

To change the race date or mileage, edit the `runPlan` / `triPlan` objects in `index.html` (~line 726). The rendering is fully dynamic — no HTML changes needed.

To change which week is "current", update `currentWeek` in both plan objects.

---

## Tests

Open `tests/progression.test.html` in a browser (via a local server, not `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/tests/progression.test.html
```

Covers: data integrity, DOM rendering (element counts, current/future classes, stacked bar segments, phase flex totals), and layout at 375px. Manual mobile checklist is at the bottom of the test page.

---

## Known decisions

- **Swim yards → equivalent miles**: `Math.round(swim / 1760)`. Used only for bar height and total label — the swim segment's `flex-grow` uses the raw mile equivalent so it visually proportional to bike/run miles.
- **Tri bar height** uses `--prog-total` (combined equivalent miles), not `--prog-pct`, to keep the CSS variable names distinct between the two bar types.
- **Phase label alignment**: `.phase-span` uses `flex: N` where N = number of weeks in that phase — this keeps labels proportionally aligned with the bars above without any JS measurement.
