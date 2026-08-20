# Task: Phase 13 — Estimate Approval Wizard, Pro Upsell Gating, and AI Web Search

- [ ] Implement Estimates list mobile card layout (`block md:hidden`) and hide table view (`hidden md:block`) in `App.jsx`.
- [ ] Upgrade dashboard buttons in `App.jsx`, `InvoiceBuilder.jsx`, `EstimateBuilder.jsx`, and `CustomConfirmModal.jsx` to `rounded-xl` and hover/active scales.
- [ ] Create `PlanUpgradeModal.jsx` in `src/components/Billing/` for upselling and upgrading to the Pro plan ($199/mo).
- [ ] Create `EstimateWizardModal.jsx` in `src/components/Estimates/` for guiding estimate processing.
- [ ] Remove automatic invoice creation from `EstimatePortal.jsx`.
- [ ] Integrate both modals, state hooks, and AI action listeners into `App.jsx`.
- [ ] Implement `searchWeb` and Claude prompt injection in `aiMiddleware.js`.
- [x] **Phase 2: Documents & Contracts Module**
  - [x] Build templates library (Roofing, Landscaping, Cleaning, HVAC, Painting)
  - [x] Add contract builder fields and PDF preview/generation
  - [x] Create manual upload (PDF/DOCX) interface with expiry dates and dashboard alert metrics
  - [x] Add Scope of Work & Change Order tracker with timestamped approval flow
  - [x] Implement post-completion Warranty PDF auto-generator
- [ ] Verify the build compiles and runs successfully.
