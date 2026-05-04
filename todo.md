# Blue Clean CRM - Project TODO

## Database & Backend
- [x] Design and implement database schema (users, cleaning_types, extra_services, orders, order_items, payments, calendar_events)
- [x] Create Drizzle migrations for all tables
- [x] Implement order creation and validation procedures
- [x] Implement schedule conflict detection logic
- [x] Implement automatic time and cost calculations
- [x] Implement payment confirmation logic
- [x] Implement financial reporting queries
- [ ] Add Google Calendar OAuth setup and integration
- [ ] Add cleaner notification system for order completion

## Admin Dashboard
- [x] Create admin layout with sidebar navigation
- [x] Implement calendar grid view with drag-and-drop (using react-big-calendar or similar)
- [x] Create order creation form with:
  - [x] Cleaning type selection
  - [x] Multi-cleaner assignment (1-3 cleaners)
  - [x] Extra services selection
  - [x] Payment method selection
  - [x] VAT flag toggle
  - [x] NIP field (conditional on Faktura payment method)
- [ ] Implement order editing functionality
- [ ] Implement order deletion functionality
- [x] Create order detail view
- [ ] Implement payment confirmation button
- [x] Create financial reports view with:
  - [x] Payment channel breakdown
  - [x] VAT 23% summary
  - [x] Per-cleaner payout totals
  - [x] Order-level detail
- [x] Add role-based access control (admin only)
- [ ] Add notifications for cleaner order completion

## Cleaner Mobile PWA
- [x] Create cleaner authentication (phone + password login)
- [x] Create cleaner layout optimized for mobile
- [x] Implement cleaner order list view
- [x] Implement order detail view with:
  - [x] Address with map link
  - [x] Extra services checklist
  - [x] Time and payment information
- [x] Implement order completion button
- [ ] Add notification system for admin alerts
- [ ] Add PWA manifest and service worker configuration
- [x] Add role-based access control (cleaner only)

## Google Calendar Integration
- [ ] Set up Google Calendar OAuth
- [ ] Implement calendar event creation for each cleaner
- [ ] Include order ID and address in calendar events
- [ ] Implement calendar event updates on order changes
- [ ] Implement calendar event deletion on order cancellation

## Testing & Deployment
- [x] Write unit tests for business logic (time/cost calculations)
- [x] Write integration tests for order creation and conflict detection
- [ ] Test payment confirmation workflow
- [ ] Test financial reporting accuracy
- [ ] Test Google Calendar integration
- [ ] Test mobile PWA functionality
- [ ] Performance testing and optimization
- [ ] Security audit (password hashing, data validation)
- [ ] Create deployment configuration

## Design & Styling
- [x] Set up color scheme (Navy, Sky Blue, White)
- [x] Configure Tailwind CSS with blue color palette
- [x] Create reusable Shadcn UI components in blue tones
- [x] Ensure responsive design for desktop and mobile
- [ ] Add accessibility features (ARIA labels, keyboard navigation)
