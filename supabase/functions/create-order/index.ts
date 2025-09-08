 import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Razorpay from "npm:razorpay";

const razorpay = new Razorpay({
  key_id: Deno.env.get("RAZORPAY_KEY_ID")!,
  key_secret: Deno.env.get("RAZORPAY_KEY_SECRET")!
});

serve(async (req) => {
  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*", // frontend allow
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization", // ✅ Authorization added
      },
    });
  }

  try {
    const { amount } = await req.json(); // frontend se amount milega

    const order = await razorpay.orders.create({
      amount: amount * 100, // Rs to paise
      currency: "INR",
      receipt: `order_rcpt_${Date.now()}`
    });

    return new Response(JSON.stringify(order), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // frontend allow
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
