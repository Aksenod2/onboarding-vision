import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Select, Radiobox, Note, BodyM, BodyS } from '@salutejs/sdds-serv';
import { textPrimary, textSecondary, surfaceSolidSecondary } from '@salutejs/sdds-themes/tokens';
import { RmLayout } from '../ui/RmLayout';
import { ApplicationPath } from '../ui/ApplicationPath';
import { getDvuTask, getSignatories, resolveTask } from '../mock/api';
import type { AuthorizedSignatory, DVUTask } from '../mock/types';

// RM-05 — Планирование VKYC / F2F-сессии. source: 2026-06-01_obo : 005.02.2.1 (DVU VKYC session)
// Менеджер назначает формат и слот, затем проводит сессию → VKYC complete.

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

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
`;

const SLOTS = [
  { value: '02-06 10:00', label: '2 июня, 10:00' },
  { value: '02-06 14:30', label: '2 июня, 14:30' },
  { value: '03-06 11:00', label: '3 июня, 11:00' },
];

type Stage = 'plan' | 'scheduled' | 'done';

export const RM05Session = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';

  const [task, setTask] = useState<DVUTask | null>(null);
  const [signatory, setSignatory] = useState<AuthorizedSignatory | null>(null);
  const [format, setFormat] = useState<'VKYC' | 'F2F'>('VKYC');
  const [slot, setSlot] = useState('');
  const [stage, setStage] = useState<Stage>('plan');

  useEffect(() => {
    getDvuTask(id).then((t) => setTask(t ?? null));
    getSignatories().then((list) => setSignatory(list.find((s) => s.id === 'SIG-2') ?? list[0] ?? null));
  }, [id]);

  const slotLabel = SLOTS.find((s) => s.value === slot)?.label ?? slot;

  const handleComplete = async () => {
    await resolveTask(id);
    setStage('done');
  };

  return (
    <RmLayout
      title={task ? `Сессия VKYC/F2F · ${task.id}` : 'Сессия VKYC/F2F'}
      subtitle={signatory ? `Подписант: ${signatory.fullName}` : undefined}
      onBack={() => navigate('/rm/queue')}
    >
      {task && <ApplicationPath companyName={task.companyName} current="VKYC" />}

      {stage === 'done' && (
        <Note view="positive" title="Сессия проведена" text="Видеоидентификация завершена (VKYC complete), задача закрыта." />
      )}
      {stage === 'scheduled' && (
        <Note
          view="info"
          title="Сессия назначена"
          text={`${format === 'VKYC' ? 'Видео-сессия VKYC' : 'Очная встреча F2F'} · ${slotLabel}. Приглашение отправлено подписанту.`}
        />
      )}

      <Grid>
        <Col>
          <Block>
            <BlockTitle>Формат</BlockTitle>
            <Radiobox
              name="format"
              label="VKYC — видеосессия"
              checked={format === 'VKYC'}
              onChange={() => setFormat('VKYC')}
              disabled={stage !== 'plan'}
            />
            <Radiobox
              name="format"
              label="F2F — очная встреча"
              checked={format === 'F2F'}
              onChange={() => setFormat('F2F')}
              disabled={stage !== 'plan'}
            />
          </Block>
          <Block>
            <BlockTitle>Слот</BlockTitle>
            <Select
              label="Дата и время"
              items={SLOTS}
              value={slot}
              onChange={(v: string) => setSlot(v)}
              size="m"
              disabled={stage !== 'plan'}
            />
          </Block>
        </Col>

        <Col>
          <Panel>
            <BlockTitle>Действие</BlockTitle>
            {stage === 'plan' ? (
              <Button
                view="accent"
                size="m"
                text="Назначить сессию"
                disabled={!slot}
                onClick={() => setStage('scheduled')}
              />
            ) : (
              <Button
                view="accent"
                size="m"
                text="Завершить (проведено)"
                disabled={stage === 'done'}
                onClick={handleComplete}
              />
            )}
            <Muted>{format === 'VKYC' ? 'Видеосессия' : 'Очная встреча'}{slot ? ` · ${slotLabel}` : ''}</Muted>
          </Panel>
        </Col>
      </Grid>
    </RmLayout>
  );
};
