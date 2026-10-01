import { spawn } from "node:child_process";
import { access, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "src", "app", "api");
const SUFFIX = ".staticbak";

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function listRouteFiles(dir, acc = []) {
  if (!(await exists(dir))) return acc;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await listRouteFiles(full, acc);
    else if (entry.name === "route.ts" || entry.name === "route.js") acc.push(full);
  }
  return acc;
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}`));
    });
  });
}

async function stashRoutes() {
  const files = await listRouteFiles(apiDir);
  const stashed = [];
  for (const file of files) {
    const dest = `${file}${SUFFIX}`;
    if (await exists(dest)) {
      throw new Error(`Already stashed: ${dest}`);
    }
    await rename(file, dest);
    stashed.push({ file, dest });
  }
  return stashed;
}

async function restoreRoutes(stashed) {
  for (const { file, dest } of [...stashed].reverse()) {
    if (await exists(dest)) await rename(dest, file);
  }
}

async function stripVideos(dir, acc = []) {
  if (!(await exists(dir))) return acc;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await stripVideos(full, acc);
      continue;
    }
    if (/\.(mp4|webm|mov|m4v)$/i.test(entry.name)) {
      await rm(full, { force: true });
      acc.push(full);
    }
  }
  return acc;
}

async function main() {
  // Drop stale .next/dev types that still point at API routes while they are stashed.
  await rm(path.join(root, ".next"), { recursive: true, force: true });

  const stashed = await stashRoutes();
  try {
    await run("npx", ["next", "build", "--webpack"], {
      STATIC_EXPORT: "1",
      BASE_PATH: process.env.BASE_PATH || "",
      NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH || "",
    });
    const removed = await stripVideos(path.join(root, "out"));
    console.log(`Stripped ${removed.length} video file(s) from out/ (Pages keeps images only).`);
  } finally {
    await restoreRoutes(stashed);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
