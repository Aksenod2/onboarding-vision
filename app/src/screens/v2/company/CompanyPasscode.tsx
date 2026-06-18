import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Button, CodeField, Note } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, bodyM } from '@salutejs/sdds-themes/tokens';
import { radii } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { useCompany } from '../../../ui/v2/CompanyContext';
import { getCompanyEntry, setCompanyPasscode } from '../../../mock/v2/companyApi';
import { useEntryGuard } from '../../../ui/v2/useEntryGuard';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRow } from './companyUi';

// CO-PASSCODE — «придумай пин-код» (Денис: пин из цифр = креды интернет-банка).
// Пин = ячейки (CodeField), как в CompanyLogin. Повтор пина — ОТДЕЛЬНЫЙ под-шаг (тех-план Кости):
// на экране ВСЕГДА смонтирован ровно ОДИН CodeField — два CodeField роняют рендерер SDDS.
// Сброс полей — ТОЛЬКО ремоунтом через resetNonce в key (НЕ value=''). Разные key в ветках.
// После создания: инлайн-спиннер ~1.8с → /company/pan, факт «кабинет создан» — тостом поверх PAN.
// Роут: /company/passcode → /company/pan

const dict: Record<Lang, {
  enterTitle: string; subtitle: string;
  repeatTitle: string;
  loginLabel: string;
  demoHint: string;
  mismatch: string;
  changePin: string;
  cta: string; creating: string; createdToast: string;
}> = {
  ru: {
    enterTitle: 'Придумайте пин-код',
    subtitle: 'Пин-код из 4 цифр — он же код для входа в интернет-банк. Логин привязан к вашему email из Aadhaar.',
    repeatTitle: 'Повторите пин-код',
    loginLabel: 'Логин (email из Aadhaar):',
    demoHint: 'Для демо подойдёт любой пин из 4 цифр',
    mismatch: 'Пин-коды не совпадают. Повторите ввод.',
    changePin: 'Изменить пин',
    cta: 'Создать личный кабинет',
    creating: 'Создаём личный кабинет…',
    createdToast: 'Личный кабинет создан',
  },
  en: {
    enterTitle: 'Create a passcode',
    subtitle: 'A 4-digit passcode — it is also your internet-bank login code. Your login is tied to the email from Aadhaar.',
    repeatTitle: 'Repeat the passcode',
    loginLabel: 'Login (email from Aadhaar):',
    demoHint: 'For the demo any 4-digit passcode works',
    mismatch: 'Passcodes do not match. Please re-enter.',
    changePin: 'Change passcode',
    cta: 'Create personal account',
    creating: 'Creating your personal account…',
    createdToast: 'Personal account created',
  },
};

const FieldBlock = styled.div`display:flex; flex-direction:column; gap:0.5rem;`;
const CodeWrap = styled.div`display:flex; justify-content:center;`;
const DemoNote = styled.p`margin:0; ${bodyM}; font-size:0.78rem; text-align:center; color:${textSecondary}; opacity:0.7;`;
const LoginRow = styled.p`margin:0; font-size:0.85rem; color:${textPrimary}; .label { color:${textSecondary}; margin-right:0.35rem; }`;
const spin = keyframes`to { transform: rotate(360deg); }`;
const Spinner = styled.span`width:40px; height:40px; border-radius:50%; border:3px solid rgba(33,160,56,0.18); border-top-color:rgb(33,160,56); animation:${spin} 0.9s linear infinite; align-self:center;`;
const WaitText = styled.p`margin:0; text-align:center; font-size:0.85rem; color:${textSecondary};`;
const Box = styled.div`padding:1rem 1.1rem; border-radius:${radii.panel}; background:#f7f9f8; border:1px solid rgba(0,0,0,0.07);`;

export const CompanyPasscode = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];
  const { ready } = useEntryGuard('aadhaar'); // нет Aadhaar → редирект на /company/aadhaar
  const { setPendingToast } = useCompany();

  const [email, setEmail] = useState('');
  // Под-шаг ввода пина: enter (придумать) → repeat (повторить).
  const [subStep, setSubStep] = useState<'enter' | 'repeat'>('enter');
  const [pin1, setPin1] = useState('');
  const [error, setError] = useState('');
  // resetNonce — единственный механизм очистки CodeField: меняем key → ремоунт (НЕ value='').
  const [resetNonce, setResetNonce] = useState(0);
  const [phase, setPhase] = useState<'input' | 'creating'>('input');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    getCompanyEntry().then((e) => { if (e.email) setEmail(e.email); });
    return () => { timers.current.forEach(clearTimeout); };
  }, []);

  // enter: ввели 4 цифры → фиксируем pin1, переходим на repeat.
  const handleEnterComplete = (code: string) => {
    setPin1(code);
    setError('');
    setSubStep('repeat');
  };

  // repeat: ввели 4 цифры → сверяем. Совпало → submit; нет → Note negative + ремоунт.
  const handleRepeatComplete = async (code: string) => {
    if (code !== pin1) {
      setError(t.mismatch);
      setResetNonce((n) => n + 1); // ремоунт CodeField — единственный способ сброса
      return;
    }
    setError('');
    try { await setCompanyPasscode(pin1); } catch (_) { /* игнорируем */ }
    setPhase('creating');
    const tt = setTimeout(() => {
      // Факт создания — тостом поверх следующего экрана (не отдельным экраном-поздравлением).
      setPendingToast(t.createdToast);
      navigate('/company/bnq');
    }, 1800);
    timers.current.push(tt);
  };

  // «Изменить пин» — вернуться на enter и полностью сбросить оба поля ремоунтом.
  const handleChangePin = () => {
    setSubStep('enter');
    setPin1('');
    setError('');
    setResetNonce((n) => n + 1);
  };

  if (!ready) return <ScreenV2><Card /></ScreenV2>;

  if (phase === 'creating') {
    return (
      <ScreenV2>
        <Card>
          <CardHeader><Title>{t.enterTitle}</Title><Subtitle>{t.subtitle}</Subtitle></CardHeader>
          <CardBody><Spinner /><WaitText>{t.creating}</WaitText></CardBody>
        </Card>
      </ScreenV2>
    );
  }

  return (
    <ScreenV2>
      <Card>
        <CardHeader>
          <Title>{subStep === 'enter' ? t.enterTitle : t.repeatTitle}</Title>
          {/* Subtitle про email — только на под-шаге «придумайте». */}
          {subStep === 'enter' && <Subtitle>{t.subtitle}</Subtitle>}
        </CardHeader>
        <CardBody>
          {email && subStep === 'enter' && (
            <Box><LoginRow><span className="label">{t.loginLabel}</span>{email}</LoginRow></Box>
          )}

          <FieldBlock>
            <CodeWrap>
              {/* КРИТИЧНО (Костя): один смонтированный CodeField; разные key в ветках; сброс — ремоунтом. */}
              {subStep === 'enter' ? (
                <CodeField
                  key={`pin-enter-${resetNonce}`}
                  codeLength={4}
                  size="l"
                  onFullCodeEnter={handleEnterComplete}
                  captionAlign="center"
                />
              ) : (
                <CodeField
                  key={`pin-repeat-${resetNonce}`}
                  codeLength={4}
                  size="l"
                  onFullCodeEnter={handleRepeatComplete}
                  captionAlign="center"
                />
              )}
            </CodeWrap>
          </FieldBlock>

          <DemoNote>{t.demoHint}</DemoNote>
          {error && <Note view="negative" size="s" title={error} text="" />}

          {/* Кнопки submit нет: совпадение пина на repeat запускает создание автоматически.
              На repeat — только «Изменить пин» (secondary, слева), чтобы вернуться к вводу. */}
          {subStep === 'repeat' && (
            <ButtonRow>
              <Button view="secondary" size="l" text={t.changePin} onClick={handleChangePin} />
            </ButtonRow>
          )}
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
