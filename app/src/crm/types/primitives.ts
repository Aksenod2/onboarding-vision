// CRM-микросервис: ЛОКАЛЬНЫЕ примитивы. Сознательно НЕ импортим из mock/v2 (изоляция, §6 спеки).
// В реальности эти типы пришли бы из контракта CRM-сервиса, не из домена онбординга.
// Дублирование с онбордингом — намеренное (двусторонний барьер, Д4/Д5).

// PAN — Permanent Account Number, 10 знаков (ABCDE1234F). Обязательный ключ Company Profile (Д2).
export type PAN = string;

// CIN — Corporate Identity Number (есть у компаний, НЕТ у Sole Proprietor → условный, Д2).
export type CIN = string;

// GSTIN — налоговый номер. НЕ входит в primary-атрибуты (Д2), но может храниться в профиле.
export type GSTIN = string;

// IST-таймстамп (ISO-строка). В реальности — поле created_at/updated_at из БД CRM.
export type IsoTimestamp = string;

// Адрес компании (Registered Address — primary-атрибут, Д2). Плоская сериализуемая структура.
export interface Address {
  line: string;
  city: string;
  state: string;
  pin: string;
}

// Человекочитаемое представление адреса одной строкой (для карточек/списков).
export const formatAddress = (a: Address): string =>
  [a.line, a.city, a.state, a.pin].filter(Boolean).join(', ');
