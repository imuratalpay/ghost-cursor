import {
  HoverTracker,
  click,
  mirrorFocus,
  pointerCancel,
  pointerDown,
  pointerMove,
  pointerUp,
  pressKey,
  setActive,
} from "./dispatch";
import { type Action, type Compiled, type PointerAction, pathAt } from "./recording";

export interface EngineHost {
  stage: HTMLElement;
  content: HTMLElement;
  /** Spring target for the ghost tip, px relative to the stage. */
  moveGhost(x: number, y: number, jump?: boolean): void;
  /** Where the ghost is drawn right now (spring output). */
  readGhost(): [number, number];
  showGhost(visible: boolean): void;
  /** `ripple` is false while seeking, so scrubbing doesn't spray ripples. */
  pressGhost(down: boolean, x: number, y: number, ripple: boolean): void;
  /** Synchronously remount the children back to their first frame. */
  remount(): void;
  /** Run `fn` and flush resulting React updates before returning. */
  flush(fn: () => void): void;
  onTime(t: number, duration: number): void;
}

export interface EngineOptions {
  autoplay: boolean;
  loop: boolean;
  /** Time the final state stays on screen before looping. */
  loopDelay: number;
  /** Cross-fade the component when it resets between loops. */
  fade: boolean;
}

export interface EngineState {
  /** Reduced motion: nothing runs until the reader presses Play. */
  idle: boolean;
  paused: boolean;
  handoff: boolean;
  speed: number;
}

type Phase = "lead" | "play" | "tail" | "gap";
type Blocker = "offscreen" | "hidden" | "scrub";

const LEAD = 500;
const GATE_DISTANCE = 3;
const GATE_TIMEOUT = 240;
const RESUME_DELAY = 420;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

const smooth = (k: number) => k * k * (3 - 2 * k);

/** Structure, attributes and text — not inline styles, which animation libraries churn. */
function signature(root: Element): string {
  let out = "";
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) {
      out += n.textContent;
      return;
    }
    if (!(n instanceof Element)) return;
    out += `<${n.tagName}`;
    for (const a of n.attributes) {
      if (a.name !== "style" && !a.name.startsWith("data-ghost-")) out += ` ${a.name}=${a.value}`;
    }
    out += ">";
    n.childNodes.forEach(walk);
  };
  root.childNodes.forEach(walk);
  return out;
}

export class Engine {
  private rec: Compiled;
  private host: EngineHost;
  private opts: EngineOptions;
  private hover: HoverTracker;

  private phase: Phase = "lead";
  private phaseTime = 0;
  private time = 0;
  private next = 0;
  private speed = 1;
  private gate: { action: PointerAction; waited: number } | null = null;
  private frozen = new Map<PointerAction, [number, number]>();

  private active: boolean;
  private paused = false;
  private handoff: "pointer" | "touch" | "focus" | null = null;
  private dirty = false;
  private blockers = new Set<Blocker>();

  private pressed: { el: Element; suppressMouse: boolean } | null = null;
  private lastHover: [number, number] = [NaN, NaN];
  private size: [number, number] = [0, 0];
  private stageRect = { left: 0, top: 0 };
  private pristine: string;
  private gap = { reset: false, animate: false, faded: null as Animation | null, remounted: false };

  private raf = 0;
  private last = 0;
  private resumeTimer = 0;
  private lastTab = -Infinity;
  private listeners = new Set<() => void>();
  private cleanup: (() => void)[] = [];
  private destroyed = false;
  private seeking = false;

  constructor(rec: Compiled, host: EngineHost, opts: EngineOptions) {
    this.rec = rec;
    this.host = host;
    this.opts = opts;
    this.hover = new HoverTracker(host.content);
    this.active = opts.autoplay;
    this.pristine = signature(host.content);
    this.measure();
    this.listen();
    if (this.active) this.startLead();
    this.host.onTime(0, rec.duration);
  }

  get state(): EngineState {
    return { idle: !this.active, paused: this.paused, handoff: this.handoff !== null, speed: this.speed };
  }

  get duration() {
    return this.rec.duration;
  }

  /** Calls `fn` now and on every change. */
  subscribe(fn: () => void) {
    this.listeners.add(fn);
    fn();
    return () => this.listeners.delete(fn);
  }

  // Public controls

  togglePause() {
    if (!this.active) return this.play();
    this.paused = !this.paused;
    this.emit();
    this.wake();
  }

  /** Reduced motion: play the recording once on request. */
  play() {
    if (this.active) {
      if (this.paused) this.togglePause();
      return;
    }
    this.active = true;
    this.paused = false;
    this.beginGap(true);
    this.emit();
    this.wake();
  }

  setSpeed(speed: number) {
    this.speed = speed;
    this.emit();
  }

  setBlocked(reason: Blocker, blocked: boolean) {
    if (blocked) this.blockers.add(reason);
    else this.blockers.delete(reason);
    if (reason === "offscreen" && blocked && this.handoff === "touch") this.scheduleResume(0);
    this.wake();
  }

  /** Jump the component and the ghost to `t` (ms) by replaying events up to it. */
  seek(t: number) {
    if (!this.active) {
      this.active = true;
      this.paused = true;
      this.emit();
    }
    t = Math.max(0, Math.min(this.rec.duration, t));
    this.finishGap();
    if (t < this.time || this.dirty || this.phase === "tail") this.reset();
    this.gate = null;
    this.measure();

    const { actions } = this.rec;
    this.seeking = true;
    while (this.next < actions.length && actions[this.next].t <= t) {
      const a = actions[this.next++];
      const p = this.actionPos(a);
      this.host.flush(() => {
        if (p) this.hoverAt(p[0], p[1]);
        this.fire(a, p);
      });
    }
    this.seeking = false;

    this.time = t;
    this.phase = "play";
    this.phaseTime = 0;
    const [x, y] = this.posAt(t);
    this.host.moveGhost(x, y, true);
    this.host.showGhost(this.handoff === null);
    this.host.flush(() => this.hoverAt(x, y));
    this.host.onTime(t, this.rec.duration);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.resumeTimer);
    this.gap.faded?.cancel();
    this.cleanup.forEach((fn) => fn());
    this.releasePress();
    this.hover.clear(0, 0);
    mirrorFocus(null, this.host.content);
    this.listeners.clear();
  }

  // Loop

  private running() {
    return !this.destroyed && this.active && !this.paused && !this.handoff && this.blockers.size === 0;
  }

  private wake() {
    if (this.raf || !this.running()) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.raf = 0;
    if (!this.running()) return;
    const dt = Math.min(now - this.last, 50);
    this.last = now;
    this.measure();
    this.step(dt);
    if (this.running()) this.raf = requestAnimationFrame(this.tick);
  };

  private step(dt: number) {
    this.phaseTime += dt;
    switch (this.phase) {
      case "lead": {
        const [x, y] = this.posAt(0);
        this.host.moveGhost(x, y);
        if (this.phaseTime >= LEAD / this.speed) this.setPhase("play");
        break;
      }
      case "play":
        this.advance(dt);
        if (this.time >= this.rec.duration && !this.gate) this.setPhase("tail");
        break;
      case "tail":
        if (this.phaseTime >= this.opts.loopDelay) {
          if (this.opts.loop) this.beginGap();
          else this.finishOnce();
        }
        break;
      case "gap":
        this.stepGap();
        break;
    }
  }

  private setPhase(phase: Phase) {
    this.phase = phase;
    this.phaseTime = 0;
  }

  private advance(dt: number) {
    const ghost = this.host.readGhost();

    if (this.gate) {
      const p = this.actionPos(this.gate.action)!;
      this.host.moveGhost(p[0], p[1]);
      this.gate.waited += dt;
      if (Math.hypot(ghost[0] - p[0], ghost[1] - p[1]) > GATE_DISTANCE && this.gate.waited < GATE_TIMEOUT) {
        this.hoverAt(ghost[0], ghost[1]);
        return;
      }
      this.hoverAt(p[0], p[1]);
      this.fire(this.gate.action, p);
      this.next++;
      this.gate = null;
    }

    const target = this.time + dt * this.speed;
    const { actions } = this.rec;
    while (this.next < actions.length && actions[this.next].t <= target) {
      const a = actions[this.next];
      const p = this.actionPos(a);
      // Hold the playhead until the spring-smoothed ghost has really arrived,
      // so a click never lands before the cursor does.
      if (p && Math.hypot(ghost[0] - p[0], ghost[1] - p[1]) > GATE_DISTANCE) {
        this.time = a.t;
        this.gate = { action: a as PointerAction, waited: 0 };
        this.host.moveGhost(p[0], p[1]);
        this.hoverAt(ghost[0], ghost[1]);
        this.host.onTime(this.time, this.rec.duration);
        return;
      }
      if (p) this.hoverAt(p[0], p[1]);
      this.fire(a, p);
      this.next++;
    }

    this.time = Math.min(target, this.rec.duration);
    const [x, y] = this.posAt(this.time);
    this.host.moveGhost(x, y);
    this.hoverAt(ghost[0], ghost[1]);
    this.host.onTime(this.time, this.rec.duration);
  }

  private startLead() {
    this.reset(false);
    this.setPhase("lead");
    const [x, y] = this.posAt(0);
    this.host.moveGhost(x, y, true);
    this.host.showGhost(this.handoff === null);
    this.host.onTime(0, this.rec.duration);
  }

  /** Hide the ghost, return the component to its first frame, start over. */
  private beginGap(immediate = false) {
    this.setPhase("gap");
    if (immediate) this.phaseTime = 200;
    this.host.showGhost(false);
    this.releasePress();
    this.hover.clear(0, 0);
    const reset = this.dirty || signature(this.host.content) !== this.pristine;
    this.gap = { reset, animate: reset && this.opts.fade, faded: null, remounted: false };
  }

  private stepGap() {
    const g = this.gap;
    const t = this.phaseTime;
    if (g.animate && !g.faded && t >= 200) {
      g.faded = this.host.content.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 160,
        easing: "ease-in",
        fill: "forwards",
      });
    }
    if (!g.remounted && t >= (g.animate ? 380 : 200)) this.remountForLoop();
    if (t >= (g.animate ? 640 : 320)) this.startLead();
  }

  private remountForLoop() {
    const g = this.gap;
    g.remounted = true;
    if (!g.reset) return;
    this.host.remount();
    this.dirty = false;
    g.faded?.cancel();
    g.faded = null;
    if (g.animate) {
      this.host.content.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: EASE_OUT });
    }
  }

  /** Complete an in-flight gap now, so the reader never sees a faded-out component. */
  private finishGap() {
    if (this.phase !== "gap") return;
    if (!this.gap.remounted) this.remountForLoop();
    this.startLead();
  }

  private finishOnce() {
    this.beginGap();
    this.active = false;
    this.remountForLoop();
    this.host.showGhost(false);
    this.reset(false);
    this.setPhase("lead");
    this.host.onTime(0, this.rec.duration);
    this.emit();
  }

  /** Back to t=0. Remounts unless told the DOM is already pristine. */
  private reset(remount = true) {
    this.releasePress();
    this.hover.clear(0, 0);
    mirrorFocus(null, this.host.content);
    if (remount) this.host.remount();
    this.time = 0;
    this.next = 0;
    this.gate = null;
    this.frozen.clear();
    this.lastHover = [NaN, NaN];
    if (remount) this.dirty = false;
  }

  // Geometry

  private measure() {
    const r = this.host.stage.getBoundingClientRect();
    if (r.width !== this.size[0] || r.height !== this.size[1]) this.frozen.clear();
    this.size = [r.width, r.height];
    this.stageRect = { left: r.left, top: r.top };
  }

  private resolve(target: string | null): Element | null {
    if (!target) return null;
    try {
      if (target.startsWith("@")) {
        const sel = `[data-ghost-id="${CSS.escape(target.slice(1))}"]`;
        return this.host.content.querySelector(sel) ?? document.querySelector(sel);
      }
      return this.host.content.querySelector(target);
    } catch {
      return null;
    }
  }

  /**
   * How far the live target sits from where the recording says it was.
   * Lets one recording survive a narrower column or a reflowed layout.
   */
  private delta(a: PointerAction): [number, number] | null {
    const frozen = this.frozen.get(a);
    if (frozen) return frozen;
    const el = this.resolve(a.target);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    return [
      r.left - this.stageRect.left + a.ox * r.width - a.x * this.size[0],
      r.top - this.stageRect.top + a.oy * r.height - a.y * this.size[1],
    ];
  }

  private offsetAt(t: number): [number, number] {
    let prev: PointerAction | null = null;
    let next: PointerAction | null = null;
    for (const a of this.rec.anchors) {
      if (a.t <= t) prev = a;
      else {
        next = a;
        break;
      }
    }
    const dp = prev ? this.delta(prev) : null;
    const dn = next ? this.delta(next) : null;
    if (dp && dn && prev && next) {
      const k = smooth((t - prev.t) / (next.t - prev.t || 1));
      return [dp[0] + (dn[0] - dp[0]) * k, dp[1] + (dn[1] - dp[1]) * k];
    }
    return dp ?? dn ?? [0, 0];
  }

  private posAt(t: number): [number, number] {
    const [nx, ny] = pathAt(this.rec.path, t);
    const [dx, dy] = this.offsetAt(t);
    return [nx * this.size[0] + dx, ny * this.size[1] + dy];
  }

  private actionPos(a: Action): [number, number] | null {
    if (a.kind === "k") return null;
    const d = this.delta(a) ?? this.offsetAt(a.t);
    return [a.x * this.size[0] + d[0], a.y * this.size[1] + d[1]];
  }

  // Dispatch

  private hoverAt(x: number, y: number) {
    const cx = this.stageRect.left + x;
    const cy = this.stageRect.top + y;
    let el = document.elementFromPoint(cx, cy);
    if (el && !this.host.content.contains(el)) el = null;
    const buttons = this.pressed ? 1 : 0;
    this.hover.set(el, cx, cy, buttons);
    if (el && !(Math.hypot(x - this.lastHover[0], y - this.lastHover[1]) < 0.5)) {
      pointerMove(el, cx, cy, buttons);
      this.lastHover = [x, y];
    }
  }

  private fire(a: Action, pos: [number, number] | null) {
    const { content } = this.host;
    if (a.kind === "k") {
      const focused = document.activeElement;
      const el = this.resolve(a.target) ?? (focused && content.contains(focused) ? focused : content);
      pressKey(el, a.key, a.mods);
      return;
    }

    const [x, y] = pos ?? [a.x * this.size[0], a.y * this.size[1]];
    const cx = this.stageRect.left + x;
    const cy = this.stageRect.top + y;
    const live = this.delta(a);
    if (live) this.frozen.set(a, live);
    const el = this.resolve(a.target) ?? this.hover.current ?? content;

    if (a.kind === "d") {
      this.releasePress();
      this.host.pressGhost(true, x, y, !this.seeking);
      const down = pointerDown(el, cx, cy);
      this.pressed = { el, suppressMouse: down.suppressMouse };
      if (down.focus) mirrorFocus(el, content);
      setActive(el, content, true);
    } else if (a.kind === "u") {
      pointerUp(el, cx, cy, this.pressed?.suppressMouse ?? false);
      this.pressed = null;
      setActive(null, content, false);
      this.host.pressGhost(false, x, y, false);
    } else {
      click(el, cx, cy);
    }
  }

  private releasePress() {
    if (!this.pressed) return;
    const [x, y] = this.host.readGhost();
    if (this.pressed.el.isConnected) {
      pointerCancel(this.pressed.el, this.stageRect.left + x, this.stageRect.top + y);
    }
    this.pressed = null;
    setActive(null, this.host.content, false);
    this.host.pressGhost(false, x, y, false);
  }

  // Handoff: the reader's own input always wins over the ghost.

  private listen() {
    const { stage } = this.host;
    const on = <K extends keyof HTMLElementEventMap>(
      target: HTMLElement | Document,
      type: K,
      fn: (e: HTMLElementEventMap[K]) => void,
    ) => {
      target.addEventListener(type, fn as EventListener, true);
      this.cleanup.push(() => target.removeEventListener(type, fn as EventListener, true));
    };

    // Capture listeners also see enter/leave of descendants; only the stage's own count.
    on(stage, "pointerenter", (e) => {
      if (e.isTrusted && e.target === stage && e.pointerType !== "touch") {
        this.takeOver("pointer", e.clientX, e.clientY);
      }
    });
    on(stage, "pointerleave", (e) => {
      if (e.isTrusted && e.target === stage && this.handoff === "pointer") this.scheduleResume();
    });
    on(stage, "pointerdown", (e) => {
      if (e.isTrusted && e.pointerType === "touch") this.takeOver("touch", e.clientX, e.clientY);
    });
    // A touch that turns into a scroll is cancelled; the reader was only passing through.
    on(stage, "pointercancel", (e) => {
      if (e.isTrusted && this.handoff === "touch") this.scheduleResume();
    });
    on(stage, "pointerup", (e) => {
      if (e.isTrusted) this.dirty = true;
    });
    on(stage, "keydown", (e) => {
      if (e.isTrusted && e.key !== "Tab") this.dirty = true;
    });
    on(document, "keydown", (e) => {
      if (e.isTrusted && e.key === "Tab") this.lastTab = performance.now();
    });
    on(document, "pointerdown", (e) => {
      if (e.isTrusted && this.handoff === "touch" && !stage.contains(e.target as Node)) this.scheduleResume(0);
    });
    on(stage, "focusin", () => {
      if (performance.now() - this.lastTab < 500) this.takeOver("focus");
    });
    on(stage, "focusout", (e) => {
      if (this.handoff === "focus" && !stage.contains(e.relatedTarget as Node)) this.scheduleResume();
    });

    const onVisibility = () => this.setBlocked("hidden", document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    this.cleanup.push(() => document.removeEventListener("visibilitychange", onVisibility));
  }

  private takeOver(source: "pointer" | "touch" | "focus", x = 0, y = 0) {
    clearTimeout(this.resumeTimer);
    if (this.handoff) {
      this.handoff = source;
      return;
    }
    this.handoff = source;
    if (!this.active) return this.emit();
    this.finishGap();
    // Interrupting a press leaves the recording's matching "up" orphaned.
    if (this.pressed) this.dirty = true;
    this.releasePress();
    this.hover.clear(x, y, source === "focus" ? null : document.elementFromPoint(x, y));
    mirrorFocus(null, this.host.content);
    this.lastHover = [NaN, NaN];
    this.host.showGhost(false);
    this.emit();
  }

  private scheduleResume(delay = RESUME_DELAY) {
    clearTimeout(this.resumeTimer);
    this.resumeTimer = window.setTimeout(() => {
      if (!this.handoff) return;
      this.handoff = null;
      if (this.active) {
        if (this.dirty) this.beginGap();
        else if (this.phase !== "gap") this.host.showGhost(true);
      }
      this.emit();
      this.wake();
    }, delay);
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }
}
