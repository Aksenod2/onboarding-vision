import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
// TODO свериться с MCP — Button, TextField, Select, Note
import { Button, TextField, Select, Note } from '@salutejs/sdds-serv';
import {
  textPrimary,
  textSecondary,
  textAccent,
  bodyM,
  bodySBold,
} from '@salutejs/sdds-themes/tokens';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import {
  getBnq,
  answerBnq,
  setStepStatus,
} from '../../mock/v2/api';
import type { BnqAnswer } from '../../mock/v2/types';
import {
  elevation,
  enter,
  radii,
} from '../../ui/designSystem';

// SP-07 — BNQ-опросник Q1–Q11 (Sole Proprietor)
// Роут: /v2/bnq

// ─── Типы ────────────────────────────────────────────────────────────────────

// Индекс активного вопроса с учётом пропуска Q10/Q11 при Q9=No
type QIndex = number;

// ─── Словарь ─────────────────────────────────────────────────────────────────

const dict: Record<Lang, {
  title: string;
  subtitle: string;
  stepOf: (cur: number, total: number) => string;
  probeConfirm: (value: string) => string;
  yes: string;
  change: string;
  next: string;
  back: string;
  finish: string;
  uploading: string;
  uploaded: string;
  uploadBtn: string;
  uploadLater: string;
  uploadNow: string;
  // Q1
  q1Label: string;
  q1IndustryField: string;
  q1SegmentLabel: string;
  // Q2
  q2Label: string;
  // Q3
  q3Label: string;
  q3Opt1: string;
  q3Opt2: string;
  // Q4
  q4Label: string;
  q4Opt1: string;
  q4Opt2: string;
  q4Opt3: string;
  // Q5
  q5Label: string;
  q5Yes: string;
  q5No: string;
  // Q6
  q6Label: string;
  q6Hint: string;
  // Q7
  q7Label: string;
  q7Yes: string;
  q7No: string;
  // Q8
  q8Label: string;
  q8Hint: string;
  // Q9
  q9Label: string;
  q9Opt1: string;
  q9Opt2: string;
  q9Opt3: string;
  q9Opt4: string;
  // Q10
  q10Label: string;
  q10Hint: string;
  // Q11
  q11Label: string;
  q11Disclaimer: string;
  // DVU alert note
  dvuNote: string;
}> = {
  ru: {
    title: 'Бизнес-анкета',
    subtitle: 'Ответьте на несколько вопросов о вашем бизнесе',
    stepOf: (c, t) => `Вопрос ${c} из ${t}`,
    probeConfirm: (v) => `Мы определили: ${v}. Верно?`,
    yes: 'Да, верно',
    change: 'Изменить',
    next: 'Далее',
    back: 'Назад',
    finish: 'Завершить анкету',
    uploading: 'Загружаем...',
    uploaded: 'Загружено ✓',
    uploadBtn: 'Загрузить документ',
    uploadLater: 'Загружу позже',
    uploadNow: 'Загрузить сейчас',
    q1Label: 'В какой отрасли работает ваш бизнес?',
    q1IndustryField: 'Отрасль',
    q1SegmentLabel: 'Сегмент',
    q2Label: 'Укажите дату регистрации бизнеса',
    q3Label: 'Подтвердите статус резидентности вашей компании',
    q3Opt1: 'Компания является резидентом Индии',
    q3Opt2: 'Компания является нерезидентом (иностранная)',
    q4Label: 'Подтвердите ваш налоговый статус',
    q4Opt1: 'Гражданин Индии / Иностранный гражданин на рабочей визе',
    q4Opt2: 'NRI / OCI / Гражданин РФ не на рабочей визе',
    q4Opt3: 'Иностранный гражданин (другой)',
    q5Label:
      'Занимаете ли вы или ваши близкие родственники (в течение последних 5 лет) публичные должности (госслужащий, судья, военный руководитель)?',
    q5Yes: 'Да',
    q5No: 'Нет',
    q6Label: 'Укажите чистую выручку за последний год',
    q6Hint: 'Введите сумму в крорах (Cr)',
    q7Label:
      'Планируете ли вы в течение 6 месяцев воспользоваться кредитными продуктами нашего банка (срочные кредиты, аккредитивы, банковские гарантии)?',
    q7Yes: 'Да, планирую',
    q7No: 'Нет, не планирую',
    q8Label: 'Какая приблизительная сумма кредита вам потребуется?',
    q8Hint: 'Введите сумму в крорах (Cr)',
    q9Label: 'Занимается ли ваша компания импортом или экспортом?',
    q9Opt1: 'Да — только экспорт',
    q9Opt2: 'Да — только импорт',
    q9Opt3: 'Да — и импорт, и экспорт',
    q9Opt4: 'Нет, не занимаюсь импортом и экспортом',
    q10Label:
      'Из каких стран ваши партнёры по импорту / экспорту? (перечислите через запятую)',
    q10Hint: 'Например: Russia, UAE, China',
    q11Label: 'Документ IEC (Importer Exporter Code)',
    q11Disclaimer:
      '⚠️ Для обработки международных платежей и торговых операций SBER Банк требует ваш IEC в соответствии с нормами FEMA. Без действительного IEC мы не сможем обработать ваши трансграничные платежи. Вы можете загрузить IEC сейчас или позже в интернет-банке после открытия счёта. Загрузка позже не влияет на открытие счёта, но мы рекомендуем загрузить сейчас.',
    dvuNote: 'Информация передана на проверку (DVU). Мы уведомим вас о результатах.',
  },
  en: {
    title: 'Business Questionnaire',
    subtitle: 'Please answer a few questions about your business',
    stepOf: (c, t) => `Question ${c} of ${t}`,
    probeConfirm: (v) => `We have identified: ${v}. Is that correct?`,
    yes: 'Yes, correct',
    change: 'Change',
    next: 'Next',
    back: 'Back',
    finish: 'Complete questionnaire',
    uploading: 'Uploading...',
    uploaded: 'Uploaded ✓',
    uploadBtn: 'Upload document',
    uploadLater: 'Upload later',
    uploadNow: 'Upload now',
    q1Label: 'What industry is your business in?',
    q1IndustryField: 'Industry',
    q1SegmentLabel: 'Segment',
    q2Label: 'What is the date of commencement of your business?',
    q3Label: 'Please confirm the residency status for your company',
    q3Opt1: 'Company is an Indian resident',
    q3Opt2: 'Company is a foreign resident outside India',
    q4Label: 'Please confirm your tax residency',
    q4Opt1: 'Indian National / Foreign national on employment VISA',
    q4Opt2: 'NRI / OCI / Foreign national of RF not on employment VISA',
    q4Opt3: 'Foreign national (other)',
    q5Label:
      'Do you or your close relatives hold or have held in the past 5 years any public positions (government officials, judges, military executives)?',
    q5Yes: 'Yes',
    q5No: 'No',
    q6Label: 'What is your Net Revenue for the last year?',
    q6Hint: 'Enter amount in crore (Cr)',
    q7Label:
      'Do you plan to avail any credit facilities (term loans, letters of credit, bank guarantees) from our bank in the next 6 months?',
    q7Yes: 'Yes, planning',
    q7No: 'No, not planning',
    q8Label: 'What is the approximate credit amount you would require?',
    q8Hint: 'Enter amount in crore (Cr)',
    q9Label: 'Do you deal in Import or Export Activities?',
    q9Opt1: 'Yes, I deal in export activities only',
    q9Opt2: 'Yes, I deal in import activities only',
    q9Opt3: 'Yes, I deal in both import and export',
    q9Opt4: 'No, I don\'t deal in import or export',
    q10Label:
      'What countries are your import / export partners from? (list separated by commas)',
    q10Hint: 'E.g.: Russia, UAE, China',
    q11Label: 'IEC Document (Importer Exporter Code)',
    q11Disclaimer:
      '⚠️ For processing international payments and trade transactions, your IEC is required by SberBank under FEMA regulations. Without a valid IEC, we may not be able to process your cross-border payments. You can upload your IEC document now, or upload it later through the online bank after account opening. Upload-later will not affect account opening, although we recommend uploading now.',
    dvuNote: 'Information has been forwarded for DVU review. We will notify you of the results.',
  },
};

// ─── Данные справочников ──────────────────────────────────────────────────────

const INDUSTRIES = [
  'Employee', 'Government Department', 'Government Owned Company',
  'Regulatory & Statutory Body', 'Banking', 'Manufacturing',
  'Advertising', 'Aviation', 'Ports & Shipping', 'Clearing',
  'Consulting', 'Construction', 'Maintenance Repair & Operations',
  'Oil & Gas', 'Trading', 'Tourism & Hospitality', 'Diplomat',
  'ITES', 'Fintech & Financial Services',
  'International Job placement agencies', 'Tobacco', 'Casino',
  'Night Club', 'Arms', 'Antiques', 'Explosives', 'Consulates',
  'Online Lotteries', 'Telemarketers', 'Offshore entities', 'FFMC',
  'Share broker', 'NBFC', 'Liquor', 'Gems and Jewellery', 'Other',
];

// ─── Styled Components ────────────────────────────────────────────────────────

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  ${enter(0.04)};
`;

const ProgressBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

// Подчинённый счётчик вопросов — намеренно тише верхнего StepProgress:
// без капса, без жирного, мелкий серый текст.
const ProgressLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.4;
  color: ${textSecondary};
`;

// Тонкая нейтральная полоса — другой паттерн (не зелёный textAccent как в StepProgress).
const ProgressTrack = styled.div`
  height: 2px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.28);
  width: ${({ $pct }) => $pct}%;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  ${enter(0.1)};

  @media (max-width: 640px) {
    padding: 1.25rem;
  }
`;

const CardTitle = styled.h1`
  margin: 0;
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

const QBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  /* Фиксированная высота блока вопроса — карточка не «прыгает» между вопросами
     (взято по самому высокому вопросу — Q11 с дисклеймером). Решение Дениса 2026-06-09. */
  min-height: 240px;
`;

const QLabel = styled.p`
  margin: 0;
  ${bodySBold};
  font-size: 1rem;
  color: ${textPrimary};
  line-height: 1.5;
`;

const ProbeLine = styled.p`
  margin: 0;
  ${bodyM};
  font-size: 0.9rem;
  color: ${textSecondary};
  line-height: 1.5;
`;

const ProbeValue = styled.span`
  color: ${textAccent};
  font-weight: 700;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RadioOption = styled.label<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: ${radii.panel};
  border: 1.5px solid ${({ $selected }) => ($selected ? textAccent : 'rgba(0,0,0,0.10)')};
  background: ${({ $selected }) => ($selected ? `rgba(33,160,56,0.06)` : '#fafafa')};
  cursor: pointer;
  ${bodyM};
  color: ${textPrimary};
  transition: border-color 0.18s, background 0.18s;

  &:hover {
    border-color: ${textAccent};
  }
`;

const RadioDot = styled.span<{ $selected: boolean }>`
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${({ $selected }) => ($selected ? textAccent : 'rgba(0,0,0,0.22)')};
  background: ${({ $selected }) => ($selected ? textAccent : 'transparent')};
  position: relative;
  transition: all 0.18s;

  &::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: #fff;
    display: ${({ $selected }) => ($selected ? 'block' : 'none')};
  }
`;

const DisclaimerBox = styled.div`
  background: rgba(255, 180, 0, 0.06);
  border: 1.5px solid rgba(255, 180, 0, 0.28);
  border-radius: ${radii.panel};
  padding: 1rem 1.25rem;
`;

const DisclaimerText = styled.p`
  margin: 0;
  ${bodyM};
  color: ${textPrimary};
  font-size: 0.875rem;
  line-height: 1.55;
`;

const NavRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.5rem;
`;

const ConfirmRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

// ─── Вспомогательная функция ──────────────────────────────────────────────────

/**
 * Из массива BnqAnswer[11] строим «плоский» порядок шагов.
 * Решение Дениса 2026-06-09: вопросы с данными из реестра (source='available') НЕ скрываем,
 * а показываем предзаполненными для подтверждения («Мы определили: X. Верно?» — режим в renderQuestion).
 * Единственное ветвление: Q10/Q11 убираем, если Q9 отвечен «No» (нет ВЭД).
 * Возвращаем массив индексов (0-based) исходного массива.
 */
function buildStepOrder(bnq: BnqAnswer[], q9SkipTradeBloc: boolean): QIndex[] {
  const order: QIndex[] = [];
  for (let i = 0; i < bnq.length; i++) {
    const q = bnq[i].q;
    if (q9SkipTradeBloc && (q === 'Q10' || q === 'Q11')) continue;
    order.push(i);
  }
  return order;
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export const SP07Bnq = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  // BNQ data
  const [bnq, setBnq] = useState<BnqAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  // Навигация по шагам
  const [stepIdx, setStepIdx] = useState(0); // индекс в stepOrder[]
  const [q9SkipTrade, setQ9SkipTrade] = useState(false);

  // Локальные ответы (до answerBnq)
  const [localValue, setLocalValue] = useState('');
  const [editingProbe, setEditingProbe] = useState(false);

  // Доп. поля Q1
  const [industryVal, setIndustryVal] = useState('');
  const [segmentVal, setSegmentVal] = useState('');

  // Доп. Q11 — намерение по IEC (сам файл грузится на «Подтверждении данных компании»)
  const [iecChoice, setIecChoice] = useState<'now' | 'later' | ''>('');

  // DVU / CRM алерт (тихий, после Q5 PEP=Yes)
  const [showDvuNote, setShowDvuNote] = useState(false);

  // Сохранение ответа (чтобы не вызывать answerBnq дважды)
  const answeredSteps = useRef<Set<number>>(new Set());

  // ─── Загрузка BNQ ───────────────────────────────────────────────────────────

  useEffect(() => {
    getBnq().then((data) => {
      setBnq(data);
      setLoading(false);
    });
  }, []);

  // ─── Порядок шагов ──────────────────────────────────────────────────────────

  const stepOrder = buildStepOrder(bnq, q9SkipTrade);
  const totalSteps = stepOrder.length;
  const currentBnqIdx = stepOrder[stepIdx] ?? 0;
  const currentQ = bnq[currentBnqIdx];

  // При переходе к новому вопросу — сбрасываем поля ввода
  useEffect(() => {
    if (!currentQ) return;
    setLocalValue(currentQ.value ?? '');
    setEditingProbe(false);
    // Предзаполняем поля из данных Probe42, чтобы клиент правил, а не вводил заново.
    if (currentQ.q === 'Q1') setIndustryVal(currentQ.value ?? '');
  }, [stepIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Обработка ответа ───────────────────────────────────────────────────────

  const handleAnswer = async (value: string) => {
    if (!currentQ) return;
    if (answeredSteps.current.has(stepIdx)) return;
    answeredSteps.current.add(stepIdx);

    await answerBnq(currentQ.q, value);

    // Ветвление Q9: если «No» — пропускаем Q10/Q11
    if (currentQ.q === 'Q9') {
      const isNo = value.toLowerCase().startsWith('no') || value === 'Q9_NO';
      setQ9SkipTrade(isNo);
    }

    // Q5 PEP=Yes → тихий DVU-алерт
    if (currentQ.q === 'Q5' && value.toLowerCase() === 'yes') {
      setShowDvuNote(true);
      // Скрываем через 5 с
      setTimeout(() => setShowDvuNote(false), 5000);
    }

    setBnq((prev) =>
      prev.map((a) =>
        a.q === currentQ.q ? { ...a, value, source: 'not_available' } : a,
      ),
    );
  };

  // ─── Переход «Далее» ────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (!currentQ) return;

    // Если source=available и подтверждено probe — просто идём дальше
    const value =
      currentQ.source === 'available' && !editingProbe
        ? currentQ.value
        : localValue;

    // Режим свободной проверки: сохраняем ответ только если он есть, не блокируем переход
    if (value && !answeredSteps.current.has(stepIdx)) {
      try { await handleAnswer(value); } catch (_) { /* игнорируем */ }
    }

    const isLast = stepIdx === totalSteps - 1;
    if (isLast) {
      try { await setStepStatus('bnq', 'done'); } catch (_) { /* игнорируем */ }
      navigate('/v2/data-consents');
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };


  // ─── Upload mock ────────────────────────────────────────────────────────────

  // ─── Рендер вопроса ─────────────────────────────────────────────────────────

  // Заголовок (формулировка) каждого вопроса — единый источник для probe и редактирования.
  const Q_TITLE: Record<string, string> = {
    Q1: t.q1Label, Q2: t.q2Label, Q3: t.q3Label, Q4: t.q4Label,
    Q5: t.q5Label, Q6: t.q6Label, Q7: t.q7Label, Q8: t.q8Label,
    Q9: t.q9Label, Q10: t.q10Label, Q11: t.q11Label,
  };

  const renderQuestion = () => {
    if (!currentQ) return null;
    const { q, source, value } = currentQ;

    // ── Двойной сценарий: Probe подтянул ──────────────────────────────────────
    if (source === 'available' && !editingProbe) {
      const labelParts = t.probeConfirm(value).split(value);
      return (
        <QBlock>
          {/* Заголовок вопроса — чтобы было понятно, ЧТО подтверждаем */}
          <QLabel>{Q_TITLE[q]}</QLabel>
          <ProbeLine>
            {labelParts[0]}
            <ProbeValue>{value}</ProbeValue>
            {labelParts[1]}
          </ProbeLine>
        </QBlock>
      );
    }

    // ── Q1: Отрасль + Сегмент + Business Licence ────────────────────────────
    if (q === 'Q1') {
      return (
        <QBlock>
          <QLabel>{t.q1Label}</QLabel>
          {/* TODO свериться с MCP — Select items prop */}
          <Select
            value={industryVal}
            onChange={(v: string) => {
              setIndustryVal(v);
              if (segmentVal) {
                setLocalValue(`${v} / ${segmentVal}`);
              }
            }}
            label={t.q1IndustryField}
            items={INDUSTRIES.map((v) => ({ value: v, label: v }))}
          />
          {/* TODO свериться с MCP — Select items prop */}
          <Select
            value={segmentVal}
            onChange={(v: string) => {
              setSegmentVal(v);
              if (industryVal) {
                setLocalValue(`${industryVal} / ${v}`);
              }
            }}
            label={t.q1SegmentLabel}
            items={INDUSTRIES.map((v) => ({ value: v, label: v }))}
          />
          {/* Загрузка Business Licence перенесена на «Подтверждение данных компании»
              (решение Дениса 2026-06-09): документы собираем в одной точке, не по ходу анкеты. */}
        </QBlock>
      );
    }

    // ── Q2: Дата регистрации ─────────────────────────────────────────────────
    if (q === 'Q2') {
      return (
        <QBlock>
          <QLabel>{t.q2Label}</QLabel>
          {/* TODO свериться с MCP — TextField type="date" */}
          <TextField
            type="date"
            value={localValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLocalValue(e.target.value)
            }
          />
        </QBlock>
      );
    }

    // ── Q3: Резидентность компании ───────────────────────────────────────────
    if (q === 'Q3') {
      const opts = [t.q3Opt1, t.q3Opt2];
      return (
        <QBlock>
          <QLabel>{t.q3Label}</QLabel>
          <RadioGroup>
            {opts.map((opt) => (
              <RadioOption
                key={opt}
                $selected={localValue === opt}
                onClick={() => setLocalValue(opt)}
              >
                <RadioDot $selected={localValue === opt} />
                {opt}
              </RadioOption>
            ))}
          </RadioGroup>
          {localValue === t.q3Opt2 && (
            <Note
              view="negative"
              size="s"
              title={lang === 'ru' ? 'Внимание' : 'Notice'}
              text={
                lang === 'ru'
                  ? 'Нерезидентный статус направлен на проверку (DVU). Продолжение возможно после подтверждения.'
                  : 'Non-resident status flagged for DVU review. You may continue — DVU will verify.'
              }
            />
          )}
        </QBlock>
      );
    }

    // ── Q4: Налоговый статус физлица ─────────────────────────────────────────
    if (q === 'Q4') {
      const opts = [t.q4Opt1, t.q4Opt2, t.q4Opt3];
      return (
        <QBlock>
          <QLabel>{t.q4Label}</QLabel>
          <RadioGroup>
            {opts.map((opt) => (
              <RadioOption
                key={opt}
                $selected={localValue === opt}
                onClick={() => setLocalValue(opt)}
              >
                <RadioDot $selected={localValue === opt} />
                {opt}
              </RadioOption>
            ))}
          </RadioGroup>
        </QBlock>
      );
    }

    // ── Q5: PEP ──────────────────────────────────────────────────────────────
    if (q === 'Q5') {
      return (
        <QBlock>
          <QLabel>{t.q5Label}</QLabel>
          <RadioGroup>
            {[t.q5Yes, t.q5No].map((opt) => (
              <RadioOption
                key={opt}
                $selected={localValue === opt}
                onClick={() => setLocalValue(opt)}
              >
                <RadioDot $selected={localValue === opt} />
                {opt}
              </RadioOption>
            ))}
          </RadioGroup>
        </QBlock>
      );
    }

    // ── Q6: Net Revenue ──────────────────────────────────────────────────────
    if (q === 'Q6') {
      return (
        <QBlock>
          <QLabel>{t.q6Label}</QLabel>
          {/* TODO свериться с MCP — TextField rightHelper */}
          <TextField
            value={localValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLocalValue(e.target.value)
            }
            label={t.q6Hint}
            type="text"
            inputMode="decimal"
          />
        </QBlock>
      );
    }

    // ── Q7: Кредитные продукты ───────────────────────────────────────────────
    if (q === 'Q7') {
      return (
        <QBlock>
          <QLabel>{t.q7Label}</QLabel>
          <RadioGroup>
            {[t.q7Yes, t.q7No].map((opt) => (
              <RadioOption
                key={opt}
                $selected={localValue === opt}
                onClick={() => setLocalValue(opt)}
              >
                <RadioDot $selected={localValue === opt} />
                {opt}
              </RadioOption>
            ))}
          </RadioGroup>
        </QBlock>
      );
    }

    // ── Q8: Сумма кредита ────────────────────────────────────────────────────
    if (q === 'Q8') {
      return (
        <QBlock>
          <QLabel>{t.q8Label}</QLabel>
          <TextField
            value={localValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLocalValue(e.target.value)
            }
            label={t.q8Hint}
            type="text"
            inputMode="decimal"
          />
        </QBlock>
      );
    }

    // ── Q9: Импорт/Экспорт ───────────────────────────────────────────────────
    if (q === 'Q9') {
      const opts = [t.q9Opt1, t.q9Opt2, t.q9Opt3, t.q9Opt4];
      return (
        <QBlock>
          <QLabel>{t.q9Label}</QLabel>
          <RadioGroup>
            {opts.map((opt) => (
              <RadioOption
                key={opt}
                $selected={localValue === opt}
                onClick={() => setLocalValue(opt)}
              >
                <RadioDot $selected={localValue === opt} />
                {opt}
              </RadioOption>
            ))}
          </RadioGroup>
        </QBlock>
      );
    }

    // ── Q10: Страны партнёры ─────────────────────────────────────────────────
    if (q === 'Q10') {
      return (
        <QBlock>
          <QLabel>{t.q10Label}</QLabel>
          <TextField
            value={localValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLocalValue(e.target.value)
            }
            label={t.q10Hint}
            type="text"
          />
        </QBlock>
      );
    }

    // ── Q11: IEC + дисклеймер ────────────────────────────────────────────────
    if (q === 'Q11') {
      return (
        <QBlock>
          <QLabel>{t.q11Label}</QLabel>
          <DisclaimerBox>
            <DisclaimerText>{t.q11Disclaimer}</DisclaimerText>
          </DisclaimerBox>
          <RadioGroup>
            <RadioOption
              $selected={iecChoice === 'now'}
              onClick={() => {
                setIecChoice('now');
                setLocalValue('Upload Now');
              }}
            >
              <RadioDot $selected={iecChoice === 'now'} />
              {t.uploadNow}
            </RadioOption>
            <RadioOption
              $selected={iecChoice === 'later'}
              onClick={() => {
                setIecChoice('later');
                setLocalValue('Upload Later');
              }}
            >
              <RadioDot $selected={iecChoice === 'later'} />
              {t.uploadLater}
            </RadioOption>
          </RadioGroup>
          {/* Сам файл IEC грузится на «Подтверждении данных компании» — здесь только намерение (сейчас/позже). */}
        </QBlock>
      );
    }

    // Fallback (не должно случиться)
    return (
      <QBlock>
        <QLabel>{q}</QLabel>
        <TextField
          value={localValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLocalValue(e.target.value)
          }
          label={currentQ.attribute}
          type="text"
        />
      </QBlock>
    );
  };

  // ─── Loading state ───────────────────────────────────────────────────────────

  if (loading || !currentQ) {
    return (
      <ScreenV2>
        <Wrap>
          <Card>
            <CardTitle>{lang === 'ru' ? 'Загружаем анкету...' : 'Loading questionnaire...'}</CardTitle>
          </Card>
        </Wrap>
      </ScreenV2>
    );
  }

  // ─── Нужно ли показывать кнопку «Далее» или только «Да/Изменить» ─────────

  const isProbeAvailable =
    currentQ.source === 'available' && !editingProbe;

  const isLastStep = stepIdx === totalSteps - 1;

  // ─── Прогресс (отображаем «видимый» номер — с учётом пропуска) ───────────

  const visibleStepNum = stepIdx + 1;

  return (
    <ScreenV2>
      <Wrap>
        {/* Прогресс по вопросам анкеты — подчинён верхнему StepProgress */}
        <ProgressBar>
          <ProgressLabel>{t.stepOf(visibleStepNum, totalSteps)}</ProgressLabel>
          <ProgressTrack>
            <ProgressFill $pct={(visibleStepNum / totalSteps) * 100} />
          </ProgressTrack>
        </ProgressBar>

        {/* DVU-алерт (тихий): появляется если Q5=Yes */}
        {showDvuNote && (
          <Note
            view="warning"
            size="s"
            title={lang === 'ru' ? 'Проверка данных' : 'Data review'}
            text={t.dvuNote}
          />
        )}

        {/* Карточка вопроса */}
        <Card>
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardSubtitle style={{ marginTop: '0.5rem' }}>{t.subtitle}</CardSubtitle>
          </div>

          {renderQuestion()}

          {/* Единый ряд навигации: «Назад» слева, действия справа.
              В probe-режиме справа [Изменить] [Да, верно], иначе [Далее/Завершить]. */}
          <NavRow>
            {stepIdx > 0 ? (
              <Button
                view="secondary"
                size="m"
                text={t.back}
                onClick={handleBack}
              />
            ) : (
              <span />
            )}

            {isProbeAvailable ? (
              <ConfirmRow>
                <Button
                  view="secondary"
                  size="m"
                  text={t.change}
                  onClick={() => {
                    setEditingProbe(true);
                    setLocalValue(currentQ.value ?? '');
                  }}
                />
                <Button
                  view="accent"
                  size="m"
                  text={t.yes}
                  onClick={handleNext}
                />
              </ConfirmRow>
            ) : (
              <Button
                view="accent"
                size="m"
                text={isLastStep ? t.finish : t.next}
                onClick={handleNext}
              />
            )}
          </NavRow>
        </Card>
      </Wrap>
    </ScreenV2>
  );
};
