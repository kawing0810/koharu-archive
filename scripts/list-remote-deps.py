from pathlib import Path
import json
import re

ROOT = Path(r"D:\koharu-archive")
posts = json.loads((ROOT / "src/data/posts.json").read_text(encoding="utf-8"))
club = json.loads((ROOT / "src/data/club.json").read_text(encoding="utf-8"))

http_media = 0
local_media = 0
thumb_http = 0
hosts = {}
share = 0
fans_remote = 0

for p in posts:
    if p.get("shareUrl"):
        share += 1
    for fan in p.get("topFans") or []:
        av = fan.get("avatar") or ""
        if av.startswith("http"):
            fans_remote += 1
    for m in p.get("media") or []:
        for key in ("src", "thumbnail"):
            u = m.get(key) or ""
            if not u:
                continue
            if u.startswith("http"):
                if key == "thumbnail":
                    thumb_http += 1
                else:
                    http_media += 1
                h = re.match(r"https?://([^/]+)", u)
                if h:
                    hosts[h.group(1)] = hosts.get(h.group(1), 0) + 1
            elif u.startswith("/media/") or u.startswith("/"):
                local_media += 1

print("media_src_http", http_media)
print("media_thumb_http", thumb_http)
print("media_localish", local_media)
print("shareUrl_count", share)
print("topFans_remote_avatars", fans_remote)
print("hosts", hosts)
for k, v in club.items():
    if isinstance(v, str) and ("http" in v or v.startswith("/")):
        print("club", k, "=", v[:140])

for f in (ROOT / "src/data").glob("*.json"):
    if f.name == "posts.json":
        continue
    text = f.read_text(encoding="utf-8")
    urls = sorted(set(re.findall(r"https?://[^\"\\s]+", text)))
    print(f.name, "urls", len(urls))
    for u in urls[:12]:
        print(" ", u[:140])
