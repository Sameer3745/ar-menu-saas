 import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Subscriptions() {
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  async function fetchSubscriptionData() {
    setLoading(true);
    setErrorMsg("");
    const user = supabase.auth.user();
    if (!user) {
      setErrorMsg("User not logged in");
      setLoading(false);
      return;
    }

    try {
      // Fetch current subscription
      let { data: subsData, error: subsError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("expiry_date", { ascending: false })
        .limit(1)
        .single();

      if (subsError && subsError.code !== "PGRST116") throw subsError;

      setSubscription(subsData || null);

      // Fetch payments
      let { data: payData, error: payError } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("payment_date", { ascending: false });

      if (payError) throw payError;

      setPayments(payData || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-3xl font-bold mb-6">Subscription</h1>

      {loading && <p>Loading subscription details...</p>}
      {errorMsg && <p className="text-red-600">{errorMsg}</p>}

      {!loading && !errorMsg && (
        <>
          {subscription ? (
            <div className="mb-8">
              <p>
                <strong>Plan:</strong> {subscription.plan || "-"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`font-semibold ${
                    subscription.status === "active"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {subscription.status}
                </span>
              </p>
              <p>
                <strong>Expires on:</strong>{" "}
                {subscription.expiry_date
                  ? new Date(subscription.expiry_date).toLocaleDateString("en-IN")
                  : "-"}
              </p>
              <p>
                <strong>Price:</strong> ₹{subscription.price?.toFixed(2) || "-"}
              </p>
            </div>
          ) : (
            <p>No active subscription found.</p>
          )}

          <h2 className="text-2xl font-semibold mb-4">Payment History</h2>
          {payments.length === 0 ? (
            <p>No payment records found.</p>
          ) : (
            <table className="w-full border border-gray-200 rounded">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Amount</th>
                  <th className="p-2 border">Method</th>
                  <th className="p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-gray-50">
                    <td className="p-2 border">
                      {new Date(pay.payment_date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-2 border">₹{pay.amount?.toFixed(2)}</td>
                    <td className="p-2 border">{pay.method || "-"}</td>
                    <td className="p-2 border">{pay.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
