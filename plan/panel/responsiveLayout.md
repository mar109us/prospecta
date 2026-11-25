# Responsive UI layout

## Context

People have to zoom the browser out to see the whole UI. The cause: every size in
[style.css](style.css) is fixed px, there are no `@media` queries, and the two left
panels are positioned separately at the same `left: 16px`. On a short laptop screen the
resource panel reaches the bottom and the terrain panel is drawn on top of it, so the
last rows and the clear button cannot be reached, even by scrolling.

Decisions taken:

1. Fix the layout and compact it on short screens (no scale-everything-with-rem).
2. The results panel stops above the walk button row.
3. Short screens: smaller rows and gaps, the rest scrolls inside the panel.
4. Narrow windows (below 800px): resource panel collapses behind a "layers" button.

## Files

| File | Change |
|---|---|
| [main.html](main.html) | Wrap logo + both left panels in one `<div class="sidebar">`; add the "layers" button; give the resource panel an id |
| [style.css](style.css) | Sidebar flex column, results max-height, two media queries |
| `view/panelToggle.js` (new) | Open/close the resource panel on click |
| [main.js](main.js) | One import + one call to connect the toggle |
| `tests/panelToggleTests.js` (new) + [tests/tests.html](tests/tests.html) | Tests for the toggle |

No dependency is added. No JS reads the `.panel` / `.logo` position today, so moving
them is safe (checked with grep).

## Step 1 – Left side becomes one flex column

main.html:

```html
<div class="sidebar">
  <header class="logo">…</header>
  <button type="button" id="panel-toggle" class="panel-toggle"
          aria-expanded="false" aria-controls="resource-panel">layers</button>
  <aside id="resource-panel" class="panel panel--resources">…</aside>
  <aside class="panel panel--terrain">…</aside>
</div>
```

style.css:

- `.sidebar`: `position: absolute; z-index: 2; top: 16px; bottom: 16px; left: 16px;`
  `display: flex; flex-direction: column; align-items: flex-start; gap: 8px;`
  `pointer-events: none;` (so the Moon can still be dragged through the empty part)
- `.logo`, `.panel`, `.panel-toggle`: `pointer-events: auto;`
- `.logo`: remove `position`, `z-index`, `top`, `left`; add `flex-shrink: 0`.
- `.panel`: remove `position`, `z-index`, `top`, `left`, `max-height`. It keeps
  `overflow-y: auto`, so the flex column shrinks it and it scrolls inside.
- `.panel--terrain`: remove `top`/`bottom`; add `flex-shrink: 0; margin-top: auto;`
  `max-width: calc(100vw - 32px);`
- `.panel-toggle`: same look as `.walk-button`, `display: none` on desktop.

Why it works: the column is exactly as tall as the window, the terrain panel takes
the height it needs, and the resource panel gets what is left. They can never overlap.

`.sidebar` is a `<div>` because it is only a layout box with no meaning of its own;
the semantic elements (`<header>`, `<aside>`) stay inside it.

## Step 2 – Results panel stops above the walk button

- `.results`: `max-height: calc(100vh - 32px)` becomes `calc(100vh - 72px)`
  (16px top + 56px kept free at the bottom for the walk button row).

Known leftover: the debug HUD (about 110px tall, above the walk button) can still sit
on top of the last result card. It is a debug tool, so it is left alone.

## Step 3 – Short screens

```css
@media (max-height: 800px) {
  .panel { gap: 16px; }
  .panel__option label { min-height: 32px; }
  .panel__clear { margin-top: 12px; }
}
```

Text size does not change. Resource panel content goes from about 750px to about 570px.

## Step 4 – Narrow windows

```css
@media (max-width: 800px) {
  .sidebar { right: 16px; }
  .logo { width: 180px; }
  .panel-toggle { display: block; }
  .panel--resources { display: none; max-width: 100%; }
  .panel--resources.panel--open { display: flex; }
  .panel--terrain { width: 100%; }
  .panel__row { gap: 8px; }
  .legend { margin-left: 0; }
  .walk-button { top: 16px; bottom: auto; }
  .results { top: 56px; width: min(260px, calc(100vw - 32px)); max-height: calc(100vh - 176px); }
  .debug-hud, .debug-craters { display: none; }
}
```

- The walk button moves to the top-right, because the terrain panel now fills the bottom.
- The debug tools are hidden on narrow windows; they have no free corner left.
- Both breakpoints are `max-` queries (desktop-first). They stay in style.css because
  CSS cannot read `settings.js`.

## Step 5 – Toggle JS

`view/panelToggle.js`, about 20 lines:

- `connectPanelToggle(ids)` takes one object with `buttonId` and `panelId`, finds both
  with `getElementById`, logs a descriptive `console.error` and returns if one is missing.
- On click it calls `togglePanel(button, panel)`, which flips the `panel--open` class,
  sets `aria-expanded` on the button, and logs the new state with `console.log`.

New for me to explain when writing it: `addEventListener` and `classList.toggle`.

main.js: import it and call `connectPanelToggle(...)` next to `buildResourceOptions`.

## Step 6 – Tests

`tests/panelToggleTests.js`, same `check(...)` style as
[tests/resourcePanelTests.js](tests/resourcePanelTests.js):

- "opens the panel on the first click"
- "closes the panel on the second click"
- "sets aria-expanded to match"

## Verification

1. Open main.html through the local server, DevTools device toolbar.
2. 1366×768 and 1280×720: scroll the resource panel to the clear button; the terrain
   panel must not cover it. Turn on a few legends and check again.
3. 1920×1080: looks the same as today.
4. Run a search at 1366×768: the last result card ends above the walk button.
5. 390×844 (phone) and 768×1024 (tablet): layers button opens and closes the panel,
   the three terrain toggles fit the width, the walk button is top-right.
6. Open tests/tests.html and read the console.

The pixel numbers above are estimates from the CSS; step 2 and 5 are where they get
tuned (for example whether three legends fit side by side on a phone).

## After approval

Save this plan as `plan/panel/responsiveLayout.md`.

## Change after testing – zoom-proof sizes

Decision 1 and Step 3 above were replaced. The panels must not change size with
browser zoom or display scaling, so:

- `html { font-size: max(8px, 1.7vh); }` makes 1rem follow the window height
  (16px when the window is about 940px tall, the size the UI was designed at).
- Every px size in style.css became rem (px / 16). Only 1px hairlines, borders,
  outlines and the `@media` breakpoint stay in px.
- The `max-height: 800px` compact media query was removed; it is no longer needed.
- The 8px floor only matters in very small windows (below about 470px tall).
