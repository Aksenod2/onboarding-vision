import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CL01Welcome } from './screens/CL01Welcome';
import { CL02Login } from './screens/CL02Login';
import { CL03Company } from './screens/CL03Company';
import { CL04Business } from './screens/CL04Business';
import { CL05VcipInvite } from './screens/CL05VcipInvite';
import { CL06VcipSession } from './screens/CL06VcipSession';
import { CL07Documents } from './screens/CL07Documents';
import { CL08Confirm } from './screens/CL08Confirm';
import { CL09Result } from './screens/CL09Result';

// Поток клиентского пути: CL-01 → CL-02 → … → CL-09.
export const App = () => {
  return (
    <BrowserRouter>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
