// «Локальный бэкенд понарошку» для сценария КОМПАНИЯ. Стейт в памяти, отдельно от SP-api.
// Источник: docs/Компания — спека ДЕТАЛЬНАЯ (логика).md.

import { mehtaTextiles } from './companySeed';
import type {
  CompanyCaseV2, CompanyDetails, Signatory, SignatoryStep, BoardResolution, BrSource,
  Ubo, FatcaClassification, CompanyDocument,
} from './companyTypes';
import { goesThroughPhaseB } from './companyTypes';
import type { ConsentType, BnqAnswer } from './types';

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
export const getBnq = (): Promise<BnqAnswer[]> => delay(state.bnq);
export const getUbo = (): Promise<Ubo[]> => delay(state.ubo);
export const getCompanyDocuments = (): Promise<CompanyDocument[]> => delay(state.companyDocuments);

// --- Вход компании (точка входа = Aadhaar-авторизация) ---

const emptyEntry = () => ({ consentsGiven: false, aadhaarVerified: false, passcodeSet: false });

export const getCompanyEntry = (): Promise<NonNullable<CompanyCaseV2['entry']>> =>
  delay(state.entry ?? emptyEntry());

// Согласия ДО Aadhaar (регуляторика): Aadhaar eKYC consent + Privacy Notice + согласие на реестры.
export const giveCompanyEntryConsent = (): Promise<void> => {
  state.entry = { ...(state.entry ?? emptyEntry()), consentsGiven: true };
  // Фиксируем доступ к реестрам на уровне компании (как giveCompanyConsent на PAN).
  state.consents = state.consents.map((c) =>
    c.type === 'Registry Access' ? { ...c, status: 'given', timestamp: nowIST() } : c,
  );
  return delay(undefined);
};

// Aadhaar-авторизация инициатора: «скан» QR → данные из UIDAI (подтягиваем email/phone).
export const passCompanyAadhaar = (): Promise<{ email: string; phone: string }> => {
  // Контакты инициатора (демо) — из первого директора сид-компании.
  const initiator = state.signatories[0];
  const email = initiator?.email ?? 'rajesh.mehta@mehtatextiles.in';
  const phone = initiator?.phone ?? '+91 98201 33445';
  state.entry = { ...(state.entry ?? emptyEntry()), aadhaarVerified: true, email, phone };
  return delay({ email, phone });
};

// Пин-код (цифры) = креды интернет-банка. Логин привязан к email (заглушка Марго).
export const setCompanyPasscode = (passcode: string): Promise<void> => {
  state.entry = { ...(state.entry ?? emptyEntry()), passcodeSet: true, passcode };
  return delay(undefined);
};

// Повторный вход (Денис: email + пин). Демо: сверяем email/пин с сохранёнными во входе.
export const loginCompany = (email: string, passcode: string): Promise<boolean> => {
  const e = state.entry;
  // Email сравниваем регистронезависимо (Глеб): name@Company.in === name@company.in.
  const emailMatch = (e?.email ?? '').toLowerCase() === email.toLowerCase();
  const ok = !!e?.passcodeSet && emailMatch && e?.passcode === passcode;
  return delay(ok);
};

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

// Правка ответа бизнес-анкеты (агентность: представитель может скорректировать предзаполненное).
export const updateBnqAnswer = (q: string, value: string): Promise<BnqAnswer[]> => {
  state.bnq = state.bnq.map((a) => (a.q === q ? { ...a, value } : a));
  return delay(state.bnq);
};

// Правка данных компании (фаза A): корреспондентский адрес (manual) и т.п.
export const updateCompanyData = (patch: Partial<CompanyDetails>): Promise<CompanyDetails> => {
  state.company = { ...state.company, ...patch };
  return delay(state.company);
};

// --- UBO + FATCA/CRS (бизнес-профиль, BRD #8) ---
let uboSeq = 0;
export const addUbo = (input: { fullName: string; sharePct: number; pan: string }): Promise<Ubo[]> => {
  const next: Ubo = {
    id: `ubo-${Date.now()}-${uboSeq++}`,
    fullName: input.fullName,
    sharePct: input.sharePct,
    pan: input.pan,
    source: 'manual',
  };
  state.ubo = [...state.ubo, next];
  return delay(state.ubo);
};

export const updateUbo = (id: string, patch: Partial<Omit<Ubo, 'id'>>): Promise<Ubo[]> => {
  state.ubo = state.ubo.map((u) => (u.id === id ? { ...u, ...patch } : u));
  return delay(state.ubo);
};

export const removeUbo = (id: string): Promise<Ubo[]> => {
  state.ubo = state.ubo.filter((u) => u.id !== id);
  return delay(state.ubo);
};

export const setUboDeclared = (declared: boolean): Promise<void> => {
  state.uboDeclared = declared;
  return delay(undefined);
};

export const setFatca = (classification: FatcaClassification, taxResidency: string): Promise<void> => {
  state.fatcaClassification = classification;
  state.taxResidency = taxResidency;
  return delay(undefined);
};

// --- Документы компании (#16 — fallback-загрузка) ---

// Загрузить недостающий документ (source 'required' → 'uploaded').
export const uploadCompanyDocument = (id: string, fileName: string): Promise<CompanyDocument[]> => {
  state.companyDocuments = state.companyDocuments.map((d) =>
    d.id === id ? { ...d, source: 'uploaded', fileName } : d,
  );
  return delay(state.companyDocuments);
};

// Заменить подтянутый/загруженный документ своим файлом (source → 'uploaded').
export const replaceCompanyDocument = (id: string, fileName = 'document.pdf'): Promise<CompanyDocument[]> => {
  state.companyDocuments = state.companyDocuments.map((d) =>
    d.id === id ? { ...d, source: 'uploaded', fileName } : d,
  );
  return delay(state.companyDocuments);
};

// #34 — догрузка документа по обратному запросу банка (DVU). Возвращает обновлённый запрос.
export const uploadDvuDocument = (fileName: string): Promise<CompanyCaseV2['dvuRequest']> => {
  if (state.dvuRequest) {
    state.dvuRequest = { ...state.dvuRequest, status: 'uploaded', fileName };
  }
  return delay(state.dvuRequest);
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

// Напомнить подписанту (mock: помечаем reminderSent на карточке).
export const remindSignatory = (id: string): Promise<Signatory[]> => {
  state.signatories = state.signatories.map((s) =>
    s.id === id ? { ...s, reminderSent: true } : s,
  );
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
