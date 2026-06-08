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

export const STEPS: StepDef[] = [
  { id: 'registry', route: '/v2/registry', order: 1, titleRu: 'Согласие на доступ к реестрам', titleEn: 'Registry access consent' },
  { id: 'pan', route: '/v2/pan', order: 2, titleRu: 'PAN и проверки', titleEn: 'PAN & verification' },
  { id: 'company', route: '/v2/company', order: 3, titleRu: 'Данные компании', titleEn: 'Company details' },
  { id: 'data-consents', route: '/v2/data-consents', order: 4, titleRu: 'Согласия по данным', titleEn: 'Data consents' },
  { id: 'bnq', route: '/v2/bnq', order: 5, titleRu: 'Бизнес-анкета', titleEn: 'Business questionnaire' },
  { id: 'pre-vcip', route: '/v2/pre-vcip', order: 6, titleRu: 'Согласие перед видеоидентификацией', titleEn: 'Pre-video consent' },
  { id: 'vcip', route: '/v2/vcip', order: 7, titleRu: 'Видеоидентификация и подписание', titleEn: 'Video ID & signing' },
];

export const DASHBOARD_ROUTE = '/v2/dashboard';

// Хелпер: следующий шаг после текущего (для кнопки «Далее» внутри шага, если нужно).
export const nextStepRoute = (currentId: string): string => {
  const idx = STEPS.findIndex((s) => s.id === currentId);
  if (idx === -1 || idx === STEPS.length - 1) return DASHBOARD_ROUTE;
  return STEPS[idx + 1].route;
};
