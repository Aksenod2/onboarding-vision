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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DemoNav />
    </BrowserRouter>
  );
};
