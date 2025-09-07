 import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Settings() {
  const [bankDetails, setBankDetails] = useState(null);
  const [formData, setFormData] = useState({
    account_holder_name: "",
    account_number: "",
    ifsc: "",
    phone_number: "",
    upi_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }
    return user;
  };

  async function fetchBankDetails() {
    setLoading(true);
    const user = await getCurrentUser();
    if (!user) return setLoading(false);

    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) console.error("Bank fetch error:", error);
    if (data) setBankDetails(data);
    setLoading(false);
  }

  async function saveBankDetails() {
    setLoading(true);
    const user = await getCurrentUser();
    if (!user) return setLoading(false);

    const payload = {
      user_id: user.id,
      account_holder_name: formData.account_holder_name,
      account_number: formData.account_number,
      ifsc: formData.ifsc,
      phone_number: formData.phone_number,
      upi_id: formData.upi_id,
    };

    let error;
    if (bankDetails) {
      ({ error } = await supabase
        .from("bank_accounts")
        .update(payload)
        .eq("user_id", user.id));
    } else {
      ({ error } = await supabase.from("bank_accounts").insert([payload]));
    }

    if (error) {
      console.error("Save error:", error);
      setMessage("❌ Failed to save bank details");
    } else {
      setMessage("✅ Bank details saved successfully!");
      fetchBankDetails();
      setEditing(false);
    }

    setLoading(false);
  }

  function cancelEdit() {
    if (bankDetails) {
      setFormData({
        account_holder_name: bankDetails.account_holder_name || "",
        account_number: bankDetails.account_number || "",
        ifsc: bankDetails.ifsc || "",
        phone_number: bankDetails.phone_number || "",
        upi_id: bankDetails.upi_id || "",
      });
    } else {
      setFormData({
        account_holder_name: "",
        account_number: "",
        ifsc: "",
        phone_number: "",
        upi_id: "",
      });
    }
    setEditing(false);
  }

  async function deleteBankDetails() {
    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("user_id", user.id);

    if (error) setMessage("❌ Failed to delete details");
    else {
      setMessage("✅ Bank details deleted!");
      setBankDetails(null);
      setFormData({
        account_holder_name: "",
        account_number: "",
        ifsc: "",
        phone_number: "",
        upi_id: "",
      });
      setEditing(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-2xl mx-auto space-y-6 relative">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-2 mb-6">
        Settings
      </h1>

      {/* Message Modal */}
      {message && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm text-center space-y-4">
            <p className="text-black font-semibold">{message}</p>
            <button
              onClick={() => setMessage("")}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Contact Developer Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700">Contact Developer</h2>
            <p className="text-gray-600">Choose a method to reach out for support or feedback.</p>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:ar.menu.saas@gmail.com?subject=AR%20Menu%20Feedback&body=Describe%20your%20issue%20or%20feedback%20here..."
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                📧 Email
              </a>
            </div>
            <button
              onClick={() => setContactModalOpen(false)}
              className="mt-4 w-full py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-black text-center">Loading...</p>
      ) : (
        <div className="space-y-6">
          {/* Add / Edit Form */}
          <div className="bg-gradient-to-r from-indigo-50 to-white p-6 rounded-xl shadow-lg border space-y-5">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Add Bank Account
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveBankDetails();
              }}
              className="space-y-4"
            >
              {/* Holder Name */}
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg px-3 py-2 shadow-sm bg-white text-black focus:ring focus:ring-indigo-200"
                  value={formData.account_holder_name}
                  onChange={(e) =>
                    setFormData({ ...formData, account_holder_name: e.target.value })
                  }
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  pattern="\d{9,18}"
                  title="Account number must be between 9 to 18 digits"
                  className="w-full border rounded-lg px-3 py-2 shadow-sm bg-white text-black focus:ring focus:ring-indigo-200"
                  value={formData.account_number}
                  onChange={(e) =>
                    setFormData({ ...formData, account_number: e.target.value })
                  }
                />
              </div>

              {/* IFSC Code */}
              <div>
                <label className="block mb-1 font-medium text-gray-700">IFSC Code</label>
                <input
                  type="text"
                  required
                  pattern="^[A-Z]{4}0[A-Z0-9]{6}$"
                  title="Enter valid IFSC code"
                  className="w-full border rounded-lg px-3 py-2 shadow-sm bg-white text-black uppercase focus:ring focus:ring-indigo-200"
                  value={formData.ifsc}
                  onChange={(e) =>
                    setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })
                  }
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block mb-1 font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  required
                  pattern="\d{10}"
                  title="Phone number must be 10 digits"
                  className="w-full border rounded-lg px-3 py-2 shadow-sm bg-white text-black focus:ring focus:ring-indigo-200"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                />
              </div>

              {/* UPI ID */}
              <div>
                <label className="block mb-1 font-medium text-gray-700">UPI ID</label>
                <input
                  type="text"
                  required
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  title="Enter valid UPI ID (example: name@upi)"
                  className="w-full border rounded-lg px-3 py-2 shadow-sm bg-white text-black focus:ring focus:ring-indigo-200"
                  value={formData.upi_id}
                  onChange={(e) =>
                    setFormData({ ...formData, upi_id: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Save Bank Account
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-semibold hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Saved Details */}
          {bankDetails && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Saved Bank Details
              </h2>

              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-black">
                <p><strong>Holder:</strong> {bankDetails.account_holder_name}</p>
                <p><strong>Account:</strong> {bankDetails.account_number}</p>
                <p><strong>IFSC:</strong> {bankDetails.ifsc}</p>
                <p><strong>Phone:</strong> {bankDetails.phone_number}</p>
                <p><strong>UPI ID:</strong> {bankDetails.upi_id}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditing(true);
                    setFormData({
                      account_holder_name: bankDetails.account_holder_name || "",
                      account_number: bankDetails.account_number || "",
                      ifsc: bankDetails.ifsc || "",
                      phone_number: bankDetails.phone_number || "",
                      upi_id: bankDetails.upi_id || "",
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Edit
                </button>
                <button
                  onClick={deleteBankDetails}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contact Developer Button */}
      <div className="mt-6 mb-10 flex justify-center">
        <button
          onClick={() => setContactModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md"
        >
          💬 Contact Developer
        </button>
      </div>
    </div>
  );
}
