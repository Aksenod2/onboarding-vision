# 02 — Проверки банка (Bank Verification Sub-Process)

← [README](README.md)

## Карта файла
- [Обзор](#обзор)
- [1. Initial Auto Screening (PAN)](#1-initial-auto-screening-pan)
- [2. CKYC Registry check](#2-ckyc-registry-check)
- [3. PAN Validation during VCIP session](#3-pan-validation-during-vcip-session)
- [4. BOV Check](#4-bov-check)

---

## Обзор

> Источник: IMG_6827–6828

This section outlines the end-to-end bank verification and automated validation framework implemented as part of the digital onboarding journey for legal entities. The process is designed to ensure **data accuracy, regulatory compliance, and operational efficiency**, while enabling Straight Through Processing (STP) wherever feasible.

**The Bank Verification Process includes the following sub-processes:**
- Initial Auto-Screening
- CKYC Register check
- PAN Validation during VCIP
- BOV Check

---

## 1. Initial Auto Screening (PAN)

> Источник: IMG_6828–6830

The flow represents the initial screening of customer/entity PAN details: auto-populating entity details from integrated sources (such as NSDL/PAN validation, OFAC sanctions, CRILC credit exposure, Probe42 data), screening against international watchlists where feasible, and identification of alerts, matches, or discrepancies — followed by system-driven checks with controlled manual intervention points, ensuring a robust and audit-compliant onboarding mechanism.

**Process Description — PAN Auto Screening:**

| Step | Process Stage | Description | Next Step / Action |
|---|---|---|---|
| **01** | Enter PAN | Prospect / RM enters PAN number | → 02 |
| **02** | Prospect Consent + Initial Screening | Customer provides consent for fetching data; system initiates screening and data retrieval from integrated sources (NSDL PAN validation, OFAC sanctions, CRILC credit exposure, Probe42 data) | → parallel validation checks 03, 04, 05 |
| **03** | Data Auto-population (Probe42) | System attempts to auto-populate entity/customer details using Probe42 data | If data available → proceed; if not → **Alert DVU** for manual validation |
| **04** | CRILC Check | System performs CRILC check to identify existing credit exposure and risk indicators | If exposure/case > 10 Cr → proceed; if fail → **Alert DVU** |
| **05** | OFAC / Sanctions Screening | System performs sanctions screening against OFAC and other regulatory watchlists | If pass → proceed; if alert → **Route to DVU / Compliance** |
| **06** | If all checks pass | Proceed to STP Onboarding | `[нечитаемо]` |

---

## 2. CKYC Registry check

> Источник: IMG_6829–6831

This sub-process outlines the integration with the **Central KYC (CKYC) Registry**: CKYC data retrieval and validation for legal entities (PAN, CKYC ID), download and validation of KYC data where available, and updating or creation of CKYC records if required. Ensures compliance with regulatory requirements while reducing duplication of KYC efforts.

**Process Description — CKYC Registry:**

| Step | Process Step | Description | Next Action |
|---|---|---|---|
| **00** | Initiate Auto Check | System initiates CKYC validation by checking whether customer/entity data exists in the CKYC registry | → CKYC data availability check |
| **01** | CKYC Data Availability Check | System checks if a CKYC record is available in the registry | If Yes → Step 02; If No → **Alert DVU** |
| **02** | Validate Against CKYC Details | System validates customer/entity details against CKYC registry data for consistency and completeness | → match validation |
| **03** | Match Validation | System checks whether input data matches CKYC registry data | If Yes → proceed; If No → **Alert DVU** |
| **03** | Validation Pass | Additional validation layer to confirm data accuracy and completeness; CKYC validation completed via automated checks | → proceed with onboarding |
| **03a** | Alert DVU (Exception Handling) | On CKYC data not available or mismatch, system triggers alert to DVU for manual intervention | DVU initiates manual process |
| **03b** | DVU Login to CKYC Portal | DVU logs into CKYC registry portal to handle exceptions, new record creation, or data updates | → data updates |
| **03b** | Update CKYC Data / Upload doc | DVU updates or uploads customer/entity document; new record creation or modification of existing record | → CKYC number generation |
| **03b** | Generate CKYC Identifier | System/CKYC registry generates a **14-digit CKYC number** and records it in the system | → customer notification |
| **04b** | Notify Customer | CKYC process completed (via automated validation or DVU-assisted flow) | End process |

---

## 3. PAN Validation during VCIP session

> Источник: IMG_6831–6832

| Step | Process Step | Description | Next Step |
|---|---|---|---|
| **01** | PAN Capture during VCIP | The authorized signatory displays the PAN card (front side) during the VCIP session; AI agent-based image capture | → OCR/AI recognition |
| **02** | OCR / AI Recognition | System performs OCR/AI-based extraction and recognition of PAN details from captured image | |
| **03** | PAN Validation against BR | Extracted PAN validated against the Board Resolution (BR) or submitted records | |
| **04** | PAN Validation against NSDL | Extracted PAN validated against NSDL | |
| **05** | Exception Handling | On recognition failure or mismatch, case routed to DVU for manual verification | DVU verifies and updates status |
| **06** | Validation Outcome | On successful PAN match with BR, validation marked successful and recorded; if mismatch → **Alert DVU** | Proceed to next onboarding step |

---

## 4. BOV Check

> Источник: IMG_6833–6834

**BOV Criteria:**
Criteria to be defined for performing BOV (Business Object Verification / физическая проверка бизнеса) **only in cases of new company or suspicious company.** If the company has a good track record and is a listed company, the physical BOV process is to be eliminated.

> 💡 **Предложение в документе:** right now BOV check is a mandatory step for all new clients. Suggestion — **skip BOV for low-risk clients** as defined in `10-3.1 Criteria for BOV`.

**Поток (по блок-схеме, частично нечитаемо):**
- Customer Onboarding → Initial Screening → Business Nature Questionnaire
- Risk / Product check → если High-Risk категория → BOV требуется
- **BOV Not Required** (low-risk) ИЛИ **DVU – Initiate BOV** (требуется):
  - Documents required by BOV
  - Physical verification conducted by RM / supplier
  - Report from RM / supplier sent to DVU

**BOV Decision Matrix** — ссылки:
- `10-3.1: Criteria for BOV check`
- `10-1.2: Company/Entity Onboarding process from the BANK perspective`
- `10-1.3: Partnership Onboarding process from the BANK perspective`
- `10-1.4: Sole Prop Onboarding process from the BANK perspective`

> ⚠️ Сама BOV Decision Matrix (таблица) на фото нечитаема — нужен экспорт из Confluence.
