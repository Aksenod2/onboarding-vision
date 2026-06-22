# BNQ — Company (Private Limited) · единый источник опросника

> **Сценарий: Компания (Private Limited)** — BNQ Template **C — Company Entity Type**.
> Собран Борей (BA) 2026-06-22 из ВСЕХ разрозненных источников репо (признание сбоя: questioner уже был в репо кусками, не сведён). Это единый эталон — больше не пересобирать по памяти.
> Правила вывода: факт = дословная цитата + координата; гипотеза помечена; форма (компонент) — к дизайнеру.

## Источники (что откуда взято)

| Код | Файл | Что даёт |
|---|---|---|
| **S1** | `docs/BNQ — Business Nature Questionnaire.md` | структура: Block1 (Q1–5 риск) / Block2 (Q6–10 доп.); 8 атрибутов риск-скоринга; per-signatory логика |
| **S2** | `docs/BNQ Template A — Sole Proprietorship.md` | образец полного потока вопросов Q1–Q11 (формулировки, answer options, Risk Score, Next) — для ИП, но структура общая |
| **S3** | `docs/_исходники/2026-06-09_BRD/5-Risk-Categorization-Business-Nature-Questionnaire.md` | BRD-первоисточник: матрица весов, Risk Score Range, **Templates A/B/C** (B и C явно содержат **Credit Exposure CC/OD** + **Economic Profile per signatory**) |
| **S4** | `docs/_исходники/2026-06-22_демо/_business-questioner-кредитный-блок.md` (IMG_7122) | новое фото 22.06: блок CC/OD existing exposure (>10cr/<10cr/No) → account type; план кредита; сумма |
| **S5** | `docs/_исходники/2026-06-11_Марго-юзкейсы.md` (IMG_6964–6967) | Company flow «BNQ **including BR questions**»; ИП с exposure>10cr → оффер другого типа счёта (CRILC fail) |
| **S6** | `docs/_исходники/фото-confluence/расшифровка/IMG_6834.md` + `IMG_6835.md` | атрибуты STP: Business Industry/Segment, **Residency of Authorised Signatories (FATCA)**, PEP — все в Business Nature Questionnaire; AS Email/Phone/Governance — в BR |
| **S7** | `docs/_исходники/2026-06-09_BRD/export.md` | холистика BRD: пороги CRILC 10 Cr (стр.1144–1164), account class 4000 Current / E Collection |
| **КОД** | `app/src/mock/v2/companySeed.ts` (`bnq[]`) + `app/src/ui/v2/bnq/BnqDialog.tsx` | что реально реализовано на 22.06 |

---

## TL;DR

- Эталон questioner Компании = **Template C**. Он **= Template B**, а B по BRD (S3, export.md:1315) **явно содержит два вопроса, которых у нас НЕТ в коде**:
  1. 🔴 **Credit Exposure (CC/OD availed: >10cr / <10cr / no)** → определяет доступный тип счёта. Подтверждён вторым источником S4 (фото 22.06) и третьим S5 (ИП-флоу с оффером другого счёта при >10 Cr).
  2. 🟡 **Economic Profile** на каждого подписанта (Employee/Director/Company Secretary/AS/UBO → 1; Student/Minor → 2; Other → 3) — в коде нет.
- Наше объединение **Q7+Q8 (план кредита + сумма)** с эталоном **НЕ конфликтует**: в S4 это отдельные строки таблицы, но обе с риск-меткой «Just to know» и атрибут BRD один — «Product Interest». CC/OD — это ДРУГОЙ вопрос (существующая задолженность, не план), его нельзя путать с Q7/Q8.
- Код Компании реиспользует движок ИП (`BnqDialog`) с тем же массивом Q1–Q11. Company-специфика (BR-вопросы, per-signatory Residency/PEP/Economic Profile) в опросник НЕ заведена — собирается на других экранах или отсутствует.

---

## Часть 1. Полный эталонный список вопросов questioner Компании (по источникам)

Формат строк-таблиц BRD: `DATA NOT AVAILABLE → Ask | Answer Option | Risk Score | Next`. Risk Score (1–3) — внутренний, **клиенту не показываем** (S1, Р-2).

### Block 1 — Risk Categorization (влияет на риск-скор)

#### Q1 · Business Industry / Segment
- Формулировка (DATA AVAILABLE): *«We have identified your primary business segments as ___. Is that so?»* / (NOT AVAILABLE): *«What industry is your business in?»* → *«Now please indicate the segment»*. (S2:24–26)
- Options → Risk: группа Low (Manufacturing, Banking, Govt…) = **1**; Medium (Trading, Consulting, ITES…) = **2**; High (Tobacco, Casino, Arms, NBFC, Gems&Jewellery, Other…) = **3**. (S2:29–31, S3:52)
- Next: Q2. REQUEST: для отдельных индустрий — загрузить **Business Licence**. (S2:32)
- Координата: S2 §Q1; S3 Risk Weight Matrix #2; S6 (IMG_6834 строка 4 «Business Industry/Segment → BNQ»).

#### Q2 · Company Vintage (дата регистрации)
- (NOT AVAILABLE): *«What is the date of incorporation?»*. (S2:37)
- Options → Risk: `< 6 мес` = **3**; `6 мес–1 год` = **2**; `> 1 год` = **1**. Next: Q3. (S2:41–43, S3:53)
- Координата: S2 §Q2; S3 #3.

#### Q3 · Company Residency
- (NOT AVAILABLE): *«Please confirm the residency status for your company»*. (S2:48)
- Options → Risk: `Indian resident` = **1**; `Foreign resident outside India` = **3** (→ alert DVU/FEMA). Next: Q4. (S2:52–53, S3:44,54)
- Координата: S2 §Q3; S3.

#### Q4 · Tax / Individual Residency
- *«Please confirm your tax residency.»* (S2:57)
- Options → Risk: `Indian National / Foreign national on employment VISA` = **1**; `NRI / OCI / Foreign national of RF not on employment VISA` = **2**; `Foreign national other` = **3**. Next: Q5. (S2:61–63, S3:54)
- ⚠️ **Company-специфика (S1, S6):** этот атрибут = **Residency Status of Authorised Signatories** и собирается **на КАЖДОГО подписанта** (Individual Residency, по списку Board Resolution), помечен **FATCA** (S6 IMG_6834 строка 5). У ИП — один человек, поэтому один ответ. Score 3 → Compliance + **Trigger for FATCA** (S3:45).
- Координата: S2 §Q4; S1:28,39; S6 IMG_6834:29.

#### Q5 · PEP (Politically Exposed Person)
- *«Do you or your close relatives hold or have held in the past 5 years public positions (government officials, judges, military executives)?»* (S2:67)
- Options → Risk: `Yes` = **3** (→ **Alert DVU-Compliance, Name Screening**); `No` = **1**. Next: Q6. (S2:71–72, S3:54)
- ⚠️ **Company-специфика:** на каждого подписанта (S1:29,40).
- Координата: S2 §Q5; S1; S6 IMG_6834:30.

#### Q-EconProfile · Economic Profile (🟡 ТОЛЬКО Company/Partnership — в Template A/ИП нет)
- Атрибут #8 риск-скоринга (S1:31, S3:22). На каждого подписанта без designation из Probe42 (добавленного вручную) authorized user указывает Economic Profile.
- Options → Risk (Template C): `Employee / Director / Company Secretary / Authorised Signatory / UBO` = **1**; `Student / Minor` = **2**; `Other` = **3**. (S3:60 — Template C)
- Координата: S3 BNQ Templates §C (export.md:1316); S1:42.
- **[?] Гипотеза по форме:** где собирать — в BNQ или на экране BR-вопросов (per-signatory)? S5 говорит «BNQ **including BR questions**». → вопрос к Марго ниже.

### Block 2 — Additional Questions (НЕ влияет на риск-скор, кроме помеченного)

#### Q6 · Net Revenue
- (NOT AVAILABLE): *«What is your Net Revenue for the Last Year?»* → ввод в крорах. (S2:81)
- ⚠️ В BRD-формуле net_revenue ИМЕЕТ вес (1/2/3) (S3:25,36) — формально это Block-1-атрибут по скорингу, хотя S1 относит к Block 2. Расхождение источников, см. ниже.
- Координата: S2 §Q6; S3:21.

#### Q-CC/OD · Credit Exposure — СУЩЕСТВУЮЩАЯ задолженность (🔴 В КОДЕ НЕТ)
- *«Have you availed CC/OD facilities from the banking system?»* (CC/OD = Cash Credit / Overdraft) (S4:5)
- Options → (Risk col = «To understand available account type») → Next Q7:
  | Answer Option | Назначение |
  |---|---|
  | Yes, aggregate total exposure **> 10 crore** | определить тип счёта (порог 10 Cr) |
  | Yes, aggregate total exposure **< 10 crore** | определить тип счёта |
  | No | определить тип счёта |
- Цель: по совокупной задолженности + CRILC-проверке → **Current Account (4000)** vs **Collection Account (E)** (S7 export.md:1144–1164: <10 Cr → Current; ≥10 Cr и Sber-доля <10% и нет NOC → Collection).
- Последствие в UX (S5 IMG_6967): при exposure > 10 Cr клиенту показывается оффер: *«Dear Customer due to your total exposure more than 10 Crore INR we are glad to offer you another type of account…»* → Proceed.
- Координата: **S4 §Вопрос A** (фото IMG_7122, 22.06); S3:59 (Template B «Credit Exposure CC/OD availed: >10cr/<10cr/no — to understand available account type»); S7.
- ⚠️ Это **существующая задолженность**, НЕ план кредита (Q7). Разные вопросы — не объединять.

#### Q7 · Product Interest — план кредита
- *«Do you plan to avail any credit facilities (term loans, letters of credit, bank guarantees) from our bank in the next 6 months?»* (S2:85, S4:17)
- Options → (Risk «Just to know»): `Yes` → **Alert to CRM** (фон, клиенту не показываем); `No`. Next: Q8/сумма. (S4:21–22)
- Координата: S2 §Q7; S4 §Вопрос B.

#### Q8 · Product Interest — сумма кредита
- *«What is the approximate credit amount you would require?»* → ввод суммы вручную. (S2:90, S4:25)
- Координата: S2 §Q8; S4 §Вопрос C.
- В нашем коде Q7+Q8 объединены (см. DIFF). Атрибут BRD один — «Product Interest».

#### Q9 · Import / Export Activity
- (AVAILABLE): *«We have noticed that your company deals in Import/Export Activities, is that so?»* / (NOT AVAILABLE): *«Do you deal in Import or Export Activities?»* (S2:95–96)
- Options → Next: `export only` / `import only` / `both` → Q10; `No` → конец (пропуск ВЭД-блока). (S2:98–103)
- Координата: S2 §Q9.

#### Q10 · Import / Export — страны-партнёры
- *«What countries are your import/export partners from? (select all that apply)»* (S2:107)
- Координата: S2 §Q10.

#### Q11 · Import / Export — IEC документ (disclaimer)
- Дисклеймер FEMA + опции **Upload Now** (→ KYC records + Trigger DVU) / **Upload Later** (→ Trigger Online Bank после открытия счёта). (S2:111–116)
- Координата: S2 §Q11.

---

## Часть 2. DIFF-таблица — эталон ↔ наш код (companySeed.ts `bnq[]` + BnqDialog.tsx)

| Эталонный вопрос | В коде? | Статус | Комментарий / координата |
|---|---|---|---|
| **Q1** Business Industry/Segment | ✅ Q1 (block 1, source available, «Trading») | OK | совпадает |
| **Q2** Company Vintage / дата | ⚠️ **убран из bnq** | Осознанное отступление | дата подтянута из PAN и подтверждается на «Данные компании из PAN» (`company.incorporationDate`). Значение не теряется. (seed:140–142) — **фиксируем как отступление**, не баг |
| **Q3** Company Residency | ✅ Q3 | OK | совпадает |
| **Q4** Tax/Individual Residency | ✅ Q4 («Indian National») | ⚠️ частично | в коде — ОДИН ответ на компанию. Эталон Company = **per-signatory** + метка **FATCA**. Для happy-flow (все резиденты) ОК; per-person логика не заведена |
| **Q5** PEP | ✅ Q5 | ⚠️ частично | то же: per-signatory в эталоне, в коде один ответ |
| **Economic Profile** (per signatory) | 🔴 **НЕТ** | **Расходится — добавить?** | Template C атрибут #8 риск-скоринга (S3:60). В коде отсутствует. **[?]** где собирать (BNQ vs BR-вопросы) — к Марго |
| **Q6** Net Revenue | ✅ Q6 (block 2) | ⚠️ метка блока | в коде block 2, но BRD-формула даёт net_revenue вес → конфликт классификации блоков (см. ниже) |
| **Credit Exposure CC/OD** (>10cr/<10cr/No) | 🔴 **НЕТ** | **🔴 ДОБАВИТЬ (точно)** | существующая задолженность → тип счёта. Подтверждён 3 источниками (S3 Template B, S4 фото 22.06, S5 оффер при >10 Cr). Это НЕ Q7 |
| **Q7** Product Interest — план кредита | ✅ Q7 (triggered: 'CRM') | OK | Alert-to-CRM есть в модели (seed:147), фоном — корректно |
| **Q8** Product Interest — сумма | ✅ Q8 (объединён в Q7 инлайн) | OK, не конфликт | объединение оправдано: один атрибут BRD «Product Interest», обе строки «Just to know». golden record Q8 сохраняется (BnqDialog:428–451). **Эталон S4 рисует их отдельными строками — но это не противоречие логике, только форме** |
| **Q9** Import/Export Activity | ✅ Q9 | OK | ветвление No→скип Q10/Q11 реализовано (buildStepOrder) |
| **Q10** Партнёры-страны | ✅ Q10 | OK | |
| **Q11** IEC disclaimer | ✅ Q11 (triggered: 'DVU') | OK | Upload Now/Later есть |

### Что НАДО сделать

1. 🔴 **ДОБАВИТЬ вопрос Credit Exposure (CC/OD)** — существующая задолженность. Позиция: Block 2, **перед Q7** (план кредита) — логически «сначала что есть, потом что планируете». Options: `>10 cr` / `<10 cr` / `No`. Влияние: определяет тип счёта (Current/Collection), не риск-скор. При `>10 cr` — UX-оффер другого типа счёта (S5). Это самостоятельный шаг (НЕ объединять с Q7/Q8).
2. 🟡 **Решить по Economic Profile** (per-signatory) — добавить в опросник ИЛИ подтвердить, что собирается на экране BR-вопросов. Сейчас нигде в `bnq[]` нет.
3. 🟡 **Per-signatory для Q4 (Residency+FATCA) и Q5 (PEP)** — эталон Company собирает на каждого подписанта; в коде один ответ. Для целевого вижна Компании — пометить как разрыв (happy-flow проходит, но логика упрощена).
4. ✅ **Объединение Q7+Q8 НЕ трогать** — конфликта с эталоном нет (один атрибут «Product Interest»).
5. ❌ **Q2 (дата) НЕ возвращать в опросник** — осознанное отступление, дата на экране PAN.

---

## Часть 3. Противоречия источников и вопросы к Марго

| # | Противоречие / пробел | Где | Вопрос к Марго (дословно) |
|---|---|---|---|
| 1 | **CC/OD — это ВЕСЬ кредитный блок или есть продолжение?** Денис прислал фрагмент (IMG_7122). | S4:39 | «Блок CC/OD + план + сумма — это весь кредитный блок questioner, или есть ещё группы вопросов?» |
| 2 | **Net Revenue — Block 1 или Block 2?** S1 относит к Block 2 (не влияет на скор), но BRD-формула (S3:25,36) даёт net_revenue ВЕС в Risk Score. | S1:16 vs S3:25 | «Net Revenue влияет на финальный риск-скор (входит в формулу) или это just-to-know из Block 2?» |
| 3 | **Economic Profile — в BNQ или в BR-вопросах?** S5 говорит «BNQ including BR questions». | S3:60 vs S5:53 | «Economic Profile подписантов собираем внутри опросника BNQ или на форме BR-вопросов (per signatory)?» |
| 4 | **Q4/Q5 per-signatory** — как показывать клиенту, который заполняет за всех? Повтор вопроса на каждого подписанта? | S1:28–29 | «Residency (FATCA) и PEP — задаём заполнителю по каждому подписанту отдельно, или подписант отвечает сам на своём шаге?» |
| 5 | **Risk Score Range полная таблица** и «Table XXX» (Economic Profile options по типу компании) — фото обрезаны/нет. | S1:56,66 | «Нужна полная таблица Risk Score Range и таблица Economic Profile options для Company.» |
| 6 | **Нерасшифрованных фото таблицы questioner НЕ найдено.** IMG_6834/6835 — это атрибуты STP (не сам questioner), IMG_6838 (High Risk Industries) и IMG_7122 (CC/OD) расшифрованы. | — | (пробелов по фото нет; questioner-таблицы Template C целиком как фото в репо нет — есть только текст export.md:1316) |

---

## Приложение. Порядок шагов в коде (факт, BnqDialog.tsx)

`Q1 → Q3 → Q4 → Q5 → Q6 → Q7(+Q8 инлайн) → Q9 → [Q10 → Q11]` (Q2 исключён всегда; Q8 всегда инлайн; Q10/Q11 скип при Q9=No). Лид-шаг (PAN) — опциональный нулевой экран в той же карточке. Источник: `buildStepOrder` (BnqDialog.tsx:441–451).
