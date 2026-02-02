import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch counts and aggregates efficiently
    const [
      totalProducts,
      totalOrders,
      totalRevenueResult,
      pendingOrders,
    ] = await Promise.all([
      db.product.count(),
      db.order.count(),
      db.order.aggregate({
        _sum: {
          total: true,
        },
      }),
      db.order.count({
        where: {
          status: {
            in: ["PENDING", "PROCESSING"],
          },
        },
      }),
    ]);

    // Fetch orders by month for the last 12 months using raw SQL for efficiency
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    
    const monthlyStats = await db.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(*)::bigint as count
      FROM "Order"
      WHERE "createdAt" >= ${twelveMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month ASC
    `;

    // Process grouped data into monthly buckets
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const ordersTimeSeries = [];
    const earningsTimeSeries = [];
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const stat = monthlyStats.find(s => s.month === monthKey);
      
      ordersTimeSeries.push({
        month: monthNames[d.getMonth()],
        orders: stat ? Number(stat.count) : 0,
      });
    }

    // Earnings time series for the last 8 months as requested by OrdersEarnings component
    const eightMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, 1);
    const monthlyEarningsRaw = await db.$queryRaw<Array<{ month: string; revenue: number }>>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        SUM(total)::float as revenue
      FROM "Order"
      WHERE "createdAt" >= ${eightMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month ASC
    `;

    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const stat = monthlyEarningsRaw.find(s => s.month === monthKey);
      const revenue = stat ? Number(stat.revenue) : 0;
      
      earningsTimeSeries.push({
        month: monthNames[d.getMonth()],
        revenue: Math.round(revenue),
        profit: Math.round(revenue * 0.75), // Estimate profit as 75% as in the component
      });
    }

    // Recent orders (last 5)
    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: {
          take: 1,
          include: {
            product: {
              select: {
                name: true,
                image: true,
                images: true,
              },
            },
          },
        },
      },
    });

    const formattedRecentOrders = recentOrders.map((order) => {
      const firstItem = order.items?.[0];
      const productName = firstItem?.product?.name || "Unknown Product";
      const productImage = firstItem?.product?.image || firstItem?.product?.images?.[0] || null;
      return {
        product: productName.length > 30 ? productName.substring(0, 30) + "..." : productName,
        price: `€${parseFloat(order.total.toString()).toFixed(2)}`,
        date: new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        image: productImage,
      };
    });

    // Top products (by quantity) and Top Countries (by sales)
    // We can get this from OrderItems and Orders
    const topProductsSoldRaw = await db.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const topProductIds = topProductsSoldRaw.map(p => p.productId);
    const topProductsInfo = await db.product.findMany({
      where: {
        id: { in: topProductIds },
      },
      select: {
        id: true,
        name: true,
        image: true,
        images: true,
        price: true,
      },
    });

    const formattedTopProducts = topProductsSoldRaw.map(p => {
      const info = topProductsInfo.find(product => product.id === p.productId);
      return {
        productId: p.productId,
        name: info?.name || "Unknown Product",
        items: `${p._sum.quantity} Items`,
        price: `€${Number(info?.price || 0).toFixed(2)}`,
        image: info?.image || info?.images?.[0] || null,
        flag: "🇬🇧", // Placeholder as country tracking is complex
      };
    });

    // Top countries by sales
    const allOrdersWithAddress = await db.order.findMany({
      select: {
        total: true,
        shippingAddress: true,
      },
    });

    const countrySalesMap: { [key: string]: number } = {};
    allOrdersWithAddress.forEach(order => {
      // Simple country extraction logic (as in the component)
      const address = order.shippingAddress || "";
      const lines = address.split('\n').filter(l => l.trim());
      const lastLine = lines[lines.length - 1]?.trim().toLowerCase() || "uk";
      
      let countryCode = "GB";
      if (lastLine.includes("portugal")) countryCode = "PT";
      else if (lastLine.includes("spain")) countryCode = "ES";
      else if (lastLine.includes("france")) countryCode = "FR";
      else if (lastLine.includes("germany")) countryCode = "DE";
      else if (lastLine.includes("usa") || lastLine.includes("united states")) countryCode = "US";
      
      countrySalesMap[countryCode] = (countrySalesMap[countryCode] || 0) + Number(order.total);
    });

    const countryCodeToName: { [key: string]: string } = {
      "GB": "United Kingdom", "US": "United States", "PT": "Portugal", 
      "ES": "Spain", "FR": "France", "DE": "Germany"
    };
    const countryFlags: { [key: string]: string } = {
      "GB": "🇬🇧", "US": "🇺🇸", "PT": "🇵🇹", "ES": "🇪🇸", "FR": "🇫🇷", "DE": "🇩🇪"
    };

    const formattedTopCountries = Object.entries(countrySalesMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([code, sales]) => ({
        name: countryCodeToName[code] || code,
        flag: countryFlags[code] || "🏳️",
        sales: `€${sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        trend: "up" as const,
      }));

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalRevenue: Number(totalRevenueResult._sum.total || 0),
      pendingOrders,
      ordersTimeSeries,
      earningsTimeSeries,
      recentOrders: formattedRecentOrders,
      topProducts: formattedTopProducts,
      topCountries: formattedTopCountries,
    });
  } catch (error: any) {
    console.error("❌ FAILED TO FETCH DASHBOARD STATS:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats", details: error?.message },
      { status: 500 }
    );
  }
}

