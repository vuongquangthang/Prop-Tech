# QA Test Results - Prop-Tech Admin

Ngày kiểm thử: 02/07/2026  
Nguồn test matrix: `promt.txt`  
Môi trường: local Windows, backend `http://localhost:5052`, frontend build bằng Vite, tài khoản smoke `0900000001 / 123456`.

## Executive Summary

| Hạng mục | Kết quả | Ghi chú |
|---|---:|---|
| Backend build | PASS | `dotnet build -o ..\tmp\qa-backend-build` thành công, 0 warning, 0 error. |
| Frontend production build | PASS WITH WARNINGS | `npm run build` thành công; có warning chunk JS lớn `1,702.99 kB` và warning Rollup SignalR PURE annotation. |
| Frontend unit test | PASS | `vitest run`: 1 file, 3 tests pass. |
| Mobile TypeScript check | FAIL | `npm exec tsc -- --noEmit` trong `mobile` lỗi null-safety ở `RoomDetailScreen.tsx`. |
| Backend API smoke authenticated | PASS | Các API chính trả `2xx`; không tái hiện lỗi 500 ở `/api/Services`, `/api/Rooms`, `/api/Floors`. |
| Auth negative smoke | PASS | Sai mật khẩu trả 401; gọi protected API không token trả 401. |
| Deep security/load/concurrency testing | NOT EXECUTED | Chưa chạy DAST, penetration test, load test thật vì không có harness và có rủi ro phá dữ liệu local. |
| Visual regression | PARTIAL | Chỉ kiểm tra code/build; chưa dùng browser automation/screenshot để xác nhận UI pixel-level. |

## Commands Executed

| Command | Result |
|---|---|
| `dotnet build -o ..\tmp\qa-backend-build` in `backend` | PASS |
| `npm run build` in `frontend` | PASS WITH WARNINGS |
| `npm test -- --run` in `frontend` | PASS |
| `npm exec tsc -- --noEmit` in `mobile` | FAIL |
| Authenticated API smoke via PowerShell `Invoke-RestMethod` | PASS for tested endpoints |

## Build & Static Validation

### Backend

| Test Case ID | Description | Input | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| BUILD-BE-001 | Compile backend | Source tree hiện tại | Run `dotnet build` | Build success | Build success, 0 warnings/errors | PASS |
| MIG-STATIC-001 | Soft-delete columns/index code present | `TOA_NHA`, `TANG`, `PHONG` | Static/build validation | Code compiles with `IS_DELETED` and filtered room index | Build pass | PASS |

### Frontend

| Test Case ID | Description | Input | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| BUILD-FE-001 | Production build frontend | Source tree hiện tại | Run `npm run build` | Build success | Build success | PASS |
| BUILD-FE-002 | Bundle warning review | Vite build output | Inspect output | No blocking warning | JS chunk `1,702.99 kB`; SignalR PURE annotation warning | WARNING |
| UNIT-FE-001 | Unit tests | Existing Vitest suite | Run `npm test -- --run` | All tests pass | 3/3 tests pass | PASS |

### Mobile

| Test Case ID | Description | Input | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| BUILD-MOB-001 | TypeScript no-emit check | Mobile source | Run `npm exec tsc -- --noEmit` | No TS errors | 15 TS errors in `src/screens/RoomDetailScreen.tsx` around nullable `contractDetail`/`room` | FAIL |

#### Mobile Failures

| File | Lines Reported | Error Pattern | Risk |
|---|---:|---|---|
| `mobile/src/screens/RoomDetailScreen.tsx` | 527, 531, 535, 537, 540, 552, 558, 564, 565, 598, 602, 605 | `contractDetail` possibly `null`; `room` possibly `null`; nullable string passed to string param | Runtime crash risk when room/contract detail is not loaded. |

## API Smoke Results

### Authentication & Authorization

| Test Case ID | Description | Input | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| AUTH-MAIN-001 | Login valid account | `0900000001 / 123456` | POST `/api/Auth/login` | Access token returned | Access token, refresh token, Admin user returned | PASS |
| AUTH-NEG-001 | Invalid password rejected | `0900000001 / wrong-password` | POST `/api/Auth/login` | 400/401 | HTTP 401 | PASS |
| AUTH-SEC-003 | Protected API rejects missing token | GET `/api/Services` no token | Call endpoint | HTTP 401 | HTTP 401 | PASS |

### Authenticated GET Smoke

| Endpoint | Status | HTTP | Time (ms) | Count | Notes |
|---|---:|---:|---:|---:|---|
| `/api/Auth/me` | PASS | 2xx | 2065 | 1 | Auth profile ok. |
| `/api/Services` | PASS | 2xx | 2143 | 0 | No 500; dataset empty. |
| `/api/Buildings` | PASS | 2xx | 2048 | 4 | Soft-delete query did not fail. |
| `/api/Floors` | PASS | 2xx | 2059 | 21 | Soft-delete query did not fail. |
| `/api/Rooms` | PASS | 2xx | 2074 | 1 | Soft-deleted rooms hidden from active list. |
| `/api/Residents` | PASS | 2xx | 2194 | 3 | Basic list ok. |
| `/api/HopDong` | PASS | 2xx | 2191 | 2 | Basic list ok. |
| `/api/HoaDon` | PASS | 2xx | 2064 | 0 | No 500; dataset empty. |
| `/api/ThanhToan` | PASS | 2xx | 2101 | 0 | No 500; dataset empty. |
| `/api/TaiSan` | PASS | 2xx | 2070 | 0 | No 500; dataset empty. |
| `/api/YeuCauSuaChua` | PASS | 2xx | 2044 | 0 | No 500; dataset empty. |
| `/api/KnowledgeBase?activeOnly=false` | PASS | 2xx | 2055 | 0 | No 500; dataset empty. |
| `/api/Reports/dashboard` | PASS | 2xx | 2167 | 1 | Dashboard data returns. |
| `/api/public/rooms` | PASS | 2xx | 2054 | 1 | Public listing returns. |
| `/api/Notifications/my-notifications` | PASS | 2xx | 2050 | 0 | Correct notification route. |
| `/api/Notifications/unread-count` | PASS | 2xx | 2050 | 1 | Count object returns. |
| `/api/Notifications/admin/all?limit=5` | PASS | 2xx | 2084 | 0 | Admin notification route ok. |
| `/api/Reports/rooms` | PASS | 2xx | 2057 | 1 | Room report returns. |
| `/api/Reports/revenue` | PASS | 2xx | 2056 | 1 | Revenue report returns. |
| `/api/Reports/debt` | PASS | 2xx | 2054 | 1 | Debt report returns. |
| `/api/auditlogs?limit=5` | PASS | 2xx | 2082 | 5 | Audit route ok. |
| `/api/chisodien` | PASS | 2xx | 2128 | 2 | Electricity readings ok. |
| `/api/chisonuoc` | PASS | 2xx | 2099 | 2 | Water readings ok. |
| `/api/ChiTietSuDungDichVu` | PASS | 2xx | 2166 | 6 | Service usage details ok. |
| `/api/ChiTietTaiSanPhong` | PASS | 2xx | 2086 | 0 | No 500; dataset empty. |
| `/api/Posts` | PASS | 2xx | 2055 | 0 | Admin posts list ok. |
| `/api/TatToan` | PASS | 2xx | 2161 | 2 | Settlement list ok. |
| `/api/Users` | PASS | 2xx | 2078 | 4 | User list ok. |
| `/api/Xe` | PASS | 2xx | 2060 | 0 | Vehicle list ok. |
| `/api/UtilityReadings/month/2026/7` | PASS | 2xx | 2154 | 0 | Correct utility route ok. |
| `/api/NhatKyNhacNo/my-reminders` | PASS | 2xx | 2061 | 0 | Correct reminder route ok. |

### Endpoint Route Findings

| Endpoint Called | Result | Classification |
|---|---|---|
| `/api/Notifications/my` | 404 | Test route mismatch. Correct route is `/api/Notifications/my-notifications`. |
| `/api/NhatKyNhacNo` | 405 | Controller has no base `GET`; correct routes include `/my-reminders`, `/invoice/{invoiceId}`, `/status/{status}`. |
| `/api/Payment` | 404 | Controller has action routes only, e.g. `/initiate`, `/pending/{invoiceId}`. Payment list is `/api/ThanhToan`. |
| `/api/UtilityReadings` | 404 | Controller has action routes only, e.g. `/month/{year}/{month}`. |

## Feature Result Matrix

| Feature | Main Cases | Alternative Cases | Negative Cases | Edge/Boundary Cases | Foreign Cases | Security Cases | Performance Cases | Recovery Cases | Regression Cases | Result |
|---|---|---|---|---|---|---|---|---|---|---|
| Authentication & Authorization | PASS smoke | PARTIAL | PASS basic | NOT EXECUTED | NOT EXECUTED | PARTIAL | NOT EXECUTED | NOT EXECUTED | PARTIAL | PARTIAL PASS |
| Building / Floor / Room | PASS smoke | PARTIAL static | NOT EXECUTED destructive | PARTIAL static | NOT EXECUTED | PARTIAL auth scope only | NOT EXECUTED | PARTIAL startup/build | PARTIAL static | PARTIAL PASS |
| Service & Pricing | PASS smoke | PARTIAL static | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL auth only | NOT EXECUTED | NOT EXECUTED | PARTIAL static | PARTIAL PASS |
| Resident Management | PASS smoke | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL auth only | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL PASS |
| Contract & Settlement | PASS smoke | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL auth only | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL PASS |
| Invoice / Debt / Payment | PASS smoke | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL auth only | NOT EXECUTED | NOT EXECUTED | PARTIAL smoke | PARTIAL PASS |
| Utility Readings | PASS smoke | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL auth only | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL PASS |
| Posts / Listing | PASS smoke | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL auth only | NOT EXECUTED | NOT EXECUTED | PARTIAL unit tests | PARTIAL PASS |
| Asset / Amenity | PASS smoke assets | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL auth only | NOT EXECUTED | NOT EXECUTED | PARTIAL static | PARTIAL PASS |
| Maintenance Requests | PASS smoke | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL auth only | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL PASS |
| Knowledge Base / AI Chat | PASS smoke KB | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL auth only | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL PASS |
| Notifications / Audit Logs | PASS smoke | PARTIAL | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL auth only | NOT EXECUTED | NOT EXECUTED | PARTIAL route check | PARTIAL PASS |
| Reports / Dashboard | PASS smoke | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | PARTIAL auth only | NOT EXECUTED | NOT EXECUTED | PARTIAL smoke | PARTIAL PASS |
| File Upload | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED |
| Cross-Feature Integration | PARTIAL smoke | NOT EXECUTED | NOT EXECUTED | PARTIAL static | NOT EXECUTED | PARTIAL auth only | NOT EXECUTED | PARTIAL startup/build | PARTIAL smoke | PARTIAL PASS |

## Detailed Results by Matrix Area

### Authentication & Authorization

| Test Case ID | Description | Input | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| AUTH-MAIN-001 | Login valid account | `0900000001 / 123456` | POST login | Token returned | Token returned | PASS |
| AUTH-MAIN-002 | Remember me | UI/browser storage | Browser test | Session persists | Not browser-tested | NOT EXECUTED |
| AUTH-NEG-001 | Wrong password | Wrong password | POST login | 401/400 | 401 | PASS |
| AUTH-SEC-003 | Missing token | GET protected endpoint | Call `/api/Services` no auth | 401 | 401 | PASS |
| AUTH-SEC-004 | Role-based admin access | CuDan token | Call admin APIs | 403 | No CuDan credential used | NOT EXECUTED |
| AUTH-PERF-003 | `/api/Auth/me` P95 < 200ms | Auth token | Timed local call | < 200ms P95 | Single PowerShell sample ~2065ms | NOT VALIDATED |

### Building / Floor / Room Management

| Test Case ID | Description | Input | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| INF-MAIN-001 | Get buildings | Auth token | GET `/api/Buildings` | 2xx | 2xx, count 4 | PASS |
| INF-MAIN-002 | Get floors | Auth token | GET `/api/Floors` | 2xx | 2xx, count 21 | PASS |
| INF-MAIN-003 | Get rooms | Auth token | GET `/api/Rooms` | 2xx | 2xx, count 1 | PASS |
| INF-ALT-003 | Add same room code after soft-delete | CRUD destructive flow | Create/delete/create | Should allow | Not executed to avoid modifying data | NOT EXECUTED |
| INF-ALT-004 | Delete floor after rooms soft-deleted | CRUD destructive flow | Delete room then floor | Should allow | Not executed; code compiled after LINQ fix | PARTIAL |
| INF-REC-002 | Startup DB compatibility for `IS_DELETED` | Existing DB | Restart backend/smoke endpoints | No invalid column error | API smoke passed for Buildings/Floors/Rooms | PASS |
| INF-REG-002 | Delete cancel button rounded/spaced | Browser visual | Open popup | Correct UI | Static CSS/class only; no screenshot run | PARTIAL |

### Service & Pricing Management

| Test Case ID | Description | Input | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| SRV-MAIN-001 | Get services | Auth token | GET `/api/Services` | 2xx | 2xx, count 0 | PASS |
| SRV-MAIN-002 | Same name global/building service | CRUD data | Create global + private | No duplicate error | Not executed to avoid modifying data | NOT EXECUTED |
| SRV-REG-001 | No 500 on services | Auth token | GET `/api/Services` | No 500 | 2xx | PASS |

### Resident / Contract / Invoice / Payment

| Test Case ID | Description | Input | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| RES-MAIN-004 | Get residents | Auth token | GET `/api/Residents` | 2xx | 2xx, count 3 | PASS |
| CON-MAIN-004 | Get contracts | Auth token | GET `/api/HopDong` | 2xx | 2xx, count 2 | PASS |
| INV-MAIN-001 | Get invoices | Auth token | GET `/api/HoaDon` | 2xx | 2xx, count 0 | PASS |
| INV-MAIN-003 | Get payments | Auth token | GET `/api/ThanhToan` | 2xx | 2xx, count 0 | PASS |
| CON-MAIN-003 | Get settlements | Auth token | GET `/api/TatToan` | 2xx | 2xx, count 2 | PASS |
| INV-REG-003 | Delete invoice button/API | Existing UI/API | Browser/delete flow | Delete works | Not executed to avoid modifying data | NOT EXECUTED |

### Utility Readings

| Test Case ID | Description | Input | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| UTL-MAIN-001 | Get electricity readings | Auth token | GET `/api/chisodien` | 2xx | 2xx, count 2 | PASS |
| UTL-MAIN-002 | Get water readings | Auth token | GET `/api/chisonuoc` | 2xx | 2xx, count 2 | PASS |
| UTL-MAIN-004 | Get monthly utility readings | `2026/7` | GET `/api/UtilityReadings/month/2026/7` | 2xx | 2xx, count 0 | PASS |
| UTL-NEG-001 | New reading < old reading | Destructive create/update | Submit invalid reading | Reject | Not executed | NOT EXECUTED |

### Posts / Public Listing

| Test Case ID | Description | Input | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| POST-MAIN-005 | Public rooms list | No auth | GET `/api/public/rooms` | 2xx | 2xx, count 1 | PASS |
| POST-MAIN-003 | Admin posts list | Auth token | GET `/api/Posts` | 2xx | 2xx, count 0 | PASS |
| POST-REG-003 | Date picker performance | Browser UI | Scroll date picker | No delay | Not browser-tested | NOT EXECUTED |
| POST-SEC-002 | Upload file attack | Malicious upload | Upload unsafe file | Reject | Not executed | NOT EXECUTED |

### Assets / Maintenance / Knowledge / Notification / Audit / Reports

| Test Case ID | Description | Input | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| AST-MAIN-001 | Get assets | Auth token | GET `/api/TaiSan` | 2xx | 2xx, count 0 | PASS |
| MNT-MAIN-002 | Get maintenance requests | Auth token | GET `/api/YeuCauSuaChua` | 2xx | 2xx, count 0 | PASS |
| AI-MAIN-003 | Get knowledge base | Auth token | GET `/api/KnowledgeBase?activeOnly=false` | 2xx | 2xx, count 0 | PASS |
| NOTI-MAIN-001 | Get my notifications | Auth token | GET `/api/Notifications/my-notifications` | 2xx | 2xx, count 0 | PASS |
| NOTI-MAIN-001B | Get unread count | Auth token | GET `/api/Notifications/unread-count` | 2xx | 2xx, object returned | PASS |
| AUD-MAIN-001 | Get audit logs | Auth token | GET `/api/auditlogs?limit=5` | 2xx | 2xx, count 5 | PASS |
| RPT-MAIN-001 | Dashboard report | Auth token | GET `/api/Reports/dashboard` | 2xx | 2xx, object returned | PASS |
| RPT-MAIN-002 | Room report | Auth token | GET `/api/Reports/rooms` | 2xx | 2xx, object returned | PASS |
| RPT-MAIN-003 | Revenue report | Auth token | GET `/api/Reports/revenue` | 2xx | 2xx, object returned | PASS |
| RPT-MAIN-004 | Debt report | Auth token | GET `/api/Reports/debt` | 2xx | 2xx, object returned | PASS |

## Security Validation Result

| Security Area | Status | Evidence | Gap |
|---|---|---|---|
| Broken Authentication | PARTIAL PASS | Invalid login rejected with 401. | No brute-force/rate-limit test. |
| Token Validation | PARTIAL PASS | Missing token rejected with 401. | No expired/fake token matrix executed. |
| Broken Authorization / IDOR | NOT EXECUTED | Requires multiple owner/user accounts and destructive probes. | Must create multi-tenant test data. |
| SQL Injection | NOT EXECUTED | No DAST executed. | Need automated payload tests against search/filter endpoints. |
| XSS | NOT EXECUTED | No browser rendering test. | Need create/read tests with malicious strings in safe sandbox. |
| CSRF | NOT EXECUTED | App appears Bearer-token based; not validated. | Need CORS/token storage review and browser test. |
| File Upload Attack | NOT EXECUTED | No upload attack run. | Need MIME/magic-byte/path traversal tests. |
| Session Management | PARTIAL PASS | Login token and protected endpoint behavior smoke-tested. | Remember-me persistence not browser-tested. |

## Performance Validation Result

| Area | Status | Evidence | Interpretation |
|---|---|---|---|
| Frontend bundle size | WARNING | Main JS chunk `1,702.99 kB` minified, gzip `444.43 kB`. | Needs code splitting before production scale. |
| API smoke timings | NOT A LOAD TEST | PowerShell samples mostly ~2.0-2.2s. | These include local/tool overhead; not valid P95. Need k6/JMeter/Artillery. |
| Load/stress/spike/endurance | NOT EXECUTED | No load harness configured. | Required before release. |

## Recovery / Migration Validation

| Test Case ID | Description | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| INT-REC-002 | DB missing `IS_DELETED` startup auto-heal | No invalid column error after restart | Current API smoke for Buildings/Floors/Rooms/Services passed | PASS |
| MIG-REG-001 | Filtered index code compiles | Build pass | Backend build pass | PASS |
| REC-DESTRUCTIVE-001 | Retry failed create/update/delete | No duplicate/corrupt data | Not executed | NOT EXECUTED |

## Defects Found

### DEF-MOB-001 - Mobile TypeScript nullability failures

* **Severity**: Medium
* **Area**: Mobile app
* **Evidence**: `npm exec tsc -- --noEmit` in `mobile` fails.
* **Affected file**: `mobile/src/screens/RoomDetailScreen.tsx`
* **Symptoms**:
  * `contractDetail` possibly `null`.
  * `room` possibly `null`.
  * `string | null | undefined` passed where `string` required.
* **Risk**: Runtime crash when loading room detail before contract data is available.
* **Recommendation**: Add loading/empty guards, optional chaining, fallback values, or split render branches after null checks.

### DEF-FE-PERF-001 - Frontend main bundle too large

* **Severity**: Medium
* **Area**: Frontend performance
* **Evidence**: Vite warning: chunk larger than 500 kB; main JS `1,702.99 kB`.
* **Risk**: Slow first load on weak network/devices.
* **Recommendation**: Add route-level lazy loading and manual chunks for heavy libraries like Recharts, SignalR, Leaflet, Radix groups.

## Release Gate Status

| Gate | Status | Evidence |
|---|---|---|
| Không còn API 500 ở happy path chính | PASS for smoke scope | Tested GET smoke APIs, including `/api/Services`, `/api/Rooms`, `/api/Floors`. |
| CRUD chính có owner isolation | NOT VALIDATED | Needs multi-owner dataset and IDOR scripts. |
| Migration chạy sạch trên DB cũ và mới | PARTIAL PASS | Startup/current DB smoke passed; no clean DB + production-copy migration test executed. |
| E2E Login | PARTIAL PASS | API login pass; browser login flow not automated. |
| E2E Tạo tòa/tầng/phòng | NOT EXECUTED | Destructive UI/API flow not run. |
| E2E Tạo dịch vụ chung/riêng | NOT EXECUTED | Destructive UI/API flow not run. |
| E2E Hợp đồng/hóa đơn/thanh toán | NOT EXECUTED | Destructive business flow not run. |
| E2E Tất toán/xóa mềm/thêm lại cùng mã | NOT EXECUTED | Destructive flow not run. |
| Security smoke SQLi/XSS/IDOR/token invalid | PARTIAL | Missing token and invalid password pass; SQLi/XSS/IDOR not executed. |
| Performance baseline P95 | NOT VALIDATED | No load test harness run. |

## Risks & Recommendations

1. **Do not treat this as full production sign-off**: hiện mới là build + unit + authenticated smoke test. Matrix trong `promt.txt` yêu cầu thêm E2E, security, performance, concurrency test.
2. **Fix mobile TypeScript failures before release**: null-safety errors can become production crashes.
3. **Add Playwright E2E** for 5 critical flows:
   * Login.
   * Tạo tòa/tầng/phòng.
   * Tạo dịch vụ chung/riêng.
   * Tạo hợp đồng/hóa đơn/thanh toán.
   * Tất toán/xóa mềm/thêm lại cùng mã.
4. **Add API integration tests** using isolated test database and seeded multi-owner accounts for IDOR/authorization.
5. **Add load test** with k6/Artillery for dashboard, rooms, invoices, reports.
6. **Add DAST/security smoke** for SQL injection, XSS, upload attack, fake/expired token, path traversal.
7. **Split frontend bundle** before production if first-load performance matters.
8. **Standardize test data cleanup** so destructive CRUD tests can run repeatedly without corrupting local/prod-like data.
