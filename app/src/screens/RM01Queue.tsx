import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { BodyM, BodyS } from '@salutejs/sdds-serv';
import { textPrimary, textSecondary, surfaceSolidSecondary } from '@salutejs/sdds-themes/tokens';
import { RmLayout, Pill } from '../ui/RmLayout';
import { getDvuTasks, takeTask } from '../mock/api';
import type { DVUPriority, DVUStatus, DVUTask } from '../mock/types';

// RM-01 — Очередь задач DVU. source: 2026-06-01_obo : DVU OBO (Create task)
// Менеджер видит входящие задачи (провал авто-проверок) и берёт их в работу.

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: ${surfaceSolidSecondary};
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
  &:hover {
    background-color: rgba(245, 129, 31, 0.08);
    transform: translateY(-1px);
  }
`;

const Chevron = styled.span`
  color: ${textSecondary};
  font-size: 1.25rem;
  line-height: 1;
`;

const Main = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Company = styled(BodyM)`
  color: ${textPrimary};
`;

const Reason = styled(BodyS)`
  color: ${textSecondary};
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex: 0 0 auto;
`;

const priorityTone = (p: DVUPriority) => (p === 'High' ? 'warning' : p === 'Medium' ? 'accent' : 'neutral');
const statusTone = (s: DVUStatus) => (s === 'Resolved' ? 'positive' : s === 'New' ? 'warning' : 'neutral');
const statusLabel: Record<DVUStatus, string> = {
  New: 'Новая',
  InProgress: 'В работе',
  Resolved: 'Закрыта',
  DocumentsRequested: 'Запрошены документы',
};

export const RM01Queue = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DVUTask[]>([]);

  useEffect(() => {
    getDvuTasks().then(setTasks);
  }, []);

  // Клик по карточке открывает задачу. Новую — попутно берём в работу
  // (New → В работе); статус регулируется этим, а не отдельной кнопкой.
  // Маршрут зависит от домена DVU (OBO / KYC / VKYC).
  const open = async (t: DVUTask) => {
    if (t.status === 'New') await takeTask(t.id);
    const route = t.domain === 'KYC' ? '/rm/kyc' : t.domain === 'VKYC' ? '/rm/vkyc' : '/rm/task';
    navigate(`${route}?id=${t.id}`);
  };

  return (
    <RmLayout
      title="Очередь задач DVU"
      subtitle="Заявки, не прошедшие авто-проверку — по всем доменам (OBO · KYC · VKYC). Клик по задаче — открыть и взять в работу."
    >
      {tasks.map((t) => (
        <Row key={t.id} onClick={() => open(t)}>
          <Main>
            <TitleRow>
              <Company>{t.companyName}</Company>
              <Pill tone="neutral">{t.id}</Pill>
              <Pill tone="neutral">{t.domain}</Pill>
            </TitleRow>
            <Reason>
              {t.reason} · {t.createdAt}
            </Reason>
          </Main>
          <Meta>
            <Pill tone={priorityTone(t.priority)}>{t.priority}</Pill>
            <Pill tone={statusTone(t.status)}>{statusLabel[t.status]}</Pill>
            <Chevron>›</Chevron>
          </Meta>
        </Row>
      ))}
    </RmLayout>
  );
};
