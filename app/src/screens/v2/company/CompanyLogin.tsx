import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextField, CodeField, Note } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textAccent, bodyM, bodySBold } from '@salutejs/sdds-themes/tokens';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { getCompanyEntry, loginCompany } from '../../../mock/v2/companyApi';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRowEnd } from './companyUi';

// CO-LOGIN — повторный вход (Денис: email + пин). Простой экран логина в личный кабинет.
// Сверяет email+пин с сохранёнными при первичном входе → /company/dashboard.
// Роут: /company/login

const dict: Record<Lang, {
  title: string; subtitle: string;
  emailLabel: string; emailPlaceholder: string; pinLabel: string;
  demoHint: string; cta: string; err: string; firstTime: string;
}> = {
  ru: {
    title: 'Вход в личный кабинет',
    subtitle: 'Введите email и пин-код, которые вы указали при регистрации.',
    emailLabel: 'Email',
    emailPlaceholder: 'name@company.in',
    pinLabel: 'Пин-код',
    demoHint: 'Введите email и пин-код из первичного входа',
    cta: 'Войти',
    err: 'Неверный email или пин-код.',
    firstTime: 'Впервые здесь? Войти через Aadhaar',
  },
  en: {
    title: 'Sign in to your account',
    subtitle: 'Enter the email and passcode you set during registration.',
    emailLabel: 'Email',
    emailPlaceholder: 'name@company.in',
    pinLabel: 'Passcode',
    demoHint: 'Enter the email and passcode from your first sign-in',
    cta: 'Sign in',
    err: 'Incorrect email or passcode.',
    firstTime: 'First time here? Sign in with Aadhaar',
  },
};

const FieldLabel = styled.p`margin:0 0 0.4rem; ${bodySBold}; font-size:0.875rem; color:${textPrimary};`;
const CodeWrap = styled.div`display:flex; justify-content:flex-start;`;
const DemoNote = styled.p`margin:0; ${bodyM}; font-size:0.78rem; color:${textSecondary}; opacity:0.7;`;
// Мост для нового/первого входа (Ульяна): пустой стейт не должен быть тупиком.
const BridgeRow = styled.div`display:flex; justify-content:center; padding-top:0.25rem;`;
const BridgeLink = styled.button`background:none; border:none; padding:0; color:${textAccent}; font-size:0.85rem; font-weight:600; text-decoration:underline; text-underline-offset:2px; cursor:pointer; &:hover{opacity:0.8;}`;

export const CompanyLogin = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  // Предзаполняем email из первичного входа (демо-удобство).
  useEffect(() => { getCompanyEntry().then((e) => { if (e.email) setEmail(e.email); }); }, []);

  const handleLogin = async () => {
    const ok = await loginCompany(email.trim(), pin);
    if (!ok) { setError(true); return; }
    navigate('/company/dashboard');
  };

  return (
    <ScreenV2>
      <Card>
        <CardHeader><Title>{t.title}</Title><Subtitle>{t.subtitle}</Subtitle></CardHeader>
        <CardBody>
          <TextField
            label={t.emailLabel}
            type="email"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(false); }}
            size="l"
          />
          <div>
            <FieldLabel>{t.pinLabel}</FieldLabel>
            <CodeWrap>
              <CodeField codeLength={4} size="l" onChange={(c: string) => { setPin(c); if (error) setError(false); }} />
            </CodeWrap>
          </div>
          <DemoNote>{t.demoHint}</DemoNote>
          {error && <Note view="negative" size="s" title={t.err} text="" />}
          <ButtonRowEnd>
            <Button view="accent" size="l" text={t.cta} onClick={handleLogin} />
          </ButtonRowEnd>
          <BridgeRow>
            <BridgeLink type="button" onClick={() => navigate('/company/aadhaar')}>{t.firstTime}</BridgeLink>
          </BridgeRow>
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
