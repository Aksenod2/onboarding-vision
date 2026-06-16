// Реестр шагов сценария КОМПАНИЯ. Две части:
//  • COMPANY_STEPS_A — линейная фаза A заполнителя (для верхнего StepProgress).
//  • SIGNATORY_STEPS — мини-сессия подписанта (фаза B), для прогресса внутри сессии.
// Источник: docs/Компания — спека ДЕТАЛЬНАЯ (логика).md.

import type { StepDef } from './steps';

export const COMPANY_DASHBOARD_ROUTE = '/company/dashboard';

// Фаза A — заполнитель (Customer Representative).
export const COMPANY_STEPS_A: StepDef[] = [
  { id: 'co-pan', route: '/company/pan', order: 1, titleRu: 'Доступ к реестрам и PAN', titleEn: 'Registry access & PAN' },
  { id: 'co-bnq', route: '/company/bnq', order: 2, titleRu: 'Анкета и подписанты', titleEn: 'Questionnaire & signatories' },
  { id: 'co-confirm', route: '/company/confirm', order: 3, titleRu: 'Подтверждение данных компании', titleEn: 'Confirm company details' },
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
export const SIGNATORY_STEPS: SignatorySessionStep[] = [
  { id: 'co-b-consents', order: 1, titleRu: 'Согласия', titleEn: 'Consents' },
  { id: 'co-b-aadhaar', order: 2, titleRu: 'Aadhaar eKYC', titleEn: 'Aadhaar eKYC' },
  { id: 'co-b-vkyc', order: 3, titleRu: 'Видеоидентификация', titleEn: 'Video identification' },
  { id: 'co-b-sign', order: 4, titleRu: 'Подписание (DSC)', titleEn: 'Signing (DSC)' },
];
