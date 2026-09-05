# EduGrade — Test Plan

## 1. Test Strategy

| Layer | Scope | Tools |
|---|---|---|
| Unit | Services, repos, sync engine, API client, utils, hooks | `vitest` |
| Component | UI primitives, forms, pages (mocked API/IDB) | `@testing-library/react` + `vitest` |
| Integration | Offline flow: service → repo → IDB | `fake-indexeddb` + `vitest` |
| E2E | Critical user journeys across pages | `@playwright/test` |

## 2. Environment & Setup

- Install: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `fake-indexeddb`, `next-router-mock`, `@playwright/test`.
- Use `fake-indexeddb` globally in `vitest.setup.ts`.
- Mock `window.matchMedia`, `ResizeObserver`, `next/navigation` as needed per test.
- API client: mock `global.fetch` at the unit layer; use MSW or route handlers for Playwright.

## 3. Unit Tests

### 3.1 API Client (`lib/api-client.ts`)
- **GET success**: returns `ApiSuccess` with parsed JSON.
- **POST success**: returns `ApiSuccess`.
- **401 handling**: single-flight refresh; retries original request; redirects to `/login` on refresh failure.
- **Token injection**: `Authorization: Bearer <token>` from `localStorage`.
- **Form data**: sets `Content-Type: multipart/form-data` and appends fields/files.
- **Error mapping**: 400/401/403/404/409/422/500 map to `ApiError.message`.

### 3.2 IndexedDB Layer (`lib/db/`)
- **`openLocalDb`**: opens `edugrade-offline`, creates stores/indexes, caches instance.
- **Repos**: `put`/`get`/`getAll`/`where`/`replaceAll` for each entity (sessions, terms, sequences, classes, subjects, assignments, students, enrollments, results, sync_queue).
- **`replaceAll` correctness**: clears store then bulk-writes in a single `readwrite` transaction.

### 3.3 Sync Engine (`lib/sync/sync-engine.ts`)
- **Enqueue**: writes `DBSyncQueueItem` with `status: 'pending'`.
- **Drain**: iterates pending items in order.
- **Retry**: on 5xx/network, calls `updateItem` with backoff (`base=1s`, cap `5m`).
- **Permanent failure**: on 4xx, marks item `failed`.
- **Success**: marks item done (deletes from store).
- **Single-flight drain**: concurrent `drainNow()` calls do not duplicate requests.

### 3.4 Online Sync (`lib/sync/online-sync.ts`)
- **Bootstrap**: calls all `get*` services, maps to `DB*` shapes with `syncedAt`.
- **Persistence**: calls all `replace*` repos in `Promise.all`.
- **Teacher scoping**: `assignmentsRaw` filtered by `teacherId`; `classIds` derived correctly.
- **Session mapping**: `sessionName` resolved from local `sessions` array, not remote relation.

### 3.5 Connectivity (`lib/sync/connectivity.ts`)
- **Heartbeat**: pings `/health` every 30s; updates `online` flag.
- **Event listeners**: reacts to `window.online` / `window.offline`.
- **`isOnline()`**: returns `navigator.onLine && health.ok`.

### 3.6 Services
- **Auth**: login stores tokens; `getCurrentUser` calls `/auth/me`; `hasProprietor` boolean.
- **Students**: CRUD + search + photo upload + auto-enrollment on create.
- **Classes**: CRUD + student/subject counts + PDF download callback.
- **Teachers**: CRUD + suspend/activate + password reset + photo helpers.
- **Subjects**: CRUD + class assignment via `subject-class.service`.
- **Results**:
  - `saveDraft`/`bulkSaveDraft`: online → POST; offline → IDB `dirty:1` + enqueue.
  - `submitResults`: online → POST `/results/bulk-submit`; offline → enqueue N items.
  - `lockResults`/`unlockResults`: requires online.
  - Status counts: `getPendingResultsCount`, `getSubmittedResultsCount`.
- **Sessions/Terms/Sequences**: CRUD + active/current flags + carry-forward.
- **Enrollments**: active enrollments, withdrawal, removal.
- **Assignments**: teacher-scoped queries + bulk create + carry-forward.
- **Report cards**: `generateReportCard` (single), `generateBulkReportCards` (class), `getSubjectReport`, `getGradeInfo`.
- **Notifications**: list, unread count, mark read/delete.

### 3.7 Utilities & Constants
- `cn()` class merge.
- Date/score/status helpers.
- Nav items, score bounds, naming lists.

### 3.8 Hooks
- `useDebounce`: delayed value update.
- `useMediaQuery` → `useIsMobile/Tablet/Desktop`: correct breakpoint matches.

## 4. Component Tests

### 4.1 UI Primitives (`components/ui/`)
- **Button**: renders variant, size, disabled, loading, icon slots; click handler fires.
- **Input**: controlled value, error display, onChange.
- **Select**: renders options, onChange returns value.
- **Card**: Header/Content layout.
- **Modal**: open/close, backdrop click, Escape key.
- **Toast**: `showToast` renders in portal; auto-dismiss after timeout.
- **ConfirmDialog**: confirm/cancel callbacks.
- **EmptyState**: renders icon + title + description.
- **Badge**: renders children.
- **Skeleton**: renders placeholder blocks.
- **Spinner**: renders animated element.

### 4.2 Layout
- **Sidebar**: role-aware links (proprietor vs teacher).
- **Header**: session switcher, sync status pill, notification bell with unread count, user menu.
- **MobileNav**: bottom bar with 5 items, active highlight.

### 4.3 Pages (key flows)
- **Login**: valid credentials → redirect; invalid → error toast.
- **Forgot password**: email → code → new password → success.
- **Dashboard**: proprietor sees stats + quick actions; teacher sees my classes + assignments.
- **Student CRUD**: list, create with photo, edit, delete with confirmation.
- **Class CRUD**: list, create, detail with students/subjects, edit, PDF download.
- **Subject CRUD**: list, create, detail, edit, class assignments.
- **Results entry**: session→term→sequence→class→subject → score grid → Save Draft / Submit.
- **Reports**: single-student search, bulk class generation, print preview.
- **Assignments**: create/edit/remove, filters.
- **Settings**: update school info, toggle marks-entry, upload logo, change password.
- **Audit log**: filter by action/entity/user, pagination.

## 5. Integration / Offline Tests

- **Offline draft**: `result.service.bulkSaveDraft` while offline → IDB rows with `dirty:1` + queue items.
- **Reconnect drain**: connectivity flips online → `drainNow()` replays queue.
- **Online sync bootstrap**: `syncAllTeacherData()` populates all 10 IDB stores.
- **Conflict-free writes**: offline draft + online submit → correct status transitions.
- **Token expiry during sync**: 401 → refresh → retry; refresh failure → queue item marked `failed`.

## 6. E2E Tests (Playwright)

| Journey | Steps |
|---|---|
| **Proprietor first-run** | Signup → FirstTimeSetup → Dashboard → Settings |
| **Teacher onboarding** | Proprietor creates teacher → Teacher login → Dashboard |
| **Academic setup** | Create session → terms → sequences → classes → subjects |
| **Student lifecycle** | Create student → enroll in class → view detail → edit → delete |
| **Mark entry offline** | Login → go offline → enter marks → save draft → go online → verify sync |
| **Mark entry online** | Enter marks → submit → lock sequence → verify results |
| **Report cards** | Generate single → print preview → bulk class → verify PDF |
| **Audit log** | Perform actions → view audit log → filter by user/entity |
| **Settings** | Update school info → upload logo → change password |
| **Password reset** | Forgot password → email → code → new password → login |

## 7. Test Data & Fixtures

- **Factories**: generate `DB*` objects with `syncedAt`, `dirty`, `pendingOpId`.
- **API mocks**: intercept `/api/v1/**` with MSW or route handlers.
- **IDB setup/teardown**: `beforeEach` clear all stores; `afterEach` close DB.
- **Auth fixtures**: proprietor token, teacher token, expired token.

## 8. Execution Order

1. `vitest --run` for unit + component + integration.
2. `playwright test` for E2E (chromium, firefox, webkit).
3. Coverage target: **≥ 80%** on `lib/` and `services/`.

## 9. Non-Functional Checks

- **Build**: `npm run build` passes (already verified).
- **Lint**: `npm run lint` passes.
- **TypeScript**: strict mode, no `any` leakage in tests.
- **Accessibility**: axe checks on critical pages (login, results entry).
- **Performance**: Lighthouse PWA score ≥ 90 (after service worker implementation).
