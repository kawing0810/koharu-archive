import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function extFrom(file: File) {
  const named = path.extname(file.name || "").toLowerCase();
  if (named) return named;
  if (file.type === "image/jpeg") return ".jpg";
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/gif") return ".gif";
  if (file.type.startsWith("video/")) return ".mp4";
  return ".bin";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "沒有檔案" }, { status: 400 });
    }
    const id = String(form.get("id") || crypto.randomUUID()).replace(/[^a-zA-Z0-9._-]/g, "");
    const ext = extFrom(file);
    const rel = `/media/limited/${id}${ext}`;
    const abs = path.join(process.cwd(), "public", "media", "limited", `${id}${ext}`);
    await mkdir(path.dirname(abs), { recursive: true });
    try {
      const existing = await stat(abs);
      if (existing.size > 0) return NextResponse.json({ src: rel, skipped: true });
    } catch {
      // not exists
    }
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(abs, buf);
    return NextResponse.json({ src: rel, bytes: buf.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "存檔失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
