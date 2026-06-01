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
  DVUTask,
  OnboardingMode,
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

// RM (Менеджер): очередь DVU-задач. Порождены провалом авто-проверок (домен OBO).
const DVU_SEED: DVUTask[] = [
  { id: 'DVU-1042', domain: 'OBO', companyName: 'Saanvi Textiles Private Limited', reason: 'Board Resolution требует ручной сверки подписей', priority: 'High', status: 'New', createdAt: '01-06-2026' },
  { id: 'DVU-1043', domain: 'OBO', companyName: 'Meridian Exports LLP', reason: 'Адрес не совпал с реестром (Probe42)', priority: 'Medium', status: 'New', createdAt: '01-06-2026' },
  { id: 'DVU-1039', domain: 'OBO', companyName: 'Kapoor Trading Co.', reason: 'Address Proof нечитаемый — нужен повтор', priority: 'Low', status: 'InProgress', createdAt: '31-05-2026' },
  { id: 'DVU-1031', domain: 'OBO', companyName: 'Nimbus Logistics Pvt Ltd', reason: 'Расхождение наименования с CIN', priority: 'Medium', status: 'New', createdAt: '31-05-2026' },
];
let dvuTasks: DVUTask[] = structuredClone(DVU_SEED);

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

// CL-04: риск-категория задаёт режим онбординга (STP/Hybrid/Offline).
export const setOnboardingMode = (mode: OnboardingMode): Promise<OnboardingCase> => {
  state.mode = mode;
  return delay(state);
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

// --- RM (Менеджер): DVU-задачи ---
export const getDvuTasks = (): Promise<DVUTask[]> => delay(dvuTasks);
export const getDvuTask = (id: string): Promise<DVUTask | undefined> =>
  delay(dvuTasks.find((t) => t.id === id));

const setTaskStatus = (id: string, status: DVUTask['status']): Promise<DVUTask[]> => {
  dvuTasks = dvuTasks.map((t) => (t.id === id ? { ...t, status } : t));
  return delay(dvuTasks);
};

// RM-01: взять задачу в работу.
export const takeTask = (id: string) => setTaskStatus(id, 'InProgress');
// RM-02: резолюция — данные/документы валидны.
export const resolveTask = (id: string) => setTaskStatus(id, 'Resolved');
// RM-02: запросить документы у клиента (нотификация, транзит назад).
export const requestDocuments = (id: string) => setTaskStatus(id, 'DocumentsRequested');

// Сброс к исходной золотой записи — удобно для перезапуска демо.
export const reset = (): void => {
  state = structuredClone(saanviTextiles);
  session = null;
  uploads = structuredClone(REQUIRED_UPLOADS);
  dvuTasks = structuredClone(DVU_SEED);
};
