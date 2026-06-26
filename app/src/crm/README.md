# CRM-микросервис (`app/src/crm/`)

Изолированный модуль CRM «одного окна» (роль RM / колл-центр). На MUI v5, под `/rm/crm/*`.
Решение Дениса 25.06: CRM = микросервис, не течёт в онбординг/ДВУ.
Спека: `docs/CRM — спецификация и фичи.md` (§6 — архитектура изоляции).

## Структура

```
crm/
  index.ts          # ЕДИНСТВЕННЫЙ публичный barrel (export CrmRoutes, ingest, resetCrm)
  CrmRoutes.tsx     # вложенный <Routes> (index→CrmSearch, new→CreateProfile, profile/:id→CompanyProfile)
  types/
    primitives.ts   # ЛОКАЛЬНЫЕ PAN / CIN / GSTIN / Address (НЕ из mock/v2)
    domain.ts       # CompanyProfile, Lead, Offer, Deal, Application + юнионы
    events.ts       # DTO событий адаптера (сериализуемый JSON, чужой домен не течёт)
  mock/
    seed.ts         # золотая запись (СВОИ объекты, не reuse companySeed)
    crmApi.ts       # синглтон-state + delay() ~350мс + функции API
    reset.ts        # сброс демо
  adapter/
    index.ts        # barrel адаптера
    ingest.ts       # ingest(event) — ЕДИНСТВЕННЫЙ вход внешних данных
    fixtures.ts     # готовые события для демо
  components/        # общие MUI-заготовки (SectionCard …)
  screens/          # CrmSearch / CompanyProfile / CreateProfile (пока стабы)
```

## Правила границы (двусторонний барьер)

**Из `crm/**` НЕЛЬЗЯ импортить:**
`screens/v2*`, `screens/v2/company*`, `mock/v2*`, `ui/v2*`, онбординг-контексты.

**Разрешено в `crm/`:** `@mui/*`, `react`, `react-router-dom`, `../rm/{theme,RmThemeProvider}`.

**Снаружи в CRM** — только через `crm/index.ts` (barrel). Прямые заходы в
`crm/mock|screens|types|adapter|components` из остального кода запрещены.

Гард: `node scripts/check-crm-isolation.mjs` (или `npm run check:crm`) — ненулевой код при нарушении.

## Контракт-адаптер (одностороннее зеркало, только В CRM)

`ingest(event)` — единственный вход внешних данных. События:
- `onboarding.completed` → найти/создать профиль + Offer (с onboardingLink) + Application;
- `application.stage-changed` → статус/стадия заявки;
- `dvu.result` → отметка + история.

DTO дублируют primary-поля (не ссылаются на чужой домен). В реальности → consumer очереди/webhook.
`adapter/fixtures.ts` — готовые события для демо без реального флоу.

## Маппинг на реальность

`crmApi` → REST/GraphQL CRM-сервиса; `state` → своя БД; events → event-контракт на шине;
CRM↔Онбординг — асинхронно односторонне; CRM↔Probe42 — синхронное чтение; CRM↔ДВУ — через `dvu.result`.
