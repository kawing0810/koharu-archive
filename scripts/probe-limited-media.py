import json
import subprocess
import urllib.parse
from pathlib import Path

FAN = "04c686f0-fe41-47c7-8600-3d7cc530c86b"
API = "https://apiservice.dolfan.club/v0.1.1/guest-posts"
qs = urllib.parse.urlencode({"fanClubId": FAN, "device": "web"})
url = f"{API}?{qs}"
out = subprocess.check_output(["curl.exe", "-sS", url])
data = json.loads(out)
posts = data.get("data", {}).get("data", [])
Path(r"D:\koharu-archive\.tmp-guest-page0.json").write_text(
    json.dumps(posts, ensure_ascii=False, indent=2), encoding="utf-8"
)
for p in posts:
    if (p.get("status") or {}).get("action") == "subscribe":
        media = ((p.get("content") or {}).get("media") or [])
        print("id", p.get("id"))
        print("text", ((p.get("content") or {}).get("text") or "")[:60].encode("unicode_escape").decode())
        print("mediaCount", len(media))
        for m in media[:5]:
            print(" type", m.get("type"))
            print(" uri", m.get("uri"))
            print(" thumb", m.get("thumbnail"))
        break
else:
    print("no limited", len(posts))
