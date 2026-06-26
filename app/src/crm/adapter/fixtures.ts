// CRM-микросервис: готовые ФИКСТУРЫ событий для демо без реального флоу онбординга (§6).
// Кнопка «Симулировать завершение онбординга» на экране дёргает ingest(fixture).
// DTO — сериализуемый JSON, не ссылается на чужой домен.

import type {
  OnboardingCompletedEvent, ApplicationStageChangedEvent, DvuResultEvent,
} from '../types/events';

// 1) Новый клиент завершил онбординг → профиль + авто-оффер + заявка (UC-3/H2).
//    PAN намеренно НОВЫЙ (нет в сиде) → демонстрирует find-or-create профиля.
export const fxOnboardingCompletedNew: OnboardingCompletedEvent = {
  type: 'onboarding.completed',
  occurredAt: '2026-06-26T09:30:00.000Z',
  company: {
    entityType: 'Company',
    legalName: 'Skyline Logistics Private Limited',
    pan: 'AAKCS3344L',
    cin: 'U63000MH2021PTC367890',
    gstin: '27AAKCS3344L1Z2',
    registeredAddress: {
      line: 'Tower B, Hiranandani Business Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin: '400076',
    },
  },
  onboardingCaseId: 'OBC2-CO-2026-0042',
  channel: 'online',
  source: 'self-registration',
  product: 'current-account',
  onboardingLink: 'https://onboarding.example/resume/OBC2-CO-2026-0042',
};

// 2) Существующий клиент (Mehta, PAN из сида) — брошенная заявка ожила → стадия сменилась (UC-4).
export const fxApplicationResumed: ApplicationStageChangedEvent = {
  type: 'application.stage-changed',
  occurredAt: '2026-06-26T10:00:00.000Z',
  pan: 'AABCM4521Z', // совпадает с richPan в seed.ts
  onboardingCaseId: 'OBC2-CO-2026-0007',
  stage: 'bank-review',
  status: 'active',
};

// 3) DVU вернул результат по заявке Mehta (OQ-9).
export const fxDvuApproved: DvuResultEvent = {
  type: 'dvu.result',
  occurredAt: '2026-06-26T11:15:00.000Z',
  pan: 'AABCM4521Z',
  onboardingCaseId: 'OBC2-CO-2026-0007',
  outcome: 'approved',
  comment: 'Source of funds verified.',
};

// Набор для демо-панели (кнопки симуляции).
export const demoFixtures = [
  { id: 'onboarding-completed', label: 'Simulate onboarding completed', event: fxOnboardingCompletedNew },
  { id: 'application-resumed', label: 'Simulate application resumed', event: fxApplicationResumed },
  { id: 'dvu-approved', label: 'Simulate DVU approved', event: fxDvuApproved },
] as const;
