---
source: Confluence "1D - 6. Operating Instruction Form (BoardResolution) vs role model in Internet Banking", получено 2026-06-09
type: исходник (raw, verbatim; юридические тексты BR/Authority Letter сведены к структуре + ключевым формулировкам)
---

# 1D - 6. Operating Instruction Form (BoardResolution) vs role model in Internet Banking

Business Overview
The Bank faces inconsistencies between physical Board Resolution (BR) documents submitted by customers and the role/operation model configured in Internet Banking. Proposed: a Bank-defined, unified **Operating Instruction Declaration**, aligned with the intent of the company's Board Resolution, applicable across all onboarding channels (online and offline). Serves as standard authorisation & operating instruction for digital and offline account opening, aligned with the Bank's Net Banking Role and Operation Model. Aims: eliminate inconsistencies; avoid discrepancies between BR document and Online Banking configurations.

| Type of Entity | Operating Instruction vs Roles in Internet Bank | Who has to Sign the Operating Instruction (BR) | Who has to pass the VCIP |
| --- | --- | --- | --- |
| Public Company / Private Company | Only one Single Authorized Signatory with Admin role in Internet Bank | In case of 5 Directors → Minimum 2 directors sign required on BR / Company Secretary (Singly) / Managing Director; authority to sign BR verified against Probe42 | Authorized Signatory Person who signed the BR |
| Partnership / LLP | Several Authorized Signatories with Admin role: 1 Partner = 1 Admin role in Internet Bank | All Partners | All Partners |
| Sole Prop | Admin role in Internet Bank | Proprietor | Proprietor |

Probe42 directors sample attributes: Designation (Director / Managing Director / Company Secretary); Flags = 0 (not flagged; Flag = Deactivated due to non-filing of DIR-3 KYC).

## Companies — process flow
Pre-requisites: Private Limited / Public Limited Company; Names of Directors, MDs, Company Secretary verifiable against Probe42. Flow: nominate authorized signatories in BR (nominated person can add other AS per BR decision); validation against approved board authorizations; account operations strictly per corporate governance & authorized mandates; Admin role given to only one nominated authorised signatory.

### Basic Questions that lead to BR form generation
| # | Question for OBO user | Attribute of BR |
| --- | --- | --- |
| 1 | Provide the Board Resolution for account opening. Use Bank's online template or upload your own. Proceed with online template? Yes/No | If Yes → point 2; If No → No STP → Alert DVU to create net-banking credentials per BR operating instructions upon valid request |
| 2 | Provide PAN of your company | PAN, Company Name, Company Address — Auto-populated from Probe42 |
| 3 | Choose at least two directors or company secretary who will sign the BR | Name, Designation, Email ID, Phone number — Name & Designation validated against Probe42 |
| 4 | Nominate the Authorised Signatory | Name, Email ID, Phone number — Manual Input |
| 5 | Choose governance for Authorised Signatory changes | Dropdown: 1) Nominated Authorized Official of the Company; 2) Decision Pursuant based on Board Resolution |
| 6 | Choose Place of meeting the BR was taken | Dropdown: 1) Virtually; 2) By rotation; 3) Address |
| 7 | Confirm the pre-filled Board Resolution | Date, Confirm Button — Auto-generated Time-Stamp taken |

### Standardized Board Resolution (online onboarding) — структура
**Company Details:** Name (Auto), CIN (Auto), Registered Office Address (Auto), Date & Place of Meeting (Manual). **Resolution:** authorises banking products/services with Sber Bank in company name; Authorised Official(s) nominated to operate and (where permitted) nominate additional signatories; covers Internet Banking, FEMA services, deposits, loans, bill purchase/discounting, LC, BG. **Signatory table:** Name (manual), Designation (manual), PAN, Contacts (Email/Phone for OTP & VCIP), Governance for AS changes (dropdown text). **Details & Declaration of Directors/UBOs/AS:** Name, Contacts, Signature, Company Seal. Certification checkbox: "I/We hereby certify that the above is a true and correct copy of the resolution duly passed by the Board…". Company's DCS seal.

## Partnership firm — Authority Letter / Operating Instructions (структура)
RESOLUTION / AUTHORISATION FOR OPERATION OF BANK ACCOUNTS (Partnership Firm – Banking & Internet Banking Operations). Authorises SBER Bank to open/maintain accounts in Firm name + facilities (Internet Banking, FEMA, deposits, loans, bill discounting, LC, BG). **Authorised Partners/Signatories table:** Partners Name (Auto Populate), PAN, Contacts (Email/Phone Auto from UIDAI + allow edit), Mode of Operation (Dropdown: Any 2 Jointly / Severally; Maker/Checker; All full rights). Powers: open/operate accounts, sign/endorse/accept cheques & instruments, FDs, Internet Banking, execute documents. Corporate Internet Banking access; default transaction limits + modification subject to Bank approval. Binding on Firm; indemnity. Valid until written withdrawal. CERTIFIED TRUE COPY; partners' eSign. Other banks example: IndusInd draft.

## Sole Proprietorship — Consent and Declaration (структура)
"Consent and Authorisation for Banking Operations" — Proprietor full name, business name, address. Consent & Authorisation: open/maintain Current Account in firm name; operate + avail products (Internet Banking, FEMA, deposits, loans, bill discounting, LC, BG); carry out KYC/CKYC/AML/regulatory checks. Declaration: info true/correct/complete; sole responsibility for transactions; inform Bank of any ownership/business/signatory change; transactions binding. Signature, PAN, Mobile, Email, Place, Date. OTP Authentication / Aadhaar eSign. Other banks example: RBL Declaration.
