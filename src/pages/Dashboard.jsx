 import { useEffect, useState } from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import DashboardHome from '../components/DashboardHome'
import MenuManagement from '../components/MenuManagement'
import {
  Menu as MenuIcon,
  User,
  Bell,
  QrCode,
  Home,
  Utensils,
  ShoppingCart,
  Settings,
} from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [recentOrders, setRecentOrders] = useState([])
  const [showNotificationBox, setShowNotificationBox] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Check user session
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

  // Realtime subscription for new orders
  useEffect(() => {
    const subscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          setNewOrdersCount((prev) => prev + 1)
          setRecentOrders((prev) => [
            { id: payload.new.id, customer_name: payload.new.customer_name },
            ...prev,
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

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
      case 'QR Code':
        return '/dashboard/qrcode'
      case 'Settings':
        return '/dashboard/settings'
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
    <div className="flex h-screen min-h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg flex flex-col transition-all duration-300 border-r`}
      >
        <div className="flex items-center justify-between p-4 border-b bg-white">
          {sidebarOpen && <h2 className="text-xl font-bold text-black">Sidebar</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-gray-200 bg-white"
            aria-label="Toggle Sidebar"
          >
            <MenuIcon className="w-6 h-6 text-black" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {[
            { icon: <Home />, label: 'Overview' },
            { icon: <Utensils />, label: 'Menu Management' },
            { icon: <ShoppingCart />, label: 'Orders' },
            { icon: <QrCode />, label: 'QR Code' },
            { icon: <Settings />, label: 'Settings' },
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

          {/* Profile + Logout */}
          <div className="mt-auto pt-2 border-t space-y-2">
            <div className="flex items-center gap-2 p-2">
              <User className="w-5 h-5 text-black" />
              {sidebarOpen && <span className="text-sm font-medium text-black">{displayName}</span>}
            </div>
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 text-sm transition"
              >
                Logout
              </button>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Section */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white shadow px-4 py-3 flex items-center justify-between border-b flex-shrink-0 relative">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-black">
              AR Menu...
            </h1>
            <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
          </div>

          {/* Notification bell */}
          <div className="flex items-center gap-4 relative">
            <button
              className="relative p-2 rounded-full bg-white hover:bg-gray-100"
              onClick={() => {
                setShowNotificationBox(!showNotificationBox)
                setNewOrdersCount(0) // reset count on click
                if (!showNotificationBox) setRecentOrders([]) // clear orders when opening
              }}
            >
              <Bell className="w-5 h-5 text-black" />
              {newOrdersCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {newOrdersCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotificationBox && (
              <div className="absolute right-0 mt-2 w-56 bg-white border shadow-lg rounded-md p-2 z-50">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div key={order.id} className="text-sm text-black border-b last:border-b-0 py-1">
                      New order received: {order.customer_name}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-black py-1">No orders</div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="p-6 space-y-6 overflow-y-auto flex-1 bg-gray-100">
          {location.pathname === '/dashboard' ? (
            <DashboardHome />
          ) : location.pathname === '/dashboard/menu' ? (
            <div className="space-y-6">
              <MenuManagement />
              <div className="max-h-96 overflow-y-auto border rounded bg-white shadow">
                {/* Add New Dish Table */}
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}
