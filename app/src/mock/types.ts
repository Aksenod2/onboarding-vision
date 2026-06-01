// Mock-модель данных онбординга юрлиц (рынок Индия).
// Источник истины — docs/Mock-модель данных.md. Здесь — её типизация.
// Ядро: Private Limited (STP-кейс). Остальные типы юрлиц доращиваем позже.

// --- Индийские идентификаторы (формат — в docs, здесь просто string-алиасы) ---
export type PAN = string; // AAAAA9999A
export type CIN = string; // U+5+2+4+тип+6
export type GSTIN = string; // 15 знаков
export type Aadhaar = string; // 12 цифр
export type CKYCId = string; // 14 цифр
export type Phone = string; // +91 XXXXX XXXXX

// --- Источник поля: критично для UI ---
// manual   — вводит клиент (редактируемое)
// registry — авто из реестра (бейдж «из реестра», как правило read-only)
// system   — генерит система (read-only)
export type FieldSource = 'manual' | 'registry' | 'system';

// --- Справочники (enums) ---
export type EntityType =
  | 'Private Limited Company'
  | 'Public Limited Company'
  | 'LLP'
  | 'Partnership Firm'
  | 'Sole Proprietorship';

export type OnboardingMode = 'STP' | 'Hybrid' | 'Offline';
export type RiskCategory = 'Low' | 'Medium' | 'High';
export type AccountClass = '4000' | '4500';
export type Currency = 'INR';
export type ResidencyStatus = 'Resident' | 'Non-Resident';

export type DocType =
  | 'PAN card'
  | 'Certificate of Incorporation'
  | 'MOA & AOA'
  | 'Board Resolution / Authority Letter'
  | 'Partnership Deed'
  | 'Shareholding pattern'
  | 'Address Proof';
export type DocApplicableTo = 'Company' | 'Signatory';
export type DocHandling = 'Auto fetch (STP)' | 'Upload (Hybrid)' | 'Physical (Offline)';
export type DocStatus = 'Fetched' | 'Uploaded' | 'Pending' | 'Verified';
export type DocVerifiedBy = 'System' | 'DVU';

export type CheckType = 'PAN' | 'OFAC' | 'CRILC' | 'CKYC' | 'Probe42';
export type CheckStatus = 'Pass' | 'Alert' | 'NotFound' | 'Found' | 'Fetched';

// --- Структуры ---
export interface Address {
  line: string; // Unit 402, Lotus Business Park, Andheri East
  city: string; // Mumbai
  state: string; // Maharashtra
  pin: string; // 400069
}

export interface Company {
  entityType: EntityType;
  companyName: string;
  pan: PAN;
  cin: CIN;
  gstin: GSTIN;
  incorporationDate: string; // DD-MM-YYYY
  registeredAddress: Address;
  correspondenceAddress?: Address; // только если отличается
  industry: string;
  chequeBookRequired: boolean;
}

export interface AuthorizedSignatory {
  id: string;
  fullName: string;
  pan: PAN;
  aadhaar?: Aadhaar; // появляется на eKyc
  designation: string;
  email?: string;
  phone?: Phone;
  residencyStatus: ResidencyStatus;
  isPEP: boolean;
}

export interface DocumentRecord {
  docType: DocType;
  applicableTo: DocApplicableTo;
  mandatory: boolean;
  handling: DocHandling;
  status: DocStatus;
  verifiedBy?: DocVerifiedBy;
}

export interface ScreeningResult {
  checkType: CheckType;
  status: CheckStatus;
  detail: string;
  routedToDVU: boolean;
}

export interface RiskAssessment {
  category: RiskCategory;
  highRiskIndustry: boolean;
  crmHeadApprovalRequired: boolean;
}

export interface Account {
  cif: string;
  accountClass: AccountClass;
  currency: Currency;
  productName: string;
  mode: OnboardingMode;
}

// Видеоидентификация (VCIP) — в золотой записи присутствует, поля минимальны
export interface VCIPSession {
  signatoryId: string;
  method: 'selfVKYC' | 'assistedVKYC' | 'F2F';
  status: 'Pending' | 'Passed' | 'Failed';
}

// Обёртка над всем кейсом
export interface OnboardingCase {
  id: string;
  mode: OnboardingMode;
  status: 'Draft' | 'InProgress' | 'Completed';
  currentStep: string; // 001…009
  company: Company;
  signatories: AuthorizedSignatory[];
  documents: DocumentRecord[];
  screening: ScreeningResult[];
  risk: RiskAssessment;
  vcip: VCIPSession[];
  account?: Account; // появляется на шаге открытия счёта
  ckycId?: CKYCId;
}

// --- Сессия клиента (создаётся на CL-02: логин) ---
export interface ClientSession {
  email: string;
  phone: Phone;
  authenticated: boolean;
}

// Карта источников полей Company — для UI (что редактируемо / из реестра / read-only).
// Экран читает source, чтобы решить: TextField vs read-only + бейдж «из реестра».
export const companyFieldSources: Record<keyof Company, FieldSource> = {
  entityType: 'manual',
  companyName: 'registry',
  pan: 'manual',
  cin: 'registry',
  gstin: 'registry',
  incorporationDate: 'registry',
  registeredAddress: 'registry',
  correspondenceAddress: 'manual',
  industry: 'manual',
  chequeBookRequired: 'manual',
};
