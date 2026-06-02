import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextArea, Note, BodyM, BodyS } from '@salutejs/sdds-serv';
import { textPrimary, textSecondary, surfaceSolidSecondary } from '@salutejs/sdds-themes/tokens';
import { RmLayout, Pill } from '../ui/RmLayout';
import { ApplicationPath } from '../ui/ApplicationPath';
import { getDvuTask, getSignatories, getVcip, resolveTask } from '../mock/api';
import type { AuthorizedSignatory, DVUTask, VCIPSession } from '../mock/types';

// RM-04 — Карточка: review VKYC-встречи. source: 2026-06-01_obo : 005.03 (DVU VKYC meeting)
// selfVKYC подписанта не прошёл → менеджер смотрит запись встречи и выносит вердикт.

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
  gap: 0.5rem;
`;

const BlockTitle = styled(BodyM)`
  color: ${textPrimary};
`;

const Muted = styled(BodyS)`
  color: ${textSecondary};
`;

// Pill как прямой ребёнок flex-колонки растягивается на всю ширину — обнимаем контент.
const StatusPill = styled(Pill)`
  align-self: flex-start;
`;

const Video = styled.div`
  aspect-ratio: 16 / 10;
  border-radius: 0.75rem;
  background: rgba(16, 24, 40, 0.06);
  border: 1px dashed rgba(16, 24, 40, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${textSecondary};
  font-size: 0.85rem;
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
`;

export const RM04VkycMeeting = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';

  const [task, setTask] = useState<DVUTask | null>(null);
  const [signatory, setSignatory] = useState<AuthorizedSignatory | null>(null);
  const [session, setSession] = useState<VCIPSession | null>(null);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState<null | 'confirmed'>(null);

  useEffect(() => {
    getDvuTask(id).then((t) => setTask(t ?? null));
    // В этом кейсе на review — подписант, не прошедший selfVKYC (Priya / SIG-2).
    getSignatories().then((list) => setSignatory(list.find((s) => s.id === 'SIG-2') ?? list[0] ?? null));
    getVcip().then((v) => setSession(v.find((x) => x.signatoryId === 'SIG-2') ?? v[0] ?? null));
  }, [id]);

  const handleConfirm = async () => {
    await resolveTask(id);
    setDone('confirmed');
  };

  return (
    <RmLayout
      title={task ? `VKYC review · ${task.id}` : 'VKYC review'}
      subtitle={task ? task.reason : undefined}
      onBack={() => navigate('/rm/queue')}
    >
      {task && <ApplicationPath companyName={task.companyName} current="VKYC" />}

      {done === 'confirmed' && (
        <Note view="positive" title="Личность подтверждена" text="VKYC закрыт вручную, видеоидентификация пройдена." />
      )}

      <Grid>
        <Col>
          <Block>
            <BlockTitle>Подписант на проверке</BlockTitle>
            {signatory && (
              <>
                <Muted>
                  {signatory.fullName} · {signatory.designation} · PAN {signatory.pan}
                </Muted>
                <Muted>Aadhaar {signatory.aadhaar ?? '—'}</Muted>
              </>
            )}
            <StatusPill tone="warning">selfVKYC: {session?.status ?? 'Failed'}</StatusPill>
          </Block>
          <Block>
            <BlockTitle>Запись видеовстречи</BlockTitle>
            <Video>▶ Запись self-VKYC сессии (демо-плейсхолдер)</Video>
          </Block>
        </Col>

        <Col>
          <Panel>
            <BlockTitle>Вердикт</BlockTitle>
            <TextArea
              label="Комментарий"
              placeholder="Например: лицо совпадает с документом, освещение слабое — подтверждаю вручную"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button view="accent" size="m" text="Подтвердить личность" disabled={!!done} onClick={handleConfirm} />
            <Button
              view="secondary"
              size="m"
              text="Назначить VKYC / F2F-сессию"
              disabled={!!done}
              onClick={() => navigate(`/rm/session?id=${id}`)}
            />
          </Panel>
        </Col>
      </Grid>
    </RmLayout>
  );
};
