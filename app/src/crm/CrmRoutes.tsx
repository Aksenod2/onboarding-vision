import { CrmApp } from './CrmApp';

// Вход в объединённое окно «отдел работы с клиентами» (spike). Монтируется под /rm/crm/*
// (внутри RmThemeProvider). Навигация разделов — внутренним состоянием Shell, не роутером
// (одно окно, role-switcher + контекст-полоса переживают переключения). Старый flat-роутинг
// (search/profile/new) заменён единым shell — реестр играет роль входа.
export const CrmRoutes = () => <CrmApp />;
