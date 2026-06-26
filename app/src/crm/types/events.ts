// CRM-микросервис: КОНТРАКТ событий внешнего мира (одностороннее зеркало, только В CRM).
// DTO ДУБЛИРУЮТ primary-поля (сериализуемый JSON), НЕ ссылаются на чужой домен (§6).
// В реальности — payload очереди/webhook (онбординг → шина → consumer CRM).
// Единственный вход — adapter/ingest.ts.

import type {
  EntityType, ProductCode, ClientSource, ApplicationStage, ApplicationStatus, Channel,
} from './domain';

// Снимок компании в событии (дублирует primary CompanyProfile; плоский JSON).
export interface CompanySnapshotDto {
  entityType: EntityType;
  legalName: string;
  pan: string; // ключ для find-or-create профиля
  cin?: string;
  gstin?: string;
  registeredAddress: {
    line: string;
    city: string;
    state: string;
    pin: string;
  };
}

// onboarding.completed — клиент завершил онбординг в зелёной зоне (H1/H2/UC-3).
// → найти/создать профиль по PAN + создать Offer (с onboardingLink) + создать Application.
export interface OnboardingCompletedEvent {
  type: 'onboarding.completed';
  occurredAt: string; // ISO
  company: CompanySnapshotDto;
  onboardingCaseId: string; // id кейса в онбординге (для трассировки)
  channel: Channel; // online / offline
  source: ClientSource; // self-registration / onboarding / online-bank
  product?: ProductCode; // авто-оффер: дефолт 'current-account' (UC-3)
  onboardingLink?: string; // ссылка-из-оффера (I1)
}

// application.stage-changed — изменилась стадия/статус заявки (UC-4, C7).
export interface ApplicationStageChangedEvent {
  type: 'application.stage-changed';
  occurredAt: string;
  pan: string; // профиль-владелец
  onboardingCaseId: string; // какая заявка
  stage: ApplicationStage;
  status: ApplicationStatus; // active / abandoned / rejected / completed
}

// dvu.result — пришёл результат ручной проверки DVU (OQ-9 — связь с DVU открыта; событие принимаем).
export interface DvuResultEvent {
  type: 'dvu.result';
  occurredAt: string;
  pan: string;
  onboardingCaseId: string;
  outcome: 'approved' | 'rejected' | 'more-info';
  comment?: string;
}

// Объединённый тип входящего события (discriminated union по type).
export type CrmEvent =
  | OnboardingCompletedEvent
  | ApplicationStageChangedEvent
  | DvuResultEvent;

// Результат обработки события адаптером.
export interface IngestResult {
  ok: boolean;
  profileId?: string; // затронутый/созданный профиль
  message: string;
}
