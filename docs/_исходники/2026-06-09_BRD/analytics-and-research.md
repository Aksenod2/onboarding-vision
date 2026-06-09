---
source: Confluence аналитика/ресёрч (не-1D страницы), получено 2026-06-09
type: исходник (faithful-condensed; справочный фон для BA, не флоу)
note: ключевые факты/цифры/ссылки/решения сохранены; разбухшие дубль-таблицы (списки документов, пошаговые CJM банков) ужаты. Полный сырой текст — в чате 2026-06-09.
---

# Оглавление
1DAY Initiative (7.6.2) · Opened questions (3.1) · Минутки (Minutes of Meeting, BT March 2026, Итоги Sales, Итоги Открытие счетов) · Регуляторика (Regulatory Requirements, Legal Entities docs, Compare docs) · CKYC (AS-IS, Registry) · Aadhaar/UIDAI research + NRIs · Credit Exposure · Digital Banking Concept · Digital Signing (DSC/eMudhra, Policy, Digital products) · Documents (OCR, per legal type, entity types & attributes, Online Onboarding Check List, Temporary page) · Email Notifications · Offers & deals priority · Project To-Do / Task Tracker · Risc analysis / BGV analysis / Clients 2026 · Initial Deposit research · Survey · Amendment To BR · CRM Scenarios 1-7 · Конкуренты (Account Opening CJM, World Banks Practice/Revolut, VTB Shanghai) · Welcome Kit · Usefull links · Task inward messages (VTB SFMS) · Копия VCIP.

---

## 7.6.2. The 1DAY INICIATIVE — new unified automated process
E2E автоматизированный процесс от привлечения клиента до открытого счёта; онлайн-онбординг с полностью автоматическими проверками; часть Digital Banking Concept.
**Prerequisites:** CRILC self-declaration + API; CKYCR integration; VCIP; Aadhaar eKYC UIDAI licence; Probe42 (актуальные данные, inline с RBI); определить параметры Standard Customer (T=1 Day).
**Standard Customer:** LE, резидент Индии (и компания, и подписанты), данные актуальны в гос. регистрах, Risk Category Low & Medium. Legal Entity: Sole-Prop, Private Ltd, LLP, Limited Partnership, Public Ltd, Partnership. Probe42 data availability (MCA/IEC/LEI/PAN/UDIN reports); PAN & GST (Sole-prop via GSTIN); CKYCR; UIDAI; Risk Low/Medium (auto-calc from BNQ).
**To-Be sub-processes (links to BRDs):** 00 CRM registers request (1D-4); 01 Initial Auto-screening (1D-1); 02 Manual screening (1D-1); 03 Auto-data/manual form (1D-1); 04 CIP eKYC+VKYC (1D-2); 05 Auto-data verification vs registers (1D-1); 08 DVU checks (1D-3); 06 Auto-account opening; 07 CRM&Call Center subprocess (1D-4).
**Automation of checks vs gov registers:** OFAC (sanctions, entity & individuals); CRILC (total credit exposure); BGV (3rd party / video-BGV); LEI (legalentityidentifier.in / Probe42); NSDL (PAN); IEC (DGFT / Probe42); GST (Probe42); NCC (cybercrime.gov.in, AML module); MCA (Probe42); CKYCR (CERSAI); UIDAI; UDIN (ICAI).
**Project Breakdown / workload (команда/месяц):** Prospect Card; Leads from site; CIF+OBO; Status Model; SLA DVU; BGV electronic form; Data autopopulation Probe42; auto-checks (NCC/OFAC/LEI/IEC/GST/MCA/UDIN/CKYCR); Risk auto-calc; BNQ; CRILC/NESL; eKYC (UIDAI — "очень дорого 12+ ком/мес, нужен AADHAR Vault"); VKYC record/capture/auto-recognition/auto-matching/liveness; auto-account opening/activation/closing. **Workload summary totals:** CRM 2.3; CIF 3; KYC 5.9 + 9.4; OBO 9; CAM 3.5; Core 11 (aadhaar vault, eSign, eKYC, ЭДО); Data 0 (in GTWR). **Total 33.1 (+11 core).**
Glossary: Lead; MR=Master Record (PIF+CIF); Prospect; Customer; Offer; Deal.

---

## 3.1 Opened Questions (verbatim Q&A)
| # | Question | Response |
| --- | --- | --- |
| 1 | If additional docs requested, time before follow-up call? | T day request → Email+SMS on T+1 → DVU call on T+2 |
| 2 | Who makes follow-up call? | DVU team for documents, Call center for customer support |
| 3 | If client unreachable by phone, next step? | DVU follows up via phone or email |
| 4 | When escalate to RM? | When documents pending >5 days, tagged RM reaches out |
| 5 | For key/largest clients involve RM earlier? | TBD |
| 6 | How alerts distributed/assigned? | TBD (ideal: assign to specific person immediately; alt: general queue) |
| 7 | External data contradicts existing client data — alert to update? | need clarification |
| 8 | How compliance involved; need alert for doc requests? | TBD |
| 9 | If not eligible for current account (CRILC fail) or can't open (OFAC) — who calls, do we tell reason? | TBD |
Архитектурные вопросы: 1 директор на несколько компаний? Хранить данные физлиц в отрыве от компаний (идентификация физика → привязка к нескольким компаниям; «физюрики»)? Как/где RM сохраняет инфо, что клиент согласился на export/collection вместо current; доступность аккаунт-опенинг специалисту.

---

## Minutes of Meeting (ключевые решения)
- **04.02 CISO+Audit:** Offline KYC — сессия в течение 3 дней с момента скачивания Aadhaar zip/XML (TAT). ePAN нельзя в VCIP — только держать PAN card + скриншот. Aadhaar card фото в VCIP не хранить (нет vault). Нужен алгоритм матчинга имён (PAN/Aadhaar по-разному). BGV — "Welcoming letter" на адрес + OTP-подтверждение получения = верификация адреса. Макс. длина VCIP-сессии — предопределить.
- **04.02 Operations:** Корп. клиент с существующим CIF — НЕ создавать новый CIF (RBI), обновлять. Заменить физ. BR на digital Operating Instructions — обсудить с Legal. В VCIP добавить шаг захвата физ. подписи (подпись на бумаге → скриншот). **Пилот — только Sole Proprietorship.** Account unfreeze: initial deposit + "Welcoming KIT" + OTP при получении чековой книжки = верификация адреса. Заменить BGV для low-risk на CKYCR + Welcome Kit (обсудить с Legal). **Pavas: BGV обязателен, не отменяется; макс 30 дней с открытия; счёт frozen до клира BGV.** Захват подписи AS в VCIP → Caldera (для валидации RTGS оффлайн). Переиспользование customer ID при онбординге 2-й компании.
- **02.02 Compliance (Sashikant):** Хорошая инициатива. Только LOW risk → STP online; medium/high — отдельно. BR заменяется online-формой (Operating Instruction Declaration) — новый SOP. **Concurrent audit team (internal) обязан валидировать VCIP видео; до этого счёт frozen.**

---

## BT March 2026 (встречи + MoM + интервью клиентов)
Встречи: Compliance, Internal team (eKYC), Internal Audit (VCIP/eKYC/consents), Ops (1 day onboarding, DVU scenarios), CRM, Legal (BR & consents).
**Ops MoM (ключевое):** валидная лицензия для Nature of Business; MLM и online gaming аккаунты запрещены; история смены имени компании с evidence; LEI в форме; Vernacular declaration (подпись не на английском); Credit Exposure declaration; **порог exposure 5 Cr → 10 Cr с 1 апреля**; на финальном шаге показать номер счёта "Transfer funds via NEFT/RTGS/IMPS/Cheque to activate"; DVU mail при активации (дата, нужна ли чек-книжка); RM tagging на каждый счёт; **QR-код предпочтительнее zip/xml**; mismatch с CKYC → alert DVU; net-banking access — ownership DVU; Net Banking consents/undertakings в declarations.
**DVU Scenarios MoM:** 5 директоров → мин 2 подписи / CS(Singly) / MD,CEO(Singly); подписанты BR + AS проходят VCIP; auto-check имён в MCA; вопрос "Customer из rural area"; audit trail при правках CAF; при невозможности VCIP — branch/CRM; fraud → compliance → FIU/approve; смена адреса → BGV обязателен; смена mobile/email → валидация Customer Support; net banking access — DVU; 2 mobile → consent какой. **FATCA:** Entity — все AS по BR + 2 директора/MD/CEO/CS + UBO >10%; Sole prop — individual; Partnership — все партнёры.
**Compliance MoM:** consent на CRILC при PAN-валидации; BGV ownership Compliance (1й DVU, 2й Compliance); Listed/MCA-listed можно исключить из BGV; **BGV обязателен для Sole Prop и Partnership**; Video BGV (geo-tag + live video); eKYC QR или zip/xml — оба ок.
**CRM MoM:** LLP в дропдаун Legal entity type; OPC и HUF позже; OFAC positive → alert Compliance; share holding pattern — подписи директоров не нужны, убрать из BR-секции, отдельная секция; place of meeting (Virtually/by rotation/address); OCR для своего формата BR; все AS из BR + UBO >10% → VCIP.
**Internal Audit MoM:** валидная e-copy AOA/MOA (signed downloaded from MCA) хранить; PAN vs NSDL, GST vs GST portal; bank-assisted VKYC предпочтительнее AI; forged PAN → CISO; real-time PAN-NSDL; Driving License в VCIP можно убрать (адрес из Aadhaar); correspondence address ≠ Aadhaar → добавить + consent; вся CAF + docs → PDF для регуляторов; хранить KYC данные lifetime + 8 лет; Auditor role (view) для concurrent auditors.
**Клиентские интервью (05-06.03):** Pro Serve (Mohit, Pvt Ltd); Rati Exports (Ravi Tiwari, Pvt Ltd, текстиль/электроника/минералы); Jayashree General Trading (Amit Sharma, Partnership, золото); Simson Pharma; Paramount Aroma; Poorna Gummies; Plex; Vital Group (non-customer).

---

## Итоги встреч (сентябрь 2025)
**Sales (05.09):** Master Record = проспекты (data.gov.in + Probe42) + клиенты. RM взаимодействует с карточкой проспекта только из раздела оферов (позже отдельный поисковик). Оферы в кампаниях навешивает рос. сотрудник (роль RM Russia). Переиспользуемый функционал поиска компании по PAN/CIN + проливка Probe42 (платно, подтверждает руководитель). Задачи: когда/за кем закреплять клиента с органики; флоу онлайн-онбординга с сайта; стоп-факторы (долг >5 крор); заливать кредитный рейтинг в Sales.
**Открытие счетов (09.09):** Фабрика счетов. ОПС Account Management → "Open New". Типы: Коллекшн (высокая долговая нагрузка, деньги только кредитору с макс. задолженностью); Импортер-Экспортер (только на свои счета, трансгран запрещён); Фрозен. Проверка долга >5 крор (~$600k) раз в полгода (Total Exposure), при превышении → Коллекшн. Портал РБИ, бэк-API. Вопросы: мин. документы по типам счетов; когда 5 крор = критич. задолженность; автопроверка задолженности на раннем этапе.

---

## Regulatory Requirements
**Due Diligence:** идентификация/верификация клиента, beneficial ownership, цель отношений, sanctions screening, risk assessment, ongoing monitoring (PML Act, PML Rules, RBI KYC MD). RBI MD KYC 2016: identity verification (OVD/KYC Identifier CKYC/Aadhaar eKYC); verify address & business nature; back ground screening (sanctions/PEP/terrorists/banned); risk-based EDD + periodic refresh.
**CKYCR (CERSAI) guidelines:** verify identity before account relationship; initial due diligence before upload.
**PMLA 2002:** parent law; Reporting Entity (banks/NBFC/PSO/insurance/securities); CDD; OVD (Aadhaar/Passport/Voter ID/DL); record retention min 5 лет после закрытия; STR to FIU-IND; verify entity types.
**Документы-источники:** RBI KYC Master Direction.pdf; CKYC Operating Guidelines v1.5; UIDAI guidelines. Internal: IRD 2024-109 OBO (MVP) 17.09.2024; Draft SOP Digitally Signed Documents.
**Digital signing legal:** admissible per Bharatiya Sakshya Adhiniyam 2023 (BSA) + IT Act 2000. IT Act: Sec 3 (authentication), Sec 5 (legal recognition = physical), Sec 15 (secure DS). BSA: Sec 63 (admissibility), Sec 66 (no need to prove ownership for secure DS), Sec 86 (presumed affixed with intent), Sec 87 (DSC info presumed correct). Требования admissibility: audit trail; tamper-evident seal; verification mechanism (email/OTP); computer integrity (Sec 63).

---

## Legal Entities and documents requirements (RBI MD KYC 2016)
Per entity type required docs (Chapter VI): Individual (OVD/Aadhaar/KYC Identifier + PAN/Form 60 + photo); Sole Proprietorship (proprietor individual CDD + 2 proof of business existence — Udyam/Shop&Est/GST/ITR/IEC/utility); Private/Public Ltd (COI, MOA&AOA, PAN, Board Resolution, PoA, senior mgmt list, BO/AS KYC, address proof); Partnership (Partnership Deed, Registration Certificate, PAN, PoA, list of partners, BO/AS KYC, address); Trust (Trust Deed, Registration, PAN/Form 60, PoA, settlor/trustees/beneficiaries/protector, BO KYC, address); Unincorporated Association/BoI (resolution, PAN/Form 60, PoA, BO/AS KYC, legal existence); Other Juridical Persons (authorization proof, attorney KYC, legal existence).
**Scanned copies:** "Certified Copy" (officer compares with original at onboarding) или "Equivalent e-document" (DigiLocker, valid digital signature — original не нужен). **OTP/Submit как подпись:** Aadhaar OTP e-KYC (Para 17, лимиты ₹1 lakh balance / ₹2 lakh credits/year, 12 мес); Digital KYC (Annex I — OTP = customer signature on CAF); прочие документы — OTP/Submit валидны под IT Act 2000 (нужен auditable trail).
**Remote account opening без визита:** Aadhaar OTP e-KYC (temporary, конвертация в 12 мес, лимиты); V-CIP (= face-to-face, без ограничений); KYC Identifier from CKYCR (если запись полная/актуальная).

---

## Compare of required documents list (RBI vs Sber 2025 vs AXIS/ICICI)
Сравнение по Sole Proprietorship, Private Limited, Trust, Society, OPC, NGO/NGF, Foreign National. Вывод: Sber-политика 2025 строже RBI MD 2016 (добавляет Active Search Report GST/IEC, CRILC Search, Sanctions List Search, Complete BGV + Site Photograph, Company Profiler, IP Funding CRM Head approval — это внутренние контроли банка, не требования RBI). Источники: 2016 RBI KYC MD; 2025 SBER account opening process (Senat).

---

## CKYC
**AS-IS Process:** CRM собирает KYC документы → Ops проверяет на CKYC портале по PAN/CIN. Если запись есть → CKYC ID вручную в Caldera. Если нет/нужно обновить → Ops (Maker) создаёт запись, Maker-Checker workflow → CKYC ID. Для подписантов: имя нельзя править Ops (клиент сам); OTP на mobile подписанта для consent+download. CKYC ID — постоянный универсальный идентификатор; создание платно для банка, бесплатно для клиента; доступ к данным с согласия; модификация только владельцем записи (OTP). Номер маскируется (последние 4 цифры) кроме создателя/загрузчика.
**CKYC Registry (CKYCRR / CERSAI):** 14-значный CKYC Identifier (KIN). Поиск по KIN или OVD → скачать KYC вместо сбора заново. Update при неполных/устаревших. Consent при каждом download. ~70 crore записей (март 2023). Enroll: ckyc.in → Downloads → форма → подпись Nodal officer → upload + документы. **Стоимость:** ~₹2.25 первый download, ~₹1.10 повторный, ~₹0.25 upload new, ~₹1 update; advance deposit. Интеграция: CKYC Search/Download API / vendor; банк = Reporting Entity (CERSAI). Если нет в CKYC → создать новый KIN. ~83 crore individual + ~1 crore legal entity записей. Validity: фикс. срока нет, периодич. update по risk category.

---

## Aadhaar / UIDAI research (ключевые выводы)
UIDAI разрешает Aadhaar authentication/eKYC только через авторизованные индийские сущности. Foreign bank: только через зарегистрированный индийский branch/subsidiary, одобренный UIDAI как AUA/KUA, либо через лицензированного ASA-партнёра (NSDL e-gov, CDSL, NSEIT, TCS/NIC, Karvy). HSBC/StanChart/Citi India — через ASA. Шаги: рег. индийской сущности → AUA/KUA или ASA → MoU + compliance (Aadhaar Act 2016, data localization) → integrate API (XML/SDK, PID block) → infra в Индии → IT/security audit (ISO 27001, RBI cyber) → production credentials + IP whitelisting.
**Доступные данные:** Authentication API (Yes/No, без данных); e-KYC API (демография: имя/DOB/пол/адрес + фото + masked mobile/email + Aadhaar reference ID, не номер + timestamp + UIDAI digital signature).
**Требования:** AUA-регистрация, IP whitelisting, consent (запись), audit logs, HTTPS TLS 1.2+, шифрование PID (AES-256), нельзя хранить биометрию/OTP, certified biometric devices, серверы в Индии, dual redundant connectivity, fraud monitoring, регулярный аудит, tokenize Aadhaar.
**Документы-регуляторы:** Aadhaar Act 2016; PMLA 2002 + Rules 2005; RBI Master Direction KYC (2023); IT Act 2000; UIDAI Authentication/Data Security/Sharing Regulations 2016, 2021; DPDP Act 2023; Section 11A PMLA (только авторизованные сущности).
**Шифрование/инфра:** AES-256 at rest, TLS 1.2+ transit, data residency India, HSM (FIPS 140-2 L3), RBAC, периодич. аудит, breach report UIDAI в 6 часов. Core components: AUA/KUA server, HSM, DMZ, App server, Audit&Logging (2 года), Load Balancer (99.5% uptime), Admin Console. Модели: Direct AUA/KUA; Sub-AUA (через NPCI); API-based eSign (eMudhra/NSDL).
**Санкции за нарушения:** Aadhaar Act Sec 38-43 (до 3-10 лет + штрафы); UIDAI (suspension/termination AUA/KUA, API key revocation, blacklisting); max INR 250 crore + imprisonment + license suspension (DPDP).
**Стоимость:** ~₹3 за e-KYC, ~₹0.50 за Yes/No; license AUA/KUA: pre-prod ₹5 Lakh/3мес, prod ₹20 Lakh/2 года (5-20 Lakh по объёму транзакций). **Auto-update:** UIDAI НЕ push; только pull при re-KYC/re-auth с consent. Compliance: ISO 27001/PCI DSS. Консент: explicit/electronic/physical/OTP/biometric, retention 2 года.
**Differences by category:** Aadhaar только для физлиц (natural persons, резиденты Индии); юрлицо не имеет Aadhaar — только представители/BO/подписанты.
**Storing Aadhaar:** нельзя хранить полный номер/контакты, только UID token; данные в Индии; HSM; RD-устройства; NTP timestamps.
**Aadhaar for NRIs:** NRI (Indian Passport) — eligible если 182+ дней в Индии за 12 мес; OCI/PIO — НЕ eligible (passport/OCI для KYC); Foreign Nationals — нет. Docs: Indian Passport. Process: appointments.uidai.gov.in → NRI Enrollment → Aadhaar Seva Kendra.

---

## Credit Exposure in Corporate Account Opening
RBI: использовать CRILC при открытии current accounts; NOC от существующих банков-кредиторов; ограничения для заёмщиков с кредитной экспозицией. Circular "Opening of Current Accounts by Banks – Need for Discipline": мониторинг ежеквартально; exposure = sanctioned fund + non-fund; >=₹50 crore — escrow; ₹5-50 crore — условия; <₹5 crore — без ограничений (с undertaking). На 31.12.2021 ~5,231 компаний с exposure ≥5 crore = NPA (CRILC). Банки: CRILC ежеквартально (крупные — чаще). **RBI Kavach пример:** при exposure ≥5 cr — клиент открывает current account если: (a) Total ≥5cr, SBI ≥10%, CCOD account, willing; (b) Total ≥5cr, SBI <10%; (c) Total ≥5cr или ≥50cr без CC/OD, SBI lending bank. Пример SBI→ICICI: депозит 10% в OD или FD. % клиентов с CA при exposure >5cr: HDFC 4-5%, ICICI 5-10%, SBI 5-7%. Exposure Agreement (ICICI declaration) + Additional T&C (Instant Account non-operational до KYC).

---

## Digital Banking Concept
Концепция: вместо eSign — VCIP (видео-биометрия V-KYC) + авто-проверки CKYC; ВНД: бумажные документы не нужны, заменяются сверками с гос. регистрами; скан достаточно при доп. запросе; OTP/биометрия для продукта/операций. MFA (know/have/are). Антифрод в фоне (Data Monitoring, Risk/Behavioral Scoring, Rule-Based).
**Продукты онлайн (сегменты Микро/Малый/Средний/Крупный):** Текущий счёт (депозит 50k INR, MAB 50k); Текущий-экспортный; Merchant Service (QR/link invoice = Standing Instruction, API Сбер платежи, до 200 Euro без тамож. сборов); Procurement Service (поиск контрагента в РФ, комиссия за реестр 1000 INR + сопровождение 1%); Liaison Services (offshore-account в СберРоссия); CC/OD, Term Loan, LC, BG, Supply Chain Finance, Export Packing Credit, Gold Bars. Рекомендации: пересмотреть Кредитную Политику (решение на уровне филиала до X сумм); пересмотреть ВНД для диджитализации.
**Digital Signing — DSC/eMudhra:** DSC (Class 1/2/3, USB token, ₹500-2000/год); используется для MCA/GST/DGFT/ICEGATE filings. **Aadhaar eSign vs OTP Authentication:** OTP = верификация личности (UIDAI Auth Reg 2016); eSign = юридически валидная подпись (PKI, IT Act Sec 3A, лицензир. eSign провайдер). Банки предпочитают Aadhaar eSign/OTP вместо DSC (проще, дешевле, RBI/UIDAI-backed). DSC нужен только для statutory filings/legal undertakings. RBI Digital Lending Guidelines 2022: ключевые док-ты (KFS, sanction letter, T&C) — eSign/DSC обязательно. Банки с Aadhaar eSign: ICICI/HDFC/Axis/SBI/YES.
**Digital Signing Policy (internal SOP draft):** типы — Simple Electronic Signature (scan/checkbox/clickwrap), Electronic Authentication (OTP/SMS, Aadhaar eKYC OTP), Digital Signature (DSC/Aadhaar eSign), Biometric, Physical. Risk-based: Low (Simple ES), Medium (OTP/eSign), High (DSC/eSign). Пороги задают Product Teams. RCSA matrix. Record retention 7 лет.
**Digital products for Corporate (Indian banks):** LC, Export Packing Credit, Advance Import Credit, Forfaiting, BG/Performance Bond, Bill Discounting, Export/Trade Finance, Remittances, FX hedging, Overdraft, Term Loan, Working Capital. ICICI/SBI/HDFC методы подписания (HS/eSign/scanned soft copy для HNI). Good practices: CC/OD, Term Loans, LC, BG, Supply Chain Finance, EPC, Advance Import Credit — через online bank + eSign Aadhaar OTP.

---

## Documents (OCR / per legal type / entity types & attributes)
**Documents_for_OCR:** полные чек-листы для Individuals (Proof of Identity, PAN, Signature, Photo; Form 60/FATCA/Customer Declaration; foreign nationals) и Entities (Company/LLP/Sole Prop/Partnership) — где загружается (Guest Zone tab), mandatory/optional, требования, инструкция RM. Physical Signed Original Documents to be sent to Bank (по типам ЮЛ). Individual accounts list (Sber пока не открывает физлицам). Ссылки: Documents Checklist for RM (CLDROBO), Online Onboarding Check List, Compare docs.
**Documents per legal type — BR Attributes:** атрибуты Board Resolution / Partnership Deed по типам ЮЛ (Sole Prop declaration, LLP designated partners resolution, Private/Public Ltd board resolution, Partnership) + required docs с источниками (ITD/MCA/GST/UIDAI/DGFT). BR samples: Full/Short V1, V2.
**List of entity types and attributes:** типы в Caldera (Corporate/Individual/Financial Institution); есть ли PAN/CIN, применим ли CKYC, доступен ли в Caldera/Online onboarding, Probe42 samples. Online onboarding: Private/Public Ltd, LLP, Sole Prop, Partnership. OPC = как Private Ltd + Nominee consent form (INC-3, KYC nominee обязателен по Companies Act Sec 3(1)). FPI categories I/II/III (SEBI). Список required docs по ~17 типам ЮЛ (mandatory/optional, scan/physical, Probe availability). FPI docs list. Attributes (одинаковы для всех ЮЛ, хранятся в CIF; Probe42 не покрывает Trust/Society/HUF/Gov/LO/BO/PO/IFSC/SNRR). + BNQ attributes.
**Online Onboarding Check List:** документы RM собирает по Company/LLP/Individuals + доп. при выборе + физические оригиналы + Internal Reports (OFAC/CRILC/BGV/LEI/IEC/GST/NCC/MCA) загружает RM в CIF.
**Temporary page:** дубль таблицы "List of documents for Entities uploaded online by Customer in CAF" + "uploaded by RM in CIF" (Forwarding Letter, Profile, OFAC, CRILC, BGV, LEI/IEC/GST/NCC/MCA reports, KYC Form).

---

## Email Notifications
Анализ best practices Indian banks (DBS/HDFC/RBL/AXIS) vs Sber India. Takeaways: salutation по имени (ок); header с brand colors/logo/nav links; footer disclaimer "system-generated, no reply"; RBL — unsubscribe; ссылки T&C/Privacy/Tax; TLS encryption (как у всех). Таблица AS-IS vs TO-BE для 15 Sber email-шаблонов (Online Onboarding ×2, Statement success/failure, Limit change, LCBD lead, login credentials, beneficiary action, FEMA mapping ×4, uploaded docs reject/approve, declarations). TO-BE: убрать "India", добавить "AD Category-I bank authorized by RBI", customer service +91 11400 48888, subscription signature.

---

## Offers and deals priority
Axioms: один активный процесс на продукт; offer = invitation с validity/status/source; приоритет source; deal (product) = goal. Priority matrix: 4 Manual In-Office; 3 Manual after call; 2 Targeted Marketing; 1 Mass Campaign. При равенстве — по дате создания (раньше = выше). Проблемы: воровство сделок; несколько сделок на current account (current + export). Links: BRD Offers, OFFER_STATUS_MAPPING.

---

## Project To-Do list / Task Tracker
**To-Do (статусы задач):** VKYC SOP (Yaroslav — done); Self-VKYC SOP + Risk Matrix + Signatory cross-check (Denis/Sandeep); Data verification sources/process (Sandeep); SOP acc opening (Sandeep/Denis); DVU process scenarios (Dima/Karan); BGV criteria (Karan — "боремся за отмену"); CRM part (Dima/Sasha/Vika/Sonya); BNQ (Denis); VCIP mockups; BR Operating Instruction (Sandeep/Denis/Tania); CRM/CallCenter; AS already onboarded (Yaroslav); Consents dashboard (Denis); auto account opening (Sandeep/Sandhya/Yulia); account types (Yulia); website landing (Alex); other legal types offline (Dima); Probe42 statistics BGV (Dima); IEC (Yaroslav).
**RM workload estimation:** ~4,025-4,145 мин/мес на RM (~8.5 рабочих дней). Checks per account (GST/PAN/IEC/NCC/OFAC/UDIN/CRILC/UDYAM/LEI/MCA + confirmation email) = 1,235-1,355 мин (2.6-2.8 дня); additional tasks (dormancy/ReKYC/closure/name change/signatories/migration/EDD/nomination/funding/audit) = 750 мин (1.56 дня); Internet banking tasks = 240 мин; uploading в Caldera = 1,800 мин (3.75 дня).
**Task Tracker (отдельная страница):** задачи World/Indian banks practices, потенциал <5cr, legal types docs, credit exposure regulatory, E2E process, exposure calculator, VCIP regs, account types, landing, digital banking regs/practices, monthly maintenance fees, signing methods.

---

## Статистика (BGV analysis / Clients 2026 / Risc analysis)
**Analysis for BGV (3681 completed IN clients):** COMPANY = 1956; >2 лет на момент открытия = 1575 (~80.5%); финотчётность 2+ года в Probe = 1521 (~77.8%). Proprietorships не имеют финотчётности в Probe (не обязаны MCA). No-BGV criteria coverage: >2 года ~80.5%, fin reports ~77.8%, PSU <0.5%, regulated FI <0.5%, listed —. Script (SQL по core_profile/cam_account_card/data_company_detail/DATA_COMPANY_FIN_REPORT).
**Clients 2026 (на 01.05, 632 клиента с первым счётом в 2026):** Partnerships 158, Proprietorships 150, Others 3, Companies 323. Companies >2 года 257, fin statements ≥2 года 230. Могут пропустить BGV: 233/632 (~36.9%). Доля Part+Prop растёт: 2024 45.4%, 2025 47.4%, 2026 48.7%.
**Risc analysis (на 03.06, 3882 клиента):** business segment breakdown (Manufacturing 1615, Trading 1318, Bullion dealers 141, Other 421…). Risk points: Vintage (1pt 1993, 2pt 97, 3pt 139); Residency (1pt 3802, 3pt 80); Company Type (1pt 3881, 3pt 1); Business segment (1pt 1886, 2pt 1373, 3pt 562). SQL script (+ business_segment из kyc.customer_kyc_details).

---

## Research on Initial Deposit Requirement
RBI не обязывает initial deposit для активации corporate current account, но банки включают funding как политику (intent, activation, deposit growth, viability). ICICI ₹10k-1M; Axis ₹7.5k-0.5M; HDFC мин ₹25k; SBI ₹5k-1M; YES ₹10k-1M (startup waivers); DBS ₹10k-0.7M (6 мес zero balance → QAB); Neo/Fintech (NIYO/RazorpayX/Jupiter) — часто без; Digital (DBS digibank/Kotak 811/Fi) — zero, потом MAB/QAB через 6 мес.

---

## Survey — Corporate Client Digital Banking Preference
Опросник (2 версии): тип бизнеса/сегмент; используется ли digital signing (DSC/Aadhaar eSign/checkbox/OTP); метод для продуктов; готовность к fully digital; продукты через fully digital (Current Account/Loans/OD/Trade/Forex/IB/GST/CMS/POS/Credit Card); где OTP-submission достаточно. Результаты (DSC/Digital Signing 03.2026): Happay (non-client) — не использует; Bruderer (non-client) — DSC для A2 forms/loans; Bitcipher — пока не срочно, для loans.

---

## Amendment To Board Resolution
Проблема (Internal Audit): internet banking активируется вопреки Mode of Operation в BR; пользователь может провести транзакцию сверх лимита. Встречи 12-13.11.25 (CRM/Ops/Legal/Customer support). Решение: добавить поле Limit в Caldera (на уровне счёта/клиента); для существующих клиентов — идентифицировать лимиты из AoF/BR (Customer support/аналитики); для новых — BR с явной секцией Internet Banking rights; email существующим клиентам (draft consent на BR); pop-up при превышении лимита "Transaction amount is more than the defined Limit". BRD: Flexible Limit Settings in Internet Banking (MVP).

---

## CRM Scenarios 1-7 (детали, дублируют 4.1)
**Scenario 1 Website Form** — пошаговый флоу (System create lead → search by PAN → Probe42 → autopopulate → CCO call/verify PAN/offer self-registration/reject) = идентично 4.1-CRM-Scenarios.md.
**Scenario 4 Self Registration** — детальный флоу: 00 Access Product (website CTA) → 01 New Registration (confirm entity type: Sole Proprietor/Partnership/LLP/Public Ltd/Private Ltd/None; если other country → lead в Sales) → 02 Enter Email + accept consents → 03 Email Verification (link expires X days; existing login → resume; new → mobile) → 04 Resume Login → 05 Enter Mobile → 06 OTP Auth (2FA → Unified Login ID) → 07 Receive login credentials → 08 Setup password → 09 Confirm + redirect to Guest Zone.
**Scenarios 2/3/5/6/7** (Incoming Call, Get Next, Branch Visit, RM Visit, IB Banner) — Prerequisites/Process Diagram/Description = TBD.

---

## Конкуренты (CJM)
**Account Opening - CJM:** глоссарий (CBE, Itsme, UBO, GSTIN, CIN, LLPIN, IEC, OIN, AMB, NMC, DNC/NDNC, BOI, AOP, US GIIN, EIN, NSDL). Списки документов для Private/Public Ltd и Sole Prop по банкам (AXIS/DBS/ICICI/SBI/RBL/YES). Детальные онлайн-флоу: **YES Bank** (форма → RM visit с планшетом → digital onboarding); **DBS** (онлайн-аппликация с автозаполнением по CIN/LLPIN/GSTIN, риск-опросник встроен, → RM visit); **SBI** (4 шага: online registration → print/sign → submit at branch → login; V-KYC только Sole Prop); **ICICI** (выбор последних 6 цифр номера счёта; Exposure Agreement + Additional T&C; → RM visit ~1 мин); **RBL** (фактически callback-форма → звонок <30 сек); **ING Netherlands** (полностью онлайн: Itsme + CBE; Personal/Company registration; branch selection; finalise). Takeaways: автозаполнение по CIN/LLPIN/GSTIN; встроенный риск-опросник; Exposure Agreement.
**World Banks Practice — Revolut (EU/Lithuania):** полностью онлайн. Шаги: country → legal type (Freelancer/Private Ltd/LLP/Limited Partnership/Public Ltd/Partnership) → email verification → mobile → passcode → authorizer personal data → company data (autopopulate из public DB) → T&C → role (director&shareholder / >25% / neither) → Account Activation (Business Address verify; Nature of Business questionnaire + supporting docs/FATCA; Business Details; Corporate Structure; Personal Identity 2 docs + V-KYC video commands; Plan & Card) → Account Opening. Для крупных действий — повторный быстрый V-KYC по фото.
**VTB Shanghai Branch:** не полностью digital (online application + offline meeting с RM). Online: Open Account → Large Business/SME → login/registration (email verify 60 мин) → New Application: Basic Information (country, reg number/date, name, revenue, importer/exporter, Russian counterparty + TIN), Capital/address, Business Details, UBO & Contact persons (Legal Rep, CFO, 2 callback), Shareholders (≥5%), Upload documents (Legal Rep Authorization, PoA RBS, business license, AoA, IDs + translation, Individual Consent Form, ownership structure до UBO >25%), T&C. Takeaways: рос. контрагент должен быть клиентом ВТБ; basic account открывается на следующий бизнес-день после регистрации (регистрация ~14 дней).

---

## Welcome Kit for Corporate Customers (Indian Banks)
DBS (debit card, cheque book, card holder, diary, water bottle); HDFC (premium rigid box, card/cheque book/welcome letter); ICICI (orange branded pouch); HSBC (luxury folder, card/welcome pack/RM contact); SBI (cheque book/debit card/welcome docs).

---

## Usefull links and info
VKYC IP and VPN Validation (страна India + VPN check; whitelist IP ISP по TRAI; таблицы IP-ranges → страны; банер VKYC Manager). Photo recognition by SmartBio SDK (AI/биометрия для Self-VKYC). Aadhaar Offline eKYC (XML file — второй способ, без online-запроса в UIDAI; QR/letter/PVC или electronic XML/mAadhaar). VKYC for Foreign Beneficiaries. Access Requests / тестовое окружение Online Onboarding.

---

## Task: incorrect inward messages marking (VTB SFMS) — отдельная задача
Проблема: ВТБ присылает некорректные платежи, неидентифицируемые как трансграничные; нет стандарта SFMS для признака трансграничности. Решение MVP (к 17 ноября): платежи от ВТБ на hold → алерт TBDD specialist → проверить payment details (additional info: ADVANCE, purpose code p103/p102) → идентифицировать как трансгран → запросить документы → Refer to compliance. Целевое (Q1 2026): транзакции анализируют SFMS → новая таблица с признаком трансграничности. SFMS поля где ВТБ шлёт инфо: <InstrInf>, <RmtInf>/<Ustrd>. Сравнение RTGS/NEFT/IMPS. (Прим.: не относится к онбордингу — попало в выгрузку.)

---

## Копия 1D - 2. VCIP (расширенная версия страницы 2)
Дубликат "1D - 2. VCIP (Personal Identification)" с теми же RBI-условиями (см. 2-VCIP-Personal-Identification.md) ПЛЮС детальный пошаговый VCIP Process Description (01-22 VCIP: link → Guest Zone OTP → location/IP/spoof checks → offline onboarding fallback → geo-tag → consent collection screen с 5 секциями → Aadhaar OTP accept → данные/фото из UIDAI → connection/audio/video checks → Verification of Identity Docs / Audio / Video sub-processes → auto-matching с docs/CKYCR/UIDAI) и Verification of Identity Documents Process (01-08 DOCS) и полная **Officer-assisted VKYC** таблица действий VKYC Officer в Jazz (Connection quality check; Client verification check — mobile/passport country/DOB; Documents check — signature/PAN front/back/address proof, screenshots vs CKYC; Submit result Complete/Mark as Failed; Report/Not Report → Compliance review → COMPLETE/BLOCKED). Открытые вопросы по каждому шагу (что если AS вне India, что если данные из UIDAI не получены, как проводить connection/audio тесты, атрибуты матчинга).
