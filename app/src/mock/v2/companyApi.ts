// «Локальный бэкенд понарошку» для сценария КОМПАНИЯ. Стейт в памяти, отдельно от SP-api.
// Источник: docs/Компания — спека ДЕТАЛЬНАЯ (логика).md.

import { mehtaTextiles } from './companySeed';
import type {
  CompanyCaseV2, CompanyDetails, Signatory, SignatoryStep, BoardResolution, BrSource,
  Ubo, FatcaClassification, CompanyDocument,
} from './companyTypes';
import { goesThroughPhaseB } from './companyTypes';
import type { ConsentType, BnqAnswer } from './types';

let state: CompanyCaseV2 = structuredClone(mehtaTextiles);

const NETWORK_DELAY_MS = 350;
const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));

// IST-таймстамп (для согласий/подписей). В демо берём фиксированный вид.
const nowIST = (): string => new Date().toISOString();

// --- Чтение ---
export const getCompanyCase = (): Promise<CompanyCaseV2> => delay(state);
export const getCompany = (): Promise<CompanyDetails> => delay(state.company);
export const getSignatories = (): Promise<Signatory[]> => delay(state.signatories);
export const getSignatory = (id: string): Promise<Signatory | undefined> =>
  delay(state.signatories.find((s) => s.id === id));
export const getBoardResolution = (): Promise<BoardResolution> => delay(state.br);
export const getBnq = (): Promise<BnqAnswer[]> => delay(state.bnq);
export const getUbo = (): Promise<Ubo[]> => delay(state.ubo);
export const getCompanyDocuments = (): Promise<CompanyDocument[]> => delay(state.companyDocuments);

// --- Вход компании (точка входа = Aadhaar-авторизация) ---

const emptyEntry = () => ({ consentsGiven: false, aadhaarVerified: false, passcodeSet: false });

export const getCompanyEntry = (): Promise<NonNullable<CompanyCaseV2['entry']>> =>
  delay(state.entry ?? emptyEntry());

// Согласия ДО Aadhaar (регуляторика): Aadhaar eKYC consent + Privacy Notice + согласие на реестры.
export const giveCompanyEntryConsent = (): Promise<void> => {
  state.entry = { ...(state.entry ?? emptyEntry()), consentsGiven: true };
  // Фиксируем доступ к реестрам на уровне компании (как giveCompanyConsent на PAN).
  state.consents = state.consents.map((c) =>
    c.type === 'Registry Access' ? { ...c, status: 'given', timestamp: nowIST() } : c,
  );
  return delay(undefined);
};

// Aadhaar-авторизация инициатора: «скан» QR → данные из UIDAI (подтягиваем email/phone).
export const passCompanyAadhaar = (): Promise<{ email: string; phone: string }> => {
  // Контакты инициатора (демо) — из первого директора сид-компании.
  const initiator = state.signatories[0];
  const email = initiator?.email ?? 'rajesh.mehta@mehtatextiles.in';
  const phone = initiator?.phone ?? '+91 98201 33445';
  state.entry = { ...(state.entry ?? emptyEntry()), aadhaarVerified: true, email, phone };
  return delay({ email, phone });
};

// Пин-код (цифры) = креды интернет-банка. Логин привязан к email (заглушка Марго).
export const setCompanyPasscode = (passcode: string): Promise<void> => {
  state.entry = { ...(state.entry ?? emptyEntry()), passcodeSet: true, passcode };
  return delay(undefined);
};

// Повторный вход (Денис: email + пин). Демо: сверяем email/пин с сохранёнными во входе.
export const loginCompany = (email: string, passcode: string): Promise<boolean> => {
  const e = state.entry;
  // Email сравниваем регистронезависимо (Глеб): name@Company.in === name@company.in.
  const emailMatch = (e?.email ?? '').toLowerCase() === email.toLowerCase();
  const ok = !!e?.passcodeSet && emailMatch && e?.passcode === passcode;
  return delay(ok);
};

// --- Фаза A ---

// Согласие уровня компании (Registry Access на шаге PAN).
export const giveCompanyConsent = (type: ConsentType, timestamp = nowIST()): Promise<void> => {
  state.consents = state.consents.map((c) =>
    c.type === type ? { ...c, status: 'given', timestamp } : c,
  );
  return delay(undefined);
};

// Добавить подписанта вручную (Authorized Signatory не из реестра).
// BRD: «nominated person can add other AS». Возвращает id созданного подписанта.
let manualSeq = 0;
export const addSignatory = (input: { fullName: string; email: string; phone: string }): Promise<string> => {
  const id = `sig-as-${Date.now()}-${manualSeq++}`;
  const next: Signatory = {
    id,
    fullName: input.fullName,
    roles: ['AuthorizedSignatory'],
    pan: '', // не из реестра — PAN привяжется в личной сессии (Aadhaar eKYC)
    panSource: 'manual',
    email: input.email,
    phone: input.phone,
    inviteSent: false,
    currentStep: 'waiting',
    status: 'waiting',
    consents: [
      { type: 'Privacy Notice', mandatory: true, status: 'pending', screen: 'CO-B1' },
      { type: 'Data Principals', mandatory: true, status: 'pending', screen: 'CO-B1' },
      { type: 'Aadhaar', mandatory: true, status: 'pending', screen: 'CO-B2' },
      { type: 'VKYC', mandatory: true, status: 'pending', screen: 'CO-B3' },
    ],
    vcip: { personName: input.fullName, method: 'selfVKYC', status: 'Pending' },
    signature: { signed: false, method: 'DSC' },
  };
  state.signatories = [...state.signatories, next];
  return delay(id);
};

// Обновить контактные данные подписанта (ФИО/email/телефон) — для редактируемых AS-карточек.
export const updateSignatoryContact = (
  id: string,
  patch: { fullName?: string; email?: string; phone?: string },
): Promise<Signatory[]> => {
  state.signatories = state.signatories.map((s) =>
    s.id === id ? { ...s, ...patch } : s,
  );
  return delay(state.signatories);
};

// Удалить подписанта, добавленного вручную (AS без роли Director).
// Защита: директоров (registry) и комбинированные роли не трогаем.
export const removeSignatory = (id: string): Promise<Signatory[]> => {
  state.signatories = state.signatories.filter((s) => {
    if (s.id !== id) return true;
    const removable = s.roles.includes('AuthorizedSignatory') && !s.roles.includes('Director');
    return !removable; // удаляем только если это «чистый» AS
  });
  return delay(state.signatories);
};

// Источник Board Resolution: шаблон банка (STP) либо загрузка своего (→ DVU).
export const setBoardResolutionSource = (source: BrSource, fileName?: string): Promise<BoardResolution> => {
  state.br = {
    ...state.br,
    brSource: source,
    template: source === 'template' ? 'bank' : 'own',
    brFileName: source === 'upload' ? fileName : undefined,
  };
  return delay(state.br);
};

// Подтверждение состава BR (фаза A, BR-вопросы): фиксируем подписантов + генерим BR.
export const confirmBoardResolution = (): Promise<BoardResolution> => {
  const ts = nowIST();
  state.br = { ...state.br, confirmed: true, confirmedAt: ts, date: ts };
  return delay(state.br);
};

// Правка ответа бизнес-анкеты (агентность: представитель может скорректировать предзаполненное).
export const updateBnqAnswer = (q: string, value: string): Promise<BnqAnswer[]> => {
  state.bnq = state.bnq.map((a) => (a.q === q ? { ...a, value } : a));
  return delay(state.bnq);
};

// Правка данных компании (фаза A): корреспондентский адрес (manual) и т.п.
export const updateCompanyData = (patch: Partial<CompanyDetails>): Promise<CompanyDetails> => {
  state.company = { ...state.company, ...patch };
  return delay(state.company);
};

// --- UBO + FATCA/CRS (бизнес-профиль, BRD #8) ---
let uboSeq = 0;
export const addUbo = (input: { fullName: string; sharePct: number }): Promise<Ubo[]> => {
  const next: Ubo = {
    id: `ubo-${Date.now()}-${uboSeq++}`,
    fullName: input.fullName,
    sharePct: input.sharePct,
    source: 'manual',
  };
  state.ubo = [...state.ubo, next];
  return delay(state.ubo);
};

export const updateUbo = (id: string, patch: Partial<Omit<Ubo, 'id'>>): Promise<Ubo[]> => {
  state.ubo = state.ubo.map((u) => (u.id === id ? { ...u, ...patch } : u));
  return delay(state.ubo);
};

export const removeUbo = (id: string): Promise<Ubo[]> => {
  state.ubo = state.ubo.filter((u) => u.id !== id);
  return delay(state.ubo);
};

export const setUboDeclared = (declared: boolean): Promise<void> => {
  state.uboDeclared = declared;
  return delay(undefined);
};

// Раздел UBO правился вручную (добавлен/изменён бенефициар не из реестра) → modified → в DVU.
export const setUboModified = (modified: boolean): Promise<void> => {
  state.uboModified = modified;
  return delay(undefined);
};

// Загрузить Shareholding Pattern (заверен CA, действующий UDIN) — один на весь раздел UBO.
export const uploadUboShareholdingDoc = (fileName: string): Promise<void> => {
  state.uboShareholdingDoc = { fileName };
  return delay(undefined);
};

export const setFatca = (classification: FatcaClassification, taxResidency: string): Promise<void> => {
  state.fatcaClassification = classification;
  state.taxResidency = taxResidency;
  return delay(undefined);
};

// --- Документы компании (#16 — fallback-загрузка) ---

// Загрузить недостающий документ (source 'required' → 'uploaded').
export const uploadCompanyDocument = (id: string, fileName: string): Promise<CompanyDocument[]> => {
  state.companyDocuments = state.companyDocuments.map((d) =>
    d.id === id ? { ...d, source: 'uploaded', fileName } : d,
  );
  return delay(state.companyDocuments);
};

// Заменить подтянутый/загруженный документ своим файлом (source → 'uploaded').
export const replaceCompanyDocument = (id: string, fileName = 'document.pdf'): Promise<CompanyDocument[]> => {
  state.companyDocuments = state.companyDocuments.map((d) =>
    d.id === id ? { ...d, source: 'uploaded', fileName } : d,
  );
  return delay(state.companyDocuments);
};

// #34 — догрузка документа по обратному запросу банка (DVU). Возвращает обновлённый запрос.
export const uploadDvuDocument = (fileName: string): Promise<CompanyCaseV2['dvuRequest']> => {
  if (state.dvuRequest) {
    state.dvuRequest = { ...state.dvuRequest, status: 'uploaded', fileName };
  }
  return delay(state.dvuRequest);
};

// Подтверждение данных компании (фаза A, экран обзора).
export const confirmCompanyData = (): Promise<void> => {
  state.dataConfirmed = true;
  return delay(undefined);
};

// Рассылка ссылок подписантам: всем, кто проходит фазу B (Director/AS).
export const dispatchInvites = (): Promise<Signatory[]> => {
  state.signatories = state.signatories.map((s) =>
    goesThroughPhaseB(s) ? { ...s, inviteSent: true } : s,
  );
  state.status = 'InProgress';
  state.currentScreen = 'CO-DASHBOARD';
  return delay(state.signatories);
};

// Напомнить подписанту (mock: помечаем reminderSent на карточке).
export const remindSignatory = (id: string): Promise<Signatory[]> => {
  state.signatories = state.signatories.map((s) =>
    s.id === id ? { ...s, reminderSent: true } : s,
  );
  return delay(state.signatories);
};

// --- Фаза B (по конкретному подписанту) ---

// Продвинуть шаг подписанта. status выводится из шага.
export const setSignatoryStep = (id: string, step: SignatoryStep): Promise<Signatory[]> => {
  state.signatories = state.signatories.map((s) => {
    if (s.id !== id) return s;
    const status: Signatory['status'] = step === 'done' ? 'done' : step === 'waiting' ? 'waiting' : 'in_progress';
    return { ...s, currentStep: step, status };
  });
  recomputeCompletion();
  return delay(state.signatories);
};

// Личное согласие подписанта (фаза B).
export const giveSignatoryConsent = (id: string, type: ConsentType, timestamp = nowIST()): Promise<void> => {
  state.signatories = state.signatories.map((s) =>
    s.id === id
      ? { ...s, consents: s.consents.map((c) => (c.type === type ? { ...c, status: 'given', timestamp } : c)) }
      : s,
  );
  return delay(undefined);
};

// Подписант прошёл видеоидентификацию.
export const passSignatoryVcip = (id: string): Promise<void> => {
  state.signatories = state.signatories.map((s) =>
    s.id === id ? { ...s, vcip: { ...s.vcip, status: 'Passed' } } : s,
  );
  return delay(undefined);
};

// Подписант поставил DSC-подпись (#35: НЕ терминально — после подписи идёт VKYC).
// Ставит только signature.signed=true и переводит на шаг 'vkyc'. НЕ ставит done,
// НЕ зовёт recomputeCompletion — завершение происходит на финальном шаге vkyc.
export const signByDsc = (id: string): Promise<Signatory[]> => {
  const ts = nowIST();
  state.signatories = state.signatories.map((s) =>
    s.id === id
      ? { ...s, signature: { signed: true, method: 'DSC', timestamp: ts }, currentStep: 'vkyc', status: 'in_progress' }
      : s,
  );
  return delay(state.signatories);
};

// --- Демо-симуляция живого мониторинга ---
// Линейная цепочка прогресса подписанта (для авто-продвижения по Refresh).
const STEP_CHAIN: SignatoryStep[] = ['waiting', 'consents', 'aadhaar', 'vkyc', 'dsc-sign', 'done'];

// Продвинуть всех ещё не завершённых подписантов фазы B на следующий этап.
// Демо: каждый клик «Обновить статусы» двигает не-done подписантов вперёд.
// Чтобы выглядело «вживую» (вразнобой), на первом продвижении даём головной
// старт первому подписанту в списке — так за 2–3 клика картина: один done,
// другой в процессе, третий ждёт. Через несколько кликов — все done.
let advanceTick = 0;
export const advanceSignatories = (): Promise<Signatory[]> => {
  advanceTick += 1;
  state.signatories = state.signatories.map((s, idx) => {
    if (!goesThroughPhaseB(s) || s.status === 'done') return s;
    const cur = STEP_CHAIN.indexOf(s.currentStep);
    const base = cur < 0 ? 0 : cur;
    // Лёгкий разнобой: первый клик двигает «верхних» в списке на шаг больше.
    const boost = advanceTick === 1 && idx === 0 ? 2 : 1;
    const nextIdx = Math.min(base + boost, STEP_CHAIN.length - 1);
    const step = STEP_CHAIN[nextIdx];
    const status: Signatory['status'] =
      step === 'done' ? 'done' : step === 'waiting' ? 'waiting' : 'in_progress';
    // Дотягиваем артефакты, чтобы карточка/детали были консистентны при done.
    const signature = step === 'done' || base >= STEP_CHAIN.indexOf('dsc-sign')
      ? { signed: true as const, method: 'DSC' as const, timestamp: nowIST() }
      : s.signature;
    const vcip = step === 'done' || base >= STEP_CHAIN.indexOf('vkyc')
      ? { ...s.vcip, status: 'Passed' as const }
      : s.vcip;
    return { ...s, currentStep: step, status, signature, vcip };
  });
  recomputeCompletion();
  return delay(state.signatories);
};

// Счёт открыт ⟺ все подписанты (с ролью Director/AS) = done.
function recomputeCompletion(): void {
  const required = state.signatories.filter(goesThroughPhaseB);
  const allDone = required.length > 0 && required.every((s) => s.status === 'done');
  state.status = allDone ? 'Completed' : 'InProgress';
}

export const isAccountOpen = (): boolean => state.status === 'Completed';

// --- #43 — интернет-банк (растворение онбординга) ---

export interface BankAccount {
  number: string;
  ifsc: string;
  frozen: boolean;
  holderName: string; // имя представителя/инициатора (с возвращением, …)
  company: string;
}

// Реквизиты счёта (те же, что показывает дашборд в блоке «Счёт открыт»).
const ACCOUNT_NUMBER = '5021 4477 9012 3456';
const ACCOUNT_IFSC = 'SBIN0099001';

export const getBankAccount = (): Promise<BankAccount> => {
  // Имя владельца — заполнитель (CustomerRepresentative), иначе первый подписант.
  const rep = state.signatories.find((s) => s.roles.includes('CustomerRepresentative'))
    ?? state.signatories[0];
  return delay({
    number: ACCOUNT_NUMBER,
    ifsc: ACCOUNT_IFSC,
    frozen: state.accountFrozen ?? false,
    holderName: rep?.fullName ?? '',
    company: state.company.legalName,
  });
};

// Снять фриз со счёта (первый вход в интернет-банк → «фриз снят» как опыт).
export const unfreezeAccount = (): Promise<void> => {
  state.accountFrozen = false;
  return delay(undefined);
};

// Сброс демо.
export const resetCompany = (): void => {
  state = structuredClone(mehtaTextiles);
};
