# SugarCare - Health Monitor & Tracker

SugarCare is a premium, modern, and mobile-responsive health tracking web application designed to help users securely log, monitor, and analyze their blood sugar and blood pressure readings.

---

## 🚀 Key Features

* **Authentication**: Seamless email signup, login, and Google OAuth via Supabase Authentication (or simulated in local Demo mode).
* **Dual-Mode Adapter**: Runs instantly in **Demo Mode** using `localStorage` with rich pre-populated mock data if database credentials are not configured. Swaps automatically to **Production Mode** when environment variables are supplied.
* **Dashboard Summary**: Real-time stats showing latest readings, entry counters, and automated 7-day and 30-day health average insights.
* **Vitals Logs (CRUD)**: Log, edit, or delete sugar levels and blood pressure entries with range validation and inline confirmations.
* **Healthy Celebration**: Dynamic confetti feedback when vitals are logged in healthy medical ranges.
* **Advanced History Tables**: Interactive history grids with sorting, pagination, date-range filtering, and text search.
* **Health Analytics**: Interactive, responsive charts powered by Recharts showing trends across 7, 30, and 90-day intervals.
* **Export Reports**: Generate and download professional medical reports in CSV format or print-ready PDF format (via jsPDF) featuring summary stats and structured history grids.
* **PWA & Installable**: Fully configure web manifests and service worker loaders, showing floating install banners on compatible mobile devices and tablets.
* **Dark Mode**: Complete system preference detection and manual toggle support.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS v4, shadcn/ui.
* **Charts**: Recharts.
* **PDF Engine**: jsPDF & jspdf-autotable.
* **Animation**: canvas-confetti.
* **Backend & Database**: Supabase & PostgreSQL.

---

## 💻 Local Setup Guide

### 1. Install Dependencies
Clone/navigate to the folder and run:
```bash
npm install
```

### 2. Start the Development Server
Run the local dev engine:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

*By default, if no Supabase environment variables are present, the app will run in **Demo Mode** using local storage and seeded mock data. You can log, edit, delete, view charts, and export CSV/PDF reports immediately.*

---

## 🗄️ Supabase Configuration (Optional - For Production Mode)

To connect the application to a live PostgreSQL database and enable user authentication:

### 1. Create a Supabase Project
Go to [Supabase](https://supabase.com) and create a new project.

### 2. Execute SQL Database Migrations
Open the **SQL Editor** in the Supabase Dashboard, create a new query, paste the contents of `supabase/migration.sql` from this repository, and click **Run**. This will create the `profiles`, `sugar_readings`, and `bp_readings` tables, configure row-level security (RLS), and register the database triggers.

### 3. Add Environment Variables
Create a `.env.local` file in the root of the project and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

When you restart the development server, SugarCare will automatically detect these credentials, connect to your database, and switch from "Demo Mode" to live Supabase Auth and Database operations.

---

## 📱 PWA / Mobile Installation

1. Deploy the app (e.g., to Vercel or run locally on your network).
2. Open the page on a mobile device (iOS/Safari or Android/Chrome).
3. **Android**: A floating banner will prompt you to install. Tap "Install".
4. **iOS**: Tap the "Share" button, scroll down, and tap **Add to Home Screen**.
