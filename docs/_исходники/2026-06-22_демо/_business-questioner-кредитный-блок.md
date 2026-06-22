# Business Questioner — кредитный блок (фрагмент, демо 22.06)

> Источник: IMG_7122.jpeg — официальная таблица логики опросника из BRD/Confluence, прислал Денис 22.06 («группировка по вопросам которую обсуждали»; вверху пометка «Это самый существенный элемент логики!!!»). Формат таблицы: DATA NOT AVAILABLE → Ask the question | Answer Option | Risk Score | Next Question. Сценарий — Компания.

## Вопрос A — существующая кредитная задолженность (CC/OD)
**«Have you availed CC/OD facilities from the banking system?»** (CC/OD = Cash Credit / Overdraft)

| Answer Option | Risk Score | Next Question |
|---|---|---|
| Yes, my aggregate total exposure is more than 10 crore | To understand available account type | Q7 |
| Yes, my aggregate total exposure is less than 10 crore | To understand available account type | Q7 |
| No | To understand available account type | Q7 |

→ Цель: **определить доступный тип счёта** (account type) по совокупной задолженности; порог **10 crore**.

## Вопрос B — планы по кредиту
**«Do you plan to avail any credit facilities (term loans, letters of credit, bank guarantees) from our bank in the next 6 months?»**

| Answer Option | Risk Score | Next Question |
|---|---|---|
| Yes → **Alert to CRM** | Just to know | Q06 |
| No | Just to know | Q07 |

## Вопрос C — сумма кредита
**«What is the approximate credit amount you would require?»**

| Answer Option | Risk Score | Next Question |
|---|---|---|
| (Enter the amount manually) | Just to know | Q07 |

## Соотношение с нашим опросником (на 22.06)
| Вопрос таблицы | У нас сейчас | Расхождение |
|---|---|---|
| A. CC/OD existing exposure (>10cr / <10cr / No) → account type | **НЕТ такого вопроса** | 🔴 добавить — про СУЩЕСТВУЮЩУЮ задолженность, влияет на тип счёта (это и есть «total credit exposure» / «задолженность» из разбора демо) |
| B. План кредита (Yes→Alert CRM / No) | Q7 (план кредита) | ✅ есть; проверить Alert-to-CRM (фоновый, клиенту не показываем) |
| C. Сумма кредита (manual) | Q8 (объединён с Q7) | ✅ есть; в таблице — отдельный пункт, мы объединили (по другому атрибуту BRD «Product Interest» — сверить, не конфликт ли) |

## Открытое
- Это ВЕСЬ кредитный блок или есть продолжение questioner (другие группы вопросов)? Денис прислал фрагмент.
- Risk Score колонка: «To understand available account type» / «Just to know» — фоновая логика банка, клиенту не показываем.
