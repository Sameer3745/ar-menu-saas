 // src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

export default function AdminDashboard() {
  const [filter, setFilter] = useState("today");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  // Owners states
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  
 // Custom date filter
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

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
      case "date":
        return selectedDate
          ? new Date(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate()
            )
          : new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case "today":
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (ordersError) throw ordersError;

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email");
      if (profilesError) throw profilesError;

      const filterTime = getFilterTime();
      const filteredOrders = orders.filter((o) => {
        const orderDate = new Date(o.created_at);
        if (filter === "date" && selectedDate) {
          const indiaOrderDate = new Date(
            orderDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
          );
          const indiaSelectedDate = new Date(
            selectedDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
          );
          return indiaOrderDate.toDateString() === indiaSelectedDate.toDateString();
        }
        return orderDate >= filterTime;
      });

      const formatted = filteredOrders.map((o) => {
        const ownerProfile = profiles.find((p) => p.id === o.owner_id);
        const ownerEmail = ownerProfile?.email || "No Email";

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
          owner: o.owner_id,
          restaurant: ownerEmail,
          customerName: o.customer_name || "Unknown",
          totalAmount: o.amount || 0,
          cashAmount: o.payment_method === "COD" ? o.amount : 0,
          upiAmount: o.payment_method === "UPI" ? o.amount : 0,
          upiOrders: o.payment_method === "UPI" ? 1 : 0,
          platformFee: o.platform_fee || 0,
          createdAt,
        };
      });

      setData(formatted);

      const summaryMap = {};
      filteredOrders.forEach((o) => {
        const ownerProfile = profiles.find((p) => p.id === o.owner_id);
        const ownerEmail = ownerProfile?.email || "No Email";

        if (!summaryMap[ownerEmail])
          summaryMap[ownerEmail] = {
            totalOrders: 0,
            upiOrders: 0,
            upiAmount: 0,
            fee: 0,
          };

        summaryMap[ownerEmail].totalOrders += 1;
        if (o.payment_method === "UPI") {
          summaryMap[ownerEmail].upiOrders += 1;
          summaryMap[ownerEmail].upiAmount += o.amount || 0;
        }
        summaryMap[ownerEmail].fee += o.platform_fee || 0;
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

  const fetchOwners = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOwners(data);
    } catch (err) {
      console.error("Error fetching owners:", err.message);
      setOwners([]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter, selectedDate]);

  useEffect(() => {
    if (activePage === "owners" || activePage === "menus") {
      fetchOwners();
    }
  }, [activePage]);

  if (loading && activePage === "dashboard")
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-black font-bold text-lg">Loading dashboard...</p>
      </div>
    );

  const filterFromDate = getFilterTime();
  const filterToDate = new Date();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl transform transition-transform duration-300 z-20 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg text-black">Admin Menu</h2>
          <button
            className="text-black font-bold text-xl bg-white border-black md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-4">
          <button
            onClick={() => setActivePage("dashboard")}
            className="w-full text-left bg-white text-black px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition"
          >
            Admin Dashboard
          </button>
          <button
            onClick={() => setActivePage("owners")}
            className="w-full text-left bg-white text-black px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition"
          >
            Owners Information
          </button>
          <button
            onClick={() => setActivePage("menus")}
            className="w-full text-left bg-white text-black px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition"
          >
            Owners Menu
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10 p-4 md:p-6 md:ml-64">
        <div className="flex items-center mb-6">
          <button
            className="text-black text-2xl md:text-3xl font-bold bg-white p-2 rounded-lg shadow-lg md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <h1 className="text-3xl md:text-4xl font-extrabold text-black ml-4">
            {activePage === "dashboard" && "Admin Dashboard"}
            {activePage === "owners" && "Owners Information"}
            {activePage === "menus" && "Owners Menu"}
          </h1>
        </div>

        {/* Dashboard Page */}
        {activePage === "dashboard" && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl md:text-2xl font-semibold text-black">
                Restaurant Transactions
              </h2>

              <div className="flex items-center gap-2 relative">
                {/* Filter Dropdown */}
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

                {/* Calendar Icon Button */}
                <div className="relative">
                  <button
                    onClick={() => setCalendarOpen(!calendarOpen)}
                    className="bg-white border border-gray-300 text-black p-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    <Calendar size={20} />
                  </button>

                  {/* Calendar Popup */}
                  {calendarOpen && (
                    <div
                      className="absolute z-50 mt-2 bg-white shadow-lg rounded-lg p-2 "
                      style={{
                        minWidth: "auto",
                        maxwidth: "90vw",
                        left: "auto",
                        right: 0,
                      }}
                    >
                      <DatePicker
                        selected={selectedDate}
                        onChange={(date) => {
                          setSelectedDate(date);
                          setFilter("date");
                          setCalendarOpen(false);
                        }}
                        inline={true}
                        showPopperArrow={false}
                        calendarClassName="shadow rounded-lg "
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              {[
                { title: "Total Orders", value: data.length, color: "text-black" },
                { title: "Total Amount", value: `₹${data.reduce((sum, r) => sum + r.totalAmount, 0)}`, color: "text-green-700" },
                { title: "Total UPI Orders / Payments", value: `${data.reduce((sum, r) => sum + r.upiOrders, 0)} / ₹${data.reduce((sum, r) => sum + r.upiAmount, 0)}`, color: "text-blue-600" },
                { title: "Total Platform Fee", value: `₹${data.reduce((sum, r) => sum + r.platformFee, 0)}`, color: "text-red-600" },
              ].map((card, i) => (
                <div key={i} className="bg-white shadow-lg rounded-xl p-4 md:p-6 hover:shadow-2xl transition-all duration-300">
                  <h2 className="text-gray-500 text-sm md:text-base font-medium">{card.title}</h2>
                  <p className={`text-2xl md:text-3xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto bg-white shadow-lg rounded-xl mb-6">
              <table className="w-full min-w-[800px] text-left border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 md:p-4 text-black">Owner Id</th>
                    <th className="p-2 md:p-4 text-black">Restaurant Email</th>
                    <th className="p-2 md:p-4 text-black">Customer</th>
                    <th className="p-2 md:p-4 text-black">Total Amount</th>
                    <th className="p-2 md:p-4 text-black">Cash Payments</th>
                    <th className="p-2 md:p-4 text-black">UPI Payments</th>
                    <th className="p-2 md:p-4 text-black">Platform Fee</th>
                    <th className="p-2 md:p-4 text-black">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-gray-50 transition-all">
                      <td className="p-2 md:p-4 text-black font-medium">{r.owner}</td>
                      <td className="p-2 md:p-4 text-black font-medium">{r.restaurant}</td>
                      <td className="p-2 md:p-4 text-black">{r.customerName}</td>
                      <td className="p-2 md:p-4 text-green-700 font-semibold">₹{r.totalAmount}</td>
                      <td className="p-2 md:p-4 text-black">{r.cashAmount}</td>
                      <td className="p-2 md:p-4 text-blue-600 font-semibold">₹{r.upiAmount}</td>
                      <td className="p-2 md:p-4 text-red-600 font-semibold">₹{r.platformFee}</td>
                      <td className="p-2 md:p-4 text-black">{r.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Boxes */}
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-black">
              Payout Calculation ({filterFromDate.toLocaleDateString()} - {filterToDate.toLocaleDateString()})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 text-black">
              {summary.map((s, i) => (
                <div key={i} className="bg-white p-4 shadow-md rounded-lg hover:shadow-xl transition-all">
                  <h3 className="font-bold text-black mb-2">{s.restaurant}</h3>
                  <p>Total Orders: <span className="font-semibold">{s.totalOrders}</span></p>
                  <p>Total UPI Orders: <span className="font-semibold text-blue-600">{s.upiOrders}</span></p>
                  <p>Total UPI Payments: <span className="font-semibold text-blue-600">₹{s.upiAmount}</span></p>
                  <p>Total Platform Fee: <span className="font-semibold text-red-600">₹{s.fee}</span></p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Owners Page */}
{activePage === "owners" && (
  <div className="bg-white p-6 shadow-lg rounded-xl">
    <h2 className="text-2xl font-bold mb-4 text-black">Owners Information</h2>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-black font-semibold">Owner ID</th>
            <th className="p-3 text-black font-semibold">Email ID</th>
            <th className="p-3 text-black font-semibold">Created At</th>
          </tr>
        </thead>
        <tbody>
          {owners.map((owner) => (
            <tr
              key={owner.id}
              className="border-t hover:bg-gray-50 transition-all cursor-pointer"
              onClick={async () => {
                // Fetch bank account details for this owner
                const { data: bankAccounts, error } = await supabase
                  .from('bank_accounts')
                  .select('account_holder_name, account_number, ifsc, upi_id, phone_number')
                  .eq('user_id', owner.id)

                if (error) {
                  console.error('Error fetching bank accounts:', error)
                }

                setSelectedOwner({
                  ...owner,
                  bankAccounts: bankAccounts || []
                })
              }}
            >
              <td className="p-3 text-black">{owner.id}</td>
              <td className="p-3 text-black">{owner.email}</td>
              <td className="p-3 text-black">
                {new Date(owner.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-bold text-black mb-4">Owner Details</h3>

            {/* Owner Info Table */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="font-semibold text-black">Owner ID:</div>
              <div className="text-black">{selectedOwner.id}</div>

              <div className="font-semibold text-black">Email:</div>
              <div className="text-black">{selectedOwner.email}</div>

              <div className="font-semibold text-black">Created At:</div>
              <div className="text-black">
                {new Date(selectedOwner.created_at).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {/* Bank Accounts Section */}
            {selectedOwner.bankAccounts && selectedOwner.bankAccounts.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-black mb-2">Bank Account Details</h4>
                {selectedOwner.bankAccounts.map((bank, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2 mb-2 border-t pt-2">
                    <div className="font-semibold text-black">Account Holder Name:</div>
                    <div className="text-black">{bank.account_holder_name}</div>

                    <div className="font-semibold text-black">Account Number:</div>
                    <div className="text-black">{bank.account_number}</div>

                    <div className="font-semibold text-black">IFSC:</div>
                    <div className="text-black">{bank.ifsc}</div>

                    <div className="font-semibold text-black">UPI ID:</div>
                    <div className="text-black">{bank.upi_id}</div>

                    <div className="font-semibold text-black">Phone Number:</div>
                    <div className="text-black">{bank.phone_number}</div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setSelectedOwner(null)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}

        {/* Owners Menu Page */}
{activePage === "menus" && (
  <div className="bg-white p-6 shadow-lg rounded-xl">
    <h2 className="text-2xl font-bold mb-4 text-black">Owners Menu</h2>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-black font-semibold">Owner Id</th>
            <th className="p-3 text-black font-semibold">Email</th>
            <th className="p-3 text-black font-semibold">Menu Items</th>
          </tr>
        </thead>
        <tbody>
          {owners.map((owner) => (
            <tr
              key={owner.id}
              className="border-t hover:bg-gray-50 transition-all cursor-pointer"
              onClick={async () => {
                try {
                  const { data: menuItems, error } = await supabase
                    .from("menu_items")
                    .select("id, name, description, price, category, image_url, created_at")
                    .eq("owner_id", owner.id)
                    .order("created_at", { ascending: false });

                  if (error) throw error;

                  setSelectedOwner({ ...owner, menuItems });
                } catch (err) {
                  console.error("Error fetching menu items:", err.message);
                  setSelectedOwner({ ...owner, menuItems: [] });
                }
              }}
            >
              <td className="p-3 text-black">{owner.id}</td>
              <td className="p-3 text-black">{owner.email}</td>
              <td className="p-3 text-black">
                {selectedOwner?.id === owner.id
                  ? selectedOwner.menuItems.length
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOwner && selectedOwner.menuItems && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <h3 className="text-xl font-bold text-black mb-2 sm:mb-0">
                Menu Items for {selectedOwner.email}
              </h3>
              <button
                onClick={() => setSelectedOwner(null)}
                className="text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Close
              </button>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-black font-semibold">Image</th>
                    <th className="p-2 text-black font-semibold">Item Name</th>
                    <th className="p-2 text-black font-semibold">Description</th>
                    <th className="p-2 text-black font-semibold">Price</th>
                    <th className="p-2 text-black font-semibold">Category</th>
                    <th className="p-2 text-black font-semibold">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOwner.menuItems.length > 0 ? (
                    selectedOwner.menuItems.map((item) => {
                      const { data } = supabase
                        .storage
                        .from("menu-images")
                        .getPublicUrl(item.image_url);

                      const imageUrl = data?.publicUrl || null;

                      return (
                        <tr key={item.id} className="border-t hover:bg-gray-50 transition-all">
                          <td className="p-2 text-black">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-md"
                              />
                            ) : (
                              "No Image"
                            )}
                          </td>
                          <td className="p-2 text-black">{item.name}</td>
                          <td className="p-2 text-black">{item.description}</td>
                          <td className="p-2 text-green-700 font-semibold">₹{item.price}</td>
                          <td className="p-2 text-black">{item.category}</td>
                          <td className="p-2 text-black">
                            {new Date(item.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="p-3 text-black text-center" colSpan={6}>
                        No menu items available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)}


      </div>
    </div>
  );
}
