import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { reset } from '../mock/api';

// Демо-навигатор по экранам прототипа (НЕ часть продукта — мета-инструмент).
// Плавающая иконка ☰ внизу справа → вертикальная панель с прыжком на любой этап + сброс.

const GROUPS = [
  {
    role: 'Клиент',
    dot: '#21A038',
    items: [
      { l: '1 Лендинг', p: '/' },
      { l: '2 Вход', p: '/login' },
      { l: '3 Компания', p: '/company' },
      { l: '4 Анкета', p: '/business' },
      { l: '5 Видео-ID', p: '/vcip-invite' },
      { l: '6 Документы', p: '/documents' },
      { l: '7 Подтверждение', p: '/confirm' },
      { l: '8 Результат', p: '/result' },
    ],
  },
  {
    role: 'Менеджер',
    dot: '#F5811F',
    items: [
      { l: 'Транзит', p: '/transit' },
      { l: 'Очередь DVU', p: '/rm/queue' },
      { l: 'Карточка задачи', p: '/rm/task?id=DVU-1042' },
    ],
  },
];

const INK = '#111827';
const INK_SOFT = '#1F2937';
const LINE = 'rgba(255,255,255,0.12)';

const Fab = styled.button`
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 9999;
  width: 3rem;
  height: 3rem;
  background: ${INK};
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 1.25rem;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  &:hover {
    background: ${INK_SOFT};
  }
`;

const Panel = styled.div`
  position: fixed;
  right: 1.5rem;
  bottom: 5rem;
  z-index: 9999;
  width: 320px;
  background: ${INK};
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const RoleLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const Dot = styled.span<{ c: string }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ c }) => c};
  display: inline-block;
`;

const Grid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const Item = styled.button`
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #fff;
  padding: 0.4rem 0.7rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${LINE};
`;

const ResetRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const IconBtn = styled.button`
  background: none;
  border: 1px solid ${LINE};
  color: rgba(255, 255, 255, 0.85);
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export const DemoNav = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const go = (p: string) => {
    navigate(p);
    setOpen(false);
  };
  const doReset = () => {
    reset();
    navigate('/');
    setOpen(false);
  };

  return (
    <>
      {open && (
        <Panel>
          {GROUPS.map((g) => (
            <Group key={g.role}>
              <RoleLabel>
                <Dot c={g.dot} />
                {g.role}
              </RoleLabel>
              <Grid>
                {g.items.map((it) => (
                  <Item key={it.p} onClick={() => go(it.p)}>
                    {it.l}
                  </Item>
                ))}
              </Grid>
            </Group>
          ))}
          <Divider />
          <ResetRow>
            <IconBtn title="Сбросить демо-данные" onClick={doReset}>
              ↺
            </IconBtn>
          </ResetRow>
        </Panel>
      )}
      <Fab title="Экраны прототипа" onClick={() => setOpen((o) => !o)}>
        ☰
      </Fab>
    </>
  );
};
