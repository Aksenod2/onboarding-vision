// CRM-микросервис: золотая запись mock-state. СВОИ объекты — НЕ reuse companySeed (изоляция, §6).
// Mehta-АНАЛОГ намеренно отличается id/PAN от онбординг-сида, чтобы не возникло соблазна
// «связать» домены. Структура state — синглтон в crmApi.ts (structuredClone от этого сида).

import type {
  CompanyProfile, Lead, Offer, Deal, Application, HistoryEvent,
} from '../types/domain';

// Единый стейт CRM (in-memory «БД сервиса»).
export interface CrmState {
  profiles: CompanyProfile[];
  // Воронка хранится плоско, привязка к профилю — по profileId (как FK в реальной БД).
  leads: Record<string, Lead[]>; // profileId → leads
  offers: Record<string, Offer[]>;
  deals: Record<string, Deal[]>;
  applications: Record<string, Application[]>;
  history: Record<string, HistoryEvent[]>;
}

// --- Профиль 1: «богатый» кейс для UC-1 (входящий звонок, клиент найден) ---
// Лиды + оффер-«не выстрелил» + брошенная заявка + история коммуникаций + AI summary.
const richProfileId = 'crm-prof-mehta';
const richPan = 'AABCM4521Z'; // СВОЙ PAN (не онбординговый AABCM4521C) — изоляция доменов.

const richProfile: CompanyProfile = {
  id: richProfileId,
  entityType: 'Company',
  legalName: 'Mehta Textiles Private Limited',
  pan: richPan,
  cin: 'U17110MH2018PTC312045',
  gstin: '27AABCM4521Z1Z8',
  registeredAddress: {
    line: 'Unit 7, Apparel Park, MIDC Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin: '400093',
  },
  source: 'call',
  signatories: [
    { fullName: 'Rajesh Mehta', role: 'Director', pan: 'ABCPM1234R' },
    { fullName: 'Karan Verma', role: 'Authorized Signatory', pan: 'ABCPV5678K' },
  ],
  products: [
    { product: 'current-account', label: 'Current Account ****3456', openedAt: '2024-11-02T09:00:00.000Z' },
  ],
  aiSummary:
    'Active exporter (textile, India→Russia). FX/ВЭД activity detected — fit for FX & trade-finance products. '
    + 'No outstanding overdue. One abandoned online application (signing stage) — candidate for resumption.',
  createdAt: '2025-12-10T08:30:00.000Z',
};

const richLeads: Lead[] = [
  { id: 'crm-lead-1', product: 'fx', createdAt: '2026-01-15T10:00:00.000Z', note: 'Asked about FX limits for export settlements.' },
  { id: 'crm-lead-2', product: 'deposit', createdAt: '2026-02-03T12:30:00.000Z' },
];

const richOffers: Offer[] = [
  {
    id: 'crm-offer-1',
    product: 'deposit',
    expectedProfit: 4.2,
    commission: 0.6,
    source: 'call',
    tags: ['cross-sell', 'priority'],
    description: 'Term deposit proposal — did not convert (client postponed).',
    createdAt: '2026-02-05T09:00:00.000Z',
    status: 'expired', // оффер «не выстрелил» (UC-1)
  },
];

const richApplications: Application[] = [
  {
    id: 'crm-app-1',
    type: 'online',
    stage: 'signing',
    status: 'abandoned', // брошенная заявка (UC-1 / UC-4)
    source: 'self-registration',
    updatedAt: '2026-03-20T14:10:00.000Z',
    onboardingCaseId: 'OBC2-CO-2026-0007',
  },
];

const richHistory: HistoryEvent[] = [
  { id: 'crm-h-1', kind: 'call', at: '2026-01-15T10:00:00.000Z', title: 'Inbound call', detail: 'Discussed FX products.' },
  { id: 'crm-h-2', kind: 'offer-created', at: '2026-02-05T09:00:00.000Z', title: 'Offer created: Term deposit' },
  { id: 'crm-h-3', kind: 'application-stage', at: '2026-03-20T14:10:00.000Z', title: 'Application reached Signing', detail: 'Online self-registration.' },
  { id: 'crm-h-4', kind: 'note', at: '2026-03-25T11:00:00.000Z', title: 'Task: application stalled', detail: 'Client did not return to finish signing.' },
];

// --- Профиль 2: «тонкий» кейс (просто в списке клиентов, без богатой воронки) ---
const thinProfileId = 'crm-prof-novaagri';
const thinProfile: CompanyProfile = {
  id: thinProfileId,
  entityType: 'Company',
  legalName: 'Nova Agri Exports Private Limited',
  pan: 'AAACN9087Q',
  cin: 'U01100DL2020PTC198765',
  registeredAddress: {
    line: '14, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    pin: '110001',
  },
  source: 'potential',
  aiSummary: 'New potential client, no activity yet.',
  createdAt: '2026-04-01T07:00:00.000Z',
};

// Примечание про «ненайденный PAN» (UC-2): любой PAN, которого НЕТ среди profiles[].pan,
// — это ветка «не найдено». Для демо удобный отсутствующий PAN: 'ZZZZN0000Z' (нигде не сидим).
export const MISSING_PAN_DEMO = 'ZZZZN0000Z';

export const seed: CrmState = {
  profiles: [richProfile, thinProfile],
  leads: { [richProfileId]: richLeads },
  offers: { [richProfileId]: richOffers },
  deals: {},
  applications: { [richProfileId]: richApplications },
  history: { [richProfileId]: richHistory },
};
