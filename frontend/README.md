# Serenity Sports Club – Swimming Pool Management System (Frontend & PWA)

Premium swimming pool operations and admission management system built specifically for **Serenity Sports Club**, integrated with **Supabase Database & Authentication** and converted into a complete **Progressive Web App (PWA)** with offline capabilities.

---

## 🏊‍♂️ Core Features & Capabilities

- **Modern Architecture**:
  - React 18, Vite 5, TypeScript, and Tailwind CSS.
  - Supabase client integration via `@supabase/supabase-js`.
  - Zero standalone Node.js or Express backend required — frontend communicates directly with Supabase.
  - Zustand state manager with synchronized Supabase database hydration and fallback in-memory mode.
  - 100% persistent swimming timers calculated from `entry_time` and `scheduled_exit_time` surviving browser refreshes.

- **Progressive Web App (PWA) & Offline Layer**:
  - **Installable**: Full standalone app on Android, Windows, and iOS.
  - **Offline-First Caching**: Workbox precaching for app shell, bundles, and assets.
  - **IndexedDB Persistence**: Dexie.js local database persists sessions, customers, payments, rentals, and equipment offline.
  - **Offline Write Support**: Check-in swimmers, issue group passes, record payments, and process equipment rentals without internet.
  - **Automatic Synchronization**: Background sync engine pushes pending mutations to Supabase when reconnected.
  - **Zero Leaked Cache**: Supabase private queries are never cached in browser CacheStorage.

- **Supabase Database Architecture (5 Core Tables)**:
  1. `customers`: Customer directory with UUID PK, name, mobile, and created timestamp. Unique mobile lookup prevents duplication.
  2. `sessions`: Individual swimmer records and group squads sharing a `group_code`, leader display name, and swimmer count.
  3. `payments`: Multi-channel payment ledger (`cash`, `google_pay`, `phonepe`, `paytm`, `other`). Outstanding amounts calculate dynamically from session charges minus recorded payments.
  4. `costume_rentals`: Equipment & costume inventory rentals linked by `session_id`, tracking item name, quantity, returned quantity, and charges with partial return support.
  5. `rental_equipment`: Persistent accessory rental rates and stock settings shared across staff sessions and browser refreshes.

- **Supabase Authentication & Security**:
  - Row Level Security (RLS) enabled on all 5 tables.
  - Secure staff-only access policies for operational personnel.
  - Staff Login modal built right into the header and settings page.
  - No secrets or service-role keys exposed in frontend code.

- **Seven Dedicated Operational Pages**:
  1. **Dashboard** (`/`): Real-time deck monitor, live counters (Currently Swimming, Total People, Expiring in 5 Mins, Expired Sessions), and active swimmer cards with session-level payment balances and checkout actions.
  2. **Sessions** (`/sessions`): Active, Expired, Completed, and All Sessions tabs, plus customer inspection, filters (search, phone, date, status, payment status, individual/group), and complete **Equipment Rental Management**.
  3. **Groups** (`/groups`): Group admission using the leader's name and swimmer count (without entering each member), shared timer, package-based group billing, and optional multi-item accessory rentals billed with the group session.
  4. **Payments** (`/payments`): Multi-channel payment ledger (Cash, Google Pay, PhonePe, Paytm, Other), cash and online collection summaries, transaction search, and CSV/Excel exports.
  5. **Reports** (`/reports`): Daily & Monthly revenue journals, footfall trends, Recharts visualizations, and Excel exports with offline data indicators.
  6. **Packages** (`/packages`): Pricing management with default 30m, 60m, 90m passes, create new package, edit package, and activate/deactivate toggles.
  7. **Settings** (`/settings`): Club business information, logo preview, base pricing, Web Audio API alarm sound testing & volume, database-backed equipment stock and rental rates, 12h/24h time format, Supabase database and staff auth controls, and IndexedDB storage monitor.

---

## 🛠️ Supabase Setup Instructions

### 1. Database Schema Execution
Open your Supabase Project dashboard, go to the **SQL Editor**, and run the SQL script located at:
`supabase/schema.sql`

This script will:
- Enable the `uuid-ossp` extension.
- Create the five tables (`customers`, `sessions`, `payments`, `costume_rentals`, `rental_equipment`).
- Add foreign keys, primary keys, and indexes for fast mobile, session date, and payment searches.
- Enable Row Level Security (RLS) on all five tables.
- Add policies allowing authenticated staff to perform SELECT, INSERT, UPDATE, and DELETE operations.

### 2. (Optional) Run PWA Offline Sync Migration
`supabase/pwa_offline_migration.sql`

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Create a Staff User
In the Supabase Dashboard, navigate to **Authentication** > **Users** > **Add User** > **Create User**.
Enter a staff email (e.g. `staff@serenitysports.com`) and password.

### 5. Configure Password Reset
In Supabase, open **Authentication** > **URL Configuration**:
- Set **Site URL** to your deployed app's HTTPS origin.
- Add that same origin to **Redirect URLs**. Also allow `http://localhost:3000` if you use local development.

The app requests a reset-link redirect to the origin currently serving the login page. If the origin is not allowlisted, or the deployed build is outdated, Supabase may use the **Site URL** instead. After changing these settings, request a new reset email; old links keep their original destination.

---

## 🚀 Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
Click **Staff Login** in the header or in Settings to sign in with your staff credentials.

To create a production build:
```bash
npm run build
```

---

## ☁️ Deploying to Vercel

1. Import this repository into [Vercel](https://vercel.com).
2. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy! `vercel.json` ensures all SPA routes and PWA service worker caching headers work out-of-the-box.
