import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const rows = await p.$queryRaw`
  SELECT COUNT(*)::int as c
  FROM "Product"
  WHERE attributes IS NOT NULL
    AND attributes::text LIKE ${"%data:%"}
`;
console.log("products with data in attributes:", rows[0]);
await p.$disconnect();
