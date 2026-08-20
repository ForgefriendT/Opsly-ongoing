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
