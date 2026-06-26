import type { ClientSource, ProductCode, EntityType } from '../types/domain';
import type { CrmDictKey } from '../i18n';

// Общие наборы опций для дропдаунов — единый источник на все экраны (бриф: «один словарь источника»).

// Источник обращения (дропдаун на Profile и CreateProfile). Полный союз ClientSource хранит
// и системные значения (onboarding/probe42/online-bank), но руками оператор ставит только эти три.
export const SOURCE_OPTIONS: ClientSource[] = ['call', 'potential', 'self-registration'];

export const sourceKey = (s: ClientSource): CrmDictKey => `src.${s}` as CrmDictKey;

// Продукты (дропдаун оффера).
export const PRODUCT_OPTIONS: ProductCode[] = ['current-account', 'deposit', 'credit', 'fx', 'payroll'];
export const productKey = (p: ProductCode): CrmDictKey => `product.${p}` as CrmDictKey;

// Типы юрлица (дропдаун CreateProfile).
export const ENTITY_OPTIONS: EntityType[] = ['Company', 'LLP', 'Sole Proprietor', 'Partnership'];
export const entityKey = (e: EntityType): CrmDictKey => `entity.${e}` as CrmDictKey;

// Формат PAN: 5 букв + 4 цифры + 1 буква (ABCDE1234F). Демо-валидация.
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const isValidPan = (pan: string): boolean => PAN_RE.test(pan.replace(/\s+/g, '').toUpperCase());
