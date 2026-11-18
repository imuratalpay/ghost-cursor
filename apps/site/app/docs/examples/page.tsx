import type { Metadata } from "next";
import { GhostCursor } from "@psychedelichip/ghost-cursor";
import { FilterList } from "@/components/demos/filter-list";
import { RecorderDemo } from "@/components/demos/recorder-demo";
import { SortMenu } from "@/components/demos/sort-menu";
import { ViewSettings } from "@/components/demos/view-settings";
import { C, Figure, H1, H2, Kbd, Lead, P } from "@/components/prose";
import filterList from "@/recordings/filter-list.json";
import recorderPreview from "@/recordings/recorder-preview.json";
import sortMenu from "@/recordings/sort-menu.json";
import viewSettings from "@/recordings/view-settings.json";

export const metadata: Metadata = { title: "Examples · ghost-cursor" };

export default function Examples() {
  return (
    <>
      <H1>Examples</H1>
      <Lead>
        Each demo below is the real component. Move into a box to use it yourself, or press <Kbd>0.5×</Kbd> to slow the
        take down.
      </Lead>

      <H2 id="menu">Dropdown menu</H2>
      <P>
        The highlight comes from the menu’s own <C>pointermove</C> handler and the reorder from its click handler. The
        menu has no replay code; it only has <C>data-ghost-id</C> on the trigger and the items.
      </P>
      <Figure caption="Recorded by hand. The take ends on “A to Z”, so the menu cross-fades back to “Newest” before each loop.">
        <GhostCursor recording={sortMenu} className="h-[300px]">
          <SortMenu />
        </GhostCursor>
      </Figure>

      <H2 id="segmented">Segmented control and switch</H2>
      <P>
        The pill and the tiles move on springs, so at <Kbd>0.5×</Kbd> you can watch the pill catch up. Arrow keys move
        the selection without animation, because keyboard changes should feel instant.
      </P>
      <Figure caption="The take returns to List with Compact off, so the loop restarts without a cross-fade.">
        <GhostCursor recording={viewSettings} className="h-[320px]">
          <ViewSettings />
        </GhostCursor>
      </Figure>

      <H2 id="typing">Typing</H2>
      <P>
        Key presses replay as <C>keydown</C> and <C>keyup</C>, and printable keys also insert text through an{" "}
        <C>input</C> event, which is what React’s <C>onChange</C> listens for. The filter list itself has no animation;
        it updates on every key.
      </P>
      <Figure caption="Recorded by the agent script from four steps.">
        <GhostCursor recording={filterList} className="h-[300px]">
          <FilterList />
        </GhostCursor>
      </Figure>

      <H2 id="recorder">The recorder, replaying itself</H2>
      <P>
        A <C>{"<Recorder>"}</C> with <C>captureSynthetic</C> inside a <C>{"<GhostCursor>"}</C>. The outer ghost records a
        take with the inner recorder, then presses Preview, and a second ghost replays it.
      </P>
      <Figure caption="Two ghosts, one inside the other. Each steps aside when you move into its box.">
        <GhostCursor recording={recorderPreview} className="h-[280px]">
          <RecorderDemo />
        </GhostCursor>
      </Figure>
    </>
  );
}
