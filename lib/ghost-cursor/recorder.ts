import type { GhostEvent, Recording } from "./recording";

const MOVE_INTERVAL = 24;
const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock"]);

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function cssPath(el: Element, root: Element) {
  const parts: string[] = [];
  for (let n: Element | null = el; n && n !== root; n = n.parentElement) {
    const index = n.parentElement ? Array.prototype.indexOf.call(n.parentElement.children, n) + 1 : 1;
    parts.unshift(`${n.tagName.toLowerCase()}:nth-child(${index})`);
  }
  return `:scope > ${parts.join(" > ")}`;
}

export interface Take {
  stop(): Recording;
}

/**
 * Capture trusted input inside `stage`. Time starts at the first event,
 * so the pause between pressing Record and reaching the box is dropped.
 */
export function startRecording(
  stage: HTMLElement,
  content: HTMLElement,
  onEvent: (count: number) => void,
): Take {
  const size: [number, number] = [Math.round(stage.clientWidth), Math.round(stage.clientHeight)];
  const targets: string[] = [];
  const events: GhostEvent[] = [];
  let t0 = -1;
  let lastMove = -Infinity;
  let awaitingClick = false;

  const time = (e: Event) => {
    if (t0 < 0) t0 = e.timeStamp;
    return Math.round(e.timeStamp - t0);
  };

  const point = (e: MouseEvent): [number, number] => {
    const r = stage.getBoundingClientRect();
    return [r3(clamp01((e.clientX - r.left) / r.width)), r3(clamp01((e.clientY - r.top) / r.height))];
  };

  const target = (node: EventTarget | null): [el: Element, index: number] | null => {
    if (!(node instanceof Element) || !content.contains(node) || node === content) return null;
    const tagged = node.closest("[data-ghost-id]");
    const el = tagged && content.contains(tagged) ? tagged : node;
    const key = el === tagged ? `@${tagged.getAttribute("data-ghost-id")}` : cssPath(node, content);
    let index = targets.indexOf(key);
    if (index < 0) index = targets.push(key) - 1;
    return [el, index];
  };

  const push = (e: GhostEvent) => {
    events.push(e);
    onEvent(events.length);
  };

  const onMove = (e: PointerEvent) => {
    if (!e.isTrusted) return;
    const t = time(e);
    if (t - lastMove < MOVE_INTERVAL) return;
    lastMove = t;
    push([t, "m", ...point(e)]);
  };

  const onPress = (type: "d" | "u" | "c") => (e: MouseEvent) => {
    if (!e.isTrusted) return;
    if (type !== "c") awaitingClick = type === "u";
    if (type === "c") {
      // One click per press: label forwarding and keyboard activation also fire
      // click events, and replay reproduces those on its own.
      if (!awaitingClick) return;
      awaitingClick = false;
    }
    const t = time(e);
    const [x, y] = point(e);
    const hit = target(e.target);
    if (!hit) return push([t, type, x, y]);
    const r = hit[0].getBoundingClientRect();
    const ox = r3(clamp01((e.clientX - r.left) / (r.width || 1)));
    const oy = r3(clamp01((e.clientY - r.top) / (r.height || 1)));
    push([t, type, x, y, hit[1], ox, oy]);
  };

  const onKey = (e: KeyboardEvent) => {
    if (!e.isTrusted || MODIFIER_KEYS.has(e.key)) return;
    const t = time(e);
    const hit = target(e.target);
    const mods = (e.shiftKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.altKey ? 4 : 0) | (e.metaKey ? 8 : 0);
    if (mods) push([t, "k", e.key, hit?.[1] ?? -1, mods]);
    else if (hit) push([t, "k", e.key, hit[1]]);
    else push([t, "k", e.key]);
  };

  const onDown = onPress("d");
  const onUp = onPress("u");
  const onClick = onPress("c");
  stage.addEventListener("pointermove", onMove, true);
  stage.addEventListener("pointerdown", onDown, true);
  stage.addEventListener("pointerup", onUp, true);
  stage.addEventListener("click", onClick, true);
  stage.addEventListener("keydown", onKey, true);

  let inside = stage.matches(":hover");
  const onEnter = (e: PointerEvent) => {
    if (e.target === stage) inside = true;
  };
  const onLeave = (e: PointerEvent) => {
    if (e.target === stage) inside = false;
  };
  stage.addEventListener("pointerenter", onEnter, true);
  stage.addEventListener("pointerleave", onLeave, true);

  return {
    stop() {
      stage.removeEventListener("pointermove", onMove, true);
      stage.removeEventListener("pointerdown", onDown, true);
      stage.removeEventListener("pointerup", onUp, true);
      stage.removeEventListener("click", onClick, true);
      stage.removeEventListener("keydown", onKey, true);
      stage.removeEventListener("pointerenter", onEnter, true);
      stage.removeEventListener("pointerleave", onLeave, true);
      // The sweep out of the box toward the Stop button isn't part of the take:
      // drop trailing moves after the last action or the last pause.
      if (!inside) {
        let keep = events.length - 1;
        while (keep > 0 && events[keep][1] === "m" && events[keep][0] - events[keep - 1][0] < 250) keep--;
        // Stopped on a move means a pause came before it: that move starts the sweep.
        if (events[keep]?.[1] === "m" && keep > 0) keep--;
        events.length = keep + 1;
      }
      return { v: 1, size, targets, events };
    },
  };
}
