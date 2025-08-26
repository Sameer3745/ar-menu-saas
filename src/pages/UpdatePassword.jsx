 import { useState, useEffect } from "react"
import { supabase } from "../lib/supabaseClient"
import { useNavigate } from "react-router-dom"

export default function UpdatePassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false)
  const navigate = useNavigate()

  // 🔹 Detect if user came from reset link and prevent dashboard auto-open
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const type = urlParams.get("type") || urlParams.get("recovery")
    if (type === "recovery" || window.location.href.includes("access_token")) {
      setIsRecoveryFlow(true)
      // 🔹 Clear any auto-login session to prevent dashboard open
      supabase.auth.signOut()
    }
  }, [])

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess("Password updated successfully! Redirecting to login...")

      // 🔹 Logout to ensure user is fully signed out
      await supabase.auth.signOut()

      // Redirect to login page after 2 seconds
      setTimeout(() => navigate("/auth"), 2000)
    }
  }

  return (
    <div 
      className="flex items-center justify-center min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80')" }}
    >
      {/* Blur Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      <form 
        onSubmit={handleUpdatePassword} 
        className="relative bg-white/95 p-10 rounded-3xl shadow-2xl w-96 space-y-6 z-10"
      >
        {/* AR Circle inside form */}
        <div className="bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <span className="text-white text-xl font-bold">AR</span>
        </div>

        <h2 className="text-2xl font-semibold text-center text-gray-800 mt-4">
          Reset Your Password
        </h2>

        <input
          type="password"
          placeholder="New Password"
          className="w-full border border-gray-300 rounded-xl p-3 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full border border-gray-300 rounded-xl p-3 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-medium"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  )
}
