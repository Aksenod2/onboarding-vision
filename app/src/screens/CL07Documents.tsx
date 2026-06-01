import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Note, BodyM, BodyS } from '@salutejs/sdds-serv';
import {
  textPrimary,
  textSecondary,
  textPositive,
  textWarning,
  surfaceTransparentPositive,
  surfaceTransparentWarning,
  surfaceSolidSecondary,
} from '@salutejs/sdds-themes/tokens';
import { OnboardingLayout } from '../ui/OnboardingLayout';
import { getRequiredDocuments, uploadDocument } from '../mock/api';
import type { DocumentRecord } from '../mock/types';

// CL-07 — Загрузка документов. source: 2026-06-01_obo : DVU OBO (Document request)
// Hybrid/Offline: клиент загружает документы, которые не пришли из реестра.

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background-color: ${surfaceSolidSecondary};
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
`;

const Doc = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const Title = styled(BodyM)`
  color: ${textPrimary};
`;

const Muted = styled(BodyS)`
  color: ${textSecondary};
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Badge = styled.span<{ ok: boolean }>`
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: ${({ ok }) => (ok ? surfaceTransparentPositive : surfaceTransparentWarning)};
  color: ${({ ok }) => (ok ? textPositive : textWarning)};
`;

export const CL07Documents = () => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    getRequiredDocuments().then(setDocs);
  }, []);

  const handleUpload = async (docType: DocumentRecord['docType']) => {
    const next = await uploadDocument(docType);
    setDocs(next);
  };

  const allUploaded = docs.length > 0 && docs.every((d) => d.status !== 'Pending');

  return (
    <OnboardingLayout
      step={4}
      title="Загрузка документов"
      subtitle="Эти документы не удалось получить автоматически — загрузите их вручную (PDF, JPG)."
      primary={<Button view="accent" size="m" text="Продолжить" onClick={() => navigate('/confirm')} />}
    >
      {docs.map((d) => {
        const uploaded = d.status !== 'Pending';
        return (
          <Row key={d.docType}>
            <Doc>
              <Title>{d.docType}</Title>
              <Muted>{d.mandatory ? 'Обязательный' : 'Необязательный'}</Muted>
            </Doc>
            <Right>
              <Badge ok={uploaded}>{uploaded ? 'Загружен' : 'Требуется'}</Badge>
              <Button
                view={uploaded ? 'clear' : 'secondary'}
                size="s"
                text={uploaded ? 'Заменить' : 'Загрузить'}
                onClick={() => handleUpload(d.docType)}
              />
            </Right>
          </Row>
        );
      })}

      {allUploaded && (
        <Note view="positive" size="s" title="Все документы загружены" text="Отправлены на проверку (System / DVU)." />
      )}
    </OnboardingLayout>
  );
};
