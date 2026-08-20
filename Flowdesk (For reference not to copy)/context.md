# FlowDesk — Complete Project Context for Antigravity
> Feed this entire file to Antigravity at the start of every session.
> Last updated: June 2026

---

## 1. What FlowDesk Is

FlowDesk is a zero-cost, self-hosted business OS for individuals and small businesses. It replaces five separate tools — invoicing software, CRM, expense tracker, contract generator, and multi-currency converter — with one fast, beautiful, unified web app.

**The core promise:** Every common business task (send invoice, log a client, track an expense, generate a contract, check cash flow) takes under 60 seconds and fewer than 3 clicks.

**Phase 1 (now):** Solo personal use only. No auth for other users, no payment gateway, no multi-tenancy. Just one user (the owner) using it as a private business tool.

**Phase 2 (later, when revenue exists):** Add Stripe, Supabase auth for external users, PPP-based country pricing, white-label for agencies.

---

## 2. Tech Stack — Every Decision Final, No Alternatives

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR, file-based routing, API routes built-in |
| Language | **TypeScript** | Strict mode on. No `any`. |
| Database | **Supabase** | Free tier: Postgres + auth + storage + realtime |
| Styling | **Tailwind CSS v3** | Utility-first, no extra CSS files |
| UI components | **shadcn/ui** | Headless, accessible, fully customizable |
| PDF generation | **jsPDF + html2canvas** | Client-side, no server cost |
| Email delivery | **Resend** | 3,000 emails/month free, dead-simple API |
| Currency rates | **exchangerate.host** | Free, no API key, REST |
| AI features | **Google Gemini Flash API** | Free tier, fast, enough for summaries + advice |
| Deployment | **Vercel** | Free tier, instant deploys, custom domain ready |
| Icons | **Lucide React** | Consistent, tree-shakeable |
| Forms | **React Hook Form + Zod** | Validation co-located with schema |
| State | **Zustand** | Lightweight global state, no boilerplate |
| Date handling | **date-fns** | Lightweight, no moment.js |
| Charts | **Recharts** | React-native, composable |

**Do not suggest alternatives. Do not introduce additional libraries without asking.**

---

## 3. Design System — Non-Negotiable

### Aesthetic Direction
**"Refined Editorial Dark"** — Think a high-end financial newspaper meets a boutique design studio. Obsessively clean. Every pixel earns its place. The app feels expensive even though it cost nothing to build.

### Color Palette (CSS Variables — define in `globals.css`)

```css
:root {
  /* Backgrounds */
  --bg-base:        #0C0C0E;   /* deepest background */
  --bg-surface:     #131316;   /* card/panel background */
  --bg-elevated:    #1C1C21;   /* modals, dropdowns */
  --bg-subtle:      #22222A;   /* hover states, input bg */

  /* Brand */
  --accent:         #E8C547;   /* warm gold — primary CTA, highlights */
  --accent-dim:     #A88D2F;   /* secondary gold, disabled states */
  --accent-glow:    rgba(232, 197, 71, 0.12); /* subtle glow on hover */

  /* Text */
  --text-primary:   #F0EDE6;   /* near-white, warm tint */
  --text-secondary: #8A8780;   /* muted labels */
  --text-tertiary:  #4A4845;   /* disabled, placeholders */

  /* Semantic */
  --success:        #2ECC71;
  --success-dim:    rgba(46, 204, 113, 0.12);
  --warning:        #F39C12;
  --warning-dim:    rgba(243, 156, 18, 0.12);
  --danger:         #E74C3C;
  --danger-dim:     rgba(231, 76, 60, 0.12);
  --info:           #3498DB;
  --info-dim:       rgba(52, 152, 219, 0.12);

  /* Borders */
  --border:         rgba(240, 237, 230, 0.08);  /* default */
  --border-strong:  rgba(240, 237, 230, 0.16);  /* hover/focus */
  --border-accent:  rgba(232, 197, 71, 0.35);   /* focused inputs */

  /* Spacing scale */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-full: 9999px;
}
```

### Typography

```css
/* In layout.tsx head */
import { DM_Serif_Display, DM_Mono, Plus_Jakarta_Sans } from 'next/font/google'

const serif = DM_Serif_Display({ subsets: ['latin'], weight: '400' })
const mono  = DM_Mono({ subsets: ['latin'], weight: ['400', '500'] })
const sans  = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] })

/* CSS */
--font-display: 'DM Serif Display', Georgia, serif;  /* headings, hero numbers */
--font-body:    'Plus Jakarta Sans', sans-serif;      /* all UI text */
--font-mono:    'DM Mono', monospace;                 /* amounts, codes, dates */
```

**Type scale:**
- Page titles: `font-display`, 28–36px, weight 400 (serif looks great at normal weight)
- Section headings: `font-body`, 13px, weight 600, letter-spacing 0.08em, uppercase, `var(--text-secondary)`
- Body: `font-body`, 14px, weight 400, `var(--text-primary)`
- Amounts/numbers: `font-mono`, 16–24px, weight 500
- Labels: `font-body`, 11px, weight 500, uppercase, letter-spacing 0.1em, `var(--text-tertiary)`

### Component Patterns

**Card:**
```tsx
<div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
```

**Primary Button:**
```tsx
<button className="bg-[var(--accent)] text-[#0C0C0E] font-semibold text-sm px-4 py-2.5 rounded-[var(--radius-md)] hover:brightness-110 transition-all duration-150 active:scale-[0.98]">
```

**Ghost Button:**
```tsx
<button className="border border-[var(--border-strong)] text-[var(--text-primary)] text-sm px-4 py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--bg-subtle)] transition-all duration-150">
```

**Input:**
```tsx
<input className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] focus:border-[var(--border-accent)] rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors" />
```

**Badge (status):**
```tsx
// Paid
<span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--success-dim)] text-[var(--success)]">Paid</span>
// Overdue
<span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--danger-dim)] text-[var(--danger)]">Overdue</span>
// Pending
<span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--warning-dim)] text-[var(--warning)]">Pending</span>
// Draft
<span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">Draft</span>
```

**Sidebar nav item:**
```tsx
// Active
<div className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--accent-glow)] border border-[var(--border-accent)] text-[var(--accent)]">
// Inactive
<div className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer transition-all">
```

**Section label (above tables/lists):**
```tsx
<p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)] mb-3">
```

**Stat/metric card:**
```tsx
<div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Total Revenue</p>
  <p className="font-mono text-2xl font-medium text-[var(--text-primary)]">₹1,24,500</p>
  <p className="text-xs text-[var(--success)] mt-1.5">↑ 14% this month</p>
</div>
```

### Micro-interactions
- All interactive elements: `transition-all duration-150`
- Hover on cards: `hover:border-[var(--border-strong)]`
- Button press: `active:scale-[0.98]`
- New items appearing: use `animate-in fade-in slide-in-from-bottom-2 duration-200` (Tailwind animate plugin)
- Loading states: skeleton shimmer with `animate-pulse bg-[var(--bg-subtle)]`

---

## 4. App Structure

```
flowdesk/
├── app/
│   ├── layout.tsx              # Root layout, fonts, global CSS
│   ├── page.tsx                # Redirects to /dashboard
│   ├── dashboard/
│   │   └── page.tsx            # Main overview
│   ├── invoices/
│   │   ├── page.tsx            # Invoice list
│   │   ├── new/page.tsx        # Create invoice
│   │   └── [id]/page.tsx       # View/edit invoice
│   ├── clients/
│   │   ├── page.tsx            # CRM list
│   │   └── [id]/page.tsx       # Client profile
│   ├── expenses/
│   │   └── page.tsx            # Expense tracker
│   ├── documents/
│   │   ├── page.tsx            # Document templates list
│   │   └── new/page.tsx        # Generate document
│   ├── time/
│   │   └── page.tsx            # Time tracker
│   ├── currencies/
│   │   └── page.tsx            # Currency converter + rates
│   └── api/
│       ├── invoices/route.ts
│       ├── clients/route.ts
│       ├── expenses/route.ts
│       ├── documents/route.ts
│       ├── time/route.ts
│       ├── currency/route.ts
│       └── ai/route.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── AppShell.tsx
│   ├── invoices/
│   │   ├── InvoiceCard.tsx
│   │   ├── InvoiceBuilder.tsx
│   │   ├── InvoicePreview.tsx
│   │   └── InvoicePDF.tsx
│   ├── clients/
│   │   ├── ClientCard.tsx
│   │   └── ClientForm.tsx
│   ├── expenses/
│   │   ├── ExpenseRow.tsx
│   │   └── ExpenseForm.tsx
│   ├── documents/
│   │   ├── TemplateCard.tsx
│   │   └── DocBuilder.tsx
│   ├── time/
│   │   ├── TimerWidget.tsx
│   │   └── TimeLog.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── RevenueChart.tsx
│   │   └── ActivityFeed.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Badge.tsx
│       ├── Modal.tsx
│       ├── Dropdown.tsx
│       ├── Table.tsx
│       ├── Skeleton.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── pdf.ts                  # jsPDF helpers
│   ├── currency.ts             # exchangerate.host wrapper
│   ├── gemini.ts               # Gemini AI wrapper
│   ├── resend.ts               # Email helper
│   └── utils.ts                # formatCurrency, formatDate, etc.
├── types/
│   └── index.ts                # All TypeScript interfaces
├── hooks/
│   ├── useInvoices.ts
│   ├── useClients.ts
│   ├── useExpenses.ts
│   └── useCurrency.ts
└── store/
    └── index.ts                # Zustand store
```

---

## 5. Database Schema (Supabase / Postgres)

```sql
-- Clients (CRM)
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  address     TEXT,
  country     TEXT,
  currency    TEXT DEFAULT 'INR',
  notes       TEXT,
  status      TEXT DEFAULT 'active', -- active | inactive | lead
  tags        TEXT[],
  total_billed NUMERIC DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL, -- e.g. INV-2026-001
  client_id     UUID REFERENCES clients(id),
  status        TEXT DEFAULT 'draft', -- draft | sent | paid | overdue | cancelled
  issue_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date      DATE NOT NULL,
  currency      TEXT DEFAULT 'INR',
  subtotal      NUMERIC NOT NULL DEFAULT 0,
  tax_rate      NUMERIC DEFAULT 0,       -- percentage
  tax_amount    NUMERIC DEFAULT 0,
  discount      NUMERIC DEFAULT 0,       -- flat amount
  total         NUMERIC NOT NULL DEFAULT 0,
  notes         TEXT,
  payment_terms TEXT,
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Invoice line items
CREATE TABLE invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    NUMERIC NOT NULL DEFAULT 1,
  unit_price  NUMERIC NOT NULL,
  amount      NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order  INT DEFAULT 0
);

-- Expenses
CREATE TABLE expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount      NUMERIC NOT NULL,
  currency    TEXT DEFAULT 'INR',
  category    TEXT,  -- software | travel | marketing | equipment | other
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,  -- Supabase storage URL
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Time entries
CREATE TABLE time_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id),
  invoice_id  UUID REFERENCES invoices(id), -- set when billed
  description TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  hours       NUMERIC NOT NULL,
  rate        NUMERIC,  -- hourly rate, optional
  billed      BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Documents (generated contracts/agreements)
CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES clients(id),
  template_type TEXT NOT NULL, -- nda | service_agreement | freelance_contract | payment_terms | scope_of_work
  title         TEXT NOT NULL,
  content       JSONB NOT NULL,  -- filled template fields
  pdf_url       TEXT,            -- Supabase storage
  status        TEXT DEFAULT 'draft', -- draft | sent | signed
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. TypeScript Types

```typescript
// types/index.ts

export type ClientStatus = 'active' | 'inactive' | 'lead'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type DocumentType = 'nda' | 'service_agreement' | 'freelance_contract' | 'payment_terms' | 'scope_of_work'
export type ExpenseCategory = 'software' | 'travel' | 'marketing' | 'equipment' | 'other'

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  country?: string
  currency: string
  notes?: string
  status: ClientStatus
  tags: string[]
  total_billed: number
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
}

export interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  client?: Client
  items?: InvoiceItem[]
  status: InvoiceStatus
  issue_date: string
  due_date: string
  currency: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount: number
  total: number
  notes?: string
  payment_terms?: string
  paid_at?: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  currency: string
  category: ExpenseCategory
  date: string
  receipt_url?: string
  notes?: string
  created_at: string
}

export interface TimeEntry {
  id: string
  client_id?: string
  client?: Client
  invoice_id?: string
  description: string
  date: string
  hours: number
  rate?: number
  billed: boolean
  created_at: string
}

export interface Document {
  id: string
  client_id?: string
  client?: Client
  template_type: DocumentType
  title: string
  content: Record<string, string>
  pdf_url?: string
  status: 'draft' | 'sent' | 'signed'
  created_at: string
}

export interface CurrencyRate {
  code: string
  name: string
  rate: number  // relative to INR base
}

export interface DashboardStats {
  total_revenue: number
  outstanding: number
  overdue_count: number
  active_clients: number
  this_month_revenue: number
  last_month_revenue: number
  unbilled_hours: number
}
```

---

## 7. Module-by-Module Spec

### 7.1 Dashboard

**What it shows:**
- 4 stat cards across the top: Total Revenue (all time), Outstanding (unpaid invoices), Active Clients, Unbilled Hours
- Revenue bar chart — last 6 months (Recharts, data from invoices table grouped by month)
- Recent invoices — last 5, with status badge, client name, amount, quick action buttons
- Upcoming due dates — invoices due in next 7 days, ordered by urgency
- Quick actions row: New Invoice, New Expense, Start Timer, New Document

**Design notes:**
- Numbers in `font-mono`, warm gold for the primary revenue figure
- Chart bars: accent color for current month, muted for previous
- The dashboard should feel like a cockpit — dense but never cluttered

### 7.2 Invoices

**List view:**
- Sortable table: Invoice #, Client, Issue Date, Due Date, Amount, Status, Actions
- Filter bar: All / Draft / Sent / Paid / Overdue
- Search by client name or invoice number
- "New Invoice" button top right
- Row actions: View, Download PDF, Mark as Paid, Send Email, Duplicate, Delete

**Create/Edit view (`/invoices/new` and `/invoices/[id]`):**
- Left panel: live preview of invoice (updates as user types)
- Right panel: form fields
  - Client selector (dropdown from clients table, searchable)
  - Invoice number (auto-generated, editable)
  - Issue date + Due date (date pickers)
  - Currency selector
  - Line items: description, qty, unit price → auto-computes amount. Add/remove rows.
  - Subtotal (auto)
  - Tax rate field → computes tax amount
  - Discount field (flat)
  - Total (auto)
  - Notes / Payment terms
- Bottom actions: Save Draft, Preview, Download PDF, Send via Email

**Invoice number generation:**
```typescript
// lib/utils.ts
export function generateInvoiceNumber(existingNumbers: string[]): string {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`
  const existing = existingNumbers
    .filter(n => n.startsWith(prefix))
    .map(n => parseInt(n.replace(prefix, '')) || 0)
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1
  return `${prefix}${String(next).padStart(3, '0')}`
}
```

**PDF generation:**
- Use jsPDF + html2canvas
- Render a hidden `<InvoicePDF>` component off-screen, capture with html2canvas, add to jsPDF
- PDF layout: Company name top-left, invoice number top-right, client details, line items table, totals, notes, footer with disclaimer if document type
- File name: `{invoice_number}_{client_name}.pdf`

**Email (via Resend):**
```typescript
// lib/resend.ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvoiceEmail(invoice: Invoice, pdfBuffer: Buffer) {
  return resend.emails.send({
    from: 'FlowDesk <invoices@yourdomain.com>',
    to: invoice.client!.email!,
    subject: `Invoice ${invoice.invoice_number} from [Your Name]`,
    html: invoiceEmailTemplate(invoice),
    attachments: [{ filename: `${invoice.invoice_number}.pdf`, content: pdfBuffer }]
  })
}
```

### 7.3 CRM (Clients)

**List view:**
- Cards grid (not table) — each card shows: avatar initials circle, name, company, status badge, total billed, quick action buttons
- Filter: All / Active / Lead / Inactive
- Search by name, email, company
- "New Client" button

**Client profile (`/clients/[id]`):**
- Header: name, company, status, tags
- 3 tabs: Overview | Invoices | Time Entries | Documents
- Overview: contact info, address, currency preference, notes, total billed stat
- Invoices tab: filtered invoice list for this client
- Time tab: unbilled hours for this client
- Documents tab: contracts generated for this client

### 7.4 Expenses

**What it is:** Simple expense log. No categories hierarchy, no receipt scanning (yet). Date, amount, category, description.

**List view:**
- Table: Date, Description, Category, Amount, Actions
- Filter by category and date range
- Monthly summary card at top: total spent, breakdown by category (small donut chart)
- "Add Expense" slide-in panel (not full page)

**Category colors (use consistently everywhere):**
```typescript
const CATEGORY_COLORS = {
  software:   { bg: 'var(--info-dim)',    text: 'var(--info)' },
  travel:     { bg: 'var(--warning-dim)', text: 'var(--warning)' },
  marketing:  { bg: 'var(--accent-glow)', text: 'var(--accent)' },
  equipment:  { bg: 'var(--bg-subtle)',   text: 'var(--text-secondary)' },
  other:      { bg: 'var(--bg-subtle)',   text: 'var(--text-tertiary)' },
}
```

### 7.5 Document Studio

**Templates available (5 to start):**
1. Non-Disclosure Agreement (NDA)
2. Freelance Service Agreement
3. Project Scope of Work
4. Payment Terms Letter
5. General Business Contract

**How it works:**
1. User picks a template
2. Form appears with fields to fill (party names, dates, amounts, scope description etc.)
3. Preview updates live (shows the document with filled values)
4. User clicks "Generate PDF" — creates styled PDF with all fields populated
5. Disclaimer auto-appended to every document footer (non-negotiable, always present)

**Disclaimer text (hardcoded, never editable by user):**
```
DISCLAIMER: This document is a template generated for informational and organizational 
purposes only. It does not constitute legal advice and should not be relied upon as 
such. FlowDesk makes no representations regarding the legal validity or enforceability 
of this document in any jurisdiction. Before executing any agreement, consult a 
qualified legal professional.
```

**Template structure (JSON stored in `content` field):**
```typescript
interface TemplateField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'number' | 'select'
  placeholder?: string
  required: boolean
  options?: string[]  // for select type
}

// Each template has a fields array and a body function
// Body function takes filled values and returns the document text
```

### 7.6 Time Tracker

**Two parts:**

**Active timer:**
- Prominent timer display (`HH:MM:SS`) using `font-mono`
- Client selector dropdown
- Description input
- Start / Pause / Stop buttons
- Timer persists across page navigation (Zustand store)
- On stop: creates time entry, prompts to add hourly rate

**Time log:**
- Table: Date, Client, Description, Hours, Rate, Amount, Billed status
- Group by week
- "Convert to Invoice" button per row (or multi-select) — creates invoice with time entries as line items
- Total unbilled hours + amount shown at top

### 7.7 Multi-Currency

**Currency page:**
- Base currency selector (default: INR)
- Live rates table: ~15 major currencies
- Quick converter: enter amount in any currency, shows all equivalents
- Rate last updated timestamp

**Currency utility:**
```typescript
// lib/currency.ts
let rateCache: { rates: Record<string, number>; fetchedAt: number } | null = null

export async function getRates(base = 'INR'): Promise<Record<string, number>> {
  const now = Date.now()
  if (rateCache && now - rateCache.fetchedAt < 15 * 60 * 1000) {
    return rateCache.rates
  }
  const res = await fetch(`https://api.exchangerate.host/live?base=${base}`)
  const data = await res.json()
  rateCache = { rates: data.quotes, fetchedAt: now }
  return data.quotes
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount)
}
```

**Usage in invoices:** When creating an invoice, if client has a preferred currency set, default to that. Currency stored on the invoice, amounts stored as-is (not converted). Conversion only for display on dashboard (use stored rates).

### 7.8 AI Cash Flow Advisor

**Where it lives:** Small panel on the dashboard, expandable. Also accessible via `/dashboard#ai`.

**How it works:**
- Text input: user types a question in plain language
- API call to `/api/ai` which fetches summary stats from Supabase and sends to Gemini Flash
- Response displayed in a clean chat-style bubble

**System prompt for Gemini:**
```
You are FlowDesk's financial advisor. You have access to the user's business data below. 
Answer questions clearly, concisely, and in plain language. Give specific numbers when 
relevant. Be direct. Do not give generic advice. Do not say "I recommend consulting a 
financial advisor." You are that advisor for simple questions.

User's data:
- Total revenue (all time): {total_revenue}
- Revenue this month: {this_month_revenue}
- Outstanding invoices: {outstanding_amount} across {outstanding_count} invoices
- Overdue invoices: {overdue_amount} across {overdue_count} invoices
- Total expenses this month: {monthly_expenses}
- Net this month: {net_this_month}
- Unbilled hours: {unbilled_hours}h worth {unbilled_value}
- Active clients: {active_clients}
- Top client by revenue: {top_client_name} ({top_client_revenue})
```

---

## 8. API Routes Pattern

All routes follow this pattern:

```typescript
// app/api/invoices/route.ts
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, client:clients(*), items:invoice_items(*)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createClient()
    // validate with zod schema here
    const { data, error } = await supabase.from('invoices').insert(body).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
```

---

## 9. Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_APP_NAME=FlowDesk
NEXT_PUBLIC_OWNER_NAME=Your Name
NEXT_PUBLIC_OWNER_EMAIL=your@email.com
NEXT_PUBLIC_BASE_CURRENCY=INR
```

---

## 10. Sidebar Navigation

```typescript
const NAV_ITEMS = [
  { label: 'Dashboard',   href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Invoices',    href: '/invoices',   icon: FileText },
  { label: 'Clients',     href: '/clients',    icon: Users },
  { label: 'Expenses',    href: '/expenses',   icon: CreditCard },
  { label: 'Documents',   href: '/documents',  icon: FilePen },
  { label: 'Time',        href: '/time',       icon: Clock },
  { label: 'Currencies',  href: '/currencies', icon: Globe },
]
```

**Sidebar layout:**
- Fixed left, 220px wide
- Logo + app name top
- Nav items middle
- Bottom: version number, tiny settings link
- Collapsed mobile: icon-only, expands on tap

---

## 11. Key UX Rules (Must Follow)

1. Every destructive action (delete, cancel invoice) requires a confirmation modal. No silent deletes.
2. Every form auto-saves to `localStorage` as the user types (draft recovery).
3. All money amounts display with currency symbol and 2 decimal places. Use `formatCurrency()` everywhere, never raw numbers.
4. Dates always display in `DD MMM YYYY` format (e.g. `01 Jun 2026`). Never ISO strings to the user.
5. Empty states must be helpful — show a description and a primary CTA button. Never just "No data."
6. Loading states: use skeleton screens, not spinners. Spinners only for button loading states.
7. Toast notifications for all async actions: success (green), error (red), info (gold accent).
8. Mobile-responsive: the app must work on a phone. Sidebar collapses, tables scroll horizontally, forms stack vertically.
9. Keyboard navigation: all modals closeable with Escape, forms submittable with Cmd+Enter.
10. All PDF downloads must open a preview modal first before downloading.

---

## 12. Antigravity-Specific Instructions

When working on this project in Antigravity, always:

1. Read this file at the start of every session before writing any code.
2. Build one complete feature at a time — do not start a new feature until the current one is working end-to-end.
3. Follow the design system exactly. No custom colors outside the CSS variable palette. No fonts outside the three defined fonts.
4. Write TypeScript with strict types everywhere. No `any`, no `as unknown`.
5. Co-locate Zod schemas with their API routes.
6. Test every form submission, every database call, every PDF generation before marking a feature done.
7. Comments in code should explain WHY, not WHAT. The code should be self-documenting.
8. When unsure whether something fits the design system, refer to Section 3. When unsure about data shape, refer to Section 6. When unsure about a feature's behavior, refer to Section 7.

---

## 13. What NOT to Build (Yet)

- Multi-user auth / team seats
- Stripe payment processing
- White-label / agency mode
- Mobile app (React Native)
- Email inbox integration
- Bank account sync
- Recurring invoices (can add later)
- Client-facing portal
- Zapier / API integrations

These are Phase 2+ features. Do not implement, scaffold, or leave TODOs for them. Keep the codebase clean and focused.

---

## 14. First Build Order

Build in exactly this sequence. Each item is one Antigravity session.

```
Session 1:  Project setup — Next.js, Tailwind, shadcn, Supabase, fonts, globals.css, AppShell, Sidebar
Session 2:  Database — run all SQL migrations in Supabase, seed with sample data
Session 3:  Clients — list page, client card, create/edit form, client profile page
Session 4:  Invoices — list page, invoice table, status filters
Session 5:  Invoice builder — create form, live preview, line items, calculations
Session 6:  PDF generation — InvoicePDF component, jsPDF export, email via Resend
Session 7:  Expenses — list, add form, category filter, monthly summary
Session 8:  Time tracker — active timer, time log, convert to invoice
Session 9:  Document studio — template picker, form, live preview, PDF with disclaimer
Session 10: Dashboard — stat cards, revenue chart, recent invoices, quick actions
Session 11: Currencies — live rates, converter
Session 12: AI advisor — Gemini integration, dashboard panel
Session 13: Polish — animations, empty states, error states, mobile responsiveness, toasts
```

---

*End of context. Do not skip sections. Do not improvise outside this spec.*