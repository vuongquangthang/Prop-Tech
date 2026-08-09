---
noteId: "fcc98330940811f1b68ce98536b44eef"
tags: []

---

# Báo cáo kiểm thử app mobile cư dân & quản lý

Ngày kiểm thử: 07/08/2026  
Phạm vi: `mobile` React Native / Expo app  
Kiểu kiểm thử đã thực hiện: static flow review, TypeScript validation, Expo bundle smoke test, API/service contract review.

## 1. Kết quả validation kỹ thuật

| Hạng mục | Lệnh / Phương pháp | Kết quả |
|---|---|---|
| TypeScript compile | `npm exec tsc -- --noEmit` tại `mobile` | PASS |
| Expo web bundle smoke | `npm exec expo -- export --platform web --output-dir dist-test` | PASS |
| Navigation registry | Rà `RootNavigator`, `MainTabs`, `AdminTabs` | PASS |
| Auth store/token flow | Rà `authStore`, `api.service` | PASS có rủi ro |
| Resident permission | Rà `residentPermissions` | PASS |
| Admin permission split | Rà `roleUtils`, `RootNavigator` | PASS |

Ghi chú: chưa chạy được kiểm thử tương tác trên thiết bị thật/emulator trong phiên này, nên các kết luận UI runtime như keyboard overlap, camera permission, deep link mở app thật cần retest thủ công.

## 2. Ma trận luồng kiểm thử

| ID | App | Feature | Main flow | Kết quả |
|---|---|---|---|---|
| MOB-AUTH-01 | Cư dân/Quản lý | Đăng nhập | Nhập TK/MK đúng, nhận token, điều hướng theo role | PASS static |
| MOB-AUTH-02 | Cư dân/Quản lý | Force đổi mật khẩu | User `mustChangePassword` đi vào `ForceChangePassword` | PASS static |
| MOB-AUTH-03 | Cư dân/Quản lý | Refresh token | 401 gọi refresh, retry request cũ | PASS có rủi ro |
| MOB-AUTH-04 | Cư dân/Quản lý | Quên mật khẩu | Vào màn quên mật khẩu | FAIL functional gap |
| RES-CONTRACT-01 | Cư dân | Chọn hợp đồng | Load `/api/HopDong/my`, hiển thị danh sách hợp đồng | PASS static |
| RES-CONTRACT-02 | Cư dân | Persist hợp đồng đang chọn | Lưu `active_contract_id` vào secure storage | PASS static |
| RES-HOME-01 | Cư dân | Trang chủ theo hợp đồng | Load phòng/hóa đơn/thông báo theo hợp đồng active | PASS có rủi ro |
| RES-BILL-01 | Cư dân | Danh sách hóa đơn | Lọc hóa đơn đã gửi, bỏ nháp/bị từ chối | PASS static |
| RES-BILL-02 | Cư dân | Chi tiết hóa đơn | Xem line items, trạng thái, QR | PASS static |
| RES-BILL-03 | Cư dân | Thanh toán | Chỉ chủ phòng/người thuê chính được thanh toán | PASS static |
| RES-ISSUE-01 | Cư dân | Danh sách sự cố | Lọc theo hợp đồng/phòng/status | PASS static |
| RES-ISSUE-02 | Cư dân | Gửi sự cố | Chọn phòng, loại, mô tả, ảnh, submit | PASS static |
| RES-ISSUE-03 | Cư dân | Nghiệm thu | Hài lòng đóng ticket, không hài lòng chuyển sửa lại | PASS static |
| RES-NOTI-01 | Cư dân | Thông báo | Load cache trước, fetch mới, mark read | PASS có rủi ro |
| RES-NOTI-02 | Cư dân | Điều hướng thông báo | Invoice/issue/service price/contract change navigate đúng màn | PASS static |
| RES-POST-01 | Cư dân | Bài đăng tìm người ở cùng | Chỉ chủ phòng được tạo/sửa | PASS static |
| RES-POST-02 | Cư dân | Tin nhắn bài đăng | Xem pending/replied, vào hội thoại | PASS static |
| RES-ROOM-01 | Cư dân | Chi tiết phòng | Xem phòng, cư dân, tiện nghi, tài sản, công thức | PASS static |
| ADM-HOME-01 | Quản lý | Dashboard công việc | Điều hướng đến nhập chỉ số/hóa đơn/sự cố/bài đăng/tài khoản | PASS static |
| ADM-READ-01 | Quản lý | Nhập chỉ số điện/nước | Load phòng theo tháng, nhập, validate, lưu batch | PASS static |
| ADM-READ-02 | Quản lý | Lọc nhập chỉ số | Tòa/tầng/search client-side | PASS static |
| ADM-INV-01 | Quản lý | Tính hóa đơn | Gọi calculate theo tháng/năm | PASS static |
| ADM-INV-02 | Quản lý | Duyệt hóa đơn | Duyệt một hóa đơn hoặc batch | PASS static |
| ADM-INV-03 | Quản lý | Nhắc nợ | Gửi reminder hóa đơn chưa thanh toán | PASS static |
| ADM-MAINT-01 | Quản lý | Quản lý sự cố | Load/filter/search, mở modal chi tiết | PASS static |
| ADM-MAINT-02 | Quản lý | Cập nhật sự cố | Chuyển đang xử lý/chờ nghiệm thu, upload ảnh minh chứng | PASS static |
| ADM-POST-01 | Quản lý | Quản lý bài đăng | Xem/tạo/khóa/mở khóa bài đăng | PASS static |
| ADM-ACC-01 | Quản lý | Tài khoản | Xem hồ sơ và đăng xuất | PASS static |

## 3. Lỗi / rủi ro phát hiện

### BUG-001 — Quên mật khẩu chưa implement

- File: `mobile/src/screens/ForgotPasswordScreen.tsx`
- Bằng chứng: còn TODO `gọi API reset mật khẩu`.
- Mức độ: Medium.
- Ảnh hưởng: tài khoản mới/quên mật khẩu không tự phục hồi được trên app.
- Khuyến nghị: nối endpoint reset/OTP thật hoặc ẩn chức năng nếu chưa release.

### BUG-002 — Payment service có thể dùng sai API base URL sau login fallback

- File: `mobile/src/services/payment.service.ts`
- Bằng chứng: `const API_URL = API_BASE_URL` được copy tại thời điểm import.
- Mức độ: High nếu người dùng đăng nhập qua fallback IP.
- Ảnh hưởng: login thành công nhưng thanh toán gọi về base URL cũ, dễ báo network/config PayOS sai.
- Khuyến nghị: thay mọi `${API_URL}` bằng `${getApiBaseUrl()}` hoặc dùng chung `apiService`.

### BUG-003 — Notification fetch đang nuốt lỗi — ĐÃ SỬA

- File: `mobile/src/services/notification.service.ts`
- Bằng chứng: catch trả `[]` khi fetch lỗi.
- Mức độ: Medium.
- Ảnh hưởng: UI có thể hiển thị “không có thông báo” thay vì báo mất mạng/lỗi server.
- Kết quả sửa: service throw lỗi thay vì trả rỗng; `NotificationsScreen` hiển thị lỗi và nút thử lại.

### BUG-004 — ContractPicker không tự set active contract mặc định — ĐÃ SỬA

- File: `mobile/src/components/ContractPicker.tsx`
- Bằng chứng: nếu `activeContractId = null`, UI lấy `contracts[0]` để hiển thị nhưng không gọi `setActive`.
- Mức độ: Low/Medium.
- Ảnh hưởng: các màn khác phải tự fallback; có thể lệch trạng thái giữa UI picker và store.
- Kết quả sửa: sau khi load contracts, nếu chưa có active ID hoặc ID cũ không còn hợp lệ thì tự set hợp đồng đầu tiên.

### BUG-005 — Admin nhập chỉ số chỉ lưu các phòng đang nằm trong filter — ĐÃ SỬA

- File: `mobile/src/screens/admin/AdminUtilityReadingsScreen.tsx`
- Bằng chứng: `validateRows()` reduce trên `filteredRooms`.
- Mức độ: Medium.
- Ảnh hưởng: nếu quản lý nhập nhiều phòng rồi đổi filter, bấm lưu chỉ lưu tập đang thấy.
- Kết quả sửa: `validateRows()` tạo payload từ toàn bộ `rooms`, không phụ thuộc filter đang hiển thị.

### BUG-006 — Admin invoice copy chưa đồng bộ flow mới — ĐÃ SỬA

- File: `mobile/src/screens/admin/AdminInvoicesScreen.tsx`
- Bằng chứng: UI vẫn dùng “Tính nháp”, tab “Nháp”.
- Mức độ: Low/Medium.
- Ảnh hưởng: lệch với flow web đã đổi sang “Tính hóa đơn” và bỏ nháp khỏi trạng thái xem.
- Kết quả sửa: UI đổi sang “Tính hóa đơn”, “Chờ gửi”, “Gửi hóa đơn”; modal kết quả hiển thị số hóa đơn tạo, mã phòng, số tiền, nút xem chi tiết và nút gửi hóa đơn.

### BUG-007 — Dọn artifact `mobile/dist-test` chưa thành công do lỗi shell

- File/thư mục: `mobile/dist-test`
- Bằng chứng: Expo export tạo thư mục; PowerShell spawn lỗi `CreateProcessAsUserW failed: 1312` khi xóa.
- Mức độ: Low.
- Khuyến nghị: xóa thủ công `mobile/dist-test` hoặc chạy lại lệnh dọn khi shell ổn định.

## 4. Test cases chi tiết cần chạy trên thiết bị thật

### Cư dân

| ID | Scenario | Input | Expected |
|---|---|---|---|
| RES-E2E-01 | Login cư dân thường | TK/MK hợp lệ | Vào `MainTabs`, không thấy app quản lý |
| RES-E2E-02 | Login user phải đổi mật khẩu | User `mustChangePassword=true` | Vào màn đổi mật khẩu, không vào app chính |
| RES-E2E-03 | Chọn hợp đồng A/B/C | Cư dân có >=3 hợp đồng active | Picker hiện đủ, chọn từng hợp đồng thì hóa đơn/sự cố/phòng đổi theo |
| RES-E2E-04 | Hóa đơn chủ phòng | Chủ phòng mở hóa đơn chưa thanh toán | Có nút thanh toán/QR |
| RES-E2E-05 | Hóa đơn người ở cùng | Người ở cùng mở hóa đơn | Không cho thanh toán |
| RES-E2E-06 | Gửi sự cố có ảnh | Chọn loại, mô tả, 1-4 ảnh | Ticket tạo đúng phòng đang chọn |
| RES-E2E-07 | Keyboard báo sự cố | Focus textarea dài | Textbox không bị che, footer ẩn khi keyboard mở |
| RES-E2E-08 | Nghiệm thu hài lòng | Ticket chờ nghiệm thu | Chuyển hoàn thành/đã đóng |
| RES-E2E-09 | Nghiệm thu không hài lòng | Ticket chờ nghiệm thu | Chuyển “Sửa lại” |
| RES-E2E-10 | Notification invoice phòng B khi đang chọn A | Tap notification | App set active contract B trước khi mở màn |
| RES-E2E-11 | Notification service price | Tap thông báo đổi giá | Mở màn chi tiết thay đổi |
| RES-E2E-12 | Tạo bài tìm người ở cùng | Chủ phòng | Tạo bài thành công/chờ duyệt |
| RES-E2E-13 | Tạo bài bởi người ở cùng | Người không phải chủ phòng | Bị chặn quyền |
| RES-E2E-14 | Tin nhắn bài đăng | Có pending/replied | Load nhanh, back quay về tin nhắn |

### Quản lý

| ID | Scenario | Input | Expected |
|---|---|---|---|
| ADM-E2E-01 | Login quản lý | Role `Admin/QuanLy/NhanVien/KeToan` | Vào `AdminTabs` |
| ADM-E2E-02 | Nhập chỉ số hợp lệ | Điện/nước mới >= cũ | Lưu batch thành công |
| ADM-E2E-03 | Nhập chỉ số nhỏ hơn cũ | Điện/nước mới < cũ | Chặn lưu, báo phòng lỗi |
| ADM-E2E-04 | Lọc tòa/tầng nhập chỉ số | Chọn tòa/tầng | Danh sách lọc đúng, dropdown không che input |
| ADM-E2E-05 | Tính hóa đơn | Tháng đã có chỉ số | Tạo hóa đơn và hiển thị kết quả |
| ADM-E2E-06 | Duyệt một hóa đơn | Hóa đơn nháp | Gửi cho cư dân, app cư dân nhận thông báo |
| ADM-E2E-07 | Duyệt hàng loạt | N hóa đơn nháp | Kết quả success/failed rõ ràng |
| ADM-E2E-08 | Gửi nhắc nợ | Hóa đơn chưa thanh toán | Cư dân nhận notification |
| ADM-E2E-09 | Xử lý sự cố | Chờ xử lý -> Đang xử lý | Trạng thái cập nhật |
| ADM-E2E-10 | Gửi nghiệm thu có ảnh | Đang xử lý + ảnh minh chứng | Cư dân thấy ticket chờ nghiệm thu đủ ảnh |
| ADM-E2E-11 | Quản lý bài đăng | Tạo/khóa/mở khóa | Web/app đồng bộ trạng thái |
| ADM-E2E-12 | Đăng xuất quản lý | Tap logout | Xóa token, về login |

## 5. Kết luận release readiness

- Build/typecheck: đạt.
- Luồng navigation, role split, permission chủ phòng: đạt ở mức static review.
- Chưa đủ điều kiện “release production” nếu chưa test thiết bị thật với backend deploy.
- Cần ưu tiên xử lý: `BUG-002`, `BUG-004`, `BUG-005`, sau đó chạy E2E thủ công trên ít nhất 2 tài khoản cư dân và 1 tài khoản quản lý.

## 6. Kết quả thực thi E2E với backend và DB deploy

Ngày thực thi: 07/08/2026  
Backend: `http://localhost:5052`, tiến trình `backend.exe`, kết nối DB deploy theo cấu hình runtime.  
Dữ liệu: tenant QA cô lập gồm 1 admin, 2 cư dân, 1 tòa, 1 tầng, 3 phòng, 3 hợp đồng active, 3 dịch vụ, 3 hóa đơn và 1 sự cố. Không đọc hoặc sửa dữ liệu tenant thật.

### Cư dân

| ID | Kết quả | Bằng chứng thực thi |
|---|---|---|
| RES-E2E-01 | PASS | Login cư dân trả role `CuDan`, `mustChangePassword=false`; mobile typecheck PASS. |
| RES-E2E-02 | PASS | Admin reset mật khẩu làm API trả `mustChangePassword=true`; đổi mật khẩu thành công và lần login sau trả `false`. `RootNavigator` có nhánh `ForceChangePassword`. |
| RES-E2E-03 | PASS | `/api/HopDong/my` trả đủ 3/3 hợp đồng QA active cho cùng cư dân. |
| RES-E2E-04 | PASS CÓ ĐIỀU KIỆN | Chủ phòng nhìn thấy hóa đơn đã phát hành và qua được bước kiểm tra quyền thanh toán; request dừng ở cấu hình PayOS chưa có `ClientId/ApiKey/ChecksumKey`, nên chưa sinh QR thật. |
| RES-E2E-05 | PASS | Người ở cùng gọi khởi tạo thanh toán bị chặn đúng: chỉ chủ hộ/người thuê chính được thanh toán. |
| RES-E2E-06 | PASS | Tạo sự cố có 1 ảnh thành công, ticket gắn đúng phòng hợp đồng đang chọn. |
| RES-E2E-07 | CHƯA CHẠY THIẾT BỊ | Keyboard/footer là hành vi native; không có emulator/thiết bị điều khiển trong phiên. Code hiện có nhánh xử lý keyboard. |
| RES-E2E-08 | PASS | Sự cố `Chờ nghiệm thu` được cư dân xác nhận thành `Đã đóng`, có `closedAt`. |
| RES-E2E-09 | PASS | Cư dân chọn không hài lòng chuyển ticket sang `Sửa lại`; admin xử lý lại và gửi nghiệm thu lần hai thành công. |
| RES-E2E-10 | FAIL | Notification hóa đơn trong DB có `notificationType=INVOICE` nhưng `relatedId=null`, `linkUrl=null`; app không thể lấy invoice/contract B để đổi active contract trước khi điều hướng. |
| RES-E2E-11 | PASS STATIC + API | Đổi giá `QA Điện` 4.000 -> 4.500 tạo notification `SERVICE_PRICE`, `relatedId` là service ID và `linkUrl=service-price-change://detail?...`; app có route `ServicePriceChangeDetail`. |
| RES-E2E-12 | FAIL | Chủ phòng tạo bài trả lỗi LINQ: EF không dịch được `PostService.IsPrimaryResidentRole` bên trong `Any(...)`. |
| RES-E2E-13 | FAIL | Người ở cùng cũng nhận lỗi LINQ nói trên thay vì lỗi chặn quyền có kiểm soát; HTTP 400 nhưng nội dung là exception kỹ thuật. |
| RES-E2E-14 | CHƯA CHẠY THIẾT BỊ | Cần hai app session và thao tác back native để đo tốc độ/preserve back-stack. |

### Quản lý

| ID | Kết quả | Bằng chứng thực thi |
|---|---|---|
| ADM-E2E-01 | PASS | Login tài khoản QA trả role `Admin`, không bắt đổi mật khẩu. |
| ADM-E2E-02 | PASS | Batch chỉ số tháng 08/2026 lưu thành công 3/3 phòng; GET theo tháng trả đủ 3 phòng QA. |
| ADM-E2E-03 | PASS | Gửi chỉ số điện/nước thấp hơn chỉ số đã chốt trả `failed/errors`, không ghi đè dữ liệu hợp lệ. |
| ADM-E2E-04 | PASS API / CHƯA CHẠY UI | Dataset có đầy đủ `buildingId`, `floorId`; filter client-side đã được typecheck. Dropdown che input cần thiết bị thật. |
| ADM-E2E-05 | PASS | Tính hóa đơn tháng 08/2026 tạo đủ 3 hóa đơn trạng thái `Nháp`. |
| ADM-E2E-06 | PASS | Duyệt một hóa đơn chuyển sang `Chưa thanh toán`; hóa đơn xuất hiện trong `/api/HoaDon/my` của cư dân và tạo notification. |
| ADM-E2E-07 | PASS | Duyệt batch 2 hóa đơn còn lại thành công; cả 3 hóa đơn đều `Chưa thanh toán`. |
| ADM-E2E-08 | PASS | Gửi nhắc nợ tạo notification `Nhắc nợ hóa đơn phòng QA-0807-A` cho cư dân. |
| ADM-E2E-09 | PASS | Ticket chuyển `Chờ xử lý -> Đang xử lý` thành công. |
| ADM-E2E-10 | PASS | Admin gửi `Chờ nghiệm thu` kèm ảnh hoàn thành; cư dân đọc được trạng thái và ảnh trước khi nghiệm thu. |
| ADM-E2E-11 | PASS | Admin tạo bài QA thành công, khóa trả `isLocked=true`, mở khóa trả `false`. |
| ADM-E2E-12 | PASS STATIC | `authStore.logout` xóa access/refresh token và navigation quay về auth stack; không cần phá session API để xác minh logic store. |

### Tổng hợp

- PASS hoặc PASS có điều kiện: 20/26.
- FAIL chức năng: 3/26 (`RES-E2E-10`, `RES-E2E-12`, `RES-E2E-13`).
- Chưa thể chạy native runtime: 3/26 (`RES-E2E-07`, `RES-E2E-14`, phần UI của `ADM-E2E-04`).
- TypeScript mobile sau kiểm thử: PASS với `npm exec tsc -- --noEmit`.
- Backend deploy phản hồi chậm: nhiều request đơn mất khoảng 3-5 giây; nên profile DB/network trước release mobile.

## 7. Lỗi mới phát hiện khi chạy E2E

### BUG-008 — Notification hóa đơn thiếu ID liên kết — ĐÃ SỬA

- File gốc: `backend/Services/HoaDonService.cs`, hàm `NotifyResidentAsync`.
- Hiện trạng: SignalR payload có `invoiceId`, nhưng bản ghi DB gọi `SendToUserAsync(..., "INVOICE")` mà không truyền `relatedId`/`linkUrl`.
- Ảnh hưởng: sau khi mở lại app hoặc đọc danh sách notification từ DB, tap thông báo không thể mở đúng hóa đơn và không thể đổi hợp đồng A -> B.
- Kết quả sửa: notification hóa đơn mới truyền `invoice.Id` làm `relatedId` và `invoice://detail?invoiceId={id}` làm `linkUrl`; app có thể tải hóa đơn, đổi active contract rồi mở đúng chi tiết.
- Regression: đã chạy flow chỉ số → tính → duyệt hóa đơn mới và xác nhận DB trả đúng `relatedId/linkUrl`; mobile chuẩn hóa cả payload DB/realtime. Notification cũ thiếu ID được đối chiếu theo kỳ, tổng tiền và thời điểm duyệt để tìm hóa đơn trước khi đổi active contract.

### BUG-009 — Kiểm tra chủ phòng trong PostService không dịch được sang SQL

- File gốc: `backend/Services/PostService.cs`, hàm `EnsureResidentPrimaryForRoomAsync`.
- Hiện trạng: query gọi helper C# `IsPrimaryResidentRole(...)` bên trong LINQ `Any`, PostgreSQL provider không dịch được.
- Ảnh hưởng: cả chủ phòng và người ở cùng đều không tạo được bài; người dùng nhận exception kỹ thuật thay vì kết quả quyền đúng.
- Khuyến nghị: thay helper trong expression bằng so sánh role trực tiếp có thể dịch SQL, hoặc materialize tập role tối thiểu trước khi kiểm tra; thêm integration test cho chủ phòng và người ở cùng.
