// «Локальный бэкенд понарошку» для сценария КОМПАНИЯ. Стейт в памяти, отдельно от SP-api.
// Источник: docs/Компания — спека ДЕТАЛЬНАЯ (логика).md.

import { mehtaTextiles } from './companySeed';
import type {
  CompanyCaseV2, CompanyDetails, Signatory, SignatoryStep, BoardResolution, BrSource,
} from './companyTypes';
import { goesThroughPhaseB } from './companyTypes';
import type { ConsentType } from './types';

let state: CompanyCaseV2 = structuredClone(mehtaTextiles);

const NETWORK_DELAY_MS = 350;
const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));

// IST-таймстамп (для согласий/подписей). В демо берём фиксированный вид.
const nowIST = (): string => new Date().toISOString();

// --- Чтение ---
export const getCompanyCase = (): Promise<CompanyCaseV2> => delay(state);
export const getCompany = (): Promise<CompanyDetails> => delay(state.company);
export const getSignatories = (): Promise<Signatory[]> => delay(state.signatories);
export const getSignatory = (id: string): Promise<Signatory | undefined> =>
  delay(state.signatories.find((s) => s.id === id));
export const getBoardResolution = (): Promise<BoardResolution> => delay(state.br);

// --- Фаза A ---

// Согласие уровня компании (Registry Access на шаге PAN).
export const giveCompanyConsent = (type: ConsentType, timestamp = nowIST()): Promise<void> => {
  state.consents = state.consents.map((c) =>
    c.type === type ? { ...c, status: 'given', timestamp } : c,
  );
  return delay(undefined);
};

// Добавить подписанта вручную (Authorized Signatory не из реестра).
// BRD: «nominated person can add other AS». Возвращает id созданного подписанта.
let manualSeq = 0;
export const addSignatory = (input: { fullName: string; email: string; phone: string }): Promise<string> => {
  const id = `sig-as-${Date.now()}-${manualSeq++}`;
  const next: Signatory = {
    id,
    fullName: input.fullName,
    roles: ['AuthorizedSignatory'],
    pan: '', // не из реестра — PAN привяжется в личной сессии (Aadhaar eKYC)
    panSource: 'manual',
    email: input.email,
    phone: input.phone,
    inviteSent: false,
    currentStep: 'waiting',
    status: 'waiting',
    consents: [
      { type: 'Privacy Notice', mandatory: true, status: 'pending', screen: 'CO-B1' },
      { type: 'Data Principals', mandatory: true, status: 'pending', screen: 'CO-B1' },
      { type: 'Aadhaar', mandatory: true, status: 'pending', screen: 'CO-B2' },
      { type: 'VKYC', mandatory: true, status: 'pending', screen: 'CO-B3' },
    ],
    vcip: { personName: input.fullName, method: 'selfVKYC', status: 'Pending' },
    signature: { signed: false, method: 'DSC' },
  };
  state.signatories = [...state.signatories, next];
  return delay(id);
};

// Обновить контактные данные подписанта (ФИО/email/телефон) — для редактируемых AS-карточек.
export const updateSignatoryContact = (
  id: string,
  patch: { fullName?: string; email?: string; phone?: string },
): Promise<Signatory[]> => {
  state.signatories = state.signatories.map((s) =>
    s.id === id ? { ...s, ...patch } : s,
  );
  return delay(state.signatories);
};

// Удалить подписанта, добавленного вручную (AS без роли Director).
// Защита: директоров (registry) и комбинированные роли не трогаем.
export const removeSignatory = (id: string): Promise<Signatory[]> => {
  state.signatories = state.signatories.filter((s) => {
    if (s.id !== id) return true;
    const removable = s.roles.includes('AuthorizedSignatory') && !s.roles.includes('Director');
    return !removable; // удаляем только если это «чистый» AS
  });
  return delay(state.signatories);
};

// Источник Board Resolution: шаблон банка (STP) либо загрузка своего (→ DVU).
export const setBoardResolutionSource = (source: BrSource, fileName?: string): Promise<BoardResolution> => {
  state.br = {
    ...state.br,
    brSource: source,
    template: source === 'template' ? 'bank' : 'own',
    brFileName: source === 'upload' ? fileName : undefined,
  };
  return delay(state.br);
};

// Подтверждение состава BR (фаза A, BR-вопросы): фиксируем подписантов + генерим BR.
export const confirmBoardResolution = (): Promise<BoardResolution> => {
  const ts = nowIST();
  state.br = { ...state.br, confirmed: true, confirmedAt: ts, date: ts };
  return delay(state.br);
};

// Подтверждение данных компании (фаза A, экран обзора).
export const confirmCompanyData = (): Promise<void> => {
  state.dataConfirmed = true;
  return delay(undefined);
};

// Рассылка ссылок подписантам: всем, кто проходит фазу B (Director/AS).
export const dispatchInvites = (): Promise<Signatory[]> => {
  state.signatories = state.signatories.map((s) =>
    goesThroughPhaseB(s) ? { ...s, inviteSent: true } : s,
  );
  state.status = 'InProgress';
  state.currentScreen = 'CO-DASHBOARD';
  return delay(state.signatories);
};

// --- Фаза B (по конкретному подписанту) ---

// Продвинуть шаг подписанта. status выводится из шага.
export const setSignatoryStep = (id: string, step: SignatoryStep): Promise<Signatory[]> => {
  state.signatories = state.signatories.map((s) => {
    if (s.id !== id) return s;
    const status: Signatory['status'] = step === 'done' ? 'done' : step === 'waiting' ? 'waiting' : 'in_progress';
    return { ...s, currentStep: step, status };
  });
  recomputeCompletion();
  return delay(state.signatories);
};

// Личное согласие подписанта (фаза B).
export const giveSignatoryConsent = (id: string, type: ConsentType, timestamp = nowIST()): Promise<void> => {
  state.signatories = state.signatories.map((s) =>
    s.id === id
      ? { ...s, consents: s.consents.map((c) => (c.type === type ? { ...c, status: 'given', timestamp } : c)) }
      : s,
  );
  return delay(undefined);
};

// Подписант прошёл видеоидентификацию.
export const passSignatoryVcip = (id: string): Promise<void> => {
  state.signatories = state.signatories.map((s) =>
    s.id === id ? { ...s, vcip: { ...s.vcip, status: 'Passed' } } : s,
  );
  return delay(undefined);
};

// Подписант поставил DSC-подпись → шаг done.
export const signByDsc = (id: string): Promise<Signatory[]> => {
  const ts = nowIST();
  state.signatories = state.signatories.map((s) =>
    s.id === id
      ? { ...s, signature: { signed: true, method: 'DSC', timestamp: ts }, currentStep: 'done', status: 'done' }
      : s,
  );
  recomputeCompletion();
  return delay(state.signatories);
};

// Счёт открыт ⟺ все подписанты (с ролью Director/AS) = done.
function recomputeCompletion(): void {
  const required = state.signatories.filter(goesThroughPhaseB);
  const allDone = required.length > 0 && required.every((s) => s.status === 'done');
  state.status = allDone ? 'Completed' : 'InProgress';
}

export const isAccountOpen = (): boolean => state.status === 'Completed';

// Сброс демо.
export const resetCompany = (): void => {
  state = structuredClone(mehtaTextiles);
};
