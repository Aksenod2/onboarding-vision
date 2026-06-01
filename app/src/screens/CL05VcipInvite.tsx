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
import { getSignatories, getVcip } from '../mock/api';
import type { AuthorizedSignatory, VCIPSession } from '../mock/types';

// CL-05 — Видеоидентификация: приглашение (eKyc / VCIP). source: 2026-06-01_obo : 005
// Список подписантов со статусом eKyc/VCIP, запуск self-VKYC на каждого.

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

const Person = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
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

const Title = styled(BodyM)`
  color: ${textPrimary};
`;

export const CL05VcipInvite = () => {
  const navigate = useNavigate();
  const [signatories, setSignatories] = useState<AuthorizedSignatory[]>([]);
  const [vcip, setVcip] = useState<VCIPSession[]>([]);

  useEffect(() => {
    getSignatories().then(setSignatories);
    getVcip().then(setVcip);
  }, []);

  const statusOf = (id: string) => vcip.find((v) => v.signatoryId === id)?.status ?? 'Pending';
  const allPassed = signatories.length > 0 && signatories.every((s) => statusOf(s.id) === 'Passed');

  return (
    <OnboardingLayout
      step={3}
      title="Видеоидентификация"
      subtitle="Подписантам нужно пройти видеоидентификацию (VCIP) с подтверждением личности по Aadhaar."
      primary={<Button view="accent" size="m" text="Продолжить" onClick={() => navigate('/documents')} />}
    >
      <Note
        view="info"
        size="s"
        title="Как это работает"
        text="Запустите self-VKYC: короткая видеосессия с проверкой лица и документа. Если eKyc по Aadhaar не пройдёт — назначим сессию VKYC / F2F."
      />

      {signatories.map((s) => {
        const passed = statusOf(s.id) === 'Passed';
        return (
          <Row key={s.id}>
            <Person>
              <Title>{s.fullName}</Title>
              <Muted>
                {s.designation} · PAN {s.pan}
              </Muted>
            </Person>
            <Right>
              <Badge ok={passed}>{passed ? 'Пройдено' : 'Ожидает'}</Badge>
              <Button
                view={passed ? 'clear' : 'accent'}
                size="s"
                text={passed ? 'Пройдено' : 'Пройти видеоидентификацию'}
                disabled={passed}
                onClick={() => navigate(`/vcip-session?sig=${s.id}`)}
              />
            </Right>
          </Row>
        );
      })}

      {allPassed && (
        <Note view="positive" size="s" title="Все подписанты идентифицированы" text="Можно переходить к загрузке документов." />
      )}
    </OnboardingLayout>
  );
};
