# BNQ Template A — Sole Proprietorship (полный опросник)

> Источник: Confluence `7.6.2. — The 1DAY INICIATIVE — The new unified automated process of online onboarding and product opening` (`pageId=22571420713`, Security K3, 183 views), раздел **«Business Nature Questionnaire Templates → A — Sole Proprietorship»**. Снято фото 2026-06-08.
> Применение: эталонный поток вопросов BNQ для **первой роли прототипа — Sole Proprietor**. Связано: [[BNQ — Business Nature Questionnaire]] (общая структура) · [[Разбор встречи — Марго 2026-06-08]] · [[Карта экранов]] · [[Mock-модель данных]] · [[Вопросы и расхождения]].
> ⚠️ Базовый тип юрлица прототипа меняется: было Private Limited (mock-модель), теперь стартуем с **Sole Proprietorship**. Другие роли/типы добавляем позже. См. [[Вопросы и расхождения]] Р-7.

## Карта файла
- [Принцип потока](#принцип-потока)
- [Block 1 — Risk Categorization (Q1–Q5)](#block-1--risk-categorization)
- [Block 2 — Additional Questions (Q6–Q11)](#block-2--additional-questions)
- [UX-паттерны](#ux-паттерны-важно-для-прототипа)

## Принцип потока

- **Несколько ролей** регистрируют бизнес (по типу юрлица). Прототип строим **итеративно: сначала Sole Proprietor, потом добавляем остальные.**
- Каждый вопрос имеет два сценария: **DATA AVAILABLE** (Probe42 подтянул → подтверди / вопрос не задаём) и **DATA NOT AVAILABLE** (Probe42 пусто → задаём вопрос).
- Колонки источника: `Risk Attribute · Probe42 Data Sample · Probe42 Data Availability · Answer Options & Risk Score (+ Next Question)`.
- Risk Score (1–3) — внутренний, клиенту не показываем.

## Block 1 — Risk Categorization

### Q1 · Business Industry / Segment
- **Probe42 sample:** Main Activity Group Code `A` / «Agriculture, forestry, fishing»; Business Activity Code `A4` / «Support activities to Agriculture and Other Activities including Hunting».
- **DATA AVAILABLE:** *«We have identified your primary business segments as ____. Is that so?»*
- **DATA NOT AVAILABLE:** *«What industry is your business in? (select from the list)»* → *«Now please indicate the segment of your business (select from the list)»*
- **Answer options → Risk → Next:**
  | Группа | Risk | Next |
  |---|---|---|
  | Employee, Government Department, Government Owned Company, Regulatory & Statutory Body, Banking, Manufacturing | 1 | Q2 |
  | Advertising, Aviation, Ports & Shipping, Clearing, Consulting, Construction, Maintenance Repair & Operations, Oil & Gas, Trading, Tourism & Hospitality, Diplomat, ITES, Fintech & Financial Services | 2 | Q2 |
  | International Job placement agencies, Tobacco, Casino, Night Club, Arms, Antiques, Explosives, Consulates, Online Lotteries, Telemarketers, Offshore entities, FFMC, Share broker, NBFC, Liquor, Gems and Jewellery, Other | 3 | Q2 |
- **REQUEST:** при выборе индустрии/сегмента показывается краткая инструкция и поле — клиент загружает **business licence** для выбранной индустрии.

### Q2 · Company Vintage
- **Probe42 sample:** Date of Incorporation `20 Jan 2020`.
- **DATA AVAILABLE:** вопрос не задаём — risk score по vintage из Probe42.
- **DATA NOT AVAILABLE:** *«What is the date of incorporation?»* (клиент выбирает дату из дропдауна, vintage считается).
- **Answer options → Risk → Next:**
  | Vintage | Risk | Next |
  |---|---|---|
  | < 6 months | 3 | Q3 |
  | > 6 months, < 1 year | 2 | Q3 |
  | > 1 year | 1 | Q3 |

### Q3 · Residency (компания)
- **Probe42:** мапится по Registered address / Pin Code. Attribute `registeredAddress.state`. Логика: если Code = `IN` → Resident Status = Resident по умолчанию. Иной статус → **trigger alert to DVU**.
- **DATA AVAILABLE:** вопрос не задаём — risk score по Company Residency.
- **DATA NOT AVAILABLE:** *«Please confirm the residency status for your company»*
- **Answer options → Risk → Next:**
  | Опция | Risk | Next |
  |---|---|---|
  | Company is an Indian resident | – | Q4 |
  | Company is a foreign resident outside India | 3 | Q4 |

### Q4 · Residency (налоговая / физлицо)
- **No Data** (Probe42 не даёт).
- **Question:** *«Please confirm your tax residency.»*
- **Answer options → Risk → Next:**
  | Опция | Risk | Next |
  |---|---|---|
  | Indian National; Foreign national residing on employment VISA | 1 | Q5 |
  | Non-resident Indian; OCI card holder; Foreign national of Russian Federation not on employment VISA | 2 | Q5 |
  | Foreign national other | 3 | Q5 |

### Q5 · PEP
- **No Data.**
- **Question:** *«Do you or your close relatives hold or have held in the past 5 years public positions? (government officials, judges, military executives)?»*
- **Answer options → Risk → Next:**
  | Опция | Risk | Next | Действие |
  |---|---|---|---|
  | Yes | 3 | Q6 | **Alert → DVU-Compliance (Name Screening)** |
  | No | — | Q6 | — |

## Block 2 — Additional Questions

> Не влияют на риск-скор (кроме пометок). Собирают инфо о продуктах и ВЭД.

### Q6 · Net Revenue
- **Probe42 sample:** Profit & Loss — AOC-4 (Rs. Crore). Attribute: Net Revenue (за последний год).
- **DATA AVAILABLE:** вопрос не задаём.
- **DATA NOT AVAILABLE:** *«What is your Net Revenue for the Last Year?»* → *«My Net Revenue for the last year is ____ crore.»*

### Q7 · Product Interest (кредитные продукты)
- **No Data.**
- **Question:** *«Do you plan to avail any credit facilities (term loans, letters of credit, bank guarantees) from our bank in the next 6 months?»*
- **Answer → Next:** Yes → Q7 (**Alert to CRM**) · No → Q8.

### Q8 · Product Interest (сумма кредита)
- **No Data.**
- **Question:** *«What is the approximate credit amount you would require?»*
- **Answer:** ввод суммы вручную → Risk «Good to know» → Q8.

### Q9 · Import / Export Activity
- **Probe42 sample:** Nature of Business Activities: EOU / STP / EHTP | Export | Import | Leasing Business | Office / Sale Office | Recipient of Goods or Services | Service Provision | Supplier of Services | Warehouse / Depot | Works Contract.
- **DATA AVAILABLE:** *«We have noticed that your company deals in Import / Export Activities, is that so?»*
- **DATA NOT AVAILABLE:** *«Do you deal in Import or Export Activities?»*
- **Answer → Next:**
  | Опция | Next |
  |---|---|
  | Yes, I deal in **export** activities only | Q9 |
  | Yes, I deal in **import** activities only | Q9 |
  | Yes, I deal in **both** import and export | Q9 |
  | No, I don't deal in import or export | – |

### Q10 · Import / Export — страны-партнёры
- **No Data.**
- **Question:** *«What countries are your import / export partners from? (select all that apply)»* → выбор стран из дропдауна → Q10.

### Q11 · Import / Export — IEC документ (disclaimer)
- **No Data. Show Disclaimer:**
  > ⚠️ *For processing international payments and trade transactions, your **IEC** is required by SberBank under FEMA regulations. Without a valid IEC, we may not be able to process your crossborder payments. You can upload your IEC document now, or upload it later through the online bank after account opening. Upload-later will not affect account opening, although we recommend uploading now.*
- **Answer → Action:**
  | Опция | Действие |
  |---|---|
  | Upload Now | Клиент загружает IEC → хранится в KYC records → **Trigger to DVU** проверить документ |
  | Upload Later | **Trigger to Online Bank** запросить IEC после открытия счёта |

## UX-паттерны (важно для прототипа)

1. **Двойной сценарий каждого вопроса:** «Probe42 подтянул → подтверди» vs «нет данных → задаём вопрос». Прототип должен показывать оба состояния.
2. **Загрузки документов внутри опросника:** business licence (Q1), IEC (Q11) — поле upload прямо в потоке.
3. **Триггеры в фоне:** alert в DVU (Q3 нерезидент, Q5 PEP, Q11 IEC), alert в CRM (Q7 кредит).
4. **Линейный поток с Next Question** Q1→…→Q11, ветвление только по «No» в Q9 (пропуск ВЭД-блока) и Q7.
5. **Sole Proprietorship = один владелец** → multi-signatory / Board Resolution логика из общего флоу здесь упрощается (один человек на VCIP). Уточнить — см. Р-7.
