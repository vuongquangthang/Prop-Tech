---
noteId: "e79b7450940811f1b68ce98536b44eef"
tags: []

---

# Kế hoạch tích hợp thanh toán SePay cho Prop-Tech

> Mục tiêu: Sửa lỗi "cư dân ấn Thanh toán thì báo lỗi" và chuyển cổng thanh toán
> sang **SePay** (QR chuyển khoản ngân hàng + webhook tự động xác nhận).

---

## 0. QUYẾT ĐỊNH KIẾN TRÚC CHÍNH THỨC — Multi-Owner (thầy Đức Smile)

> **Mỗi Owner (chủ nhà) có PaymentAccount RIÊNG. Tiền cư dân đi THẲNG vào TK của
> chính Owner đó. Webhook SePay phân biệt theo (tài khoản nhận + mã hóa đơn).**

Đây là hướng thay thế các phương án bàn trước (dùng chung 1 TK trung tâm). Lý do: thiết kế
đúng chuẩn triển khai thật, mở rộng được cho 10-100 chủ nhà, admin KHÔNG phải vào SePay
setup thủ công từng người.

### Nguyên tắc

1. **DB có bảng `PaymentAccount` gắn với Owner** (Owner A → BankAccount A, Owner B →
   BankAccount B). Mỗi Owner có bước **tự kết nối tài khoản ngân hàng** của mình; hệ thống
   lưu thông tin TK + ID tài khoản SePay tương ứng.
2. **Tạo hóa đơn:** QR chứa **TK của đúng Owner** + số tiền + **mã hóa đơn duy nhất** (vd
   `HD1001`). Cư dân chuyển tiền → **đi thẳng vào TK Owner**, không qua trung gian.
3. **Webhook SePay:** dựa vào **tài khoản nhận tiền** (→ ra Owner) + **mã HD trong nội dung
   CK** (→ ra hóa đơn) + **khớp số tiền** → nếu đúng thì chuyển hóa đơn sang **Paid**.
4. **SePay hỗ trợ nhiều tài khoản + webhook cho nhiều tài khoản** → tận dụng, KHÔNG
   hardcode webhook/code riêng cho từng owner.
5. **Payment service tách khỏi nghiệp vụ** → sau này thay cơ chế kết nối thật (OAuth ngân
   hàng / API SePay liên kết TK) vào mà **không phải sửa logic hóa đơn/thanh toán**.

### Phạm vi đồ án

- Làm **2-3 tài khoản mẫu** (2-3 Owner có PaymentAccount) để **chứng minh flow**:
  Owner A tạo HD → QR TK Owner A → cư dân trả → webhook → đúng Owner A + đúng HD → Paid.
- Cơ chế "Owner tự kết nối ngân hàng": đồ án có thể để Owner **nhập thủ công thông tin TK
  + token SePay của họ** (form kết nối), thật sự gọi API sau. Quan trọng là **DB + service
  đã theo mô hình multi-owner**, không phải sửa nghiệp vụ khi nâng cấp.

### So sánh với hướng cũ (đã bỏ)

| | Hướng cũ (1 TK trung tâm) | **Hướng thầy (multi-owner)** |
|---|---|---|
| TK nhận tiền | 1 TK của người làm đồ án | TK RIÊNG của từng Owner |
| Tiền vào túi ai | Trung gian, phải chuyển lại | **Thẳng túi Owner** |
| Phân biệt owner | Qua Building.OwnerUserId + mã HD | Qua **TK nhận** + mã HD |
| Mở rộng | Kém (lẫn dòng tiền) | **Tốt (10-100 owner)** |
| Đúng triển khai thật | Không | **Có** |

---

## 0b. Ghi chú kỹ thuật (mock/webhook — vẫn áp dụng cho demo)

Khi demo vẫn có thể dùng **mock** để không cần chuyển tiền thật, nhưng cấu trúc dữ liệu +
service phải theo mô hình multi-owner ở mục 0. Giải thích nhanh:

> **Thể hiện đúng LUỒNG nghiệp vụ Pending → Paid bằng QR có mã giao dịch + webhook,
> KHÔNG đứng ra giữ tiền / làm trung gian thanh toán thật.**

### Nguyên tắc cốt lõi

1. **Trạng thái thanh toán ≠ dòng tiền thật.** Đồ án chứng minh *cơ chế* (sinh QR định
   danh → nhận webhook → đối soát đúng hóa đơn → cập nhật realtime), không chứng minh
   việc vận hành giữ/chuyển tiền.
2. **Dùng 1 TK ngân hàng duy nhất của người làm đồ án** (đã có `SEPAY_API_KEY` sẵn) để
   luồng QR + webhook chạy đúng logic thật. Mọi cư dân (mọi tòa) chuyển vào TK này.
3. **Phân biệt hóa đơn bằng nội dung CK** `PROPTECH{mã giao dịch}`. Từ mã → tra ra
   `HoaDon → HopDong → Room → Building → OwnerUserId` (đã có sẵn) → biết chủ nhà nào →
   cập nhật đúng dashboard chủ nhà đó.
4. **Chủ nhà KHÔNG cần setup gì, KHÔNG cần liên kết SePay, KHÔNG cần nhập STK.**
5. **Việc chuyển tiền lại từ người làm đồ án về chủ nhà = thao tác tay ngoài hệ thống,
   KHÔNG code, KHÔNG thuộc phạm vi đồ án.** Dashboard chỉ *hiển thị* "chủ nhà A nhận
   được X đ từ hóa đơn Y".

### Hai chế độ chạy trên cùng 1 codebase (đổi config, không đổi logic)

| Chế độ | Khi dùng | Cách "tiền vào" được xác nhận |
|---|---|---|
| **Mock** | Demo nhanh / bảo vệ đồ án | Cư dân bấm "Tôi đã chuyển khoản" → backend tự bắn webhook nội bộ → Paid |
| **SePay thật** | Muốn demo ấn tượng bằng tiền thật | Chuyển thật (vài nghìn đồng) vào TK của mình, nội dung `PROPTECH{mã}` → SePay webhook thật → Paid |

Cả hai đi qua **cùng 1 endpoint** `/api/Payment/sepay-webhook` và **cùng 1 hàm**
`ProcessPaymentCallbackAsync`. → Lên production chỉ đổi provider, không viết lại logic.

### Giải thích nhanh 3 khái niệm (cho báo cáo)

- **Webhook** = "tin báo tự động" dịch vụ gửi đến backend khi có sự kiện (tiền vào TK).
  Đây là thứ khiến hóa đơn *tự* chuyển trạng thái, không cần bấm tay.
- **Sandbox** = môi trường thử của nhà cung cấp, chạy như thật nhưng tiền giả. (SePay ít
  hỗ trợ sandbox vì đọc TK ngân hàng thật → đồ án dùng **mock** thay thế.)
- **Mock** = mình tự dựng "ngân hàng giả": backend tự tạo ra webhook khi cư dân bấm nút.
  Luôn chạy được, không phụ thuộc mạng/nhà cung cấp → lý tưởng để demo.

### Việc KHÔNG làm (ghi vào "Hướng phát triển" của báo cáo)

- Không liên kết ngân hàng thật cho từng chủ nhà.
- Không đăng ký trung gian thanh toán / không giữ tiền người dùng.
- Không tự động chi trả (payout) về chủ nhà.
- → Khi triển khai thật: thay provider Mock bằng SePay/PayOS production + mỗi chủ nhà
  liên kết ngân hàng riêng **hoặc** đăng ký giấy phép trung gian thanh toán.

---

## 1. Nguyên nhân lỗi hiện tại (đã xác định trong code)

Khi cư dân ấn **"Thanh toán ngay"**, luồng chạy như sau:

```
BillDetailScreen.handlePayment()                       [mobile]
  └─> paymentService.initiatePayment()                 POST /api/Payment/initiate
        └─> PaymentController.InitiatePayment()          [backend]
              └─> PaymentService.InitiatePaymentAsync()
                    └─> PayOSService.CreatePaymentLinkAsync()
                          └─> gọi PayOS API  ❌ LỖI Ở ĐÂY
```

**Nguyên nhân gốc:** File cấu hình `appsettings.json` và `appsettings.Development.json`
có `PayOS` với **credentials rỗng**:

```json
"PayOS": {
  "ClientId": "",      // rỗng
  "ApiKey": "",        // rỗng
  "ChecksumKey": "",   // rỗng
  "IsTestMode": true
}
```

→ `PayOSClient` được khởi tạo với chuỗi rỗng → khi gọi `PaymentRequests.CreateAsync`
PayOS trả về **401 Unauthorized** → `PaymentService` ném exception →
`PaymentController` trả **500** → mobile hiện Alert **"Không thể khởi tạo thanh toán"**.

**Kết luận:** Không phải lỗi logic code, mà là **chưa cấu hình cổng thanh toán**.
Ta sẽ thay PayOS bằng SePay (phù hợp hơn — xem mục 2).

---

## 2. Vì sao chọn SePay & so sánh với PayOS

| Tiêu chí | PayOS (hiện tại) | **SePay (đề xuất)** |
|---|---|---|
| Cơ chế | Cổng thanh toán, tạo link/QR động | **Đối soát chuyển khoản** qua QR VietQR tĩnh/động + webhook |
| Đăng ký | Cần hồ sơ merchant | Chỉ cần **liên kết tài khoản ngân hàng** của bạn |
| Chi phí | Có phí giao dịch | Có gói **miễn phí** cho cá nhân/dev |
| QR | PayOS tự sinh | VietQR chuẩn (app đã có sẵn `VietQRService`) |
| Xác nhận tiền | Webhook PayOS | **Webhook SePay** khi có tiền vào TK |
| Phù hợp sinh viên | Trung bình | **Cao** — không cần pháp nhân, dùng TK cá nhân |

**Điểm mấu chốt:** SePay hoạt động theo mô hình *"tạo QR chuyển khoản → người dùng
chuyển tiền → ngân hàng báo có → SePay gọi webhook về backend → backend đánh dấu
hóa đơn đã thanh toán"*. Mô hình này **khớp gần như hoàn toàn** với luồng hiện có
(`ThanhToan` PENDING → webhook → SUCCESS → cập nhật `HoaDon`), nên **thay đổi tối thiểu**.

---

## 2b. QUYẾT ĐỊNH KIẾN TRÚC (đã chốt)

> **Chọn Phương án B — tài khoản ngân hàng RIÊNG cho Prop-Tech.**

Lý do & bối cảnh:
- Key SePay hiện tại trong `backend/.env` (`SEPAY_API_KEY`, `BANK_ACCOUNT_NUMBER=0862500016`,
  prefix `SEVQR-SMILE XIN CAM ON`...) **đang được dùng cho web Smile AI**.
- TK `0862500016` **đã trỏ webhook SePay về Smile AI** → nếu dùng chung, Prop-Tech
  không nhận được webhook, hóa đơn không tự cập nhật.
- → Prop-Tech dùng **1 tài khoản ngân hàng khác**, liên kết vào SePay, **webhook riêng**
  trỏ về `/api/Payment/sepay-webhook`. Dòng tiền tách bạch, đối soát sạch.

**Hệ quả cho việc lấy key (mục 3):** KHÔNG tái sử dụng các key Smile trong `.env`.
Cần bộ thông tin RIÊNG cho TK ngân hàng mới của Prop-Tech.

### ⚠️ Trả lời câu hỏi "đổi mỗi prefix có đủ để SePay lọc hóa đơn không?"

**KHÔNG.** Vì:
1. SePay **không hiểu khái niệm hóa đơn** — nó chỉ báo "có tiền vào TK" kèm nội dung CK.
   Việc "tiền thuộc hóa đơn nào" là **backend tự phân giải** theo nội dung CK.
2. Prefix của Smile là **cố định** (`SEVQR-SMILE XIN CAM ON`) → không phân biệt được
   từng đơn. Prop-Tech phải dùng **prefix + mã giao dịch duy nhất**: `PROPTECH{transactionCode}`.
3. Backend phải **lọc 2 tầng**: (a) nội dung CK có prefix `PROPTECH` không → (b) tách mã
   → tìm `ThanhToan` PENDING khớp mã + khớp số tiền.

→ Đổi prefix chỉ là 1 phần. Cái đủ = **prefix riêng + mã CK duy nhất + logic lọc webhook + xác thực webhook**.

---

## 3. Các KEY / thông tin cần lấy từ SePay

Đăng ký tại **https://sepay.vn** rồi lấy các thông tin sau. Điền vào
`appsettings.json` (section mới `"SePay"`) — **không commit key lên git**.

| Key | Là gì | Cách lấy | Bắt buộc? |
|---|---|---|---|
| `SePay:ApiToken` | API Token để backend gọi API SePay (nếu cần tra cứu giao dịch) | SePay Dashboard → **Cấu hình** → **API Access Token** → tạo token | Khuyến nghị |
| `SePay:WebhookApiKey` | Khóa bí mật để **xác thực webhook** SePay gửi về (chống giả mạo) | Tự đặt 1 chuỗi bí mật khi tạo Webhook trong SePay, backend so khớp header `Authorization` | **Bắt buộc** |
| `SePay:BankAccount` | Số tài khoản ngân hàng nhận tiền | Số TK bạn liên kết vào SePay | **Bắt buộc** |
| `SePay:BankName` / `SePay:BankBin` | Tên & mã BIN ngân hàng (để sinh QR VietQR) | Theo ngân hàng bạn dùng (VD: MBBank BIN=970422, Vietcombank=970436...) | **Bắt buộc** |
| `SePay:AccountHolder` | Tên chủ tài khoản (in trên QR) | Tên bạn đăng ký TK ngân hàng | **Bắt buộc** |

### Các bước lấy key (chi tiết)

1. **Đăng ký** tài khoản tại https://sepay.vn (dùng email, không cần hồ sơ doanh nghiệp
   cho gói cơ bản).
2. **Liên kết ngân hàng:** Dashboard → **Ngân hàng** → thêm tài khoản ngân hàng của bạn
   (SePay hỗ trợ nhiều bank: MB, ACB, VietinBank, BIDV, OCB, VPBank...). Làm theo hướng
   dẫn liên kết (thường qua Internet Banking/API bank).
   → Lấy được: **số TK, tên ngân hàng, BIN, tên chủ TK**.
3. **Tạo API Token:** Dashboard → **Cấu hình công ty** / **API** → **API Access Tokens**
   → tạo mới → copy token → điền `SePay:ApiToken`.
4. **Tạo Webhook:** Dashboard → **Webhooks** → **Thêm Webhook**:
   - URL: `https://<domain-backend>/api/Payment/sepay-webhook`
     (khi dev local cần tunnel như ngrok/cloudflared vì SePay phải gọi được vào máy bạn).
   - Kiểu xác thực: **API Key** → tự đặt 1 chuỗi bí mật → điền `SePay:WebhookApiKey`.
   - Sự kiện: **Có giao dịch tiền vào** (money in).
5. Điền tất cả vào `appsettings.json` (mục 5 bên dưới).

> **Lưu ý QUAN TRỌNG về đối soát:** SePay nhận diện hóa đơn nào được thanh toán dựa vào
> **nội dung chuyển khoản** (memo). Ta phải sinh QR với nội dung chứa **mã giao dịch
> duy nhất** (VD: `PROPTECH{transactionCode}`), và khi webhook báo tiền vào, backend
> đọc nội dung CK để tìm đúng `ThanhToan` PENDING. Đây là thay đổi logic chính.

---

## 3b. Thiết kế Database & Service theo Multi-Owner (CỐT LÕI theo hướng thầy)

### Bảng mới: `PaymentAccount` (TK ngân hàng của Owner)

```sql
CREATE TABLE payment_accounts (
    id                 SERIAL PRIMARY KEY,
    owner_user_id      INT NOT NULL,              -- FK -> USER (chủ nhà), map với Building.OwnerUserId
    bank_bin           VARCHAR(20)  NOT NULL,     -- mã ngân hàng (VietQR BIN)
    bank_account_no    VARCHAR(50)  NOT NULL,     -- số tài khoản nhận tiền
    account_holder     VARCHAR(255) NOT NULL,     -- tên chủ TK
    sepay_account_id   VARCHAR(100),              -- ID tài khoản trong SePay (khi kết nối thật)
    provider           VARCHAR(30)  NOT NULL DEFAULT 'sepay',
    is_active          BOOLEAN      NOT NULL DEFAULT true,
    connected_at       TIMESTAMP,
    created_at         TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uq_payment_account_owner UNIQUE (owner_user_id)  -- mỗi owner 1 TK (giai đoạn đầu)
);
CREATE INDEX idx_payment_accounts_bank ON payment_accounts(bank_bin, bank_account_no);
```

> Khóa tra ngược webhook: khi tiền vào 1 TK, SePay báo `bank_account_no` (+ bank) → tra
> `payment_accounts` ra **owner_user_id** → biết Owner nào. Kết hợp mã HD trong nội dung CK
> ra hóa đơn. Vì vậy index theo `(bank_bin, bank_account_no)`.

### Quan hệ dữ liệu để đối soát

```
Webhook SePay báo: { bank_account_no, bank_bin, transferAmount, content = "HD1001" }
   │
   ├─ (bank_bin, bank_account_no) ─→ payment_accounts ─→ owner_user_id  (OWNER NÀO)
   │
   └─ content "HD1001" ─→ HoaDon #1001 ─→ HopDong ─→ Room ─→ Building.OwnerUserId
                                              │
                              KIỂM TRA: Building.OwnerUserId == owner_user_id (từ TK nhận)?
                              KIỂM TRA: transferAmount == HoaDon.TotalAmount?
                                              │
                                   Đúng cả → HoaDon.Status = "Đã thanh toán"
```

→ **2 lớp xác thực:** (1) TK nhận đúng của Owner sở hữu hóa đơn, (2) số tiền khớp. Chống
nhầm/giả mạo.

### Service tách theo Owner

- `IPaymentAccountService`: CRUD + "Owner kết nối TK ngân hàng" (đồ án: nhập thủ công
  số TK + BIN + tên; sau này gọi API SePay liên kết thật, lưu `sepay_account_id`).
- `SePayService.CreateQrForInvoiceAsync(hoaDonId)`:
  1. HoaDon → Building.OwnerUserId → `payment_accounts` của Owner đó.
  2. Nếu Owner **chưa kết nối TK** → báo lỗi rõ ("Chủ nhà chưa cấu hình tài khoản nhận tiền").
  3. Sinh QR VietQR trỏ **TK của Owner** + nội dung CK = `HD{hoaDonId}`.
- Webhook: parse → tra owner theo TK nhận → tra HD theo mã → verify → cập nhật.

### Frontend
- Trang **Owner "Kết nối tài khoản nhận tiền"** (nhập/chỉnh TK ngân hàng) — dành cho chủ nhà.
- Cư dân: màn thanh toán QR **không đổi** (đã có sẵn), chỉ là QR giờ trỏ TK Owner.

### Phạm vi đồ án
- Seed 2-3 `payment_accounts` mẫu cho 2-3 Owner → demo: Owner A tạo HD → QR TK A →
  (mock hoặc chuyển thật) → webhook → khớp Owner A + HD → Paid.

---

## 4. Kiến trúc & thay đổi code (kế hoạch)

Tận dụng tối đa hạ tầng sẵn có. Bảng `ThanhToan`, luồng PENDING→SUCCESS, `VietQRService`,
SignalR đều **giữ nguyên**. Thay lớp "tạo link" + "webhook" và **thêm `PaymentAccount`
theo Owner** (mục 3b).

### 4.1. Backend (.NET) — thay đổi

| # | File | Việc làm |
|---|---|---|
| 1 | `appsettings.json` (+ `.Development.json`) | Thêm section `"SePay"` với các key ở mục 3. Có thể giữ hoặc bỏ `"PayOS"`. |
| 2 | **`Services/SePayService.cs`** (mới) | Interface `ISePayService`: sinh QR VietQR (dùng `VietQRService` sẵn có) với nội dung CK = mã giao dịch; xác thực chữ ký/API key webhook; parse payload webhook SePay. |
| 3 | `Services/PaymentService.cs` | Trong `InitiatePaymentAsync`: thay `_payOSService.CreatePaymentLinkAsync(...)` bằng `_sePayService...`. Sinh `transferDescription` = `PROPTECH{orderCode}`. Trả về QR + thông tin TK ngân hàng của SePay. Bỏ gọi PayOS. |
| 4 | `Controllers/PaymentController.cs` | Thêm endpoint `POST /api/Payment/sepay-webhook` `[AllowAnonymous]`: xác thực API key header → parse giao dịch → tìm `ThanhToan` theo nội dung CK → gọi `ProcessPaymentCallbackAsync(SUCCESS)`. Bỏ/giữ `payos-webhook`. |
| 5 | `Program.cs` | Đăng ký `ISePayService`. Bỏ đăng ký `PayOSClient` nếu gỡ hẳn PayOS (hoặc giữ để fallback). |
| 6 | `DTOs/` | Thêm `SePayWebhookDto` khớp payload SePay (id, gateway, transferAmount, content, referenceCode, transactionDate...). |

### 4.2. Mobile (React Native) — thay đổi

**Gần như KHÔNG đổi.** `payment.service.ts` và `BillDetailScreen.tsx` đã:
- Gọi `POST /api/Payment/initiate` và nhận về `qrCodeUrl`, `bankAccountNumber`,
  `transferDescription`... (mô hình chuyển khoản QR) → khớp SePay.
- Có sẵn panel hiển thị QR + số TK + nội dung CK + nút "Kiểm tra".
- Đã lắng nghe SignalR `PaymentSuccess` để tự cập nhật khi webhook báo thành công.

Chỉ cần kiểm tra lại text/nhãn cho đúng ngữ cảnh "chuyển khoản QR" (không còn "cổng
thanh toán"). Không cần đổi API.

### 4.3. Luồng sau khi tích hợp SePay

```
1. Cư dân ấn "Thanh toán ngay"
2. BE tạo ThanhToan PENDING, sinh QR VietQR (TK SePay) + nội dung CK = PROPTECH{code}
3. App hiện QR + số TK + nội dung CK
4. Cư dân quét QR / chuyển khoản bằng app ngân hàng
5. Tiền vào TK → SePay phát hiện → gọi webhook POST /api/Payment/sepay-webhook
6. BE xác thực API key → khớp nội dung CK → ThanhToan = SUCCESS → HoaDon = "Đã thanh toán"
7. BE bắn SignalR PaymentSuccess → app tự cập nhật "Đã thanh toán"
```

---

## 5. Mẫu cấu hình `appsettings.json` (điền sau khi có key)

```json
"SePay": {
  "ApiToken": "<API Access Token từ SePay>",
  "WebhookApiKey": "<chuỗi bí mật tự đặt, khớp với webhook SePay>",
  "BankAccount": "<số tài khoản ngân hàng>",
  "BankName": "MBBank",
  "BankBin": "970422",
  "AccountHolder": "<TÊN CHỦ TÀI KHOẢN>",
  "TransferPrefix": "PROPTECH",
  "IsTestMode": true
}
```

---

## 6. Việc cần bạn làm (trước khi tôi code)

- [ ] Đăng ký SePay + liên kết 1 tài khoản ngân hàng.
- [ ] Lấy: **số TK, tên ngân hàng, BIN, tên chủ TK, API Token**.
- [ ] Tạo Webhook trên SePay + đặt **WebhookApiKey**.
- [ ] Nếu test local: chuẩn bị **ngrok/cloudflared** để SePay gọi webhook vào máy.
- [ ] Gửi các thông tin trên cho tôi (hoặc tự điền vào `appsettings.json`).

## 7. Việc tôi sẽ làm (sau khi có key)

- [ ] Tạo `SePayService.cs` + DTO webhook.
- [ ] Sửa `PaymentService.InitiatePaymentAsync` dùng SePay.
- [ ] Thêm endpoint `sepay-webhook` + xác thực API key.
- [ ] Đăng ký DI trong `Program.cs`, điền config.
- [ ] Rà soát nhãn UI mobile cho đúng ngữ cảnh.
- [ ] Test luồng: tạo QR → chuyển khoản thật (số tiền nhỏ) → webhook → cập nhật hóa đơn.

---

## 8. Rủi ro & lưu ý

- **Webhook cần domain public:** dev local phải tunnel (ngrok). Production cần deploy
  backend có domain HTTPS.
- **Đối soát theo nội dung CK:** nếu người dùng sửa nội dung CK khi chuyển khoản sẽ
  không khớp được → cần hướng dẫn rõ "giữ nguyên nội dung" + có nút "Kiểm tra" thủ công.
- **Bảo mật webhook:** bắt buộc xác thực `WebhookApiKey`, nếu không kẻ xấu có thể giả
  webhook để đánh dấu hóa đơn đã thanh toán.
- **Số tiền:** đối chiếu `transferAmount` từ webhook với `ThanhToan.Amount` để tránh
  thanh toán thiếu.
- **Idempotency:** `ProcessPaymentCallbackAsync` đã chặn xử lý lại giao dịch không PENDING
  (đã có sẵn) — tốt.
```
