import { PrismaClient } from "@prisma/client";
import {
  formatProductIdsAttr,
  parseGridElementMarkup,
  serializeBlogProductGrid,
} from "../lib/blog-product-grid.ts";

const prisma = new PrismaClient();
const GRID_TAG_REGEX =
  /<div\b[^>]*\bdata-blog-product-grid\b[^>]*>\s*<\/div>/gi;

function normalizeBlogContent(content) {
  if (!content?.includes("data-blog-product-grid")) {
    return content;
  }

  return content.replace(GRID_TAG_REGEX, (markup) => {
    const attrs = parseGridElementMarkup(markup);
    if (attrs.productIds.length === 0) {
      return markup;
    }

    const normalizedIds = formatProductIdsAttr(attrs.productIds);
    if (markup.includes(`data-product-ids="${normalizedIds}"`)) {
      return markup;
    }

    return serializeBlogProductGrid(attrs);
  });
}

async function main() {
  const blogs = await prisma.blog.findMany({
    where: { content: { contains: "data-blog-product-grid" } },
    select: { id: true, slug: true, content: true },
  });

  let updated = 0;

  for (const blog of blogs) {
    const nextContent = normalizeBlogContent(blog.content);
    if (nextContent !== blog.content) {
      await prisma.blog.update({
        where: { id: blog.id },
        data: { content: nextContent },
      });
      updated += 1;
      console.log(`Updated ${blog.slug}`);
    }
  }

  console.log(`Done. Updated ${updated} blog post(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
