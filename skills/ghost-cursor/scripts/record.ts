/**
 * Record a ghost-cursor take from a step list, then check that it replays.
 *
 *   npx tsx skills/ghost-cursor/scripts/record.ts --url <page> --out <file.json> [options] <step>...
 *
 * Steps (one per argument, or several in one argument separated by ";"):
 *   click <target>     move to the target, press, release
 *   hover <target>     move to the target and rest on it
 *   type "<text>"      type into the focused element at a human pace
 *   press <Key>        a single key, e.g. Enter, Escape, ArrowDown
 *   wait <ms>          do nothing
 *   move <x> <y>       move to a point in the box, 0 to 1 on each axis
 *
 * Targets: @name for data-ghost-id="name", text="Label" for visible text, or any CSS selector.
 * They resolve inside the demo's stage.
 *
 * Options:
 *   --root <target>    pick the demo that contains this target (default: the first step's target)
 *   --index <n>        when several demos contain it, take the nth, counting from 0 (default 0)
 *   --viewport WxH     browser size, default 1280x900
 *   --seed <n>         seed for the movement noise, default 1
 *   --speed <n>        movement speed multiplier, default 1
 *   --ignore <css>     leave matching elements out of the state comparison (repeatable)
 *   --no-verify        skip the replay check
 *   --headed           show the browser
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium, type Locator, type Page } from "playwright";

type Point = { x: number; y: number };
type Step =
  | { kind: "click" | "hover"; target: string }
  | { kind: "type"; text: string }
  | { kind: "press"; key: string }
  | { kind: "wait"; ms: number }
  | { kind: "move"; x: number; y: number };

// Arguments

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: "string" },
    out: { type: "string" },
    root: { type: "string" },
    index: { type: "string", default: "0" },
    viewport: { type: "string", default: "1280x900" },
    seed: { type: "string", default: "1" },
    speed: { type: "string", default: "1" },
    ignore: { type: "string", multiple: true, default: [] },
    "no-verify": { type: "boolean", default: false },
    headed: { type: "boolean", default: false },
  },
});

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function parseStep(raw: string): Step {
  const text = raw.trim();
  const [verb, ...rest] = text.split(/\s+/);
  const arg = text.slice(verb.length).trim();
  switch (verb) {
    case "click":
    case "hover":
      if (!arg) fail(`"${text}" needs a target`);
      return { kind: verb, target: arg };
    case "type":
      return { kind: "type", text: arg.replace(/^(["'])(.*)\1$/, "$2") };
    case "press":
      if (!arg) fail(`"${text}" needs a key`);
      return { kind: "press", key: arg };
    case "wait": {
      const ms = Number(arg);
      if (!Number.isFinite(ms)) fail(`"${text}" needs a number of milliseconds`);
      return { kind: "wait", ms };
    }
    case "move": {
      const [x, y] = rest.map(Number);
      if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) fail(`"${text}" needs two numbers between 0 and 1`);
      return { kind: "move", x, y };
    }
    default:
      fail(`unknown step "${text}". Use click, hover, type, press, wait or move.`);
  }
}

if (!values.url) fail("--url is required");
if (!values.out) fail("--out is required");
const rawSteps = positionals.flatMap((p) => p.split(";")).map((s) => s.trim()).filter(Boolean);
const steps = rawSteps.map(parseStep);
if (!steps.length) fail("give at least one step, e.g. 'click @save'");

const [vw, vh] = values.viewport.split("x").map(Number);
const SPEED = Number(values.speed) || 1;
const OUT = resolve(values.out);
const firstTarget = values.root ?? steps.find((s) => "target" in s)?.target;

// Randomness: seeded, so a rerun with the same seed moves the same way.

let seed = (Number(values.seed) || 1) * 9301 + 49297;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const between = (a: number, b: number) => a + (b - a) * rand();
const gaussian = () => (rand() + rand() + rand() - 1.5) / 1.5;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Page helpers

function locate(scope: Locator, target: string): Locator {
  if (target.startsWith("@")) return scope.locator(`[data-ghost-id="${target.slice(1)}"]`);
  const text = target.match(/^text=(["']?)(.+)\1$/);
  if (text) return scope.getByText(text[2], { exact: true });
  return scope.locator(target);
}

/** Outermost demo roots: a Recorder inside a GhostCursor belongs to its parent. */
const ROOTS = ".gc-root:not(.gc-stage .gc-root)";

async function findRoot(page: Page): Promise<Locator> {
  const roots = page.locator(ROOTS);
  const count = await roots.count();
  if (!count) fail("no <GhostCursor> found on the page");
  const wanted = Number(values.index) || 0;
  if (!firstTarget) return roots.nth(wanted);
  const matches: Locator[] = [];
  for (let i = 0; i < count; i++) {
    const root = roots.nth(i);
    if (await locate(root.locator(":scope > .gc-stage"), firstTarget).count()) matches.push(root);
  }
  if (!matches.length) fail(`no demo on the page contains ${firstTarget}. Add data-ghost-id to it or pass --root.`);
  if (!matches[wanted]) fail(`only ${matches.length} demos contain ${firstTarget}; --index ${wanted} is out of range`);
  return matches[wanted];
}

/**
 * Text, structure and attributes, minus anything that differs between a take and its replay.
 * Kept as source text: tsx rewrites real functions with helpers that don't exist in the page.
 */
const SIGNATURE = String.raw`(content, ignore) => {
  const SKIP_ATTRS = /^(style|id|for|data-ghost-.*|data-motion-.*|data-projection-id|data-handoff|data-dragging|aria-(controls|labelledby|describedby|activedescendant|owns|valuenow|valuetext))$/;
  const skip = [".gc-overlay", ".gc-time", ".gc-hint", ...ignore].join(",");
  let out = "";
  const walk = (n) => {
    if (n.nodeType === Node.TEXT_NODE) { out += n.textContent; return; }
    if (!(n instanceof Element) || n.matches(skip)) return;
    const tag = n.tagName.toLowerCase();
    out += "<" + tag;
    for (const a of Array.from(n.attributes)) if (!SKIP_ATTRS.test(a.name)) out += " " + a.name + '="' + a.value + '"';
    out += ">";
    n.childNodes.forEach(walk);
    out += "</" + tag + ">";
  };
  content.childNodes.forEach(walk);
  return out;
}`;

const readState = (root: Locator) =>
  root
    .locator(":scope > .gc-stage > .gc-content")
    .evaluate((el, [src, ignore]) => (0, eval)(src)(el, ignore) as string, [SIGNATURE, values.ignore] as const);

function firstDifference(a: string, b: string) {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  const from = Math.max(0, i - 60);
  return { take: a.slice(from, i + 80), replay: b.slice(from, i + 80) };
}

// Human-like movement

let pos: Point = { x: 0, y: 0 };
/** When the script last sent input. The take ends there, and both snapshots are timed from it. */
let lastInput = 0;

/** Minimum-jerk speed along a gently bowed cubic Bézier. */
async function curve(page: Page, to: Point, duration: number, bowScale = 1) {
  const from = { ...pos };
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const bow = between(-0.16, 0.16) * dist * bowScale;
  const nx = -dy / dist;
  const ny = dx / dist;
  const c1 = { x: from.x + dx * 0.3 + nx * bow, y: from.y + dy * 0.3 + ny * bow };
  const c2 = { x: from.x + dx * 0.72 + nx * bow * 0.45, y: from.y + dy * 0.72 + ny * bow * 0.45 };
  const start = Date.now();
  for (;;) {
    const k = Math.min(1, (Date.now() - start) / duration);
    const s = k * k * k * (10 - 15 * k + 6 * k * k);
    const u = 1 - s;
    const x = u * u * u * from.x + 3 * u * u * s * c1.x + 3 * u * s * s * c2.x + s * s * s * to.x;
    const y = u * u * u * from.y + 3 * u * u * s * c1.y + 3 * u * s * s * c2.y + s * s * s * to.y;
    await page.mouse.move(x, y);
    pos = { x, y };
    lastInput = Date.now();
    if (k >= 1) return;
    await sleep(14);
  }
}

/** Fitts-style duration with per-move variation, plus an overshoot and correction on long moves. */
async function glide(page: Page, to: Point, { quick = false } = {}) {
  const dist = Math.hypot(to.x - pos.x, to.y - pos.y);
  if (dist < 1) return;
  const duration = ((160 + 120 * Math.log2(1 + dist / 14)) * between(0.85, 1.2)) / SPEED / (quick ? 1.5 : 1);
  if (quick || dist < 140 || rand() > 0.7) return curve(page, to, duration);
  const ux = (to.x - pos.x) / dist;
  const uy = (to.y - pos.y) / dist;
  const past = Math.min(18, Math.max(4, dist * between(0.03, 0.07)));
  const wobble = between(-3, 3);
  await curve(page, { x: to.x + ux * past - uy * wobble, y: to.y + uy * past + ux * wobble }, duration * 0.92);
  await sleep(between(30, 70));
  await curve(page, to, between(110, 170) / SPEED, 0.3);
}

/** A point near the middle of the element, never on its edge. */
async function aim(target: Locator, name: string): Promise<Point> {
  const count = await target.count();
  if (!count) fail(`${name} isn't on the page at this point in the take`);
  const box = await target.first().boundingBox();
  if (!box) fail(`${name} isn't visible`);
  const mx = Math.min(3, box.width / 2);
  const my = Math.min(3, box.height / 2);
  return {
    x: Math.min(box.x + box.width - mx, Math.max(box.x + mx, box.x + box.width * (0.5 + gaussian() * 0.15))),
    y: Math.min(box.y + box.height - my, Math.max(box.y + my, box.y + box.height * (0.5 + gaussian() * 0.12))),
  };
}

async function press(page: Page) {
  await sleep(between(90, 220) / SPEED);
  await page.mouse.down();
  await sleep(between(65, 120));
  await page.mouse.up();
  lastInput = Date.now();
}

/** `last`: skip the pause after the step; the settle time before the final snapshot replaces it. */
async function perform(page: Page, stage: Locator, step: Step, last: boolean) {
  const pause = (a: number, b: number) => (last ? Promise.resolve() : sleep(between(a, b) / SPEED));
  switch (step.kind) {
    case "click":
      await glide(page, await aim(locate(stage, step.target), step.target));
      await press(page);
      await pause(260, 520);
      break;
    case "hover":
      await glide(page, await aim(locate(stage, step.target), step.target));
      await pause(380, 750);
      break;
    case "type":
      for (const ch of step.text) {
        await page.keyboard.type(ch);
        lastInput = Date.now();
        let pause = between(65, 160);
        if (ch === " ") pause += between(60, 140);
        if (rand() < 0.12) pause += between(150, 300);
        await sleep(pause / SPEED);
      }
      await pause(300, 500);
      break;
    case "press":
      await page.keyboard.press(step.key);
      lastInput = Date.now();
      await pause(250, 450);
      break;
    case "wait":
      if (!last) await sleep(step.ms);
      break;
    case "move": {
      const box = (await stage.boundingBox())!;
      await glide(page, { x: box.x + box.width * step.x, y: box.y + box.height * step.y });
      await pause(200, 400);
      break;
    }
  }
}

/**
 * How long after the last input both snapshots are taken. A trailing `wait` lengthens it,
 * up to 1400ms, because the player holds the final state for 1600ms before looping.
 */
const lastStep = steps.at(-1)!;
const SETTLE = Math.min(1400, 600 + (lastStep.kind === "wait" ? lastStep.ms : 0));

async function clickPanel(page: Page, root: Locator, id: string, quick = true) {
  const button = root.locator(`:scope > .gc-recorder [data-ghost-id="${id}"]`);
  if (!(await button.count())) {
    fail(`the recorder's ${id.slice(3)} button is missing. Is the dev server running in development mode?`);
  }
  const box = (await button.boundingBox())!;
  const to = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  if (quick) await glide(page, to, { quick: true });
  else {
    await page.mouse.move(to.x, to.y);
    pos = to;
  }
  await page.mouse.down();
  await page.mouse.up();
}

// Run

const browser = await chromium.launch({ headless: !values.headed });
const context = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
await context.addInitScript(() => {
  const clipboard = navigator.clipboard;
  if (!clipboard) return;
  const original = clipboard.writeText.bind(clipboard);
  // Resolve right away: headless Chrome can leave the real promise pending.
  clipboard.writeText = async (text: string) => {
    (window as unknown as { __ghostCursorTake: string }).__ghostCursorTake = text;
    original(text).catch(() => {});
  };
});
const errors: string[] = [];

try {
  // 1. Record. Scrolling is instant: on a page with scroll-behavior: smooth,
  // the target would still be moving when the script aims at it.
  async function recordTake() {
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const recordUrl = new URL(values.url!);
    recordUrl.searchParams.set("record", "");
    await page.goto(recordUrl.toString());
    await page.waitForSelector(".gc-root", { timeout: 20_000 }).catch(() => fail(`no <GhostCursor> at ${values.url}`));
    await page.waitForTimeout(500);

    const root = await findRoot(page);
    const stage = root.locator(":scope > .gc-stage");
    await root.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForTimeout(400);

    await clickPanel(page, root, "gc-record", false);
    await page.waitForTimeout(350);
    if ((await root.locator(":scope > .gc-recorder").getAttribute("data-status")) !== "recording") {
      fail("pressing Record didn't start a take. Is something covering the recorder's buttons?");
    }
    const initial = await readState(root);
    let reacted = false;

    for (const [i, step] of steps.entries()) {
      console.log(`  ${i + 1}/${steps.length}  ${rawSteps[i]}`);
      await perform(page, stage, step, i === steps.length - 1);
      if ((await readState(root)) !== initial) reacted = true;
    }

    // Rest inside the box, so the final state includes whatever the pointer is hovering.
    await sleep(Math.max(0, lastInput + SETTLE - Date.now()));
    const final = await readState(root);
    const status = await root.locator(":scope > .gc-recorder").getAttribute("data-status");
    if (status !== "recording") fail("the recorder stopped during the take. Did the page reload?");
    await clickPanel(page, root, "gc-stop");
    await page.waitForTimeout(250);
    await clickPanel(page, root, "gc-copy");
    await page.waitForTimeout(250);
    const json = await page.evaluate(() => (window as unknown as { __ghostCursorTake?: string }).__ghostCursorTake);
    await page.close();
    return { initial, final, reacted, json };
  }

  if (lastStep.kind === "wait" && 600 + lastStep.ms > SETTLE) {
    console.warn(`! the final wait is capped: the state is checked ${SETTLE}ms after the last input`);
  }
  const { initial, final, reacted, json } = await recordTake();
  if (!json) fail("the recorder produced no JSON. Did the take have any events inside the box?");
  const take = JSON.parse(json) as { events: [number, string][]; targets: string[] };
  const duration = take.events.at(-1)![0];
  const presses = take.events.filter((e) => e[1] === "d").length;
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, json);
  console.log(
    `✓ recorded ${steps.length} steps → ${values.out}  (${take.events.length} events, ${presses} presses, ${(duration / 1000).toFixed(1)}s, ${(json.length / 1024).toFixed(1)} KB)`,
  );
  console.log(`  targets: ${take.targets.join(", ") || "none"}`);
  const expectedClicks = steps.filter((s) => s.kind === "click").length;
  if (presses !== expectedClicks) {
    console.warn(`! ${expectedClicks} click steps but ${presses} presses were recorded inside the box`);
  }
  if (!reacted && initial === final) console.warn("! the component's state never changed during the take");
  if (take.targets.some((t) => !t.startsWith("@"))) {
    console.warn("! some targets are CSS paths. Add data-ghost-id to them so the take survives markup changes.");
  }

  // 2. Verify: reload without ?record and let the replay run to its end.
  if (!values["no-verify"]) {
    const expectedMax = String(Math.round(duration / 100) / 10);
    let replay: Page | null = null;
    let replayRoot: Locator | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      await sleep(attempt ? 1500 : 800);
      replay = await context.newPage();
      replay.on("pageerror", (e) => errors.push(e.message));
      await replay.goto(values.url);
      await replay.waitForSelector(".gc-controls", { timeout: 20_000 });
      replayRoot = await findRoot(replay);
      const max = await replayRoot.locator(':scope > .gc-controls [role="slider"]').getAttribute("aria-valuemax");
      if (max === expectedMax) break;
      await replay.close();
      replay = null;
    }
    if (!replay || !replayRoot) {
      fail(`the page isn't playing the new take yet. Check that the demo imports ${values.out}.`);
    }

    await replayRoot.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await replay.mouse.move(1, 1);
    const replayInitial = await readState(replayRoot);
    const slider = replayRoot.locator(':scope > .gc-controls [role="slider"]');
    const deadline = Date.now() + duration * 2 + 10_000;
    let replayReacted = false;
    let sampled = 0;
    while ((await slider.getAttribute("aria-valuenow")) !== expectedMax) {
      if (Date.now() > deadline) fail("the replay never reached the end of the take");
      if (!replayReacted && Date.now() - sampled > 150) {
        sampled = Date.now();
        replayReacted = (await readState(replayRoot)) !== replayInitial;
      }
      await sleep(40);
    }
    await sleep(SETTLE);
    const replayFinal = await readState(replayRoot);
    replayReacted ||= replayFinal !== replayInitial;

    if (reacted && !replayReacted) fail("the component didn't react to the replay");
    if (replayFinal !== final) {
      const diff = firstDifference(final, replayFinal);
      console.error("✗ the replay ended in a different state than the take");
      console.error(`  take:   …${diff.take}…`);
      console.error(`  replay: …${diff.replay}…`);
      console.error("  If the difference is a timer or a count that can't match, pass --ignore <selector>.");
      process.exitCode = 1;
    } else {
      console.log("✓ replay reached the end and matches the take's final state");
    }
  }

  if (errors.length) console.warn(`! page errors:\n  ${errors.join("\n  ")}`);
} finally {
  await browser.close();
}
