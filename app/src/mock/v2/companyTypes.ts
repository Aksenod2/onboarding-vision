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
  | 'UBO'; // бенефициар ≥25%

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
  // Результат запроса по Aadhaar (UIDAI eKYC) — 5 полей, номер маскирован.
  // Показывается на шаге aadhaar=success в сессии подписанта (как у инициатора компании).
  aadhaarResult?: AadhaarResult;
  consents: Consent[]; // личные согласия подписанта
  vcip: VCIPSession; // его видеосессия
  signature: { signed: boolean; method: 'DSC'; timestamp?: IST };
}

// --- Board Resolution (генерируется банком по шаблону; happy-flow) ---
// Источник BR (первый вопрос BRD): 'template' = онлайн-шаблон банка (STP);
// 'upload' = клиент грузит свой BR → распознавание (IDP/OCR) → ручная проверка менеджером (No STP → DVU).
export type BrSource = 'template' | 'upload';

// --- Кто подписывает Board Resolution (BRD 1D-6 #3) ---
// Это РОЛЬ, отдельная от Authorised Signatory. Варианты: ≥2 директора ИЛИ один Company Secretary (singly).
export type BrSignerMode = 'directors' | 'secretary';

// --- Как назначается единственный Authorised Signatory (BRD 1D-6 #4) ---
// 'from-directors' = один из директоров (PAN из Probe); 'new-person' = новое лицо (ручной ввод).
export type AsMode = 'from-directors' | 'new-person';

// --- Governance будущей смены Authorised Signatory (BRD 1D-6 #5, dropdown 2 опции) ---
export type GovernanceOption = 'nominated-official' | 'decision-pursuant-br';

// --- Конфигурация акта назначения AS на экране Board Resolution ---
// Срез ответов BR-вопросов (кто подписывает / кто AS / governance смены) + контакт секретаря,
// если выбрана ветка «один секретарь». Контакты подписывающих директоров живут на самих Signatory.
export interface BrSignerConfig {
  signerMode: BrSignerMode; // ≥2 директора / 1 секретарь
  // контакты Company Secretary (ветка 'secretary'): в Probe их нет → ручной ввод
  secretaryName: string;
  secretaryEmail: string;
  secretaryPhone: string;
  asMode: AsMode; // AS из директоров / новое лицо
  governance: GovernanceOption | null; // выбор governance смены AS (null — ещё не выбрано)
}

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
  // Срез акта назначения AS (кто подписывает BR / кто AS / governance смены).
  signerConfig: BrSignerConfig;
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
  // PAN НЕ входит в атрибуты Shareholding Pattern (BRD) — в UBO-строке не показывается.
  // Поле оставлено опциональным для совместимости контракта; UI его не использует.
  pan?: PAN;
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
  // BRD: ручное добавление/правка UBO требует Shareholding Pattern (заверен CA, действующий UDIN)
  // — ОДИН документ на весь раздел UBO. Правка помечает раздел modified → уходит в DVU.
  uboModified?: boolean; // в раздел UBO внесены ручные правки (добавлен/изменён бенефициар не из реестра)
  uboShareholdingDoc?: { fileName: string }; // загруженный Shareholding Pattern (CA, UDIN); undefined — не загружен
  fatcaClassification: FatcaClassification;
  taxResidency: string; // страна налогового резидентства компании (по умолчанию India)
  // #34 — догрузка документа по обратному запросу банка (DVU). null — запроса нет.
  dvuRequest?: DvuRequest;
  // #43 — счёт заморожен до первого входа в интернет-банк (опыт «фриз снят»).
  // По умолчанию после Completed = true; вход в /company/bank снимает фриз.
  accountFrozen?: boolean;
  // Вход компании (целевка Марго): согласия ДО Aadhaar → Aadhaar-авторизация (подтягивает контакты) → пин-код.
  entry?: CompanyEntry;
}

// --- Результат запроса по Aadhaar (UIDAI eKYC) ---
// Письмо Марго 19.06: «Запрос по адхару выдает следующее: name / aadhaar number ******2678 /
// telephone / email / address». Номер Aadhaar — ВСЕГДА маскирован (только последние 4 цифры).
// Один и тот же контракт у инициатора компании (вход) и у приглашённого подписанта (фаза B).
export interface AadhaarResult {
  name: string;
  aadhaarMasked: string; // формат «XXXX XXXX 2678» — реальны только последние 4 цифры
  phone: string;
  email: string;
  address: string;
}

// --- Вход компании (точка входа = Aadhaar-авторизация) ---
// Согласия даются ДО Aadhaar (регуляторика). Контакты подтягиваются из UIDAI при скане.
// Пин-код (цифры) = креды интернет-банка; логин привязан к email (заглушка Марго: email+паскод).
export interface CompanyEntry {
  consentsGiven: boolean; // Aadhaar eKYC consent + Privacy Notice + согласие на реестры
  aadhaarVerified: boolean;
  email?: string; // из Aadhaar (UIDAI)
  phone?: string; // из Aadhaar (UIDAI)
  aadhaar?: AadhaarResult; // полный результат запроса по Aadhaar (5 полей, номер маскирован)
  passcodeSet: boolean;
  passcode?: string; // демо: хранится в памяти, 4 цифры
}

// --- Блоки заявки на верхнем уровне дашборда (двухуровневый кабинет, Б.1/Б.3) ---
// Инициатор видит обзор «что с моей заявкой»: блоки заявки + их статус.
// 'verify' — банк ещё не подтвердил блок (VKYC, company details): сине-серый, действий не требуется
//   (Verifying≠warning — НЕ оранжевый). 'in-progress' — синий. 'done' — зелёный.
//   'action-required' — оранжевый, ТОЛЬКО если реально нужно действие клиента.
export type ApplicationBlockStatus = 'verify' | 'in-progress' | 'done' | 'action-required';

// Блок «Personal Identification & Signing» — drill-down: список участников с под-статусами.
// kind помечает блок, в который можно «провалиться» (раскрытие Accordion на дашборде).
export type ApplicationBlockKind = 'identification-signing' | 'static';

export interface ApplicationBlock {
  id: string;
  titleRu: string;
  titleEn: string;
  status: ApplicationBlockStatus;
  kind: ApplicationBlockKind;
}

// Под-статусы участника на drill-down (Б.2): отдельно подписание, отдельно VKYC.
// Письмо Марго требует видеть и подписание, И VKYC по каждому участнику.
// 'pending' — ещё не начал; 'in-progress' — в процессе; 'done' — пройдено.
export type SubStepStatus = 'pending' | 'in-progress' | 'done';

// --- DVU re-upload (#34): банк запросил догрузить документ по заявке ---
// Имитация «обратного запроса банка»: представитель видит на дашборде, что нужно догрузить документ,
// и прикладывает файл (fake-upload). status: requested — ждёт файла; uploaded — приложен.
export interface DvuRequest {
  id: string;
  docName: string; // что просит банк (напр. «Источник средств / Source of funds»)
  status: 'requested' | 'uploaded';
  fileName?: string;
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

// --- Под-статусы участника: подписание + VKYC (выводим из currentStep/signature/vcip) ---
// Не храним отдельными полями — выводим из текущего прогресса, чтобы advanceSignatories
// (reference-safe) и личная сессия оставались единственным источником истины.
// Порядок цепочки: consents → aadhaar → vkyc → dsc-sign → done. Подпись (DSC) идёт ПОСЛЕ vkyc.
export const signingSubStatus = (s: Signatory): SubStepStatus => {
  if (s.signature.signed || s.status === 'done') return 'done';
  if (s.currentStep === 'dsc-sign') return 'in-progress';
  return 'pending';
};
export const vkycSubStatus = (s: Signatory): SubStepStatus => {
  if (s.vcip.status === 'Passed' || s.status === 'done') return 'done';
  if (s.currentStep === 'vkyc') return 'in-progress';
  return 'pending';
};

// Человекочитаемая подпись роли (для чипов на дашборде).
export const roleLabel: Record<Role, { ru: string; en: string }> = {
  CustomerRepresentative: { ru: 'Заполнитель', en: 'Representative' },
  Director: { ru: 'Директор', en: 'Director' },
  AuthorizedSignatory: { ru: 'Подписант', en: 'Signatory' },
  UBO: { ru: 'Бенефициар', en: 'UBO' },
};
