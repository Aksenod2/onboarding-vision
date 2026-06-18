import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Контекст «активный подписант» — кого выбрали через «Войти как [имя]» на дашборде компании.
// Фаза B (сессия подписанта) пишет прогресс в запись этого лица.

// Откуда подписант попал в сессию (гард навигации фазы B):
//  • 'dashboard' — «Войти как» с дашборда инициатора (демо-мостик) → навигация на дашборд разрешена;
//  • 'invite'    — вход по invite-ссылке → дашборд инициатора скрыт;
//  • 'initiator' — инициатор-подписант минул дашборд после рассылки → дашборд скрыт.
export type SessionOrigin = 'dashboard' | 'invite' | 'initiator';

interface CompanyContextValue {
  activeSignatoryId: string | null;
  setActiveSignatoryId: (id: string | null) => void;
  sessionOrigin: SessionOrigin;
  setSessionOrigin: (origin: SessionOrigin) => void;
  // Одноразовый тост поверх следующего экрана (напр. «Личный кабинет создан» после passcode).
  // Записывает экран-источник, читает и сразу гасит экран-приёмник.
  pendingToast: string | null;
  setPendingToast: (msg: string | null) => void;
}

const CompanyContext = createContext<CompanyContextValue>({
  activeSignatoryId: null,
  setActiveSignatoryId: () => undefined,
  sessionOrigin: 'dashboard',
  setSessionOrigin: () => undefined,
  pendingToast: null,
  setPendingToast: () => undefined,
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [activeSignatoryId, setActiveSignatoryId] = useState<string | null>(null);
  const [sessionOrigin, setSessionOrigin] = useState<SessionOrigin>('dashboard');
  const [pendingToast, setPendingToast] = useState<string | null>(null);
  return (
    <CompanyContext.Provider value={{ activeSignatoryId, setActiveSignatoryId, sessionOrigin, setSessionOrigin, pendingToast, setPendingToast }}>
      {children}
    </CompanyContext.Provider>
  );
};
