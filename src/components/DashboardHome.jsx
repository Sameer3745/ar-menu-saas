  import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function DashboardHome() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function fetchUserAndOrders() {
      setLoading(true)

      // Get current logged-in user
      const { data: { user: loggedInUser } } = await supabase.auth.getUser()
      if (!loggedInUser) {
        console.error('No user logged in')
        setLoading(false)
        return
      }
      setUser(loggedInUser)

      // Today's date range
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      // Fetch orders only for this owner
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*') // Select all relevant columns
        .eq('owner_id', loggedInUser.id) // Only logged-in owner's orders
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())

      if (error) {
        console.error('Error fetching orders:', error)
      } else {
        setOrders(ordersData)
      }
      setLoading(false)
    }

    fetchUserAndOrders()
  }, [])

  if (loading)
    return (
      <p className="text-black text-center">
        Loading dashboard data...
      </p>
    )

  // Total Orders
  const totalOrders = orders.length

  // Total Revenue (sum of 'amount' column)
  const totalRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.amount || 0),
    0
  )

  // Active Customers (unique customer_name)
  const activeCustomersCount = new Set(
    orders.map(order => order.customer_name)
  ).size

  // Best Seller calculation
  const itemCountMap = {}
  orders.forEach(order => {
    let itemsList = []
    try {
      // If items are stored as JSON array
      itemsList = JSON.parse(order.items)
      if (!Array.isArray(itemsList)) itemsList = []
    } catch {
      // If items are comma separated string
      itemsList = order.items
        ? order.items.split(',').map(i => i.trim())
        : []
    }

    itemsList.forEach(item => {
      const itemName = typeof item === 'object' && item.name ? item.name : item
      itemCountMap[itemName] = (itemCountMap[itemName] || 0) + 1
    })
  })

  let bestSellerName = 'N/A'
  let maxCount = 0
  for (const item in itemCountMap) {
    if (itemCountMap[item] > maxCount) {
      maxCount = itemCountMap[item]
      bestSellerName = item
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-black">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg shadow-sm border bg-purple-50 text-purple-700">
          <div className="text-lg font-semibold">{totalOrders}</div>
          <div className="text-sm">Today's Total Orders</div>
        </div>

        <div className="p-4 rounded-lg shadow-sm border bg-green-50 text-green-700">
          <div className="text-lg font-semibold">₹{totalRevenue.toFixed(2)}</div>
          <div className="text-sm">Today's Total Earnings</div>
        </div>

        <div className="p-4 rounded-lg shadow-sm border bg-blue-50 text-blue-700">
          <div className="text-lg font-semibold">{activeCustomersCount}</div>
          <div className="text-sm">Active Customers</div>
        </div>

        <div className="p-4 rounded-lg shadow-sm border bg-yellow-50 text-yellow-700">
          <div className="text-lg font-semibold">{bestSellerName}</div>
          <div className="text-sm">Best Seller</div>
        </div>
      </div>
    </div>
  )
}
