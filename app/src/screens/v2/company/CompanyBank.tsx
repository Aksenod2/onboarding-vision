import { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { textPrimary, textSecondary, textAccent, bodyM, bodySBold, dsplLBold } from '@salutejs/sdds-themes/tokens';
import { radii, elevation, enter } from '../../../ui/designSystem';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { getBankAccount, unfreezeAccount } from '../../../mock/v2/companyApi';
import type { BankAccount } from '../../../mock/v2/companyApi';

// CO-BANK (#43) — растворение онбординга: пользователь «вошёл» в интернет-банк теми же данными.
// Лёгкий шелл BankShell без онбординг-хрома (нет StepProgress, нет навигации заявки).
// При входе: бейдж «Заморожен» → через ~1.5с инлайн меняется на «Активен ✓» (фриз снят как опыт, L6).
// Роут: /company/bank (внутри /company/*, CompanyProvider есть, но без онбординг-каркаса).

const dict: Record<Lang, {
  welcome: (name: string) => string;
  accountTitle: string; accountNumber: string; ifsc: string;
  frozen: string; active: string;
  tilePayments: string; tileStatement: string; tileCards: string; demoBadge: string;
  sameCreds: string;
}> = {
  ru: {
    welcome: (name) => `С возвращением, ${name}`,
    accountTitle: 'Расчётный счёт',
    accountNumber: 'Номер счёта',
    ifsc: 'IFSC',
    frozen: 'Заморожен',
    active: 'Активен',
    tilePayments: 'Платежи',
    tileStatement: 'Выписка',
    tileCards: 'Карты',
    demoBadge: 'Демо',
    sameCreds: 'Вы вошли теми же данными, что и при регистрации — онбординг завершён.',
  },
  en: {
    welcome: (name) => `Welcome back, ${name}`,
    accountTitle: 'Current account',
    accountNumber: 'Account number',
    ifsc: 'IFSC',
    frozen: 'Frozen',
    active: 'Active',
    tilePayments: 'Payments',
    tileStatement: 'Statement',
    tileCards: 'Cards',
    demoBadge: 'Demo',
    sameCreds: 'You signed in with the same details you used to register — onboarding is complete.',
  },
};

// --- BankShell: минимальный шелл интернет-банка (сигнал «онбординг исчез») ---
const Page = styled.div`
  min-height:100vh;
  background:linear-gradient(180deg,#f4f6f9 0%,#ffffff 40%);
  display:flex; flex-direction:column;
`;
// Хедер без переключателя языка-онбординга и без навигации заявки — только лого-сигнал «другая среда».
const BankHeader = styled.header`
  width:100%; background:#fff; border-bottom:1px solid rgba(0,0,0,0.07);
  box-shadow:0 1px 2px rgba(16,24,40,0.04);
`;
const HeaderInner = styled.div`
  max-width:1000px; margin:0 auto; padding:1rem 2rem;
  display:flex; align-items:center; justify-content:space-between; gap:1rem;
`;
const Logo = styled.span`
  ${dsplLBold}; font-size:1.4rem; color:${textAccent}; letter-spacing:-0.01em;
  display:inline-flex; align-items:baseline; gap:0.4rem; user-select:none;
`;
const LogoSub = styled.span`${dsplLBold}; font-size:1.4rem; color:${textSecondary}; font-weight:400;`;
// Подпись «Интернет-банк» в хедере — отличает от онбординг-портала.
const HeaderTag = styled.span`${bodySBold}; font-size:0.78rem; color:${textSecondary}; letter-spacing:0.04em;`;

const Main = styled.main`width:100%; max-width:1000px; margin:0 auto; padding:2.5rem 2rem 4rem; flex:1;`;
const Welcome = styled.h1`margin:0 0 0.35rem; font-size:1.85rem; font-weight:700; color:${textPrimary}; ${enter(0)};`;
const Company = styled.p`margin:0 0 2rem; ${bodyM}; color:${textSecondary}; ${enter(0.05)};`;

const AccountCard = styled.div`
  border-radius:${radii.card}; padding:1.5rem 1.75rem; margin-bottom:2rem;
  background:#fff; box-shadow:${elevation.card}; border:1px solid rgba(0,0,0,0.06);
  ${enter(0.08)};
`;
const AccountHead = styled.div`display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap; margin-bottom:1rem;`;
const AccountTitle = styled.div`${bodySBold}; font-size:1.1rem; color:${textPrimary};`;
const StatusBadge = styled.span<{ $active: boolean }>`
  ${bodySBold}; font-size:0.78rem; letter-spacing:0.03em; padding:0.3rem 0.75rem; border-radius:20px;
  display:inline-flex; align-items:center; gap:0.35rem; transition:background .3s, color .3s;
  ${({ $active }) => $active
    ? css`background:rgba(33,160,56,0.14); color:#1a7a28;`
    : css`background:rgba(100,116,139,0.14); color:#475569;`}
`;
const Reqs = styled.div`display:grid; grid-template-columns:auto 1fr; gap:0.4rem 1.5rem;`;
const ReqLabel = styled.span`font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; font-weight:700; color:${textSecondary};`;
const ReqValue = styled.span`${bodySBold}; font-size:0.95rem; color:${textPrimary};`;

const Tiles = styled.div`display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1rem; margin-bottom:2rem;`;
const Tile = styled.div`
  position:relative; border-radius:${radii.panel}; padding:1.25rem 1.25rem 1.4rem;
  background:#fff; border:1px solid rgba(0,0,0,0.07); box-shadow:${elevation.soft};
  opacity:0.6; cursor:not-allowed; ${enter(0.12)};
`;
const TileIcon = styled.div`font-size:1.4rem; margin-bottom:0.5rem;`;
const TileName = styled.div`${bodySBold}; font-size:0.95rem; color:${textPrimary};`;
const DemoTag = styled.span`
  position:absolute; top:0.75rem; right:0.75rem;
  font-size:0.66rem; font-weight:700; letter-spacing:0.05em; text-transform:uppercase;
  color:${textSecondary}; background:rgba(0,0,0,0.05); border-radius:6px; padding:0.15rem 0.4rem;
`;
const QuietLine = styled.p`margin:0; ${bodyM}; font-size:0.85rem; color:${textSecondary}; ${enter(0.16)};`;

export const CompanyBank = () => {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [frozen, setFrozen] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    getBankAccount().then((acc) => {
      if (!alive) return;
      setAccount(acc);
      setFrozen(acc.frozen);
      if (acc.frozen) {
        // Фриз снимается как опыт: бейдж «Заморожен» → через ~1.5с «Активен ✓».
        timer.current = setTimeout(() => {
          unfreezeAccount().then(() => { if (alive) setFrozen(false); });
        }, 1500);
      }
    });
    return () => { alive = false; if (timer.current) clearTimeout(timer.current); };
  }, []);

  const tiles = [
    { icon: '↗', name: t.tilePayments },
    { icon: '☰', name: t.tileStatement },
    { icon: '▭', name: t.tileCards },
  ];

  return (
    <Page>
      <BankHeader>
        <HeaderInner>
          <Logo><LogoSub>{lang === 'ru' ? 'Банк' : 'Bank'}</LogoSub></Logo>
          <HeaderTag>{lang === 'ru' ? 'Интернет-банк' : 'Internet banking'}</HeaderTag>
        </HeaderInner>
      </BankHeader>
      <Main>
        {account && (
          <>
            <Welcome>{t.welcome(account.holderName)}</Welcome>
            <Company>{account.company}</Company>

            <AccountCard>
              <AccountHead>
                <AccountTitle>{t.accountTitle}</AccountTitle>
                <StatusBadge $active={!frozen}>
                  {frozen ? t.frozen : `${t.active} ✓`}
                </StatusBadge>
              </AccountHead>
              <Reqs>
                <ReqLabel>{t.accountNumber}</ReqLabel><ReqValue>{account.number}</ReqValue>
                <ReqLabel>{t.ifsc}</ReqLabel><ReqValue>{account.ifsc}</ReqValue>
              </Reqs>
            </AccountCard>

            <Tiles>
              {tiles.map((tile) => (
                <Tile key={tile.name}>
                  <DemoTag>{t.demoBadge}</DemoTag>
                  <TileIcon>{tile.icon}</TileIcon>
                  <TileName>{tile.name}</TileName>
                </Tile>
              ))}
            </Tiles>

            <QuietLine>{t.sameCreds}</QuietLine>
          </>
        )}
      </Main>
    </Page>
  );
};
