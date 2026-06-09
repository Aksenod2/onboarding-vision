---
source: Confluence "1D - 4. CRM part of E2E Product Opening Process", получено 2026-06-09
type: исходник (raw, verbatim; разбухшая статус-матрица сведена к сути)
---

# 1D - 4. CRM part of E2E Product Opening Process

- [Business Overview]
- [The To-Be high-level Process Diagram]
- [Status Diagram for Product Activation - Customer]
- [Onboarding Alerts]
- [The Status Matrix]
- [Scenarios]

Business Overview
The current As-Is process requires redesign due to gaps, bottlenecks and time-consuming procedures. Idea: automate almost all parts; concentrate all manual checks/verification in one hand — establish the DVU (Data Verification Unit). The future optimization relieves the CRM Team (Relationship Managers) of operational duties and concentrates them mostly on selling. Few activities requiring RM attention are listed in scenarios.
# The To-Be high-level Process Diagram
High-level CRM involvement across all selling channels and banking products/services.
| # | Entry Point | Description | Prerequisites | Detailed Process Flow |
| --- | --- | --- | --- | --- |
| 1 | Website Form | Prospect submits contact details + PAN on a website short form. | Prospect opened website form & applied; submitted valid contact details (phone) | Scenario 1: Website Form |
| 2 | Incoming Call | Prospect reached to open a product via phone call. | — | Scenario 2: Incoming Call |
| 3 | Get Next | Call Center Operator takes cold offer into work and calls prospect company. | Contact details valid | Scenario 3: Get Next |
| 4 | Self Registration | Prospect applies for the product on a website. | Applied via website self registration | Scenario 4: Self Registration |
| 5 | Branch Visit | Prospect comes to Branch to open a product | Came to branch with intent | Scenario 5: Branch Visit |
| 6 | RM Visit | RM visits prospect at his location. | RM visits prospect | Scenario 6: RM visit |
| 7 | Banner in Internet Banking | Customer clicks product banner in Internet Bank | Existing client, has IB access, clicked promo banner | Scenario 7: Internet Banking Banner |

## Status Diagram for Onboarding Process - Prospect / Product Activation - Customer / Onboarding Alerts
## The Status Matrix (суть)
Статус-матрица связывает: Pre-requisite → Status of CRM (Deal stage) → Action Item → Status of Onboarding → Status of Product Activation → CIF Status → Condition → Action Item. Ключевые цепочки:
- **SCENARIO 1 — RM selling activity, new customers:** New Prospect PAN available (Probe42 / manual RM input) → Deal created ('Data input') → trigger Product Team (DVU) → Onboarding: Draft → (Data Input → Entity Review → Entity Review Failed → Identity Review → Identity Review Failed → Completed) → Product Open / Product Activated (CIF Active on Initial Deposit received / First Outward Transaction). Draft non-active period X → PIF canceled. Также статусы Product Suspended/Terminated → CIF Deactivated/Blocked.
- **SCENARIO 2 — RM selling, current customer:** CIF exists → Deal created ('Data input') → trigger Product Team → Draft → Data Input → Entity Review (+failed) → Identity Review (required if new AS or AS data changed) (+failed) → Product Open → Product Activated (under certain product conditions). CIF Active throughout.
- **SCENARIO 3 — Digital Channel, Self-Registration:** New prospect from digital self-registration → trigger CRM to create lead/offer/deal + check duplicity → Draft/Canceled/Data Input/Entity Review(+Failed)/Identity Review(+Failed)/Completed → Product Open/Activated (CIF Active); Suspended/Terminated (Deactivated/Blocked).
# Scenarios
1D - 4.1 CRM Scenarios

> Глоссарий: Lead — данные потенциального клиента в MR; MR (Master Record) — базовая орг. сущность, включает PIF и CIF; Prospect — организация, с которой банк ещё не работает; Customer — уже клиент банка; Offer — сущность для работы по продаже; Deal — сущность после успешного закрытия offer.
