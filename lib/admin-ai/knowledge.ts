export const ADMIN_AI_KNOWLEDGE = `
# Admin panel pages and capabilities

## Dashboard (/admin)
- Overview stats: products, orders, revenue, pending orders, monthly trends.
- Tool: get_dashboard_stats

## Activity Logs (/admin/logs)
- All admin actions with filters (user, action type, resource, date).
- Tool: search_admin_logs

## Products (/admin/products, /admin/products/[id])
- List, search, create, edit products (name, price, sale price, images, category, attributes, featured).
- No delete. Tool: list_products, get_product, create_product, update_product

## Stock (/admin/stock)
- Stock levels, urgent/low stock filter (qty 1–2), bulk updates.
- Tools: list_stock, add_incoming_stock, update_product_stock, bulk_update_stock

## Categories (/admin/categories)
- Create/edit category tree. No delete.
- Tools: list_categories, create_category, update_category

## Attributes (/admin/attributes)
- Product attribute definitions.
- Tools: list_attributes, create_attribute, update_attribute

## Orders (/admin/orders, /admin/orders/[id])
- List orders, view detail, update status (not cancel).
- Tools: list_orders, get_order, update_order_status

## Product Reviews (/admin/reviews)
- Pending/approved/rejected reviews.
- Tools: list_reviews, update_review_status

## Shipping (/admin/shipping)
- Shipping zones and rules.
- Tools: list_shipping_zones

## Messages (/admin/messages)
- Customer chat messages from storefront widget.
- Tools: list_chat_messages

## Blogs (/admin/blogs)
- Create/edit SEO blog posts. AI always saves as DRAFT.
- Use fetch_web_page to research URLs; content saves as HTML with h2/h3 structure.
- Tools: list_blogs, get_blog, fetch_web_page, create_blog_draft, update_blog_draft

## Coupons (/admin/coupons)
- Create and manage discount coupons.
- Tools: list_coupons, create_coupon

## Analytics (/admin/analytics)
- Sales and traffic summaries.
- Tools: get_analytics_summary

## Notifications (/admin/notifications)
- Admin/customer notifications.
- Tools: list_notifications, create_notification

## Customers (/admin/customers)
- Customer list (read-only overview).
- Tools: list_customers

## Users & Roles (/admin/users, /admin/roles)
- Read-only for AI. No role changes.

## Trainings (/admin/trainings, sessions, bookings)
- Programs, sessions, bookings management.
- Tools: list_training_programs, list_training_bookings

## Affiliates & Rewards
- Affiliates, points, rewards catalog.
- Tools: list_affiliates, list_rewards

## Certifications, Salons, Gallery, Pages
- Tools: list_certifications, list_salons, list_gallery_items, list_pages
`.trim();
