# Product Database Export & Import Guide

This guide explains how to export products from your development/staging database and import them into your production environment.

## Overview

The export/import system allows you to:
- Export all products, categories, and their relationships to a JSON file
- Import products into a production database while handling category mapping
- Preserve product IDs and relationships
- Handle existing products (skip or update)

## Prerequisites

1. Ensure you have access to both source and target databases
2. Make sure your `.env.local` file is configured with the correct `DATABASE_URL`
3. The database schema must be up to date (run migrations if needed)

## Exporting Products

### From Development/Staging Environment

1. **Set your source database URL** in `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/dev_database"
   ```

2. **Run the export script**:
   ```bash
   npm run export-products
   ```
   
   Or directly:
   ```bash
   node scripts/export-products.js
   ```

3. **Find the export file**:
   - Export files are saved in the `exports/` directory
   - Format: `products-export-YYYY-MM-DD_HH-MM-SS.json`
   - A `products-export-latest.json` file is also created for convenience

### Export File Structure

The export file contains:
- **Products**: All product data including prices, images, descriptions, attributes
- **Categories**: All categories referenced by products
- **Subcategories**: Product-category relationships
- **Metadata**: Export date and version

## Importing Products

### To Production Environment

1. **Set your target database URL** in `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@production-host:5432/prod_database"
   ```

2. **Copy the export file** to your production environment (or use the file path)

3. **Run the import script** with options:

   **Basic import (skips existing products)**:
   ```bash
   npm run import-products:json
   ```
   
   **Import specific file**:
   ```bash
   npm run import-products:json exports/products-export-2025-01-15_14-30-00.json
   ```
   
   **Update existing products**:
   ```bash
   npm run import-products:json -- --update-existing
   ```
   
   **Skip existing products** (default):
   ```bash
   npm run import-products:json -- --skip-existing
   ```

### Import Options

- `--skip-existing` or `-s`: Skip products that already exist (default behavior)
- `--update-existing` or `-u`: Update products that already exist with new data

### Import Process

The import script will:
1. **Import categories first** - Creates missing categories, maps existing ones
2. **Import products** - Creates new products or updates existing ones (based on options)
3. **Import subcategory relationships** - Links products to their categories
4. **Provide a summary** - Shows counts of created/updated/skipped items

## Workflow Examples

### Example 1: First-time Production Setup

```bash
# 1. Export from development
cd /path/to/dev/environment
npm run export-products

# 2. Copy export file to production
scp exports/products-export-latest.json production-server:/path/to/app/exports/

# 3. Import to production
cd /path/to/production/environment
npm run import-products:json exports/products-export-latest.json
```

### Example 2: Update Production with Latest Products

```bash
# 1. Export from staging
npm run export-products

# 2. Import to production (update existing)
npm run import-products:json -- --update-existing
```

### Example 3: Selective Import

```bash
# Import specific export file
npm run import-products:json exports/products-export-2025-01-15_14-30-00.json --skip-existing
```

## Important Notes

### Category Mapping

- Categories are matched by `slug` (not ID)
- If a category with the same slug exists, it will be reused
- New categories will be created if they don't exist
- Category IDs are automatically mapped during import

### Product IDs

- Products keep their original IDs by default
- If a product ID already exists, the script will skip or update based on options
- This ensures consistency across environments

### Data Integrity

- The export includes all product relationships
- Subcategory relationships are preserved
- Category hierarchies (parent categories) are maintained

### Safety Features

- The import script validates the export file format
- Errors are logged but don't stop the entire import
- A summary report is provided at the end
- Existing data is never deleted (only created or updated)

## Troubleshooting

### "Import file not found"
- Check the file path is correct
- Ensure the file exists in the `exports/` directory
- Use absolute path if needed: `/full/path/to/file.json`

### "Category not found" warnings
- This is normal if categories weren't exported
- Categories will be created automatically during import
- Check that category slugs are unique

### "Unique constraint" errors
- Products with duplicate IDs will be skipped
- Use `--update-existing` to update instead of skip
- Check for duplicate product names or IDs in source database

### Database connection errors
- Verify `DATABASE_URL` in `.env.local`
- Ensure database is accessible
- Check network connectivity for remote databases
- Run `npm run db:check` to test connection

## Best Practices

1. **Always backup** your production database before importing
2. **Test imports** on a staging environment first
3. **Review the export file** before importing to production
4. **Use versioned export files** for tracking
5. **Keep export files** for rollback purposes
6. **Document changes** - note what was exported/imported and when

## File Locations

- **Export files**: `exports/products-export-*.json`
- **Latest export**: `exports/products-export-latest.json`
- **Scripts**: `scripts/export-products.js`, `scripts/import-products.js`

## Related Commands

```bash
# Check database connection
npm run db:check

# View database in Prisma Studio
npm run db:studio

# Backup database
npm run db:backup
```

## Support

If you encounter issues:
1. Check the error messages in the console
2. Verify your database connection
3. Ensure the export file is valid JSON
4. Review the import summary for details

