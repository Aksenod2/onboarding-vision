import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@salutejs/sdds-serv'; // TODO свериться с MCP — view="accent"|"secondary"|"clear", size="l"|"s"
import {
  textPrimary,
  textSecondary,
  textAccent,
  dsplLBold,
  bodyL,
  bodyM,
  bodySBold,
} from '@salutejs/sdds-themes/tokens';
import { pageBackground, accentPanel, eyebrow, radii, enter, elevation } from '../../ui/designSystem';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { CommentLayer } from '../../ui/v2/CommentLayer';

// SP-01 — Hero-лендинг v2 (India–Russia trade). Источник: спека «Лендинг (CL-01) — спека.md».
// Заменяет CL-01 в потоке v2. Роут: /v2.

const dict: Record<Lang, {
  bank: string;
  eyebrow: string;
  h1: string;
  subtitle: string;
  cta: string;
  internetBanking: string;
  getInTouch: string;
  india: string;
}> = {
  ru: {
    bank: 'Банк',
    eyebrow: 'БАНК · INDIA–RUSSIA TRADE',
    h1: 'Банковские решения для торговли Индия–Россия',
    subtitle: 'Откройте счёт в Банке для ведения бизнеса с Россией',
    cta: 'Стать клиентом',
    internetBanking: 'Интернет-банк',
    getInTouch: 'Связаться',
    india: 'Индия',
  },
  en: {
    bank: 'Bank',
    eyebrow: 'BANK · INDIA–RUSSIA TRADE',
    h1: 'Banking built for India–Russia trade flows',
    subtitle: 'Open a Bank account to manage your business with Russia',
    cta: 'Become our customer',
    internetBanking: 'Internet banking',
    getInTouch: 'Get in touch',
    india: 'India',
  },
};

// ─── Layout ──────────────────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100vh;
  ${pageBackground};
  display: flex;
  flex-direction: column;
`;

// ─── Header ──────────────────────────────────────────────────────────────────

const Header = styled.header`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const Logo = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: ${textAccent};
  letter-spacing: -0.01em;
  user-select: none;
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
`;

const LogoBank = styled.span`
  font-size: 1.5rem;
  font-weight: 400;
  line-height: 1.2;
  color: ${textSecondary};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ServiceLabel = styled.span`
  ${bodyM};
  color: ${textSecondary};
  padding: 0.25rem 0.5rem;
`;

const LangSwitcher = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  padding: 2px;
`;

interface LangBtnProps {
  $active: boolean;
}

const LangBtn = styled.button<LangBtnProps>`
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

// ─── Main / Hero ──────────────────────────────────────────────────────────────

const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 3.5rem 2rem 4rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 2rem 1.5rem 3rem;
  }
`;

const HeroLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Eyebrow = styled.div`
  ${eyebrow};
  color: ${textAccent};
  ${enter(0)};
`;

const Heading = styled.h1`
  margin: 0;
  ${dsplLBold};
  font-size: clamp(2rem, 4vw, 2.75rem);
  line-height: 1.1;
  color: ${textPrimary};
  ${enter(0.07)};
`;

const Subtitle = styled.p`
  margin: 0;
  ${bodyL};
  color: ${textSecondary};
  max-width: 32rem;
  ${enter(0.14)};
`;

const CtaRow = styled.div`
  margin-top: 0.5rem;
  ${enter(0.21)};
`;

// ─── Illustration placeholder ─────────────────────────────────────────────────

const IllustrationPlaceholder = styled.div`
  /* плейсхолдер под иллюстрацию India–Russia trade */
  ${accentPanel};
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  min-height: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  position: relative;
  overflow: hidden;
  ${enter(0.1)};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 70% 60% at 60% 40%, rgba(33,160,56,0.09), transparent 70%);
    pointer-events: none;
  }
`;

const IllustrationSymbol = styled.span`
  font-size: 5rem;
  line-height: 1;
  opacity: 0.55;
  z-index: 1;
`;

const IllustrationCaption = styled.span`
  ${bodySBold};
  color: ${textSecondary};
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  z-index: 1;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const SP01Landing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang, setLang } = useLanguage();
  const t = dict[lang];

  // Sole Proprietor стартует с лендинга → /v2/login (email/OTP).
  // Компания (flow=company) идёт по своей точке входа: согласия → Aadhaar → пин-код (целевка Марго).
  const isCompany = searchParams.get('flow') === 'company';
  const loginPath = isCompany ? '/company' : '/v2/login';

  return (
    <Page>
      <Header>
        <Logo><LogoBank>{t.bank}</LogoBank></Logo>
        <HeaderRight>
          <ServiceLabel>{t.india}</ServiceLabel>
          <ServiceLabel>{t.internetBanking}</ServiceLabel>
          {/* TODO свериться с MCP — view="secondary" или "clear" для служебных кнопок */}
          <Button view="secondary" size="s" text={t.getInTouch} />
          <LangSwitcher>
            <LangBtn $active={lang === 'ru'} onClick={() => setLang('ru')}>RU</LangBtn>
            <LangBtn $active={lang === 'en'} onClick={() => setLang('en')}>EN</LangBtn>
          </LangSwitcher>
        </HeaderRight>
      </Header>

      <Main>
        <HeroLeft>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <Heading>{t.h1}</Heading>
          <Subtitle>{t.subtitle}</Subtitle>
          <CtaRow>
            {/* TODO свериться с MCP — Button view="accent" size="l" text prop */}
            <Button view="accent" size="l" text={t.cta} onClick={() => navigate(loginPath)} />
          </CtaRow>
        </HeroLeft>

        <IllustrationPlaceholder>
          <IllustrationSymbol>₹</IllustrationSymbol>
          <IllustrationCaption>Иллюстрация India–Russia trade</IllustrationCaption>
        </IllustrationPlaceholder>
      </Main>
      <CommentLayer />
    </Page>
  );
};
