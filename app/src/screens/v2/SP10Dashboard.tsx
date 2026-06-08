import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { Button } from '@salutejs/sdds-serv'; // TODO свериться с MCP — view, size
import {
  textPrimary,
  textSecondary,
  textAccent,
  dsplLBold,
  bodyL,
  bodyM,
  bodySBold,
  bodyS,
} from '@salutejs/sdds-themes/tokens';
import {
  accentPanel,
  eyebrow,
  radii,
  elevation,
  enter,
} from '../../ui/designSystem';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { STEPS } from '../../ui/v2/steps';
import type { StepDef } from '../../ui/v2/steps';
import { getProgress, getCase } from '../../mock/v2/api';
import type { ProgressStep, StepStatus, OnboardingCaseV2 } from '../../mock/v2/types';

// SP-10 — Дашборд-хаб («дом заявки»). Центр навигации: шапка заявки, блок
// «Requires Action», полный список шагов с кликом в шаг и обратно.
// Роут: /v2/dashboard

// ─── Тип объединённого шага (STEPS + progress) ───────────────────────────────

interface MergedStep {
  def: StepDef;
  progress: ProgressStep | null; // null — если progress для этого id ещё нет
}

// ─── Словарь ─────────────────────────────────────────────────────────────────

type Dict = {
  pageTitle: string;
  applicationNo: string;
  overallStatus: Record<string, string>;
  actionNeeded: string;
  actionNeededSubtitle: string;
  goToStep: string;
  steps: string;
  statusLabel: Record<StepStatus, string>;
  loadingText: string;
  modeLabel: string;
  mode: Record<string, string>;
  accountOpened: string;
  accountOpenedSub: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
};

const dict: Record<Lang, Dict> = {
  ru: {
    pageTitle: 'Ваша заявка',
    applicationNo: 'Заявка',
    overallStatus: {
      Draft: 'Черновик',
      InProgress: 'В обработке',
      Completed: 'Завершено',
    },
    actionNeeded: 'Что требуется от вас',
    actionNeededSubtitle:
      'Есть шаги, требующие вашего участия. Пожалуйста, выполните их, чтобы продолжить.',
    goToStep: 'Перейти',
    steps: 'Этапы онбординга',
    statusLabel: {
      done: 'Выполнено',
      current: 'В процессе',
      pending: 'Ожидает',
      requires_action: 'Требует действия',
    },
    loadingText: 'Загрузка…',
    modeLabel: 'Режим',
    mode: {
      STP: 'Автоматический',
      Hybrid: 'Гибридный',
      Offline: 'Ручной',
    },
    accountOpened: 'Счёт открыт!',
    accountOpenedSub: 'Поздравляем — расчётный счёт успешно открыт.',
    accountNumber: 'Номер счёта',
    ifsc: 'IFSC',
    branch: 'Отделение',
  },
  en: {
    pageTitle: 'Your Application',
    applicationNo: 'Application',
    overallStatus: {
      Draft: 'Draft',
      InProgress: 'In Progress',
      Completed: 'Completed',
    },
    actionNeeded: 'Action Required',
    actionNeededSubtitle:
      'Some steps require your attention. Please complete them to proceed.',
    goToStep: 'Open',
    steps: 'Onboarding Steps',
    statusLabel: {
      done: 'Done',
      current: 'In Progress',
      pending: 'Pending',
      requires_action: 'Action Required',
    },
    loadingText: 'Loading…',
    modeLabel: 'Mode',
    mode: {
      STP: 'Straight-Through',
      Hybrid: 'Hybrid',
      Offline: 'Offline',
    },
    accountOpened: 'Account Opened!',
    accountOpenedSub: 'Congratulations — your current account has been successfully opened.',
    accountNumber: 'Account Number',
    ifsc: 'IFSC',
    branch: 'Branch',
  },
};

// ─── Иконки статуса ───────────────────────────────────────────────────────────

const STATUS_ICON: Record<StepStatus, string> = {
  done: '✓',
  current: '●',
  pending: '○',
  requires_action: '⚠',
};

// ─── Styled-components ────────────────────────────────────────────────────────

const PageMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
  ${enter(0)};
`;

const AppTitle = styled.h1`
  margin: 0;
  ${dsplLBold};
  font-size: 1.75rem;
  color: ${textPrimary};
`;

const StatusBadge = styled.span<{ $status: OnboardingCaseV2['status'] }>`
  ${bodySBold};
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  ${({ $status }) => {
    if ($status === 'Completed')
      return css`
        background: rgba(33, 160, 56, 0.14);
        color: #1a7a28;
      `;
    if ($status === 'InProgress')
      return css`
        background: rgba(52, 120, 246, 0.12);
        color: #1e5ec9;
      `;
    return css`
      background: rgba(0, 0, 0, 0.06);
      color: ${textSecondary};
    `;
  }}
`;

const AppId = styled.p`
  margin: 0 0 1.5rem;
  ${bodyM};
  color: ${textSecondary};
  ${enter(0.06)};
`;

// ─── Блок «Счёт открыт» (все шаги done) ──────────────────────────────────────

const AccountOpenedBlock = styled.div`
  border-radius: ${radii.card};
  padding: 1.5rem 1.75rem;
  margin-bottom: 1.75rem;
  background: linear-gradient(135deg, rgba(33, 160, 56, 0.18), rgba(33, 160, 56, 0.06));
  border: 1.5px solid rgba(33, 160, 56, 0.28);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  ${enter(0.08)};
`;

const AccountOpenedTitle = styled.div`
  font-size: 1.25rem;
  ${bodySBold};
  color: #1a7a28;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AccountOpenedSub = styled.p`
  margin: 0 0 0.75rem;
  ${bodyM};
  color: ${textSecondary};
`;

const AccountRequisites = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.3rem 1.25rem;
`;

const ReqLabel = styled.span`
  ${eyebrow};
  color: ${textSecondary};
  font-size: 0.68rem;
`;

const ReqValue = styled.span`
  ${bodySBold};
  font-size: 0.92rem;
  color: ${textPrimary};
`;

// ─── Блок «Что требуется от вас» ─────────────────────────────────────────────

const ActionBlock = styled.div`
  ${accentPanel};
  border-radius: ${radii.card};
  padding: 1.25rem 1.5rem 1.5rem;
  margin-bottom: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  ${enter(0.10)};
`;

const ActionBlockHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const ActionBlockEyebrow = styled.div`
  ${eyebrow};
  color: ${textAccent};
`;

const ActionBlockSubtitle = styled.p`
  margin: 0;
  ${bodyM};
  color: ${textSecondary};
`;

const ActionItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ActionItem = styled.div`
  background: rgba(255, 255, 255, 0.72);
  border-radius: ${radii.panel};
  padding: 1rem 1.25rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  box-shadow: ${elevation.soft};
`;

const ActionItemText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const ActionItemTitle = styled.span`
  ${bodySBold};
  color: ${textPrimary};
`;

const ActionItemNote = styled.span`
  ${bodyS};
  color: ${textSecondary};
`;

// ─── Список шагов ─────────────────────────────────────────────────────────────

const SectionLabel = styled.div`
  ${eyebrow};
  color: ${textSecondary};
  margin-bottom: 0.75rem;
  ${enter(0.18)};
`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  ${enter(0.22)};
`;

const StepCard = styled.div<{ $status: StepStatus }>`
  background: #ffffff;
  border-radius: ${radii.panel};
  padding: 1rem 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  box-shadow: ${elevation.soft};
  cursor: pointer;
  transition: box-shadow 0.18s, transform 0.15s;

  &:hover {
    box-shadow: ${elevation.card};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  ${({ $status }) =>
    $status === 'requires_action' &&
    css`
      background: rgba(255, 246, 230, 0.9);
      border: 1.5px solid rgba(234, 140, 30, 0.38);
      box-shadow: ${elevation.card};
    `}

  ${({ $status }) =>
    $status === 'pending' &&
    css`
      background: rgba(255, 255, 255, 0.6);
      box-shadow: none;
      border: 1px solid rgba(0, 0, 0, 0.06);
    `}
`;

const StepOrderBadge = styled.div<{ $status: StepStatus }>`
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  margin-top: 0.05rem;
  position: relative;

  ${({ $status }) => {
    if ($status === 'done')
      return css`
        background: rgba(33, 160, 56, 0.14);
        color: #1a7a28;
      `;
    if ($status === 'current')
      return css`
        background: rgba(52, 120, 246, 0.14);
        color: #1e5ec9;
      `;
    if ($status === 'requires_action')
      return css`
        background: rgba(234, 140, 30, 0.18);
        color: #b85f00;
      `;
    // pending
    return css`
      background: rgba(0, 0, 0, 0.05);
      color: ${textSecondary};
    `;
  }}
`;

// Маленькая иконка статуса поверх номера (для done/requires_action)
const StatusOverlay = styled.span<{ $status: StepStatus }>`
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  font-size: 0.58rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid white;

  ${({ $status }) => {
    if ($status === 'done')
      return css`
        background: #1a7a28;
        color: white;
      `;
    if ($status === 'requires_action')
      return css`
        background: #b85f00;
        color: white;
      `;
    if ($status === 'current')
      return css`
        background: #1e5ec9;
        color: white;
        font-size: 0.45rem;
      `;
    return css`display: none;`;
  }}
`;

const StepContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`;

const StepTitle = styled.span<{ $status: StepStatus }>`
  ${bodySBold};
  color: ${({ $status }) => ($status === 'pending' ? textSecondary : textPrimary)};
`;

const StepStatusLabel = styled.span<{ $status: StepStatus }>`
  ${bodyS};
  ${({ $status }) => {
    if ($status === 'done') return css`color: #1a7a28;`;
    if ($status === 'current') return css`color: #1e5ec9;`;
    if ($status === 'requires_action') return css`color: #b85f00; font-weight: 700;`;
    return css`color: ${textSecondary};`;
  }}
`;

const StepNote = styled.span`
  ${bodyS};
  color: ${textSecondary};
  margin-top: 0.15rem;
`;

const StepChevron = styled.span<{ $status: StepStatus }>`
  flex-shrink: 0;
  margin-left: auto;
  padding-left: 0.5rem;
  align-self: center;
  font-size: 1rem;
  color: ${({ $status }) => ($status === 'pending' ? 'rgba(0,0,0,0.2)' : textSecondary)};
  transition: color 0.15s;

  ${StepCard}:hover & {
    color: ${textAccent};
  }
`;

// ─── Скелетон загрузки ────────────────────────────────────────────────────────

const LoadingWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  ${bodyL};
  color: ${textSecondary};
  ${enter(0)};
`;

// ─── Компонент ────────────────────────────────────────────────────────────────

export const SP10Dashboard = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [caseData, setCaseData] = useState<OnboardingCaseV2 | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getProgress(), getCase()]).then(([progress, caseObj]) => {
      if (!mounted) return;
      setProgressSteps(progress);
      setCaseData(caseObj);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Строим единый список: STEPS (порядок + роут + двуязычный заголовок)
  // + состояние из progress по совпадению id.
  // STEPS — источник истины для порядка и роутов.
  const progressMap = new Map(progressSteps.map((p) => [p.id, p]));

  const mergedSteps: MergedStep[] = STEPS.map((def) => ({
    def,
    progress: progressMap.get(def.id) ?? null,
  }));

  // Шаги с requires_action — для верхнего блока
  const requiresActionSteps = mergedSteps.filter(
    (ms) => ms.progress?.status === 'requires_action',
  );

  // Все шаги выполнены?
  const allDone =
    mergedSteps.length > 0 &&
    mergedSteps.every((ms) => ms.progress?.status === 'done');

  const getStatus = (ms: MergedStep): StepStatus =>
    ms.progress?.status ?? 'pending';

  return (
    <ScreenV2 maxWidth="720px">
      {loading ? (
        <LoadingWrap>{t.loadingText}</LoadingWrap>
      ) : (
        <>
          {/* ── Заголовок + общий статус ── */}
          <PageMeta>
            <AppTitle>{t.pageTitle}</AppTitle>
            {caseData && (
              <StatusBadge $status={caseData.status}>
                {t.overallStatus[caseData.status] ?? caseData.status}
              </StatusBadge>
            )}
          </PageMeta>

          {caseData && (
            <AppId>
              {t.applicationNo} #{caseData.id}
              {' · '}
              {t.modeLabel}: {t.mode[caseData.mode] ?? caseData.mode}
            </AppId>
          )}

          {/* ── «Счёт открыт» — только когда ВСЕ шаги done ── */}
          {allDone && (
            <AccountOpenedBlock>
              <AccountOpenedTitle>✓ {t.accountOpened}</AccountOpenedTitle>
              <AccountOpenedSub>{t.accountOpenedSub}</AccountOpenedSub>
              {/* Условные реквизиты (mock) */}
              <AccountRequisites>
                <ReqLabel>{t.accountNumber}</ReqLabel>
                <ReqValue>50200098765432101</ReqValue>
                <ReqLabel>{t.ifsc}</ReqLabel>
                <ReqValue>SBINUS0001234</ReqValue>
                <ReqLabel>{t.branch}</ReqLabel>
                <ReqValue>Mumbai — BKC</ReqValue>
              </AccountRequisites>
            </AccountOpenedBlock>
          )}

          {/* ── Блок «Что требуется от вас» (только при наличии requires_action) ── */}
          {requiresActionSteps.length > 0 && (
            <ActionBlock>
              <ActionBlockHeader>
                <ActionBlockEyebrow>{t.actionNeeded}</ActionBlockEyebrow>
                <ActionBlockSubtitle>{t.actionNeededSubtitle}</ActionBlockSubtitle>
              </ActionBlockHeader>

              <ActionItems>
                {requiresActionSteps.map(({ def, progress }) => (
                  <ActionItem key={def.id}>
                    <ActionItemText>
                      <ActionItemTitle>
                        {lang === 'ru' ? def.titleRu : def.titleEn}
                      </ActionItemTitle>
                      {progress?.note && (
                        <ActionItemNote>{progress.note}</ActionItemNote>
                      )}
                    </ActionItemText>
                    {/* TODO свериться с MCP — Button view/size props */}
                    <Button
                      view="accent"
                      size="s"
                      text={t.goToStep}
                      onClick={() => navigate(def.route)}
                    />
                  </ActionItem>
                ))}
              </ActionItems>
            </ActionBlock>
          )}

          {/* ── Полный список шагов (все STEPS, по порядку, кликабельно) ── */}
          <SectionLabel>{t.steps}</SectionLabel>
          <StepList>
            {mergedSteps.map((ms) => {
              const status = getStatus(ms);
              const title = lang === 'ru' ? ms.def.titleRu : ms.def.titleEn;
              return (
                <StepCard
                  key={ms.def.id}
                  $status={status}
                  onClick={() => navigate(ms.def.route)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(ms.def.route);
                  }}
                  aria-label={`${title} — ${t.statusLabel[status]}`}
                >
                  {/* Номер шага + оверлей-иконка */}
                  <StepOrderBadge $status={status}>
                    {ms.def.order}
                    <StatusOverlay $status={status}>
                      {STATUS_ICON[status]}
                    </StatusOverlay>
                  </StepOrderBadge>

                  <StepContent>
                    <StepTitle $status={status}>{title}</StepTitle>
                    <StepStatusLabel $status={status}>
                      {t.statusLabel[status]}
                    </StepStatusLabel>
                    {/* note показываем при requires_action */}
                    {status === 'requires_action' && ms.progress?.note && (
                      <StepNote>{ms.progress.note}</StepNote>
                    )}
                  </StepContent>

                  <StepChevron $status={status}>›</StepChevron>
                </StepCard>
              );
            })}
          </StepList>
        </>
      )}
    </ScreenV2>
  );
};
