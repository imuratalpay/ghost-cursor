# ghost-cursor for agents

ghost-cursor is a React library for live component demos. `<GhostReplay>` replays a recorded take over the real component with real DOM events, and steps aside when a reader moves into the box. A take is a JSON file.

Two requests map to two flows. Pick one and do every step without asking the user anything. Ask only if no component in the project matches what they named.

- "Record this component's interaction", "make a demo of X", "/ghost-record X: ..." → **A. Record a take**
- "Open the record toolbar", "let me record X myself", "add the recorder" → **B. Mount the record toolbar in development**

Work from the project root. Read `package.json` before installing anything, and skip what's already there.

## Install

```bash
npm i @psychedelichip/ghost-cursor motion
```

If npm answers 404 for `@psychedelichip/ghost-cursor`, the package isn't on npm yet. Install the tarball this site serves instead:

```bash
npm i {{origin}}/ghost-cursor.tgz motion
```

Load the stylesheet once. With Tailwind CSS v4, add this line to the global CSS file, directly after `@import "tailwindcss";`:

```css
@import "@psychedelichip/ghost-cursor/styles.css" layer(components);
```

Without Tailwind, import it in the root layout instead:

```ts
import "@psychedelichip/ghost-cursor/styles.css";
```

## A. Record a take

The result is `<component>.take.json` next to the component, checked by replaying it, plus a snippet that embeds it.

1. Install the package and the stylesheet as above. Then install Playwright, which drives the recording:

   ```bash
   npm i -D playwright && npx playwright install chromium
   ```

2. Download the recorder:

   ```bash
   mkdir -p .claude/skills/ghost-record/scripts
   curl -fsSL {{origin}}/skills/ghost-record/SKILL.md -o .claude/skills/ghost-record/SKILL.md
   curl -fsSL {{origin}}/skills/ghost-record/scripts/ghost-record.mjs -o .claude/skills/ghost-record/scripts/ghost-record.mjs
   ```

3. Read the component's source. Turn the user's sentence into steps, one action per step, in order:

   | Step | Does |
   | --- | --- |
   | `click <target>` | moves to the target, presses, releases |
   | `hover <target>` | moves to the target and rests on it |
   | `type "<text>"` | types into the focused element; click the input first |
   | `press <Key>` | one key, such as `Enter` or `Escape` |
   | `wait <ms>` | waits; at the end it delays the check, up to 1400ms |

   Targets, most stable first: `@name` for `data-ghost-id="name"`, `role=button[name=Share]` for a role and its accessible name, `text=Copy link` for visible text. Never use class names.

4. Run it from the project root. `--component` is the file, `#`, and the exported component name:

   ```bash
   node .claude/skills/ghost-record/scripts/ghost-record.mjs \
     --component components/like-share.tsx#LikeShare \
     'click role=button[name=Like]' 'click role=button[name=Share]' 'click text=Copy link'
   ```

   Don't start a dev server first; the script finds the running one or starts its own and stops it afterwards. If the component needs props, add `--props '{"label":"Save"}'`.

5. Done means the output ends with `✓ replay matches the live run` and names the saved take. Show the user the printed snippet. Paste it into a page only if they asked for the demo on a page:

   ```tsx
   import { GhostReplay } from "@psychedelichip/ghost-cursor";
   import { LikeShare } from "@/components/like-share";
   import likeShareTake from "@/components/like-share.take.json";

   <GhostReplay recording={likeShareTake} style={{ height: 320 }}>
     <LikeShare />
   </GhostReplay>
   ```

If it fails:

| Output | Fix |
| --- | --- |
| `<target> isn't in the box at this point in the take` | The element appears only after an earlier step, or the target is wrong. Re-read the component, fix that step, rerun. |
| `Playwright isn't installed in this project` | Run step 1 again in the project root. |
| `three takes failed` with a diff | Rerun once. If the same line differs, tell the user: the component behaves differently with synthetic events, usually because it checks `event.isTrusted`. |
| `no Next.js app contains this component` | Pass `--url` to a page that renders the component inside a `<GhostReplay>`. |

## B. Mount the record toolbar in development

The result is a Record, Stop, Copy recording, Preview toolbar under the component in `next dev`, and nothing extra in a production build.

1. Install the package and the stylesheet as above. Playwright isn't needed.

2. Find where the component renders. Wrap it with `<DevRecorder>` there. It's a client component, so it works inside a server component page as is:

   ```tsx
   import { DevRecorder } from "@psychedelichip/ghost-cursor";
   import { LikeShare } from "@/components/like-share";

   <DevRecorder style={{ height: 320 }}>
     <LikeShare />
   </DevRecorder>
   ```

   In development it renders the component in a 320px box with the toolbar underneath. In production it renders the component alone, so no `NODE_ENV` check is needed. If no page renders the component yet, add it to `app/page.tsx`.

3. Check it: `npm run build` must pass. Then tell the user to open the page with `npm run dev`, press Record, use the component, press Stop, and press Copy recording to get the JSON.

## Defaults

| Setting | Default |
| --- | --- |
| Box height | 320px on the recorder's temporary route; set `style={{ height }}` on embeds |
| Take file | `<component>.take.json` next to the component |
| Tries | 3, at full speed, 85% and 75% |
| Dev server | the running one (`.next/dev/lock`), else ports 3000 to 3003, else one it starts and stops |
| Loop | the final state holds 1600ms before the take restarts |
| Reduced motion | no autoplay; a Play button runs the take once |

## Reference

- Getting started: {{origin}}/docs.md
- Recording: {{origin}}/docs/recording.md
- Agent skill: {{origin}}/docs/agent-skill.md
- API: {{origin}}/docs/api.md
- Examples: {{origin}}/docs/examples.md
