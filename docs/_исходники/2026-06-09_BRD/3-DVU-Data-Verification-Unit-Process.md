---
source: Confluence "1D - 3. DVU (Data Verification Unit) Process", получено 2026-06-09
type: исходник (raw, verbatim)
---

# 1D - 3. DVU (Data Verification Unit) Process

## Business Overview
The current As-Is process of account opening and onboarding requires redesign due to gaps, bottlenecks and time-consuming procedures. The main idea is to automate all parts of the current process, additionally to concentrate all manual checks and verification in one hands — to establish the AOD - Data Verification Unit, responsible for all operating work during onboarding-account opening:
- For every exception or Integration failure, an alert will be generated in AOD workspace.
- AOD team will pick alerts and manually work on this alert to assist in account onboarding.
- AOD team will Communicate with prospect for additional document request wherever required.
- AOD team will be responsible for data and document verification part during account onboarding journey.
- AOD team to also assist prospect when prospect walks into branch with documents for offline account onboarding.
Mockups: https://pixso.design.sber.ru/app/editor/J24W2NR5Bk3V0przatBVhQ?page-id=1636%3A104340

## List of AOD scenarios
| # | Scenario Name | Description | Additional information |
| --- | --- | --- | --- |
| 1 | Offline account opening | Prospect walks into Sber branch to start onboarding; AOD assists with details and documents. Either prospect contacts CRM to schedule branch meeting, or walks in with required documents. AOD assists throughout in person. | BRD: confluence.sberbank.ru/x/q4KAdQU |
| 2 | CRILC Check | RBI asks FIs to use CRILC credit information for opening current accounts. Integration of NSEL (CRILC) with Caldera for real-time credit exposure. STP uses RBI logic to determine whether bank can offer Current or collection account based on credit exposure. On CRILC failure or prospect disagreement → alert to AOD; AOD manually checks credit exposure. | BRD: confluence.sberbank.ru/x/soEVdwU |
| 3 | AML PEP Alert | During online onboarding, if customer selects PEP status = Yes under business questionnaire → alert to Compliance AODs for investigation & decision. Alert in Compliance alert center. Compliance AOD verifies high-risk; sets risk rating; decides if management approval required. | BRD: confluence.sberbank.ru/x/UBrJfwU |
| 4 | BGV Check | BGV mandatory during onboarding; ensures genuineness, safeguards bank. Aim to streamline via alerts to AOD. Once account opened in debit freeze mode → alert to AOD. AOD contacts BGV vendor for physical geo verification. Every BGV alert sent to Compliance for verification. Compliance decides BGV status success/fail. | BRD: confluence.sberbank.ru/x/Hw05fAU |
| 5 | Probe 42 (Data Validation) | During online onboarding, required documents absent in PROBE 42 or prospect disputes data accuracy. OBO sends chunks to AOD to validate prospect data. Prospect uploads docs; AOD either (a) marks data valid; (b) corrects data and pushes to OBO for prospect confirmation; (c) requests new documents. Chunks may contain each part of an application (UDIN, CRILC, LEI, IEC). | BRD: Data Validation DVU Alert |
| 6 | AOD Schedule VKYC Meeting Task | VKYC/SVKYC session failed (Aadhar failure, Deep Fake, automated check anomalies). AOD reviews failed session, determines root cause, arranges new remote KYC or invites client to office for F2F. If prospect unreachable, AOD can reserve task till end of day or return to queue. | BRD: VKYC Schedule DVU Alert |
| 7 | AOD Provide VKYC or F2F | AOD session alert created & assigned; main screen lists upcoming VKYC meetings assigned to AOD where execution day = today, sorted by day/time. Join Session; Conduct VKYC; Record Outcome; Return to Queue. | BRD: VKYC Schedule DVU Alert |
| 8 | AOD Validate VKYC results | VKYC session task completed; system-generated alert in queue. System excludes any AOD who previously provided the meeting for this Person. AOD presses Start Work → Task Details (Disclaimer + KYC widgets, Submit disabled). AOD validates materials within KYC Widget, presses main action to confirm review. System updates status, enables Submit. AOD presses Submit; task Completed; redirect to main screen. | BRD: VKYC Video Review Alert |
| 9 | DIP Check | TBD | BRD: confluence.sberbank.ru/x/x4ve_AQ |
| 10 | Alert to Verify VCIP-Videos | Manual videos verification in case of suspicion on fraud — alert auto-generated. | 1D - 2. VCIP |
| 11 | Alert to process the customer's data change request | Post MVP, not in scope first phase. Once request comes from net-banking/hard copy, AOD processes it. | TBD |
| 12 | Alert to AOD to organize delivery of welcome package | Will automate but in discussion. Once account activated → alert to AOD (info) to ask vendors to deliver welcome kit (cheque book leaves). Once vendor confirms delivery, alert closed with remark. | TBD |
| 13 | Responsibility of AOD to give access to Net-banking | Will automate but in discussion. In MVP scope. Once customer onboarded offline, AOD provides credentials per Board Resolution. | Access given at onboarding end to signatories in BR |
| 14 | Alert to AOD to implement changes to CKYC registry | Will automate but in discussion. After client onboarded & account opened, if CKYC changes present, AOD applies appropriate changes to CKYC registry. Mandatory ONLY after client successfully onboarded. | Under discussion |
| 15 | Fraud list of mobile phone match (UNDER DISCUSSION / Could be done by Support) | Customer selects offline onboarding; during daily check of fraud list of mobile numbers, client's number matches → account blocked for credit transaction, Email & SMS sent. AOD manager contacts client to inform & get explanation; writes down explanation; sends alert to compliance. RBI restricts telling client he is in fraud list. | confluence.sberbank.ru/x/x4ve_AQ |
| 16 | If CRILC >10CR and LEI was not fetched from Probe → alert to AOD | Chapter VIII LEI for Borrowers: LEI 20-digit unique code. Bank shall ensure non-individual borrowers with aggregate exposure ₹5 crore and above from banks & FIs obtain LEI codes. Borrowers failing to obtain LEI shall not be sanctioned new exposure nor renewal/enhancement (except Central/State Govt depts/agencies). Entities obtain LEI from accredited LOU (in India: LEIIL, subsidiary of CCIL). | TBD |
