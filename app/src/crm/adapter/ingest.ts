// CRM-микросервис: КОНТРАКТ-АДАПТЕР. ingest(event) — ЕДИНСТВЕННЫЙ вход внешних данных
// (одностороннее зеркало, только В CRM, §6). Внешний мир НЕ знает о домене CRM — он шлёт
// сериализуемые DTO (types/events.ts). В реальности — consumer очереди/webhook.

import type {
  CrmEvent, OnboardingCompletedEvent, ApplicationStageChangedEvent, DvuResultEvent, IngestResult,
} from '../types/events';
import type { CompanyProfile, Offer, Application, HistoryEvent } from '../types/domain';
import {
  repoNowIso, repoNewId,
  findProfileByPan, upsertProfile, pushOffer, pushApplication, pushHistory,
  patchApplicationByCase,
} from '../mock/crmApi';

// Найти профиль по PAN или создать минимальный из снимка события (find-or-create).
const findOrCreateProfile = (company: OnboardingCompletedEvent['company'], source: CompanyProfile['source']): CompanyProfile => {
  const existing = findProfileByPan(company.pan);
  if (existing) return existing;
  const profile: CompanyProfile = {
    id: repoNewId('crm-prof'),
    entityType: company.entityType,
    legalName: company.legalName,
    pan: company.pan,
    cin: company.cin,
    gstin: company.gstin,
    registeredAddress: company.registeredAddress,
    source,
    createdAt: repoNowIso(),
  };
  upsertProfile(profile);
  return profile;
};

// onboarding.completed → найти/создать профиль + создать Offer (с onboardingLink) + Application (H2/UC-3).
const handleOnboardingCompleted = (ev: OnboardingCompletedEvent): IngestResult => {
  const profile = findOrCreateProfile(ev.company, ev.source);

  const offer: Offer = {
    id: repoNewId('crm-offer'),
    product: ev.product ?? 'current-account', // дефолт авто-оффера (UC-3)
    source: ev.source,
    tags: ['auto', 'onboarding'],
    description: 'Auto-generated offer on onboarding completion.',
    onboardingLink: ev.onboardingLink, // ссылка-из-оффера (I1)
    createdAt: ev.occurredAt,
    status: 'converted',
  };
  pushOffer(profile.id, offer);

  const application: Application = {
    id: repoNewId('crm-app'),
    type: ev.channel,
    stage: 'completed',
    status: 'completed',
    source: ev.source,
    updatedAt: ev.occurredAt,
    offerId: offer.id,
    onboardingCaseId: ev.onboardingCaseId,
  };
  pushApplication(profile.id, application);

  const hist: HistoryEvent = {
    id: repoNewId('crm-h'),
    kind: 'onboarding-completed',
    at: ev.occurredAt,
    title: 'Onboarding completed',
    detail: `Auto-offer created (${offer.product}).`,
  };
  pushHistory(profile.id, hist);

  return { ok: true, profileId: profile.id, message: 'Profile + offer + application synced from onboarding.' };
};

// application.stage-changed → обновить стадию/статус заявки + запись в историю (UC-4/C7).
const handleApplicationStageChanged = (ev: ApplicationStageChangedEvent): IngestResult => {
  const profile = findProfileByPan(ev.pan);
  if (!profile) return { ok: false, message: `No profile for PAN ${ev.pan}.` };
  patchApplicationByCase(profile.id, ev.onboardingCaseId, { stage: ev.stage, status: ev.status, updatedAt: ev.occurredAt });
  pushHistory(profile.id, {
    id: repoNewId('crm-h'),
    kind: ev.status === 'rejected' ? 'rejection' : 'application-stage',
    at: ev.occurredAt,
    title: `Application ${ev.status} at ${ev.stage}`,
  });
  return { ok: true, profileId: profile.id, message: 'Application stage updated.' };
};

// dvu.result → отметка + история (OQ-9: связь с DVU открыта, событие принимаем как факт).
const handleDvuResult = (ev: DvuResultEvent): IngestResult => {
  const profile = findProfileByPan(ev.pan);
  if (!profile) return { ok: false, message: `No profile for PAN ${ev.pan}.` };
  pushHistory(profile.id, {
    id: repoNewId('crm-h'),
    kind: 'dvu-result',
    at: ev.occurredAt,
    title: `DVU result: ${ev.outcome}`,
    detail: ev.comment,
  });
  return { ok: true, profileId: profile.id, message: `DVU result (${ev.outcome}) recorded.` };
};

// Единственный публичный вход внешних данных. discriminated union по event.type.
export const ingest = (event: CrmEvent): IngestResult => {
  switch (event.type) {
    case 'onboarding.completed':
      return handleOnboardingCompleted(event);
    case 'application.stage-changed':
      return handleApplicationStageChanged(event);
    case 'dvu.result':
      return handleDvuResult(event);
    default: {
      // Исчерпывающая проверка union: если добавят тип — TS подсветит здесь.
      const _exhaustive: never = event;
      return { ok: false, message: `Unknown event type: ${JSON.stringify(_exhaustive)}` };
    }
  }
};
