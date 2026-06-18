import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, CodeField, Checkbox, Note } from '@salutejs/sdds-serv'; // TODO свериться с MCP — CodeField, Checkbox, Note props
import {
  textPrimary,
  textSecondary,
  textAccent,
} from '@salutejs/sdds-themes/tokens';
import { accentPanel, radii, elevation, enter } from '../../ui/designSystem';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { passVcip, setStepStatus, giveConsent } from '../../mock/v2/api';

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
    accuracyLabel: string;
    accuracyDescription: string;
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
    docDeclaration: 'Декларация',
    docDeclarationDesc:
      'Подтверждаю достоверность сведений и ответственность за операции по счёту.',
    docSoleProp: 'Согласие и уполномочие на банковские операции',
    docSolePropDesc:
      'Заявляю, что являюсь единоличным владельцем бизнеса, и уполномочиваю банк открыть счёт и провести проверки KYC.',
    docPreviewBtn: 'Просмотреть документ',
    docPreviewClose: 'Закрыть',
    // Тексты деклараций VERBATIM из юзер-кейсов Марго (2026-06-11, IMG_6964); RU — перевод
    docDeclarationFull:
      'Я подтверждаю, что:\n• Сведения, предоставленные банку, являются достоверными, точными и полными.\n• Я несу единоличную ответственность за все операции по счёту (счетам).\n• О любом изменении владения, статуса бизнеса или уполномоченного подписанта я немедленно сообщу банку в письменной форме.\n• Все операции, совершённые по физическим или электронным каналам, имеют для меня обязательную силу.',
    docSolePropFull:
      'Я, Aarav Sharma, сын/дочь [____________], проживающий(-ая) по адресу [Адрес], настоящим заявляю, что являюсь единоличным владельцем Aarav Sharma Exports с основным местом ведения деятельности: Shop 14, Crystal Plaza, Link Road, Malad West, Mumbai — 400064.\n\nСОГЛАСИЕ И УПОЛНОМОЧИЕ\n\nНастоящим я даю согласие и уполномочиваю [Банк]:\n• Открыть и вести банковский продукт или услугу по моему заявлению на имя Aarav Sharma Exports.\n• Предоставить и обеспечить ведение счёта и использование продуктов и услуг Банка, включая, помимо прочего, интернет-банк, услуги в рамках FEMA, депозиты, кредиты, учёт/дисконтирование векселей, аккредитивы, банковские гарантии и иные банковские услуги, в соответствии с условиями Банка https://bank.example/.\n• Проводить проверки KYC, CKYC, AML и регуляторные проверки, включая проверку личности, адреса и сведений о бизнесе.',
    accuracyLabel: 'Подтверждаю достоверность данных',
    accuracyDescription:
      'Я ознакомился(-лась) и проверил(-а) сведения и документы в анкете. Подтверждаю, что они достоверны, полны и актуальны во всех аспектах, я не утаил(-а) информации и ничего существенного не скрыто.',
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
    // Тексты деклараций VERBATIM из юзер-кейсов Марго (2026-06-11, IMG_6964) — не редактировать.
    // Плейсхолдеры шаблона [Full Name]/[Firm] заполнены mock-данными; неизвестные — прочерки.
    docDeclaration: 'Declaration',
    docDeclarationDesc:
      'I confirm the information is true, correct and complete, and accept responsibility for account transactions.',
    docSoleProp: 'Consent and Authorisation for Banking Operations',
    docSolePropDesc:
      'I declare I am the sole proprietor and authorise the Bank to open the account and carry out KYC checks.',
    docPreviewBtn: 'Preview document',
    docPreviewClose: 'Close',
    docDeclarationFull:
      'I confirm that:\n• The information provided to the Bank is true, correct and complete.\n• I shall be solely responsible for all transactions carried out in the account(s).\n• Any change in ownership, business status or authorised signatory shall be immediately informed to the Bank in writing.\n• All transactions executed through physical or electronic channels shall be binding on me.',
    docSolePropFull:
      'I, Aarav Sharma, son/daughter of [____________], residing at [Address], do hereby declare that I am the sole proprietor of Aarav Sharma Exports, having its principal place of business at Shop 14, Crystal Plaza, Link Road, Malad West, Mumbai — 400064.\n\nCONSENT & AUTHORISATION\n\nI hereby give my consent and authorise [the Bank] to:\n• Open and maintain Banking product or service as per my request in the name of Aarav Sharma Exports.\n• Provide and enable to operate the account and avail and utilise the products and services of the Bank, including but not limited to Internet Banking, FEMA-related services, deposits, loans, bill purchase/discounting, letters of credit, bank guarantees, and other banking facilities, in accordance with the terms and conditions of the Bank https://bank.example/.\n• Carry out KYC, CKYC, AML, and regulatory checks, including verification of identity, address and business details.',
    accuracyLabel: 'I confirm the accuracy of the data',
    accuracyDescription:
      'I have reviewed and verified the details and documents in the application. I confirm they are true, correct, complete and up to date in all aspects, I have not withheld any information and nothing material has been concealed.',
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

const AccuracyRow = styled.div`
  padding: 1rem 1.1rem;
  border: 1.5px solid rgba(33, 160, 56, 0.25);
  border-radius: ${radii.panel};
  background: rgba(33, 160, 56, 0.03);
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
  white-space: pre-line; /* verbatim-текст с абзацами и пунктами */
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
  const [accuracyChecked, setAccuracyChecked] = useState(false); // Data Accuracy — гейтит подпись
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
      const ts = new Date().toISOString();
      await giveConsent('Data Accuracy', ts); // подтверждение достоверности — на финальном подписании
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

          {/* Подтверждение достоверности (Data Accuracy) — на финальном подписании
              (Марго 2026-06-15: «в конце — подписание декларации и всей анкеты»). Гейтит подпись. */}
          {phase === 'review' && (
            <AccuracyRow>
              <Checkbox
                label={t.accuracyLabel}
                description={t.accuracyDescription}
                checked={accuracyChecked}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccuracyChecked(e.target.checked)}
              />
            </AccuracyRow>
          )}

          {phase === 'review' && (
            <ButtonRow>
              <Button
                view="accent"
                size="l"
                text={t.btnAuthorize}
                disabled={!accuracyChecked}
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
