import { Routes, Route, Navigate } from 'react-router-dom';
import { CrmI18nProvider } from './i18n';
import { CrmSearch } from './screens/CrmSearch';
import { CompanyProfile } from './screens/CompanyProfile';
import { CreateProfile } from './screens/CreateProfile';

// Вложенный роутинг CRM-микросервиса (монтируется под /rm/crm/* в App.tsx, уже внутри RmThemeProvider).
// Пути относительные к /rm/crm:
//   index            → CrmSearch (одно окно)
//   new              → CreateProfile (сценарий «не найдено»)
//   profile/:id      → CompanyProfile (агрегатор)
// Тему RM не дублируем — родительский RmThemeProvider уже обёрнут вокруг /rm/*.
// CrmI18nProvider — ЛОКАЛЬНЫЙ i18n CRM (изоляция: не тянем онбординг-LanguageContext).
export const CrmRoutes = () => (
  <CrmI18nProvider>
    <Routes>
      <Route index element={<CrmSearch />} />
      <Route path="new" element={<CreateProfile />} />
      <Route path="profile/:id" element={<CompanyProfile />} />
      <Route path="*" element={<Navigate to="/rm/crm" replace />} />
    </Routes>
  </CrmI18nProvider>
);
