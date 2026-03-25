# Golf Charity Subscription Platform

A subscription-driven web application combining golf performance tracking, charity fundraising, and a monthly draw-based reward engine.

## Tech Stack

- **Frontend:** React.js + Tailwind CSS v4 + Framer Motion
- **Backend:** Node.js + Express.js
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (JWT)
- **Payments:** Stripe (test mode)
- **Deployment:** Vercel

## Setup

### 1. Database
Run `supabase-schema.sql` in your Supabase SQL Editor.

### 2. Backend
```bash
cd backend
cp .env.example .env
# Fill in your Supabase and Stripe credentials
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL to your backend URL
npm install
npm run dev
```

### 4. Stripe Setup
- Create products: Monthly (£9.99/mo) and Yearly (£95.88/yr)
- Copy Price IDs to backend .env
- Set up webhook endpoint: `POST /api/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`

## Test Credentials

- **User:** testuser@golfcharity.com / TestUser123!
- **Admin:** admin@golfcharity.com / AdminPass123!
- **Stripe Test Card:** 4242 4242 4242 4242 / any future date / any CVC
