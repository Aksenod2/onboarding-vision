import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getDvuTasksByCompany } from '../mock/api';
import { RM_ORANGE } from './rmTheme';
import type { DVUDomain, DVUTask } from '../mock/types';

// «Путь заявки» — единый степпер проверок одной заявки (OBO → KYC → VKYC).
// Показывает, что проверки — это один путь разбора заявки командой, а не
// разрозненные задачи. Подсвечивает текущий домен, переключает между проверками.

const ORDER: { domain: DVUDomain; label: string; route: string }[] = [
  { domain: 'OBO', label: 'Данные · OBO', route: '/rm/task' },
  { domain: 'KYC', label: 'KYC-проверки', route: '/rm/kyc' },
  { domain: 'VKYC', label: 'Видеоидентификация', route: '/rm/vkyc' },
];

const statusShort: Record<DVUTask['status'], string> = {
  New: 'ожидает',
  InProgress: 'в работе',
  Resolved: '✓ закрыто',
  DocumentsRequested: 'запрос данных',
};

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.875rem 1rem;
  background: rgba(${RM_ORANGE.glow}, 0.07);
  border: 1px solid rgba(${RM_ORANGE.glow}, 0.18);
  border-radius: 0.75rem;
`;

const Caption = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: ${RM_ORANGE.text};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const Arrow = styled.span`
  color: rgba(16, 24, 40, 0.3);
`;

const Step = styled.button<{ active: boolean }>`
  display: inline-flex;
  flex-direction: column;
  gap: 0.1rem;
  align-items: flex-start;
  border: 1px solid ${({ active }) => (active ? RM_ORANGE.base : 'rgba(16,24,40,0.12)')};
  background: ${({ active }) => (active ? RM_ORANGE.base : '#fff')};
  color: ${({ active }) => (active ? '#fff' : '#475467')};
  padding: 0.3rem 0.7rem;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    border-color: ${RM_ORANGE.base};
  }
`;

const StepName = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
`;

const StepStatus = styled.span<{ active: boolean }>`
  font-size: 0.68rem;
  opacity: ${({ active }) => (active ? 0.9 : 0.7)};
`;

interface Props {
  companyName: string;
  current: DVUDomain;
}

export const ApplicationPath = ({ companyName, current }: Props) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DVUTask[]>([]);

  useEffect(() => {
    getDvuTasksByCompany(companyName).then(setTasks);
  }, [companyName]);

  // Шаги пути = домены, по которым у заявки есть проверки.
  const steps = ORDER.map((o) => ({ ...o, task: tasks.find((t) => t.domain === o.domain) })).filter(
    (s) => s.task,
  );
  if (steps.length <= 1) return null; // одна проверка — путь показывать незачем

  return (
    <Wrap>
      <Caption>Путь заявки · {companyName}</Caption>
      <Row>
        {steps.map((s, i) => (
          <Fragment key={s.domain}>
            {i > 0 && <Arrow>→</Arrow>}
            <Step
              active={s.domain === current}
              onClick={() => navigate(`${s.route}?id=${s.task!.id}`)}
            >
              <StepName>{s.label}</StepName>
              <StepStatus active={s.domain === current}>{statusShort[s.task!.status]}</StepStatus>
            </Step>
          </Fragment>
        ))}
      </Row>
    </Wrap>
  );
};
