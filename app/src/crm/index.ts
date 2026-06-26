// CRM-микросервис: ЕДИНСТВЕННЫЙ публичный barrel. Снаружи (App.tsx, DemoNav и т.п.) в CRM
// заходят ТОЛЬКО через этот файл — прямые импорты в crm/mock|screens|types|adapter запрещены
// (гард scripts/check-crm-isolation.mjs). См. crm/README.md.

export { CrmRoutes } from './CrmRoutes';

// Адаптер — единственный канал данных В CRM (для будущей кнопки «симулировать онбординг»
// из онбординг-стороны/демо). DTO событий — сериализуемый JSON, чужой домен не течёт.
export { ingest } from './adapter';
export type { CrmEvent, IngestResult } from './types/events';

// Сброс демо (для DemoNav / отладочных кнопок).
export { resetCrm } from './mock/reset';
