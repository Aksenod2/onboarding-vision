# Карта стыковок онбординг × CRM × DVU

Автор: Лев (solution-архитектор CRM-трека). Дата: 2026-06-26.
Сведено из: `01–05` (To-Be процесс), `Разбор встречи — CRM одного окна 2026-06-25.md`, `CRM — спецификация и фичи.md`, кода онбординга `app/src/screens/v2/company/*` + `app/src/mock/v2/company*`, кода CRM `app/src/crm/*`.

---

## TL;DR

Сквозной флоу заведения компании = **11 этапов**. CRM подключается всего в **двух точках входящих событий** (PAN-поиск читает Probe + завершение онбординга шлёт `onboarding.completed`), плюс асинхронные `application.stage-changed` и `dvu.result` — это и есть граница микросервиса (узкий контракт из 3 событий, уже в коде `crm/types/events.ts`). DVU подключается на **семи этапах** как exception-обработчик: любой провал авто-проверки (Probe/CRILC/OFAC/CKYC), ручная правка reg-полей/директоров/UBO, обратный запрос документа, и selfVKYC-фейл. **Две дырки закрыл по To-Be схеме (doc 05) и коду:** (5) подписанты+BR — DVU включается **только при ручной правке** состава/данных (по умолчанию из Probe — DVU не нужен); (8) VKYC — **гибрид**: selfVKYC автоматический (AI/eKYC/JAZZ), DVU подключается **только на фейле** (F2F/meeting-review). Главный риск изоляции — этап 2 (CRM читает Probe42 синхронно — это **не** событие, а отдельная зависимость-чтение, не нарушает одностороннее зеркало).

---

## Матрица стыковок по этапам

Легенда направлений: `→` исходящее из онбординга; `←` входящее в онбординг; `⇄` запрос-ответ (синхронно). CRM-экран — какой mock-экран прототипа задействован (`crm/screens/*`).

| # | Этап | Что в онбординге | → CRM (событие/данные, направление) | → DVU (триггер/проверка) | Зависимость / контракт | CRM-экран |
|---|---|---|---|---|---|---|
| **1** | **Вход** (Aadhaar / self-registration) | `CompanyAadhaar` → eKYC инициатора (UIDAI, 5 полей), passcode. Создаётся prospect/person. Точка входа — Aadhaar-авторизация | **Зеркало:** при self-reg без оператора — авто-profile (H4). Старт онбординга = `application.created` (пока **НЕ в контракте**, см. ОВ-2). Источник = `self-registration` | eKYC Aadhaar — авто (UIDAI). DVU **не** включается на happy-path. To-Be: «N time without actions → event for communication» — таймер бездействия | CRM ждёт от онбординга факт старта заявки, чтобы показать «брошенную» (этап 10). Сейчас в коде контракта события старта нет — **развилка для Кости** | CrmSearch (если оператор инициировал) / CreateProfile |
| **2** | **PAN → Probe42** | `CompanyBnqDialog` нулевой шаг: ввод PAN + Registry-consent → авто-fetch entity-данных. Параллельно банк-скрининг (NSDL/OFAC/CRILC/Probe42) | **⇄ Probe42 — read-only, ОБЩИЙ источник.** CRM при поиске по PAN тоже читает Probe42 (G2, авто-заполнение профиля). Это **не** событие онбординг→CRM, а независимое чтение обоими | **Probe42 fetch fail → Alert DVU OBO** (doc 02 §1, шаг 03). **CRILC > 10 Cr / fail → Alert DVU**. **OFAC alert → Route DVU/Compliance**. **CKYC not found/mismatch → Alert DVU** | **Критично для изоляции:** PAN — общий ключ. CRM и онбординг **независимо** читают Probe42 по PAN (синхронно), не друг через друга. Контракт CRM↔Probe = sync read (спека §6) | CrmSearch (поиск по PAN, B2) / CreateProfile (Probe42 auto, G2) |
| **3** | **Опросник** (резидентство/FATCA/IEC/кредит/AS) | `CompanyBnqDialog`: бизнес-блок → compliance-блок. Риск-категория. `triggered:'CRM'` на Q7 (план кредита), `triggered:'DVU'` на Q11 (IEC upload) | **Q7 `triggered:'CRM'`** — интерес к кредиту → сигнал для оффера/лида в CRM (мэппинг на будущий Lead/Offer по продукту credit). Сейчас это поле сида, события в контракте **нет** (см. ОВ-3) | **Q11 `triggered:'DVU'`** — IEC загружен вручную → DVU-проверка документа (ВЭД). Doc 04 BOV: High-Risk по BNQ → BOV/DVU | CRM ждёт сигнал «интерес к продукту» для авто-лида. Контракт: `lead.signal`? — **отсутствует, развилка для Дениса** (нужен ли проактивный лид из опросника или только финальный авто-оффер) | — (нет прямого CRM-экрана; данные осядут в профиле после `onboarding.completed`) |
| **4** | **Company Details + правка reg-полей** | `CompanyConfirm`: обзор данных из Probe (название/CIN/адрес/директора/UBO/доки). Правка reg-поля → upload supportive doc. `confirmCompanyData()` | Нет прямого события. Финальные данные уедут снимком в `onboarding.completed` (этап 9) | **Ручная правка reg-поля / состава директоров / UBO → `modified` → DVU OBO** (doc 05 шаг 003.01 «Create DVU task если меняется блок данных»). Код: `directorsModified`, UBO `modified`, `submitFieldDocument` | CRM не участвует синхронно. DVU OBO-петля: `Document request → проверка → Mark valid → Resolve` (doc 05). Онбординг ждёт от DVU resolve, чтобы блок стал valid | — |
| **5** | **Подписанты + Board Resolution** | `CompanySignatoriesBr`: AS назначен в опроснике (read-only здесь), BR шаблон банка / свой. `confirmBoardResolution()` → инвайты уходят авто (#52) | Нет события в момент BR. Состав подписантов уедет в снимке `onboarding.completed`. AS/подписанты → поле профиля `подписанты` (спека §3) | **ВЕРДИКТ (выс. увер.): DVU включается ТОЛЬКО при ручной правке.** Подписанты/директора из Probe (`source:'registry'`) → DVU **не** нужен. BR `template:'own'` (загрузка своего) → DVU (`companyTypes.ts:106` «own = DVU, out of scope»). Правка состава → `modified` → DVU OBO (как этап 4). PAN-сверка подписанта с BR — на VKYC (doc 02 §3), не здесь | Онбординг ждёт DVU resolve только если был upload/правка. Happy-path (Probe + bank-template) — без DVU | — |
| **6** | **Confirm + рассылка инвайтов** | `confirmBoardResolution()` ставит `inviteSent:true` всем phase-B подписантам (#52, отдельного шага нет). Логины + VKYC + Aadhaar-QR (doc 05 шаг 005) | Нет события. (Возможный `application.stage-changed → identification` — **не реализован**, ОВ-2) | DVU **не** на happy-path. Инвайты — системная рассылка | Контракт мог бы слать `stage-changed: data-collection→identification`. Сейчас отсутствует — **развилка для Кости**: нужны ли промежуточные stage-события или CRM зеркалит только финал | — |
| **7** | **Дашборд / статусы блоков** | `CompanyDashboard` + `getApplicationBlocks()`: Company details / Signatories&BR / Personal Identification (VKYC-агрегат) / Signing (агрегат). Action Required если `dvuRequest.status==='requested'` | **Зеркальность (H1):** прогресс блоков — кандидат на `application.stage-changed`. Сейчас дашборд читает локальный state, в CRM не шлёт | Блок «Данные компании» → `action-required`, когда **банк (DVU) запросил документ** (`dvuRequest`, #62). Это **входящий** триггер DVU→онбординг | **Контракт ← DVU→онбординг:** обратный запрос документа. В CRM это отразится как `dvu.result: more-info`. Двунаправленность DVU (в онбординг — запрос, в CRM — факт) | CompanyProfile (если оператор смотрит статус заявки по этому профилю — столбец Application, B3) |
| **8** | **Сессия подписанта** (consents / VKYC / DSC) | Цепочка `consents→aadhaar→(pan)→vkyc→dsc-sign→done`. `passSignatoryVcip`, `signByDsc`. selfVKYC (JAZZ). DSC-подпись ПОСЛЕ VKYC (#35) | **Зеркало (H1):** `stage: identification → signing`. Сейчас не шлётся (ОВ-2) | **ВЕРДИКТ (выс. увер.): VKYC — ГИБРИД, не чистый DVU.** selfVKYC = **автомат** (AI-assisted, Aadhaar eKYC, интеграция JAZZ, doc 05/01 шаг 09). DVU подключается **ТОЛЬКО на фейле**: `eKyc passed? No → selfVKYC → Passed? No → DVU meeting review / DVU schedule F2F` (doc 05 VKYC-подпроцесс). Также PAN-mismatch на VKYC → Alert DVU (doc 02 §3) | DVU VKYC-дорожки (встреча + сессии) активируются по событию фейла. Онбординг ждёт от DVU `VKYC complete`. CRM получит `dvu.result` | CompanyProfile (мониторинг) |
| **9** | **Финал: счёт открыт** | Все phase-B done → `recomputeCompletion()` → `status:'Completed'`. `getBankAccount` (frozen до 1-го входа). To-Be шаг 009 Account opening trigger → CAM | **→ `onboarding.completed` (ГЛАВНОЕ событие).** Контракт: `crm/types/events.ts:OnboardingCompletedEvent` → find-or-create profile по PAN + авто-Offer (current-account дефолт) + Application(completed) + history (H2/UC-3). Ссылка-из-оффера (I1) | KYC auto-checks (AML/sanctions) на финале (doc 01 шаг 12) → fail → Alert DVU KYC. BOV (физпроверка) — если new/suspicious company (doc 02 §4) | **Главный контракт изоляции.** Реализован: `adapter/ingest.ts:handleOnboardingCompleted`. Онбординг (продьюсер) → шина → CRM (consumer). Одностороннее зеркало | CompanyProfile (после ingest появляется профиль с оффером/заявкой) |
| **10** | **Брошенная заявка** | Онбординг прерван (таймер бездействия, doc 05 «N time without actions»). Кейс висит не-done | **← `application.stage-changed: status='abandoned'`** (UC-4, C7). Контракт: `ApplicationStageChangedEvent`. CRM: таск «завис» + кнопка возобновить. Реализовано `handleApplicationStageChanged` | DVU **не** обязателен. (Спека OQ-9: кто работает с брошенными — открыто; предполож. под-роль DVU/оператор) | **Контракт ← онбординг→CRM:** факт «заброшено». Развилка ОВ-1: кто триггерит abandoned (таймер онбординга? ночной батч?) — для Кости | CompanyProfile (возобновление, C7) / CrmSearch (виден статус в столбце Application) |
| **11** | **Банк запросил догрузку** | `dvuRequest` на дашборде, блок → `action-required`. `uploadDvuDocument()` → `status:'uploaded'` (#34) | **← `dvu.result: more-info`** в CRM (отметка + история). Контракт: `DvuResultEvent`. Реализовано `handleDvuResult` | **DVU→онбординг (входящий запрос) + DVU→CRM (факт).** DVU OBO-петля: запрос → клиент грузит → DVU проверяет → resolve | Двойной контракт: (а) DVU→онбординг = обратный запрос документа (в коде онбординга `dvuRequest`); (б) DVU→CRM = `dvu.result`. **Развилка ОВ-4: это один источник истины (DVU) с двумя подписчиками, или онбординг проксирует?** | CompanyProfile (история DVU-результата) |

---

## Сводка по контрактам-зависимостям

### A. Входящие В CRM (реализованы в `crm/types/events.ts` + `adapter/ingest.ts`)

| Событие | Триггер-этап | Что делает в CRM | Статус кода |
|---|---|---|---|
| `onboarding.completed` | 9 | find-or-create profile (по PAN) + авто-Offer + Application + history | ✅ реализовано |
| `application.stage-changed` | 6, 8, 10 | обновляет stage/status заявки + history | ✅ реализовано (но онбординг **не шлёт** промежуточные стадии — только концепт) |
| `dvu.result` | 11, +фейлы 2/8 | отметка + запись в историю | ✅ реализовано (входящее принимаем) |

### B. Чтения / sync-зависимости (НЕ события, отдельный канал)

| Канал | Этап | Направление | Примечание изоляции |
|---|---|---|---|
| Probe42 read | 2 | CRM ⇄ Probe42 (sync) | **CRM читает Probe НАПРЯМУЮ**, не через онбординг. Не нарушает одностороннее зеркало. Общий ключ — PAN |
| ЕПК / ПАУС передача | (после 9) | CRM → ЕПК (исходящий) | OQ-7, отдельный адаптер позже. Вне текущего контракта |

### C. DVU как exception-обработчик (двунаправлен относительно онбординга, односторонен к CRM)

| Триггер | Этап | Направление | Контракт |
|---|---|---|---|
| Probe/CRILC/OFAC/CKYC fail | 2 | онбординг → DVU | внутренняя петля онбординга (DVU OBO/KYC-дорожки) |
| Правка reg-поля / директора / UBO | 4, 5 | онбординг → DVU | `modified` флаг → DVU OBO task (doc 05 шаг 003.01) |
| BR `own` upload / IEC upload | 3, 5 | онбординг → DVU | загрузка документа → ручная проверка |
| selfVKYC fail / PAN-mismatch | 8 | онбординг → DVU | DVU VKYC-дорожки (meeting/F2F) |
| Обратный запрос документа | 7, 11 | **DVU → онбординг** | `dvuRequest` в state онбординга |
| Результат проверки DVU | 11, +фейлы | **DVU → CRM** | `dvu.result` событие |

---

## Две закрытые дырки (вердикты)

### Дырка 5 — Подписанты + BR: включается ли DVU?
**Вердикт (высокая уверенность):** DVU включается **условно, не по умолчанию**.
- Подписанты/директора подтянуты из Probe42 (`source:'registry'`) → проверка реестром = автомат, DVU **не** нужен.
- DVU триггерится ТОЛЬКО при: (а) ручной правке состава/данных подписантов или директоров (`directorsModified`/`modified` → DVU OBO, doc 05 шаг 003.01); (б) загрузке **своего** BR вместо шаблона банка (`template:'own'` → «DVU, out of scope», `companyTypes.ts:106`); (в) ручном добавлении UBO.
- Сверка «кто пришёл на VKYC = кто в BR» (PAN-идентификатор, `asNewPan` обязателен #58) выполняется **на этапе 8 (VKYC)**, не на этапе 5. Mismatch → Alert DVU (doc 02 §3).
- **Итог для карты экранов:** на happy-path этап 5 не порождает DVU-задачу и не трогает CRM; CRM узнаёт состав подписантов снимком в `onboarding.completed` (этап 9).

### Дырка 8 — VKYC: ручная DVU или автомат?
**Вердикт (высокая уверенность):** VKYC — **гибрид с автоматом по умолчанию**.
- **selfVKYC = автомат:** AI-assisted, на базе Aadhaar eKYC, интеграция **JAZZ** (doc 05 VKYC-подпроцесс; doc 01 шаг 09 «AI-assisted VCIP»). Код: `passSignatoryVcip` → `status:'Passed'` без участия DVU.
- **DVU подключается ТОЛЬКО на фейле:** `eKyc (Aadhaar) passed? No → Create selfVKYC → Passed? No → DVU meeting review` ИЛИ `DVU task to schedule and provide VKYC/F2F session` (doc 05). То есть DVU = эскалация при провале автоматики или при выборе F2F.
- Дополнительный DVU-триггер: PAN-mismatch при OCR PAN-карты на VKYC (doc 02 §3 шаг 05/06).
- High-Risk категория/индустрия → обязательное одобрение CRM Head (doc 01 VCIP) — это не DVU, а отдельный апрув.
- **Итог:** в прототипе VKYC показываем как автоматический под-статус (`vkycSubStatus`); DVU-ветку моделируем как exception, не как основной путь.

---

## Открытые вопросы / развилки

| # | Вопрос | Кому | Влияние на изоляцию |
|---|---|---|---|
| **ОВ-1** | Кто триггерит `abandoned` (этап 10) — таймер внутри онбординга или ночной батч/CRM-сторона? | Денис / Костя | Определяет, продьюсер ли онбординг для этого события или CRM сам деградирует заявку |
| **ОВ-2** | Шлёт ли онбординг **промежуточные** `application.stage-changed` (data-collection→identification→signing→bank-review), или CRM зеркалит **только финал** `onboarding.completed`? | Денис | Объём контракта: 1 финальное событие vs стрим стадий. Сейчас код принимает stage-changed, но онбординг его не эмитит |
| **ОВ-3** | Нужен ли проактивный `lead.signal` из опросника (Q7 `triggered:'CRM'`, интерес к кредиту) — ДО завершения онбординга? Или лид/оффер рождается только на финале? | Денис | Новое 4-е событие в контракте. Сейчас `triggered:'CRM'` — мёртвое поле сида, в адаптер не идёт |
| **ОВ-4** | DVU-результат (этап 11): один источник истины (DVU) с двумя подписчиками (онбординг + CRM), или онбординг проксирует в CRM? | Костя | Определяет, кто продьюсер `dvu.result` — DVU-сервис напрямую или онбординг-адаптер |
| **ОВ-5** | `application.created` (этап 1, старт заявки) — нужен ли в контракте, чтобы CRM видел заявку ДО завершения (для «брошенных» и live-мониторинга оператором)? | Денис / Костя | Если да — CRM получает заявку рано (этап 1), а не на финале. Меняет, когда профиль появляется в CrmSearch |
| **ОВ-6** | CRM↔Probe42 (этап 2): подтверждаем, что CRM читает Probe **напрямую** (не через онбординг-API)? Иначе появляется скрытая зависимость CRM→онбординг | Костя | Прямое чтение сохраняет изоляцию; чтение через онбординг её ломает |

---

## Что это даёт визуальной карте экранов прототипа

- **CrmSearch** — задействован на этапах 2 (поиск по PAN), 10 (виден статус Application в столбце).
- **CompanyProfile** — этапы 7, 8, 9, 10, 11 (агрегатор: появляется/обновляется после `onboarding.completed`, показывает воронку, историю DVU, возобновление брошенной).
- **CreateProfile** — этапы 1, 2 (оператор завёл профиль вручную: телефон / Probe42 auto).
- Этапы 3–6 — **чисто клиентский онбординг (зелёная зона)**, CRM-экрана нет; данные осядут в CRM снимком на этапе 9. Это и есть граница: CRM не лезет внутрь онбординга, получает результат.
