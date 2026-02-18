import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "@google/model-viewer";
import { ShoppingCart } from "lucide-react";

export default function PublicMenu() {
  const { profileId } = useParams();
  const location = useLocation();

  const [restaurantName, setRestaurantName] = useState("");
  const [isOrderingEnabled, setIsOrderingEnabled] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const name = queryParams.get("restaurant");
    if (name) setRestaurantName(name.trim());
  }, [location.search]);

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedModel, setSelectedModel] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [tableNo, setTableNo] = useState("");
  const [userName, setUserName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [step, setStep] = useState(1);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        // 🔹 1️⃣ Fetch profile settings first
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("is_ordering_enabled")
        .eq("id", profileId)
        .single();

      if (profileError) throw profileError;

      setIsOrderingEnabled(profileData?.is_ordering_enabled ?? false);

      // 🔹 2️⃣ Fetch menu items
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, description, price, image_url, category, model_url")
        .eq("owner_id", profileId)
        .eq("is_public", true);

      if (error) throw error;

      const withModels = (data || []).map((item) => ({
        ...item,
        url: item.image_url,
      }));

      setMenuItems(withModels);

    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to load menu.");
    } finally {
      setLoading(false);
    }
  };

  if (profileId) fetchMenuItems();
  }, [profileId]);

  if (loading) return <p className="p-4 text-center">Loading menu...</p>;
  if (errorMsg) return <p className="p-4 text-center text-red-600">{errorMsg}</p>;
  if (menuItems.length === 0) return <p className="p-4 text-center">No menu items available.</p>;

  const groupedItems = menuItems.reduce((acc, item) => {
    const cat = item.category ? item.category.trim() : "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const sortedCategories = Object.keys(groupedItems);

  const addToCart = (item) => {
    const exists = cart.find((c) => c.id === item.id);
    if (exists) {
      setCart(
        cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + quantity } : c
        )
      );
    } else {
      setCart([...cart, { ...item, quantity }]);
    }
    setSelectedModel(null);
    setQuantity(1);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const itemsTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const platformFee = selectedPayment === "UPI" && cart.length ? 50 : 0;
  const grandTotal = itemsTotal + platformFee;

  const isOrderEnabled =
    userName.trim() !== "" &&
    customerEmail.trim() !== "" &&
    tableNo.trim() !== "" &&
    customerPhone.trim().length >= 10 &&
    selectedPayment &&
    cart.length > 0;

  const placeOrder = async (status = "pending") => {
    const orderData = {
      owner_id: profileId,
      customer_name: userName.trim(),
      customer_email: customerEmail.trim(),
      customer_phone: customerPhone.trim(),
      items: JSON.stringify(cart),
      amount: itemsTotal,
      status,
      table_no: tableNo.trim(),
      payment_method: selectedPayment,
      platform_fee: platformFee,
    };

    const { error } = await supabase.from("orders").insert([orderData]);

    if (error) {
      alert("Failed to place order. Please try again.");
      console.error(error);
      return;
    }

    // --- SMS Part using Supabase Function ---
    try {
      const smsRes = await fetch(
        "https://blytpwngwldnveqylait.supabase.co/functions/v1/send-order-sms",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, // ✅ FIX
          },
          body: JSON.stringify({
            customerPhone: customerPhone.trim(),
            message: `Hi ${userName}, your order at ${restaurantName} , has ${status}. Total: ₹${itemsTotal}, Payment Method: ${selectedPayment}. if paid ignore, And Enjoy your meal!
         `,
          }),
        }
      );

      if (!smsRes.ok) {
        console.error("SMS function failed:", await smsRes.text());
      } else {
        console.log("SMS sent successfully!");
      }
    } catch (smsError) {
      console.error("Failed to send SMS:", smsError);
    }
    // --- SMS Part ends ---

    alert("Order placed successfully! order will served soon ");
    setCart([]);
    setShowCart(false);
    setUserName("");
    setCustomerEmail("");
    setTableNo("");
    setCustomerPhone("");
    setSelectedPayment("");
    setStep(1);
    setPaymentSuccess(false);
  };

  // ✅ UPDATED handleContinue function
  const handleContinue = async () => {
    if (!isOrderEnabled) return;

    if (selectedPayment === "UPI") {
      try {
        // 🔹 Call Supabase create-order function
        const res = await fetch(
          "https://blytpwngwldnveqylait.functions.supabase.co/create-order",
          {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,//must
          },
            body: JSON.stringify({ amount: grandTotal }), // rupees bhej rahe
          }
        );
        const order = await res.json();

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID, // ✅ env se key
          amount: order.amount, // paise me
          currency: order.currency,
          name: restaurantName || "Restaurant",
          description: "Order Payment",
          order_id: order.id, // ✅ order_id from backend
          handler: function (response) {
            console.log("✅ Payment success:", response);

            // Yahi par order ko success dikha do
            setPaymentSuccess(true); // state update
            setStep(2); // Next step UI me le jao (Order Now button dikh jaayega)
            
          },
          prefill: {
            name: userName,
            email: customerEmail,
            contact: customerPhone,
          },
          theme: {
            color: "#F59E0B",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error("Razorpay error:", err);
        alert("Payment initialization failed");
      }
    } else {
      setStep(2);
    }
  };

  const handlePayment = () => {
    if (selectedPayment === "UPI" && paymentSuccess) {
      placeOrder("paid");
    } else {
      placeOrder("pending");
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80"
          alt="menu background"
          className="w-full h-full object-cover opacity-40 blur-sm fixed"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-center mb-2 tracking-widest text-white drop-shadow-lg">
          {restaurantName || "Restaurant"}
        </h2>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-2 tracking-widest text-yellow-400 drop-shadow-lg">
          AR MENU
        </h1>
        <p className="text-center text-lg text-gray-200 mb-6">
        Digitally-Ressponsive menu items <span className="text-yellow-400 font-semibold">preview</span>...
        </p>
        <hr className="border-t-2 border-dotted border-gray-400 mb-6" />

        {isOrderingEnabled && (
  <div className="flex justify-center mb-6">
    <button
      onClick={() => setShowCart(true)}
      className="relative bg-yellow-400 text-black px-4 py-2 rounded-full flex items-center gap-2 font-bold shadow-lg"
    >
      <ShoppingCart size={22} />
      Cart
      {cart.length > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          {cart.length}
        </span>
      )}
    </button>
  </div>
)}

        {/* Menu Items */}
        {sortedCategories.map((category) => (
          <div
            key={category}
            className="mb-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-lg"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-yellow-400 border-b-2 border-yellow-400 inline-block pb-1">
              {category}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/30">
                    <th className="py-2 px-4 text-lg font-semibold text-white">Image</th>
                    <th className="py-2 px-4 text-lg font-semibold text-yellow-300">Item</th>
                    <th className="py-2 px-4 text-lg font-semibold text-gray-200">Description</th>
                    <th className="py-2 px-4 text-lg font-semibold text-green-300">Price (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedItems[category].map((item) => {
                    const { data: imgData } = supabase.storage
                      .from("menu-images")
                      .getPublicUrl(item.image_url);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-white/10 transition text-sm sm:text-base cursor-pointer"
                        onClick={() => { 
                          if (isOrderingEnabled) {
                            setSelectedModel(item);
                          }
                        }}
                      >
                        <td className="py-2 px-4 relative">
                          <img
                            src={imgData?.publicUrl || "/placeholder.png"}
                            alt={item.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                          />
                        </td>
                        <td className="py-2 px-4 font-semibold text-yellow-300">{item.name}</td>
                        <td className="py-2 px-4 text-gray-200">{item.description}</td>
                        <td className="py-2 px-4 text-green-300 font-bold">₹{item.price}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Model Modal */}
        {selectedModel && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedModel(null);
            }}
          >
            <div className="bg-white rounded-2xl p-4 w-[90%] h-[80%] relative flex flex-col sm:flex-row">
              <button
                className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded z-50"
                onClick={() => setSelectedModel(null)}
              >
                Close
              </button>
              <img
                src={supabase.storage.from("menu-images").getPublicUrl(selectedModel.url).data.publicUrl}
                alt={selectedModel.name}
                className="object-contain max-h-full max-w-full rounded-lg flex-1"
              />
              <div className="sm:w-64 sm:ml-4 mt-4 sm:mt-0 flex flex-col justify-start gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="bg-gray-300 text-black px-3 py-1 rounded"
                  >
                    -
                  </button>
                  <span className="text-black font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="bg-gray-300 text-black px-3 py-1 rounded"
                  >
                    +
                  </button>
                </div>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded font-bold"
                  onClick={() => addToCart(selectedModel)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cart Modal */}
        {showCart && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-[700px] max-h-[90vh] overflow-y-auto relative">
              <button
                className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => {
                  setShowCart(false);
                  setSelectedPayment("");
                  setUserName("");
                  setCustomerEmail("");
                  setTableNo("");
                  setCustomerPhone("");
                  setStep(1);
                  setPaymentSuccess(false);
                }}
              >
                Close
              </button>

              {step === 1 ? (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-black">Your Cart</h2>

                  {cart.length === 0 ? (
                    <p className="text-gray-700">No items in cart.</p>
                  ) : (
                    <div>
                      <div className="overflow-x-auto max-h-64">
                        <table className="w-full border mb-4">
                          <thead>
                            <tr className="bg-gray-200 text-black">
                              <th className="p-2">Item</th>
                              <th className="p-2">Description</th>
                              <th className="p-2">Price</th>
                              <th className="p-2">Qty</th>
                              <th className="p-2">Total</th>
                              <th className="p-2">Remove</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cart.map((item) => (
                              <tr key={item.id} className="text-black border-t">
                                <td className="p-2">{item.name}</td>
                                <td className="p-2">{item.description}</td>
                                <td className="p-2">₹{item.price}</td>
                                <td className="p-2">{item.quantity}</td>
                                <td className="p-2">₹{item.price * item.quantity}</td>
                                <td className="p-2">
                                  <button
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <p className="text-black font-semibold">Items Total: ₹{itemsTotal}</p>
                      {selectedPayment === "UPI" && <p className="text-black">Platform Fee: ₹{platformFee}</p>}
                      <h3 className="text-xl font-bold text-black mt-2">
                        Grand Total: ₹{selectedPayment === "UPI" ? grandTotal : itemsTotal}
                      </h3>

                      <div className="mt-4">
                        <input
                          type="text"
                          placeholder="Enter Your Name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full border p-2 rounded bg-white text-black"
                        />
                      </div>

                      <div className="mt-4">
                        <input
                          type="email"
                          placeholder="Enter Your Email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full border p-2 rounded bg-white text-black"
                        />
                      </div>

                      <div className="mt-4">
                        <input
                          type="text"
                          placeholder="Enter Table No."
                          value={tableNo}
                          onChange={(e) => setTableNo(e.target.value)}
                          className="w-full border p-2 rounded bg-white text-black"
                        />
                      </div>

                      <div className="mt-4">
                        <input
                          type="text"
                          placeholder="Enter Your Phone Number"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full border p-2 rounded bg-white text-black"
                        />
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-black">
                          <input
                            type="radio"
                            name="payment"
                            value="UPI"
                            checked={selectedPayment === "UPI"}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="w-4 h-4 accent-blue-600"
                          />
                          Pay with UPI
                        </label>

                        <label className="flex items-center gap-2 text-black">
                          <input
                            type="radio"
                            name="payment"
                            value="COD"
                            checked={selectedPayment === "COD"}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="w-4 h-4 accent-blue-600"
                          />
                          Cash only
                        </label>
                      </div>

                      <button
                        className={`mt-4 py-2 px-4 rounded font-bold shadow-lg w-full ${
                          isOrderEnabled
                            ? "bg-blue-600 text-white"
                            : "bg-gray-400 text-black cursor-not-allowed"
                        }`}
                        disabled={!isOrderEnabled}
                        onClick={handleContinue}
                      >
                        Continue
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-black">Complete Order</h2>
                  <p className="text-red-600 font-bold mb-2">You cannot cancel after ordering!</p>
                  <p className="text-black mb-2">
                    Amount to pay: <span className="font-bold">₹{selectedPayment === "UPI" ? grandTotal : itemsTotal}</span>
                  </p>
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded font-bold w-full"
                    onClick={handlePayment}
                  >
                    Order Now
                  </button>
                </>
              )}
            </div>    
          </div>
        )}
      </div>
    </div>
  );
}
