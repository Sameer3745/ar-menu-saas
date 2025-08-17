 import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import "@google/model-viewer";

/* ------------------------- ModelLab (Modal) ------------------------- */
function ModelLab({
  isOpen,
  onClose,
  initialModelPath,      // e.g. "uploads/xxxx.glb" or ""
  dishContext,           // { id, name } or null if opened from form
  onSavedModelPath,      // callback(path or "") -> set in form or refresh list
}) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [modelPath, setModelPath] = useState(initialModelPath || "");
  const [previewUrl, setPreviewUrl] = useState("");

  // derive preview from existing path (public URL) or from local file
  useEffect(() => {
    setError("");
    setInfo("");
    if (!isOpen) return;
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else if (modelPath) {
      const { data } = supabase.storage.from("menu-models").getPublicUrl(modelPath);
      setPreviewUrl(data?.publicUrl || "");
    } else {
      setPreviewUrl("");
    }
  }, [isOpen, selectedFile, modelPath]);

  function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // basic type guard
    const allowed = ["model/gltf-binary", "model/gltf+json", "application/octet-stream"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(file.type) && !["glb", "gltf"].includes(ext || "")) {
      setError("Please select a .glb or .gltf file.");
      return;
    }
    setError("");
    setSelectedFile(file);
  }

  async function uploadOrReplace() {
    if (!selectedFile) {
      setError("Pick or generate a model first.");
      return;
    }
    setWorking(true);
    setError("");
    setInfo("Uploading model...");

    try {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "glb";
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `uploads/${fileName}`;

      // upload
      const { error } = await supabase.storage
        .from("menu-models")
        .upload(filePath, selectedFile, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      setModelPath(filePath);
      setSelectedFile(null);
      setInfo("Model uploaded successfully.");
    } catch (e) {
      setError(e.message || "Upload failed");
    }
    setWorking(false);
  }

  async function deleteFromBucket() {
    if (!modelPath) {
      setError("No model to delete.");
      return;
    }
    setWorking(true);
    setError("");
    setInfo("Deleting model from bucket...");

    try {
      const { error } = await supabase.storage
        .from("menu-models")
        .remove([modelPath]);
      if (error) throw error;

      setModelPath("");
      setSelectedFile(null);
      setPreviewUrl("");
      setInfo("Model deleted.");
    } catch (e) {
      setError(e.message || "Delete failed");
    }
    setWorking(false);
  }

  // Stub for AI generation — replace with your API later
  async function generateWithAI() {
    setWorking(true);
    setError("");
    setInfo("Generating model with AI (demo stub)...");
    try {
      // create a dummy .glb blob as placeholder
      const blob = new Blob(["fake-3d-model"], { type: "model/gltf-binary" });
      const file = new File([blob], "generated_model.glb", { type: "model/gltf-binary" });
      setSelectedFile(file);
      setInfo("Model generated. Click Upload to save to bucket.");
    } catch (e) {
      setError("Model generation failed.");
    }
    setWorking(false);
  }

  async function saveToDish() {
    // If opened from row (dishContext has id) -> update DB immediately
    // If opened from form (dishContext is null) -> return path to parent to set in form
    try {
      if (dishContext?.id) {
        if (!modelPath) {
          // clear model_url in DB
          const { error } = await supabase
            .from("menu_items")
            .update({ model_url: "" })
            .eq("id", dishContext.id);
          if (error) throw error;
          onSavedModelPath(""); // to trigger refresh
        } else {
          const { error } = await supabase
            .from("menu_items")
            .update({ model_url: modelPath })
            .eq("id", dishContext.id);
          if (error) throw error;
          onSavedModelPath(modelPath);
        }
      } else {
        // form context
        onSavedModelPath(modelPath || "");
      }
      onClose();
    } catch (e) {
      setError(e.message || "Save failed");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-gray-200">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black">
            Model Lab {dishContext?.name ? `— ${dishContext.name}` : ""}
          </h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded border hover:bg-gray-100 text-black"
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-4 text-black">
          {error && <div className="p-2 rounded bg-red-100 text-red-700">{error}</div>}
          {info && <div className="p-2 rounded bg-blue-100 text-blue-700">{info}</div>}

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block mb-1 font-medium">Pick/Replace Model (.glb/.gltf)</label>
                <input
                  type="file"
                  accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                  onChange={onPickFile}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={generateWithAI}
                  disabled={working}
                  className={`px-4 py-2 rounded text-white ${working ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"}`}
                >
                  {working ? "Working..." : "Generate with AI (Demo)"}
                </button>
                <button
                  onClick={uploadOrReplace}
                  disabled={working || (!selectedFile)}
                  className={`px-4 py-2 rounded text-white ${working || (!selectedFile) ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {modelPath ? "Replace in Bucket" : "Upload to Bucket"}
                </button>
                <button
                  onClick={deleteFromBucket}
                  disabled={working || !modelPath}
                  className={`px-4 py-2 rounded text-white ${working || !modelPath ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}`}
                >
                  Delete from Bucket
                </button>
              </div>

              <div className="text-sm text-gray-600">
                Current Path: <span className="font-mono">{modelPath || "—"}</span>
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-2 flex items-center justify-center">
              {previewUrl ? (
                <model-viewer
                  src={previewUrl}
                  alt="3D Model Preview"
                  auto-rotate
                  camera-controls
                  style={{ width: "260px", height: "220px" }}
                />
              ) : (
                <div className="w-[260px] h-[220px] flex items-center justify-center text-gray-500 border border-dashed rounded">
                  No Preview
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100 text-black"
          >
            Cancel
          </button>
          <button
            onClick={saveToDish}
            disabled={working}
            className={`px-4 py-2 rounded text-white ${working ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
          >
            Save to {dishContext?.id ? "Item" : "Form"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- DishRow ------------------------- */
function DishRow({ dish, onEdit, onDelete, onOpenModelLab }) {
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
          onClick={() => onOpenModelLab(dish)}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
        >
          Model
        </button>
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

  // Model Lab state
  const [modelLabOpen, setModelLabOpen] = useState(false);
  const [modelLabContext, setModelLabContext] = useState(null); // { id, name } or null (form)

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
    return data.path; // e.g. uploads/xxxx.ext
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

      let modelUrl = newDish.model_url; // set by ModelLab if opened via form

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
    // focus form top: optional
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

  // ----- Open Model Lab from form or row -----
  function openModelLabFromForm() {
    setModelLabContext(null); // form context
    setModelLabOpen(true);
  }

  function openModelLabFromRow(dish) {
    setModelLabContext({ id: dish.id, name: dish.name }); // row context
    setModelLabOpen(true);
  }

  // callback when model lab saves
  function onModelLabSaved(path) {
    if (modelLabContext?.id) {
      // row context -> list refresh inside ModelLab already updated DB; we refresh list
      fetchMenu();
    } else {
      // form context -> set into form state
      const preview = path
        ? supabase.storage.from("menu-models").getPublicUrl(path).data?.publicUrl
        : null;
      setNewDish((prev) => ({
        ...prev,
        model_url: path || "",
        modelPreview: preview || null,
        model: null,
      }));
    }
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
          </div>

          <div className="flex flex-col items-center justify-center">
            {/* Image Preview */}
            {newDish.imagePreview ? (
              <img src={newDish.imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded mb-2 border" />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center border border-dashed border-gray-400 text-black rounded mb-2">
                Image Preview
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full mt-2 text-black" />

            {/* Model Preview + Open Lab */}
            {newDish.modelPreview ? (
              <model-viewer
                src={newDish.modelPreview}
                alt="3D Model Preview"
                auto-rotate
                camera-controls
                style={{ width: "200px", height: "200px", marginTop: "12px" }}
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center border border-dashed border-gray-400 text-black rounded mt-4">
                Model Preview
              </div>
            )}
            <button
              onClick={openModelLabFromForm}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Open Model Lab
            </button>
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
                  onOpenModelLab={openModelLabFromRow}
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

      {/* Model Lab Modal */}
      <ModelLab
        isOpen={modelLabOpen}
        onClose={() => setModelLabOpen(false)}
        initialModelPath={
          modelLabContext?.id
            ? (menuItems.find((m) => m.id === modelLabContext.id)?.model_url || "")
            : newDish.model_url
        }
        dishContext={modelLabContext /* null means form */}
        onSavedModelPath={onModelLabSaved}
      />
    </div>
  );
}
