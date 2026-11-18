/**
 * Synthetic input that components can't tell apart from a mouse, except for
 * `isTrusted`. Real focus is never moved: a reader pressing Space to scroll
 * must not end up toggling a button the ghost clicked. `data-ghost-focus`
 * mirrors where focus would have gone instead.
 */

type PointerOpts = {
  button?: number;
  buttons?: number;
  relatedTarget?: EventTarget | null;
  detail?: number;
};

const MOUSE_TWIN: Record<string, string> = {
  pointermove: "mousemove",
  pointerdown: "mousedown",
  pointerup: "mouseup",
  pointerover: "mouseover",
  pointerout: "mouseout",
  pointerenter: "mouseenter",
  pointerleave: "mouseleave",
};

function init(type: string, x: number, y: number, o: PointerOpts, isPointer: boolean) {
  const bubbles = !type.endsWith("enter") && !type.endsWith("leave");
  const buttons = o.buttons ?? 0;
  return {
    bubbles,
    cancelable: bubbles,
    composed: true,
    view: window,
    clientX: x,
    clientY: y,
    screenX: x + window.screenX,
    screenY: y + window.screenY,
    button: o.button ?? (isPointer ? -1 : 0),
    buttons,
    detail: o.detail ?? 0,
    relatedTarget: o.relatedTarget ?? null,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    width: 1,
    height: 1,
    pressure: buttons ? 0.5 : 0,
  };
}

export function firePointer(el: EventTarget, type: string, x: number, y: number, o: PointerOpts = {}) {
  return el.dispatchEvent(new PointerEvent(type, init(type, x, y, o, true)));
}

export function fireMouse(el: EventTarget, type: string, x: number, y: number, o: PointerOpts = {}) {
  return el.dispatchEvent(new MouseEvent(type, init(type, x, y, o, false)));
}

/** Pointer event followed by its compatibility mouse event, like a browser. */
function fireBoth(el: Element, type: string, x: number, y: number, o: PointerOpts = {}) {
  const ok = firePointer(el, type, x, y, o);
  fireMouse(el, MOUSE_TWIN[type], x, y, o);
  return ok;
}

export function pointerMove(el: Element, x: number, y: number, buttons: number) {
  fireBoth(el, "pointermove", x, y, { buttons });
}

/**
 * `suppressMouse`: pointerdown was prevented, so the browser would skip compat mouse events.
 * `focus`: mousedown wasn't prevented, so the browser would move focus.
 */
export function pointerDown(el: Element, x: number, y: number) {
  const ok = firePointer(el, "pointerdown", x, y, { button: 0, buttons: 1 });
  const mouseOk = ok ? fireMouse(el, "mousedown", x, y, { button: 0, buttons: 1, detail: 1 }) : true;
  return { suppressMouse: !ok, focus: mouseOk };
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex], [contenteditable="true"], [contenteditable=""]';

/** Mark the element a real press would have focused. */
export function mirrorFocus(el: Element | null, root: Element) {
  for (const n of root.querySelectorAll("[data-ghost-focus]")) n.removeAttribute("data-ghost-focus");
  const target = el?.closest(FOCUSABLE);
  if (target && root.contains(target) && target !== root) target.setAttribute("data-ghost-focus", "");
}

export function pointerUp(el: Element, x: number, y: number, suppressMouse: boolean) {
  firePointer(el, "pointerup", x, y, { button: 0 });
  if (!suppressMouse) fireMouse(el, "mouseup", x, y, { button: 0, detail: 1 });
}

export function pointerCancel(el: Element, x: number, y: number) {
  firePointer(el, "pointercancel", x, y, {});
}

export function click(el: Element, x: number, y: number, detail = 1) {
  el.dispatchEvent(new PointerEvent("click", init("click", x, y, { button: 0, detail }, true)));
}

/** Ancestors from `el` up to and including `root`. Empty when outside it. */
function chain(el: Element | null, root: Element) {
  const out: Element[] = [];
  if (!el || !root.contains(el)) return out;
  for (let n: Element | null = el; n; n = n.parentElement) {
    out.push(n);
    if (n === root) break;
  }
  return out;
}

/**
 * Tracks what the ghost is over and emits over/out/enter/leave the way a
 * browser does. `data-ghost-hover` mirrors `:hover`, which scripts can't set.
 */
export class HoverTracker {
  current: Element | null = null;
  constructor(private root: Element) {}

  set(next: Element | null, x: number, y: number, buttons = 0) {
    const prev = this.current?.isConnected ? this.current : null;
    if (prev === next) return;
    const prevChain = chain(prev, this.root);
    const nextChain = chain(next, this.root);
    const o = { buttons };

    if (prev) fireBoth(prev, "pointerout", x, y, { ...o, relatedTarget: next });
    for (const n of prevChain) {
      if (nextChain.includes(n)) continue;
      fireBoth(n, "pointerleave", x, y, { ...o, relatedTarget: next });
      n.removeAttribute("data-ghost-hover");
    }
    if (next) fireBoth(next, "pointerover", x, y, { ...o, relatedTarget: prev });
    for (const n of [...nextChain].reverse()) {
      if (prevChain.includes(n)) continue;
      n.setAttribute("data-ghost-hover", "");
      fireBoth(n, "pointerenter", x, y, { ...o, relatedTarget: prev });
    }
    this.current = next;
  }

  /** Leave everything. `relatedTarget` is where the real pointer went. */
  clear(x: number, y: number, relatedTarget: Element | null = null) {
    const prev = this.current?.isConnected ? this.current : null;
    if (prev) {
      const keep = chain(relatedTarget, this.root);
      if (prev !== relatedTarget) fireBoth(prev, "pointerout", x, y, { relatedTarget });
      for (const n of chain(prev, this.root)) {
        if (!keep.includes(n)) fireBoth(n, "pointerleave", x, y, { relatedTarget });
      }
    }
    this.current = null;
    for (const n of this.root.querySelectorAll("[data-ghost-hover]")) n.removeAttribute("data-ghost-hover");
    this.root.removeAttribute("data-ghost-hover");
  }
}

/** `data-ghost-active` mirrors `:active` on the pressed element and its ancestors. */
export function setActive(el: Element | null, root: Element, on: boolean) {
  for (const n of root.querySelectorAll("[data-ghost-active]")) n.removeAttribute("data-ghost-active");
  root.removeAttribute("data-ghost-active");
  if (on) for (const n of chain(el, root)) n.setAttribute("data-ghost-active", "");
}

const ENTER_ACTIVATES = 'button, a[href], summary, input[type="submit"], input[type="button"], input[type="reset"]';
const SPACE_ACTIVATES =
  'button, summary, input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"], input[type="reset"]';

const TEXT_INPUTS = new Set(["text", "search", "email", "url", "tel", "password", "number"]);

function codeFor(key: string) {
  if (key === " ") return "Space";
  if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`;
  if (/^[0-9]$/.test(key)) return `Digit${key}`;
  return key;
}

function editText(el: Element, key: string) {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
  if (el instanceof HTMLInputElement && !TEXT_INPUTS.has(el.type)) return;
  if (el.readOnly || el.disabled) return;
  const proto = el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  const setValue = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (!setValue) return;
  let start = el.value.length;
  let end = start;
  try {
    start = el.selectionStart ?? start;
    end = el.selectionEnd ?? end;
  } catch {
    // Inputs like type=email don't expose selection.
  }
  const backspace = key === "Backspace";
  const from = backspace && start === end ? Math.max(0, start - 1) : start;
  const text = backspace ? "" : key;
  // The prototype setter keeps React's value tracker in sync.
  setValue.call(el, el.value.slice(0, from) + text + el.value.slice(end));
  try {
    el.setSelectionRange(from + text.length, from + text.length);
  } catch {}
  el.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      composed: true,
      inputType: backspace ? "deleteContentBackward" : "insertText",
      data: backspace ? null : text,
    }),
  );
}

/** keydown + default action + keyup. Enter/Space activate like the browser would. */
export function pressKey(el: Element, key: string, mods: number) {
  const opts: KeyboardEventInit = {
    key,
    code: codeFor(key),
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    shiftKey: !!(mods & 1),
    ctrlKey: !!(mods & 2),
    altKey: !!(mods & 4),
    metaKey: !!(mods & 8),
  };
  const ok = el.dispatchEvent(new KeyboardEvent("keydown", opts));
  if (ok) {
    if (key === "Enter" && el.matches(ENTER_ACTIVATES)) click(el, 0, 0, 0);
    else if ((key.length === 1 && !(mods & 10)) || key === "Backspace") editText(el, key);
  }
  const upOk = el.dispatchEvent(new KeyboardEvent("keyup", opts));
  if (ok && upOk && key === " " && el.matches(SPACE_ACTIVATES)) click(el, 0, 0, 0);
}
