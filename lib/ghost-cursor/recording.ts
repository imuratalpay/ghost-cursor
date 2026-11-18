/**
 * Recording format (v1). Coordinates are normalized 0–1 to the stage box.
 *
 *   [t, "m", x, y]                      pointer move
 *   [t, "d" | "u" | "c", x, y, ti, ox, oy]  down / up / click; ti indexes `targets`,
 *                                       ox/oy are the 0–1 offset inside the target
 *   [t, "k", key, ti, mods]             key press; mods = shift 1, ctrl 2, alt 4, meta 8
 *
 * A target is "@id" for an element with data-ghost-id="id", or a CSS path
 * relative to the content root (":scope > div:nth-child(1) > button:nth-child(2)").
 */
export type MoveEvent = [t: number, type: "m", x: number, y: number];
export type PressEvent =
  | [t: number, type: "d" | "u" | "c", x: number, y: number]
  | [t: number, type: "d" | "u" | "c", x: number, y: number, target: number, ox: number, oy: number];
export type KeyEvent =
  | [t: number, type: "k", key: string]
  | [t: number, type: "k", key: string, target: number]
  | [t: number, type: "k", key: string, target: number, mods: number];
export type GhostEvent = MoveEvent | PressEvent | KeyEvent;

export interface Recording {
  v: 1;
  size: [width: number, height: number];
  targets: string[];
  events: GhostEvent[];
}

/** What a JSON import infers — validated at runtime by `compile`. */
export type RecordingInput =
  | Recording
  | { v: number; size: number[]; targets: string[]; events: (string | number | null)[][] };

export type PointerAction = {
  kind: "d" | "u" | "c";
  t: number;
  x: number;
  y: number;
  target: string | null;
  ox: number;
  oy: number;
};
export type KeyAction = { kind: "k"; t: number; key: string; target: string | null; mods: number };
export type Action = PointerAction | KeyAction;

export interface Compiled {
  duration: number;
  path: { t: number[]; x: number[]; y: number[] };
  actions: Action[];
  anchors: PointerAction[];
}

export function compile(input: RecordingInput): Compiled {
  if (!input || input.v !== 1 || !Array.isArray(input.events)) {
    throw new Error("ghost-cursor: unsupported recording");
  }
  const targets = input.targets ?? [];
  const path = { t: [] as number[], x: [] as number[], y: [] as number[] };
  const actions: Action[] = [];
  const events = [...(input.events as (string | number | null)[][])].sort(
    (a, b) => Number(a[0]) - Number(b[0]),
  );

  for (const e of events) {
    const t = Number(e[0]);
    const type = e[1];
    if (type === "k") {
      const ti = e[3] == null ? -1 : Number(e[3]);
      actions.push({
        kind: "k",
        t,
        key: String(e[2]),
        target: targets[ti] ?? null,
        mods: Number(e[4] ?? 0),
      });
      continue;
    }
    const x = Number(e[2]);
    const y = Number(e[3]);
    path.t.push(t);
    path.x.push(x);
    path.y.push(y);
    if (type === "d" || type === "u" || type === "c") {
      const ti = e[4] == null ? -1 : Number(e[4]);
      actions.push({
        kind: type,
        t,
        x,
        y,
        target: targets[ti] ?? null,
        ox: Number(e[5] ?? 0.5),
        oy: Number(e[6] ?? 0.5),
      });
    }
  }

  const last = events.at(-1);
  return {
    duration: last ? Number(last[0]) : 0,
    path,
    actions,
    anchors: actions.filter((a): a is PointerAction => a.kind !== "k" && a.target !== null),
  };
}

/** Linear interpolation along the recorded path, normalized coords. */
export function pathAt(path: Compiled["path"], t: number): [number, number] {
  const { t: ts, x, y } = path;
  const n = ts.length;
  if (n === 0) return [0.5, 0.5];
  if (t <= ts[0]) return [x[0], y[0]];
  if (t >= ts[n - 1]) return [x[n - 1], y[n - 1]];
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ts[mid] <= t) lo = mid;
    else hi = mid;
  }
  const k = (t - ts[lo]) / (ts[hi] - ts[lo] || 1);
  return [x[lo] + (x[hi] - x[lo]) * k, y[lo] + (y[hi] - y[lo]) * k];
}

/** One event per line, so recordings diff nicely when pasted into a file. */
export function serialize(rec: Recording): string {
  const head = JSON.stringify({ v: rec.v, size: rec.size, targets: rec.targets });
  const events = rec.events.map((e) => "  " + JSON.stringify(e)).join(",\n");
  return `${head.slice(0, -1)},"events":[\n${events}\n]}\n`;
}
