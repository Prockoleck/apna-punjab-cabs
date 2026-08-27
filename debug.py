import json, urllib.request

anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Z3Z2Znl3am1zcGJicWdscGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzM4OTgsImV4cCI6MjEwMzMwOTg5OH0.WYA6SVp_qxGfPwYUt5BuLKeyrw7Yzwr8k5E0dgklruA"
base = "https://qzgvvfywjmspbbqglpdx.supabase.co"

# Sign in
auth_data = json.dumps({"email": "admin@apnapunjabcabs.in", "password": "12345678"}).encode()
auth_req = urllib.request.Request(f"{base}/auth/v1/token?grant_type=password", data=auth_data, headers={"apikey": anon_key, "Content-Type": "application/json"})
auth_resp = json.loads(urllib.request.urlopen(auth_req, timeout=30).read())
token = auth_resp["access_token"]
rest = f"{base}/rest/v1"

# Check recent bookings - correct columns
req = urllib.request.Request(f"{rest}/bookings?select=id,customer_id,source,status,pickup_at,created_at&order=created_at.desc&limit=5", headers={"apikey": anon_key, "Authorization": f"Bearer {token}"})
resp = urllib.request.urlopen(req, timeout=10)
bookings = json.loads(resp.read())
print("Recent bookings:", len(bookings))
for b in bookings:
    print(f"  id={b['id']} cust={b['customer_id']} source={b['source']} status={b['status']} created={b['created_at']}")

# Check devices
req2 = urllib.request.Request(f"{rest}/notification_devices?select=id,fcm_token,label", headers={"apikey": anon_key, "Authorization": f"Bearer {token}"})
resp2 = urllib.request.urlopen(req2, timeout=10)
devices = json.loads(resp2.read())
print(f"\nDevices ({len(devices)}):")
for d in devices:
    print(f"  id={d['id']} label={d['label']} token={d['fcm_token']}")
