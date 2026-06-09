---
source: Confluence "1D - 9. Consents Dashboard", получено 2026-06-09
type: исходник (raw, verbatim; длинные юр-тексты согласий сохранены по сути + ключевые формулировки)
---

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
