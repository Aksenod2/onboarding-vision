import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Note } from '@salutejs/sdds-serv';
import { textPrimary, textSecondary } from '@salutejs/sdds-themes/tokens';
import { pageBackground, eyebrow, radii, enter } from '../ui/designSystem';
import { RmAccent, RM_ORANGE } from '../ui/rmTheme';

// TR-01 — Транзит роли (Клиент → Менеджер). source: 2026-06-01_obo : 003.01 (handoff)
// Заставка на стыке ролей: показывает смену стороны (зелёный → оранжевый).
// Универсальный паттерн — используется на любом переходе между ролями.

const Page = styled.div`
  min-height: 100vh;
  ${pageBackground};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
`;

const Box = styled.div`
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.25rem;
`;

const Eyebrow = styled.div`
  ${eyebrow};
  color: ${textSecondary};
  ${enter(0)};
`;

const Roles = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  ${enter(0.07)};
`;

const Chip = styled.span<{ tone: 'client' | 'manager'; dim?: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: ${radii.field};
  font-weight: 700;
  font-size: 0.9rem;
  opacity: ${({ dim }) => (dim ? 0.45 : 1)};
  color: #fff;
  background: ${({ tone }) => (tone === 'client' ? '#21A038' : RM_ORANGE.base)};
`;

const Arrow = styled.span`
  color: ${textSecondary};
  font-size: 1.25rem;
`;

const Heading = styled.h1`
  margin: 0;
  color: ${textPrimary};
  font-family: var(--plasma-typo-dspl-s-font-family, inherit);
  font-size: 1.75rem;
  font-weight: 700;
  ${enter(0.14)};
`;

const Lead = styled.p`
  margin: 0;
  max-width: 32rem;
  color: ${textSecondary};
  font-size: 1.0625rem;
  line-height: 1.5;
  ${enter(0.2)};
`;

const NoteWrap = styled.div`
  width: 100%;
  ${enter(0.27)};
`;

const Cta = styled.div`
  margin-top: 0.5rem;
  ${enter(0.34)};
`;

export const TR01Transit = () => {
  const navigate = useNavigate();

  return (
    <Page>
      <Box>
        <Eyebrow>Смена роли</Eyebrow>
        <Roles>
          <Chip tone="client" dim>
            Клиент
          </Chip>
          <Arrow>→</Arrow>
          <Chip tone="manager">Менеджер банка</Chip>
        </Roles>
        <Heading>Заявка передана менеджеру</Heading>
        <Lead>
          Часть данных и документов требует ручной проверки (Hybrid-сценарий). Дальше работает другая
          сторона — <b>Менеджер банка</b>: разберёт задачу DVU, сверит документы и примет решение.
        </Lead>
        <NoteWrap>
          <Note
            view="info"
            size="s"
            title="Дальше — интерфейс менеджера"
            text="Меняется и оформление: акцентный цвет станет оранжевым, чтобы отличать сторону менеджера от клиента."
          />
        </NoteWrap>
        {/* Кнопка уже оранжевая — мы входим на сторону менеджера */}
        <RmAccent>
          <Cta>
            <Button
              view="accent"
              size="l"
              text="Перейти на сторону менеджера"
              onClick={() => navigate('/rm/queue')}
            />
          </Cta>
        </RmAccent>
      </Box>
    </Page>
  );
};
