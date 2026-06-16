// Mock-модель сценария КОМПАНИЯ (рынок Индия) — отдельно от Sole Proprietor.
// Источник: docs/Компания — спека ДЕТАЛЬНАЯ (логика).md (Боря) + решения Дениса 2026-06-16.
// Ключевое отличие от Sole Proprietor: мультироль (roles[]), несколько подписантов,
// две фазы (заполнитель готовит → каждый подписант проходит свою сессию), Board Resolution, DSC-подпись.

import type {
  PAN, GSTIN, Aadhaar, Phone, IST, Address, FieldSource,
  BnqAnswer, Consent, DocumentRecord, ScreeningResult, RiskAssessment,
  VCIPSession, OnboardingMode,
} from './types';

// --- Роли: МУЛЬТИРОЛЬ. Одно лицо несёт набор ролей (решение Дениса 2026-06-16). ---
export type Role =
  | 'CustomerRepresentative' // заполнитель/инициатор заявки (термин Дениса)
  | 'Director' // директор компании (подписывает BR)
  | 'AuthorizedSignatory' // распоряжается счётом (Admin role); по BRD — обычно один из директоров
  | 'UBO'; // бенефициар >10%

// Тип юрлица сценария Company (EntityType в types.ts остаётся 'Sole Proprietorship' для SP).
export type CompanyEntityType = 'Company';
export type CompanyStatusReg = 'Active' | 'Dormant';

// --- Прогресс личной сессии подписанта (фаза B) ---
export type SignatoryStep =
  | 'waiting' // ссылка отправлена, подписант ещё не заходил
  | 'consents' // даёт согласия
  | 'aadhaar' // Aadhaar eKYC
  | 'vkyc' // видеоидентификация
  | 'dsc-sign' // подписание по DSC
  | 'done'; // прошёл всё
export type SignatoryStatus = 'waiting' | 'in_progress' | 'done';

// --- Подписант (директор / AS / UBO в любом сочетании) ---
export interface Signatory {
  id: string;
  fullName: string;
  roles: Role[]; // мультироль
  pan: PAN;
  panSource: FieldSource; // registry — директор из Probe; manual — AS не из реестра
  email: string; // ручной ввод в BR-вопросах (для ссылок/OTP/VKYC)
  phone: Phone;
  designation?: string; // из Probe для директоров (Director / Managing Director / Company Secretary)
  inviteSent: boolean; // фаза A шаг рассылки
  reminderSent?: boolean; // #18a — представитель отправил напоминание
  // личная сессия (фаза B):
  currentStep: SignatoryStep;
  status: SignatoryStatus;
  aadhaar?: Aadhaar; // привязывается на шаге Aadhaar (маска в UI)
  consents: Consent[]; // личные согласия подписанта
  vcip: VCIPSession; // его видеосессия
  signature: { signed: boolean; method: 'DSC'; timestamp?: IST };
}

// --- Board Resolution (генерируется банком по шаблону; happy-flow) ---
// Источник BR (первый вопрос BRD): 'template' = онлайн-шаблон банка (STP);
// 'upload' = клиент грузит свой BR → распознавание (IDP/OCR) → ручная проверка менеджером (No STP → DVU).
export type BrSource = 'template' | 'upload';

export interface BoardResolution {
  template: 'bank' | 'own'; // happy = 'bank' (генерим); 'own' = загрузка (DVU, out of scope)
  brSource: BrSource; // выбор клиента: шаблон банка / загрузка своего
  brFileName?: string; // имя загруженного файла (только при brSource='upload')
  companyName: string; // авто из Probe
  cin: string; // авто
  address: string; // авто
  date?: IST; // авто-таймстамп при подтверждении
  confirmed: boolean;
  confirmedAt?: IST;
}

// --- FATCA/CRS-классификация компании (требование BRD, аудит дыр #8) ---
// Active NFFE — активная нефинансовая структура; Passive NFFE — пассивная (доход в осн. пассивный);
// Financial Institution — финансовая организация. По умолчанию India.
export type FatcaClassification = 'Active NFFE' | 'Passive NFFE' | 'Financial Institution';

// --- UBO (Ultimate Beneficial Owner) — бенефициарный владелец компании ---
// BRD: UBO identification (доля ≥ 25%). Заполняется представителем в фазе A.
export interface Ubo {
  id: string;
  fullName: string;
  sharePct: number; // доля владения, %
  pan: PAN;
  source: FieldSource; // registry — подтянут (напр. из подписантов); manual — добавлен вручную
}

// --- Документы компании (fallback-загрузка, решение Дениса 2026-06-16) ---
// По BRD документы тянутся из Probe42/CKYC; загрузка нужна, если не подтянулось
// или при правке поля. source: registry — подтянут из реестра (Probe42), uploaded — загружен
// представителем, required — обязателен, но ещё не загружен.
export type CompanyDocSource = 'registry' | 'uploaded' | 'required';
export interface CompanyDocument {
  id: string;
  name: string; // англоязычное имя документа (COI / MOA / AOA / …) — общее для ru/en
  source: CompanyDocSource;
  conditional?: boolean; // условный документ (напр. GST — только если есть GSTIN)
  fileName?: string; // имя загруженного файла (при source='uploaded')
}

// --- Данные компании (из Probe42 по PAN) ---
export interface CompanyDetails {
  entityType: CompanyEntityType;
  pan: PAN; // 4-й символ 'C'
  legalName: string;
  cin: string; // Corporate Identity Number
  gstin: GSTIN;
  registeredAddress: Address;
  correspondenceAddress?: string;
  incorporationDate: string; // DD-MM-YYYY
  companyStatus: CompanyStatusReg;
  industry: string;
  segment: string;
}

// --- Шаги фазы A (заполнитель) для верхнего прогресса ---
export type CompanyPhaseAStep = 'pan' | 'bnq-br' | 'confirm' | 'dispatch';

// --- Обёртка кейса Company ---
export interface CompanyCaseV2 {
  id: string;
  mode: OnboardingMode;
  status: 'Draft' | 'InProgress' | 'Completed';
  currentScreen: string;
  company: CompanyDetails;
  signatories: Signatory[]; // 1 и более
  br: BoardResolution;
  bnq: BnqAnswer[]; // ответы анкеты (на уровне компании)
  consents: Consent[]; // согласия уровня компании (реестры и т.п.)
  documents: DocumentRecord[];
  companyDocuments: CompanyDocument[]; // #16 — fallback-загрузка корпоративных документов
  screening: ScreeningResult[];
  risk: RiskAssessment;
  dataConfirmed: boolean; // подтверждение данных компании (фаза A)
  // --- Бизнес-профиль (BRD #8): UBO-декларация + FATCA/CRS-классификация ---
  ubo: Ubo[];
  uboDeclared: boolean; // представитель подтвердил, что указаны все UBO ≥ 25%
  fatcaClassification: FatcaClassification;
  taxResidency: string; // страна налогового резидентства компании (по умолчанию India)
}

// Источники полей CompanyDetails — для бейджа «из реестра» в UI.
export const companyFieldSources: Record<keyof CompanyDetails, FieldSource> = {
  entityType: 'system',
  pan: 'manual',
  legalName: 'registry',
  cin: 'registry',
  gstin: 'registry',
  registeredAddress: 'registry',
  correspondenceAddress: 'manual',
  incorporationDate: 'registry',
  companyStatus: 'registry',
  industry: 'registry',
  segment: 'registry',
};

// Подписант проходит фазу B (идентификацию) ⟺ в roles есть Director или AuthorizedSignatory.
export const goesThroughPhaseB = (s: Signatory): boolean =>
  s.roles.includes('Director') || s.roles.includes('AuthorizedSignatory');

// Человекочитаемая подпись роли (для чипов на дашборде).
export const roleLabel: Record<Role, { ru: string; en: string }> = {
  CustomerRepresentative: { ru: 'Заполнитель', en: 'Representative' },
  Director: { ru: 'Директор', en: 'Director' },
  AuthorizedSignatory: { ru: 'Подписант', en: 'Signatory' },
  UBO: { ru: 'Бенефициар', en: 'UBO' },
};
