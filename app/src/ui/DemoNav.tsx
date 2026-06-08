import { Fragment, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { reset } from '../mock/api';

// Карта экранов прототипа (мета-инструмент, НЕ часть продукта).
// Плавающая иконка ☰ → обзорная схема потока: узлы по ролям + развилка,
// клик по узлу = переход на экран. Серые узлы — описаны в схеме, ещё не собраны.

type Node = { l: string; p?: string; ghost?: boolean };

const CLIENT: Node[] = [
  { l: '1 Лендинг', p: '/' },
  { l: '2 Вход', p: '/login' },
  { l: '3 Компания', p: '/company' },
  { l: '4 Анкета', p: '/business' },
  { l: '5 Видео-ID', p: '/vcip-invite' },
  { l: '6 Видео-сессия', p: '/vcip-session?sig=SIG-1' },
  { l: '7 Документы', p: '/documents' },
  { l: '8 Подтверждение', p: '/confirm' },
  { l: '9 Результат (STP)', p: '/result' },
];

const MANAGER: Node[] = [
  { l: 'Очередь DVU', p: '/rm/queue' },
  { l: 'Карточка · OBO', p: '/rm/task?id=DVU-1042' },
  { l: 'KYC-разбор', p: '/rm/kyc?id=DVU-1051' },
  { l: 'VKYC · встреча', p: '/rm/vkyc?id=DVU-1055' },
  { l: 'VKYC · сессии', p: '/rm/session?id=DVU-1055' },
];

const V2: Node[] = [
  { l: '1 Лендинг', p: '/v2' },
  { l: '2 Письмо', p: '/v2/email' },
  { l: '3 Регистрация', p: '/v2/login' },
  { l: '4 Согласие реестры', p: '/v2/registry' },
  { l: '5 PAN', p: '/v2/pan' },
  { l: '6 Данные компании', p: '/v2/company' },
  { l: '7 Анкета BNQ', p: '/v2/bnq' },
  { l: '8 Согласие VCIP', p: '/v2/pre-vcip' },
  { l: '9 Видео-ID', p: '/v2/vcip' },
  { l: '10 Дашборд', p: '/v2/dashboard' },
];

const BLUE = '#2563EB';
const INK = '#111827';
const LINE = 'rgba(255,255,255,0.12)';
const GREEN = '#21A038';
const ORANGE = '#F5811F';

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
    opacity: 0.92;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.45);
`;

const Overlay = styled.div`
  position: fixed;
  z-index: 9999;
  left: 50%;
  bottom: 1.5rem;
  transform: translateX(-50%);
  width: min(760px, calc(100vw - 2rem));
  background: ${INK};
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: #fff;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HTitle = styled.span`
  font-size: 0.95rem;
  font-weight: 700;
`;

const Close = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  &:hover {
    color: #fff;
  }
`;

const Lane = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const RoleLabel = styled.span<{ c: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  &::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ c }) => c};
  }
`;

const Flow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
`;

const Arrow = styled.span`
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.9rem;
`;

const Chip = styled.button<{ tone: string; active?: boolean; ghost?: boolean }>`
  border: 1px solid ${({ tone, ghost }) => (ghost ? LINE : tone)};
  background: ${({ tone, active, ghost }) =>
    ghost ? 'transparent' : active ? tone : 'rgba(255,255,255,0.06)'};
  color: ${({ active, ghost }) => (ghost ? 'rgba(255,255,255,0.4)' : active ? '#fff' : 'rgba(255,255,255,0.92)')};
  border-style: ${({ ghost }) => (ghost ? 'dashed' : 'solid')};
  padding: 0.4rem 0.7rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: ${({ ghost }) => (ghost ? 'default' : 'pointer')};
  &:hover {
    background: ${({ tone, ghost, active }) =>
      ghost ? 'transparent' : active ? tone : 'rgba(255,255,255,0.14)'};
  }
`;

const Branch = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.78rem;
  padding-left: 0.25rem;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid ${LINE};
  padding-top: 0.85rem;
`;

const Hint = styled.span`
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.72rem;
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
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (p?: string) => !!p && p.split('?')[0] === location.pathname;

  const go = (n: Node) => {
    if (!n.p || n.ghost) return;
    navigate(n.p);
    setOpen(false);
  };
  const doReset = () => {
    reset();
    navigate('/');
    setOpen(false);
  };

  const renderFlow = (nodes: Node[], tone: string) =>
    nodes.map((n, i) => (
      <Fragment key={n.l}>
        {i > 0 && <Arrow>→</Arrow>}
        <Chip
          tone={tone}
          ghost={n.ghost}
          active={isActive(n.p)}
          title={n.ghost ? 'Описан в схеме, ещё не собран' : undefined}
          onClick={() => go(n)}
        >
          {n.l}
        </Chip>
      </Fragment>
    ));

  return (
    <>
      {open && (
        <>
          <Backdrop onClick={() => setOpen(false)} />
          <Overlay>
            <Header>
              <HTitle>Карта экранов прототипа</HTitle>
              <Close onClick={() => setOpen(false)}>×</Close>
            </Header>

            <Lane>
              <RoleLabel c={GREEN}>Клиент</RoleLabel>
              <Flow>{renderFlow(CLIENT, GREEN)}</Flow>
            </Lane>

            <Branch>↳ Hybrid: клиент видит «на проверке», менеджер разбирает →</Branch>

            <Lane>
              <RoleLabel c={ORANGE}>Менеджер · DVU</RoleLabel>
              <Flow>{renderFlow(MANAGER, ORANGE)}</Flow>
            </Lane>

            <Lane>
              <RoleLabel c={BLUE}>Онбординг v2 · Sole Prop</RoleLabel>
              <Flow>{renderFlow(V2, BLUE)}</Flow>
            </Lane>

            <Footer>
              <Hint>Серые узлы — описаны в схеме, ещё не собраны</Hint>
              <IconBtn title="Сбросить демо-данные" onClick={doReset}>
                ↺
              </IconBtn>
            </Footer>
          </Overlay>
        </>
      )}
      <Fab title="Карта экранов" onClick={() => setOpen((o) => !o)}>
        ☰
      </Fab>
    </>
  );
};
