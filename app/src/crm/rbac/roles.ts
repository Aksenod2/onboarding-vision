// RBAC: роли отдела работы с клиентами (spike §5). Добавить роль = +значение здесь +пресет.
// «Менеджер + Оператор делят Sales-WS, различаются урезанием прав» (архитектура §5).

export type Role = 'manager' | 'operator' | 'dvu-officer' | 'dvu-approver';

export const ROLES: Role[] = ['manager', 'operator', 'dvu-officer', 'dvu-approver'];

// Текущий пользователь под каждой ролью (для four-eyes-гарда в spike).
// Демо: каждая роль = свой логин. dvu-approver ≠ officer.ivanov → может аппрувить Mehta.
export const ROLE_USER: Record<Role, string> = {
  manager: 'manager.rao',
  operator: 'operator.das',
  'dvu-officer': 'officer.ivanov', // совпадает с performedBy задачи Mehta → four-eyes сработает
  'dvu-approver': 'approver.kapoor',
};

// Действия (permissions). Гейтятся через useCan().
export type Permission =
  | 'create-offer'
  | 'create-deal'
  | 'link-onboarding'
  | 'resume-application'
  | 'create-profile'
  | 'take-dvu-task'
  | 'review-dvu' // открыть карточку проверки
  | 'resolve-dvu' // одобрить/отклонить (финал, аппрувер)
  | 'request-document';

// Какой рабочий стол монтирует роль.
export type Workspace = 'sales' | 'queue';
