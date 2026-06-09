---
source: Confluence "1D - 10. Matrix of Personal Signatory Data Cross-Check", получено 2026-06-09
type: исходник (raw, verbatim)
---

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
