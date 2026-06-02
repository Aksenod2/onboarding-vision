import type { ReactNode } from 'react';
import styled from 'styled-components';
import {
  textPrimary,
  textSecondary,
  textAccent,
  surfaceSolidCard,
  surfaceTransparentAccent,
  dsplSBold,
  bodyL,
} from '@salutejs/sdds-themes/tokens';
import { elevation, radii, eyebrow, enter } from './designSystem';
import { RmAccent, RM_ORANGE } from './rmTheme';

// Каркас экранов роли Менеджер (RM). Тот же SDDS, но акцент оранжевый
// (RmAccent перекрывает accent-токены) — визуально отличаем сторону менеджера.
// Десктоп-бэкофис: шире клиентского, своя оранжевая атмосфера фона.

const Page = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(1100px 520px at 50% -12%, rgba(${RM_ORANGE.glow}, 0.12), transparent 62%),
    linear-gradient(180deg, #faf7f4 0%, #ffffff 40%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 1.5rem 5rem;
`;

const Shell = styled.div`
  width: 100%;
  max-width: 960px;
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  ${enter(0)};
`;

const Brand = styled.div`
  ${eyebrow};
  color: ${textAccent};
`;

const RoleChip = styled.span`
  padding: 0.375rem 0.75rem;
  border-radius: 999px;
  background: ${surfaceTransparentAccent};
  color: ${textAccent};
  font-size: 0.8rem;
  font-weight: 700;
`;

const BackLink = styled.button`
  align-self: flex-start;
  background: none;
  border: none;
  padding: 0;
  margin-bottom: 1rem;
  cursor: pointer;
  color: ${textAccent};
  font-weight: 600;
  font-size: 0.95rem;
  ${enter(0.04)};
`;

const Card = styled.main`
  background: ${surfaceSolidCard};
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  padding: 2.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  ${enter(0.1)};
`;

const Head = styled.header`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Title = styled.h1`
  margin: 0;
  ${dsplSBold};
  font-size: 1.75rem;
  line-height: 1.15;
  color: ${textPrimary};
`;

const Subtitle = styled.p`
  margin: 0;
  ${bodyL};
  color: ${textSecondary};
`;

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Если задан — показываем ссылку «← К очереди». */
  onBack?: () => void;
}

export const RmLayout = ({ title, subtitle, children, onBack }: Props) => {
  return (
    <RmAccent>
      <Page>
        <Shell>
          <TopBar>
            <Brand>БАНК · Рабочее место менеджера</Brand>
            <RoleChip>DVU · Проверка OBO</RoleChip>
          </TopBar>
          {onBack && <BackLink onClick={onBack}>← К очереди</BackLink>}
          <Card>
            <Head>
              <Title>{title}</Title>
              {subtitle && <Subtitle>{subtitle}</Subtitle>}
            </Head>
            {children}
          </Card>
        </Shell>
      </Page>
    </RmAccent>
  );
};

// Маленький бейдж статуса/приоритета — общий для RM-экранов.
export const Pill = styled.span<{ tone: 'neutral' | 'warning' | 'positive' | 'accent' }>`
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  ${({ tone }) =>
    tone === 'positive'
      ? 'background: rgba(36,150,60,0.14); color: #1E7B33;'
      : tone === 'warning'
        ? 'background: rgba(214,110,20,0.16); color: #B4560E;'
        : tone === 'accent'
          ? 'background: rgba(245,129,31,0.16); color: #B4560E;'
          : 'background: rgba(16,24,40,0.07); color: #475467;'}
`;
