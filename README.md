# Chakreshwar Swimming Pool – Swimming Pool Management System (PWA)

Premium swimming pool operations, admission ticketing, real-time timer tracking, and equipment rental management system built specifically for **Chakreshwar Swimming Pool**, integrated with **Supabase Database & Authentication** and transformed into a full **Progressive Web App (PWA)** with offline capabilities.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 🏊‍♂️ Core Features & Capabilities

- **Progressive Web App (PWA) & Offline Capabilities**:
  - **Installable**: Installs natively on Android, Windows Desktop (Chrome / Edge), and iOS (Safari "Add to Home Screen").
  - **Works Offline**: Precached application shell, local font caching, and IndexedDB local persistence via Dexie.js.
  - **Instant Startup Hydration**: Stored data is immediately displayed on launch from IndexedDB without waiting for network responses.
  - **Offline Write Operations**: Staff can check in swimmers, register group passes, record payments, and process equipment rentals even when internet connectivity drops.
  - **Automatic Cloud Synchronization**: Offline operations are queued with client UUIDs and synchronized with Supabase in dependency-safe order when connectivity returns.
  - **Safe Conflict Handling & Duplicate Prevention**: Deduplication via deterministic idempotency keys, customer mobile number reuse, and non-negative equipment stock verification.
  - **Zero Sensitive Data in HTTP Cache**: Supabase API responses are excluded from Workbox CacheStorage and persisted strictly in IndexedDB.

- **Real-Time Timers & Web Audio API Alarms**:
  - Live HH:MM:SS countdowns calculated from persisted `entry_time` and `scheduled_exit_time` surviving browser refreshes and device restarts.
  - **5-Minute Warning**: Orange status badge with warning chime.
  - **Overtime Alert**: Red status badge with live overtime counter (`+HH:MM:SS`) and audible alarm.
  - Synthesized Web Audio API sound alerts with zero external audio dependencies.

- **Supabase Cloud Architecture (5 Core Tables)**:
  1. `customers`: Directory with unique mobile indexing to prevent duplicate profiles.
  2. `sessions`: Individual and squad swimming passes linked to customer records.
  3. `payments`: Multi-channel payment ledger (`cash`, `google_pay`, `phonepe`, `paytm`, `other`).
  4. `costume_rentals`: Equipment & costume inventory rentals linked by `session_id`, supporting partial returns.
  5. `equipment`: Persistent accessory sizes, rental rates, and stock shared across devices.

- **Seven Operational Pages**:
  1. **Dashboard** (`/`): Real-time deck monitor, lane counters, expiring alerts, and quick checkout actions.
  2. **Sessions** (`/sessions`): Active, Expired, Completed, and All Sessions tabs with search, filter, and rental management.
  3. **Groups** (`/groups`): Group admission using leader contact and swimmer count with package-based billing.
  4. **Payments** (`/payments`): Transaction ledger, payment method breakdowns, and CSV / Excel exports.
  5. **Reports** (`/reports`): Daily & Monthly revenue journals, footfall trends, Recharts analytics, and Excel exports.
  6. **Packages** (`/packages`): Pricing management with customizable passes (30m, 60m, 90m, custom duration).
  7. **Settings** (`/settings`): Business information, base pricing, alarm testing, IndexedDB storage monitor, and staff auth controls.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+ (tested on Node v20/v22)
- npm v9+

### 1. Install Dependencies
From the repository root:
```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Configure Environment Variables
Copy `.env.example` in `frontend` to `.env`:
```bash
cp frontend/.env.example frontend/.env
```
Fill in your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```
*(If no Supabase credentials are provided, the app will run in offline demo mode using local demonstration data)*

### 3. Start Development Server
From the root workspace directory:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Create Production Build
```bash
npm run build
```

---

## ☁️ Deploying to Vercel (Production)

This project is optimized for deployment on [Vercel](https://vercel.com). Pre-configured `vercel.json` files are included at both the root and `frontend/` directory to handle SPA rewrites and PWA cache-control headers.

### Option A: Standard Deployment (Recommended)
1. Push your code to your GitHub / GitLab / Bitbucket repository.
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New** > **Project** and import your repository.
3. In **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your-supabase-anon-key`
5. Click **Deploy**.

### Option B: Monorepo Root Deployment
If you leave **Root Directory** as `.` (root):
- **Build Command**: `npm run build`
- **Output Directory**: `frontend/dist`
- Add the same environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## 🛠️ Supabase Database Setup

### 1. Execute Core Database Schema
Open your Supabase Project Dashboard, navigate to **SQL Editor**, and run the SQL script located at:
`frontend/supabase/schema.sql`

This script will:
- Enable the `uuid-ossp` extension.
- Create the core tables (`customers`, `sessions`, `payments`, `costume_rentals`, `equipment`, and `packages`).
- Create indexes for fast mobile search, session date filtering, and payment ledger lookups.
- Enable Row Level Security (RLS) and configure staff access policies.

If upgrading a database created with the earlier inventory schema, run
`frontend/supabase/equipment_inventory_migration.sql` once to migrate the equipment table and add rental-item links and size tracking.
For an existing database that has already run that inventory migration, run
`frontend/supabase/equipment_sale_option_migration.sql` once to add optional sale pricing to rental equipment.

### 2. (Optional) Run PWA Offline Sync Migration
To enable server-side `updated_at` triggers and explicit payment idempotency indexing, run:
`frontend/supabase/pwa_offline_migration.sql`

### 3. Create a Staff User Account
In your Supabase Dashboard:
1. Navigate to **Authentication** > **Users** > **Add User** > **Create User**.
2. Enter a staff email (e.g. `staff@chakreshwarswimmingpool.com`) and secure password.
3. Sign in using the **Staff Login** button in the app header or in **Settings**.

---

## 📱 Device Installation Guide

- **Android (Chrome / Edge)**:
  Tap the **Install App** button that appears at the bottom of the screen, or tap Chrome's three dots ($\vdots$) > **Install app** / **Add to Home screen**.
- **Windows Desktop (Chrome / Edge)**:
  Click the **Install** icon on the right side of the browser address bar, or click **Install App** in the app.
- **iPhone / iPad (iOS Safari)**:
  Open in Safari, tap the **Share** button ($\uparrow$ inside a box), scroll down, and tap **Add to Home Screen**.

---

## 🔒 Security & Privacy Architecture
- **Zero Secrets in Frontend**: Only public `anon` key is used with Supabase Row Level Security (RLS). No service-role keys are bundled.
- **No Private Cache Storage**: Supabase queries, JWT tokens, and user credentials are never cached in browser CacheStorage.
- **Auditable Payments**: Offline payment records are tracked locally with pending indicators and reconciled with the cloud ledger upon connection.

---

## 📄 License
Private and proprietary software developed for Chakreshwar Swimming Pool.
