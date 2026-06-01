import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Note, BodyM, BodyS } from '@salutejs/sdds-serv';
import { textPrimary, textSecondary, surfaceSolidSecondary } from '@salutejs/sdds-themes/tokens';
import { OnboardingLayout } from '../ui/OnboardingLayout';
import { getOnboardingCase, openAccount } from '../mock/api';
import type { Account, OnboardingCase } from '../mock/types';

// CL-09 — Результат: открытие счёта. source: 2026-06-01_obo : 009 (Account opening trigger)
// Итог пути: статус заявки + реквизиты счёта (для STP). Финал клиентского пути.

const Block = styled.div`
  background-color: ${surfaceSolidSecondary};
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

const Title = styled(BodyM)`
  color: ${textPrimary};
`;

const RowLine = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

const Key = styled(BodyS)`
  color: ${textSecondary};
`;

const Val = styled(BodyS)`
  color: ${textPrimary};
  font-weight: 600;
`;

export const CL09Result = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<OnboardingCase | null>(null);
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    getOnboardingCase().then(setData);
    openAccount().then(setAccount); // шаг 009: триггер открытия счёта (mock)
  }, []);

  const mode = data?.mode ?? 'STP';
  const stp = mode === 'STP';

  return (
    <OnboardingLayout
      step={6}
      title={stp ? 'Счёт открывается' : 'Заявка принята'}
      subtitle={data ? `${data.company.companyName} · сценарий ${mode}` : undefined}
      primary={<Button view="accent" size="m" text="На главную" onClick={() => navigate('/')} />}
    >
      <Note
        view={stp ? 'positive' : 'info'}
        title={stp ? 'Заявка одобрена автоматически (STP)' : 'Заявка на ручной проверке'}
        text={
          stp
            ? 'Все проверки пройдены. Счёт открывается, реквизиты — ниже.'
            : mode === 'Hybrid'
              ? 'Часть данных требует проверки DVU. Мы свяжемся по результатам.'
              : 'Потребуется офлайн-визит для завершения идентификации.'
        }
      />

      {account && stp && (
        <Block>
          <Title>Реквизиты счёта</Title>
          <RowLine>
            <Key>CIF</Key>
            <Val>{account.cif}</Val>
          </RowLine>
          <RowLine>
            <Key>Продукт</Key>
            <Val>{account.productName}</Val>
          </RowLine>
          <RowLine>
            <Key>Класс счёта</Key>
            <Val>{account.accountClass}</Val>
          </RowLine>
          <RowLine>
            <Key>Валюта</Key>
            <Val>{account.currency}</Val>
          </RowLine>
        </Block>
      )}

      <Note
        view="info"
        size="s"
        title="Что дальше"
        text="Доступ в интернет-банк и обслуживание счёта — за пределами онбординга."
      />
    </OnboardingLayout>
  );
};
