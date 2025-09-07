 import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("today"); // default today
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Calendar states
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filter, selectedDate]);

  async function fetchOrders() {
    setLoading(true);
    setErrorMsg("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMsg("User not logged in");
      setLoading(false);
      return;
    }

    const ownerId = user.id;

    let filterQuery = supabase
      .from("orders")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    const now = new Date();
    let fromDate = null;
    let toDate = null;

    if (filter === "1h") fromDate = new Date(now.getTime() - 60 * 60 * 1000);
    else if (filter === "24h") fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    else if (filter === "today") fromDate = new Date(now.setHours(0, 0, 0, 0));
    else if (filter === "2d") fromDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    else if (filter === "7d") fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (filter === "date" && selectedDate) {
      // ✅ Corrected: selected date start & end
      fromDate = new Date(selectedDate.setHours(0, 0, 0, 0));
      toDate = new Date(selectedDate.setHours(23, 59, 59, 999));
    }

    if (fromDate && toDate) {
      filterQuery = filterQuery.gte("created_at", fromDate.toISOString()).lte("created_at", toDate.toISOString());
    } else if (fromDate) {
      filterQuery = filterQuery.gte("created_at", fromDate.toISOString());
    }

    try {
      const { data, error } = await filterQuery;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setErrorMsg("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      completed: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      paid: "bg-blue-100 text-blue-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold ${
          colors[status?.toLowerCase()] || "bg-gray-200 text-gray-800"
        }`}
      >
        {status ?? "-"}
      </span>
    );
  };

  async function saveStatusAndClose(orderId, newStatus) {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  }

  const calculateItemsTotal = (items) => {
    if (!items) return 0;
    return JSON.parse(items).reduce((acc, item) => {
      const qty = parseInt(item.quantity || 0, 10);
      const price = parseFloat(item.price || 0);
      return acc + qty * price;
    }, 0);
  };

  const totalUpiOrders = orders.filter((o) => o.payment_method === "UPI").length;
  const totalUpiPayments = orders
    .filter((o) => o.payment_method === "UPI")
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  return (
    <div className="p-6">
      <h1 className="text-4xl font-extrabold mb-6 text-black">Orders</h1>

      {/* Filter + Calendar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            if (e.target.value !== "date") setSelectedDate(null);
          }}
          className="border rounded p-2 text-sm w-40 text-black bg-white"
        >
          <option value="today">Today</option>
          <option value="1h">Last 1 Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="2d">Last 2 Days</option>
          <option value="7d">Last 7 Days</option>
        </select>

        {/* Calendar Icon */}
        <div className="relative">
          <button
            onClick={() => setCalendarOpen(!calendarOpen)}
            className="bg-white border border-gray-300 p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Calendar size={20} color="black"/>
          </button>

          {/* Calendar Popup */}
          {calendarOpen && (
            <div
              className="absolute z-50 mt-2 bg-white shadow-lg rounded-lg p-2"
              style={{ minWidth: "auto", maxWidth: "90vw", right: "auto", left: 0 }}
            >
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  setFilter("date");
                  setCalendarOpen(false);
                }}
                inline
                showPopperArrow={false}
                calendarClassName="shadow rounded-lg w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* UPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Total UPI Orders</h3>
          <p className="text-3xl font-bold text-blue-600">{totalUpiOrders}</p>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Total UPI Payments</h3>
          <p className="text-3xl font-bold text-green-600">₹{totalUpiPayments.toFixed(2)}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : errorMsg ? (
          <p className="text-red-600 text-center font-medium">{errorMsg}</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-black text-lg">No orders found.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wide">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wide">
                  Table No
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wide">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wide">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-black font-medium">{order.customer_name || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-black">{order.table_no || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-black">₹{order.amount?.toFixed(2) || "0.00"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-black text-sm">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-2 sm:mx-0 relative text-black max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded"
              onClick={() => setSelectedOrder(null)}
            >
              Close
            </button>
            <h2 className="text-2xl font-bold mb-4 text-black">Order Details</h2>

            <p><span className="font-semibold">Customer:</span> {selectedOrder.customer_name}</p>
            <p><span className="font-semibold">Table No:</span> {selectedOrder.table_no}</p>
            <p><span className="font-semibold">Customer Email:</span> {selectedOrder.customer_email || "-"}</p>
            <p><span className="font-semibold">Customer Phone:</span> {selectedOrder.customer_phone || "-"}</p>

            <div className="mt-4 max-h-64 overflow-y-auto overflow-x-auto border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-black uppercase tracking-wide">Item</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-black uppercase tracking-wide">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-black uppercase tracking-wide">Price</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-black uppercase tracking-wide">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-black uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedOrder.items &&
                    JSON.parse(selectedOrder.items).map((item, idx) => {
                      const qty = parseInt(item.quantity || 0, 10);
                      const price = parseFloat(item.price || 0);
                      return (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-black">{item.name}</td>
                          <td className="px-3 py-2 text-black">{item.description}</td>
                          <td className="px-3 py-2 text-black">₹{price}</td>
                          <td className="px-3 py-2 text-black">{qty}</td>
                          <td className="px-3 py-2 text-black">₹{(qty * price).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between font-bold text-lg text-black">
              <span>Grand Total:</span>
              <span>₹{calculateItemsTotal(selectedOrder.items).toFixed(2)}</span>
            </div>

            <p className="mt-3 text-black"><span className="font-semibold">Payment Method:</span> {selectedOrder.payment_method}</p>
            <p className="mt-2 text-black"><span className="font-semibold">Status:</span> {selectedOrder.status}</p>

            <div className="mt-3">
              <label className="block font-semibold mb-2 text-black">Update Status:</label>
              <select
                value={selectedOrder.status}
                onChange={(e) => setSelectedOrder({ ...selectedOrder, status: e.target.value })}
                className="border rounded p-2 w-full text-black bg-white"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                onClick={() => saveStatusAndClose(selectedOrder.id, selectedOrder.status)}
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
