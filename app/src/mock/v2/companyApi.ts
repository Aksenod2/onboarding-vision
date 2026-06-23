// «Локальный бэкенд понарошку» для сценария КОМПАНИЯ. Стейт в памяти, отдельно от SP-api.
// Источник: docs/Компания — спека ДЕТАЛЬНАЯ (логика).md.

import { mehtaTextiles } from './companySeed';
import type {
  CompanyCaseV2, CompanyDetails, Signatory, SignatoryStep, BoardResolution, BrSource,
  Ubo, FatcaClassification, CompanyDocument, AadhaarResult, BrSignerConfig,
  ApplicationBlock, Director,
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

// --- Блоки заявки (верхний уровень двухуровневого дашборда, Б.1/Б.3) ---
// Возвращаем обзор блоков «что с моей заявкой» со статусами. Статус блока
// «Personal Identification & Signing» выводим из прогресса подписантов; остальные —
// демо-значения (банк ещё не подтвердил → 'verify', спокойный сине-серый).
// TODO: полный перечень блоков от Марго (ОВ-Б1) — список конфигурируемый, дополняется без правки UI.
export const getApplicationBlocks = (): Promise<ApplicationBlock[]> => {
  const required = state.signatories.filter(goesThroughPhaseB);
  const allDone = required.length > 0 && required.every((s) => s.status === 'done');
  const anyStarted = required.some((s) => s.status !== 'waiting');
  // #25/#23 — обратный запрос банка (DVU) больше не отдельная панель и больше не висит на
  // отдельной строке «Бизнес-профиль и UBO» (её убрали: дублировала «Данные компании»).
  // Запрос «Source of funds» перепривязан к блоку «Идентификация и подписание»: пока документ
  // не догружен — этот блок получает статус 'in-request'. Загрузка — в карточке на дашборде.
  const bankRequestOpen = state.dvuRequest?.status === 'requested';
  const identStatus: ApplicationBlock['status'] = bankRequestOpen
    ? 'in-request'
    : allDone ? 'done' : anyStarted ? 'in-progress' : 'verify';
  // Единый нейминг (дизайн-бриф §3): одна сущность = одна строка и здесь, и в COMPANY_HUB_ITEMS.
  const blocks: ApplicationBlock[] = [
    { id: 'company-details', titleRu: 'Данные компании', titleEn: 'Company details', status: 'verify', kind: 'static' },
    { id: 'board-resolution', titleRu: 'Подписанты и решение совета', titleEn: 'Signatories & Board Resolution', status: state.br.confirmed ? 'done' : 'verify', kind: 'static' },
    { id: 'identification-signing', titleRu: 'Идентификация и подписание', titleEn: 'Personal Identification & Signing', status: identStatus, kind: 'identification-signing' },
    // VKYC отдельным блоком не выносим: это под-шаг сессии подписанта и под-статус участника
    // (внутри «Идентификация и подписание» VKYC уже отражён парой «Подписание + VKYC» по каждому).
    // TODO: полный перечень блоков от Марго (например, FATCA/CRS, Source of funds) — добавить сюда.
  ];
  return delay(blocks);
};

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

// Aadhaar-авторизация инициатора: «скан» QR → данные из UIDAI (5 полей; номер маскирован).
// Письмо Марго 19.06: name / aadhaar number ******XXXX / telephone / email / address.
export const passCompanyAadhaar = (): Promise<AadhaarResult> => {
  // Данные инициатора (демо) — из Aadhaar-результата ассистента-заполнителя
  // (CustomerRepresentative). Это дефолтный инициатор заявки, а не первый подписант.
  const initiator = state.signatories.find((s) => s.roles.includes('CustomerRepresentative'))
    ?? state.signatories[0];
  const result: AadhaarResult = initiator?.aadhaarResult ?? {
    name: 'Karan Verma',
    aadhaarMasked: 'XXXX XXXX 9034',
    phone: '+91 98200 11223',
    email: 'karan.verma@mehtatextiles.in',
    address: '21, Lokhandwala Complex, Andheri West, Mumbai, Maharashtra — 400053',
  };
  state.entry = {
    ...(state.entry ?? emptyEntry()),
    aadhaarVerified: true,
    email: result.email,
    phone: result.phone,
    aadhaar: result,
  };
  return delay(result);
};

// Aadhaar eKYC приглашённого подписанта (фаза B): «скан» QR → 5 полей из UIDAI.
// Если у подписанта в сиде нет aadhaarResult (добавлен вручную) — собираем из его контактов.
export const passSignatoryAadhaar = (id: string): Promise<AadhaarResult> => {
  const sig = state.signatories.find((s) => s.id === id);
  const result: AadhaarResult = sig?.aadhaarResult ?? {
    name: sig?.fullName ?? '',
    aadhaarMasked: 'XXXX XXXX 0000',
    phone: sig?.phone ?? '',
    email: sig?.email ?? '',
    address: 'India',
  };
  state.signatories = state.signatories.map((s) =>
    s.id === id ? { ...s, aadhaarResult: result } : s,
  );
  return delay(result);
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

// Сохранить срез акта назначения AS (кто подписывает BR / кто AS / governance смены).
export const setBrSignerConfig = (patch: Partial<BrSignerConfig>): Promise<BoardResolution> => {
  state.br = { ...state.br, signerConfig: { ...state.br.signerConfig, ...patch } };
  return delay(state.br);
};

// --- Назначение Authorized Signatory из ОПРОСНИКА (вопрос QAS) / правка в финальной анкете ---
// Единый вход для сохранения выбора AS: вызывается из опросника (CompanyBnqDialog) и из правки
// в финальной анкете (CompanyConfirm). Пишет в state.br.signerConfig (единственный источник AS),
// синхронизирует человекочитаемый снимок в ответ bnq QAS (golden record).
export interface AsAssignment {
  asMode: BrSignerConfig['asMode'];
  // ветка 'from-directors': id директора из state.directors + контакты (ручной ввод)
  asDirectorId?: string;
  asDirectorEmail?: string;
  asDirectorPhone?: string;
  // ветка 'new-person': «свой» AS — ФИО, должность/роль, контакты (БЕЗ PAN — его вводит сам AS в сессии)
  asNewName?: string;
  asNewDesignation?: string;
  asNewEmail?: string;
  asNewPhone?: string;
}

export const setAsFromBnq = (a: AsAssignment): Promise<BoardResolution> => {
  const cfg: BrSignerConfig = {
    ...state.br.signerConfig,
    asMode: a.asMode,
    asDirectorId: a.asMode === 'from-directors' ? (a.asDirectorId ?? null) : null,
    asDirectorEmail: a.asDirectorEmail ?? state.br.signerConfig.asDirectorEmail,
    asDirectorPhone: a.asDirectorPhone ?? state.br.signerConfig.asDirectorPhone,
    asNewName: a.asNewName ?? state.br.signerConfig.asNewName,
    asNewDesignation: a.asNewDesignation ?? state.br.signerConfig.asNewDesignation,
    asNewEmail: a.asNewEmail ?? state.br.signerConfig.asNewEmail,
    asNewPhone: a.asNewPhone ?? state.br.signerConfig.asNewPhone,
    asAssigned: true,
  };
  state.br = { ...state.br, signerConfig: cfg };
  // Человекочитаемый снимок в bnq QAS (golden record).
  let snapshot = '';
  if (a.asMode === 'from-directors' && cfg.asDirectorId) {
    const d = state.directors.find((x) => x.id === cfg.asDirectorId);
    snapshot = d ? `${d.fullName} (${d.designation})` : '';
  } else if (a.asMode === 'new-person') {
    snapshot = cfg.asNewDesignation ? `${cfg.asNewName} (${cfg.asNewDesignation})` : cfg.asNewName;
  }
  if (snapshot) state.bnq = state.bnq.map((x) => (x.q === 'QAS' ? { ...x, value: snapshot } : x));
  return delay(state.br);
};

// DEPRECATED: заменено на buildPhaseBSignatories (единый источник директоров = state.directors).
// Оставлено для обратной совместимости контракта; в BR больше не вызывается.
// Назначить РОВНО ОДНОГО Authorised Signatory из директоров (ветка 'from-directors').
// Снимает роль AuthorizedSignatory со всех директоров, ставит её выбранному.
// «Чистые» AS (новое лицо) при этом удаляются — единственный AS теперь директор.
export const setAsFromDirector = (
  directorId: string,
  contact?: { email?: string; phone?: string },
): Promise<Signatory[]> => {
  state.signatories = state.signatories
    // выкинуть «чистых» AS (новое лицо), оставшихся от прошлой ветки
    .filter((s) => !(s.roles.includes('AuthorizedSignatory') && !s.roles.includes('Director')))
    .map((s) => {
      if (!s.roles.includes('Director')) return s;
      const isTarget = s.id === directorId;
      // пересобрать роли: убрать AS у всех директоров, добавить выбранному
      const roles: Signatory['roles'] = s.roles.filter((r) => r !== 'AuthorizedSignatory');
      if (isTarget) roles.push('AuthorizedSignatory');
      const patch = isTarget && contact ? { email: contact.email ?? s.email, phone: contact.phone ?? s.phone } : {};
      return { ...s, roles, ...patch };
    });
  return delay(state.signatories);
};

// DEPRECATED: заменено на buildPhaseBSignatories. Оставлено для совместимости контракта.
// Назначить единственного AS как НОВОЕ ЛИЦО (ветка 'new-person').
// Снимает роль AuthorizedSignatory со всех директоров, держит ровно одну «чистую» AS-запись.
let asNewSeq = 0;
export const setAsNewPerson = (
  input: { fullName: string; pan: string; email: string; phone: string },
): Promise<Signatory[]> => {
  // снять AS со всех директоров
  let next = state.signatories.map((s) =>
    s.roles.includes('Director')
      ? { ...s, roles: s.roles.filter((r) => r !== 'AuthorizedSignatory') }
      : s,
  );
  // найти существующую «чистую» AS-запись (новое лицо) — обновить, иначе создать
  const cleanAs = next.find((s) => s.roles.includes('AuthorizedSignatory') && !s.roles.includes('Director'));
  if (cleanAs) {
    next = next.map((s) =>
      s.id === cleanAs.id
        ? { ...s, fullName: input.fullName, pan: input.pan, email: input.email, phone: input.phone }
        : s,
    );
    // оставить только эту «чистую» AS среди новых лиц (удалить лишние, если были)
    next = next.filter((s) =>
      s.id === cleanAs.id || !(s.roles.includes('AuthorizedSignatory') && !s.roles.includes('Director')),
    );
  } else {
    const id = `sig-as-new-${Date.now()}-${asNewSeq++}`;
    next = [...next, {
      id,
      fullName: input.fullName,
      roles: ['AuthorizedSignatory'],
      pan: input.pan,
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
    }];
  }
  state.signatories = next;
  return delay(state.signatories);
};

// DEPRECATED: заменено на buildPhaseBSignatories. Оставлено для совместимости контракта.
// Обновить контакты подписывающих BR директоров (email/phone — ручной ввод, в Probe их нет).
export const setBrSignerContacts = (
  contacts: Record<string, { email: string; phone: string }>,
): Promise<Signatory[]> => {
  state.signatories = state.signatories.map((s) =>
    contacts[s.id] ? { ...s, email: contacts[s.id].email, phone: contacts[s.id].phone } : s,
  );
  return delay(state.signatories);
};

// --- Сборка участников фазы B из ВЫБОРА в Board Resolution (единый источник директоров) ---
// Директора живут в state.directors (мастер-список, правит финальная анкета). BR ЧИТАЕТ его,
// выбирает подписывающих + одного AS, и здесь мы пересобираем state.signatories для фазы B:
//   подписывающие BR (директора/секретарь) + единственный AS + инициатор (CustomerRepresentative).
// Одно лицо = одна запись с объединёнными ролями (мэтчим директора с инициатором по PAN/имени).
// Сохраняем уже существующие записи (контакты, прогресс, aadhaarResult) — не теряем фазу B,
// если BR пересобирается повторно. id записи директора = `sig-<directorId>` (стабильно, идемпотентно).
export interface BrSelection {
  signerMode: import('./companyTypes').BrSignerMode;
  // ветка 'directors': выбранные директора-подписанты (id из state.directors) + их контакты (ручной ввод)
  signingDirectorIds: string[];
  directorContacts: Record<string, { email: string; phone: string }>;
  // ветка 'secretary': один Company Secretary подписывает (в Probe контактов нет → ручной ввод)
  secretary?: { fullName: string; email: string; phone: string };
  // единственный AS
  asMode: import('./companyTypes').AsMode;
  asDirectorId?: string; // ветка 'from-directors' — id из state.directors
  asContact?: { email: string; phone: string };
  asNewPerson?: { fullName: string; pan: string; email: string; phone: string }; // ветка 'new-person'
}

// Базовый каркас подписанта (личная сессия фазы B ещё не начата).
const freshSignatory = (
  input: { id: string; fullName: string; roles: Signatory['roles']; pan: string; panSource: Signatory['panSource']; email: string; phone: string; designation?: string },
): Signatory => ({
  id: input.id,
  fullName: input.fullName,
  roles: input.roles,
  pan: input.pan,
  panSource: input.panSource,
  email: input.email,
  phone: input.phone,
  designation: input.designation,
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
});

export const buildPhaseBSignatories = (sel: BrSelection): Promise<Signatory[]> => {
  const prev = state.signatories;
  // Инициатор (CustomerRepresentative) обязан сохраниться: за ним вход/дашборд/сессия.
  const initiator = prev.find((s) => s.roles.includes('CustomerRepresentative'));

  // Мэтч «директор ↔ уже существующая запись подписанта» по PAN, иначе по имени —
  // чтобы переиспользовать контакты/прогресс/aadhaarResult и объединить роли.
  const findExisting = (d: { pan: string; fullName: string }): Signatory | undefined =>
    prev.find((s) => (d.pan && s.pan && s.pan === d.pan) || s.fullName === d.fullName);

  // Накопитель: один человек = одна запись (ключ — итоговый id), роли объединяем.
  const acc = new Map<string, Signatory>();
  const put = (sig: Signatory, addRoles: Signatory['roles']) => {
    const cur = acc.get(sig.id);
    if (cur) {
      const roles = Array.from(new Set([...cur.roles, ...addRoles])) as Signatory['roles'];
      acc.set(sig.id, { ...cur, roles });
    } else {
      const roles = Array.from(new Set([...sig.roles, ...addRoles])) as Signatory['roles'];
      acc.set(sig.id, { ...sig, roles });
    }
  };

  // Готовим запись из директора (мастер-список) с контактами из BR (роль доклеивается через put).
  const fromDirector = (
    directorId: string,
    contact?: { email: string; phone: string },
  ): Signatory | undefined => {
    const d = state.directors.find((x) => x.id === directorId);
    if (!d) return undefined;
    const existing = findExisting(d);
    const id = existing?.id ?? `sig-${d.id}`;
    const email = contact?.email?.trim() || existing?.email || '';
    const phone = contact?.phone?.trim() || existing?.phone || '';
    // roles обнуляем: итоговые роли набираются ТОЛЬКО из выбора в BR (через put),
    // чтобы устаревшие роли прежнего состава не «протекали» в новую фазу B.
    const base = existing
      ? { ...existing, roles: [] as Signatory['roles'], fullName: d.fullName, pan: d.pan, designation: d.designation, email, phone }
      : freshSignatory({ id, fullName: d.fullName, roles: [], pan: d.pan, panSource: d.source === 'registry' ? 'registry' : 'manual', email, phone, designation: d.designation });
    return base;
  };

  // 1) Подписывающие Board Resolution.
  if (sel.signerMode === 'directors') {
    for (const dirId of sel.signingDirectorIds) {
      const sig = fromDirector(dirId, sel.directorContacts[dirId]);
      if (sig) put(sig, ['Director']);
    }
  } else if (sel.signerMode === 'secretary' && sel.secretary) {
    // Секретарь не из реестра директоров — отдельная запись (роль Director для прохождения фазы B).
    const sec = sel.secretary;
    const existing = prev.find((s) => s.fullName === sec.fullName);
    const id = existing?.id ?? 'sig-secretary';
    const base = existing
      ? { ...existing, roles: [] as Signatory['roles'], fullName: sec.fullName, email: sec.email, phone: sec.phone }
      : freshSignatory({ id, fullName: sec.fullName, roles: [], pan: '', panSource: 'manual', email: sec.email, phone: sec.phone, designation: 'Company Secretary' });
    put(base, ['Director']);
  }

  // 2) Единственный Authorised Signatory.
  if (sel.asMode === 'from-directors' && sel.asDirectorId) {
    const sig = fromDirector(sel.asDirectorId, sel.asContact);
    if (sig) put(sig, ['AuthorizedSignatory']);
  } else if (sel.asMode === 'new-person' && sel.asNewPerson) {
    const p = sel.asNewPerson;
    const existing = prev.find((s) => (p.pan && s.pan === p.pan) || s.fullName === p.fullName);
    const id = existing?.id ?? `sig-as-new-${Date.now()}-${asNewSeq++}`;
    const base = existing
      ? { ...existing, roles: [] as Signatory['roles'], fullName: p.fullName, pan: p.pan, panSource: 'manual' as const, email: p.email, phone: p.phone }
      : freshSignatory({ id, fullName: p.fullName, roles: [], pan: p.pan, panSource: 'manual', email: p.email, phone: p.phone });
    put(base, ['AuthorizedSignatory']);
  }

  // 3) Инициатор (CustomerRepresentative) обязан остаться в составе фазы A/B.
  // Если он уже попал в acc как директор/AS — просто доклеиваем роль; иначе добавляем как есть.
  if (initiator) {
    const already = acc.get(initiator.id);
    if (already) {
      put(already, ['CustomerRepresentative']);
    } else {
      // Инициатор не выбран ни подписантом, ни AS: оставляем его только с ролью
      // CustomerRepresentative (стираем возможные устаревшие Director/AS из прежнего состава),
      // чтобы он не «протёк» в фазу B (goesThroughPhaseB) без явного выбора.
      put({ ...initiator, roles: [] }, ['CustomerRepresentative']);
    }
  }

  state.signatories = Array.from(acc.values());
  return delay(state.signatories);
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
  // Q4b — FATCA/CRS перенесён в опросник: синхронизируем golden record (classification + страна),
  // чтобы fatcaClassification/taxResidency приходили из опросника, а не из финальной анкеты.
  // Формат value: «<классификация> · <страна>».
  if (q === 'Q4b' && value) {
    const [cls, country] = value.split('·').map((s) => s.trim());
    if (cls === 'Active NFFE' || cls === 'Passive NFFE' || cls === 'Financial Institution') {
      state.fatcaClassification = cls;
    }
    if (country) state.taxResidency = country;
  }
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

// --- Директора (блок на финальной анкете, BRD) ---
// Предзаполнены из реестра; ручная правка состава/данных → документ-подтверждение → DVU.
export const getDirectors = (): Promise<Director[]> => delay(state.directors);

let dirSeq = 0;
export const addDirector = (input: { fullName: string; designation: string; pan: string }): Promise<Director[]> => {
  const next: Director = {
    id: `dir-${Date.now()}-${dirSeq++}`,
    fullName: input.fullName,
    designation: input.designation,
    pan: input.pan,
    source: 'manual',
  };
  state.directors = [...state.directors, next];
  return delay(state.directors);
};

export const updateDirector = (id: string, patch: Partial<Omit<Director, 'id'>>): Promise<Director[]> => {
  state.directors = state.directors.map((d) => (d.id === id ? { ...d, ...patch } : d));
  return delay(state.directors);
};

export const removeDirector = (id: string): Promise<Director[]> => {
  state.directors = state.directors.filter((d) => d.id !== id);
  return delay(state.directors);
};

// Раздел директоров правился вручную (добавлен/изменён/удалён директор) → modified → в DVU.
export const setDirectorsModified = (modified: boolean): Promise<void> => {
  state.directorsModified = modified;
  return delay(undefined);
};

// Загрузить документ-подтверждение при ручной правке директоров — один на весь раздел.
export const uploadDirectorsProofDoc = (fileName: string): Promise<void> => {
  state.directorsProofDoc = { fileName };
  return delay(undefined);
};

export const setFatca = (classification: FatcaClassification, taxResidency: string): Promise<void> => {
  state.fatcaClassification = classification;
  state.taxResidency = taxResidency;
  return delay(undefined);
};

// Загрузить подтверждающий документ под изменённое reg-поле «Данные компании».
// BRD: modified reg-field → upload supportive document → DVU. Generic-заглушка (по типу поля не дробим, демо).
// Состояние proof-флага per-field живёт в UI; здесь — только имитация загрузки (контракт под будущий DocType).
export const uploadCompanyFieldProof = (_fieldKey: string, _fileName: string): Promise<void> => {
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

// Ввод PAN «своим» AS в его сессии (шаг между aadhaar и dsc-sign).
// Aadhaar PAN не отдаёт; у «своего» AS PAN в реестре нет → вводит сам. У директоров PAN из Probe —
// этот шаг пропускается (см. STEP_CHAIN/needsPanStep). panSource → 'manual'.
export const updateSignatoryPan = (id: string, pan: string): Promise<Signatory[]> => {
  state.signatories = state.signatories.map((s) =>
    s.id === id ? { ...s, pan: pan.trim().toUpperCase(), panSource: 'manual' } : s,
  );
  return delay(state.signatories);
};

// Нужен ли подписанту шаг ввода PAN в сессии: только если PAN ещё не из реестра и пуст
// («свой» AS). У директоров (panSource='registry', PAN из Probe) шаг пропускается.
export const needsPanStep = (s: Signatory): boolean =>
  s.panSource !== 'registry' && !s.pan.trim();

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
// Шаг 'pan' — между aadhaar и dsc-sign, ТОЛЬКО для «своего» AS (needsPanStep). У директоров
// (PAN из Probe) — выпадает: цепочку строим per-подписант через chainFor().
// Вариант C: согласия (Privacy+eKYC) теперь на Aadhaar-панели — отдельного шага 'consents' нет.
const STEP_CHAIN_FULL: SignatoryStep[] = ['waiting', 'aadhaar', 'pan', 'vkyc', 'dsc-sign', 'done'];
const chainFor = (s: Signatory): SignatoryStep[] =>
  needsPanStep(s) ? STEP_CHAIN_FULL : STEP_CHAIN_FULL.filter((st) => st !== 'pan');

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
    const chain = chainFor(s); // per-подписант: «свой» AS — с шагом pan, директора — без
    const cur = chain.indexOf(s.currentStep);
    const base = cur < 0 ? 0 : cur;
    // Лёгкий разнобой: первый клик двигает «верхних» в списке на шаг больше.
    const boost = advanceTick === 1 && idx === 0 ? 2 : 1;
    const nextIdx = Math.min(base + boost, chain.length - 1);
    const step = chain[nextIdx];
    const status: Signatory['status'] =
      step === 'done' ? 'done' : step === 'waiting' ? 'waiting' : 'in_progress';
    // Дотягиваем артефакты, чтобы карточка/детали были консистентны при done.
    const signature = step === 'done' || base >= chain.indexOf('dsc-sign')
      ? { signed: true as const, method: 'DSC' as const, timestamp: nowIST() }
      : s.signature;
    const vcip = step === 'done' || base >= chain.indexOf('vkyc')
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
  holderName: string; // «С возвращением, …» = имя КОМПАНИИ (решение Дениса), не инициатор
  company: string;
}

// Реквизиты счёта (те же, что показывает дашборд в блоке «Счёт открыт»).
const ACCOUNT_NUMBER = '5021 4477 9012 3456';
const ACCOUNT_IFSC = 'SBIN0099001';

export const getBankAccount = (): Promise<BankAccount> => {
  // Владелец счёта — КОМПАНИЯ: «С возвращением, Mehta Textiles Private Limited»
  // (решение Дениса). Инициатор-ассистент — лишь заполнитель, не владелец.
  return delay({
    number: ACCOUNT_NUMBER,
    ifsc: ACCOUNT_IFSC,
    frozen: state.accountFrozen ?? false,
    holderName: state.company.legalName,
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
