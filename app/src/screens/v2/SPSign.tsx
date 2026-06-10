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
    docPreviewBtn: string;
    docPreviewClose: string;
    docDeclarationFull: string;
    docSolePropFull: string;
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
    docPreviewBtn: 'Просмотреть документ',
    docPreviewClose: 'Закрыть',
    // Mock-тексты деклараций (финальные verbatim — у Марго «в работе», чек-лист п.2)
    docDeclarationFull:
      'Я, нижеподписавшийся, подтверждаю, что все сведения и документы, предоставленные мной в рамках заявления на открытие расчётного счёта, являются полными, достоверными и актуальными на дату подписания. Я понимаю, что предоставление недостоверных сведений может повлечь отказ в открытии счёта или его последующую блокировку в соответствии с применимым законодательством и внутренними правилами банка. Я обязуюсь уведомлять банк об изменении предоставленных сведений.',
    docSolePropFull:
      'Я подтверждаю, что осуществляю предпринимательскую деятельность в статусе индивидуального предпринимателя (Sole Proprietor) и являюсь единственным владельцем и распорядителем указанного бизнеса. Я ознакомился(-лась) с условиями обслуживания, тарифами и правилами банка и принимаю их в полном объёме. Я подтверждаю свои полномочия на открытие и распоряжение расчётным счётом от имени данного бизнеса.',
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
    docPreviewBtn: 'Preview document',
    docPreviewClose: 'Close',
    docDeclarationFull:
      'I, the undersigned, confirm that all information and documents provided by me as part of the account-opening application are complete, accurate and up to date as of the date of signing. I understand that providing inaccurate information may result in refusal to open the account or its subsequent suspension in accordance with applicable law and the bank’s internal rules. I undertake to notify the bank of any changes to the information provided.',
    docSolePropFull:
      'I confirm that I conduct business as a Sole Proprietor and am the sole owner and operator of the said business. I have read and accept in full the terms of service, tariffs and rules of the bank. I confirm my authority to open and operate a current account on behalf of this business.',
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

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

// Кнопка-ссылка «Просмотреть документ» — открывает лайтбокс (фидбек Марго, демо 2026-06-10)
const DocPreviewLink = styled.button`
  align-self: flex-start;
  margin-top: 0.4rem;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${textAccent};
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover { opacity: 0.8; }
`;

// Лайтбокс предпросмотра декларации: тёмный фон + «лист документа»
const LightboxBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10010;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const LightboxDoc = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
  width: min(640px, 100%);
  max-height: 80vh;
  overflow-y: auto;
  padding: 2.5rem 2.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LightboxTitle = styled.h2`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: ${textPrimary};
`;

const LightboxText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.7;
  color: ${textPrimary};
`;

const LightboxFoot = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
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
  const [previewDoc, setPreviewDoc] = useState<number | null>(null); // лайтбокс предпросмотра

  const docs = [
    { title: t.docDeclaration, desc: t.docDeclarationDesc, full: t.docDeclarationFull, icon: '📄' },
    { title: t.docSoleProp, desc: t.docSolePropDesc, full: t.docSolePropFull, icon: '📋' },
  ];

  const handleOtp = async (code: string) => {
    if (code !== '0000') {
      setOtpError(true);
      return;
    }
    setOtpError(false);
    try {
      await passVcip();
      // После подписания заявка уходит в проверку банком (BR-15: статус Verifying,
      // не мгновенный «счёт открыт») — шаг помечаем verifying, не done.
      await setStepStatus('sign', 'verifying');
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
            {docs.map((doc, i) => (
              <DocItem key={doc.title}>
                <DocIconWrap>{doc.icon}</DocIconWrap>
                <DocContent>
                  <DocTitle>{doc.title}</DocTitle>
                  <DocDesc>{doc.desc}</DocDesc>
                  {/* Лайтбокс-предпросмотр (фидбек Марго): клиент видит, что подписывает.
                      Текст mock — финальные verbatim-декларации у Марго «в работе». */}
                  <DocPreviewLink onClick={() => setPreviewDoc(i)}>
                    {t.docPreviewBtn}
                  </DocPreviewLink>
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

      {/* Лайтбокс предпросмотра декларации */}
      {previewDoc !== null && (
        <LightboxBackdrop onClick={() => setPreviewDoc(null)}>
          <LightboxDoc onClick={(e) => e.stopPropagation()}>
            <LightboxTitle>{docs[previewDoc].title}</LightboxTitle>
            <LightboxText>{docs[previewDoc].full}</LightboxText>
            <LightboxFoot>
              <Button
                view="secondary"
                size="m"
                text={t.docPreviewClose}
                onClick={() => setPreviewDoc(null)}
              />
            </LightboxFoot>
          </LightboxDoc>
        </LightboxBackdrop>
      )}
    </ScreenV2>
  );
};
