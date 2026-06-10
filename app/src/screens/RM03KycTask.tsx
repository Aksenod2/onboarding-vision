import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextArea, Note, BodyM, BodyS } from '@salutejs/sdds-serv';
import { textPrimary, textSecondary, surfaceSolidSecondary } from '@salutejs/sdds-themes/tokens';
import { RmLayout, Pill } from '../ui/RmLayout';
import { ApplicationPath } from '../ui/ApplicationPath';
import { getCompany, getDvuTask, getScreening, resolveTask } from '../mock/api';
import type { Company, DVUTask, ScreeningResult } from '../mock/types';

// RM-03 — Карточка: разбор KYC-алерта. source: 2026-06-01_obo : 006.01.1.2.1 (DVU KYC)
// Авто-проверка KYC дала Alert (PAN/OFAC/CRILC/CKYC) → менеджер разбирает и закрывает.

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 1.25rem;
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Block = styled.div`
  background-color: ${surfaceSolidSecondary};
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

const BlockTitle = styled(BodyM)`
  color: ${textPrimary};
`;

const Muted = styled(BodyS)`
  color: ${textSecondary};
`;

const CheckRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const CheckMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
`;

// В этом кейсе алерт по CRILC (кредитная нагрузка) — подсветим именно его.
const ALERTED: ScreeningResult['checkType'] = 'CRILC';

export const RM03KycTask = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';

  const [task, setTask] = useState<DVUTask | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [checks, setChecks] = useState<ScreeningResult[]>([]);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    getDvuTask(id).then((t) => setTask(t ?? null));
    getCompany().then(setCompany);
    getScreening().then(setChecks);
  }, [id]);

  const handleResolve = async () => {
    await resolveTask(id);
    setDone(true);
  };

  return (
    <RmLayout
      title={task ? `KYC alert · ${task.id}` : 'KYC alert'}
      subtitle={task ? `${task.companyName} · ${task.reason}` : undefined}
      onBack={() => navigate('/rm/queue')}
    >
      {task && <ApplicationPath companyName={task.companyName} current="KYC" />}

      {done && (
        <Note view="positive" title="Alert closed" text="Data confirmed, KYC verification continues." />
      )}

      <Grid>
        <Col>
          {company && (
            <Block>
              <BlockTitle>Company</BlockTitle>
              <Muted>
                {company.companyName} · PAN {company.pan}
              </Muted>
            </Block>
          )}
          <Block>
            <BlockTitle>KYC check results</BlockTitle>
            {checks.map((c) => {
              const alerted = c.checkType === ALERTED;
              return (
                <CheckRow key={c.checkType}>
                  <CheckMain>
                    <Muted>
                      {c.checkType} {alerted ? '· requires review' : ''}
                    </Muted>
                    <Muted>{c.detail}</Muted>
                  </CheckMain>
                  <Pill tone={alerted ? 'warning' : 'positive'}>{alerted ? 'Alert' : c.status}</Pill>
                </CheckRow>
              );
            })}
          </Block>
        </Col>

        <Col>
          <Panel>
            <BlockTitle>Decision</BlockTitle>
            <TextArea
              label="Comment"
              placeholder="E.g.: CRILC exposure within limits, confirmed by bank statement"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button view="accent" size="m" text="Close alert (data valid)" disabled={done} onClick={handleResolve} />
            <Button view="secondary" size="m" text="Contact client" disabled={done} />
          </Panel>
        </Col>
      </Grid>
    </RmLayout>
  );
};
