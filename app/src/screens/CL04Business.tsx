import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Select, Radiobox, Note, BodyM, BodyS } from '@salutejs/sdds-serv';
import { textPrimary, textSecondary } from '@salutejs/sdds-themes/tokens';
import { OnboardingLayout } from '../ui/OnboardingLayout';
import { setOnboardingMode } from '../mock/api';
import type { RiskCategory } from '../mock/types';

// CL-04 — Бизнес-анкета (Business Nature Questionnaire). source: 2026-06-01_obo : 004 (BNQ)
// Опросник → риск-категория (Low/Medium/High) и флаг High-Risk Industry.
// Правила риск-категоризации — mock (бизнес-правила 1D-5, Work In Progress).

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Question = styled(BodyM)`
  color: ${textPrimary};
`;

const Muted = styled(BodyS)`
  color: ${textSecondary};
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const INDUSTRIES = [
  { value: 'textile', label: 'Текстиль / производство' },
  { value: 'it', label: 'IT / разработка ПО' },
  { value: 'retail', label: 'Розничная торговля' },
  { value: 'jewellery', label: 'Ювелирные изделия / драгметаллы', highRisk: true },
  { value: 'crypto', label: 'Криптоактивы / VASP', highRisk: true },
  { value: 'forex', label: 'Money services / форекс', highRisk: true },
];

type YesNo = 'yes' | 'no' | '';

interface RiskResult {
  category: RiskCategory;
  highRiskIndustry: boolean;
  crmHeadApprovalRequired: boolean;
  mode: 'STP' | 'Hybrid' | 'Offline';
}

const computeRisk = (industry: string, residents: YesNo, pep: YesNo, fatca: YesNo): RiskResult => {
  const isHighRiskIndustry = INDUSTRIES.find((i) => i.value === industry)?.highRisk ?? false;
  let level = 0; // 0=Low, 1=Medium, 2=High
  if (residents === 'no') level = Math.max(level, 1);
  if (fatca === 'yes') level = Math.max(level, 1);
  if (pep === 'yes') level = 2;
  if (isHighRiskIndustry) level = 2;

  const category: RiskCategory = level === 2 ? 'High' : level === 1 ? 'Medium' : 'Low';
  const mode = level === 2 ? 'Offline' : level === 1 ? 'Hybrid' : 'STP';
  return {
    category,
    highRiskIndustry: isHighRiskIndustry,
    crmHeadApprovalRequired: isHighRiskIndustry || pep === 'yes',
    mode,
  };
};

const YesNoQuestion = ({
  name,
  value,
  onChange,
}: {
  name: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
}) => (
  <Field>
    <Radiobox name={name} label="Да" checked={value === 'yes'} onChange={() => onChange('yes')} />
    <Radiobox name={name} label="Нет" checked={value === 'no'} onChange={() => onChange('no')} />
  </Field>
);

export const CL04Business = () => {
  const [industry, setIndustry] = useState('');
  const navigate = useNavigate();
  const [residents, setResidents] = useState<YesNo>('');
  const [pep, setPep] = useState<YesNo>('');
  const [fatca, setFatca] = useState<YesNo>('');
  const [result, setResult] = useState<RiskResult | null>(null);

  const riskView = (c: RiskCategory) =>
    c === 'Low' ? 'positive' : c === 'Medium' ? 'warning' : 'negative';

  if (result) {
    return (
      <OnboardingLayout
        step={2}
        title="Риск-категория присвоена"
        primary={<Button view="accent" size="m" text="Перейти к видеоидентификации" onClick={() => navigate('/vcip-invite')} />}
      >
        <Note
          view={riskView(result.category)}
          title={`Риск-категория: ${result.category}`}
          text={`Сценарий онбординга: ${result.mode}.`}
        />
        {result.highRiskIndustry && (
          <Note
            view="warning"
            size="s"
            title="High-Risk Industry"
            text="Отрасль в зоне повышенного риска — потребуется одобрение CRM Head и расширенная проверка (VCIP)."
          />
        )}
        {result.crmHeadApprovalRequired && !result.highRiskIndustry && (
          <Note
            view="warning"
            size="s"
            title="Требуется одобрение CRM Head"
            text="Наличие PEP среди подписантов требует углублённой проверки (EDD)."
          />
        )}
        <Button view="clear" size="m" text="Пройти анкету заново" onClick={() => setResult(null)} />
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      step={2}
      title="Бизнес-анкета"
      primary={
        <Button
          view="accent"
          size="m"
          text="Определить риск-категорию"
          onClick={() => {
            const r = computeRisk(industry, residents, pep, fatca);
            setOnboardingMode(r.mode); // режим кейса = сценарий риска (STP/Hybrid/Offline)
            setResult(r);
          }}
        />
      }
    >
      <Muted>
        Несколько вопросов о характере бизнеса — по ним определяется риск-категория и дальнейший
        сценарий (STP / Hybrid / Offline).
      </Muted>

      <Section>
        <Question>1. Основная сфера деятельности компании</Question>
        <Field>
          <Select
            label="Индустрия / сегмент"
            items={INDUSTRIES}
            value={industry}
            onChange={(v: string) => setIndustry(v)}
            size="m"
          />
        </Field>
      </Section>

      <Section>
        <Question>2. Все подписанты — налоговые резиденты Индии?</Question>
        <YesNoQuestion name="residents" value={residents} onChange={setResidents} />
      </Section>

      <Section>
        <Question>3. Есть ли среди подписантов или бенефициаров публичные должностные лица (PEP)?</Question>
        <YesNoQuestion name="pep" value={pep} onChange={setPep} />
      </Section>

      <Section>
        <Question>4. Подпадает ли компания под FATCA (связь с США)?</Question>
        <YesNoQuestion name="fatca" value={fatca} onChange={setFatca} />
      </Section>

    </OnboardingLayout>
  );
};
