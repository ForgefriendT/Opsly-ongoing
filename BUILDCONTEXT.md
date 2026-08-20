# MASTER BUILD CONTEXT — OPSLY
## Read this entire document before writing a single line of code. Every decision you make must trace back to something written here.

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
- Micro-animations — smooth transitions on hover, focus, and state changes (see ANIMATION SYSTEM below)
- Command interface centered — the AI chat bar is the hero of every page (see AI COMMAND BAR — FULL DESIGN SPECIFICATION below)

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

### DESIGN SYSTEM SPECIFICATIONS
- **Font weights**: Inter 400 for body, 500 for labels, 600 for headings, 700 for metric numbers.
- **Base font size**: 14px base, 15px for inputs and command bar, 13px for secondary labels.
- **Border radius**: Cards: 16px. Inputs: 10px. Buttons: 8px. Badges: 999px. Modals: 20px. Bottom sheet: 20px top only.
- **Tables styling**: No outer border. Row dividers: 1px `--border-subtle`. Header row: `--bg-tertiary` background, 12px uppercase letter-spacing 0.05em text in `--text-muted`. Alternating row shading: none — use hover state only.
- **Selected/active navigation state**: Left border 3px `--accent-primary`, background `rgba(124, 106, 255, 0.1)`, text `--text-primary`. Icon fills to `--accent-primary`.
- **Loading states**: Skeleton screens only — no spinners. Skeleton matches the exact layout of the real content it replaces.

---

### AI COMMAND BAR — FULL DESIGN SPECIFICATION

**Visual anatomy:**
```
[ 🎙️  Type a command... (placeholder text cycles)      [↑ Send] ]
       ← input area, flex-grow →                        ← button →
```
- Container: `max-width: 680px`, `margin: 0 auto`, `position: fixed`, `bottom: 24px`, `left: 50%`, `transform: translateX(-50%)` on desktop
- On mobile: `position: fixed`, `bottom: 0`, `left: 0`, `right: 0`, `border-radius: 16px 16px 0 0`, `padding-bottom: env(safe-area-inset-bottom)` (handles iPhone home bar)
- Background: glass-card style (see glassmorphism spec below)
- Border: `1px solid rgba(124, 106, 255, 0.2)` at rest, `1px solid rgba(124, 106, 255, 0.5)` on focus
- Input field: `background: transparent`, `border: none`, `outline: none`, `color: --text-primary`, `font-size: 15px`, `line-height: 1.5`, max height before scroll: 120px (auto-grow up to this)
- Send button: circle, 36px × 36px, `background: --accent-primary`, icon is an upward arrow SVG. Disabled (greyed out) when input is empty. Active: purple. Animates on press (see button animations below).
- Voice button (Pro+): microphone icon, same size as send button, positioned left of send. Pulses with a red ring when recording.

**Placeholder text — cycles every 4 seconds with a fade transition:**
1. "Invoice Sarah for the roof repair..."
2. "What's my outstanding balance this month?"
3. "Schedule a job for Mike on Friday at 9am..."
4. "Who hasn't paid me in the last 30 days?"
5. "Create an estimate for the Henderson job..."
(Cycle through all 5, then repeat. Fade out over 300ms, fade in over 300ms.)

**Behaviour:**
- Pressing Enter sends (Shift+Enter = new line)
- After send: input clears, button returns to disabled state
- Response streams into the area ABOVE the command bar (a response bubble, not inside the bar)
- The response area slides down from above the bar: `initial={{ height: 0, opacity: 0 }}` → `animate={{ height: 'auto', opacity: 1 }}` over 200ms
- Response bubble uses the same glass-card style, max-height: 340px, scrollable
- Completed responses stay visible until user types a new command or dismisses with ✕

**Command history:**
- Up arrow key cycles through last 10 commands (like terminal history)
- Store in `sessionStorage` (not localStorage — clears on tab close, which is correct behaviour)

---

### ANIMATION SYSTEM

**Animation Library:** Framer Motion (import as `motion/react` — the current package name as of 2025). Install alongside React. Every animated element uses Framer Motion. No CSS-only animations for interactive elements.

**Animation Principles:**
- Every interaction has a physical response. Nothing is instant and nothing is sluggish.
- Animations communicate state, not just decorate.
- Mobile performance is the ceiling. If it drops frames on a mid-range phone, remove it.
- `prefers-reduced-motion` must be respected. Wrap all Framer Motion components to check this and fall back to instant transitions.

**Timing standards:**
```
Micro (button press, checkbox tick):     100–150ms, ease-out
Element entrance (card, modal open):     200–250ms, ease-out
Page transition:                         250–300ms, ease-in-out
Sidebar expand/collapse:                 250ms, spring (stiffness: 300, damping: 30)
AI response streaming appearance:        Each word: 0ms delay, tokens appear immediately
Skeleton to content swap:               150ms fade-out skeleton, 200ms fade-in content
```

**Specific animations — build these exactly:**

**1. Page transitions:**
Every route change: new page fades in (opacity 0→1) and slides up 12px (y: 12→0) over 250ms ease-out. Previous page fades out simultaneously. Use `AnimatePresence` with `mode="wait"`.

**2. Card entrances (dashboard widgets, invoice rows, contact cards):**
Staggered entrance — each card appears with: `initial={{ opacity: 0, y: 16 }}` → `animate={{ opacity: 1, y: 0 }}`, 200ms ease-out. Stagger delay between cards: 50ms. First card at 0ms, second at 50ms, third at 100ms, max 5 cards staggered then rest appear together.

**3. Sidebar:**
- Expand: width animates from 64px (icon-only) to 240px (icon + label), 250ms spring
- Labels fade in after width reaches 80%, so they don't overlap the icon during animation
- Active item indicator: a `layoutId="sidebar-pill"` purple pill animates between items on navigation

**4. AI command bar — the hero interaction:**
- The command bar is a floating pill fixed at the bottom, 680px wide max on desktop, full width minus 32px margin on mobile
- On focus: subtle purple glow (`box-shadow: 0 0 0 2px rgba(124, 106, 255, 0.4)`) animates in over 150ms
- Send button: on hover, scale 1→1.08 over 100ms spring. On press, scale 1.08→0.95→1 (tap feel)
- While AI is responding: a subtle animated gradient sweeps left-to-right inside the bar every 1.5s (like a shimmer, using `background-position` animation). Stops when response is complete.
- Streaming tokens appear with `opacity: 0→1` per word, 80ms delay per token, creating a typewriter-cascade feel rather than instant text dump

**5. Button interactions:**
Primary button (purple): `whileHover={{ scale: 1.02, brightness: 1.1 }}` 100ms spring. `whileTap={{ scale: 0.97 }}` 80ms ease-out. Shadow lifts on hover: `box-shadow: 0 8px 24px rgba(124, 106, 255, 0.35)`.
Ghost/secondary button: `whileHover={{ backgroundColor: 'rgba(124, 106, 255, 0.08)' }}` 150ms ease.
Destructive button: `whileHover={{ backgroundColor: 'rgba(248, 113, 113, 0.12)' }}` 150ms ease.

**6. Metric cards (dashboard):**
On mount, numbers count up from 0 to their value over 800ms using an easing function (ease-out cubic). Currency symbols and formatting appear instantly; only the number animates. This makes the dashboard feel alive on every load.

**7. Toast / notification system:**
Toasts slide in from bottom-right (desktop) or bottom-center (mobile). `initial={{ opacity: 0, y: 24, scale: 0.95 }}` → `animate={{ opacity: 1, y: 0, scale: 1 }}` over 250ms spring. On dismiss: `exit={{ opacity: 0, y: 8, scale: 0.97 }}` over 150ms. Stack up to 3 toasts with 8px vertical gap and scale-down effect on older toasts.

**8. Modal and sheet entrances:**
Modal: backdrop fades in (opacity 0→0.6) over 200ms. Modal card scales in `scale: 0.96→1` + `opacity: 0→1` over 220ms ease-out.
Bottom sheet (mobile): slides up from bottom `y: 100%→0` over 300ms spring (stiffness: 400, damping: 40). Drag-to-dismiss gesture built in.

**9. Status badge transitions:**
When an invoice status changes (e.g., "Sent" → "Paid"), the badge does not just swap text. It: fades out (100ms), swaps colour and text, fades in (100ms). The green "Paid" badge also emits a subtle pulse ring (scale 1→1.6, opacity 0.4→0) once on appearance.

**10. Skeleton screens:**
All skeleton shapes use a shimmer animation: a light gradient sweeps left-to-right over 1.5s, looping. Colour: from `--bg-secondary` to `--bg-hover` and back. Skeleton shapes must match the exact dimensions of the real content they replace.

**11. Swipe actions on mobile (invoice/job rows):**
Left swipe on a row reveals action buttons (e.g., Mark Paid, Delete). Use Framer Motion `drag="x"` with `dragConstraints={{ left: -120, right: 0 }}` and `dragElastic={0.1}`. Action buttons appear with `opacity: 0→1` proportional to swipe distance. Snap to open at 60px, snap closed at less than 30px.

**12. Empty state entrances:**
Empty state illustrations + text fade in with a gentle bounce: `initial={{ opacity: 0, scale: 0.92 }}` → `animate={{ opacity: 1, scale: 1 }}` over 300ms spring. This makes empty states feel intentional, not broken.

**13. Glassmorphism implementation — exact values:**
```css
.glass-card {
  background: rgba(22, 27, 39, 0.7);       /* --bg-secondary at 70% */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(42, 49, 71, 0.6); /* --border-subtle at 60% */
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
```
Use `glass-card` for: dashboard metric cards, modals, dropdowns, the AI command bar, sidebar on mobile (overlay mode). Do NOT use backdrop-filter on elements that scroll inside the glass — it causes performance issues.

**14. Background ambient effect:**
The main background (`--bg-primary: #0f1117`) is not flat. It has two radial gradient orbs positioned statically (not animated, for performance):
- Orb 1: `radial-gradient(ellipse 600px 400px at 20% 20%, rgba(124, 106, 255, 0.06) 0%, transparent 70%)` — top-left
- Orb 2: `radial-gradient(ellipse 500px 350px at 80% 80%, rgba(255, 139, 107, 0.04) 0%, transparent 70%)` — bottom-right

These orbs give the dark background subtle depth and warmth without being distracting. They are `position: fixed`, `pointer-events: none`, `z-index: 0`. All content sits above them.

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

**SMS:** Telnyx. Two-way SMS. Each Growth plan and above client gets a local US phone number via Telnyx. Incoming SMS flows into the portal dashboard. Outgoing SMS sent via AI command.

**Payments from Opsly's clients (B2B):** Paddle as primary. Wise as secondary for one-time payments. Never Stripe for Opsly's own subscription billing — Paddle handles global tax compliance automatically.

**Payments within portals (B2C — contractor charging their customers):** Stripe. Each contractor connects their own Stripe account. Opsly never touches money flowing between contractor and their customer. Stripe Connect is OPTIONAL for every plan including paid plans. A contractor who only accepts cash, bank transfer, or cheque does not need to connect Stripe. Every invoicing, reporting, and financial feature works without it. Only the 'Pay Now' embedded payment link requires Stripe. The portal must never block, warn, or degrade functionality for clients who have not connected Stripe — except to hide the Pay Now button on invoices.

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

### ADDITIONAL RLS REQUIREMENTS & GDPR COMPLIANCE

**A. Never use the service role key in client-facing code:**
The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS. It must NEVER appear in frontend code, never be in a `.env.local` file that gets committed, and never be passed to the client. Only use it in server-side background jobs (cron, webhooks). Every user-facing API route uses the anon key with the user's JWT.

**B. UPDATE policies need both USING and WITH CHECK:**
Every UPDATE RLS policy must have both clauses. Without `WITH CHECK`, a user can update a row to assign it to a different `client_id`, escaping isolation:
```sql
CREATE POLICY "client_isolation_update" ON invoices
  FOR UPDATE
  USING (client_id = (SELECT client_id FROM users WHERE auth_uid = auth.uid()))
  WITH CHECK (client_id = (SELECT client_id FROM users WHERE auth_uid = auth.uid()));
```
Apply this pattern to every table's UPDATE policy.

**C. Index every RLS policy column:**
Every column referenced in a USING clause must have a database index. Missing indexes make RLS policies perform a full table scan on every query. Critical indexes:
```sql
CREATE INDEX idx_contacts_client_id ON contacts(client_id);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_expenses_client_id ON expenses(client_id);
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_ai_usage_client_id ON ai_usage(client_id);
CREATE INDEX idx_sms_messages_client_id ON sms_messages(client_id);
```

**D. Test RLS from the client SDK, never the SQL Editor:**
The Supabase SQL Editor runs as a superuser and bypasses RLS entirely. All RLS tests must be done by making requests through the Supabase JS client with a real user JWT. Create a test user for Client A and a test user for Client B. Log in as Client A and attempt to query Client B's data. It must return zero rows, not an error — an error means RLS is blocking correctly; zero rows means isolation is working at the policy level.

**E. Supabase Storage buckets also need RLS:**
Every storage bucket (logos, receipts, signatures, documents, photos) must have storage policies that restrict access by `client_id`. A contractor must never be able to access another contractor's uploaded files by guessing the URL. Bucket names should not be guessable — use UUIDs in file paths: `{client_id}/{uuid}-{filename}`.

**F. Realtime subscriptions respect RLS — but you must verify:**
Supabase Realtime only sends events for rows the user can access under RLS. However, if a table's SELECT policy is misconfigured, realtime will broadcast other clients' data. Test realtime subscriptions with two different client sessions open simultaneously. Client A's updates must never appear in Client B's subscription.

**G. DATA EXPORT SPECIFICATION:**
When a client requests data export (Settings → Data Export):
- Trigger a Supabase Edge Function that queries all tables for that `client_id`
- Package as a ZIP file containing:
  - `contacts.csv` — all CRM contacts
  - `jobs.csv` — all jobs
  - `invoices.csv` — all invoices with line items flattened
  - `expenses.csv` — all expenses
  - `documents/` — folder with all uploaded documents (fetched from Supabase Storage)
  - `sms_messages.csv` — full SMS history
  - `ai_usage.csv` — command history
- Send download link via email (link expires in 48 hours)
- Show in-UI message: "Your export is being prepared — you'll receive an email with the download link within 15 minutes."
- Log the export request with timestamp to the `clients` table

**H. Account deletion:**
- 30-day notice period. Account is suspended (login still works, no data visible) for 30 days, then all data is permanently deleted.
- During the 30-day window, the client can cancel the deletion by logging in and clicking "Cancel Deletion"
- An automatic email is sent at 1 day before permanent deletion as a final warning
- After deletion: all rows with that `client_id` are deleted from every table. Storage files are deleted from Supabase Storage. Stripe Connect account link is revoked.

---

# SECTION 6 — AI MIDDLEWARE — THE BRAIN

This is the most important technical component. Build it carefully.

**The middleware function — runs on every AI command:**

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

Use Haiku when: creating invoices, logging expenses, scheduling jobs, adding contacts, sending SMS, answering simple questions about data.

Use Sonnet when: generating detailed estimates, producing financial reports, handling ambiguous multi-step commands, writing contracts or documents, explaining complex data trends.

**Streaming:** Always stream Claude API responses. Use the Anthropic streaming API. Tokens appear word by word in the command interface. Never show a loading spinner for more than 500ms — streaming starts immediately.

**Command type detection:** After receiving the AI response, classify it into one of these action types: CREATE_INVOICE / SEND_INVOICE / CREATE_ESTIMATE / CREATE_JOB / UPDATE_JOB / ADD_CONTACT / SEND_SMS / SEND_EMAIL / GENERATE_REPORT / GENERATE_DOCUMENT / FETCH_DATA / SCHEDULE_JOB / LOG_EXPENSE / ANSWER_QUESTION. Log this type in ai_usage. Use it for analytics.

---

### ADDITIONAL AI MIDDLEWARE RULES

**A. The AI must never invent data or make up values:**
Every time the AI references a number (invoice amount, date, client name), it must be pulled from the database first. The middleware must fetch relevant context BEFORE calling the Claude API, not ask Claude to guess. Example flow for "Who hasn't paid me?": middleware queries `invoices WHERE status = 'overdue'` and passes the results to Claude, which formats them as a readable response. Claude does not hallucinate invoice data.

**B. Dangerous actions require explicit confirmation:**
Before the AI executes any of these actions, it MUST output a confirmation message and wait for the user to reply "yes" or "confirm":
- Sending any email to a client
- Sending any SMS to a client
- Marking an invoice as paid
- Deleting any record
- Sending an estimate or contract for signature
Never auto-execute these on first command. Always confirm.

**C. AI command input sanitisation:**
Strip all HTML from AI command input before passing to the API. Limit input to 2,000 characters. If input exceeds limit, return: "That command is too long — could you break it into smaller steps?"

**D. Failed AI commands must not silently fail:**
If the Claude API call fails (timeout, rate limit, error), the middleware must:
1. NOT show a technical error
2. Show a human message: "Something went wrong — your data is safe. Try again in a moment."
3. Log the failure to a `ai_errors` table (client_id, command_type, error_code, timestamp) — not visible to the user, used by founder for debugging

**E. Command history context window:**
The last 5 commands from the current session are included in every API call (as prior context). This allows follow-up commands: "Actually, make it $1,400 instead" — the AI knows what "it" refers to. Clear context when user navigates away from the AI interface or after 30 minutes of inactivity.

**F. AI must not give financial, legal, or medical advice:**
If a command asks for tax advice, legal interpretation, or anything that requires a licensed professional, the AI responds: "I can show you the numbers, but for [tax / legal] advice you'll need your accountant or lawyer. Here's the data you might need: [relevant data]."

---

# SECTION 6A — FINANCIAL CALCULATIONS: SOURCE OF TRUTH

All revenue, profit, outstanding balances, and financial metrics across the entire platform — dashboard widgets, reports, AI responses, job profit calculators — are calculated EXCLUSIVELY from data stored in Supabase. Stripe is never queried for financial reporting under any circumstances.

**Calculation definitions (use these everywhere, consistently):**

- **Revenue (collected)** = `SUM(invoices.total)` WHERE `status = 'paid'` AND `client_id = current_client` AND date within selected range
- **Revenue (total invoiced)** = `SUM(invoices.total)` WHERE `status IN ('sent', 'viewed', 'paid', 'overdue')` AND `client_id = current_client`
- **Outstanding AR** = `SUM(invoices.total)` WHERE `status IN ('sent', 'viewed', 'overdue')` AND `client_id = current_client`
- **Overdue AR** = `SUM(invoices.total)` WHERE `status = 'overdue'` AND `due_date < NOW()` AND `client_id = current_client`
- **Total expenses** = `SUM(expenses.amount)` WHERE `client_id = current_client` AND date within selected range
- **Gross profit per job** = `invoice total for that job` MINUS `(jobs.materials_cost + jobs.labour_cost + jobs.sub_cost)`
- **Net profit (period)** = Revenue (collected) MINUS Total expenses for same period
- **Pipeline value** = `SUM(estimates.total)` WHERE `status IN ('sent', 'draft')` — jobs not yet won

**Stripe's ONLY role in financial flows:**
1. Generate a payment link embedded in an invoice (Pay Now button)
2. Receive Stripe webhook `payment_intent.succeeded` → update `invoices.status` to `'paid'` and set `invoices.paid_date = NOW()`
3. That is all. Stripe is never read for reporting.

**If Stripe is not connected:**
- All financial calculations work fully
- The "Pay Now" button is hidden from invoices
- The owner marks invoices paid manually using the "Mark as Paid" button
- No feature except the payment link depends on Stripe being connected
- The platform must be 100% functional without a connected Stripe account

**Manual payment methods to support (no Stripe needed):**
- Bank transfer (owner marks paid manually)
- Cash (owner marks paid manually)
- Cheque (owner marks paid manually)
- Credit card via Stripe (automatic via webhook)

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

### CURRENCY DISPLAY RULES

- All monetary values are stored in the database as integers (cents/paise) to avoid floating point errors. E.g., $1,200.50 is stored as `120050`. Divide by 100 for display.
- The currency symbol and formatting for a client's invoices comes from their `clients.currency` and `clients.currency_symbol` fields, set at signup.
- A US client's invoices always show USD even if the owner is viewing from a different country.
- The owner's own Opsly subscription price (shown in billing/settings) is always in their locked billing currency, never converted in real time.
- Never show two currencies on the same screen. The entire portal operates in the client's business currency.
- If a client has no currency set (legacy or error), default to USD display without crashing.

---

# SECTION 8 — PLAN STRUCTURE AND FEATURE GATING

Gate every feature in the codebase using a `useFeatureAccess(featureName)` hook that reads the client's plan from Supabase and returns true/false. Never hardcode plan checks in components.

**FREE PLAN — $0**
- 3 clients in CRM (permanent, non-deletable, non-replaceable — enforced at DB level)
- 5 invoices total lifetime (not per month — total ever)
- 30 AI commands per month
- Default generic ERP layout only
- Logo on invoices — yes
- Signature/stamp on invoices — yes
- Email invoice delivery only
- Stripe payment link on invoices — yes
- Basic dashboard: 3 metrics only (total invoiced, total paid, active clients)
- No SMS
- No scheduling module (view-only placeholder shown with upgrade prompt)
- No expense tracking
- No documents module
- No niche selection
- No custom domain — operates on opsly.com/username
- No support (documentation only)
- AI CA — visible in sidebar, clicking shows "Coming Soon — drop your email to be first to know" capture form
- Storage: 50MB

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
- **Documents module:**
  - Client contracts with digital signature capture
  - Material and supplier contract upload and storage
  - Job scope of work documents
  - Change order documents with client approval flow
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

### PLAN DOWNGRADE RULES

When a client downgrades to a lower plan:
- **CRM contacts over the new limit:** Existing contacts are NOT deleted. They become read-only with a banner: "Your plan allows 3 contacts — upgrade to access all [47] contacts." The client can still view all contacts but cannot create new ones until they are within limit or upgrade.
- **Features no longer available:** Disappear from the sidebar immediately. Any data associated with those features (SMS history, documents, sequences) is retained in the database but inaccessible until they upgrade again.
- **AI command limit:** Resets to the new plan limit on next billing cycle. Existing overage charges from the higher plan are billed at the old plan's overage rate for that period.
- **Storage over new limit:** Existing files are NOT deleted. New uploads are blocked with: "You've exceeded your [2GB] storage limit — upgrade or delete files to continue uploading."
- **Users over new limit:** Existing users are NOT removed. They keep access until the next billing cycle, at which point an email is sent: "Your plan allows 1 user — please remove additional users or upgrade within 7 days."

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

### INVOICE EDGE CASES

**Partial payments:**
An invoice can have partial payments. Add a `payments` JSONB array to the `invoices` table: `[{ amount: 500, method: 'bank_transfer', date: '2025-03-01', note: 'deposit' }]`. The invoice status stays `'sent'` until fully paid. The UI shows: "Paid: $500 / $1,200 — $700 remaining." The "Mark as Paid" button becomes "Record Payment" which opens a form: amount, date, method (cash/bank/cheque/stripe), note.

**Invoice number collision prevention:**
When generating the next invoice number (e.g., INV-042), check the database for the highest existing number for that client and increment from there. Never rely on a simple count — deleted invoices would cause duplicates. Use `MAX(invoice_number_sequence)` per client.

**Duplicate invoice guard:**
Before creating an invoice, check: does an invoice already exist for the same contact and same job within the last 30 days? If yes, show a warning: "You may already have an invoice for this job — [INV-039 for Sarah Johnson, $1,200, March 1]. Do you want to create another one?" Two buttons: "Yes, create new" and "Open existing."

**Invoice tax handling:**
Tax rate is per line item. The tax label is configurable per client (e.g., "GST" for Australian clients, "VAT" for UK clients, "Tax" for US clients — auto-set based on country at signup, editable in Settings). Multiple tax rates on one invoice are supported (some line items may be tax-exempt).

**Recurring invoice end date:**
Recurring invoices (weekly/monthly) must have an optional end date or run count. Without this, they run indefinitely. UI shows: "Send every [month] for [12 invoices / until [date] / indefinitely]." A running total shows: "3 of 12 sent."

**PDF generation must be server-side:**
PDFs are generated by a Supabase Edge Function, not in the browser. Client-side PDF generation (jsPDF, html2canvas) produces inconsistent results and breaks on different devices. Use a server-side library (Puppeteer via Edge Function, or a PDF service). The generated PDF URL is stored in `invoices.pdf_url`. The "Download PDF" button fetches this URL, it does not regenerate on every click.

---

# SECTION 10 — DOCUMENTS MODULE SPECIFICATION

**Client Contracts:**
- Template library: roofing contract, painting contract, landscaping contract, cleaning contract, general service contract
- Owner customises template once, saves as their default
- Fill in: client name, job address, scope, start date, completion date, payment terms, liability clause
- Send to client via email — client opens unique link, reads contract, signs with finger on mobile or mouse on desktop
- Digital signature captured as image
- Signed PDF generated and stored
- Both parties receive signed copy via email
- Stored permanently against client CRM record

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
- Requires client digital signature before work continues
- Creates paper trail for disputes

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

### OFFLINE SYNC CONFLICT RESOLUTION

**What gets cached offline:**
- Today's jobs (full records) and their linked contact names/phone numbers
- The last 20 contacts viewed
- The last 10 invoices viewed
- The user's own profile and plan info

**What does NOT work offline:**
- Creating new invoices (requires server-side PDF generation and invoice number allocation)
- Sending emails or SMS
- AI commands (requires API call)
- Viewing reports

**Offline actions that ARE queued:**
- Job status updates (e.g., mark job "in_progress" or "complete")
- Adding expense entries
- Adding time log entries
- Photo uploads (queue in IndexedDB, upload when online)
- Adding notes to a contact or job

**Conflict resolution rule:**
Last-write-wins on a per-field basis, not per-record. If a field was updated online while the user was offline, and the offline user also updated a different field on the same record, merge both changes. If the same field was updated by both: the online change wins, and the user sees a toast: "Your update to [job status] was overridden by a change made while you were offline."

**Offline indicator:**
A coral-coloured banner slides down from the top when offline: "You're offline — changes will sync when you reconnect." When back online: banner turns green for 2 seconds ("Back online — syncing...") then dismisses.

---

# SECTION 12A — NOTIFICATIONS SYSTEM

**In-app notifications (bell icon in top bar):**
Show a red dot on the bell when there are unread notifications. Clicking opens a dropdown (max 400px wide, max-height 480px, scrollable).

**Notification types and triggers:**
- Invoice viewed by client (when client opens payment link) → "Sarah Johnson opened your invoice INV-039"
- Invoice paid → "✓ INV-039 paid — $1,200 received from Sarah Johnson"
- New lead from website form (Growth+) → "New lead: Mike Thompson submitted your contact form"
- Estimate approved → "Henderson approved your estimate — ready to convert to invoice"
- Estimate rejected → "The Thompson estimate was declined"
- Overdue invoice (day 3, 7, 14) → "INV-035 is now 7 days overdue — $850 outstanding"
- Incoming SMS (Growth+) → "New SMS from +1 (555) 234-5678"
- AI command failed → "A command couldn't complete — tap to retry"
- Document signed by client → "Sarah Johnson signed the service contract"
- Stripe payment failed → "Payment failed for INV-041 — client's card was declined"

**Email notifications (user configurable in Settings → Notifications):**
All of the above can also be sent via email. Default: invoices paid = ON, overdue notices = ON. Everything else = OFF by default (user turns on what they want). Email notifications use Resend.

**Push notifications (PWA — optional, not required for MVP):**
When the PWA is installed, request push permission. Use Web Push API. Same triggers as in-app. Mark as post-MVP.

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
5. Step 4: Connect Stripe account — Stripe Connect OAuth flow
6. Skip option on steps 3 and 4 with ability to complete later
7. Stripe account connection triggers in background — portal accessible immediately
8. ONBOARDING PERSISTENCE:
   - Onboarding progress is saved to the database after each completed step (store `onboarding_step_completed: 1/2/3/4` in the `clients` table)
   - If a user closes the tab mid-onboarding and returns, they land on the NEXT incomplete step, not step 1
   - The portal is accessible immediately after email verification — the onboarding wizard appears as a dismissible overlay, not a blocking gate
   - If onboarding is dismissed early, a persistent (but subtle) "Finish setting up your account" card appears on the dashboard until all steps are complete
   - Step completion is not reversible in the UX (can't go "back" — changes are saved to DB immediately). To change logo, use Settings.
   - If Step 4 is skipped: portal is fully functional immediately. No banner, no warning, no reduced access. A subtle 'Connect Stripe to accept online payments' prompt appears only in Settings → Connected Accounts. It does not appear on every page.

**SECTION D — Core UI Shell**
1. Left sidebar navigation with all module icons and labels
2. Top bar with business name, user avatar, usage counter, notifications bell
3. Main content area
4. AI command bar — fixed at bottom of every page
5. Mobile bottom navigation
6. Dark theme with exact colour tokens from Section 2
7. Inter font loaded from Google Fonts

**SECTION E — AI Command Bar**
1. Text input, send button, voice note button (Pro and above) — built according to the AI COMMAND BAR — FULL DESIGN SPECIFICATION in Section 2.
2. Streaming response display — words appear as they generate.
3. Middleware function — usage check, model routing, API call, action execution, logging.
4. Usage counter updates in real-time after each command.
5. Overage warning at 90% of limit.
6. Overage cap reached message with upgrade prompt.

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

**SECTION L — SMS Module (Growth and above)**
1. Telnyx number assignment on Growth plan activation
2. Inbound SMS display in portal inbox
3. Send SMS via AI command
4. Missed call auto-text configuration
5. SMS inbox — conversation view per contact

**SECTION M — Documents Module (Growth and above)**
1. Template library for contracts
2. Document editor — fill in fields, preview
3. Send to client for digital signature
4. Signature capture — finger on mobile, mouse on desktop
5. Signed PDF generation and storage
6. Document list per client

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
7. Data export — implemented according to DATA EXPORT SPECIFICATION in Section 5.
8. Delete account — implemented according to Account Deletion specification in Section 5.

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

**NO DEBUG LABELS IN UI:**
Never render development or status labels in any user-facing component. This includes: 'System active', 'Via Stripe', 'Connected', 'Ready', 'Initialized', API status badges, environment indicators, or any text that reflects internal system state. If you added these during development, remove them before completing any section. The only status indicators a user sees are product-relevant ones defined explicitly in this document (invoice status badges, job status, plan name in header, usage counter). Everything else is invisible to the user.

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
- **NO DEBUG LABELS IN UI:** Never render development or status labels in any user-facing component. This includes: 'System active', 'Via Stripe', 'Connected', 'Ready', 'Initialized', API status badges, environment indicators, or any text that reflects internal system state. If you added these during development, remove them before completing any section. The only status indicators a user sees are product-relevant ones defined explicitly in this document (invoice status badges, job status, plan name in header, usage counter). Everything else is invisible to the user.

---

*End of build context. Do not deviate from this document. Every decision traces back here.*
