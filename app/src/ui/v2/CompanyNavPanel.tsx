import { Fragment, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { textPrimary, textSecondary, textAccent, bodyM, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, eyebrow } from '../designSystem';
import { useLanguage } from './LanguageContext';
import type { Lang } from './LanguageContext';
import { COMPANY_HUB_ITEMS } from './companySteps';
import type { HubItem } from './companySteps';
import { getCompanyCase, getApplicationBlocks } from '../../mock/v2/companyApi';
import type { ApplicationBlock, ApplicationBlockStatus } from '../../mock/v2/companyTypes';

// Левая навигация-хаб заявки Компании (заполнитель). Замещает верхний StepProgress.
// Структура: шапка заявки (компания + № + общий статус) → разделы фазы A (кликабельны)
// → разделитель → блоки-мониторинга фазы B (read). Источник пунктов — COMPANY_HUB_ITEMS.
// Статусы фазы A выводим из активного роута/прогресса; фазы B — из getApplicationBlocks.
// Используется в двух местах: десктоп-колонка (sticky) и мобильный drawer (тот же список).

// Состояние пункта: см. дизайн-бриф §2.
type ItemState = 'active' | 'done' | 'pending' | 'verifying' | 'locked';

const dict: Record<Lang, { sectionsLabel: string; inProgress: string; completed: string; appNo: string; verifyingNote: string }> = {
  ru: { sectionsLabel: 'Разделы заявки', inProgress: 'В обработке', completed: 'Завершено', appNo: 'Заявка', verifyingNote: 'Проверяем' },
  en: { sectionsLabel: 'Application sections', inProgress: 'In Progress', completed: 'Completed', appNo: 'Application', verifyingNote: 'Verifying' },
};

// Маппинг hub-B пункт → блок заявки (getApplicationBlocks) для статуса.
const HUB_TO_BLOCK: Record<string, string> = {
  'hub-ident': 'identification-signing',
  'hub-business': 'business-profile',
  'hub-vkyc': 'vkyc',
};

const PanelRoot = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const AppHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
`;
const CompanyName = styled.div`${bodySBold}; font-size: 1.05rem; line-height: 1.2; color: ${textPrimary};`;
const AppMeta = styled.div`${bodyM}; font-size: 0.82rem; color: ${textSecondary};`;
const OverallBadge = styled.span<{ $done: boolean }>`
  align-self: flex-start; ${bodySBold}; font-size: 0.72rem; letter-spacing: 0.04em;
  padding: 0.2rem 0.6rem; border-radius: 14px; margin-top: 0.15rem;
  ${({ $done }) => ($done
    ? css`background: rgba(33,160,56,0.14); color: #1a7a28;`
    : css`background: rgba(52,120,246,0.12); color: #1e5ec9;`)}
`;

const SectionLabel = styled.div`${eyebrow}; font-size: 0.66rem; color: ${textSecondary};`;

const ItemsList = styled.ul`
  list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.2rem;
`;

const Divider = styled.li`
  height: 1px; background: rgba(0, 0, 0, 0.08); margin: 0.55rem 0.25rem;
`;

// Пункт-раздел: иконка-порядок/статус слева, название, бейдж/иконка статуса справа.
// active — зелёная полоса слева + фон-подсветка; locked — приглушён, не кликабелен.
const Item = styled.button<{ $state: ItemState }>`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-align: left;
  border: none;
  background: ${({ $state }) => ($state === 'active' ? 'rgba(33,160,56,0.08)' : 'transparent')};
  border-radius: ${radii.field};
  padding: 0.6rem 0.7rem 0.6rem 0.85rem;
  cursor: ${({ $state }) => ($state === 'locked' ? 'default' : 'pointer')};
  transition: background 0.15s;

  &::before {
    content: '';
    position: absolute;
    left: 0; top: 50%; transform: translateY(-50%);
    width: 3px; height: 60%; border-radius: 999px;
    background: ${({ $state }) => ($state === 'active' ? textAccent : 'transparent')};
  }

  &:not(:disabled):hover {
    background: ${({ $state }) => ($state === 'active' ? 'rgba(33,160,56,0.12)' : 'rgba(0,0,0,0.035)')};
  }
  &:disabled { cursor: default; }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(33,160,56,0.35);
  }
`;

// Кружок-индикатор слева: номер (фаза A) или статус-глиф.
const Marker = styled.span<{ $state: ItemState }>`
  flex-shrink: 0;
  width: 1.45rem; height: 1.45rem; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 700;
  ${({ $state }) => {
    switch ($state) {
      case 'done': return css`background: rgba(33,160,56,0.14); color: #1a7a28;`;
      case 'active': return css`background: rgba(33,160,56,0.18); color: #1a7a28;`;
      case 'verifying': return css`background: rgba(100,116,139,0.16); color: #475569;`;
      case 'locked': return css`background: rgba(100,116,139,0.10); color: #94a3b8;`;
      default: return css`background: rgba(0,0,0,0.06); color: ${textSecondary};`;
    }
  }}
`;

const ItemBody = styled.span`display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; flex: 1;`;
const ItemTitle = styled.span<{ $state: ItemState }>`
  ${bodyM}; font-size: 0.86rem; line-height: 1.25;
  font-weight: ${({ $state }) => ($state === 'active' ? 700 : 500)};
  color: ${({ $state }) => ($state === 'pending' || $state === 'locked' ? textSecondary : textPrimary)};
`;
const ItemNote = styled.span`font-size: 0.72rem; color: ${textSecondary};`;

// Глиф статуса в маркере.
const markerGlyph = (state: ItemState, order?: number): string => {
  switch (state) {
    case 'done': return '✓';
    case 'verifying': return '⟳';
    case 'locked': return '⟳';
    default: return order ? String(order) : '•';
  }
};

// Статус блока фазы B → состояние пункта.
const blockToState = (status: ApplicationBlockStatus | undefined, locked: boolean): ItemState => {
  if (locked) return 'locked';
  if (status === 'done') return 'done';
  // verify / in-progress / in-request / action-required — всё это «мониторинг» (read).
  return 'verifying';
};

interface CompanyNavPanelProps {
  // Колбэк закрытия (для мобильного drawer): клик по пункту закрывает drawer.
  onNavigate?: () => void;
}

export const CompanyNavPanel = ({ onNavigate }: CompanyNavPanelProps) => {
  const { lang } = useLanguage();
  const t = dict[lang];
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [companyName, setCompanyName] = useState('');
  const [appId, setAppId] = useState('');
  const [done, setDone] = useState(false);
  const [blocks, setBlocks] = useState<ApplicationBlock[]>([]);

  useEffect(() => {
    let alive = true;
    getCompanyCase().then((c) => {
      if (!alive) return;
      setCompanyName(c.company.legalName);
      setAppId(c.id);
      setDone(c.status === 'Completed');
    });
    getApplicationBlocks().then((b) => { if (alive) setBlocks(b); });
    return () => { alive = false; };
    // Перечитываем при смене роута: статусы блоков живые (после рассылки/refresh).
  }, [pathname]);

  // Состояние пункта фазы A — по активному роуту: пройденные = done, текущий = active, будущие = pending.
  const phaseAItems = COMPANY_HUB_ITEMS.filter((i) => i.phase === 'A');
  const activeIdx = phaseAItems.findIndex((i) => pathname.startsWith(i.route));

  const stateOf = (item: HubItem, idx: number): ItemState => {
    if (item.phase === 'A') {
      if (pathname.startsWith(item.route)) return 'active';
      // Если мы вне фазы A (на дашборде) — все A пройдены (done).
      if (activeIdx === -1) return 'done';
      return idx < activeIdx ? 'done' : 'pending';
    }
    // Фаза B — по статусу блока.
    const block = blocks.find((b) => b.id === HUB_TO_BLOCK[item.id]);
    return blockToState(block?.status, !!item.locked);
  };

  const go = (item: HubItem, state: ItemState) => {
    if (state === 'locked') return;
    onNavigate?.();
    if (!pathname.startsWith(item.route) || item.phase === 'B') navigate(item.route);
  };

  return (
    <PanelRoot aria-label={t.sectionsLabel}>
      <AppHead>
        <CompanyName>{companyName || '—'}</CompanyName>
        {appId && <AppMeta>{t.appNo} {appId}</AppMeta>}
        <OverallBadge $done={done}>{done ? t.completed : t.inProgress}</OverallBadge>
      </AppHead>

      <div>
        <SectionLabel>{t.sectionsLabel}</SectionLabel>
        <ItemsList>
          {COMPANY_HUB_ITEMS.map((item, i) => {
            // Индекс внутри фазы A для расчёта done/pending.
            const aIdx = phaseAItems.findIndex((x) => x.id === item.id);
            const state = stateOf(item, aIdx);
            const prev = COMPANY_HUB_ITEMS[i - 1];
            const showDivider = prev && prev.phase === 'A' && item.phase === 'B';
            return (
              <Fragment key={item.id}>
                {showDivider && <Divider aria-hidden />}
                <li>
                  <Item
                    type="button"
                    $state={state}
                    disabled={state === 'locked'}
                    aria-current={state === 'active' ? 'page' : undefined}
                    onClick={() => go(item, state)}
                    title={lang === 'ru' ? item.titleRu : item.titleEn}
                  >
                    <Marker $state={state}>{markerGlyph(state, item.order)}</Marker>
                    <ItemBody>
                      <ItemTitle $state={state}>{lang === 'ru' ? item.titleRu : item.titleEn}</ItemTitle>
                      {state === 'verifying' && <ItemNote>{t.verifyingNote}</ItemNote>}
                    </ItemBody>
                  </Item>
                </li>
              </Fragment>
            );
          })}
        </ItemsList>
      </div>
    </PanelRoot>
  );
};
