import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textAccent, bodyM, bodySBold } from '@salutejs/sdds-themes/tokens';
import { useLanguage } from './LanguageContext';
import type { Lang } from './LanguageContext';

// AadhaarHowTo (#46) — общий блок инструкции «Как это работает» для Aadhaar-шагов.
// Шаги-кружки 1-2-3 + успокаивающая строка (L7) + ссылка «Подробнее» → модалка с туториалом.
// Переиспользуется на входе компании (CompanyAadhaar) и в сессии подписанта (CompanySignatory).
//
// variant:
//  • 'entry'   — вход компании: Aadhaar подтягивает контакты из UIDAI;
//  • 'session' — сессия подписанта: Aadhaar = eKYC-идентификация подписанта.

type Variant = 'entry' | 'session';

interface VariantDict {
  reassure: string; // L7 — успокаивающий тон
  stepsTitle: string;
  steps: string[];
  howToLink: string;
  howToTitle: string;
  howToIntro: string;
  howToSteps: string[];
  howToClose: string;
}

const dict: Record<Lang, Record<Variant, VariantDict>> = {
  ru: {
    entry: {
      reassure: 'Aadhaar QR — новый способ идентификации в Индии, это безопасно и занимает пару минут. Проведём по шагам.',
      stepsTitle: 'Как это работает',
      steps: [
        'Откройте приложение Aadhaar на телефоне.',
        'Нажмите Scan QR и наведите камеру на код ниже.',
        'Подтвердите передачу данных — контакты придут из UIDAI.',
      ],
      howToLink: 'Подробнее: как пройти через Aadhaar',
      howToTitle: 'Как пройти идентификацию через Aadhaar',
      howToIntro: 'Aadhaar — государственная цифровая идентификация в Индии. Чтобы пройти:',
      howToSteps: [
        'Установите приложение Aadhaar (mAadhaar) из App Store или Google Play.',
        'Войдите по своему номеру Aadhaar и подтвердите вход через OTP.',
        'Откройте сканер QR в приложении и наведите его на код на этом экране.',
        'Подтвердите передачу данных — мы получим ваши контакты из UIDAI.',
      ],
      howToClose: 'Понятно',
    },
    session: {
      reassure: 'Aadhaar QR — новый способ идентификации в Индии, это безопасно и занимает пару минут. Проведём по шагам.',
      stepsTitle: 'Как это работает',
      steps: [
        'Откройте приложение Aadhaar на телефоне.',
        'Нажмите Scan QR и наведите камеру на код ниже.',
        'Подтвердите передачу данных — UIDAI подтвердит вашу личность.',
      ],
      howToLink: 'Подробнее: как пройти через Aadhaar',
      howToTitle: 'Как пройти идентификацию через Aadhaar',
      howToIntro: 'Aadhaar eKYC — государственная цифровая идентификация в Индии. Чтобы подтвердить личность:',
      howToSteps: [
        'Установите приложение Aadhaar (mAadhaar) из App Store или Google Play.',
        'Войдите по своему номеру Aadhaar и подтвердите вход через OTP.',
        'Откройте сканер QR в приложении и наведите его на код на этом экране.',
        'Подтвердите передачу данных — UIDAI подтвердит, что это вы.',
      ],
      howToClose: 'Понятно',
    },
  },
  en: {
    entry: {
      reassure: 'Aadhaar QR is a new way to verify identity in India — it is secure and takes a couple of minutes. We will guide you step by step.',
      stepsTitle: 'How it works',
      steps: [
        'Open the Aadhaar App on your phone.',
        'Tap Scan QR and point the camera at the code below.',
        'Approve data sharing — your contacts arrive from UIDAI.',
      ],
      howToLink: 'Learn more: how to use Aadhaar',
      howToTitle: 'How to verify via Aadhaar',
      howToIntro: 'Aadhaar is India’s national digital identity. To proceed:',
      howToSteps: [
        'Install the Aadhaar App (mAadhaar) from the App Store or Google Play.',
        'Log in with your Aadhaar number and confirm via OTP.',
        'Open the QR scanner in the app and point it at the code on this screen.',
        'Approve data sharing — we will retrieve your contacts from UIDAI.',
      ],
      howToClose: 'Got it',
    },
    session: {
      reassure: 'Aadhaar QR is a new way to verify identity in India — it is secure and takes a couple of minutes. We will guide you step by step.',
      stepsTitle: 'How it works',
      steps: [
        'Open the Aadhaar App on your phone.',
        'Tap Scan QR and point the camera at the code below.',
        'Approve data sharing — UIDAI will confirm your identity.',
      ],
      howToLink: 'Learn more: how to use Aadhaar',
      howToTitle: 'How to verify via Aadhaar',
      howToIntro: 'Aadhaar eKYC is India’s national digital identity. To confirm your identity:',
      howToSteps: [
        'Install the Aadhaar App (mAadhaar) from the App Store or Google Play.',
        'Log in with your Aadhaar number and confirm via OTP.',
        'Open the QR scanner in the app and point it at the code on this screen.',
        'Approve data sharing — UIDAI will confirm it is you.',
      ],
      howToClose: 'Got it',
    },
  },
};

// Успокаивающая строка (L7) — мягкая зелёная плашка над шагами.
const Reassure = styled.p`
  margin:0; ${bodyM}; font-size:0.86rem; line-height:1.5; color:${textSecondary};
  padding:0.7rem 0.9rem; border-radius:12px;
  background:rgba(33,160,56,0.06); border:1px solid rgba(33,160,56,0.16);
`;
// Инлайн-инструкция (паттерн SPAadhaarQr): шаги кружками-токенами, ритм 1.5rem.
const StepsBlock = styled.div`display:flex; flex-direction:column; gap:0.6rem;`;
const StepsTitle = styled.p`margin:0; ${bodySBold}; font-size:0.875rem; color:${textPrimary};`;
const StepsList = styled.ol`
  margin:0; padding:0; list-style:none;
  display:flex; flex-direction:column; gap:0.55rem;
  counter-reset:aadhaar-step;
`;
const StepItem = styled.li`
  ${bodyM}; font-size:0.875rem; line-height:1.5; color:${textSecondary};
  display:flex; align-items:baseline; gap:0.65rem;
  counter-increment:aadhaar-step;
  &::before {
    content:counter(aadhaar-step);
    flex-shrink:0; width:1.5rem; height:1.5rem; border-radius:50%;
    background:rgba(33,160,56,0.1); color:rgb(33,160,56);
    font-size:0.78rem; font-weight:700;
    display:inline-flex; align-items:center; justify-content:center;
    transform:translateY(0.2rem);
  }
`;
// «Подробнее» — одна точка справки (открывает модалку-туториал).
const HowToBtn = styled.button`background:none; border:none; padding:0; color:${textAccent}; font-size:0.85rem; font-weight:600; text-decoration:underline; text-underline-offset:2px; cursor:pointer; align-self:flex-start; &:hover { opacity:0.8; }`;

const Backdrop = styled.div`position:fixed; inset:0; z-index:10010; background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; padding:2rem;`;
const Modal = styled.div`background:#fff; border-radius:12px; box-shadow:0 24px 64px rgba(0,0,0,0.4); width:min(520px,100%); max-height:80vh; overflow-y:auto; padding:2rem 2.25rem; display:flex; flex-direction:column; gap:1rem;`;
const ModalTitle = styled.h2`margin:0; font-size:1.15rem; font-weight:700; color:${textPrimary};`;
const ModalIntro = styled.p`margin:0; ${bodyM}; color:${textPrimary};`;
const ModalList = styled.ol`margin:0; padding-left:1.3rem; display:flex; flex-direction:column; gap:0.5rem; ${bodyM}; color:${textPrimary};`;
const ModalFoot = styled.div`display:flex; justify-content:flex-end; padding-top:0.5rem;`;

interface AadhaarHowToProps {
  variant?: Variant;
  // #51 — «Learn more» вынесен в кнопочный ряд панели (вторичная кнопка) рядом с «Download app».
  // Тогда инлайн-ссылку прячем (hideInlineLink) и управляем модалкой извне (howToOpen/onHowToOpenChange).
  hideInlineLink?: boolean;
  howToOpen?: boolean;
  onHowToOpenChange?: (open: boolean) => void;
}

export const AadhaarHowTo = ({ variant = 'entry', hideInlineLink, howToOpen, onHowToOpenChange }: AadhaarHowToProps) => {
  const { lang } = useLanguage();
  const t = dict[lang][variant];
  // Внутреннее состояние модалки — только в неконтролируемом режиме (инлайн-ссылка).
  const [howToInner, setHowToInner] = useState(false);
  const howTo = howToOpen ?? howToInner;
  const setHowTo = (open: boolean) => {
    if (onHowToOpenChange) onHowToOpenChange(open);
    else setHowToInner(open);
  };

  return (
    <>
      <StepsBlock>
        <Reassure>{t.reassure}</Reassure>
        <StepsTitle>{t.stepsTitle}</StepsTitle>
        <StepsList>{t.steps.map((s, i) => <StepItem key={i}>{s}</StepItem>)}</StepsList>
        {!hideInlineLink && <HowToBtn type="button" onClick={() => setHowTo(true)}>{t.howToLink}</HowToBtn>}
      </StepsBlock>

      {howTo && (
        <Backdrop onClick={() => setHowTo(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{t.howToTitle}</ModalTitle>
            <ModalIntro>{t.howToIntro}</ModalIntro>
            <ModalList>{t.howToSteps.map((s, i) => <li key={i}>{s}</li>)}</ModalList>
            <ModalFoot>
              <Button view="accent" size="m" text={t.howToClose} onClick={() => setHowTo(false)} />
            </ModalFoot>
          </Modal>
        </Backdrop>
      )}
    </>
  );
};
