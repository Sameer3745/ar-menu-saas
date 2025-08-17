 import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function DashboardHome() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true)
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id, customer_name, items, amount, status, created_at')
      if (error) {
        console.error('Error fetching orders:', error)
      } else {
        setOrders(ordersData)
      }
      setLoading(false)
    }
    fetchOrders()
  }, [])

  if (loading) return <p>Loading dashboard data...</p>

  // Total Orders
  const totalOrders = orders.length

  // Total Revenue
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0)

  // Active Customers (unique customer_name)
  const activeCustomersCount = new Set(orders.map(order => order.customer_name)).size

  // Best Seller calculation (items column me se item count)
  // Assume items column is a string like: "Margherita Pizza, Veggie Burger"
  // Ya ho sakta hai JSON array — us hisaab se adjust karna

  const itemCountMap = {}
  orders.forEach(order => {
    let itemsList = []
    try {
      // Try parse JSON if items stored as JSON array
      itemsList = JSON.parse(order.items)
      if (!Array.isArray(itemsList)) itemsList = []
    } catch {
      // If not JSON, assume comma separated string
      itemsList = order.items ? order.items.split(',').map(i => i.trim()) : []
    }
    itemsList.forEach(item => {
      itemCountMap[item] = (itemCountMap[item] || 0) + 1
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
          <div className="text-2xl"></div>
          <div className="text-lg font-semibold">{totalOrders}</div>
          <div className="text-sm">Today's Orders</div>
        </div>

        <div className="p-4 rounded-lg shadow-sm border bg-green-50 text-green-700">
          <div className="text-2xl"></div>
          <div className="text-lg font-semibold">₹{totalRevenue.toFixed(2)}</div>
          <div className="text-sm">Total Revenue</div>
        </div>

        <div className="p-4 rounded-lg shadow-sm border bg-blue-50 text-blue-700">
          <div className="text-2xl"></div>
          <div className="text-lg font-semibold">{activeCustomersCount}</div>
          <div className="text-sm">Active Customers</div>
        </div>

        <div className="p-4 rounded-lg shadow-sm border bg-yellow-50 text-yellow-700">
          <div className="text-2xl"></div>
          <div className="text-lg font-semibold">{bestSellerName}</div>
          <div className="text-sm">Best Seller</div>
        </div>
      </div>
    </div>
  )
}
