# Mock-модель данных

← [README](README.md)

> ⚠️ **ЯДРО.** Здесь схема сущностей + индийские форматы/справочники + **один полный эталонный пример** (Private Limited Company). Остальные типы юрлиц и массив записей доращиваем после согласования.
>
> 🇮🇳 **Все данные — гипотетически индийские.** Рынок процесса — Индия (PAN, NSDL, MCA, CKYC, CRILC, Aadhaar, INR/Cr). Имена, адреса, реквизиты, телефоны — индийские. Никаких российских паттернов.

## Карта файла
- [Карта сущностей](#карта-сущностей)
- [Индийские форматы и справочники](#индийские-форматы-и-справочники)
- [Сущности и поля](#сущности-и-поля)
- [Эталонный пример (Private Limited)](#эталонный-пример-private-limited)

---

## Карта сущностей

```
Company (Legal Entity)
 ├── AuthorizedSignatory[]   (подписанты, 1..N)
 ├── BeneficialOwner[] (UBO) (бенефициары, 0..N)
 ├── Document[]               (документы сущности и лиц)
 ├── BusinessNature           (анкета: индустрия, PEP, FATCA, резидентность)
 ├── ScreeningResult[]        (PAN/OFAC/CRILC/CKYC/Probe42)
 ├── RiskAssessment           (Low/Medium/High + флаг High-Risk Industry)
 ├── VCIPSession[]            (видеоидентификация подписантов)
 ├── Account (CAM)            (открываемый счёт)
 └── DVUTask[]                (задачи верификации — при исключениях)

OnboardingCase  — обёртка над всем: режим (STP/Hybrid/Offline), статус, текущий шаг 001→009
```

Связи: `OnboardingCase 1—1 Company`; `Company 1—N Signatory/Document/Screening`; `Company 1—1 RiskAssessment/Account`.

---

## Индийские форматы и справочники

### Форматы идентификаторов

| Поле | Формат | Пример | Кто выдаёт / реестр |
|---|---|---|---|
| **PAN** | `AAAAA9999A` (4-й символ = тип держателя) | `AABCS1234C` | NSDL / Income Tax |
| → 4-й символ PAN | `C`=Company, `P`=Individual, `F`=Firm/Partnership, `H`=HUF, `L`=LLP, `T`=Trust | — | — |
| **CIN** (компании) | 21 знак: `U`+5-инд.код+2-штат+4-год+тип+6-№ | `U17110MH2012PTC234567` | MCA |
| → тип в CIN | `PTC`=Private Ltd, `PLC`=Public Ltd | — | — |
| **LLPIN** (LLP) | `AAA-1234` | `AAB-7654` | MCA |
| **GSTIN** | 15 знаков: 2-штат+10-PAN+1+`Z`+1 | `27AABCS1234C1Z8` | GSTN |
| **Aadhaar** (физлицо, eKyc) | 12 цифр `XXXX XXXX XXXX` | `4521 7890 1234` | UIDAI |
| **CKYC ID** | 14 цифр | `12345678901234` | CKYC Registry (CERSAI) |
| **Телефон** | `+91 XXXXX XXXXX` (старт 6–9) | `+91 98201 45678` | — |
| **PIN code** (индекс) | 6 цифр | `400069` | India Post |

### Справочники (enums)

- **Тип юрлица:** Private Limited Company · Public Limited Company · LLP · Partnership Firm · Sole Proprietorship
- **Режим онбординга:** STP · Hybrid · Offline
- **Риск-категория:** Low · Medium · High
- **Класс счёта (CAM):** 4000 · 4500 (CRILC-контроль применим только к 4500)
- **Валюта:** INR (по умолчанию). Крупные суммы — в **Cr** (крор = 10 млн) и **lakh** (100 тыс). Порог CRILC: **> 10 Cr**.
- **Реестры/скрининг:** NSDL (PAN), MCA / Probe42 (данные компании), CKYC Registry, CRILC (RBI, кредитная нагрузка), OFAC (санкции)
- **Штаты/города (примеры):** Maharashtra (Mumbai, Pune) · Karnataka (Bengaluru) · Tamil Nadu (Chennai) · Delhi · Gujarat (Ahmedabad) · Telangana (Hyderabad)
- **Источник поля** (важный атрибут модели): `manual` (ввод клиентом) · `registry` (авто из реестра) · `system` (генерит система)

---

## Сущности и поля

> Колонка **Источник**: `manual` / `registry` / `system` — критично для прототипа (определяет, что поле редактируемое, что авто-заполнено badge'ем «из реестра», что только для чтения).

### Company (Legal Entity)
| Поле | Тип | Источник | Пример |
|---|---|---|---|
| entityType | enum | manual | Private Limited Company |
| companyName | string | registry | Saanvi Textiles Private Limited |
| pan | PAN | manual | AABCS1234C |
| cin | CIN | registry | U17110MH2012PTC234567 |
| gstin | GSTIN | registry | 27AABCS1234C1Z8 |
| incorporationDate | date | registry | 14-03-2012 |
| registeredAddress | address | registry | Unit 402, Lotus Business Park, Andheri East, Mumbai, MH 400069 |
| correspondenceAddress | address | manual | *(только если отличается от registered)* |
| industry | string | manual | Textile manufacturing |
| chequeBookRequired | bool | manual | true |

### AuthorizedSignatory
| Поле | Тип | Источник | Пример |
|---|---|---|---|
| fullName | string | manual/registry | Rajesh Kumar Menon |
| pan | PAN | manual | ABCPM5678K |
| aadhaar | Aadhaar | manual (eKyc) | 4521 7890 1234 |
| designation | string | manual | Director |
| email | string | manual | rajesh.menon@saanvitextiles.in |
| phone | phone | manual | +91 98201 45678 |
| residencyStatus | enum | manual | Resident |
| isPEP | bool | manual | false |

### Document
| Поле | Тип | Источник | Пример |
|---|---|---|---|
| docType | enum | — | Certificate of Incorporation |
| applicableTo | enum | — | Company |
| mandatory | bool | — | true |
| handling | enum | — | Auto fetch (STP) / Upload (Hybrid) / Physical (Offline) |
| status | enum | system | Fetched / Uploaded / Pending / Verified |
| verifiedBy | enum | system | System / DVU |

> Типы документов: PAN card · Certificate of Incorporation · MOA & AOA · Board Resolution / Authority Letter · Partnership Deed · Shareholding pattern · Address Proof.

### ScreeningResult
| Поле | Тип | Источник | Пример |
|---|---|---|---|
| checkType | enum | — | PAN / OFAC / CRILC / CKYC / Probe42 |
| status | enum | system | Pass / Alert / NotFound |
| detail | string | system | CRILC exposure ₹3.2 Cr (< 10 Cr → proceed) |
| routedToDVU | bool | system | false |

### RiskAssessment
| Поле | Тип | Источник | Пример |
|---|---|---|---|
| category | enum | system | Low |
| highRiskIndustry | bool | system | false |
| crmHeadApprovalRequired | bool | system | false |

### Account (CAM)
| Поле | Тип | Источник | Пример |
|---|---|---|---|
| cif | string | system | *(auto-generate)* |
| accountClass | enum | system | 4000 |
| currency | enum | system | INR |
| productName | string | registry | Current Account |
| mode | enum | system | STP |

---

## Эталонный пример (Private Limited)

> Полный сквозной кейс STP-онбординга. Используем как «золотую запись» для прототипа.

**OnboardingCase** — режим `STP`, статус `Completed`, шаг `009 (Account opening trigger)`

**Company**
- Saanvi Textiles Private Limited · PAN `AABCS1234C` · CIN `U17110MH2012PTC234567`
- GSTIN `27AABCS1234C1Z8` · инкорпорация 14-03-2012
- Адрес: Unit 402, Lotus Business Park, Andheri East, Mumbai, Maharashtra 400069
- Индустрия: Textile manufacturing (не high-risk) · Cheque book: да

**Signatories**
1. Rajesh Kumar Menon · Director · PAN `ABCPM5678K` · Aadhaar `4521 7890 1234` · +91 98201 45678 · rajesh.menon@saanvitextiles.in · Resident · PEP: нет
2. Priya Sharma · Director · PAN `DEFPS9012L` · Aadhaar `7788 1234 5566` · +91 99300 22115 · Resident · PEP: нет

**Documents:** PAN card ✓ · Certificate of Incorporation ✓ (auto-fetch MCA) · MOA & AOA ✓ · Board Resolution ✓ (upload) · Address Proof ✓ — все Verified by System

**Screening**
- PAN (NSDL): **Pass**
- OFAC: **Pass** (clear)
- CRILC: **Pass** — exposure ₹3.2 Cr (< 10 Cr)
- CKYC: **Found** — CKYC ID `45678901234567`
- Probe42: **Fetched** (данные компании авто-подтянуты)

**RiskAssessment:** Low · High-Risk Industry: нет · CRM Head approval: не требуется

**VCIP:** обе подписи — selfVKYC пройден (eKyc Aadhaar OK)

**Account (CAM):** Current Account · class `4000` · INR · CIF auto-generated · mode STP

---

> **Что доращиваем дальше:** примеры для Public Limited, LLP, Partnership, Sole Proprietorship; кейсы **не-STP** (Hybrid с DVU-задачей, Offline); запись с **High-Risk industry** (требует CRM Head approval) и с **CRILC > 10 Cr**.
