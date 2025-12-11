# Admin Activity Logs Feature

This feature provides comprehensive tracking and monitoring of all admin actions performed in the admin panel.

## Overview

The admin logs feature tracks every action performed by administrators, including:
- Creating, updating, or deleting resources
- Viewing sensitive information
- Approving/rejecting items
- Bulk operations
- And more...

## Database Schema

The feature uses the `AdminLog` model which includes:
- `userId` - The admin user who performed the action
- `actionType` - Type of action (CREATE, UPDATE, DELETE, VIEW, etc.)
- `resourceType` - Type of resource (Product, Category, User, etc.)
- `resourceId` - ID of the resource acted upon
- `description` - Human-readable description
- `details` - JSON object with before/after values and changes
- `ipAddress` - IP address of the admin
- `userAgent` - Browser user agent
- `metadata` - Additional metadata (URL, request method, etc.)
- `createdAt` - Timestamp of the action

## Setup

1. **Run the database migration:**
   ```bash
   npx prisma migrate dev --name add_admin_logs
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

## Usage

### Basic Logging

Import the logging utility in your API routes:

```typescript
import { logAdminAction, extractRequestInfo, getActionDescription } from "@/lib/admin-logger";
import { AdminLogActionType } from "@prisma/client";
```

### Example: Logging a CREATE action

```typescript
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ipAddress, userAgent } = extractRequestInfo(req);
  const body = await req.json();

  // Perform the action
  const newResource = await db.resource.create({
    data: body,
  });

  // Log the action
  await logAdminAction({
    userId: session.user.id,
    actionType: AdminLogActionType.CREATE,
    resourceType: "Resource",
    resourceId: newResource.id,
    description: getActionDescription(AdminLogActionType.CREATE, "Resource", newResource.name),
    details: {
      after: newResource,
    },
    ipAddress,
    userAgent,
    metadata: {
      url: req.url,
      method: "POST",
    },
  });

  return NextResponse.json(newResource);
}
```

### Example: Logging an UPDATE action with before/after comparison

```typescript
import { createChangeDetails } from "@/lib/admin-logger";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ipAddress, userAgent } = extractRequestInfo(req);
  const body = await req.json();

  // Get the resource before update
  const before = await db.resource.findUnique({
    where: { id: params.id },
  });

  // Perform the update
  const after = await db.resource.update({
    where: { id: params.id },
    data: body,
  });

  // Log with change details
  await logAdminAction({
    userId: session.user.id,
    actionType: AdminLogActionType.UPDATE,
    resourceType: "Resource",
    resourceId: params.id,
    description: getActionDescription(AdminLogActionType.UPDATE, "Resource", after.name),
    details: createChangeDetails(before, after),
    ipAddress,
    userAgent,
    metadata: {
      url: req.url,
      method: "PATCH",
    },
  });

  return NextResponse.json(after);
}
```

### Example: Logging a DELETE action

```typescript
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ipAddress, userAgent } = extractRequestInfo(req);

  // Get the resource before deletion (for logging)
  const resource = await db.resource.findUnique({
    where: { id: params.id },
  });

  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  // Perform the deletion
  await db.resource.delete({
    where: { id: params.id },
  });

  // Log the deletion
  await logAdminAction({
    userId: session.user.id,
    actionType: AdminLogActionType.DELETE,
    resourceType: "Resource",
    resourceId: params.id,
    description: getActionDescription(AdminLogActionType.DELETE, "Resource", resource.name),
    details: {
      before: resource,
    },
    ipAddress,
    userAgent,
    metadata: {
      url: req.url,
      method: "DELETE",
    },
  });

  return NextResponse.json({ message: "Resource deleted successfully" });
}
```

## Available Action Types

- `CREATE` - Creating a new resource
- `UPDATE` - Updating an existing resource
- `DELETE` - Deleting a resource
- `VIEW` - Viewing a resource
- `EXPORT` - Exporting data
- `IMPORT` - Importing data
- `APPROVE` - Approving something
- `REJECT` - Rejecting something
- `ACTIVATE` - Activating a resource
- `DEACTIVATE` - Deactivating a resource
- `BULK_OPERATION` - Performing bulk operations
- `OTHER` - Other actions not covered above

## Viewing Logs

Navigate to `/admin/logs` in the admin panel to view all activity logs. You can:

- Filter by user, action type, resource type, and date range
- Search logs by description
- View detailed information about any action in a popup modal
- See before/after changes for UPDATE actions
- View IP addresses and user agents

## Best Practices

1. **Always log admin actions** - Any action that modifies data or views sensitive information should be logged
2. **Use descriptive descriptions** - The description field should clearly explain what happened
3. **Include change details for updates** - Use `createChangeDetails()` to automatically track what changed
4. **Don't log sensitive data** - Be careful not to log passwords, API keys, or other sensitive information
5. **Log asynchronously if needed** - The logging function won't throw errors, but you can wrap it in a try-catch if you want to handle failures separately

## Implementation Checklist

To add logging to a new admin route:

- [ ] Import logging utilities
- [ ] Extract request info (IP, user agent)
- [ ] Get resource before update/delete (for change tracking)
- [ ] Perform the action
- [ ] Log the action with appropriate details
- [ ] Return the response

## Notes

- Logging failures won't break your main operations (errors are caught and logged to console)
- Logs are stored indefinitely - consider implementing log rotation/archival for production
- The logs page includes pagination for performance with large datasets

