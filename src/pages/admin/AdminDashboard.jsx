 // src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminDashboard() {
  const [filter, setFilter] = useState("today");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bankDetails, setBankDetails] = useState([]);

  // Convert filter to timestamp
  const getFilterTime = () => {
    const now = new Date();
    switch (filter) {
      case "1h":
        return new Date(now.getTime() - 60 * 60 * 1000);
      case "24h":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "2d":
        return new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "today":
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const filterTime = getFilterTime();
      const filteredOrders = orders.filter(
        (o) => new Date(o.created_at) >= filterTime
      );

      // Format orders for table
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

      // Summary per restaurant based on filteredOrders
      const summaryMap = {};
      filteredOrders.forEach((o) => {
        const rest = o.owner_email || o.owner_id;
        if (!summaryMap[rest]) summaryMap[rest] = { orders: 0, upi: 0, fee: 0 };
        const orderCount = o.items ? JSON.parse(o.items).length : 0;
        summaryMap[rest].orders += orderCount;
        summaryMap[rest].upi += o.payment_method === "UPI" ? o.amount : 0;
        summaryMap[rest].fee += o.platform_fee || 0;
      });
      const summaryArray = Object.keys(summaryMap).map((k) => ({
        restaurant: k,
        ...summaryMap[k],
      }));
      setSummary(summaryArray);
    } catch (err) {
      console.error(err.message);
      setData([]);
      setSummary([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankDetails = async () => {
    try {
      const { data: banks, error } = await supabase.from("bank_accounts").select("*");
      if (error) throw error;
      setBankDetails(banks);
    } catch (err) {
      console.error(err.message);
      setBankDetails([]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  if (loading)
    return (
      <p className="p-4 text-center text-white font-bold">
        Loading dashboard...
      </p>
    );

  const filterFromDate = getFilterTime();
  const filterToDate = new Date();

  return (
    <div className="flex min-h-screen relative">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-20 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-lg">Admin Menu</h2>
          <button
            className="text-black font-bold"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-4">
          <button
            className="w-full text-left bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            onClick={fetchBankDetails}
          >
            Bank Account
          </button>
          {bankDetails.length > 0 && (
            <div className="mt-4 max-h-[400px] overflow-y-auto space-y-2">
              {bankDetails.map((b, i) => (
                <div
                  key={i}
                  className="border p-2 rounded-lg bg-gray-50 text-black"
                >
                  <p>
                    <span className="font-semibold">Restaurant:</span> {b.name}
                  </p>
                  <p>
                    <span className="font-semibold">Bank:</span> {b.bank_name}
                  </p>
                  <p>
                    <span className="font-semibold">Account No:</span> {b.account_no}
                  </p>
                  <p>
                    <span className="font-semibold">IFSC:</span> {b.ifsc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10 p-4 md:p-6" 
        style={{
          backgroundImage:
            "url('https://png.pngtree.com/thumb_back/fh260/background/20241013/pngtree-closeup-of-peacock-feathers-with-blur-background-image_16381268.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur z-0"></div>
        <div className="relative z-10 text-black">
          {/* Hamburger Button */}
          <button
            className="text-white text-2xl mb-4 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <h1 className="text-3xl md:text-4xl font-extrabold mb-6 md:mb-8 text-white">
            Admin Dashboard
          </h1>

          {/* Filter */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">
              Restaurant Transactions
            </h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 bg-white text-black rounded-lg px-3 py-2"
            >
              <option value="today">Today</option>
              <option value="1h">Last 1 Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="2d">Last 2 Days</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {[
              { title: "Total Orders", value: data.length, color: "text-black" },
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
                className="bg-white shadow-lg rounded-xl p-4 md:p-6 hover:shadow-2xl transition-all duration-300"
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
          <div className="overflow-x-auto bg-white shadow-lg rounded-xl mb-6">
            <table className="w-full min-w-[800px] md:min-w-full text-left border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 md:p-4 text-black">Restaurant(Email)</th>
                  <th className="p-3 md:p-4 text-black">Customer</th>
                  <th className="p-3 md:p-4 text-black">Items order</th>
                  <th className="p-3 md:p-4 text-black">Total Amount</th>
                  <th className="p-3 md:p-4 text-black">Cash Payments</th>
                  <th className="p-3 md:p-4 text-black">UPI payments</th>
                  <th className="p-3 md:p-4 text-black">Platform Fee</th>
                  <th className="p-3 md:p-4 text-black">Created At</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50 transition-all">
                    <td className="p-2 md:p-4 font-medium">{r.restaurant}</td>
                    <td className="p-2 md:p-4">{r.customerName}</td>
                    <td className="p-2 md:p-4">{r.ordersCount}</td>
                    <td className="p-2 md:p-4 text-green-700 font-semibold">
                      ₹{r.totalAmount}
                    </td>
                    <td className="p-2 md:p-4">{r.cashAmount}</td>
                    <td className="p-2 md:p-4 text-blue-600 font-semibold">
                      ₹{r.upiAmount}
                    </td>
                    <td className="p-2 md:p-4 text-red-600 font-semibold">
                      ₹{r.platformFee}
                    </td>
                    <td className="p-2 md:p-4 text-gray-700">{r.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payout Calculation Summary */}
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
            Payout Calculation ({filterFromDate.toLocaleDateString()} - {filterToDate.toLocaleDateString()})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {summary.map((s, i) => (
              <div
                key={i}
                className="bg-white p-4 shadow-md rounded-lg hover:shadow-xl transition-all"
              >
                <h3 className="font-bold text-black mb-2">{s.restaurant}</h3>
                <p>
                  Total Orders: <span className="font-semibold">{s.orders}</span>
                </p>
                <p>
                  Total UPI Payments:{" "}
                  <span className="font-semibold text-blue-600">₹{s.upi}</span>
                </p>
                <p>
                  Platform Fee:{" "}
                  <span className="font-semibold text-red-600">₹{s.fee}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
