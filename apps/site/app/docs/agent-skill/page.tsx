import type { Metadata } from "next";
import { GhostReplay } from "@psychedelichip/ghost-cursor";
import { neighbors } from "@/components/docs-pages";
import { FilterList } from "@/components/demos/filter-list";
import filterListTake from "@/components/demos/filter-list.take.json";
import { C, Code, Figure, H1, H2, P, PrevNext, Table } from "@/components/prose";

export const metadata: Metadata = {
  title: "Agent skill",
  alternates: { types: { "text/markdown": "/docs/agent-skill.md" } },
};

const OUTPUT = `
→ FilterList from apps/site/components/demos/filter-list.tsx
  recording where it's embedded: /docs/examples (apps/site/app/docs/examples/page.tsx:54)
  using the dev server already running at http://localhost:3001
  take 1 of 3
✓ take 4 steps · 4.0s · 2 presses · 1.7 KB
✓ replay matches the live run
  saved apps/site/components/demos/filter-list.take.json

apps/site/app/docs/examples/page.tsx:54 already embeds FilterList. Swap its recording for the new take, or paste this where you want another copy:

import { GhostReplay } from "@psychedelichip/ghost-cursor";
import { FilterList } from "@/components/demos/filter-list";
import filterListTake from "@/components/demos/filter-list.take.json";

<GhostReplay recording={filterListTake} style={{ height: 300 }}>
  <FilterList />
</GhostReplay>`;

export default function AgentSkill() {
  return (
    <>
      <H1>Agent skill</H1>
      <P>
        ghost-record is a skill for coding agents such as Cursor and Claude Code. You type one sentence about a
        component, and you get back a recorded, checked take and the snippet that embeds it. The agent doesn’t ask
        you anything unless it can’t find the component.
      </P>

      <H2 id="install">Install</H2>
      <P>
        Copy <C>skills/ghost-record</C> from this repository into your agent’s skills folder, then add the two tools
        its script runs on.
      </P>
      <Code>{`
cp -r skills/ghost-record .cursor/skills/      # Cursor
cp -r skills/ghost-record ~/.claude/skills/    # Claude Code
npm i -D playwright tsx
npx playwright install chromium`}</Code>
      <P>
        It works in Next.js projects that use <C>@psychedelichip/ghost-cursor</C>. In other setups, give it a page
        that already renders the component inside a <C>{"<GhostReplay>"}</C>.
      </P>

      <H2 id="use">Use it</H2>
      <P>Name the component, then say what the cursor should do, in order.</P>
      <Code>{`/ghost-record filter list: type "to", then pick Tooltip`}</Code>
      <P>
        The agent finds <C>FilterList</C>, reads it, and turns the sentence into four steps. Then it runs the
        skill’s script once. This is what that run printed on this site:
      </P>
      <Code title="Output">{OUTPUT}</Code>
      <Figure caption="The take that sentence produced, embedded with the printed snippet.">
        <GhostReplay recording={filterListTake} style={{ height: 300 }}>
          <FilterList />
        </GhostReplay>
      </Figure>

      <H2 id="what-it-does">What the script does</H2>
      <ol className="my-4 list-decimal space-y-2 pl-5 marker:text-fg-3">
        <li>
          Looks for a page where the component sits directly inside a <C>{"<GhostCursor>"}</C> or{" "}
          <C>{"<GhostReplay>"}</C>. If there isn’t one, it mounts the component alone on a temporary{" "}
          <C>/ghost-stage</C> route.
        </li>
        <li>Uses the dev server that’s already running for the app, or starts one.</li>
        <li>
          Records the steps through the dev-only recorder with real mouse and keyboard input. Paths curve and ease,
          long moves overshoot slightly, and typing runs at 65 to 160ms per key.
        </li>
        <li>
          Replays the take with Preview and compares the component’s final DOM with the live run. Text that changes on
          its own, like a clock, is left out. If they differ, it records again, slower, up to three times.
        </li>
        <li>
          Saves <C>&lt;component&gt;.take.json</C> next to the component and prints the snippet. It never overwrites a
          take that a page already imports.
        </li>
        <li>Deletes the temporary route and stops the dev server, if it started one.</li>
      </ol>

      <H2 id="defaults">Defaults</H2>
      <Table
        head={["Setting", "Default"]}
        rows={[
          ["Box height", "320px on the temporary route, otherwise the embed’s height"],
          ["Props", <span key="p">None. The agent passes <C>--props</C> when the component needs them.</span>],
          ["Output", <span key="o"><C>&lt;component&gt;.take.json</C> next to the component</span>],
          ["Tries", "3, at full speed, then 85%, then 75%"],
          ["Server", <span key="s">The one in <C>.next/dev/lock</C>, then ports 3000 to 3003, then a new one</span>],
        ]}
      />
      <P>
        The skill’s <C>SKILL.md</C> lists what each failure means. The most common one is a step that aims at an
        element before an earlier step has opened it.
      </P>

      <PrevNext {...neighbors("/docs/agent-skill")} />
    </>
  );
}
