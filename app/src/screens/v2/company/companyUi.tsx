// Общие styled-компоненты экранов сценария Компания. Те же паттерны, что у Sole Proprietor
// (Card / CardHeader / CardBody), вынесены, чтобы не копировать в каждый экран.
import styled from 'styled-components';
import { textPrimary, textSecondary } from '@salutejs/sdds-themes/tokens';
import { accentPanel, radii, elevation, enter } from '../../../ui/designSystem';
import type { AadhaarResult, CompanyDetails } from '../../../mock/v2/companyTypes';
import type { Lang } from '../../../ui/v2/LanguageContext';

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

// --- Данные из Aadhaar (5 полей; номер маскирован) ---
// Единый вид у инициатора компании (вход) и у приглашённого подписанта (фаза B).
// Письмо Марго 19.06: name / aadhaar number ******XXXX / telephone / email / address.
const AadhaarBox = styled.div`
  ${enter(0.05)};
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1rem 1.1rem;
  border-radius: ${radii.panel};
  background: #f7f9f8;
  border: 1px solid rgba(0, 0, 0, 0.07);
`;
const AadhaarBoxTitle = styled.p`
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${textSecondary};
`;
// Сетка «лейбл | значение»: фикс. колонка лейблов (10rem) → все значения начинаются на одной вертикали,
// даже при разной длине лейблов (Адрес / Дата регистрации длиннее остальных). Длинный адрес переносится
// в своей колонке (1fr), не сбивая выравнивание.
const AadhaarRow = styled.div`
  display: grid;
  grid-template-columns: 10rem 1fr;
  gap: 0.75rem;
  font-size: 0.88rem;
  line-height: 1.4;
  color: ${textPrimary};
  .label { color: ${textSecondary}; }
  .value { font-weight: 600; word-break: break-word; }
`;

const aadhaarDict: Record<Lang, {
  title: string; name: string; number: string; phone: string; email: string; address: string;
}> = {
  ru: {
    title: 'Данные из Aadhaar',
    name: 'Имя', number: 'Номер Aadhaar', phone: 'Телефон', email: 'Email', address: 'Адрес',
  },
  en: {
    title: 'Data from Aadhaar',
    name: 'Name', number: 'Aadhaar number', phone: 'Phone', email: 'Email', address: 'Address',
  },
};

// Блок «Данные из Aadhaar»: 5 полей лейбл↔значение. Номер всегда маскирован (приходит из mock).
export const AadhaarResultBox = ({ data, lang }: { data: AadhaarResult; lang: Lang }) => {
  const t = aadhaarDict[lang];
  return (
    <AadhaarBox>
      <AadhaarBoxTitle>{t.title}</AadhaarBoxTitle>
      <AadhaarRow><span className="label">{t.name}</span><span className="value">{data.name}</span></AadhaarRow>
      <AadhaarRow><span className="label">{t.number}</span><span className="value">{data.aadhaarMasked}</span></AadhaarRow>
      <AadhaarRow><span className="label">{t.phone}</span><span className="value">{data.phone}</span></AadhaarRow>
      <AadhaarRow><span className="label">{t.email}</span><span className="value">{data.email}</span></AadhaarRow>
      <AadhaarRow><span className="label">{t.address}</span><span className="value">{data.address}</span></AadhaarRow>
    </AadhaarBox>
  );
};

// --- Данные компании из PAN (золотая запись) ---
// Тот же визуальный паттерн «лейбл↔значение», что у AadhaarResultBox: серый блок-карточка,
// заголовок-капс, ряды. Показывается ПОСЛЕ verifying-спиннера PAN — тон подтверждения факта,
// не ввода. Дата регистрации здесь подтверждается → отдельным вопросом в опроснике не дублируется.
const companyPanDict: Record<Lang, {
  title: string;
  legalName: string; entityType: string; cin: string; pan: string; incorporation: string; address: string;
  entityValue: string;
}> = {
  ru: {
    title: 'Данные компании из PAN',
    legalName: 'Юр. название', entityType: 'Тип компании', cin: 'CIN',
    pan: 'PAN компании', incorporation: 'Дата регистрации', address: 'Зарегистрированный адрес',
    entityValue: 'Частная компания с ограниченной ответственностью (Private Limited)',
  },
  en: {
    title: 'Company data from PAN',
    legalName: 'Legal name', entityType: 'Company type', cin: 'CIN',
    pan: 'Company PAN', incorporation: 'Date of incorporation', address: 'Registered address',
    entityValue: 'Private Limited Company',
  },
};

// Блок «Данные компании из PAN»: подтянутые поля золотой записи. Значения — из CompanyDetails (companySeed).
export const CompanyPanResultBox = ({ data, lang }: { data: CompanyDetails; lang: Lang }) => {
  const t = companyPanDict[lang];
  const addr = data.registeredAddress;
  const addressLine = `${addr.line}, ${addr.city}, ${addr.state} — ${addr.pin}`;
  return (
    <AadhaarBox>
      <AadhaarBoxTitle>{t.title}</AadhaarBoxTitle>
      <AadhaarRow><span className="label">{t.legalName}</span><span className="value">{data.legalName}</span></AadhaarRow>
      <AadhaarRow><span className="label">{t.entityType}</span><span className="value">{t.entityValue}</span></AadhaarRow>
      <AadhaarRow><span className="label">{t.cin}</span><span className="value">{data.cin}</span></AadhaarRow>
      <AadhaarRow><span className="label">{t.pan}</span><span className="value">{data.pan}</span></AadhaarRow>
      <AadhaarRow><span className="label">{t.incorporation}</span><span className="value">{data.incorporationDate}</span></AadhaarRow>
      <AadhaarRow><span className="label">{t.address}</span><span className="value">{addressLine}</span></AadhaarRow>
    </AadhaarBox>
  );
};
