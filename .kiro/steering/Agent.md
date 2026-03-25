---
inclusion: always
---
<!------------------------------------------------------------------------------------
   Add rules to this file or a short description and have Kiro refine them for you.
   
   Learn about inclusion modes: https://kiro.dev/docs/steering/#inclusion-modes
-------------------------------------------------------------------------------------> # SKILL.md — Ratnam Sanjay's Agent Execution Rules

## WHO I AM BUILDING FOR

Ratnam Sanjay — 3rd year B.Tech CSE (Data Science) student at SR University,
Warangal. Solo builder. Has shipped 4 production-grade products:
- ApexIDE — full AI-powered desktop IDE (Electron + React + AWS)
- Apex MCP Agent — VS Code extension connecting Claude Desktop to codebases
- AndroidMCP Bridge — MCP server for Android hardware control
- Blocker Expert — Flutter + Kotlin digital wellbeing app

Current context: Building a Golf Charity Subscription Platform as a
selection assignment for Digital Heroes internship (₹20,000-25,000/month).
Deadline: 2 days. Must be fully deployed with live URL.
Evaluation: requirements accuracy, system design, UI/UX creativity,
data handling, scalability, problem solving.

---

## CORE EXECUTION RULES — NEVER BREAK THESE

### Rule 1 — NO TODOs, NO MOCK LOGIC, NO PLACEHOLDERS
Every function must be fully implemented.
Never write:
- // TODO: implement this
- return mock_data
- // placeholder
- console.log("coming soon")
- throw new Error("not implemented")

If a feature is complex, implement it step by step — but always finish it.
A half-built feature is worse than a missing feature.

### Rule 2 — NO STOPPING MID-TASK
Never stop and ask "should I continue?"
Never say "I'll implement the rest later"
Never say "you can add the remaining logic here"
Build the entire feature completely before moving to the next one.
If a file gets long — keep going. Completeness beats brevity.

### Rule 3 — REAL DATA, REAL LOGIC ALWAYS
Every database query must be real — connected to actual Supabase tables.
Every API call must hit real endpoints — no hardcoded responses.
Every calculation must use real data — no sample numbers.
Every auth check must be real — no if(true) bypass.

### Rule 4 — ERROR HANDLING ON EVERYTHING
Every async function needs try/catch.
Every API endpoint returns proper HTTP status codes.
Every form validates input before submitting.
Every database operation handles the error case.
Never let an unhandled promise rejection crash the app.

### Rule 5 — ENVIRONMENT VARIABLES FOR ALL SECRETS
Never hardcode API keys, URLs, or secrets.
Always use process.env.VARIABLE_NAME.
Always create .env.example with all required variable names.
Always add .env to .gitignore.

---

## TECH STACK RULES

### Frontend
- React.js — functional components only, no class components
- Tailwind CSS — utility classes only, no inline styles except dynamic values
- Framer Motion — every page transition, every list item, every section reveal
- React Router v6 — for all navigation
- Axios — for all API calls, never fetch()
- React Hook Form — for all forms, never uncontrolled inputs
- Zustand — for global state management

### Backend  
- Node.js + Express.js — RESTful API structure
- Supabase JS client — for all database operations
- Stripe SDK — for all payment operations
- JWT — for auth token verification middleware
- Express validator — for request validation
- Helmet + CORS — always include for security

### Database
- Supabase (PostgreSQL) — all tables, all queries
- Always use RLS (Row Level Security) policies
- Always use proper foreign key constraints
- Always index frequently queried columns
- Never use raw SQL in production — use Supabase client

### Deployment
- Vercel — frontend deployment
- Vercel serverless functions OR Railway — backend
- New accounts as required by the internship brief
- All env vars configured in Vercel dashboard

---

## FILE STRUCTURE — ALWAYS USE THIS
```
golf-charity-platform/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # Button, Input, Modal, Card, Badge
│   │   │   ├── layout/        # Navbar, Footer, Sidebar, AdminLayout
│   │   │   ├── dashboard/     # ScoreCard, DrawCard, WinningsTable
│   │   │   └── admin/         # UserTable, DrawManager, WinnersTable
│   │   ├── pages/
│   │   │   ├── public/        # Home, Charities, Pricing, HowItWorks
│   │   │   ├── auth/          # Login, Signup
│   │   │   ├── dashboard/     # Overview, Scores, Charity, Draws, Winnings
│   │   │   └── admin/         # Dashboard, Users, Draws, Charities, Winners, Reports
│   │   ├── hooks/             # useAuth, useScores, useSubscription, useDraw
│   │   ├── store/             # Zustand stores: authStore, scoreStore
│   │   ├── api/               # axios instances and API functions
│   │   ├── utils/             # formatCurrency, formatDate, drawLogic
│   │   └── constants/         # ROUTES, PLANS, DRAW_TYPES
│   └── package.json
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── scores.js
│   │   ├── subscriptions.js
│   │   ├── charities.js
│   │   ├── draws.js
│   │   ├── winners.js
│   │   └── admin.js
│   ├── middleware/
│   │   ├── verifyToken.js
│   │   ├── verifyAdmin.js
│   │   └── validateRequest.js
│   ├── utils/
│   │   ├── drawEngine.js      # FULLY IMPLEMENTED draw logic
│   │   ├── prizeCalculator.js # FULLY IMPLEMENTED prize pool math
│   │   └── supabase.js        # Supabase client singleton
│   ├── server.js
│   └── package.json
└── README.md
```

---

## INTERNSHIP CONTEXT — DIGITAL HEROES ASSIGNMENT

This is a real paid internship selection task. The evaluators are
senior developers with 7-10 years experience. They will check:

WHAT THEY WILL DEFINITELY TEST:
1. User signup → charity selection → subscription (Stripe test card: 4242 4242 4242 4242)
2. Score entry → add 6 scores → verify oldest is automatically deleted
3. Admin creates draw → runs simulation → publishes results
4. 5-match jackpot with no winner → verify it carries to next draw
5. Winner uploads proof → admin approves → marks as paid
6. Mobile responsive layout on all pages
7. Admin panel fully functional — all 4 sections

WHAT WILL GET ME REJECTED IMMEDIATELY:
- Any TODO comments left in code
- Mock data instead of real database queries
- Broken Stripe flow
- Score rolling logic not working (this is a specific test)
- Draw engine returning fake results
- Admin panel not functional
- Not deployed on a live URL
- Green color scheme or golf cliché design

WHAT WILL IMPRESS THEM:
- Framer Motion animations that feel premium
- Jackpot rollover working correctly with carry-forward amount shown
- Charity contribution percentage slider that saves in real time
- Draw simulation mode that shows preview before publishing
- Clean, well-commented codebase
- Mobile design that feels like a real product

---

## CRITICAL BUSINESS LOGIC — IMPLEMENT EXACTLY

### Score Rolling (test case 2 above)
```javascript
// In POST /api/scores
const { data: existing } = await supabase
  .from('scores')
  .select('id, created_at')
  .eq('user_id', user_id)
  .order('created_at', { ascending: true })

if (existing && existing.length >= 5) {
  await supabase.from('scores').delete().eq('id', existing[0].id)
}
// Then insert new score
```

### Draw Matching Logic (test case 3 above)
```javascript
// winning_numbers = [22, 18, 35, 41, 7]
// For each subscriber, count matches
function getMatchCount(userScores, winningNumbers) {
  return userScores.filter(s => winningNumbers.includes(s.score)).length
}
// 5 matches = tier 1 winner
// 4 matches = tier 2 winner
// 3 matches = tier 3 winner
// User wins in HIGHEST tier only — not multiple tiers
```

### Prize Pool Calculation (implement exactly)
```javascript
function calculatePrizePools(activeSubscribers, subscriptionFee, carriedOver = 0) {
  const totalPool = activeSubscribers * (subscriptionFee * 0.15)
  return {
    fiveMatch: (totalPool * 0.40) + carriedOver,  // includes jackpot rollover
    fourMatch: totalPool * 0.35,
    threeMatch: totalPool * 0.25,
    total: totalPool
  }
}
```

### Jackpot Rollover (test case 4 above)
```javascript
// After publishing draw results:
if (fiveMatchWinners.length === 0) {
  // Save current fiveMatchPool to next draw
  await supabase.from('draws').update({
    carried_over_amount: currentFiveMatchPool
  }).eq('id', nextDrawId)
}
```

---

## UI/UX RULES — NON-NEGOTIABLE

### Color Palette (use exactly)
```css
--color-navy: #0D1B2A      /* primary background */
--color-gold: #D4AF37      /* accent, CTA buttons */
--color-white: #FFFFFF     /* text on dark */
--color-soft-white: #F8F9FA /* card backgrounds */
--color-coral: #E8553A     /* warning, secondary accent */
--color-muted: #6B7280     /* secondary text */
```

### DO NOT USE
- Green (#green, #emerald, #lime) — looks like golf website
- Golf imagery as primary design language
- Traditional sports aesthetic
- Boring flat design with no animation

### MUST USE
- Framer Motion on every page transition
- Scroll reveal animations on every section
- Smooth hover effects on all interactive elements
- Countdown timer for next draw on homepage
- Animated counter for charity impact numbers
- Premium card design with subtle shadows

### Homepage Emotional Hierarchy
1. First thing user sees: "Play Golf. Win Prizes. Change Lives."
2. Second: charity impact counter (animated)
3. Third: how it works (3 steps)
4. Fourth: featured charity spotlight
5. Fifth: prize pool + countdown
6. Sixth: pricing with subscribe CTA
Never lead with golf scores or game mechanics. Always lead with charity impact.

---

## ANIMATION PATTERNS — USE THESE EVERYWHERE
```javascript
// Page entrance
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20 }
}

// Scroll reveal (wrap every section)
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" }
}

// Stagger children (for lists and cards)
const containerVariants = {
  animate: { transition: { staggerChildren: 0.1 } }
}

// Button interactions
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}

// Score card slide in
initial={{ opacity: 0, x: 50 }}
animate={{ opacity: 1, x: 0 }}

// Score card slide out (when replaced)
exit={{ opacity: 0, x: -50 }}
```

---

## API RESPONSE FORMAT — ALWAYS USE THIS
```javascript
// Success
res.status(200).json({
  success: true,
  data: result,
  message: "Operation completed"
})

// Error
res.status(400).json({
  success: false,
  error: error.message,
  code: "SPECIFIC_ERROR_CODE"
})

// List with pagination
res.status(200).json({
  success: true,
  data: items,
  count: items.length,
  total: totalCount
})
```

---

## SUPABASE PATTERNS — ALWAYS USE THESE
```javascript
// Always handle errors
const { data, error } = await supabase.from('table').select('*')
if (error) throw new Error(error.message)

// Auth middleware — verify JWT from Supabase
const { data: { user }, error } = await supabase.auth.getUser(token)
if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

// Admin check
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()
if (profile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
```

---

## DEPLOYMENT CHECKLIST — VERIFY BEFORE DONE

Before calling any task complete verify ALL of these:

BACKEND
- [ ] All routes return correct HTTP status codes
- [ ] All routes have error handling
- [ ] Auth middleware on all protected routes
- [ ] Stripe webhook verified with signature
- [ ] CORS configured for frontend URL
- [ ] All env vars referenced correctly

FRONTEND
- [ ] All API calls use environment variable for base URL
- [ ] Auth token stored in localStorage and sent in headers
- [ ] Protected routes redirect to login if not authenticated
- [ ] Admin routes redirect if not admin role
- [ ] All forms validate before submit
- [ ] Loading states on all async operations
- [ ] Error messages shown to user on failures
- [ ] Responsive on 375px (mobile) and 1440px (desktop)

DEPLOYMENT
- [ ] Frontend deployed on NEW Vercel account
- [ ] Backend deployed on Railway or Vercel functions
- [ ] All env vars set in Vercel dashboard
- [ ] Stripe webhook URL updated to production URL
- [ ] Supabase RLS policies enabled
- [ ] Live URL publicly accessible
- [ ] Test user account created and working
- [ ] Admin account created and working

---

## TEST CREDENTIALS — CREATE THESE AFTER DEPLOY

User account:
  email: testuser@golfcharity.com
  password: TestUser123!
  state: active subscription, 5 scores, charity selected

Admin account:
  email: admin@golfcharity.com
  password: AdminPass123!
  role: admin (set manually in profiles table)

Stripe test card: 4242 4242 4242 4242 / any future date / any CVC

---

## MOMENTUM RULES — KEEP BUILDING

When you finish one file — immediately start the next one.
When you finish backend — immediately start frontend.
When you finish frontend — immediately deploy.
Never wait for confirmation between logical steps.
Never ask "should I add X feature" — if it's in the PRD, build it.
Never summarize what you just did — just keep building.
The only acceptable stopping point is a fully working deployed app.

If something is unclear in the PRD:
- Make a reasonable decision
- Implement it fully
- Document your decision in a comment
- Never stop and ask — just build

---

## FINAL OUTPUT FORMAT

When everything is done, output exactly this:

LIVE URL: https://...
USER LOGIN: testuser@golfcharity.com / TestUser123!
ADMIN LOGIN: admin@golfcharity.com / AdminPass123!
GITHUB: https://github.com/...
NOTES: [any ambiguous decisions made and how resolved]