import { execFileSync, spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const FAN_CLUB_ID = "04c686f0-fe41-47c7-8600-3d7cc530c86b";
const API = "https://apiservice.dolfan.club/v0.1.1";

function getJson(url) {
  const out = execFileSync("curl.exe", ["-sS", url], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  return JSON.parse(out);
}

function mapPost(raw) {
  const limited = raw.status?.action === "subscribe";
  const media = (raw.content?.media ?? [])
    .filter((item) => item?.uri && !String(item.uri).includes("-blur."))
    .map((item) => ({
      type: item.type === "video" ? "video" : "image",
      src: item.uri,
      thumbnail: item.thumbnail,
      width: item.width,
      height: item.height,
    }));

  return {
    id: raw.id,
    createdAt: raw.createdAt,
    releasedAt: raw.releasedAt,
    limited,
    text: raw.content?.text ?? "",
    media: limited ? [] : media,
    likes: raw.likes?.count ?? 0,
    comments: raw.commentsCount ?? 0,
    mediaCount: (raw.content?.media ?? []).length,
    shareUrl: raw.shareUrl,
  };
}

async function main() {
  const all = [];
  let cursor = "";
  for (let i = 0; i < 200; i++) {
    const qs = new URLSearchParams({ fanClubId: FAN_CLUB_ID, device: "web" });
    if (cursor) qs.set("nextCursor", cursor);
    const json = getJson(`${API}/guest-posts?${qs}`);
    const page = json.data?.data ?? [];
    all.push(...page);
    cursor = json.data?.nextCursor;
    const unique = new Set(all.map((p) => p.id)).size;
    console.log(`page ${i + 1}: +${page.length}, total ${all.length}, unique ${unique}`);
    if (!cursor || !page.length || unique === all.length - page.length) break;
    await new Promise((r) => setTimeout(r, 250));
  }

  const seen = new Set();
  const posts = [];
  for (const raw of all) {
    if (seen.has(raw.id)) continue;
    seen.add(raw.id);
    posts.push(mapPost(raw));
  }
  const out = new URL("../src/data/posts.json", import.meta.url);
  await writeFile(out, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
  const limited = posts.filter((p) => p.limited).length;
  console.log(`saved ${posts.length} posts (${limited} limited placeholders)`);
  const downloader = fileURLToPath(new URL("./download-public-media.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [downloader], { stdio: "inherit" });
  if (result.status) process.exit(result.status);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
