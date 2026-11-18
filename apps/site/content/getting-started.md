# Getting started

ghost-cursor plays back a recording of someone using your component, in the page, with real DOM events. The component doesn't know it's being replayed. When a reader moves into the box, the ghost fades out and the component is theirs.

Agents: {{origin}}/docs/agents.md has the exact steps for recording a take and for mounting the record toolbar.

## 1. Install the package

npm installs Motion alongside it as a peer dependency. Motion drives the cursor's spring. You need React 18 or later.

```bash
npm i @psychedelichip/ghost-cursor
```

Until the package is on npm, install the tarball this site serves: `npm i {{origin}}/ghost-cursor.tgz motion`.

Load the stylesheet once. With Tailwind CSS v4, import it into the components layer, so classes you pass to the box override its defaults:

```css
/* app/globals.css */
@import "tailwindcss";
@import "@psychedelichip/ghost-cursor/styles.css" layer(components);
```

Without Tailwind, import `@psychedelichip/ghost-cursor/styles.css` in your root layout.

## 2. Wrap a component

Put the component inside `<GhostReplay>` (also exported as `<GhostCursor>`) and give the box a height. Add `data-ghost-id` to every element the cursor clicks. The recording finds elements by that name, so it keeps working when the markup around them changes.

```tsx
import { GhostReplay } from "@psychedelichip/ghost-cursor";
import recording from "./sort-menu.json";

export function Demo() {
  return (
    <GhostReplay recording={recording} style={{ height: 300 }}>
      <SortMenu />
    </GhostReplay>
  );
}

// inside SortMenu
<button data-ghost-id="sort-trigger">Sort</button>
```

A script can't switch on `:hover`, so the ghost sets `data-ghost-hover` on whatever it points at and `data-ghost-active` while it presses. Style both next to the real states:

```css
.menu-item:hover,
.menu-item[data-ghost-hover] {
  background: #f4f4f4;
}
```

## 3. Record a take

Run your dev server and open the page with `?record` at the end of the URL. Every `<GhostReplay>` on the page becomes a recorder. Press Record, use the component, then press Stop. Copy recording puts the JSON on your clipboard. Paste it into the file you import.

The recorder only exists in development builds. In production, `?record` does nothing.
