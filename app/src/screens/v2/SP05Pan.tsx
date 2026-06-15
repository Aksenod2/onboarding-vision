import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Button, TextField, Note, Checkbox } from '@salutejs/sdds-serv'; // TODO свериться с MCP — TextField / Checkbox props, view="accent"
import {
  textPrimary,
  textSecondary,
  textAccent,
  bodyM,
} from '@salutejs/sdds-themes/tokens';
import { accentPanel, eyebrow, radii, enter, elevation } from '../../ui/designSystem';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { getBusiness, giveConsent, setStepStatus } from '../../mock/v2/api';

// SP-05 — Согласие на доступ к реестрам + ввод PAN (объединённый экран, решение Дениса 2026-06-09).
// Шаг 1: галочка-согласие (Registry Access) + TextField PAN (формат AAAAA9999A), CTA «Разрешить и продолжить».
// Шаг 2: нейтральный индикатор загрузки (без перечисления проверок/источников), авто-переход /v2/company.
// Роут: /v2/pan (бывший /v2/registry редиректится сюда).

// ─── i18n ────────────────────────────────────────────────────────────────────

const dict: Record<Lang, {
  title: string;
  subtitle: string;
  consentLabel: string;
  consentDescription: string;
  fieldLabel: string;
  fieldHint: string;
  fieldPlaceholder: string;
  cta: string;
  stepLabel: string;
  verifyTitle: string;
  verifySubtitle: string;
}> = {
  ru: {
    title: 'Доступ к реестрам и PAN',
    subtitle: 'Разрешите запрос данных из реестров и укажите PAN — мы автоматически проверим и заполним данные вашего бизнеса.',
    consentLabel: 'Разрешаю запрашивать данные из реестров',
    consentDescription: 'Я даю согласие на получение сведений из PAN-базы Налогового департамента и реестра CKYC в целях верификации при открытии счёта.',
    fieldLabel: 'PAN',
    fieldHint: 'Формат: 5 букв, 4 цифры, 1 буква — например ABCPS1234K',
    fieldPlaceholder: 'ABFPS4321K',
    cta: 'Разрешить и продолжить',
    stepLabel: 'ПРОВЕРКА',
    verifyTitle: 'Проверяем ваши данные…',
    verifySubtitle: 'Это займёт несколько секунд. Пожалуйста, не закрывайте страницу.',
  },
  en: {
    title: 'Registry access & PAN',
    subtitle: 'Allow us to query the registries and provide your PAN — we will verify and pre-fill your business details automatically.',
    consentLabel: 'Allow registry data queries',
    consentDescription: 'I consent to retrieving data from the Income Tax PAN database and the CKYC registry for the purpose of account-opening verification.',
    fieldLabel: 'PAN',
    fieldHint: 'Format: 5 letters, 4 digits, 1 letter — e.g. ABCPS1234K',
    fieldPlaceholder: 'ABFPS4321K',
    cta: 'Allow and continue',
    stepLabel: 'VERIFICATION',
    verifyTitle: 'Verifying your details…',
    verifySubtitle: 'This will take a few seconds. Please do not close this page.',
  },
};

// ─── PAN validation ───────────────────────────────────────────────────────────

// Формат: AAAAA9999A — 5 букв, 4 цифры, 1 буква (regex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// 4-й символ PAN определяет тип: 'P' = Individual/Sole Proprietor, прочие — компании.
// Sole Proprietor используют Personal PAN ('P').
const getPanEntityType = (pan: string): { ru: string; en: string } | null => {
  if (pan.length < 4) return null;
  const ch = pan[3].toUpperCase();
  if (ch === 'P') return { ru: 'Sole Proprietorship', en: 'Sole Proprietorship' };
  if (ch === 'C') return { ru: 'Компания (Company)', en: 'Company' };
  if (ch === 'H') return { ru: 'HUF', en: 'HUF' };
  if (ch === 'F') return { ru: 'Партнёрство (Firm)', en: 'Firm / Partnership' };
  if (ch === 'T') return { ru: 'Траст (Trust)', en: 'Trust' };
  return null;
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

const CardTitle = styled.h1`
  margin: 0 0 0.35rem;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: ${textPrimary};
`;

const CardSubtitle = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${textSecondary};
`;

const CardBody = styled.div`
  padding: 1.75rem 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const ConsentRow = styled.div`
  ${enter(0.12)};
  padding: 1rem 1.1rem;
  border: 1.5px solid rgba(33, 160, 56, 0.25);
  border-radius: ${radii.panel};
  background: rgba(33, 160, 56, 0.03);
`;

// Кнопка «Продолжить» — у правого края (правило Дениса 2026-06-09)
const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const FieldHint = styled.p`
  margin: -0.5rem 0 0;
  ${bodyM};
  color: ${textSecondary};
  font-size: 0.8rem;
`;

const PanTypeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  border-radius: 0.5rem;
  background: rgba(33, 160, 56, 0.1);
  border: 1px solid rgba(33, 160, 56, 0.22);
  font-size: 0.8rem;
  font-weight: 600;
  color: rgb(33, 160, 56);
  align-self: flex-start;
  ${enter(0.06)};

  span.label {
    color: ${textSecondary};
    font-weight: 400;
    margin-right: 0.15rem;
  }
`;

// ─── Verifying state (нейтральный индикатор) ───────────────────────────────────

const VerifyCard = styled.div`
  background: #ffffff;
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  overflow: hidden;
  ${enter(0.08)};
`;

const VerifyHeader = styled.div`
  ${accentPanel};
  padding: 1.25rem 1.75rem 1rem;
`;

const VerifyEyebrow = styled.div`
  ${eyebrow};
  color: ${textAccent};
  margin-bottom: 0.5rem;
`;

const VerifyTitle = styled.h2`
  margin: 0 0 0.25rem;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.2;
  color: ${textPrimary};
`;

const VerifySubtitle = styled.p`
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.5;
  color: ${textSecondary};
`;

const VerifyBody = styled.div`
  padding: 2.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Spinner = styled.span`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid rgba(33, 160, 56, 0.18);
  border-top-color: rgb(33, 160, 56);
  animation: ${spin} 0.9s linear infinite;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const SP05Pan = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  // Шаг 1 — согласие на реестры + ввод PAN
  const [consent, setConsent] = useState(false);
  const [pan, setPan] = useState('ABFPS4321K');
  const [panError, setPanError] = useState('');

  // Шаг 2 — проверка данных
  const [phase, setPhase] = useState<'input' | 'verifying'>('input');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Очищаем таймеры при размонтировании
  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout); };
  }, []);

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setPan(val);
    if (panError) setPanError('');
  };

  const handleVerify = async () => {
    // Режим свободной проверки: валидация PAN не блокирует переход
    if (!PAN_REGEX.test(pan)) {
      setPanError(
        lang === 'ru'
          ? 'Неверный формат PAN. Пример: ABCPS1234K'
          : 'Invalid PAN format. Example: ABCPS1234K',
      );
      // не return — продолжаем
    }

    // Фиксируем согласие на доступ к реестрам (объединено с PAN на этом экране)
    try { await giveConsent('Registry Access', new Date().toISOString()); } catch (_) { /* игнорируем */ }

    // Подгружаем данные бизнеса (нужны для следующего экрана)
    await getBusiness();

    setPhase('verifying');

    // Нейтральная пауза с индикатором, затем авто-переход
    const navTimer = setTimeout(async () => {
      try { await setStepStatus('pan', 'done'); } catch (_) { /* игнорируем */ }
      navigate('/v2/aadhaar-qr'); // PAN → Aadhaar eKYC (личность владельца), затем анкета
    }, 2400);
    timersRef.current.push(navTimer);
  };

  return (
    <ScreenV2>
      {phase === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
            <CardSubtitle>{t.subtitle}</CardSubtitle>
          </CardHeader>

          <CardBody>
            {/* TODO свериться с MCP — TextField: label, value, onChange */}
            <TextField
              label={t.fieldLabel}
              value={pan}
              onChange={handlePanChange}
              placeholder={t.fieldPlaceholder}
            />
            {(() => {
              const entityType = getPanEntityType(pan);
              return entityType ? (
                <PanTypeBadge>
                  <span className="label">
                    {lang === 'ru' ? 'Тип:' : 'Type:'}
                  </span>
                  {lang === 'ru' ? entityType.ru : entityType.en}
                </PanTypeBadge>
              ) : null;
            })()}
            {panError
              ? <Note view="negative" size="s" title={panError} text="" />
              : <FieldHint>{t.fieldHint}</FieldHint>
            }

            {/* Согласие на реестры — всегда внизу, перед кнопкой; гейтит CTA */}
            {/* TODO свериться с MCP — Checkbox: label / description / checked / onChange */}
            <ConsentRow>
              <Checkbox
                label={t.consentLabel}
                description={t.consentDescription}
                checked={consent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConsent(e.target.checked)
                }
              />
            </ConsentRow>

            <ButtonRow>
              <Button
                view="accent"
                size="l"
                text={t.cta}
                disabled={!consent}
                onClick={handleVerify}
              />
            </ButtonRow>
          </CardBody>
        </Card>
      )}

      {phase === 'verifying' && (
        <VerifyCard>
          <VerifyHeader>
            <VerifyEyebrow>{t.stepLabel}</VerifyEyebrow>
            <VerifyTitle>{t.verifyTitle}</VerifyTitle>
            <VerifySubtitle>{t.verifySubtitle}</VerifySubtitle>
          </VerifyHeader>

          <VerifyBody>
            <Spinner />
          </VerifyBody>
        </VerifyCard>
      )}
    </ScreenV2>
  );
};
