import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { BodyM, BodyS } from '@salutejs/sdds-serv';
import { textPrimary, textSecondary, surfaceSolidSecondary } from '@salutejs/sdds-themes/tokens';
import { RmLayout, Pill } from '../ui/RmLayout';
import { getDvuTasks, takeTask } from '../mock/api';
import type { DVUDomain, DVUPriority, DVUStatus, DVUTask } from '../mock/types';

// RM-01 — Очередь заявок DVU (заявко-центрично). source: DVU OBO (Create task)
// Проверки одной заявки (OBO/KYC/VKYC) — один путь разбора, а не разрозненные
// задачи. Очередь группируется по заявке (компании); внутри — проверки по доменам.

const AppCard = styled.div`
  background-color: ${surfaceSolidSecondary};
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const AppHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const Company = styled(BodyM)`
  color: ${textPrimary};
`;

const Sub = styled(BodyS)`
  color: ${textSecondary};
`;

const Checks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const CheckChip = styled.button`
  display: inline-flex;
  flex-direction: column;
  gap: 0.2rem;
  align-items: flex-start;
  background: #fff;
  border: 1px solid rgba(16, 24, 40, 0.12);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  min-width: 9rem;
  transition: border-color 0.15s ease, transform 0.15s ease;
  &:hover {
    border-color: rgba(245, 129, 31, 0.7);
    transform: translateY(-1px);
  }
`;

const CheckTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const CheckName = styled.span`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${textPrimary};
`;

const CheckReason = styled.span`
  font-size: 0.72rem;
  color: ${textSecondary};
  max-width: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DOMAIN_LABEL: Record<DVUDomain, string> = {
  OBO: 'OBO · данные',
  KYC: 'KYC-проверки',
  VKYC: 'Видеоидентификация',
};
const DOMAIN_ORDER: DVUDomain[] = ['OBO', 'KYC', 'VKYC'];
const PRIORITY_RANK: Record<DVUPriority, number> = { High: 3, Medium: 2, Low: 1 };

const statusTone = (s: DVUStatus) => (s === 'Resolved' ? 'positive' : s === 'New' ? 'warning' : 'neutral');
const statusLabel: Record<DVUStatus, string> = {
  New: 'ожидает',
  InProgress: 'в работе',
  Resolved: 'закрыто',
  DocumentsRequested: 'запрос данных',
};
const domainRoute = (d: DVUDomain) => (d === 'KYC' ? '/rm/kyc' : d === 'VKYC' ? '/rm/vkyc' : '/rm/task');

export const RM01Queue = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DVUTask[]>([]);

  useEffect(() => {
    getDvuTasks().then(setTasks);
  }, []);

  // Группировка по заявке (компании), порядок появления сохраняем.
  const apps = new Map<string, DVUTask[]>();
  tasks.forEach((t) => {
    const list = apps.get(t.companyName) ?? [];
    list.push(t);
    apps.set(t.companyName, list);
  });

  const open = async (t: DVUTask) => {
    if (t.status === 'New') await takeTask(t.id);
    navigate(`${domainRoute(t.domain)}?id=${t.id}`);
  };

  return (
    <RmLayout
      title="Очередь заявок DVU"
      subtitle="Заявки на ручной проверке. У каждой — путь проверок по доменам (OBO · KYC · VKYC). Откройте нужную проверку."
    >
      {[...apps.entries()].map(([company, list]) => {
        const checks = [...list].sort((a, b) => DOMAIN_ORDER.indexOf(a.domain) - DOMAIN_ORDER.indexOf(b.domain));
        const topPriority = checks.reduce<DVUPriority>(
          (acc, t) => (PRIORITY_RANK[t.priority] > PRIORITY_RANK[acc] ? t.priority : acc),
          'Low',
        );
        const openCount = checks.filter((t) => t.status !== 'Resolved').length;
        return (
          <AppCard key={company}>
            <AppHead>
              <Company>{company}</Company>
              <Pill tone={topPriority === 'High' ? 'warning' : topPriority === 'Medium' ? 'accent' : 'neutral'}>
                {topPriority}
              </Pill>
            </AppHead>
            <Sub>
              На проверке: {openCount} из {checks.length} ({checks.map((c) => c.domain).join(' · ')})
            </Sub>
            <Checks>
              {checks.map((t) => (
                <CheckChip key={t.id} onClick={() => open(t)}>
                  <CheckTop>
                    <CheckName>{DOMAIN_LABEL[t.domain]}</CheckName>
                    <Pill tone={statusTone(t.status)}>{statusLabel[t.status]}</Pill>
                  </CheckTop>
                  <CheckReason>{t.reason}</CheckReason>
                </CheckChip>
              ))}
            </Checks>
          </AppCard>
        );
      })}
    </RmLayout>
  );
};
