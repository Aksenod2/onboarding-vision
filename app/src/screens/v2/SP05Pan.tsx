import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { Button, TextField, Note } from '@salutejs/sdds-serv'; // TODO свериться с MCP — TextField props, view="accent"
import {
  textPrimary,
  textSecondary,
  textAccent,
  bodyM,
  bodySBold,
} from '@salutejs/sdds-themes/tokens';
import { accentPanel, eyebrow, radii, enter, elevation } from '../../ui/designSystem';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { getScreening, getBusiness, setStepStatus } from '../../mock/v2/api';
import type { CheckType, CheckStatus } from '../../mock/v2/types';

// SP-05 — Ввод PAN + авто-скрининг.
// Шаг 1: TextField PAN (формат AAAAA9999A, аптокейс), демо-значение ABFPS4321K, Button «Проверить».
// Шаг 2: анимированный список проверок из getScreening(), авто-переход /v2/company.
// Роут: /v2/pan

// ─── i18n ────────────────────────────────────────────────────────────────────

const dict: Record<Lang, {
  title: string;
  subtitle: string;
  fieldLabel: string;
  fieldHint: string;
  fieldPlaceholder: string;
  cta: string;
  stepLabel: string;
  screeningTitle: string;
  screeningSubtitle: string;
  checks: Record<CheckType, string>;
  statusLabels: Record<CheckStatus, string>;
  done: string;
}> = {
  ru: {
    title: 'Введите PAN',
    subtitle: 'Укажите Permanent Account Number — мы автоматически подтянем данные вашего бизнеса из реестров.',
    fieldLabel: 'PAN',
    fieldHint: 'Формат: 5 букв, 4 цифры, 1 буква — например ABCPS1234K',
    fieldPlaceholder: 'ABFPS4321K',
    cta: 'Проверить',
    stepLabel: 'ПРОВЕРКА',
    screeningTitle: 'Подтягиваем данные из реестров…',
    screeningSubtitle: 'Это займёт несколько секунд. Пожалуйста, не закрывайте страницу.',
    checks: {
      'PAN': 'Проверка PAN в налоговой базе',
      'OFAC/Sanctions': 'Санкционный скрининг (OFAC)',
      'Probe42': 'Получение данных из Probe42',
      'CKYC': 'Центральный KYC-реестр (CKYC)',
      'Stop-42': 'Стоп-лист Stop-42',
    },
    statusLabels: {
      'Pass': 'Пройдено',
      'Alert': 'Требует внимания',
      'Fetched': 'Получено',
      'Found': 'Найдено',
      'NotFound': 'Не найдено',
    },
    done: 'Все проверки завершены',
  },
  en: {
    title: 'Enter your PAN',
    subtitle: 'Provide your Permanent Account Number — we will automatically fetch your business data from registries.',
    fieldLabel: 'PAN',
    fieldHint: 'Format: 5 letters, 4 digits, 1 letter — e.g. ABCPS1234K',
    fieldPlaceholder: 'ABFPS4321K',
    cta: 'Verify',
    stepLabel: 'VERIFICATION',
    screeningTitle: 'Fetching data from registries…',
    screeningSubtitle: 'This will take a few seconds. Please do not close this page.',
    checks: {
      'PAN': 'PAN verification (Income Tax)',
      'OFAC/Sanctions': 'Sanctions screening (OFAC)',
      'Probe42': 'Probe42 data retrieval',
      'CKYC': 'Central KYC registry (CKYC)',
      'Stop-42': 'Stop-42 watchlist',
    },
    statusLabels: {
      'Pass': 'Passed',
      'Alert': 'Alert',
      'Fetched': 'Fetched',
      'Found': 'Found',
      'NotFound': 'Not found',
    },
    done: 'All checks completed',
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

// ─── Screening list ───────────────────────────────────────────────────────────

const dotPulse = keyframes`
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%            { transform: scale(1.0); opacity: 1.0; }
`;

const ScreeningCard = styled.div`
  background: #ffffff;
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  overflow: hidden;
  ${enter(0.08)};
`;

const ScreeningHeader = styled.div`
  ${accentPanel};
  padding: 1.25rem 1.75rem 1rem;
`;

const ScreeningEyebrow = styled.div`
  ${eyebrow};
  color: ${textAccent};
  margin-bottom: 0.5rem;
`;

const ScreeningTitle = styled.h2`
  margin: 0 0 0.25rem;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.2;
  color: ${textPrimary};
`;

const ScreeningSubtitle = styled.p`
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.5;
  color: ${textSecondary};
`;

const ChecksList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
`;

interface CheckItemProps {
  $state: 'waiting' | 'loading' | 'done';
  $delay: number;
}

const itemReveal = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const CheckItem = styled.li<CheckItemProps>`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.9rem 1.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  &:last-child {
    border-bottom: none;
  }

  ${({ $state, $delay }) =>
    $state !== 'waiting' &&
    css`
      animation: ${itemReveal} 0.38s cubic-bezier(0.16, 1, 0.3, 1) ${$delay * 0.05}s both;
    `}

  opacity: ${({ $state }) => ($state === 'waiting' ? 0.35 : 1)};
  transition: opacity 0.3s;
`;

const CheckIcon = styled.span<{ $state: 'waiting' | 'loading' | 'done'; $ok: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  transition: background 0.25s, color 0.25s;

  ${({ $state, $ok }) => {
    if ($state === 'waiting') return css`background: rgba(0,0,0,0.07); color: ${textSecondary};`;
    if ($state === 'loading') return css`background: rgba(0,0,0,0.07); color: ${textSecondary};`;
    if ($ok) return css`background: rgba(33, 160, 56, 0.15); color: rgb(33, 160, 56);`;
    return css`background: rgba(200, 60, 60, 0.12); color: rgb(180, 40, 40);`;
  }}
`;

const CheckContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const CheckName = styled.span`
  ${bodySBold};
  font-size: 0.88rem;
  color: ${textPrimary};
`;

const CheckStatusBadge = styled.span<{ $ok: boolean; $visible: boolean }>`
  ${bodyM};
  font-size: 0.75rem;
  color: ${({ $ok }) => ($ok ? 'rgb(33, 160, 56)' : 'rgb(180, 40, 40)')};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.25s;
`;

const Dots = styled.span`
  display: inline-flex;
  gap: 3px;
  align-items: center;

  span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${textSecondary};
    display: inline-block;
    animation: ${dotPulse} 1.2s infinite ease-in-out;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemState = 'waiting' | 'loading' | 'done';

interface CheckRow {
  checkType: CheckType;
  status: CheckStatus;
}

const isOkStatus = (s: CheckStatus): boolean =>
  s === 'Pass' || s === 'Fetched';

// ─── Component ────────────────────────────────────────────────────────────────

export const SP05Pan = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  // Шаг 1 — ввод PAN
  const [pan, setPan] = useState('ABFPS4321K');
  const [panError, setPanError] = useState('');

  // Шаг 2 — скрининг
  const [phase, setPhase] = useState<'input' | 'screening'>('input');
  const [checks, setChecks] = useState<CheckRow[]>([]);
  const [itemStates, setItemStates] = useState<ItemState[]>([]);
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

    // (loading state removed — free-check mode)

    // Параллельно грузим скрининг и данные бизнеса (getBusiness нужен для следующего экрана)
    const [screeningData] = await Promise.all([
      getScreening(),
      getBusiness(),
    ]);

    const rows: CheckRow[] = screeningData.map((s) => ({
      checkType: s.checkType,
      status: s.status,
    }));

    setChecks(rows);
    setItemStates(rows.map(() => 'waiting'));
    setPhase('screening');

    // Анимируем проверки по очереди: loading → done с задержкой 600ms на каждую
    const STEP_MS = 650;

    rows.forEach((_, idx) => {
      const loadTimer = setTimeout(() => {
        setItemStates((prev) => {
          const next = [...prev];
          next[idx] = 'loading';
          return next;
        });
      }, idx * STEP_MS);

      const doneTimer = setTimeout(() => {
        setItemStates((prev) => {
          const next = [...prev];
          next[idx] = 'done';
          return next;
        });
      }, idx * STEP_MS + 420);

      timersRef.current.push(loadTimer, doneTimer);
    });

    // Авто-переход после того как все проверки «загорятся»
    const totalMs = rows.length * STEP_MS + 600;
    const navTimer = setTimeout(async () => {
      try { await setStepStatus('pan', 'done'); } catch (_) { /* игнорируем */ }
      navigate('/v2/company');
    }, totalMs);
    timersRef.current.push(navTimer);
  };

  return (
    <ScreenV2 maxWidth="560px">
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

            <Button
              view="accent"
              size="l"
              text={t.cta}
              onClick={handleVerify}
            />
          </CardBody>
        </Card>
      )}

      {phase === 'screening' && (
        <ScreeningCard>
          <ScreeningHeader>
            <ScreeningEyebrow>{t.stepLabel}</ScreeningEyebrow>
            <ScreeningTitle>{t.screeningTitle}</ScreeningTitle>
            <ScreeningSubtitle>{t.screeningSubtitle}</ScreeningSubtitle>
          </ScreeningHeader>

          <ChecksList>
            {checks.map((row, idx) => {
              const state = itemStates[idx] ?? 'waiting';
              const ok = isOkStatus(row.status);
              return (
                <CheckItem key={row.checkType} $state={state} $delay={idx}>
                  <CheckIcon $state={state} $ok={ok}>
                    {state === 'waiting' && '○'}
                    {state === 'loading' && <Dots><span /><span /><span /></Dots>}
                    {state === 'done' && (ok ? '✓' : '!')}
                  </CheckIcon>

                  <CheckContent>
                    <CheckName>{t.checks[row.checkType]}</CheckName>
                    <CheckStatusBadge $ok={ok} $visible={state === 'done'}>
                      {t.statusLabels[row.status]}
                    </CheckStatusBadge>
                  </CheckContent>
                </CheckItem>
              );
            })}
          </ChecksList>
        </ScreeningCard>
      )}
    </ScreenV2>
  );
};
