// Единый реестр шагов онбординга v2 (Sole Proprietor) — источник истины для
// дашборда-хаба (SP-10) и навигации. Дашборд = «дом заявки»: после регистрации
// клиент попадает на дашборд, проваливается в шаги и возвращается обратно.
//
// Порядок выверен по транскрипту Марго (см. docs/Карта экранов v2.md):
// согласие на реестры → PAN → данные → согласия по данным (единым блоком до анкеты)
// → анкета BNQ → согласие перед видео → видео+подписание.
// Вопрос «роль в компании» НЕ нужен: для Sole Prop роль выводится из PAN (4-й символ 'P').

export interface StepDef {
  id: string; // совпадает с ProgressStep.id в mock
  route: string; // куда вести
  titleRu: string;
  titleEn: string;
  order: number;
}

// Порядок выверен по встрече с Марго (решение Дениса 2026-06-09): вопросы (BNQ) и согласия
// идут ДО экрана подтверждения всех данных компании. Подтверждение — финальный обзор перед VCIP.
// Порядок выверен по ответу Марго 2026-06-15: Aadhaar eKYC — в начало (для всех кейсов);
// согласия в 3 точках (перед PAN / перед Aadhaar / перед VKYC); подтверждение достоверности
// и подписание деклараций — финальным шагом по OTP.
export const STEPS: StepDef[] = [
  // Шаг 1 объединяет согласие на реестры + ввод PAN (решение Дениса 2026-06-09). PAN тянет данные бизнеса.
  { id: 'pan', route: '/v2/pan', order: 1, titleRu: 'Доступ к реестрам и PAN', titleEn: 'Registry access & PAN' },
  // Шаг 2 — Aadhaar eKYC: согласие на Aadhaar + QR-скан, верификация личности владельца (Марго 2026-06-15).
  // Обратим — в isIrreversibleStep НЕ входит.
  { id: 'aadhaar-qr', route: '/v2/aadhaar-qr', order: 2, titleRu: 'Aadhaar eKYC', titleEn: 'Aadhaar eKYC' },
  { id: 'bnq', route: '/v2/bnq', order: 3, titleRu: 'Бизнес-анкета', titleEn: 'Business questionnaire' },
  { id: 'data-consents', route: '/v2/data-consents', order: 4, titleRu: 'Согласия по данным', titleEn: 'Data consents' },
  { id: 'company', route: '/v2/company', order: 5, titleRu: 'Подтверждение данных компании', titleEn: 'Confirm company details' },
  { id: 'pre-vcip', route: '/v2/pre-vcip', order: 6, titleRu: 'Согласие на видеоидентификацию', titleEn: 'Video identification consent' },
  { id: 'vcip', route: '/v2/vcip', order: 7, titleRu: 'Видеоидентификация', titleEn: 'Video identification' },
  // Шаг 8 — подписание декларации и анкеты по OTP + подтверждение достоверности (Data Accuracy).
  { id: 'sign', route: '/v2/sign', order: 8, titleRu: 'Подписание документов', titleEn: 'Sign documents' },
];

export const DASHBOARD_ROUTE = '/v2/dashboard';

// Хелпер: следующий шаг после текущего (для кнопки «Далее» внутри шага, если нужно).
export const nextStepRoute = (currentId: string): string => {
  const idx = STEPS.findIndex((s) => s.id === currentId);
  if (idx === -1 || idx === STEPS.length - 1) return DASHBOARD_ROUTE;
  return STEPS[idx + 1].route;
};

// Хелпер: предыдущий шаг (для кнопки «Назад»). null — если шаг первый/не найден.
export const prevStepRoute = (currentId: string): string | null => {
  const idx = STEPS.findIndex((s) => s.id === currentId);
  if (idx <= 0) return null;
  return STEPS[idx - 1].route;
};

// Необратимые шаги: прыжки по прогрессу заблокированы (BRD — точки невозврата: видео, подписание).
export const isIrreversibleStep = (id: string): boolean => id === 'vcip' || id === 'sign';
