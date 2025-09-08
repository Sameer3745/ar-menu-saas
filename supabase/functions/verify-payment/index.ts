 // supabase/functions/verify-payment/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import * as crypto from "https://deno.land/std@0.177.0/node/crypto.ts";

serve(async (req) => {
  // ✅ CORS preflight handling
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing parameters" }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const key_id = Deno.env.get("RAZORPAY_KEY_ID");
    const key_secret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!key_id || !key_secret) {
      return new Response(
        JSON.stringify({ success: false, error: "Razorpay keys not set" }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // 🔹 Local signature verification
    const hmac = crypto.createHmac("sha256", key_secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest("hex");

    if (generated_signature !== razorpay_signature) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid signature" }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // 🔹 Capture payment on Razorpay server
    const auth = btoa(`${key_id}:${key_secret}`);
    const captureRes = await fetch(
      `https://api.razorpay.com/v1/payments/${razorpay_payment_id}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: Number(amount) }),
      }
    );

    const captureData = await captureRes.json();

    if (!captureRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: captureData }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // ✅ Payment verified & captured successfully
    return new Response(
      JSON.stringify({ success: true, data: captureData }),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
});
