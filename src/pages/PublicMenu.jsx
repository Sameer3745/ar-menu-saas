 import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function PublicMenu() {
  const { profileId } = useParams(); // QR link se profileId
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const { data, error } = await supabase
          .from("menu_items") // correct table name
          .select("id, name, description, price, image_url")
          .eq("owner_id", profileId)
          .eq("is_public", true);

        if (error) throw error;

        setMenuItems(data);
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Menu</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 shadow hover:shadow-lg transition"
          >
            {item.image_url && (
              <img
                src={supabase.storage.from("menu-images").getPublicUrl(item.image_url).publicURL}
                alt={item.name}
                className="w-full h-48 object-cover rounded mb-4"
              />
            )}
            <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
            <p className="text-gray-700 mb-2">{item.description}</p>
            <p className="text-indigo-600 font-bold">₹{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
