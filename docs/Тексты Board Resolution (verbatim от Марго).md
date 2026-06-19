# Тексты Board Resolution — verbatim для UI

Источник: страница Confluence «Standardized Board Resolution» (pageId=24092214747), фото IMG_7064–IMG_7068.
Расшифровки: `docs/_исходники/фото-confluence/расшифровка/IMG_70XX.md`.

Все блоки ниже — дословно из источника, без сокращений. Готовы к подстановке вместо плейсхолдеров.
В источнике банк назван «Sber Bank» — при вставке в прототип применять де-брендинг (Сбер → Банк) согласно решению проекта.

---

## 1. Полномочия BR — интро-глосса BR-экрана

> source: IMG_7065 (+ хвост на IMG_7067)

Шапка формы:

> **Board Resolution [LegalType] [NameOfCompany]**

Текст резолюции (RESOLVED THAT / RESOLVED FURTHER THAT):

> RESOLVED THAT the Company [ auto-populated ] be and is hereby authorized to establish and maintain banking relationships with Sber Bank and to avail such banking products, services, facilities, and arrangements as may be required from time to time.

> RESOLVED FURTHER THAT the Authorized Official(s) mentioned below be and are hereby nominated and authorized to act for and on behalf of the Company in relation to such banking products and services and, where permitted under this Resolution, to nominate additional authorized signatories.

> The Authorized Official(s) shall, within the scope of the authority granted herein, be entitled to apply for, access, avail, operate, and utilize the banking products and services offered by Sber Bank, including but not limited to Internet Banking, FEMA-related services, deposits, loans and credit facilities, bill purchase and discounting facilities, letters of credit, bank guarantees, trade finance services, and any other banking products, services, or facilities offered by the Bank from time to time, in accordance with the applicable terms and conditions of Sber Bank. https://sberbank.co.in/.

Дополнительные строки RESOLVED FURTHER THAT (source: IMG_7067):

> RESOLVED FURTHER THAT the Bank is authorized to honor all cheques, digital instructions, e-sign mandates, and electronic transactions executed by the authorised signatories.

> RESOLVED FURTHER THAT this resolution shall remain in force until a revised resolution is submitted to the Bank.

---

## 2. Governance dropdown

> source: IMG_7066 (опции продублированы в переписке IMG_7064)

Две опции дропдропа (выбор подставляется в текст резолюции на месте «(option selected from dropdown)»):

1. **Nominated Authorized Official of the Company**
2. **Decision Pursuant based on Board Resolution**

Полный текст колонки «Governance for Authorised Signatory changes» (дословно):

> "RESOLVED THAT the Board hereby authorises that any addition, modification , or removal of Authorized Officials / Signatories for operating the Company's bank account(s) shall be effected solely in accordance with ( option selected from dropdown) 1) Nominated Authorized Official of the Company 2) Decision Pursuant based on Board Resolution and the Bank is hereby authorized to act upon and give effect to such changes when submitted through permitted online Internet banking or offline channels, which shall be valid and binding on the Company."

(в источнике «( option selected from dropdown)», «1) Nominated Authorized Official of the Company», «2) Decision Pursuant based on Board Resolution» выделены синим = вариативная часть)

---

## 3. Структура таблицы AS / подписантов

> source: IMG_7065 (шапка) + IMG_7066 (ячейки)

Колонки: **Name | Designation | PAN | Contacts for OTPs and VCIP session | Governance for Authorised Signatory changes**

| Поле | Поведение (дословные пометки источника) |
|---|---|
| Name | «Dropdown from the list of directors taken from Probe42.» + «Additional option/filed to add Another Person» (autopopulated from Probe42; есть «add Another Person») |
| Designation | «Autopopulated from Probe42» |
| PAN | (пометок нет; ячейка пустая) |
| Contacts for OTPs and VCIP session | «Email ID … Manual Input», «Phone number … Manual Input» (ручной ввод) |
| Governance for Authorised Signatory changes | текст из раздела 2 + дропдаун из 2 опций |

Заметки: «Dropdown from list of directors», «add Another Person».

---

## 4. Declaration + сертификация + e-sign

> source: IMG_7067 / IMG_7068

Раздел: **Details and Declaration of Directors, UBO's and Authorised Signatories**

Колонки таблицы деклараций: **Name of Director /CEO/MD/Company Secretary: | Contacts for OTPs and VCIP session | Signature**

Пометки по ячейкам (дословно):
- Name: «Full Name» + «Populate from Probe – then display, otherwise the manual input»
- Contacts: «Phone Number … Auto», «Email ID …», обе — «Populate from Probe – then display, otherwise the manual input»
- Signature: «Manual – if print the BR» / «or» / «Auto populated by Esign (eMudhra DSC)»
- «[ + ]» — добавить ещё одну строку (подписанта)

Сертификационный текст (чекбокс, source: IMG_7068):

> I/We hereby certify that the above is a true and correct copy of the resolution duly passed by the Board of Directors of the Company and recorded in the minutes book, and confirm that all information/data provided is true and correct, and that the Company agrees to be bound by the Terms and Conditions applicable to the Account and to any product or service offered by the Bank, as mentioned in the application forms or published on the Bank's website (link to T&C).

Печать (source: IMG_7068):

> Company's DCS seal
