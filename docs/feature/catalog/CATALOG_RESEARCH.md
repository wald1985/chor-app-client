# Catalog (клиент) — исследование (фаза 1)

**Дата:** 2026-09-17  
**Охват:** клиентская часть capability Catalog / Library в `chor-app-client` по `chor-app-docs/decisions/0010-public-book-library.md`:

- интерфейс администратора библиотеки в панели суперадмина (`/admin/library/...` под защитой `SuperadminAuthGuard`): управление сериями, книгами, песнями, главными темами;
- интерфейс импорта каталога из файлов CSV, Excel (XLSX) и JSON: двухфазный процесс с предпросмотром плана (`preview`), валидацией хеша плана (`planHash`) и применением (`apply`);
- обработка предупреждений использования (Usage Warnings, HTTP 409 `LIBRARY_ITEM_IN_USE`) при попытке архивации книг, песен, тем или серий, задействованных в сообществах, с подтверждением (`confirmInUse=true`);
- клиентские интерфейсы и API чтения каталога (`GET /library/...` под защитой `UserOrSuperadminAuthGuard`): просмотр серий, книг, песен, поиск/lookup и списки главных тем;
- состояние сетевого клиента (`httpClient`), передача авторизационных токенов (`user` vs `admin`) для путей `/library/...` и `/admin/library/...`, обработка специфичных полей ошибок сервера (`code`, `usage`, `planHash`);
- интеграция в маршрутизацию (`App.tsx`), административный макет (`AdminLayout.tsx`), клиентские табы (`AppLayout.tsx`, `navItems.ts`);
- соответствие клиентского стека архитектурным решениям (ADR 0001, ADR 0010, ADR 0011).

**Вне охвата:**

- реализация возможностей Repertoire внутри Community (`Folder` / _Mappe_, кастомные темы Community `Theme`, привязка `BookAttachment`, локальные назначения песен — ADR 0009);
- управление пользователями и Community (будущее расширение Superadmin);
- серверная реализация `LibraryModule` и `LibraryAdminModule` (уже полностью реализована в `chor-app-server`).

**Правила документа:** только факты и ссылки на существующий код и нормативные документы (состояние «как есть», as-is). Без рекомендаций, предложений архитектурных решений и оценочных суждений (дизайн решения выполняется на фазе 2). Процесс разработки: `chor-app-docs/development-process.md`.

Пути указаны относительно корня монорепозитория/воркспейса:

- `chor-app-client/` — клиентское React-приложение;
- `chor-app-server/` — бэкенд NestJS;
- `chor-app-docs/` — спецификации и ADR проекта.

---

## 1. Состояние репозиториев

| Репозиторий       | Ветка / Последний коммит                                                                                                                                                                                                                                                                                                                                                                                                | Состояние рабочей копии                                                                                                         | Ссылка                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `chor-app-client` | `main`, коммит `5ec4f8f feat(auth): add project intro to login page and discreet superadmin footer link`                                                                                                                                                                                                                                                                                                                | Чистое рабочее дерево, все 7 тестовых наборов проходят (`vitest --run`: 29 тестов), `lint` и `format:check` проходят без ошибок | `git log -n 1`, `git status`       |
| `chor-app-server` | `main`, коммит `cefa27b chore: ignore custom superadmin seed script` (предшествующие: `44c2a94 feat(library): protect catalog admin with superadmin guards`, `498b52c feat(library): add XLSX catalog import`, `6dce8a1 feat(library): add CSV catalog import`, `3bb8b25 feat(library): add JSON catalog import with preview and apply`, `c21ed78 feat(library-admin): add catalog admin editing API with usage check`) | Чистое рабочее дерево, бэкенд модулей `LibraryModule` и `LibraryAdminModule` полностью реализован и протестирован               | `chor-app-server`, `git log -n 10` |
| `chor-app-docs`   | `main`, коммит `9dd6fbe docs: add ADR 0011 superadmin identity and session`                                                                                                                                                                                                                                                                                                                                             | Чистое рабочее дерево, зафиксированы ADR 0001–0011                                                                              | `chor-app-docs`, `git log -n 1`    |

---

## 2. Нормативные решения (ADR) и спецификации

| Решение / Документ                            | Зафиксированные факты и нормативные требования                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Ссылка                                                                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ADR 0010: Public book library**             | Один глобальный каталог печатных изданий (`LibraryModule`), не принадлежащий Community. Данные не копируются в Community: сообщества подключают книги через live link (`BookAttachment`) и видят актуальные песни и главные темы мгновенно. Изменять каталог может только суперадмин (`LibraryAdminModule`). Главные темы (`LibraryTheme`) курируются централизованно. Гибридная нумерация: у книги собственная нумерация или сквозная нумерация в серии (`LibrarySeries`, например Bücher 1–4 = 1–727). Загрузка CSV / Excel / JSON парсится один раз, повторная загрузка обновляет песни in-place по номеру, сохраняя `songId`. При архивации элементов, используемых в Community, возвращается 409 `LIBRARY_ITEM_IN_USE` со статистикой использования; повтор с `confirm=true` (`confirmInUse=true`) выполняет архивацию. | `chor-app-docs/decisions/0010-public-book-library.md:9-28,36-95`                                              |
| **ADR 0011: Superadmin identity and session** | Эндпоинты изменения каталога `/admin/library/...` защищены `SuperadminAuthGuard` (заглушка `SuperAdminGuard` удалена). Чтение каталога `GET /library/...` принимает токен пользователя или суперадмина (`UserOrSuperadminAuthGuard`). Токен суперадмина содержит claim `aud: "chor-app-superadmin"`, токен пользователя не содержит `aud`. Сессии пользователя и суперадмина независимы.                                                                                                                                                                                                                                                                                                                                                                                                                                     | `chor-app-docs/decisions/0011-superadmin-identity-and-session.md:26-28,93-102`, ADR 0010 §6                   |
| **ADR 0009: Repertoire hybrid model**         | Репертуар сообщества объединяет подключенные библиотечные книги (`BookAttachment`, read-only, live) и собственные папки (`Folder` / _Mappe_). Пользователи сообщества не могут менять песни и темы каталога. Темы имеют два источника: темы каталога (поступают с подключенными книгами) и кастомные темы Community (`Theme`). Тематический поиск охватывает оба источника.                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `chor-app-docs/decisions/0009-repertoire-folders-attachments-themes.md:10-23,33-60`                           |
| **ADR 0001: Client stack**                    | Клиентский стек: React, TypeScript, Redux Toolkit (RTK) исключительно для UI-состояния (сессия, модальные окна, фильтры, черновики), TanStack React Query для серверных данных и мутаций, react-bootstrap (Bootstrap 5), mobile-first, собственный fetch-клиент (запрет axios).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `chor-app-docs/decisions/0001-client-stack.md:9-40`                                                           |
| **ADR 0004 & ADR 0006**                       | Токен передаётся в заголовке `Authorization: Bearer <token>`. Деплой SPA за nginx на `https://chorapp.wald.pro`. Базовый URL API определяется в рантайме по `window.location.hostname` (`https://chorappserver.wald.pro`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `chor-app-docs/decisions/0004-auth-mechanism.md`, `chor-app-docs/decisions/0006-deployment-as-implemented.md` |
| **Capability Breakdown (#10)**                | Capability #10 **Library**: глобальная библиотека печатных книг (`LibrarySeries`, `LibraryBook`, `LibrarySong`, `LibraryTheme`), гибридная нумерация, загрузка CSV/Excel/JSON; `LibraryAdminModule` с предупреждениями об использовании; эндпоинты записи под защитой #11 Superadmin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `chor-app-docs/capability-breakdown.md:25`                                                                    |
| **Языковые соглашения**                       | Пользовательский интерфейс (UI) — немецкий язык (_Bibliothek_, _Buch_, _Serie_, _Lied_, _Thema_, _Import_); код, сущности, DTO, тесты — английский язык; внутренняя документация в `docs/` — русский язык.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `chor-app-client/AGENTS.md:137-160`, `chor-app-docs/glossary.md`                                              |

---

## 3. Серверные контракты API для Catalog / Library

Все эндпоинты реализованы в `chor-app-server` в модулях `LibraryModule` (`src/library/`) и `LibraryAdminModule` (`src/library-admin/`).

### 3.1. Публичные/пользовательские эндпоинты чтения (`GET /library/...`)

Все эндпоинты защищены `@UseGuards(UserOrSuperadminAuthGuard)` — принимают как токен пользователя (`User`), так и токен платформенного администратора (`Superadmin`).

| Метод | Путь                     | Query-параметры                                                                | Успешный ответ (HTTP / тип)      | Описание и ошибки                                                                                                                                                                 | Ссылка на сервер               |
| ----- | ------------------------ | ------------------------------------------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `GET` | `/library/series`        | `includeArchived?: boolean`                                                    | `200 OK`<br/>`SeriesView[]`      | Список всех серий библиотеки с вложенными книгами                                                                                                                                 | `library.controller.ts:39-46`  |
| `GET` | `/library/books`         | `seriesId?: string`<br/>`q?: string` (max 100)<br/>`includeArchived?: boolean` | `200 OK`<br/>`BookSummaryView[]` | Список книг с количеством активных песен (`songCount`), фильтрацией по серии и поисковой строке                                                                                   | `library.controller.ts:48-55`  |
| `GET` | `/library/books/:bookId` | `:bookId` (UUID)<br/>`includeArchivedSongs?: boolean`                          | `200 OK`<br/>`BookView`          | Детальная информация о книге со списком всех её песен и тем на каждой песне                                                                                                       | `library.controller.ts:57-67`  |
| `GET` | `/library/songs/lookup`  | `number: string`<br/>`bookId?: string`<br/>`seriesId?: string`                 | `200 OK`<br/>`SongView`          | Поиск песни по номеру в рамках книги или сквозной серии.<br/>Ошибки: `400` `LIBRARY_LOOKUP_SCOPE_INVALID` (не передан ни `bookId`, ни `seriesId`), `404` `LIBRARY_SONG_NOT_FOUND` | `library.controller.ts:69-85`  |
| `GET` | `/library/songs/:songId` | `:songId` (UUID)                                                               | `200 OK`<br/>`SongView`          | Детальная информация о конкретной песне, привязанной книге, серии и темах.<br/>Ошибки: `404` `LIBRARY_SONG_NOT_FOUND`                                                             | `library.controller.ts:87-94`  |
| `GET` | `/library/themes`        | `includeArchived?: boolean`                                                    | `200 OK`<br/>`ThemeView[]`       | Список всех главных тем библиотеки с количеством привязанных песен (`songCount`)                                                                                                  | `library.controller.ts:96-103` |

---

### 3.2. Административные эндпоинты управления (`/admin/library/...`)

Все административные эндпоинты защищены `@UseGuards(SuperadminAuthGuard)` — требуют строго токен суперадмина с claim `aud: "chor-app-superadmin"`. Токен обычного пользователя отклоняется с кодом `401 Unauthorized`.

#### 3.2.1. Управление сериями (`/admin/library/series`)

| Метод   | Путь                                      | Тело запроса                                 | Ответ                          | Ошибки и поведение                                                                                                                          | Ссылка на сервер                   |
| ------- | ----------------------------------------- | -------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `POST`  | `/admin/library/series`                   | `CreateSeriesDto` (`title: string`, max 200) | `201 Created`<br/>`SeriesView` | `400` `LIBRARY_VALUE_INVALID`<br/>`409` `LIBRARY_SERIES_TITLE_TAKEN` (`existingId`, `existingArchived`)                                     | `admin-series.controller.ts:33-40` |
| `PATCH` | `/admin/library/series/:seriesId`         | `PatchSeriesDto` (`title: string`, max 200)  | `200 OK`<br/>пустое тело       | `400` валидация / UUID<br/>`404` `LIBRARY_SERIES_NOT_FOUND`<br/>`409` `LIBRARY_SERIES_TITLE_TAKEN`                                          | `admin-series.controller.ts:42-55` |
| `POST`  | `/admin/library/series/:seriesId/archive` | —                                            | `200 OK`<br/>пустое тело       | `404` `LIBRARY_SERIES_NOT_FOUND`<br/>`409` `LIBRARY_SERIES_HAS_ACTIVE_BOOKS` (нельзя архивировать серию, содержащую неархивированные книги) | `admin-series.controller.ts:57-67` |
| `POST`  | `/admin/library/series/:seriesId/restore` | —                                            | `200 OK`<br/>пустое тело       | `404` `LIBRARY_SERIES_NOT_FOUND`<br/>`409` `LIBRARY_SERIES_TITLE_TAKEN`                                                                     | `admin-series.controller.ts:69-79` |

#### 3.2.2. Управление книгами (`/admin/library/books`)

| Метод   | Путь                                   | Query / Тело                                                                                        | Ответ                               | Ошибки и поведение                                                                                                                                                                                                                                                               | Ссылка на сервер                   |
| ------- | -------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `POST`  | `/admin/library/books`                 | `CreateBookDto` (`title: string` max 200, `seriesId?: string\|null`, `volume?: number\|null` min 1) | `201 Created`<br/>`BookSummaryView` | `400` `LIBRARY_VALUE_INVALID`, `LIBRARY_BOOK_PLACEMENT_INVALID`<br/>`404` `LIBRARY_SERIES_NOT_FOUND`<br/>`409` `LIBRARY_BOOK_TITLE_TAKEN`, `LIBRARY_VOLUME_TAKEN`                                                                                                                | `admin-books.controller.ts:41-52`  |
| `PATCH` | `/admin/library/books/:bookId`         | `PatchBookDto` (`title?: string`, `seriesId?: string\|null`, `volume?: number\|null`)               | `200 OK`<br/>пустое тело            | `400` (если нет ни одного поля), `LIBRARY_BOOK_PLACEMENT_INVALID`<br/>`404` `LIBRARY_BOOK_NOT_FOUND`, `LIBRARY_SERIES_NOT_FOUND`<br/>`409` `LIBRARY_BOOK_TITLE_TAKEN`, `LIBRARY_VOLUME_TAKEN`, `LIBRARY_NUMBER_SCOPE_CONFLICT` (при смене серии, если номера песен пересекаются) | `admin-books.controller.ts:54-84`  |
| `POST`  | `/admin/library/books/:bookId/archive` | Query: `confirmInUse?: boolean` (по умолчанию `false`)                                              | `200 OK`<br/>пустое тело            | `404` `LIBRARY_BOOK_NOT_FOUND`<br/>`409` `LIBRARY_ITEM_IN_USE` с `{ usage: { communities: N, references: M } }` если `confirmInUse !== true`. При передаче `confirmInUse=true` книга и все её активные песни архивируются.                                                       | `admin-books.controller.ts:86-97`  |
| `POST`  | `/admin/library/books/:bookId/restore` | —                                                                                                   | `200 OK`<br/>пустое тело            | `404` `LIBRARY_BOOK_NOT_FOUND`<br/>`409` `LIBRARY_BOOK_TITLE_TAKEN`, `LIBRARY_VOLUME_TAKEN`                                                                                                                                                                                      | `admin-books.controller.ts:99-109` |

#### 3.2.3. Управление песнями (`/admin/library/books/:bookId/songs` и `/admin/library/songs/:songId`)

| Метод   | Путь                                   | Query / Тело                                                                                                                                   | Ответ                        | Ошибки и поведение                                                                                                                                                                                                                                                 | Ссылка на сервер                    |
| ------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `POST`  | `/admin/library/books/:bookId/songs`   | `CreateSongDto` (`number: string\|number`, `title: string` max 200, `author?: string\|null`, `arranger?: string\|null`, `themeIds?: string[]`) | `201 Created`<br/>`SongView` | `400` `LIBRARY_VALUE_INVALID`<br/>`404` `LIBRARY_BOOK_NOT_FOUND`, `LIBRARY_THEME_NOT_FOUND`<br/>`409` `LIBRARY_ITEM_ARCHIVED` (нельзя добавить песню в архивированную книгу), `LIBRARY_SONG_NUMBER_TAKEN` (`existingSongId`, `existingBookId`, `existingArchived`) | `admin-songs.controller.ts:36-53`   |
| `PATCH` | `/admin/library/songs/:songId`         | `PatchSongDto` (`number?: string\|number`, `title?: string`, `author?: string\|null`, `arranger?: string\|null`)                               | `200 OK`<br/>пустое тело     | `400` (если все поля undefined), `LIBRARY_VALUE_INVALID`<br/>`404` `LIBRARY_SONG_NOT_FOUND`<br/>`409` `LIBRARY_SONG_NUMBER_TAKEN`                                                                                                                                  | `admin-songs.controller.ts:55-80`   |
| `PUT`   | `/admin/library/songs/:songId/themes`  | `SetSongThemesDto` (`themeIds: string[]` UUIDs)                                                                                                | `200 OK`<br/>пустое тело     | Полная замена набора тем песни.<br/>`404` `LIBRARY_SONG_NOT_FOUND`, `LIBRARY_THEME_NOT_FOUND`<br/>`409` `LIBRARY_ITEM_ARCHIVED` (если тема архивирована)                                                                                                           | `admin-songs.controller.ts:82-95`   |
| `POST`  | `/admin/library/songs/:songId/archive` | Query: `confirmInUse?: boolean`                                                                                                                | `200 OK`<br/>пустое тело     | `404` `LIBRARY_SONG_NOT_FOUND`<br/>`409` `LIBRARY_ITEM_IN_USE` (если песня используется в Community), архивация при `confirmInUse=true`                                                                                                                            | `admin-songs.controller.ts:97-108`  |
| `POST`  | `/admin/library/songs/:songId/restore` | —                                                                                                                                              | `200 OK`<br/>пустое тело     | `404` `LIBRARY_SONG_NOT_FOUND`<br/>`409` `LIBRARY_SONG_NUMBER_TAKEN`, `LIBRARY_ITEM_ARCHIVED` (если родительская книга архивирована)                                                                                                                               | `admin-songs.controller.ts:110-120` |

#### 3.2.4. Управление темами (`/admin/library/themes`)

| Метод   | Путь                                     | Query / Тело                              | Ответ                         | Ошибки и поведение                                                                                                          | Ссылка на сервер                   |
| ------- | ---------------------------------------- | ----------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `POST`  | `/admin/library/themes`                  | `CreateThemeDto` (`name: string` max 200) | `201 Created`<br/>`ThemeView` | `400` `LIBRARY_VALUE_INVALID`<br/>`409` `LIBRARY_THEME_NAME_TAKEN` (`existingThemeId`, `existingArchived`)                  | `admin-themes.controller.ts:38-45` |
| `PATCH` | `/admin/library/themes/:themeId`         | `PatchThemeDto` (`name: string` max 200)  | `200 OK`<br/>пустое тело      | `400` валидация / UUID<br/>`404` `LIBRARY_THEME_NOT_FOUND`<br/>`409` `LIBRARY_THEME_NAME_TAKEN`                             | `admin-themes.controller.ts:47-60` |
| `POST`  | `/admin/library/themes/:themeId/archive` | Query: `confirmInUse?: boolean`           | `200 OK`<br/>пустое тело      | `404` `LIBRARY_THEME_NOT_FOUND`<br/>`409` `LIBRARY_ITEM_IN_USE` (если тема используется), архивация при `confirmInUse=true` | `admin-themes.controller.ts:62-76` |
| `POST`  | `/admin/library/themes/:themeId/restore` | —                                         | `200 OK`<br/>пустое тело      | `404` `LIBRARY_THEME_NOT_FOUND`<br/>`409` `LIBRARY_THEME_NAME_TAKEN`                                                        | `admin-themes.controller.ts:78-88` |

#### 3.2.5. Импорт каталога из файлов (`/admin/library/imports`)

Импорт является двухфазным транзакционным процессом. Файлы передаются через `multipart/form-data` (поле `file`). Поддерживаемые форматы: `.json`, `.csv`, `.xlsx` (размер до 5 МБ).

| Метод  | Путь                             | Формат запроса        | Поля запроса                                                                                                  | Успешный ответ                   | Ошибки и валидация                                                                                                                                                                                                                                   |
| ------ | -------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/admin/library/imports/preview` | `multipart/form-data` | `file`: двоичный файл импорта                                                                                 | `200 OK`<br/>`ImportPreviewView` | `400` `LIBRARY_FILE_INVALID` (нет файла, неверный формат, ошибки валидации строк, дубликаты номеров)<br/>`409` `LIBRARY_BUSY` (параллельный импорт)                                                                                                  |
| `POST` | `/admin/library/imports/apply`   | `multipart/form-data` | `file`: двоичный файл импорта;<br/>`planHash`: строка хеша из preview;<br/>`confirmInUse?: boolean \| string` | `200 OK`<br/>`ImportResultView`  | `400` `LIBRARY_FILE_INVALID`<br/>`409` `LIBRARY_IMPORT_PLAN_CHANGED` (хеш не совпал с фактическим планом файла)<br/>`409` `LIBRARY_ITEM_IN_USE` (архивируемые элементы используются в Community, а `confirmInUse !== true`)<br/>`409` `LIBRARY_BUSY` |

_Ссылки на сервер:_ `admin-imports.controller.ts:59-130`, `admin-import-exception.filter.ts:1-49`.

---

### 3.3. Структура представлений (Views) и DTO

#### 3.3.1. Модели представлений чтения (`library.views.ts`)

```typescript
// chor-app-server/src/library/application/views/library.views.ts:1-79

export interface SeriesBookItemView {
  id: string
  title: string
  volume: number | null
  archived: boolean
}

export interface SeriesView {
  id: string
  title: string
  archived: boolean
  books: SeriesBookItemView[]
}

export interface BookSummarySeriesView {
  id: string
  title: string
}

export interface BookSummaryView {
  id: string
  title: string
  series: BookSummarySeriesView | null
  volume: number | null
  songCount: number
  archived: boolean
}

export interface SongThemeItemView {
  id: string
  name: string
  archived: boolean
}

export interface BookSongItemView {
  id: string
  number: string
  title: string
  author: string | null
  arranger: string | null
  themes: SongThemeItemView[]
  archived: boolean
}

export interface BookView {
  id: string
  title: string
  series: BookSummarySeriesView | null
  volume: number | null
  archived: boolean
  songs: BookSongItemView[]
}

export interface SongBookRefView {
  id: string
  title: string
  volume: number | null
  archived: boolean
}

export interface SongView {
  id: string
  number: string
  title: string
  author: string | null
  arranger: string | null
  book: SongBookRefView
  series: BookSummarySeriesView | null
  themes: SongThemeItemView[]
  archived: boolean
}

export interface ThemeView {
  id: string
  name: string
  archived: boolean
  songCount: number
}
```

#### 3.3.2. Модели представлений импорта (`import.views.ts`)

```typescript
// chor-app-server/src/library-admin/interface/views/import.views.ts:1-58

export interface ImportSummaryView {
  series: { create: number; restore: number }
  books: { create: number; place: number; restore: number; unchanged: number }
  themes: { create: number; restore: number }
  songs: {
    create: number
    update: number
    move: number
    restore: number
    archive: number
    unchanged: number
  }
}

export interface ImportBookSongsView {
  create: string[]
  update: Array<{ number: string; fields: string[] }>
  move: string[]
  restore: string[]
  archive: string[]
}

export interface ImportBookPreviewView {
  title: string
  action: "CREATE" | "RESTORE" | "PLACE" | "UNCHANGED"
  series: string | null
  volume: number | null
  songs: ImportBookSongsView
}

export interface ImportThemesPreviewView {
  create: string[]
  restore: string[]
}

export interface ImportInUseView {
  type: "BOOK" | "SONG" | "THEME"
  id: string
  label: string
  communities: number
  references: number
}

export interface ImportPreviewView {
  planHash: string // например, "sha256:abc..."
  format: "JSON" | "CSV" | "XLSX"
  summary: ImportSummaryView
  books: ImportBookPreviewView[]
  themes: ImportThemesPreviewView
  inUse: ImportInUseView[]
  requiresConfirmation: boolean // true, если inUse.length > 0
}

export interface ImportResultView {
  planHash: string
  summary: ImportSummaryView
}
```

---

### 3.4. Коды ошибок API (`code`) и форматы ответов

Сервер возвращает ошибки через `toLibraryHttpException` и `toLibraryAdminHttpException`. Формат JSON: `{ statusCode, error, message, code, ... }`.

| Код ошибки (`code`)               | HTTP статус       | Дополнительные поля в JSON                                                      | Причина возникновения                                                                              |
| --------------------------------- | ----------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `LIBRARY_ITEM_IN_USE`             | `409 Conflict`    | `usage: { communities: number, references: number }`                            | Попытка архивации книги, песни или темы, на которую есть ссылки в Community (`confirmInUse=false`) |
| `LIBRARY_IMPORT_PLAN_CHANGED`     | `409 Conflict`    | `planHash: string`                                                              | Несовпадение переданного `planHash` с хешем плана при вызове `/imports/apply`                      |
| `LIBRARY_FILE_INVALID`            | `400 Bad Request` | `errors: Array<{ line?: number, code: string, message: string }>`               | Ошибки структуры или содержимого файла импорта CSV/XLSX/JSON                                       |
| `LIBRARY_VALUE_INVALID`           | `400 Bad Request` | `field?: string`                                                                | Недопустимое значение атрибута сущности (пустое имя, пробелы и т.д.)                               |
| `LIBRARY_BOOK_PLACEMENT_INVALID`  | `400 Bad Request` | —                                                                               | Некорректное размещение книги (например, volume указан без seriesId)                               |
| `LIBRARY_LOOKUP_SCOPE_INVALID`    | `400 Bad Request` | —                                                                               | В запросе `/library/songs/lookup` не указан ни `bookId`, ни `seriesId`                             |
| `LIBRARY_SERIES_NOT_FOUND`        | `404 Not Found`   | `id: string`                                                                    | Серия с указанным id не найдена                                                                    |
| `LIBRARY_BOOK_NOT_FOUND`          | `404 Not Found`   | `id: string`                                                                    | Книга с указанным id не найдена                                                                    |
| `LIBRARY_SONG_NOT_FOUND`          | `404 Not Found`   | `id: string`                                                                    | Песня с указанным id или номером не найдена                                                        |
| `LIBRARY_THEME_NOT_FOUND`         | `404 Not Found`   | `id: string`                                                                    | Тема с указанным id не найдена                                                                     |
| `LIBRARY_SERIES_TITLE_TAKEN`      | `409 Conflict`    | `existingId: string`, `existingArchived: boolean`                               | Название серии уже занято другой серией                                                            |
| `LIBRARY_BOOK_TITLE_TAKEN`        | `409 Conflict`    | `existingId: string`, `existingArchived: boolean`                               | Название книги уже занято                                                                          |
| `LIBRARY_VOLUME_TAKEN`            | `409 Conflict`    | `existingBookId: string`                                                        | Номер тома (`volume`) в данной серии уже занят другой книгой                                       |
| `LIBRARY_SONG_NUMBER_TAKEN`       | `409 Conflict`    | `existingSongId: string`, `existingBookId: string`, `existingArchived: boolean` | Номер песни уже занят в пределах книги или сквозной серии                                          |
| `LIBRARY_NUMBER_SCOPE_CONFLICT`   | `409 Conflict`    | `numbers: string[]`                                                             | Конфликт номеров при попытке привязать существующую книгу к серии                                  |
| `LIBRARY_THEME_NAME_TAKEN`        | `409 Conflict`    | `existingThemeId: string`, `existingArchived: boolean`                          | Название темы уже занято                                                                           |
| `LIBRARY_SERIES_HAS_ACTIVE_BOOKS` | `409 Conflict`    | `bookIds: string[]`                                                             | Попытка архивировать серию, содержащую неархивированные книги                                      |
| `LIBRARY_ITEM_ARCHIVED`           | `409 Conflict`    | `type: string`, `id: string`                                                    | Попытка добавить песню в архивированную книгу или привязать архивированную тему                    |
| `LIBRARY_BUSY`                    | `409 Conflict`    | —                                                                               | Попытка одновременного выполнения операций импорта                                                 |

_Ссылки на сервер:_ `library-error-mapper.ts:32-233`, `library-admin-error-mapper.ts:16-52`.

---

## 4. Текущее состояние клиента (`chor-app-client` как есть)

### 4.1. Маршрутизация и макеты (`App.tsx`, `AdminLayout.tsx`, `AppLayout.tsx`)

| Файл                                                       | Текущее состояние                                                                                                                                                                                                                                                                 | Ограничение относительно Catalog / Library                                                                                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx:35-115`                                       | Корневой роутер содержит: пользовательские маршруты `/` (под `RequireAuth`), страницы аутентификации пользователя (`/login`, `/register`, ...), маршруты суперадмина `/admin/login` и `/admin` (под `RequireAdminAuth`). В `/admin` зарегистрированы только `superadmins` и `me`. | В роутере полностью отсутствуют маршруты каталога библиотеки (ни для админки `/admin/library/...`, ни детальных страниц просмотра книг для пользователей). |
| `src/features/superadmin/components/AdminLayout.tsx:33-46` | Навигационная панель суперадмина содержит только две ссылки: `Superadmins` (`/admin/superadmins`) и `Mein Profil` (`/admin/me`).                                                                                                                                                  | В шапке администратора нет пункта перехода к библиотеке/каталогу (_Bibliothek_ / _Katalog_).                                                               |
| `src/app/layout/navItems.ts:56-65`                         | Определены пользовательские вкладки `themensuche` («Themensuche») и `lieder` («Lieder verwalten»).                                                                                                                                                                                | Вкладки рендерят `PlaceholderPage` (`src/App.tsx:50-54`). Компонентов для поиска по библиотеке и просмотра каталога на клиенте нет.                        |

### 4.2. Аутентификация, сессии и токены

| Файл                                                   | Реализация                                                                                                                                                             | Особенности относительно Catalog                                                                |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/features/auth/tokenStorage.ts:1-42`               | Поддерживает раздельное хранение токенов по типу: `user` (`STORAGE_KEYS.user = "chorApp.accessToken"`) и `admin` (`STORAGE_KEYS.admin = "chorApp.admin.accessToken"`). | Раздельное хранение уже реализовано; сохранение админского токена не затирает пользовательский. |
| `src/features/auth/authSlice.ts` & `adminAuthSlice.ts` | Две независимые ветки сессий в Redux: `state.auth` (сессия пользователя) и `state.adminAuth` (сессия суперадмина).                                                     | Сессии не конфликтуют в Redux store.                                                            |

### 4.3. Сетевой клиент (`src/lib/http/client.ts`) и обработка ошибок

| Механизм в `client.ts`          | Текущий код                                                                                                                                                                                                                   | Ограничение / Проблема для Catalog                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Поддерживаемые методы**       | `httpClient.get`, `httpClient.post`, `httpClient.patch`, `httpClient.put`, `httpClient.delete` (`client.ts:155-183`)                                                                                                          | Все необходимые методы HTTP уже поддерживаются.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Поддержка `FormData`**        | `isFormData = typeof FormData !== "undefined" && body instanceof FormData`. Если `body` — `FormData`, заголовок `Content-Type: application/json` не устанавливается, тело передаётся напрямую в `fetch` (`client.ts:96-117`). | `FormData` поддерживается для передачи файлов на `/admin/library/imports/preview` и `/apply`.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Инъекция токена авторизации** | `const token = path.startsWith("/admin/") ? adminAuthToken : userAuthToken` (`client.ts:102`)                                                                                                                                 | **Критический факт:** для путей `/admin/library/...` подставляется `adminAuthToken` (корректно). Но для путей чтения `/library/...` условие `startsWith("/admin/")` ложно, поэтому подставляется `userAuthToken`. Если суперадмин работает в админ-панели и вызывает чтение каталога (`GET /library/books` и т.д.), не будучи залогиненным как обычный `User`, запрос уйдёт без токена или с `null`. Серверный guard `UserOrSuperadminAuthGuard` принимает токен суперадмина, но клиент его туда сейчас не передаёт. |
| **Парсинг ошибок сервера**      | `parseErrorBody` извлекает только `message`, `error`, `code` (`client.ts:28-54`). `HttpError` содержит только свойства `status`, `message`, `details`, `code` (`httpError.ts:1-18`).                                          | **Критический факт:** сервер при ошибке 409 `LIBRARY_ITEM_IN_USE` передаёт `{ code: 'LIBRARY_ITEM_IN_USE', usage: { communities: number, references: number } }`. При ошибке 409 `LIBRARY_IMPORT_PLAN_CHANGED` сервер передаёт `planHash`. При ошибке 400 `LIBRARY_FILE_INVALID` сервер передаёт массив `errors`. Сейчас `parseErrorBody` и `HttpError` эти поля отбрасывают, и UI не может прочитать объект `usage` из пойманной ошибки `HttpError`.                                                                |

### 4.4. Состояние Redux Store и серверные данные

| Файл                 | Состояние                                                                                                                                                                                                                              | Ограничение                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/app/store.ts:8` | `const rootReducer = combineSlices(authSlice, adminAuthSlice)`                                                                                                                                                                         | Нет слайсов или редьюсеров для каталога.                                                                |
| `package.json:18-26` | `@tanstack/react-query` **не установлен** в зависимостях проекта. При этом ADR 0001 и `AGENTS.md:31-33` требуют использовать TanStack React Query для всех серверных данных (списки, мутации, инвалидация кэша) и запрещают RTK Query. | Кеширование и управление серверными запросами книг/серий/песен/тем не имеет инфраструктуры React Query. |

### 4.5. Стек и окружение

- **React:** 19.1.0 (`package.json:21`). React 19 использует `SubmitEvent` вместо устаревшего `FormEvent` для `<form onSubmit>`.
- **UI:** `react-bootstrap` 2.10.10, `bootstrap` 5.3.8. Кастомный CSS сведён к минимуму (`src/index.css`), оформление — стандартный Bootstrap.
- **Иконки:** сторонних библиотек иконок (lucide, fontawesome) в `package.json` нет; проект использует emoji (например, 🛡️ в `AdminLayout.tsx:29`).
- **Тесты:** `vitest` 3.1.1, `@testing-library/react` 16.3.0, `@testing-library/user-event` 14.6.1, `jsdom` 26.0.0.
- **Линтер:** ESLint 9 (`typescript-eslint` 8.29, `strict-type-checked`). Ограничение: запрещены прямые импорты из `react-redux` (`useSelector`/`useDispatch`), требуется использовать `useAppSelector`/`useAppDispatch`.

### 4.6. Структура директорий фичи в клиенте

- Директория `docs/feature/catalog/` создана (в ней размещается данный документ).
- Исходный код в `src/features/catalog/` на данный момент полностью отсутствует.

---

## 5. Исходные данные каталога и терминология UI

### 5.1. Каталог прототипа legacy (данные)

- В прототипе `chor-app-docs/chor-app_v3.html` каталог содержит 727 песен в 4 томах Bücher со сквозной нумерацией 1–727:
  - Buch 1: песни 1–163 (163 песни);
  - Buch 2: песни 164–357 (194 песни);
  - Buch 3: песни 358–563 (206 песен);
  - Buch 4: песни 564–727 (164 песни).
- 30 канонических тем (`themen_kanonisch`). Все 30 тем привязаны к песням.
- 728 связей песня–тема (у песни № 613 две темы).
- У песен в прототипе отсутствуют поля `author` и `arranger` (они добавлены в модель ADR 0010 как опциональные).

### 5.2. Терминология UI (немецкий язык)

Согласно `chor-app-docs/glossary.md` и ADR 0010:

| Немецкий термин (UI)         | Английский термин (код / API)   | Применение в интерфейсе                                              |
| ---------------------------- | ------------------------------- | -------------------------------------------------------------------- |
| **Bibliothek** / **Katalog** | Library / Catalog               | Раздел в навигации администратора и публичном меню                   |
| **Buch** / **Bücher**        | Book / Books                    | Книга печатного издания                                              |
| **Serie**                    | Series (`LibrarySeries`)        | Серия книг со сквозной нумерацией (например, «Bücher»)               |
| **Band** / **Buchband**      | Volume                          | Номер тома в серии (1, 2, 3, 4)                                      |
| **Lied** / **Lieder**        | Song / Songs                    | Песня / список песен                                                 |
| **Thema** / **Themen**       | Theme / Themes (`LibraryTheme`) | Главная тема каталога                                                |
| **Nummer**                   | Number                          | Номер песни (строка или число, уникальный в рамках книги/серии)      |
| **Titel**                    | Title                           | Название книги, серии, песни                                         |
| **Autor**                    | Author                          | Автор текста/музыки                                                  |
| **Arrangeur**                | Arranger                        | Аранжировщик                                                         |
| **Importieren**              | Import                          | Загрузка и импорт файла каталога                                     |
| **Vorschau**                 | Preview                         | Предпросмотр изменений импорта                                       |
| **Plan anwenden**            | Apply plan                      | Применение проверенного плана импорта                                |
| **Archivieren**              | Archive                         | Архивация сущности (мягкое удаление)                                 |
| **Wiederherstellen**         | Restore                         | Восстановление из архива                                             |
| **In Verwendung**            | In use                          | Предупреждение об использовании в сообществах                        |
| **Trotzdem archivieren**     | Confirm archive                 | Подтверждение архивации используемого элемента (`confirmInUse=true`) |

---

## 6. Затронутые файлы и модули клиента при реализации Catalog

Исходя из структуры кодовой базы `chor-app-client`:

```
chor-app-client/
  package.json                          # Установка @tanstack/react-query (согласно ADR 0001)
  src/
    lib/
      http/
        client.ts                       # Логика инъекции токена для /library/... (user vs admin);
                                        # сохранение полного payload ошибки (usage, planHash, errors)
        httpError.ts                    # Расширение HttpError полем payload / usage / planHash
    app/
      store.ts                          # Подключение UI-слайса каталога (при необходимости)
      layout/
        navItems.ts                     # Привязка пользовательских вкладок к экранам каталога
    features/
      superadmin/
        components/
          AdminLayout.tsx               # Добавление ссылки "Bibliothek" в навигацию суперадмина
      catalog/                          # НОВАЯ ФИЧА:
        api/
          catalogApi.ts                 # Вызовы GET /library/... и /admin/library/...
        types/
          catalogTypes.ts               # Типы Book, Series, Song, Theme, ImportPreview, ErrorPayloads
        components/
          UsageWarningModal.tsx         # Модальное окно подтверждения при 409 LIBRARY_ITEM_IN_USE
          ImportPreviewModal.tsx        # Модальное окно / экран предпросмотра плана импорта
          BookFormModal.tsx             # Форма создания/редактирования книги и серии
          SongFormModal.tsx             # Форма создания/редактирования песни и назначения тем
          ThemeFormModal.tsx            # Форма создания/переименования темы
        pages/
          admin/
            AdminBooksListPage.tsx      # Список книг и серий в админке
            AdminBookDetailPage.tsx     # Детальная страница книги: список песен, добавление, импорт
            AdminThemesListPage.tsx     # Список главных тем каталога
            AdminImportPage.tsx         # Экран загрузки файла, превью плана и подтверждения
          public/
            CatalogBrowserPage.tsx      # Публичный просмотр каталога книг и песен
    App.tsx                             # Регистрация маршрутов /admin/library/* и пользовательских страниц
```

---

## 7. Сводка пробелов в `chor-app-client` (факты без оценки)

1. **Отсутствие `@tanstack/react-query` в зависимостях:** библиотека зафиксирована ADR 0001 как единственный слой серверного кэширования, но в `package.json` отсутствует.
2. **Потеря дополнительных данных ошибки в HTTP-клиенте:** `parseErrorBody` в `src/lib/http/client.ts` и `HttpError` в `src/lib/http/httpError.ts` сохраняют только `message`, `error` и `code`. Поле `usage: { communities, references }` (возвращаемое сервером при 409 `LIBRARY_ITEM_IN_USE`), поле `planHash` (при 409 `LIBRARY_IMPORT_PLAN_CHANGED`) и массив `errors` (при 400 `LIBRARY_FILE_INVALID`) отбрасываются.
3. **Маршрутизация токена авторизации в `client.ts`:** проверка `path.startsWith("/admin/")` подставляет `adminAuthToken` только для админских путей. Публичные пути чтения `/library/...` защищены на сервере `UserOrSuperadminAuthGuard`, но клиент отправляет для них исключительно `userAuthToken`. Если суперадмин открывает чтение каталога без активной сессии обычного пользователя, запрос отправляется неавторизованным.
4. **Отсутствие маршрутов панели библиотеки в админке:** в `src/App.tsx` и `AdminLayout.tsx` отсутствуют пути и пункты меню для перехода к разделам `/admin/library/...`.
5. **Отсутствие компонентов UI каталога:** в клиенте отсутствуют компоненты, формы и страницы для:
   - просмотра списка серий и книг;
   - создания, редактирования и архивации серий и книг;
   - просмотра песен книги, добавления новой песни, редактирования реквизитов и тем песни;
   - создания, переименования и архивации главных тем;
   - загрузки файла (CSV, XLSX, JSON) через `multipart/form-data`, отображения `ImportPreviewView` (сводка по созданию, обновлению, перемещению, архивации песен) и применения импорта с передачей `planHash`;
   - отображения модального окна предупреждения об использовании при ошибке 409 `LIBRARY_ITEM_IN_USE` с повторным вызовом с параметром `confirmInUse=true`.
6. **Заглушки пользовательских вкладок:** пользовательские вкладки `themensuche` и `lieder` в `navItems.ts` отображают `PlaceholderPage`.
