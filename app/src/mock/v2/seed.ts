// Золотая запись v2 — сквозной STP-кейс роли Sole Proprietor.
// Aarav Sharma Exports — экспортёр текстиля (India→Russia trade), один владелец.
// Меняешь здесь → меняется во всех экранах v2. Источник: docs/BNQ Template A — Sole Proprietorship.md.

import type { OnboardingCaseV2 } from './types';

export const aaravSharmaExports: OnboardingCaseV2 = {
  id: 'OBC2-2026-0001',
  mode: 'STP',
  status: 'InProgress',
  currentScreen: 'SP-05', // клиент ввёл PAN, идёт авто-скрининг / подтверждение данных

  // Владелец = подписант. PAN 4-й символ 'P' (физлицо).
  proprietor: {
    fullName: 'Aarav Sharma',
    pan: 'ABFPS4321K',
    aadhaar: '6789 2345 8901',
    email: 'aarav.sharma@aaravexports.in',
    phone: '+91 98330 41122',
    taxResidency: 'Indian National', // BNQ Q4 → risk 1
    isPEP: false, // BNQ Q5 → risk 0
  },

  business: {
    entityType: 'Sole Proprietorship',
    tradeName: 'Aarav Sharma Exports',
    pan: 'ABFPS4321K', // PAN владельца = PAN бизнеса
    gstin: '27ABFPS4321K1Z9',
    udyam: 'UDYAM-MH-18-0456789',
    commencementDate: '07-02-2019', // > 1 год → BNQ Q2 risk 1
    registeredAddress: {
      line: 'Shop 14, Crystal Plaza, Link Road, Malad West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin: '400064',
    },
    industry: 'Trading', // BNQ Q1
    segment: 'Trading', // risk 2
    companyResidency: 'Indian resident', // BNQ Q3 (registeredAddress.state IN) → risk 0
  },

  // BNQ Q1…Q11. riskScore — внутренний, клиенту не показываем. source — подтянул ли Probe42.
  bnq: [
    { q: 'Q1', attribute: 'Business Industry / Segment', block: 1, source: 'available', value: 'Trading', riskScore: 2 },
    { q: 'Q2', attribute: 'Company Vintage', block: 1, source: 'available', value: '> 1 year (с 07-02-2019)', riskScore: 1 },
    { q: 'Q3', attribute: 'Company Residency', block: 1, source: 'available', value: 'Indian resident', riskScore: 0 },
    { q: 'Q4', attribute: 'Tax Residency', block: 1, source: 'not_available', value: 'Indian National', riskScore: 1 },
    { q: 'Q5', attribute: 'PEP', block: 1, source: 'not_available', value: 'No', riskScore: 0 },
    { q: 'Q6', attribute: 'Net Revenue', block: 2, source: 'available', value: '4.5 Cr (AOC-4, last year)', riskScore: null },
    { q: 'Q7', attribute: 'Product Interest (credit)', block: 2, source: 'not_available', value: 'Yes — planning credit facilities', riskScore: null, triggered: 'CRM' },
    { q: 'Q8', attribute: 'Product Interest (amount)', block: 2, source: 'not_available', value: '~ 1.5 Cr', riskScore: null },
    { q: 'Q9', attribute: 'Import / Export Activity', block: 2, source: 'available', value: 'Yes — export activities only', riskScore: null },
    { q: 'Q10', attribute: 'Import/Export — partner countries', block: 2, source: 'not_available', value: 'Russia', riskScore: null },
    { q: 'Q11', attribute: 'Import/Export — IEC', block: 2, source: 'not_available', value: 'IEC uploaded now', riskScore: null, triggered: 'DVU' },
  ],

  // Согласия. given + timestamp IST там, где уже пройдено (до текущего экрана SP-05).
  consents: [
    { type: 'Cookie', mandatory: false, status: 'given', screen: 'SP-03', timestamp: '2026-06-08T13:48:11+05:30' },
    { type: 'Terms & Conditions', mandatory: true, status: 'given', screen: 'SP-03', timestamp: '2026-06-08T13:48:30+05:30' },
    { type: 'Privacy Notice', mandatory: true, status: 'given', screen: 'SP-03', timestamp: '2026-06-08T13:48:30+05:30' },
    { type: 'Registry Access', mandatory: true, status: 'given', screen: 'SP-04', timestamp: '2026-06-08T13:49:02+05:30' },
    // Берутся позже по флоу — пока pending:
    { type: 'KMP Confirmation', mandatory: true, status: 'pending', screen: 'SP-07' },
    { type: 'Data Principals', mandatory: true, status: 'pending', screen: 'SP-07' },
    { type: 'Aadhaar', mandatory: true, status: 'pending', screen: 'SP-07' },
    { type: 'Data Accuracy', mandatory: true, status: 'pending', screen: 'SP-08' },
  ],

  // Документы Sole Prop: PAN/Aadhaar/GST/Udyam/Address — авто; Licence/IEC — загрузка.
  documents: [
    { docType: 'PAN card', mandatory: true, handling: 'Auto fetch (STP)', status: 'Verified', verifiedBy: 'System' },
    { docType: 'Aadhaar', mandatory: true, handling: 'Auto fetch (STP)', status: 'Fetched', verifiedBy: 'System' },
    { docType: 'GST registration', mandatory: true, handling: 'Auto fetch (STP)', status: 'Fetched', verifiedBy: 'System' },
    { docType: 'Udyam registration', mandatory: true, handling: 'Auto fetch (STP)', status: 'Fetched', verifiedBy: 'System' },
    { docType: 'Address Proof', mandatory: true, handling: 'Auto fetch (STP)', status: 'Fetched', verifiedBy: 'System' },
    { docType: 'Business Licence', mandatory: false, handling: 'Upload', status: 'Uploaded', verifiedBy: 'DVU' },
    { docType: 'IEC', mandatory: false, handling: 'Upload', status: 'Uploaded', verifiedBy: 'DVU' },
  ],

  screening: [
    { checkType: 'PAN', status: 'Pass', detail: 'NSDL — verified', routedToDVU: false },
    { checkType: 'OFAC/Sanctions', status: 'Pass', detail: 'Sanctions clear', routedToDVU: false },
    { checkType: 'Probe42', status: 'Fetched', detail: 'Business data auto-fetched (Trading, vintage, P&L)', routedToDVU: false },
    { checkType: 'CKYC', status: 'Found', detail: 'CKYC ID 78901234567890', routedToDVU: false },
    { checkType: 'Stop-42', status: 'Pass', detail: 'Proprietor Aarav Sharma — no adverse match', routedToDVU: false },
  ],

  importExport: {
    dealsIn: 'export only',
    countries: ['Russia'],
    iec: 'IEC0456789',
    iecUpload: 'now',
  },

  // Внутренний риск. Сумма BNQ-баллов; клиенту не показываем.
  risk: {
    totalScore: 11, // 2+1+0+1+0 (Q1–Q5) + базовые веса (constitution/econ/net) ≈ нижний диапазон
    category: 'Low',
    shownToClient: false,
  },

  // Один владелец → один VCIP-сеанс. Ещё не пройден.
  vcip: {
    personName: 'Aarav Sharma',
    method: 'selfVKYC',
    status: 'Pending',
  },

  // Прогресс для дашборда-хаба. id совпадают с реестром STEPS (ui/v2/steps.ts).
  // Демо-состояние: первые два шага пройдены, на «данные компании» — текущий.
  progress: [
    { id: 'registry', title: 'Согласие на доступ к реестрам', status: 'done' },
    { id: 'pan', title: 'PAN и проверки', status: 'done' },
    { id: 'company', title: 'Данные компании', status: 'current' },
    { id: 'data-consents', title: 'Согласия по данным', status: 'pending' },
    { id: 'bnq', title: 'Бизнес-анкета', status: 'pending' },
    { id: 'pre-vcip', title: 'Согласие перед видеоидентификацией', status: 'pending' },
    { id: 'vcip', title: 'Видеоидентификация и подписание', status: 'pending' },
  ],
};
