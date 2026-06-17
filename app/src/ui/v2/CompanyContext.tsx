import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Контекст «активный подписант» — кого выбрали через «Войти как [имя]» на дашборде компании.
// Фаза B (сессия подписанта) пишет прогресс в запись этого лица.

interface CompanyContextValue {
  activeSignatoryId: string | null;
  setActiveSignatoryId: (id: string | null) => void;
  // Одноразовый тост поверх следующего экрана (напр. «Личный кабинет создан» после passcode).
  // Записывает экран-источник, читает и сразу гасит экран-приёмник.
  pendingToast: string | null;
  setPendingToast: (msg: string | null) => void;
}

const CompanyContext = createContext<CompanyContextValue>({
  activeSignatoryId: null,
  setActiveSignatoryId: () => undefined,
  pendingToast: null,
  setPendingToast: () => undefined,
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [activeSignatoryId, setActiveSignatoryId] = useState<string | null>(null);
  const [pendingToast, setPendingToast] = useState<string | null>(null);
  return (
    <CompanyContext.Provider value={{ activeSignatoryId, setActiveSignatoryId, pendingToast, setPendingToast }}>
      {children}
    </CompanyContext.Provider>
  );
};
