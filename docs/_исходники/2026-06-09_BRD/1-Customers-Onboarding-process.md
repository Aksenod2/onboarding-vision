---
source: Confluence "1D - 1. Customer's Onboarding process", получено 2026-06-09
type: исходник (raw, verbatim; дубль таблицы документов Appendix 4 — ссылкой на 1.1 Appendix 2)
---

# 1D - 1. Customer's Onboarding process

- [Business Overview]
- [Onboarding Process] / [Modes of Onboarding] / [To-Be Process]
- [Prospect Onboarding Sub-process] / [Bank Verification Sub-Process]
- [CKYC Registry check] / [Pan validation during VCIP session] / [BGV Check]
- [Appendix 1-4]

Business Overview
Current Customer Onboarding process involves manual form filling by the prospect/RM, manual verification of documents by the branch, manual risk assessment, physical background verification check etc. The overall process from initiating Customer application to successful account opening takes around 5 to 7 days. The objective is to reduce TAT to 1-Day via automation.
This process covers onboarding for the legal entity types below — auto population of documents/data, verification against registry and screening. Delineates which scenarios qualify for STP and which require hybrid.
| Legal Entity Types | Details | Links |
| --- | --- | --- |
| Public Limited Company / Private Limited Company | Verification of entity details against registries, identification & verification of directors and authorized signatories, validation of Directors against Board Resolution, and UBO identification. | 1D - 1.2 |
| Partnership / LLP | Verification of partnership/LLP registration details, validation of partnership deed or LLP agreement, identification & verification of partners and authorized signatories, beneficial ownership assessment. | 1D - 1.3 |
| Sole Proprietorship | Verification of the proprietor's identity against registry, validation of business existence and required verification checks. | 1D - 1.4 |
# Modes of Onboarding
(идентично 1.1: Fully Digital (STP) / Hybrid / Offline — те же описания и условия применимости.)
## Existing Process
Manual data collection/validation across systems; sequential & partly manual regulatory checks (KYC, sanctions, FATCA/CRS, UBO); multiple manual review/approval cycles (CRM, Ops, Compliance). Confluence: OBO- Online Bank Onboarding Process(MVP); 7.8.6 Customer Journey Map - New Onboarding (Offline).
# To-Be Process
Comprehensive view: customer initiation, data capture, document submission → verification, screening, approval → account creation in CBS.
**Process Description**
| Process | Description | Link |
| --- | --- | --- |
| CRM | **Offline Onboarding:** collect docs, forward to DVU Manager. **Current Account opening not available (CRILC fail):** contact customer, explain options (export/import or collection account per credit exposure), record decision. **Onboarding not available:** if Sber cannot open any account (OFAC list) → RM contacts customer, discuss other options | 1D - 4. CRM part of E2E |
| Self or Assisted Registration | **Self:** prospect initiates via website, authenticates, sets login, completes CAF, uploads docs, submits. **Assisted:** CRM initiates invite via email, prospect authenticates & sets login, then CAF. **Offline:** physical documents and forms. | Unified Login- Self/Assisted Registration |
| CAF | Submission & handling of Current Account opening form: customer completion of Bank-provided form, supporting docs, validation of completeness/correctness, exception handling. | OBO |
| Operating Instructions / Board Resolution / Authority Letter | Screen to capture Operating instructions + mandatory details for BR/Authority Letter **or** option to upload Company's own BR | 1D - 6 |
| Risk Categorization | Algorithm assesses risk profile from business nature questionnaire, legal entity type, risk factors, profile, segment. Low/Medium/High. High Risk → industry-specific license + CRM Head approval mandatory. High Risk industries in Appendix 3. | 1D - 5 (WIP) |
| VCIP (eKYC and VKYC) | Digital CDD per RBI; real-time remote identity verification via secure consent-based video. | 1D - 2 |
| DVU Process and Exception Case handling | Alerts: continue offline account opening; verify Caldera Customer Card (autocheck failed); CRILC > limit & LEI not fetched; verify VCIP videos; verify 3rd party BGV; process data change request; account activated; net-banking access per BR; Duplicity check (review existing CIF/PIF); Sanctions list → DVU → Compliance | 1D - 3 |
## Prospect Onboarding Sub-process
| Step | Process Stage | Step Description | Action / System Activity | Owner |
| --- | --- | --- | --- | --- |
| 01 | OBO Self Registration | Customer initiates via online channel | Self-registration + basic details | Customer |
| 01a | Offline Initiation (CRM) | RM initiates for offline | RM collects docs per checklist, uploads | RM / CRM |
| - | Alert to DVU (Offline Flow) | Case routed for verification | System triggers alert to DVU | System |
| 02 | Initial KYC Check (PAN) | PAN-based validation | System validates PAN + initial KYC screening | System |
| - | Alert to CRM | Notification for next steps | System notifies CRM | System |
| 03 | OBO Questionnaire to Obtain BR/ Operating Instructions | Capture operating instructions + AS details | Customer provides AS / operating instructions | Customer |
| 04 | Business Nature Questionnaire | Capture to identify risk weightage (Low/Med/High) | Customer fills business nature + profile | Customer |
| 05 | Auto Data Population | Entity data fetched automatically | System auto-populates LE details via PAN/GSTIN | System |
| 06 | Data Correction | Customer updates incorrect details | Customer edits + uploads supporting docs | Customer |
| 07 | Data Confirmation | Confirm filled data (DVU) or auto-populated data (registry) | System displays; customer confirms → 08 else 07 | Customer |
| 08 | VCIP Link Initiation | VCIP link shared with AS | System sends VCIP link | System / Customer |
| 09 | VCIP Session | eKYC+VKYC: each AS receives link to sign/authorize/perform Video KYC | AI-assisted VCIP | Customer / System |
| 12 | KYC Auto Checks | Backend verification | System performs AML/sanctions/CKYC validations | System |
| - | Alert to DVU | Exception handling | System routes failed/exception to DVU | System |
| DVU | DVU Sub-process | Manual verification and review | DVU reviews docs, resolves discrepancies | DVU Team |
| 10 | CBS Product Opening | Account creation, NB credentials auto-generated (online) with prospect consent, product in freeze mode | System creates login, opens account, checks if BGV required | System |
| 11 | CBS Product Activation | Activation on initial deposit; if BGV required → complete BGV | System activates + enables services | System |
| End | Completion | Onboarding completed | Account active | System |
## Bank Verification Sub-Process
Includes: Initial Auto-Screening; CKYC Register check.
### Initial Auto Screening
Validate PAN with authoritative sources; screening against internal/external watchlists, NCC/DIT, CRILC and risk databases; identify alerts/matches/discrepancies for proactive risk identification → DVU/Compliance where required.
**Process Description - PAN Auto Screening**
| Step | Process Step | Description | Next Step/ Action |
| --- | --- | --- | --- |
| 01 | Enter PAN | Prospect/RM enters PAN number | 02 |
| 02 | Prospect Consent for fetching data + Initial Screening | Customer consents; system screens & retrieves from NSDL (PAN), OFAC (sanctions), CRILC (credit exposure), Probe42 (entity data), NCC/DIT (mobile/email), MCA (company data) | Parallel validation 03, 04, 05 |
| 03 | Data Auto-Population (Probe42) | Auto-populate entity/customer details via Probe42 | If available → proceed; if not → Alert DVU |
| 04 | CRILC Check | CRILC check for existing credit exposure / risk indicators | (если exposure …) |
**Process Description - CKYC Registry**
| Step | Process Step | Description | Next Action |
| --- | --- | --- | --- |
| 00 | Initiate Auto Check | System checks if customer/entity data exists in CKYC registry | Proceed to availability check |
| 01 | CKYC Data Availability Check | Verify if CKYC record available | If Yes → 02; If No → Alert DVU |
| 02 | Validate Against CKYC Record (Level 1) | Validate details against CKYC data | Proceed to match validation |
|  | Match Validation | Check if input data matches CKYC records | If Yes → 03; If No → Alert DVU |
| 03 | Validate Against data populated against registry | Additional validation layer | If successful → Validation Pass |
|  | Validation Pass | CKYC validation complete via automated checks | Proceed with onboarding |
| 01a | Alert DVU (Exception Handling) | CKYC data not available or mismatch → alert DVU | DVU initiates manual process |
| 01b | DVU Login to CKYC Portal | DVU logs in to handle exceptions | Proceed to data update |
| 02b | Update CKYC Data / Upload doc | DVU updates/uploads data/doc (new record or modify) | Proceed to CKYC number generation |
| 03b | Generate CKYC Identifier | System/CKYC generates 14-digit CKYC number | Notify customer |
| 04b | Notify Customer | Customer informed about CKYC record creation/update + number | End |
### Pan validation during VCIP session
| Step | Process Step | Description | Next Step |
| --- | --- | --- | --- |
| 01 | PAN Capture during VCIP | AS displays PAN card (front) during VCIP per AI agent instructions | OCR/AI recognition |
| 02 | OCR/AI Recognition | OCR/AI extraction of PAN details | If success → PAN validation; if failed → Alert DVU |
| 03 | PAN Validation against BR | Extracted PAN validated against Board Resolution / submitted records | If match → complete; if mismatch → Alert DVU |
| 04 | PAN Validation against NSDL | Extracted PAN validated against NSDL | If match → complete; if mismatch → Alert DVU |
| 05 | Exception Handling | Recognition failure/mismatch → DVU manual verification | DVU verifies/updates status |
| 06 | Validation Outcome | On successful PAN match with BR → validation success, recorded | Next onboarding step |
### BGV Check
BGV criteria: perform only for new/suspicious company. Good track record + Listed company → physical BGV eliminated. Right now BGV mandatory for all new clients; suggest skipping for low-risk per 1D-3.1. BGV driven by predefined risk criteria; decision flow for initiating/performing/completing prior to activation. See BGV Decision Matrix (1D-3.1).
**Note для STP:** customers manually fill attributes below, rest auto-populated from registry.
| | Entity: Attributes Manually filled by Customer for STP | Data entry | Section |
| --- | --- | --- | --- |
| 1 | PAN Number | Manual input | Main section of Company's details |
| 2 | Correspondence address (only if different from Registered) | Manual input | Main section |
| 3 | Cheque book (Y/N) | Yes/No radio | Additional Section |
| 4 | Business Industry /Segment | radio | Business Nature Questioner |
| 5 | Residency Status of Authorised Signatories | radio | Business Nature Questioner (FATCA) |
| 6 | PEP | radio | Business Nature Questioner |
| | Individual: Attributes Manually filled by Customer for STP | Data Entry | Section / Details |
| --- | --- | --- | --- |
| 1 | Correspondence address | Manual input | VCIP Section — only if different from Registered |
| 2 | Authorized Signatory Email ID | Manual input | BR/Authority Letter — if AS is one from Probe42; otherwise asking PAN, Name, Designation |
| 3 | Authorized Signatory Phone Number | Manual input | BR/Authority Letter — same condition |
| 4 | Governance for Authorized Signatory changes | Drop Down | BR/Authority Letter — Rights/Permissions for AS |
**Note для STP — documents manually uploaded:** 1) Partnership deed (Partnership firm); 2) Board Resolution/Authority Letter (Company, LLP, Partnership); 3) Photo of PAN card of individual during VCIP.
# Appendix 1 — Abbreviations
CRM (Customer Relationship Manager); CAM (Customer Account Management); CAF (Current Account Application Form); DVU (Data Verification Unit); OFAC (Office Of Foreign Asset Control); PAN; Prospect; TAT (Turn Around Time).
# Appendix 2 — Attributes for CAM - Opening an Account (4000 or 4500)
For Customer with status "Completed": CIF number (Auto Generate); Customer Name (Auto Populate); Customer Type Corporate (Auto Populate); Branch (Auto Populate); Product Name Current Account (Auto Populate, editable dropdown); Account Class (4000/4500, auto per Product Name); Currency INR (default); CRILC Control / LO / BO / PO account (radio, one; CRILC Control only if 4000); Operational Mode for Collection Account (auto per Exposure from CRILC); Account Description (= Customer Name, editable); Account Type Single/Joint (dropdown from Operating Instructions/BR); Mode of Operation (dropdown from BR). **CRILC Data (only if CRILC selected):** Total Exposure (free text); Fund Based Exposure (free text); Check Date (auto per CRILC checked date); Next Update Date (auto = +183 days); Sber total exposure; Sber Fund Based Exposure. **Settlement Instruction (only if CRILC):** Name (auto); Account Number; IFSC; Bank Name (auto from IFSC); Branch (auto from IFSC); Instruction Date; Termination Date; Creation Date (system date). **Nominee Info:** First/Last Name; DOB; Gender; Address; Pin Code; Mobile; Email. **Guardian (minor only):** Guardian First/Last Name; Address.
# Appendix 3 — List of HIGH Risk Categorized Industries
International Job placement agencies; Tobacco; Casinos and gaming establishments; Night Club; Arms; Antiques; Explosives; Embassies; Consulates; Online Lotteries; Telemarketers; Offshore entities; FFMC; Share broker; NBFC; Liquor; Precious metals and gems trading (gold, silver, diamonds, bullion houses); Arms and ammunition dealers; Nuclear energy and related consulting; Money changers / remittance service providers; Virtual asset service providers (crypto exchanges, wallets).
# Appendix 4 — Documents for Entity
Полная таблица (Document Name | Applicable Entity Type | Probe | Mandatory | STP | Hybrid | Offline | Verification | Conditions) — **идентична Appendix 2 в 1.1-SOP** с добавленной колонкой Probe: Board Resolution/Authority Letter+Senior Mgmt Declaration (Company/LLP/PF, Probe N); Entity PAN (All, Probe Y); Certificate of Incorporation (Company & LLP, Probe Y); MOA & AOA (Company, Probe Y); Share holding Pattern (Company, Probe Y); Complete Chain of LLP agreement/Partnership Deed (LLP/PF — Probe Y for LLP, N for Partnership); Partnership Registration Certificate (LLP/PF — Probe Y for LLP, Y for Partnership if registered); Address Proof (SP 1st/2nd full lists); IEC (Optional, Probe N); GST Certificate (>= INR 60 lakhs & >6мес); Entity FATCA. См. 1.1-SOP-Corporate-Customer-Onboarding.md → Appendix 2.
