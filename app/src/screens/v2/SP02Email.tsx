import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@salutejs/sdds-serv'; // TODO свериться с MCP — view="accent", size="l"
import {
  textPrimary,
  textSecondary,
  textAccent,
  bodyL,
  bodyM,
  bodySBold,
} from '@salutejs/sdds-themes/tokens';
import { pageBackground, accentPanel, eyebrow, radii, enter, elevation } from '../../ui/designSystem';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { CommentLayer } from '../../ui/v2/CommentLayer';
import { getSession } from '../../mock/v2/api';

// SP-02 — Превью письма-подтверждения email. Шаг демо-потока v2 (Sole Proprietor).
// Роут: /v2/email. Идёт ПОСЛЕ ввода email на SP-03 — адрес получателя берём из сессии.
// Кнопка → /v2/login?step=otp (возврат на SP-03 в стадию ввода кода).

const dict: Record<Lang, {
  eyebrow: string;
  from: string;
  fromValue: string;
  to: string;
  subject: string;
  subjectValue: string;
  greeting: string;
  body: string;
  cta: string;
  disclaimer: string;
}> = {
  ru: {
    eyebrow: 'ВХОДЯЩЕЕ ПИСЬМО',
    from: 'От:',
    fromValue: 'Банк <noreply@bank.example>',
    to: 'Кому:',
    subject: 'Тема:',
    subjectValue: 'Подтвердите email для открытия счёта',
    greeting: 'Здравствуйте!',
    body: 'Вы оставили заявку на открытие расчётного счёта в Банке. Для продолжения онбординга подтвердите ваш адрес электронной почты, нажав кнопку ниже.',
    cta: 'Подтвердить email и продолжить',
    disclaimer: 'Ссылка действительна 24 часа. Если вы не оставляли заявку — просто проигнорируйте это письмо.',
  },
  en: {
    eyebrow: 'INCOMING EMAIL',
    from: 'From:',
    fromValue: 'Bank <noreply@bank.example>',
    to: 'To:',
    subject: 'Subject:',
    subjectValue: 'Confirm your email to open an account',
    greeting: 'Hello!',
    body: 'You applied to open a current account with the Bank. To continue your onboarding, please confirm your email address by clicking the button below.',
    cta: 'Confirm email and continue',
    disclaimer: 'This link is valid for 24 hours. If you did not submit this application, please disregard this email.',
  },
};

// ─── Layout ──────────────────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100vh;
  ${pageBackground};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
`;

// ─── Email card ───────────────────────────────────────────────────────────────

const EmailCard = styled.div`
  width: 100%;
  max-width: 560px;
  background: #ffffff;
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  overflow: hidden;
  ${enter(0.05)};
`;

const EmailBar = styled.div`
  ${accentPanel};
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const EyebrowLabel = styled.div`
  ${eyebrow};
  color: ${textAccent};
  margin-bottom: 0.25rem;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  ${bodyM};
  color: ${textPrimary};
`;

const MetaLabel = styled.span`
  ${bodySBold};
  color: ${textSecondary};
  white-space: nowrap;
`;

const MetaValue = styled.span`
  color: ${textPrimary};
  word-break: break-all;
`;

const EmailBody = styled.div`
  padding: 2rem 2rem 2.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Greeting = styled.p`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
  color: ${textPrimary};
  ${enter(0.12)};
`;

const BodyText = styled.p`
  margin: 0;
  ${bodyL};
  color: ${textSecondary};
  ${enter(0.18)};
`;

const CtaWrapper = styled.div`
  margin-top: 0.25rem;
  ${enter(0.24)};
`;

const Disclaimer = styled.p`
  margin: 0;
  ${bodyM};
  color: ${textSecondary};
  font-size: 0.78rem;
  opacity: 0.72;
  ${enter(0.30)};
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const SP02Email = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();
  const t = dict[lang];

  // Прокидываем метку потока Компании дальше (на OTP-стадию SP-03).
  const isCompany = searchParams.get('flow') === 'company';
  const otpPath = isCompany ? '/v2/login?step=otp&flow=company' : '/v2/login?step=otp';

  // Адрес получателя — реально введённый на SP-03 (из mock-сессии).
  const [recipient, setRecipient] = useState('');
  useEffect(() => {
    getSession().then((s) => {
      if (s?.email) setRecipient(s.email);
    });
  }, []);

  return (
    <Page>
      <EmailCard>
        <EmailBar>
          <EyebrowLabel>{t.eyebrow}</EyebrowLabel>
          <MetaRow>
            <MetaLabel>{t.from}</MetaLabel>
            <MetaValue>{t.fromValue}</MetaValue>
          </MetaRow>
          {recipient && (
            <MetaRow>
              <MetaLabel>{t.to}</MetaLabel>
              <MetaValue>{recipient}</MetaValue>
            </MetaRow>
          )}
          <MetaRow>
            <MetaLabel>{t.subject}</MetaLabel>
            <MetaValue>{t.subjectValue}</MetaValue>
          </MetaRow>
        </EmailBar>

        <EmailBody>
          <Greeting>{t.greeting}</Greeting>
          <BodyText>{t.body}</BodyText>
          <CtaWrapper>
            {/* TODO свериться с MCP — Button view="accent" size="l" text prop */}
            <Button
              view="accent"
              size="l"
              text={t.cta}
              onClick={() => navigate(otpPath)}
            />
          </CtaWrapper>
          <Disclaimer>{t.disclaimer}</Disclaimer>
        </EmailBody>
      </EmailCard>
      <CommentLayer />
    </Page>
  );
};
