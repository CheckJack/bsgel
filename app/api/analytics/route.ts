import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const period = searchParams.get("period") || "30" // days

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - parseInt(period) * 24 * 60 * 60 * 1000)

    // Build date filter
    const dateFilter = {
      createdAt: {
        gte: start,
        lte: end,
      },
    }

    // Fetch all orders with items
    const orders = await db.order.findMany({
      where: dateFilter,
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Fetch all products
    const products = await db.product.findMany({
      include: {
        category: true,
        orderItems: {
          where: {
            order: dateFilter,
          },
        },
      },
    })

    // Fetch all users
    const users = await db.user.findMany({
      where: {
        role: "USER",
        createdAt: dateFilter.createdAt,
      },
      include: {
        orders: {
          where: dateFilter,
        },
      },
    })

    // Fetch coupons analytics
    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
    })

    // Calculate KPIs
    const totalRevenue = orders.reduce(
      (sum, order) => sum + parseFloat(order.total.toString()),
      0
    )

    const totalOrders = orders.length
    const totalCustomers = users.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Order status breakdown
    const orderStatusBreakdown = orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Revenue by status
    const revenueByStatus = orders.reduce(
      (acc, order) => {
        const status = order.status
        acc[status] = (acc[status] || 0) + parseFloat(order.total.toString())
        return acc
      },
      {} as Record<string, number>
    )

    // Top products by revenue
    const productRevenue = new Map<string, { name: string; revenue: number; quantity: number; category: string | null }>()
    
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.productId
        const revenue = parseFloat(item.price.toString()) * item.quantity
        const existing = productRevenue.get(productId) || {
          name: item.product.name,
          revenue: 0,
          quantity: 0,
          category: item.product.category?.name || null,
        }
        productRevenue.set(productId, {
          name: existing.name,
          revenue: existing.revenue + revenue,
          quantity: existing.quantity + item.quantity,
          category: existing.category,
        })
      })
    })

    const topProducts = Array.from(productRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Revenue by category
    const categoryRevenue = new Map<string, number>()
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const categoryName = item.product.category?.name || "Uncategorized"
        const revenue = parseFloat(item.price.toString()) * item.quantity
        categoryRevenue.set(
          categoryName,
          (categoryRevenue.get(categoryName) || 0) + revenue
        )
      })
    })

    const revenueByCategory = Array.from(categoryRevenue.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)

    // Time series data for revenue
    const revenueByDay = new Map<string, number>()
    const ordersByDay = new Map<string, number>()
    const customersByDay = new Map<string, number>()

    // Initialize all days in range
    const currentDate = new Date(start)
    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split("T")[0]
      revenueByDay.set(dateKey, 0)
      ordersByDay.set(dateKey, 0)
      customersByDay.set(dateKey, 0)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Fill in actual data
    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split("T")[0]
      revenueByDay.set(
        dateKey,
        (revenueByDay.get(dateKey) || 0) + parseFloat(order.total.toString())
      )
      ordersByDay.set(
        dateKey,
        (ordersByDay.get(dateKey) || 0) + 1
      )
    })

    users.forEach((user) => {
      const dateKey = user.createdAt.toISOString().split("T")[0]
      customersByDay.set(
        dateKey,
        (customersByDay.get(dateKey) || 0) + 1
      )
    })

    // Convert to arrays for charts
    const revenueTimeSeries = Array.from(revenueByDay.entries())
      .map(([date, revenue]) => ({
        date,
        revenue: parseFloat(revenue.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const ordersTimeSeries = Array.from(ordersByDay.entries())
      .map(([date, count]) => ({
        date,
        orders: count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const customersTimeSeries = Array.from(customersByDay.entries())
      .map(([date, count]) => ({
        date,
        customers: count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate trends (compare with previous period)
    const previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()))
    const previousEnd = start

    const previousOrders = await db.order.findMany({
      where: {
        createdAt: {
          gte: previousStart,
          lt: previousEnd,
        },
      },
    })

    const previousRevenue = previousOrders.reduce(
      (sum, order) => sum + parseFloat(order.total.toString()),
      0
    )

    const revenueTrend =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0

    const ordersTrend =
      previousOrders.length > 0
        ? ((totalOrders - previousOrders.length) / previousOrders.length) * 100
        : 0

    // Customer metrics
    const previousUsers = await db.user.count({
      where: {
        role: "USER",
        createdAt: {
          gte: previousStart,
          lt: previousEnd,
        },
      },
    })

    const customersTrend =
      previousUsers > 0
        ? ((totalCustomers - previousUsers) / previousUsers) * 100
        : 0

    // Repeat customers
    const repeatCustomers = users.filter((user) => user.orders.length > 1).length
    const repeatCustomerRate =
      totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0

    // Coupon analytics
    const totalCoupons = coupons.length
    const activeCoupons = coupons.filter((c) => c.isActive).length
    const totalCouponUsage = coupons.reduce((sum, c) => sum + c.usedCount, 0)

    // Calculate discount given (estimate from notifications)
    const notifications = await db.notification.findMany({
      where: {
        type: "ORDER",
        createdAt: dateFilter.createdAt,
      },
    })

    let totalDiscountGiven = 0
    notifications.forEach((notification) => {
      const metadata = notification.metadata as any
      if (metadata?.couponCode && metadata?.total) {
        const coupon = coupons.find((c) => c.code === metadata.couponCode)
        if (coupon) {
          const orderTotal = parseFloat(metadata.total) || 0
          if (coupon.discountType === "PERCENTAGE") {
            const discount = (orderTotal * Number(coupon.discountValue)) / 100
            totalDiscountGiven += Math.min(
              discount,
              Number(coupon.maxDiscountAmount || discount)
            )
          } else {
            totalDiscountGiven += Math.min(
              Number(coupon.discountValue),
              orderTotal
            )
          }
        }
      }
    })

    return NextResponse.json({
      // KPIs
      kpis: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        totalCustomers,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        pendingOrders: orderStatusBreakdown.PENDING || 0,
        revenueTrend: parseFloat(revenueTrend.toFixed(2)),
        ordersTrend: parseFloat(ordersTrend.toFixed(2)),
        customersTrend: parseFloat(customersTrend.toFixed(2)),
      },
      // Charts data
      revenueTimeSeries,
      ordersTimeSeries,
      customersTimeSeries,
      orderStatusBreakdown,
      revenueByStatus,
      revenueByCategory,
      topProducts,
      // Customer metrics
      customerMetrics: {
        repeatCustomers,
        repeatCustomerRate: parseFloat(repeatCustomerRate.toFixed(2)),
        newCustomers: totalCustomers,
      },
      // Coupon metrics
      couponMetrics: {
        totalCoupons,
        activeCoupons,
        totalCouponUsage,
        totalDiscountGiven: parseFloat(totalDiscountGiven.toFixed(2)),
      },
      // Date range
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    })
  } catch (error) {
    console.error("Failed to fetch analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}

