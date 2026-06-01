// Золотая запись прототипа — сквозной STP-кейс из docs/Mock-модель данных.md.
// Saanvi Textiles Private Limited. Меняешь здесь → меняется во всех экранах.

import type { OnboardingCase } from './types';

export const saanviTextiles: OnboardingCase = {
  id: 'OBC-2026-0001',
  mode: 'STP',
  status: 'InProgress',
  currentStep: '002', // на старте пилота клиент на шаге логина
  company: {
    entityType: 'Private Limited Company',
    companyName: 'Saanvi Textiles Private Limited',
    pan: 'AABCS1234C',
    cin: 'U17110MH2012PTC234567',
    gstin: '27AABCS1234C1Z8',
    incorporationDate: '14-03-2012',
    registeredAddress: {
      line: 'Unit 402, Lotus Business Park, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin: '400069',
    },
    industry: 'Textile manufacturing',
    chequeBookRequired: true,
  },
  signatories: [
    {
      id: 'SIG-1',
      fullName: 'Rajesh Kumar Menon',
      pan: 'ABCPM5678K',
      aadhaar: '4521 7890 1234',
      designation: 'Director',
      email: 'rajesh.menon@saanvitextiles.in',
      phone: '+91 98201 45678',
      residencyStatus: 'Resident',
      isPEP: false,
    },
    {
      id: 'SIG-2',
      fullName: 'Priya Sharma',
      pan: 'DEFPS9012L',
      aadhaar: '7788 1234 5566',
      designation: 'Director',
      phone: '+91 99300 22115',
      residencyStatus: 'Resident',
      isPEP: false,
    },
  ],
  documents: [
    { docType: 'PAN card', applicableTo: 'Company', mandatory: true, handling: 'Auto fetch (STP)', status: 'Verified', verifiedBy: 'System' },
    { docType: 'Certificate of Incorporation', applicableTo: 'Company', mandatory: true, handling: 'Auto fetch (STP)', status: 'Verified', verifiedBy: 'System' },
    { docType: 'MOA & AOA', applicableTo: 'Company', mandatory: true, handling: 'Auto fetch (STP)', status: 'Verified', verifiedBy: 'System' },
    { docType: 'Board Resolution / Authority Letter', applicableTo: 'Company', mandatory: true, handling: 'Upload (Hybrid)', status: 'Verified', verifiedBy: 'System' },
    { docType: 'Address Proof', applicableTo: 'Company', mandatory: true, handling: 'Auto fetch (STP)', status: 'Verified', verifiedBy: 'System' },
  ],
  screening: [
    { checkType: 'PAN', status: 'Pass', detail: 'NSDL — verified', routedToDVU: false },
    { checkType: 'OFAC', status: 'Pass', detail: 'Sanctions clear', routedToDVU: false },
    { checkType: 'CRILC', status: 'Pass', detail: 'Exposure ₹3.2 Cr (< 10 Cr → proceed)', routedToDVU: false },
    { checkType: 'CKYC', status: 'Found', detail: 'CKYC ID 45678901234567', routedToDVU: false },
    { checkType: 'Probe42', status: 'Fetched', detail: 'Company data auto-fetched', routedToDVU: false },
  ],
  risk: {
    category: 'Low',
    highRiskIndustry: false,
    crmHeadApprovalRequired: false,
  },
  // Старт пути (currentStep 002) — видеоидентификация ещё впереди → Pending.
  vcip: [
    { signatoryId: 'SIG-1', method: 'selfVKYC', status: 'Pending' },
    { signatoryId: 'SIG-2', method: 'selfVKYC', status: 'Pending' },
  ],
  ckycId: '45678901234567',
  // account появляется на шаге 009 (открытие счёта) — в пилоте до него не доходим
};
