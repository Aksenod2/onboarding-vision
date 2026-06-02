import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Note, BodyM, BodyS } from '@salutejs/sdds-serv';
import { textPrimary, textSecondary, surfaceSolidSecondary } from '@salutejs/sdds-themes/tokens';
import { OnboardingLayout } from '../ui/OnboardingLayout';
import { RM_ORANGE, RmAccent } from '../ui/rmTheme';
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

// Мини-статус передачи заявки в банк (для Hybrid/Offline).
const Handoff = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const HArrow = styled.span`
  color: ${textSecondary};
`;

// Демо-мостик к стороне менеджера (мета-элемент, не часть продукта).
const DemoBridge = styled.div`
  margin-top: 1.25rem;
  border: 1px dashed rgba(16, 24, 40, 0.22);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  background: rgba(16, 24, 40, 0.02);
`;

const DemoLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #98a2b3;
`;

const Bridge = styled.div`
  align-self: flex-start;
`;

const HStep = styled.span<{ state: 'done' | 'active' | 'todo' }>`
  padding: 0.3rem 0.7rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  ${({ state }) =>
    state === 'done'
      ? 'background: rgba(33,160,56,0.14); color: #1E7B33;'
      : state === 'active'
        ? `background: ${RM_ORANGE.base}; color: #fff;`
        : 'background: rgba(16,24,40,0.06); color: #98A2B3;'}
`;

export const CL09Result = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<OnboardingCase | null>(null);
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    getOnboardingCase().then(setData);
    openAccount().then(setAccount); // шаг 009: триггер открытия счёта (mock)
  }, []);

  // Ждём данные перед рендером: иначе экран сначала рисуется как STP (mode по
  // умолчанию), а Note кэширует текст первого маунта и не обновляет его при Hybrid.
  if (!data) {
    return (
      <OnboardingLayout step={6} title="Результат">
        <Key>Загрузка результата…</Key>
      </OnboardingLayout>
    );
  }

  const mode = data.mode;
  const stp = mode === 'STP';

  return (
    <OnboardingLayout
      step={6}
      title={stp ? 'Счёт открывается' : 'Заявка принята'}
      subtitle={data ? `${data.company.companyName} · сценарий ${mode}` : undefined}
      primary={<Button view="accent" size="m" text="На главную" onClick={() => navigate('/')} />}
      afterCard={
        <DemoBridge>
          <DemoLabel>Демо · вторая сторона процесса</DemoLabel>
          <BodyS>
            Заявки, не прошедшие авто-проверку, дальше разбирает <b>менеджер банка (DVU)</b> — это
            вторая роль процесса. В реальном продукте это отдельный человек и интерфейс; здесь
            переключаемся для демонстрации.
          </BodyS>
          <RmAccent>
            <Bridge>
              <Button
                view="accent"
                size="m"
                text="Открыть сторону менеджера →"
                onClick={() => navigate('/rm/queue')}
              />
            </Bridge>
          </RmAccent>
        </DemoBridge>
      }
    >
      <Note
        view={stp ? 'positive' : 'info'}
        title={stp ? 'Заявка одобрена автоматически (STP)' : 'Заявка передана в банк на ручную проверку'}
        text={
          stp
            ? 'Все проверки пройдены. Счёт открывается, реквизиты — ниже.'
            : mode === 'Hybrid'
              ? 'Часть данных и документов проверяет команда банка (DVU). Вы получите уведомление о решении.'
              : 'Потребуется офлайн-визит для завершения идентификации (Offline).'
        }
      />

      {!stp && (
        <Block>
          <Title>Статус заявки</Title>
          <Handoff>
            <HStep state="done">Отправлено</HStep>
            <HArrow>→</HArrow>
            <HStep state="active">На проверке банка · DVU</HStep>
            <HArrow>→</HArrow>
            <HStep state="todo">Решение</HStep>
          </Handoff>
        </Block>
      )}

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

      {stp && (
        <Note
          view="info"
          size="s"
          title="Что дальше"
          text="Доступ в интернет-банк и обслуживание счёта — за пределами онбординга."
        />
      )}

    </OnboardingLayout>
  );
};
