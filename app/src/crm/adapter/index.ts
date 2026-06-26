// CRM-микросервис: barrel адаптера. Единственная точка входа внешних данных + демо-фикстуры.
export { ingest } from './ingest';
export {
  demoFixtures, fxOnboardingCompletedNew, fxApplicationResumed, fxDvuApproved,
} from './fixtures';
