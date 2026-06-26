import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import type { Role, Permission } from './roles';
import { ROLE_USER } from './roles';
import { presets, type WorkspacePreset } from './presets';

// RoleContext (spike §5): текущая роль в контексте (НЕ в пропсах). useRole()/useCan().
// В прототипе роль меняется role-switcher'ом в шапке; контекст выбранного клиента
// (SelectedClientContext) переживает смену роли — workspace = f(роль, clientId).

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  currentUser: string; // логин текущего пользователя под ролью (для four-eyes)
  preset: WorkspacePreset;
  can: (p: Permission) => boolean;
}

const RoleContext = createContext<RoleCtx | null>(null);

export const RoleProvider = ({ children, initial = 'manager' }: { children: ReactNode; initial?: Role }) => {
  const [role, setRole] = useState<Role>(initial);
  const value = useMemo<RoleCtx>(() => {
    const preset = presets[role];
    return {
      role,
      setRole,
      currentUser: ROLE_USER[role],
      preset,
      can: (p) => preset.actions.includes(p),
    };
  }, [role]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = (): RoleCtx => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
};

export const useCan = (p: Permission): boolean => useRole().can(p);
