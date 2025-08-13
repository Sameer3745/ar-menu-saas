 import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [popularDishes, setPopularDishes] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    setError("");

    try {
      // Total Orders and Revenue
      let { data: orders, error: errOrders } = await supabase
        .from("orders")
        .select("id, amount")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // last 30 days

      if (errOrders) throw errOrders;

      setTotalOrders(orders.length);
      setTotalRevenue(
        orders.reduce((sum, order) => sum + (order.amount || 0), 0)
      );

      // Popular dishes example (Assuming order_items table exists)
      const { data: popular, error: errPopular } = await supabase.rpc("get_popular_dishes", {
        days: 30,
      });

      if (errPopular) throw errPopular;

      setPopularDishes(popular || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>

      {loading && <p>Loading analytics...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded shadow">
              <p className="text-xl font-semibold">{totalOrders}</p>
              <p className="text-gray-600">Orders (Last 30 Days)</p>
            </div>
            <div className="bg-green-50 p-4 rounded shadow">
              <p className="text-xl font-semibold">₹{totalRevenue.toFixed(2)}</p>
              <p className="text-gray-600">Revenue (Last 30 Days)</p>
            </div>
            {/* Add more cards like avg order value, etc */}
          </div>

          <h2 className="text-2xl font-semibold mb-4">Popular Dishes</h2>
          {popularDishes.length === 0 ? (
            <p>No data</p>
          ) : (
            <ul className="list-disc pl-5 space-y-2">
              {popularDishes.map((dish) => (
                <li key={dish.dish_id}>
                  {dish.dish_name} - {dish.order_count} orders
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
