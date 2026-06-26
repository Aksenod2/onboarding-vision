// CRM-микросервис: доменная модель «одного окна». Материнская сущность — CompanyProfile,
// вокруг неё воронка Lead → Offer → Deal → Application (спека §3). ЛОКАЛЬНЫЕ типы, не из mock/v2.

import type { PAN, CIN, GSTIN, Address, IsoTimestamp } from './primitives';

// --- Юнионы (спека §3, Боря) ---

// Тип юрлица. Зеркалит онбординг, но это СВОЙ союз CRM (не reuse CompanyEntityType из mock/v2).
export type EntityType = 'Company' | 'Sole Proprietor' | 'LLP' | 'Partnership';

// Код продукта (Deal/Offer/Lead). 'current-account' — дефолт авто-оффера по завершении онбординга (UC-3).
export type ProductCode =
  | 'current-account'
  | 'deposit'
  | 'credit'
  | 'fx' // ВЭД / валютный контроль (сигнал AI summary, E2)
  | 'payroll';

// Откуда пришёл клиент/сущность (дропдаун «откуда», A4/G4). source у профиля и оффера/заявки.
export type ClientSource =
  | 'call' // оператор колл-центра завёл по телефону (G1)
  | 'potential' // потенциальный клиент (ручное заведение менеджером)
  | 'self-registration' // самостоятельная регистрация (H4)
  | 'onboarding' // пришёл из завершённого онбординга (зелёная зона, H1/H2)
  | 'probe42' // авто-заполнение из реестра Probe42 (G2)
  | 'online-bank'; // заявка из онлайн-банка существующего клиента (UC-5)

// Стадия сделки (Deal). Детали стадий — OQ-4 (у Дениса), здесь рабочий набор.
export type DealStage =
  | 'new'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

// Стадия заявки (Application). Зеркалит прогресс онбординга, приходит через адаптер.
export type ApplicationStage =
  | 'started'
  | 'data-collection'
  | 'identification' // VKYC/VCIP
  | 'signing'
  | 'bank-review' // проверка банка / DVU
  | 'completed';

// Статус заявки (Application). 'abandoned' — брошенная (UC-4); 'rejected' — отказ (D3).
export type ApplicationStatus = 'active' | 'abandoned' | 'rejected' | 'completed';

// Канал сделки/заявки.
export type Channel = 'online' | 'offline';

// --- Дочерние сущности воронки ---

// Lead — интерес к продукту (спека §3). Поля минимальны (детали — OQ-3).
export interface Lead {
  id: string;
  product: ProductCode;
  createdAt: IsoTimestamp;
  note?: string;
}

// Offer — коммерческое предложение. product ОБЯЗАТЕЛЕН (§3). Ссылка на онбординг рождается
// ИЗ оффера, не из профиля (I1, Хафизова) → onboardingLink живёт здесь.
export interface Offer {
  id: string;
  product: ProductCode; // обяз.
  expectedProfit?: number; // ожидаемая прибыль (в Cr / валюте — демо число)
  commission?: number; // комиссия
  source: ClientSource;
  tags: string[];
  description?: string;
  onboardingLink?: string; // ссылка на онбординг, привязана к офферу (I1)
  createdAt: IsoTimestamp;
  status?: 'open' | 'converted' | 'expired'; // 'converted' — выстрелил (стал Deal/Application)
}

// Deal — сделка из оффера (C3). kind/channel/stage (§3).
export interface Deal {
  id: string;
  kind: ProductCode; // deposit / current-account / credit…
  channel: Channel;
  stage: DealStage;
  createdAt: IsoTimestamp;
  offerId?: string; // из какого оффера выросла сделка
}

// Application — заявка онбординга (зеркало зелёной зоны, приходит через адаптер).
export interface Application {
  id: string;
  type: Channel; // online / offline-mode (C5)
  stage: ApplicationStage;
  status: ApplicationStatus; // active / abandoned / rejected (§3)
  source: ClientSource; // self-reg / online-bank (C6)
  updatedAt: IsoTimestamp;
  offerId?: string; // оффер, из которого родилась ссылка/заявка (I1)
  onboardingCaseId?: string; // id кейса в онбординге (для трассировки через адаптер)
}

// --- Подписант / продукт клиента (срез для карточки профиля, A5/A6) ---
// Снимок, дублирующий данные онбординга (НЕ ссылка на чужой домен).
export interface ProfileSignatory {
  fullName: string;
  role: string; // 'Director' / 'Authorized Signatory' / 'UBO' — строкой, свой словарь не нужен
  pan?: PAN;
}

// Готовый продукт клиента (A6) — уже открытый счёт/депозит и т.п.
export interface OwnedProduct {
  product: ProductCode;
  label: string; // человекочитаемое имя (демо)
  openedAt?: IsoTimestamp;
}

// --- Материнская сущность ---

// CompanyProfile — агрегатор (A1). primary: entityType · legalName · PAN (обяз., ключ) ·
// registeredAddress; CIN условный (Д2). Воронка хранится отдельными коллекциями в state,
// но getFunnel собирает её по profileId.
export interface CompanyProfile {
  id: string;
  entityType: EntityType;
  legalName: string;
  pan: PAN; // обяз. ключ (Д2)
  cin?: CIN; // условный (нет у Sole Proprietor)
  gstin?: GSTIN; // не primary, но хранится
  registeredAddress: Address;
  source: ClientSource;
  signatories?: ProfileSignatory[]; // срез подписантов (A5)
  products?: OwnedProduct[]; // готовые продукты клиента (A6)
  aiSummary?: string; // рекомендательная AI-сводка (E1, заглушка в v1)
  createdAt: IsoTimestamp;
}

// --- Событие истории коммуникаций / цифрового следа (D1/D2) ---
// Заполняется адаптером (onboarding.completed, dvu.result) и действиями менеджера.
export type HistoryEventKind =
  | 'note'
  | 'call'
  | 'meeting'
  | 'offer-created'
  | 'onboarding-completed'
  | 'application-stage'
  | 'dvu-result'
  | 'rejection';

export interface HistoryEvent {
  id: string;
  kind: HistoryEventKind;
  at: IsoTimestamp;
  title: string; // человекочитаемое (демо; локализацию RU/EN экраны добавят словарём)
  detail?: string;
}

// --- Воронка одного профиля (агрегат для CompanyProfile-экрана) ---
export interface Funnel {
  leads: Lead[];
  offers: Offer[];
  deals: Deal[];
  applications: Application[];
  history: HistoryEvent[];
}
