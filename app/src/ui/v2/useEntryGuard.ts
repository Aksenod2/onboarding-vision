import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanyEntry } from '../../mock/v2/companyApi';

// Guard цепочки ВХОДА компании (Костя, P0): прямой заход на под-шаг без выполненного
// предыдущего рвёт логику (пустой email → повторный вход сломан). Хук редиректит на
// нужный предыдущий шаг по флагам getCompanyEntry().
//
// requirement:
//  - 'consents'  — для /company/aadhaar  (нужен entry.consentsGiven, иначе → /company/consents)
//  - 'aadhaar'   — для /company/passcode (нужен entry.aadhaarVerified, иначе → /company/aadhaar)
//  - 'passcode'  — для /company/login    (если !passcodeSet — мост на согласия, см. CompanyLogin)
//
// Возвращает { ready }: пока флаги не проверены — ready=false (рисуем заглушку, не контент).

type Requirement = 'consents' | 'aadhaar' | 'passcode';

export const useEntryGuard = (requirement: Requirement): { ready: boolean } => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getCompanyEntry().then((entry) => {
      if (!alive) return;
      if (requirement === 'consents' && !entry.consentsGiven) {
        navigate('/company/consents', { replace: true });
        return;
      }
      if (requirement === 'aadhaar' && !entry.aadhaarVerified) {
        navigate('/company/aadhaar', { replace: true });
        return;
      }
      // requirement === 'passcode': CompanyLogin сам решает, что показать при !passcodeSet
      // (мост «Впервые здесь?»), поэтому здесь не редиректим — просто пускаем.
      setReady(true);
    });
    return () => { alive = false; };
  }, [requirement, navigate]);

  return { ready };
};
