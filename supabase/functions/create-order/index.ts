 import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Razorpay from "npm:razorpay";

const razorpay = new Razorpay({
  key_id: Deno.env.get("RAZORPAY_KEY_ID")!,
  key_secret: Deno.env.get("RAZORPAY_KEY_SECRET")!
});

serve(async (req) => {
  const { amount } = await req.json(); // frontend se amount milega

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Rs to paise
      currency: "INR",
      receipt: `order_rcpt_${Date.now()}`
    });
    return new Response(JSON.stringify(order), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
