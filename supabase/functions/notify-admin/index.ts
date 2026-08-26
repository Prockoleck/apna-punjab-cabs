// ================================================================== //
//  Supabase Edge Function: notify-admin                               //
//                                                                     //
//  Triggered by the `trg_bookings_notify` DB webhook whenever a new   //
//  website booking lands in the bookings table. Reads every           //
//  registered admin device from `notification_devices` and pushes     //
//  via Firebase Cloud Messaging (HTTP v1).                            //
//                                                                     //
//  Secrets (set with `supabase secrets set`, NEVER in client code):   //
//    FIREBASE_PROJECT_ID   — your Firebase project id                 //
//    FIREBASE_CLIENT_EMAIL — service-account client email             //
//    FIREBASE_PRIVATE_KEY  — service-account private key              //
//                                                                     //
//  Deploy: supabase functions deploy notify-admin --no-verify-jwt     //
//  (the DB webhook call carries no user JWT)                          //
// ================================================================== //

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

interface BookingPayload {
  booking_id: string;
  record: {
    id: string;
    customer_id: string;
    vehicle_id: string;
    pickup: string;
    dropoff: string;
    pickup_at: string;
    source: string;
    fare: number;
  };
}

/* ---- minimal Google OAuth2 service-account token (no SDK needed) -- */

async function googleAccessToken(): Promise<string> {
  const projectId = Deno.env.get("FIREBASE_PROJECT_ID")!;
  const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
  const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY")!.replace(/\\n/g, "\n");

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claims = b64url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claims}`)
  );

  const jwt = `${header}.${claims}.${b64urlBytes(new Uint8Array(sig))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google OAuth failed: ${JSON.stringify(data)}`);
  void projectId;
  return data.access_token as string;
}

const b64url = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlBytes = (b: Uint8Array) =>
  btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function pemToDer(pem: string): ArrayBuffer {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

/* ------------------------------- handler --------------------------- */

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
    }

    const payload = (await req.json()) as BookingPayload;
    const booking = payload.record;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // server-side only
    );

    // denormalized context for the notification copy
    const [{ data: customer }, { data: vehicle }] = await Promise.all([
      supabase.from("customers").select("name, phone").eq("id", booking.customer_id).single(),
      supabase.from("vehicles").select("name").eq("id", booking.vehicle_id).single(),
    ]);

    const { data: devices } = await supabase
      .from("notification_devices")
      .select("fcm_token, label");

    if (!devices || devices.length === 0) {
      return json({ ok: true, sent: 0, note: "no admin devices registered" });
    }

    const when = new Date(booking.pickup_at).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });

    const title = "🚗 New Booking Received";
    const body = `${customer?.name ?? "A customer"} booked ${vehicle?.name ?? "a cab"}. Pickup: ${booking.pickup} → ${booking.dropoff} · ${when}`;
    const data = { booking_id: booking.id, click_action: `#/admin/bookings/${booking.id}` };

    const token = await googleAccessToken();
    const projectId = Deno.env.get("FIREBASE_PROJECT_ID")!;

    // one request per device; failures are collected, never fatal
    const results = await Promise.allSettled(
      devices.map((d) =>
        fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: {
              token: d.fcm_token,
              webpush: {
                headers: { TTL: "86400" },
                notification: { title, body, icon: "/icon-512.png", data, tag: `booking-${booking.id}`, renotify: true },
              },
              android: { priority: "high", notification: { title, body, tag: `booking-${booking.id}` } },
            },
          }),
        }).then(async (r) => {
          if (!r.ok) throw new Error(`FCM ${r.status}: ${await r.text()}`);
          return d.label;
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason?.message ?? "unknown");

    // log failures for retry/debug without failing the response
    if (failed.length) console.error("[notify-admin] failures:", failed);

    return json({ ok: true, sent, failed: failed.length });
  } catch (err) {
    console.error("[notify-admin]", err);
    return json({ ok: false, error: String(err) }, 500);
  }
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
