 import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Settings() {
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    setMessage("");
    const user = supabase.auth.user();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("name, email, phone")
      .eq("id", user.id)
      .single();

    if (error) {
      setMessage("Failed to load profile");
      setLoading(false);
      return;
    }

    setProfile(data);
    setLoading(false);
  }

  async function updateProfile() {
    setLoading(true);
    setMessage("");

    const user = supabase.auth.user();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ name: profile.name, phone: profile.phone })
      .eq("id", user.id);

    if (error) {
      setMessage("Failed to update profile");
    } else {
      setMessage("Profile updated successfully!");
    }

    setLoading(false);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {message && <p className="mb-4 text-center text-green-600">{message}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 font-semibold">Name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Email (readonly)</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              value={profile.email}
              readOnly
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Phone</label>
            <input
              type="tel"
              className="w-full border rounded px-3 py-2"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update Profile
          </button>
        </form>
      )}
    </div>
  );
}
