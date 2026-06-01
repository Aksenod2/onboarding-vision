import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Checkbox, Note, BodyM, BodyS } from '@salutejs/sdds-serv';
import { textPrimary, textSecondary, surfaceSolidSecondary } from '@salutejs/sdds-themes/tokens';
import { OnboardingLayout } from '../ui/OnboardingLayout';
import { getOnboardingCase, getRequiredDocuments } from '../mock/api';
import type { DocumentRecord, OnboardingCase } from '../mock/types';

// CL-08 — Подтверждение и отправка заявки. source: 2026-06-01_obo : 006
// Сводка всех данных перед запуском KYC + согласия + отправка.

const Block = styled.div`
  background-color: ${surfaceSolidSecondary};
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const BlockHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled(BodyM)`
  color: ${textPrimary};
`;

const Muted = styled(BodyS)`
  color: ${textSecondary};
`;

const Consents = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

export const CL08Confirm = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<OnboardingCase | null>(null);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [accuracy, setAccuracy] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    getOnboardingCase().then(setData);
    getRequiredDocuments().then(setDocs);
  }, []);

  if (!data) {
    return (
      <OnboardingLayout step={5} title="Подтверждение заявки">
        <Muted>Собираем сводку…</Muted>
      </OnboardingLayout>
    );
  }

  const uploaded = docs.filter((d) => d.status !== 'Pending').length;
  const vcipPassed = data.vcip.filter((v) => v.status === 'Passed').length;

  const section = (title: string, lines: string[], editPath?: string) => (
    <Block>
      <BlockHead>
        <Title>{title}</Title>
        {editPath && <Button view="clear" size="s" text="Изменить" onClick={() => navigate(editPath)} />}
      </BlockHead>
      {lines.map((l, i) => (
        <Muted key={i}>{l}</Muted>
      ))}
    </Block>
  );

  return (
    <OnboardingLayout
      step={5}
      title="Подтверждение заявки"
      subtitle="Проверьте данные перед отправкой. После отправки запустится проверка KYC."
      primary={
        <Button
          view="accent"
          size="m"
          text="Отправить заявку"
          onClick={() => navigate('/result')}
        />
      }
    >
      {section('Компания', [
        data.company.companyName,
        `PAN ${data.company.pan} · CIN ${data.company.cin}`,
        data.company.industry,
      ], '/company')}

      {section(
        'Подписанты',
        data.signatories.map((s) => `${s.fullName} · ${s.designation} · PAN ${s.pan}`),
        '/company',
      )}

      {section('Бизнес-профиль', [
        `Риск-категория: ${data.risk.category}`,
        `Сценарий: ${data.mode}`,
      ], '/business')}

      {section('Документы', [`Загружено: ${uploaded} из ${docs.length}`], '/documents')}

      {section('Видеоидентификация', [`Пройдено: ${vcipPassed} из ${data.vcip.length}`], '/vcip-invite')}

      <Consents>
        <Checkbox
          label="Подтверждаю достоверность предоставленных данных"
          checked={accuracy}
          onChange={() => setAccuracy((v) => !v)}
        />
        <Checkbox
          label="Согласен на обработку персональных данных"
          checked={consent}
          onChange={() => setConsent((v) => !v)}
        />
      </Consents>

      {!(accuracy && consent) && (
        <Note view="info" size="s" text="Для прототипа согласия необязательны — можно отправить заявку сразу." />
      )}
    </OnboardingLayout>
  );
};
