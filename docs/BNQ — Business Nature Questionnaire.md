# Business Nature Questionnaire (BNQ) — структура и риск-скоринг

> Источник: Confluence `confluence.sberbank.ru/pages/viewpage.action?pageId=2257142...` (раздел «Structure of Business Nature Questionnaire»). Снято фото 2026-06-08.
> Применение: структура опросника BNQ + логика авто-риск-скоринга. Нужно для переработки CL-04 (расхождение [[Вопросы и расхождения]] Р-4: per-person logic).
> Связано: [[Разбор встречи — Марго 2026-06-08]] · [[Карта экранов]] · [[Mock-модель данных]].

## Карта файла
- [Два блока вопросов](#два-блока-вопросов)
- [Атрибуты (таблица)](#атрибуты--источники)
- [Логика риск-скоринга](#логика-риск-скоринга)
- [Выводы для прототипа](#выводы-для-прототипа)

## Два блока вопросов

- **Block 1 — Questions for Risk Categorization (Q1–5):** ответы используются для авто-риск-скоринга.
- **Block 2 — Additional Questions (Q6–10):** собирают инфу о продуктах, которые интересны клиенту, и import/export-активности. **НЕ влияют на финальный риск-скор**, служат для сбора доп. информации о клиенте.

## Атрибуты и источники

Логика источников: где можно — **автозаполнение из Probe42**, иначе клиент отвечает в BNQ (Alternative Source).

| # | Attribute | Source (приоритет) | Alternative Source | Stage | Уровень |
|---|---|---|---|---|---|
| 1 | **Constitution** | Screening by PAN | — | Autoscreening by PAN | компания |
| 2 | **Business Segment** | Probe42 → user confirms | выбор в BNQ | BNQ | компания |
| 3 | **Company Vintage** | Probe42 (дата регистрации) | ввод даты в BNQ | BNQ | компания |
| 4 | **Company Residency** | Probe42 (Registered address) | выбор в BNQ | BNQ | компания |
| 5 | **Individual Residency** | Board Resolution + BNQ | выбор в BNQ | Board Resolution + BNQ | **на каждого подписанта** |
| 6 | **PEP Status** | BNQ | выбор в BNQ | BNQ | **на каждого подписанта** |
| 7 | **Net Revenue** | Probe42 | выбор объёма в BNQ | BNQ | компания |
| 8 | **Economic profile** | Digital Board Resolution (по Probe42) или Customer's Board Resolution | — | Board Resolution | на каждого подписанта |

### Детали по атрибутам

1. **Constitution** — при старте онбординга система по PAN делает auto-screening по реестрам (Probe42), определяет тип конституции / legal entity type, присваивает Risk Weight по типу. На основе конституции определяется, **какой вариант BNQ заполнять (A / B / C)**.
2. **Business Segment** — тянем из Probe42, клиент подтверждает. Если сегмент определён неверно — выбор из дропдауна. Если данных в Probe42 нет — выбор из дропдауна; для некоторых индустрий клиент должен загрузить **Business License**.
3. **Company Vintage** — дата инкорпорации из Probe42 → считаем vintage (число месяцев с регистрации) → Risk Weight. Нет данных — клиент вводит дату регистрации в BNQ.
4. **Company Residency** — Probe42 не даёт спец-атрибут резидентности, но есть registered address → определяем, индийский резидент или нет. Иначе — вопрос в BNQ.
5. **Individual Residency** — Probe42 **не даёт** residency подписантов (directors, UBOs, authorised signatories). До завершения BNQ authorised user отправляет **Board Resolution** со списком подписантов, проходящих KYC. По списку указывается residential status **для каждого подписанта** в соответствующем вопросе BNQ.
6. **PEP Status** — Probe42 **не даёт** PEP-статус подписантов. Вопрос в BNQ: являются ли подписанты или их близкие родственники политически значимыми лицами (PEP). **На каждого подписанта.**
7. **Net Revenue** — Net Revenue за последние 3 года доступен в Probe42. Есть — подтягиваем, присваиваем risk weight. Нет — клиент выбирает объём Net Revenue из дропдауна.
8. **Economic profile** — на этапе Board Resolution authorized user проверяет pre-filled список подписантов из Probe42, при необходимости проходит KYC, может редактировать список (добавить/удалить подписантов). Для подписантов без designation в Probe42 — добавляются вручную, и authorized user указывает их Economic Profile в BNQ. Доступные опции зависят от типа компании (см. Table XXX в Confluence — фото нет).

## Логика риск-скоринга

**Risk Score Calculation:**
```
kyc_constitution + kyc_bus_segment + w_vintage (date of incorporation)
+ w_company_residency (new) + kyc_nationality + kyc_exposed_person
+ kyc_econ_profile + net_revenue
```
- **8 переменных**, каждая даёт балл.
- **Minimal Score (все = 1) = 8**
- **Maximum Score (все = 3) = 24**

(Полная таблица Risk Score Range — Variable / Source / Risk Score Range — на фото обрезана, нужно отдельно.)

## Выводы для прототипа

- ✅ **Подтверждает Р-4 (per-person):** Individual Residency, PEP Status, Economic Profile — собираются **на каждого подписанта** из списка Board Resolution, не на компанию. Company-level: Constitution, Business Segment, Vintage, Company Residency, Net Revenue.
- ✅ **Подтверждает порядок Р-1:** сначала определяются подписанты (Board Resolution / выбор директоров), потом per-person вопросы BNQ про них.
- ✅ **Подтверждает Р-2 (риск не показываем):** Risk Weight / Risk Score — внутренняя логика банка, в опроснике клиент видит только вопросы, не баллы.
- 🔁 **Паттерн «Probe42 → подтверди / иначе введи»** — ключевой UX BNQ: поля предзаполнены, клиент подтверждает или правит/вводит вручную.
- ❓ **FATCA** в этой таблице **не фигурирует** (есть PEP, residency, но не FATCA). В разборе встречи он упоминался — уточнить, где FATCA собирается (возможно Block 2 / отдельный шаг). → новый вопрос В-8.
- ❓ Вариативность BNQ **A / B / C** по типу конституции — для прототипа берём один тип юрлица (Private Limited) → один вариант BNQ.
- ❓ «Table XXX» (Economic Profile options по типу компании) и полная таблица Risk Score Range — фото нет.
