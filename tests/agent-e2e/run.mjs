// Agent end-to-end test. An agent gets only the docs URL and one sentence, in a fresh Next.js app
// that has the packed ghost-cursor tarball and one sample component. The harness then checks the
// result itself. Nothing here tells the agent what to do; if a run fails, fix the docs, not this file.
//
//   node tests/agent-e2e/run.mjs [--agent claude|scripted] [--intents A,B] [--runs 3] [--docs <url>]
//
// --agent claude (default) runs `claude -p`, which needs Claude Code to be logged in.
// --agent scripted runs the commands /docs/agents.md documents, to check the docs and this harness
// without a model. It proves the steps work; only --agent claude proves an agent finds them.
import { execSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const { values } = parseArgs({
  options: {
    agent: { type: "string", default: "claude" },
    intents: { type: "string", default: "A,B" },
    runs: { type: "string", default: "3" },
    docs: { type: "string" },
    keep: { type: "boolean", default: false },
  },
});

const REPO = resolve(import.meta.dirname, "../..");
const SITE = join(REPO, "apps/site");
const WORK = join(tmpdir(), "ghost-cursor-agent-e2e");
const RESULTS = join(REPO, "tests/agent-e2e/results", new Date().toISOString().replace(/[:.]/g, "-"));
const DOCS_PORT = 4100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

const PROMPTS = {
  A: (docs) =>
    `Docs: ${docs} — record this component's interaction: components/like-share.tsx, like it, then open Share and pick Copy link.`,
  B: (docs) => `Docs: ${docs} — open the record toolbar for components/like-share.tsx.`,
};

// ---------- processes ----------

const children = new Set();
function start(cmd, args, opts) {
  const child = spawn(cmd, args, { detached: true, stdio: ["ignore", "pipe", "pipe"], ...opts });
  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}
function stop(child) {
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {}
}
function killUnder(dir) {
  try {
    execSync(`pkill -f ${JSON.stringify(dir)}`, { stdio: "ignore" });
  } catch {}
}
process.on("exit", () => children.forEach(stop));

async function waitFor(url, ms = 120_000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (res.status < 500) return true;
    } catch {}
    await sleep(500);
  }
  return false;
}

function sh(cmd, cwd, timeout = 600_000) {
  return execSync(cmd, { cwd, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", timeout, env: { ...process.env, CI: "1" } });
}

// ---------- docs site and fresh app ----------

async function docsSite() {
  if (values.docs) return values.docs;
  const base = `http://localhost:${DOCS_PORT}`;
  if (!(await waitFor(`${base}/llms.txt`, 1500))) {
    log("building the docs site…");
    sh("npm run build", REPO, 900_000);
    start("npx", ["next", "start", "-p", String(DOCS_PORT)], { cwd: SITE });
    if (!(await waitFor(`${base}/llms.txt`))) throw new Error("the docs site didn't start");
  }
  return `${base}/docs`;
}

async function template() {
  const dir = join(WORK, "template");
  if (existsSync(join(dir, "node_modules/@imuratalpay/ghost-cursor"))) return dir;
  await rm(dir, { recursive: true, force: true });
  await mkdir(WORK, { recursive: true });
  log("creating a fresh Next.js app…");
  sh(
    "npx -y create-next-app@16.4.6 template --ts --tailwind --app --eslint --no-src-dir --import-alias '@/*' --use-npm --yes --disable-git --skip-install",
    WORK,
  );
  sh("npm install", dir);
  log("installing the packed tarball…");
  const tgz = join(SITE, "public/ghost-cursor.tgz");
  if (!existsSync(tgz)) throw new Error("apps/site/public/ghost-cursor.tgz is missing; run npm run build first");
  await cp(tgz, join(dir, "ghost-cursor.tgz"));
  sh("npm i ./ghost-cursor.tgz motion", dir);
  await mkdir(join(dir, "components"), { recursive: true });
  await cp(join(REPO, "tests/agent-e2e/fixtures/like-share.tsx"), join(dir, "components/like-share.tsx"));
  await writeFile(
    join(dir, "app/page.tsx"),
    `import { LikeShare } from "@/components/like-share";

export default function Home() {
  return (
    <main style={{ padding: 48 }}>
      <h1>Sample app</h1>
      <LikeShare />
    </main>
  );
}
`,
  );
  sh("npx next build", dir);
  return dir;
}

async function fresh(name) {
  const tpl = await template();
  const dir = join(WORK, name);
  await rm(dir, { recursive: true, force: true });
  // Copy-on-write clone on APFS; falls back to a plain copy elsewhere.
  try {
    sh(`cp -Rc ${JSON.stringify(tpl)} ${JSON.stringify(dir)}`, WORK);
  } catch {
    await cp(tpl, dir, { recursive: true });
  }
  await rm(join(dir, ".next"), { recursive: true, force: true });
  return dir;
}

// ---------- agents ----------

function summarize(events) {
  const steps = [];
  for (const e of events) {
    if (e.type !== "assistant") continue;
    for (const block of e.message?.content ?? []) {
      if (block.type !== "tool_use") continue;
      const i = block.input ?? {};
      const what =
        i.command ?? i.url ?? i.file_path ?? i.pattern ?? i.path ?? JSON.stringify(i).slice(0, 120);
      steps.push(`${block.name}: ${String(what).replace(/\s+/g, " ").slice(0, 180)}`);
    }
  }
  return steps;
}

async function runClaude(dir, prompt, out) {
  const child = start(
    "claude",
    ["-p", prompt, "--output-format", "stream-json", "--verbose", "--dangerously-skip-permissions", "--max-turns", "80"],
    { cwd: dir },
  );
  let raw = "";
  child.stdout.on("data", (d) => (raw += d));
  child.stderr.on("data", (d) => (raw += d));
  const code = await Promise.race([
    new Promise((r) => child.on("exit", r)),
    sleep(25 * 60_000).then(() => (stop(child), "timeout")),
  ]);
  await writeFile(out, raw);
  const events = raw
    .split("\n")
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const final = events.findLast((e) => e.type === "result");
  return { code, steps: summarize(events), final: final?.result ?? raw.slice(-400) };
}

/** The commands /docs/agents.md documents, run in order. A stand-in for a model. */
async function runScripted(dir, intent, docs, out) {
  const origin = new URL(docs).origin;
  const steps = [];
  let transcript = "";
  const run = (cmd) => {
    steps.push(`Bash: ${cmd}`);
    try {
      const output = sh(cmd, dir, 900_000);
      transcript += `$ ${cmd}\n${output}\n`;
      return output;
    } catch (e) {
      transcript += `$ ${cmd}\n${e.stdout ?? ""}${e.stderr ?? ""}\n`;
      throw Object.assign(new Error(`${cmd} failed`), { steps, transcript });
    }
  };
  const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
  if (!pkg.dependencies?.["@imuratalpay/ghost-cursor"]) run(`npm i ${origin}/ghost-cursor.tgz motion`);
  const css = join(dir, "app/globals.css");
  const globals = await readFile(css, "utf8");
  if (!globals.includes("ghost-cursor/styles.css")) {
    steps.push("Edit: app/globals.css (stylesheet in the components layer)");
    await writeFile(
      css,
      globals.replace('@import "tailwindcss";', '@import "tailwindcss";\n@import "@imuratalpay/ghost-cursor/styles.css" layer(components);'),
    );
  }
  let output = "";
  if (intent === "A") {
    run("npm i -D playwright && npx playwright install chromium");
    run("mkdir -p .claude/skills/ghost-record/scripts");
    run(`curl -fsSL ${origin}/skills/ghost-record/SKILL.md -o .claude/skills/ghost-record/SKILL.md`);
    run(`curl -fsSL ${origin}/skills/ghost-record/scripts/ghost-record.mjs -o .claude/skills/ghost-record/scripts/ghost-record.mjs`);
    output = run(
      "node .claude/skills/ghost-record/scripts/ghost-record.mjs --component components/like-share.tsx#LikeShare 'click role=button[name=Like]' 'click role=button[name=Share]' 'click text=Copy link'",
    );
  } else {
    const page = join(dir, "app/page.tsx");
    const src = await readFile(page, "utf8");
    steps.push("Edit: app/page.tsx (wrap <LikeShare /> in <DevRecorder>)");
    await writeFile(
      page,
      `import { DevRecorder } from "@imuratalpay/ghost-cursor";\n` +
        src.replace("<LikeShare />", "<DevRecorder style={{ height: 320 }}>\n        <LikeShare />\n      </DevRecorder>"),
    );
    output = run("npm run build");
  }
  await writeFile(out, transcript);
  return { code: 0, steps, final: output.trim().split("\n").slice(-12).join("\n") };
}

// ---------- checks ----------

const SIGNATURE = (root) => {
  const SKIP = /^(style|id|class|for|data-ghost-.*|data-motion-.*|aria-(controls|labelledby|describedby|activedescendant))$/;
  let out = "";
  const walk = (n) => {
    if (n.nodeType === 3) return void (out += n.textContent.trim());
    if (!(n instanceof Element)) return;
    out += `<${n.tagName.toLowerCase()}`;
    for (const a of n.attributes) if (!SKIP.test(a.name)) out += ` ${a.name}="${a.value}"`;
    out += ">";
    n.childNodes.forEach(walk);
    out += `</${n.tagName.toLowerCase()}>`;
  };
  root.childNodes.forEach(walk);
  return out;
};

async function devServer(dir, port) {
  killUnder(dir);
  await rm(join(dir, ".next/dev"), { recursive: true, force: true });
  const child = start("npx", ["next", "dev", "--port", String(port)], { cwd: dir });
  if (!(await waitFor(`http://localhost:${port}/`))) throw new Error("next dev didn't start");
  return child;
}

async function routes(dir) {
  const app = join(dir, "app");
  const found = [];
  const walk = async (d) => {
    for (const e of await readdir(d, { withFileTypes: true })) {
      if (e.isDirectory() && !e.name.startsWith("e2e-check")) await walk(join(d, e.name));
      else if (/^page\.(tsx|jsx|ts|js)$/.test(e.name)) {
        const segs = relative(app, d).split("/").filter((s) => s && !/^\(.*\)$/.test(s));
        if (!segs.some((s) => s.startsWith("["))) found.push("/" + segs.join("/"));
      }
    }
  };
  await walk(app);
  return found;
}

async function newestTake(dir, since) {
  const takes = [];
  const walk = async (d) => {
    for (const e of await readdir(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith(".git")) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.name.endsWith(".json") && (await stat(p)).mtimeMs >= since) {
        try {
          const j = JSON.parse(await readFile(p, "utf8"));
          if (j.v === 1 && Array.isArray(j.events) && j.events.length > 1) takes.push(p);
        } catch {}
      }
    }
  };
  await walk(dir);
  return takes.at(-1) ?? null;
}

/** A: a take exists, and replaying it ends where a live run of the same actions ends. */
async function checkA(dir, browser, since) {
  const take = await newestTake(dir, since);
  if (!take) return { pass: false, why: "no take file was written" };
  const json = JSON.parse(await readFile(take, "utf8"));
  const presses = json.events.filter((e) => e[1] === "d").length;
  const check = join(dir, "app/e2e-check");
  await mkdir(check, { recursive: true });
  await writeFile(
    join(check, "page.tsx"),
    `import { GhostReplay } from "@imuratalpay/ghost-cursor";
import "@imuratalpay/ghost-cursor/styles.css";
import { LikeShare } from "@/components/like-share";
import take from "${relative(check, take).split("\\").join("/")}";

export default function Check() {
  return (
    <main style={{ maxWidth: 680, margin: "48px auto" }}>
      <GhostReplay recording={take} style={{ height: 320 }}><LikeShare /></GhostReplay>
      <div id="live"><LikeShare /></div>
    </main>
  );
}
`,
  );
  const server = await devServer(dir, 4300);
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await page.goto("http://localhost:4300/e2e-check");
    // Ground truth: the requested actions, done directly on a second copy of the component.
    const live = page.locator("#live");
    await live.getByRole("button", { name: /like/i }).click();
    await live.getByRole("button", { name: "Share" }).click();
    await live.getByRole("menuitem", { name: "Copy link" }).click();
    await sleep(300);
    const expected = await live.evaluate(SIGNATURE);
    const slider = page.locator('.gc-root .gc-controls [role="slider"]');
    await slider.waitFor({ timeout: 60_000 });
    const max = await slider.getAttribute("aria-valuemax");
    const deadline = Date.now() + 60_000;
    while ((await slider.getAttribute("aria-valuenow")) !== max) {
      if (Date.now() > deadline) return { pass: false, why: "the replay never reached its end", take };
      await sleep(40);
    }
    await sleep(700);
    const replayed = await page.locator(".gc-frame").evaluate(SIGNATURE);
    const pass = replayed === expected;
    return {
      pass,
      take: relative(dir, take),
      why: pass ? `replays to the live end state (${presses} presses, ${max}s)` : `end states differ\n  live:   ${expected}\n  replay: ${replayed}`,
    };
  } finally {
    await page.close();
    stop(server);
    killUnder(dir);
    await rm(check, { recursive: true, force: true });
  }
}

/** B: the toolbar shows in next dev, a production build passes, and the build has no toolbar. */
async function checkB(dir, browser) {
  const paths = await routes(dir);
  const inspect = async (base) => {
    const seen = {};
    for (const p of paths) {
      const page = await browser.newPage();
      await page.goto(base + p, { timeout: 120_000 }).catch(() => {});
      const toolbar = await page
        .locator(".gc-recorder")
        .first()
        .waitFor({ timeout: 20_000 })
        .then(() => true)
        .catch(() => false);
      const component = await page.getByRole("button", { name: "Share" }).count();
      seen[p] = { toolbar, component: component > 0 };
      await page.close();
    }
    return seen;
  };
  const dev = await devServer(dir, 4301);
  const inDev = await inspect("http://localhost:4301");
  stop(dev);
  killUnder(dir);
  try {
    sh("npx next build", dir, 900_000);
  } catch (e) {
    return { pass: false, why: `next build failed: ${String(e.stdout ?? e).slice(-400)}` };
  }
  const prod = start("npx", ["next", "start", "-p", "4302"], { cwd: dir });
  await waitFor("http://localhost:4302/");
  const inProd = await inspect("http://localhost:4302");
  stop(prod);
  killUnder(dir);
  const devRoutes = Object.keys(inDev).filter((p) => inDev[p].toolbar);
  const prodLeaks = Object.keys(inProd).filter((p) => inProd[p].toolbar);
  const prodComponent = Object.values(inProd).some((s) => s.component);
  const pass = devRoutes.length > 0 && prodLeaks.length === 0 && prodComponent;
  return {
    pass,
    why: pass
      ? `toolbar in dev on ${devRoutes.join(", ")}; production build has the component and no toolbar`
      : `dev toolbar on [${devRoutes}], prod toolbar on [${prodLeaks}], component in prod: ${prodComponent}`,
  };
}

// ---------- main ----------

const docs = await docsSite();
await mkdir(RESULTS, { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const intent of values.intents.split(",")) {
  for (let n = 1; n <= Number(values.runs); n++) {
    const name = `${intent}-${n}`;
    const dir = await fresh(name);
    const prompt = PROMPTS[intent](docs);
    log(`\n${name}: ${prompt}`);
    const since = Date.now();
    const transcript = join(RESULTS, `${name}.${values.agent === "claude" ? "jsonl" : "log"}`);
    let agent;
    try {
      agent = values.agent === "claude" ? await runClaude(dir, prompt, transcript) : await runScripted(dir, intent, docs, transcript);
    } catch (e) {
      agent = { code: 1, steps: e.steps ?? [], final: String(e.transcript ?? e.message ?? e).slice(-1500) };
      await writeFile(transcript, String(e.transcript ?? e.stack ?? e));
    }
    killUnder(dir);
    let check;
    try {
      check = intent === "A" ? await checkA(dir, browser, since) : await checkB(dir, browser);
    } catch (e) {
      check = { pass: false, why: `check crashed: ${e.message}` };
    }
    results.push({ name, prompt, ...check, steps: agent.steps, final: agent.final, transcript: relative(REPO, transcript) });
    log(`${check.pass ? "PASS" : "FAIL"}  ${name}  ${check.why}`);
    if (!values.keep) await rm(dir, { recursive: true, force: true });
  }
}
await browser.close();

const report = results
  .map(
    (r) =>
      `## ${r.name}: ${r.pass ? "PASS" : "FAIL"}\n\n${r.prompt}\n\n${r.why}${r.take ? `\n\nTake: ${r.take}` : ""}\n\nKey steps:\n${r.steps
        .map((s, i) => `${i + 1}. ${s}`)
        .join("\n")}${r.pass ? "" : `\n\nLast output:\n\n\`\`\`\n${r.final}\n\`\`\``}\n\nTranscript: ${r.transcript}\n`,
  )
  .join("\n");
await writeFile(join(RESULTS, "report.md"), `# Agent e2e (${values.agent})\n\n${report}`);
const passed = results.filter((r) => r.pass).length;
log(`\n${passed}/${results.length} passed · report: ${relative(REPO, join(RESULTS, "report.md"))}`);
process.exit(passed === results.length ? 0 : 1);
