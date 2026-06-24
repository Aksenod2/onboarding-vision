// Золотая запись сценария КОМПАНИЯ — happy-flow + мульти-логин.
// Mehta Textiles Pvt Ltd — экспортёр текстиля (India→Russia trade), 2 директора + 1 AS.
// Источник: docs/Компания — спека ДЕТАЛЬНАЯ (логика).md. Меняешь здесь → меняется во всех экранах Company.

import type { CompanyCaseV2, Signatory } from './companyTypes';

// Пустая видеосессия подписанта (заполняется при прохождении фазы B).
const pendingVcip = (name: string): Signatory['vcip'] => ({
  personName: name,
  method: 'selfVKYC',
  status: 'Pending',
});

// Личные согласия подписанта — собираются на шаге B1 (пока pending).
const signatoryConsents = (): Signatory['consents'] => [
  { type: 'Privacy Notice', mandatory: true, status: 'pending', screen: 'CO-B1' },
  { type: 'Data Principals', mandatory: true, status: 'pending', screen: 'CO-B1' },
  { type: 'Aadhaar', mandatory: true, status: 'pending', screen: 'CO-B2' },
  { type: 'VKYC', mandatory: true, status: 'pending', screen: 'CO-B3' },
];

export const mehtaTextiles: CompanyCaseV2 = {
  id: 'OBC2-CO-2026-0007',
  mode: 'STP',
  status: 'Draft',
  currentScreen: 'CO-PAN',

  company: {
    entityType: 'Company',
    pan: 'AABCM4521C', // 4-й символ 'C' = Company
    legalName: 'Mehta Textiles Private Limited',
    cin: 'U17110MH2018PTC312045',
    gstin: '27AABCM4521C1Z8',
    registeredAddress: {
      line: 'Unit 7, Apparel Park, MIDC Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin: '400093',
    },
    incorporationDate: '12-03-2018',
    companyStatus: 'Active',
    industry: 'Trading',
    segment: 'Trading',
  },

  // Подписанты + заполнитель-инициатор. Karan — заполнитель-ПОДПИСАНТ (дефолт демо, Денис 2026-06-23):
  // основной кейс Марго (~80%) — заполняющий сам уполномоченный, проходит фазу B бесшовно от анкеты
  // к видеокиваси. Роли: CustomerRepresentative (заполняет/рассылает) + AuthorizedSignatory (подписывает).
  // → goesThroughPhaseB(Karan)===true: пункты Personal Identification / Signing в левой панели кликабельны,
  //   он попадает в список участников дашборда со своими статусами VKYC/Signing.
  // Rajesh — Director (подписывает BR); Amit — AS не из реестра (ручной ввод).
  // Karan стоит В КОНЦЕ массива — не [0], чтобы не задеть boost idx===0 в advanceSignatories
  // (разнобой прогресса даём верхним строкам). Дашборд фильтрует goesThroughPhaseB, порядок строк
  // = порядок массива — Karan показывается последним, остальные подписанты не сдвинуты.
  // data-driven дизейбл фазы B (не-подписант → locked) остаётся рабочим: меняется лишь ДЕФОЛТ.
  signatories: [
    {
      id: 'sig-rajesh',
      fullName: 'Rajesh Mehta',
      roles: ['Director'],
      pan: 'ABKPM7788D',
      panSource: 'registry',
      email: 'rajesh.mehta@mehtatextiles.in',
      phone: '+91 98201 33445',
      designation: 'Managing Director',
      inviteSent: false,
      currentStep: 'waiting',
      status: 'waiting',
      aadhaarResult: {
        name: 'Rajesh Mehta',
        aadhaarMasked: 'XXXX XXXX 4521',
        phone: '+91 98201 33445',
        email: 'rajesh.mehta@mehtatextiles.in',
        address: 'Flat 12B, Sea Breeze Apartments, Bandra West, Mumbai, Maharashtra — 400050',
      },
      consents: signatoryConsents(),
      vcip: pendingVcip('Rajesh Mehta'),
      signature: { signed: false, method: 'DSC' },
    },
    {
      id: 'sig-priya',
      fullName: 'Priya Mehta',
      roles: ['Director'],
      pan: 'ABKPM7790F',
      panSource: 'registry',
      email: 'priya.mehta@mehtatextiles.in',
      phone: '+91 98201 33446',
      designation: 'Director',
      inviteSent: false,
      currentStep: 'waiting',
      status: 'waiting',
      aadhaarResult: {
        name: 'Priya Mehta',
        aadhaarMasked: 'XXXX XXXX 7813',
        phone: '+91 98201 33446',
        email: 'priya.mehta@mehtatextiles.in',
        address: 'Flat 12B, Sea Breeze Apartments, Bandra West, Mumbai, Maharashtra — 400050',
      },
      consents: signatoryConsents(),
      vcip: pendingVcip('Priya Mehta'),
      signature: { signed: false, method: 'DSC' },
    },
    {
      id: 'sig-amit',
      fullName: 'Amit Shah',
      roles: ['AuthorizedSignatory', 'UBO'],
      pan: 'ADLPS5512Q',
      panSource: 'manual', // AS не из реестра директоров — введён вручную в BR-вопросах
      email: 'amit.shah@mehtatextiles.in',
      phone: '+91 98330 71290',
      inviteSent: false,
      currentStep: 'waiting',
      status: 'waiting',
      aadhaarResult: {
        name: 'Amit Shah',
        aadhaarMasked: 'XXXX XXXX 2678',
        phone: '+91 98330 71290',
        email: 'amit.shah@mehtatextiles.in',
        address: '4, Satyam Heights, Satellite Road, Ahmedabad, Gujarat — 380015',
      },
      consents: signatoryConsents(),
      vcip: pendingVcip('Amit Shah'),
      signature: { signed: false, method: 'DSC' },
    },
    {
      // Заполнитель-ПОДПИСАНТ (дефолтный инициатор + единственный Authorized Signatory).
      // Денис 2026-06-23: основной кейс — заполняющий сам уполномочен → проходит фазу B сам:
      //   CustomerRepresentative (заполняет/рассылает, вход на портал через свой Aadhaar) +
      //   AuthorizedSignatory (goesThroughPhaseB===true → PI/Signing кликабельны, он в списке дашборда).
      // PAN заполнен (как у подписанта — нужен для AS и для QAS-номинации «другой человек»).
      // Входит на портал через свой Aadhaar (passCompanyAadhaar тянет его aadhaarResult).
      id: 'sig-karan',
      fullName: 'Karan Verma',
      roles: ['CustomerRepresentative', 'AuthorizedSignatory'],
      pan: 'AOPPV2231K',
      panSource: 'manual',
      email: 'karan.verma@mehtatextiles.in',
      phone: '+91 98200 11223',
      designation: 'Company Representative',
      inviteSent: false,
      currentStep: 'waiting',
      status: 'waiting',
      aadhaarResult: {
        name: 'Karan Verma',
        aadhaarMasked: 'XXXX XXXX 9034',
        phone: '+91 98200 11223',
        email: 'karan.verma@mehtatextiles.in',
        address: '21, Lokhandwala Complex, Andheri West, Mumbai, Maharashtra — 400053',
      },
      consents: signatoryConsents(),
      vcip: pendingVcip('Karan Verma'),
      signature: { signed: false, method: 'DSC' },
    },
  ],

  br: {
    template: 'bank',
    brSource: 'template', // по умолчанию — онлайн-шаблон банка (STP)
    companyName: 'Mehta Textiles Private Limited',
    cin: 'U17110MH2018PTC312045',
    address: 'Unit 7, Apparel Park, MIDC Andheri East, Mumbai — 400093, MH',
    confirmed: false,
    // Акт назначения AS (BRD 1D-6): дефолт — подписывают директора (≥2),
    // AS назначается из директоров; governance ещё не выбран (осознанный выбор клиента).
    signerConfig: {
      signerMode: 'directors',
      secretaryName: 'Vikram Iyer', // демо: Company Secretary компании (ветка 'secretary')
      secretaryEmail: 'vikram.iyer@mehtatextiles.in',
      secretaryPhone: '+91 98200 55410',
      asMode: 'new-person',
      governance: null,
      // Выбор AS — назначается в опроснике (QAS). Дефолт демо (Денис 2026-06-23): AS = САМ ЗАПОЛНИТЕЛЬ
      // (Karan Verma). Он не директор из реестра → ветка «другой человек» (new-person) с его контактами
      // и PAN. buildPhaseBSignatories мэтчит его по fullName с существующей записью и доклеивает роль AS.
      // «директор-AS» (from-directors) оставлен пустым. asAssigned=true — дефолт уже с назначенным AS.
      asDirectorId: null,
      asDirectorEmail: '',
      asDirectorPhone: '',
      asNewName: 'Karan Verma',
      asNewDesignation: 'Company Representative',
      asNewEmail: 'karan.verma@mehtatextiles.in',
      asNewPhone: '+91 98200 11223',
      asNewPan: 'AOPPV2231K',
      asAssigned: true,
    },
  },

  // BNQ — порядок по правке #56 (Марго 23.06): PAN (нулевой leadStep) → БИЗНЕС-вопросы
  // (индустрия → revenue → кредит/овердрафт → планы по кредиту → импорт/экспорт → номинирование AS)
  // → COMPLIANCE в конце (резидентство → налоговый статус → FATCA → PEP).
  // Порядок шагов опросника = ПОРЯДОК этого массива (buildStepOrder сохраняет его).
  // Q2 (Company Vintage / дата регистрации) убран из опросника: дата подтянута из PAN и
  // подтверждается на экране «Данные компании из PAN» (company.incorporationDate) — как вопрос дублирует.
  // Значение даты НЕ теряем: оно остаётся в CompanyDetails.incorporationDate (golden record).
  bnq: [
    // — БИЗНЕС —
    { q: 'Q1', attribute: 'Business Industry / Segment', block: 1, source: 'available', value: 'Trading', riskScore: 2 },
    { q: 'Q6', attribute: 'Net Revenue', block: 2, source: 'available', value: '12 Cr (AOC-4, last year)', riskScore: null },
    // Q6b — существующая кредитная задолженность (CC/OD) в других банках (business questioner Марго,
    // «Вопрос A»). Влияет на доступный тип счёта (фоновая логика банка, порог 10 крор). Перед Q7 (планы).
    // Радио Да/Нет; при «Да» — под-выбор порога (>10 cr / <10 cr), хранится в value.
    { q: 'Q6b', attribute: 'Existing CC/OD exposure', block: 2, source: 'not_available', value: '', riskScore: null },
    { q: 'Q7', attribute: 'Product Interest (credit)', block: 2, source: 'not_available', value: 'Yes — planning credit facilities', riskScore: null, triggered: 'CRM' },
    { q: 'Q8', attribute: 'Product Interest (amount)', block: 2, source: 'not_available', value: '~ 3 Cr', riskScore: null },
    { q: 'Q9', attribute: 'Import / Export Activity', block: 2, source: 'available', value: 'Yes — export activities only', riskScore: null },
    { q: 'Q10', attribute: 'Import/Export — partner countries', block: 2, source: 'not_available', value: 'Russia', riskScore: null },
    { q: 'Q11', attribute: 'Import/Export — IEC', block: 2, source: 'not_available', value: 'IEC uploaded now', riskScore: null, triggered: 'DVU' },
    // QAS — назначение Authorized Signatory (перенесено из Board Resolution в опросник, Марго 23.06).
    // ТОЛЬКО Компания (в Sole Proprietor этого вопроса нет). Сам выбор (директор/«свой» + контакты)
    // хранится в state.br.signerConfig (asMode/asDirectorId/asNew*). Значение bnq — человекочитаемый
    // снимок для golden-record. Дефолт демо (Денис 2026-06-23): сам заполнитель Karan Verma. Завершает бизнес-блок.
    { q: 'QAS', attribute: 'Authorized Signatory nomination', block: 1, source: 'not_available', value: 'Karan Verma (Company Representative)', riskScore: null },
    // — COMPLIANCE (в конце) —
    { q: 'Q3', attribute: 'Company Residency', block: 1, source: 'available', value: 'Indian resident', riskScore: 0 },
    { q: 'Q4', attribute: 'Tax Residency', block: 1, source: 'not_available', value: 'Indian National', riskScore: 1 },
    // Q4b — FATCA/CRS налоговый статус компании (перенесён из финальной анкеты в опросник, решение Дениса).
    // ТОЛЬКО Компания (в seed.ts Sole Proprietor этого вопроса нет). Value: «<классификация> · <страна>».
    // По умолчанию для торговой компании-резидента Индии — Active NFFE · India.
    // Правка #8: FATCA связан с резидентством — стоит сразу после Q3/Q4 (одна compliance-группа).
    { q: 'Q4b', attribute: 'FATCA / CRS classification', block: 1, source: 'not_available', value: 'Active NFFE · India', riskScore: null },
    { q: 'Q5', attribute: 'PEP', block: 1, source: 'not_available', value: 'No', riskScore: 0 },
  ],

  // Согласия уровня компании (реестры — до PAN). Личные согласия подписантов — в signatory.consents.
  consents: [
    { type: 'Cookie', mandatory: false, status: 'given', screen: 'CO-REG', timestamp: '2026-06-16T10:12:00+05:30' },
    { type: 'Terms & Conditions', mandatory: true, status: 'given', screen: 'CO-REG', timestamp: '2026-06-16T10:12:20+05:30' },
    { type: 'Privacy Notice', mandatory: true, status: 'given', screen: 'CO-REG', timestamp: '2026-06-16T10:12:20+05:30' },
    { type: 'Registry Access', mandatory: true, status: 'pending', screen: 'CO-PAN' },
  ],

  documents: [
    { docType: 'PAN card', mandatory: true, handling: 'Auto fetch (STP)', status: 'Fetched', verifiedBy: 'System' },
    { docType: 'GST registration', mandatory: true, handling: 'Auto fetch (STP)', status: 'Fetched', verifiedBy: 'System' },
    { docType: 'IEC', mandatory: false, handling: 'Upload', status: 'Pending' },
  ],

  // Директора компании (блок на финальной анкете) — подтянуты из реестра (Probe42 / MCA).
  // ФИО + должность (designation) + PAN. Ручная правка состава/данных → документ-подтверждение → DVU.
  directors: [
    { id: 'dir-rajesh', fullName: 'Rajesh Mehta', designation: 'Managing Director', pan: 'ABKPM7788D', source: 'registry' },
    { id: 'dir-priya', fullName: 'Priya Mehta', designation: 'Director', pan: 'ABKPM7790F', source: 'registry' },
    { id: 'dir-vikram', fullName: 'Vikram Iyer', designation: 'Company Secretary', pan: 'AFZPI3344K', source: 'registry' },
  ],

  // #16 — корпоративные документы: COI/MOA/AOA подтянуты из Probe42, Shareholding Pattern — к загрузке.
  // GST conditional — компания с GSTIN, поэтому требуется (предзаполнен из реестра).
  companyDocuments: [
    { id: 'doc-coi', name: 'Certificate of Incorporation', source: 'registry' },
    // MOA/AOA — одно поле (требование Марго 19.06): не может быть двух раздельных строк.
    { id: 'doc-moa-aoa', name: 'MOA / AOA', source: 'registry' },
    { id: 'doc-shp', name: 'Shareholding Pattern', source: 'required' },
    { id: 'doc-gst', name: 'GST Registration Certificate', source: 'registry', conditional: true },
  ],

  screening: [
    { checkType: 'PAN', status: 'Pass', detail: 'NSDL — company PAN verified', routedToDVU: false },
    { checkType: 'OFAC/Sanctions', status: 'Pass', detail: 'Sanctions clear', routedToDVU: false },
    { checkType: 'Probe42', status: 'Fetched', detail: 'Company data + directors auto-fetched', routedToDVU: false },
    { checkType: 'CKYC', status: 'Found', detail: 'CKYC records found for signatories', routedToDVU: false },
  ],

  risk: { totalScore: 12, category: 'Low', shownToClient: false },

  dataConfirmed: false,

  // UBO — бенефициарные владельцы ≥ 25% (BRD #8). Amit Shah помечен UBO в подписантах.
  // PAN не входит в Shareholding Pattern (BRD) — в UBO только ФИО + доля.
  ubo: [
    { id: 'ubo-amit', fullName: 'Amit Shah', sharePct: 40, source: 'registry' },
    { id: 'ubo-rajesh', fullName: 'Rajesh Mehta', sharePct: 35, source: 'registry' },
  ],
  uboDeclared: false,
  // FATCA/CRS — торговая компания-резидент Индии: активная нефинансовая структура.
  fatcaClassification: 'Active NFFE',
  taxResidency: 'India',
  // #34 — обратный запрос банка (DVU): просят догрузить подтверждение источника средств.
  dvuRequest: { id: 'dvu-1', docName: 'Source of funds confirmation', status: 'requested' },
  // #43 — счёт заморожен до первого входа в интернет-банк (фриз снимается при входе).
  accountFrozen: true,
};
