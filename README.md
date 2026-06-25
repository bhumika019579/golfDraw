# GolfDraw ⛳

GolfDraw is a full-stack, subscription-based golf score lottery and charity fundraising platform. Subscribed players submit their golf scores (Stableford format, values 1–45) which serve as their lottery tickets. Each month, the draw engine picks 5 random numbers and distributes prize pool money (funded by subscription fees) to subscribers whose scores match. A portion of every subscription also goes to a charity of the subscriber's choice.

Built as a selection assignment for Digital Heroes — demonstrating full-stack development, payment integration, admin systems, and scalable architecture.

---

## Live Demo

Live Link : https://golf-draw-xi.vercel.app/

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@golfdraw.com | admin123 |
| Subscriber | john@golfdraw.com | sub123 |
| Subscriber | jane@golfdraw.com | sub123 |

### Stripe Test Card

| Field | Value |
|-------|-------|
| Card Number | `4242 4242 4242 4242` |
| Expiry Date | `12/26` |
| CVC | `123` |
| Cardholder Name | Any name |
---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, React Router v6, Axios, Plain CSS (custom HSL theme) |
| Backend | Node.js, Express.js |
| Database | PostgreSQL + Prisma v6 ORM |
| Authentication | JWT (stored in localStorage) |
| Payments | Stripe Checkout (Test Mode) |
| File Uploads | Cloudinary (winner proof screenshots via Multer memory streams) |
| Deployment | Vercel (client), Render (server) |

---

## Payment Integration — Stripe Test Mode

> ⚠️ **Important Notice: This project uses Stripe in Test Mode only.**

### Why Test Mode?

Real (live) Stripe payment processing in India requires:
- A registered business entity (GST number)
- A business bank account
- Full KYC verification (identity proof, address proof)
- Stripe account approval for Indian payment processing

As this is a selection assignment and not a registered business product, **Stripe Test Mode** is used. Test Mode is functionally identical to live payments — the full checkout flow, card validation, success/failure states, and webhooks all work exactly the same. No real money is charged.

### How to Pay in Test Mode

When prompted to subscribe, use the following Stripe test card details:

| Field | Value |
|-------|-------|
| Card Number | `4242 4242 4242 4242` |
| Expiry Date | Any future date (e.g. `12/26`) |
| CVC | Any 3 digits (e.g. `123`) |
| Cardholder Name | Any name |
| Country | Any |

**Other useful test cards:**
- `4000 0000 0000 0002` — Card declined
- `4000 0025 0000 3155` — Requires authentication (3D Secure)

All test transactions appear in the Stripe Dashboard under **Test Mode → Payments**.

---

## Folder Structure

```
golfdraw/
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js                  # Centralized Axios client with JWT interceptor
│       ├── pages/
│       │   ├── Home.jsx            # Landing page
│       │   ├── Login.jsx           # Role-based login (User / Admin toggle)
│       │   ├── Register.jsx        # Subscriber registration
│       │   ├── Dashboard.jsx       # Subscriber portal (scores, draws, winnings, charity)
│       │   ├── Charities.jsx       # Public charity listings
│       │   └── Admin.jsx           # Multi-tab admin control panel
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── ScoreForm.jsx       # Score entry CRUD
│       │   ├── DrawResult.jsx      # Draw results display
│       │   └── ProtectedRoute.jsx  # Role-based route guards
│       └── styles/
│           └── global.css          # Design tokens and theme
│
├── server/
│   ├── index.js                    # Express app entry point
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── seed.js                 # Database seeding script
│   ├── middleware/
│   │   └── auth.js                 # JWT authentication + admin role guard
│   └── routes/
│       ├── auth.js                 # POST /register, POST /login, PUT /profile
│       ├── scores.js               # GET/POST/PUT/DELETE /scores
│       ├── charities.js            # GET/POST/PUT/DELETE /charities
│       ├── subscription.js         # Stripe checkout session + subscription confirm
│       ├── draw.js                 # POST /draw/run, GET /draw/latest, GET /draw/winnings
│       └── admin.js                # User management, winner verification, draw publishing
│
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL database (local or hosted e.g. Neon, Supabase)
- Cloudinary account (free tier works)
- Stripe account (free, test mode only)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/golfdraw.git
cd golfdraw
```

---

### 2. Server Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
DATABASE_URL="postgresql://your_db_connection_string"
JWT_SECRET="your_custom_jwt_secret_key"

CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"

CLIENT_URL="http://localhost:5173"

PORT=5000
```

> **Note:** If Cloudinary credentials are left empty, the server uses a mock image URL fallback for proof uploads — the app remains fully functional.

> **Note:** Stripe keys must start with `sk_test_` and `pk_test_` for test mode. Never use live keys (`sk_live_`) in development.

Run migrations and seed the database:

```bash
npx prisma migrate dev --name init
npx prisma generate
node prisma/seed.js
```

Start the server:

```bash
npm run dev
```

Server runs on `http://localhost:5000`

---

### 3. Client Setup

```bash
cd ../client
npm install
npm run dev
```

Client runs on `http://localhost:5173`. All `/api` calls are proxied to `localhost:5000` via Vite config.

---

## Features

### Authentication & Roles
- JWT-based authentication with role-based access control
- Two roles: `subscriber` and `admin`
- Login page has a **User / Admin toggle** — selecting Admin mode validates that the account has admin privileges before allowing access
- `ProtectedRoute` component guards all authenticated pages

### Subscription & Payments
- Real Stripe Checkout integration (Test Mode)
- Monthly plan ($5/month) and Yearly plan ($50/year)
- After successful payment, Stripe redirects back to dashboard and subscription is activated in the database
- Subscription status is checked on every authenticated request

### Score Management
- Subscribers enter golf scores (Stableford format, 1–45)
- Maximum 5 scores stored per user at any time
- Adding a 6th score automatically removes the oldest
- One score per date — duplicate dates are rejected
- Scores displayed in reverse chronological order

### Draw Engine
- Admin triggers monthly draws from the Admin Panel
- 5 unique random numbers are drawn between 1–45
- Active subscribers' scores are matched against drawn numbers:
  - **Tier 1 (Match 5):** 40% of prize pool + jackpot rollover
  - **Tier 2 (Match 4):** 35% of prize pool
  - **Tier 3 (Match 3):** 25% of prize pool
- Prize pool = active subscriber count × $5
- If no Tier 1 winner, the jackpot rolls over to the next month
- Draws start as unpublished (draft) — admin reviews and publishes when ready
- All calculations happen in a single database transaction

### Charity System
- Subscribers select a charity at registration
- Minimum 10% of subscription fee goes to chosen charity
- Users can update their charity preference and contribution percentage from the dashboard
- Admin can add, edit, and delete charity listings

### Winner Verification Flow
1. Draw runs → winners automatically recorded with `status: pending`
2. Winner logs in → sees win in **Winnings History** section
3. Winner uploads a screenshot proof of their golf scores
4. Screenshot is uploaded to Cloudinary and URL saved to DB
5. Admin reviews proof in **Winners & Payouts** tab → Approves or Rejects
6. Admin marks approved winners as **Paid** → status becomes `paid`

### Admin Control Panel (5 tabs)
- **User Subscriptions** — view all users, scores, subscription status; toggle subscriptions manually
- **Draw Engine** — configure draw month, execute draw, view results, publish draws
- **Charity Listings** — full CRUD for charity management
- **Winners & Payouts** — view proof uploads, approve/reject/mark paid
- **All User Scores** — view scores across all subscribers

---

## Database Schema (Key Models)

```
User         → id, name, email, password, role, isSubscribed, subscriptionPlan, charityId, charityPercent
Score        → id, userId, value (1-45), date (unique per user)
Charity      → id, name, description, imageUrl
Draw         → id, month, drawnNumbers[], totalPool, jackpotPool, jackpotRolled, published
Winner       → id, userId, drawId, matchCount, prizeAmount, status, proofUrl
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Register new subscriber |
| POST | /api/auth/login | Public | Login and receive JWT |
| PUT | /api/auth/profile | JWT | Update charity preferences |
| GET | /api/scores | JWT | Get user's scores |
| POST | /api/scores | JWT | Add a new score |
| PUT | /api/scores/:id | JWT | Update a score |
| DELETE | /api/scores/:id | JWT | Delete a score |
| GET | /api/charities | Public | List all charities |
| POST | /api/subscribe/create-checkout | JWT | Create Stripe checkout session |
| POST | /api/subscribe/confirm | JWT | Confirm payment and activate subscription |
| GET | /api/draw/latest | Public/JWT | Get latest published draw (admin sees unpublished too) |
| POST | /api/draw/run | Admin | Execute monthly draw |
| GET | /api/draw/winnings | JWT | Get user's winnings history |
| GET | /api/admin/users | Admin | List all users |
| PUT | /api/admin/users/:id/subscribe | Admin | Toggle user subscription |
| GET | /api/admin/winners | Admin | List all winners |
| PUT | /api/admin/verify/:winnerId | Admin | Update winner status |
| PUT | /api/admin/draws/:id/publish | Admin | Publish a draw |
| POST | /api/admin/winners/:id/proof | JWT | Upload winner proof screenshot |

---

## Deployment Notes

### Environment Variables for Production

Update these in your Render (server) environment:
```
CLIENT_URL=https://your-vercel-app.vercel.app
DATABASE_URL=your_production_db_url
```

Update Stripe keys to live keys only when business KYC is complete and Stripe approves the account for India.

---

## Known Limitations

- **Stripe is Test Mode only** — live payments require business registration and KYC in India


---

## Author

**Bhumika Chanchlani**
B.Tech — Maharaja Surajmal Institute of Technology, Delhi
- GitHub: [github.com/bhumika019579](https://github.com/bhumika019579)
- LinkedIn: [linkedin.com/in/bhumika-chanchlani-869a85317](https://linkedin.com/in/bhumika-chanchlani-869a85317)
- Portfolio: [bhumika019579.github.io/portfolio](https://bhumika019579.github.io/portfolio)