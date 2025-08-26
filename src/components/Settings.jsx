 import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Settings() {
  const [bankDetails, setBankDetails] = useState(null);
  const [formData, setFormData] = useState({
    account_holder_name: "",
    account_number: "",
    ifsc: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false); // Contact Modal state

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
    };

    let error;
    if (bankDetails) {
      ({ error } = await supabase
        .from("bank_accounts")
        .update(payload)
        .eq("user_id", user.id));
    } else {
      ({ error } = await supabase
        .from("bank_accounts")
        .insert([payload]));
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
      });
    } else {
      setFormData({ account_holder_name: "", account_number: "", ifsc: "" });
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
      setFormData({ account_holder_name: "", account_number: "", ifsc: "" });
      setEditing(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-xl mx-auto space-y-6 relative">
      <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 border-b pb-2 mb-4 sm:mb-6">
        Settings
      </h1>

      {/* Message Modal */}
      {message && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded-xl shadow-md max-w-sm text-center space-y-4">
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
              {/* Email */}
              <a
                href="mailto:ar.menu.saas@gmail.com?subject=AR%20Menu%20Feedback&body=Describe%20your%20issue%20or%20feedback%20here..."
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm1 1h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
                </svg>
                Email
              </a>
            </div>

            <button
              onClick={() => setContactModalOpen(false)}
              className="mt-4 w-full py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <div className="space-y-6">
          {/* Add / Edit Form */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-4">
              Add Bank Account
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveBankDetails();
              }}
              className="space-y-3 sm:space-y-4"
            >
              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 bg-white text-black"
                  value={formData.account_holder_name}
                  onChange={(e) =>
                    setFormData({ ...formData, account_holder_name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Account Number
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 bg-white text-black"
                  value={formData.account_number}
                  onChange={(e) =>
                    setFormData({ ...formData, account_number: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-600">IFSC Code</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 bg-white text-black"
                  value={formData.ifsc}
                  onChange={(e) =>
                    setFormData({ ...formData, ifsc: e.target.value })
                  }
                  required
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
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-300 space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-4">
                Saved Details
              </h2>

              <div className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-1 sm:space-y-2 text-black">
                <p><strong>Holder:</strong> {bankDetails.account_holder_name}</p>
                <p><strong>Account:</strong> {bankDetails.account_number}</p>
                <p><strong>IFSC:</strong> {bankDetails.ifsc}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(true);
                    setFormData({
                      account_holder_name: bankDetails.account_holder_name || "",
                      account_number: bankDetails.account_number || "",
                      ifsc: bankDetails.ifsc || "",
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={deleteBankDetails}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fixed Contact Developer Button at Bottom */}
      <div className="mt-6 mb-10 flex justify-center">
        <button
          onClick={() => setContactModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m0 0l4-4m-4 4l4 4" />
          </svg>
          Contact Developer
        </button>
      </div>
    </div>
  );
}
