import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

// CRM-микросервис: ЛОКАЛЬНЫЙ i18n. Сознательно НЕ импортим онбординг-LanguageContext (изоляция, §6).
// Дефолт — RU (рынок-команда русскоязычная, бриф п.7), EN-словарь наготове. Переключатель —
// локальный для CRM (в шапке поиска), не тянет клиентский провайдер.

export type Lang = 'ru' | 'en';

// Плоский словарь ключ → {ru, en}. Интерполяция — через replace в t() (плейсхолдер {x}).
const DICT = {
  // --- Общее ---
  'crm.title': { ru: 'CRM · Одно окно', en: 'CRM · Single window' },
  'crm.back': { ru: 'Назад к поиску', en: 'Back to search' },
  'crm.lang.ru': { ru: 'RU', en: 'RU' },
  'crm.lang.en': { ru: 'EN', en: 'EN' },

  // --- Источник (общий словарь Profile + CreateProfile) ---
  'src.label': { ru: 'Источник', en: 'Source' },
  'src.createLabel': { ru: 'Откуда пришёл клиент', en: 'Source' },
  'src.call': { ru: 'Звонок', en: 'Call' },
  'src.potential': { ru: 'Потенциальный', en: 'Potential' },
  'src.self-registration': { ru: 'Самостоятельная регистрация', en: 'Self-registration' },
  'src.onboarding': { ru: 'Онбординг', en: 'Onboarding' },
  'src.probe42': { ru: 'Probe42', en: 'Probe42' },
  'src.online-bank': { ru: 'Онлайн-банк', en: 'Online bank' },

  // --- Application статус (общий словарь Search + Profile) ---
  'app.active': { ru: 'Активна', en: 'Active' },
  'app.abandoned': { ru: 'Брошена', en: 'Abandoned' },
  'app.rejected': { ru: 'Отклонена', en: 'Rejected' },
  'app.completed': { ru: 'Завершена', en: 'Completed' },
  'app.none': { ru: 'Нет заявки', en: 'No application' },

  // --- CrmSearch ---
  'search.placeholder': { ru: 'Поиск по PAN', en: 'Search by PAN' },
  'search.helper': { ru: 'PAN — обязательный ключ поиска', en: 'PAN is the required search key' },
  'search.button': { ru: 'Найти', en: 'Search' },
  'search.create': { ru: 'Завести профиль', en: 'Create profile' },
  'search.empty': { ru: 'Введите PAN, чтобы найти клиента', en: 'Enter a PAN to find a client' },
  'search.clients': { ru: 'Клиенты', en: 'Clients' },
  'search.results': { ru: '{n} результатов', en: '{n} results' },
  'search.col.pan': { ru: 'PAN', en: 'PAN' },
  'search.col.name': { ru: 'Название', en: 'Name' },
  'search.col.type': { ru: 'Тип юрлица', en: 'Entity type' },
  'search.col.address': { ru: 'Адрес', en: 'Address' },
  'search.col.application': { ru: 'Заявка', en: 'Application' },
  'search.notFound': { ru: 'Клиент с PAN {pan} не найден', en: 'No client found for PAN {pan}' },
  'search.notFoundHint': {
    ru: 'Заведите профиль или направьте клиента на самостоятельную регистрацию',
    en: 'Create a profile or guide the client to self-registration',
  },
  'search.error': { ru: 'Не удалось выполнить поиск. Повторите.', en: 'Search failed. Try again.' },
  'search.retry': { ru: 'Повторить', en: 'Retry' },
  'search.panInvalid': { ru: 'Неверный формат PAN', en: 'Invalid PAN format' },
  'search.caption': { ru: 'Список клиентов', en: 'Client list' },
  'search.simulate': { ru: 'Симулировать завершение онбординга', en: 'Simulate onboarding completed' },
  'search.simulated': {
    ru: 'Онбординг симулирован: профиль и оффер обновлены',
    en: 'Onboarding simulated: profile and offer updated',
  },

  // --- CompanyProfile ---
  'profile.notFound': { ru: 'Профиль не найден', en: 'Profile not found' },
  'profile.ai.title': { ru: 'AI-сводка', en: 'AI summary' },
  'profile.ai.badge': { ru: 'рекомендация', en: 'recommendation' },
  'profile.ai.empty': { ru: 'Недостаточно данных для рекомендации', en: 'Not enough data for a recommendation' },
  'profile.funnel.title': { ru: 'Воронка', en: 'Pipeline' },
  'profile.funnel.lead': { ru: 'Лид', en: 'Lead' },
  'profile.funnel.offer': { ru: 'Оффер', en: 'Offer' },
  'profile.funnel.deal': { ru: 'Сделка', en: 'Deal' },
  'profile.funnel.application': { ru: 'Заявка', en: 'Application' },
  'profile.funnel.none': { ru: '—', en: '—' },
  'profile.funnel.count': { ru: '{n}', en: '{n}' },
  'profile.funnel.active': { ru: '{n} актив.', en: '{n} active' },
  'profile.history.title': { ru: 'История коммуникаций', en: 'Communication history' },
  'profile.history.empty': { ru: 'Пока нет событий', en: 'No events yet' },
  'profile.actions.title': { ru: 'Действия', en: 'Actions' },
  'profile.actions.offer': { ru: 'Создать оффер', en: 'Create offer' },
  'profile.actions.call': { ru: 'Запланировать звонок', en: 'Schedule call' },
  'profile.actions.meeting': { ru: 'Назначить встречу', en: 'Schedule meeting' },
  'profile.actions.link': { ru: 'Сгенерировать ссылку', en: 'Generate link' },
  'profile.actions.linkDisabled': {
    ru: 'Ссылка создаётся из оффера. Сначала создайте оффер.',
    en: 'Links are generated from an offer. Create an offer first.',
  },
  'profile.toast.offer': { ru: 'Оффер создан', en: 'Offer created' },
  'profile.toast.call': { ru: 'Звонок запланирован', en: 'Call scheduled' },
  'profile.toast.meeting': { ru: 'Встреча назначена', en: 'Meeting scheduled' },
  'profile.toast.link': { ru: 'Ссылка сгенерирована', en: 'Link generated' },
  'profile.products.title': { ru: 'Продукты клиента', en: 'Client products' },
  'profile.signatories.title': { ru: 'Подписанты', en: 'Signatories' },

  // --- Offer dialog ---
  'offer.title': { ru: 'Новый оффер', en: 'New offer' },
  'offer.product': { ru: 'Продукт', en: 'Product' },
  'offer.tags': { ru: 'Теги (через запятую)', en: 'Tags (comma-separated)' },
  'offer.description': { ru: 'Описание', en: 'Description' },
  'offer.cancel': { ru: 'Отмена', en: 'Cancel' },
  'offer.submit': { ru: 'Создать оффер', en: 'Create offer' },

  // --- Продукты (общий словарь) ---
  'product.current-account': { ru: 'Расчётный счёт', en: 'Current account' },
  'product.deposit': { ru: 'Депозит', en: 'Deposit' },
  'product.credit': { ru: 'Кредит', en: 'Credit' },
  'product.fx': { ru: 'ВЭД / валютный контроль', en: 'FX / trade' },
  'product.payroll': { ru: 'Зарплатный проект', en: 'Payroll' },

  // --- CreateProfile ---
  'create.title': { ru: 'Новый профиль компании', en: 'New company profile' },
  'create.pan': { ru: 'PAN', en: 'PAN' },
  'create.panHelper': { ru: 'Введите PAN и подтяните данные из реестра', en: 'Enter PAN and pull data from the registry' },
  'create.pull': { ru: 'Подтянуть из Probe42', en: 'Pull from Probe42' },
  'create.probeLoading': { ru: 'Запрашиваем данные из Probe42…', en: 'Requesting data from Probe42…' },
  'create.probeSuccess': { ru: 'Данные подтянуты из Probe42. Проверьте и дополните.', en: 'Data pulled from Probe42. Review and complete.' },
  'create.probeNotFound': { ru: 'Probe42 не вернул данные по этому PAN. Заполните вручную.', en: 'Probe42 returned no data for this PAN. Fill in manually.' },
  'create.probeError': { ru: 'Не удалось запросить Probe42. Повторите или заполните вручную.', en: 'Couldn’t reach Probe42. Retry or fill in manually.' },
  'create.entityType': { ru: 'Тип юрлица', en: 'Entity type' },
  'create.legalName': { ru: 'Официальное название', en: 'Legal name' },
  'create.cin': { ru: 'CIN', en: 'CIN' },
  'create.cinHelper': { ru: 'Только для зарегистрированных компаний (нет у Sole Proprietor)', en: 'Registered companies only (Sole Proprietors have none)' },
  'create.address': { ru: 'Зарегистрированный адрес', en: 'Registered address' },
  'create.submit': { ru: 'Создать профиль', en: 'Create profile' },
  'create.cancel': { ru: 'Отмена', en: 'Cancel' },
  'create.required': { ru: 'Заполните поле', en: 'Required' },
  'create.panInvalid': { ru: 'Неверный формат PAN', en: 'Invalid PAN format' },
  'create.toast': { ru: 'Профиль создан', en: 'Profile created' },

  // --- Тип юрлица (общий) ---
  'entity.Company': { ru: 'Компания', en: 'Company' },
  'entity.Sole Proprietor': { ru: 'Sole Proprietor', en: 'Sole Proprietor' },
  'entity.LLP': { ru: 'LLP', en: 'LLP' },
  'entity.Partnership': { ru: 'Партнёрство', en: 'Partnership' },
} as const;

export type CrmDictKey = keyof typeof DICT;

interface CrmI18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: CrmDictKey, vars?: Record<string, string | number>) => string;
}

const CrmI18nContext = createContext<CrmI18n | null>(null);

const interpolate = (s: string, vars?: Record<string, string | number>): string =>
  vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s;

export const CrmI18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>('ru'); // дефолт RU (бриф п.7)
  const value = useMemo<CrmI18n>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => interpolate(DICT[key][lang], vars),
    }),
    [lang],
  );
  return <CrmI18nContext.Provider value={value}>{children}</CrmI18nContext.Provider>;
};

export const useCrmI18n = (): CrmI18n => {
  const ctx = useContext(CrmI18nContext);
  if (!ctx) throw new Error('useCrmI18n must be used within CrmI18nProvider');
  return ctx;
};
