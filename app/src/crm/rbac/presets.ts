// RBAC-пресеты (spike §3/§5): presets[role] = { workspace, visibleColumns, actions, registryDefault }.
// Добавление роли = +пресет, ядро client-360 не трогаем (тезис масштабируемости §7).

import type { Role, Permission, Workspace } from './roles';

// Колонки «воронки в строке» реестра — роль-урезанные (решение Дениса п.3).
// 'spine' = колонка-этап (мини-spine) — у всех ролей. Остальные — по job-у роли.
export type RegistryColumn =
  | 'company' // Company + Prospect/Customer
  | 'pan' // PAN/CIN
  | 'application' // Applications с «(N дней)»
  | 'spine' // колонка-этап = мини-spine
  | 'offerDeal' // Offer/Deal (Sales)
  | 'lead' // Lead/источник (Sales)
  | 'tasks' // Tasks count (Sales)
  | 'sla' // SLA (DVU)
  | 'assignee'; // назначен (DVU)

// Сущность по умолчанию в реестре.
export type RegistryEntity = 'profiles' | 'applications';

// Дефолт-сегмент R2 (входной-реестр §3).
export type RegistrySegment = 'action-required' | 'mine' | 'new' | 'all';

export interface RegistryDefault {
  entity: RegistryEntity;
  segment: RegistrySegment;
  columns: RegistryColumn[];
}

export interface WorkspacePreset {
  workspace: Workspace;
  actions: Permission[]; // что роль может (зона D + действия в строке)
  registryDefault: RegistryDefault;
}

// Полная воронка в строке (Sales): company · pan · spine · application · offer/deal · lead · tasks.
const SALES_COLUMNS: RegistryColumn[] = ['company', 'pan', 'spine', 'application', 'offerDeal', 'lead', 'tasks'];
// DVU-урезанная: company · pan · spine · application · sla · assignee (без offers/deals — шум для DVU).
const DVU_COLUMNS: RegistryColumn[] = ['company', 'pan', 'spine', 'application', 'sla', 'assignee'];

export const presets: Record<Role, WorkspacePreset> = {
  manager: {
    workspace: 'sales',
    actions: ['create-offer', 'create-deal', 'link-onboarding'],
    registryDefault: { entity: 'profiles', segment: 'mine', columns: SALES_COLUMNS },
  },
  operator: {
    workspace: 'sales',
    actions: ['resume-application', 'create-profile'],
    registryDefault: { entity: 'applications', segment: 'new', columns: SALES_COLUMNS },
  },
  'dvu-officer': {
    workspace: 'queue',
    actions: ['take-dvu-task', 'review-dvu', 'request-document'],
    registryDefault: { entity: 'applications', segment: 'action-required', columns: DVU_COLUMNS },
  },
  'dvu-approver': {
    workspace: 'queue',
    actions: ['review-dvu', 'resolve-dvu', 'request-document'],
    registryDefault: { entity: 'applications', segment: 'action-required', columns: DVU_COLUMNS },
  },
};
