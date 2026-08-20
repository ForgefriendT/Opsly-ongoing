# MASTER BUILD CONTEXT — OPSLY (v2)
## Read this entire document before writing a single line of code. Every decision you make must trace back to something written here.

> **CHANGELOG FROM v1 — read this before touching anything already built.**
> Sections A–G (Foundation, Auth, Onboarding, Core UI Shell, AI Command Bar, Dashboard, CRM) are already built and are **not changed** by this revision — nothing in this document should cause you to rebuild or refactor A–G. The changes below only affect: (1) a new hardening phase inserted before Section H, (2) tightened rules inside Section 6 (AI middleware) and Section 8 (Free plan), (3) reframed ownership of Stripe/SMS/Documents so the founder never sits in the middle of money or telecom infrastructure on default plans, and (4) a new tiering rule — **default plans (Free–Business) get the founder-safe version of every feature; full bespoke/infrastructure-owned versions of the same features are reserved for Section 18, Custom/Enterprise builds, billed separately.** No feature was removed. Nothing the client sees is smaller. Only who owns the operational risk changed.

---

# SECTION 1 — WHAT YOU ARE BUILDING

You are building a SaaS platform called **Opsly**. It is a multi-tenant AI-powered business operating system for small service businesses — primarily home service contractors like plumbers, roofers, painters, landscapers, cleaners, and HVAC technicians — initially targeting the USA, Australia, and UAE, then expanding globally.

Every client who signs up gets a private, fully branded business portal. They log in at **opsly.com** and their portal feels entirely theirs — their logo, their colours, their business name everywhere. They do not navigate menus or learn software. They type natural language commands into an AI interface and the AI executes every task for them.

This is not a tool. It is an operating system that thinks.

The founder is a solo Indian developer building this as an addition to his digital marketing agency. He is not registered yet, operates under ₹20L GST threshold, receives USD payments via Wise, and uses Paddle for recurring billing from international clients. He has his girlfriend helping with support and onboarding communication via WhatsApp and Instagram.

---

# SECTION 2 — THE NAME AND BRAND

**Product name: Opsly**

Short. Memorable. Sounds like "operations" meets "simply." Descriptive without being generic. Easy to say in any language. Not AI-sounding, not corporate.

**Design language: Claude AI inspired**

The founder explicitly loves Claude AI's interface design. Build everything to match that aesthetic:

- Dark backgrounds — deep navy and near-black, not pure black
- Soft warm whites and off-whites for text, never pure #FFFFFF
- Muted lavender and soft coral accent colours — never neon, never harsh
- Rounded corners throughout — 12px to 16px border radius on cards, 8px on inputs
- Generous whitespace — content breathes, nothing feels cramped
- Subtle gradients — dark navy to slightly lighter navy, never rainbow
- Glass morphism effects on cards — frosted glass feel with very low opacity backgrounds
- Typography: Inter for UI, system font fallback. Clean, readable, modern
- Sidebar navigation — left sidebar, collapsible, icon plus label
- No harsh borders — use subtle shadows and opacity differences to separate elements
- Micro-animations — smooth 200ms transitions on hover, focus, state changes
- Command interface centered — the AI chat bar is the hero of every page

**Colour tokens — use these exact values everywhere:**

```
--bg-primary: #0f1117        /* Main background — deep near-black */
--bg-secondary: #161b27      /* Card backgrounds */
--bg-tertiary: #1e2538       /* Elevated surfaces, modals */
--bg-hover: #252d3d          /* Hover states */
--accent-primary: #7c6aff    /* Primary purple — buttons, links, active states */
--accent-secondary: #a78bfa  /* Lighter purple — hover on accent */
--accent-coral: #ff8b6b      /* Warm coral — alerts, highlights, badges */
--accent-green: #4ade80      /* Success states */
--accent-amber: #fbbf24      /* Warning states */
--accent-red: #f87171        /* Error states */
--text-primary: #f0f0f0      /* Main text — warm off-white */
--text-secondary: #9aa0b4    /* Secondary text — muted */
--text-muted: #5c6480        /* Disabled, placeholders */
--border-subtle: #2a3147     /* Card borders, dividers */
--border-focus: #7c6aff      /* Input focus ring */
```

**Logo concept:**

A small geometric mark — two overlapping rounded squares forming an abstract "O" with a soft purple gradient fill. Sits next to the wordmark "opsly" in Inter font, lowercase, medium weight. Clean. Modern. No taglines in the logo.

---

# SECTION 3 — TECHNOLOGY STACK

Build every piece of this using the following tools. Do not suggest alternatives unless a tool is genuinely unavailable.

**Frontend:** React with Tailwind CSS. Every component built as a reusable React component. Mobile-first responsive design on every single screen. The app must work perfectly on a phone — contractors use this on job sites.

**IDE:** Google Antigravity IDE. This context is written for Antigravity's AI agents to read and execute module by module.

**Backend/Database:** Supabase. PostgreSQL database. Row Level Security (RLS) must be enabled on every single table from day one — this is non-negotiable. Every query filters by `client_id` at the database level, not just in application code. Auth is handled entirely by Supabase Auth. File storage via Supabase Storage.

**AI Brain:** Claude API by Anthropic. Model routing: use `claude-haiku-4-5` for all routine commands (invoicing, CRM, scheduling, expense logging). Use `claude-sonnet-4-6` automatically for complex reasoning (long estimates, detailed reports, ambiguous multi-step commands). The user never sees which model runs. It is invisible routing. Every API call passes through a middleware layer that tracks token usage per client.

**Hosting:** Vercel. Connected to GitHub. Auto-deploy on push to main branch. Every client's portal is one Vercel deployment — multi-tenant, not one deployment per client.

**DNS:** Cloudflare. Manages custom domain pointing for Pro plan clients.

**Email:** Resend. All transactional emails — invoice delivery, follow-ups, notifications — sent via Resend using the client's own domain email where possible.

**SMS:** On default plans (Growth and above), SMS is **email-first by default** — see Section N. If a client specifically wants two-way SMS, they connect their own Twilio account (their number, their carrier relationship, their compliance exposure) via a simple "paste your Twilio credentials" settings field, surfaced only when they ask for it — not pushed by default. Founder-owned Telnyx numbers, inbound routing, and carrier compliance (Section L in full) are reserved for **Section 18 — Custom/Enterprise builds**, where the build fee and direct relationship justify taking on that infrastructure.

**Payments from Opsly's clients (B2B):** Paddle as primary. Wise as secondary for one-time payments. Never Stripe for Opsly's own subscription billing — Paddle handles global tax compliance automatically.

**Payments within portals (B2C — contractor charging their customers):** On all default plans (Free–Business), the contractor simply pastes their own Stripe **Payment Link** (created in their own Stripe dashboard, no OAuth, no API key, no Connect handshake) into Settings. Opsly renders it as a "Pay Now" button on invoices. Opsly never calls the Stripe API on the contractor's behalf and never requests a platform Stripe key on these plans — this removes the platform-accountability burden of Stripe Connect entirely. Full Stripe Connect (OAuth, embedded checkout, split payments) is reserved for **Section 18 — Custom/Enterprise builds only**, where the higher build fee accounts for the added compliance surface.

**Geolocation:** ipinfo.io API. Called on page load. Returns country code. Maps to currency and PPP-adjusted pricing. Locks to account on first signup.

**Version control:** GitHub. One repository. Branch per feature. Main branch is always deployable.

**Uptime monitoring:** UptimeRobot. Pings every 5 minutes. Alerts founder immediately on any downtime.

**PWA:** The portal must function as a Progressive Web App. Field workers can install it on their phone home screen. Offline mode caches the day's jobs and syncs when signal returns.

---

# SECTION 4 — DATABASE ARCHITECTURE

Build these tables in Supabase. Apply RLS to every single one. Every table that contains client data must have a `client_id` foreign key that references the `clients` table.

**Core tables:**

`clients` — one row per business signed up. Stores plan, currency, country, niche, branding settings, Stripe Connect account ID, Telnyx number, logo URL, signature URL, stamp URL.

`users` — one row per user. Foreign key to `clients`. Role field: owner / manager / field_worker / admin. Supabase Auth UID linked here.

`contacts` — the CRM. One row per contact belonging to a client. Name, email, phone, address, notes, job history reference, created date, last activity date, status (lead / active / dormant).

`jobs` — one row per job. Foreign key to contacts and clients. Status: estimate / scheduled / in_progress / complete / invoiced / paid. Start date, end date, address, description, assigned user IDs, materials cost, labour cost, sub cost, photos array.

`invoices` — one row per invoice. Foreign key to jobs and contacts. Line items stored as JSONB array. Status: draft / sent / viewed / paid / overdue. Stripe payment link, PDF URL, due date, sent date, paid date.

`estimates` — same structure as invoices but separate table. Status: draft / sent / approved / rejected / converted.

`expenses` — one row per expense. Foreign key to jobs. Category: materials / fuel / tools / subcontractor / equipment / other. Amount, description, receipt photo URL, date.

`documents` — one row per document. Foreign key to clients and optionally contacts or jobs. Type: client_contract / material_contract / scope_of_work / change_order / warranty. File URL, signed status, signed date, signee name, signee signature URL.

`ai_usage` — one row per AI command fired. Foreign key to clients. Input tokens, output tokens, model used, command type, timestamp. This is how you track usage per client for plan enforcement.

`sms_messages` — one row per SMS. Foreign key to clients and contacts. Direction: inbound / outbound. Body, timestamp, Telnyx message ID, read status.

`follow_up_sequences` — templates for automated follow-up. Foreign key to clients. Trigger: job_complete / invoice_sent / estimate_sent. Steps as JSONB array — each step has delay in days, channel (email/sms), message template.

`niche_configs` — one row per niche. Niche name, layout config as JSONB, module list as JSONB, AI system prompt additions, terminology overrides. Pre-seeded with: contractor, landscaper, cleaner, hvac, painter, salon, generic.

`plan_configs` — one row per plan. Plan name, monthly price per currency as JSONB, AI command limit, overage price per command, feature flags as JSONB, user limit, storage limit.

---

# SECTION 5 — SECURITY ARCHITECTURE

Security is the top priority of this entire build. Build it in from the beginning. Never bolt it on later.

**Row Level Security — implement exactly this pattern on every table:**

```sql
-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see data belonging to their client
CREATE POLICY "client_isolation" ON contacts
  FOR ALL
  USING (client_id = (
    SELECT client_id FROM users WHERE auth_uid = auth.uid()
  ));
```

Apply this pattern to every single table. Test it before building any frontend. If RLS is wrong, clients see each other's data. This is the most critical step in the entire build.

**Authentication:**
- JWT tokens expire every 24 hours
- Refresh tokens in httpOnly cookies — never localStorage
- Login attempts rate limited: 5 attempts per 10 minutes then 15-minute lockout
- Email verification required before any portal access
- Phone number verification required for free plan (prevents multi-account abuse)

**Session management:**
- Concurrent session limits enforced per plan: Free = 1, Starter = 1, Growth = 3, Pro = 10, Business = unlimited
- New login from different IP while session active: send security alert email, allow both sessions on same plan
- Different country login: require re-authentication

**Encryption:**
- All sensitive fields (API keys, payment tokens, phone numbers) encrypted using Supabase Vault
- Passwords hashed by Supabase Auth automatically — never touch password handling yourself
- All file uploads scanned for malware via Supabase Storage policies before storing

**API security:**
- Every backend route checks Supabase Auth JWT before processing
- AI command endpoint: authenticated requests only, rate limited to 10 commands per minute per client
- File upload endpoints: validate file type server-side, not just client-side. Accept only PNG/JPG/PDF/DOCX

**GDPR compliance:**
- Data deletion on request: built-in "Delete my account" flow. Removes all client data within 24 hours.
- Data export on request: generates full account data as JSON/CSV download
- Privacy policy link required in footer of every page

---

# SECTION 6 — AI MIDDLEWARE — THE BRAIN

This is the most important technical component. Build it carefully.

**The middleware function — runs on every AI command:**

> **Non-negotiable ordering rule: the usage/limit check (steps 3–7) must complete and pass BEFORE the Claude API is called (step 10). Never call the API first and check usage after — that is the exact failure mode that lets costs run away from plan limits.**

```
1. Receive command text from authenticated client
2. Look up client record — get plan, client_id, niche, business context
3. Look up ai_usage for this client this month — sum input_tokens + output_tokens
4. Convert to command count (divide total tokens by 2500)
5. Compare against plan limit
6. If at limit — check overage cap setting
7. If overage cap reached — return friendly message, do not call API
8. If under limit or within overage — proceed
9. Build system prompt (see below)
10. Call Claude API with appropriate model
11. Receive response
12. Log to ai_usage table — store input_tokens, output_tokens, model, command_type, timestamp
13. Parse response — determine what action to take (create invoice, fetch data, send SMS, etc.)
14. Execute the action against Supabase
15. Return result to client in plain English
16. Update usage counter in real-time on client dashboard
```

**System prompt structure — build this for every AI call:**

```
You are the AI brain of Opsly, a business management platform. You are operating inside the portal of [BUSINESS_NAME], a [NICHE] business.

BUSINESS CONTEXT:
- Business name: [BUSINESS_NAME]
- Owner name: [OWNER_NAME]
- Niche: [NICHE]
- Plan: [PLAN_NAME]
- Country: [COUNTRY]
- Currency: [CURRENCY]

RECENT CONTEXT:
- Active jobs: [COUNT]
- Outstanding invoices: [COUNT and TOTAL]
- Last 5 commands: [ARRAY]

AVAILABLE ACTIONS:
You can create, read, update invoices / contacts / jobs / estimates / expenses / documents / schedules.
You can send emails via Resend.
You can send SMS via Telnyx (Growth plan and above only).
You can generate PDF documents.
You can pull reports and answer business questions.

RULES:
- Always respond in plain English the owner would understand
- Never use technical jargon
- If you are unsure what the owner wants, ask one clarifying question
- Always confirm before sending anything to a client
- Never invent data — only use what exists in the database
- Keep responses short — one paragraph maximum unless generating a document
- When creating an invoice, always show a preview before sending
- Format currency as [CURRENCY_SYMBOL] with two decimal places

NICHE SPECIFIC INSTRUCTIONS:
[NICHE_PROMPT_ADDITION — pulled from niche_configs table]
```

**Model routing logic:**

> **Free plan override: always Haiku, never Sonnet, regardless of the rules below.**

Use Haiku when: creating invoices, logging expenses, scheduling jobs, adding contacts, sending SMS, answering simple questions about data.

Use Sonnet when: generating detailed estimates, producing financial reports, handling ambiguous multi-step commands, writing contracts or documents, explaining complex data trends.

**Streaming:** Always stream Claude API responses. Use the Anthropic streaming API. Tokens appear word by word in the command interface. Never show a loading spinner for more than 500ms — streaming starts immediately.

**Command type detection:** After receiving the AI response, classify it into one of these action types: CREATE_INVOICE / SEND_INVOICE / CREATE_ESTIMATE / CREATE_JOB / UPDATE_JOB / ADD_CONTACT / SEND_SMS / SEND_EMAIL / GENERATE_REPORT / GENERATE_DOCUMENT / FETCH_DATA / SCHEDULE_JOB / LOG_EXPENSE / ANSWER_QUESTION. Log this type in ai_usage. Use it for analytics.

---

# SECTION 7 — GEOLOCATION AND PRICING

**On every page load before authentication:**

```javascript
// Call ipinfo.io
const geo = await fetch('https://ipinfo.io/json?token=YOUR_TOKEN');
const { country, ip } = await geo.json();

// Map to pricing tier
const pricingMap = {
  US: { currency: 'USD', symbol: '$', starter: 49, growth: 99, pro: 199, business: 399 },
  CA: { currency: 'CAD', symbol: 'C$', starter: 65, growth: 129, pro: 259, business: 519 },
  GB: { currency: 'GBP', symbol: '£', starter: 39, growth: 79, pro: 159, business: 319 },
  AU: { currency: 'AUD', symbol: 'A$', starter: 75, growth: 149, pro: 299, business: 599 },
  NZ: { currency: 'NZD', symbol: 'NZ$', starter: 79, growth: 159, pro: 319, business: 639 },
  AE: { currency: 'USD', symbol: '$', starter: 59, growth: 109, pro: 189, business: 379 },
  SA: { currency: 'USD', symbol: '$', starter: 59, growth: 109, pro: 189, business: 379 },
  DE: { currency: 'EUR', symbol: '€', starter: 45, growth: 89, pro: 179, business: 359 },
  FR: { currency: 'EUR', symbol: '€', starter: 45, growth: 89, pro: 179, business: 359 },
  NL: { currency: 'EUR', symbol: '€', starter: 45, growth: 89, pro: 179, business: 359 },
  SG: { currency: 'SGD', symbol: 'S$', starter: 65, growth: 119, pro: 239, business: 479 },
  JP: { currency: 'JPY', symbol: '¥', starter: 7900, growth: 14900, pro: 29900, business: 59900 },
  KR: { currency: 'KRW', symbol: '₩', starter: 65000, growth: 129000, pro: 259000, business: 519000 },
  IN: { currency: 'INR', symbol: '₹', starter: 999, growth: 1999, pro: 3499, business: 6999 },
  BR: { currency: 'BRL', symbol: 'R$', starter: 149, growth: 279, pro: 479, business: 949 },
  MX: { currency: 'MXN', symbol: 'MX$', starter: 399, growth: 749, pro: 1299, business: 2599 },
};

// Default to USD if country not in map
const pricing = pricingMap[country] || pricingMap['US'];
```

**Currency lock on signup:**

When a user completes signup, write their detected country, currency, and pricing tier to their `clients` record. This never changes automatically. If they contact support to change currency, it requires manual approval.

**VPN detection:**

If IP geolocation returns country X but their payment billing address is country Y, and Y has higher pricing — apply country Y pricing. Billing address always wins when it results in higher pricing.

**Display rules:**

- Round all prices to clean psychological numbers (already done in the map above)
- Show annual pricing as monthly equivalent with "billed annually" label
- Annual discount is always 20% off monthly price
- Show savings amount in green next to annual price: "Save $118/year"

---

# SECTION 8 — PLAN STRUCTURE AND FEATURE GATING

Gate every feature in the codebase using a `useFeatureAccess(featureName)` hook that reads the client's plan from Supabase and returns true/false. Never hardcode plan checks in components.

**FREE PLAN — $0**
> **Hard rule, enforced server-side, not just in the UI:** the Free plan must be structurally incapable of costing the founder money. No exceptions, no manual overrides without a deliberate ops decision outside the codebase.
- 3 clients in CRM (permanent, non-deletable, non-replaceable — enforced at DB level)
- 5 invoices total lifetime (not per month — total ever) — enforced at DB level, not just disabled in UI
- 30 AI commands per month — **hard stop, no overage option exists on Free at all** (overage billing only exists Starter and up)
- **Model routing is locked to `claude-haiku-4-5` only on Free — the router must never escalate Free-plan traffic to Sonnet, regardless of command complexity.** If a Free command would normally trigger Sonnet, downgrade gracefully and respond with Haiku rather than calling Sonnet.
- Default generic ERP layout only
- Logo on invoices — yes
- Signature/stamp on invoices — yes
- Email invoice delivery only
- Stripe payment link on invoices — yes, but this is a static pasted link only (see Section 3) — never a Stripe API/OAuth call initiated by Opsly
- Basic dashboard: 3 metrics only (total invoiced, total paid, active clients)
- No SMS
- No scheduling module (view-only placeholder shown with upgrade prompt)
- No expense tracking
- No documents module
- No niche selection
- No custom domain — operates on opsly.com/username
- No support (documentation only)
- AI CA — visible in sidebar, clicking shows "Coming Soon — drop your email to be first to know" capture form
- Storage: 50MB, hard-capped at the Supabase Storage bucket policy level

**STARTER — $49/mo**
- Unlimited CRM contacts
- Unlimited invoices
- 500 AI commands/month — overage at $0.05/command, default cap $10/month
- Default generic ERP layout only
- Logo, signature, stamp on all invoices
- Invoice colour theme — default only
- Full invoicing: create, send, track, PDF, Stripe payment link, line items, discounts, deposit invoices, recurring invoices, notes field, custom invoice number prefix, watermark (PAID/UNPAID), due date
- Auto late payment chaser: day 3, 7, 14 — automatic, no setup needed
- Full CRM: profiles, job history, notes, contact details, last activity
- Estimates: create, customise, send, convert to invoice
- Expense tracking: photo receipt upload, auto-categorise, log against job
- Basic reports: revenue this month, outstanding AR, recent activity, top 5 clients
- Google Calendar sync
- Basic scheduling: add jobs with date, time, address, client link
- Email sending via Resend from their email
- Client payment portal: Stripe-linked payment page for their customers
- opsly.com/theirbusiness — no custom domain
- 2GB storage
- 1 user only
- Email support, 48hr response
- AI CA — visible, "Coming Soon" capture form

**GROWTH — $99/mo**
- Everything in Starter
- 1500 AI commands/month — overage at $0.04/command, default cap $20/month
- **Niche ERP layout selection at onboarding** — tiles UI, one question full screen
- AI niche-matching if "other" typed — one Claude call, cached after first match
- Niche lock: can change once per 90 days only
- 3 users with role-based access: owner sees all, field worker sees assigned jobs only
- Two-way SMS via Telnyx — local US business number assigned
- Missed call auto-text — any missed call triggers instant SMS reply
- Lead capture — website form webhook, leads land in CRM automatically
- Post-job follow-up sequences — automated multi-step, email and SMS
- Subcontractor management: add subs, assign jobs, track payments
- Per-job profit calculator: materials + labour + subs = real profit shown
- Review request automation: auto-SMS after job completion with Google review link
- Weather-based rescheduler: rain detection, one-command reschedule all affected jobs
- Repeat client detector: flags dormant clients, prompts re-engagement
- Invoice templates: minimal, detailed, contractor-style — 3 options
- Invoice colour theme: choose from 6 brand colour presets
- Attach job photos to invoice as appendix
- Material cost breakdown section on invoice separate from labour
- **Documents module (default-plan version — see Section M):**
  - Client contracts generated as clean PDFs, sent via email, signed outside Opsly (own e-sign tool or print/scan)
  - Material and supplier contract upload and storage
  - Job scope of work documents
  - Change order documents — PDF + client email approval reply, not in-house binding signature
  - Warranty documents post-completion
- Custom domain subdomain: theirbusiness.opsly.com
- 10GB storage
- Email support 24hr response + monthly 15-minute check-in call
- AI CA — visible, "Coming Soon" capture form

**PRO — $199/mo**
- Everything in Growth
- 5000 AI commands/month — overage at $0.03/command, default cap $30/month
- 10 users — owner, manager, field worker, office admin roles
- Voice note estimate generator: record voice, AI transcribes and builds estimate
- Photo job documentation: before/after on mobile, auto-tagged to job and client, appended to invoice
- Tax-ready annual expense export: categorised PDF, January generation, accountant-ready
- Advanced reports: P&L, cash flow projection, AR aging, best clients by revenue, slowest months, job pipeline value — all via AI command
- Enhanced client portal: clients get their own login, view job history, download invoices, pay balances
- Full email + SMS automation with conditional logic
- QuickBooks sync: one-way export for accountant use
- Google Sheets export
- Zapier webhook
- GPS job check-in: field worker arrives, taps arrive, GPS timestamp logged, client auto-texted
- Route optimisation: AI suggests optimal job order for the day based on addresses
- Client communication history: every SMS, email, call log in one timeline per client
- Material cost estimator: describe job, AI estimates material costs with markup
- Storm/insurance job pipeline: for roofers — inspection → scope → supplement → adjuster → production → collection stages
- Custom domain: portal.theirbusiness.com via Cloudflare
- White-label add-on: +$49/mo removes all Opsly branding
- 50GB storage
- Priority email support 4hr response + monthly 30-minute strategy call
- **AI CA add-on: +$19/mo — live feature, reads invoices, tracks costs, gives tax suggestions with mandatory disclaimer**

**BUSINESS — $399/mo**
- Everything in Pro
- 15000 AI commands/month — overage at $0.025/command, default cap $50/month
- Unlimited users
- Multi-location: per-location dashboard + master rollup view for owner
- Manager dashboard: simplified view — today's jobs, crew, pending invoices only
- Crew mobile PWA: field workers install on phone, view jobs, log time, upload photos, mark complete
- Subcontractor portal: subs get limited login, view assigned jobs, submit time, see payment history
- Custom report builder: owner defines reports, saves as templates, runs via AI command
- Bulk document operations: mass send contracts, mass generate warranties
- Document expiry tracking: contract renewal reminders, supplier agreement expiry alerts
- Dedicated onboarding: 3 Zoom sessions with founder
- 99.5% uptime SLA
- Private WhatsApp support channel — direct line to founder
- 2hr response during business hours
- AI CA add-on: +$19/mo — first month free
- Unlimited storage

**CUSTOM / ENTERPRISE — from $999/mo + build fee from $5,000**
- Everything in Business
- Own dedicated Supabase instance and Vercel environment
- 100% white-labeled — their brand everywhere including system emails
- Custom modules built for their specific workflow
- Custom AI personality — their brand voice in all AI responses
- Custom integrations with their existing systems
- Unlimited locations, unlimited users
- Custom SLA negotiated
- Named account manager (founder directly)
- $500 paid scoping call — credited on signup
- AI CA fully customised for their tax jurisdiction

**AI CA ADD-ON — $19/mo (Pro plan and above)**
- Reads all invoices and expense records
- Tracks income vs expenses monthly
- Identifies tax-deductible categories
- Estimates quarterly tax liability
- Flags unusual expenses
- Generates tax summary reports
- **Mandatory disclaimer on every output:** "This is AI-generated guidance for informational purposes only. Consult a licensed accountant before filing. Opsly accepts no liability for tax decisions made based on this output."
- Show as "Coming Soon" on Free, Starter, Growth plans with email capture

---

# SECTION 9 — INVOICE BUILDER — FULL SPECIFICATION

The invoice builder is the most important module. Build it perfectly.

**Fields on every invoice — all plans:**
- Business logo (PNG, max 2MB) — top left — toggle on/off
- Business name, address, phone, email — auto from profile
- "INVOICE" label — large, in accent colour
- Invoice number — auto-generated, customisable prefix (e.g. INV-001, MIKE-001)
- Invoice date and due date
- Bill To section: client name, address, email, phone — auto from CRM
- Line items table: description, quantity, unit price, tax rate %, line total
- Add line item button
- Subtotal, tax total, grand total — auto-calculated
- Notes/payment terms field
- Signature image OR stamp image (PNG, max 500KB) — bottom right — toggle on/off
- Stripe payment link — embedded as button: "Pay Now"
- PDF generated on demand — professional layout

**Additional invoice options — Growth and above:**
- Invoice colour theme: 6 presets matching brand colours
- 3 templates: minimal, detailed, contractor-style
- Watermark: PAID (green) or UNPAID (red) — auto-applied based on status
- Deposit invoice: charge % upfront
- Recurring invoice: weekly/monthly auto-send for retainer clients
- Material cost breakdown section separate from labour
- Discount field: percentage or flat
- Attach job photos as appendix pages

**Invoice status flow:**
Draft → Sent → Viewed (when client opens payment link) → Paid / Overdue

**Auto late payment chaser — all paid plans:**
Day 3 after due date: polite reminder
Day 7: firmer follow-up
Day 14: final notice, adds late fee if configured
All three sent automatically, owner never manually chases

**AI invoice commands (examples the AI must handle):**
- "Invoice Dave for $1,200 for the March kitchen job" → create, preview, confirm, send
- "Send the Henderson invoice" → find most recent, send
- "Mark the Johnson invoice as paid" → update status
- "Who hasn't paid me this month?" → query overdue invoices, list names and amounts
- "Generate a recurring invoice for Smith Landscaping at $400 every month" → set up recurring

---

# SECTION 10 — DOCUMENTS MODULE SPECIFICATION

**Client Contracts (default-plan version — full in-house signing is Section 18 only):**
- Template library: roofing contract, painting contract, landscaping contract, cleaning contract, general service contract
- Owner customises template once, saves as their default
- Fill in: client name, job address, scope, start date, completion date, payment terms, liability clause
- Generate clean PDF, send via email
- Client signs using their own method (print/scan, or their own e-sign tool) — Opsly does not capture or store a binding signature on default plans
- Stored against client CRM record once the client emails back a signed copy (manually re-uploaded or attached)

**Material/Supplier Contracts:**
- Upload received contracts (PDF, DOCX)
- Tag to supplier, job, or standalone
- AI can reference them in commands: "what are the warranty terms from Smith Materials?"
- Expiry date field — alert when approaching expiry

**Job Scope of Work:**
- Template-based document
- AI fills in job-specific details from command: "create scope of work for the Henderson roof replacement"
- Client signs digitally before work begins
- Stored against job record

**Change Orders:**
- Created when scope changes mid-job
- Additional cost, reason, description
- PDF generated, emailed to client, client approval captured via reply/click-to-approve link (timestamped) — not an in-house binding signature on default plans
- Creates a paper trail for disputes (timestamped approval is sufficient for most service-business needs; binding e-signature is a Section 18 Custom build option)

**Warranty Documents:**
- Generated after job completion
- What is covered, duration, what voids it
- Branded with contractor's logo
- Sent to client automatically when job marked complete

---

# SECTION 11 — NICHE SYSTEM SPECIFICATION

**Available niches and their configurations:**

Each niche changes: module labels, AI system prompt additions, dashboard widget priorities, CRM field labels, job status names.

**Contractor (plumber, roofer, electrician):**
- Jobs called "Projects"
- CRM contacts called "Clients"
- Dashboard priority: active projects, outstanding invoices, upcoming jobs
- Extra module: storm/insurance job pipeline (roofers)
- AI prompt addition: "This is a contracting business. Estimates often include labour, materials, and subcontractor costs. Jobs may span multiple days."

**Landscaper:**
- Jobs called "Services"
- CRM contacts called "Properties"
- Dashboard priority: recurring services, route schedule, seasonal revenue
- Extra module: route optimisation, recurring billing management
- AI prompt addition: "This is a landscaping business. Many clients have recurring weekly or monthly services. Route efficiency matters."

**Cleaner:**
- Jobs called "Cleans"
- CRM contacts called "Clients"
- Dashboard priority: today's schedule, recurring cleans, crew assignments
- Extra module: crew scheduling, supply tracking
- AI prompt addition: "This is a cleaning business. Recurring weekly or bi-weekly cleans are common. Multiple crew members may work simultaneously."

**HVAC:**
- Jobs called "Service Calls"
- CRM contacts called "Customers"
- Dashboard priority: emergency calls, equipment under warranty, parts needed
- Extra module: equipment and warranty tracking, parts inventory
- AI prompt addition: "This is an HVAC business. Service calls may be emergency or scheduled maintenance. Equipment warranty tracking is important."

**Painter:**
- Jobs called "Projects"
- CRM contacts called "Clients"
- Dashboard priority: active projects, estimate pipeline, material costs
- AI prompt addition: "This is a painting business. Estimates include paint cost, primer, equipment, and labour. Projects often span several days."

**Salon:**
- Jobs called "Appointments"
- CRM contacts called "Guests"
- Dashboard priority: today's appointments, recurring bookings, retail sales
- AI prompt addition: "This is a salon or spa business. Appointments are the core unit. Retail product sales may accompany services."

**Generic (default for Free and Starter, and for unmatched niches):**
- Standard labels: jobs, clients, invoices, expenses
- No niche-specific extras
- AI prompt addition: "This is a service business. Adapt terminology and suggestions to match what the owner describes."

**AI niche-matching flow:**
When user types a custom niche during onboarding, send this prompt to Claude:

```
The user described their business as: "[USER_INPUT]"
Available niches: contractor, landscaper, cleaner, hvac, painter, salon, generic
Return ONLY the single best matching niche name from the list above. Nothing else.
```

Cache result: store "[USER_INPUT]" → "[MATCHED_NICHE]" in a lookup table. Next user with same description hits cache — no API call.

After matching, show user: "We've set you up with our [MATCHED_NICHE] layout — it's the closest match for your business. For a fully custom layout built specifically for [their description], our Custom Build plan is designed for exactly this."

---

# SECTION 12 — MOBILE AND PWA SPECIFICATION

**Every screen must work on a phone. Build mobile-first.**

Breakpoints:
- Mobile: 0–768px (design here first)
- Tablet: 768–1024px
- Desktop: 1024px+

**Mobile-specific requirements:**
- Bottom navigation bar on mobile — 5 icons: Home, Clients, Jobs, Invoices, AI
- Top navigation collapses to hamburger on mobile
- AI command bar fixed at bottom of screen on mobile — thumb accessible
- Touch targets minimum 44px height
- No hover-only interactions — everything must work on tap
- Swipe left on invoice row to reveal quick actions: send, mark paid, delete

**PWA requirements:**
- manifest.json with Opsly name, icons, theme colour matching --bg-primary
- Service worker for offline mode
- Cache the day's jobs and active client records on login
- Offline indicator banner when no connection
- Queue offline actions (time logs, photo uploads, expense entries) and sync on reconnect
- "Install App" prompt shown after 3rd login on mobile

---

# SECTION 13 — BUILD ORDER

Build in this exact sequence. Do not skip ahead. Each section must be complete and tested before starting the next.

**SECTION A — Foundation**
1. Supabase project setup
2. All tables created with correct schema
3. RLS policies applied and tested on every table
4. Supabase Auth configured — email verification on, phone verification on
5. GitHub repository created
6. Vercel project connected to GitHub
7. Environment variables set in Vercel: Supabase URL, Supabase anon key, Anthropic API key, Resend API key, Telnyx API key, ipinfo.io token
8. Basic React app shell deployed to Vercel — blank page with Opsly in title
9. Confirm deployment works end to end

**SECTION B — Authentication**
1. Login page — email and password, forgot password link
2. Signup page — name, email, password, business name, phone number
3. Phone verification flow — SMS OTP via Telnyx
4. Email verification — Supabase sends verification email via Resend
5. Forgot password flow
6. Protected routes — redirect to login if not authenticated
7. Session persistence — stay logged in across browser closes
8. Concurrent session enforcement

**SECTION C — Onboarding Flow**
1. Post-signup onboarding — 4 steps, progress bar
2. Step 1: Upload logo (PNG) and optionally signature/stamp image
3. Step 2: Business details — address, phone, email, website
4. Step 3: Niche selection (Growth and above) — tile UI, one per row on mobile
5. Step 4: Add Stripe Payment Link — one paste-a-link field, no OAuth, no API key (see Section 3)
6. Skip option on steps 3 and 4 with ability to complete later
7. No background Stripe connection process needed — it's a static field, saved instantly, portal accessible immediately

**SECTION D — Core UI Shell**
1. Left sidebar navigation with all module icons and labels
2. Top bar with business name, user avatar, usage counter, notifications bell
3. Main content area
4. AI command bar — fixed at bottom of every page
5. Mobile bottom navigation
6. Dark theme with exact colour tokens from Section 2
7. Inter font loaded from Google Fonts

**SECTION E — AI Command Bar**
1. Text input, send button, voice note button (Pro and above)
2. Streaming response display — words appear as they generate
3. Middleware function — usage check, model routing, API call, action execution, logging
4. Usage counter updates in real-time after each command
5. Overage warning at 90% of limit
6. Overage cap reached message with upgrade prompt

**SECTION F — Dashboard**
1. Free plan: 3 metric cards only
2. Paid plans: full dashboard with widgets based on niche config
3. Recent activity feed
4. Upcoming jobs this week
5. Outstanding invoices summary
6. Quick action buttons: New Invoice, New Job, New Client, New Estimate

**SECTION G — CRM Module**
1. Contact list with search and filter
2. Add contact form — name, email, phone, address, notes
3. Contact profile page — all details, job history, invoice history, document history, communication timeline
4. Edit and delete contacts (delete blocked on Free plan's 3 permanent contacts)
5. Import contacts from CSV

**SECTION H — Invoicing Module**
1. Invoice builder — all fields from Section 9
2. Logo and signature upload within invoice builder
3. PDF generation
4. Send via email using Resend
5. Stripe payment link generation and embedding
6. Invoice list with status filters
7. Auto late payment chaser setup (runs automatically, no UI needed — just background job)
8. AI commands for invoicing fully functional

**SECTION I — Estimates Module**
1. Estimate builder — same structure as invoice
2. Send to client
3. Client approval/rejection flow
4. One-click convert to invoice

**SECTION J — Jobs and Scheduling**
1. Job creation form — link to contact, date, time, address, description, assigned user
2. Job calendar view — weekly and monthly
3. Google Calendar sync — OAuth connection, two-way sync
4. Job status updates — tap to advance status
5. Job profit calculator — materials + labour + subs = profit shown on job record

**SECTION K — Expense Tracking**
1. Log expense form — amount, category, description, date, attach photo
2. Photo upload to Supabase Storage
3. Expense list by job, by month, by category
4. Total by category for tax purposes

**SECTION L — SMS Module (Growth and above, default-plan version)**
1. Setting field: "Connect your Twilio account" — client pastes their own SID/token, optional, not required
2. If connected: inbound SMS display in portal inbox, send SMS via AI command, missed call auto-text
3. If not connected: SMS-shaped features silently fall back to email via Resend (Section N) — same UX promise, zero founder-owned telecom
4. Founder never owns a phone number, never pays a carrier fee, never handles TCPA compliance on default plans
5. Full Telnyx-owned, founder-provisioned numbers and carrier relationship are a **Section 18 Custom/Enterprise feature only**

**SECTION M — Documents Module (Growth and above, default-plan version)**
1. Template library for contracts
2. Document editor — fill in fields, preview
3. Generate clean, professional PDF — no in-house e-signature capture on default plans
4. Send to client via email with the PDF attached; client prints/signs/scans or uses their own e-sign tool of choice (DocuSign, etc.) if they want a binding signature — Opsly does not adjudicate signature legal validity across jurisdictions
5. Document list per client
6. Full in-house signature capture (finger/mouse), jurisdiction-validated e-signature legal compliance, and signed-PDF generation are a **Section 18 Custom/Enterprise feature only**, scoped per client's jurisdiction

**SECTION N — Follow-up Sequences (Growth and above)**
1. Sequence builder — trigger, steps, delay, channel, message
2. Activate on job completion automatically
3. View active sequences and their status

**SECTION O — Reports (all paid plans)**
1. Basic: revenue, outstanding, top clients
2. Advanced (Pro+): P&L, cash flow, AR aging, pipeline value
3. All accessible via AI command as well as dedicated reports page

**SECTION P — Multi-user and Roles (Growth and above)**
1. Invite team member by email
2. Assign role: owner / manager / field worker / admin
3. Role-based UI — field worker sees simplified mobile view only
4. Crew PWA for Business plan

**SECTION Q — AI CA (Pro add-on)**
1. "Coming Soon" placeholder with email capture — all plans
2. When live: income vs expense dashboard, tax estimates, flagged deductions
3. Mandatory disclaimer on every output — cannot be dismissed

**SECTION R — Billing and Plan Management**
1. Pricing page with geo-detected currency
2. Plan selection
3. Paddle checkout integration
4. Upgrade/downgrade plan flow
5. Usage dashboard — commands used, overage running total, overage cap setting
6. Cancel account flow — 30 day notice, data export, confirmation

**SECTION S — Settings**
1. Business profile — name, address, logo, signature, stamp, invoice prefix
2. Notification preferences
3. Connected accounts — Stripe, Google Calendar, QuickBooks (Pro+)
4. Team management
5. Billing and plan
6. Security — active sessions, change password, 2FA setup
7. Data export
8. Delete account

---

# SECTION 14 — ERROR HANDLING AND UX RULES

**Never show a technical error to a user.**

Bad: "Error 500: Internal Server Error"
Good: "Something went wrong on our end. Your data is safe — try again in a moment."

Bad: "FOREIGN_KEY_VIOLATION"
Good: "We couldn't find that client. They may have been deleted."

**AI error responses must be human:**

Bad: "API rate limit exceeded"
Good: "You've used all your AI commands for this month. Additional commands are $0.05 each — want to continue?"

**Empty states must direct the user to act:**

Bad: blank page
Good: "No invoices yet. Type 'create an invoice' in the command bar to send your first one."

**Loading states:**

- AI streaming starts within 500ms — never show spinner longer than this
- Page loads show skeleton screens — grey placeholder shapes in the layout
- Never block the entire UI for a background action

**Confirmations before sending anything:**

Before any email or SMS is sent to a client — show a preview. Show who it goes to, the subject, the content. One confirm button. One cancel button. Never send without confirmation.

---

# SECTION 15 — WHAT MAKES OPSLY WIN

Read this to understand what you are competing against and why Opsly wins.

Jobber has a clunky interface that takes time to learn. Opsly has no learning curve — owners just talk to it.

Jobber charges $300–$400/month in add-ons for features like photo documentation, review automation, and advanced reporting. Opsly includes all of these natively in the Pro plan at $199/month.

Jobber has no niche-specific layouts — every contractor sees the same generic interface. Opsly's interface reorganises itself around how that specific type of business actually works.

Jobber has no AI that executes tasks — it only surfaces menus. Opsly's AI does the work.

Jobber is funded by $191 million in VC money and optimises for investor metrics. Opsly is built by a founder who answers the phone.

Every feature in Opsly was chosen because a contractor is either wasting time doing it manually, or paying a separate subscription for it. The goal is: cancel everything else, use Opsly, pay less, do less admin, make more money.

---

# SECTION 16 — FINAL REMINDERS FOR ANTIGRAVITY

- Build one section at a time. Complete it fully. Test it. Then move to the next.
- RLS on every table. Test it before anything else. This is security.
- Mobile first. Every screen. No exceptions.
- Colour tokens from Section 2. Use them everywhere. No hardcoded colours.
- Stream AI responses. Never make the user wait for a full response.
- Log every AI command to ai_usage. This is how you enforce plan limits.
- Show usage counter in real time. Clients must always know where they stand.
- Confirm before sending. Every email. Every SMS. Every document sent to a client.
- Never show technical errors. Translate everything to plain English.
- Empty states give direction. Blank pages are not acceptable.
- The AI command bar is always visible. It is the product. Everything else supports it.
- **New in v2: before starting Section H, complete Section 17 (Phase 0) in full. Do not build Invoicing on top of an unmetered AI call or an unprotected Paddle subscription.**

---

# SECTION 17 — PHASE 0 HARDENING (build this before Section H, after Section G)

This section did not exist in v1. Insert it now, between the already-completed Section G (CRM) and the not-yet-started Section H (Invoicing). Nothing in A–G changes. This is purely additive.

**17.1 — AI usage metering middleware (formalises Section 6 into working code)**
- Build the full 16-step middleware described in Section 6 now, before Invoicing exists, because Invoicing is the first module to fire AI commands at real volume.
- Hard rule: the usage/limit check must complete and pass before the Claude API is ever called. Test this specifically — write a test that tries to fire a command at exactly the plan limit and confirms the API is never reached on the next one.
- Hard rule: Free plan requests are locked to `claude-haiku-4-5` in the router itself, not just in a config flag that could be bypassed.
- Real-time usage counter must update after every command, visible in the existing top bar (Section D) — no new UI needed, just wire it up.

**17.2 — Paddle webhook handling + grace period**
- Three webhook events only: `subscription.created`, `payment.failed`, `subscription.cancelled`.
- Each maps to exactly one column update on `clients.plan_status` (`active` / `past_due` / `cancelled`).
- On `payment.failed`: do not gate any feature immediately. Set a `grace_period_ends_at` timestamp 5 days out (founder can configure 3–7 days). Show a calm, non-scary banner: "We couldn't process your payment — update your card to keep things running. You have until [date]." Only after grace period expiry does feature gating kick in.
- On `subscription.cancelled`: standard 30-day notice + data export flow already specified in Section R.

**17.3 — Core loop end-to-end test**
- Manually walk: signup → onboarding → create a client (CRM) → create an invoice → send it → mark it paid, on a real staging account.
- Fix every broken or rough edge hit along the way before starting Section H proper. This is testing what already exists (A–G) plus the not-yet-built H, not a rebuild.

**17.4 — Free plan cost ceiling test**
- Before launch, simulate a Free account hitting its 30 AI commands, 5 lifetime invoices, and 50MB storage cap. Confirm each one hard-stops server-side with a friendly message (Section 14 tone), and confirm zero Sonnet calls and zero Stripe API calls occur anywhere in a Free account's lifecycle.

Once 17.1–17.4 pass, proceed to Section H exactly as originally written. Sections H through S are unchanged from v1 except for the default-vs-custom reframing already applied inline to Sections L and M above.

---

# SECTION 18 — CUSTOM / ENTERPRISE BUILDS (where the upsell features live)

Nothing described in this section is for default plans (Free–Business). This section exists so that every feature the founder is excited about — full Stripe Connect, founder-owned Telnyx SMS, in-house binding e-signatures, custom AI personality, dedicated infrastructure — still gets built, sold, and charged for, without ever becoming a default-plan operational burden.

**When a client asks for any of the following, it routes to a Custom/Enterprise quote, not a plan upgrade:**
- Full Stripe Connect (OAuth, embedded checkout, split payments, Opsly as platform account)
- Founder-owned Telnyx number, two-way SMS, carrier compliance
- In-house digital signature capture with jurisdiction-specific legal validity research
- Custom AI personality / brand voice
- Dedicated Supabase instance, dedicated Vercel environment
- Any integration not already listed in Sections H–S
- Multi-entity/franchise rollups beyond Business plan's multi-location feature

**Commercial structure (unchanged from Section 8's existing Custom/Enterprise tier):**
- From $999/mo + build fee from $5,000, $500 paid scoping call credited on signup
- The build fee and higher monthly price are what fund taking on the extra operational/compliance risk that the founder explicitly does not want to absorb for free on default plans
- Each Custom build gets its own short addendum document (not this file) listing exactly which Section 18 features were scoped, so BUILDCONTEXT.md itself never needs per-client forks

**Why this protects the upsell instinct instead of killing it:** every feature the founder liked in v1 (Stripe Connect, Telnyx SMS, in-house e-signatures) still exists and is still sellable — at a price that reflects the real operational cost of owning it, instead of being given away free inside a $49–$399/mo plan where it quietly creates risk with no matching revenue.

---

*End of build context (v2). Do not deviate from this document. Every decision traces back here.*
