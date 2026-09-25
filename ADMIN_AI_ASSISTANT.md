# Admin AI Assistant

Admin-only AI chat widget powered by Google Gemini. Helps with stock, products, orders, blogs, coupons, and more across the entire admin panel.

## Feature flag (simple on/off switch)

Add these to `.env.local`:

```env
ENABLE_ADMIN_AI=true
NEXT_PUBLIC_ENABLE_ADMIN_AI=true
GEMINI_API_KEY=your-key-from-https://aistudio.google.com/apikey
```

- When **false** or unset: the chat widget is hidden and `/api/admin/ai/*` returns 404.
- When **true**: admins see the bottom-right assistant in `/admin`.

This is a safety switch so you can test on localhost first, then enable on production when ready.

## Localhost testing

```bash
# 1. Copy env vars above into .env.local
# 2. Optional: use a database copy so tests don't touch live orders
# 3. Run dev server (port 3001)
npm run dev

# 4. Log in as admin → open any /admin page → click the bot icon
```

## Capabilities

| Area | Read | Write (with confirm) |
|------|------|----------------------|
| Dashboard stats | ✓ | — |
| Activity logs | ✓ | — |
| Products & stock | ✓ | create, edit, bulk stock, incoming stock from PDF |
| Orders | ✓ | status updates (not cancel) |
| Categories, blogs, coupons | ✓ | create/edit (blogs always DRAFT) |
| Reviews | ✓ | approve/reject |
| Analytics, notifications, training, etc. | ✓ | create notification |

## Blocked (AI cannot do)

- Delete anything
- Cancel orders
- Change user roles
- Issue refunds

## PDF supplier orders

1. Click 📎 in the chat widget
2. Upload supplier order PDF
3. Ask: "Analyze this order and update stock"
4. AI matches products, calculates current + incoming
5. Click **Confirm** to apply

## Undo

Write actions can be undone within **1 hour** via the Undo link in chat.

## Cost

Uses `gemini-3.1-flash-lite` by default (with automatic fallbacks to `gemini-3.5-flash` and `gemini-2.5-flash` on overload). Override with `GEMINI_MODEL` in `.env.local`.

Deprecated models (`gemini-2.0-flash`, `gemini-2.5-flash-lite`) are blocked automatically.
