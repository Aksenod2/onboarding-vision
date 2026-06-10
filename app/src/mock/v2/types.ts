// Mock-модель v2 — роль Sole Proprietor (рынок Индия).
// Отдельная база от v1 (Private Limited). Не трогает src/mock/*.
// Источники: docs/Карта экранов v2.md, docs/BNQ Template A — Sole Proprietorship.md,
// docs/Consents — список (current).md.
// Ключевые отличия от v1: один владелец (= подписант), НЕТ CIN/MOA/Board Resolution,
// есть Udyam/GST, ответы BNQ с двойным сценарием Probe42, consents с timestamp, прогресс-дашборд.

// --- Индийские идентификаторы ---
export type PAN = string; // ABCPS1234K — 4-й символ 'P' = физлицо (Proprietor)
export type GSTIN = string; // 15 знаков
export type Aadhaar = string; // 12 цифр (маскируется в UI)
export type UdyamId = string; // UDYAM-XX-00-0000000
export type IEC = string; // 10 знаков, Importer Exporter Code
export type Phone = string; // +91 XXXXX XXXXX
export type IST = string; // 2026-06-08T14:05:00+05:30 — фиксация согласий

// Источник поля для UI: manual — вводит клиент; registry — из Probe42/реестра (бейдж);
// system — генерит система.
export type FieldSource = 'manual' | 'registry' | 'system';

// Probe42 «подтянул данные / нет» — двойной сценарий каждого вопроса BNQ.
export type DataAvailability = 'available' | 'not_available';

// --- Справочники ---
export type EntityType = 'Sole Proprietorship'; // v2 пока одна роль
export type OnboardingMode = 'STP' | 'Hybrid' | 'Offline';
export type RiskCategory = 'Low' | 'Medium' | 'High';
export type Language = 'ru' | 'en';

export type TaxResidency =
  | 'Indian National' // risk 1
  | 'NRI / OCI / Foreign national of RF not on employment VISA' // risk 2
  | 'Foreign national other'; // risk 3

export type CompanyResidency = 'Indian resident' | 'Foreign resident outside India';

// --- Структуры ---
export interface Address {
  line: string;
  city: string;
  state: string;
  pin: string;
}

// Единственное лицо: владелец = подписант. Никаких signatories[].
export interface Proprietor {
  fullName: string;
  pan: PAN;
  aadhaar?: Aadhaar; // появляется на e-KYC / VCIP
  email?: string;
  phone?: Phone;
  taxResidency: TaxResidency; // BNQ Q4 (на лицо)
  isPEP: boolean; // BNQ Q5 (на лицо)
}

export interface Business {
  entityType: EntityType;
  tradeName: string; // имя бизнеса (Sole Prop не имеет «company name» в реестре компаний)
  pan: PAN; // PAN владельца — он же PAN бизнеса у Sole Prop
  gstin: GSTIN;
  udyam: UdyamId;
  commencementDate: string; // DD-MM-YYYY (аналог даты инкорпорации; считаем vintage)
  registeredAddress: Address;
  industry: string; // BNQ Q1
  segment: string; // BNQ Q1
  companyResidency: CompanyResidency; // BNQ Q3
  // Доп. секция (ручной ввод клиента, Задача 10 B7/B8) — не из реестра:
  correspondenceAddress?: string; // B7 — только если отличается от registered
  chequeBookRequired?: boolean; // B8 — нужна ли чековая книжка
}

// --- BNQ: ответы опросника Q1…Q11 ---
export interface BnqAnswer {
  q: string; // 'Q1'…'Q11'
  attribute: string; // 'Business Industry / Segment'
  block: 1 | 2; // 1 — risk categorization, 2 — additional
  source: DataAvailability; // Probe42 подтянул или клиент вводил
  value: string; // итоговый ответ
  riskScore: number | null; // внутренний (1–3), клиенту НЕ показываем; null — не влияет на риск
  triggered?: 'DVU' | 'CRM'; // фоновый алерт по этому ответу
}

// --- Consents (см. docs/Consents — список (current).md) ---
export type ConsentType =
  | 'Cookie' // 1
  | 'Terms & Conditions' // 2b (MVP)
  | 'Privacy Notice' // 3
  | 'Registry Access' // BR-01 (доступ к реестрам до PAN)
  | 'KMP Confirmation' // 4
  | 'Data Principals' // 5
  | 'Aadhaar' // 6
  | 'Data Accuracy'; // 7 (достоверность на Review)
export type ConsentStatus = 'given' | 'pending';

export interface Consent {
  type: ConsentType;
  mandatory: boolean;
  status: ConsentStatus;
  screen: string; // на каком экране берётся: 'SP-03' | 'SP-04' | 'SP-07' | 'SP-08'
  timestamp?: IST; // момент согласия (IST), фиксируется при given
}

// --- Документы (Sole Prop: НЕТ CIN/MOA/Board Resolution) ---
export type DocType =
  | 'PAN card'
  | 'Aadhaar'
  | 'GST registration'
  | 'Udyam registration'
  | 'Address Proof'
  | 'Business Licence' // по индустрии (BNQ Q1)
  | 'IEC'; // ВЭД (BNQ Q11)
export type DocHandling = 'Auto fetch (STP)' | 'Upload' | 'Physical';
export type DocStatus = 'Fetched' | 'Uploaded' | 'Pending' | 'Verified';
export type DocVerifiedBy = 'System' | 'DVU';

export interface DocumentRecord {
  docType: DocType;
  mandatory: boolean;
  handling: DocHandling;
  status: DocStatus;
  verifiedBy?: DocVerifiedBy;
}

// --- Скрининг (компания + лицо «Стоп-42») ---
export type CheckType = 'PAN' | 'OFAC/Sanctions' | 'Probe42' | 'CKYC' | 'Stop-42';
export type CheckStatus = 'Pass' | 'Alert' | 'Fetched' | 'Found' | 'NotFound';

export interface ScreeningResult {
  checkType: CheckType;
  status: CheckStatus;
  detail: string;
  routedToDVU: boolean;
}

// --- Риск (внутренний, клиенту не показываем) ---
export interface RiskAssessment {
  totalScore: number; // сумма BNQ-баллов (8–24)
  category: RiskCategory;
  shownToClient: false; // маркер: на клиентских экранах не отображаем
}

// --- VCIP: один сеанс (один владелец) ---
export interface VCIPSession {
  personName: string;
  method: 'selfVKYC' | 'assistedVKYC' | 'F2F';
  status: 'Pending' | 'Passed' | 'Failed';
}

// --- Import/Export (BNQ Q9–Q11) ---
export interface ImportExport {
  dealsIn: 'export only' | 'import only' | 'both' | 'none';
  countries: string[];
  iec?: IEC;
  iecUpload: 'now' | 'later' | 'n/a';
}

// --- Прогресс онбординга (для дашборда SP-10: живая карта с «Requires Action») ---
// verifying — банк проверяет, от клиента ничего не требуется (BR-15, спокойный сине-серый, не warning)
export type StepStatus = 'done' | 'current' | 'pending' | 'requires_action' | 'verifying';
export interface ProgressStep {
  id: string; // 'SP-05'
  title: string;
  status: StepStatus;
  note?: string; // что требуется от клиента, если requires_action
}

// --- Обёртка кейса v2 ---
export interface OnboardingCaseV2 {
  id: string;
  mode: OnboardingMode;
  status: 'Draft' | 'InProgress' | 'Completed';
  currentScreen: string; // 'SP-01'…'SP-10'
  proprietor: Proprietor;
  business: Business;
  bnq: BnqAnswer[];
  consents: Consent[];
  documents: DocumentRecord[];
  screening: ScreeningResult[];
  importExport: ImportExport;
  risk: RiskAssessment;
  vcip: VCIPSession;
  progress: ProgressStep[];
}

// --- Сессия клиента (SP-03: логин) + язык интерфейса ---
export interface ClientSession {
  email: string;
  phone: Phone;
  authenticated: boolean;
  language: Language; // по умолчанию 'ru'
}

// Карта источников полей Business — для UI (что редактируемо / из реестра).
export const businessFieldSources: Record<keyof Business, FieldSource> = {
  entityType: 'system',
  tradeName: 'registry',
  pan: 'manual',
  gstin: 'registry',
  udyam: 'registry',
  commencementDate: 'registry',
  registeredAddress: 'registry',
  industry: 'manual',
  segment: 'manual',
  companyResidency: 'registry',
  correspondenceAddress: 'manual',
  chequeBookRequired: 'manual',
};
