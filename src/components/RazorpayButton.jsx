 // File: src/components/RazorpayButton.jsx
import React from "react";

export default function RazorpayButton({ amount }) {
  const handlePayment = async () => {
    try {
      // Supabase Edge Function URL (apne deploy ke baad replace karo)
      const FUNCTION_URL = "https://supabase.com/dashboard/project/blytpwngwldnveqylait/functions";

      // Create order via Supabase Edge Function
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });

      const orderData = await res.json();

      // Razorpay payment options
      const options = {
        key: "rzp_test_RCHw1ktAkLhWTr", // Replace with your Razorpay test key
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AR Menu SaaS",
        description: "Subscription Payment",
        order_id: orderData.id,
        handler: (response) => {
          alert(`Payment successful: ${response.razorpay_payment_id}`);
          // Yahan DB me payment info bhi save kar sakte ho
        },
        prefill: { name: "Customer Name", email: "customer@example.com" },
        theme: { color: "#4f46e5" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed. Check console for details.");
    }
  };

  return (
    <button
      onClick={handlePayment}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
    >
      Pay Now ₹{amount}
    </button>
  );
}
