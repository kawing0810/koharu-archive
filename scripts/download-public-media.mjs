import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const REMOTE = /^https?:\/\//i;

function isRemote(url) {
  return typeof url === "string" && REMOTE.test(url) && !url.includes("-blur.");
}

function publicRelFromUrl(url) {
  try {
    const { pathname } = new URL(url);
    if (pathname.startsWith("/media/")) return pathname;
    return `/media/misc${pathname}`;
  } catch {
    return `/media/misc/${String(url).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80)}`;
  }
}

function publicAbs(rel) {
  return path.join(publicDir, ...rel.split("/").filter(Boolean));
}

function download(url) {
  const rel = publicRelFromUrl(url);
  const abs = publicAbs(rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  if (existsSync(abs) && statSync(abs).size > 0) return { rel, skipped: true };
  try {
    execFileSync("curl.exe", ["-sS", "-L", "--fail", "--retry", "2", "--connect-timeout", "20", "-o", abs, url], {
      stdio: "pipe",
      timeout: 300_000,
    });
    if (!existsSync(abs) || statSync(abs).size === 0) {
      if (existsSync(abs)) unlinkSync(abs);
      return { rel: url, error: true };
    }
    return { rel };
  } catch {
    if (existsSync(abs)) unlinkSync(abs);
    return { rel: url, error: true };
  }
}

function collectFromPosts(posts, into) {
  for (const post of posts) {
    if (post.limited) continue;
    for (const item of post.media ?? []) {
      if (isRemote(item.src)) into.add(item.src);
      if (isRemote(item.thumbnail)) into.add(item.thumbnail);
    }
  }
}

function rewriteMedia(posts, map) {
  return posts.map((post) => {
    if (post.limited) return post;
    return {
      ...post,
      media: (post.media ?? []).map((item) => ({
        ...item,
        src: map.get(item.src) ?? item.src,
        thumbnail: item.thumbnail ? map.get(item.thumbnail) ?? item.thumbnail : item.thumbnail,
      })),
    };
  });
}

const postsFile = path.join(root, "src/data/posts.json");
const clubFile = path.join(root, "src/data/club.json");
const productsFile = path.join(root, "src/data/products.json");

const posts = JSON.parse(readFileSync(postsFile, "utf8"));
const club = JSON.parse(readFileSync(clubFile, "utf8"));
const products = JSON.parse(readFileSync(productsFile, "utf8"));

const urls = new Set();
collectFromPosts(posts, urls);
if (isRemote(club.avatar)) urls.add(club.avatar);
if (isRemote(club.banner)) urls.add(club.banner);
for (const product of products) {
  if (isRemote(product.image)) urls.add(product.image);
}

const list = [...urls];
console.log(`downloading ${list.length} public files…`);
const map = new Map();
let ok = 0;
let skip = 0;
let fail = 0;
for (const [i, url] of list.entries()) {
  const result = download(url);
  if (result.error) {
    fail += 1;
    console.log(`[${i + 1}/${list.length}] FAIL ${url}`);
  } else {
    map.set(url, result.rel);
    if (result.skipped) skip += 1;
    else ok += 1;
    if ((i + 1) % 20 === 0 || i === list.length - 1) {
      console.log(`[${i + 1}/${list.length}] saved ${ok}, existed ${skip}, failed ${fail}`);
    }
  }
}

writeFileSync(postsFile, `${JSON.stringify(rewriteMedia(posts, map), null, 2)}\n`, "utf8");
writeFileSync(
  clubFile,
  `${JSON.stringify({ ...club, avatar: map.get(club.avatar) ?? club.avatar, banner: map.get(club.banner) ?? club.banner }, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  productsFile,
  `${JSON.stringify(
    products.map((product) => ({ ...product, image: map.get(product.image) ?? product.image })),
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`done. saved ${ok}, existed ${skip}, failed ${fail}`);
if (fail) process.exitCode = 1;
