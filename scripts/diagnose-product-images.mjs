import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const count = await p.product.count();
const heaviest = await p.$queryRaw`
  SELECT id, left(name, 40) as name,
    LENGTH(COALESCE(image, ''))::int as image_len,
    COALESCE(array_length(images, 1), 0)::int as images_count,
    (SELECT COALESCE(SUM(LENGTH(x)), 0)::int FROM unnest(images) x) as images_bytes,
    CASE WHEN image LIKE 'data:%' THEN true ELSE false END as image_is_data
  FROM "Product"
  ORDER BY (
    LENGTH(COALESCE(image, '')) +
    (SELECT COALESCE(SUM(LENGTH(x)), 0) FROM unnest(images) x)
  ) DESC
  LIMIT 25
`;
const dataCount = await p.$queryRaw`
  SELECT COUNT(*)::int as c FROM "Product"
  WHERE image LIKE 'data:%'
     OR EXISTS (SELECT 1 FROM unnest(images) x WHERE x LIKE 'data:%')
`;
const httpCount = await p.$queryRaw`
  SELECT COUNT(*)::int as c FROM "Product"
  WHERE image LIKE 'http%' OR image LIKE '/%'
`;

console.log(JSON.stringify({ count, dataEmbedded: dataCount[0], httpish: httpCount[0], heaviest }, null, 2));
await p.$disconnect();
