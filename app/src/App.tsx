import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RM01Queue } from './screens/RM01Queue';
import { RM02Task } from './screens/RM02Task';
import { RM03KycTask } from './screens/RM03KycTask';
import { RM04VkycMeeting } from './screens/RM04VkycMeeting';
import { RM05Session } from './screens/RM05Session';
import { SP01Landing } from './screens/v2/SP01Landing';
import { SP02Email } from './screens/v2/SP02Email';
import { SP03Register } from './screens/v2/SP03Register';
import { SP05Pan } from './screens/v2/SP05Pan';
import { SP06Company } from './screens/v2/SP06Company';
import { SPDataConsents } from './screens/v2/SPDataConsents';
import { SP07Bnq } from './screens/v2/SP07Bnq';
import { SP08PreVcip } from './screens/v2/SP08PreVcip';
import { SPAadhaarQr } from './screens/v2/SPAadhaarQr';
import { SP09Vcip } from './screens/v2/SP09Vcip';
import { SPSign } from './screens/v2/SPSign';
import { SP10Dashboard } from './screens/v2/SP10Dashboard';
import { CompanyEntryConsents } from './screens/v2/company/CompanyEntryConsents';
import { CompanyAadhaar } from './screens/v2/company/CompanyAadhaar';
import { CompanyPasscode } from './screens/v2/company/CompanyPasscode';
import { CompanyLogin } from './screens/v2/company/CompanyLogin';
import { CompanyBnqDialog } from './screens/v2/company/CompanyBnqDialog';
import { CompanySignatoriesBr } from './screens/v2/company/CompanySignatoriesBr';
import { CompanyConfirm } from './screens/v2/company/CompanyConfirm';
import { CompanyDashboard } from './screens/v2/company/CompanyDashboard';
import { CompanySignatory } from './screens/v2/company/CompanySignatory';
import { CompanyBank } from './screens/v2/company/CompanyBank';
import { LanguageProvider } from './ui/v2/LanguageContext';
import { CompanyProvider } from './ui/v2/CompanyContext';
import { DemoNav } from './ui/DemoNav';

// Сброс прокрутки наверх при смене экрана (React Router сам этого не делает).
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Поток: корень `/` и `/v2` ведут на общий лендинг «Become our customer» (`/v2/sole`).
// Кнопка лендинга по умолчанию → вход Компании (Aadhaar); `?flow=sole` → Sole Proprietor. Менеджер — RM/DVU.
// Клиентская v1 (CL-01…CL-09) заархивирована 2026-06-10 (решение Дениса; история — в git).
export const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* По умолчанию открываем общий лендинг (решение Дениса 2026-06-09): прот стартует с «Become our customer». */}
        <Route path="/" element={<Navigate to="/v2/sole" replace />} />
        <Route path="/rm/queue" element={<RM01Queue />} />
        <Route path="/rm/task" element={<RM02Task />} />
        <Route path="/rm/kyc" element={<RM03KycTask />} />
        <Route path="/rm/vkyc" element={<RM04VkycMeeting />} />
        <Route path="/rm/session" element={<RM05Session />} />
        {/* v2 flow — обёрнуто в LanguageProvider, v1 роуты не затронуты */}
        <Route path="/v2/*" element={
          <LanguageProvider>
            <Routes>
              {/* /v2 по умолчанию ведёт на общий лендинг (решение Дениса 2026-06-09). */}
              <Route index element={<Navigate to="/v2/sole" replace />} />
              {/* Общий лендинг «Become our customer» — начало пути. Кнопка по умолчанию → Компания; `?flow=sole` → Sole Proprietor. */}
              <Route path="sole" element={<SP01Landing />} />
              <Route path="email" element={<SP02Email />} />
              <Route path="login" element={<SP03Register />} />
              {/* registry объединён с pan — старый роут редиректим */}
              <Route path="registry" element={<Navigate to="/v2/pan" replace />} />
              <Route path="pan" element={<SP05Pan />} />
              <Route path="company" element={<SP06Company />} />
              <Route path="data-consents" element={<SPDataConsents />} />
              <Route path="bnq" element={<SP07Bnq />} />
              <Route path="pre-vcip" element={<SP08PreVcip />} />
              {/* QR-шаг Aadhaar eKYC — между согласием перед видео и VKYC (BRD Table A 04–05) */}
              <Route path="aadhaar-qr" element={<SPAadhaarQr />} />
              <Route path="vcip" element={<SP09Vcip />} />
              <Route path="sign" element={<SPSign />} />
              <Route path="dashboard" element={<SP10Dashboard />} />
              <Route path="*" element={<Navigate to="/v2" replace />} />
            </Routes>
          </LanguageProvider>
        } />
        {/* Сценарий Компания — мульти-логин. LanguageProvider + CompanyProvider (активный подписант). */}
        <Route path="/company/*" element={
          <LanguageProvider>
            <CompanyProvider>
              <Routes>
                {/* Точка входа компании = объединённый Aadhaar-экран (согласия eKYC/Privacy
                    встроены ДО QR, согласие на реестры — после данных). Затем пин-код → PAN.
                    Старый отдельный экран согласий выведен из потока (компонент оставлен на откат). */}
                <Route index element={<Navigate to="/company/aadhaar" replace />} />
                <Route path="consents" element={<CompanyEntryConsents />} />
                <Route path="aadhaar" element={<CompanyAadhaar />} />
                <Route path="passcode" element={<CompanyPasscode />} />
                <Route path="login" element={<CompanyLogin />} />
                {/* PAN влит в диалог (нулевой шаг). Старый /company/pan → редирект на диалог. */}
                <Route path="pan" element={<Navigate to="/company/bnq" replace />} />
                <Route path="bnq" element={<CompanyBnqDialog />} />
                <Route path="signatories-br" element={<CompanySignatoriesBr />} />
                <Route path="confirm" element={<CompanyConfirm />} />
                {/* #52 — отдельного шага «Приглашение подписантов» больше нет: инвайты уходят
                    автоматически после Board Resolution. Старый роут редиректим на дашборд. */}
                <Route path="dispatch" element={<Navigate to="/company/dashboard" replace />} />
                <Route path="dashboard" element={<CompanyDashboard />} />
                <Route path="signatory" element={<CompanySignatory />} />
                {/* #43 — растворение онбординга: вход в интернет-банк (без онбординг-хрома). */}
                <Route path="bank" element={<CompanyBank />} />
                {/* «*» ниже не должен ловить /company/bank — порядок важен. */}
                <Route path="*" element={<Navigate to="/company" replace />} />
              </Routes>
            </CompanyProvider>
          </LanguageProvider>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DemoNav />
    </BrowserRouter>
  );
};
