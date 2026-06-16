// Общие styled-компоненты экранов сценария Компания. Те же паттерны, что у Sole Proprietor
// (Card / CardHeader / CardBody), вынесены, чтобы не копировать в каждый экран.
import styled from 'styled-components';
import { textPrimary, textSecondary } from '@salutejs/sdds-themes/tokens';
import { accentPanel, radii, elevation, enter } from '../../../ui/designSystem';

export const Card = styled.div`
  background: #ffffff;
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  overflow: hidden;
  ${enter(0.05)};
`;

export const CardHeader = styled.div`
  ${accentPanel};
  padding: 1.25rem 1.75rem 1rem;
`;

export const Title = styled.h1`
  margin: 0 0 0.4rem;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: ${textPrimary};
`;

export const Subtitle = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${textSecondary};
`;

export const CardBody = styled.div`
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

// Ряд кнопок: «Назад» слева, основная справа (UX-гайд). Для одиночной кнопки — justify-content задаётся при использовании.
export const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
`;

export const ButtonRowEnd = styled.div`
  display: flex;
  justify-content: flex-end;
`;

// Блок согласия (зелёная рамка) — как у Sole Proprietor.
export const ConsentRow = styled.div`
  ${enter(0.12)};
  padding: 1rem 1.1rem;
  border: 1.5px solid rgba(33, 160, 56, 0.25);
  border-radius: ${radii.panel};
  background: rgba(33, 160, 56, 0.03);
`;

// Зелёная плашка успеха (Aadhaar/рассылка/подпись).
export const SuccessNote = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 1.1rem;
  border-radius: ${radii.panel};
  background: rgba(33, 160, 56, 0.08);
  border: 1px solid rgba(33, 160, 56, 0.28);
  color: #1a7a28;
  font-weight: 600;
  font-size: 0.9rem;
  ${enter(0)};

  .ic {
    flex-shrink: 0;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    background: rgb(33, 160, 56);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
  }
`;
