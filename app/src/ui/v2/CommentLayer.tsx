import { useRef, useState } from 'react';
import styled from 'styled-components';
import { textPrimary, textSecondary } from '@salutejs/sdds-themes/tokens';
import { useLanguage } from './LanguageContext';
import type { Lang } from './LanguageContext';

// Режим ревью прототипа: аналитик включает кнопку → кликами по экрану ставит
// пронумерованные метки (1,2,3…), в панели пишет подписи и копирует список.
// Хранения нет: повторное нажатие кнопки скрывает и удаляет метки (передача — через
// скриншот + скопированный список). Подключается глобально в ScreenV2.

interface Pin {
  id: number;
  n: number;
  x: number; // pageX — координата на странице (метка едет с контентом при скролле)
  y: number; // pageY
  label: string;
}

const dict: Record<Lang, {
  fabTitle: string;
  panelTitle: string;
  hint: string;
  placeholder: (n: number) => string;
  clear: string;
  empty: string;
  close: string;
}> = {
  ru: {
    fabTitle: 'Режим комментариев',
    panelTitle: 'Комментарии к экрану',
    hint: 'Кликайте по экрану, чтобы поставить метки. Затем подпишите их и сделайте скриншот.',
    placeholder: (n) => `Комментарий к метке ${n}`,
    clear: 'Очистить',
    empty: 'Пока нет меток — кликните по экрану.',
    close: 'Закрыть',
  },
  en: {
    fabTitle: 'Comment mode',
    panelTitle: 'Screen comments',
    hint: 'Click on the screen to drop markers. Then label them and take a screenshot.',
    placeholder: (n) => `Comment for marker ${n}`,
    clear: 'Clear',
    empty: 'No markers yet — click on the screen.',
    close: 'Close',
  },
};

const ACCENT = 'rgb(33, 160, 56)';

const Fab = styled.button<{ $active: boolean }>`
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 10000;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $active }) => ($active ? ACCENT : '#ffffff')};
  color: ${({ $active }) => ($active ? '#ffffff' : ACCENT)};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  transition: transform 0.15s, background 0.15s;

  &:hover { transform: scale(1.06); }
`;

// Слой-ловушка кликов (только в активном режиме)
const Catcher = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9990;
  cursor: crosshair;
`;

const PinDot = styled.div`
  position: absolute;
  z-index: 9992;
  width: 26px;
  height: 26px;
  margin: -13px 0 0 -13px; /* центрируем по точке клика */
  border-radius: 50%;
  background: ${ACCENT};
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 2px solid #fff;
  cursor: default;
`;

const Panel = styled.div`
  position: fixed;
  right: 1.25rem;
  bottom: 5.5rem; /* над кнопкой-иконкой чата (52px + зазор) */
  z-index: 9995;
  width: 320px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

const PanelHead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.9rem 1rem 0.6rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  cursor: grab;
  user-select: none;

  &:active { cursor: grabbing; }
`;

const CloseBtn = styled.button`
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  color: ${textSecondary};
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover { background: rgba(0, 0, 0, 0.1); }
`;

const PanelTitle = styled.div`
  font-weight: 700;
  font-size: 0.95rem;
  color: ${textPrimary};
`;

const PanelHint = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.76rem;
  color: ${textSecondary};
  line-height: 1.4;
`;

const PinList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PinRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

const PinNum = styled.span`
  flex-shrink: 0;
  margin-top: 0.3rem; /* выравнивание с первой строкой textarea */
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${ACCENT};
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PinInput = styled.textarea`
  flex: 1;
  min-width: 0;
  padding: 0.4rem 0.6rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  font: inherit;
  font-size: 0.82rem;
  color: ${textPrimary};
  resize: none;
  overflow: hidden;
  line-height: 1.4;
  min-height: 2rem;

  &:focus { outline: none; border-color: ${ACCENT}; }
`;

const EmptyNote = styled.p`
  margin: 0;
  padding: 0.5rem 0;
  font-size: 0.8rem;
  color: ${textSecondary};
`;

const PanelFoot = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.6rem 1rem 0.9rem;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
`;

const FootBtn = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid ${({ $primary }) => ($primary ? ACCENT : 'rgba(0,0,0,0.15)')};
  background: ${({ $primary }) => ($primary ? ACCENT : '#fff')};
  color: ${({ $primary }) => ($primary ? '#fff' : textPrimary)};

  &:disabled { opacity: 0.5; cursor: default; }
`;

export const CommentLayer = () => {
  const { lang } = useLanguage();
  const t = dict[lang];

  const [active, setActive] = useState(false);
  const [pins, setPins] = useState<Pin[]>([]);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null); // позиция панели при перетаскивании
  const counter = useRef(1);
  const panelRef = useRef<HTMLDivElement>(null);

  // Drag&drop панели за заголовок
  const startDrag = (e: React.MouseEvent) => {
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    const move = (ev: MouseEvent) => setPos({ x: ev.clientX - dx, y: ev.clientY - dy });
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const toggle = () => {
    // Выключаем — метки удаляются (передача — через скриншот экрана)
    if (active) setPins([]);
    setActive((a) => !a);
  };

  const addPin = (e: React.MouseEvent) => {
    setPins((prev) => [
      ...prev,
      { id: counter.current++, n: prev.length + 1, x: e.pageX, y: e.pageY, label: '' },
    ]);
  };

  const setLabel = (id: number, label: string) => {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, label } : p)));
  };

  const clearAll = () => setPins([]);

  return (
    <>
      {active && (
        <>
          <Catcher onClick={addPin} />
          {pins.map((p) => (
            <PinDot key={p.id} style={{ left: p.x, top: p.y }}>
              {p.n}
            </PinDot>
          ))}
          <Panel
            ref={panelRef}
            style={pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined}
          >
            <PanelHead onMouseDown={startDrag}>
              <div style={{ flex: 1 }}>
                <PanelTitle>{t.panelTitle}</PanelTitle>
                <PanelHint>{t.hint}</PanelHint>
              </div>
              <CloseBtn
                onMouseDown={(e) => e.stopPropagation()}
                onClick={toggle}
                title={t.close}
                aria-label={t.close}
              >
                ✕
              </CloseBtn>
            </PanelHead>
            <PinList>
              {pins.length === 0 ? (
                <EmptyNote>{t.empty}</EmptyNote>
              ) : (
                pins.map((p) => (
                  <PinRow key={p.id}>
                    <PinNum>{p.n}</PinNum>
                    <PinInput
                      rows={1}
                      value={p.label}
                      placeholder={t.placeholder(p.n)}
                      onChange={(e) => {
                        // авто-рост вниз под текст
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                        setLabel(p.id, e.target.value);
                      }}
                    />
                  </PinRow>
                ))
              )}
            </PinList>
            <PanelFoot>
              <FootBtn onClick={clearAll} disabled={pins.length === 0}>
                {t.clear}
              </FootBtn>
            </PanelFoot>
          </Panel>
        </>
      )}
      <Fab $active={active} onClick={toggle} title={t.fabTitle} aria-label={t.fabTitle}>
        💬
      </Fab>
    </>
  );
};
