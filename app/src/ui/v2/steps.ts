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
export const STEPS: StepDef[] = [
  // Шаг 1 объединяет согласие на реестры + ввод PAN (решение Дениса 2026-06-09).
  { id: 'pan', route: '/v2/pan', order: 1, titleRu: 'Доступ к реестрам и PAN', titleEn: 'Registry access & PAN' },
  { id: 'bnq', route: '/v2/bnq', order: 2, titleRu: 'Бизнес-анкета', titleEn: 'Business questionnaire' },
  { id: 'data-consents', route: '/v2/data-consents', order: 3, titleRu: 'Согласия по данным', titleEn: 'Data consents' },
  { id: 'company', route: '/v2/company', order: 4, titleRu: 'Подтверждение данных компании', titleEn: 'Confirm company details' },
  { id: 'pre-vcip', route: '/v2/pre-vcip', order: 5, titleRu: 'Согласие перед видеоидентификацией', titleEn: 'Pre-video consent' },
  { id: 'vcip', route: '/v2/vcip', order: 6, titleRu: 'Видеоидентификация', titleEn: 'Video identification' },
  // Шаг 7 — Declarations Dashboard по BRD (Table A шаг 09): подписание деклараций кодом OTP после VKYC.
  { id: 'sign', route: '/v2/sign', order: 7, titleRu: 'Подписание документов', titleEn: 'Sign documents' },
];

export const DASHBOARD_ROUTE = '/v2/dashboard';

// Хелпер: следующий шаг после текущего (для кнопки «Далее» внутри шага, если нужно).
export const nextStepRoute = (currentId: string): string => {
  const idx = STEPS.findIndex((s) => s.id === currentId);
  if (idx === -1 || idx === STEPS.length - 1) return DASHBOARD_ROUTE;
  return STEPS[idx + 1].route;
};
