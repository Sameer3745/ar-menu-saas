 import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

function DishItem({ dish, onEdit, onDelete }) {
  const imageUrl = dish.image_url
    ? supabase.storage.from('menu-images').getPublicUrl(dish.image_url).publicURL
    : '/placeholder.png'

  return (
    <li className="mb-4 p-4 bg-white rounded shadow flex items-center">
      <img
        src={imageUrl}
        alt={dish.name}
        className="w-20 h-20 object-cover rounded mr-6 flex-shrink-0"
      />
      <div className="flex-grow">
        <h3 className="font-semibold text-lg">{dish.name}</h3>
        <p className="text-gray-700">{dish.description}</p>
        <p className="font-bold mt-1 text-green-700">₹{dish.price.toFixed(2)}</p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(dish)}
          className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded"
          aria-label={`Edit ${dish.name}`}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(dish)}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
          aria-label={`Delete ${dish.name}`}
        >
          Delete
        </button>
      </div>
    </li>
  )
}

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [newDish, setNewDish] = useState({
    id: null,
    name: '',
    description: '',
    price: '',
    image: null,
    imagePreview: null,
    image_url: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchMenu()
  }, [])

  async function fetchMenu() {
    setLoading(true)
    setErrorMsg('')
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('id', { ascending: false })

      if (error) {
        console.error('Failed to fetch menu:', error)
        setErrorMsg('Failed to load menu items: ' + error.message)
      } else {
        setMenuItems(data)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setErrorMsg('Unexpected error occurred')
    }
    setLoading(false)
  }

  function resetForm() {
    setNewDish({ id: null, name: '', description: '', price: '', image: null, imagePreview: null, image_url: '' })
    setIsEditing(false)
    setErrorMsg('')
    setSuccessMsg('')
  }

  function handleInputChange(e) {
    const { name, value } = e.target
    setNewDish((prev) => ({ ...prev, [name]: value }))
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (file) {
      setNewDish((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }))
    }
  }

  async function uploadImage(imageFile) {
    if (!imageFile) return ''

    try {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        console.error('Upload error:', error)
        throw error
      }

      return data.path
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  async function handleSubmit() {
    setErrorMsg('')
    setSuccessMsg('')

    if (!newDish.name.trim()) {
      setErrorMsg('Dish name is required')
      return
    }
    if (!newDish.price || isNaN(newDish.price)) {
      setErrorMsg('Valid price is required')
      return
    }

    setFormLoading(true)

    try {
      let imageUrl = newDish.image_url || ''
      if (newDish.image) {
        imageUrl = await uploadImage(newDish.image)
      }

      if (isEditing) {
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: newDish.name,
            description: newDish.description,
            price: parseFloat(newDish.price),
            image_url: imageUrl,
          })
          .eq('id', newDish.id)

        if (error) throw error
        setSuccessMsg('Dish updated successfully!')
      } else {
        // ✅ Fix: owner_id automatically set
        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase.from('menu_items').insert([
          {
            owner_id: user.id,          // owner_id set here
            name: newDish.name,
            description: newDish.description,
            price: parseFloat(newDish.price),
            image_url: imageUrl,
            is_public: true             // default public
          },
        ])

        if (error) throw error
        setSuccessMsg('Dish added successfully!')
      }

      resetForm()
      fetchMenu()
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong!')
    }

    setFormLoading(false)
  }

  function handleEdit(dish) {
    setNewDish({
      id: dish.id,
      name: dish.name,
      description: dish.description || '',
      price: dish.price,
      image: null,
      image_url: dish.image_url,
      imagePreview: dish.image_url
        ? supabase.storage.from('menu-images').getPublicUrl(dish.image_url).publicURL
        : null,
    })
    setIsEditing(true)
    setErrorMsg('')
    setSuccessMsg('')
  }

  function handleDelete(dish) {
    setDeleteConfirm(dish)
  }

  async function confirmDelete() {
    if (!deleteConfirm) return

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', deleteConfirm.id)
      if (error) throw error
      setSuccessMsg('Dish deleted successfully!')
      setDeleteConfirm(null)
      fetchMenu()
    } catch (err) {
      setErrorMsg(err.message || 'Delete failed!')
    }

    setLoading(false)
  }

  function cancelDelete() {
    setDeleteConfirm(null)
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Menu Management</h1>

      {/* Success/Error messages */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{errorMsg}</div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{successMsg}</div>
      )}

      {/* Add/Edit Dish Form */}
      <div className="mb-8 p-6 bg-white rounded shadow-md">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Dish' : 'Add New Dish'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Dish Name"
              value={newDish.name}
              onChange={handleInputChange}
              className="border rounded p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              name="description"
              placeholder="Description"
              value={newDish.description}
              onChange={handleInputChange}
              className="border rounded p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <input
              type="number"
              name="price"
              placeholder="Price (₹)"
              value={newDish.price}
              onChange={handleInputChange}
              className="border rounded p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col items-center justify-center">
            {newDish.imagePreview ? (
              <img
                src={newDish.imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded mb-2 border"
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center border border-dashed border-gray-400 text-gray-400 mb-2 rounded">
                Image Preview
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
            />
          </div>
        </div>
        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleSubmit}
            disabled={formLoading}
            className={`px-6 py-2 rounded text-white ${
              formLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {formLoading ? (isEditing ? 'Updating...' : 'Adding...') : isEditing ? 'Update Dish' : 'Add Dish'}
          </button>
          {isEditing && (
            <button
              onClick={resetForm}
              disabled={formLoading}
              className="px-6 py-2 rounded border border-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Menu Items List */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Existing Menu Items</h2>
        {loading ? (
          <p>Loading menu items...</p>
        ) : menuItems.length === 0 ? (
          <p className="text-gray-600">No menu items found.</p>
        ) : (
          <ul>
            {menuItems.map((dish) => (
              <DishItem key={dish.id} dish={dish} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </ul>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to delete <span className="text-red-600">{deleteConfirm.name}</span>?
            </h3>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
