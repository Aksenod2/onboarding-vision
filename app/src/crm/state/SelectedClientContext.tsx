import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import type { ProcessNodeId } from '../types/domain';

// SelectedClientContext + ProcessContext (объед.окно §3, процессное-окно §6):
// выбранный клиент и активный узел spine живут ОТДЕЛЬНО от workspace-компонентов.
// Смена роли НЕ сбрасывает их → «один клиент — разные проекции».

interface SelectedClientCtx {
  clientId: string | null; // null = реестр (клиент не выбран)
  activeNode: ProcessNodeId | null; // узел spine, на котором открыто процессное окно
  select: (clientId: string, node?: ProcessNodeId) => void;
  setActiveNode: (node: ProcessNodeId) => void;
  clear: () => void; // вернуться к реестру
}

const Ctx = createContext<SelectedClientCtx | null>(null);

export const SelectedClientProvider = ({ children }: { children: ReactNode }) => {
  const [clientId, setClientId] = useState<string | null>(null);
  const [activeNode, setActiveNodeState] = useState<ProcessNodeId | null>(null);

  const value = useMemo<SelectedClientCtx>(
    () => ({
      clientId,
      activeNode,
      select: (id, node) => {
        setClientId(id);
        if (node) setActiveNodeState(node);
      },
      setActiveNode: (node) => setActiveNodeState(node),
      clear: () => {
        setClientId(null);
        setActiveNodeState(null);
      },
    }),
    [clientId, activeNode],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useSelectedClient = (): SelectedClientCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSelectedClient must be used within SelectedClientProvider');
  return ctx;
};
