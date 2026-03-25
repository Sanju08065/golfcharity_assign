# 🏌️ Golf Charity Subscription Platform

A premium subscription-driven web application that combines golf performance tracking, charitable giving, and a monthly draw-based reward engine. Built as a full-stack selection assignment for Digital Heroes.

> **Play Golf. Win Prizes. Change Lives.**

---

## 🌐 Live Demo

| | URL |
|---|---|
| **Frontend** | [golf-charity-6aiv.vercel.app](https://golf-charity-6aiv.vercel.app) |
| **Backend API** | [golf-charity-seven.vercel.app](https://golf-charity-seven.vercel.app/api/health) |

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| User | `user@user.com` | `User@123` |
| Admin | `admin@admin.com` | `Admin@123` |
| Stripe Test Card | `4242 4242 4242 4242` | Any future date · Any CVC |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · Tailwind CSS v4 · Framer Motion · React Router v6 · Zustand · React Hook Form |
| Backend | Node.js · Express 5 · Stripe SDK · JWT Auth · Express Validator · Helmet · CORS |
| Database | Supabase (PostgreSQL) · Row Level Security · Real-time triggers |
| Payments | Stripe Checkout (subscriptions + one-time donations) |
| Email | Resend API (welcome, draw results, winner notifications) |
| Deployment | Vercel (frontend + backend serverless) |

---

## ✨ Key Features

### For Subscribers
- **Score Tracking** — Enter up to 5 Stableford scores (1–45). Rolling logic automatically replaces the oldest score when a new one is added.
- **Monthly Prize Draws** — Scores are matched against 5 randomly drawn numbers. 5-match, 4-match, and 3-match tiers with real prize pools.
- **Charity Support** — Choose a charity and set your contribution percentage (10–100%). Make independent donations anytime.
- **Winner Verification** — Upload proof of play, admin reviews and approves, then marks payment as complete.
- **Dashboard** — Subscription status, score history, draw participation, winnings tracker, charity contribution, countdown to next draw.

### For Admins
- **User Management** — Search, edit profiles, manage subscriptions, view/edit/delete user scores.
- **Draw Engine** — Create draws (random or algorithmic), run simulations with preview, publish results.
- **Charity Management** — Full CRUD for charities with featured spotlight.
- **Winner Verification** — Approve/reject proof submissions, mark payouts as completed.
- **Reports & Analytics** — Total users, active subscribers, prize pools, charity contributions, draw statistics, subscription breakdown.

### Platform
- **Stripe Integration** — Monthly (£9.99) and Yearly (£95.88) subscription plans with real checkout flow.
- **Jackpot Rollover** — If no 5-match winner, the prize pool carries forward to the next draw.
- **Email Notifications** — Welcome emails, draw results, winner verification updates, payment confirmations.
- **Mobile-First Design** — Fully responsive from 375px to 1440px+.
- **Framer Motion Animations** — Page transitions, scroll reveals, staggered lists, micro-interactions throughout.

---

## 📐 Architecture

```
golf-charity-platform/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── api/                 # Axios instance + API endpoint functions
│   │   ├── components/
│   │   │   ├── common/          # Button, Input, Modal, Card, Badge, DatePicker, Select
│   │   │   └── layout/          # Navbar, Footer, Sidebar, DashboardLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── public/          # Home, Charities, CharityDetail, Pricing, HowItWorks
│   │   │   ├── auth/            # Login, Signup, ForgotPassword
│   │   │   ├── dashboard/       # Overview, Scores, Charity, Draws, Winnings, Settings
│   │   │   └── admin/           # Dashboard, Users, DrawManagement, CharityManagement, Winners, Reports
│   │   ├── store/               # Zustand auth store
│   │   ├── hooks/               # useLenis (smooth scroll)
│   │   ├── utils/               # formatCurrency, formatDate, getCountdown, animations
│   │   └── constants/           # Routes, plans, draw types
│   └── vercel.json
├── backend/                     # Express API (Vercel serverless)
│   ├── routes/
│   │   ├── auth.js              # Register, login, profile, forgot/reset password
│   │   ├── scores.js            # CRUD + rolling 5 logic
│   │   ├── subscriptions.js     # Stripe checkout, activate, cancel
│   │   ├── charities.js         # List, select, donate, admin CRUD
│   │   ├── draws.js             # Create, simulate, publish, history
│   │   ├── winners.js           # My winnings, proof upload, admin verify/pay
│   │   ├── admin.js             # Reports, user management, score management
│   │   └── webhook.js           # Stripe webhook handler
│   ├── middleware/
│   │   ├── verifyToken.js       # JWT validation via Supabase Auth
│   │   ├── verifyAdmin.js       # Admin role check
│   │   ├── verifySubscription.js # Active subscription gate
│   │   └── validateRequest.js   # Express validator error handler
│   ├── utils/
│   │   ├── drawEngine.js        # Random + algorithmic draw generation, winner matching
│   │   ├── prizeCalculator.js   # Prize pool distribution (40/35/25 split)
│   │   ├── emailService.js      # Resend API email templates
│   │   └── supabase.js          # Supabase client (admin + public)
│   └── server.js                # Express app with CORS, Helmet, rate limiting
└── supabase-schema.sql          # Complete database schema + seed data
```

---

## 🔧 Local Development Setup

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account (test mode)

### 1. Database

Run `supabase-schema.sql` in your Supabase SQL Editor. This creates all tables, indexes, RLS policies, triggers, and seed data.

Then create test users in Supabase → Authentication → Users:
```
Email: admin@golfcharity.com    Password: AdminPass123!    Auto-confirm: ON
Email: testuser@golfcharity.com Password: TestUser123!     Auto-confirm: ON
```

Set roles:
```sql
UPDATE profiles SET role = 'admin', subscription_status = 'active' WHERE email = 'admin@golfcharity.com';
UPDATE profiles SET subscription_status = 'active', subscription_plan = 'monthly' WHERE email = 'testuser@golfcharity.com';
```

Create storage bucket: Supabase → Storage → New Bucket → `winner-proofs` (Public, 5MB max).

### 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Required environment variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secret
RESEND_API_KEY=re_...
PORT=5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Required environment variables:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Stripe Setup
1. Create two products in Stripe Dashboard (test mode):
   - **Monthly**: £9.99/month recurring → copy Price ID (`price_...`)
   - **Yearly**: £95.88/year recurring → copy Price ID (`price_...`)
2. Add webhook endpoint: `https://your-backend/api/webhook`
3. Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

---

## 🧪 Testing Checklist (PRD Section 16)

| # | Test Case | Status |
|---|-----------|--------|
| 1 | User signup & login | ✅ |
| 2 | Subscription flow (monthly + yearly) | ✅ |
| 3 | Score entry — 5-score rolling logic | ✅ |
| 4 | Draw system logic and simulation | ✅ |
| 5 | Charity selection and contribution calculation | ✅ |
| 6 | Winner verification flow and payout tracking | ✅ |
| 7 | User Dashboard — all modules functional | ✅ |
| 8 | Admin Panel — full control and usability | ✅ |
| 9 | Data accuracy across all modules | ✅ |
| 10 | Responsive design on mobile and desktop | ✅ |
| 11 | Error handling and edge cases | ✅ |

---

## 🎯 Business Logic Details

### Score Rolling (5-score limit)
When a user adds a 6th score, the oldest score is automatically deleted before the new one is inserted. Scores are always displayed newest-first.

### Draw Matching
- **5-Number Match** → Tier 1 (40% of prize pool + jackpot rollover)
- **4-Number Match** → Tier 2 (35% of prize pool)
- **3-Number Match** → Tier 3 (25% of prize pool)
- Users win in their **highest tier only** — not multiple tiers.
- Prizes are **split equally** among winners in the same tier.

### Prize Pool Calculation
```
Total Pool = Active Subscribers × (£9.99 × 10%)
5-Match Pool = (Total × 40%) + Carried Over Jackpot
4-Match Pool = Total × 35%
3-Match Pool = Total × 25%
```

### Jackpot Rollover
If no one matches all 5 numbers, the 5-match prize pool carries forward to the next draw. The carried amount is stored in the `draws` table and added to the next draw's 5-match pool.

### Draw Types
- **Random** — 5 numbers picked randomly from 1–45 (lottery-style, independent of user scores)
- **Algorithmic** — Weighted by score frequency. All numbers 1–45 are in the pool, but numbers that users have scored more frequently get extra weight.

---

## 🔒 Security

- JWT authentication on all protected routes via Supabase Auth
- Admin role verification middleware
- Subscription status gate on score entry
- IDOR protection — users can only access their own data
- Stripe webhook signature verification
- Helmet security headers
- CORS restricted to frontend origin
- Rate limiting (500/min general, 10/15min auth, 5/10min OTP)
- Input validation via express-validator on all endpoints
- File upload restricted to images only (MIME type check)
- Environment variables for all secrets

---

## 📱 UI/UX Design

- **Color Palette**: Navy (#0D1B2A), Gold (#D4AF37), Coral (#E8553A), Soft White (#F8F9FA)
- **No golf clichés** — emotion-driven design leading with charitable impact
- **Framer Motion** animations on every page transition, scroll reveal, and interaction
- **Mobile-first** responsive design (375px → 1440px+)
- **Homepage hierarchy**: Charity impact → How it works → Prize pool → Pricing CTA

---

## 👤 Author

**Ratnam Sanjay** — 3rd Year B.Tech CSE (Data Science), SR University, Warangal


---

## 📄 License

This project was built for evaluation purposes as part of the Digital Heroes trainee selection process.
