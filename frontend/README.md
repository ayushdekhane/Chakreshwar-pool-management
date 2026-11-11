# Serenity Sports Club – Swimming Pool Management System

Premium swimming pool operations and admission management system built specifically for **Serenity Sports Club**, integrated with **Supabase Database & Authentication**.

---

## 🏊‍♂️ Features & Capabilities

- **Modern Architecture**:
  - React 18, Vite, TypeScript, and Tailwind CSS.
  - Supabase client integration via `@supabase/supabase-js`.
  - Zero standalone Node.js or Express backend required — frontend communicates directly with Supabase.
  - Zustand state manager with synchronized Supabase database hydration and fallback in-memory mode.
  - 100% persistent swimming timers calculated from `entry_time` and `scheduled_exit_time` surviving browser refreshes.

- **Supabase Database Architecture (5 Core Tables)**:
  1. `customers`: Customer directory with UUID PK, name, mobile, and created timestamp. Unique mobile lookup prevents duplication.
  2. `sessions`: Individual swimmer records. A group is stored as one session with a generated unique `group_code`, leader display name, and swimmer count.
  3. `payments`: Multi-channel payment ledger (`cash`, `google_pay`, `phonepe`, `paytm`, `other`). Outstanding amounts calculate dynamically from session charges minus recorded payments.
  4. `costume_rentals`: Equipment & costume inventory rentals linked by `session_id`, tracking item name, quantity, returned quantity, and charges with partial return support.
  5. `rental_equipment`: Persistent accessory rental rates and stock settings shared across staff sessions and browser refreshes.

- **Supabase Authentication & Security**:
  - Row Level Security (RLS) enabled on all 5 tables.
  - Secure staff-only access policies for operational personnel.
  - Clean Staff Login modal built right into the header and settings page.
  - No secrets or service-role keys exposed in frontend code.

- **Seven Dedicated Operational Pages**:
  1. **Dashboard** (`/`): Real-time deck monitor, live counters (Currently Swimming, Total People, Expiring in 5 Mins, Expired Sessions), and active swimmer cards with session-level payment balances and checkout actions.
  2. **Sessions** (`/sessions`): Active, Expired, Completed, and All Sessions tabs, plus customer inspection, filters (search, phone, date, status, payment status, individual/group), and complete **Equipment Rental Management**.
  3. **Groups** (`/groups`): Group admission using the leader's name and swimmer count (without entering each member), shared timer, package-based group billing, and optional multi-item accessory rentals billed with the group session.
  4. **Payments** (`/payments`): Multi-channel payment ledger (Cash, Google Pay, PhonePe, Paytm, Other), cash and online collection summaries, transaction search, and CSV/Excel exports. Refund processing is not supported.
  5. **Reports** (`/reports`):
     - **Daily Report**: Date picker, financial summary cards, chronological session and payment ledgers, and payment-status reporting.
     - **Monthly Report**: Month/year selector, summary cards, Recharts visualizations (Daily Revenue Trend, Payment Mode Distribution, Revenue Streams), and a **Daily Breakdown Table** for every day of the month with one-click jump to that day's daily report. Reports do not include outstanding-balance summaries.
     - **Export & Print**: Clean CSV export, Excel (.xlsx) export, and browser print styles.
  6. **Packages** (`/packages`): Pricing management with default 30m (₹50), 60m (₹100), 90m (₹150) passes, create new package, edit package, activate/deactivate toggle, and archive.
  7. **Settings** (`/settings`): Club business information, logo preview, base pricing, Web Audio API alarm sound testing & volume, database-backed equipment stock and rental rates, 12h/24h time format, Supabase database and staff auth controls.

- **Real-Time Timers & Web Audio API Alarms**:
  - Live HH:MM:SS countdowns updated every second based on `entryTime` and `scheduledExitTime`.
  - 5-Minute Warning: Orange status badge and alert chime.
  - Overtime Alert: Red status badge with live overtime counter (`+HH:MM:SS`) and audible alarm.
  - Self-contained Web Audio API synthesized audio (warning chime, expired alert, audio test button) with zero external audio file dependencies.

- **Equipment Rentals & Partial Returns**:
  - Costumes (Men/Women/Kids), Anti-fog Goggles, Microfiber Towels, Caps, and Kickboards.
  - Support for Full Returns and Partial Returns (calculates remaining quantity and adjusts equipment inventory stock).

- **Official Brand Design System**:
  - Primary Blue: `#087FA5`
  - Purple: `#70218C`
  - Pink: `#BE2365`
  - Red: `#E12C3D`
  - Orange: `#ED6429`
  - Gold: `#EFB33A`
  - Background: `#F4F7F9`
  - Main Text: `#171717`
  - Secondary Text: `#64748B`
  - Border: `#E2E8F0`

---

## 🛠️ Supabase Setup Instructions

### 1. Database Schema Execution
Open your Supabase Project dashboard, go to the **SQL Editor**, and run the SQL script located at:
`frontend/supabase/schema.sql`

This script will:
- Create the five tables (`customers`, `sessions`, `payments`, `costume_rentals`, `rental_equipment`).
- Add foreign keys, primary keys, and indexes for fast mobile, session date, and payment searches.
- Enable Row Level Security (RLS) on all five tables.
- Add policies allowing authenticated staff to perform SELECT, INSERT, UPDATE, and DELETE operations.
- Add the `group_name` and `people_count` columns used for leader display and count-based group billing, and create the persistent `rental_equipment` settings table; rerun the script on an existing database to apply these updates.

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the `frontend` directory:
```bash
cp .env.example .env
```
Fill in your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Create a Staff User
In the Supabase Dashboard, navigate to **Authentication** > **Users** > **Add User** > **Create User**.
Enter a staff email (e.g. `staff@serenitysports.com`) and password.

---

## 🚀 Running the Project

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.
Click **Staff Login** in the header or in Settings to sign in with your staff credentials.

To create a production build:
```bash
npm run build
```
