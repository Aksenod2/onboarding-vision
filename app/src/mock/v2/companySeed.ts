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

  // 3 подписанта (мультироль). Rajesh — заполнитель И подписант; Amit — AS не из реестра (ручной ввод).
  signatories: [
    {
      id: 'sig-rajesh',
      fullName: 'Rajesh Mehta',
      roles: ['CustomerRepresentative', 'Director', 'AuthorizedSignatory'],
      pan: 'ABKPM7788D',
      panSource: 'registry',
      email: 'rajesh.mehta@mehtatextiles.in',
      phone: '+91 98201 33445',
      designation: 'Managing Director',
      inviteSent: false,
      currentStep: 'waiting',
      status: 'waiting',
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
      consents: signatoryConsents(),
      vcip: pendingVcip('Amit Shah'),
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
  },

  // BNQ — как у SP (риск-категоризация); демо-значения для Trading-компании.
  bnq: [
    { q: 'Q1', attribute: 'Business Industry / Segment', block: 1, source: 'available', value: 'Trading', riskScore: 2 },
    { q: 'Q2', attribute: 'Company Vintage', block: 1, source: 'available', value: '2018-03-12', riskScore: 1 },
    { q: 'Q3', attribute: 'Company Residency', block: 1, source: 'available', value: 'Indian resident', riskScore: 0 },
    { q: 'Q4', attribute: 'Tax Residency', block: 1, source: 'not_available', value: 'Indian National', riskScore: 1 },
    { q: 'Q5', attribute: 'PEP', block: 1, source: 'not_available', value: 'No', riskScore: 0 },
    { q: 'Q6', attribute: 'Net Revenue', block: 2, source: 'available', value: '12 Cr (AOC-4, last year)', riskScore: null },
    { q: 'Q7', attribute: 'Product Interest (credit)', block: 2, source: 'not_available', value: 'Yes — planning credit facilities', riskScore: null, triggered: 'CRM' },
    { q: 'Q8', attribute: 'Product Interest (amount)', block: 2, source: 'not_available', value: '~ 3 Cr', riskScore: null },
    { q: 'Q9', attribute: 'Import / Export Activity', block: 2, source: 'available', value: 'Yes — export activities only', riskScore: null },
    { q: 'Q10', attribute: 'Import/Export — partner countries', block: 2, source: 'not_available', value: 'Russia', riskScore: null },
    { q: 'Q11', attribute: 'Import/Export — IEC', block: 2, source: 'not_available', value: 'IEC uploaded now', riskScore: null, triggered: 'DVU' },
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

  // #16 — корпоративные документы: COI/MOA/AOA подтянуты из Probe42, Shareholding Pattern — к загрузке.
  // GST conditional — компания с GSTIN, поэтому требуется (предзаполнен из реестра).
  companyDocuments: [
    { id: 'doc-coi', name: 'Certificate of Incorporation', source: 'registry' },
    { id: 'doc-moa', name: 'Memorandum of Association (MOA)', source: 'registry' },
    { id: 'doc-aoa', name: 'Articles of Association (AOA)', source: 'registry' },
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
  ubo: [
    { id: 'ubo-amit', fullName: 'Amit Shah', sharePct: 40, pan: 'ADLPS5512Q', source: 'registry' },
    { id: 'ubo-rajesh', fullName: 'Rajesh Mehta', sharePct: 35, pan: 'ABKPM7788D', source: 'registry' },
  ],
  uboDeclared: false,
  // FATCA/CRS — торговая компания-резидент Индии: активная нефинансовая структура.
  fatcaClassification: 'Active NFFE',
  taxResidency: 'India',
  // #34 — обратный запрос банка (DVU): просят догрузить подтверждение источника средств.
  dvuRequest: { id: 'dvu-1', docName: 'Source of funds confirmation', status: 'requested' },
};
