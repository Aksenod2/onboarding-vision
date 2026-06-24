// Реестр шагов сценария КОМПАНИЯ. Две части:
//  • COMPANY_STEPS_A — линейная фаза A заполнителя (для верхнего StepProgress).
//  • SIGNATORY_STEPS — мини-сессия подписанта (фаза B), для прогресса внутри сессии.
// Источник: docs/Компания — спека ДЕТАЛЬНАЯ (логика).md.

import type { StepDef } from './steps';

export const COMPANY_DASHBOARD_ROUTE = '/company/dashboard';

// Фаза A — заполнитель (Customer Representative).
// Порядок (решение Дениса 2026-06-22, подтверждено транскриптом Марго): Диалог (TUMAB, PAN —
// нулевой шаг внутри) → Подтверждение данных (анкета, состав директоров) → Подписанты и BR
// (AS назначается из подтверждённого состава директоров) → Приглашение.
// PAN влит в диалог-шаг (co-bnq), отдельного co-pan больше нет.
// #52 (Марго 23.06): отдельного шага «Приглашение подписантов» (dispatch) больше нет —
// приглашения уходят автоматически после подтверждения Board Resolution.
export const COMPANY_STEPS_A: StepDef[] = [
  { id: 'co-bnq', route: '/company/bnq', order: 1, titleRu: 'Анкета', titleEn: 'Questionnaire' },
  { id: 'co-confirm', route: '/company/confirm', order: 2, titleRu: 'Подтверждение данных компании', titleEn: 'Confirm company details' },
  { id: 'co-signatories-br', route: '/company/signatories-br', order: 3, titleRu: 'Подписанты и BR', titleEn: 'Signatories & BR' },
];

// Фаза B шаги фазы A необратимыми не считаем — заполнитель может ходить назад.
export const isCompanyIrreversible = (): boolean => false;

// --- Конфиг-массив левой навигации-хаба заявки (заполнитель Компании) ---
// Один источник истины для панели-хаба: пункты фазы A (кликабельны, со своим роутом) +
// блоки-мониторинга фазы B (read-only, ведут на дашборд-drill-down).
// Названия разделов — ПЛЕЙСХОЛДЕРЫ из текущих COMPANY_STEPS_A + getApplicationBlocks
// (открытый вопрос к Марго: company details vs business profile, раскрытие «BR»). НЕ финальные.
//
// Дашборд — это раздел мониторинга «дом заявки»: после рассылки заполнитель живёт здесь.
// Поэтому у каждого пункта есть роут; пункты фазы B ведут на дашборд (drill-down деталей там).

export type HubItemPhase = 'A' | 'B';

export interface HubItem {
  id: string;
  route: string; // куда вести по клику
  titleRu: string;
  titleEn: string;
  phase: HubItemPhase;
  // order рисуем только для фазы A (шаги клиента); у блоков-мониторинга номер опускаем.
  order?: number;
  // locked — необратимый/недоступный для правки (VKYC, подписание): дизейбл, не кликабелен.
  locked?: boolean;
}

// Фаза A — кликабельны свободно (решение Дениса 2026-06-22: свободная навигация).
// Фаза B — блоки-мониторинга (read): клик ведёт на дашборд (drill-down там).
// VKYC — необратимый этап → locked.
// Единый нейминг (дизайн-бриф §3): одна сущность = одна строка и здесь, и в getApplicationBlocks.
export const COMPANY_HUB_ITEMS: HubItem[] = [
  { id: 'co-bnq', route: '/company/bnq', phase: 'A', order: 1, titleRu: 'Анкета', titleEn: 'Questionnaire' },
  { id: 'co-confirm', route: '/company/confirm', phase: 'A', order: 2, titleRu: 'Данные компании', titleEn: 'Company details' },
  { id: 'co-signatories-br', route: '/company/signatories-br', phase: 'A', order: 3, titleRu: 'Подписанты и решение совета', titleEn: 'Signatories & Board Resolution' },
  // #52: отдельного пункта «Приглашение подписантов» нет — инвайты уходят автоматически после BR.
  // --- разделитель A ↔ мониторинг рисуется в панели по смене phase ---
  // Денис 2026-06-23 (подтверждено Марго): Personal Identification (видеоверификация) и Signing
  // (подписание) — РАЗНЫЕ процессы → два отдельных пункта. Порядок: PI → Signing.
  { id: 'hub-ident', route: COMPANY_DASHBOARD_ROUTE, phase: 'B', titleRu: 'Персональная идентификация', titleEn: 'Personal Identification' },
  { id: 'hub-sign', route: COMPANY_DASHBOARD_ROUTE, phase: 'B', titleRu: 'Подписание', titleEn: 'Signing' },
];

// Мини-сессия подписанта (фаза B). Для прогресса внутри персональной сессии.
export interface SignatorySessionStep {
  id: 'co-b-aadhaar' | 'co-b-vkyc' | 'co-b-sign';
  titleRu: string;
  titleEn: string;
  order: number;
}
// Порядок: Aadhaar (с согласиями Privacy+eKYC на панели) → подписание (DSC) → видео (VKYC).
// Вариант C: отдельного шага «Согласия» больше нет. Подпись ДО видео; видео — финальный шаг.
export const SIGNATORY_STEPS: SignatorySessionStep[] = [
  { id: 'co-b-aadhaar', order: 1, titleRu: 'Aadhaar eKYC', titleEn: 'Aadhaar eKYC' },
  { id: 'co-b-sign', order: 2, titleRu: 'Подписание (DSC)', titleEn: 'Signing (DSC)' },
  { id: 'co-b-vkyc', order: 3, titleRu: 'Видеоидентификация', titleEn: 'Video identification' },
];
