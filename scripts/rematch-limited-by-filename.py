"""Match public/media/limited files back to limited posts via guest-API blur URI tokens."""

from __future__ import annotations

import json
import re
import subprocess
import urllib.parse
from pathlib import Path

ROOT = Path(r"D:\koharu-archive")
POSTS_PATH = ROOT / "src" / "data" / "posts.json"
LIMITED_DIR = ROOT / "public" / "media" / "limited"
FAN = "04c686f0-fe41-47c7-8600-3d7cc530c86b"
API = "https://apiservice.dolfan.club/v0.1.1/guest-posts"
TOKEN_RE = re.compile(r"/(image|video)_([A-Za-z0-9]+)")
FILE_RE = re.compile(r"^(image|video)_([A-Za-z0-9]+)")


def fetch_all_raw() -> list[dict]:
    posts: list[dict] = []
    cursor = ""
    for _ in range(80):
        qs = {"fanClubId": FAN, "device": "web"}
        if cursor:
            qs["nextCursor"] = cursor
        url = f"{API}?{urllib.parse.urlencode(qs)}"
        out = subprocess.check_output(["curl.exe", "-sS", url])
        data = json.loads(out)
        page = (data.get("data") or {}).get("data") or []
        if not page:
            break
        posts.extend(page)
        cursor = (data.get("data") or {}).get("nextCursor") or ""
        if not cursor:
            break
    return posts


def score_name(name: str) -> tuple[int, int, str]:
    # Prefer originals over Windows " (1)" copies; then shorter names.
    penalty = 1 if " (" in name else 0
    return (penalty, len(name), name)


def index_files() -> dict[str, list[str]]:
    idx: dict[str, list[str]] = {}
    for path in LIMITED_DIR.iterdir():
        if not path.is_file():
            continue
        m = FILE_RE.match(path.name)
        if not m:
            continue
        idx.setdefault(m.group(2), []).append(path.name)
    for token, names in idx.items():
        names.sort(key=score_name)
    return idx


def extract_token(media_item: dict) -> tuple[str | None, str]:
    kind = "image" if media_item.get("type") != "video" else "video"
    for key in ("uri", "thumbnail"):
        uri = media_item.get(key) or ""
        m = TOKEN_RE.search(uri)
        if m:
            return m.group(2), ("video" if m.group(1) == "video" else "image")
    return None, kind


def main() -> None:
    print("indexing limited files...")
    idx = index_files()
    print(f"tokens in folder: {len(idx)}")

    print("fetching guest posts...")
    raw_posts = fetch_all_raw()
    print(f"raw posts: {len(raw_posts)}")

    posts = json.loads(POSTS_PATH.read_text(encoding="utf-8"))
    by_id = {p["id"]: p for p in posts}

    rematched_posts = 0
    rematched_media = 0
    missing_media = 0
    used: set[str] = set()
    report: list[str] = []

    for raw in raw_posts:
        status = raw.get("status") or {}
        if status.get("action") != "subscribe":
            continue
        pid = str(raw.get("id"))
        post = by_id.get(pid)
        if not post:
            continue

        media_items = ((raw.get("content") or {}).get("media") or [])
        matched: list[dict] = []
        post_miss = 0

        for item in media_items:
            token, kind = extract_token(item)
            names = idx.get(token or "", [])
            chosen = None
            for name in names:
                if name not in used:
                    chosen = name
                    break
            if not chosen:
                post_miss += 1
                missing_media += 1
                continue
            used.add(chosen)
            matched.append(
                {
                    "type": kind,
                    "src": f"/media/limited/{chosen}",
                    "width": item.get("width") or None,
                    "height": item.get("height") or None,
                }
            )
            # drop null width/height
            if matched[-1]["width"] is None:
                del matched[-1]["width"]
            if matched[-1]["height"] is None:
                del matched[-1]["height"]

        post["mediaCount"] = len(media_items)
        if matched:
            # Prefer filename rematch over empty or UUID-only wrong binds when we found tokens.
            existing = post.get("media") or []
            existing_has_token_files = any(
                FILE_RE.search(Path(m.get("src", "")).name or "") for m in existing
            )
            if not existing or not existing_has_token_files or len(matched) >= len(existing):
                post["media"] = matched
                rematched_posts += 1
                rematched_media += len(matched)
                report.append(f"{pid}: +{len(matched)}/{len(media_items)} miss={post_miss}")

    POSTS_PATH.write_text(json.dumps(posts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    unused = sum(1 for names in idx.values() for n in names if n not in used)
    print(f"rematched posts: {rematched_posts}")
    print(f"rematched media: {rematched_media}")
    print(f"still missing slots: {missing_media}")
    print(f"unused token files: {unused}")
    print("--- sample ---")
    for line in report[:15]:
        print(line)
    (ROOT / ".tmp-rematch-report.txt").write_text("\n".join(report), encoding="utf-8")
    print(f"wrote {POSTS_PATH}")


if __name__ == "__main__":
    main()
