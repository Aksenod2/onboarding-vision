---
source: Confluence "1D - 5. Risk Categorization (Business Nature Questionnaire) (WORK IN PROGRESS)", получено 2026-06-09
type: исходник (raw, verbatim; шаблоны A/B/C сведены к ключевым таблицам)
---

# 1D - 5. Risk Categorization (Business Nature Questionnaire) (WORK IN PROGRESS)

# Business Objective
Automatically determine the risk category of a prospective corporate client during onboarding, based on objective data from Probe42 and a Business Nature Questionnaire (BNQ), to assign one of three onboarding tracks. The algorithm applies only to new customer onboarding (not re-KYC recategorization). For re-KYC: Product Subscription, Account Vintage, Account Status, AML alerts (CTR, STR) assessed.
Client indicates company type → completes BNQ A (Sole Proprietorship) / B (Partnership Firm) / C (Company Entity Types).
**Structure:** Block 1 — Questions for Risk Categorization (Q1–5), used for automatic scoring. Block 2 — Additional Questions (Q6–10), collect product interest & import/export info, do not affect final score.

| # | Attribute | Source | Alternative Source | Stage | Description |
| --- | --- | --- | --- | --- | --- |
| 1 | Constitution | Screening by PAN | — | Autoscreening by PAN | On entering PAN, auto-screening across registries incl. Probe42 → determine constitution type & assign Risk Weight by legal entity type. Also determines which BNQ (A/B/C). |
| 2 | Business Segment | Probe42 → User confirms | User selects in BNQ | BNQ | Fetch from Probe42; user confirms or selects from dropdown. For certain industries — upload Business License. |
| 3 | Company Vintage | Probe42 | User enters DOI in BNQ | BNQ | DOI from Probe42 → months since registration → Risk Weight. |
| 4 | Company Residency | Probe42 (Registered address) | User selects in BNQ | BNQ | From registered address determine if registered in India. |
| 5 | Individual Residency | Board Resolution + BNQ | User selects in BNQ | BR + BNQ | Probe42 has no signatory residency; from BR list of signatories, user indicates residential status per signatory. |
| 6 | PEP Status | BNQ | User selects in BNQ | BNQ | Probe42 no PEP status; ask if signatories & close relatives are PEPs. |
| 7 | Net Revenue | Probe42 | User selects in BNQ | BNQ | Net Revenue last 3 years from Probe42; if not available dropdown. |
| 8 | Economic profile | Digital BR (Probe42) or Customer BR | — | BR | For signatory whose designation not in Probe42 or added manually, user specifies Economic Profile in BNQ. Options vary by company type. |

# Risk Assessment Logic
**Risk Score = kyc_constitution + kyc_bus_segment + w_vintage + w_company_residency + kyc_nationality + kyc_exposed_person + kyc_econ_profile + net_revenue**
Minimal Score (all 1) = 8; Maximum (all 3) = 24.
| Variable | Source | Risk Score Range |
| --- | --- | --- |
| kyc_constitution | PAN screening | 1, 2, 3 |
| kyc_bus_segment | Q1 | 1, 2, 3 |
| w_vintage (DOI) | Q2 | 1, 2, 3 |
| w_company_residency (new) | Q3 | 1 or 3 |
| kyc_nationality | Q4 | 1, 2, 3 |
| kyc_exposed_person | Q5 | 1 or 3 |
| kyc_econ_profile | Q6 | 1, 2, 3 |
| net_revenue | Q7 | 1, 2, 3 |
| Total Score | Risk Level | Action |
| --- | --- | --- |
| 8 -12 | 1 Low Risk | STP process |
| 13 -17 | 2 Medium Risk | Hybrid or Offline Process |
| 18 - 24 | 3 High Risk | Offline Process, EDD |
**Если любой из вопросов = Risk Score 3 → Risk Category High, alert в Compliance queue:**
1. Q2 (Business Segment) score 3 → Compliance, Verify business license.
2. Q4 (Company Residency) score 3 → Compliance (FEMA review).
3. Q5 (Individual Residency) score 3 → Compliance review, Trigger for FATCA.
4. Q6 (PEP Status) score 3 → Compliance review of peps, Managerial decision.

# Risk Weight Matrix
| # | Attribute | Weight 1 (Low) | Weight 2 (Medium) | Weight 3 (High) |
| --- | --- | --- | --- | --- |
| 1 | Constitution | Individual, HUF, Sole Proprietorship, Partnership, Public Ltd, Private Ltd, LLP, Government Department, Statutory Body, Local Authority, Foreign Bank | — | Trust, Charity, NGO, Bullion Dealers and Jewelers, Associations, Clubs, Other |
| 2 | Business Segment | Employee, Government Department, Government Owned Company, Regulatory & Statutory Body, Banking, Manufacturing | Advertising, Aviation, Ports & Shipping, Clearing, Consulting, Construction, MRO, Oil & Gas, Trading, Tourism & Hospitality, Diplomat, ITES, Fintech & Financial Services | International Job placement agencies, Tobacco, Casino, Night Club, Arms, Antiques, Explosives, Consulates, Online Lotteries, Telemarketers, Offshore entities, FFMC, Share broker, NBFC, Liquor, Gems and Jewellery, Other |
| 3 | Company Vintage | >1 year | 6 months – 1 year | <6 months |
**Company Residency:** Indian resident → (1); foreign resident outside India → 3. **Individual/Tax residency:** Indian National / Foreign national on employment VISA → 1; NRI, OCI card holder, Foreign national of RF not on employment VISA → 2; Foreign national other → 3. **PEP:** Yes → 3 (alert DVU-Compliance, Name Screening); No → 1. **Net Revenue:** from Probe42 if available, else dropdown.
**Additional (no score):** Product Interest (credit facilities next 6 months → alert CRM; approximate amount); Import/Export Activity (export only / both import & export / none; partner countries; IEC disclaimer — Upload Now → KYC records + DVU check / Upload Later → Online Bank request after account opening, FEMA).

# BNQ Templates
- **A — Sole Proprietorship:** см. отдельный файл проекта `docs/BNQ Template A — Sole Proprietorship.md` (если есть) / структура как у B/C без партнёров.
- **B — Partnership Firm:** Business Segment (Probe42 Main Activity Group); Company Vintage; Company Residency; Individual Residency (me & partners Indian tax residents → 1 / some foreign → 3); PEP (partners/UBO/AS & relatives); Economic Profile per partner (Employee/Partner → 1; Student/Minor → 2; Sleeping Partner/Other → 3); Net Revenue; Credit Exposure (CC/OD availed: >10cr / <10cr / no — to understand available account type); Product Interest; Import/Export.
- **C — Company Entity Type:** аналогично B, Economic Profile options: Employee/Director/Company Secretary/Authorised Signatory/UBO → 1; Student/Minor → 2; Other → 3.
