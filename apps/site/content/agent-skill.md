# Agent skill

ghost-record is a skill for coding agents such as Cursor and Claude Code. You type one sentence about a component, and you get back a recorded, checked take and the snippet that embeds it. The agent doesn't ask you anything unless it can't find the component.

## Install

The skill is two files. Put them in the project's skills folder:

```bash
mkdir -p .claude/skills/ghost-record/scripts
curl -fsSL {{origin}}/skills/ghost-record/SKILL.md -o .claude/skills/ghost-record/SKILL.md
curl -fsSL {{origin}}/skills/ghost-record/scripts/ghost-record.mjs -o .claude/skills/ghost-record/scripts/ghost-record.mjs
npm i -D playwright && npx playwright install chromium
```

For Cursor, use `.cursor/skills/ghost-record` instead. Once the repository is public, `npx skills add psychedelichip/ghost-cursor` installs the same folder.

It works in Next.js projects that use `@psychedelichip/ghost-cursor`. In other setups, pass `--url` to a page that already renders the component inside a `<GhostReplay>`.

## Use it

```
/ghost-record filter list: type "to", then pick Tooltip
```

The agent finds `FilterList`, reads it, turns the sentence into four steps, and runs the script once:

```bash
node .claude/skills/ghost-record/scripts/ghost-record.mjs \
  --component components/demos/filter-list.tsx#FilterList \
  'click @filter-input' 'type "to"' 'hover @option-toast' 'click @option-tooltip'
```

## What the script does

1. Looks for a page where the component sits directly inside a `<GhostCursor>` or `<GhostReplay>`. If there isn't one, it mounts the component alone on a temporary `/ghost-stage` route.
2. Uses the dev server that's already running for the app, or starts one.
3. Records the steps through the dev-only recorder with real mouse and keyboard input. Paths curve and ease, long moves overshoot slightly, and typing runs at 65 to 160ms per key.
4. Replays the take with Preview and compares the component's final DOM with the live run. Text that changes on its own is left out. If they differ, it records again, slower, up to three times.
5. Saves `<component>.take.json` next to the component and prints the snippet. It never overwrites a take that a page already imports.
6. Deletes the temporary route and stops the dev server, if it started one.

## Defaults

| Setting | Default |
| --- | --- |
| Box height | 320px on the temporary route, otherwise the embed's height |
| Props | none; pass `--props '{"label":"Save"}'` when the component needs them |
| Output | `<component>.take.json` next to the component |
| Tries | 3, at full speed, then 85%, then 75% |
| Server | the one in `.next/dev/lock`, then ports 3000 to 3003, then a new one |
