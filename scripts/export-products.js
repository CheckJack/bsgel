require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function exportProducts() {
  console.log('📦 Starting product export...\n');
  
  try {
    // Fetch all products with their relations
    console.log('🔍 Fetching products from database...');
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            icon: true,
            parentId: true,
          },
        },
        subcategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                image: true,
                icon: true,
                parentId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    console.log(`📄 Found ${products.length} products\n`);
    
    if (products.length === 0) {
      console.log('⚠️  No products found to export.');
      return;
    }
    
    // Collect unique categories
    const categoriesMap = new Map();
    
    // Process products and collect categories
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      products: products.map(product => {
        // Add category to map if it exists
        if (product.category) {
          categoriesMap.set(product.category.id, product.category);
        }
        
        // Add subcategory categories to map
        product.subcategories.forEach(subcat => {
          if (subcat.category) {
            categoriesMap.set(subcat.category.id, subcat.category);
          }
        });
        
        // Convert Decimal to number for JSON serialization
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          salePrice: product.salePrice?.toString() || null,
          discountPercentage: product.discountPercentage,
          image: product.image,
          images: product.images,
          featured: product.featured,
          categoryId: product.categoryId,
          category: product.category ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
            description: product.category.description,
            image: product.category.image,
            icon: product.category.icon,
            parentId: product.category.parentId,
          } : null,
          attributes: product.attributes,
          showcasingSections: product.showcasingSections,
          subcategories: product.subcategories.map(subcat => ({
            id: subcat.id,
            categoryId: subcat.categoryId,
            category: subcat.category ? {
              id: subcat.category.id,
              name: subcat.category.name,
              slug: subcat.category.slug,
              description: subcat.category.description,
              image: subcat.category.image,
              icon: subcat.category.icon,
              parentId: subcat.category.parentId,
            } : null,
          })),
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
        };
      }),
      categories: Array.from(categoriesMap.values()),
    };
    
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                      new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    const filename = `products-export-${timestamp}.json`;
    const filepath = path.join(exportsDir, filename);
    
    // Write to file
    console.log('💾 Writing export file...');
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf-8');
    
    console.log(`\n✅ Export completed successfully!`);
    console.log(`📁 File saved to: ${filepath}`);
    console.log(`\n📊 Export Summary:`);
    console.log(`   📦 Products: ${products.length}`);
    console.log(`   📁 Categories: ${categoriesMap.size}`);
    console.log(`   📄 Total subcategory relationships: ${products.reduce((sum, p) => sum + p.subcategories.length, 0)}`);
    
    // Also create a latest.json symlink/copy for convenience
    const latestPath = path.join(exportsDir, 'products-export-latest.json');
    fs.copyFileSync(filepath, latestPath);
    console.log(`\n🔗 Latest export also saved as: products-export-latest.json`);
    
  } catch (error) {
    console.error('❌ Error during export:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportProducts();

