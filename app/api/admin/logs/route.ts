import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Filters
    const userId = searchParams.get("userId");
    const actionType = searchParams.get("actionType");
    const resourceType = searchParams.get("resourceType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search"); // Search in description

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (actionType) {
      where.actionType = actionType;
    }

    if (resourceType) {
      where.resourceType = resourceType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the entire end date
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        where.createdAt.lt = endDateObj;
      }
    }

    if (search) {
      where.description = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Fetch logs with user information - handle case where table might be empty
    let logs: any[] = [];
    let total = 0;

    try {
      // First try with include, if it fails, try without
      try {
        [logs, total] = await Promise.all([
          db.adminLog.findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            skip,
            take: limit,
          }),
          db.adminLog.count({ where }),
        ]);
      } catch (includeError: any) {
        console.error("Error with include, trying without:", includeError?.message);
        // If include fails, try without it and manually fetch users
        const logsWithoutUser = await db.adminLog.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        });
        
        // Manually attach user info
        const userIds = [...new Set(logsWithoutUser.map(log => log.userId))];
        const usersMap = new Map();
        
        if (userIds.length > 0) {
          const users = await db.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true },
          });
          users.forEach(user => usersMap.set(user.id, user));
        }
        
        logs = logsWithoutUser.map(log => ({
          ...log,
          user: usersMap.get(log.userId) || { id: log.userId, name: null, email: null },
        }));
        
        total = await db.adminLog.count({ where });
      }
    } catch (queryError: any) {
      console.error("Error querying admin logs:", {
        error: queryError?.message,
        code: queryError?.code,
        meta: queryError?.meta,
        stack: queryError?.stack,
      });
      
      // If table doesn't exist or relation issue, return empty results
      if (queryError?.code === "P2021" || queryError?.message?.includes("does not exist")) {
        logs = [];
        total = 0;
      } else {
        throw queryError;
      }
    }

    // Get unique values for filters - handle case where there are no logs yet
    let actionTypes: string[] = [];
    let resourceTypes: string[] = [];
    let users: Array<{ id: string; name: string | null; email: string }> = [];

    try {
      // Use groupBy if available, otherwise get all and dedupe
      const [allActionTypes, allResourceTypes, adminUsers] = await Promise.all([
        db.adminLog.findMany({
          select: { actionType: true },
        }).then(logs => [...new Set(logs.map(l => l.actionType))]).catch(() => []),
        db.adminLog.findMany({
          select: { resourceType: true },
        }).then(logs => [...new Set(logs.map(l => l.resourceType))]).catch(() => []),
        db.user.findMany({
          where: {
            role: "ADMIN",
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
          orderBy: {
            name: "asc",
          },
        }).catch(() => []),
      ]);

      actionTypes = allActionTypes || [];
      resourceTypes = allResourceTypes || [];
      users = adminUsers || [];
    } catch (filterError: any) {
      console.error("Error fetching filter options:", filterError);
      // Continue with empty filters if this fails
      actionTypes = [];
      resourceTypes = [];
      users = [];
    }

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        actionTypes,
        resourceTypes,
        users,
      },
    });
  } catch (error: any) {
    console.error("❌ FAILED TO FETCH ADMIN LOGS:", {
      error: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    
    // If it's a database schema issue, provide helpful error message
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      return NextResponse.json(
        { 
          error: "AdminLog table does not exist. Please run database migration.",
          details: error?.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch admin logs",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

