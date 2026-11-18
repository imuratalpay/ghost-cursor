import { expect, test, type Locator, type Page } from "@playwright/test";

/*
 * The home demo's take ends in a different state than it starts ("A to Z" instead of
 * "Newest"), so every loop resets the component behind an exit fade and an entry fade.
 * These tests interrupt that reset.
 */

type Fade = "exit" | "entry";

async function open(page: Page) {
  await page.goto("/");
  const root = page.locator(".gc-root").first();
  await root.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  const stage = (await root.locator(".gc-stage").boundingBox())!;
  const inside = { x: stage.x + stage.width * 0.15, y: stage.y + stage.height * 0.85 };
  const outside = { x: inside.x, y: stage.y - 60 };
  await page.mouse.move(outside.x, outside.y);
  return { root, inside, outside };
}

/** Resolves on the first frame where an opacity fade of that kind runs on the content. */
function waitForFade(root: Locator, kind: Fade) {
  return root.evaluate(
    (el, kind) =>
      new Promise<void>((resolve) => {
        const content = el.querySelector(".gc-content")!;
        const check = () => {
          const running = content.getAnimations().some((a) => {
            const [from, to] = (a.effect as KeyframeEffect).getKeyframes();
            const opacity = [Number(from?.opacity), Number(to?.opacity)];
            return a.playState === "running" && (kind === "exit" ? opacity[0] > opacity[1] : opacity[0] < opacity[1]);
          });
          if (running) resolve();
          else requestAnimationFrame(check);
        };
        check();
      }),
    kind,
  );
}

function content(root: Locator) {
  return root.evaluate((el) => {
    const c = el.querySelector(".gc-content")!;
    return {
      opacity: Number(getComputedStyle(c).opacity),
      fades: c.getAnimations().length,
      mounted: (el.querySelector(".gc-frame")?.childElementCount ?? 0) > 0,
    };
  });
}

const time = (root: Locator) => root.locator(":scope > .gc-controls .gc-time").textContent();
const ghostOpacity = (root: Locator) =>
  root.locator(".gc-arrow").evaluate((el) => Number(getComputedStyle(el).opacity));

/** After a handoff ends, the take is visible and moving again. */
async function expectPlaying(root: Locator) {
  await expect.poll(() => content(root), { timeout: 4000 }).toMatchObject({ opacity: 1, fades: 0, mounted: true });
  await expect.poll(() => ghostOpacity(root), { timeout: 4000 }).toBe(1);
  const before = await time(root);
  await expect.poll(() => time(root), { timeout: 3000 }).not.toBe(before);
}

test("a loop reset leaves the component visible", async ({ page }) => {
  const { root } = await open(page);
  await waitForFade(root, "exit");
  // Once the reset is over, nothing may still hold the content at opacity 0.
  await expect.poll(() => content(root), { timeout: 3000 }).toMatchObject({ opacity: 1, fades: 0, mounted: true });
  await expectPlaying(root);
});

for (const kind of ["exit", "entry"] as const) {
  test(`entering during the ${kind} fade snaps the component back`, async ({ page }) => {
    const { root, inside, outside } = await open(page);
    await waitForFade(root, kind);
    await page.mouse.move(inside.x, inside.y);
    // The reader gets the first frame at full opacity at once, not after the fade.
    expect(await content(root)).toEqual({ opacity: 1, fades: 0, mounted: true });
    expect(await time(root)).toBe("0.0s");
    await page.mouse.move(outside.x, outside.y);
    await expectPlaying(root);
  });
}

test("quick in and out across the reset keeps playing", async ({ page }) => {
  const { root, inside, outside } = await open(page);
  await waitForFade(root, "exit");
  for (const pause of [30, 60, 20]) {
    await page.mouse.move(inside.x, inside.y);
    await page.waitForTimeout(pause);
    await page.mouse.move(outside.x, outside.y);
    await page.waitForTimeout(pause);
  }
  await expectPlaying(root);
});

test("clicking during the handoff, then leaving, resets to a visible first frame", async ({ page }) => {
  const { root, inside, outside } = await open(page);
  await waitForFade(root, "exit");
  await page.mouse.move(inside.x, inside.y);
  await page.mouse.down();
  await page.mouse.up();
  await page.mouse.move(outside.x, outside.y);
  // Leaving after a click starts a fresh reset; interrupt that one too.
  await waitForFade(root, "exit");
  await page.mouse.move(inside.x, inside.y);
  expect(await content(root)).toEqual({ opacity: 1, fades: 0, mounted: true });
  await page.mouse.move(outside.x, outside.y);
  await expectPlaying(root);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("resets without fades and comes back to a visible first frame", async ({ page }) => {
    const { root, inside, outside } = await open(page);
    await page.evaluate(() => {
      const w = window as unknown as { __fades: number };
      w.__fades = 0;
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        if (this.classList.contains("gc-content")) w.__fades++;
        return animate.apply(this, args);
      };
    });
    await root.getByRole("button", { name: "Play" }).click();
    await page.mouse.move(inside.x, inside.y);
    await page.waitForTimeout(150);
    await page.mouse.move(outside.x, outside.y);
    // The take plays once, then returns to the first frame and the Play button.
    await expect(root.getByRole("button", { name: "Play" })).toBeVisible({ timeout: 15_000 });
    expect(await content(root)).toEqual({ opacity: 1, fades: 0, mounted: true });
    expect(await time(root)).toBe("0.0s");
    expect(await page.evaluate(() => (window as unknown as { __fades: number }).__fades)).toBe(0);
  });
});
