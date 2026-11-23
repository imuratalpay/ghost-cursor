import { expect, test, type Locator, type Page } from "@playwright/test";

/*
 * The public playback API: loop, autoplay, onEnd and the ref handle, on /test/playback.
 * The sort-menu take ends on "A to Z" and starts on "Newest", so every reset remounts.
 */

type Probe = { ends: number[]; mounts: number; handle: { play(): void } | null };

async function open(page: Page, query = "") {
  await page.goto(`/test/playback${query}`);
  const root = page.locator(".gc-root").first();
  await expect(root).toBeVisible();
  await expect.poll(() => mounts(page)).toBeGreaterThan(0);
  const stage = (await root.locator(".gc-stage").boundingBox())!;
  const inside = { x: stage.x + stage.width * 0.1, y: stage.y + stage.height * 0.9 };
  const outside = { x: inside.x, y: stage.y - 80 };
  await page.mouse.move(outside.x, outside.y);
  return { root, inside, outside };
}

const probe = (page: Page) => page.evaluate(() => (window as unknown as { __playback: Probe }).__playback);
const ends = async (page: Page) => (await probe(page)).ends.length;
const mounts = async (page: Page) => (await probe(page))?.mounts ?? 0;
const time = (root: Locator) => root.locator(":scope > .gc-controls .gc-time").textContent();
const label = (root: Locator) => root.locator('[data-ghost-id="sort-trigger"]').textContent();
const playPill = (root: Locator) => root.locator(":scope > .gc-controls .gc-play-pill");
const ghostOpacity = (root: Locator) =>
  root.locator(".gc-arrow").evaluate((el) => Number(getComputedStyle(el).opacity));

/** The playhead is moving: the time label changes within a few seconds. */
async function expectAdvancing(root: Locator) {
  const before = await time(root);
  await expect.poll(() => time(root), { timeout: 3000 }).not.toBe(before);
}

/** A new run started: the children remounted to "Newest" and the playhead left 0. */
async function expectRestarted(page: Page, root: Locator, mountsBefore: number) {
  await expect.poll(() => mounts(page), { timeout: 3000 }).toBeGreaterThan(mountsBefore);
  expect(await label(root)).toBe("Sort: Newest");
  await expect.poll(() => time(root), { timeout: 3000 }).not.toBe("0.0s");
}

test.describe.configure({ timeout: 60_000 });

test("by default the take loops, and onEnd fires at the end of every run", async ({ page }) => {
  const { root } = await open(page);
  await expect.poll(() => ends(page), { timeout: 12_000 }).toBe(1);
  const mountsAtEnd = await mounts(page);
  // The final state holds for the default 1600ms loopDelay.
  await page.waitForTimeout(1000);
  expect(await ends(page)).toBe(1);
  expect(await label(root)).toBe("Sort: A to Z");
  await expect.poll(() => mounts(page), { timeout: 3000 }).toBeGreaterThan(mountsAtEnd);
  await expect.poll(() => ends(page), { timeout: 12_000 }).toBe(2);
  const [first, second] = (await probe(page)).ends;
  expect(second - first).toBeGreaterThan(1600 + 4000);
  await expect(playPill(root)).toHaveCount(0);
});

test("loop={false} fires onEnd once, then returns to the first frame and the Play button", async ({ page }) => {
  const { root } = await open(page, "?loop=false&delay=300");
  await expect.poll(() => ends(page), { timeout: 12_000 }).toBe(1);
  await expect(playPill(root)).toBeVisible({ timeout: 3000 });
  expect(await time(root)).toBe("0.0s");
  expect(await label(root)).toBe("Sort: Newest");
  await page.waitForTimeout(1500);
  expect(await ends(page)).toBe(1);
  expect(await time(root)).toBe("0.0s");
});

test("loop={false} with loopDelay={Infinity} holds the last frame", async ({ page }) => {
  const { root } = await open(page, "?loop=false&delay=inf");
  await expect.poll(() => ends(page), { timeout: 12_000 }).toBe(1);
  const held = { mounts: await mounts(page), time: await time(root) };
  await page.waitForTimeout(2500);
  expect(await ends(page)).toBe(1);
  expect(await mounts(page)).toBe(held.mounts);
  expect(await time(root)).toBe(held.time);
  expect(await label(root)).toBe("Sort: A to Z");
  await expect(playPill(root)).toHaveCount(0);
});

test("autoplay={false} shows the first frame and waits for Play", async ({ page }) => {
  const { root } = await open(page, "?autoplay=false");
  await expect(playPill(root)).toBeVisible();
  await page.waitForTimeout(1500);
  expect(await time(root)).toBe("0.0s");
  expect(await label(root)).toBe("Sort: Newest");
  expect(await ghostOpacity(root)).toBe(0);
  expect(await ends(page)).toBe(0);
  await playPill(root).click();
  await expect(playPill(root)).toHaveCount(0);
  await expectAdvancing(root);
});

test("Play on a held end starts the take from the beginning", async ({ page }) => {
  const { root } = await open(page, "?loop=false&delay=inf");
  await expect.poll(() => ends(page), { timeout: 12_000 }).toBe(1);

  // Through the ref handle, while the final frame is held.
  let before = await mounts(page);
  await page.evaluate(() => (window as unknown as { __playback: Probe }).__playback.handle!.play());
  await expectRestarted(page, root, before);
  await expect.poll(() => ends(page), { timeout: 12_000 }).toBe(2);

  // Through the button: pause on the held end, then resume.
  const button = root.locator(":scope > .gc-controls .gc-button");
  await button.click();
  await expect(button).toHaveAttribute("aria-label", "Play demo");
  before = await mounts(page);
  await button.click();
  await expect(button).toHaveAttribute("aria-label", "Pause demo");
  await expectRestarted(page, root, before);
});

test("onEnd ignores resets mid-take and scrubbing", async ({ page }) => {
  const { root, inside, outside } = await open(page, "?delay=300");
  await expect.poll(async () => parseFloat((await time(root)) ?? "0"), { timeout: 5000 }).toBeGreaterThanOrEqual(1.5);

  // The reader clicks mid-take and leaves: the take resets without reaching its end.
  let before = await mounts(page);
  await page.mouse.move(inside.x, inside.y);
  await page.mouse.down();
  await page.mouse.up();
  await page.mouse.move(outside.x, outside.y);
  await expectRestarted(page, root, before);
  expect(await ends(page)).toBe(0);

  // One drag: onto the end, back to the middle, onto the end again, and let go there.
  // Past the right edge the scrubber clamps to the exact end.
  const scrubber = (await root.locator(':scope > .gc-controls [role="slider"]').boundingBox())!;
  const y = scrubber.y + scrubber.height / 2;
  const pastEnd = scrubber.x + scrubber.width + 20;
  await page.mouse.move(scrubber.x + 2, y);
  await page.mouse.down();
  await page.mouse.move(pastEnd, y, { steps: 5 });
  await page.waitForTimeout(500);
  expect(await ends(page)).toBe(0);
  await page.mouse.move(scrubber.x + scrubber.width * 0.3, y, { steps: 5 });
  await page.waitForTimeout(200);
  await page.mouse.move(pastEnd, y, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  expect(await ends(page)).toBe(0);

  // The run after that plays through and counts.
  await page.mouse.move(outside.x, outside.y);
  await expect.poll(() => ends(page), { timeout: 12_000 }).toBe(1);
});

test("a loop reset under a resting pointer is not a new arrival", async ({ playwright }, info) => {
  // Current Chromium remembers the removed node's parent, so a remount doesn't fire pointerenter on the
  // stage again. Older Chrome did; this flag brings that back so the test catches the regression.
  const browser = await playwright.chromium.launch({
    args: ["--disable-blink-features=BoundaryEventDispatchTracksNodeRemoval"],
  });
  try {
    const { baseURL, viewport } = info.project.use;
    const page = await browser.newPage({ baseURL, viewport });
    const { root, inside } = await open(page, "?delay=300");
    await page.mouse.move(inside.x, inside.y);
    await expect(root).toHaveAttribute("data-handoff", "true");

    // Tab into the demo and back out: the focus handoff ends with the pointer still inside.
    await page.getByTestId("before").focus();
    await page.keyboard.press("Tab");
    await expect(root.locator('[data-ghost-id="sort-trigger"]')).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(root).not.toHaveAttribute("data-handoff", { timeout: 2000 });
    await expectAdvancing(root);

    // Wait out a loop reset, then move a little inside the box.
    const before = await mounts(page);
    await expect.poll(() => mounts(page), { timeout: 12_000 }).toBeGreaterThan(before);
    for (const dx of [1, 2, 3]) {
      await page.mouse.move(inside.x + dx, inside.y);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
    await expect(root).not.toHaveAttribute("data-handoff");
    expect(await ghostOpacity(root)).toBe(1);
    await expectAdvancing(root);
  } finally {
    await browser.close();
  }
});
