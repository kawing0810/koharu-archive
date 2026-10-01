import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { Media, Post } from "@/types";

export const runtime = "nodejs";

function isDiskMedia(media: Media[]) {
  return media.every((item) => item.src.startsWith("/media/"));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { updates?: { id: string; media: Media[] }[] };
    const updates = body.updates ?? [];
    if (!updates.length) return NextResponse.json({ updated: 0 });

    const file = path.join(process.cwd(), "src/data/posts.json");
    const posts = JSON.parse(await readFile(file, "utf8")) as Post[];
    const map = new Map(posts.map((p) => [p.id, p]));
    let updated = 0;
    for (const item of updates) {
      if (!item.id || !Array.isArray(item.media) || !isDiskMedia(item.media)) continue;
      const prev = map.get(item.id);
      if (!prev) {
        map.set(item.id, {
          id: item.id,
          createdAt: "",
          limited: true,
          text: "",
          media: item.media,
        });
        updated += 1;
        continue;
      }
      map.set(item.id, { ...prev, media: item.media });
      updated += 1;
    }
    const next = [...map.values()].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    await writeFile(file, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    return NextResponse.json({ updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "寫入失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
