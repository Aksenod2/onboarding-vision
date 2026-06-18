import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  textAccent,
  textSecondary,
  dsplLBold,
  bodySBold,
} from '@salutejs/sdds-themes/tokens';
import { pageBackground } from '../designSystem';
import { useLanguage } from './LanguageContext';
import { STEPS } from './steps';
import { StepProgress } from './StepProgress';
import { CommentLayer } from './CommentLayer';

// Общий каркас экранов v2 (кроме лендинга SP-01 — у него своя расширенная шапка).
// Шапка: логотип «SBER Банк» + переключатель RU/EN. Контент — по центру, ограничен шириной.

const Page = styled.div`
  min-height: 100vh;
  ${pageBackground};
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const Logo = styled.span`
  ${dsplLBold};
  font-size: 1.5rem;
  color: ${textAccent};
  letter-spacing: -0.01em;
  user-select: none;
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  cursor: pointer;
`;

const LogoBank = styled.span`
  ${dsplLBold};
  font-size: 1.5rem;
  color: ${textSecondary};
  font-weight: 400;
`;

const LangSwitcher = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  padding: 2px;
`;

const LangBtn = styled.button<{ $active: boolean }>`
  ${bodySBold};
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  padding: 0.25rem 0.55rem;
  transition: background 0.15s, color 0.15s;
  background: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
  color: ${({ $active }) => ($active ? textAccent : textSecondary)};
  box-shadow: ${({ $active }) => ($active ? '0 1px 3px rgba(0,0,0,0.10)' : 'none')};
`;

const Content = styled.main<{ $maxWidth: string }>`
  flex: 1;
  width: 100%;
  max-width: ${({ $maxWidth }) => $maxWidth};
  margin: 0 auto;
  padding: 1.5rem 2rem 4rem;

  @media (max-width: 768px) {
    padding: 1rem 1.25rem 3rem;
  }
`;

// Единая ширина контентной области для ВСЕХ шагов (решение Дениса 2026-06-09):
// одинаковая ширина везде — никаких «прыжков» между шагами. 880px (выбор Дениса по анкете).
const CONTENT_MAX_WIDTH = '880px';

interface ScreenV2Props {
  children: ReactNode;
  // Свой блок прогресса (сценарий Компания передаёт сюда company-StepProgress).
  // Если не передан — авто по реестру Sole Proprietor (STEPS) по pathname.
  progress?: ReactNode;
}

export const ScreenV2 = ({ children, progress }: ScreenV2Props) => {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentStep = STEPS.find((s) => s.route === pathname);
  return (
    <Page>
      <Header>
        {/* Логотип → возврат на лендинг (первый экран) */}
        <Logo onClick={() => navigate('/v2')}>
          <LogoBank>{lang === 'ru' ? 'Банк' : 'Bank'}</LogoBank>
        </Logo>
        <LangSwitcher>
          <LangBtn $active={lang === 'ru'} onClick={() => setLang('ru')}>
            RU
          </LangBtn>
          <LangBtn $active={lang === 'en'} onClick={() => setLang('en')}>
            EN
          </LangBtn>
        </LangSwitcher>
      </Header>
      <Content $maxWidth={CONTENT_MAX_WIDTH}>
        {progress ?? (currentStep && <StepProgress currentStepId={currentStep.id} />)}
        {children}
      </Content>
      {/* Режим комментариев для аналитиков — кнопка снизу справа на всех экранах */}
      <CommentLayer />
    </Page>
  );
};
