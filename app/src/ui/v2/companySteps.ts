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
export const COMPANY_STEPS_A: StepDef[] = [
  { id: 'co-bnq', route: '/company/bnq', order: 1, titleRu: 'Анкета', titleEn: 'Questionnaire' },
  { id: 'co-confirm', route: '/company/confirm', order: 2, titleRu: 'Подтверждение данных компании', titleEn: 'Confirm company details' },
  { id: 'co-signatories-br', route: '/company/signatories-br', order: 3, titleRu: 'Подписанты и BR', titleEn: 'Signatories & BR' },
  { id: 'co-dispatch', route: '/company/dispatch', order: 4, titleRu: 'Приглашение подписантов', titleEn: 'Invite signatories' },
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
  { id: 'co-dispatch', route: '/company/dispatch', phase: 'A', order: 4, titleRu: 'Приглашение подписантов', titleEn: 'Invite signatories' },
  // --- разделитель A ↔ мониторинг рисуется в панели по смене phase ---
  { id: 'hub-ident', route: COMPANY_DASHBOARD_ROUTE, phase: 'B', titleRu: 'Идентификация и подписание', titleEn: 'Personal Identification & Signing' },
  { id: 'hub-vkyc', route: COMPANY_DASHBOARD_ROUTE, phase: 'B', locked: true, titleRu: 'Видеоидентификация (VKYC)', titleEn: 'VKYC' },
];

// Мини-сессия подписанта (фаза B). Для прогресса внутри персональной сессии.
export interface SignatorySessionStep {
  id: 'co-b-consents' | 'co-b-aadhaar' | 'co-b-vkyc' | 'co-b-sign';
  titleRu: string;
  titleEn: string;
  order: number;
}
// Порядок (#35): согласия → Aadhaar → подписание (DSC) → видео (VKYC).
// Подпись ДО видео; видео — финальный шаг (счёт не открывается до VKYC).
export const SIGNATORY_STEPS: SignatorySessionStep[] = [
  { id: 'co-b-consents', order: 1, titleRu: 'Согласия', titleEn: 'Consents' },
  { id: 'co-b-aadhaar', order: 2, titleRu: 'Aadhaar eKYC', titleEn: 'Aadhaar eKYC' },
  { id: 'co-b-sign', order: 3, titleRu: 'Подписание (DSC)', titleEn: 'Signing (DSC)' },
  { id: 'co-b-vkyc', order: 4, titleRu: 'Видеоидентификация', titleEn: 'Video identification' },
];
