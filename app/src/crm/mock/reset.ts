// CRM-микросервис: точка сброса демо-состояния. Тонкая обёртка над crmApi.resetCrm,
// вынесена отдельно, чтобы DemoNav / отладочные кнопки звали reset, не таща весь API.

import { resetCrm } from './crmApi';

export { resetCrm };

// Алиас на случай единого нейминга reset-кнопок в проекте.
export const resetCrmDemo = (): void => resetCrm();
