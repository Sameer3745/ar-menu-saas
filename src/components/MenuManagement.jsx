 import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import "@google/model-viewer";

/* ------------------------- DishRow ------------------------- */
function DishRow({ dish, onEdit, onDelete }) {
  let imageUrl = "/placeholder.png";
  if (dish.image_url) {
    const { data } = supabase.storage.from("menu-images").getPublicUrl(dish.image_url);
    if (data?.publicUrl) imageUrl = data.publicUrl;
  }

  return (
    <tr className="hover:bg-gray-100">
      <td className="p-3">
        <img src={imageUrl} alt={dish.name} className="w-16 h-16 object-cover rounded border" />
      </td>
      <td className="p-3 font-medium text-black">{dish.name}</td>
      <td className="p-3 text-black">{dish.category || "-"}</td>
      <td className="p-3 text-black">{dish.description}</td>
      <td className="p-3 font-semibold text-green-600">₹{Number(dish.price).toFixed(2)}</td>
      <td className="p-3 flex flex-wrap gap-2">
        <button
          onClick={() => onEdit(dish)}
          className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-black rounded"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(dish)}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

/* ------------------------- MenuManagement ------------------------- */
export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [newDish, setNewDish] = useState({
    id: null,
    name: "",
    category: "",
    description: "",
    price: "",
    image: null,
    imagePreview: null,
    image_url: "",
    model: null,
    modelPreview: null,
    model_url: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await supabase.from("menu_items").select("*").order("id", { ascending: false });
      if (error) setErrorMsg("Failed to load menu items: " + error.message);
      else setMenuItems(data || []);
    } catch (err) {
      setErrorMsg("Unexpected error occurred");
    }
    setLoading(false);
  }

  function resetForm() {
    setNewDish({
      id: null,
      name: "",
      category: "",
      description: "",
      price: "",
      image: null,
      imagePreview: null,
      image_url: "",
      model: null,
      modelPreview: null,
      model_url: "",
    });
    setIsEditing(false);
    setErrorMsg("");
    setSuccessMsg("");
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setNewDish((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setNewDish((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  }

  async function uploadFile(file, bucket) {
    if (!file) return "";
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) throw error;
    return data.path;
  }

  // -------- Handle Model Upload --------
  async function handleModelUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await uploadFile(file, "menu-models");
      const { data } = supabase.storage.from("menu-models").getPublicUrl(path);
      setNewDish((prev) => ({
        ...prev,
        model: file,
        model_url: path,
        modelPreview: data?.publicUrl || null,
      }));
      setSuccessMsg("3D Model uploaded successfully!");
    } catch (err) {
      setErrorMsg("Failed to upload 3D Model.");
    }
  }

  async function handleDeleteModel() {
    if (!newDish.model_url) return;
    try {
      await supabase.storage.from("menu-models").remove([newDish.model_url]);
      setNewDish((prev) => ({
        ...prev,
        model: null,
        model_url: "",
        modelPreview: null,
      }));
      setSuccessMsg("3D Model deleted successfully!");
    } catch (err) {
      setErrorMsg("Failed to delete 3D Model.");
    }
  }

  async function handleSubmit() {
    setErrorMsg("");
    setSuccessMsg("");

    if (!newDish.name.trim()) return setErrorMsg("Dish name is required");
    if (!newDish.category.trim()) return setErrorMsg("Category is required");
    if (!newDish.price || isNaN(newDish.price)) return setErrorMsg("Valid price is required");

    setFormLoading(true);
    try {
      let imageUrl = newDish.image_url;
      if (newDish.image) imageUrl = await uploadFile(newDish.image, "menu-images");

      let modelUrl = newDish.model_url;

      if (isEditing) {
        const { error } = await supabase
          .from("menu_items")
          .update({
            name: newDish.name,
            category: newDish.category,
            description: newDish.description,
            price: parseFloat(newDish.price),
            image_url: imageUrl,
            model_url: modelUrl,
          })
          .eq("id", newDish.id);
        if (error) throw error;
        setSuccessMsg("Dish updated successfully!");
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { error } = await supabase.from("menu_items").insert([
          {
            owner_id: user.id,
            name: newDish.name,
            category: newDish.category,
            description: newDish.description,
            price: parseFloat(newDish.price),
            image_url: imageUrl,
            model_url: modelUrl,
            is_public: true,
          },
        ]);
        if (error) throw error;
        setSuccessMsg("Dish added successfully!");
      }

      resetForm();
      fetchMenu();
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong!");
    }
    setFormLoading(false);
  }

  function handleEdit(dish) {
    let imgPreview = null;
    let mdlPreview = null;

    if (dish.image_url) {
      const { data } = supabase.storage.from("menu-images").getPublicUrl(dish.image_url);
      imgPreview = data?.publicUrl || null;
    }
    if (dish.model_url) {
      const { data } = supabase.storage.from("menu-models").getPublicUrl(dish.model_url);
      mdlPreview = data?.publicUrl || null;
    }

    setNewDish({
      id: dish.id,
      name: dish.name,
      category: dish.category || "",
      description: dish.description || "",
      price: dish.price,
      image: null,
      image_url: dish.image_url,
      imagePreview: imgPreview,
      model: null,
      model_url: dish.model_url,
      modelPreview: mdlPreview,
    });
    setIsEditing(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  function handleDelete(dish) {
    setDeleteConfirm(dish);
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", deleteConfirm.id);
      if (error) throw error;
      setSuccessMsg("Dish deleted successfully!");
      setDeleteConfirm(null);
      fetchMenu();
    } catch (err) {
      setErrorMsg(err.message || "Delete failed!");
    }
    setLoading(false);
  }

  function cancelDelete() {
    setDeleteConfirm(null);
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-black">Menu Management</h1>

      {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{errorMsg}</div>}
      {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{successMsg}</div>}

      {/* Form */}
      <div className="mb-8 p-6 bg-white rounded shadow-md text-black">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? "Edit Dish" : "Add New Dish"}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Dish Name"
              value={newDish.name}
              onChange={handleInputChange}
              className="border rounded p-3 w-full bg-white text-black border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="category"
              placeholder="Category"
              value={newDish.category}
              onChange={handleInputChange}
              className="border rounded p-3 w-full bg-white text-black border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              name="description"
              placeholder="Description"
              value={newDish.description}
              onChange={handleInputChange}
              className="border rounded p-3 w-full bg-white text-black border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <input
              type="number"
              name="price"
              placeholder="Price (₹)"
              value={newDish.price}
              onChange={handleInputChange}
              className="border rounded p-3 w-full bg-white text-black border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Big 3D Model Upload Box */}
            <div className="mt-4 border-2 border-dashed border-blue-500 rounded-lg p-6 flex flex-col items-center justify-center bg-blue-50">
              {newDish.modelPreview ? (
                <div className="flex flex-col items-center">
                  <model-viewer
                    src={newDish.modelPreview}
                    alt="3D Model Preview"
                    auto-rotate
                    camera-controls
                    style={{ width: "200px", height: "200px" }}
                  />
                  <button
                    onClick={handleDeleteModel}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete 3D Model
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center text-blue-600">
                  <span className="text-lg font-medium">Upload 3D Model</span>
                  <input
                    type="file"
                    accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                    onChange={handleModelUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="flex flex-col items-center justify-center">
            {newDish.imagePreview ? (
              <img src={newDish.imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded mb-2 border" />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center border border-dashed border-gray-400 text-black rounded mb-2">
                Image Preview
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full mt-2 text-black" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleSubmit}
            disabled={formLoading}
            className={`px-6 py-2 rounded text-white ${
              formLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {formLoading ? (isEditing ? "Updating..." : "Adding...") : isEditing ? "Update Dish" : "Add Dish"}
          </button>
          {isEditing && (
            <button
              onClick={resetForm}
              disabled={formLoading}
              className="px-6 py-2 rounded border border-black hover:bg-gray-200 text-black"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-white">
            <tr>
              <th className="p-3 text-left text-black">Image</th>
              <th className="p-3 text-left text-black">Name</th>
              <th className="p-3 text-left text-black">Category</th>
              <th className="p-3 text-left text-black">Description</th>
              <th className="p-3 text-left text-black">Price</th>
              <th className="p-3 text-left text-black">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-black">
                  Loading menu items...
                </td>
              </tr>
            ) : menuItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-black">
                  No menu items found.
                </td>
              </tr>
            ) : (
              menuItems.map((dish) => (
                <DishRow
                  key={dish.id}
                  dish={dish}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-sm w-full shadow-lg border border-gray-300">
            <h3 className="text-lg font-semibold mb-4 text-black">
              Are you sure you want to delete{" "}
              <span className="text-red-600">{deleteConfirm.name}</span>?
            </h3>
            <div className="flex justify-end space-x-4">
              <button onClick={cancelDelete} className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100 text-black">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
