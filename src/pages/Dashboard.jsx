  import { useEffect, useState } from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import DashboardHome from '../components/DashboardHome'  // <-- Import yahan kiya

import {
  Menu as MenuIcon,
  User,
  Bell,
  Search,
  QrCode,
  BarChart3,
  Home,
  Utensils,
  ShoppingCart,
  Settings,
  CreditCard,
  Megaphone,
} from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUser(data.user)
      } else {
        navigate('/auth')
      }
      setLoading(false)
    }
    getUser()
  }, [navigate])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Logout failed:', error.message)
    else navigate('/auth')
  }

  const routePathForLabel = (label) => {
    switch (label) {
      case 'Overview':
        return '/dashboard'
      case 'Menu Management':
        return '/dashboard/menu'
      case 'Orders':
        return '/dashboard/orders'
      case 'Analytics':
        return '/dashboard/analytics'
      case 'QR Code':
        return '/dashboard/qrcode'
      case 'Settings':
        return '/dashboard/settings'
      case 'Subscription':
        return '/dashboard/subscription'
      case 'Promotions':
        return '/dashboard/promotions'
      default:
        return '/dashboard'
    }
  }

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">Checking session...</p>
    )
  }

  const displayName = user?.user_metadata?.full_name || user?.email || 'User'

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg flex flex-col transition-all duration-300 border-r`}
      >
        <div className="flex items-center justify-between p-4 border-b bg-white">
          {sidebarOpen && <h2 className="text-xl font-bold text-black">AR Menu</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-gray-200 bg-white"
            aria-label="Toggle Sidebar"
          >
            <MenuIcon className="w-6 h-6 text-black" />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {[
            { icon: <Home />, label: 'Overview' },
            { icon: <Utensils />, label: 'Menu Management' },
            { icon: <ShoppingCart />, label: 'Orders' },
            { icon: <BarChart3 />, label: 'Analytics' },
            { icon: <QrCode />, label: 'QR Code' },
            { icon: <Settings />, label: 'Settings' },
            { icon: <CreditCard />, label: 'Subscription' },
            { icon: <Megaphone />, label: 'Promotions' },
          ].map((item, i) => {
            const path = routePathForLabel(item.label)
            const isActive = location.pathname === path
            return (
              <button
                key={i}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 p-2 rounded hover:bg-gray-200 transition bg-white ${
                  isActive ? 'bg-gray-300 font-semibold' : ''
                }`}
                aria-label={item.label}
                title={item.label}
              >
                <span className="w-5 h-5 text-black">{item.icon}</span>
                {sidebarOpen && (
                  <span className="text-sm font-medium text-black">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Section */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white shadow px-4 py-3 flex items-center justify-between border-b">
          {/* Left: Search */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search menu..."
                className="border rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-black"
              />
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-black" />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full bg-white hover:bg-gray-100">
              <Bell className="w-5 h-5 text-black" />
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                3
              </span>
            </button>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-black" />
              <span className="text-sm font-medium text-black">{displayName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 text-sm transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 space-y-6 overflow-y-auto flex-1 bg-gray-100">
          {/* Agar path /dashboard hai toh DashboardHome dikhao, warna child routes Outlet dikhao */}
          {location.pathname === '/dashboard' ? <DashboardHome /> : <Outlet />}
        </main>
      </div>
    </div>
  )
}
