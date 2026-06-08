// «Локальный бэкенд понарошку» v2 (роль Sole Proprietor) — единый источник для экранов v2.
// Стейт в памяти. Когда придут разработчики — тело меняется на HTTP, экраны не трогая.
// Отдельно от src/mock/api.ts (v1, Private Limited).

import { aaravSharmaExports } from './seed';
import type {
  BnqAnswer,
  Business,
  ClientSession,
  Consent,
  ConsentType,
  DocumentRecord,
  ImportExport,
  Language,
  OnboardingCaseV2,
  Phone,
  ProgressStep,
  Proprietor,
  RiskAssessment,
  ScreeningResult,
  VCIPSession,
} from './types';

// Рабочая копия золотой записи.
let state: OnboardingCaseV2 = structuredClone(aaravSharmaExports);
let session: ClientSession | null = null;

// Имитация сетевой задержки для состояний загрузки.
const NETWORK_DELAY_MS = 350;
const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));

// --- Чтение ---
export const getCase = (): Promise<OnboardingCaseV2> => delay(state);
export const getProprietor = (): Promise<Proprietor> => delay(state.proprietor);
export const getBusiness = (): Promise<Business> => delay(state.business);
export const getBnq = (): Promise<BnqAnswer[]> => delay(state.bnq);
export const getConsents = (): Promise<Consent[]> => delay(state.consents);
export const getDocuments = (): Promise<DocumentRecord[]> => delay(state.documents);
export const getScreening = (): Promise<ScreeningResult[]> => delay(state.screening);
export const getImportExport = (): Promise<ImportExport> => delay(state.importExport);
export const getVcip = (): Promise<VCIPSession> => delay(state.vcip);
export const getProgress = (): Promise<ProgressStep[]> => delay(state.progress);
// Риск — внутренний; геттер есть для RM-стороны, но клиентские экраны его не зовут.
export const getRiskInternal = (): Promise<RiskAssessment> => delay(state.risk);
export const getSession = (): Promise<ClientSession | null> => delay(session);

// --- Мутации клиентского потока ---

// SP-03: проспект создаёт вход (email + телефон → OTP). Язык по умолчанию ru.
export const createSession = (
  email: string,
  phone: Phone,
  language: Language = 'ru',
): Promise<ClientSession> => {
  session = { email, phone, authenticated: false, language };
  return delay(session);
};

// SP-03: подтверждение OTP. Mock: код "0000" валиден.
export const verifyOtp = (
  code: string,
): Promise<{ ok: boolean; session: ClientSession | null }> => {
  if (!session) return delay({ ok: false, session: null });
  const ok = code === '0000';
  if (ok) session = { ...session, authenticated: true };
  return delay({ ok, session });
};

// Переключение языка интерфейса (доступно с лендинга SP-01 и далее).
export const setLanguage = (language: Language): Promise<Language> => {
  if (session) session = { ...session, language };
  return delay(language);
};

// SP-03/04/07/08: проставить согласие (given + timestamp IST).
export const giveConsent = (type: ConsentType, timestamp: string): Promise<Consent[]> => {
  state.consents = state.consents.map((c) =>
    c.type === type ? { ...c, status: 'given', timestamp } : c,
  );
  return delay(state.consents);
};

// SP-06: правка данных компании (режим Edit). Изменённое уходит на DVU-ревью.
export const updateBusiness = (patch: Partial<Business>): Promise<Business> => {
  state.business = { ...state.business, ...patch };
  return delay(state.business);
};

// SP-07: ответ BNQ (клиент подтвердил/ввёл). Обновляем по номеру вопроса.
export const answerBnq = (q: string, value: string): Promise<BnqAnswer[]> => {
  state.bnq = state.bnq.map((a) => (a.q === q ? { ...a, value, source: 'not_available' } : a));
  return delay(state.bnq);
};

// SP-09: владелец прошёл VCIP-сессию (mock).
export const passVcip = (): Promise<VCIPSession> => {
  state.vcip = { ...state.vcip, status: 'Passed' };
  // обновляем прогресс
  state.progress = state.progress.map((p) =>
    p.id === 'SP-09' ? { ...p, status: 'done', note: undefined } : p,
  );
  return delay(state.vcip);
};

// SP-07: загрузка документа (Business Licence / IEC) → Uploaded.
export const uploadDocument = (
  docType: DocumentRecord['docType'],
): Promise<DocumentRecord[]> => {
  state.documents = state.documents.map((d) =>
    d.docType === docType ? { ...d, status: 'Uploaded' } : d,
  );
  return delay(state.documents);
};

// SP-10: переход шага прогресса в нужный статус (для интерактива дашборда).
export const setStepStatus = (
  id: string,
  status: ProgressStep['status'],
): Promise<ProgressStep[]> => {
  state.progress = state.progress.map((p) => (p.id === id ? { ...p, status } : p));
  return delay(state.progress);
};

// Сброс к исходной золотой записи — перезапуск демо.
export const reset = (): void => {
  state = structuredClone(aaravSharmaExports);
  session = null;
};
