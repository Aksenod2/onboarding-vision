// «Локальный бэкенд понарошку»: единый источник данных для всех экранов.
// Стейт живёт в памяти (без persistence — для демо-клика достаточно).
// Экраны зовут эти функции, а не лезут в seed напрямую → когда придут
// разработчики, тело заменяется на реальные HTTP-запросы, экраны не трогая.

import { saanviTextiles } from './seed';
import type {
  Account,
  AuthorizedSignatory,
  ClientSession,
  Company,
  DocumentRecord,
  OnboardingCase,
  Phone,
  RiskAssessment,
  ScreeningResult,
  VCIPSession,
} from './types';

// Мутабельная копия золотой записи — рабочее состояние сессии.
let state: OnboardingCase = structuredClone(saanviTextiles);
let session: ClientSession | null = null;

// CL-07: документы к загрузке (Hybrid/Offline-сценарий). Стартуют Pending.
const REQUIRED_UPLOADS: DocumentRecord[] = [
  { docType: 'Board Resolution / Authority Letter', applicableTo: 'Company', mandatory: true, handling: 'Upload (Hybrid)', status: 'Pending' },
  { docType: 'MOA & AOA', applicableTo: 'Company', mandatory: true, handling: 'Upload (Hybrid)', status: 'Pending' },
  { docType: 'Address Proof', applicableTo: 'Company', mandatory: true, handling: 'Upload (Hybrid)', status: 'Pending' },
];
let uploads: DocumentRecord[] = structuredClone(REQUIRED_UPLOADS);

// Имитация сетевой задержки, чтобы экраны показывали состояния загрузки.
const NETWORK_DELAY_MS = 350;
const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));

// --- Чтение ---
export const getOnboardingCase = (): Promise<OnboardingCase> => delay(state);
export const getCompany = (): Promise<Company> => delay(state.company);
export const getSignatories = (): Promise<AuthorizedSignatory[]> => delay(state.signatories);
export const getDocuments = (): Promise<DocumentRecord[]> => delay(state.documents);
export const getScreening = (): Promise<ScreeningResult[]> => delay(state.screening);
export const getRiskAssessment = (): Promise<RiskAssessment> => delay(state.risk);
export const getAccount = (): Promise<Account | undefined> => delay(state.account);
export const getSession = (): Promise<ClientSession | null> => delay(session);
export const getVcip = (): Promise<VCIPSession[]> => delay(state.vcip);
export const getRequiredDocuments = (): Promise<DocumentRecord[]> => delay(uploads);

// --- Мутации ---
export const updateCompany = (patch: Partial<Company>): Promise<Company> => {
  state.company = { ...state.company, ...patch };
  return delay(state.company);
};

// CL-03: добавление подписанта (Board Resolution). Источник истины — state.
export const addSignatory = (s: AuthorizedSignatory): Promise<AuthorizedSignatory[]> => {
  state.signatories = [...state.signatories, s];
  return delay(state.signatories);
};

// CL-02: проспект создаёт учётную запись и входит (email + телефон → OTP).
export const createPerson = (email: string, phone: Phone): Promise<ClientSession> => {
  session = { email, phone, authenticated: false };
  return delay(session);
};

// CL-02: подтверждение OTP-кода. Mock: код "0000" всегда валиден.
export const verifyOtp = (code: string): Promise<{ ok: boolean; session: ClientSession | null }> => {
  if (!session) return delay({ ok: false, session: null });
  const ok = code === '0000';
  if (ok) session = { ...session, authenticated: true };
  return delay({ ok, session });
};

// CL-06: подписант прошёл self-VKYC видеосессию (mock).
export const passVcip = (signatoryId: string): Promise<VCIPSession[]> => {
  state.vcip = state.vcip.map((v) =>
    v.signatoryId === signatoryId ? { ...v, status: 'Passed' } : v,
  );
  return delay(state.vcip);
};

// CL-07: загрузка документа (mock) → статус Uploaded.
export const uploadDocument = (docType: DocumentRecord['docType']): Promise<DocumentRecord[]> => {
  uploads = uploads.map((d) => (d.docType === docType ? { ...d, status: 'Uploaded' } : d));
  return delay(uploads);
};

// CL-09: триггер открытия счёта (шаг 009). Mock: генерим CIF/реквизиты для STP.
export const openAccount = (): Promise<Account> => {
  if (!state.account) {
    state.account = {
      cif: 'CIF-IN-2026-784512',
      accountClass: '4000',
      currency: 'INR',
      productName: 'Current Account',
      mode: state.mode,
    };
    state.status = 'Completed';
    state.currentStep = '009';
  }
  return delay(state.account);
};

// Сброс к исходной золотой записи — удобно для перезапуска демо.
export const reset = (): void => {
  state = structuredClone(saanviTextiles);
  session = null;
  uploads = structuredClone(REQUIRED_UPLOADS);
};
