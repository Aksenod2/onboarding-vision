// CRM-микросервис: золотая запись mock-state. СВОИ объекты — НЕ reuse companySeed (изоляция, §6).
// Mehta-АНАЛОГ намеренно отличается id/PAN от онбординг-сида, чтобы не возникло соблазна
// «связать» домены. Структура state — синглтон в crmApi.ts (structuredClone от этого сида).

import type {
  CompanyProfile, Lead, Offer, Deal, Application, HistoryEvent, DvuTask, ProcessState,
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
  // НОВОЕ (spike): процесс (spine) и DVU-задачи — по profileId, тот же синглтон, без второго стора.
  process: Record<string, ProcessState>; // profileId → позиция на линии процесса
  dvuTasks: Record<string, DvuTask[]>; // profileId → задачи DVU (FK по profileId)
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

// --- Профили 3-5: «воронка в строке» для входного реестра (входной-реестр §1 ASCII) ---
// Разные узлы spine + разные состояния → демонстрируют мини-spine и сегменты реестра.

const lotusProfileId = 'crm-prof-lotus';
const lotusProfile: CompanyProfile = {
  id: lotusProfileId,
  entityType: 'Company',
  legalName: 'Lotus Exports Private Limited',
  pan: 'BBBCL7788M',
  cin: 'U51909MH2021PTC401122',
  registeredAddress: { line: '22, Marine Lines', city: 'Mumbai', state: 'Maharashtra', pin: '400002' },
  source: 'self-registration',
  aiSummary: 'FX-heavy exporter. Application waiting on client documents at data stage.',
  createdAt: '2026-05-02T07:00:00.000Z',
};

const patelProfileId = 'crm-prof-patel';
const patelProfile: CompanyProfile = {
  id: patelProfileId,
  entityType: 'Sole Proprietor',
  legalName: 'Patel & Sons',
  pan: 'CCCPP1212K',
  registeredAddress: { line: '5, Ashram Road', city: 'Ahmedabad', state: 'Gujarat', pin: '380009' },
  source: 'call',
  aiSummary: 'Probe42 lookup failed — needs manual review before enrichment.',
  createdAt: '2026-05-20T07:00:00.000Z',
};

const verdantProfileId = 'crm-prof-verdant';
const verdantProfile: CompanyProfile = {
  id: verdantProfileId,
  entityType: 'Company',
  legalName: 'Verdant Agro Private Limited',
  pan: 'CCCCV3434V',
  cin: 'U01100DL2019PTC287654',
  registeredAddress: { line: '8, Nehru Place', city: 'New Delhi', state: 'Delhi', pin: '110019' },
  source: 'onboarding',
  products: [{ product: 'current-account', label: 'Current Account ****9912', openedAt: '2026-06-01T09:00:00.000Z' }],
  aiSummary: 'Account opened — onboarding completed. Cross-sell candidate (FX, payroll).',
  createdAt: '2026-04-10T07:00:00.000Z',
};

// Заявки этих профилей (для столбца Application в реестре).
const lotusApplications: Application[] = [
  { id: 'crm-app-lotus', type: 'online', stage: 'data-collection', status: 'active', source: 'self-registration', updatedAt: '2026-06-19T10:00:00.000Z', onboardingCaseId: 'OBC2-CO-2026-0042' },
];
const patelApplications: Application[] = [
  { id: 'crm-app-patel', type: 'online', stage: 'started', status: 'active', source: 'call', updatedAt: '2026-06-23T10:00:00.000Z', onboardingCaseId: 'OBC2-SP-2026-0011' },
];
const verdantApplications: Application[] = [
  { id: 'crm-app-verdant', type: 'online', stage: 'completed', status: 'completed', source: 'onboarding', updatedAt: '2026-06-01T09:00:00.000Z', onboardingCaseId: 'OBC2-CO-2026-0003' },
];

// --- Позиция на линии процесса (spine) по каждому профилю ---
const seedProcess: Record<string, ProcessState> = {
  // Mehta: брошена на подписании → узел signing требует возврата клиента; есть DVU-петля на vkyc.
  [richProfileId]: {
    activeNode: 'vkyc',
    ageDays: 2,
    nodes: {
      intake: 'done', pan: 'done', questionnaire: 'done', data: 'done', signatories: 'done',
      vkyc: 'action-required', signing: 'not-started', account: 'not-started', done: 'not-started',
    },
  },
  // Nova Agri: только заведён профиль, заявки нет → стоит на входе.
  [thinProfileId]: {
    activeNode: 'intake',
    ageDays: 1,
    nodes: { intake: 'active' },
  },
  // Lotus: ждём документы клиента на этапе данных.
  [lotusProfileId]: {
    activeNode: 'data',
    ageDays: 5,
    nodes: { intake: 'done', pan: 'done', questionnaire: 'done', data: 'waiting' },
  },
  // Patel: ошибка Probe на этапе PAN.
  [patelProfileId]: {
    activeNode: 'pan',
    ageDays: 1,
    nodes: { intake: 'done', pan: 'error' },
  },
  // Verdant: дошёл до конца, счёт открыт.
  [verdantProfileId]: {
    activeNode: 'done',
    nodes: {
      intake: 'done', pan: 'done', questionnaire: 'done', data: 'done', signatories: 'done',
      vkyc: 'done', signing: 'done', account: 'done', done: 'done',
    },
  },
};

// --- DVU-задачи (по profileId, FK; spike §3.2). Демонстрируют очередь + four-eyes ---
const seedDvuTasks: Record<string, DvuTask[]> = {
  // Главная демо-задача: doc-request по Mehta. performedBy = офицер, вёл сессию VKYC.
  // → four-eyes-гард: тот же офицер не может аппрувить.
  [richProfileId]: [
    {
      id: 'dvu-mehta-1',
      profileId: richProfileId,
      onboardingCaseId: 'OBC2-CO-2026-0007',
      node: 'vkyc',
      kind: 'vkyc-fail',
      title: 'selfVKYC failed — schedule F2F / approve',
      status: 'pending-approval',
      priority: 'high',
      slaHoursLeft: 4,
      assignedTo: 'officer.ivanov',
      performedBy: 'officer.ivanov', // вёл сессию → four-eyes исключает его из аппрува
      createdAt: '2026-06-22T09:00:00.000Z',
      updatedAt: '2026-06-24T09:00:00.000Z',
      log: [
        { at: '2026-06-22T09:00:00.000Z', by: 'system', action: 'created', comment: 'selfVKYC eKYC fail' },
        { at: '2026-06-23T11:00:00.000Z', by: 'officer.ivanov', action: 'in-review' },
      ],
    },
  ],
  // Lotus: запрос документа (ждём клиента) — открытая задача в очереди.
  [lotusProfileId]: [
    {
      id: 'dvu-lotus-1',
      profileId: lotusProfileId,
      onboardingCaseId: 'OBC2-CO-2026-0042',
      node: 'data',
      kind: 'doc-request',
      title: 'Address proof mismatch — request document',
      status: 'in-review',
      priority: 'medium',
      slaHoursLeft: 20,
      assignedTo: 'officer.singh',
      createdAt: '2026-06-19T10:00:00.000Z',
      updatedAt: '2026-06-20T10:00:00.000Z',
      log: [{ at: '2026-06-19T10:00:00.000Z', by: 'system', action: 'created' }],
    },
  ],
  // Patel: Probe42 fail — открытая задача, никем не назначена (можно взять).
  [patelProfileId]: [
    {
      id: 'dvu-patel-1',
      profileId: patelProfileId,
      onboardingCaseId: 'OBC2-SP-2026-0011',
      node: 'pan',
      kind: 'probe-fail',
      title: 'Probe42 returned no data — manual enrichment',
      status: 'open',
      priority: 'high',
      slaHoursLeft: 1,
      createdAt: '2026-06-23T10:00:00.000Z',
      updatedAt: '2026-06-23T10:00:00.000Z',
      log: [{ at: '2026-06-23T10:00:00.000Z', by: 'system', action: 'created' }],
    },
  ],
};

// Примечание про «ненайденный PAN» (UC-2): любой PAN, которого НЕТ среди profiles[].pan,
// — это ветка «не найдено». Для демо удобный отсутствующий PAN: 'ZZZZN0000Z' (нигде не сидим).
export const MISSING_PAN_DEMO = 'ZZZZN0000Z';

export const seed: CrmState = {
  profiles: [richProfile, thinProfile, lotusProfile, patelProfile, verdantProfile],
  leads: { [richProfileId]: richLeads },
  offers: { [richProfileId]: richOffers },
  deals: {},
  applications: {
    [richProfileId]: richApplications,
    [lotusProfileId]: lotusApplications,
    [patelProfileId]: patelApplications,
    [verdantProfileId]: verdantApplications,
  },
  history: { [richProfileId]: richHistory },
  process: seedProcess,
  dvuTasks: seedDvuTasks,
};
