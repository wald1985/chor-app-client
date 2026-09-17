# Superadmin (клиент) — исследование (фаза 1)

**Дата:** 2026-09-17  
**Охват:** клиентская часть capability Superadmin в `chor-app-client`:

- аутентификация и сессия суперадмина (вход, профиль, смена пароля);
- разграничение сессий обычного пользователя (`User`) и платформенного администратора (`Superadmin`);
- маршрутизация, макет (Admin Layout/Shell) и защитные компоненты (guard'ы) для путей администратора;
- экран управления другими суперадминами (CRUD, сброс пароля);
- обеспечение доступа к защищённым эндпоинтам каталога библиотеки (`/admin/library/...`);
- состояние сетевого клиента (`httpClient`), обработка ошибок сервера и хранение токенов.

**Вне охвата:**

- реализация UI-компонентов самого каталога библиотеки (редактирование книг, серий, песен, тем, экраны загрузки файлов импорта) — это функционал каталога/библиотеки (`LibraryAdmin`);
- управление пользователями и Community (просмотр списка пользователей, блокировка, бан, управление членством) — на сервере эти эндпоинты ещё не реализованы (ADR 0011 §Context: «Broader superadmin powers are explicitly future work»).

**Правила документа:** только факты и ссылки на существующий код и нормативные документы (состояние «как есть», as-is). Без рекомендаций, предложений архитектурных решений и оценочных суждений (дизайн решения выполняется на фазе 2). Процесс разработки: `chor-app-docs/development-process.md`.

Пути указаны относительно корня монорепозитория/воркспейса:

- `chor-app-client/` — клиентское React-приложение;
- `chor-app-server/` — бэкенд NestJS;
- `chor-app-docs/` — спецификации и ADR проекта.

---

## 1. Состояние репозиториев

| Репозиторий       | Факт / Ветка / Коммит                                                                                                                                                                     | Ссылка                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `chor-app-client` | Ветка `main`, коммит `51b2a19 Merge branch 'feature/dashboard-shell'`                                                                                                                     | `git log -n 1`                                                          |
| `chor-app-server` | Ветка `main`, коммит `44c2a94 feat(library): protect catalog admin with superadmin guards`, предшествующий `ff96503 feat(superadmin): add superadmin identity, auth, and management API`  | `chor-app-server`, `git log -n 2`                                       |
| `chor-app-docs`   | Ветка `main`, коммит `9dd6fbe docs: add ADR 0011 superadmin identity and session`                                                                                                         | `chor-app-docs`, `git log -n 1`                                         |
| `chor-app-client` | В клиенте отсутствуют маршруты, страницы, компоненты и типы для superadmin; роли представлены только `ADMINISTRATOR` и `MEMBER` сообщества                                                | `src/App.tsx:26-84`, `src/features/auth/types.ts:1`                     |
| `chor-app-client` | В клиенте отсутствует `@tanstack/react-query` в зависимостях `package.json`, хотя ADR 0001 и `AGENTS.md` фиксируют его как единственный слой кеширования данных сервера                   | `package.json:18-26`, ADR 0001, `AGENTS.md:31-33`                       |
| `chor-app-server` | Серверная часть Superadmin полностью реализована: модуль `SuperadminModule`, контроллеры auth, profile, superadmins, Passport-стратегия `superadmin-jwt`, сид-скрипт `seed-superadmin.ts` | `chor-app-server/src/superadmin/`                                       |
| `chor-app-server` | Все эндпоинты записи каталога библиотеки (`/admin/library/...`) переведены на защиту `SuperadminAuthGuard` (заглушка удалена)                                                             | `chor-app-server/src/library-admin/interface/controllers/`, ADR 0011 §6 |

---

## 2. Нормативные решения (ADR) и спецификации

| Решение / Документ                                             | Зафиксированные факты и требования                                                                                                                                                                                                                                                                                                                                                                 | Ссылка                                                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **ADR 0011: Superadmin identity and session**                  | `Superadmin` — отдельная сущность и отдельная таблица `superadmins`. Не является ролью `User` и не входит в `CommunityMembership`. Собственный вход (`POST /admin/auth/login`), собственный профиль (`/admin/me`), собственный JWT. Физическое лицо может одновременно владеть учётной записью `User` и учётной записью `Superadmin` (с одинаковым или разным email).                              | `chor-app-docs/decisions/0011-superadmin-identity-and-session.md:10-12,41-44`                         |
| **ADR 0011: Равенство суперадминов**                           | Все суперадмины равны; между ними нет иерархии ролей и таблицы разрешений. Любой суперадмин может создавать, просматривать, изменять имя/email, менять пароль и удалять других суперадминов.                                                                                                                                                                                                       | ADR 0011:13-15,65-67                                                                                  |
| **ADR 0011: Ограничения самообслуживания**                     | Суперадмин не может удалить сам себя (`CannotDeleteSelfError` → HTTP 409). Последний оставшийся в системе суперадмин не может быть удалён (`LastSuperadminError` → HTTP 409). Свой собственный пароль нельзя изменить через маршрут управления другими администраторами (`PUT /admin/superadmins/:id/password`), для этого используется `POST /admin/me/change-password` с вводом текущего пароля. | ADR 0011:14-15,68-74                                                                                  |
| **ADR 0011: Токены и `aud`**                                   | Токен пользователя не содержит claim `aud`. Токен суперадмина содержит `aud: "chor-app-superadmin"`. Оба подписываются общим `JWT_SECRET`. `JwtStrategy` (пользователи) отклоняет токен с аудиторией суперадмина. `SuperadminJwtStrategy` требует строго `aud: "chor-app-superadmin"`. Токены пользователя и суперадмина не взаимозаменяемы ни в одну сторону.                                     | ADR 0011:16-19,45-56                                                                                  |
| **ADR 0011: Пароли и восстановление**                          | Нет принудительной смены пароля (ни после первоначального посева, ни после установки пароля другим админом). Нет механизма самостоятельного сброса пароля («забыл пароль» по email) для суперадминов. Восстановление доступа — только через другого суперадмина (`PUT /admin/superadmins/:id/password`) или через CLI-скрипт `seed-superadmin.js --reset-password` на хосте.                       | ADR 0011:20-25                                                                                        |
| **ADR 0011: Первый суперадмин**                                | Создаётся CLI-скриптом на хосте (`seed-superadmin.js`), а не через веб-регистрацию. В веб-интерфейсе регистрация суперадмина отсутствует.                                                                                                                                                                                                                                                          | ADR 0011:23-25,85-91                                                                                  |
| **ADR 0010: Защита каталога библиотеки**                       | Все эндпоинты изменения каталога (`/admin/library/...`) требуют токен суперадмина (`SuperadminAuthGuard`). Чтение каталога (`GET /library/...`) принимает токен пользователя или суперадмина (`UserOrSuperadminAuthGuard`).                                                                                                                                                                        | `chor-app-docs/decisions/0010-public-book-library.md:24-26,96-103`, ADR 0011:26-28,93-102             |
| **ADR 0010: Предупреждения об использовании (Usage Warnings)** | При архивации книги, серии, песни или темы, которые используются в сообществах, сервер возвращает HTTP 409 `LIBRARY_ITEM_IN_USE` со статистикой использования. Повторный запрос с флагом `confirmInUse=true` выполняет архивацию. Загрузка импорта (`/admin/library/imports/preview` и `/apply`) возвращает и валидирует хеш плана (`planHash`) и предупреждения об используемых элементах.        | ADR 0010:21-23,88-95                                                                                  |
| **ADR 0001: Клиентский стек**                                  | React, TypeScript, Redux Toolkit (RTK) для UI/session-стейта, TanStack React Query для серверных данных, react-bootstrap, дизайн максимально близок к дефолтному Bootstrap, mobile-first, отсутствие axios (собственный HTTP-клиент на `fetch`).                                                                                                                                                   | `chor-app-docs/decisions/0001-client-stack.md`                                                        |
| **ADR 0004: Механизм аутентификации**                          | Bearer JWT в заголовке `Authorization`. Проверка `tokenVersion` в БД на каждый запрос. Инвалидация токенов при изменении пароля.                                                                                                                                                                                                                                                                   | `chor-app-docs/decisions/0004-auth-mechanism.md`                                                      |
| **ADR 0006: Деплой клиента**                                   | SPA за nginx (`try_files $uri /index.html`), хост-порт 3012, домен `chorapp.wald.pro`. Определение API URL в проде по hostname в `src/utils/apiConfig.ts`.                                                                                                                                                                                                                                         | `chor-app-docs/decisions/0006-deployment-as-implemented.md`, `chor-app-client/src/utils/apiConfig.ts` |
| **Capability Breakdown (#11)**                                 | Capability Superadmin: сервер реализован (2026-09-17); клиентская панель администратора вынесена в отдельную итерацию.                                                                                                                                                                                                                                                                             | `chor-app-docs/capability-breakdown.md:26`                                                            |
| **Языковые соглашения**                                        | UI — немецкий язык; код, идентификаторы и тесты — английский язык; внутренняя документация в `docs/` — русский язык.                                                                                                                                                                                                                                                                               | `chor-app-client/AGENTS.md:137-160`                                                                   |

---

## 3. Серверные контракты API для Superadmin (как реализовано)

### 3.1. Эндпоинты аутентификации и профиля

Все эндпоинты используют префикс `/admin`.

| Метод   | Путь                        | Guard                 | Тело запроса                                           | Успешный ответ (код / тело)                                        | Возможные ошибки                                                                                                         |
| ------- | --------------------------- | --------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `POST`  | `/admin/auth/login`         | —                     | `LoginDto` (`email`, `password`)                       | `200 OK`<br/>`{ accessToken: string, superadmin: SuperadminView }` | `400` (валидация: email, password min 8 max 128)<br/>`401` `INVALID_CREDENTIALS`                                         |
| `GET`   | `/admin/me`                 | `SuperadminAuthGuard` | —                                                      | `200 OK`<br/>`SuperadminView`                                      | `401` `Unauthorized`                                                                                                     |
| `PATCH` | `/admin/me`                 | `SuperadminAuthGuard` | `UpdateProfileDto` (`name?`, `email?`)                 | `200 OK`<br/>`SuperadminView`                                      | `400` (пустое тело или валидация: name min 2 max 100, email)<br/>`401` `Unauthorized`<br/>`409` `SUPERADMIN_EMAIL_TAKEN` |
| `POST`  | `/admin/me/change-password` | `SuperadminAuthGuard` | `ChangePasswordDto` (`currentPassword`, `newPassword`) | `200 OK`<br/>`{ accessToken: string }`                             | `400` `INCORRECT_CURRENT_PASSWORD`<br/>`400` (валидация: newPassword min 8 max 128)<br/>`401` `Unauthorized`             |

_Ссылки на сервер:_ `superadmin-auth.controller.ts:6-19`, `superadmin-profile.controller.ts:22-76`.

### 3.2. Эндпоинты управления суперадминами (`/admin/superadmins`)

Все эндпоинты защищены `SuperadminAuthGuard`.

| Метод    | Путь                              | Тело запроса                                        | Успешный ответ                       | Ошибки                                                                                                                                                                                                           |
| -------- | --------------------------------- | --------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/admin/superadmins`              | —                                                   | `200 OK`<br/>`SuperadminView[]`      | `401` `Unauthorized`                                                                                                                                                                                             |
| `GET`    | `/admin/superadmins/:id`          | —                                                   | `200 OK`<br/>`SuperadminView`        | `400` (не UUID)<br/>`401` `Unauthorized`<br/>`404` `SUPERADMIN_NOT_FOUND`                                                                                                                                        |
| `POST`   | `/admin/superadmins`              | `CreateSuperadminDto` (`email`, `name`, `password`) | `201 Created`<br/>`SuperadminView`   | `400` (валидация: email, name 2..100, password 8..128)<br/>`401` `Unauthorized`<br/>`409` `SUPERADMIN_EMAIL_TAKEN`                                                                                               |
| `PATCH`  | `/admin/superadmins/:id`          | `UpdateSuperadminDto` (`name?`, `email?`)           | `200 OK`<br/>`SuperadminView`        | `400` (не UUID / пустое тело / валидация)<br/>`401` `Unauthorized`<br/>`404` `SUPERADMIN_NOT_FOUND`<br/>`409` `SUPERADMIN_EMAIL_TAKEN`                                                                           |
| `PUT`    | `/admin/superadmins/:id/password` | `SetPasswordDto` (`newPassword`)                    | `204 No Content`<br/>_(тело пустое)_ | `400` (не UUID / newPassword 8..128)<br/>`401` `Unauthorized`<br/>`404` `SUPERADMIN_NOT_FOUND`<br/>`409` `SUPERADMIN_USE_CHANGE_PASSWORD` (если `:id` равен `actor.id`)                                          |
| `DELETE` | `/admin/superadmins/:id`          | —                                                   | `204 No Content`<br/>_(тело пустое)_ | `400` (не UUID)<br/>`401` `Unauthorized`<br/>`404` `SUPERADMIN_NOT_FOUND`<br/>`409` `SUPERADMIN_CANNOT_DELETE_SELF` (если `:id` равен `actor.id`)<br/>`409` `SUPERADMIN_LAST_REMAINING` (если остался последний) |

_Ссылки на сервер:_ `superadmins.controller.ts:30-125`.

### 3.3. Структура сущностей и представлений (DTO / Views)

```typescript
// chor-app-server/src/superadmin/application/views/superadmin.view.ts:3-10
export interface SuperadminView {
  id: string
  email: string
  name: string
  isCurrent: boolean // true, если id совпадает с id текущего аутентифицированного суперадмина
  createdAt: Date | string // ISO-строка в JSON
  updatedAt: Date | string // ISO-строка в JSON
}
```

_Примечание:_ В `SuperadminView` полностью отсутствуют поля `memberships`, `role` и `permissions` (в отличие от `AuthUser` и ответа `/auth/me`).

### 3.4. Коды ошибок сервера (`code`)

Сервер возвращает ошибки в стандартном формате NestJS: `{ statusCode, error, message, code?, ... }`.

| Код (`code`)                     | HTTP статус | Доменная ошибка / Смысл                                                                                              | Ссылка на сервер                      |
| -------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `INVALID_CREDENTIALS`            | `401`       | Неверный email или пароль при входе                                                                                  | `superadmin-error-mapper.ts:24-32`    |
| `INCORRECT_CURRENT_PASSWORD`     | `400`       | Неверный текущий пароль при смене собственного пароля                                                                | `superadmin-error-mapper.ts:34-42`    |
| `SUPERADMIN_VALUE_INVALID`       | `400`       | Невалидное значение поля сущности (`field`)                                                                          | `superadmin-error-mapper.ts:44-53`    |
| `SUPERADMIN_NOT_FOUND`           | `404`       | Суперадмин с указанным id не найден                                                                                  | `superadmin-error-mapper.ts:55-63`    |
| `SUPERADMIN_EMAIL_TAKEN`         | `409`       | Email уже занят другим суперадмином (`existingId`)                                                                   | `superadmin-error-mapper.ts:65-74`    |
| `SUPERADMIN_CANNOT_DELETE_SELF`  | `409`       | Попытка удалить самого себя                                                                                          | `superadmin-error-mapper.ts:76-84`    |
| `SUPERADMIN_USE_CHANGE_PASSWORD` | `409`       | Попытка установить пароль самому себе через `PUT /admin/superadmins/:id/password` вместо `/admin/me/change-password` | `superadmin-error-mapper.ts:86-94`    |
| `SUPERADMIN_LAST_REMAINING`      | `409`       | Попытка удалить последнего оставшегося суперадмина                                                                   | `superadmin-error-mapper.ts:96-104`   |
| `LIBRARY_ITEM_IN_USE`            | `409`       | Архивация серии/книги/песни/темы библиотеки, используемой в Community                                                | `library-admin-error-mapper.ts:24-38` |
| `LIBRARY_IMPORT_PLAN_CHANGED`    | `409`       | Несовпадение `planHash` при подтверждении импорта библиотеки                                                         | `library-admin-error-mapper.ts:39-48` |

### 3.5. Эндпоинты каталога библиотеки под защитой суперадмина

Контроллеры модуля `LibraryAdminModule` защищены `@UseGuards(SuperadminAuthGuard)`:

- `POST /admin/library/series` — создание серии (`AdminSeriesController:33-40`);
- `PATCH /admin/library/series/:seriesId` — переименование серии (`AdminSeriesController:42-55`);
- `POST /admin/library/series/:seriesId/archive` — архивация серии (`AdminSeriesController:57-67`);
- `POST /admin/library/series/:seriesId/restore` — восстановление серии (`AdminSeriesController:69-79`);
- `POST /admin/library/books` — создание книги (`AdminBooksController:41-52`);
- `PATCH /admin/library/books/:bookId` — обновление книги и привязка к серии (`AdminBooksController:54-84`);
- `POST /admin/library/books/:bookId/archive?confirmInUse=true` — архивация книги (`AdminBooksController:86-97`);
- `POST /admin/library/books/:bookId/restore` — восстановление книги (`AdminBooksController:99-109`);
- `POST /admin/library/books/:bookId/songs` — создание песни в книге (`AdminSongsController:36-53`);
- `PATCH /admin/library/songs/:songId` — обновление реквизитов песни (`AdminSongsController:55-80`);
- `PUT /admin/library/songs/:songId/themes` — установка тем песни (`AdminSongsController:82-95`);
- `POST /admin/library/songs/:songId/archive?confirmInUse=true` — архивация песни (`AdminSongsController:97-108`);
- `POST /admin/library/songs/:songId/restore` — восстановление песни (`AdminSongsController:110-120`);
- `POST /admin/library/themes` — создание главной темы (`AdminThemesController:38-45`);
- `PATCH /admin/library/themes/:themeId` — переименование темы (`AdminThemesController:47-60`);
- `POST /admin/library/themes/:themeId/archive?confirmInUse=true` — архивация темы (`AdminThemesController:62-76`);
- `POST /admin/library/themes/:themeId/restore` — восстановление темы (`AdminThemesController:78-88`);
- `POST /admin/library/imports/preview` — предпросмотр импорта CSV/XLSX/JSON через `multipart/form-data` (`AdminImportsController:59-89`);
- `POST /admin/library/imports/apply` — применение импорта с `planHash` и `confirmInUse` через `multipart/form-data` (`AdminImportsController:91-130`).

---

## 4. Текущее состояние клиента (`chor-app-client` как есть)

### 4.1. Аутентификация, хранение токена и Redux-хранилище

| Файл                                     | Назначение / Реализация                                                                                                                                                                                                    | Ограничение относительно Superadmin                                                                                                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/auth/types.ts:1-55`        | Определены типы: `CommunityRole`, `CommunityMembership`, `AuthUser`, `AuthSession` (`{ accessToken, user, memberships }`), `LoginInput`, `ChangePasswordInput`, `ForgotPasswordInput`, `ResetPasswordInput`.               | Типы полностью рассчитаны на `User` с привязкой к `CommunityMembership`. Типов для `Superadmin` нет.                                                                                            |
| `src/features/auth/tokenStorage.ts:1-28` | Модуль хранит токен под фиксированным ключом `const STORAGE_KEY = "chorApp.accessToken"`. Методы: `saveToken(token, remember)`, `loadToken()`, `clearToken()`. Поддерживает выбор между `localStorage` и `sessionStorage`. | Ключ хранилища один. Невозможно одновременно хранить токен `User` и токен `Superadmin`. Сохранение нового токена перезаписывает предыдущий.                                                     |
| `src/features/auth/authSlice.ts:14-29`   | Slice `auth`. Состояние: `status: "idle" \| "loading" \| "authenticated" \| "unauthenticated"`, `user: AuthUser \| null`, `memberships: CommunityMembership[]`, `remember: boolean`.                                       | Состояние аутентификации едино на всё приложение. Нет разделения на пользовательскую и административную сессии.                                                                                 |
| `src/features/auth/authSlice.ts:36-69`   | `bootstrap()`: читает `loadToken()`, вызывает `setAuthToken(stored.token)`, затем `authApi.me()`. При успехе переходит в `authenticated`, при ошибке очищает токен.                                                        | `authApi.me()` запрашивает `/auth/me`. Если в хранилище лежит токен суперадмина, `GET /auth/me` вернёт 401 (Passport `jwt` отклоняет `aud: "chor-app-superadmin"`), и `bootstrap` удалит токен. |
| `src/features/auth/authSlice.ts:71-150`  | `login`, `resetPassword`, `changePassword`, `logout`. `login` обращается к `/auth/login`, сохраняет токен через `saveToken` и `setAuthToken`.                                                                              | Все thunk'и работают только с эндпоинтами пользователя `/auth/*`.                                                                                                                               |
| `src/app/store.ts:7-9`                   | Redux store инициализируется через `combineSlices(authSlice)`. `RootState` содержит единственную ветку `state.auth`.                                                                                                       | Нет слайса для суперадмина.                                                                                                                                                                     |

### 4.2. Сетевой клиент (`httpClient`) и обработка ошибок

| Файл                                   | Текущая реализация                                                                                                         | Ограничение относительно Superadmin                                                                                                                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/http/client.ts:15-20`         | Токен хранится в модульной переменной `let authToken: string                                                               | null = null`. Метод `setAuthToken(token)` устанавливает его.                                                                                                                                                            | Единый токен для всех запросов приложения. Нет разделения контекстов авторизации (User vs Superadmin). |
| `src/lib/http/client.ts:88`            | Заголовок подставляется unconditionally: `if (authToken) headers.Authorization = \`Bearer ${authToken}\``.                 | Запросы к `/admin/*` и `/auth/*` будут отправлять один и тот же текущий токен.                                                                                                                                          |
| `src/lib/http/client.ts:130-141`       | Объект `httpClient` экспортирует только два метода: `httpClient.get` и `httpClient.post`.                                  | Отсутствуют методы `patch`, `put`, `delete`. При этом эндпоинты суперадмина используют `PATCH` (`/admin/me`, `/admin/superadmins/:id`), `PUT` (`/admin/superadmins/:id/password`), `DELETE` (`/admin/superadmins/:id`). |
| `src/lib/http/client.ts:87,95`         | Тело запроса безусловно сериализуется: `JSON.stringify(body)`, заголовок `Content-Type: application/json`.                 | Нет поддержки `FormData` / `multipart/form-data`, что необходимо для загрузки файлов импорта каталога (`/admin/library/imports/preview` и `/apply`).                                                                    |
| `src/lib/http/client.ts:30-46,112-125` | Функция `parseErrorBody` извлекает только `message` и `error`. Поле `code` из JSON-ответа сервера игнорируется.            | Клиент не имеет доступа к кодам ошибок сервера (`code`), таким как `SUPERADMIN_CANNOT_DELETE_SELF`, `SUPERADMIN_LAST_REMAINING`, `SUPERADMIN_EMAIL_TAKEN`, `INCORRECT_CURRENT_PASSWORD`, `LIBRARY_ITEM_IN_USE`.         |
| `src/lib/http/httpError.ts:1-12`       | Класс `HttpError` содержит только поля: `readonly status: number`, `readonly message: string`, `readonly details: string[] | undefined`.                                                                                                                                                                                                             | Поле `code` отсутствует в сигнатуре `HttpError`.                                                       |

### 4.3. Маршрутизация, Guard'ы и макеты

| Файл                                                 | Текущая реализация                                                                                                                                                                                                                                                                                                     | Ограничение относительно Superadmin                                                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx:24-86`                                  | Корневой маршрут `/` обёрнут в `<RequireAuth><AppLayout /></RequireAuth>`. Под ним рендерится 8 вкладок через `PlaceholderPage`, а также `/konto` (`AccountPage`) и `/change-password` (`ChangePasswordPage`). Маршруты для гостей: `/login`, `/register`, `/forgot-password`, `/reset-password` под `<RequireGuest>`. | В дереве маршрутов отсутствуют любые пути панели администратора (например, `/admin`, `/admin/login`, `/admin/superadmins`, `/admin/library`). |
| `src/features/auth/components/RequireAuth.tsx:8-21`  | Проверяет `selectAuthStatus(state)`. Если статус `idle` или `loading` — показывает `<LoadingScreen />`. Если не `authenticated` — выполняет `<Navigate to="/login" replace state={{ from: location }} />`.                                                                                                             | Guard привязан исключительно к пользовательской сессии `User` и всегда редиректит на `/login`.                                                |
| `src/features/auth/components/RequireGuest.tsx:8-20` | Если пользователь `authenticated`, редиректит на `/`.                                                                                                                                                                                                                                                                  | Не учитывает административную сессию; посетитель страницы входа суперадмина будет перенаправлен, если он залогинен как обычный пользователь.  |
| `src/app/layout/AppLayout.tsx:8-16`                  | Компонент макета: `<AppHeader />` + `<TabNav />` + `<Container><Outlet /></Container>`.                                                                                                                                                                                                                                | Жестко привязан к пользовательским табам приложения хоров.                                                                                    |
| `src/app/layout/AppHeader.tsx:26-83`                 | Шапка приложения. Отображает имя `user?.name`, email, ссылку на `/konto` и кнопку `Abmelden` (вызывает `logout()` пользовательского слайса).                                                                                                                                                                           | Не имеет ссылок на панель администратора и не умеет работать с профилем суперадмина.                                                          |
| `src/app/layout/navItems.ts:19-66`                   | Список из 8 пользовательских вкладок (`vortrag`, `chorprobe`, `verlauf`, `auswertung`, `verwaltung`, `abwesenheiten`, `themensuche`, `lieder`).                                                                                                                                                                        | Отсутствуют административные разделы.                                                                                                         |

---

## 5. Сравнение сущностей и сессий: User vs Superadmin

На основе сопоставления кода `chor-app-server` и `chor-app-client`:

| Параметр / Аспект                          | Пользователь (`User`)                                                         | Суперадмин (`Superadmin`)                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Таблица в БД**                           | `users`                                                                       | `superadmins` (ADR 0011 §1)                                                                        |
| **Создание первого аккаунта**              | Самостоятельная регистрация через форму `/register` (`POST /auth/register`)   | Только CLI-скрипт на сервере: `seed-superadmin.js --email <e> --name <n>` (ADR 0011 §5)            |
| **Создание последующих аккаунтов**         | Самостоятельная регистрация через веб                                         | Только другим суперадмином: `POST /admin/superadmins` (ADR 0011 §1)                                |
| **Вход в систему**                         | `POST /auth/login`                                                            | `POST /admin/auth/login` (ADR 0011 §1)                                                             |
| **Данные сессии**                          | `{ id, email, name, memberships: [...] }`                                     | `{ id, email, name, isCurrent }` (нет `memberships`, нет ролей)                                    |
| **Получение текущего профиля**             | `GET /auth/me`                                                                | `GET /admin/me`                                                                                    |
| **Обновление профиля**                     | Не реализовано на сервере для `User`                                          | `PATCH /admin/me` (`name`, `email`)                                                                |
| **Смена собственного пароля**              | `POST /auth/change-password`                                                  | `POST /admin/me/change-password`                                                                   |
| **Восстановление пароля («Забыл пароль»)** | `POST /auth/forgot-password` → письмо с токеном → `POST /auth/reset-password` | Отсутствует. Восстановление только через другого суперадмина или CLI-скрипт на хосте (ADR 0011 §4) |
| **Сброс пароля другому лицу**              | Не предусмотрен                                                               | `PUT /admin/superadmins/:id/password` (ADR 0011 §3)                                                |
| **Удаление аккаунта**                      | Не реализовано                                                                | `DELETE /admin/superadmins/:id` (нельзя себя; нельзя последнего)                                   |
| **JWT Audience (`aud`)**                   | Отсутствует                                                                   | `aud: "chor-app-superadmin"`                                                                       |
| **Реакция `JwtStrategy` (пользователи)**   | Принимает токен                                                               | **Отклоняет** токен (401 Unauthorized)                                                             |
| **Реакция `SuperadminJwtStrategy`**        | **Отклоняет** токен (401 Unauthorized)                                        | Принимает токен                                                                                    |
| **Доступ к `/admin/library/...`**          | 401 Unauthorized                                                              | Разрешён (ADR 0010 §6, ADR 0011 §6)                                                                |
| **Доступ к `GET /library/...`**            | Разрешён (`UserOrSuperadminAuthGuard`)                                        | Разрешён (`UserOrSuperadminAuthGuard`)                                                             |
| **Текущее хранение токена в клиенте**      | Ключ `chorApp.accessToken` в `tokenStorage.ts`                                | Не реализовано                                                                                     |
| **Текущее состояние в Redux клиенте**      | `state.auth` в `authSlice.ts`                                                 | Не реализовано                                                                                     |

---

## 6. Затронутые файлы и модули клиента при реализации Superadmin

Исходя из структуры кодовой базы `chor-app-client`:

```
chor-app-client/
  src/
    lib/
      http/
        client.ts               # Отсутствуют методы patch/put/delete, нет multipart/FormData, единый токен
        httpError.ts            # Не сохраняет поле `code` из ответа бэкенда
    app/
      store.ts                  # Подключение reducers
      layout/
        AppHeader.tsx           # Текущая шапка пользователя (не знает о superadmin)
        AppLayout.tsx           # Пользовательский layout с TabNav
    features/
      auth/
        tokenStorage.ts         # Одиночный ключ `chorApp.accessToken`
        authSlice.ts            # Одиночная сессия пользователя
        components/
          RequireAuth.tsx       # Проверяет только сессию User, редиректит на /login
          RequireGuest.tsx      # Защищает гостевые маршруты пользователя
    pages/
      AccountPage.tsx           # Страница профиля User
    App.tsx                     # Корневая таблица маршрутов (нет путей /admin/*)
```

---

## 7. Сводка пробелов в `chor-app-client` (факты без оценки)

1. **Отсутствие поддержки HTTP-методов:** `httpClient` в `src/lib/http/client.ts` содержит только методы `get` и `post`. Методы `patch`, `put`, `delete`, необходимые для вызова `/admin/me` (`PATCH`), `/admin/superadmins/:id` (`PATCH`, `DELETE`) и `/admin/superadmins/:id/password` (`PUT`), отсутствуют.
2. **Отсутствие передачи `FormData`:** `httpClient` выполняет безусловный `JSON.stringify(body)` с заголовком `Content-Type: application/json`. Отправка файлов `multipart/form-data` для импорта каталога (`/admin/library/imports/preview` и `/apply`) невозможна без модификации клиента.
3. **Игнорирование кода ошибки сервера (`code`):** `parseErrorBody` в `src/lib/http/client.ts` и класс `HttpError` в `src/lib/http/httpError.ts` не считывают и не сохраняют свойство `code` из тела ответа сервера. Ошибки бизнес-логики (`SUPERADMIN_CANNOT_DELETE_SELF`, `SUPERADMIN_LAST_REMAINING`, `SUPERADMIN_EMAIL_TAKEN`, `INCORRECT_CURRENT_PASSWORD`, `LIBRARY_ITEM_IN_USE`) не могут быть программно идентифицированы компонентами по коду.
4. **Конфликт хранения токенов:** `tokenStorage.ts` использует единственный ключ `chorApp.accessToken`. Одновременное хранение сессии пользователя и сессии суперадмина в одном браузере текущим кодом не поддерживается.
5. **Конфликт инъекции токена в HTTP-запросы:** `client.ts` содержит единственную переменную `authToken`, передаваемую во все запросы через заголовок `Authorization`. Если в ней установлен токен пользователя, все запросы к `/admin/*` завершаются ошибкой 401. Если установлен токен суперадмина, запросы к пользовательским эндпоинтам (`/auth/me`, `/communities/...`) завершаются ошибкой 401.
6. **Конфликт при старте приложения (`bootstrap`):** Функция `bootstrap()` в `authSlice.ts:36-69` при старте приложения безусловно запрашивает `GET /auth/me`. Если в хранилище находится токен суперадмина, сервер отвечает 401, и `bootstrap` полностью стирает токен из хранилища.
7. **Отсутствие маршрутизации панели администратора:** В `src/App.tsx` нет маршрутов с префиксом `/admin` (ни страницы входа суперадмина, ни разделов управления суперадминами, ни разделов каталога библиотеки).
8. **Отсутствие Guard'ов для суперадмина:** Существующий `RequireAuth` проверяет только статус `state.auth` и при отсутствии сессии выполняет редирект на `/login`. Специализированного компонента защиты административных маршрутов нет.
9. **Отсутствие интерфейса суперадмина:** В репозитории нет компонентов для:
   - экрана входа суперадмина;
   - навигационной оболочки суперадмина (Admin Header / Layout);
   - списка суперадминов (`GET /admin/superadmins`);
   - формы создания суперадмина (`POST /admin/superadmins`);
   - редактирования суперадмина (`PATCH /admin/superadmins/:id`);
   - смены пароля другому суперадмину (`PUT /admin/superadmins/:id/password`);
   - удаления суперадмина (`DELETE /admin/superadmins/:id`);
   - страницы собственного профиля суперадмина и смены своего пароля (`/admin/me`).
10. **Отсутствие `@tanstack/react-query`:** В `package.json` клиента библиотека не установлена, несмотря на предписание ADR 0001 использовать React Query для серверных данных и мутаций.
