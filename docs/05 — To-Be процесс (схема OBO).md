# 05 — To-Be процесс: схема OBO (системный поток)

← [README](README.md) · связано с [01 — Процесс онбординга → To-Be](<01 — Процесс онбординга.md#to-be-process>)

> **Источник:** `_исходники/схемы/2026-06-01_obo_full_process.drawio.xml` — экспорт блок-схемы из Confluence Сбера (host: confluence.sberbank.ru). Базовая версия схемы; обновления см. в разделе «Работа с источниками» в [README](README.md).
> Это системно-процессная схема целевого (to-be) онбординга: дорожки по ролям/доменам, шаги с кодами `001…009`, ветвления и DVU-петли.

## Карта файла
- [Структура: 7 дорожек](#структура-7-дорожек)
- [Основной поток OBO (001→009)](#основной-поток-obo-001009)
- [Подпроцесс KYC](#подпроцесс-kyc)
- [Подпроцесс VKYC](#подпроцесс-vkyc)
- [Потоки DVU-алертов](#потоки-dvu-алертов)
- [Точки ветвления (решения)](#точки-ветвления-решения)
- [Системные интеграции](#системные-интеграции)

---

## Структура: 7 дорожек

| Дорожка | Что делает |
|---|---|
| **OBO** | Основной поток онбординга: от регистрации проспекта до триггера открытия счёта |
| **KYC** | Проверки Know Your Customer: checks, BGV, расчёт риск-категории |
| **VKYC** | Видеоидентификация: eKyc (Aadhaar), selfVKYC, VKYC/F2F-сессии |
| **DVU OBO Related alert** | Ручная проверка данных и документов проспекта |
| **DVU KYC Related alert** | Разрешение проблем по KYC-проверкам |
| **DVU VKYC Related alert** (встреча) | Review встречи DVU |
| **DVU VKYC Related alert** (сессии) | Планирование и проведение VKYC/F2F-сессий |

**Логика DVU:** каждый домен (OBO / KYC / VKYC) при провале авто-проверки порождает DVU-задачу в своей дорожке. DVU-поток всегда: `Create task → Take in progress → (работа/запрос документов) → Resolve alert`.

---

## Основной поток OBO (001→009)

> **Старт:** проспект приходит на страницу регистрации по ссылке (из CRM/сайта).

| Код | Шаг | Заметки из схемы |
|---|---|---|
| **001** | Prospect came to registration Page via link | Старт |
| **002** | Create login + log in | Логин: email + телефон, person в MR; данные из ссылки |
| — | *N time without actions* → Event for communication | Таймер бездействия → нотификация в CRM, проспект может продолжить |
| **003** | Create prospect | Создаются `prospect, person, prospect_person` (DATA, CRM, CAM) |
| **003.01** | Create DVU task | Если меняется блок данных сущности → задача в DVU OBO |
| **004** | Fill in KMP | The Board Resolution |
| **005** | Create logins & send invites + log in + eKyc | Логины с VKYC и QR Aadhaar-аутентификацией |
| **006** | Initiate KYC | Запускает подпроцесс KYC |
| **007** | KYC complete → Create client | Клиент создаётся в MR/CRM |
| **008** | Grant access | Доступ выдаётся (CRM) |
| **009** | Account opening trigger | **Финал OBO** → передача в CAM (открытие счёта) |

---

## Подпроцесс KYC

Запускается из шага **006**. После `Receive KYC status` идёт параллельный сплит на три ветки:

1. **Checks** (`006.01.1.1`) → Save results → **решение `Passed?`**
   - **Yes** → `007. KYC complete`
   - **No** → `DVU task to solve problem` → создаётся DVU KYC-задача
2. **BGV checks** (`006.01.2.1`) → Calculate Risk category (`006.01.2.2`)
3. **VKYC complete** (`006.01.3`) — ожидание завершения видеоверификации

Все три ветки сходятся в `007. KYC complete`.

---

## Подпроцесс VKYC

Запускается списком подписантов с результатом eKyc (`005.01`) → Create sessions (`005.02`).

- **Решение `eKyc (Aadhaar) passed?`**
  - **No** → `Create selfVKYC` (`005.02.1.1`) → `Pass selfVKYC` → **решение `Passed?`**
    - **No** → `DVU meeting review` (`005.03`) **или** `DVU task to schedule and provide VKYC/F2F session`
  - **Yes** → `DVU task to schedule and provide VKYC or F2F session` (`005.02.2.1`)
- → **Решение `F2F?`** (`005.02.2.2`)
  - **Yes (F2F)** → `VKYC complete` (`005.04`)
  - **No (виртуальная)** → `DVU meeting review` (`005.03`) → ... → `VKYC complete`

**Финал:** `005.04. VKYC complete`. (selfVKYC использует интеграцию **JAZZ**.)

---

## Потоки DVU-алертов

Единый паттерн всех четырёх DVU-дорожек: задача создаётся → берётся в работу → решается → `Resolve alert`.

**DVU OBO (документы):**
`Create DVU task` → `Take task in progress` → **решение `Data and Documents Valid?`**
- **No** → `Document request + notification` → (цикл проверки заново)
- **Yes** → `Mark data and document as valid` → `Resolve alert`

**DVU KYC:**
`Create DVU Task` → `Take task in progress` → `Communicate and update data` → `Resolve alert` → обратная петля в `DVU task to solve problem`.

**DVU VKYC (встреча):**
`Create DVU task` → `Take task in progress` → `DVU meeting review` → `Resolve alert`.

**DVU VKYC (сессии):**
`Create DVU task` → `Take task in progress` → `Schedule VKYC/F2F session` ⇄ `Provide VKYC/F2F session` (циклы) → `Resolve alert`.

---

## Точки ветвления (решения)

| Решение | Дорожка | Yes / условие | No / условие |
|---|---|---|---|
| **Passed?** (результат проверок) | KYC | → `007. KYC complete` | → `DVU task to solve problem` |
| **eKyc (Aadhaar) passed?** | VKYC | → планирование VKYC/F2F-сессии | → создать selfVKYC |
| **Passed?** (результат selfVKYC) | VKYC | → DVU-задача на сессию | → DVU meeting review |
| **F2F?** | VKYC | → `VKYC complete` (очно) | → DVU meeting review (виртуально) |
| **Data and Documents Valid?** | DVU OBO | → пометить валидными → Resolve | → запрос документов (цикл) |

---

## Системные интеграции

Участники потока (вне дорожек): **PIF** (основная шина событий, фигурирует почти везде), **MR**, **CIF**, **CRM**, **CORE**, **DATA**, **KYC**, **OBO**, **JAZZ** (selfVKYC), **CAM** (открытие счёта), **DVU event handler**. Обмен между доменами идёт через PIF (упоминается `PIF.DVU.KAFKA`).
