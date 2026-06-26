# CRM — research рынка (бенчмарк лучших практик)

Автор: Марк (аналитик рынка CRM). Дата: 2026-06-26.
Вход: `docs/Разбор встречи — CRM одного окна 2026-06-25.md`, `docs/CRM — спецификация и фичи.md`, `docs/01`–`05` (To-Be процесс, India).
Назначение: дать Соне (CRM-продакт) и Льву (архитектор) доказательную базу под наш CRM «одного окна», чтобы он строился на проверенных паттернах, а не из головы. Advisory — код и финал фич не здесь.

---

## TL;DR

Наша концепция CRM «одного окна» (Company Profile → воронка Lead→Offer→Deal→Application + история + AI-сводка + поиск по PAN + обогащение из Probe42 + возобновление брошенной заявки) **совпадает с мейнстримом банковских CRM/CLM 1-в-1**: ровно эти блоки реализуют Salesforce FSC, Dynamics 365, Fenergo и nCino. Брать почти всё. Главные доказанные точки, которые надо явно усилить у нас: **(1) save-and-resume — это самый цитируемый дефицит индустрии** (только 22% банков его имеют, при 51–68% брошенных онбордингов), мы его уже заложили (C7) — это не «фича», а ядро ROI; **(2) граф связей Account↔подписанты↔UBO↔продукты** (паттерн Salesforce ARC) — у нас A5 сводка плоская, стоит подумать о связях; **(3) дедуп по идентификатору** — индустрия матчит по нескольким полям, мы матчим по одному PAN, что для India корректнее, но нужна обработка коллизий/несколько GSTIN. **Отклоняем для v1:** автономных AI-агентов (Agentforce/Copilot autonomous) — у нас AI-сводка рекомендательная, не действующая; и сложную omni-routing-телефонию — она в Caldera/банке, мы линкуемся. Развилки для Дениса помечены 🔶.

---

## Карта вендоров (кто за что отвечает в бенчмарке)

| Вендор | Класс | Зачем смотрим |
|---|---|---|
| **Salesforce Financial Services Cloud (FSC)** | горизонтальная CRM + банковский слой | эталон Account 360 + граф связей (ARC) + Onboarding Console + Einstein NBA |
| **MS Dynamics 365 (Customer Service / Contact Center)** | CRM + контакт-центр | эталон единого окна оператора, omnichannel, Copilot-сводка |
| **HubSpot** | SMB/mid CRM | эталон чистой воронки Lead→Lifecycle→Deal и разделения «статус лида» vs «стадия сделки» |
| **Zoho CRM** | универсальная CRM-сюита | эталон account/deal + телефония + Blueprint-процессы |
| **Pipedrive** | sales-CRM | эталон activity-based воронки (таски/звонки/встречи как ядро) |
| **Fenergo** | банковский CLM (KYC/KYB) | эталон корп-онбординга: single client view, reuse данных, regulatory rules 120+ юрисдикций |
| **nCino** | банковский CLM | эталон «single source of truth — не сдавать документ дважды», −80% времени онбординга |

---

## Главная таблица: паттерн × как у вендоров × применимость к нам × вердикт

| # | Паттерн | Как реализуют лидеры (с источниками) | Применимость к нам (India: Probe42, PAN/CIN, онбординг→оффер, ДВУ, ЕПК) | Вердикт |
|---|---|---|---|---|
| **1** | **Материнская сущность Account/Company + 360° view** | FSC: out-of-the-box модель данных объединяет счета, портфели, иерархии клиента/бизнеса и историю взаимодействий в единый 360°-вид «полного контекста до разговора» [S1, S9]. Fenergo: «enterprise-wide single client view — чистые, централизованные данные, переиспользуемые по всей организации» [B1]. nCino: «single source of truth, клиент не сдаёт документ дважды» [N1]. | Прямое попадание. Наш **Company Profile (A1)** = их single client view. Primary-атрибуты (тип, название, PAN, Registered Address) = минимум для ЕПК [Д2]. 360° = подписанты+продукты+цифровой след (A5). | **ВЗЯТЬ.** Это и есть фундамент. Подтверждено всеми тремя классами вендоров. |
| **2** | **Граф связей (account ↔ люди ↔ владение ↔ продукты)** | FSC **Actionable Relationship Center (ARC)**: интерактивный граф «people, households, influence networks» — раскрывает ownership/relationship strength, «сложные корпоративные структуры», вскрывает скрытые связи → новые сделки и риски [S2, S5, S7]. | У нас A5 — **плоская** сводка (подписанты/продукты списком). В India корп-онбординг = мульти-подписант + UBO (BOV-check, doc 02) + governance смены подписантов (doc 03). Связи «компания→подписант→UBO» естественны. | **АДАПТИРОВАТЬ.** Полноценный граф — overkill для v1, но связь Company↔Signatory↔UBO стоит заложить в модель данных уже сейчас (не плоский список). 🔶 Развилка Дениса: рисуем ли мини-граф связей в карточке или оставляем секции-списки в v1. |
| **3** | **Воронка Lead→Opportunity→Deal + связь с заявкой (Application)** | HubSpot: разделяет **Lifecycle stage** (где в пути), **Lead status** (квалификация) и **Deal stage** (реальная сделка); рекомендация — «держать квалификацию в Lead status, чтобы Deal stages были чистыми, только реальные сделки» [H1, H5]; авто-создание Deal при конверсии контакта в opportunity [H1]. Pipedrive: визуальный pipeline по стадиям [Z2]. Zoho: lead/contact/account/deal + Blueprint-процессы стадий [Z1]. | Наша цепочка **Lead→Offer→Deal→Application** (C1–C6) шире рынка на одно звено (Application = заявка-онбординг). Это **оправдано**: у нас заявка живёт отдельно (self-reg / онлайн-банк) и имеет свой жизненный цикл (online/offline-mode, active/abandoned/rejected). | **ВЗЯТЬ + адаптировать терминологию.** Наш «Offer» = их Opportunity. Урок HubSpot: **не смешивать квалификацию со стадией** — у Lead держать статус-квалификацию, у Deal — чистые стадии. Application — наша банковская специфика, у вендоров аналога нет (гипотеза: ближе всего FSC «product request / account opening» [B-impl]). |
| **4** | **Единое окно оператора КЦ + менеджера (omnichannel, телефония, таски/активности)** | Dynamics **Copilot Service workspace**: одно рабочее место, до 9 одновременных сессий, голос/чат/SMS/Teams/соцканалы без потери контекста [D4, D6]; **intelligent routing** — AI+правила распределяют обращения по навыкам/приоритету [D-route]. Pipedrive: **activity-based selling** — звонки/встречи/таски как ядро воронки [Z2]. Zoho: omnichannel (email/телефония/чат/web-forms) [Z1]. | У нас **один менеджер + оператор КЦ в одном окне** (B1). UC-1: входящий звонок → поиск по PAN → история+сводка. Таски/звонки/встречи «аля Битрикс» (F1–F3) = ровно Pipedrive activity-модель. **НО**: омни-routing и телефония-движок живут в Caldera/банке. | **ВЗЯТЬ единое окно + activity-модель (таски/звонки/встречи).** **ОТКЛОНИТЬ (для нашего скоупа) сам routing/телефонию** — это инфраструктура банка, мы линкуемся (J1/J2: «Sales живёт своей логикой»). Одновременные мульти-сессии — не нужны прототипу. |
| **5** | **Next-best-action / AI-ассист / summary оператору** | Salesforce **Einstein NBA**: «смотрит, что происходит сейчас → даёт чёткий следующий шаг (follow-up / escalate / call)», показывается в Omni-консоли и скриптах агента [S-nba1, S-nba2]. Dynamics **Copilot**: суммаризация прежних взаимодействий, suggested responses, conversation summary в реальном времени [D4, D-cop]. Agentforce: live-ассист — suggested responses + knowledge + NBA по ходу разговора [S-agf]. | Наш **AI Summary рекомендательное (E1, E2)**: ВЭД-активность + задолженность перед банковской системой (из Probe + история) → помогает оператору и ведёт к офферу/сделке. Это ровно «summary + NBA», но **рекомендательное, не автономное** — установка из разбора («помогает оператору в коммуникации»). | **ВЗЯТЬ рекомендательное summary + лёгкий NBA** («предложи возобновить заявку», «предложи оффер по продукту X»). **ОТКЛОНИТЬ автономных AI-агентов (Agentforce/Einstein Service Agent autonomous)** [S-agf2] — наш AI советует, действие за человеком. В v1 — заглушка (как в спеке, §7). |
| **6** | **Статус и возобновление незавершённых/брошенных заявок (save-and-resume)** | Индустрия: **51% бросают цифровое открытие счёта** (≈$3.8M/год потерь на 50k целевых) [R1]; 60–68% drop-off в онбординге [R-fb]; ключевая причина — **нет save-and-resume**, и его имеют **только 22% банков** (14% в Европе) [R-fb, R-lumin]; лучшая практика — «пауза и возобновление across devices, в т.ч. подхватить с банкиром в колл-центре/отделении» [R-merid]. | Наш **C7 (возобновление брошенной заявки)** + UC-1/UC-4: оператор по PAN видит брошенную заявку, её стадию/тип/коммуникации, таск «завис» → предлагает возобновить. Столбец **Application** в списке клиентов (B3) = статус-трекинг. | **ВЗЯТЬ — это не «фича», а ядро ROI.** Доказательно самый дефицитный паттерн рынка и прямой ответ на нашу боль (5–7 дней → 1 день, doc 01). Усилить: статус Application виден И в списке (B3), И в карточке, И ведёт к действию «возобновить». Подхват «оператор продолжает за клиента» = ровно best-practice «pick up with a banker». |
| **7** | **Обогащение из внешних регистров (аналог Probe42)** | Все банковские CLM строятся на внешнем обогащении: Fenergo — KYC/KYB workflows, regulatory rules для 120+ юрисдикций [B1, B2]; FSC Discovery Framework собирает и оценивает данные клиента цифровыми и людскими каналами [S-disc]. Горизонтальные CRM: «enrichment = авто-дополнение записей из внешних источников (firmographics, signals)» [E-rich]. | Наш **G2 (авто-profile из Probe42)** + doc 02 (Probe42, NSDL/PAN, CRILC, OFAC, CKYC). Probe42 = наш registry-enrichment. UC-2(б): не найдено → завести профиль → Probe42 авто-заполнение. | **ВЗЯТЬ.** Прямое попадание, у нас уже спроектировано. Урок Fenergo/nCino: обогащённые данные **переиспользуются** (не сдавать дважды) — наш Company Profile должен быть single source, ЕПК тянет из него (A2/A3). |
| **8** | **Дедупликация по идентификатору (аналог PAN)** | Best-practice: «надёжный уникальный идентификатор записи, single source of truth, GUID где возможно» [E-dedup1]; для B2B матч обычно **по нескольким полям** (name+domain+phone+email) [E-dedup2]; продвинутые — Levenshtein/фонетика/N-gram против вариаций имени [E-dedup3]; enrichment из внешних источников **сам плодит дубли** (вариантные имена) — хорошие платформы проверяют существование записи перед добавлением [E-dedup4]. | Наш **B2 (поиск/ключ по PAN)** + Д2 (PAN — обязательный ключ). India: PAN — **сильный гос-идентификатор**, поэтому матч по одному полю надёжнее, чем B2B-домен на Западе. CIN условный (нет у Sole Proprietor), GSTIN бывает несколько [Д2]. | **ВЗЯТЬ матч по PAN как первичный ключ** (для India это корректнее «нескольких полей»). **АДАПТИРОВАТЬ обработку коллизий:** что если Probe42 вернул вариантное название при том же PAN (merge, не дубль — урок [E-dedup4]); как искать когда PAN ещё нет (телефон — G1). 🔶 Развилка Дениса: правила слияния при конфликте Probe-данные vs введённое вручную. |

---

## Что отклоняем и почему (явный список)

| Отклонено | Почему не берём |
|---|---|
| **Автономные AI-агенты** (Salesforce Agentforce / Einstein Service Agent autonomous [S-agf2]) | Наш AI рекомендательный (установка из разбора 25.06). Действие — за человеком-оператором. Автономность — регуляторно/доверительно преждевременна для банковского онбординга в прото. |
| **Собственный omni-channel routing + телефонный движок** (Dynamics intelligent routing [D-route]) | Инфраструктура банка/Caldera. Мы — «одно окно» поверх, линкуемся (J1/J2). Строить роутинг = выход за скоуп. |
| **Мульти-сессионность оператора** (Dynamics, до 9 сессий [D4]) | Не нужно прототипу; усложняет без ценности для демо вижна. |
| **Marketing automation / CPQ / inventory** (Zoho-сюита [Z1]) | Вне задачи онбординга юрлиц. |
| **Дедуп по нескольким полупустым полям** (B2B name+domain+phone [E-dedup2]) | У нас есть сильный гос-ключ PAN — матч по нему чище. Многополевой матч решал бы отсутствие такого ключа. |

---

## Развилки для обсуждения с Денисом (🔶)

1. **Граф связей vs плоские секции (паттерн #2, ARC).** Рисуем ли в карточке мини-связи Company↔Signatory↔UBO↔Product (как Salesforce ARC) или оставляем секции-списки в v1? Рекомендация Марка: модель данных закладывать со связями сразу, UI — списки в v1, граф позже.
2. **Правила слияния при дедупе (паттерн #8).** При конфликте «Probe42 вернул одно название, оператор ввёл другое при том же PAN» — что master? Best-practice: merge, не дубль; но кто master-поле — решение Дениса/Льва.
3. **Терминология воронки.** Наш «Offer» = рыночный «Opportunity». Урок HubSpot — не смешивать квалификацию (Lead status) и стадию (Deal stage). Зафиксировать, что у Lead держим статус-квалификацию, у Deal — чистые стадии (закрывает OQ-3/OQ-4 частично).
4. **Application как сущность без рыночного аналога.** У вендоров нет прямого «Application» — это наша банковская/India-специфика (self-reg + онлайн-банк, online/offline-mode, ДВУ). Гипотеза: ближе всего FSC «product request/account opening». Стоит сверить с Марго, что моделируем её как отдельную сущность, а не стадию Deal.

---

## Источники

Salesforce FSC / Einstein / Agentforce:
- [S1] FSC for Sales — 360 / unified context: https://www.salesforce.com/financial-services/cloud/sales/
- [S2] Actionable Relationship Center (ARC) overview: https://help.salesforce.com/s/articleView?id=ind.fsc_arc_overview.htm&language=en_US&type=5
- [S5] ARC admin overview: https://help.salesforce.com/s/articleView?id=sf.fsc_admin_arc_overview.htm&language=en_US&type=5
- [S7] ARC explainer (Hello Kloud): https://hellokloud.com/fsc-actionable-relationship-center/
- [S9] Customer 360 in banking with Salesforce: https://www.nexgenarchitects.com/blog-posts/customer-360-view-banking-salesforce
- [S-nba1] Einstein Next Best Action (что это / примеры): https://routine-automation.com/blog/what-is-next-best-action-in-salesforce/
- [S-nba2] Einstein NBA (Salesforce help): https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_nba.htm&language=en_US&release=236&type=5
- [S-agf] Agentforce (live-ассист, NBA): https://www.salesforce.com/agentforce/
- [S-agf2] Einstein Service Agent (автономный): https://www.salesforce.com/news/stories/einstein-service-agent-announcement/
- [S-disc] ARC/Discovery Framework для ретейл-банкинга (Trailhead): https://trailhead.salesforce.com/content/learn/modules/custom-arc-graphs-in-financial-services-cloud/get-started-with-the-customizable-actionable-relationship-center

MS Dynamics 365:
- [D4] Copilot Service workspace overview: https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/csw-overview
- [D6] Copilot Service workspace (Contact Center): https://learn.microsoft.com/en-us/dynamics365/contact-center/use/ccw-overview
- [D-route] Dynamics 365 Contact Center (intelligent routing, обзор): https://www.randgroup.com/insights/microsoft/dynamics-365/customer-engagement/customer-service/the-complete-guide-to-dynamics-365-contact-center/
- [D-cop] Configure Copilot agent in Contact Center: https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-bot-virtual-agent

HubSpot / Zoho / Pipedrive (воронка, activity, телефония):
- [H1] HubSpot lead/lifecycle/deal stages working together: https://blog.saascrm.io/hubspot-lead-stages-lifecycle-stages-and-deal-stages-working-together
- [H5] Mapping sales process (lifecycle/lead status/deal stages): https://www.hq-digital.com/blog/mapping-your-sales-process-101-hubspot-lifecycle-stages-lead-statuses-and-deal-stages
- [Z1] Pipedrive vs Zoho (фичи Zoho: account/deal/omnichannel/Blueprint): https://zapier.com/blog/pipedrive-vs-zoho/
- [Z2] Pipedrive (activity-based selling, pipeline): https://www.pipedrive.com/en/crm-comparison/pipedrive-vs-zoho

Банковский CLM (Fenergo / nCino):
- [B1] Fenergo — commercial & business banking (single client view, KYC/KYB): https://www.fenergo.com/segments/commercial-and-business-banking
- [B2] Fenergo CLM (regulatory rules 120+ юрисдикций): https://www.fenergo.com/client-lifecycle-management
- [N1] nCino CLM (single source of truth, не сдавать дважды, −80% времени): https://www.ncino.com/solutions/client-lifecycle-management

Save-and-resume / брошенные заявки:
- [R1] Banking digital account abandonment ($3.8M, 51%): https://unfairgaps.com/us/banking/lost-deposit-revenue-from-abandoned-digital-account-opening
- [R-fb] The Financial Brand — >50% бросают, save-and-resume только 22%/14%: https://thefinancialbrand.com/news/bank-onboarding/more-than-half-of-customers-abandon-account-opening-how-to-take-back-control-of-the-process-191691
- [R-lumin] Lumin Digital — application abandonment: https://lumindigital.com/insights/struggling-with-bank-application-abandonment-heres-what-you-can-do/
- [R-merid] MeridianLink — combat application abandonment (omnichannel pick-up): https://www.meridianlink.com/blog/digital-lending-3-tips-to-help-fis-combat-application-abandonment-november2022/

Enrichment / дедуп:
- [E-rich] CRM data cleanup & enrichment guide: https://www.datablist.com/how-to/clean-enrich-refresh-data-crm
- [E-dedup1] Eliminating duplicates / unique IDs / single source of truth: https://www.stacksync.com/blog/eliminating-duplicate-records-when-you-sync-crm-systems-best-practices-for-clean-data
- [E-dedup2] Cognism — customer data deduplication (многополевой матч): https://www.cognism.com/blog/customer-data-deduplication
- [E-dedup3] Databar — duplicate record management (Levenshtein/phonetic): https://databar.ai/blog/article/duplicate-record-management-in-crm-the-hidden-revenue-killer-and-how-to-fix-thousands-fast
- [E-dedup4] Databar — dedup + enrichment (внешние источники плодят дубли): https://databar.ai/blog/article/crm-deduplication-and-data-enrichment-know-the-difference-when-you-need-both

> Пометки: [B-impl] — «seamless account opening / product request» у Fenergo выведено из страницы сегмента, не названо явным термином (гипотеза маппинга на наш Application). Связка «Offer=Opportunity», «Application≈product request/account opening» — аналитический маппинг Марка, не цитата вендора.
