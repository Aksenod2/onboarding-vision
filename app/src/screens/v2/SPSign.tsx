import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, CodeField, Note } from '@salutejs/sdds-serv'; // TODO свериться с MCP — CodeField, Note props
import {
  textPrimary,
  textSecondary,
  textAccent,
} from '@salutejs/sdds-themes/tokens';
import { accentPanel, radii, elevation, enter } from '../../ui/designSystem';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { passVcip, setStepStatus } from '../../mock/v2/api';

// SP-SIGN — Финальный шаг: подписание деклараций кодом OTP (BRD Table A шаг 09, Declarations Dashboard).
// Идёт ПОСЛЕ видеоидентификации. Authorize & Finish + OTP → счёт открывается.
// Роут: /v2/sign

// ─── Словарь ────────────────────────────────────────────────────────────────

const dict: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    docDeclaration: string;
    docDeclarationDesc: string;
    docSoleProp: string;
    docSolePropDesc: string;
    docPdfStub: string;
    btnAuthorize: string;
    otpLabel: string;
    otpHint: string;
    otpDemoHint: string;
    otpErrorTitle: string;
    otpErrorText: string;
    successTitle: string;
    successBody: string;
    btnDashboard: string;
  }
> = {
  ru: {
    eyebrow: 'ПОДПИСАНИЕ',
    title: 'Подписание документов',
    subtitle:
      'Последний шаг. Ознакомьтесь с документами и подпишите их кодом из SMS — после этого мы откроем счёт.',
    docDeclaration: 'Декларация достоверности',
    docDeclarationDesc:
      'Подтверждаю, что все предоставленные мной сведения являются полными, достоверными и актуальными.',
    docSoleProp: 'Заявление индивидуального предпринимателя',
    docSolePropDesc:
      'Подтверждаю статус индивидуального предпринимателя и принимаю условия обслуживания Сбербанк Индия.',
    docPdfStub: 'Предпросмотр PDF появится здесь',
    btnAuthorize: 'Подписать по OTP',
    otpLabel: 'Введите код',
    otpHint: 'Мы отправили одноразовый код на ваш телефон. Введите его, чтобы подписать документы.',
    otpDemoHint: 'Демо-код: 0000',
    otpErrorTitle: 'Неверный код',
    otpErrorText: 'Проверьте код из SMS и попробуйте снова. Демо-код: 0000.',
    successTitle: 'Готово!',
    successBody:
      'Документы подписаны, видеоидентификация пройдена. Мы приступаем к открытию счёта.',
    btnDashboard: 'К дашборду заявки',
  },
  en: {
    eyebrow: 'SIGNING',
    title: 'Sign documents',
    subtitle:
      'The final step. Review the documents and sign them with the code from SMS — after that we will open your account.',
    docDeclaration: 'Declaration of Accuracy',
    docDeclarationDesc:
      'I confirm that all information I have provided is complete, accurate and up to date.',
    docSoleProp: 'Sole Proprietor Declaration',
    docSolePropDesc:
      'I confirm my status as a sole proprietor and accept the terms of service of Sberbank India.',
    docPdfStub: 'PDF preview will appear here',
    btnAuthorize: 'Sign by OTP', // формулировка Марго (демо 2026-06-10)
    otpLabel: 'Enter the code',
    otpHint: 'We sent a one-time code to your phone. Enter it to sign the documents.',
    otpDemoHint: 'Demo code: 0000',
    otpErrorTitle: 'Invalid code',
    otpErrorText: 'Check the code from the SMS and try again. Demo code: 0000.',
    successTitle: 'All Done!',
    successBody:
      'Documents are signed and video identification is complete. We are now opening your account.',
    btnDashboard: 'Go to application dashboard',
  },
};

// ─── Styled ─────────────────────────────────────────────────────────────────

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

const Eyebrow = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${textAccent};
  margin-bottom: 0.5rem;
`;

const Title = styled.h1`
  margin: 0 0 0.35rem;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: ${textPrimary};
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${textSecondary};
`;

const CardBody = styled.div`
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const DocList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const DocItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.125rem;
  border-radius: ${radii.panel};
  background: #f7f9f8;
  border: 1px solid rgba(0, 0, 0, 0.07);
`;

const DocIconWrap = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
`;

const DocContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const DocTitle = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${textPrimary};
`;

const DocDesc = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: ${textSecondary};
  line-height: 1.45;
`;

const DocPdfStub = styled.div`
  align-self: flex-start;
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.6rem;
  border-radius: ${radii.field};
  border: 1px dashed rgba(0, 0, 0, 0.18);
  background: rgba(0, 0, 0, 0.02);
  font-size: 0.76rem;
  color: ${textSecondary};

  .ic { font-size: 0.85rem; }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const OtpSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  ${enter(0)};
`;

const OtpLabel = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${textAccent};
`;

const OtpHint = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${textSecondary};
  line-height: 1.5;
`;

const OtpDemoNote = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: ${textSecondary};
  opacity: 0.8;
`;

const SuccessCard = styled.div`
  background: #ffffff;
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  ${enter(0.05)};
`;

const SuccessIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(33, 160, 56, 0.12);
  color: rgb(33, 160, 56);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
`;

const SuccessTitle = styled.h2`
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: ${textPrimary};
`;

const SuccessBody = styled.p`
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: ${textSecondary};
  line-height: 1.5;
  max-width: 28rem;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const SPSign = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [phase, setPhase] = useState<'review' | 'otp' | 'done'>('review');
  const [otpError, setOtpError] = useState(false);

  const docs = [
    { title: t.docDeclaration, desc: t.docDeclarationDesc, icon: '📄' },
    { title: t.docSoleProp, desc: t.docSolePropDesc, icon: '📋' },
  ];

  const handleOtp = async (code: string) => {
    if (code !== '0000') {
      setOtpError(true);
      return;
    }
    setOtpError(false);
    try {
      await passVcip();
      await setStepStatus('sign', 'done');
    } catch (_) { /* игнорируем */ }
    setPhase('done');
  };

  if (phase === 'done') {
    return (
      <ScreenV2>
        <SuccessCard>
          <SuccessIcon>✓</SuccessIcon>
          <SuccessTitle>{t.successTitle}</SuccessTitle>
          <SuccessBody>{t.successBody}</SuccessBody>
          <Button
            view="accent"
            size="l"
            text={t.btnDashboard}
            onClick={() => navigate('/v2/dashboard')}
          />
        </SuccessCard>
      </ScreenV2>
    );
  }

  return (
    <ScreenV2>
      <Card>
        <CardHeader>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>

        <CardBody>
          {/* Документы к подписанию (open: В-4 — для Sole Prop нет Board Resolution, используем декларации) */}
          <DocList>
            {docs.map((doc) => (
              <DocItem key={doc.title}>
                <DocIconWrap>{doc.icon}</DocIconWrap>
                <DocContent>
                  <DocTitle>{doc.title}</DocTitle>
                  <DocDesc>{doc.desc}</DocDesc>
                  {/* Предпросмотр PDF — заглушка, не кликабельна (реального документа в прототипе нет) */}
                  <DocPdfStub aria-disabled="true">
                    <span className="ic">📄</span>
                    {t.docPdfStub}
                  </DocPdfStub>
                </DocContent>
              </DocItem>
            ))}
          </DocList>

          {phase === 'review' && (
            <ButtonRow>
              <Button
                view="accent"
                size="l"
                text={t.btnAuthorize}
                onClick={() => { setOtpError(false); setPhase('otp'); }}
              />
            </ButtonRow>
          )}

          {phase === 'otp' && (
            <OtpSection>
              <OtpLabel>{t.otpLabel}</OtpLabel>
              <OtpHint>{t.otpHint}</OtpHint>
              {/* TODO свериться с MCP — CodeField: codeLength, size, onFullCodeEnter */}
              <CodeField
                codeLength={4}
                size="l"
                onFullCodeEnter={handleOtp}
                captionAlign="center"
              />
              <OtpDemoNote>{t.otpDemoHint}</OtpDemoNote>
              {otpError && (
                <Note view="negative" size="s" title={t.otpErrorTitle} text={t.otpErrorText} />
              )}
            </OtpSection>
          )}
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
