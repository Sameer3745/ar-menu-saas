 import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function PublicMenu() {
  const { profileId } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const { data, error } = await supabase
          .from("menu_items")
          .select("id, name, description, price, image_url, category")
          .eq("owner_id", profileId)
          .eq("is_public", true);

        if (error) throw error;
        setMenuItems(data || []);
      } catch (error) {
        console.error("Error fetching menu items:", error);
        setErrorMsg("Failed to load menu items.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [profileId]);

  if (loading) return <p className="p-4 text-center">Loading menu...</p>;
  if (errorMsg) return <p className="p-4 text-center text-red-600">{errorMsg}</p>;
  if (menuItems.length === 0) return <p className="p-4 text-center">No menu items available.</p>;

  // Group items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      {/* Background with blur effect */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80"
          alt="menu background"
          className="w-full h-full object-cover opacity-40 blur-sm"
        />
      </div>

      {/* Overlay content */}
      <div className="relative z-10 max-w-6xl mx-auto p-6">
        {/* Hero Heading */}
        <h1 className="text-5xl font-extrabold text-center mb-10 tracking-widest text-yellow-400 drop-shadow-lg">
          AR MENU
        </h1>

        {/* Categories */}
        {Object.keys(groupedItems).map((category) => (
          <div key={category} className="mb-12">
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-yellow-400 inline-block pb-1">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {groupedItems[category].map((item) => (
                <div
                  key={item.id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-lg hover:scale-105 hover:shadow-2xl transition duration-300"
                >
                  {/* Image with correct Supabase path */}
                  <img
                    src={
                      item.image_url
                        ? supabase
                            .storage
                            .from("menu-images")
                            .getPublicUrl(`uploads/${item.image_url}`).publicURL
                        : "/placeholder.png"
                    }
                    alt={item.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-2xl font-semibold text-yellow-300 mb-2">{item.name}</h3>
                  <p className="text-gray-200 mb-3">{item.description}</p>
                  <p className="text-lg font-bold text-green-300">₹{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
