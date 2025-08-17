 import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "@google/model-viewer";

export default function PublicMenu() {
  const { profileId } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedModel, setSelectedModel] = useState(null); // AR Model modal state

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const { data, error } = await supabase
          .from("menu_items")
          .select("id, name, description, price, image_url, category, model_url")
          .eq("owner_id", profileId)
          .eq("is_public", true);

        if (error) throw error;

        console.log("Fetched Menu Items:", data);
        setMenuItems(data || []);
      } catch (error) {
        console.error("Error fetching menu items:", error);
        setErrorMsg("Failed to load menu items.");
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      fetchMenuItems();
    } else {
      setLoading(false);
      setErrorMsg("Invalid profile ID.");
    }
  }, [profileId]);

  if (loading) return <p className="p-4 text-center">Loading menu...</p>;
  if (errorMsg) return <p className="p-4 text-center text-red-600">{errorMsg}</p>;
  if (menuItems.length === 0) return <p className="p-4 text-center">No menu items available.</p>;

  // Group items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    const cat = item.category ? item.category.trim() : "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const sortedCategories = Object.keys(groupedItems);

  // Dummy fallback models (food-related for testing)
  const fallbackModels = {
    Burger: "https://modelviewer.dev/shared-assets/models/ShopifyModels/Burger.glb",
    Pizza: "https://modelviewer.dev/shared-assets/models/ShopifyModels/Pizza.glb",
    Coffee: "https://modelviewer.dev/shared-assets/models/ShopifyModels/Coffee.glb",
    Default: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
  };

  // Function to choose model
  const getModelUrl = (item) => {
    if (item.model_url) return item.model_url;

    if (item.name.toLowerCase().includes("burger")) return fallbackModels.Burger;
    if (item.name.toLowerCase().includes("pizza")) return fallbackModels.Pizza;
    if (item.name.toLowerCase().includes("coffee")) return fallbackModels.Coffee;

    return fallbackModels.Default;
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80"
          alt="menu background"
          className="w-full h-full object-cover opacity-40 blur-sm"
        />
      </div>

      {/* Overlay */}
      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6">
        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-2 tracking-widest text-yellow-400 drop-shadow-lg">
          AR MENU
        </h1>
        {/* Info Line */}
        <p className="text-center text-lg text-gray-200 mb-8">
          Tap on any item to view its <span className="text-yellow-400 font-semibold">real-world 3D model</span> in AR.
        </p>

        {/* Category-wise */}
        {sortedCategories.map((category) => (
          <div
            key={category}
            className="mb-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-lg"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-yellow-400 border-b-2 border-yellow-400 inline-block pb-1">
              {category}
            </h2>

            {/* Responsive Table Wrapper */}
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
                        onClick={() => setSelectedModel(getModelUrl(item))}
                      >
                        <td className="py-2 px-4">
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

        {/* AR Modal */}
        {selectedModel && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-4 w-[90%] h-[80%] relative">
              <button
                className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => setSelectedModel(null)}
              >
                Close
              </button>

              <model-viewer
                src={selectedModel}
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                auto-rotate
                style={{ width: "100%", height: "100%" }}
              ></model-viewer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
