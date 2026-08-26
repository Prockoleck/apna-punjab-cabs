import json, urllib.request
token = "8015251433:AAEOSI0RW7fTVmJvTvEgZ2SHy1XkVqf-SRw"
req = urllib.request.Request("https://api.telegram.org/bot" + token + "/getUpdates")
resp = urllib.request.urlopen(req, timeout=10)
data = json.loads(resp.read())
updates = data.get("result", [])
print("Updates:", len(updates))
for u in updates:
    msg = u.get("message", {})
    chat = msg.get("chat", {})
    cid = chat.get("id", "?")
    name = chat.get("first_name", "")
    text = msg.get("text", "")
    print(f"  chat_id={cid} name={name} text={text}")
