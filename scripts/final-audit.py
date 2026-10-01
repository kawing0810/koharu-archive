import json
import re
import subprocess
import urllib.parse
from collections import defaultdict
from pathlib import Path

ROOT = Path(r"D:\koharu-archive")
POSTS = json.loads((ROOT / "src/data/posts.json").read_text(encoding="utf-8"))
FAN = "04c686f0-fe41-47c7-8600-3d7cc530c86b"
API = "https://apiservice.dolfan.club/v0.1.1/guest-posts"
TOKEN_RE = re.compile(r"/(image|video)_([A-Za-z0-9]+)")
FILE_RE = re.compile(r"^(image|video)_([A-Za-z0-9]+)")


def fetch_all():
    posts = []
    cursor = ""
    pages = 0
    while pages < 120:
        qs = {"fanClubId": FAN, "device": "web"}
        if cursor:
            qs["nextCursor"] = cursor
        url = f"{API}?{urllib.parse.urlencode(qs)}"
        data = json.loads(subprocess.check_output(["curl.exe", "-sS", "--max-time", "30", url]))
        page = (data.get("data") or {}).get("data") or []
        if not page:
            break
        posts.extend(page)
        pages += 1
        cursor = (data.get("data") or {}).get("nextCursor") or ""
        if not cursor:
            break
    return posts, pages


def disk_path(src: str) -> Path:
    return ROOT / "public" / src.lstrip("/")


def ready_count(post: dict) -> int:
    return sum(1 for m in (post.get("media") or []) if str(m.get("src") or "").startswith("/media/"))


print("fetching API...")
raw, pages = fetch_all()
local_ids = {p["id"] for p in POSTS}
api_ids = {str(p["id"]) for p in raw}
missing = [p for p in raw if str(p["id"]) not in local_ids]
extra = [p for p in POSTS if p["id"] not in api_ids]
print(f"API pages={pages} posts={len(raw)} unique={len(api_ids)}")
print(f"local={len(POSTS)} missing_posts={len(missing)} extra_posts={len(extra)}")
if raw:
    print("API range", min(p.get("createdAt") or "" for p in raw), "->", max(p.get("createdAt") or "" for p in raw))
if POSTS:
    print("local range", min(p.get("createdAt") or "" for p in POSTS), "->", max(p.get("createdAt") or "" for p in POSTS))
for p in missing:
    text = ((p.get("content") or {}).get("text") or "")[:80]
    print(" MISSING POST", p.get("createdAt"), text.encode("unicode_escape").decode())

lim = [p for p in POSTS if p.get("limited")]
pub = [p for p in POSTS if not p.get("limited")]
complete, partial, empty_need, text_only = [], [], [], []
broken_paths = []
idb_refs = 0
remote_refs = 0

for p in POSTS:
    for m in p.get("media") or []:
        src = str(m.get("src") or "")
        if src.startswith("idb:"):
            idb_refs += 1
        elif src.startswith("http"):
            remote_refs += 1
        elif src.startswith("/media/"):
            if not disk_path(src).exists():
                broken_paths.append((p["id"], p.get("createdAt"), src))

for p in lim:
    ready = ready_count(p)
    c = p.get("mediaCount")
    if c == 0:
        text_only.append(p)
    elif ready == 0 and (c or 0) > 0:
        empty_need.append(p)
    elif isinstance(c, int) and ready < c:
        partial.append(p)
    else:
        complete.append(p)

print("--- limited posts ---")
print(
    f"total={len(lim)} complete={len(complete)} partial={len(partial)} "
    f"empty={len(empty_need)} text_only={len(text_only)}"
)
print(f"idb_refs={idb_refs} remote_http_refs={remote_refs} broken_disk_paths={len(broken_paths)}")
for p in empty_need + partial:
    print(
        " NEED",
        p.get("createdAt"),
        f"{ready_count(p)}/{p.get('mediaCount')}",
        (p.get("text") or "")[:70].encode("unicode_escape").decode(),
    )
for item in broken_paths[:20]:
    print(" BROKEN", item)

print("--- public posts ---")
pub_remote = 0
pub_missing_disk = 0
for p in pub:
    for m in p.get("media") or []:
        src = str(m.get("src") or "")
        if src.startswith("http"):
            pub_remote += 1
        elif src.startswith("/media/") and not disk_path(src).exists():
            pub_missing_disk += 1
print(f"public_posts={len(pub)} remote_still={pub_remote} missing_disk={pub_missing_disk}")

by_id = {p["id"]: p for p in POSTS}
lim_dir = ROOT / "public/media/limited"
lim_files = [f for f in lim_dir.rglob("*") if f.is_file() and "_unused" not in f.parts]
idx: dict[str, list[str]] = {}
for f in lim_files:
    m = FILE_RE.match(f.name)
    if m:
        idx.setdefault(m.group(2), []).append(f.name)

api_slots = 0
local_ready_total = 0
miss_by_post: dict[str, list[tuple]] = defaultdict(list)
count_mismatch = []
for rawp in raw:
    if (rawp.get("status") or {}).get("action") != "subscribe":
        continue
    pid = str(rawp["id"])
    api_media = (rawp.get("content") or {}).get("media") or []
    api_n = len(api_media)
    api_slots += api_n
    loc = by_id.get(pid)
    if not loc:
        continue
    ready = ready_count(loc)
    local_ready_total += ready
    if loc.get("mediaCount") != api_n:
        count_mismatch.append((pid, loc.get("mediaCount"), api_n, loc.get("createdAt")))
    ready_names = {Path(m["src"]).name for m in (loc.get("media") or []) if str(m.get("src") or "").startswith("/media/")}
    for item in api_media:
        tok = None
        for u in [item.get("uri") or "", item.get("thumbnail") or ""]:
            mm = TOKEN_RE.search(u)
            if mm:
                tok = mm.group(2)
                break
        names = idx.get(tok or "", [])
        linked = any(n in ready_names for n in names)
        # date-named dumps may already fill the slot without token match
        if linked:
            continue
        if names:
            miss_by_post[pid].append((tok, "on_disk_unlinked", names[0]))
        else:
            # only count as missing if ready slots < api count (date files may cover)
            miss_by_post[pid].append((tok or "NO_TOKEN", "not_on_disk", ""))

# For posts that are already complete by ready_count, ignore token misses (date-named covers)
real_gaps = {}
for pid, items in miss_by_post.items():
    loc = by_id[pid]
    c = loc.get("mediaCount") or 0
    ready = ready_count(loc)
    if ready >= c and c > 0:
        continue
    # only keep not_on_disk items that explain the shortfall
    not_disk = [x for x in items if x[1] == "not_on_disk"]
    unlinked = [x for x in items if x[1] == "on_disk_unlinked"]
    short = max(0, c - ready)
    if short <= 0 and not unlinked:
        continue
    real_gaps[pid] = {"short": short, "not_disk": not_disk, "unlinked": unlinked, "post": loc}

print("--- gaps ---")
print(f"API limited slots={api_slots} local linked ready={local_ready_total}")
print(f"mediaCount mismatches={len(count_mismatch)}")
print(f"posts still short of media={len(real_gaps)}")
for pid, info in sorted(real_gaps.items(), key=lambda x: x[1]["post"].get("createdAt") or "", reverse=True):
    p = info["post"]
    print(
        f" GAP {p.get('createdAt')} have {ready_count(p)}/{p.get('mediaCount')} "
        f"not_on_disk={len(info['not_disk'])} unlinked={len(info['unlinked'])}"
    )
    print("  ", (p.get("text") or "")[:70].encode("unicode_escape").decode())
    for t in info["not_disk"][:5]:
        print("   missing token", t[0])
    for t in info["unlinked"][:5]:
        print("   unlinked", t[0], t[2])

pub_dir_files = [f for f in (ROOT / "public/media").rglob("*") if f.is_file() and "limited" not in f.parts]
unused = [f for f in (lim_dir / "_unused").rglob("*") if f.is_file()] if (lim_dir / "_unused").exists() else []
print("--- disk ---")
print(f"limited_active_files={len(lim_files)} public_files={len(pub_dir_files)} unused={len(unused)}")

# newest 5 local for sanity
print("--- newest 5 local ---")
for p in sorted(POSTS, key=lambda x: x.get("createdAt") or "", reverse=True)[:5]:
    print(p.get("createdAt"), "limited" if p.get("limited") else "public", ready_count(p), "/", p.get("mediaCount"), (p.get("text") or "")[:40].encode("unicode_escape").decode())
