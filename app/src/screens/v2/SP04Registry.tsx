import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Checkbox } from '@salutejs/sdds-serv'; // TODO свериться с MCP — Checkbox props (label / description / checked / onChange)
import {
  textPrimary,
  textSecondary,
  dsplLBold,
  bodyL,
  bodyM,
  bodySBold,
} from '@salutejs/sdds-themes/tokens';
import {
  accentPanel,
  radii,
  elevation,
  enter,
} from '../../ui/designSystem';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { giveConsent, setStepStatus } from '../../mock/v2/api';

// SP-04 · Consent: доступ к индийским реестрам (BR-01).
// Роут: /v2/registry
// Согласие берётся ДО ввода PAN.
// API: giveConsent('Registry Access', timestamp) → navigate('/v2/pan')

// ─── i18n ────────────────────────────────────────────────────────────────────

const dict: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    reasonsTitle: string;
    reasons: { label: string; desc: string }[];
    consentLabel: string;
    consentDescription: string;
    cta: string;
    loading: string;
  }
> = {
  ru: {
    title: 'Доступ к данным реестров',
    subtitle:
      'Для автоматической проверки и заполнения данных вашего бизнеса нам нужно ваше согласие на запрос сведений из государственных реестров Индии.',
    reasonsTitle: 'Какие данные и зачем:',
    reasons: [
      {
        label: 'PAN (Income Tax Dept.)',
        desc: 'Подтверждение личности владельца и статуса налогоплательщика.',
      },
      {
        label: 'Probe42',
        desc: 'Финансовые и регистрационные сведения о бизнесе: GST, Udyam, адрес, отрасль.',
      },
      {
        label: 'CKYC (CERSAI)',
        desc: 'Центральный KYC-реестр: предотвращение дублирования данных и ускорение верификации.',
      },
    ],
    consentLabel: 'Разрешаю запрашивать данные из реестров',
    consentDescription:
      'Я даю согласие на получение сведений из PAN-базы Налогового департамента, Probe42 и реестра CKYC в целях верификации при открытии счёта.',
    cta: 'Разрешить и продолжить',
    loading: 'Сохранение…',
  },
  en: {
    title: 'Registry data access',
    subtitle:
      'To automatically verify and pre-fill your business details, we need your consent to query India’s official registries on your behalf.',
    reasonsTitle: 'What data and why:',
    reasons: [
      {
        label: 'PAN (Income Tax Dept.)',
        desc: 'Confirms owner identity and taxpayer status.',
      },
      {
        label: 'Probe42',
        desc: 'Financial and registration data for your business: GST, Udyam, address, industry.',
      },
      {
        label: 'CKYC (CERSAI)',
        desc: 'Central KYC registry: prevents duplicate records and speeds up verification.',
      },
    ],
    consentLabel: 'Allow registry data queries',
    consentDescription:
      'I consent to retrieving data from the Income Tax PAN database, Probe42 and the CKYC registry for the purpose of account-opening verification.',
    cta: 'Allow and continue',
    loading: 'Saving…',
  },
};

// ─── Styled components ───────────────────────────────────────────────────────

const Card = styled.div`
  background: #ffffff;
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  overflow: hidden;
  ${enter(0.05)};
`;

const CardHeader = styled.div`
  ${accentPanel};
  padding: 1.25rem 1.75rem 1rem;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem;
  ${dsplLBold};
  font-size: 1.5rem;
  color: ${textPrimary};
`;

const Subtitle = styled.p`
  margin: 0;
  ${bodyL};
  color: ${textSecondary};
  line-height: 1.55;
`;

const CardBody = styled.div`
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ReasonsBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  ${enter(0.12)};
`;

const ReasonsTitle = styled.p`
  margin: 0 0 0.1rem;
  ${bodySBold};
  color: ${textPrimary};
  font-size: 0.875rem;
`;

const ReasonsList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const ReasonItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.75rem 1rem;
  background: rgba(33, 160, 56, 0.04);
  border: 1px solid rgba(33, 160, 56, 0.1);
  border-radius: ${radii.panel};
`;

const ReasonLabel = styled.span`
  ${bodySBold};
  font-size: 0.85rem;
  color: ${textPrimary};
`;

const ReasonDesc = styled.span`
  ${bodyM};
  font-size: 0.82rem;
  color: ${textSecondary};
  line-height: 1.45;
`;

const ConsentRow = styled.div`
  ${enter(0.20)};
  padding: 1rem 1.1rem;
  border: 1.5px solid rgba(33, 160, 56, 0.25);
  border-radius: ${radii.panel};
  background: rgba(33, 160, 56, 0.03);
`;

const CtaWrapper = styled.div`
  ${enter(0.28)};
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const SP04Registry = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    try {
      const timestamp = new Date().toISOString();
      await giveConsent('Registry Access', timestamp);
      await setStepStatus('registry', 'done');
    } catch (_) { /* игнорируем */ }
    setLoading(false);
    navigate('/v2/pan');
  };

  return (
    <ScreenV2 maxWidth="560px">
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>

        <CardBody>
          <ReasonsBlock>
            <ReasonsTitle>{t.reasonsTitle}</ReasonsTitle>
            <ReasonsList>
              {t.reasons.map((r) => (
                <ReasonItem key={r.label}>
                  <ReasonLabel>{r.label}</ReasonLabel>
                  <ReasonDesc>{r.desc}</ReasonDesc>
                </ReasonItem>
              ))}
            </ReasonsList>
          </ReasonsBlock>

          {/* TODO свериться с MCP — Checkbox: label / description / checked / onChange / view */}
          <ConsentRow>
            <Checkbox
              label={t.consentLabel}
              description={t.consentDescription}
              checked={checked}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setChecked(e.target.checked)
              }
            />
          </ConsentRow>

          <CtaWrapper>
            {/* TODO свериться с MCP — Button view="accent" size="l" disabled / isLoading props */}
            <Button
              view="accent"
              size="l"
              text={loading ? t.loading : t.cta}
              onClick={handleAllow}
            />
          </CtaWrapper>
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
