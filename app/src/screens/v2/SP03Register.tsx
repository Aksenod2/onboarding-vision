import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
// TODO свериться с MCP — Button view/size, TextField, Mask, CodeField, Checkbox, Note props
import { Button, TextField, Mask, CodeField, Checkbox, Note } from '@salutejs/sdds-serv';
import {
  textPrimary,
  textSecondary,
  textAccent,
  bodyM,
  bodyS,
} from '@salutejs/sdds-themes/tokens';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { createSession, verifyOtp, giveConsent, getSession } from '../../mock/v2/api';
import { accentPanel, radii, elevation, eyebrow, enter } from '../../ui/designSystem';

// SP-03 — Регистрация / авторизация + стартовые согласия (Sole Proprietor).
// Роут: /v2/login  (OTP-стадия: /v2/login?step=otp — возврат из письма SP-02)
// Шаг 1: email + телефон (+91 маска) + 3 чекбокса согласий → createSession + giveConsent → SP-02 (письмо).
// Шаг 2: возврат из письма (?step=otp) → CodeField 4 знака → verifyOtp('0000') → navigate('/v2/pan').
// Телефон в OTP-стадии берётся из mock-сессии (компонент перемонтирован после SP-02).

// ─── Словарь ─────────────────────────────────────────────────────────────────

const dict: Record<
  Lang,
  {
    stepLabel: string;
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    cookieLabel: string;
    tcLabel: string;
    privacyLabel: string;
    privacyLink: string;
    tcLink: string;
    ctaSend: string;
    ctaSending: string;
    // Step 2
    step2Label: string;
    step2Title: string;
    step2Hint: string;
    demoHint: string;
    ctaConfirm: string;
    ctaConfirming: string;
    ctaBack: string;
    errorTitle: string;
    errorText: string;
  }
> = {
  ru: {
    stepLabel: 'ШАГ 1 ИЗ 2',
    title: 'Создание входа',
    subtitle: 'Введите email и телефон — отправим письмо для подтверждения адреса.',
    emailLabel: 'Email',
    emailPlaceholder: 'name@company.in',
    phoneLabel: 'Телефон',
    phonePlaceholder: '00000 00000',
    cookieLabel:
      'Sberbank Branch in India использует cookie для персонализации сервисов. Вы можете заблокировать cookie в настройках браузера.',
    tcLabel:
      'Настоящим я уполномачиваю Sberbank Branch in India проверить мои данные в цифровом или ином порядке по усмотрению банка.',
    privacyLabel: 'Я ознакомился с ',
    privacyLink: 'Политикой конфиденциальности',
    tcLink: 'Условиями и положениями',
    ctaSend: 'Продолжить',
    ctaSending: 'Отправляем…',
    step2Label: 'ШАГ 2 ИЗ 2',
    step2Title: 'Подтверждение кода',
    step2Hint: 'Мы отправили код подтверждения на указанный номер.',
    demoHint: 'Для демо введите код 0000',
    ctaConfirm: 'Подтвердить',
    ctaConfirming: 'Проверяем…',
    ctaBack: 'Изменить данные',
    errorTitle: 'Неверный код',
    errorText: 'Код введён неверно. Для демо используйте 0000.',
  },
  en: {
    stepLabel: 'STEP 1 OF 2',
    title: 'Create your login',
    subtitle: 'Enter your email and phone number — we will send an email to confirm your address.',
    emailLabel: 'Email',
    emailPlaceholder: 'name@company.in',
    phoneLabel: 'Phone',
    phonePlaceholder: '00000 00000',
    cookieLabel:
      'Sberbank Branch in India uses cookies for service personalisation. You can disable cookies in your browser settings.',
    tcLabel:
      'I hereby authorise Sberbank Branch in India to verify my details digitally or otherwise in any manner that Sberbank Branch in India may deem fit.',
    privacyLabel: 'I acknowledge I have read the ',
    privacyLink: 'Privacy Notice',
    tcLink: 'Terms & Conditions',
    ctaSend: 'Continue',
    ctaSending: 'Sending…',
    step2Label: 'STEP 2 OF 2',
    step2Title: 'Confirm your code',
    step2Hint: 'We sent a confirmation code to your phone number.',
    demoHint: 'For demo purposes enter code 0000',
    ctaConfirm: 'Confirm',
    ctaConfirming: 'Verifying…',
    ctaBack: 'Change details',
    errorTitle: 'Incorrect code',
    errorText: 'The code is incorrect. For demo use 0000.',
  },
};

// ─── Styled components ────────────────────────────────────────────────────────

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

const StepLabel = styled.div`
  ${eyebrow};
  color: ${textAccent};
  margin-bottom: 0.5rem;
`;

const Title = styled.h1`
  margin: 0 0 0.25rem;
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

// Блок согласий
const ConsentsBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: ${radii.panel};
  border: 1px solid rgba(0, 0, 0, 0.06);
`;

const ConsentsTitle = styled.div`
  ${bodyM};
  color: ${textSecondary};
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
`;

// Строка чекбокса: собственный лейбл с поддержкой ссылок
const CheckRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  cursor: pointer;
`;

const CheckText = styled.span`
  ${bodyS};
  color: ${textPrimary};
  font-size: 0.82rem;
  line-height: 1.45;
  padding-top: 2px;
`;

const ConsentLink = styled.a`
  color: ${textAccent};
  text-decoration: underline;
  text-underline-offset: 2px;
  &:hover {
    opacity: 0.8;
  }
`;

// OTP-экран
const OtpHint = styled.p`
  margin: 0;
  ${bodyM};
  color: ${textSecondary};
  ${enter(0.1)};
`;

const DemoNote = styled.p`
  margin: 0;
  ${bodyS};
  color: ${textSecondary};
  opacity: 0.65;
  font-size: 0.78rem;
  text-align: center;
  ${enter(0.2)};
`;

const CodeWrapper = styled.div`
  display: flex;
  justify-content: center;
  ${enter(0.15)};
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-top: 0.25rem;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const SP03Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();
  const t = dict[lang];

  // Шаг 1
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consentCookie, setConsentCookie] = useState(false);
  const [consentTc, setConsentTc] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [sending, setSending] = useState(false);

  // Шаг 2
  const [stage, setStage] = useState<'form' | 'otp'>('form');
  const [otpError, setOtpError] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Возврат из письма SP-02 (?step=otp): открыть OTP-стадию, подтянуть телефон из сессии.
  // Без сессии (прямой заход на ссылку) — остаёмся на форме.
  useEffect(() => {
    if (searchParams.get('step') !== 'otp') return;
    getSession().then((s) => {
      if (!s) return;
      setEmail(s.email);
      setPhone(s.phone.replace(/^\+91\s*/, ''));
      setStage('otp');
    });
  }, [searchParams]);

  const handleSendCode = async () => {
    setSending(true);
    try {
      const ist = new Date().toISOString();
      await createSession(email.trim() || 'demo@demo.in', `+91 ${phone}`, lang);
      if (consentTc) await giveConsent('Terms & Conditions', ist);
      if (consentPrivacy) await giveConsent('Privacy Notice', ist);
      if (consentCookie) await giveConsent('Cookie', ist);
    } catch (_) { /* игнорируем ошибки api */ }
    setSending(false);
    navigate('/v2/email');
  };

  const handleVerify = async (code: string) => {
    if (confirming) return;
    setOtpError(false);
    setConfirming(true);
    try {
      await verifyOtp(code);
    } catch (_) { /* игнорируем */ }
    setConfirming(false);
    navigate('/v2/pan'); // объединённый экран «Доступ к реестрам и PAN»
  };

  return (
    <ScreenV2>
      <Card>
        <CardHeader>
          <StepLabel>{stage === 'form' ? t.stepLabel : t.step2Label}</StepLabel>
          <Title>{stage === 'form' ? t.title : t.step2Title}</Title>
          <Subtitle>{stage === 'form' ? t.subtitle : t.step2Hint}</Subtitle>
        </CardHeader>

        <CardBody>
          {stage === 'form' ? (
            <>
              {/* Email */}
              <TextField
                label={t.emailLabel}
                type="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="l"
              />

              {/* Телефон +91 маска */}
              {/* TODO свериться с MCP — Mask props: mask, maskChar, textBefore, onValueChange */}
              <Mask
                label={t.phoneLabel}
                textBefore="+91"
                placeholder={t.phonePlaceholder}
                mask="00000 00000"
                maskChar="_"
                onValueChange={({ maskedValue }: { maskedValue: string }) => setPhone(maskedValue)}
                size="l"
              />

              {/* Блок согласий */}
              <ConsentsBlock>
                <ConsentsTitle>
                  {lang === 'ru' ? 'Согласия' : 'Consents'}
                </ConsentsTitle>

                {/* 1. Cookie — необязательное */}
                {/* TODO свериться с MCP — Checkbox props: label, checked, onChange */}
                <CheckRow>
                  <Checkbox
                    checked={consentCookie}
                    onChange={() => setConsentCookie((v) => !v)}
                  />
                  <CheckText>{t.cookieLabel}</CheckText>
                </CheckRow>

                {/* 2b. T&C — обязательное */}
                <CheckRow>
                  <Checkbox
                    checked={consentTc}
                    onChange={() => setConsentTc((v) => !v)}
                  />
                  <CheckText>
                    {t.tcLabel}{' '}
                    <ConsentLink
                      href="https://sberbank.co.in/terms-and-conditions"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.tcLink}
                    </ConsentLink>
                    {lang === 'ru' ? '.' : '.'}
                    {' '}
                    <span style={{ color: textAccent, fontWeight: 700 }}>*</span>
                  </CheckText>
                </CheckRow>

                {/* 3. Privacy Notice — обязательное */}
                <CheckRow>
                  <Checkbox
                    checked={consentPrivacy}
                    onChange={() => setConsentPrivacy((v) => !v)}
                  />
                  <CheckText>
                    {t.privacyLabel}
                    <ConsentLink
                      href="https://sberbank.co.in/customer-information/privacy-notice#appendix_iv"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.privacyLink}
                    </ConsentLink>
                    {lang === 'ru'
                      ? ' и даю явное согласие на обработку моих персональных данных в целях представления моей компании в отношениях с Sberbank Branch in India.'
                      : ' and hereby provide explicit consent to process my personal data for the purpose of representing my company in a client relationship with the Sberbank Branch in India.'}
                    {' '}
                    <span style={{ color: textAccent, fontWeight: 700 }}>*</span>
                  </CheckText>
                </CheckRow>
              </ConsentsBlock>

              <Actions>
                <Button
                  view="accent"
                  size="l"
                  text={sending ? t.ctaSending : t.ctaSend}
                  onClick={handleSendCode}
                />
              </Actions>
            </>
          ) : (
            <>
              <OtpHint>
                {t.step2Hint}
                {phone ? ` (+91 ${phone})` : ''}
              </OtpHint>

              {/* OTP: 4 знака */}
              {/* TODO свериться с MCP — CodeField: codeLength, size, onFullCodeEnter, captionAlign */}
              <CodeWrapper>
                <CodeField
                  codeLength={4}
                  size="l"
                  onFullCodeEnter={handleVerify}
                  captionAlign="center"
                />
              </CodeWrapper>

              <DemoNote>{t.demoHint}</DemoNote>

              {otpError && (
                // TODO свериться с MCP — Note view="warning"|"negative", size, title, text
                <Note
                  view="warning"
                  size="s"
                  title={t.errorTitle}
                  text={t.errorText}
                />
              )}

              {/* Кнопка «Подтвердить» активируется auto-submit через onFullCodeEnter выше.
                  Здесь показываем индикатор загрузки и резервный путь «Изменить данные». */}
              <Actions>
                {confirming && (
                  <Button
                    view="accent"
                    size="l"
                    text={t.ctaConfirming}
                  />
                )}
                <Button
                  view="secondary"
                  size="l"
                  text={t.ctaBack}
                  onClick={() => {
                    setStage('form');
                    setOtpError(false);
                  }}
                />
              </Actions>
            </>
          )}
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
