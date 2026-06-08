import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CL01Welcome } from './screens/CL01Welcome';
import { CL02Login } from './screens/CL02Login';
import { CL03Company } from './screens/CL03Company';
import { CL04Business } from './screens/CL04Business';
import { CL05VcipInvite } from './screens/CL05VcipInvite';
import { CL06VcipSession } from './screens/CL06VcipSession';
import { CL07Documents } from './screens/CL07Documents';
import { CL08Confirm } from './screens/CL08Confirm';
import { CL09Result } from './screens/CL09Result';
import { RM01Queue } from './screens/RM01Queue';
import { RM02Task } from './screens/RM02Task';
import { RM03KycTask } from './screens/RM03KycTask';
import { RM04VkycMeeting } from './screens/RM04VkycMeeting';
import { RM05Session } from './screens/RM05Session';
import { SP01Landing } from './screens/v2/SP01Landing';
import { SP02Email } from './screens/v2/SP02Email';
import { SP03Register } from './screens/v2/SP03Register';
import { SP04Registry } from './screens/v2/SP04Registry';
import { SP05Pan } from './screens/v2/SP05Pan';
import { SP06Company } from './screens/v2/SP06Company';
import { SPDataConsents } from './screens/v2/SPDataConsents';
import { SP07Bnq } from './screens/v2/SP07Bnq';
import { SP08PreVcip } from './screens/v2/SP08PreVcip';
import { SP09Vcip } from './screens/v2/SP09Vcip';
import { SP10Dashboard } from './screens/v2/SP10Dashboard';
import { LanguageProvider } from './ui/v2/LanguageContext';
import { DemoNav } from './ui/DemoNav';

// Сброс прокрутки наверх при смене экрана (React Router сам этого не делает).
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Поток: клиент CL-01…CL-09; менеджер RM-01/RM-02 (переход ролей — через карту экранов).
export const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<CL01Welcome />} />
        <Route path="/login" element={<CL02Login />} />
        <Route path="/company" element={<CL03Company />} />
        <Route path="/business" element={<CL04Business />} />
        <Route path="/vcip-invite" element={<CL05VcipInvite />} />
        <Route path="/vcip-session" element={<CL06VcipSession />} />
        <Route path="/documents" element={<CL07Documents />} />
        <Route path="/confirm" element={<CL08Confirm />} />
        <Route path="/result" element={<CL09Result />} />
        <Route path="/rm/queue" element={<RM01Queue />} />
        <Route path="/rm/task" element={<RM02Task />} />
        <Route path="/rm/kyc" element={<RM03KycTask />} />
        <Route path="/rm/vkyc" element={<RM04VkycMeeting />} />
        <Route path="/rm/session" element={<RM05Session />} />
        {/* v2 flow — обёрнуто в LanguageProvider, v1 роуты не затронуты */}
        <Route path="/v2/*" element={
          <LanguageProvider>
            <Routes>
              <Route index element={<SP01Landing />} />
              <Route path="email" element={<SP02Email />} />
              <Route path="login" element={<SP03Register />} />
              <Route path="registry" element={<SP04Registry />} />
              <Route path="pan" element={<SP05Pan />} />
              <Route path="company" element={<SP06Company />} />
              <Route path="data-consents" element={<SPDataConsents />} />
              <Route path="bnq" element={<SP07Bnq />} />
              <Route path="pre-vcip" element={<SP08PreVcip />} />
              <Route path="vcip" element={<SP09Vcip />} />
              <Route path="dashboard" element={<SP10Dashboard />} />
              <Route path="*" element={<Navigate to="/v2" replace />} />
            </Routes>
          </LanguageProvider>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DemoNav />
    </BrowserRouter>
  );
};
