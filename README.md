# ⚡ OpslyDesk — AI-Powered Field Service & Business Operating System

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://opsly-theta.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Opsly--ongoing-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ForgefriendT/Opsly-ongoing/)

> **Live Production Demo**: [https://opsly-theta.vercel.app](https://opsly-theta.vercel.app)

---

> [!IMPORTANT]  
> **🔒 Privacy, Security & Public Demo Notice**  
> For security, compliance, and privacy reasons, **live backend database connections, third-party secret API keys (Twilio SMS gateways, live Stripe/Paddle payment processing, Google/QuickBooks OAuth tokens, and real customer PII) are strictly disabled or operating in isolated sandbox simulation mode in this public demonstration environment.** The app renders simulated demo data and client-side fallback workflows so you can safely explore the full UI/UX, workflow interactions, and operational features.

---

## 🎯 What OpslyDesk Solves

Small to mid-sized field service businesses (HVAC technicians, roofers, landscapers, commercial cleaners, contractors, and stylists) traditionally suffer from **fragmented, overly complicated software tools**:
- **Delayed Invoicing & Cash Flow Bottlenecks**: Invoices take days to generate, and overdue payment follow-ups are performed manually or forgotten.
- **Complex UI & Steep Learning Curves**: Field technicians waste hours navigating dense enterprise software just to log a job or check schedule changes.
- **Lack of Real-Time Profitability Insight**: Business owners struggle to track real job margins, P&L statements, and AR aging across different service niches.
- **Scattered Communication**: Client messages, estimate approvals, change orders, and service contracts live in separate email threads and spreadsheets.

**OpslyDesk** unifies field service management into a single, intuitive AI-driven operating system. It allows owners and technicians to manage their entire operational lifecycle—from natural language AI commands and dispatch scheduling to digital contract signing and instant invoice collection.

---

## ✨ Key Capabilities & What It Can Do

### 🧠 1. AI Natural Language Command Engine
Control your entire operations by simply typing or speaking conversational prompts:
- *"Invoice Sarah $350 for roof repair"*
- *"Schedule Mike on Friday at 9am for system inspection"*
- *"Show me my outstanding balance and net profit this month"*
- *"Create an estimate for the Henderson job"*
- *"Run late payment chasers for overdue invoices"*

### 💼 2. Multi-Niche Customized Workflows
OpslyDesk dynamically adapts dashboard widgets, terminology, and operational templates based on your specific industry niche:
- **HVAC & Electrical**: Unit warranty tracking, capacitor/parts restock alerts, seasonal tune-up reminders.
- **Roofing & General Contracting**: Scope change orders, material cost tracking, multi-phase project bids.
- **Landscaping & Lawncare**: Route scheduling, recurring bi-weekly service plans, seasonal upkeep checklists.
- **Commercial Cleaning**: Crew dispatching, workspace liability forms, bi-weekly clean checklists.
- **Salon & Beauty**: Stylist bookings, client retention tracking, retail inventory metrics.

### 📄 3. Estimates, Invoices & Client Portals
- **Invoice & Estimate Builder**: Line-item calculations, customizable tax rates, discount presets, payment terms, and deposit tracking.
- **Public Client Portals**: Dedicated URLs (`/invoice/:id` and `/estimate/:id`) featuring print-isolated clean CSS formatting, Stripe payment button integrations, and digital approval signatures.
- **Automated Payment Follow-up Chasers**: 3-stage automated follow-up queue (`Day 3 Polite Reminder`, `Day 7 Firmer Follow-up`, `Day 14 Final Notice`) with owner review/approval workflow.

### 📅 4. Job Dispatch & Visual Scheduler
- **Interactive Calendar**: Day, week, and month views with color-coded job statuses (scheduled, in-progress, completed, cancelled).
- **Technician & Inspector Dispatch**: Assign crew members, specify job addresses, set hourly rates, attach customer notes, and track real-time job progress.

### 📑 5. Digital Contracts, Documents & Change Orders
- **Built-in Contract Templates**: Pre-configured templates for Roofing, Painting, Landscaping, Cleaning, and HVAC agreements.
- **Interactive PDF & Print Engine**: Built-in A4 document viewer with clean `@media print` CSS for physical printing and digital PDF saving.
- **Digital Signatures**: Digital signature capture with timestamps and audit trail.

### 💬 6. Two-Way Communication & Follow-up Sequences
- **Multi-Threaded Message Inbox**: Unified message inbox mapped directly to client contact profiles.
- **Automated Drip Sequences**: Triggered follow-up sequence builder based on lifecycle events (e.g., invoice sent, estimate created, job completed).

### 📊 7. Financial Analytics & Business Intelligence
- **P&L Statements & Margin Analysis**: Real-time revenue tracking, expense categorization, net profit, and profit margin calculations.
- **Cash Flow Projections & AR Aging**: 30/60/90-day Accounts Receivable aging breakdowns and cash flow forecasting.
- **Localized Market Analysis**: AI-assisted competitive insight reports tailored to the client's industry and region.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite 8, Framer Motion (micro-animations), Opsly Design System (vanilla CSS tokens)
- **Backend / Database**: Supabase (PostgreSQL, Row Level Security, Auth, Realtime)
- **AI Middleware**: Node.js SSE Stream Handler, Supabase Admin Client, LLM Pipeline
- **Payment & Serverless**: Stripe Payment Links, Paddle Webhooks, Vercel Serverless Functions

---

## 🚀 Getting Started Locally

### Prerequisites

- Node.js `v18.x` or higher
- `npm` or `yarn`

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/ForgefriendT/Opsly-ongoing.git
cd Opsly-ongoing

# Install dependencies
npm install

# Run Vite development server
npm run dev

# Test production build
npm run build
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
