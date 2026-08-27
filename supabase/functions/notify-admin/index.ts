// ================================================================== //
//  Supabase Edge Function: notify-admin                               //
//                                                                     //
//  Triggered by the `trg_bookings_notify` DB webhook whenever a new   //
//  website booking lands in the bookings table. Sends a Telegram      //
//  message to all registered admin chat IDs via Bot API.              //
//                                                                     //
//  Secrets (set with `supabase secrets set`):                         //
//    TELEGRAM_BOT_TOKEN — your Telegram bot token                     //
//                                                                     //
//  Deploy: supabase functions deploy notify-admin --no-verify-jwt     //
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

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return json({ error: "POST only" }, 405, corsHeaders);
    }

    const payload = (await req.json()) as BookingPayload;
    const booking = payload.record;
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    if (!botToken) {
      return json({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" }, 500, corsHeaders);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [{ data: customer }, { data: vehicle }] = await Promise.all([
      supabase.from("customers").select("name, phone").eq("id", booking.customer_id).single(),
      supabase.from("vehicles").select("name").eq("id", booking.vehicle_id).single(),
    ]);

    const { data: devices, error: devErr } = await supabase
      .from("notification_devices")
      .select("fcm_token, label");

    if (!devices || devices.length === 0) {
      return json({ ok: true, sent: 0, note: "no admin devices registered" }, 200, corsHeaders);
    }

    const when = new Date(booking.pickup_at).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });

    const name = customer?.name ?? "A customer";
    const vehicleName = vehicle?.name ?? "a cab";
    const phone = customer?.phone ?? "N/A";
    const fare = booking.fare ? `₹${booking.fare}` : "TBD";

    const text =
      `🚗 *New Booking*\n\n` +
      `*${name}* (${phone})\n` +
      `Booked *${vehicleName}*\n\n` +
      `📍 Pickup: ${booking.pickup}\n` +
      `📍 Drop: ${booking.dropoff}\n` +
      `📅 ${when}\n` +
      `💰 Fare: ${fare}\n` +
      `🆔 #${booking.id}`;

    const chatIds = devices.map((d) => d.fcm_token);

    const results = await Promise.allSettled(
      chatIds.map((chatId) =>
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "Markdown",
          }),
        }).then(async (r) => {
          if (!r.ok) throw new Error(`Telegram ${r.status}: ${await r.text()}`);
          return chatId;
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason?.message ?? "unknown");

    if (failed.length) console.error("[notify-admin] failures:", failed);

    return json({ ok: true, sent, failed: failed.length }, 200, corsHeaders);
  } catch (err) {
    console.error("[notify-admin]", err);
    return json({ ok: false, error: String(err) }, 500, corsHeaders);
  }
});

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
