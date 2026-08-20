# OPSLY — PERFECTED BUILD CONTEXT PROMPT FOR GEMINI
## Instruction: Feed this entire document as a system prompt or first message. Tell Gemini: "Rewrite my BUILDCONTEXT.md applying every instruction in this document. Do not change the product vision, stack, pricing, or business model. Only add, clarify, and fix. Return the full updated BUILDCONTEXT.md."

---

## PART 1 — WHAT YOU ARE DOING AND WHY

You are updating the BUILDCONTEXT.md for a SaaS product called **Opsly**. The founder has identified gaps, ambiguities, and missing specifications that are causing AI agents (Google Antigravity) to make wrong assumptions during the build — like pulling financial data from Stripe instead of from the invoice database, adding debug labels to production UI, and producing animations that are flat and uninspiring.

**Your job is to apply every fix listed below to the existing BUILDCONTEXT.md without changing:**
- The product name, brand, or vision
- The tech stack choices
- The pricing structure or plan names
- The database schema
- The build order (Sections A through S)
- The founder's business model or target market

You are only ADDING clarity, FIXING ambiguities, and INSERTING missing specifications.

---

## PART 2 — CONFIRMED ISSUES TO FIX (apply all of these)

---

### FIX 1 — FINANCIAL CALCULATIONS: SOURCE OF TRUTH

**Problem:** The context never says where revenue, profit, and financial metrics come from. The AI agent assumed Stripe. Most contractors don't use Stripe and Stripe is optional. This broke the dashboard and reports for non-Stripe users.

**Fix:** Insert this as a new **Section 6A** immediately after Section 6 (AI Middleware):

---

**SECTION 6A — FINANCIAL CALCULATIONS: SOURCE OF TRUTH**

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

### FIX 2 — STRIPE CONNECT IS OPTIONAL: STATE THIS EXPLICITLY

**Problem:** Section 13-C (Onboarding) lists "Connect Stripe account" as Step 4 with a skip option, but nowhere else in the document does it say what happens if they skip. Other sections imply Stripe is required.

**Fix:** Add to the onboarding section (Section C in build order) and Section 3 (Tech Stack):

In Section 3 (Tech Stack), under "Payments within portals (B2C):", add:

> "Stripe Connect is OPTIONAL for every plan including paid plans. A contractor who only accepts cash, bank transfer, or cheque does not need to connect Stripe. Every invoicing, reporting, and financial feature works without it. Only the 'Pay Now' embedded payment link requires Stripe. The portal must never block, warn, or degrade functionality for clients who have not connected Stripe — except to hide the Pay Now button on invoices."

In Section 13-C (Onboarding Step 4), add:

> "If Step 4 is skipped: portal is fully functional immediately. No banner, no warning, no reduced access. A subtle 'Connect Stripe to accept online payments' prompt appears only in Settings → Connected Accounts. It does not appear on every page."

---

### FIX 3 — REMOVE ALL DEBUG/DEVELOPMENT UI LABELS FROM PRODUCTION

**Problem:** The Antigravity agent added debug labels ("System active", "Via Stripe", status indicators) to the production UI because the context never said to exclude them.

**Fix:** Add to Section 16 (Final Reminders for Antigravity) and Section 14 (Error Handling and UX Rules):

> "**NO DEBUG LABELS IN UI:** Never render development or status labels in any user-facing component. This includes: 'System active', 'Via Stripe', 'Connected', 'Ready', 'Initialized', API status badges, environment indicators, or any text that reflects internal system state. If you added these during development, remove them before completing any section. The only status indicators a user sees are product-relevant ones defined explicitly in this document (invoice status badges, job status, plan name in header, usage counter). Everything else is invisible to the user."

---

### FIX 4 — ANIMATION AND DESIGN SYSTEM: FULL SPECIFICATION

**Problem:** The current design section (Section 2) only lists colour tokens and vague descriptions like "micro-animations" and "200ms transitions." This is too vague — the agent produced flat, unanimated UI.

**Fix:** Replace the animation references in Section 2 with this full specification:

---

**ANIMATION SYSTEM — ADD THIS TO SECTION 2:**

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

### FIX 5 — RLS SECURITY: CRITICAL MISSING PATTERNS

**Problem:** Section 5 shows the basic RLS pattern but misses several critical production failures that cause data leakage in Supabase multi-tenant apps.

**Fix:** Add to Section 5 (Security Architecture):

---

**ADDITIONAL RLS REQUIREMENTS — ADD TO SECTION 5:**

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
-- Add for every table with client_id
```

**D. Test RLS from the client SDK, never the SQL Editor:**
The Supabase SQL Editor runs as a superuser and bypasses RLS entirely. All RLS tests must be done by making requests through the Supabase JS client with a real user JWT. Create a test user for Client A and a test user for Client B. Log in as Client A and attempt to query Client B's data. It must return zero rows, not an error — an error means RLS is blocking correctly; zero rows means isolation is working at the policy level.

**E. Supabase Storage buckets also need RLS:**
Every storage bucket (logos, receipts, signatures, documents, photos) must have storage policies that restrict access by `client_id`. A contractor must never be able to access another contractor's uploaded files by guessing the URL. Bucket names should not be guessable — use UUIDs in file paths: `{client_id}/{uuid}-{filename}`.

**F. Realtime subscriptions respect RLS — but you must verify:**
Supabase Realtime only sends events for rows the user can access under RLS. However, if a table's SELECT policy is misconfigured, realtime will broadcast other clients' data. Test realtime subscriptions with two different client sessions open simultaneously. Client A's updates must never appear in Client B's subscription.

---

### FIX 6 — AI COMMAND BAR: DESIGN AND BEHAVIOUR GAPS

**Problem:** The AI command bar is described as "the hero" but has no visual specification beyond "fixed at bottom." The agent built a basic textarea.

**Fix:** Add to Section E (AI Command Bar) in the Build Order AND reference from Section 2:

---

**AI COMMAND BAR — FULL DESIGN SPECIFICATION:**

**Visual anatomy:**
```
[ 🎙️  Type a command... (placeholder text cycles)      [↑ Send] ]
       ← input area, flex-grow →                        ← button →
```
- Container: `max-width: 680px`, `margin: 0 auto`, `position: fixed`, `bottom: 24px`, `left: 50%`, `transform: translateX(-50%)` on desktop
- On mobile: `position: fixed`, `bottom: 0`, `left: 0`, `right: 0`, `border-radius: 16px 16px 0 0`, `padding-bottom: env(safe-area-inset-bottom)` (handles iPhone home bar)
- Background: glass-card style (see glassmorphism spec above)
- Border: `1px solid rgba(124, 106, 255, 0.2)` at rest, `1px solid rgba(124, 106, 255, 0.5)` on focus
- Input field: `background: transparent`, `border: none`, `outline: none`, `color: --text-primary`, `font-size: 15px`, `line-height: 1.5`, max height before scroll: 120px (auto-grow up to this)
- Send button: circle, 36px × 36px, `background: --accent-primary`, icon is an upward arrow SVG. Disabled (greyed out) when input is empty. Active: purple. Animates on press (see button animations above).
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

### FIX 7 — INVOICE MODULE: MISSING EDGE CASES

**Problem:** The invoice builder is well specified but missing several edge cases that will break real-world usage.

**Fix:** Add to Section 9 (Invoice Builder):

---

**INVOICE EDGE CASES — ADD TO SECTION 9:**

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

### FIX 8 — PWA AND OFFLINE: MISSING CONFLICT RESOLUTION

**Problem:** Section 12 says "queue offline actions and sync on reconnect" but never explains what happens when an offline action conflicts with an online change.

**Fix:** Add to Section 12 (Mobile and PWA):

---

**OFFLINE SYNC CONFLICT RESOLUTION — ADD TO SECTION 12:**

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

### FIX 9 — MULTI-CURRENCY EDGE CASES

**Problem:** Section 7 defines currency detection but doesn't handle partial payments, currency display, or what happens with existing data when currency is locked.

**Fix:** Add to Section 7 (Geolocation and Pricing):

---

**CURRENCY DISPLAY RULES — ADD TO SECTION 7:**

- All monetary values are stored in the database as integers (cents/paise) to avoid floating point errors. E.g., $1,200.50 is stored as `120050`. Divide by 100 for display.
- The currency symbol and formatting for a client's invoices comes from their `clients.currency` and `clients.currency_symbol` fields, set at signup.
- A US client's invoices always show USD even if the owner is viewing from a different country.
- The owner's own Opsly subscription price (shown in billing/settings) is always in their locked billing currency, never converted in real time.
- Never show two currencies on the same screen. The entire portal operates in the client's business currency.
- If a client has no currency set (legacy or error), default to USD display without crashing.

---

### FIX 10 — AI MIDDLEWARE: MISSING GUARDRAILS

**Problem:** Section 6 defines the AI middleware flow but is missing several real-world guardrails that will cause problems at scale.

**Fix:** Add to Section 6 (AI Middleware):

---

**ADDITIONAL AI MIDDLEWARE RULES — ADD TO SECTION 6:**

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

### FIX 11 — ONBOARDING FLOW: MISSING STATES

**Problem:** Section 13-C defines onboarding steps but doesn't handle the case where a user drops off mid-onboarding, or what happens on returning to an incomplete onboarding.

**Fix:** Add to Section 13-C:

---

**ONBOARDING PERSISTENCE — ADD TO SECTION C:**

- Onboarding progress is saved to the database after each completed step (store `onboarding_step_completed: 1/2/3/4` in the `clients` table)
- If a user closes the tab mid-onboarding and returns, they land on the NEXT incomplete step, not step 1
- The portal is accessible immediately after email verification — the onboarding wizard appears as a dismissible overlay, not a blocking gate
- If onboarding is dismissed early, a persistent (but subtle) "Finish setting up your account" card appears on the dashboard until all steps are complete
- Step completion is not reversible in the UX (can't go "back" — changes are saved to DB immediately). To change logo, use Settings.

---

### FIX 12 — PLAN ENFORCEMENT: MISSING DOWNGRADE LOGIC

**Problem:** The context defines plan limits but never specifies what happens when a client downgrades (e.g., Growth → Starter) and their usage exceeds the lower plan's limits.

**Fix:** Add to Section 8 (Plan Structure):

---

**PLAN DOWNGRADE RULES — ADD TO SECTION 8:**

When a client downgrades to a lower plan:
- **CRM contacts over the new limit:** Existing contacts are NOT deleted. They become read-only with a banner: "Your plan allows 3 contacts — upgrade to access all [47] contacts." The client can still view all contacts but cannot create new ones until they are within limit or upgrade.
- **Features no longer available:** Disappear from the sidebar immediately. Any data associated with those features (SMS history, documents, sequences) is retained in the database but inaccessible until they upgrade again.
- **AI command limit:** Resets to the new plan limit on next billing cycle. Existing overage charges from the higher plan are billed at the old plan's overage rate for that period.
- **Storage over new limit:** Existing files are NOT deleted. New uploads are blocked with: "You've exceeded your [2GB] storage limit — upgrade or delete files to continue uploading."
- **Users over new limit:** Existing users are NOT removed. They keep access until the next billing cycle, at which point an email is sent: "Your plan allows 1 user — please remove additional users or upgrade within 7 days."

---

### FIX 13 — DATA EXPORT AND ACCOUNT DELETION: GDPR GAPS

**Problem:** Section 5 mentions data export and deletion but gives no technical specification.

**Fix:** Add to Section 5 and Section 13-S (Settings):

---

**DATA EXPORT SPECIFICATION — ADD TO SECTION 5:**

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

**Account deletion:**
- 30-day notice period. Account is suspended (login still works, no data visible) for 30 days, then all data is permanently deleted.
- During the 30-day window, the client can cancel the deletion by logging in and clicking "Cancel Deletion"
- An automatic email is sent at 1 day before permanent deletion as a final warning
- After deletion: all rows with that `client_id` are deleted from every table. Storage files are deleted from Supabase Storage. Stripe Connect account link is revoked.

---

### FIX 14 — NOTIFICATIONS: COMPLETELY MISSING

**Problem:** The context has a "Notification preferences" item in Settings but zero specification for what notifications exist, how they're delivered, or what they look like.

**Fix:** Add as a new Section between 12 and 13:

---

**SECTION 12A — NOTIFICATIONS SYSTEM:**

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

## PART 3 — DESIGN SYSTEM COMPLETENESS CHECKLIST

After all fixes are applied, verify the context includes clear answers to all of these. If any are missing, add them:

- [ ] What font weights are used? (Answer: Inter 400 for body, 500 for labels, 600 for headings, 700 for metric numbers)
- [ ] What is the base font size? (Answer: 14px base, 15px for inputs and command bar, 13px for secondary labels)
- [ ] What is the border radius on every element type? (Answer: Cards: 16px. Inputs: 10px. Buttons: 8px. Badges: 999px. Modals: 20px. Bottom sheet: 20px top only.)
- [ ] How do tables look? (Answer: No outer border. Row dividers: 1px `--border-subtle`. Header row: `--bg-tertiary` background, 12px uppercase letter-spacing 0.05em text in `--text-muted`. Alternating row shading: none — use hover state only.)
- [ ] What does a selected/active state look like on sidebar items? (Answer: Left border 3px `--accent-primary`, background `rgba(124, 106, 255, 0.1)`, text `--text-primary`. Icon fills to `--accent-primary`.)
- [ ] Loading states for data-heavy pages? (Answer: Skeleton screens only — no spinners. Skeleton matches the exact layout of the real content it replaces.)

---

## PART 4 — WHAT GEMINI MUST NOT CHANGE

Instruct Gemini clearly:

1. Do NOT change the product name, logo concept, or brand
2. Do NOT change any pricing numbers
3. Do NOT change the tech stack (React, Supabase, Claude API, Resend, Telnyx, Paddle, Vercel, Cloudflare)
4. Do NOT change the build order (Sections A through S)
5. Do NOT change the database table names or core schema
6. Do NOT add features that aren't described in these fixes
7. Do NOT add Next.js — the stack is React with Tailwind, deployed on Vercel
8. Do NOT change the colour tokens
9. Do NOT change the competitor analysis or positioning in Section 15
10. Do NOT add TypeScript — the context does not specify it. Leave the language unspecified (let the agent decide)

---

## PART 5 — INSTRUCTION TO GEMINI

**Exact instruction to paste before this document:**

> "I am giving you a set of corrections and additions to apply to my existing BUILDCONTEXT.md for a SaaS product called Opsly. Apply every fix listed under PART 2 and PART 3 into the appropriate sections of the BUILDCONTEXT.md. Insert new sections where indicated. Expand existing sections where indicated. Do not remove any existing content unless a fix explicitly says to replace something. Do not change anything listed under PART 4. Return the complete updated BUILDCONTEXT.md as your response. Do not summarise — return the full document."

---

*End of prompt. Feed PART 5's instruction first, then this entire document, then the original BUILDCONTEXT.md.*
