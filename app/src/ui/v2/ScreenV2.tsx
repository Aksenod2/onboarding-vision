import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  textAccent,
  textPrimary,
  textSecondary,
  dsplLBold,
  bodySBold,
  bodyM,
} from '@salutejs/sdds-themes/tokens';
import { pageBackground, radii, elevation } from '../designSystem';
import { useLanguage } from './LanguageContext';
import { STEPS } from './steps';
import { StepProgress } from './StepProgress';
import { CompanyNavPanel } from './CompanyNavPanel';
import { CommentLayer } from './CommentLayer';

// Общий каркас экранов v2 (кроме лендинга SP-01 — у него своя расширенная шапка).
// Шапка: логотип «SBER Банк» + переключатель RU/EN. Контент — по центру, ограничен шириной.
//
// ДВА режима компоновки:
//  • одноколоночный (по умолчанию) — Sole Proprietor, вход Компании, сессия подписанта, RM.
//  • двухколоночный (`navHub`) — заполнитель Компании (фаза A заявки + дашборд):
//    слева постоянная навигация-хаб заявки, справа контент. Замещает верхний StepProgress.
//    На мобайле (<768px) панель уезжает в drawer + узкая статус-полоса-якорь.

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

// --- Двухколоночный режим заявки Компании (navHub) ---
const NAV_WIDTH = '288px';

// Внешняя двухколоночная обёртка: панель + контент. Контент сохраняет 880px max ВНУТРИ колонки.
const HubGrid = styled.div`
  flex: 1;
  width: 100%;
  max-width: ${`calc(${NAV_WIDTH} + 2.5rem + ${CONTENT_MAX_WIDTH})`};
  margin: 0 auto;
  padding: 1.5rem 2rem 4rem;
  display: grid;
  grid-template-columns: ${NAV_WIDTH} minmax(0, 1fr);
  gap: 2.5rem;
  align-items: start;

  @media (max-width: 768px) {
    display: block;
    padding: 0 1.25rem 3rem;
    max-width: ${CONTENT_MAX_WIDTH};
  }
`;

// Левая колонка — sticky-панель (стоит, контент справа скроллится).
const HubAside = styled.aside`
  position: sticky;
  top: 1.5rem;
  align-self: start;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
  padding: 1.25rem 1.1rem;
  border-radius: ${radii.panel};
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: ${elevation.soft};

  @media (max-width: 768px) {
    display: none;
  }
`;

const HubContent = styled.div`
  min-width: 0;
`;

// --- Мобильная статус-полоса-якорь (всегда видима в navHub) ---
const MobileBar = styled.button`
  display: none;
  @media (max-width: 768px) {
    display: flex;
  }
  width: 100%;
  align-items: center;
  gap: 0.6rem;
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(6px);
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  text-align: left;
`;
const Burger = styled.span`
  flex-shrink: 0; font-size: 1.05rem; line-height: 1; color: ${textPrimary};
`;
const MobileBarLabel = styled.span`
  ${bodySBold}; font-size: 0.85rem; color: ${textPrimary}; flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;
const MobileBarHint = styled.span`${bodyM}; font-size: 0.72rem; color: ${textSecondary};`;

// --- Мобильный drawer (overlay на токенах — единые overlay-правила гайда) ---
const Overlay = styled.div<{ $open: boolean }>`
  display: none;
  @media (max-width: 768px) {
    display: block;
  }
  position: fixed;
  inset: 0;
  z-index: 10030;
  background: rgba(16, 24, 40, 0.45);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition: opacity 0.2s ease;
`;
const DrawerPanel = styled.div<{ $open: boolean }>`
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: min(84vw, 320px);
  background: #fff;
  box-shadow: ${elevation.raised};
  padding: 1.25rem 1.1rem;
  overflow-y: auto;
  transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
`;

interface ScreenV2Props {
  children: ReactNode;
  // Свой блок прогресса (сценарий Компания фаза B-сессия передаёт company-StepProgress).
  // Если не передан — авто по реестру Sole Proprietor (STEPS) по pathname.
  progress?: ReactNode;
  // navHub — включает двухколоночный режим с левой навигацией-хабом заявки Компании
  // (заполнитель: фаза A + дашборд). Замещает верхний StepProgress. На мобайле — drawer.
  navHub?: boolean;
}

export const ScreenV2 = ({ children, progress, navHub }: ScreenV2Props) => {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentStep = STEPS.find((s) => s.route === pathname);

  // Закрывать drawer при смене роута.
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const headerBar = (
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
  );

  // --- Двухколоночный режим заявки Компании ---
  if (navHub) {
    return (
      <Page>
        {headerBar}
        {/* Мобильный якорь «Обзор заявки» — всегда виден, вызывает drawer */}
        <MobileBar onClick={() => setDrawerOpen(true)} aria-label={lang === 'ru' ? 'Открыть обзор заявки' : 'Open application overview'}>
          <Burger aria-hidden>☰</Burger>
          <MobileBarLabel>{lang === 'ru' ? 'Обзор заявки' : 'Application overview'}</MobileBarLabel>
          <MobileBarHint>{lang === 'ru' ? 'Разделы' : 'Sections'}</MobileBarHint>
        </MobileBar>

        <HubGrid>
          <HubAside>
            <CompanyNavPanel />
          </HubAside>
          <HubContent>{children}</HubContent>
        </HubGrid>

        {/* Мобильный drawer-overlay с тем же списком разделов */}
        <Overlay $open={drawerOpen} onClick={() => setDrawerOpen(false)}>
          <DrawerPanel $open={drawerOpen} onClick={(e) => e.stopPropagation()}>
            <CompanyNavPanel onNavigate={() => setDrawerOpen(false)} />
          </DrawerPanel>
        </Overlay>

        <CommentLayer />
      </Page>
    );
  }

  // --- Одноколоночный режим (по умолчанию) ---
  return (
    <Page>
      {headerBar}
      <Content $maxWidth={CONTENT_MAX_WIDTH}>
        {progress ?? (currentStep && <StepProgress currentStepId={currentStep.id} />)}
        {children}
      </Content>
      {/* Режим комментариев для аналитиков — кнопка снизу справа на всех экранах */}
      <CommentLayer />
    </Page>
  );
};
