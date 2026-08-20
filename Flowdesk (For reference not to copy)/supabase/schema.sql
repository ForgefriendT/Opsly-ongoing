-- Drop existing tables if they exist (for clean start/reset)
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

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
  client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
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
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_id  UUID REFERENCES invoices(id) ON DELETE SET NULL, -- set when billed
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
  client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
  template_type TEXT NOT NULL, -- nda | service_agreement | freelance_contract | payment_terms | scope_of_work
  title         TEXT NOT NULL,
  content       JSONB NOT NULL,  -- filled template fields
  pdf_url       TEXT,            -- Supabase storage
  status        TEXT DEFAULT 'draft', -- draft | sent | signed
  created_at    TIMESTAMPTZ DEFAULT now()
);


-- =========================================================================
-- PERMISSIONS: Disable RLS and grant full access to anon/authenticated roles
-- (FlowDesk is a solo-user tool — no multi-tenant RLS needed)
-- =========================================================================
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

GRANT ALL ON clients TO anon, authenticated;
GRANT ALL ON invoices TO anon, authenticated;
GRANT ALL ON invoice_items TO anon, authenticated;
GRANT ALL ON expenses TO anon, authenticated;
GRANT ALL ON time_entries TO anon, authenticated;
GRANT ALL ON documents TO anon, authenticated;

-- =========================================================================
-- SEED DATA (Matching flowdesk_design_system_v2.html mockup)
-- =========================================================================

-- Seed Clients
INSERT INTO clients (id, name, email, phone, company, address, country, currency, status, tags, total_billed) VALUES
('a1111111-1111-1111-1111-111111111111', 'Sofia Reyes', 'sofia@reyes.co', '+91 98765 43210', 'Reyes Digital', '12 Barakhamba Rd, New Delhi', 'India', 'INR', 'active', ARRAY['retainer', 'ui-ux'], 124000),
('b2222222-2222-2222-2222-222222222222', 'Marcus Klein', 'marcus@klein.studio', '+1 555-0199', 'Klein Studio', '742 Evergreen Terrace, Springfield', 'USA', 'USD', 'lead', ARRAY['design', 'branding'], 32500),
('c3333333-3333-3333-3333-333333333333', 'Aiko Nakamura', 'aiko@nakamura.co', '+81 90-1234-5678', 'Nakamura Co.', 'Shibuya 2-chome, Tokyo', 'Japan', 'JPY', 'active', ARRAY['development'], 87200);

-- Seed Invoices
INSERT INTO invoices (id, invoice_number, client_id, status, issue_date, due_date, currency, subtotal, tax_rate, tax_amount, discount, total, notes, payment_terms, paid_at) VALUES
('e1111111-1111-1111-1111-111111111111', 'INV-2026-012', 'a1111111-1111-1111-1111-111111111111', 'paid', '2026-05-15', '2026-06-15', 'INR', 18000, 0, 0, 0, 18000, 'Thank you for your business.', 'Net 30', '2026-05-20 10:00:00+00'),
('e2222222-2222-2222-2222-222222222222', 'INV-2026-011', 'b2222222-2222-2222-2222-222222222222', 'pending', '2026-06-01', '2026-06-30', 'USD', 32500, 0, 0, 0, 32500, 'Branding kit deliverables.', 'Net 30', NULL),
('e3333333-3333-3333-3333-333333333333', 'INV-2026-009', 'c3333333-3333-3333-3333-333333333333', 'overdue', '2026-04-01', '2026-05-01', 'JPY', 15700, 0, 0, 0, 15700, 'Development sprint 1 revisions.', 'Net 30', NULL);

-- Seed Invoice Line Items
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, sort_order) VALUES
('e1111111-1111-1111-1111-111111111111', 'UI/UX Design Consultation', 1, 18000, 0),
('e2222222-2222-2222-2222-222222222222', 'Brand Strategy & Identity Design', 1, 32500, 0),
('e3333333-3333-3333-3333-333333333333', 'Frontend Revisions', 1, 15700, 0);

-- Seed Expenses
INSERT INTO expenses (description, amount, currency, category, date, notes) VALUES
('Figma Pro annual subscription', 5600, 'INR', 'software', '2026-06-01', 'Yearly subscription for design team work'),
('Client lunch — Sofia Reyes (Reyes Digital)', 2400, 'INR', 'other', '2026-06-01', 'Discussing next quarter roadmap deliverables'),
('AWS Cloud Server Hosting', 4500, 'INR', 'software', '2026-05-28', 'Monthly backend services billing'),
('Vercel Pro Team Seat', 1700, 'INR', 'software', '2026-05-25', 'Frontend deployment features');

-- Seed Time Entries
INSERT INTO time_entries (client_id, description, date, hours, rate, billed) VALUES
('a1111111-1111-1111-1111-111111111111', 'UI Review call & feedback sync', '2026-06-02', 1.5, 1500, false),
('c3333333-3333-3333-3333-333333333333', 'CSS alignment and mobile responsiveness revisions', '2026-06-02', 3.0, 1200, false);

-- Seed Documents
INSERT INTO documents (client_id, template_type, title, content, status) VALUES
('a1111111-1111-1111-1111-111111111111', 'nda', 'NDA - Sofia Reyes (Reyes Digital)', '{"party_name": "Reyes Digital", "date": "2026-06-01", "duration": "2 Years"}'::jsonb, 'signed');
