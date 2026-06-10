import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextArea, Note, BodyM, BodyS } from '@salutejs/sdds-serv';
import { textPrimary, textSecondary, surfaceSolidSecondary } from '@salutejs/sdds-themes/tokens';
import { RmLayout, Pill } from '../ui/RmLayout';
import { ApplicationPath } from '../ui/ApplicationPath';
import {
  getCompany,
  getDvuTask,
  getRequiredDocuments,
  getSignatories,
  requestDocuments,
  resolveTask,
} from '../mock/api';
import type { AuthorizedSignatory, Company, DocumentRecord, DVUTask } from '../mock/types';

// RM-02 — Карточка задачи: проверка документов и данных. source: DVU OBO (Validate)
// Менеджер сверяет данные/документы → «валидно» (закрыть) или «запросить документы» (транзит к клиенту).

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

const DocRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

export const RM02Task = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';

  const [task, setTask] = useState<DVUTask | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [signatories, setSignatories] = useState<AuthorizedSignatory[]>([]);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState<null | 'resolved' | 'requested'>(null);

  useEffect(() => {
    getDvuTask(id).then((t) => setTask(t ?? null));
    getCompany().then(setCompany);
    getSignatories().then(setSignatories);
    getRequiredDocuments().then(setDocs);
  }, [id]);

  const handleResolve = async () => {
    await resolveTask(id);
    setDone('resolved');
  };
  const handleRequest = async () => {
    await requestDocuments(id); // нотификация клиенту; менеджер остаётся у себя
    setDone('requested');
  };

  return (
    <RmLayout
      title={task ? `Task ${task.id}` : 'Task'}
      subtitle={task ? `${task.companyName} · ${task.reason}` : undefined}
      onBack={() => navigate('/rm/queue')}
    >
      {task && <ApplicationPath companyName={task.companyName} current="OBO" />}

      {done === 'resolved' && (
        <Note view="positive" title="Task resolved" text="Data and documents marked as valid. The onboarding flow continues." />
      )}
      {done === 'requested' && (
        <Note
          view="warning"
          title="Documents requested from client"
          text="A notification has been sent to the client. The task has been set to “Documents requested” and is awaiting a response."
        />
      )}

      <Grid>
        {/* Левая колонка — данные заявки */}
        <Col>
          {company && (
            <Block>
              <BlockTitle>Company</BlockTitle>
              <Muted>{company.companyName}</Muted>
              <Muted>
                PAN {company.pan} · CIN {company.cin}
              </Muted>
              <Muted>
                {company.registeredAddress.line}, {company.registeredAddress.city},{' '}
                {company.registeredAddress.state} {company.registeredAddress.pin}
              </Muted>
            </Block>
          )}

          <Block>
            <BlockTitle>Authorized signatories</BlockTitle>
            {signatories.map((s) => (
              <Muted key={s.id}>
                {s.fullName} · {s.designation} · PAN {s.pan}
              </Muted>
            ))}
          </Block>

          <Block>
            <BlockTitle>Documents</BlockTitle>
            {docs.map((d) => (
              <DocRow key={d.docType}>
                <Muted>{d.docType}</Muted>
                <Pill tone={d.status === 'Pending' ? 'warning' : 'positive'}>
                  {d.status === 'Pending' ? 'Not uploaded' : 'Uploaded'}
                </Pill>
              </DocRow>
            ))}
          </Block>
        </Col>

        {/* Правая колонка — решение */}
        <Col>
          <Panel>
            <BlockTitle>Decision</BlockTitle>
            <TextArea
              label="Comment"
              placeholder="E.g.: signatures on the Board Resolution match the PAN cards"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Actions>
              <Button
                view="accent"
                size="m"
                text="Mark as valid"
                disabled={!!done}
                onClick={handleResolve}
              />
              <Button
                view="secondary"
                size="m"
                text="Request documents"
                disabled={!!done}
                onClick={handleRequest}
              />
            </Actions>
          </Panel>
        </Col>
      </Grid>
    </RmLayout>
  );
};
