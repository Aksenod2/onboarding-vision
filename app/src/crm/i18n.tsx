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

  // --- Вкладки рабочей области клиента ---
  'tab.overview': { ru: 'Обзор', en: 'Overview' },
  'tab.process': { ru: 'Процесс', en: 'Process' },

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
  'profile.actions.deal': { ru: 'Создать сделку', en: 'Create deal' },
  'profile.actions.resume': { ru: 'Возобновить брошенную заявку', en: 'Resume abandoned application' },
  'profile.actions.call': { ru: 'Запланировать звонок', en: 'Schedule call' },
  'profile.actions.meeting': { ru: 'Назначить встречу', en: 'Schedule meeting' },
  'profile.actions.link': { ru: 'Сгенерировать ссылку', en: 'Generate link' },
  'profile.actions.linkDisabled': {
    ru: 'Ссылка создаётся из оффера. Сначала создайте оффер.',
    en: 'Links are generated from an offer. Create an offer first.',
  },
  'profile.toast.offer': { ru: 'Оффер создан', en: 'Offer created' },
  'profile.toast.deal': { ru: 'Сделка создана', en: 'Deal created' },
  'profile.toast.resume': { ru: 'Заявка возобновлена', en: 'Application resumed' },
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

  // --- Shell (объединённое окно §1) ---
  'shell.product': { ru: 'Отдел работы с клиентами', en: 'Client operations' },
  'shell.search': { ru: 'Поиск по PAN / CIN / имени', en: 'Search by PAN / CIN / name' },
  'shell.demoRole': { ru: 'демо-роль', en: 'demo role' },
  'shell.account': { ru: 'Аккаунт', en: 'Account' },
  'nav.dashboard': { ru: 'Мой дашборд', en: 'My Dashboard' },
  'nav.crm': { ru: 'CRM', en: 'CRM' },
  'nav.profiles': { ru: 'Профили компаний', en: 'Company Profiles' },
  'nav.applications': { ru: 'Заявки', en: 'Applications' },
  'nav.sales': { ru: 'Продажи', en: 'Sales' },
  'nav.calendar': { ru: 'Календарь', en: 'Calendar' },
  'nav.queue': { ru: 'Очередь DVU', en: 'DVU queue' },

  // --- Роли ---
  'role.manager': { ru: 'Менеджер', en: 'Manager' },
  'role.operator': { ru: 'Оператор', en: 'Operator' },
  'role.dvu-officer': { ru: 'DVU-офицер', en: 'DVU officer' },
  'role.dvu-approver': { ru: 'DVU-аппрувер', en: 'DVU approver' },

  // --- Dashboard (заглушка) ---
  'dash.title': { ru: 'Мой дашборд', en: 'My Dashboard' },
  'dash.hint': { ru: 'Сводка по роли. В spike — заглушка, рабочая область — реестр и процессное окно.', en: 'Role summary. Stubbed in this spike — the working area is the registry and process window.' },
  'dash.open': { ru: 'Открыть реестр', en: 'Open registry' },

  // --- Реестр (входной-реестр §1) ---
  'reg.title': { ru: 'Рабочее место', en: 'Workspace' },
  'reg.entity.profiles': { ru: 'Профили', en: 'Profiles' },
  'reg.entity.applications': { ru: 'Заявки', en: 'Applications' },
  'reg.addNew': { ru: 'Добавить', en: 'Add New' },
  'reg.seg.action-required': { ru: 'Требует действия', en: 'Needs action' },
  'reg.seg.mine': { ru: 'Мои', en: 'Mine' },
  'reg.seg.new': { ru: 'Новые', en: 'New' },
  'reg.seg.all': { ru: 'Все', en: 'All' },
  'reg.col.company': { ru: 'Компания', en: 'Company' },
  'reg.col.pan': { ru: 'PAN / CIN', en: 'PAN / CIN' },
  'reg.col.application': { ru: 'Заявка', en: 'Application' },
  'reg.col.spine': { ru: 'Этап', en: 'Stage' },
  'reg.col.offerDeal': { ru: 'Оффер / Сделка', en: 'Offer / Deal' },
  'reg.col.lead': { ru: 'Лид / источник', en: 'Lead / source' },
  'reg.col.tasks': { ru: 'Задачи', en: 'Tasks' },
  'reg.col.sla': { ru: 'SLA', en: 'SLA' },
  'reg.col.assignee': { ru: 'Назначен', en: 'Assignee' },
  'reg.prospect': { ru: 'Потенциальный', en: 'Prospect' },
  'reg.customer': { ru: 'Клиент', en: 'Customer' },
  'reg.days': { ru: '{n} дн', en: '{n}d' },
  'reg.empty.action-required': { ru: 'В сегменте «Требует действия» сейчас пусто. Новые проверки появятся здесь.', en: 'Nothing needs action right now. New reviews will appear here.' },
  'reg.empty.mine': { ru: 'Нет назначенных записей. Возьмите из «Новые».', en: 'Nothing assigned to you. Pick from “New”.' },
  'reg.empty.new': { ru: 'Новых записей нет.', en: 'No new records.' },
  'reg.empty.all': { ru: 'Реестр пуст.', en: 'Registry is empty.' },
  'reg.error': { ru: 'Не удалось загрузить реестр. Повторить.', en: 'Failed to load the registry. Retry.' },
  'reg.retry': { ru: 'Повторить', en: 'Retry' },
  'reg.noClient': { ru: 'Выберите клиента в реестре, чтобы открыть процессное окно.', en: 'Select a client in the registry to open the process window.' },
  'reg.unassigned': { ru: '—', en: '—' },

  // --- Процессное окно (процессное-окно §1) ---
  'proc.back': { ru: 'Вернуться к рабочему месту', en: 'Back to workspace' },
  'proc.spineTitle': { ru: 'Линия процесса', en: 'Process spine' },
  'proc.node.intake': { ru: 'Вход', en: 'Intake' },
  'proc.node.pan': { ru: 'PAN', en: 'PAN' },
  'proc.node.questionnaire': { ru: 'Опросник', en: 'Questionnaire' },
  'proc.node.data': { ru: 'Данные', en: 'Data' },
  'proc.node.signatories': { ru: 'Подписанты', en: 'Signatories' },
  'proc.node.vkyc': { ru: 'Идентификация', en: 'Identification' },
  'proc.node.signing': { ru: 'Подписание', en: 'Signing' },
  'proc.node.account': { ru: 'Счёт', en: 'Account' },
  'proc.node.done': { ru: 'Готово', en: 'Done' },
  'proc.state.not-started': { ru: 'не начат', en: 'not started' },
  'proc.state.active': { ru: 'активен', en: 'active' },
  'proc.state.waiting': { ru: 'ждём', en: 'waiting' },
  'proc.state.done': { ru: 'готов', en: 'done' },
  'proc.state.action-required': { ru: 'требует действия', en: 'needs action' },
  'proc.state.error': { ru: 'ошибка', en: 'error' },
  'proc.stage.title': { ru: 'Шаг: {node}', en: 'Step: {node}' },
  'proc.stage.readonly': { ru: 'Шаг пройден. Просмотр результата.', en: 'Step completed. Result view.' },
  'proc.stage.notStarted': { ru: 'Шаг ещё не начат.', en: 'This step has not started yet.' },
  'proc.stage.noActions': { ru: 'У вашей роли по этому узлу нет действий — только просмотр.', en: 'Your role has no actions on this node — view only.' },
  'proc.service.open': { ru: 'Открыть сервис на весь рабочий стол', en: 'Open service full-screen' },
  'proc.service.title': { ru: 'Сервис: Идентификация (VKYC)', en: 'Service: Identification (VKYC)' },
  'proc.service.body': { ru: 'Тяжёлый сервис разворачивается на весь рабочий стол. Контекст-полоса и линия процесса остаются сверху.', en: 'Heavy service expands to the full desktop. Context bar and spine stay on top.' },
  'proc.error': { ru: 'Не удалось загрузить процесс. Повторить.', en: 'Failed to load the process. Retry.' },

  // --- DVU workspace (объед.окно §6) ---
  'dvu.queue.title': { ru: 'Очередь проверок', en: 'Review queue' },
  'dvu.col.company': { ru: 'Компания', en: 'Company' },
  'dvu.col.kind': { ru: 'Тип проверки', en: 'Check type' },
  'dvu.col.node': { ru: 'Этап', en: 'Stage' },
  'dvu.col.status': { ru: 'Статус', en: 'Status' },
  'dvu.col.sla': { ru: 'SLA', en: 'SLA' },
  'dvu.col.assignee': { ru: 'Назначен', en: 'Assignee' },
  'dvu.col.priority': { ru: 'Приоритет', en: 'Priority' },
  'dvu.empty': { ru: 'Очередь пуста. Новые проверки появятся здесь.', en: 'Queue is empty. New reviews will appear here.' },
  'dvu.error': { ru: 'Не удалось загрузить очередь. Повторить.', en: 'Failed to load the queue. Retry.' },
  'dvu.slaHours': { ru: '{n} ч', en: '{n}h' },
  'dvu.card.title': { ru: 'Карточка проверки', en: 'Review card' },
  'dvu.card.pick': { ru: 'Выберите задачу из очереди', en: 'Pick a task from the queue' },
  'dvu.card.openProfile': { ru: 'Открыть профиль', en: 'Open profile' },
  'dvu.card.performedBy': { ru: 'Сессию вёл: {who}', en: 'Session performed by: {who}' },
  'dvu.action.take': { ru: 'Назначить на себя', en: 'Assign to me' },
  'dvu.action.approve': { ru: 'Одобрить', en: 'Approve' },
  'dvu.action.reject': { ru: 'Отклонить', en: 'Reject' },
  'dvu.action.requestDoc': { ru: 'Запросить документ', en: 'Request document' },
  'dvu.fourEyes': { ru: 'Нельзя проверять заявку, которую вели вы. Назначьте другого офицера.', en: 'You can’t review an application you handled. Assign another officer.' },
  'dvu.noPerm': { ru: 'Нет прав на это действие в текущей роли.', en: 'Your role can’t perform this action.' },
  'dvu.toast.taken': { ru: 'Задача назначена на вас', en: 'Task assigned to you' },
  'dvu.toast.approved': { ru: 'Заявка одобрена', en: 'Application approved' },
  'dvu.toast.rejected': { ru: 'Заявка отклонена', en: 'Application rejected' },
  'dvu.toast.requested': { ru: 'Запрос документа отправлен', en: 'Document requested' },
  'dvu.log.title': { ru: 'Лог решений', en: 'Decision log' },
  'dvu.kind.probe-fail': { ru: 'Probe42 не прошёл', en: 'Probe42 failed' },
  'dvu.kind.crilc': { ru: 'CRILC', en: 'CRILC' },
  'dvu.kind.ofac': { ru: 'OFAC', en: 'OFAC' },
  'dvu.kind.ckyc': { ru: 'CKYC', en: 'CKYC' },
  'dvu.kind.manual-edit': { ru: 'Ручная правка', en: 'Manual edit' },
  'dvu.kind.doc-request': { ru: 'Запрос документа', en: 'Document request' },
  'dvu.kind.vkyc-fail': { ru: 'VKYC не пройден', en: 'VKYC failed' },
  'dvu.kind.abandoned': { ru: 'Брошена', en: 'Abandoned' },
  'dvu.status.open': { ru: 'Открыта', en: 'Open' },
  'dvu.status.in-review': { ru: 'На проверке', en: 'In review' },
  'dvu.status.pending-approval': { ru: 'Ждёт аппрува', en: 'Pending approval' },
  'dvu.status.resolved': { ru: 'Решена', en: 'Resolved' },
  'dvu.status.rejected': { ru: 'Отклонена', en: 'Rejected' },
  'dvu.linked.title': { ru: 'Связанные DVU-задачи', en: 'Linked DVU tasks' },
  'dvu.linked.empty': { ru: 'Нет связанных задач', en: 'No linked tasks' },
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
