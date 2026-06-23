// VideoIdentPanel — общий презентационный блок видеоидентификации (VKYC).
// Один визуал для двух мест: Sole Proprietor (SP09Vcip) и подписант компании (CompanySignatory),
// чтобы не плодить дубль камеры/LIVE/аватара/статуса. Чистая презентация — без бизнес-логики
// и без API: фаза приходит пропом, кнопки/согласия/переходы остаются в экранах.
import styled, { keyframes, css } from 'styled-components';
import {
  textPrimary,
  textSecondary,
  bodyM,
  bodySBold,
} from '@salutejs/sdds-themes/tokens';
import { eyebrow, radii } from '../designSystem';

// Фаза видеоблока: ожидание / идёт идентификация / пройдена.
export type VideoPhase = 'idle' | 'running' | 'done';

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(33, 160, 56, 0.45); }
  50%       { box-shadow: 0 0 0 10px rgba(33, 160, 56, 0); }
`;

// ─── Видеоплейсхолдер ────────────────────────────────────────────────────────

const CameraWrap = styled.div`
  position: relative;
  border-radius: ${radii.panel};
  overflow: hidden;
  background: #0d1117;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CameraNoise = styled.div`
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
  opacity: 0.18;
  pointer-events: none;
`;

const CameraIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.35);
  font-size: 1.75rem;
  z-index: 1;
`;

const CameraLabel = styled.div`
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  ${bodySBold};
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
  z-index: 1;
`;

// Активный индикатор «в эфире»
const LiveBadge = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 20px;
  padding: 0.2rem 0.6rem 0.2rem 0.45rem;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.3s;
`;

const LiveDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff3b30;
  animation: ${blink} 1.2s ease-in-out infinite;
`;

const LiveText = styled.span`
  ${bodySBold};
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  color: #ffffff;
  text-transform: uppercase;
`;

// Рамка активной сессии
const ActiveBorder = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  border-radius: ${radii.panel};
  border: ${({ $active }) => ($active ? '2px solid rgba(33, 160, 56, 0.65)' : '2px solid transparent')};
  transition: border-color 0.4s;
  pointer-events: none;
  z-index: 2;
  ${({ $active }) =>
    $active &&
    css`
      animation: ${pulse} 2s ease-in-out infinite;
    `}
`;

// ─── Инфо об участнике ───────────────────────────────────────────────────────

const ParticipantRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(33, 160, 56, 0.22), rgba(33, 160, 56, 0.08));
  border: 1.5px solid rgba(33, 160, 56, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  color: rgb(33, 160, 56);
  flex-shrink: 0;
`;

const ParticipantInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const ParticipantRole = styled.span`
  ${eyebrow};
  font-size: 0.68rem;
  color: ${textSecondary};
`;

const ParticipantName = styled.span`
  ${bodySBold};
  color: ${textPrimary};
`;

// ─── Статус-строка идентификации ─────────────────────────────────────────────

const StatusRow = styled.div<{ $type: 'running' | 'done' }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: ${radii.field};
  background: ${({ $type }) =>
    $type === 'done' ? 'rgba(33, 160, 56, 0.08)' : 'rgba(33, 160, 56, 0.04)'};
  border: 1px solid ${({ $type }) =>
    $type === 'done' ? 'rgba(33, 160, 56, 0.25)' : 'rgba(33, 160, 56, 0.12)'};
`;

const StatusDot = styled.span<{ $type: 'running' | 'done' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $type }) => ($type === 'done' ? 'rgb(33, 160, 56)' : 'rgba(33, 160, 56, 0.55)')};
  ${({ $type }) =>
    $type === 'running' &&
    css`
      animation: ${blink} 0.9s ease-in-out infinite;
    `}
`;

const StatusText = styled.span`
  ${bodyM};
  color: ${textPrimary};
`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

// Инициалы из ФИО (до двух символов).
const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export interface VideoIdentPanelProps {
  phase: VideoPhase;
  /** Имя участника (текущий заявитель / подписант). */
  participantName: string;
  /** Подписи (двуязычность задаёт экран). */
  cameraLabel: string;
  participantRole: string;
  runningText: string;
  doneText: string;
}

// Камера + LIVE-бейдж + пульс-рамка + участник + статус-строка.
// Статус-строка показывается на running/done; на idle её нет (хинт/согласие рисует экран).
export const VideoIdentPanel = ({
  phase,
  participantName,
  cameraLabel,
  participantRole,
  runningText,
  doneText,
}: VideoIdentPanelProps) => {
  const isRunning = phase === 'running';
  const isDone = phase === 'done';
  return (
    <Wrap>
      <CameraWrap>
        <CameraNoise />
        <CameraIcon>▶</CameraIcon>
        <CameraLabel>{cameraLabel}</CameraLabel>
        <LiveBadge $visible={isRunning}>
          <LiveDot />
          <LiveText>LIVE</LiveText>
        </LiveBadge>
        <ActiveBorder $active={isRunning} />
      </CameraWrap>

      <ParticipantRow>
        <Avatar>{initialsOf(participantName)}</Avatar>
        <ParticipantInfo>
          <ParticipantRole>{participantRole}</ParticipantRole>
          <ParticipantName>{participantName}</ParticipantName>
        </ParticipantInfo>
      </ParticipantRow>

      {isRunning && (
        <StatusRow $type="running">
          <StatusDot $type="running" />
          <StatusText>{runningText}</StatusText>
        </StatusRow>
      )}
      {isDone && (
        <StatusRow $type="done">
          <StatusDot $type="done" />
          <StatusText>{doneText}</StatusText>
        </StatusRow>
      )}
    </Wrap>
  );
};
