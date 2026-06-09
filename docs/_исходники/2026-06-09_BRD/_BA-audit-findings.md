---
title: BA-аудит BRD «1DAY Initiative» — противоречия, пробелы, открытые вопросы
date: 2026-06-09
source: единственный — docs/_исходники/2026-06-09_BRD/export.md (снимок Confluence 2026-06-09)
analyst: BA (холистический проход)
---

# BA-аудит исходника BRD «1DAY Initiative» (рынок Индия)

Каждый пункт привязан к конкретному разделу export.md. Формат ссылки: `[файл.md → Раздел]`. Разделы в export.md помечены `<!-- ==== файл.md ==== -->`. Где источник дедуплицирован/ужат — отмечено «нужен полный первоисточник».

---

## A. ПРОТИВОРЕЧИЯ между страницами

### A1. Блокировка после 5 неверных OTP — temporary vs permanent (ПОДТВЕРЖДЕНО)
- В SOP: «AS has 5 attempts to enter the Guest Zone, in case of 5 failed attempts the AS will be **temporary blocked**» — `[1.1-SOP-Corporate-Customer-Onboarding.md → Table A Process Flow]` (шаг 02).
- В Self-VKYC и в 2.3: «5 OTP attempts → **permanently blocked**» — `[2.1-Self-VKYC-Business-Process.md → Self VKYC of a New Customer]` и `[2.3-SOP-for-VKYC.md → Дельты этой версии]`.
- Целевое решение (но это не снимает противоречие в самих SOP): «5 attempts. Q2 goal: move to Internet bank approach with **temporary block**» — `[2.1-SOP-for-VKYC.md → Open Questions]`.
- Вывод: одна и та же механика (5 попыток) имеет в трёх местах разный исход (temporary / permanent / целевой temporary). Требует унификации.

### A2. Срок жизни ссылки в гостевую зону — 30 / 180 / X дней / бессрочно (ПОДТВЕРЖДЕНО, разброс шире чем «30 vs 180»)
- «Lifespan **30 days** from first dispatch; reusable; inactive on completion or 30-day expiry» — `[2.1-SOP-for-VKYC.md → Detailed Description (Stage 1) Para 1]` и `[2.1-SOP-for-VKYC.md → Scenario 1]`.
- «link lifespan **"X day"** (placeholder)» — `[2.1-Self-VKYC-Business-Process.md → Self VKYC of a New Customer]` (не заполнено).
- «What is the lifespan of the email link to enter the Guest Zone? — **180 days**. … Бессрочно, но стоит сходить в OBO за уточнением (Даниловский Дмитрий)» — `[2.1-SOP-for-VKYC.md → Open Questions]`. Тут же в одной ячейке три разных ответа: 180 дней / бессрочно / уточнить в OBO.
- Связанный срок: VKYC recording «valid for bank identification **180 days**», re-do at 90 days — `[2.1-Self-VKYC-Business-Process.md → Prerequisites (RBI) #11 Expiration]`; общий TAT онбординга «**180 days**, иначе lapsed» — `[1.1-SOP-Corporate-Customer-Onboarding.md → Responsibility Matrix → Onboarding Completion Timeline]`. Возможна путаница «срок жизни ссылки» vs «срок жизни записи VKYC» vs «общий TAT» — все три названы по-разному, требует разведения.
- Вывод: значения 30 / 180 / X / бессрочно сосуществуют. Требует решения, желательно с разведением трёх разных таймеров.

### A3. BGV — обязателен всегда vs можно заменить/исключить для low-risk (ПОДТВЕРЖДЕНО, неразрешённый спор между лицами)
- «Right now BGV mandatory for all new clients; suggest skipping for low-risk per 1D-3.1» — `[1-Customers-Onboarding-process.md → BGV Check]`.
- «BGV will be performed **after account is opened** under certain criteria … >2 года / 2+ fin reports / PSU / regulated FI / NSE-BSE listed → **BGV not required**» — `[3.1-Criteria-for-BGV-check.md → BGV Decision Matrix]` и `[1.1-SOP-Corporate-Customer-Onboarding.md → BGV Check / BGV Decision Matrix]`.
- Но прямой конфликт лиц: **«Pavas: BGV обязателен, не отменяется; макс 30 дней с открытия; счёт frozen до клира BGV»** vs предложение «Заменить BGV для low-risk на **CKYCR + Welcome Kit** (обсудить с Legal)» — оба в `[analytics-and-research.md → Minutes of Meeting (04.02 Operations)]`.
- Ещё: «BGV — Karan: боремся за отмену» — `[analytics-and-research.md → Project To-Do list]`; «BGV обязателен для Sole Prop и Partnership», «Listed/MCA-listed можно исключить», «BGV ownership Compliance» — `[analytics-and-research.md → BT March 2026 (Compliance MoM)]`.
- Доп. нюанс матрицы: BGV Decision Matrix в `[1.1-SOP → BGV Decision Matrix]` использует «Blacklist matches like **sanctions list**», а в `[3.1-Criteria-for-BGV-check.md → BGV Decision Matrix]` — «**OFAC** or other watchlists». Формулировки разные (sanctions list vs OFAC) — мелкое расхождение терминов.
- Вывод: статус «BGV всегда обязателен» НЕ согласован с матрицей исключений и предложением замены на CKYC+Welcome Kit. Спор персонифицирован (Pavas против команды) — не закрыт.

### A4. Метод eKYC — Aadhaar QR vs XML-upload vs OTP (ПОДТВЕРЖДЕНО)
- QR как primary: «Aadhaar QR eKYC — primary method for MVP stage», Table B описывает только QR-флоу (Install Aadhaar App → Scan QR → face auth) — `[1.1-SOP-Corporate-Customer-Onboarding.md → Aadhaar eKYC Sub Process / Table B]` и `[2.1-Self-VKYC-Business-Process.md → Self VKYC of a New Customer]`.
- XML как путь: «этот вариант SOP описывает **Offline eKYC (XML-file)** путь (не QR): … Visit UIDAI Portal → Download XML KYC File → Upload XML + share code» — `[2.1-SOP-for-VKYC.md → Scenario 1]`.
- Верхнеуровнево допускаются оба + OTP: «QR code scanning via Aadhar App / **XML-based verification** / **OTP-based** authentication» — `[1.1-SOP-Corporate-Customer-Onboarding.md → VCIP Process: eKYC]`.
- Разрешение по встречам, но без сведения в единый SOP: «QR-код предпочтительнее zip/xml» — `[analytics-and-research.md → BT March 2026 (Ops MoM)]`; «eKYC QR или zip/xml — оба ок» — `[analytics-and-research.md → BT March 2026 (Compliance MoM)]`; «QR/letter/PVC или electronic XML/mAadhaar» — `[analytics-and-research.md → Usefull links]`.
- Вывод: два SOP-файла (QR vs XML) описывают разные основные методы; верхний уровень допускает оба + OTP. MVP-метод формально объявлен «QR primary», но XML-SOP существует параллельно как полноценный сценарий. Требует фиксации единого MVP-метода.

### A5. Порог Credit Exposure — 5 Cr vs 10 Cr (ПОДТВЕРЖДЕНО, переход во времени + смешение)
- Account Management / sub-classes использует **10 Cr** как границу Current vs Collection: «CRILC check — Exposure <10 Cr; OR >10 Cr and Sber ≥10%…» и таблица «less than 10 crores → Current / 10 crores or more → …» — `[3.2-Account-Management-Caldera.md → Mandatory Criteria … / Sub-classes allocation logic]`.
- Аналитика говорит **5 Cr** как порог (исторически): «стоп-факторы (долг >5 крор)» — `[analytics-and-research.md → Итоги встреч (Sales)]`; «Проверка долга >5 крор (~$600k)… при превышении → Коллекшн» — `[analytics-and-research.md → Открытие счетов]`; RBI/Credit Exposure: «<₹5 crore — без ограничений; ₹5-50 crore — условия; ≥₹50 crore — escrow», «компании с exposure ≥5 crore» — `[analytics-and-research.md → Credit Exposure]`.
- Явный момент перехода: **«порог exposure 5 Cr → 10 Cr с 1 апреля»** — `[analytics-and-research.md → BT March 2026 (Ops MoM)]`.
- LEI-триггер использует ОБА числа в разных местах: DVU-сценарий «If CRILC **>10CR** and LEI not fetched → alert AOD», но текст ниже: «non-individual borrowers with aggregate exposure **₹5 crore and above** … obtain LEI» — оба в `[3-DVU-Data-Verification-Unit-Process.md → List of AOD scenarios #16]`.
- Вывод: порог изменён 5→10 Cr с 1 апреля, но старое значение 5 Cr осталось в аналитике, в RBI-справке и внутри одной DVU-ячейки (LEI). Реализации нужен единый актуальный порог; особое внимание — несогласованности 5 vs 10 Cr внутри #16.

### A6. Кто проходит VCIP и кто подписывает BR (ЧАСТИЧНО ПОДТВЕРЖДЕНО — формулировки расходятся)
- Базовая матрица (Company): «Кто подписывает BR: 5 Directors → Min 2 directors / Company Secretary (Singly) / Managing Director; Кто проходит VCIP: **Authorized Signatory, who signed BR**» — `[6-Operating-Instruction-Form-BR-vs-role-model.md → таблица]` и `[6.1-Detailed-BR-signing-EKYC-offline-online.md → таблица]`.
- Но встречи расширяют круг VCIP: «подписанты BR **+ AS** проходят VCIP» — `[analytics-and-research.md → BT March 2026 (DVU Scenarios MoM)]`; «все AS из BR **+ UBO >10%** → VCIP» — `[analytics-and-research.md → BT March 2026 (CRM MoM)]`.
- Scope Self-VKYC шире: «Private Limited: Authorised Signatories, **Beneficial Owners**; Company: AS, BO» — `[2.1-Self-VKYC-Business-Process.md → Scope]`. То есть BO/UBO явно проходят VKYC, хотя таблица 1D-6 говорит «VCIP проходит AS, подписавший BR».
- FATCA-периметр ещё шире: «Entity — все AS по BR **+ 2 директора/MD/CEO/CS + UBO >10%**» — `[analytics-and-research.md → BT March 2026 (DVU Scenarios MoM)]`.
- Кто подписывает BR — тоже расхождение: 1D-6 говорит «Min 2 directors / CS Singly / MD»; CRM MoM при этом уточняет «share holding pattern — подписи директоров не нужны, убрать из BR-секции» — `[analytics-and-research.md → BT March 2026 (CRM MoM)]`. Прямого конфликта нет, но периметр подписантов в разных местах описан по-разному.
- Доп. конфликт по VKYC-периметру для процессов: в STEP-таблицах процессов 1.2/1.3/1.4 «**each authorized signatory** receives link … perform Video KYC» — `[1.2-Company-Onboarding-BANK-perspective.md → Process Description (step 08)]`, тогда как 1D-6 сужает до одного AS, подписавшего BR. Для Company «один Single AS с Admin role» (1D-6) vs «each authorized signatory» (1.2) — кого именно гонять через VCIP, не сведено.
- Вывод: периметр «кто проходит VCIP» колеблется (только подписавший AS / все AS / все AS + UBO>10% / AS + BO). Нужен единый список участников VCIP по типу ЮЛ. Требует разрешения с Compliance.

### A7. (НАЙДЕНО ДОП.) Финальный аппрув VCIP-сессии — Concurrent Audit vs DVU
- «Alert is generated to the **Concurrent Audit** to review and approve the session … account remains in freezed mode until approval» — `[1.1-SOP-Corporate-Customer-Onboarding.md → Table A]` и `[2.3-SOP-for-VKYC.md → Дельты]`; подтверждено `[analytics-and-research.md → Minutes of Meeting (02.02 Compliance)]` («Concurrent audit team обязан валидировать VCIP видео; до этого счёт frozen»).
- Но Self-VKYC версия заменяет это на DVU: «вместо Concurrent Audit alert — **"Alert to DVU for manual check"**» — `[2.1-Self-VKYC-Business-Process.md → Self VKYC of a New Customer]`; Roles в этой версии вообще без Concurrent Audit (только AS + DVU) — `[2.1-Self-VKYC-Business-Process.md → Roles and Responsibilities]`, тогда как 2.3 добавляет третью роль Concurrent Audit — `[2.3-SOP-for-VKYC.md → Дельты]`.
- Вывод: кто даёт финальный аппрув для разморозки счёта после Self-VKYC — Concurrent Audit или DVU — расходится между версиями SOP.

### A8. (НАЙДЕНО ДОП.) Срок действия OTP в гостевой зоне
- «OTP … **3 min validity**» / «OTP allotted time **3 minutes**» — `[2.1-SOP-for-VKYC.md → Detailed Description Para 2 / Scenario 1]`.
- Другие SOP про срок OTP молчат (говорят только «within the allotted time») — `[1.1-SOP-Corporate-Customer-Onboarding.md → Table A (шаг 02)]`. «allotted time to enter Guest Zone? — The same as Q1» (т.е. = сроку жизни ссылки) — `[2.1-SOP-for-VKYC.md → Open Questions]`, что нелогично смешивает срок жизни OTP и срок жизни ссылки.
- Вывод: единственное числовое значение OTP-валидности (3 мин) есть лишь в одном файле; в Open Questions срок OTP приравнен к сроку ссылки. Расхождение/недоопределённость.

### A9. (НАЙДЕНО ДОП.) Захват подписи: Aadhaar Card vs PAN Card как mandatory-документ в VCIP
- Table D (1.1 / 2.3): mandatory documents — «**PAN card** + Wet signature on a paper» — `[1.1-SOP-Corporate-Customer-Onboarding.md → Table D Process Flow]`, `[2.3-SOP-for-VKYC.md → Дельты]`.
- Версия SOP (2.1-SOP) Para 7: «**Aadhaar Card Front** (OCR Name/Aadhaar Number/DOB/Gender) → Back (Address) → Additional Identity proof (Passport/DL/Voter ID)» — `[2.1-SOP-for-VKYC.md → Stage 2 Para 7]`. Здесь основной захватываемый документ — Aadhaar, а не PAN.
- При этом RBI прямо: «redact/blackout Aadhaar number», «capture clear image of **PAN card**» — `[2-VCIP-Personal-Identification.md → V-CIP Procedure (п.7, п.9)]`; и «Aadhaar card фото в VCIP не хранить (нет vault)» — `[analytics-and-research.md → Minutes of Meeting (04.02 CISO+Audit)]`.
- Вывод: какие именно документы захватываются на видео (PAN-only vs Aadhaar front/back + доп.) расходится между версиями SOP, и Aadhaar-захват конфликтует с требованием не хранить фото Aadhaar/редактировать номер. Требует сверки.

### A10. (НАЙДЕНО ДОП.) Сколько секций в Consent / Declarations dashboard — 2 vs 3 vs 5
- Declarations Dashboard в Table A: «two core links» в тексте, но перечислено **три**: Declaration for Acc Opening, FATCA, CAF — `[1.1-SOP-Corporate-Customer-Onboarding.md → Table A (шаг 09)]` (внутреннее противоречие «two» vs 3 пункта).
- Consent Collection Dashboard (2.1-SOP): «**5 core links**: Account Opening Declaration; Operational Instructions; Terms & Conditions; VKYC & eKYC Consent; Basic Account Information» — `[2.1-SOP-for-VKYC.md → Detailed Description Para 3]`.
- Consents Dashboard (1D-9): другой набор из 7 текущих + отдельный будущий список — `[9-Consents-Dashboard.md → Current consents … / Consents for the fully-automated …]`.
- Вывод: число и состав согласий/деклараций несогласованы между Table A (2/3), Para 3 (5) и 1D-9 (7). Требует единого реестра согласий.

### A11. (НАЙДЕНО ДОП.) Создание нового CIF для существующего клиента
- «Корп. клиент с существующим CIF — **НЕ создавать новый CIF** (RBI), обновлять» — `[analytics-and-research.md → Minutes of Meeting (04.02 Operations)]`; подтверждено сценарием CRM «CIF exists → … CIF Active throughout» — `[4-CRM-part-of-E2E-Product-Opening-Process.md → Status Matrix (SCENARIO 2)]`.
- Но процесс-шаги 1.2/1.3/1.4 безусловно ведут к «CBS - Account Opening … Net-Banking Credentials generated», не разделяя new vs existing CIF — `[1.2-Company-Onboarding-BANK-perspective.md → Process Description]`. Пересечение с 1D-7 (AS уже онбордился) не описано (см. B). Расхождение скорее «правило vs нераскрытый процесс», требует явной развилки new/existing CIF в основном флоу.

---

## B. ПРОБЕЛЫ / TBD / WIP (не доопределено, но нужно для реализации)

### B1. Пороги liveness / OCR / deepfake — не заданы числа
- «Liveness confidence score is between **XX and XX**» — плейсхолдер — `[1.1-SOP-Corporate-Customer-Onboarding.md → Appendix 4 (Liveness & Deep fake)]` и `[2.1-Self-VKYC-Business-Process.md → Appendix 2]`.
- «Thresholds (confidence score)? — Только повороты головы»; «metrics … внутренняя кухня SDK Liveness, в SOP не надо выносить»; «Criteria для OCR — на основе шаблонов»; «Overall thresholds — если все проверки пройдены успешно» — все ответы качественные, без числовых порогов — `[2.1-SOP-for-VKYC.md → Open Questions]`.
- Пробел: конкретные пороговые значения liveness/OCR/deepfake отсутствуют (отданы в SDK). Для приёмки/тест-кейсов чисел нет.

### B2. Тайминги — частично заданы, частично TBD
- VCIP-сессия: «В течении одного дня» (нечётко) — `[2.1-SOP-for-VKYC.md → Open Questions]`; «Макс. длина VCIP-сессии — предопределить» — `[analytics-and-research.md → Minutes of Meeting (04.02 CISO)]` (TBD).
- Liveness: «Одна попытка»; OCR: «пока не распознан — нельзя дальше» — `[2.1-SOP-for-VKYC.md → Open Questions]` (заданы как «1 попытка / без лимита», но без таймаутов).
- Offline eKYC: «сессия в течение **3 дней** с момента скачивания Aadhaar zip/XML» — `[analytics-and-research.md → Minutes of Meeting (04.02 CISO)]`.
- Follow-up тайминги: «T → Email+SMS T+1 → DVU call T+2», «эскалация RM при pending >5 days» — `[analytics-and-research.md → 3.1 Opened Questions]`.
- Пробел: «X no. of reminders» для Initial Deposit не определено — `[1.2-Company-Onboarding-BANK-perspective.md → Process Description (step 09)]`; «Draft non-active period X → PIF canceled» не определено — `[4-CRM-part-of-E2E-Product-Opening-Process.md → Status Matrix]`; «auto-alert call Rejected Lead in X days», «reminder X days before visit» — `[4.1-CRM-Scenarios.md → Features for Future CRM Concept]`.

### B3. Незаполненные сценарии VKYC 2/3/5/6
- Self-VKYC «Scenarios 2 & 3 (Existing Customer Re-KYC; Event-driven KYC) — diagrams/descriptions **TBD**»; «Approval and Rejection Criteria / Security and Data Management — **TBD**» — `[2.1-SOP-for-VKYC.md → Scenarios 2 & 3 …]`.
- Officer-VKYC: Scenario 1/3/5 описаны, но «Scenarios **2, 4, 6** (Automated variants) — descriptions/diagrams **TBD**»; «Approval and Rejection Criteria / Security and Data Management — **TBD**» — `[2.2-VKYC-with-VKYC-Officer.md → Scenarios 2,4,6 …]`.
- Пробел: автоматические варианты Officer-сценариев и Re-KYC/Event-driven Self-VKYC не раскрыты.

### B4. Пустые/каркасные страницы 7 и 8
- 1D-7: «Страница содержит только заголовок "To-Be process" — детальный контент/диаграмма **не заполнены**» — `[7-Onboarding-AS-already-onboarded-other-company.md → To-Be process]`. Ключевой кейс переиспользования KYC/customer ID для AS, онбордящегося во 2-й компании, не описан (есть лишь ремарка из встреч).
- 1D-8: «Scenario 1 (data modification online) / Scenario 2 (via Customer Support) — детальные флоу/диаграммы **не заполнены**» — `[8-Request-to-change-Customers-Data-online.md]`. Также «Post MVP, not in scope first phase» — `[3-DVU-Data-Verification-Unit-Process.md → List of AOD scenarios #11]`.

### B5. Открытые вопросы 3.1 (целиком пробел/TBD)
- TBD-ответы: «#5 key clients involve RM earlier — **TBD**»; «#6 как распределяются алерты — **TBD**»; «#7 external data contradicts client data — **need clarification**»; «#8 как вовлекается compliance — **TBD**»; «#9 кто звонит при CRILC fail/OFAC и говорим ли причину — **TBD**» — все `[analytics-and-research.md → 3.1 Opened Questions]`.
- Архитектурные вопросы без ответа: «1 директор на несколько компаний?», «хранить данные физлиц в отрыве от компаний (физюрики)?», «где RM сохраняет согласие на export/collection вместо current» — `[analytics-and-research.md → 3.1 Opened Questions]`.

### B6. Risk Categorization — WIP, формула/веса есть, но шкала спорна
- Страница помечена «(WORK IN PROGRESS)» — `[5-Risk-Categorization-Business-Nature-Questionnaire.md → заголовок]`.
- Несостыковка определения «Standard Customer» по риску: SOP — «Risk Category is **Low**» (только Low в STP) — `[1.1-SOP-Corporate-Customer-Onboarding.md → Definition of "Standard Customer"]`; аналитика — «Risk Category **Low & Medium**» — `[analytics-and-research.md → 7.6.2 The 1DAY INICIATIVE (Standard Customer)]`; матрица — «8-12 Low → STP; 13-17 Medium → Hybrid/Offline» — `[5-Risk-Categorization-Business-Nature-Questionnaire.md → Risk Assessment Logic]`. Т.е. Medium у одних = STP-eligible, у других = Hybrid. (Граничит с противоречием; помечаю как WIP-пробел, т.к. страница сама WIP.)
- BNQ Template A (Sole Proprietorship) — отсылка к внешнему файлу `docs/BNQ Template A …` «если есть»; структура не приведена в исходнике — `[5-Risk-Categorization-Business-Nature-Questionnaire.md → BNQ Templates]`. **Нужен полный первоисточник BNQ A.**

### B7. Прочие явные TBD/«под вопросом» в DVU и атрибутах
- DVU «#9 DIP Check — **TBD**»; «#11 data change — Post MVP»; «#12 welcome package — will automate но in discussion»; «#13/#14 net-banking/CKYC changes — will automate но in discussion»; «#15 fraud list of mobile — UNDER DISCUSSION» — `[3-DVU-Data-Verification-Unit-Process.md → List of AOD scenarios]`.
- RBI-атрибуты: «Priority/Non-Priority Sector — **Not fully checked**»; «Internal Credit Rating — **To discuss**»; «Client Group Code/Group Name — RBI source, manual request; no holding structure in Caldera yet» — `[5.1-Attributes-for-RBI-reports.md → Attributes list]`.
- NIC code: «AS-IS … takes up to ___ work hours» (плейсхолдер); «можно ли тянуть NIC автоматически… (в Probe42 нет)»; «кто отвечает за таблицу NIC»; «кто обновляет для существующих клиентов» — все open — `[5.2-NIC-code-attribute-online-onboarding.md → AS IS / Opened questions]`.
- Consents Dashboard: «Business Overview — **TBD**» — `[9-Consents-Dashboard.md → Business Overview]`.
- CRM Scenarios: «Scenarios 2-7 — Process Diagrams/Descriptions: **TBD**»; «Onboarding Alerts / Verification Scenarios (CRILC fail; AML/Compliance fail) — **TBD**» — `[4.1-CRM-Scenarios.md → Scenarios 2-7]`.
- 6.1: страница помечена «(in progress)»; «Companies — The process flow (in progress)» без содержания — `[6.1-Detailed-BR-signing-EKYC-offline-online.md]`.

### B8. Неопределённые алгоритмы/проверки
- IP/VPN spoofing: «Проверка есть, алгоритм большой … (confluence CLDRAML)» — отсылка, без алгоритма в исходнике — `[2.1-SOP-for-VKYC.md → Open Questions]`. **Нужен полный первоисточник (CLDRAML).**
- Матчинг имён PAN vs Aadhaar (по-разному пишутся): «Нужен алгоритм матчинга имён» — `[analytics-and-research.md → Minutes of Meeting (04.02 CISO)]`; «How to verify face photo vs Aadhaar photo if age difference significant? — на этапе бизнес-анализа, ответа пока нет» — `[2.1-SOP-for-VKYC.md → Open Questions]`.
- Device/camera requirements: «уточню у Яши»; «Полный перечень тех требований: developers.sber.ru/help/jazz…» — отсылки без значений — `[2.1-SOP-for-VKYC.md → Open Questions]`.

### B9. Сокращённые/дедуплицированные таблицы — нужен полный первоисточник
- Appendix 2 «Documents for Entity» в 1.1-SOP ужат: «(полная таблица … см. дублирующую полную таблицу в 1-Customers-Onboarding-process.md → Appendix 4)»; и наоборот Appendix 4 в 1-Customers ссылается на 1.1 — обе ячейки condensed — `[1.1-SOP-Corporate-Customer-Onboarding.md → Appendix 2]`, `[1-Customers-Onboarding-process.md → Appendix 4]`. **Полная матрица колонок STP/Hybrid/Offline/Verification не развёрнута в export.md.**
- Атрибуты LLP/Partnership «(Структура атрибутов идентична 1.2 …)» и Sole Prop «(Структура идентична 1.2 …)» — `[1.3-Partnership-Onboarding-BANK-perspective.md → List of Attribute]`, `[1.4-Sole-Prop-Onboarding-BANK-perspective.md → List of Attribute]`. Дельты описаны, но полные таблицы не приведены.
- Self-Assessment Risk Matrix «(полная матрица из 22 строк … см. идентичную …)» — `[1.1-SOP-Corporate-Customer-Onboarding.md → Appendix 5]`; в 2.1-Self «9 строк» — `[2.1-Self-VKYC-Business-Process.md → Appendix 3]`. Расхождение объёма (22 vs 9) — возможно разные версии. **Нужен полный первоисточник.**
- Process Diagram в 1.1-SOP — заголовки шагов без структурированной таблицы (текст «слит») — `[1.1-SOP-Corporate-Customer-Onboarding.md → Detailed Process flow and Control Points]`. Нумерация шагов неполная/непоследовательная (01, 03a, 3b…). **Нужен полный первоисточник (диаграмма).**
- Prospect Onboarding Sub-process: нумерация шагов скачет (…09, **12**, 10, 11, End) — `[1-Customers-Onboarding-process.md → Prospect Onboarding Sub-process]`. Похоже на дефект исходника; требует сверки порядка.

---

## C. ОТКРЫТЫЕ ВОПРОСЫ к стейкхолдерам (требуют решения; в скобках — ответственный, если назван)

### C1. BGV — отменяем ли для low-risk и чем заменяем? (Pavas / Karan / Compliance / Legal)
- Прямой неразрешённый спор: Pavas настаивает «BGV обязателен, не отменяется» — `[analytics-and-research.md → Minutes of Meeting (04.02 Operations)]`; Karan «боремся за отмену» — `[analytics-and-research.md → Project To-Do]`; предложение «заменить на CKYCR + Welcome Kit (обсудить с **Legal**)» — `[analytics-and-research.md → Minutes of Meeting (04.02 Operations)]`. Требует финального решения Compliance/Legal. См. A3.

### C2. Срок жизни гостевой ссылки и разведение таймеров (OBO — Даниловский Дмитрий)
- «Бессрочно, но стоит сходить в **OBO** за уточнением, тк они управляют гостевой зоной (**Даниловский Дмитрий**)» — `[2.1-SOP-for-VKYC.md → Open Questions]`. Нужно зафиксировать 30/180/иное и развести «ссылка / запись VKYC / TAT». См. A2.

### C3. Периметр VCIP-участников и подписантов BR по типам ЮЛ (DVU / CRM / Compliance — Sashikant)
- Расхождение «только подписавший AS / все AS / + UBO>10% / + BO» — см. A6. Compliance (Sashikant) задал рамку «только Low risk → STP», но периметр VKYC не финализирован — `[analytics-and-research.md → Minutes of Meeting (02.02 Compliance)]`, `[analytics-and-research.md → BT March 2026 (DVU/CRM MoM)]`.

### C4. Блокировка после 5 OTP — temporary или permanent (целевое — Internet bank approach)
- «Q2 goal: move to Internet bank approach with temporary block» — `[2.1-SOP-for-VKYC.md → Open Questions]`. Нужно зафиксировать для MVP. См. A1.

### C5. Метод eKYC для MVP — QR / XML / OTP (Ops / Compliance)
- Ops: «QR предпочтительнее zip/xml»; Compliance: «оба ок» — `[analytics-and-research.md → BT March 2026 (Ops/Compliance MoM)]`. Нужно зафиксировать единственный MVP-метод. См. A4.

### C6. Порог Credit Exposure 5 vs 10 Cr и согласование с LEI-триггером (Ops / Yulia — account types)
- «5 Cr → 10 Cr с 1 апреля» — `[analytics-and-research.md → BT March 2026 (Ops MoM)]`; внутри DVU #16 оба значения — `[3-DVU-Data-Verification-Unit-Process.md → #16]`; владелец account types — «Yulia» — `[analytics-and-research.md → Project To-Do]`. См. A5.

### C7. Переиспользование KYC/customer ID для AS, онбордящегося во 2-й компании (Yaroslav — owner 1D-7; Deepak)
- «AS already onboarded — **Yaroslav**» — `[analytics-and-research.md → Project To-Do]`; «нужно проверить возможность переиспользовать KYC … См. Минутки (Deepak)» — `[7-Onboarding-AS-already-onboarded-other-company.md]`; «Переиспользование customer ID при онбординге 2-й компании» — `[analytics-and-research.md → Minutes of Meeting (04.02 Operations)]`. Кейс не описан. См. B4.

### C8. Email физлица — есть ли в Aadhaar/как сверять (Сандип, Амина)
- «Email … ❌ (проверить с **Сандипом, Аминой**)» — `[10-Matrix-Personal-Signatory-Data-Cross-Check.md → таблица Sources/Key Fields]`. Влияет на cross-check периметр (Confidence для email = LOW).

### C9. NIC code — ответственный за таблицу/обновление, источник автозабора (owner не назван)
- 4 открытых вопроса без ответственного — `[5.2-NIC-code-attribute-online-onboarding.md → Opened questions]`. Требует назначения владельца.

### C10. Initial Deposit — обязателен ли и сумма для активации (продуктовая политика)
- RBI не обязывает, банки включают как политику; в SOP активация завязана на «Initial Deposit received» — `[analytics-and-research.md → Research on Initial Deposit Requirement]`, `[1.2-Company-Onboarding-BANK-perspective.md → Process Description (step 09)]`. Сумма/число напоминаний (X) не заданы — продуктовое решение нужно.

### C11. Re-KYC периметр email-валидации и распределение алертов DVU (TBD из 3.1)
- «как алерты распределяются — TBD»; «external data contradicts client data — need clarification»; «как вовлекается compliance — TBD» — `[analytics-and-research.md → 3.1 Opened Questions]`. Требует решения по операционной модели DVU/Compliance.

### C12. UIDAI/Aadhaar — дорого и требует AUA/KUA-лицензии (Core/инфра)
- «eKYC (UIDAI) — очень дорого 12+ ком/мес, нужен AADHAR Vault» — `[analytics-and-research.md → 7.6.2 (Project Breakdown)]`; полный набор требований AUA/KUA, инфра в Индии, аудит — `[analytics-and-research.md → Aadhaar / UIDAI research]`. Стратегический бюджет/лицензирование — решение менеджмента.

### C13. Согласование редизайна BR/Consents (Margo)
- «согласовать с **Margo**» (BR upload + Consents Dashboard) — `[6.1-Detailed-BR-signing-EKYC-offline-online.md]`; владелец Consents dashboard — «Denis» — `[analytics-and-research.md → Project To-Do]`.

### C14. Пилотный охват — только Sole Proprietorship (Operations)
- «**Пилот — только Sole Proprietorship**» — `[analytics-and-research.md → Minutes of Meeting (04.02 Operations)]`. Важно для приоритизации: основные процессные файлы покрывают Company/Partnership/SP, но пилот сужен. Стейкхолдерам подтвердить scope MVP.

---

## Методология

**Что читал (полностью):** единственный источник `docs/_исходники/2026-06-09_BRD/export.md` целиком (1752 строки, ~228 КБ), за 4 прохода (строки 1–429, 430–858, 859–1308, 1309–1752). Предварительно — `_INDEX.md` (карта файлов). В интернет не выходил, внешние источники не привлекал; все находки опираются только на текст export.md.

**Структура источника:** export.md — сборка из core-файлов 1D (1…10) + блок `analytics-and-research.md`, разделители `<!-- ==== файл.md ==== -->`. Ссылки в отчёте даны на эти внутренние имена файлов и их заголовки.

**Куски condensed / дедуплицированы (требуют полного первоисточника):**
- Appendix 2 «Documents for Entity» (1.1-SOP) и Appendix 4 (1-Customers) — взаимно ссылаются, полная матрица колонок STP/Hybrid/Offline/Verification не развёрнута. → нужен полный первоисточник.
- Атрибутные таблицы LLP/Partnership (1.3) и Sole Prop (1.4) сведены к «идентично 1.2 + дельты». Полные таблицы не приведены.
- Self-Assessment Risk Matrix: в 1.1-SOP «22 строки» (свёрнуто), в 2.1-Self «9 строк». Расхождение объёма — возможно разные версии; нужен полный первоисточник.
- Process Diagram / Detailed Process flow (1.1-SOP) — текст диаграммы «слит», нумерация шагов неполная (01, 03a, 3b…). Нужен исходный drawio/диаграмма.
- BNQ Template A (Sole Proprietorship) — отсылка к внешнему файлу `docs/BNQ Template A …`, структура не в исходнике.
- IP/VPN spoofing алгоритм — отсылка «confluence CLDRAML», алгоритма нет.
- Tables A–D в 2.1-Self / 2.3 даны как «идентичны 1.1-SOP + дельты» — полные таблицы только в 1.1-SOP.
- «Копия 1D-2 VCIP» (analytics) — расширенная версия страницы 2 с пошаговым VCIP 01-22 и Officer-таблицей; в основном файле 2-VCIP она ужата. Для детального Officer-flow нужен этот расширенный источник.

**Подход к находкам:** известные кандидаты (5 OTP, ссылка 30/180, BGV, eKYC QR/XML, 5/10 Cr, VCIP/BR-подписанты) — все подтверждены и расширены (A1–A6). Дополнительно найдены A7 (Concurrent Audit vs DVU аппрув), A8 (срок OTP), A9 (PAN vs Aadhaar захват в VCIP), A10 (число согласий 2/3/5/7), A11 (new vs existing CIF). Сомнительное помечено «(НАЙДЕНО ДОП.)» либо отнесено в B (WIP-пробел), а не в A, если сама страница помечена WIP.
