---
source: Confluence export (весь BRD-набор 1DAY Initiative), 2026-06-09
type: сборка из файлов раздела — полный, для холистических проходов
note: собран скриптом _assemble.py из core 1D + analytics. Для точечного обсуждения открывай отдельный файл.
---


<!-- ==== 1-Customers-Onboarding-process.md ==== -->

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

---


<!-- ==== 1.1-SOP-Corporate-Customer-Onboarding.md ==== -->

# 1D - 1.1. SOP for Corporate Customer Onboarding

- [Introduction]
- [Business Overview]
- [Scope]
- [Modes of Onboarding]
- [Challenges in Existing Process]
- [Executive Summary]
- [Prerequisites]
- [STP criteria]
- [Definition of Non Standard Customer - Hybrid Process]
- [Process Diagram : To Be Onboarding Process]
- [Detailed Process flow and Control Points- Online Onboarding]
- [VCIP Process : eKYC (Aadhar) against UIDAI and Video KYC:]
- [Table A Process Flow]
- [Aadhaar eKYC Sub Process]
- [Table B Process Flow]
- [Self VKYC Process Flow]
- [Table C Process Flow]
- [Verification of Identity Documents Process Flow]
- [Table D Process Flow]
- [BGV Check]
- [Responsibility Matrix]
- [Appendix 1]
- [Abbreviations]
- [Appendix 2]
- [Documents for Entity]
- [Appendix 3]
- [Documents for Individual For STP (Indian Nationals )]
- [Documents for Individual For Hybrid / Offline (Indian Nationals )]
- [Documents for Individual For Foreign nationals - ( NSTP / Hybrid Process )]
- [Appendix 4]
- [Appendix 5]
- [Self-Assessment Risk Matrix]

Introduction
In accordance to the IRD – Order No. 109 dated 17.09.2024 the New Account/Product Opening Procedure for the fully automated product opening and document Verification Process to be followed.
The SOP enters into force once the implementation is done in Core Banking System CALDERA.
# Business Overview
To enhance the onboarding experience of customers , a fully digital end-to-end onboarding framework to be implemented, by optimizing the existing process . This approach enables seamless customer acquisition through account/product opening within the digital banking platform with integrated eKYC and built-in VKYC verification , validation of auto populated data against registries, and there by reduced manual interventions also to define the standard, secure, and legally compliant workflow for conducting a fully automated Video Know Your Customer Process (VKYC).
This procedure is designed to enable the remote onboarding of new corporate customers for the Sberbank Branch in India for verifying the identity of Authorized Signatories (**AS**) / Directors / UBOs / Partners, in strict adherence to the guidelines issued by the Reserve Bank of India (RBI).
# Scope
The scope of the process is as follows:
- The process is only applicable for Sberbank branch in India'
- The process will be reviewed / updated as and when there is any update from the RBI;
- Standardize and unify customer onboarding across online and offline channels.
- Enable automation of data capture, validation, and verification processes.
- Integrate registry-based checks for data authenticity
- Ensure consistent KYC, sanctions screening, risk assessment across all case and BGV performed based on defined criteria and risk triggers.
- Support straight-through processing (STP) with defined exception handling.
- Optimize operational efficiency by reducing manual intervention and duplication.
- Enable structured data capture for analytics, monitoring, and reporting.
- Ensure regulatory compliance and audit readiness throughout the onboarding lifecycle.
- Cover the complete journey from prospect initiation to account/product activation
## Background
In Compliance with RBI's Master Direction - Know Your Customer (KYC) Direction, 2016, Prevention of Money Laundering Act, Foreign Exchange Management Act, Company's Act and other applicable Regulatory & Statutory Guidelines/ Circulars, the Bank has defined its internal procedures to carry out the extensive due diligence while opening the new client accounts/products for banking purposes. As a standard practice, the Bank keeps on reviewing these procedures from time to time in light of any regulatory / statutory changes or in case of any internal process enhancement. Any change/s (in the procedures) is/are discussed with relevant functions and management first and then presented to the management for appropriate approvals.
# Modes of Onboarding
The Modes of Onboarding define the different approaches through which customer onboarding is conducted, based on the level of automation, availability of data, and extent of verification required. Depending on predefined criteria, onboarding may be processed through fully digital (STP), hybrid, or offline modes, ensuring appropriate validation, compliance, and due diligence across all scenarios.
| Onboarding Mode | Description | Key Controls / Features | Condition / Applicability |
| --- | --- | --- | --- |
| Fully Digital (STP) | End-to-end digital onboarding with auto data population and real-time validation enabling instant account/product activation | e-KYC / VKYC, registry validation, system-based checks, no manual intervention | Applicable when all predefined STP criteria and validations are Successfuly met |
| Hybrid Onboarding | Partially digital onboarding with system-driven data pre-fill and validations, with manual intervention for exceptions or additional documentation | Registry validation, partial automation, DVU involvement for exceptions | Applicable where auto-validation fails, data mismatch occurs, or additional documents are required |
| Offline Onboarding | Fully manual onboarding involving physical document submission and verification | Physical document verification, manual due diligence by DVU | Applicable for non-STP eligible entity types or where digital/on-system validation is not feasible |
# Challenges in Existing Process
The current process and the Future To Be process is defined at the below Executive summary section , considering the following challenges:
- Data collection and validation are being performed manually across multiple systems, leading to duplication of effort and dependency on manual intervention.
- Regulatory checks such as KYC verification, sanctions screening, FATCA/CRS classification, and UBO identification are conducted in a sequential and partially manual manner, often resulting in delays and rework.
- Most onboarding cases involves multiple rounds of manual review and approvals from CRM team, Ops team and Compliance teams for validation and exception handling.
As a result, the current process leads to higher turnaround time (TAT) 5-7 days, operational inefficiencies, increased risk of errors, audit traceability, and suboptimal customer experience.
# Executive Summary
| Steps | Current (AS-IS) Process | Future (TO-BE) Process Offline | Future (TO-BE) Process Online | Additional Information |
| --- | --- | --- | --- | --- |
| Prospect Initiation+ Customer Consent | Prospect initiates account/product opening through branch or RM interaction with physical forms. | CRM/Call Centre Team representative initiates the deal for product opening and pass the file to DVU team along with required documents+ Customer consent shall be obtained for data validation and verification across relevant registries and authorized sources, including but not limited to NSDL, CRILC, CKYC, and other applicable regulatory or third-party databases, as required. | Prospect initiates onboarding through website or CRM/Customer Service Division representative initiates the online Onboarding on-behalf of Prospect Customer consent shall be obtained for data validation and verification across relevant registries and authorized sources, including but not limited to NSDL, CRILC, CKYC, and other applicable regulatory or third-party databases, as required. |  |
| Data Entry | RM enters the data / document upload manually into the core banking system (CALDERA)orProspect fills the online form manually | DVU team to enter the details in the system. DVU Team request the additional documents to prospect (if needed)during onboarding process. Data is auto populated and validated in real- time against registry records, subject to data availability . | System auto populates the data and performs real-time validation against the registry | If data not available in Data Registry or data validation fails, then in this case - follow hybrid approach - and request Prospect to provide additional document proof of any changes against registries. |
| Registry Data Validation | Limited or manual verification of company data from external sources |
| Board Resolution (BR) / Authority Letter | Prospect prepares BR on it's own and submits the physical BR. (formats may vary from customer to customer). | Prospect submits board resolution/authorization documents defining account/product operation instructions during prospect initiation stage (Sber Format ) to branch. or Prospect will submit their own format of BR to branch | Standardized BR format provided by Bank via portal; Prospect fills, signs, uploads and digitally attests. or Prospect will upload their own format of Board Resolution to the portal, A valid digitally attested and legally bound Board Resolution to be uploaded/ submitted to the system | References : As per The Information Technology Act, 2000 : The provisions on digital signatures remain unchanged and fully in force: Section 3 – Authentication of electronic records by digital signature. Section 5 – Legal recognition of digital signatures (equivalent to physical signatures in law). Section 15 – Secure digital signatures deemed properly affixed if verified through prescribed procedure. ******Thus, digital signatures continue to enjoy statutory recognition under the IT Act.** Bharatiya Sakshya Adhiniyam, 2023 / the Evidence Act ("BSA") : The BSA provides the foundational legal recognition for electronic records and electronic signatures. Section 63 of the BSA outline how electronic records, including those with digital signatures, are admissible as evidence. **Key Legal Presumptions :** Section 66 of the BSA: In the case of secure digital signatures, a signatory is not required to prove the signature belongs to them. Section 86 of the BSA: A secure digital signature is presumed to be affixed by the subscriber with the intention of signing or approving the electronic record. Section 87 of the BSA: Information in a Digital Signature Certificate is presumed correct. |
| Document Submission | Prospect submits the Physical documents in branch or upload the scanned copies in Online Onboarding portal based on the checklist provided. | System auto Populate of respective required documents based on Entity type from Data Registry. or if data/ document not available then alert to triggered to DVU , Prospect submits the Physical documents at the branch in accordance with the document checklist as defined under SOP guidelines | System auto Populate of respective required documents based on Entity type from Data Registry. or if data/ document not available then alert to triggered to DVU , Prospect uploads digital documents through onboarding system or submits the physical documents at the branch upon request from DVU team. | Refer to the Appendix section below (Appendix 2 - Online and Appendix 4 - Offline) for the detailed list of required documents pertaining to Onboarding. |
| Document Verification | Manual document verification against the government registries | Auto-verification against the government registries through api . In case of any discrepancies , i.e. auto-verification fails, the DVU Team manually verifies. | Auto-verification against the government registries through api In case of any discrepancies, i.e. auto-verification fails, the DVU Team manually verifies | NSDL, MCA, CKYCR, UIDAI, DIP/NCC, CRILC etc. The exhaustive list of the integrations will be given during the implementation stage |
| Signature & Attestation | Wet signatures mandatory; verification done manually. | Wet signatures mandatory; Manual verification of signatures and data attestation is conducted for all offline submissions. | In Case of Board resolution/ Authority Letter : For STP processing, duly signed scanned documents shall be mandatorily authenticated with a valid digital signature to enable end-to-end system validation. For all other documents a scanned copies shall be accepted; additionally, government certified e-Copies may be considered wherever applicable | In accordance with the HPLBC No. 94 dated 15.04.2025, this document outlines an enhanced approach on" Signing Documents with Digital Signature (emSigner)" Any future modifications, enhancements, or changes to the digital signing process, workflow, controls, or related operational procedures shall be governed through a separate SOP or amendment document, subject to the requisite review and approval process. |
| KYC of Authorized Signatories | KYC conducted through physical verification by the branch | eKYC validation against UIDAI and Video KYC (VKYC) for all authorized signatories.orKYC conducted through physical verification by the branch. | eKYC validation against UIDAI and Video KYC (VKYC) for all authorized signatories. |  |
| Sanctions Screening and PEP Screening | Bank Performs sanctions screening manually which involves multiple review cycles | Prospect and related parties are screened against sanctions/watchlists - automated real-time screening integrated within onboarding workflow. In case screening results in a positive match, an alert shall be generated and routed to the Compliance team for review. And Compliance further route the alert to Management review or approval. In the event of rejection, the CRM team shall be notified to communicate the decline of product opening to the customer in a professional manner. | Prospect and related parties are screened against sanctions/watchlists - automated real-time screening integrated within onboarding workflow. In case screening results in a positive match, an alert shall be generated and routed to the Compliance team for review. And Compliance further route the alert to Management review or approval. In the event of rejection, the CRM team shall be notified to communicate the decline of product opening to the customer in a professional manner. |  |
| Risk Assessment | Bank performs risk assessment manual/ semi-automated | Automated risk scoring based on predefined rules during onboarding. | System performs automated risk scoring based on predefined rules during onboarding. |  |
| Processing Type | Majority cases handled through manual processing. | Manual/hybrid processing based on risk and validation outcomes | STP enabled for low-risk cases; exceptions routed for manual review. | Medium and High Risk cases to follow hybrid approach |
| BGV | 3rd party vendor performs BGV for all account (During account Opening) | BGV is conducted as per defined criteria (limited/full) based on risk categorization | BGV is conducted as per defined criteria (limited/full) based on risk categorization. | Criteria /details listed below in BGV Matrix section |
| Audit & Traceability | Limited audit trail, dependency on physical records . | Complete digital audit trail with system logs and traceability. | Complete digital audit trail with system logs and traceability. |  |
| Auto-product opening | Currently not available | Upon successful verification, product is created in CBS along with creation of netbanking credentials upon receipt of a valid request from customer. | Auto product opening will be available for prospect based on respective risk categorization along with auto generation of netbaking credentials |  |
## Prerequisites
For the smooth process of the digital account/product opening should be considered the following:
- CRILC Customers Self-Declaration and the API integration for the automatic check
- CKYCR integration
- Sanctions Screening- integration
- Cyber security checks for mobiles, emails - integration
- VCIP implementation
- Aadhaar eKYC validation (UIDAI)(example: Aadhar app)
- Data Registry - integration
- Definition of the "standard customer"
- STP criteria
### Definition of "Standard Customer" / STP Eligibility Criteria
Standard Customer is the LE (Legal Entity), resident of India both company and all signatories, whose data (company's and individuals) are available and up-to-date in government registers, and Risk Category is Low for the fully-automated online-onboarding process (STP)
| Legal Types | Details |
| --- | --- |
| Public Limited Company Private Limited Company | Covers the digital onboarding process for companies registered under the Companies Act, including Public Limited and Private Limited Companies. The process includes verification of company details through corporate registries, identification and verification of directors and Authorized signatories, validation of Board Resolution, sanctions screening, and identification of beneficial owners (UBOs). The workflow also defines STP-eligible scenarios, manual verification requirements, and the points where DVU and Compliance review may be triggered. |
| Partnership LLP(Limited Liability Partnership) | Covers the onboarding process for Partnership Firms and Limited Liability Partnerships (LLP). The process includes verification of partnership/LLP registration details, validation of partnership deed or LLP agreement, identification and verification of partners and Authorized signatories, sanctions screening, and beneficial ownership(partnership) assessment. The workflow also defines conditions under which STP processing is permitted and scenarios requiring manual review by DVU or Compliance teams. |
| Sole Proprietorship | Covers the digital onboarding process for Sole Proprietorship businesses, where the business is owned and operated by a single individual. The process includes verification of the proprietor's identity through eKYC/VKYC, validation of business existence through GST or other registration documents, sanctions screening, and risk assessment. The workflow also identifies STP-eligible scenarios and cases requiring manual verification by DVU or escalation to Compliance. |
| Others ( One-person Company, HUF, Trust, Associations , etc.,) | Onboarding for such entity type shall presently be be processed through an offline or hybrid approach . Hybrid approach only when registry data is available to support automated data pre- population and validation. However, onboarding through STP is not excluded for these legal entity types and may be enabled in future development phases. |
### STP criteria
| Criteria | Condition | Outcome | Outcome in case condition fail |
| --- | --- | --- | --- |
| Risk Classification | Entity classified as Low Risk | Eligible for STP | Manual Review by DVU and Compliance |
| Sanctions Screening | No matches in sanctions/watchlists | Eligible for STP | DVU / Compliance Review |
| Registry Validation | Company data available and matches external sources | Eligible for STP | DVU Verification |
| PEP Status | No PEP associated in the Company | Eligible for STP | Compliance Review |
| Indian Residency | No foreign nations associated in the Company/FATCA | Eligible for STP | Compliance Review |
| Authorized Signatory KYC | eKYC & VKYC Successfuly completed | Eligible for STP | Manual Intervention by DVU and CRM |
| Board Resolution | Standardized BR format, digitally prepared and submitted with a valid digitally attestation | Eligible for STP | DVU Verification |
| Background Verification (BGV) | Company matches the condition of BGV exception | Eligible for STP | DVU Verification |
### Definition of Non Standard Customer - Hybrid Process
Hybrid Approach refers to a semi-automated process for customer onboarding wherein certain stages of onboarding are processed through Straight Through Processing (STP), while specific steps require manual intervention, validation, or exception handling by bank teams (DVU/Compliance), due to data unavailability, mismatch, or incompleteness of data across integrated systems., in case of medium and high risk categorized customers, VCIP process failed or suspicious identified , eKYC not successful , or in case of Screening alert etc.,
# Process Diagram : To Be Onboarding Process
*## Detailed Process flow and Control Points- Online Onboarding
Step
Process
Description
System
Additional Information
CRM system registers the product opening request
(Prospect initiates the application form + Accept Consents)
There are three options:
1 - Application form from the Sberbank India website (Self Registration by Prospect)
2 - The link will be sent to Prospect from CRM system to Online-Bank application form (Assisted Registration initiated by CRM/ Call Center)
3- Offline - Physical documents and forms
Sub Process : Automatic Duplicity check
To avoid multiple prospect application being submitted from respective person with same email id/ PAN
Customer consent shall be obtained for data validation and verification across relevant registries and authorized sources, including but not limited to NSDL, CRILC, CKYC, Udyam and other applicable regulatory or third-party databases, as required.
Guest Zone of Online Banking
Assisted Registration : RM will receive request from prospect for product opening where in he will input the basic details as per attribute list in CALDERA, to assist prospect to continue with self registration journey/steps.
Initiate Auto Screening
Perform Auto screening by PAN by taking Customer Consent to perform PAN check, CRILC check , sanctions list check and see if data is available in Data Registry
External Registry
Includes Name Screening Auto sanctions check
Manual Screening Verification
If Auto screen fails and alert triggers , manual process → CRM performs manual verification and decisioning.
CBS CALDERA
Auto-data or manual app form filling
Data Auto population in case available in registry or Prospect fills application form digitally or DVU team fills the form on behalf of prospect ; required details captured in system.
Guest Zone of Online Banking / CBS CALDERA
The Prospect uploads the mandatory supportive documents in case data modified
3a
Documents/Operating Instructions/Board ResolutionPrivate Limited Company / Public Limited Company
Authority Letter- Partnership / LLP
A screen to capture Operating instructions details along with other mandatory details required as a part of Board resolution / Authority Letter - online mode
The request to upload the required document upon request - online mode
Physical documents submission - offline mode
Guest Zone of Online Banking / CBS CALDERA
Digitally submission of Document (BR/ Authority letter)
Digitally submitted documents shall be identified and processed using AI technologies (example : IDP, OCR) and executed through secure digital mechanisms with validation of digital signatures to ensure legal validity, data integrity, and regulatory requirements.
Guest Zone of Online Banking / CBS CALDERA
Digital Signature should be valid as on date of signing of the document and valid at the time of processing the request
Validate Signature to be performed to ensure that the document is intact and not modified after signing it digitally
Name match to be performed against the list of AUS/Director/CS with kyc documents who has signed digitally
Name match to be performed against the list of AUS/Director/CS with kyc documents who has signed digitally and with existing records (Only for existing Clients)
3b
Calculate the risk category
The risk categorization algorithm shall be implemented to assess and determine the customer's risk profile based on responses to the business nature questionnaire, aligned with the type of legal entity, associated risk factors, customer profile, segment, and defined criteria. Appropriate risk weightages shall be assigned to classify the customer as Low, Medium, or High risk.
Guest Zone of Online Banking / CBS CALDERA
Irrespective of Legal Entity type if it falls in High Risk Category, Industry specific license along with CRM Head approval is mandatory.List of High Risk Categorized Industries as below:
International Job placement agencies, Tobacco, Casino, Night Club, Arms, Antiques, Explosives, Embassies, Consulates, Online Lotteries, Telemarketers Offshore entities, FFMC, Share broker, NBFC, Liquor, Arms and ammunition dealers , Nuclear energy and related consulting , Precious metals and gems trading (gold, silver, diamonds, bullion houses) ,Casinos and gaming establishments, Money changers / remittance service providers, Virtual asset service providers (crypto exchanges, wallets).
eKYC / VKYC Verification
Identity verification of authorized signatories via eKYC / Video KYC and consent capture.
eKYC - Validation of customer details against Unique Identification Authority of India **(UIDAI)** records
Live identity verification , a self Video KYC , Consent capture along with authentication and a process of validating individual with the Aadhar photo and provides validation result will be in place.
Guest Zone of Online Banking / CBS CALDERA
Validation of Name , DOB, Address, Photo id .This ensures a secure, compliant, and fully digital KYC process for individual respective stakeholders (directors/partners/authorized signatories).
Auto Data Verification against registry
A Parallel process , System validates Prospect/entity data against external registries (CKYC, NSDL, GST, PAN, etc.).
CBS CALDERA
Product Creation
Auto-product opening in Debit Freeze Mode
Await final checks / activation
Product Unfreeze condition (based on Initial activation condition fulfilled) : Ex : - Initial deposit received , BGV clear (if required) , DVU checks clear , etc., for respective product
**Exception Handling**
CRM & Call Center Follow-up
System tracks application status; alerts generated if Prospect is stuck in any stage.
DVU SubProcess
The DVU team shall be responsible for handling all exception scenarios arising during the onboarding process, conduct necessary due diligence and validations based on system triggers and defined controls across both online and offline channels.
# VCIP Process : eKYC (Aadhar) against UIDAI and Video KYC:
In accordance with the IRD - Order No. 2026-45A dated 23 March 2026, this document outlines an enhanced approach for VCIP and defines a fully automated Self e-KYC process (without the involvement of a KYC officer). The process covers video-based identification, liveness detection, automated document verification, and Aadhaar-based eKYC QR code certification.VCIP will be implemented as a digital method for customer due diligence in line with applicable regulatory requirements. The process enables remote identity verification through a secure, consent-based video interaction, ensuring compliance with KYC and AML norms.The VCIP process includes a self-service video interaction facilitated by an AI-based agent, wherein the customer undergoes real-time verification. The framework also incorporates key control mechanisms to ensure accuracy, security, and regulatory compliance. The process incorporates key control mechanisms such as:
Explicit customer consent prior to initiation of VCIP
Aadhaar-based eKYC verification, wherein customer identity details are validated through UIDAI using secure authentication mechanisms (such as QR code scanning via Aadhar App/XML-based verification or OTP-based authentication), in compliance with applicable regulatory and data privacy guidelines.
Live video capture with liveness detection to ensure the presence of the customer
Validation of identity details against trusted data sources (e.g., UIDAI, CKYC, or other applicable registries)
Geo-tagging and time-stamping of the video interaction, as applicable
Audit trail generation for all VCIP sessions
The system ensures that the VCIP process is conducted in a secure, end-to-end encrypted environment, maintaining data integrity, confidentiality, and non-repudiation.In cases where automated verification is inconclusive or exceptions are identified, the process is subject to manual review and intervention by the designated verification teams in line with internal policies and regulatory expectations.
**The primary objectives of this VCIP process are to:**
**Standardize Operations:** Establish a consistent, repeatable, and auditable process for all employees involved in VKYC process, minimizing operational risk and variability.
**Mitigate Fraud Risk:** Incorporate multi-layered checks—including IP analysis, liveness detection, spoofing prevention, and biometric matching—to effectively deter and identify attempted identity fraud during remote onboarding.
**Define Roles and Responsibilities:** Outline the roles of the system, the customer, and bank employees at each stage, including escalation paths for exceptions and suspected fraud.
**Ensure Audit Trail:** Ensure every session generates a secure, time-stamped, and tamper-evident digital record comprising video, consent logs, geolocation data, and system validation outputs.
**Application Scenarios:**
**New Customer Onboarding -**Initial verification of Authorized Signatories, Beneficial Owners and Partners during the account opening process for a new corporate client.
**Re-KYC -**Scheduled periodic re-verification of the identities of relevant signatories as a part of Sberbank's ongoing due diligence.
**Event driven KYC -**The automated Re-KYC of **existing customers** triggered by specific, defined events requiring refreshed or additional KYC.
**Prerequisites**
**Prerequisite ID** / **Prerequisite Description**
**PR-01** — Authorized Signatory (AS) must have a valid **Aadhaar number** registered with UIDAI and access to the linked mobile number.
**PR-02** — AS must have a **valid PAN card,** not a copy.
**PR-03** — AS must have a **device** with a functioning **camera**, **microphone**, and **stable internet connection**
**PR-04** — AS must be **physically located within India** at the time of the VCIP session.
**PR-05** — AS must have access to the **email account** used during application to access the VKYC link
**PR-06** — AS must be **18 years or older.**
**Roles and Responsibilities**
- Authorized Signatory: Access the VKYC link within the allotted time; Complete authentication by entering mobile OTP; Review and accept the consents; Authentication against Aadhaar eKYC via QR code; Perform actions, following on-screen instructions; Present original documents
- DVU: Review the recording of VCIP session; Approve/disapprove the correctness of the data captured during the session; Handle the alerts; Escalate the reviewed session to Compliance if needed
- Concurrent Audit: Review the recording of the VCIP session; Provide the final review and approve of the VCIP session

**Self VKYC of a New Customer (Automated, Without KYC Officer)**
**Description** — The scenario details the standard, end-to-end operational procedure for conducting a fully automated Video Know Your Customer (VKYC) for a new Authorized Signatory/Proprietor/Partner/Beneficial Owner (Hereafter **AS**) of a corporate entity. The process is designed to be initiated and completed by the Authorized Signatory remotely , without real-time intervention from a VKYC Officer , leveraging artificial intelligence and automated checks to ensure regulatory compliance, security and operational efficiency.

## Table A Process Flow
**Step / Action / Action Description / Following Action**
- **AS** clicks on the link from the email — The **AS** clicks on the received link from any device equipped with a camera and microphone (preferably a smartphone or laptop). The system verifies whether the link is active and not expired. → 02 - AS enters the Guest Zone with mobile OTP
- 02 - **AS** enters the Guest Zone with mobile OTP — Authorized Signatory is redirected to the secure Guest Zone entering page. A One-Time Password (OTP) is sent to the mobile number indicated in the Operating instructions (Board Resolution). The AS must enter this OTP in the designated field. **Success:** If the OTP is entered correctly and within the allotted time, the system confirms the user's identity and grants access to the isolated Guest Zone. **Failure:** If the OTP is incorrect or expired, access is denied. The AS can request a new OTP. The AS has 5 attempts to enter the Guest Zone, in case of 5 failed attempts the AS will be temporary blocked. → 03
- 03 - **AS** provides consents related to VKYC — Upon entering the Guest Zone with VKYC, Aadhaar eKYC and accepts Terms & Conditions. **All consents accepted - AS** can proceed to self VKYC verification (STP). **Not all consents accepted -** Alert is generated to DVU to get in contact with AS and provide instructions on alternative ways to complete verification (VKYC with Officer, Offline KYC). → 04 (AS redirected to UI for Aadhaar QR eKYC) / 04A
- 04 - **AS** is redirected to UI for Aadhaar eKYC — AS completes Aadhaar eKYC → 05 - Aadhaar eKYC Sub Process
- 04 A - DVU contacts AS and offers options to complete KYC — DVU contacts AS via phone and recommends to accept all consents to enable Self VKYC as a fastest option. As an alternate option DVU offers AS to complete VKYC with Officer or Offline KYC in Branch. → 01 (AS accepts consents) OR 05 A. **AS agrees to accept consents for VKYC:** AS clicks on the same link and enters the Guest Zone. **AS wants to continue Offline / VKYC with Officer:** DVU sets the appropriate method of KYC and books the date and time in Calendar.
- 05 A - DVU selects KYC method and sets date and time in Calendar → VKYC is terminated
- 05 - Aadhaar eKYC Sub Process — The detailed Aadhaar QR eKYC Sub Process is described in Table B. **Success: AS** is verified Successfully with Aadhaar App, the data is received from UIDAI → 06. **Failure: AS** is not verified, data not received from UIDAI → 04 - Hybrid KYC / 06 A
- 06 A - Show display to select date for Offline KYC / VKYC with Officer — System displays generic message "We were unable to verify you using the Aadhaar QR code. Please choose an alternative method to complete your KYC". System shows available options : VKYC with Officer, Offline KYC. Once AS selects an option, system displays the calendar with available time slots. AS selects preferable slot, system confirms the booking and sends a reminder and the link to the meeting to the registered email address. Session is terminated, tab is closed.
- 06 - **AS** is redirected to the VCIP Module, the recording starts — Upon successful completion of Aadhaar authorization, the AS proceeds to the VCIP (Jazz). The recording starts. → 07
- 07 - VCIP Sub Process starts — VCIP starts, described as a separate Sub Process in the Table C → 08
- 08 - System performs auto checks of VCIP session — Once the AS session is closed, the system initiates a background processing. AI performs all validation steps without presence of the AS. **Data Validation:** The AI validates extracted OCR data against the UIDAI database (using the data collected with Aadhaar QR code). **A. Validation with UIDAI:** The system uses the captured PAN data and the user's biometric consent (provided earlier via OTP) to perform validation with the data gathered from UIDAI database. This check confirms that the personal details (Name, Date of Birth, Gender) extracted via OCR exactly match the official records held by UIDAI. Any discrepancy will cause a validation failure. **Face Liveness and Deep Fake Check -** The SDK Liveness tools performs auto checks to detect possible signs of fake or spoofing. **Success:** If all validations pass successfully, the document verification stage is considered as Successfully completed → 09. **Failure:** If any validation fails, the alert is sent to DVU Team and the case is escalated for manual review, with the session recording and extracted data provided as evidence. → 09 A
- 09 A - Alert to DVU for manual check — System generates a high priority alert to perform the manual check of the entire recorded session along with the evidences. → 09. DVU verification: The handling of alert is described in DVU Verification Process.
- 09 - **AS** is redirected to Declarations Dashboard — The Dashboard presents a structured list of two core links, containing declarations. Each link is presented as an interactive, expandable section. The AS is required to actively engage with each one in any sequence: 1. **Declaration for Acc Opening:** A declaration covering the applicant's representations and warranties regarding the accuracy of provided information, eligibility to open a current account in Sberbank and understanding of Sberbank's policies. 2. **Fatca Declaration:** A self-certification form required under FATCA and the Common Reporting Standard (CRC). 3. **CAF -** Customer Application File, containing all the data which was submitted during the onboarding process. **Review Protocol:** The user must click to open each section. The system monitors this interaction, registering a "viewed" status upon detection of a scroll-to-bottom action. Only after a document is marked as "viewed" the corresponding "I have read, understood, and agree" checkbox becomes active. Following steps can be completed in any sequence.
- 10 - **AS** opens and accepts Declaration for Acc Opening → 13
- 12 - **AS** opens and accepts FATCA Declaration → 13
- **AS** opens and accepts CAF → 13
- 13 - **AS** clicks on "Confirm and Finish" / "Authorize and Finish" — After all links have been individually opened and their respective checkboxes ticked, a final "Authorize & Finish" button is activated at the bottom of the Declarations Dashboard. Once the AS clicks on "Confirm & Finish" a formal message is displayed: "Thank you ! Your Video Session is now complete, we're processing your verification and will notify you of the results shortly via your mobile number and email."
- Alert is generated to the Concurrent Audit to review and approve the session — Upon successful completion of Self VKYC session the system automatically generates the alert to the Concurrent Audit to review the recorded session and approve it. The Concurrent Audit must review and formally approve the session, until this approval the account remains in a freezed mode.

## Aadhaar eKYC Sub Process
## Table B Process Flow
| Step | Action | Action Description | Followng Action |
| --- | --- | --- | --- |
| 01 - eKYC | Enter Guest Zone where QR code is present | Enter Online onboarding zone where QR code is presented. | 02 - eKYC - Install Aadhaar App or 03 - eKYC - Scan the QR code using the Aadhaar App |
| 02 - eKYC | Install Aadhaar App | In case the Aadhaar App is not installed, **AS**should install it by scanning QR code from a desktop or using the link from mobile phone | 03 - eKYC - Scan the QR code using the Aadhaar App |
| 03 - eKYC | Scan the QR code using the Aadhaar App | Scan the QR code using the Aadhaar App. | 04 - eKYC - Click on "Continue to face authentication" |
| 04 - eKYC | Click on "Continue to face authentication" | Confirm data that is going to be shared with Sberbank and proceed to Face Authentication. | 05 - eKYC - Provide face authentication |
| 05 - eKYC | Provide face authentication | Provide face authentication by positioning the face so its fits the frame and blink twice to capture | 06 - eKYC - Click OK upon Successful authentication |
| 06 - eKYC | Click OK upon Successful authentication |  | Verification is completed data is extracted |
## Self VKYC Process Flow
## Table C Process Flow
| Step | Action | Action Description | Following Action |
| --- | --- | --- | --- |
| 01 - VCIP | **AS**gives location /camera / micaccess from his device | A request for permission to access the device's **camera** and **geolocation**is displayed to the Authorized Signatory. The Authorized Signatory must click "Allow" on the browser prompt to grant access. |  |
| 02 - VCIP | System auto checks IP address | The system performs a real-time auto check of the IP address of the Authorized Signatory. |  |
| **Successful Check:**IP address is within India and no VPN is detected. In this case Authorized Signatory seamlessly proceeds to the next step. | 06 - VCIP - **AS**interacts following instructions on the screen |
| **VPN is detected:**System detects the usage of VPN by **AS** | 03 - VCIP - DVU formally invites **AS**to Offline KYC |
| **AS** **is not in India**: IP address is located outside of India | 04 - VCIP - Display the screen to select the date or refuse |
| 03 - VCIP | Display prompt to **AS**to disable VPN and restart the session | The generic message is displayed to **AS**guiding him to disable VPN and restart the session using the same link from email address. VCIP session is terminated. |  |
| 04 - VCIP | Display the screen to select the date or refuse | The system displays a generic message offering **AS**to select the date when he will be in India and will be available to complete VKYC procedure. | 05 - VCIP - Display the screen to select the date or refuse |
| 05 - VCIP | **AS** selects the date in the opened window | The screen with the date selection is displayed. **AS**selects the appropriate date within the allocated period of 180 days and clicks on "Confirm" or "Refuse". The alert is generated to DVU team. | VCIP is terminated |
| 06 - VCIP | Follows the instructions displayed on the screen for face liveness check | To verify the presence of a living person (not a photograph, video replay, or mask), the system performs an automated active liveness check. The instruction is displayed as clear text on the screen, accompanied by voice command. The analysis of face liveness will be performed once the VCIP sessions is finished. |  |
| 07 - VCIP | Verification of the Document Sub Process | Verification of the Documents starts is performed with the tool DocVision, it is described as the separate sub process in the table D |  |
| 08 - VCIP | Message is displayed about completion of VCIP | Once the VCIP session is completed the tab is closed and the message is displayed to **AS** |  |
## Verification of Identity Documents Process Flow
## Table D Process Flow
| Step | Action | Action Description | Following action |
| --- | --- | --- | --- |
| 01 - DOCS | Systems displays the instructions on the screen | Before initiating the document capture sequence the system displays a clear full-screen instruction on the screen, this message shows the entire list of mandatory and additional officially valid documents which Authorized Signatory should have at hand. **Instruction:**"Please ensure you have the following original documents at hand with you. We will now guide you through capturing of each one." **Mandatory documents:** PAN card Wet signature on a paper | 02 - DOCS - Place front side of PAN card inside the frame and wait until the screenshot is taken |
| 02 - DOCS | Place front side of PAN card inside the frame and wait until screenshot is taken | **Instruction:** "Please hold your original PAN Card in front of the camera. Ensure the front side is fully visible, the text is clear, and there is no glare." **Action:**The system automatically captures a high-resolution image when the document is stable and in focus. | 03 - DOCS - OCR/AI auto recognition |
| 03 - DOCS | OCR/AI auto recognition | **Success Path:** An integrated OCR tool attempts to extract key data: **Full Name**, **PAN Number**, **Date of Birth**, and **Gender**. If extraction is successful the system provides positive feedback ("Front side captured Successfully. Please turn the card over."). | 04 - DOCS - Place additional identity proof doc and wait until screenshot is taken |
|  | **Failure & Retry Path:** If OCR fails to read any critical field the session does not terminate. Instead, the user receives a specific message: "We couldn't read the text clearly. Please ensure the card is fully within the frame, all corners are visible, and there's no glare. Let's try again." The system reinitiates the capture instruction for the same document side. | 02 - DOCS - Place front side of PAN card inside the frame and wait until the screenshot is taken |
| 04 - DOCS | Sign on a piece of paper, fit the signature inside the frame and wait until the screenshot is taken | **Instruction:** "Please now take a piece of paper and pen, write your signature and place it in front of the camera so that it fits the frame. Wait until the screenshot is taken." | 05 - DOCS - OCR/AI auto recognition |
| 05 - DOCS | OCR/AI auto recognition | **Success Path:** Upon successful capturing of the signature, the process moves to validation. |  |
| **Failure & Retry Path:** If OCR fails to capture the signature, **AS** is asked to reposition the document. **** |  |
|  | Upon confirming that all required document images have been captured and Successfully recognized by OCR the system initiates the session closure **Final User Message:** "Thank you ! Your video session and document capturing are now complete. We will now proceed with documents verification. You will be notified of the outcome via email and SMS to your registered contact details." **Redirection:** After showing the message the Authorized Signatory is automatically redirected to a generic thank-you page. The session is terminated for the Authorized Signatory, and the tab may now be closed. |  |
# BGV Check
BGV - Background verification performed by Bank, the 3rd party vendor.
Criteria to be defined for performing BGV only in cases of new company, suspicious company . In case of company has good track record and is a Listed company physical BGV process to be eliminated.
The applicable BGV criteria are outlined in the table below and are subject to modification based on Compliance directives.
- It will be DVU Team's responsibility to initiate the BGV check and get the report from vendors - first level of verification.
- It will be compliance team's responsibility to review the BGV results for account onboarding process.
- 100% cases will be routed to Compliance team for checking BGV results for account onboarding process.
- BGV will be performed after account is opened with Sberbank of India under certain criteria mentioned in a table below - BGV Decision Matrix.
- If Compliance marked any prospective account as negative or not fit for the onboarding then account will be closed.
BGV Decision Matrix
| BGV Criteria | Action | Product Opening - Limitation until BGV is completed |
| --- | --- | --- |
| Entity is on the market more than 2 years (Date of Incorporation) Annual financial Reports for 2+ years Government entities and public sector undertakings (PSUs) Regulated financial institutions (banks, insurance companies, NBFCs registered with RBI) Entities which are listed on NSE and BSE. | BGV is not required as per mentioned criteria. | Yes - no limitations on transactions after online account/product opening |
| Missing reports or no data in Data Registry Medium Risk Industry | **Full BGV** – physical visit or detailed investigation or Vendor's physical check | Yes - only domestic inwards transaction allowed until BGV is success |
| Blacklist matches like sanctions list or other watchlists matches High-risk industry Sole proprietorship and partnership companies. | **Full BGV** – physical visit or detailed investigation or Vendor's physical check | Yes - only domestic inwards transaction allowed until BGV is success |
# Responsibility Matrix
| Event | Team | Action |
| --- | --- | --- |
| Initiate onboarding process | CRM Team/ Call Centre Team /Prospect | The link will be sent to Prospect from CRM Team/Call Centre team to Online-Bank application formor (Self Registration by Prospect) |
| Offline Onboarding | CRM Team + DVU Team | When a prospect selects offline onboarding, CRM team collect the prospect details, documents (as per check list) and forward them to the DVU Manager. In case of any missing documents, the DVU team follows up with the Prospect to obtain the same. |
| Onboarding not available | CRM Team/DVU Team | If Sber is not able to open any kind of product to customer(example : Sanctions list) Then RM/DVU should contact the customer and discuss other possible options. |
| Assistance Requests/ Additional Details Required during Onboarding Process | DVU Team | The DVU team shall provide the required information and support promptly in response to any assistance requests raised by the Compliance or other team during onboarding. |
| Key Client Document Requests | CRM Team | Optional : For key or high-value clients, contact them directly to request any additional documents, rather than having DVU or the Call Centre do so. |
| Offline Client identification | CRM Team + DVU Team | In case if prospect is not able to perform VCIP (video client identification procedure) or VCIP is technically unavailable then RM / DVU officer should perform client identification procedure in the Sber office. |
| Prospect Visit Branch for Offline product opening | DVU team | In case if prospect visit branch , DVU team to initiate the discussion ,collect the prospect details, documents (as per check list) and forward them to the DVU Manager. |
| Alert to continue the Offline product opening (Prospects Card/Prospect profile) | DVU Team | DVU Team will receive the prospect details from RM along with required documents for product opening. DVU Team will request the additional documents if needed and will start the onboarding process. |
| Alert to verify the Prospect Card (auto check - failed). | DVU Team | Manual checks of Prospect's data and documents in case of any discrepancies against the registers. |
| Video KYC with Officer | CRM Team/DVU team | CRM team/DVU team shall be responsible for arranging and conducting Video KYC in cases where officer-assisted VKYC is required, ensuring adherence to regulatory requirements. |
| Verify VCIP-Videos | DVU Team + Compliance | Manual video verification by DVU team and in case of suspicion on fraud DVU team to alert to compliance team, compliance team to take necessary action. |
| Verify the BGV report | DVU Team + Compliance | Alert for DVU to request BGV upon certain criteria Once the BGV report received - DVU for verifying of completion of BGV . After DVU verification the report to be reviewed by compliance. |
| Alert to process the customer's data change request (For Bank Customer) | DVU Team | Once the customer's request comes from the net-banking/hard copy the DVU Team is to process the request. |
| Alert to DVU once product is a activated | DVU Team | Netbanking credentials will be auto generated for STP , DVU then to send mail to 3rd party vendor to issue cheque book and to send welcome kit |
| To give access to Net-banking | DVU Team | For complex company's board structure and such cases of Onboarding , DVU Team is responsible to provide net banking credentials according to the Board Resolution provided by customer. |
| Sanctions or PEP Screening | DVU Team+ Compliance+ Management | In case screening results in a positive match, an alert shall be generated and routed to the Compliance team for review. And Compliance further route the alert to Management review or approval. |
| Sanctions or PEP Screening | CRM team | In the event of rejection of product opening by Compliance and Management due to positive sanctions or PEP screening, the CRM team shall be notified to communicate the decision to the customer in a professional manner. |
| Exposure > Defined limit (by regulatory) / CRILC check is not success | CRM Team + DVU | CRM to Offer the special type of product to Prospect. DVU verifies the result of check if required. |
| Forged PAN | DVU Team + Compliance Team | In case if PAN is forged DVU team to push the case to compliance team, compliance team to take necessary action. |
| Risk Categorization | DVU + Compliance Team + System | System to auto calculate and define the Risk category against each prospect , depending upon the input provided by prospect during Business Nature Questioner. Compliance to monitor the risk categorization. For High Risk and Medium Risk , Alert to be triggered to DVU and once DVU verifies, DVU to push the alert for compliance verification and approval. |
| VCIP/VKYC - based Onboarding : For Audit Review | Concurrent Audit Team | Review documents, application along with VKYC/VCIP recordings(VCIP recordings→ for accounts onboarded through VCIP channel) to ensure compliance and report any deviations. |
| Onboarding Completion Timeline( Maximum TAT) | CRM Team + DVU Team + Prospect | The customer onboarding journey, from initiation to completion of product opening, shall be concluded within a maximum period of 180 days. In cases where onboarding is not completed within the stipulated timeline, the application shall be treated as lapsed and subject to re-initiation, in accordance with internal policies and regulatory guidelines. |
# Appendix 1
## Abbreviations
| **Terminology** | **Description** |
| --- | --- |
| AI | Artificial Intelligence |
| API | Application Program Interface |
| AS | Authorized Signatory, Beneficial Owners, Partners |
| CBS | Caldera Banking System |
| CRM | Customer Relationship Manager |
| CAF | Customer Application Form |
| Company | Public Limited & Private Limited |
| DVU(AOD) | Data Verification Unit , DVU is a part of Account Opening Division team |
| EDD | Enhanced Due Diligence |
| LLP | Limited Liability Partnership |
| PAN | Permanent Account Number |
| Prospect | A Potential Customer |
| PF | Partnership Firm |
| SP | Sole Proprietorship |
| GPS | Global Positioning System |
| KYC | Know Your Customer |
| OCR | Optical Character Recognition |
| OVD | Officially Valid Document |
| RM | Relationship Manager |
| STP | Straight Through Process |
| UIDAI | Unique Identification Authority of India |
| VCIP | Video Customer Identification Process |
| VKYC | Video KYC |
| VPN | Virtual Private Network |
# Appendix 2 — Documents for Entity
(полная таблица: Board Resolution/Authority Letter+Senior Management Declaration; Entity PAN Number; Certificate of Incorporation; MOA & AOA; Share holding Pattern; Complete Chain of LLP agreement/Partnership Deed; Partnership Registration Certificate; Address Proof (SP — 1st/2nd address proof, полные списки Udyam/Shop&Est/GST/Professional Tax/IEC/FSSAI и т.д.); IEC Certificate (Optional); GST Certificate (>= INR 60 lakhs & >6 мес); Entity FATCA). Колонки: Document Name | Applicable Entity Type | Mandatory | STP | Hybrid | Offline | Verification for Hybrid/offline | Additional details/Conditions/When STP fails. См. дублирующую полную таблицу в файле 1-Customers-Onboarding-process.md → Appendix 4.)
# Appendix 3 — Documents for Individual
## For STP (Indian Nationals)
| Document Type | Individual | Details |
| --- | --- | --- |
| Identification(Name, Address, Date of Birth) | Aadhaar Number | self eKYC process to be completed by authorized signatory |
| PAN CARD | Prospect to submit the scanned copy during VCIP process |
| Signature on white paper | Prospect to submit the scanned copy during VCIP process |
## For Hybrid / Offline (Indian Nationals)
In case if prospect authorized signatory not able to perform VCIP or VCIP is technically unavailable then RM should perform client identification procedure in the Sber office and capture wet signature.
| Document Type | Individual | When STP fails ? |
| --- | --- | --- |
| Identification | Aadhaar Card / Passport / Driving License / Voter ID Card / Letter by National Population Register / Job card issued by NREGA | submit the Identity document via onboarding portal or to branch |
| PAN CARD | submit the PAN copy via onboarding portal or to branch |
| Wet Signature |  |
## For Foreign nationals (NSTP / Hybrid Process)
| Document Type | Individual |
| --- | --- |
| Identification | Globally accepted & valid Passport |
| Type of Residence permit for India | Indian Visa or FRRO or Overseas citizenship of India Card |
| Correspondence Address proof | For Foreign national who is Resident in India |
| PAN/ Form 97 | PAN or Form 97 |
| Permanent Address Proof | Required for foreign national, either resident or non-resident |
# Appendix 4 — Success Criteria for VKYC
| **Category** | **Success Requirement** | **Verification Method** |
| --- | --- | --- |
| **1. Authentication** | AS Successfuly authenticates using OTP sent to his mobile number. | OTP validation log |
|  | AS provides valid consent selections that enable STP pathway (Terms & Conditions, Aadhaar eKYC Consent, VKYC Consent) | Logs of consent selections |
|  | Aadhaar eKYC with QR Successfuly validated against UIDAI with exact match of name, date of birth, gender. | UIDAI response with match confirmation. |
| **2. Geographic Presence and VPN usage** | Device GPS coordinates indicate location within India. | GPS capture with timestamp, must be inside Indian territory. |
|  | VPN is not used by AS | VPN Detection Algorithm |
| **3. Liveness & Deep fake** | Liveness confidence score is between XX and XX | AI‑generated liveness score. |
| **4. Document Capture & Validation** | PAN card is captured with acceptable image quality. | System image quality check |
|  | OCR extraction successful for all mandatory fields (name, DOB, document number, address) | OCR confidence scores; fields must be populated. |
|  | Extracted data matches with the data from UIDAI gathered via Aadhaar eKYC | Automated data consistency check. |
| **5. Declarations Acceptance** | AS opens, scrolls to the end, and confirms the Declaration for Account Opening with a checkbox. | Logs |
|  | AS opens, scrolls to the end, and confirms the FATCA Form (pre‑filled) with a checkbox. | Logs |
|  | AS opens, scrolls to the end, and confirms the Customer Application Form (CAF) | Logs |
|  | AS clicks "Confirm and Finish" with mobile OTP after all checkboxes are ticked. | OTP validation log |
| **5. Technical Integrity** | Complete, uninterrupted session recording from start to end. | System log of recording integrity |
|  | All mandatory metadata captured (geo‑tags, IP, timestamps, consent logs). | System audit log completeness. |
|  | No system‑detected spoofing attempts or critical errors during session. | AI fraud flags, error logs. |
# Appendix 5 — Self-Assessment Risk Matrix
(полная матрица из 22 строк: Compliance/Operational/Credit/Fraud/Technical Risk; Risk Issue; Existing Control; Manual/IT; Preventive/Detective; Operating effectiveness; Overall Control score; Residual Risk Score; Risk Interpretation. См. идентичную матрицу в файле 2.1-Self-VKYC-Business-Process.md → Appendix 3 и в этом SOP. Ключевые контроли: автосанкционный скрининг, CKYC ручная заливка DVU, PEP-алерт Compliance, CRILC автопроверка, NSDL/UIDAI/GST интеграции, deepfake/liveness AI, VPN-алгоритм, geo/IP, UIDAI API fallback на Offline/Officer KYC.)

---


<!-- ==== 1.2-Company-Onboarding-BANK-perspective.md ==== -->

# 1D - 1.2. Company/Entity Onboarding process from the BANK perspective

- [Business Overview]
- [Sub Process and Links]
- [Document Execution - Board Resolution]
- [Compliance Escalation Criteria]
- [Business Nature Questioner]
- [Documents]
- [Attributes]
- [Company(Private Limited /Public Limited)]
- [Attributes for Individual]
- [Documents required for Offline or Hybrid process- Incase Aadhaar eKYC not available]

Business Overview
To enhance the onboarding experience of customers , we aim to introduce a fully digital end-to-end onboarding framework, by optimizing existing process . This approach enables seamless customer acquisition through account opening within the digital banking platform with integrated eKYC and built-in VKYC verification along with auto population of entity data , documents, validation against registries and there by reduced manual interventions.
This section covers the onboarding process for legal entities, including **Public Limited Company and Private Limited Company** registered under applicable laws, along with the details of attributes and documents required during onboarding .
Нажмите здесь для раскрытия...
**Process Diagram**
The process includes the following key features:
- End-to-end digital onboarding journey from customer initiation to account activation
- Standardized Board Resolution (BR) format for account opening and authorization
- Digital document auto fetched from registry/ digital submission and validation, including valid authentication
- Identity verification of authorized signatories through eKYC and Video KYC (VKYC)
- Integration with external registries for company data validation
- Automated sanctions and regulatory screening
- FATCA/CRS classification and UBO identification
- Risk-based onboarding, enabling Straight Through Processing (STP) for low-risk entities
- Defined escalation framework involving DVU and Compliance for exception scenarios.
The solution is designed to balance customer convenience with regulatory compliance, ensuring proper authorization and audit readiness.
**Process Description**
| Step No. | Process Step | Description | Next Step/ Action | Process Type |
| --- | --- | --- | --- | --- |
| 01 | Initiate Online Onboarding | User/RM to select the type of account he wants to open , provide Mobile number , validates with OTP authentication which will be received to customer provided mobile number and proceed, then the deal moves to initiation phase | Proceed to step02 | STP |
| 02 | Provide Operating Instruction | Prospect to fill the required details and take a printout of the BR, Directors / Authorized officials to provide wet signatures on the printed document. The signed document will then be scanned and uploaded to the system, following which it will be digitally attested or Prospect will upload their own format of Board Resolution (Legally acceptable) | Proceed to step 03 | STP |
| 03 | Capture Business Nature Details | Capture Business Nature Details for risk categorization analysis | Auto Screening | STP |
| 04 | OBO- Auto Population of Data + Auto Upload of documents | Entity data to be auto populated from registry( respective list of attributes and documents as mentioned in below Attributes and Documents section )auto populate/upload of respective documents . | If data pre Populated and user confirms data then move to **step 08**If user wants to modify the details or data not available in registry then go to**step 6** | STP or Hybrid |
| 05 | User to fill data manually (Alert Trigger to DVU) | In Case data not auto populated then , User/DVU to fill data manually and upload respective documents | Validation step , if hybrid proceed to take confirmation on data from prospect, else proceed for offline process step 11 | To follow Hybrid approach or manual(Offline) |
| 06 | Prospect Edit data + Upload document | Incase data populated requires modification, prospect modifies the data and Upload proof of document for changes done | Proceed to step 07a | Hybrid |
| 07a | DVU validates the data | DVU team to validate the data | If check pass→ Parallel process (step 07 and step 08); if check fail stop onboarding process | Hybrid |
| 07 | KYC - Auto check against CKYC registry | Auto check against CKYC registry and other registry to validate the customer and entity information | Validation check + Check BGV required or not; if BGV required Alert to DVU ; else step 09 | STP |
| 08 | eKYC+VKYC process | Each authorized signatory to receive the link of signing and authorizing and performing Video KYC | Validation if KYC successful for all authorized signatory , proceed to step 09 , else alert DVU | STP |
| 09 | CBS - Account Opening | Account to be opened and to be in freeze mode + Net-Banking Credentials are generated and sent to the Customer with request to provide the Initial Deposit for Account Activation | Validation → Initial Deposit received → If Yes step 12 ; If no Send X no. of remainders to customer for online payment or cheque payment and freeze the account till payment is credited | STP |
| 10 | DVU team + BGV+ Screening | DVU team intervention to check the documents and perform the screening checks | If check ok proceed to **Step 09 , if check not proceed to step 11** | STP |
| 11 | Compliance Intervention | In Case of fraud suspicion , forged PAN , VCIP suspicion DVU push the alert to compliance | If DVU approve the case then proceed to step 09; else account not opened | Manual |
| 12 | Unfreeze account | Unfreeze account and allow to perform operations for users as defined in the operating instructions/board resolution | Account Opened and ready for operations | STP |
# Sub Process and Links
| Sub Process | Confluence Links |
| --- | --- |
| DVU | 1D - 3. DVU (Data Verification Unit) Process |
| Operating Instructions/ Board Resolution | 1D - 6. Operation Instruction Form (BoardResolution) vs role model in Internet Banking |
| VCIP(eKYC+VKYC) | 1D - 2. VCIP (Personal Identification) |
| BGV | 1D - 3.1. Criteria for BGV check |
| Risk Categorization | 1D - 5. Risk Categorization (Business Nature Questionnaire) |
# Document Execution - Board Resolution
| Process | Details (For Bank Provided BR) | Details (In case Customer wish to upload his own format of BR) |
| --- | --- | --- |
| Signing ( Document Execution & Attestation) | The Board Resolution and onboarding documents will be executed as follows: The customer downloads the Bank-provided Board Resolution format. The resolution is duly approved and signed by authorised officials (wet signature). The signed document is scanned and uploaded to the system **or** Prospect will upload their own format of Board Resolution (Legally acceptable). The document is then digitally attested using any of the following methods: Digital Signature Certificate (DSC)/eMudhra / eSign using OTP-based authentication | Document Upload: Customer uploads the Board Resolution document through the onboarding interface. Document Classification (IDP Check): The uploaded document is processed through the Intelligent Data Processing (IDP) system to identify and confirm whether the document qualifies as a valid Board Resolution. Content Extraction (OCR Processing): Upon successful classification, OCR technology is applied to extract relevant data fields, including authorized signatories and operating instructions. Validation of BR Content: The system validates the extracted data to ensure completeness, correctness, and compliance with defined BR requirements. Validation Outcome: If validation fails: The document is rejected, and the customer is prompted to re-upload a valid BR or use the bank-provided format. If validation is successful: The document is accepted for further processing. Initiation of KYC for Signatories: Based on the extracted details, system-generated links are sent to the authorized signatories identified in the BR for eKYC and VKYC |
# Compliance Escalation Criteria
Cases identified by the DVU team involving fraud suspicion, forged or invalid PAN, VCIP suspicion , high-risk profiles, or any other adverse findings shall be escalated to the Compliance team for further review and necessary action.
All relevant documents, including background verification (BGV) records and supporting evidence, shall be shared with Compliance for detailed assessment and decision-making.
Нажмите здесь для раскрытия...
Straight Through Process Process Diagram
STP Eligibility Criteria : For Entity Account Opening
| Criteria | Condition | Outcome | Outcome in case condition fail |
| --- | --- | --- | --- |
| Risk Classification | Entity classified as Low Risk as per the Bank's internal risk assessment framework | Eligible for STP | Manual Review |
| Sanctions Screening | No matches in sanctions/watchlists | Eligible for STP | DVU and Compliance Review |
| Data Availability | Entity information must be available in registry data base and verifiable | Eligible for STP | DVU Verification |
| Registry Validation | Company data available and matches with external registry | Eligible for STP | DVU Verification |
| PEP Status | No PEP associated in the Company | Eligible for STP | Compliance Review |
| FATCA Classification | Not classified as Passive NFFE | Eligible for STP | Compliance Review |
| Authorised Signatory KYC | eKYC & VKYC successfully completed. The authorized signatory must successfully complete eKYC and Video KYC (V-KYC) verification as per regulatory requirements. | Eligible for STP | Manual Intervention |
| Board Resolution | Valid BR submitted and digitally attested | Eligible for STP | DVU Verification |
| Background Verification (BGV) | Entity is on the market more than 2 years (Date of Incorporation) Annual financial Reports for 2+ years Government entities and public sector undertakings (PSUs) Regulated financial institutions (banks, insurance companies, NBFCs registered with RBI) Entities which are listed on NSE and BSE. | Eligible for STP | DVU and Compliance Review |
# Business Nature Questioner
As part of the onboarding process, a Business Nature Questionnaire is captured to understand the customer's business activities, profile, and risk indicators. The responses are used to support risk classification, compliance checks, and overall due diligence.
For detailed questionnaire structure and fields, please refer to the link : 1D - 5. Risk Categorization (Business Nature Questionnaire) (WORK IN PROGRESS)
# Documents
## Company(Private Limited /Public Limited)
| Document | Document Type | Probe | Mandatory | Action |
| --- | --- | --- | --- | --- |
| Entity Identification | Certificate of Incorporation | Y | Y | To be uploaded in case of document not fetched from Probe 42 or CKYC registry or in case any modifications done by user on respective section |
| | Memorandum of Association | Y | Y | |
| | Articles of Association | Y | Y | |
| | Company PAN Number | Y | Y | |
| Confirmation of Authority | Board of Directors Resolution to Open & Operate Bank account Senior Management Declaration | N | Y | Digital or To Be uploaded in case if Customer wants to use their own BR |
| Address Proof | Bank Statement / Utility Bill / IEC Certificate / GST certificate | N N N N | N | To be uploaded only in case of data not fetched from registry or validation fails at CKYC registry or in case address is changed |
| Additional Documents | Latest Shareholding Pattern(Optional) | Y |  | User is required to be upload/ provide a certificate from CA with valid UDIN no. in case of document not fetched from Probe 42 or in case any modifications done by user on respective section/ in changes in share holding pattern |
| | Form GST Reg-06 | N |  | GST Certificate (Mandatory only if annual turnover is > = INR 60 lakhs and date of incorporation is more than 6 months ) In case of data not fetched from data registry or data fetched from registry was different from that of populated data in that case prospect to upload the GST certificate |
| | Import Export Code Certificate(Optional) | N | N |  |
| | Customer Declaration |  |  | To be provided online (consent declaration ) |
| | Customer Application Form |  |  | System to Generate CAF based on details provided/submitted by customer |
# Attributes
## Company(Private Limited /Public Limited)
| Attribute | Attribute Name | Probe(Y/N) | Attribute Type (Example) | Logic for STP | Hybrid Process |
| --- | --- | --- | --- | --- | --- |
| **Account Details** | Account Number | N | 41010356900000000500 | An initial account number will be auto-generated by the system. The prospect will have the option to select a preferred account number. If the chosen number is available, the prospect may proceed with that selection. If the selected number is already allocated, the system will display a prompt requesting the prospect to choose an alternative number. | (то же самое) |
| **Basic Information** | Entity Type | Y | Private Limited Company / Public Limited Company | Auto populate from Probe | If data not available in Probe or data modified, user to upload supportive document - Certificate of Incorporation, Memorandum of Association |
| | Entity Name | Y | RKRCD8099B Public LTD | Auto populate from Probe 42 if data is available and is validated at CKYCR | If data not available in Probe or data modified, user to upload supportive document - COI, MOA, AOA |
| | Permanent Account Number (PAN) — "The entity does not have a PAN. I will provide Form 97" | Y | RKRCD8099B | Auto populate from Probe 42; also data provided by customer at initial stage of onboarding | If data modified, user to upload supportive document - PAN Card |
| | Corporate Identification Number (CIN) | Y | U12015DF4043PTC089193 | Auto populate from Probe 42 and is validated at CKYCR | if data not available in Probe 42 customer to manually enter the data and upload proof |
| | Date of Incorporation | Y | 18-04-2024 | Auto populate from Probe 42 if available and validated at CKYCR | if not available customer to manually choose the date from calendar |
| | Company Status | Y | Active | Auto populate from Probe 42 if available and validated at CKYCR | if not available customer to select manually from radio button. Sole Prop: validate in GST portal |
| | Residential Status | Y (logic from registered address) | Resident | Map registeredAddress.state; if Code = IN → Resident; else alert DVU | If data not available or modified, upload Address Proof |
| | Nationality | Y (logic from registered address) | India | Map registeredAddress.state; if Code = IN → Indian; else alert DVU |  |
| | Nature of Business/Industry |  | Medium SME |  |  |
| | GSTIN | Y | 05AAGCC3919D1Z0 | Auto populate from Probe | If not available or modified, upload GST Certificate |
| | LEI Code | Y | 18580076FXOHOWZ5XQ66 | Auto populate from Probe | If not available or modified, upload COI/MOA/AOA |
| | Official Website URL | Y | http://RKRCD8099B27oct10.co.in/ | Auto populate from Probe 42 | If not available, manual input |
| | Entity Overview | Y | (текст Probe42) | Auto populate from Probe 42 | If not available, manual input |
| **Contact Information** | Registered Address (Country, State, Address Line 1-3, PIN, Address Type, Correspondence Address Is Same As Registered) | Y | India Puducherry … 180024 Rental No | Auto populate from Probe 42 if available and validated at CKYCR | if not available customer to manually enter and upload supportive document |
| | Correspondence Address (Country, State, Lines, PIN, Type) | N | India Tamil Nadu … 180098 Rental | customer to manually enter if different from registered |  |
| | Entity Official Contact (Email, Contact Number) | Y | mayank18.jain@centrum.co.in / 18001036324 | Auto populate from Probe 42 if available and validated at CKYCR | if not available manual enter |
| **Financial Information** | Annual Turnover (INR) | Y | 3,24,56,54,356 | Auto populate from Probe 42 | if not available, fetch from Business nature section |
| **Shareholding Pattern** | Name, Designation, Shareholding (%), Number of Shares, Cessation Date | Y | XXXXXXX Director XXXXXX 444 - | Auto populate from Probe 42 if available | If not available or modified, upload Shareholding Pattern issued by CA with valid UDIN no. |
| **Total Exposure** | Amount (INR) | Y (CRILC) | 8,97,65,96,87,678 | **To be auto populated and stored in back end, not for customer to view** |  |
| **Credit Facility Information** | ASJK/ASIX — Bank IFSC, Bank Name, Branch address, Bank Account Number, Type of Facility, Amount (INR) | Y (CRILC) | UTIB0000009 … DEPOSIT … | **Auto populated from CRILC, stored back end, not for customer view** |  |
| **Additional Service** | Cheque Book | N (Select Option) | Yes/No |  |  |
## Attributes for Individual
### Authorized Signatory / Individual Information Online Onboarding For STP
| Field Name | Aadhaar(Y/N) | Description | Remarks |
| --- | --- | --- | --- |
| Prefix | Y (from Aadhaar) | Title of individual |  |
| First Name | Y (from Aadhaar) | Name of KMP |  |
| Middle Name | Y (from Aadhaar) | Middle Name of KMP |  |
| Last Name | Y (from Aadhaar) | Last Name of KMP |  |
| Date of Birth | Y (from Aadhaar) | DD/MM/YYYY |  |
| **Citizenship** | **Y (from Aadhaar)** | Nationality of KMP |  |
| Gender | Y (from Aadhaar) | Gender |  |
| Politically Exposed Person | N | Confirmation on link with any political party | Business Questioner |
| Residential Status | Y (from Aadhaar) | Country/State | Can be fetched with UIDAI |
| **Documents** — Permanent Account Number (PAN) | Y | PAN of individual/KMP | **OCR reads this data in VCIP process. For Offline/hybrid fields as-is process** |
| **Address Proof** — Permanent Address; Country; State; Address Line 1-4; PIN; Address Type; Correspondence Address is same as Registered | Y (from Aadhaar) / N (Address Type, Corresp.) | address info of individual/KMP | To take confirmation when data fetched from Aadhaar |
| **Contact information** — Email Address; Mobile Number | Y (from Aadhaar) | Email; Mobile |  |
| **Income Information** — TAX RESIDENT OF INDIA ONLY AND NOT OF ANY OTHER COUNTRY OUTSIDE INDIA | N | Confirmation if customer needs to fill KMP FATCA | Business Nature Questioner |
### Documents required for Offline or Hybrid process- Incase Aadhaar eKYC not available
| Field Name | Aadhaar(Y/N) | Description | Remarks |
| --- | --- | --- | --- |
| PAN Copy / "I don't have the PAN. I will provide Form 97" | N | Official document for those without PAN. **PAN is mandatory for Indian Nationals — Form 97 not applicable for them.** | Only for Offline/hybrid process |
| Identification Document | N | Select one: Aadhaar Card, Passport, Driving License, Voter ID Card, Letter by National Population Register, Job card issued by NREGA | Only for Offline/hybrid process |
| Identification Document — Globally accepted & valid Passport | N | Confirmation if Foreign national holds International Passport | Only for Offline/hybrid process |
| Identification Document Number | N | Document number | Only for Offline/hybrid process |
| Date of Issue / Date of Expiry / Country of Issue | N | даты/страна выдачи | Only for Offline/hybrid process |
| **Residence permit** — Type of Residence permit for India; Document Number; Date of Issue; Date of Expiry | N | immigration document | Only for Offline/hybrid process |

---


<!-- ==== 1.3-Partnership-Onboarding-BANK-perspective.md ==== -->

# 1D - 1.3. Partnership Onboarding process from the BANK perspective

- [Business Overview]
- [Process Diagram]
- [Sub Process and Links]
- [Document Execution - Authority Letter]
- [Compliance Escalation Criteria]
- [Straight Through Process (STP)]
- [STP Eligibility Criteria : For Partnership firm Account Opening]
- [List of required documents for Entity (Limited Liability Partnership/ Partnership)]
- [List of Attribute for LLP/Partnership :]
- [Attributes for Individual]
- [Documents required for Offline or Hybrid process- Incase Aadhar eKYC not available]

Business Overview
To enhance the onboarding experience of customers , we aim to introduce a fully digital end-to-end onboarding framework, by optimizing existing process . This approach enables seamless customer acquisition through account opening within the digital banking platform with integrated eKYC and built-in VKYC verification along with auto population of entity data , documents, validation against registries and there by reduced manual interventions.
This section covers the onboarding process for legal entities, including Limited Liability Partnership, Limited Partnership and Partnership
Нажмите здесь для раскрытия...
## Process Diagram
Key features: End-to-end digital onboarding; Standardized Authority Letter / Operating Instructions format; Digital document auto fetched from registry/digital submission and validation, incl. valid authentication; Identity verification of authorized signatories through eKYC and VKYC; Integration with external registries; Automated sanctions and regulatory screening; FATCA/CRS classification and Partners identification; Risk-based onboarding (STP for low-risk); Defined escalation framework involving DVU and Compliance.
### Process Description
| Step No. | Process Step | Description | Next Step/ Action | Process Type |
| --- | --- | --- | --- | --- |
| 01 | Initiate Online Onboarding | User/RM to select account type, provide Mobile number, validate with OTP, then deal moves to initiation phase | Proceed to step02 | STP |
| 02 | Capture Business Nature Details | Capture Business Nature Details for risk categorization analysis | Auto Screening | STP |
| 03 | OBO- Auto Population of Data + Auto Upload of documents | Entity data auto populated from registry; auto populate/upload of respective documents | If data pre-populated and user confirms → step 08; if modify or not available → step 6 | STP or Hybrid |
| 04 | User to fill data manually (Alert Trigger to DVU) | If data not auto populated, User/DVU to fill data manually and upload docs | Validation step; if hybrid → confirmation from prospect, else offline step 11 | Hybrid or manual(Offline) |
| 05 | Prospect Edit data + Upload document | If populated data requires modification, prospect modifies and uploads proof | Proceed to step 05a | Hybrid |
| 05a | DVU validates the data | DVU team to validate the data | If pass → step 6; if fail stop onboarding | Hybrid |
| 06 | Provide Operating Instruction | Prospect fills details and assigns Operating Instructions. User assigns admin to 1 partner or all partners. | Parallel process step 07 and step 08 | STP |
| 07 | KYC - Auto check against CKYC registry | Auto check against CKYC and other registry | Validation + check BGV; if BGV required Alert DVU; else step 09 | STP |
| 08 | eKYC+VKYC process | Each authorized signatory receives link to sign/authorize and perform Video KYC | If KYC successful for all → step 09, else alert DVU | STP |
| 09 | CBS - Account Opening | Account opened in freeze mode + Net-Banking Credentials generated, request Initial Deposit | Initial Deposit received → step 12; if no → reminders, freeze till credited | STP |
| 10 | DVU team + BGV+ Screening | DVU checks documents and screening | If ok → Step 09, if not → step 11 | STP |
| 11 | Compliance Intervention | Fraud suspicion / forged PAN / VCIP suspicion → DVU pushes alert to compliance | If DVU approve → step 09; else account not opened | Manual |
| 12 | Unfreeze account | Unfreeze and allow operations per operating instructions/BR | Account Opened and ready | STP |
# Sub Process and Links
| Sub Process | Confluence Links |
| --- | --- |
| DVU | 1D - 3. DVU (Data Verification Unit) Process |
| Operating Instructions/ Board Resolution | 1D - 6. Operation Instruction Form (BoardResolution) vs role model in Internet Banking |
| VCIP(eKYC+VKYC) | 1D - 2. VCIP (Personal Identification) |
| BGV | 1D - 3.1. Criteria for BGV check |
| Risk Categorization | 1D - 5. Risk Categorization (Business Nature Questionnaire) |
# Document Execution - Authority Letter
| Process | Details |
| --- | --- |
| Signing (Document Execution & Attestation) | The Authority Letter and onboarding documents executed as follows: The Prospect fills the Bank-provided Authority letter online. The duly filled and submitted Authority letter is sent to all the partners along with the link to conduct VKYC and eKYC and authenticate the same. Can be digitally attested using: Digital Signature Certificate (DSC)/eMudhra / eSign using OTP-based authentication / Mobile OTP authentication; stored using hashing method along with capturing of audit trail |
# Compliance Escalation Criteria
Cases identified by the DVU team involving fraud suspicion, forged or invalid PAN, VCIP suspicion, high-risk profiles, or any other adverse findings shall be escalated to the Compliance team for further review and necessary action. All relevant documents, including BGV records and supporting evidence, shall be shared with Compliance.
## Straight Through Process (STP)
## STP Eligibility Criteria : For Partnership firm Account Opening
| Criteria | Condition | Outcome | Outcome in case condition fail |
| --- | --- | --- | --- |
| Risk Classification | Entity classified as Low Risk per Bank's internal framework | Eligible for STP | Manual Review |
| Sanctions Screening | No matches in sanctions/watchlists | Eligible for STP | DVU and Compliance Review |
| Data Availability | Entity information available in registry and verifiable | Eligible for STP | DVU Verification |
| Registry Validation | Company data available and matches external registry | Eligible for STP | DVU Verification |
| PEP Status | No PEP associated in the Company | Eligible for STP | Compliance Review |
| FATCA Classification | Not classified as Passive NFFE | Eligible for STP | Compliance Review |
| Authorised Signatory KYC | eKYC & VKYC successfully completed by all required | Eligible for STP | Manual Intervention |
| Authority Letter / Operating Instruction | Valid Authority Letter submitted and digitally attested by all partners | Eligible for STP | DVU Verification |
| Background Verification (BGV) | Entity >2 years; financial reports 2+ years; PSUs; regulated FIs; listed on NSE/BSE | Eligible for STP | DVU and Compliance Review |
# Documents
## List of required documents for Entity (Limited Liability Partnership/ Partnership)
| Sl No. | Document Name | Probe for LLP | Probe for Partnership | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | Partnership Deed | Y | N | Y |  |
| 2 | Partnership Registration Certificate | Y | Y (if Firm is registered) | N | Non Mandatory ( Need only if Firm is registered) |
| 3 | Entity PAN Number | Y | Y | Y | Upload if not fetched from Probe 42 or CKYC or if modifications done |
| 4 | Partnership Authority Letter | N(filled online) | N (filled online) | Y |  |
| 5 | Proof of Address | N | N |  | Upload if not fetched from Probe 42 or CKYC or address change |
| 6 | GST Certificate (Optional) | N | N |  | Upload if not fetched or modified. Mandatory only if annual turnover >= INR 60 lakhs and incorporation >6 months |
| 7 | IEC Certificate(Optional) | N | N | N | Upload if not fetched or modified |
## List of Attribute for LLP/Partnership :
(Структура атрибутов идентична 1.2 Company, отличия: Entity Type = Limited Liability Partnership / Partnership; вместо CIN — **LLPIN** (U12015DF4043PTC089193, auto populate from Probe 42, validated at CKYCR; if not available manual + proof). Полный набор: Account Number; Entity Type; Entity Name; PAN (+"entity does not have PAN. I will provide Form 97"); LLPIN; Date of Incorporation; Company Status (Sole Prop → validate GST portal); Residential Status (map registeredAddress.state, IN→Resident); Nationality (IN→Indian); Nature of Business/Industry; GSTIN; LEI Code; Official Website URL; Entity Overview; Registered Address; Correspondence Address (N); Entity Official Contact; Annual Turnover; Total Exposure (CRILC, back-end, not for customer view); Credit Facility Information ASJK/ASIX (CRILC, back-end); Cheque Book (Yes/No). Логика STP/Hybrid — как в 1.2.)
# Attributes for Individual
## Authorized Signatory / Individual Partners Information Online Onboarding For STP
| Field Name | Aadhar(Y/N) | Description | Remarks |
| --- | --- | --- | --- |
| Prefix / First Name / Middle Name / Last Name / Date of Birth | Y (from Aadhar) | данные KMP |  |
| **Citizenship** | **Y (from Aadhar)** | Nationality of KMP |  |
| Gender | Y (from Aadhar) | Gender |  |
| Politically Exposed Person | N | link with political party | Business Questioner |
| Residential Status | Y (from Aadhar) | Country/State | Can be fetched with UIDAI |
| **Documents** — PAN | Y | PAN of individual/KMP | **OCR reads this in VCIP. Offline/hybrid as-is** |
| **Address Proof** — Permanent Address; Country; State; Address Line 1-4; PIN; Address Type; Correspondence same as Registered | Y (from Aadhar) / N | address info | confirm when fetched from Aadhar |
| **Contact** — Email; Mobile Number | Y (from Aadhar) |  |  |
| **Income** — TAX RESIDENT OF INDIA ONLY AND NOT OF ANY OTHER COUNTRY OUTSIDE INDIA | N | KMP FATCA confirmation | Business Nature Questioner |
## Documents required for Offline or Hybrid process- Incase Aadhar eKYC not available
| Field Name | Aadhar(Y/N) | Description | Remarks |
| --- | --- | --- | --- |
| PAN Copy / "I don't have the PAN. I will provide Form 97" | N | для тех, у кого нет PAN. **PAN mandatory for Indian Nationals — Form 97 not applicable for them.** | Only Offline/hybrid |
| Identification Document | N | Aadhaar Card / Passport / Driving License / Voter ID / Letter by NPR / NREGA Job card | Only Offline/hybrid |
| Identification Document-Globally accepted & valid Passport | N | confirm if Foreign national holds International Passport | Only Offline/hybrid |
| Identification Document Number; Date of Issue; Date of Expiry; Country of Issue | N |  | Only Offline/hybrid |
| **Residence permit** — Type for India; Document Number; Date of Issue; Date of Expiry | N |  | Only Offline/hybrid |

---


<!-- ==== 1.4-Sole-Prop-Onboarding-BANK-perspective.md ==== -->

# 1D - 1.4. Sole Prop Onboarding process from the BANK perspective

- [Business Overview]
- [Document Execution - Authority Letter]
- [Compliance Escalation Criteria]
- [Documents]
- [List of required documents for Entity Sole Proprietorship]
- [List of Attribute for Sole Prop]
- [Attributes for Individual]
- [Documents required for Offline or Hybrid process- Incase Aadhar eKYC not available]

Business Overview
The sole proprietorship onboarding process is designed to facilitate seamless account opening for individual-owned business entities, where the proprietor and the business are treated as a single legal entity. This process focuses on validating both the identity of the proprietor and the existence of the business through reliable registry and documentation checks.
This solution is implemented to enable a fully digital and streamlined onboarding experience, leveraging automated data fetching (via PAN), Aadhaar-based eKYC verification, and video-based customer identification (VCIP).
The process minimizes manual intervention while ensuring compliance with regulatory requirements related to KYC, AML screening, and due diligence. The onboarding journey supports STP for low-risk and complete cases, while routing exceptions and discrepancies to manual review (DVU).
**Process Description**
| Step No. | Process Step | Description | Next Step/ Action | Process Type |
| --- | --- | --- | --- | --- |
| 01 | Initiate Online Onboarding | User/RM selects account type, provides Mobile number, validates with OTP, deal moves to initiation | Proceed to step02 | STP |
| 02 | Capture Business Nature Details | Capture Business Nature Details for risk categorization | Auto Screening | STP |
| 03 | OBO- Auto Population of Data + Auto Upload of documents | Entity data auto populated from registry; auto populate/upload docs | If pre-populated & confirmed → step 08; if modify/not available → step 6 | STP or Hybrid |
| 04 | User to fill data manually (Alert Trigger to DVU) | If not auto populated, User/DVU fills manually + upload docs | Validation; if hybrid → prospect confirm, else offline step 11 | Hybrid or manual(Offline) |
| 05 | Prospect Edit data + Upload document | Modify populated data + upload proof | Proceed to step 05a | Hybrid |
| 05a | DVU validates the data | DVU validates | If pass → step 6; if fail stop | Hybrid |
| 06 | Provide Operating Instruction + Sole Prop Declaration | Prospect fills required details and provides the declaration | Parallel process step 07 and step 08 | STP |
| 07 | KYC - Auto check against CKYC registry | Auto check against CKYC + other registry | Validation + check BGV; if BGV req Alert DVU; else step 09 | STP |
| 08 | eKYC+VKYC process | Each authorized signatory receives link to sign/authorize/perform Video KYC | If KYC successful → step 09, else alert DVU | STP |
| 09 | CBS - Account Opening | Account opened in freeze mode + Net-Banking Credentials, request Initial Deposit | Deposit received → step 12; else reminders + freeze | STP |
| 10 | DVU team + BGV+ Screening | DVU checks docs + screening | If ok → Step 09, if not → step 11 | STP |
| 11 | Compliance Intervention | Fraud / forged PAN / VCIP suspicion → DVU pushes to compliance | If DVU approve → step 09; else not opened | Manual |
| 12 | Unfreeze account | Unfreeze, allow operations per operating instructions/BR | Account Opened | STP |
## Sub Process and Links
| Sub Process | Confluence Links |
| --- | --- |
| DVU | 1D - 3. DVU (Data Verification Unit) Process |
| Operating Instructions/ Board Resolution | 1D - 6. Operation Instruction Form (BoardResolution) vs role model in Internet Banking |
| VCIP(eKYC+VKYC) | 1D - 2. VCIP (Personal Identification) |
| BGV | 1D - 3.1. Criteria for BGV check |
| Risk Categorization | 1D - 5. Risk Categorization (Business Nature Questionnaire) |
# Document Execution - Authority Letter
| Process | Details |
| --- | --- |
| Signing (Document Execution & Attestation) | The Operating Instruction for Sole Prop executed as follows: The Prospect fills the Bank-provided Operating Instruction online. The prospect then needs to authenticate the duly filled form during the eKYC and VKYC session. Can be digitally attested using: DSC/eMudhra / eSign using OTP-based authentication / Mobile OTP authentication; stored using hashing method + audit trail |
# Compliance Escalation Criteria
Cases identified by the DVU team involving fraud suspicion, forged or invalid PAN, VCIP suspicion, high-risk profiles, or adverse findings escalated to Compliance. All relevant documents (incl. BGV) shared with Compliance.
STP Eligibility Criteria : For Sole Prop Account Opening — (идентично 1.3/1.2: Risk Classification Low; Sanctions no match; Data Availability; Registry Validation; PEP none; FATCA not Passive NFFE; Authorised Signatory KYC eKYC&VKYC; Authority Letter / Operating Instruction valid & digitally attested by all authorised signatory; BGV exception criteria — >2 yrs / 2+ fin reports / PSU / regulated FI / NSE-BSE listed.)
# Documents
## List of required documents for Entity Sole Proprietorship
| Sl No. | Document Name | Details | Probe(Y/N) | Mandatory | Remarks |
| --- | --- | --- | --- | --- | --- |
| 1 | PAN | PAN Number | Y | Y | Upload if not fetched from registry or modified |
| 2 | Address Proof 1 | **Select any one from TABLE A**: Udyam Registration Certificate (URC); Shop & Establishment Certificate / Trade License; GST Registration Certificate; Professional Tax Registration Certificate; Importer Exporter Code (IEC) Certificate; License under Drugs Control / FSSAI / Medical Council; Business Registration Certificate under any Government Act; Permission / Certificate from State or Central Government Authority (SEZ/STP/EOU/DTA/EPZ Units); Factory Registration Certificate (State / Central Authority); IRDA / SEBI Registration Certificate (if applicable); License to Sell / Stock / Exhibit Goods (State / Union Government); Pesticides / Insecticides License under Insecticides Rules; Certificate / Permission issued by Village Panchayat / Block Development Officer / Zilla Parishad | N |  | If registry validation failed, customer uploads any one document from address proof 1 list |
| 3 | Address Proof 2 | **Select any one from TABLE A (как выше) OR TABLE B**: Latest Income Tax Return (acknowledged by IT Dept showing firm's name); Utility Bill (Electricity / Water / Broadband / Landline – in firm's name, not older than 3 months); Latest Property Tax Bill / Rent Bill (in firm's name); Bank account statement or passbook; Annexure II | N |  | If registry validation failed, upload any one document from address proof 2 list |
| 5 | Import Export Code Certificate (Optional) | Additional documents | N | N | Upload if not fetched or modified |
| 6 | Form GST Reg-06 | Additional documents | N |  | Mandatory only if annual turnover >= INR 60 lakhs and incorporation >6 months |
| 7 | POA Letter (if applicable) | Confirmation Of Authority | N | N | Submit only if Power of Attorney is issued |
| 8 | Nomination Form DA1 | To be Downloaded and uploaded |  |  |  |
| 9 | Annexure II | Download & Upload |  |  |  |
## List of Attribute for Sole Prop
(Структура идентична 1.2 Company; отличия: Entity Type = Sole Proprietorship; **нет CIN/LLPIN** (только PAN); Company Status — "In case of Sole Proprietorship: To be validated in GST portal". Полный набор атрибутов и логики STP/Hybrid — см. 1.2-Company-Onboarding-BANK-perspective.md → раздел Attributes. Включает: Account Number; Entity Type; Entity Name; PAN; Date of Incorporation; Company Status; Residential Status; Nationality; Nature of Business/Industry; GSTIN; LEI; Website URL; Entity Overview; Registered/Correspondence Address; Entity Official Contact; Annual Turnover; Total Exposure (CRILC back-end); Credit Facility Information (CRILC back-end); Cheque Book.)
# Attributes for Individual
## Authorized Signatory/Sole Prop Individual Information : Online Onboarding For STP
(Идентично 1.2/1.3 Individual-таблице: Prefix/First/Middle/Last Name, DOB, Citizenship, Gender — Y from Aadhar; PEP — N (Business Questioner); Residential Status — Y from Aadhar; PAN — Y (OCR in VCIP); Address Proof block — Y from Aadhar; Email/Mobile — Y from Aadhar; TAX RESIDENT OF INDIA ONLY… — N (Business Nature Questioner). См. 1.2 → Attributes for Individual.)
## Documents required for Offline or Hybrid process- Incase Aadhar eKYC not available
(Идентично 1.2/1.3: PAN Copy / "I don't have the PAN. I will provide Form 97" (N; PAN mandatory for Indian Nationals → Form 97 не применим); Identification Document (Aadhaar Card / Passport / Driving License / Voter ID / Letter by NPR / NREGA Job card); Identification Document-Globally accepted & valid Passport; Identification Document Number; Date of Issue; Date of Expiry; Country of Issue; Residence permit block. См. 1.2.)

---


<!-- ==== 2-VCIP-Personal-Identification.md ==== -->

# 1D - 2. VCIP (Personal Identification)

# Definition
As per RBI Master Direction:
**Video based Customer Identification Process (V-CIP)** — is an alternate method of customer identification with facial recognition and customer due diligence by an authorised official of the RE by undertaking seamless, secure, live, informed-consent based audio-visual interaction with the customer to obtain identification information required for CDD purpose, and to ascertain the veracity of the information furnished by the customer through independent verification and maintaining audit trail of the process. Such processes complying with prescribed standards and procedures shall be treated on par with face-to-face CIP for the purpose of this Master Direction.

# Conditions to undertake V-CIP
As per RBI Master Direction (https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12089&Mode=0)

**V-CIP Infrastructure**
1. The technology infrastructure should be housed in own premises of the RE and the V-CIP connection and interaction shall necessarily originate from its own secured network domain. Any technology related outsourcing for the process should be compliant with relevant RBI guidelines.
2. The RE shall ensure end-to-end encryption of data between customer device and the hosting point of the V-CIP application, as per appropriate encryption standards. The customer consent should be recorded in an auditable and alteration proof manner.
3. The V-CIP infrastructure / application should be capable of preventing connection from IP addresses outside India or from spoofed IP addresses.
4. The video recordings should contain the live GPS co-ordinates (geo-tagging) of the customer undertaking the V-CIP and date-time stamp. The quality of the live video in the V-CIP shall be adequate to allow identification of the customer beyond doubt.
5. The application shall have components with face liveness / spoof detection as well as face matching technology with high degree of accuracy, even though the ultimate responsibility of any customer identification rests with the RE. Appropriate AI technology can be used to ensure that the V-CIP is robust.
6. Based on experience of detected / attempted / 'near-miss' cases of forged identity, the technology infrastructure including application software as well as work flows shall be regularly upgraded. Any detected case of forged identity through V-CIP shall be reported as a cyber security event under extant regulatory guidelines.
7. The V-CIP infrastructure shall undergo necessary tests such as Vulnerability Assessment, Penetration testing and a Security Audit to ensure its robustness and end-to-end encryption capabilities. Any critical gap shall be mitigated before rollout. Tests by accredited agencies as prescribed by RBI, periodically.
8. The V-CIP application software and relevant APIs / webservices shall also undergo appropriate testing of functional, performance, maintenance strength before being used in live environment. Only after closure of any critical gap should the application be rolled out. Periodic tests too.

**2. V-CIP Procedure**
1. Each RE shall formulate a clear work flow and SOP for V-CIP and ensure adherence. The V-CIP process shall be operated only by officials of the RE specially trained. The official should be capable to carry out liveliness check and detect fraudulent manipulation or suspicious conduct and act upon it.
2. If there is a disruption in the V-CIP procedure, the same should be aborted and a fresh session initiated.
3. The sequence and/or type of questions, including those indicating the liveness of the interaction, shall be varied to establish that interactions are real-time and not pre-recorded.
4. Any prompting, observed at end of customer shall lead to rejection of the account opening process.
5. The fact of the V-CIP customer being an existing or new customer, or if it relates to a case rejected earlier or if the name appearing in some negative list should be factored in at appropriate stage of work flow.
6. The authorised official performing the V-CIP shall record audio-video as well as capture photograph of the customer and obtain the identification information using any one of: OTP based Aadhaar e-KYC authentication; Offline Verification of Aadhaar; KYC records downloaded from CKYCR (Section 56, using KYC identifier); Equivalent e-document of OVDs including documents issued through DigiLocker.
7. RE shall ensure to redact or blackout the Aadhaar number in terms of Section 16.
8. If the address of the customer is different from that indicated in the OVD, suitable records of the current address shall be captured. Economic and financial profile/information submitted shall be confirmed from the customer during V-CIP.
9. RE shall capture a clear image of PAN card to be displayed by the customer during the process, except where e-PAN is provided. PAN details verified from the database of the issuing authority including through DigiLocker.
10. Use of printed copy of equivalent e-document including e-PAN is not valid for the V-CIP.
11. The authorised official shall ensure that photograph of the customer in the Aadhaar/OVD and PAN/e-PAN matches with the customer undertaking the V-CIP and identification details match with details provided.
12. Assisted V-CIP shall be permissible when banks take help of Banking Correspondents (BCs) facilitating the process only at the customer end. Banks shall maintain details of the BC. Ultimate responsibility for CDD is with the bank.
13. All accounts opened through V-CIP shall be made operational only after being subject to concurrent audit, to ensure the integrity of process and acceptability of outcome.
14. All matters not specified but required under other statutes such as the IT Act shall be appropriately complied with.

**3. V-CIP Records and Data Management**
1. The entire data and recordings of V-CIP shall be stored in a system / systems located in India. Video recording stored safely & securely with date/time stamp for easy historical data search. Extant record management instructions apply.
2. The activity log along with credentials of the official performing the V-CIP shall be preserved.

# Self VKYC Business Process - 1D - 2.1. Self VKYC Business Process
(см. файл 2.1-Self-VKYC-Business-Process.md)

> Прим.: в коде/прототипе для facial recognition рассматривается Sber **SmartBio SDK** (live liveness checks). См. дублирующую расширенную версию страницы в analytics-and-research.md → "Копия 1D - 2. VCIP" (там детальный пошаговый VCIP + Officer-assisted scenario с действиями VKYC Officer).

---


<!-- ==== 2.1-Self-VKYC-Business-Process.md ==== -->

# 1D - 2.1. Self VKYC Business Process

# Business Description / Purpose
Define the standard, secure, legally compliant workflow for a **fully automated Video KYC (Self VKYC)** — remote onboarding of new corporate customers for the Sberbank Branch in India, verifying identity of Authorised Signatories (AS) / Directors / UBOs / Partners, per RBI guidelines.
Primary objectives: 1. Standardize Operations; 2. Mitigate Fraud Risk (IP analysis, liveness detection, spoofing prevention, biometric matching); 3. Define Roles and Responsibilities; 4. Ensure Audit Trail (time-stamped tamper-evident record: video, consent logs, geolocation, validation outputs).
## Scope — Individuals by Legal Entity Type
| Legal Entity Type | Individual |
| --- | --- |
| Sole-Proprietorship | Proprietor |
| Private Limited Company | Authorised Signatories, Beneficial Owners |
| Limited Liability Partnership | Partners, Beneficial Owners |
| Limited Partnership | Partners, Beneficial Owners |
| Public Limited Company | Authorised Signatories, Beneficial Owners |
| Partnership | Partners, Beneficial Owners |
**Application Scenarios:** New Customer Onboarding; Re-KYC (scheduled periodic re-verification); Event-driven KYC (existing customers, triggered by defined events).
# Prerequisites (RBI)
| # | Section | Description | Source |
| --- | --- | --- | --- |
| 1 | Bank Infrastructure | Technology infrastructure housed in own premises; V-CIP connection from own secured network domain. End-to-end encryption between customer device and V-CIP application hosting point. | RBI Master Direction (a)(c) |
| 2-4 | IP / GPS | Check Customer IP — must be within Indian borders; prevent connection from IPs outside India or spoofed; live GPS co-ordinates (geo-tagging) + date-time stamp. | RBI MD |
| 5 | Data storage | Store records & customer data, infrastructure in own premises of the Bank and in India. | RBI MD |
| 6 | Liveness | Face liveness / spoof detection + face matching with high accuracy. | RBI MD |
| 7 | Mandatory participants | Resident Indian individuals only; individuals above 18 years. | RBI MD (b); Bank of Maharashtra |
| 8 | OVD | During VKYC only personal documents checked (no company docs). Two mandatory documents per participant for OSV: Identity proof PAN card / Aadhaar; Address proof Driving licence / Passport / Voter ID / Masked Aadhaar Card / NREGA Job Card. Aadhaar can be replaced by another OVD if bank can validate OVD number. Bank checks & uploads sample of signatures. If identity/address doc changed → re-perform VKYC/KYC. | RBI MD (b) |
| 9 | 1 participant in N companies | If 1 person participates in few companies (signatory/BO), Bank holds VKYC session per company. But if onboarding done simultaneously for several companies, one VKYC session is sufficient. | RBI MD (b) |
| 10 | OVD & Data validation | Compare individual in video-call with photo in documents; compare live signature with signature in documents; compare valid documents; GEO-tags valid. | RBI MD (a)(b) |
| 11 | Expiration | Video KYC recording valid for bank identification 180 days. At 90 days expiry (onboarding not completed) → VKYC must be re-done; auto e-mail to RM at 90 days; RM follows up Signatory, can reschedule VKYC or offer Offline KYC. All signatories must complete VKYC within 90 days. Auto e-mail to RM at 180 days. | Compliance agreement |
# Roles and Responsibilities
| Role | Key responsibilities |
| --- | --- |
| Authorised Signatory | Access VKYC link within allotted time; complete authentication via mobile OTP; review & accept consents; authenticate against Aadhaar eKYC via QR code; perform on-screen actions; present original documents |
| DVU | Review recording of VCIP session; approve/disapprove correctness of captured data; handle alerts; escalate to Compliance if needed |

# Self VKYC of a New Customer (Automated, Without KYC Officer)
Tables A–D (Process Flow / Aadhaar eKYC Sub Process / Self VKYC Process Flow / Verification of Identity Documents) — **идентичны 1.1-SOP-Corporate-Customer-Onboarding.md → Table A/B/C/D**. Отличия этой версии: link lifespan "X day" (placeholder); 5 OTP attempts → **permanently blocked** (в 1.1 — temporary); вместо Concurrent Audit alert — "Alert to DVU for manual check"; Aadhaar QR eKYC — primary method for MVP stage; присутствует под-сценарий **04A Hybrid KYC** (session terminated, DVU contacts & instructs AS). CAF включён в Declarations Dashboard.
# Appendix 1 — Abbreviations
AI; API; AS; CKYCR (Central KYC Records Registry); DVU; EDD; FATCA; GPS; KYC; OCR; OVD; RM; STP; UIDAI; VCIP; VKYC; VPN; Prospect; Hybrid Process (semi-automated; certain stages via STP, others manual by DVU/Compliance due to data unavailability/mismatch, medium/high risk, VCIP failed/suspicious, eKYC not successful, screening alert).
# Appendix 2 — Success Criteria for VKYC
Идентично 1.1-SOP → Appendix 4 (Authentication / Geographic Presence & VPN / Liveness & Deepfake / Document Capture & Validation / Declarations Acceptance / Technical Integrity).
# Appendix 3 — Self-Assessment Risk Matrix
9 строк (Fraud: spoofing deepfakes/3d masks/forged videos; forged/stolen/tampered docs; VPN; Compliance: failure to capture consents; customer not in India; Operational/Technical: system failure → incomplete recording; poor video quality; UIDAI API failure). Existing controls: AI spoof/forgery detection + manual alert; VPN algorithm; alternative KYC paths; real-time IP geolocation/GPS; camera quality check; alert to Operations + relaunch. Идентична соответствующим строкам 1.1-SOP → Appendix 5.

---


<!-- ==== 2.1-SOP-for-VKYC.md ==== -->

# 1D - 2.1. SOP for VKYC

# Open Questions (verbatim, с ответами команды)
| Questions | Replies |
| --- | --- |
| What is the lifespan of the email link to enter the Guest Zone? | 180 days. Q2 goal: decommission personal link and move to Unified login/Prospect onboarding cabinet. Бессрочно, но стоит сходить в OBO за уточнением, тк они управляют гостевой зоной (Даниловский Дмитрий) |
| What is the allotted time to enter the Guest Zone? | The same as Q1 |
| What is the number of attempts to enter the OTP? | 5 attempts. Q2 goal: move to Internet bank approach with temporary block |
| Geotagging on wifi — not given by indian providers. | Определяем геолокацию из браузера, такой проблемы не существует. |
| What is the allotted time to complete the VCIP session? | В течении одного дня |
| What are the criteria for IP address spoofing check? | Проверка есть, алгоритм большой: VKYC IP, VPN, GPS Validation (confluence CLDRAML) |
| What tool we will use for self VKYC, faceliveness check, document capturing? | Self VKYC — Jazz; face liveness — SDK Liveness; document capturing — DocVision |
| Device requirements (camera resolution)? Clients prefer mobile | Есть требования к разрешению камеры, уточню у Яши |
| Minimal thresholds for internet connection (upload/download speed, latency, packet loss)? | Полный перечень тех требований: developers.sber.ru/help/jazz/guide/system-requirements |
| List of technical issues during initial checks of internet/device readiness? | MediaCheck — проверка камеры и звука до подключения; также проверка качества интернет-соединения во время видеовстречи |
| What interactions during faceliveness check? Thresholds (confidence score)? | Только повороты головы |
| How many attempts to complete the faceliveness check? | Одна попытка на прохождение проверки faceliveness |
| What metrics during faceliveness (skin texture, micro movements, natural shadows, skin tone, natural execution)? | внутренняя кухня SDK Liveness, в SOP не надо выносить |
| Criteria (confidence score) for OCR recognition of captured documents? | на основе шаблонов типовых документов |
| How many attempts to capture documents? | пока документ не будет распознан OCR — нельзя перейти к след шагу |
| How we detect type of document shown by user? | сравнение с шаблоном документа в режиме реального времени |
| How to verify face photo vs Aadhaar photo if age difference significant? | на этапе бизнес-анализа, ответа пока нет |
| Overall thresholds to complete vcip (liveness, OCR confidence)? | если все проверки пройдены успешно — сессия успешна. Проверки: Deep fake, liveness, OCR, photo recognition |
| Threshold for alert generation (mismatch of docs / video vs aadhaar photo)? How Officer processes alert? | Если одна из проверок не пройдена — алерт на DVU. Geo-location mismatch / Damaged PAN or Aadhar card shown / Call interrupted/disconnected by customer. Alert will have signatory details + reason + button to go to customer card. DVU views recording, decides Allow/Block — Naveen |
| Если фрод по PAN то алерт на CISO | генерируется алерт на DVU |
| Что делать при подозрении на фрод во время self-VCIP? DVU не проводит видео, только верифицирует. Если фрод подтвердился? | генерируется алерт на DVU, далее он может отправить на комплаенс, либо апрувят |

# Scope / Prerequisites / Roles
Аналогично 2.1-Self-VKYC-Business-Process.md (Individuals by entity type; RBI infra prerequisites; Roles AS/DVU).
# Scenario 1: VKYC of a New Customer (Automated, Without KYC Officer)
Этот вариант SOP описывает **Offline eKYC (XML-file)** путь (не QR): AS redirected to UI for Offline eKYC — 4-step guide: 1) Visit Official UIDAI Portal; 2) Download XML KYC File (login Aadhaar + OTP, create 4-digit share code); 3) Upload XML + share code to platform; 4) Get verified. Link **lifespan 30 days**, reusable, inactive on completion or 30-day expiry. OTP allotted time 3 minutes.
**Tables A–C** (Process Flow / VCIP Process Flow / Verification of Identity Documents) — структурно как в 1.1/2.1-Self, но: consent dashboard со СCKYC consent; IP risk evaluation logic (Low Risk: India + VPN/proxy → option to restart; High Risk: outside India / blacklist → alert DVU → offline KYC); pre-session connection & video quality check (camera test + network upload/download/latency/packet loss vs predefined thresholds); guided active liveness (turn head circle / blink twice / smile); post-session validation with UIDAI **and CKYCR** + facial matching (one-to-one vs UIDAI photo).
# Detailed Description (Stage 1 — Session Initiation & Access Control)
- **Para 1 Receiving the invitation link:** personalized link auto-generated after Operating Instructions completed; cryptographically unique, tied to Application ID + specific AS. Lifespan 30 days from first dispatch; reusable; inactive on completion or 30-day expiry. Sent to AS email; logged.
- **Para 2 Authentication in Guest Zone:** OTP to mobile in Operating instructions; 3 min validity; success → Guest Zone; failure → request new OTP.
- **Para 3 Consent Collection & Aadhaar Authorization:** Consent Collection Dashboard with 5 core links (Account Opening Declaration; Operational Instructions; Terms & Conditions; VKYC & eKYC Consent; Basic Account Information). Click to open each, scroll-to-bottom → "viewed" → checkbox active. After all ticked → "Authorize & Proceed" → Aadhaar OTP (dual purpose: legally valid digital signature + secure consent-based request to UIDAI for Aadhaar details + official photograph = benchmark for facial recognition). Consent log + Aadhaar token stored as part of KYC record.
- **Para 3 IP Address Checks:** real-time analysis vs threat intelligence. Successful = India + no spoofing. Unsuccessful → risk scoring. Low Risk: India + VPN/proxy → restart with instructions. High Risk: outside India / blacklist → alert to DVU → offline KYC.
- **Para 5 Pre-Session Technical Readiness:** redirect to VCIP Module; camera + geolocation permission; camera test (lighting, stable clear face); network quality (upload/download speed, latency, packet loss vs predefined thresholds). Pass → start recording. Fail → guidance message + re-test loop.
# Stage 2 VCIP Session
- **Para 6 Live Video Session:** recording indicator; guided active liveness (turn head circle / blink twice / smile); AI face liveness + capture multiple high-res frontal photos. Success → proceed. Failure (spoofing/unnatural) → terminate + high-priority alert to VKYC Officer; recorded session retained as evidence.
- **Para 7 Document Capture & Validation:** Aadhaar Card Front (OCR: Full Name, Aadhaar Number, DOB, Gender) → Back (Registered Address) → Additional Identity proof (Passport/DL/Voter ID; OCR Document Number, Full Name, DOB; AI classifies type). Retry on OCR fail. Session closure message + redirect.
- **Para 8 Post Session Validation:** AI validates OCR vs UIDAI **and CKYCR**. A. UIDAI: Aadhaar number exists/active/matches; personal details (Name, DOB, Gender) exact match. B. CKYCR: query for existing KYC record + red flags. Facial Matching: one-to-one live vs UIDAI/document photo. Success → email/SMS to AS. Failure → high-priority alert to DVU + escalation for manual review.
# Scenarios 2 & 3 (Existing Customer Re-KYC; Event-driven KYC) — diagrams/descriptions TBD.
# Approval and Rejection Criteria / Security and Data Management — TBD.

---


<!-- ==== 2.2-VKYC-with-VKYC-Officer.md ==== -->

# 1D - 2.2 VKYC with VKYC Officer

# Roles and Responsibilities / Detailed Step-by-Step Workflow

## Scenario 1 — VKYC of a New Customer with VKYC Officer
Officer participation as authorised official of the Bank is mandatory.
### Authentication of a New Customer to join VKYC (steps)
1. Bank receives the CKYC Identifier from the Customer (Caldera) → VKYC Officer logs in to VKYC Procedure from laptop #1.
2. VKYC Officer logs in to VKYC Procedure from laptop #1 (Officer has 2 laptops: #1 VKYC, #2 CKYC Portal) (Jazz / CKYC Portal) → log in to CKYC web portal from laptop #2.
3. Log in to CKYC web portal from laptop #2 → OTP sent to Customer.
4. OTP sent to Customer (CKYC Portal) → Customer provides OTP to Bank officer.
5. Customer provides OTP → Officer enters OTP in CKYC web portal.
6. Officer enters OTP → searches records of Individual on CKYC portal OR reinitiates process (if OTP mismatch).
7. Reinitiate (OTP mismatch) → Customer provides OTP again.
8. Officer searches records on CKYC portal (personal docs stored at CKYC) → compares CKYC portal records with individual documents.
9. Officer compares CKYC portal records vs documents uploaded to Caldera → VKYC SUCCESSFUL or FAILED (event generated for CIF).
10/11. SUCCESSFUL (docs match) / FAILED (docs don't match).
### VKYC of a New Customer (key steps, Caldera/Jazz)
RM: Create CIF → check all info/docs uploaded → open "Signatories KYC" tab → check availability of VKYC Manager & Signatories → input meeting details per Signatory → press "Schedule" → email with date/time/link auto-sent to participant + Outlook event for VKYC Manager & RM → notification 30 min before. VKYC Manager: open CIF via link, join via "Join", press "Allow Participant to the call". Signatory: log in via unique link, get to Guest Zone, join via "Join". Officer "Start VKYC". Event to KYC Module with VKYC results → VKYC Complete / Failed. On FAILED: report to RM → contact Signatory → reschedule or cancel onboarding (CIF archived). Compliance review path if fraud suspicion.

## Scenario 3 — VKYC of Existing Customer during Re-KYC with Officer (key steps)
KYC Update Alert / REKYC Alert → RM requests required documents from Signatories → schedules VKYC in CIF "Signatories KYC" → VKYC SCHEDULED (Jazz link) → notification → VKYC Procedure → COMPLETE/FAILED. On Complete: RM performs Risk Categorisation (KYC IN PROGRESS) → Compliance review (can edit risk category, approve, request info) → Senior Operator authorizes Customer card → KYC Due Date updated (auto per risk category) / changes saved. VKYC COMPLIANCE REVIEW path if fraudster reported → Compliance review → COMPLETE or Customer Card BLOCKED.

## Scenario 5 — Event-driven VKYC during KYC Update with Officer (Jazz steps)
Officer confirms readiness → waiting screen → Signatory confirms readiness → Officer "Allow" → Connection quality check (microphone, camera) → Client verification check (personal details, questions on left of screen) → Documents check → Officer can Leave call anytime → Submit VKYC result: "Mark as Failed" / "Complete" → Leave comments → "Not Report" (FAILED, no compliance) / "Report" (COMPLIANCE REVIEW) → if Complete = COMPLETE; if Report → notification to Compliance Officer → Compliance check → COMPLETE or BLOCKED.

## Scenarios 2, 4, 6 (Automated variants) — descriptions/diagrams TBD.
# Approval and Rejection Criteria / Security and Data Management — TBD.

> Системы: **Caldera** (CIF, scheduling, statuses), **Jazz** (видеозвонок), **CKYC Portal** (записи физлиц). Officer-assisted = ручной режим, в отличие от Self VKYC.

---


<!-- ==== 2.3-SOP-for-VKYC.md ==== -->

# 1D - 2.3. SOP for VKYC

Этот SOP — почти идентичен **2.1-Self-VKYC-Business-Process.md** (Self VKYC of a New Customer, Automated, Without KYC Officer; Tables A–D как в 1.1-SOP). Назначение, Scope (Individuals by entity type), Business Description/Purpose — те же.

## Дельты этой версии:
- **Prerequisites — табличный формат PR-01…PR-06** (вместо RBI-инфра-таблицы):
  - PR-01: AS must have valid Aadhaar number registered with UIDAI + access to linked mobile number.
  - PR-02: AS must have a valid PAN card, not a copy.
  - PR-03: AS must have device with functioning camera, microphone, stable internet connection.
  - PR-04: AS must be physically located within India at time of VCIP session.
  - PR-05: AS must have access to email account used during application to access VKYC link.
  - PR-06: AS must be 18 years or older (or as per RBI/company policy for signatories).
- **Roles & Responsibilities** включают третью роль — **Concurrent Audit** (Review recording of VCIP session; Provide final review and approve of session). Plus AS и DVU как в 2.1-Self.
- **Table A** содержит явный под-сценарий **04A — DVU contacts AS and offers options** (phone; recommends accepting all consents for fastest Self VKYC; alternate: VKYC with Officer or Offline KYC in Branch) и **05A — DVU selects KYC method and sets date/time in Calendar**; **06A** — generic message "We were unable to verify you using the Aadhaar QR code. Please choose an alternative method" → options VKYC with Officer / Offline KYC → calendar with slots → booking + reminder/link to email.
- 5 OTP attempts → **permanently blocked**.
- Final alert → **Concurrent Audit** to review & approve session; account remains in freezed mode until approval.
- Mandatory documents в Table D: **PAN card + Wet signature on a paper** (подпись на бумаге, OCR).
- Appendix 1 Abbreviations / Appendix 2 Success Criteria / Appendix 3 Self-Assessment Risk Matrix — идентичны 2.1-Self / 1.1-SOP.

---


<!-- ==== 3-DVU-Data-Verification-Unit-Process.md ==== -->

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

---


<!-- ==== 3.1-Criteria-for-BGV-check.md ==== -->

# 1D - 3.1. Criteria for BGV check

- [Business Overview]
- [Proposed Process]
- [BGV Decision Matrix]

Business Overview
Changes are to be done in existing BGV process with respect to automate and simplify the online onboarding process.
# Current Process
Currently, it's a manual process where we always perform BGV check for all customers through a 3rd party vendor.
# Proposed Process
- It will be DVU Team's responsibility to initiate the BGV check and get the report from vendors - first level of verification.
- It will be compliance team's responsibility to review the BGV results for account onboarding process.
- 100% cases will be routed to Compliance team for checking BGV results for account onboarding process.
- BGV will be performed after account is opened with Sberbank of India under certain criteria mentioned in BGV Decision Matrix.
- If Compliance marked any prospective account as negative or not fit for onboarding then account will be closed permanently.
**BGV Check:** To confirm identity of entity. BGV checks if the **business is real.** **Probe42** to be used to check company's data (financial reports and GST status).
# BGV Decision Matrix
BGV criteria and exceptions:
| What Probe42 Shows | Action | Account Opening |
| --- | --- | --- |
| Entity is on the market more than 2 years (Date of Incorporation); Annual financial Reports for 2+ years; Government entities and PSUs; Regulated financial institutions (banks, insurance companies, NBFCs registered with RBI); Entities listed on NSE and BSE. | BGV is not required as per mentioned criteria. | Yes - no limitations on transactions after online account opening. |
| Missing reports or no data in Probe42; Medium Risk Industry | **Full BGV** – physical visit or detailed investigation or Vendor's physical check | BGV performed after account opened; only domestic inwards transaction allowed until BGV success. |
| Blacklist matches like OFAC or other watchlists matches; High-risk industry; Sole proprietorship and partnership companies. | **Full BGV** – physical visit or detailed investigation or Vendor's physical check | BGV performed after account opened; only domestic inwards transaction allowed until BGV success. |

---


<!-- ==== 3.2-Account-Management-Caldera.md ==== -->

# 1D - 3.2 Account Management - Caldera

Business Overview
The proposed solution aims to digitize and automate the corporate customer onboarding and account creation process through an integrated STP, Hybrid, and Offline onboarding framework — enhance CX, reduce manual intervention, improve efficiency, strengthen compliance controls, enable faster activation.
# Process Diagram
Automated corporate account opening and creation journey within the onboarding platform integrating with core banking (Caldera). Begins with operator selecting product type and account category.
## Process Description
| Step No. | Process Step | Description | Next Step | System |
| --- | --- | --- | --- | --- |
| 01 | Operator selects product type | Operator selects required product/account type during initiation | PAN validation | Website |
| 02 | PAN Validation | Validates PAN against registry/database | CRILC check | PAN Validation Service |
| 03 | CRILC Check | CRILC exposure validation & lending relationship checks | Eligibility assessment | CRILC |
|  | Exposure & Eligibility Assessment | Validates exposure limits, lending bank relationship, NOC conditions | Customer confirmation | Rule Engine- OBO |
| 06 | Customer Confirmation | Customer informed re availability & required declarations/consents | Account number generation | OBO |
| 07 | Account Number Allocation | Generates & allocates available account number | Draft account creation | Caldera |
| 08 | Draft Account Creation | Account created in draft state pending validations/approvals | Validation checks | Caldera |
| 09 | Validation Checks | VKYC, CKYC, sanction screening, legal entity validation, risk/BGV | Approval or DVU handling | OBO |
| 10 | Approved Account Creation | On successful validations & approvals → account created | Account activation | Caldera |
| 11 | DVU / Modification Handling | Discrepancies/exceptions routed for review and correction | Final approval | DVU Team - OBO |

### Mandatory Criteria for different types of account type for Corporate Customer
| Product Code | Product Name | Mandatory Criteria | Additional Details |
| --- | --- | --- | --- |
| 4000 | Current Account | **CRILC check** — Exposure <10 Cr; OR Exposure >10 Cr and Sber lending bank with >=10% exposure, OR Sber fund-based exposure >=10%, OR NOC available. Check Sber exposure (fund-based & non-fund based). | SBER Exposure via API GQL - LiabilityByCustomerID (api/limits/v1/liability/) |
|  | Collection Account | Operation mode = collection account if exposure >=10 Cr; Exposure >10 Cr and Sber share <10% or NOC NOT available |  |
| 4500 | Exporter Current Account | Customer type = Corporate | Outward remittance only for advance specified account numbers |
| 4101 | USD Current Account | Customer type = Corporate |  |
| 4100 | Current Account EEFC | Customer type = Corporate |  |
| 8000 | SNRR Account | For Customers holding FPI License; For Other non-resident Customers without FPI license |  |

### Sub-classes allocation logic
| # | Aggregate / Total exposure | Sber total exposure | Sber fund-base exposure | NOC | Account subclass | Operational mode |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | less than 10 crores | - | - | - | D | Current account |
| 2 | 10 crores or more | 10% or more | - | - | D | Current account |
| 3 | 10 crores or more | less than 10% | 10% or more | - | D | Current account |
| 4 | 10 crores or more | 10% or more | less than 10% | - | D | Current account |
| 5 | 10 crores or more | 10% or more | 10% or more | - | D | Current account |
| 6 | 10 crores or more | less than 10% | less than 10% | Yes | D | Current account |
| 7 | 10 crores or more | less than 10% | - | Yes | D | Current account |
| 8 | 10 crores or more | - | - | Yes | D | Current account |
| 9 | 10 crores or more | - | - | - | E | Collection account |
| 10 | 10 crores or more | less than 10% | - | - | E | Collection account |
| 11 | 10 crores or more | less than 10% | less than 10% | - | E | Collection account |

**Mandatory Criteria — customer type = Financial Institution:** 3010 Nostro External (NRI/Foreigner); 3030 Nostro Inter Branch Moscow; 3050 Postro Account; 8000 SNRR; 3031 Inter branch active; 3032 Inter branch passive; 3061 SRVA for other bank; 3060 SRVA for SBER bank of Russia.
**Mandatory Criteria — customer type = Individual:** 1000 NRO; 1500 NRE; 4000 Current Account (NO CRILC check required); 4100 Current Account EEFC; 4101 USD Current Account; 8000 SNRR (Only FPI license holders).
### Appendix (Abbreviations)
EEFC; SNRR (Special Non Resident Rupee Account); FPI (Foreign Portfolio Investor license); SRVA (Special Rupee Vostro Account); NRO (Non Resident Ordinary); NRE (Non Resident External).

---


<!-- ==== 4-CRM-part-of-E2E-Product-Opening-Process.md ==== -->

# 1D - 4. CRM part of E2E Product Opening Process

- [Business Overview]
- [The To-Be high-level Process Diagram]
- [Status Diagram for Product Activation - Customer]
- [Onboarding Alerts]
- [The Status Matrix]
- [Scenarios]

Business Overview
The current As-Is process requires redesign due to gaps, bottlenecks and time-consuming procedures. Idea: automate almost all parts; concentrate all manual checks/verification in one hand — establish the DVU (Data Verification Unit). The future optimization relieves the CRM Team (Relationship Managers) of operational duties and concentrates them mostly on selling. Few activities requiring RM attention are listed in scenarios.
# The To-Be high-level Process Diagram
High-level CRM involvement across all selling channels and banking products/services.
| # | Entry Point | Description | Prerequisites | Detailed Process Flow |
| --- | --- | --- | --- | --- |
| 1 | Website Form | Prospect submits contact details + PAN on a website short form. | Prospect opened website form & applied; submitted valid contact details (phone) | Scenario 1: Website Form |
| 2 | Incoming Call | Prospect reached to open a product via phone call. | — | Scenario 2: Incoming Call |
| 3 | Get Next | Call Center Operator takes cold offer into work and calls prospect company. | Contact details valid | Scenario 3: Get Next |
| 4 | Self Registration | Prospect applies for the product on a website. | Applied via website self registration | Scenario 4: Self Registration |
| 5 | Branch Visit | Prospect comes to Branch to open a product | Came to branch with intent | Scenario 5: Branch Visit |
| 6 | RM Visit | RM visits prospect at his location. | RM visits prospect | Scenario 6: RM visit |
| 7 | Banner in Internet Banking | Customer clicks product banner in Internet Bank | Existing client, has IB access, clicked promo banner | Scenario 7: Internet Banking Banner |

## Status Diagram for Onboarding Process - Prospect / Product Activation - Customer / Onboarding Alerts
## The Status Matrix (суть)
Статус-матрица связывает: Pre-requisite → Status of CRM (Deal stage) → Action Item → Status of Onboarding → Status of Product Activation → CIF Status → Condition → Action Item. Ключевые цепочки:
- **SCENARIO 1 — RM selling activity, new customers:** New Prospect PAN available (Probe42 / manual RM input) → Deal created ('Data input') → trigger Product Team (DVU) → Onboarding: Draft → (Data Input → Entity Review → Entity Review Failed → Identity Review → Identity Review Failed → Completed) → Product Open / Product Activated (CIF Active on Initial Deposit received / First Outward Transaction). Draft non-active period X → PIF canceled. Также статусы Product Suspended/Terminated → CIF Deactivated/Blocked.
- **SCENARIO 2 — RM selling, current customer:** CIF exists → Deal created ('Data input') → trigger Product Team → Draft → Data Input → Entity Review (+failed) → Identity Review (required if new AS or AS data changed) (+failed) → Product Open → Product Activated (under certain product conditions). CIF Active throughout.
- **SCENARIO 3 — Digital Channel, Self-Registration:** New prospect from digital self-registration → trigger CRM to create lead/offer/deal + check duplicity → Draft/Canceled/Data Input/Entity Review(+Failed)/Identity Review(+Failed)/Completed → Product Open/Activated (CIF Active); Suspended/Terminated (Deactivated/Blocked).
# Scenarios
1D - 4.1 CRM Scenarios

> Глоссарий: Lead — данные потенциального клиента в MR; MR (Master Record) — базовая орг. сущность, включает PIF и CIF; Prospect — организация, с которой банк ещё не работает; Customer — уже клиент банка; Offer — сущность для работы по продаже; Deal — сущность после успешного закрытия offer.

---


<!-- ==== 4.1-CRM-Scenarios.md ==== -->

# 1D - 4.1 CRM Scenarios

# Concept Overview
Defines the "to be" customer journeys for product opening in the India Branch. Covers all scenarios where a corporate customer initiates product opening — offline (Branch visit, RM visit) or online (website form, self-registration, incoming call, lead).
## Glossary
AOD = Account Opening Division.
# High Level Process
| # | Entry Point | Description |
| --- | --- | --- |
| 1 | Website Form | Prospect submits contact details + PAN on website short form. |
| 2 | Incoming Call | Prospect reached to open the product via incoming phone call. |
| 3 | Get Next | Call Center Operator takes cold offer into work and calls the prospect company. |
| 4 | Self Registration | Prospect applies for the product on a website. |
| 5 | Branch Visit | Prospect has come to the Branch to open a product. |
| 6 | RM Visit | Relationship Manager visits the prospect at his location. |
| 7 | Banner in Internet Banking | Customer clicks on the product banner in the Internet Bank. |

# Features for Future CRM Concept (выдержка)
New entity Company Profile (OBO); auto-create Company Profile if data in Probe42 (OBO+SALES); update Master Record on Probe42 request; link Leads/Offers/Deals to Company Profile by PAN (SALES); display linked entities & available products; auto-alert to call Rejected Lead in X days; send applications to CRM (IB / non-client); Mode of Application attribute (Self/Assisted/Offline); auto/manual send invitation link for Assisted; interactive calendar for Offline with available slots; auto-assign AOD officer on slot; auto-send visit details + required docs; auto-reminder X days before visit; add lead-processor to offer/deal team; generate personalized proposal via AI analysis of comms history; auto T+1 reminder & T+2 call task on stuck onboarding; record PAN from website apps into processing logic; auto search by PAN + linking; AI summarization from Probe42; duplicate warning on product offer; recommendation system; signals from OBO on stuck client / offer-deal progression; stage-based model for OBO; receive available slots from DVU/AOD; lead management improvements; two product offers per lead; add Call Center Operator as Member; filter offers/deals by "I am leader/member".

# Scenario 1: Website Form — Process Flow Description
| Step | Owner | Step Name | Step Description | Next Step |
| --- | --- | --- | --- | --- |
| 1 | System | Create Lead | On submit of contact details, lead auto-generated in Caldera. | 2 |
| 2 | System | Search Company Profile by PAN | Auto search by PAN. Success → found; Failure → not found. | Success 3 / Failure 3.1 |
| 3 | System | Link Lead to Company Profile | Links lead to Company Profile | 4 |
| 3.1 | System | Auto request data from Probe42 | Request to fetch data for Company Profile creation. Success/Failure. | Success 3.2 / Failure (3.4) |
| 3.2 | System | Autopopulate Company Profile Details | Autopopulate: Entity Name, Entity Type, PAN Number, Country Code, Registered Address | 3.3 |
| 3.3 | System | Create Company Profile | Creates Company Profile once details autopopulated | 3 |
| 3.4 | Call Center Operator | Call the Prospect and confirm the interest | If profile not found & no Probe42 data, CCO calls prospect to confirm interest. | Success 3.5 / Failure 3.9 |
| 3.5 | Call Center Operator | Verify correctness of PAN | Confirm PAN; if mistake, prospect verbally gives correct PAN. | Success 3.6 / Failure 3.11 |
| 3.6 | Call Center Operator | Offer Prospect to Complete Self Registration | If not agree → only offline branch option. | Success 3.8 & 3.9 / Failure 9.4 |
| 3.7 | Call Center Operator | Send link for Self Registration | Send link to email in lead | 11 |
| 3.8 | System | Auto request to Probe42 to enrich data | Collect & aggregate data from gov registries, create company record | 11 |
| 3.9 | Call Center Operator | Click "Reject Lead" | | 3.10 |
| 3.10 | Call Center Operator | Select reason of rejection | Lead closed | finished |
| 3.11 | Call Center Operator | Edit PAN number field | Edit & save; system re-searches Company Profile | 3.12 |
| 3.12 | System | Search Company Profile by PAN | Found/Not found | Success 3.13 / Failure 9.4 |

# Scenarios 2-7 (Incoming Call, Get Next, Self Registration, Branch Visit, RM Visit, Internet Banking Banner) — Process Diagrams/Descriptions: TBD (заголовки присутствуют, контент не заполнен). Подробная Scenario 4 (Self Registration) с пошаговым флоу — см. analytics-and-research.md → "Scenario 4: Self Registration".
# Onboarding Alerts / Verification Scenarios (CRILC check failure; AML/Compliance check failure) — TBD.

---


<!-- ==== 5-Risk-Categorization-Business-Nature-Questionnaire.md ==== -->

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

---


<!-- ==== 5.1-Attributes-for-RBI-reports.md ==== -->

# 1D - 5.1. Attributes for RBI reports

# Business Overview
List of attributes that need to be part of regular RBI Report. Some obtained during new customer onboarding. Two options: autopopulate from Probe42 / other gov register, OR ask Customer within the Business Nature Questionnaire.
Task: check data availability in Probe, master data, Caldera; check external sources; check if gatherable during onboarding.

# Attributes list (table date 03.02.2026)
| CR Number | Attribute Name | Required in Report | Gather during onboarding? | From Probe? | From external sources & how | Short description |
| --- | --- | --- | --- | --- | --- | --- |
| CLDRCIF-1437 | Udyam Certificate | PSA-Q | Yes | No | Yes, only with client approval | UDYAM certificate for medium/small/micro business |
| CALDERABF-4090 | BORROWER_CATEGORY | ADEPT, BSR-1 | Yes | No | Yes, need conversion table + questions | Borrower type by type (agriculture, manufacturers...) and size (micro/small/medium/large) |
| CLDRCIF-1646 | Organisation Code | BSR-1 | Yes | Yes | Yes, check mapping from probe | Institutional sector types (Public/Cooperative/Private Corporate) per RBI |
| CLDRCIF-1793 | District Code | BSR-1 | Yes | Yes | Yes, mapping needed | BSR code of districts; map address → district name → code |
| CLDRCIF-1643 | DISABLED_PERSON | ADEPT | Yes | No | Yes, integration with UDID Card; data may be outdated + privacy | Flag (Y/N) person with disability |
| (CR будет создан) | Name of Entity | RCE | Yes | Yes | Yes | Legal name of company |
| (CR будет создан) | Type of Entity | RCE | Yes | Yes | Yes (Probe42 Comprehensive Details: holding/subsidiary/associate/joint ventures) | Subsidiary, Joint Venture, Affiliate |
| (CR будет создан) | Area of Operation | RCE | Yes | No | eximpedia int'l trade vs yearly income | Dropdown India/Overseas |
| (CR будет создан) | Financial Classification | RCE | Yes | Yes and No | Probe42 shareholders; financial control decision per company | Financial/Non Financial (subsidiary losses flagged by RBI as bank's) |
| (CR будет создан) | Amount of bank's Equity Investment | RCE | Yes | Yes | Yes | Book value of bank's direct investment in share capital |
| (CR будет создан) | % of bank holding in equity | RCE | Yes | Yes | Yes | Proportion of voting equity owned |
| (CR будет создан) | Name of group companies/associates/partners/subsidiaries | RCE | Yes | Yes | Yes (Probe42 Comprehensive Details) | Legal names of connected entities |
| CLDRCIF-134 | Add 5-digit industry code | CRILC | Yes | No | No | 5-digit code (NIC code?) |
| CLDRCIF-136 | Sector Code in customer card | CRILC | Yes | Yes | Yes, mapping table | Sector code (private/public/MSME/other) |
| CLDRCIF-124 | Client Group Code | CRILC | Yes and No | Yes and No | RBI source, manual request; no holding structure in Caldera yet | Company part of group with special CRILC code |
| CLDRCIF-125 | Group Name | CRILC | Yes and No | Yes and No | see above | Name of company group per group code |
| CLDRCIF-2132 | Add Type of Enterprise - Large | QRAQ | Yes | Yes | mapping table needed | Large: investment in plant/machinery >₹50 crore OR turnover >₹250 crore |
| CLDRCIF-1839 | Priority Sector and Non-Priority Sector | QRAQ | Not fully checked | Not fully checked | Not fully checked | Priority (Agriculture, small business, housing for weaker sections, education, export) vs Non-Priority. Likely linked to Item codes |
| CORPACC-1187 | External Rating for client | CRILC | Yes | Yes | Yes (Probe Comprehensive Details - Ratings: agency/instrument/amount/currency/symbol/action/outlook) | External Rating (AAA, BB, BBB…) |
| CORPACC-1188 | Internal Credit Rating (BANKS exposure) | CRILC, RBS | Yes | To discuss | To discuss | Internal rating from ЕФС |
Этап 1 (29.01.26) — проверка доступности данных в Probe42 по Probe API file. Некоторые описания неудобны → доп. вопросы к BA (Sharif) и заказчику.

---


<!-- ==== 5.2-NIC-code-attribute-online-onboarding.md ==== -->

# 1D - 5.2 NIC code attribute to gather during the online onboardig

# Description
Right now during onboarding we gather the Industry attribute (linked to EPK and Caldera processes). We need to gather and store in the client card an additional attribute — the **NIC (National Industry Code)** code. NIC code is required for periodical RBI reporting.

# AS IS
Reporting team manually gathers data on clients' NIC codes to put in RBI reports (yearly???). Takes up to ___ work hours.

# TO BE
NIC code gathered and confirmed by client during onboarding, stored in client card in Caldera → enables automation of RBI reporting.

# Opened questions
- Who is responsible for storing and updating the NIC code table?
- Can we gather NIC code automatically from MCA portal, client tax reporting (Form ITR) or external sources (Zauba Corp)? (In Probe42 NIC code is not available.)
- Mockups for the customer guest zone.
- Who updates the attribute for existing clients (e.g. company changes main sphere of occupation)?
NIC codes table — RBI 2026.

---


<!-- ==== 6-Operating-Instruction-Form-BR-vs-role-model.md ==== -->

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

---


<!-- ==== 6.1-Detailed-BR-signing-EKYC-offline-online.md ==== -->

# 1D - 6.1 Detailed business process signing BR with EKYC offline and online (in progress)

Note: связано с 1D - 9. Consents Dashboard.

**OCR — сервис базовых функций** по проверке подписи будет возвращать:
- Is signature valid (True / False)
- signatory full name
- date of signing
- timestamp of signing
- class of signature
- issuer
- validity starts
- validity ends

Текущий SOP для account opening подготовлен PAVAS (Account Opening Process Version 2.0.v3.docx).
**Main task:** добавить возможность загрузки документа BR с автоматическим распознаванием данных. Когда данных нет — «подсветить» клиенту необходимость заполнить недостающие поля. На стороне онбординга: Authorized zone → step "Dashboard" → "Account Opening". Notes: проверка STOP LIST и последствия; редизайн макета; согласовать с Margo.

| Type of Entity | Operating instruction vs Roles in internet Bank | Who has to Sign the BR | Who has to pass the VCIP | How many recipients |
| --- | --- | --- | --- | --- |
| Partnership | Several Authorized Signatories with Admin role: 1 Partner = 1 Admin role | All Partners | All Partners | 1 + n |
| LLP | Several Authorized Signatories with Admin role: 1 Partner = 1 Admin role | All Partners | All Partners | 1 + n |
| Public Company | Only one Single Authorized Signatory with Admin role | 5 Directors → Min 2 directors sign / Company Secretary (Singly) / Managing Director; authority verified against Probe42 | Authorized Signatory who signed BR | 1 + n |
| Private Company | Only one Single Authorized Signatory with Admin role | 5 Directors → Min 2 directors sign / Company Secretary (Singly) / Managing Director; verified against Probe42 | Authorized Signatory who signed BR | 1 + n |
| Sole Prop | Admin role in Internet Bank | Proprietor | Proprietor | 1 |

# What DATA we have? (from Aadhaar, for thorough authorization)
Aadhaar Number; Date of Birth (yyyy-mm-dd); ZIP Code; Gender; Address; Client ID (unique identifier of query); Profile image (Base64); URL of ZIP file; URL of XML file; Share Code of ZIP file; Care of; True if provided mobile number matches Aadhaar; Reference ID of XML.

# Companies — The process flow (in progress)

---


<!-- ==== 7-Onboarding-AS-already-onboarded-other-company.md ==== -->

# 1D - 7. Onboarding of company whose Authorised Signatory is already onboarded with other company

# To-Be process
(Страница содержит только заголовок "To-Be process" — детальный контент/диаграмма не заполнены в источнике.)

> Связанный открытый вопрос (из встреч/архитектуры): если AS уже верифицирован и имеет customer ID в банке при онбординге одной компании, и он же — prospect для другой компании, нужно проверить возможность переиспользовать KYC и исключить повторные re-KYC/VCIP. См. Минутки встреч (Deepak) и "Итоги встречи с Sales".

---


<!-- ==== 8-Request-to-change-Customers-Data-online.md ==== -->

# 1D - 8. Request to change Customers Data online

Scenario 1 : Customer Request for data modification and upload proof of document in Online Banking
Scenario 2 : Customer Request for modification of data via Customer Support

(Детальные флоу/диаграммы в источнике не заполнены.)

> Связанные правила (из встреч): при изменении адреса — BGV обязателен; при смене mobile/email — валидация от Customer Support, что запрос пришёл от клиента. См. Минутки встреч (DVU scenarios).

---


<!-- ==== 9-Consents-Dashboard.md ==== -->

# 1D - 9. Consents Dashboard

# Business Overview
TBD

# Current consents & declarations taken from customers during online onboarding
| Onboarding step | № | Type of consent | Mandatory | Display logic | Суть текста |
| --- | --- | --- | --- | --- | --- |
| Finish registration / Authorization form | 1 | Cookie Consent (+ link to Privacy Notice for Website Users) | N | Every session until accepted | "Sberbank Branch in India uses cookies… committed to protect personal data. Please read the terms and principles of data processing. You can prevent cookies via browser settings." Гиперссылки на cookie/политику. Дата/время фиксируются (IST). |
| | 2a | Terms & Conditions | N | When entering authorization form | "I hereby authorize Sberbank Branch in India to verify my details digitally or otherwise… and confirm I have read and agree to Terms & Conditions." Без согласия — нельзя авторизоваться. |
| | 2b | (MVP) | Y (for MVP) | | "I hereby authorize Sberbank Branch in India to verify my details digitally or otherwise…" |
| | 3 | Privacy Notice for Clients | Y | When entering authorization form | "I acknowledge I have read Privacy Notice and provide explicit consent to process my personal data for representing my company in a client relationship…" |
| Customer Application Form | 4 | Confirmation of entering information for all managerial personnel | Y | On "Key Managerial Personnel Details" task | "I confirm that will provide information for all Key Managerial Personnel in the entity." |
| | 5 | Data Principals Privacy | Y | | "…in case I have provided personal data of other Data Principals, I guarantee such Data Principals are notified… and I obtained their explicit consent… keep Sberbank indemnified." |
| | 6 | Aadhaar Consent | Y | | "…provided various options for establishing identity… I voluntarily submit my Aadhaar details… In case Aadhaar details of other Data Principals — guarantee notified & obtained explicit Aadhaar Consent. Read & understood Aadhaar Consent." |
| | 7 | Confirmation of the correctness of the data | Y | When all docs attached (Review step) | "I have reviewed and verified the details and documents… true, correct, complete and up to date… nothing material concealed." |

# Consents for the fully-automated online onboarding (future, suggested texts)
| Process Block | Step | Consent | Suggested Text (суть) |
| --- | --- | --- | --- |
| Onboarding | Authorization | Cookie Consent | Leave as is. |
| | Authorization Form | **Data Verification Consent** | #1: "I provide explicit & voluntary consent to verify, retrieve and process my personal data and the data of a legal entity I represent. Includes government registries: MCA, NSDL, CKYC, UIDAI, NCC, OFAC, LEI, CRILC to the extent permissible by law. Read & understood Privacy Notice." / #2: shorter "authorize to verify my details digitally or otherwise…" |
| | | **Privacy Notice Consent** | "…provided personal data of other Data Principals → guarantee notified & obtained explicit consent… indemnify Sberbank." |
| | Board Resolution Screen | **Accuracy of information Consent** | "I confirm I have provided complete and accurate information for all individuals required under KYC norms, incl. Directors, Partners, UBOs and Authorized Signatories as applicable to the legal structure." |
| | Board Resolution Screen | **Consent for VKYC** | "I understand Sberbank will initiate VKYC by sending a secure link to email addresses of AS/Partners/Directors/UBOs provided by me. I confirm I notified all individuals whose data I provided and obtained their explicit consent for collection & processing for account opening." |
| | Before submitting online application | **Accuracy of Information Consent** | "All information and documents uploaded/entered are true, correct, complete and up to date. Reviewed prefilled data fetched from official registries and confirm accuracy. Discrepancies during verification may result in rejection." |
| VCIP Session | Before VCIP starts | **Consent for VKYC** | "I provide consent to conduct a Video KYC session (VCIP) to establish my identity as AS/Director/Partner/UBO. #1 details: capturing live photo/video, liveness & deepfake checks, recording PAN card and wet signature on blank paper, storage of recording & extracted data. I voluntarily agree to provide biometric and personal data; processed per Privacy Notice." |
| | Before VCIP starts | **Aadhaar eKYC Consent** | "I voluntarily consent to authenticate via Aadhaar eKYC using UIDAI service. Prompted to scan QR via Aadhaar App; on success, Bank receives personal data and photo from UIDAI. Authorise use of Aadhaar data for KYC and for digitally signing account opening documents." |
| Declarations | Declarations Dashboard | **Declarations Consent** | ☐ read/understood/agree to Declaration for Account Opening; ☐ FATCA Declaration (if applicable); ☐ Customer Application Form (verify all info true/complete/accurate). + ☐ consent to use Aadhaar eKYC authentication for digitally signing account opening documents. |

---


<!-- ==== 10-Matrix-Personal-Signatory-Data-Cross-Check.md ==== -->

# 1D - 10. Matrix of Personal Signatory Data Cross-Check

# Business Description
During the online onboarding process for corporate Indian clients, there will be one authorized user — a company representative — who completes the online onboarding and fills in company details. Among other registries, we will actively use various registries, including Probe42 to fetch the data. Based on the data extracted from Probe42, we will understand the composition of directors and generate a **Board Resolution (BR)** where we see all directors and their details. Using this data, we will populate these directors into the BR. The authorized user then will verify whether all information is correct (Name Surname, DIN, PAN) and, if necessary, will correct the data — adding or removing signatories.
Additionally, the authorized user will enter the phone number and email address for each signatory which will have to complete VKYC procedure. Each signatory will later receive a link at their email address to complete **Video KYC (VKYC)**.
To ensure that the right person, the one specified in the BR — enters the VKYC session, we need to perform verification based on **attributes already present in the Board Resolution**. Using these attributes, we can cross-check against other sources to automatically confirm whether the person in VKYC session is the correct company representative.
This document presents a matrix of signatory personal data cross checks in table format: what data is taken from which sources, and how data is checked in different sources to **automatically confirm** that the person is the right company representative.

# Sources and Key Fields For Individuals
|  | Source | Key Fields | Description |
| --- | --- | --- | --- |
| 1 | Probe42 | COMPANY ID; FULL NAME; PAN; DIN; DIN STATUS; DPIN STATUS; NATIONALITY; GENDER; DATE OF BIRTH; DATE OF APPOINTMENT; DATE OF CURRENT DESIGNATION; DATE OF CESSATION; DESIGNATION |  |
| 2 | Board Resolution(BR) / Partnership Deed(PD) | FULL NAME; DESIGNATION | Approved by Authorised User during onboarding |
| 3 | NSDL | PAN NUMBER; PAN STATUS; AADHAAR LINKING STATUS; TITLE; FULL NAME; DATE OF BIRTH | Verified via PAN number via NSDL records |
| 4 | UIDAI (Aadhaar) | FULL NAME; DATE OF BIRTH; ADDRESS; GENDER; PHOTO; PHONE NUMBER; EMAIL | Verified via Aadhaar eKYC during VKYC |
| 5 | VKYC | FACE PHOTO; PAN CARD |  |

| Attribute | Probe42 | Board Resolution (BR) | NSDL | Aadhaar eKYC | VKYC Session |
| --- | --- | --- | --- | --- | --- |
| **DIN** | ✅ (for companies) | ✅ (pre-filled from Probe42, may be edited) | ❌ | ❌ | ❌ |
| **DPIN** | ✅ (for LLP, Partnership Firm) | ✅ (pre-filled from Probe42) | ❌ | ❌ | ❌ |
| **PAN number** | ✅ | ✅ (from Probe42 or entered manually) | ✅ (primary source) | ❌ (Aadhaar does not contain PAN Number, but shows if PAN Number is linked) | ✅ (OCR from PAN card) |
| **Full name** | ✅ | ✅ (from Probe42 or entered manually) | ✅ | ✅ | ✅ (OCR from PAN card) |
| **Date of Birth** | ✅ | ✅ (from Probe42 or entered manually) | ✅ | ✅ | ✅ (OCR from PAN card) |
| **Face Photo** | ❌ | ❌ | ❌ | ✅ | ✅ (live face + document photo) |
| **Address** | ❌ (only registered companies address) | ❌ | ❌ | ✅ | ❌ (not requested) |
| **Phone number** | ❌ (only company phone number) | ✅ (entered by authorized user) | ❌ | ✅ (used for OTP) | ✅ (OTP verification) |
| **Email** | ❌(only company email) | ✅ (entered by authorized user) | ❌ | ❌ (проверить с Сандипом, Аминой) | ❌ (link is accessed from the authorized email) |

|  | What is Compared | Source 1 | Source 2 | Source 3 | Confidence Score | Applicable Company Types | How to check |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **PAN Number** | Board Resolution / Partnership Deed | PAN document (shown during VKYC) | NSDL | **HIGH** | All company types | If PAN Number and name from BR match official NSDL records and the document shown during VKYC — the person performing VKYC is verified |
| 2 | **Name + DOB** | Board Resolution / Partnership Deed | Aadhaar eKYC | NSDL | **MEDIUM** | All company types (especially when PAN is missing, e.g., manually added signatories) | Cross-verification of personal data from BR with the data Aadhaar |
| 3 | **Phone number** | BR (entered by user) | Aadhaar eKYC | VKYC GZ OTP |  | All company types | Confirms the VKYC session is initiated by the person whose number received the link |
| 4 | **Email** | BR | Aadhaar eKYC | VKYC GZ link | **LOW** | All company types |  |

---


<!-- ==== analytics-and-research.md ==== -->

# Оглавление
1DAY Initiative (7.6.2) · Opened questions (3.1) · Минутки (Minutes of Meeting, BT March 2026, Итоги Sales, Итоги Открытие счетов) · Регуляторика (Regulatory Requirements, Legal Entities docs, Compare docs) · CKYC (AS-IS, Registry) · Aadhaar/UIDAI research + NRIs · Credit Exposure · Digital Banking Concept · Digital Signing (DSC/eMudhra, Policy, Digital products) · Documents (OCR, per legal type, entity types & attributes, Online Onboarding Check List, Temporary page) · Email Notifications · Offers & deals priority · Project To-Do / Task Tracker · Risc analysis / BGV analysis / Clients 2026 · Initial Deposit research · Survey · Amendment To BR · CRM Scenarios 1-7 · Конкуренты (Account Opening CJM, World Banks Practice/Revolut, VTB Shanghai) · Welcome Kit · Usefull links · Task inward messages (VTB SFMS) · Копия VCIP.

---

## 7.6.2. The 1DAY INICIATIVE — new unified automated process
E2E автоматизированный процесс от привлечения клиента до открытого счёта; онлайн-онбординг с полностью автоматическими проверками; часть Digital Banking Concept.
**Prerequisites:** CRILC self-declaration + API; CKYCR integration; VCIP; Aadhaar eKYC UIDAI licence; Probe42 (актуальные данные, inline с RBI); определить параметры Standard Customer (T=1 Day).
**Standard Customer:** LE, резидент Индии (и компания, и подписанты), данные актуальны в гос. регистрах, Risk Category Low & Medium. Legal Entity: Sole-Prop, Private Ltd, LLP, Limited Partnership, Public Ltd, Partnership. Probe42 data availability (MCA/IEC/LEI/PAN/UDIN reports); PAN & GST (Sole-prop via GSTIN); CKYCR; UIDAI; Risk Low/Medium (auto-calc from BNQ).
**To-Be sub-processes (links to BRDs):** 00 CRM registers request (1D-4); 01 Initial Auto-screening (1D-1); 02 Manual screening (1D-1); 03 Auto-data/manual form (1D-1); 04 CIP eKYC+VKYC (1D-2); 05 Auto-data verification vs registers (1D-1); 08 DVU checks (1D-3); 06 Auto-account opening; 07 CRM&Call Center subprocess (1D-4).
**Automation of checks vs gov registers:** OFAC (sanctions, entity & individuals); CRILC (total credit exposure); BGV (3rd party / video-BGV); LEI (legalentityidentifier.in / Probe42); NSDL (PAN); IEC (DGFT / Probe42); GST (Probe42); NCC (cybercrime.gov.in, AML module); MCA (Probe42); CKYCR (CERSAI); UIDAI; UDIN (ICAI).
**Project Breakdown / workload (команда/месяц):** Prospect Card; Leads from site; CIF+OBO; Status Model; SLA DVU; BGV electronic form; Data autopopulation Probe42; auto-checks (NCC/OFAC/LEI/IEC/GST/MCA/UDIN/CKYCR); Risk auto-calc; BNQ; CRILC/NESL; eKYC (UIDAI — "очень дорого 12+ ком/мес, нужен AADHAR Vault"); VKYC record/capture/auto-recognition/auto-matching/liveness; auto-account opening/activation/closing. **Workload summary totals:** CRM 2.3; CIF 3; KYC 5.9 + 9.4; OBO 9; CAM 3.5; Core 11 (aadhaar vault, eSign, eKYC, ЭДО); Data 0 (in GTWR). **Total 33.1 (+11 core).**
Glossary: Lead; MR=Master Record (PIF+CIF); Prospect; Customer; Offer; Deal.

---

## 3.1 Opened Questions (verbatim Q&A)
| # | Question | Response |
| --- | --- | --- |
| 1 | If additional docs requested, time before follow-up call? | T day request → Email+SMS on T+1 → DVU call on T+2 |
| 2 | Who makes follow-up call? | DVU team for documents, Call center for customer support |
| 3 | If client unreachable by phone, next step? | DVU follows up via phone or email |
| 4 | When escalate to RM? | When documents pending >5 days, tagged RM reaches out |
| 5 | For key/largest clients involve RM earlier? | TBD |
| 6 | How alerts distributed/assigned? | TBD (ideal: assign to specific person immediately; alt: general queue) |
| 7 | External data contradicts existing client data — alert to update? | need clarification |
| 8 | How compliance involved; need alert for doc requests? | TBD |
| 9 | If not eligible for current account (CRILC fail) or can't open (OFAC) — who calls, do we tell reason? | TBD |
Архитектурные вопросы: 1 директор на несколько компаний? Хранить данные физлиц в отрыве от компаний (идентификация физика → привязка к нескольким компаниям; «физюрики»)? Как/где RM сохраняет инфо, что клиент согласился на export/collection вместо current; доступность аккаунт-опенинг специалисту.

---

## Minutes of Meeting (ключевые решения)
- **04.02 CISO+Audit:** Offline KYC — сессия в течение 3 дней с момента скачивания Aadhaar zip/XML (TAT). ePAN нельзя в VCIP — только держать PAN card + скриншот. Aadhaar card фото в VCIP не хранить (нет vault). Нужен алгоритм матчинга имён (PAN/Aadhaar по-разному). BGV — "Welcoming letter" на адрес + OTP-подтверждение получения = верификация адреса. Макс. длина VCIP-сессии — предопределить.
- **04.02 Operations:** Корп. клиент с существующим CIF — НЕ создавать новый CIF (RBI), обновлять. Заменить физ. BR на digital Operating Instructions — обсудить с Legal. В VCIP добавить шаг захвата физ. подписи (подпись на бумаге → скриншот). **Пилот — только Sole Proprietorship.** Account unfreeze: initial deposit + "Welcoming KIT" + OTP при получении чековой книжки = верификация адреса. Заменить BGV для low-risk на CKYCR + Welcome Kit (обсудить с Legal). **Pavas: BGV обязателен, не отменяется; макс 30 дней с открытия; счёт frozen до клира BGV.** Захват подписи AS в VCIP → Caldera (для валидации RTGS оффлайн). Переиспользование customer ID при онбординге 2-й компании.
- **02.02 Compliance (Sashikant):** Хорошая инициатива. Только LOW risk → STP online; medium/high — отдельно. BR заменяется online-формой (Operating Instruction Declaration) — новый SOP. **Concurrent audit team (internal) обязан валидировать VCIP видео; до этого счёт frozen.**

---

## BT March 2026 (встречи + MoM + интервью клиентов)
Встречи: Compliance, Internal team (eKYC), Internal Audit (VCIP/eKYC/consents), Ops (1 day onboarding, DVU scenarios), CRM, Legal (BR & consents).
**Ops MoM (ключевое):** валидная лицензия для Nature of Business; MLM и online gaming аккаунты запрещены; история смены имени компании с evidence; LEI в форме; Vernacular declaration (подпись не на английском); Credit Exposure declaration; **порог exposure 5 Cr → 10 Cr с 1 апреля**; на финальном шаге показать номер счёта "Transfer funds via NEFT/RTGS/IMPS/Cheque to activate"; DVU mail при активации (дата, нужна ли чек-книжка); RM tagging на каждый счёт; **QR-код предпочтительнее zip/xml**; mismatch с CKYC → alert DVU; net-banking access — ownership DVU; Net Banking consents/undertakings в declarations.
**DVU Scenarios MoM:** 5 директоров → мин 2 подписи / CS(Singly) / MD,CEO(Singly); подписанты BR + AS проходят VCIP; auto-check имён в MCA; вопрос "Customer из rural area"; audit trail при правках CAF; при невозможности VCIP — branch/CRM; fraud → compliance → FIU/approve; смена адреса → BGV обязателен; смена mobile/email → валидация Customer Support; net banking access — DVU; 2 mobile → consent какой. **FATCA:** Entity — все AS по BR + 2 директора/MD/CEO/CS + UBO >10%; Sole prop — individual; Partnership — все партнёры.
**Compliance MoM:** consent на CRILC при PAN-валидации; BGV ownership Compliance (1й DVU, 2й Compliance); Listed/MCA-listed можно исключить из BGV; **BGV обязателен для Sole Prop и Partnership**; Video BGV (geo-tag + live video); eKYC QR или zip/xml — оба ок.
**CRM MoM:** LLP в дропдаун Legal entity type; OPC и HUF позже; OFAC positive → alert Compliance; share holding pattern — подписи директоров не нужны, убрать из BR-секции, отдельная секция; place of meeting (Virtually/by rotation/address); OCR для своего формата BR; все AS из BR + UBO >10% → VCIP.
**Internal Audit MoM:** валидная e-copy AOA/MOA (signed downloaded from MCA) хранить; PAN vs NSDL, GST vs GST portal; bank-assisted VKYC предпочтительнее AI; forged PAN → CISO; real-time PAN-NSDL; Driving License в VCIP можно убрать (адрес из Aadhaar); correspondence address ≠ Aadhaar → добавить + consent; вся CAF + docs → PDF для регуляторов; хранить KYC данные lifetime + 8 лет; Auditor role (view) для concurrent auditors.
**Клиентские интервью (05-06.03):** Pro Serve (Mohit, Pvt Ltd); Rati Exports (Ravi Tiwari, Pvt Ltd, текстиль/электроника/минералы); Jayashree General Trading (Amit Sharma, Partnership, золото); Simson Pharma; Paramount Aroma; Poorna Gummies; Plex; Vital Group (non-customer).

---

## Итоги встреч (сентябрь 2025)
**Sales (05.09):** Master Record = проспекты (data.gov.in + Probe42) + клиенты. RM взаимодействует с карточкой проспекта только из раздела оферов (позже отдельный поисковик). Оферы в кампаниях навешивает рос. сотрудник (роль RM Russia). Переиспользуемый функционал поиска компании по PAN/CIN + проливка Probe42 (платно, подтверждает руководитель). Задачи: когда/за кем закреплять клиента с органики; флоу онлайн-онбординга с сайта; стоп-факторы (долг >5 крор); заливать кредитный рейтинг в Sales.
**Открытие счетов (09.09):** Фабрика счетов. ОПС Account Management → "Open New". Типы: Коллекшн (высокая долговая нагрузка, деньги только кредитору с макс. задолженностью); Импортер-Экспортер (только на свои счета, трансгран запрещён); Фрозен. Проверка долга >5 крор (~$600k) раз в полгода (Total Exposure), при превышении → Коллекшн. Портал РБИ, бэк-API. Вопросы: мин. документы по типам счетов; когда 5 крор = критич. задолженность; автопроверка задолженности на раннем этапе.

---

## Regulatory Requirements
**Due Diligence:** идентификация/верификация клиента, beneficial ownership, цель отношений, sanctions screening, risk assessment, ongoing monitoring (PML Act, PML Rules, RBI KYC MD). RBI MD KYC 2016: identity verification (OVD/KYC Identifier CKYC/Aadhaar eKYC); verify address & business nature; back ground screening (sanctions/PEP/terrorists/banned); risk-based EDD + periodic refresh.
**CKYCR (CERSAI) guidelines:** verify identity before account relationship; initial due diligence before upload.
**PMLA 2002:** parent law; Reporting Entity (banks/NBFC/PSO/insurance/securities); CDD; OVD (Aadhaar/Passport/Voter ID/DL); record retention min 5 лет после закрытия; STR to FIU-IND; verify entity types.
**Документы-источники:** RBI KYC Master Direction.pdf; CKYC Operating Guidelines v1.5; UIDAI guidelines. Internal: IRD 2024-109 OBO (MVP) 17.09.2024; Draft SOP Digitally Signed Documents.
**Digital signing legal:** admissible per Bharatiya Sakshya Adhiniyam 2023 (BSA) + IT Act 2000. IT Act: Sec 3 (authentication), Sec 5 (legal recognition = physical), Sec 15 (secure DS). BSA: Sec 63 (admissibility), Sec 66 (no need to prove ownership for secure DS), Sec 86 (presumed affixed with intent), Sec 87 (DSC info presumed correct). Требования admissibility: audit trail; tamper-evident seal; verification mechanism (email/OTP); computer integrity (Sec 63).

---

## Legal Entities and documents requirements (RBI MD KYC 2016)
Per entity type required docs (Chapter VI): Individual (OVD/Aadhaar/KYC Identifier + PAN/Form 60 + photo); Sole Proprietorship (proprietor individual CDD + 2 proof of business existence — Udyam/Shop&Est/GST/ITR/IEC/utility); Private/Public Ltd (COI, MOA&AOA, PAN, Board Resolution, PoA, senior mgmt list, BO/AS KYC, address proof); Partnership (Partnership Deed, Registration Certificate, PAN, PoA, list of partners, BO/AS KYC, address); Trust (Trust Deed, Registration, PAN/Form 60, PoA, settlor/trustees/beneficiaries/protector, BO KYC, address); Unincorporated Association/BoI (resolution, PAN/Form 60, PoA, BO/AS KYC, legal existence); Other Juridical Persons (authorization proof, attorney KYC, legal existence).
**Scanned copies:** "Certified Copy" (officer compares with original at onboarding) или "Equivalent e-document" (DigiLocker, valid digital signature — original не нужен). **OTP/Submit как подпись:** Aadhaar OTP e-KYC (Para 17, лимиты ₹1 lakh balance / ₹2 lakh credits/year, 12 мес); Digital KYC (Annex I — OTP = customer signature on CAF); прочие документы — OTP/Submit валидны под IT Act 2000 (нужен auditable trail).
**Remote account opening без визита:** Aadhaar OTP e-KYC (temporary, конвертация в 12 мес, лимиты); V-CIP (= face-to-face, без ограничений); KYC Identifier from CKYCR (если запись полная/актуальная).

---

## Compare of required documents list (RBI vs Sber 2025 vs AXIS/ICICI)
Сравнение по Sole Proprietorship, Private Limited, Trust, Society, OPC, NGO/NGF, Foreign National. Вывод: Sber-политика 2025 строже RBI MD 2016 (добавляет Active Search Report GST/IEC, CRILC Search, Sanctions List Search, Complete BGV + Site Photograph, Company Profiler, IP Funding CRM Head approval — это внутренние контроли банка, не требования RBI). Источники: 2016 RBI KYC MD; 2025 SBER account opening process (Senat).

---

## CKYC
**AS-IS Process:** CRM собирает KYC документы → Ops проверяет на CKYC портале по PAN/CIN. Если запись есть → CKYC ID вручную в Caldera. Если нет/нужно обновить → Ops (Maker) создаёт запись, Maker-Checker workflow → CKYC ID. Для подписантов: имя нельзя править Ops (клиент сам); OTP на mobile подписанта для consent+download. CKYC ID — постоянный универсальный идентификатор; создание платно для банка, бесплатно для клиента; доступ к данным с согласия; модификация только владельцем записи (OTP). Номер маскируется (последние 4 цифры) кроме создателя/загрузчика.
**CKYC Registry (CKYCRR / CERSAI):** 14-значный CKYC Identifier (KIN). Поиск по KIN или OVD → скачать KYC вместо сбора заново. Update при неполных/устаревших. Consent при каждом download. ~70 crore записей (март 2023). Enroll: ckyc.in → Downloads → форма → подпись Nodal officer → upload + документы. **Стоимость:** ~₹2.25 первый download, ~₹1.10 повторный, ~₹0.25 upload new, ~₹1 update; advance deposit. Интеграция: CKYC Search/Download API / vendor; банк = Reporting Entity (CERSAI). Если нет в CKYC → создать новый KIN. ~83 crore individual + ~1 crore legal entity записей. Validity: фикс. срока нет, периодич. update по risk category.

---

## Aadhaar / UIDAI research (ключевые выводы)
UIDAI разрешает Aadhaar authentication/eKYC только через авторизованные индийские сущности. Foreign bank: только через зарегистрированный индийский branch/subsidiary, одобренный UIDAI как AUA/KUA, либо через лицензированного ASA-партнёра (NSDL e-gov, CDSL, NSEIT, TCS/NIC, Karvy). HSBC/StanChart/Citi India — через ASA. Шаги: рег. индийской сущности → AUA/KUA или ASA → MoU + compliance (Aadhaar Act 2016, data localization) → integrate API (XML/SDK, PID block) → infra в Индии → IT/security audit (ISO 27001, RBI cyber) → production credentials + IP whitelisting.
**Доступные данные:** Authentication API (Yes/No, без данных); e-KYC API (демография: имя/DOB/пол/адрес + фото + masked mobile/email + Aadhaar reference ID, не номер + timestamp + UIDAI digital signature).
**Требования:** AUA-регистрация, IP whitelisting, consent (запись), audit logs, HTTPS TLS 1.2+, шифрование PID (AES-256), нельзя хранить биометрию/OTP, certified biometric devices, серверы в Индии, dual redundant connectivity, fraud monitoring, регулярный аудит, tokenize Aadhaar.
**Документы-регуляторы:** Aadhaar Act 2016; PMLA 2002 + Rules 2005; RBI Master Direction KYC (2023); IT Act 2000; UIDAI Authentication/Data Security/Sharing Regulations 2016, 2021; DPDP Act 2023; Section 11A PMLA (только авторизованные сущности).
**Шифрование/инфра:** AES-256 at rest, TLS 1.2+ transit, data residency India, HSM (FIPS 140-2 L3), RBAC, периодич. аудит, breach report UIDAI в 6 часов. Core components: AUA/KUA server, HSM, DMZ, App server, Audit&Logging (2 года), Load Balancer (99.5% uptime), Admin Console. Модели: Direct AUA/KUA; Sub-AUA (через NPCI); API-based eSign (eMudhra/NSDL).
**Санкции за нарушения:** Aadhaar Act Sec 38-43 (до 3-10 лет + штрафы); UIDAI (suspension/termination AUA/KUA, API key revocation, blacklisting); max INR 250 crore + imprisonment + license suspension (DPDP).
**Стоимость:** ~₹3 за e-KYC, ~₹0.50 за Yes/No; license AUA/KUA: pre-prod ₹5 Lakh/3мес, prod ₹20 Lakh/2 года (5-20 Lakh по объёму транзакций). **Auto-update:** UIDAI НЕ push; только pull при re-KYC/re-auth с consent. Compliance: ISO 27001/PCI DSS. Консент: explicit/electronic/physical/OTP/biometric, retention 2 года.
**Differences by category:** Aadhaar только для физлиц (natural persons, резиденты Индии); юрлицо не имеет Aadhaar — только представители/BO/подписанты.
**Storing Aadhaar:** нельзя хранить полный номер/контакты, только UID token; данные в Индии; HSM; RD-устройства; NTP timestamps.
**Aadhaar for NRIs:** NRI (Indian Passport) — eligible если 182+ дней в Индии за 12 мес; OCI/PIO — НЕ eligible (passport/OCI для KYC); Foreign Nationals — нет. Docs: Indian Passport. Process: appointments.uidai.gov.in → NRI Enrollment → Aadhaar Seva Kendra.

---

## Credit Exposure in Corporate Account Opening
RBI: использовать CRILC при открытии current accounts; NOC от существующих банков-кредиторов; ограничения для заёмщиков с кредитной экспозицией. Circular "Opening of Current Accounts by Banks – Need for Discipline": мониторинг ежеквартально; exposure = sanctioned fund + non-fund; >=₹50 crore — escrow; ₹5-50 crore — условия; <₹5 crore — без ограничений (с undertaking). На 31.12.2021 ~5,231 компаний с exposure ≥5 crore = NPA (CRILC). Банки: CRILC ежеквартально (крупные — чаще). **RBI Kavach пример:** при exposure ≥5 cr — клиент открывает current account если: (a) Total ≥5cr, SBI ≥10%, CCOD account, willing; (b) Total ≥5cr, SBI <10%; (c) Total ≥5cr или ≥50cr без CC/OD, SBI lending bank. Пример SBI→ICICI: депозит 10% в OD или FD. % клиентов с CA при exposure >5cr: HDFC 4-5%, ICICI 5-10%, SBI 5-7%. Exposure Agreement (ICICI declaration) + Additional T&C (Instant Account non-operational до KYC).

---

## Digital Banking Concept
Концепция: вместо eSign — VCIP (видео-биометрия V-KYC) + авто-проверки CKYC; ВНД: бумажные документы не нужны, заменяются сверками с гос. регистрами; скан достаточно при доп. запросе; OTP/биометрия для продукта/операций. MFA (know/have/are). Антифрод в фоне (Data Monitoring, Risk/Behavioral Scoring, Rule-Based).
**Продукты онлайн (сегменты Микро/Малый/Средний/Крупный):** Текущий счёт (депозит 50k INR, MAB 50k); Текущий-экспортный; Merchant Service (QR/link invoice = Standing Instruction, API Сбер платежи, до 200 Euro без тамож. сборов); Procurement Service (поиск контрагента в РФ, комиссия за реестр 1000 INR + сопровождение 1%); Liaison Services (offshore-account в СберРоссия); CC/OD, Term Loan, LC, BG, Supply Chain Finance, Export Packing Credit, Gold Bars. Рекомендации: пересмотреть Кредитную Политику (решение на уровне филиала до X сумм); пересмотреть ВНД для диджитализации.
**Digital Signing — DSC/eMudhra:** DSC (Class 1/2/3, USB token, ₹500-2000/год); используется для MCA/GST/DGFT/ICEGATE filings. **Aadhaar eSign vs OTP Authentication:** OTP = верификация личности (UIDAI Auth Reg 2016); eSign = юридически валидная подпись (PKI, IT Act Sec 3A, лицензир. eSign провайдер). Банки предпочитают Aadhaar eSign/OTP вместо DSC (проще, дешевле, RBI/UIDAI-backed). DSC нужен только для statutory filings/legal undertakings. RBI Digital Lending Guidelines 2022: ключевые док-ты (KFS, sanction letter, T&C) — eSign/DSC обязательно. Банки с Aadhaar eSign: ICICI/HDFC/Axis/SBI/YES.
**Digital Signing Policy (internal SOP draft):** типы — Simple Electronic Signature (scan/checkbox/clickwrap), Electronic Authentication (OTP/SMS, Aadhaar eKYC OTP), Digital Signature (DSC/Aadhaar eSign), Biometric, Physical. Risk-based: Low (Simple ES), Medium (OTP/eSign), High (DSC/eSign). Пороги задают Product Teams. RCSA matrix. Record retention 7 лет.
**Digital products for Corporate (Indian banks):** LC, Export Packing Credit, Advance Import Credit, Forfaiting, BG/Performance Bond, Bill Discounting, Export/Trade Finance, Remittances, FX hedging, Overdraft, Term Loan, Working Capital. ICICI/SBI/HDFC методы подписания (HS/eSign/scanned soft copy для HNI). Good practices: CC/OD, Term Loans, LC, BG, Supply Chain Finance, EPC, Advance Import Credit — через online bank + eSign Aadhaar OTP.

---

## Documents (OCR / per legal type / entity types & attributes)
**Documents_for_OCR:** полные чек-листы для Individuals (Proof of Identity, PAN, Signature, Photo; Form 60/FATCA/Customer Declaration; foreign nationals) и Entities (Company/LLP/Sole Prop/Partnership) — где загружается (Guest Zone tab), mandatory/optional, требования, инструкция RM. Physical Signed Original Documents to be sent to Bank (по типам ЮЛ). Individual accounts list (Sber пока не открывает физлицам). Ссылки: Documents Checklist for RM (CLDROBO), Online Onboarding Check List, Compare docs.
**Documents per legal type — BR Attributes:** атрибуты Board Resolution / Partnership Deed по типам ЮЛ (Sole Prop declaration, LLP designated partners resolution, Private/Public Ltd board resolution, Partnership) + required docs с источниками (ITD/MCA/GST/UIDAI/DGFT). BR samples: Full/Short V1, V2.
**List of entity types and attributes:** типы в Caldera (Corporate/Individual/Financial Institution); есть ли PAN/CIN, применим ли CKYC, доступен ли в Caldera/Online onboarding, Probe42 samples. Online onboarding: Private/Public Ltd, LLP, Sole Prop, Partnership. OPC = как Private Ltd + Nominee consent form (INC-3, KYC nominee обязателен по Companies Act Sec 3(1)). FPI categories I/II/III (SEBI). Список required docs по ~17 типам ЮЛ (mandatory/optional, scan/physical, Probe availability). FPI docs list. Attributes (одинаковы для всех ЮЛ, хранятся в CIF; Probe42 не покрывает Trust/Society/HUF/Gov/LO/BO/PO/IFSC/SNRR). + BNQ attributes.
**Online Onboarding Check List:** документы RM собирает по Company/LLP/Individuals + доп. при выборе + физические оригиналы + Internal Reports (OFAC/CRILC/BGV/LEI/IEC/GST/NCC/MCA) загружает RM в CIF.
**Temporary page:** дубль таблицы "List of documents for Entities uploaded online by Customer in CAF" + "uploaded by RM in CIF" (Forwarding Letter, Profile, OFAC, CRILC, BGV, LEI/IEC/GST/NCC/MCA reports, KYC Form).

---

## Email Notifications
Анализ best practices Indian banks (DBS/HDFC/RBL/AXIS) vs Sber India. Takeaways: salutation по имени (ок); header с brand colors/logo/nav links; footer disclaimer "system-generated, no reply"; RBL — unsubscribe; ссылки T&C/Privacy/Tax; TLS encryption (как у всех). Таблица AS-IS vs TO-BE для 15 Sber email-шаблонов (Online Onboarding ×2, Statement success/failure, Limit change, LCBD lead, login credentials, beneficiary action, FEMA mapping ×4, uploaded docs reject/approve, declarations). TO-BE: убрать "India", добавить "AD Category-I bank authorized by RBI", customer service +91 11400 48888, subscription signature.

---

## Offers and deals priority
Axioms: один активный процесс на продукт; offer = invitation с validity/status/source; приоритет source; deal (product) = goal. Priority matrix: 4 Manual In-Office; 3 Manual after call; 2 Targeted Marketing; 1 Mass Campaign. При равенстве — по дате создания (раньше = выше). Проблемы: воровство сделок; несколько сделок на current account (current + export). Links: BRD Offers, OFFER_STATUS_MAPPING.

---

## Project To-Do list / Task Tracker
**To-Do (статусы задач):** VKYC SOP (Yaroslav — done); Self-VKYC SOP + Risk Matrix + Signatory cross-check (Denis/Sandeep); Data verification sources/process (Sandeep); SOP acc opening (Sandeep/Denis); DVU process scenarios (Dima/Karan); BGV criteria (Karan — "боремся за отмену"); CRM part (Dima/Sasha/Vika/Sonya); BNQ (Denis); VCIP mockups; BR Operating Instruction (Sandeep/Denis/Tania); CRM/CallCenter; AS already onboarded (Yaroslav); Consents dashboard (Denis); auto account opening (Sandeep/Sandhya/Yulia); account types (Yulia); website landing (Alex); other legal types offline (Dima); Probe42 statistics BGV (Dima); IEC (Yaroslav).
**RM workload estimation:** ~4,025-4,145 мин/мес на RM (~8.5 рабочих дней). Checks per account (GST/PAN/IEC/NCC/OFAC/UDIN/CRILC/UDYAM/LEI/MCA + confirmation email) = 1,235-1,355 мин (2.6-2.8 дня); additional tasks (dormancy/ReKYC/closure/name change/signatories/migration/EDD/nomination/funding/audit) = 750 мин (1.56 дня); Internet banking tasks = 240 мин; uploading в Caldera = 1,800 мин (3.75 дня).
**Task Tracker (отдельная страница):** задачи World/Indian banks practices, потенциал <5cr, legal types docs, credit exposure regulatory, E2E process, exposure calculator, VCIP regs, account types, landing, digital banking regs/practices, monthly maintenance fees, signing methods.

---

## Статистика (BGV analysis / Clients 2026 / Risc analysis)
**Analysis for BGV (3681 completed IN clients):** COMPANY = 1956; >2 лет на момент открытия = 1575 (~80.5%); финотчётность 2+ года в Probe = 1521 (~77.8%). Proprietorships не имеют финотчётности в Probe (не обязаны MCA). No-BGV criteria coverage: >2 года ~80.5%, fin reports ~77.8%, PSU <0.5%, regulated FI <0.5%, listed —. Script (SQL по core_profile/cam_account_card/data_company_detail/DATA_COMPANY_FIN_REPORT).
**Clients 2026 (на 01.05, 632 клиента с первым счётом в 2026):** Partnerships 158, Proprietorships 150, Others 3, Companies 323. Companies >2 года 257, fin statements ≥2 года 230. Могут пропустить BGV: 233/632 (~36.9%). Доля Part+Prop растёт: 2024 45.4%, 2025 47.4%, 2026 48.7%.
**Risc analysis (на 03.06, 3882 клиента):** business segment breakdown (Manufacturing 1615, Trading 1318, Bullion dealers 141, Other 421…). Risk points: Vintage (1pt 1993, 2pt 97, 3pt 139); Residency (1pt 3802, 3pt 80); Company Type (1pt 3881, 3pt 1); Business segment (1pt 1886, 2pt 1373, 3pt 562). SQL script (+ business_segment из kyc.customer_kyc_details).

---

## Research on Initial Deposit Requirement
RBI не обязывает initial deposit для активации corporate current account, но банки включают funding как политику (intent, activation, deposit growth, viability). ICICI ₹10k-1M; Axis ₹7.5k-0.5M; HDFC мин ₹25k; SBI ₹5k-1M; YES ₹10k-1M (startup waivers); DBS ₹10k-0.7M (6 мес zero balance → QAB); Neo/Fintech (NIYO/RazorpayX/Jupiter) — часто без; Digital (DBS digibank/Kotak 811/Fi) — zero, потом MAB/QAB через 6 мес.

---

## Survey — Corporate Client Digital Banking Preference
Опросник (2 версии): тип бизнеса/сегмент; используется ли digital signing (DSC/Aadhaar eSign/checkbox/OTP); метод для продуктов; готовность к fully digital; продукты через fully digital (Current Account/Loans/OD/Trade/Forex/IB/GST/CMS/POS/Credit Card); где OTP-submission достаточно. Результаты (DSC/Digital Signing 03.2026): Happay (non-client) — не использует; Bruderer (non-client) — DSC для A2 forms/loans; Bitcipher — пока не срочно, для loans.

---

## Amendment To Board Resolution
Проблема (Internal Audit): internet banking активируется вопреки Mode of Operation в BR; пользователь может провести транзакцию сверх лимита. Встречи 12-13.11.25 (CRM/Ops/Legal/Customer support). Решение: добавить поле Limit в Caldera (на уровне счёта/клиента); для существующих клиентов — идентифицировать лимиты из AoF/BR (Customer support/аналитики); для новых — BR с явной секцией Internet Banking rights; email существующим клиентам (draft consent на BR); pop-up при превышении лимита "Transaction amount is more than the defined Limit". BRD: Flexible Limit Settings in Internet Banking (MVP).

---

## CRM Scenarios 1-7 (детали, дублируют 4.1)
**Scenario 1 Website Form** — пошаговый флоу (System create lead → search by PAN → Probe42 → autopopulate → CCO call/verify PAN/offer self-registration/reject) = идентично 4.1-CRM-Scenarios.md.
**Scenario 4 Self Registration** — детальный флоу: 00 Access Product (website CTA) → 01 New Registration (confirm entity type: Sole Proprietor/Partnership/LLP/Public Ltd/Private Ltd/None; если other country → lead в Sales) → 02 Enter Email + accept consents → 03 Email Verification (link expires X days; existing login → resume; new → mobile) → 04 Resume Login → 05 Enter Mobile → 06 OTP Auth (2FA → Unified Login ID) → 07 Receive login credentials → 08 Setup password → 09 Confirm + redirect to Guest Zone.
**Scenarios 2/3/5/6/7** (Incoming Call, Get Next, Branch Visit, RM Visit, IB Banner) — Prerequisites/Process Diagram/Description = TBD.

---

## Конкуренты (CJM)
**Account Opening - CJM:** глоссарий (CBE, Itsme, UBO, GSTIN, CIN, LLPIN, IEC, OIN, AMB, NMC, DNC/NDNC, BOI, AOP, US GIIN, EIN, NSDL). Списки документов для Private/Public Ltd и Sole Prop по банкам (AXIS/DBS/ICICI/SBI/RBL/YES). Детальные онлайн-флоу: **YES Bank** (форма → RM visit с планшетом → digital onboarding); **DBS** (онлайн-аппликация с автозаполнением по CIN/LLPIN/GSTIN, риск-опросник встроен, → RM visit); **SBI** (4 шага: online registration → print/sign → submit at branch → login; V-KYC только Sole Prop); **ICICI** (выбор последних 6 цифр номера счёта; Exposure Agreement + Additional T&C; → RM visit ~1 мин); **RBL** (фактически callback-форма → звонок <30 сек); **ING Netherlands** (полностью онлайн: Itsme + CBE; Personal/Company registration; branch selection; finalise). Takeaways: автозаполнение по CIN/LLPIN/GSTIN; встроенный риск-опросник; Exposure Agreement.
**World Banks Practice — Revolut (EU/Lithuania):** полностью онлайн. Шаги: country → legal type (Freelancer/Private Ltd/LLP/Limited Partnership/Public Ltd/Partnership) → email verification → mobile → passcode → authorizer personal data → company data (autopopulate из public DB) → T&C → role (director&shareholder / >25% / neither) → Account Activation (Business Address verify; Nature of Business questionnaire + supporting docs/FATCA; Business Details; Corporate Structure; Personal Identity 2 docs + V-KYC video commands; Plan & Card) → Account Opening. Для крупных действий — повторный быстрый V-KYC по фото.
**VTB Shanghai Branch:** не полностью digital (online application + offline meeting с RM). Online: Open Account → Large Business/SME → login/registration (email verify 60 мин) → New Application: Basic Information (country, reg number/date, name, revenue, importer/exporter, Russian counterparty + TIN), Capital/address, Business Details, UBO & Contact persons (Legal Rep, CFO, 2 callback), Shareholders (≥5%), Upload documents (Legal Rep Authorization, PoA RBS, business license, AoA, IDs + translation, Individual Consent Form, ownership structure до UBO >25%), T&C. Takeaways: рос. контрагент должен быть клиентом ВТБ; basic account открывается на следующий бизнес-день после регистрации (регистрация ~14 дней).

---

## Welcome Kit for Corporate Customers (Indian Banks)
DBS (debit card, cheque book, card holder, diary, water bottle); HDFC (premium rigid box, card/cheque book/welcome letter); ICICI (orange branded pouch); HSBC (luxury folder, card/welcome pack/RM contact); SBI (cheque book/debit card/welcome docs).

---

## Usefull links and info
VKYC IP and VPN Validation (страна India + VPN check; whitelist IP ISP по TRAI; таблицы IP-ranges → страны; банер VKYC Manager). Photo recognition by SmartBio SDK (AI/биометрия для Self-VKYC). Aadhaar Offline eKYC (XML file — второй способ, без online-запроса в UIDAI; QR/letter/PVC или electronic XML/mAadhaar). VKYC for Foreign Beneficiaries. Access Requests / тестовое окружение Online Onboarding.

---

## Task: incorrect inward messages marking (VTB SFMS) — отдельная задача
Проблема: ВТБ присылает некорректные платежи, неидентифицируемые как трансграничные; нет стандарта SFMS для признака трансграничности. Решение MVP (к 17 ноября): платежи от ВТБ на hold → алерт TBDD specialist → проверить payment details (additional info: ADVANCE, purpose code p103/p102) → идентифицировать как трансгран → запросить документы → Refer to compliance. Целевое (Q1 2026): транзакции анализируют SFMS → новая таблица с признаком трансграничности. SFMS поля где ВТБ шлёт инфо: <InstrInf>, <RmtInf>/<Ustrd>. Сравнение RTGS/NEFT/IMPS. (Прим.: не относится к онбордингу — попало в выгрузку.)

---

## Копия 1D - 2. VCIP (расширенная версия страницы 2)
Дубликат "1D - 2. VCIP (Personal Identification)" с теми же RBI-условиями (см. 2-VCIP-Personal-Identification.md) ПЛЮС детальный пошаговый VCIP Process Description (01-22 VCIP: link → Guest Zone OTP → location/IP/spoof checks → offline onboarding fallback → geo-tag → consent collection screen с 5 секциями → Aadhaar OTP accept → данные/фото из UIDAI → connection/audio/video checks → Verification of Identity Docs / Audio / Video sub-processes → auto-matching с docs/CKYCR/UIDAI) и Verification of Identity Documents Process (01-08 DOCS) и полная **Officer-assisted VKYC** таблица действий VKYC Officer в Jazz (Connection quality check; Client verification check — mobile/passport country/DOB; Documents check — signature/PAN front/back/address proof, screenshots vs CKYC; Submit result Complete/Mark as Failed; Report/Not Report → Compliance review → COMPLETE/BLOCKED). Открытые вопросы по каждому шагу (что если AS вне India, что если данные из UIDAI не получены, как проводить connection/audio тесты, атрибуты матчинга).

---
