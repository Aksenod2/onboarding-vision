import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Контекст «активный подписант» — кого выбрали через «Войти как [имя]» на дашборде компании.
// Фаза B (сессия подписанта) пишет прогресс в запись этого лица.

interface CompanyContextValue {
  activeSignatoryId: string | null;
  setActiveSignatoryId: (id: string | null) => void;
}

const CompanyContext = createContext<CompanyContextValue>({
  activeSignatoryId: null,
  setActiveSignatoryId: () => undefined,
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [activeSignatoryId, setActiveSignatoryId] = useState<string | null>(null);
  return (
    <CompanyContext.Provider value={{ activeSignatoryId, setActiveSignatoryId }}>
      {children}
    </CompanyContext.Provider>
  );
};
