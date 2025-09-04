 // src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";

// ✅ Edge Function URL (local docker nahi use kar rahe)
const getEdgeFunctionURL = () =>
  "https://blytpwngwldnveqylait.supabase.co/functions/v1/admin-orders";

export default function AdminDashboard() {
  const [allowed, setAllowed] = useState(false);
  const [filter, setFilter] = useState("today");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Admin Key Prompt
  useEffect(() => {
    const isAllowed = localStorage.getItem("admin_allowed");
    if (isAllowed === "true") {
      setAllowed(true);
    } else {
      const password = prompt("Enter Admin Key:");
      if (password === import.meta.env.VITE_ADMIN_KEY) {
        setAllowed(true);
        localStorage.setItem("admin_allowed", "true");
      } else {
        alert("Access Denied!");
        window.location.href = "/";
      }
    }
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(getEdgeFunctionURL(), {
        headers: {
          // ✅ Pass admin key via Authorization header
          Authorization: `Bearer ${import.meta.env.VITE_ADMIN_KEY}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch orders from server");

      const orders = await res.json();

      // Filter by timestamp
      const now = new Date();
      const filterTime = (() => {
        switch (filter) {
          case "1h":
            return new Date(now.getTime() - 60 * 60 * 1000);
          case "24h":
            return new Date(now.getTime() - 24 * 60 * 60 * 1000);
          case "7d":
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          case "today":
          default:
            return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
      })();

      const filteredOrders = orders.filter(
        (o) => new Date(o.created_at) >= filterTime
      );

      // Format orders
      const formatted = filteredOrders.map((o) => {
        const date = new Date(o.created_at);
        const indiaTime = new Date(
          date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        const createdAt = indiaTime.toLocaleString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        return {
          id: o.id,
          restaurant: o.owner_email || o.owner_id,
          customerName: o.customer_name || "Unknown",
          ordersCount: o.items ? JSON.parse(o.items).length : 0,
          totalAmount: o.amount || 0,
          cashAmount: o.payment_method === "COD" ? o.amount : 0,
          upiAmount: o.payment_method === "UPI" ? o.amount : 0,
          platformFee: o.platform_fee || 0,
          createdAt,
        };
      });

      setData(formatted);
    } catch (err) {
      console.error(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) fetchOrders();
  }, [allowed, filter]);

  if (!allowed) return null;
  if (loading)
    return <p className="p-4 text-center text-white">Loading dashboard...</p>;

  return (
    <div
      className="min-h-screen p-4 md:p-6 relative"
      style={{
        backgroundImage:
          "url('https://png.pngtree.com/thumb_back/fh260/background/20241013/pngtree-closeup-of-peacock-feathers-with-blur-background-image_16381268.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur z-0"></div>
      <div className="relative z-10">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-6 md:mb-8 text-white">
          Admin Dashboard
        </h1>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            Restaurant Transactions
          </h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-black bg-black text-white rounded-lg px-3 md:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="today">Today</option>
            <option value="1h">Last 1 Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {[
            { title: "Total Orders", value: data.length, color: "text-gray-900" },
            {
              title: "Total Amount",
              value: `₹${data.reduce((sum, r) => sum + r.totalAmount, 0)}`,
              color: "text-green-700",
            },
            {
              title: "UPI Payments",
              value: `₹${data.reduce((sum, r) => sum + r.upiAmount, 0)}`,
              color: "text-blue-600",
            },
            {
              title: "Platform Fee",
              value: `₹${data.reduce((sum, r) => sum + r.platformFee, 0)}`,
              color: "text-red-600",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white/90 shadow-lg rounded-xl p-4 md:p-6 hover:shadow-2xl transition-all duration-300"
            >
              <h2 className="text-gray-500 text-sm md:text-base font-medium">
                {card.title}
              </h2>
              <p className={`text-2xl md:text-3xl font-bold ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto bg-white/90 shadow-lg rounded-xl">
          <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 md:p-4 text-gray-700">Restaurant (Email)</th>
                <th className="p-3 md:p-4 text-gray-700">Customer Name</th>
                <th className="p-3 md:p-4 text-gray-700">Items Ordered</th>
                <th className="p-3 md:p-4 text-gray-700">Total Amount</th>
                <th className="p-3 md:p-4 text-gray-700">Cash Amount</th>
                <th className="p-3 md:p-4 text-gray-700">UPI Amount</th>
                <th className="p-3 md:p-4 text-gray-700">Platform Fee</th>
                <th className="p-3 md:p-4 text-gray-700">Created At</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50 transition-all">
                  <td className="p-2 md:p-4 text-gray-900 font-medium">{r.restaurant}</td>
                  <td className="p-2 md:p-4 text-gray-900">{r.customerName}</td>
                  <td className="p-2 md:p-4 text-gray-900">{r.ordersCount}</td>
                  <td className="p-2 md:p-4 text-green-700 font-semibold">₹{r.totalAmount}</td>
                  <td className="p-2 md:p-4 text-gray-900">₹{r.cashAmount}</td>
                  <td className="p-2 md:p-4 text-blue-600 font-semibold">₹{r.upiAmount}</td>
                  <td className="p-2 md:p-4 text-red-600 font-semibold">₹{r.platformFee}</td>
                  <td className="p-2 md:p-4 text-gray-500">{r.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
