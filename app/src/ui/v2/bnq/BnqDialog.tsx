import { useState, useEffect, type ReactNode } from 'react';
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
import { ScreenV2 } from '../ScreenV2';
import { useLanguage } from '../LanguageContext';
import type { Lang } from '../LanguageContext';
import type { BnqAnswer } from '../../../mock/v2/types';
import {
  elevation,
  enter,
  radii,
} from '../../designSystem';

// BnqDialog — общий движок пошагового опросника «Tell us more about your business».
// Извлечён из SP07Bnq (решение Кости 2026-06-18), чтобы Sole Proprietor и Компания
// делили одну логику ветвлений/probe-режима/прогресса. Данные — через порт (пропсы),
// чтобы движок не знал, из какого api берутся ответы.
//
// Замысел Марго (L1): непрерывный диалог, вопрос за раз, фон не меняется.
// Опциональный нулевой шаг (leadStep) — PAN-экран в той же карточке (stepIdx === -1).

// ─── Порт данных и пропсы ──────────────────────────────────────────────────────

export interface BnqDataPort {
  getBnq(): Promise<BnqAnswer[]>;
  answerBnq(q: string, value: string): Promise<unknown>;
}

// Нулевой шаг (PAN и т.п.): рендерится в той же карточке, со стабильным заголовком.
// onDone движок вызывает, чтобы перейти к первому вопросу (stepIdx 0).
export interface BnqLeadStep {
  render: (api: { onDone: () => void; back: () => void }) => ReactNode;
}

interface BnqDialogProps {
  port: BnqDataPort;
  onFinish: () => void;            // последний вопрос пройден
  onBackFromFirst: () => void;     // «Назад» с первого вопроса (или с leadStep)
  leadStep?: BnqLeadStep;          // опциональный нулевой шаг (PAN)
  topProgress?: ReactNode;         // верхний StepProgress (для Sole Proprietor сейчас не передаётся)
  // navHub — двухколоночный режим с левой навигацией-хабом заявки (заполнитель Компании).
  // Замещает topProgress: для Компании передаём navHub, topProgress не передаём.
  navHub?: boolean;
}

// ─── Типы ────────────────────────────────────────────────────────────────────

// Индекс активного вопроса с учётом пропуска Q10/Q11 при Q9=No
type QIndex = number;

// ─── Словарь ─────────────────────────────────────────────────────────────────

const dict: Record<Lang, {
  title: string;
  subtitle: string;
  responsibilityNote: string;
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
  // Q4b — FATCA/CRS налоговый статус компании (только Компания)
  q4bLabel: string;
  q4bHint: string;
  q4bActive: string;
  q4bPassive: string;
  q4bFi: string;
  q4bCountryLabel: string;
  // Q5
  q5Label: string;
  q5Yes: string;
  q5No: string;
  // Q6
  q6Label: string;
  q6Hint: string;
  // Q6b — существующая кредитная задолженность (CC/OD)
  q6bLabel: string;
  q6bYes: string;
  q6bNo: string;
  q6bThresholdLabel: string;
  q6bThresholdHint: string;
  q6bMore: string;
  q6bLess: string;
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
}> = {
  ru: {
    title: 'Расскажите подробнее о вашем бизнесе',
    subtitle: 'Ответьте на несколько вопросов — это поможет нам подобрать условия',
    responsibilityNote: 'Отвечайте достоверно — ваши ответы проверит банк, и они влияют на решение по заявке. Подтверждение и подписание — в конце.',
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
    q4bLabel: 'Подтвердите налоговый статус компании (FATCA / CRS)',
    q4bHint: 'Налоговая классификация компании для обмена налоговой информацией. Для торговой компании-резидента Индии обычно Active NFFE.',
    q4bActive: 'Активная нефинансовая структура (Active NFFE)',
    q4bPassive: 'Пассивная нефинансовая структура (Passive NFFE)',
    q4bFi: 'Финансовая организация',
    q4bCountryLabel: 'Страна налогового резидентства',
    q5Label:
      'Занимаете ли вы или ваши близкие родственники (в течение последних 5 лет) публичные должности (госслужащий, судья, военный руководитель)?',
    q5Yes: 'Да',
    q5No: 'Нет',
    q6Label: 'Укажите чистую выручку за последний год',
    q6Hint: 'Введите сумму в крорах (Cr)',
    q6bLabel: 'Есть ли у компании уже кредиты или овердрафты в других банках?',
    q6bYes: 'Да',
    q6bNo: 'Нет',
    q6bThresholdLabel: 'Укажите совокупную сумму задолженности',
    q6bThresholdHint: 'Выберите сумму, чтобы продолжить',
    q6bMore: 'Больше 10 крор',
    q6bLess: 'Меньше 10 крор',
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
      '⚠️ Для обработки международных платежей и торговых операций Банк требует ваш IEC в соответствии с нормами FEMA. Без действительного IEC мы не сможем обработать ваши трансграничные платежи. Вы можете загрузить IEC сейчас или позже в интернет-банке после открытия счёта. Загрузка позже не влияет на открытие счёта, но мы рекомендуем загрузить сейчас.',
  },
  en: {
    title: 'Tell us more about your business',
    subtitle: 'Answer a few questions — this helps us tailor the right setup for you',
    responsibilityNote: 'Answer accurately — your responses are reviewed by the bank and affect the decision on your application. Confirmation and signing come at the end.',
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
    q4bLabel: 'Confirm the company tax status (FATCA / CRS)',
    q4bHint: 'Company tax classification for tax-information exchange. A trading company resident in India is usually an Active NFFE.',
    q4bActive: 'Active NFFE (non-financial)',
    q4bPassive: 'Passive NFFE (non-financial)',
    q4bFi: 'Financial Institution',
    q4bCountryLabel: 'Country of tax residency',
    q5Label:
      'Do you or your close relatives hold or have held in the past 5 years any public positions (government officials, judges, military executives)?',
    q5Yes: 'Yes',
    q5No: 'No',
    q6Label: 'What is your Net Revenue for the last year?',
    q6Hint: 'Enter amount in crore (Cr)',
    q6bLabel: 'Does the company already have credit or overdraft facilities with other banks?',
    q6bYes: 'Yes',
    q6bNo: 'No',
    q6bThresholdLabel: 'Specify the aggregate total exposure',
    q6bThresholdHint: 'Select an amount to continue',
    q6bMore: 'More than 10 crore',
    q6bLess: 'Less than 10 crore',
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
      '⚠️ For processing international payments and trade transactions, your IEC is required by the Bank under FEMA regulations. Without a valid IEC, we may not be able to process your cross-border payments. You can upload your IEC document now, or upload it later through the online bank after account opening. Upload-later will not affect account opening, although we recommend uploading now.',
  },
};

// ─── Данные справочников ──────────────────────────────────────────────────────

export const INDUSTRIES = [
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
     (взято по самому высокому вопросу — Q11 с дисклеймером). Решение Дениса 2026-06-09.
     leadStep (PAN) использует ту же min-height, чтобы переход PAN → Q1 не дёргал карточку. */
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

// Мелкая подсказка-хелпер под полем (напр. «Выберите сумму, чтобы продолжить»).
const FieldHint = styled.p`
  margin: 0.5rem 0 0;
  ${bodyM};
  font-size: 0.8125rem;
  color: ${textSecondary};
  line-height: 1.4;
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

// «Нет» в обоих языках (RU «Нет, не …» / EN «No, I don't …»)
export const isNoAnswer = (value: string) => /^\s*(no|нет)/i.test(value);

/**
 * Skip-флаги выводим НАПРЯМУЮ из ответов (single source of truth = массив bnq),
 * а не из отдельного React-state. Раньше держали скип в useState (skipQ8/skipTrade),
 * и он рассинхронивался с порядком рендера (баг: Q7=«No», но Q8 всё равно показывался,
 * счётчик «из N» не сокращался). Теперь порядок и счётчик считаются из одних и тех же данных.
 *
 * Опора — ИМЯ вопроса (Q7/Q9), не числовой индекс: после удаления Q2 из анкеты Компании
 * индексы сместились, но привязка к Q7/Q8/Q9/Q10/Q11 это не задевает.
 *
 * Q8 (сумма кредита) БОЛЬШЕ НЕ отдельный шаг (решение Дениса/Бори по BRD: «Product Interest» —
 * один атрибут, сумма — под-параметр). Сумма вводится инлайн под радио Q7 (прогрессивное раскрытие).
 * В модели bnq значение Q8 сохраняется (golden record не теряем) — Q8 просто всегда исключён из stepOrder.
 */
export function isSkipTrade(bnq: BnqAnswer[]): boolean {
  const q9 = bnq.find((a) => a.q === 'Q9');
  return !!q9?.value && isNoAnswer(q9.value);
}

/**
 * Из массива BnqAnswer[] строим «плоский» порядок шагов.
 * Решение Дениса 2026-06-09: вопросы с данными из реестра (source='available') НЕ скрываем,
 * а показываем предзаполненными для подтверждения («Мы определили: X. Верно?» — режим в renderQuestion).
 * Ветвления: Q10/Q11 убираем при Q9=«No» (нет ВЭД).
 * Q8 (сумма кредита) ВСЕГДА исключён из шагов — он раскрывается инлайн под Q7 (см. renderQuestion).
 * Возвращаем массив индексов (0-based) исходного массива.
 */
export function buildStepOrder(bnq: BnqAnswer[]): QIndex[] {
  const skipTrade = isSkipTrade(bnq);
  const order: QIndex[] = [];
  for (let i = 0; i < bnq.length; i++) {
    const q = bnq[i].q;
    if (q === 'Q8') continue; // сумма кредита — инлайн в Q7, не отдельный шаг
    if (skipTrade && (q === 'Q10' || q === 'Q11')) continue;
    order.push(i);
  }
  return order;
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export const BnqDialog = ({ port, onFinish, onBackFromFirst, leadStep, topProgress, navHub }: BnqDialogProps) => {
  const { lang } = useLanguage();
  const t = dict[lang];

  // BNQ data
  const [bnq, setBnq] = useState<BnqAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  // Навигация по шагам. С leadStep ведём от -1 (нулевой шаг = PAN) до n-1.
  // Без leadStep стартуем с 0 (первый вопрос).
  const [stepIdx, setStepIdx] = useState(leadStep ? -1 : 0); // -1 = leadStep; иначе индекс в stepOrder[]
  // Skip (Q8 / Q10-Q11) больше НЕ держим в отдельном state — выводим из bnq (buildStepOrder).

  // Локальные ответы (до answerBnq)
  const [localValue, setLocalValue] = useState('');
  const [editingProbe, setEditingProbe] = useState(false);

  // Доп. поля Q1
  const [industryVal, setIndustryVal] = useState('');
  const [segmentVal, setSegmentVal] = useState('');

  // Q7 — инлайн-сумма кредита (бывший отдельный шаг Q8). Значение пишется в ответ Q8 при «Далее».
  const [creditAmount, setCreditAmount] = useState('');

  // Q6b — существующая кредитная задолженность (CC/OD). Радио Да/Нет + инлайн под-выбор порога.
  // В value пишем: «Нет» → ответ-нет; «Да» → выбранный порог (>10/<10 крор).
  const [q6bYesNo, setQ6bYesNo] = useState<'yes' | 'no' | ''>('');
  const [q6bThreshold, setQ6bThreshold] = useState('');

  // Доп. Q11 — намерение по IEC (сам файл грузится на «Подтверждении данных компании»)
  const [iecChoice, setIecChoice] = useState<'now' | 'later' | ''>('');

  // Q4b — FATCA/CRS (только Компания). Хранится в value как «<классификация> · <страна>».
  // Классификация — канонический FATCA-ключ ('Active NFFE' и т.п.), страна — свободный ввод (дефолт India).
  const [fatcaClass, setFatcaClass] = useState('Active NFFE');
  const [fatcaCountry, setFatcaCountry] = useState('India');

  // ─── Загрузка BNQ ───────────────────────────────────────────────────────────

  useEffect(() => {
    port.getBnq().then((data) => {
      setBnq(data);
      setLoading(false);
    });
  }, [port]);

  // ─── Порядок шагов ──────────────────────────────────────────────────────────

  const onLead = leadStep && stepIdx === -1;
  const stepOrder = buildStepOrder(bnq);
  const totalSteps = stepOrder.length;
  const currentBnqIdx = stepOrder[stepIdx] ?? 0;
  const currentQ = bnq[currentBnqIdx];

  // При переходе к новому вопросу (и после загрузки данных) — заполняем поля ввода
  useEffect(() => {
    if (onLead || !currentQ) return;
    setLocalValue(currentQ.value ?? '');
    setEditingProbe(false);
    // Предзаполняем поля из данных Probe42, чтобы клиент правил, а не вводил заново.
    if (currentQ.q === 'Q1') {
      setIndustryVal(currentQ.value ?? '');
      setSegmentVal(currentQ.value ?? ''); // сегмент тоже из Probe42
    }
    // Q7: подтягиваем сохранённую сумму кредита (ответ Q8) в инлайн-поле.
    if (currentQ.q === 'Q7') {
      const q8 = bnq.find((a) => a.q === 'Q8');
      setCreditAmount(q8?.value ?? '');
    }
    // Q4b: разбираем сохранённый value «<классификация> · <страна>» обратно в поля.
    if (currentQ.q === 'Q4b') {
      const v = currentQ.value ?? '';
      const [cls, country] = v.split('·').map((s) => s.trim());
      setFatcaClass(cls || 'Active NFFE');
      setFatcaCountry(country || 'India');
    }
    // Q6b: восстанавливаем радио Да/Нет и под-выбор порога из сохранённого value.
    if (currentQ.q === 'Q6b') {
      const v = currentQ.value ?? '';
      if (!v) {
        setQ6bYesNo('');
        setQ6bThreshold('');
      } else if (isNoAnswer(v)) {
        setQ6bYesNo('no');
        setQ6bThreshold('');
      } else {
        setQ6bYesNo('yes');
        setQ6bThreshold(v);
      }
    }
  }, [stepIdx, loading]); // eslint-disable-line react-hooks/exhaustive-deps
  // loading в зависимостях: данные приходят асинхронно, без этого первый вопрос оставался пустым

  // ─── Сохранение ответа ──────────────────────────────────────────────────────
  // Без блокировки повторов: вернулся «Назад» и поменял ответ — пересохраняем
  // (answerBnq идемпотентен), ветвления пересчитываются.

  // Применяет ответ к массиву bnq и возвращает НОВЫЙ массив — чтобы вызывающий код
  // (handleNext) мог сразу посчитать порядок/«последний ли шаг» по свежим данным,
  // не дожидаясь асинхронного setState. bnq — единственный источник правды для скипа.
  const applyAnswer = (prev: BnqAnswer[], q: string, value: string): BnqAnswer[] =>
    prev.map((a) => (a.q === q ? { ...a, value, source: 'not_available' } : a));

  const handleAnswer = async (value: string) => {
    if (!currentQ) return;
    await port.answerBnq(currentQ.q, value);
    // Ветвления Q7→Q8 и Q9→Q10/Q11 теперь выводятся из bnq в buildStepOrder.
    // Q5 PEP=Yes: алерт DVU-Compliance уходит ФОНОМ, клиенту не показываем (Задача 10, п.5).
    setBnq((prev) => applyAnswer(prev, currentQ.q, value));
  };

  // ─── Переход «Далее» ────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (!currentQ) return;

    // Если source=available и подтверждено probe — просто идём дальше
    let value =
      currentQ.source === 'available' && !editingProbe
        ? currentQ.value
        : localValue;

    // Q6b: значение собираем из радио Да/Нет + под-выбора порога (не из localValue).
    // «Нет» → пишем ответ-нет; «Да» → пишем выбранный порог (>10/<10 крор).
    // Валидация: «Да» без выбранного порога — не пускаем дальше.
    if (currentQ.q === 'Q6b') {
      if (q6bYesNo === '') return;
      if (q6bYesNo === 'yes' && !q6bThreshold) return;
      value = q6bYesNo === 'no' ? t.q6bNo : q6bThreshold;
    }

    // Q4b: значение собираем из выбранной классификации + страны резидентства (не из localValue).
    if (currentQ.q === 'Q4b') {
      value = `${fatcaClass} · ${fatcaCountry.trim() || 'India'}`;
    }

    // Q7: «Да» определяем СТРОГО равенством с положительным вариантом (как и показ поля суммы),
    // а не «не Нет» — чтобы пустое/любое прочее состояние не считалось «Да».
    // При «Да» сумма кредита обязательна (инлайн-поле Q8) — пустую не пропускаем.
    const q7Yes = currentQ.q === 'Q7' && value === t.q7Yes;
    if (q7Yes && !creditAmount.trim()) return;

    // Режим свободной проверки: сохраняем ответ только если он есть, не блокируем переход
    if (value) {
      try { await handleAnswer(value); } catch (_) { /* игнорируем */ }
    }

    // Q7: сохраняем/очищаем сумму кредита в ответ Q8 (golden record не теряем).
    // «Да» → пишем введённую сумму; «Нет» → очищаем сумму (кредит не нужен).
    let nextBnq = value ? applyAnswer(bnq, currentQ.q, value) : bnq;
    if (currentQ.q === 'Q7' && value) {
      const amount = q7Yes ? creditAmount.trim() : '';
      try { await port.answerBnq('Q8', amount); } catch (_) { /* игнорируем */ }
      nextBnq = applyAnswer(nextBnq, 'Q8', amount);
      setBnq((prev) => applyAnswer(prev, 'Q8', amount));
    }

    // Порядок пересчитываем ЛОКАЛЬНО по СВЕЖЕМУ массиву (с только что данным ответом):
    // setBnq асинхронный, а решение «последний ли шаг» / какой вопрос следующий нужно сейчас.
    // Это же убирает рассинхрон рендера: и порядок, и счётчик считаются из одного bnq.
    const nextOrder = buildStepOrder(nextBnq);

    const isLast = stepIdx >= nextOrder.length - 1;
    if (isLast) {
      onFinish();
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const handleBack = () => {
    // Между вопросами — на предыдущий вопрос; на первом — на leadStep (если есть)
    // или наружу через onBackFromFirst.
    if (stepIdx > 0) setStepIdx((i) => i - 1);
    else if (leadStep) setStepIdx(-1); // вернуться на PAN
    else onBackFromFirst();
  };

  // ─── Рендер вопроса ─────────────────────────────────────────────────────────

  // Заголовок (формулировка) каждого вопроса — единый источник для probe и редактирования.
  const Q_TITLE: Record<string, string> = {
    Q1: t.q1Label, Q2: t.q2Label, Q3: t.q3Label, Q4: t.q4Label, Q4b: t.q4bLabel,
    Q5: t.q5Label, Q6: t.q6Label, Q6b: t.q6bLabel, Q7: t.q7Label, Q8: t.q8Label,
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

    // ── Q4b: FATCA/CRS налоговый статус компании (только Компания) ───────────
    // Выбор из 3 классификаций + страна резидентства (дефолт India). Хранится в value
    // как «<классификация> · <страна>». Перенесён из финальной анкеты (CompanyConfirm).
    if (q === 'Q4b') {
      const fatcaOpts: Array<[string, string]> = [
        ['Active NFFE', t.q4bActive],
        ['Passive NFFE', t.q4bPassive],
        ['Financial Institution', t.q4bFi],
      ];
      return (
        <QBlock>
          <QLabel>{t.q4bLabel}</QLabel>
          <ProbeLine>{t.q4bHint}</ProbeLine>
          <RadioGroup>
            {fatcaOpts.map(([key, label]) => (
              <RadioOption
                key={key}
                $selected={fatcaClass === key}
                onClick={() => setFatcaClass(key)}
              >
                <RadioDot $selected={fatcaClass === key} />
                {label}
              </RadioOption>
            ))}
          </RadioGroup>
          <TextField
            value={fatcaCountry}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFatcaCountry(e.target.value)}
            label={t.q4bCountryLabel}
            type="text"
          />
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

    // ── Q6b: Существующие кредиты/овердрафты в других банках (CC/OD) ─────────
    // Радио Да/Нет; при «Да» инлайн раскрывается под-выбор порога (>10 / <10 крор).
    // Это ВЫБОР, не ввод суммы. Влияет на доступный тип счёта (фоновая логика банка).
    if (q === 'Q6b') {
      return (
        <QBlock>
          <QLabel>{t.q6bLabel}</QLabel>
          <RadioGroup>
            {([['yes', t.q6bYes], ['no', t.q6bNo]] as const).map(([key, label]) => (
              <RadioOption
                key={key}
                $selected={q6bYesNo === key}
                onClick={() => {
                  setQ6bYesNo(key);
                  if (key === 'no') setQ6bThreshold('');
                }}
              >
                <RadioDot $selected={q6bYesNo === key} />
                {label}
              </RadioOption>
            ))}
          </RadioGroup>
          {q6bYesNo === 'yes' && (
            <div>
              <QLabel style={{ marginBottom: '0.75rem' }}>{t.q6bThresholdLabel}</QLabel>
              <RadioGroup>
                {[t.q6bMore, t.q6bLess].map((opt) => (
                  <RadioOption
                    key={opt}
                    $selected={q6bThreshold === opt}
                    onClick={() => setQ6bThreshold(opt)}
                  >
                    <RadioDot $selected={q6bThreshold === opt} />
                    {opt}
                  </RadioOption>
                ))}
              </RadioGroup>
              {!q6bThreshold && <FieldHint>{t.q6bThresholdHint}</FieldHint>}
            </div>
          )}
        </QBlock>
      );
    }

    // ── Q7: Кредитные продукты (+ инлайн-сумма Q8 при «Да») ──────────────────
    // Объединённый шаг: радио «нужен кредит да/нет». При «Да» прогрессивно раскрывается
    // поле суммы (Cr) — пишется в ответ Q8 при «Далее». При «Нет» поля нет, сумма очищается.
    if (q === 'Q7') {
      // Поле суммы раскрываем СТРОГО при выбранном «Да» (равенство с положительным вариантом),
      // а не по «не Нет» — иначе пустое/любое не-No состояние ошибочно показывало поле суммы.
      const q7YesSelected = localValue === t.q7Yes;
      return (
        <QBlock>
          <QLabel>{t.q7Label}</QLabel>
          <RadioGroup>
            {[t.q7Yes, t.q7No].map((opt) => (
              <RadioOption
                key={opt}
                $selected={localValue === opt}
                onClick={() => {
                  setLocalValue(opt);
                  // Переключили на «Нет» — введённую сумму очищаем (не учитываем).
                  if (opt !== t.q7Yes) setCreditAmount('');
                }}
              >
                <RadioDot $selected={localValue === opt} />
                {opt}
              </RadioOption>
            ))}
          </RadioGroup>
          {q7YesSelected && (
            <div>
              <QLabel style={{ marginBottom: '0.75rem' }}>{t.q8Label}</QLabel>
              <TextField
                value={creditAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCreditAmount(e.target.value)
                }
                label={t.q8Hint}
                type="text"
                inputMode="decimal"
              />
            </div>
          )}
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
  // На leadStep данные могут ещё грузиться — показываем PAN сразу (карточка стабильна).

  if (!onLead && (loading || !currentQ)) {
    return (
      <ScreenV2 progress={topProgress} navHub={navHub}>
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
    !onLead && currentQ?.source === 'available' && !editingProbe;

  const isLastStep = stepIdx === totalSteps - 1;

  // ─── Когда кнопка «Далее»/«Завершить» неактивна ──────────────────────────
  // Зеркалит «молчаливые return» в handleNext: кнопка должна быть disabled там,
  // где клик ничего не делает — иначе пользователь не понимает, почему не работает.
  // Составные вопросы:
  //   Q6b — ответ полон только если «Нет» ИЛИ («Да» И выбран порог >10/<10 крор).
  //   Q7  — при «Да» обязательна введённая сумма кредита (инлайн-поле Q8).
  const nextDisabled = (() => {
    if (onLead || !currentQ || isProbeAvailable) return false;
    if (currentQ.q === 'Q6b') {
      if (q6bYesNo === '') return true;            // ничего не выбрано
      if (q6bYesNo === 'yes' && !q6bThreshold) return true; // «Да» без порога
      return false;
    }
    if (currentQ.q === 'Q7' && localValue === t.q7Yes && !creditAmount.trim()) {
      return true;                                 // «Да» без суммы
    }
    return false;
  })();

  // ─── Прогресс (отображаем «видимый» номер — с учётом пропуска) ───────────

  const visibleStepNum = stepIdx + 1;

  return (
    <ScreenV2 progress={topProgress} navHub={navHub}>
      <Wrap>
        {/* Прогресс по вопросам анкеты — подчинён верхнему StepProgress.
            На leadStep (PAN) счётчик вопросов не показываем — он начинается с Q1. */}
        {!onLead && (
          <ProgressBar>
            <ProgressLabel>{t.stepOf(visibleStepNum, totalSteps)}</ProgressLabel>
            <ProgressTrack>
              <ProgressFill $pct={(visibleStepNum / totalSteps) * 100} />
            </ProgressTrack>
          </ProgressBar>
        )}

        {/* Триггеры DVU/CRM (Q5 PEP, Q7 кредит) уходят фоном — клиенту НЕ показываем (Задача 10, п.5) */}

        {/* Карточка вопроса. Заголовок «Tell us more about your business» стабилен
            на всех шагах включая PAN — меняется только тело. */}
        <Card>
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardSubtitle style={{ marginTop: '0.5rem' }}>{t.subtitle}</CardSubtitle>
          </div>

          {/* Информирование о серьёзности/ответственности за достоверность ответов (замысел Марго,
              демо 16.06): опросник — серьёзная вещь, правдивость ответов влияет на решение.
              view="info" (сине-серый); НЕ warning/оранжевый — оранжевый зарезервирован под DVU/ошибку.
              Это не присяга: финальное подтверждение достоверности — на экране подписания.
              Показываем на ШАГАХ ВОПРОСОВ (когда НЕ на leadStep-карточке PAN). У Компании: карточка PAN
              (onLead) — без плашки (там своё вводное «банк проверит»), а на самих вопросах — с плашкой.
              У Sole Proprietor (нет leadStep, старт сразу с вопросов) — плашка на всех вопросах, как было.
              Плашка постоянна на всех шагах-вопросах → не дёргает layout между вопросами. */}
          {!onLead && <Note key={lang} view="info" size="s" text={t.responsibilityNote} />}

          {/* leadStep (PAN) рендерится В ТОЙ ЖЕ карточке; иначе — текущий вопрос.
              Навигация leadStep — собственная (onDone → Q1, back → наружу). */}
          {onLead ? (
            <QBlock>
              {leadStep!.render({ onDone: () => setStepIdx(0), back: onBackFromFirst })}
            </QBlock>
          ) : (
            <>
              {renderQuestion()}

              {/* Единый ряд навигации: «Назад» слева, действия справа.
                  В probe-режиме справа [Изменить] [Да, верно], иначе [Далее/Завершить]. */}
              <NavRow>
                {/* «Назад» есть всегда: между вопросами — на пред. вопрос, на первом — на leadStep/наружу */}
                <Button
                  view="secondary"
                  size="m"
                  text={t.back}
                  onClick={handleBack}
                />

                {isProbeAvailable ? (
                  <ConfirmRow>
                    <Button
                      view="secondary"
                      size="m"
                      text={t.change}
                      onClick={() => {
                        setEditingProbe(true);
                        setLocalValue(currentQ?.value ?? '');
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
                    disabled={nextDisabled}
                    onClick={handleNext}
                  />
                )}
              </NavRow>
            </>
          )}
        </Card>
      </Wrap>
    </ScreenV2>
  );
};
