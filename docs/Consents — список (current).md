# Consents & Declarations — текущий список (AS-IS)

> Источник: Confluence `ICBSBASE / 7.6.2. — The 1DAY INICIATIVE / 9. Consents Dashboard` (Security Level K3, ~88 views). Снято фото 2026-06-08.
> Раздел: **«The list of current consents & declarations taken from customers during online onboarding process»**.
> Применение: тексты согласий для экранов прототипа. Связано: [[Разбор встречи — Марго 2026-06-08]] · [[Карта экранов]] · [[Вопросы и расхождения]] (Р-6, В-1).
> ⚠️ Это AS-IS список. Отдельно в Confluence есть таблица **«consents to be taken for the fully-automated onboarding»** (TO-BE) — её фото пока нет (см. В-1).

## Карта файла
- [Сводка: какие consents и где](#сводка)
- [Полная таблица](#полная-таблица)
- [Привязка к экранам прототипа](#привязка-к-экранам-прототипа)

## Сводка

| № | Consent | Шаг онбординга | Обязат. | Где показывается |
|---|---|---|---|---|
| 1 | **Cookie Consent** (+ ссылка на Privacy Notice для Website Users) | Finish registration / Authorization form | N | каждую сессию, пока не принят |
| 2a | **Terms & Conditions** | при входе в authorization form | N | authorization form |
| 2b | **Terms & Conditions** (укороченный) | при входе в authorization form | **Y (для MVP)** | authorization form |
| 3 | **Privacy Notice for Clients** | при входе в authorization form | **Y** | authorization form |
| 4 | **Confirmation — данные по всем KMP** | Customer Application Form | **Y** | при переходе к задаче «Key Managerial Personnel Details» |
| 5 | **Data Principals Privacy** | Customer Application Form | **Y** | сбор данных authorized signers |
| 6 | **Aadhaar Consent** | Customer Application Form | **Y** | сбор данных authorized signers |
| 7 | **Confirmation of correctness of data** | Review (финал) | **Y** | когда все документы приложены |

**Для MVP обязательны (Y):** 2b, 3, 4, 5, 6, 7. Cookie (1) — N. T&C полный (2a) — N (заменён на 2b для MVP).

## Полная таблица

### 1 · Cookie Consent with the link to the Privacy Notice for Website Users
- **Onboarding step:** Finish registration / Authorization form
- **Mandatory:** N
- **Display logic:** Every session, until user accepts it
- **Text:** *Sberbank Branch in India uses cookies (files with data about previous visits to the site) for personalization of services and convenience of users. Sberbank Branch in India is committed to protect personal data. Please read the terms and principles of data processing. You can prevent cookies from being stored in your browser settings.*
- **Description:** Prospect customer acknowledges he/she has read the proposed terms and principles. Части «uses cookies» и «read the terms and principles of data processing» — гиперссылки на детальное описание использования cookies и политик обработки данных.
- **Condition:** Сообщение показывается при первом и последующих входах в authorization form, если prospect ещё не подтвердил ознакомление. При подтверждении фиксируется дата-время (IST `YYYY-MM-DDThh:mm:ss`).

### 2a · Terms & Conditions
- **Mandatory:** N
- **Display logic:** When entering the authorization form
- **Text:** *I hereby authorize Sberbank Branch in India to verify my details digitally or otherwise in any manner that Sberbank Branch in India may deem fit and further confirm and acknowledge that I have read and agree to Terms & Conditions.*
- **Description:** Публикуется на странице authorization form. Для успешной авторизации prospect должен подтвердить, что прочитал и согласен с T&C. «Terms & Conditions» — гиперссылка на детальное описание.
- **Condition:** Без согласия невозможно продолжить авторизацию. При подтверждении фиксируется дата-время (IST).

### 2b · Terms & Conditions (вариант для MVP)
- **Mandatory:** **Y (for MVP)**
- **Text:** *I hereby authorize Sberbank Branch in India to verify my details digitally or otherwise in any manner that Sberbank Branch in India may deem fit.*
- **Description:** Публикуется на странице authorization form. Для успешной авторизации prospect подтверждает согласие с условием.
- **Condition:** Без согласия невозможно продолжить. Фиксируется дата-время (IST).

### 3 · Privacy Notice for Clients
- **Mandatory:** **Y**
- **Display logic:** When entering the authorization form
- **Text:** *I acknowledge I have read Privacy Notice and hereby provide explicit consent to process my personal data for the purpose of representing my company in a client relationship with the Sberbank Branch in India and in accordance with the terms set out in the aforementioned documents.*
- **Description:** Публикуется на authorization form. «Privacy Notice» — гиперссылка: `https://sberbank.co.in/customer-information/privacy-notice#appendix_iv` (открывать в новом окне).
- **Condition:** Без согласия невозможно продолжить. Фиксируется дата-время (IST).

### 4 · Confirmation of entering information for all managerial personnel
- **Onboarding step:** Customer Application Form
- **Mandatory:** **Y**
- **Display logic:** When a customer representative has proceeded to the «Key Managerial Personnel Details» task
- **Text:** *I confirm that will provide information for all Key Managerial Personnel in the entity.*
- **Description:** Публикуется в секции Customer Application Form, собирающей данные authorized signers. Чтобы отправить данные, prospect должен подтвердить выполнение условий.
- **Condition:** Без согласия невозможно отправить данные authorized signatories и перейти к следующему этапу заполнения. Фиксируется дата-время (IST).

### 5 · Data Principals Privacy
- **Mandatory:** **Y**
- **Text:** *I hereby acknowledge and confirm that in case I have provided personal data of other Data Principals, I guarantee that such Data Principals are notified about Sberbank Branch in India processing of their personal data as described in the Privacy Notice and I obtained their explicit consent for such processing and shall keep Sberbank Branch in India indemnified and hold harmless against any loss, damage, liabilities, obligations caused to the Sberbank Branch in India.*
- **Description:** «Privacy Notice» — гиперссылка: `https://sberbank.co.in/customer-information/privacy-notice#appendix_iv` (новое окно).
- **Condition:** Без согласия невозможно отправить данные authorized signatories и продолжить. Фиксируется дата-время (IST).

### 6 · Aadhaar Consent
- **Mandatory:** **Y**
- **Text:** *I hereby acknowledge and confirm that I have been provided various options by Sberbank Branch in India for establishing my identity for the purposes as described in the Privacy Notice and I voluntarily submit my Aadhaar details to the Sberbank Branch in India. In case I have provided Aadhaar details of other Data Principals, I guarantee that such Data Principals are notified about Sberbank Branch in India processing of their Aadhaar details as described in the Privacy Notice and I obtained their explicit Aadhaar Consent for such processing. I have read and understood the Aadhaar Consent and terms governing this application form/request and hereby accept the same.*
- **Description:** «Privacy Notice» — гиперссылка `https://sberbank.co.in/customer-information/privacy-notice#appendix_iv`. «Aadhaar Consent» — гиперссылка `https://5nb7t2h5gd.a.trbcdn.net/bcp-laika-public/c7335168-759a-42a7-8fd6-3f9e5d5f7a4a/original`. Обе — в новом окне.
- **Condition:** Без согласия невозможно отправить данные authorized signatories и продолжить. Фиксируется дата-время (IST).

### 7 · Confirmation of the correctness of the data
- **Onboarding step:** Review (финальный шаг)
- **Mandatory:** **Y**
- **Display logic:** When all the necessary documents have been attached
- **Text:** *I have reviewed and verified the details and documents entered by me in the electronic Customer Application Form. I further confirm that the information/documents so uploaded or entered by me to be true, correct, complete and up to date in all aspects and I have not withheld any information and nothing material has been concealed therefrom.*
- **Description:** Публикуется в секции Customer's Application Form на финальном шаге (Review).
- **Condition:** Без согласия невозможно отправить приложенные документы и перейти к следующему этапу. Фиксируется дата-время (IST).

## Привязка к экранам прототипа

> Черновик маппинга — уточнить с Денисом. Связано с расхождением [[Вопросы и расхождения]] Р-6 (consents — отдельные экраны vs чекбоксы).

| Consent | Где в прототипе (предв.) | Экран |
|---|---|---|
| 1 Cookie | баннер на лендинге/форме регистрации | CL-01 / CL-02 |
| 2b T&C (MVP) + 3 Privacy Notice | блок чекбоксов на форме авторизации/регистрации | CL-02 |
| 4 KMP confirmation | при входе в задачу «Key Managerial Personnel» | CL-03 (секция директоров) |
| 5 Data Principals + 6 Aadhaar | при сборе данных authorized signers | CL-03 / перед VCIP |
| 7 Correctness | финальный Review | CL-08 |

⚠️ Соотнести с тем, что Марго описывала как **два consent-экрана** (до PAN — доступ к реестрам; перед VCIP — privacy + достоверность). В этой AS-IS таблице явного «consent на доступ к индийским реестрам до PAN» нет — возможно, он в TO-BE таблице (нужно фото) или покрывается T&C (2b) «verify my details digitally». → вопрос В-1/обсудить.
