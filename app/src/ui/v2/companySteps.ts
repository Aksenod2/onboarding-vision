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
