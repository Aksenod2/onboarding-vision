import { useNavigate } from 'react-router-dom';
import { BnqDialog } from '../../ui/v2/bnq/BnqDialog';
import type { BnqDataPort } from '../../ui/v2/bnq/BnqDialog';
import { getBnq, answerBnq, setStepStatus } from '../../mock/v2/api';
import { prevStepRoute, DASHBOARD_ROUTE } from '../../ui/v2/steps';

// SP-07 — BNQ-опросник Q1–Q11 (Sole Proprietor).
// Тонкая обёртка над общим движком BnqDialog (решение Кости 2026-06-18):
// логика опросника, ветвления, probe-режим, прогресс — внутри BnqDialog.
// Здесь только порт данных (mock/v2/api) и переходы потока ИП. У ИП нет leadStep
// (PAN — отдельный экран) и нет верхнего StepProgress — поведение как раньше.
// Роут: /v2/bnq

// Порт данных ИП: getBnq/answerBnq из общего mock-бэкенда Sole Proprietor.
const port: BnqDataPort = { getBnq, answerBnq };

export const SP07Bnq = () => {
  const navigate = useNavigate();

  return (
    <BnqDialog
      port={port}
      onFinish={async () => {
        try { await setStepStatus('bnq', 'done'); } catch (_) { /* игнорируем */ }
        navigate('/v2/data-consents');
      }}
      onBackFromFirst={() => navigate(prevStepRoute('bnq') ?? DASHBOARD_ROUTE)}
    />
  );
};
