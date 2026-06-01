import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextField, Mask, CodeField, Note, BodyM } from '@salutejs/sdds-serv';
import { textSecondary } from '@salutejs/sdds-themes/tokens';
import { OnboardingLayout } from '../ui/OnboardingLayout';
import { createPerson, verifyOtp } from '../mock/api';

// CL-02 — Создание логина и вход. source: 2026-06-01_obo : 002
// email + телефон → OTP. Прототип: валидация инпутов отключена — можно
// проходить этап насквозь. Условие вернём на этапе тестирования.

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Hint = styled(BodyM)`
  color: ${textSecondary};
`;

export const CL02Login = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'form' | 'otp'>('form');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendCode = async () => {
    setSending(true);
    await createPerson(email, phone ? `+91 ${phone}` : '');
    setSending(false);
    setStage('otp');
  };

  const handleLogin = async () => {
    await verifyOtp('0000'); // прототип: код не проверяем
    navigate('/company');
  };

  const primary =
    stage === 'form' ? (
      <Button
        view="accent"
        size="m"
        text={sending ? 'Отправляем код…' : 'Получить код'}
        disabled={sending}
        onClick={handleSendCode}
      />
    ) : (
      <Button view="accent" size="m" text="Войти" onClick={handleLogin} />
    );

  return (
    <OnboardingLayout step={0} title="Создание входа" primary={primary}>
      {stage === 'form' ? (
        <Form>
          <Hint>Введите рабочий email и телефон — пришлём код подтверждения.</Hint>
          <TextField
            label="Email"
            type="email"
            placeholder="name@company.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="l"
          />
          <Mask
            label="Телефон"
            textBefore="+91"
            placeholder="00000 00000"
            mask="00000 00000"
            maskChar="_"
            onValueChange={({ maskedValue }) => setPhone(maskedValue)}
            size="l"
          />
        </Form>
      ) : (
        <Form>
          <Note
            view="positive"
            size="s"
            title="Код отправлен"
            text={`Мы отправили код${phone ? ` на +91 ${phone}` : ''}. Для прототипа можно ввести любой код.`}
          />
          <CodeField codeLength={4} size="l" onFullCodeEnter={handleLogin} captionAlign="center" />
          <Button view="clear" size="m" text="Изменить email или телефон" onClick={() => setStage('form')} />
        </Form>
      )}
    </OnboardingLayout>
  );
};
