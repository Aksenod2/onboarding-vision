// CRM-микросервис: «локальный бэкенд понарошку». Синглтон-state в памяти + delay() ~350мс.
// Стиль скопирован с mock/v2/companyApi.ts, но БЕЗ импортов оттуда (изоляция, §6).
// Маппинг на реальность: эти функции → REST/GraphQL CRM-сервиса; state → своя БД.

import { seed, type CrmState } from './seed';
import type {
  CompanyProfile, Funnel, Application, Offer, Deal, Lead, ClientSource, ProductCode,
  ProcessState, DvuTask, DvuOutcome,
} from '../types/domain';

let state: CrmState = structuredClone(seed);

const NETWORK_DELAY_MS = 350;
const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));

const nowIso = (): string => new Date().toISOString();

// PAN сравниваем регистронезависимо и без пробелов (как обычно вводят операторы).
const normPan = (pan: string): string => pan.replace(/\s+/g, '').toUpperCase();

let seq = 0;
const newId = (prefix: string): string => `${prefix}-${Date.now()}-${seq++}`;

// --- Поиск / список (B2/B3) ---

// Поиск по PAN (UC-1/UC-2). Возвращает профиль либо null (ветка «не найдено»).
export const searchByPan = (pan: string): Promise<CompanyProfile | null> => {
  const target = normPan(pan);
  const found = state.profiles.find((p) => normPan(p.pan) === target) ?? null;
  return delay(found);
};

// Список клиентов (одно окно). Можно отфильтровать по подстроке (имя/PAN).
export const listProfiles = (query?: string): Promise<CompanyProfile[]> => {
  const q = (query ?? '').trim().toLowerCase();
  const list = q
    ? state.profiles.filter(
        (p) => p.legalName.toLowerCase().includes(q) || normPan(p.pan).includes(normPan(q)),
      )
    : state.profiles;
  return delay(list);
};

export const getProfile = (id: string): Promise<CompanyProfile | undefined> =>
  delay(state.profiles.find((p) => p.id === id));

// Воронка профиля (Lead → Offer → Deal → Application + история) — агрегат для CompanyProfile-экрана.
export const getFunnel = (profileId: string): Promise<Funnel> =>
  delay({
    leads: state.leads[profileId] ?? [],
    offers: state.offers[profileId] ?? [],
    deals: state.deals[profileId] ?? [],
    applications: state.applications[profileId] ?? [],
    history: state.history[profileId] ?? [],
  });

// Все заявки (для столбца Application в списке клиентов, B3). Плоский список с profileId.
export const getApplications = (): Promise<Array<Application & { profileId: string }>> => {
  const flat: Array<Application & { profileId: string }> = [];
  for (const [profileId, apps] of Object.entries(state.applications)) {
    for (const a of apps) flat.push({ ...a, profileId });
  }
  return delay(flat);
};

// --- Создание профиля (G1/G2/G4) ---

export interface CreateProfileInput {
  entityType: CompanyProfile['entityType'];
  legalName: string;
  pan: string;
  cin?: string;
  registeredAddress: CompanyProfile['registeredAddress'];
  source: ClientSource; // дропдаун «откуда пришёл» (G4)
}

export const createProfile = (input: CreateProfileInput): Promise<CompanyProfile> => {
  const profile: CompanyProfile = {
    id: newId('crm-prof'),
    entityType: input.entityType,
    legalName: input.legalName,
    pan: normPan(input.pan),
    cin: input.cin,
    registeredAddress: input.registeredAddress,
    source: input.source,
    createdAt: nowIso(),
  };
  state.profiles = [...state.profiles, profile];
  return delay(profile);
};

// Авто-заполнение из Probe42 по PAN (G2). Mock: синтезируем «подтянутые» данные.
// В реальности — синхронное чтение из Probe42 (маппинг §6: CRM↔Probe42 синхронно).
export const createFromProbe42 = (pan: string): Promise<CompanyProfile> => {
  const normalized = normPan(pan);
  const profile: CompanyProfile = {
    id: newId('crm-prof'),
    entityType: 'Company',
    legalName: 'Probe42 Auto-filled Pvt Ltd',
    pan: normalized,
    cin: 'U00000XX0000PTC000000',
    registeredAddress: {
      line: 'Auto-filled from Probe42',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin: '400001',
    },
    source: 'probe42',
    createdAt: nowIso(),
  };
  state.profiles = [...state.profiles, profile];
  return delay(profile);
};

// --- Создание сущностей воронки (C2/C3) ---

export interface CreateOfferInput {
  profileId: string;
  product: ProductCode; // обяз. (§3)
  expectedProfit?: number;
  commission?: number;
  source: ClientSource;
  tags?: string[];
  description?: string;
  onboardingLink?: string; // ссылка-из-оффера (I1)
}

export const createOffer = (input: CreateOfferInput): Promise<Offer> => {
  const offer: Offer = {
    id: newId('crm-offer'),
    product: input.product,
    expectedProfit: input.expectedProfit,
    commission: input.commission,
    source: input.source,
    tags: input.tags ?? [],
    description: input.description,
    onboardingLink: input.onboardingLink,
    createdAt: nowIso(),
    status: 'open',
  };
  const list = state.offers[input.profileId] ?? [];
  state.offers[input.profileId] = [...list, offer];
  return delay(offer);
};

export interface CreateDealInput {
  profileId: string;
  kind: ProductCode;
  channel: Deal['channel'];
  stage?: Deal['stage'];
  offerId?: string;
}

export const createDeal = (input: CreateDealInput): Promise<Deal> => {
  const deal: Deal = {
    id: newId('crm-deal'),
    kind: input.kind,
    channel: input.channel,
    stage: input.stage ?? 'new',
    offerId: input.offerId,
    createdAt: nowIso(),
  };
  const list = state.deals[input.profileId] ?? [];
  state.deals[input.profileId] = [...list, deal];
  return delay(deal);
};

// Возобновить брошенную заявку (UC-1/UC-4): статус abandoned → active, пишем событие в историю.
// Демо: одна заявка профиля. В реальности — реактивация кейса в онбординге через адаптер.
export const resumeApplication = (profileId: string, applicationId: string): Promise<Application | null> => {
  const list = state.applications[profileId] ?? [];
  const target = list.find((a) => a.id === applicationId);
  if (!target) return delay(null);
  const updated: Application = { ...target, status: 'active', updatedAt: nowIso() };
  state.applications[profileId] = list.map((a) => (a.id === applicationId ? updated : a));
  state.history[profileId] = [
    ...(state.history[profileId] ?? []),
    {
      id: newId('crm-h'),
      kind: 'application-stage',
      at: nowIso(),
      title: 'Application resumed',
      detail: `Stage: ${target.stage}`,
    },
  ];
  return delay(updated);
};

// --- Внутренние хелперы для адаптера (НЕ публичный API экранов) ---
// Адаптер пишет в тот же state. Эти функции синхронные (адаптер сам решает про delay).
// Снаружи модуля через barrel НЕ экспортируются — это часть «БД сервиса», не публичный контракт.

export { nowIso as repoNowIso, newId as repoNewId, normPan as repoNormPan };

// Пуш в историю и воронку из адаптера.
export const pushLead = (profileId: string, lead: Lead): void => {
  state.leads[profileId] = [...(state.leads[profileId] ?? []), lead];
};
export const pushOffer = (profileId: string, offer: Offer): void => {
  state.offers[profileId] = [...(state.offers[profileId] ?? []), offer];
};
export const pushApplication = (profileId: string, app: Application): void => {
  state.applications[profileId] = [...(state.applications[profileId] ?? []), app];
};
export const upsertProfile = (profile: CompanyProfile): void => {
  const idx = state.profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) state.profiles[idx] = profile;
  else state.profiles = [...state.profiles, profile];
};
export const findProfileByPan = (pan: string): CompanyProfile | undefined =>
  state.profiles.find((p) => normPan(p.pan) === normPan(pan));
export const patchApplicationByCase = (
  profileId: string,
  onboardingCaseId: string,
  patch: Partial<Application>,
): void => {
  const list = state.applications[profileId] ?? [];
  state.applications[profileId] = list.map((a) =>
    a.onboardingCaseId === onboardingCaseId ? { ...a, ...patch } : a,
  );
};
export const pushHistory = (profileId: string, ev: Funnel['history'][number]): void => {
  state.history[profileId] = [...(state.history[profileId] ?? []), ev];
};

// --- Процесс (spine) — позиция клиента на линии (процессное-окно §1) ---

export const getProcess = (profileId: string): Promise<ProcessState | undefined> =>
  delay(state.process[profileId]);

// Списком — для колонки-этапа в реестре (входной-реестр §4): profileId → ProcessState.
export const getAllProcess = (): Promise<Record<string, ProcessState>> =>
  delay({ ...state.process });

// --- DVU-домен: очередь, задачи, four-eyes (spike §4/§5) ---

// Вся очередь (Queue-WS). Плоский список всех задач всех профилей.
export const getDvuQueue = (): Promise<DvuTask[]> => {
  const flat: DvuTask[] = [];
  for (const list of Object.values(state.dvuTasks)) flat.push(...list);
  return delay(flat);
};

// Задачи одного профиля (для блока «связанные DVU-задачи» в профиле — доказывает консистентность).
export const getDvuTasks = (profileId: string): Promise<DvuTask[]> =>
  delay(state.dvuTasks[profileId] ?? []);

export const getDvuTask = (taskId: string): Promise<DvuTask | undefined> => {
  for (const list of Object.values(state.dvuTasks)) {
    const t = list.find((x) => x.id === taskId);
    if (t) return delay(t);
  }
  return delay(undefined);
};

// Внутренний поиск задачи без delay (для мутаций).
const findTask = (taskId: string): { profileId: string; task: DvuTask } | undefined => {
  for (const [profileId, list] of Object.entries(state.dvuTasks)) {
    const task = list.find((x) => x.id === taskId);
    if (task) return { profileId, task };
  }
  return undefined;
};

const patchTask = (taskId: string, patch: Partial<DvuTask>): void => {
  for (const [profileId, list] of Object.entries(state.dvuTasks)) {
    if (list.some((x) => x.id === taskId)) {
      state.dvuTasks[profileId] = list.map((x) =>
        x.id === taskId ? { ...x, ...patch, updatedAt: nowIso() } : x,
      );
      return;
    }
  }
};

// Взять задачу на себя (исполнитель). assignedTo = currentUser.
export const takeDvuTask = (taskId: string, by: string): Promise<DvuTask> => {
  const found = findTask(taskId);
  if (!found) return Promise.reject(new Error('task not found'));
  const log = [...found.task.log, { at: nowIso(), by, action: 'taken' }];
  patchTask(taskId, { assignedTo: by, status: 'in-review', log });
  return delay(findTask(taskId)!.task);
};

// Результат резолва: ok | заблокировано four-eyes-гардом (исполнитель/ведущий = аппрувер).
export interface ResolveResult {
  ok: boolean;
  reason?: 'four-eyes';
  task?: DvuTask;
}

// Резолв задачи (аппрувер). FOUR-EYES-ГАРД (spike §5): один человек не может быть и
// исполнителем/ведущим сессию, и аппрувером по одной задаче.
export const resolveDvuTask = (
  taskId: string,
  outcome: DvuOutcome,
  by: string,
): Promise<ResolveResult> => {
  const found = findTask(taskId);
  if (!found) return delay({ ok: false });
  const { task } = found;

  // Гард segregation of duties: вёл сессию ИЛИ был исполнителем → не может аппрувить.
  if (task.performedBy === by || task.assignedTo === by) {
    return delay({ ok: false, reason: 'four-eyes' as const });
  }

  const status = outcome === 'approved' ? 'resolved' : outcome === 'rejected' ? 'rejected' : 'in-review';
  const log = [...task.log, { at: nowIso(), by, action: `resolved:${outcome}` }];
  patchTask(taskId, { status, outcome, approvedBy: by, log });

  // КОНСИСТЕНТНОСТЬ (тезис 1): мутируем ядро напрямую — история + узел spine + заявка.
  const profileId = found.profileId;
  state.history[profileId] = [
    ...(state.history[profileId] ?? []),
    {
      id: newId('crm-h'),
      kind: 'dvu-result',
      at: nowIso(),
      title: `DVU: ${outcome === 'approved' ? 'approved' : outcome === 'rejected' ? 'rejected' : 'more info requested'} — ${task.title}`,
      detail: `by ${by}`,
    },
  ];
  // Красим узел spine: approved → done и сдвигаем активный узел вперёд.
  const proc = state.process[profileId];
  if (proc) {
    const nextNodes = { ...proc.nodes };
    if (outcome === 'approved') nextNodes[task.node] = 'done';
    else if (outcome === 'rejected') nextNodes[task.node] = 'error';
    else nextNodes[task.node] = 'waiting';
    state.process[profileId] = { ...proc, nodes: nextNodes };
  }
  // Патчим заявку (если есть трассировка).
  if (task.onboardingCaseId && outcome === 'approved') {
    patchApplicationByCase(profileId, task.onboardingCaseId, { stage: 'signing' });
  }

  return delay({ ok: true, reason: undefined, task: findTask(taskId)!.task });
};

// --- Сброс демо ---
export const resetCrm = (): void => {
  state = structuredClone(seed);
  seq = 0;
};

// Внутренний реассайн state (используется reset.ts, чтобы держать единый синглтон).
export const __setState = (next: CrmState): void => {
  state = next;
};
export const __getState = (): CrmState => state;
