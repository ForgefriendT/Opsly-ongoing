# ⚡ OpslyDesk — AI-Powered Field Service & Business Operating System

> **OpslyDesk** is an enterprise-grade field service management and business operating system built for modern service businesses (HVAC, Landscaping, Roofing, Cleaning, Salon, Painting, Contracting, and more). It combines CRM, dispatch scheduling, automated invoicing, AI-assisted natural language command execution, digital contract/document management, and real-time P&L analytics into a unified web portal.

---

## 🌟 Key Features & Capabilities

### 🧠 1. AI Natural Language Command Engine
- **Natural Language Execution**: Control your business through simple conversational prompts (e.g., *"Invoice Sarah $350 for roof repair"*, *"Schedule Mike on Friday at 9am"*, *"Show overdue payments"*).
- **Streaming SSE Pipeline**: Live streaming response pipeline (`/api/command`) supporting real-time streaming, context tracking, token limit enforcement, and action dispatching.
- **Smart Context Routing**: Contextual intelligence that understands company niche terminology overrides and translates queries into Supabase database operations.

### 💼 2. Multi-Niche Architecture
- **Dynamic Niche Workflows**: Supports tailored operational templates and custom dashboard widgets for:
  - **Roofing & Construction** (Warranty tracking, scope change orders)
  - **HVAC & Electrical** (Capacitor/parts restock alerts, unit warranties)
  - **Landscaping & Lawncare** (Route scheduling, seasonal recurring plans)
  - **Commercial Cleaning** (Crew assignments, bi-weekly clean checklists)
  - **Salon & Beauty** (Stylist bookings, client retention, retail sales)
  - **Painting & General Contracting** (Bid pipeline tracking, paint material costs)

### 📄 3. Estimates, Invoices & Client Portals
- **Invoice & Estimate Builder**: Line-item calculation, tax rates, discount presets, payment terms, and deposit tracking.
- **Public Client Portals**: Dedicated customer portal URLs (`/invoice/:id` and `/estimate/:id`) featuring print-isolated clean CSS formatting, Stripe payment integration, digital approval signatures, and automatic status updates.
- **Automated Late Payment Chaser**: Smart 3-stage automated follow-up sequence (`Day 3 Polite Reminder`, `Day 7 Firmer Follow-up`, `Day 14 Final Notice`) with owner review/approval queue.

### 📅 4. Job Dispatch & Calendar Scheduling
- **Visual Calendar View**: Day, week, and month views with color-coded job statuses (scheduled, in-progress, completed, cancelled).
- **Job Builder & Inspector Dispatch**: Assign field technicians, specify job addresses, set rates, attach customer notes, and track completion progress.
- **Google Calendar Sync**: Integrates dispatch schedule events with external Google Calendar feeds.

### 📑 5. Documents, Contracts & Change Orders
- **Contract Templates Library**: Built-in templates for Roofing, Painting, Landscaping, Cleaning, and HVAC agreements.
- **Interactive PDF Viewer & Print Engine**: Built-in A4 document renderer with custom `@media print` styling for crisp, clean physical printing and digital PDF saving.
- **Digital Signatures**: Digital client signature capture with timestamps and audit trail.

### 💬 6. Two-Way Communication & Follow-up Sequences
- **Multi-Threaded Inbox**: Unified message inbox mapped directly to Supabase client contacts.
- **Drip Email/SMS Sequences**: Automated follow-up sequence builder triggered by lifecycle events (e.g., invoice sent, estimate created, job completed).

### 📊 7. Financial Analytics & Business Intelligence
- **P&L Statements & Profitability**: Real-time revenue, expense tracking, net profit, and margin percentage calculations.
- **Cash Flow Projections & AR Aging**: 30/60/90-day Accounts Receivable aging breakdowns and automated cash flow forecasting.
- **Localized Market Trends**: AI-driven competitive insight reports tailored to the client's industry and region.

### 🔐 8. Enterprise Security & Session Management
- **Concurrent Session Eviction**: Real-time session limit enforcement backed by Supabase Realtime subscriptions to `active_sessions`.
- **Role-Based Feature Gating**: Tiered feature access system (`Starter`, `Growth`, `Pro`, `Business`) with grace period handling for subscription lifecycle management.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite 8, Framer Motion (animations), CSS3 (Opsly Design System tokens)
- **Backend / DB**: Supabase (PostgreSQL, Row Level Security, Auth, Realtime)
- **AI Middleware**: Node.js SSE Stream Handler, Supabase Admin Service Role Client, LLM Pipeline
- **Payment Processing**: Stripe Payment Links & Paddle Webhooks

---

## 📁 Repository Structure

```
OpslyDesk/
├── api/                             # Serverless backend functions (Vercel / Node)
├── src/
│   ├── assets/                      # Static assets & branding icons
│   ├── components/
│   │   ├── Analytics/               # AdvancedReports & P&L analytics
│   │   ├── Auth/                    # Login, Signup, OTP, Password Reset
│   │   ├── Billing/                 # Plan upgrade & pricing modals
│   │   ├── CRM/                     # ContactProfile, CsvImportModal
│   │   ├── Communication/           # CommunicationInbox & SMS threads
│   │   ├── Documents/               # DocumentsModule, PDF Viewer, Contracts
│   │   ├── Estimates/               # EstimateBuilder, EstimatePortal, Wizard
│   │   ├── Invoices/                # InvoiceBuilder, InvoicePortal
│   │   ├── Jobs/                    # CalendarView, JobBuilderModal, Details
│   │   ├── Layout/                  # CommandBar, Header, Sidebar, MobileNav
│   │   ├── Onboarding/              # OnboardingWizard (Steps 1-4)
│   │   ├── Reviews/                 # CustomerReviews management
│   │   └── Team/                    # TeamManagement & Inspector dispatch
│   ├── contexts/                    # AuthContext & Session management
│   ├── hooks/                       # useFeatureAccess (Plan gating)
│   ├── lib/                         # Supabase client, AI Middleware, Webhooks
│   ├── App.jsx                      # Main application orchestrator
│   ├── index.css                    # Opsly CSS design system tokens
│   └── main.jsx                     # Entry point
├── index.html                       # HTML template
├── vite.config.js                   # Vite configuration
└── package.json                     # Dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18.x` or higher
- `npm` or `yarn`
- A Supabase project instance

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SUPABASE_SECRET_KEY=your-supabase-service-role-secret-key
```

### Installation & Development

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Production build test
npm run build
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
