# Hướng dẫn Setup SePay cho Prop-Tech (trước khi code thanh toán)

> Làm theo file này để lấy key + tạo tài khoản mẫu. Sau khi có đủ, báo lại để bắt đầu
> code payment service theo mô hình **multi-owner** (mỗi chủ nhà 1 tài khoản nhận tiền).
> Xem kiến trúc chi tiết: [KE_HOACH_THANH_TOAN_SEPAY.md](KE_HOACH_THANH_TOAN_SEPAY.md) mục 0 và 3b.

---

## A. Tổng quan cần chuẩn bị

Theo hướng multi-owner (mỗi Owner có tài khoản ngân hàng riêng), để **demo đồ án** cần:

1. **1 tài khoản SePay** (của nhóm/admin) — SePay cho phép 1 tài khoản quản lý **nhiều
   tài khoản ngân hàng** + **nhiều webhook**, nên không cần mỗi chủ nhà 1 tài khoản SePay.
2. **2-3 tài khoản ngân hàng mẫu** (đại diện 2-3 chủ nhà) — liên kết vào SePay.
3. **1 API token** + **1 webhook** trỏ về backend Prop-Tech.

> Với đồ án, các "chủ nhà" là tài khoản ngân hàng bạn có thể mượn/tạo (vd TK của bạn +
> TK người thân). Không cần 100 tài khoản thật — chỉ cần **2-3 để chứng minh flow**.

---

## B. Các bước lấy key (làm tuần tự)

### Bước 1 — Đăng ký tài khoản SePay
1. Vào https://sepay.vn → đăng ký (email, không cần hồ sơ doanh nghiệp cho gói cơ bản).
2. Đăng nhập vào Dashboard.

### Bước 2 — Liên kết 2-3 tài khoản ngân hàng (đại diện các chủ nhà)
1. Dashboard → **Ngân hàng** / **Tài khoản ngân hàng** → **Thêm tài khoản**.
2. Chọn ngân hàng (SePay hỗ trợ MB, ACB, VPBank, OCB, BIDV, TPBank, VietinBank...).
3. Làm theo hướng dẫn liên kết của SePay cho ngân hàng đó.
4. **Lặp lại cho 2-3 tài khoản** (mỗi tài khoản = 1 "chủ nhà" trong demo).
5. Với MỖI tài khoản, ghi lại: **số TK, tên ngân hàng, mã BIN, tên chủ TK**.

> Bảng ghi (điền vào để lát seed vào DB `payment_accounts`):
>
> | Chủ nhà (Owner) | Ngân hàng | BIN | Số TK | Tên chủ TK |
> |---|---|---|---|---|
> | Owner A (owner_user_id=?) | MBBank | 970422 | ... | ... |
> | Owner B (owner_user_id=?) | ... | ... | ... | ... |

### Bước 3 — Tạo API Token
1. Dashboard → **Cấu hình** / **API Access Tokens** → **Tạo token**.
2. Copy token → đây là `SEPAY_API_TOKEN`.

### Bước 4 — Tạo Webhook
1. Dashboard → **Webhooks** → **Thêm Webhook**.
2. **URL:** `https://<domain-backend>/api/PaymentGateway/sepay-webhook`
   - Dev local: backend chạy `localhost` → SePay KHÔNG gọi vào được. Cần **tunnel**:
     dùng **ngrok** (`ngrok http 5052`) hoặc **cloudflared** → lấy URL public
     (vd `https://abc123.ngrok.io`) → điền vào webhook.
3. **Xác thực:** chọn **API Key** → tự đặt 1 chuỗi bí mật → đây là `SEPAY_WEBHOOK_API_KEY`.
4. **Sự kiện:** chọn **Có giao dịch tiền vào** (money in).
5. Cấu hình webhook áp dụng cho **tất cả tài khoản** đã liên kết (để mọi chủ nhà đều báo về).

---

## C. Các KEY cần điền (vào `Prop-Tech/backend/.env`)

```env
# ===== SePay (thanh toan multi-owner) =====
SEPAY_API_TOKEN=<token o Buoc 3>
SEPAY_WEBHOOK_API_KEY=<chuoi bi mat tu dat o Buoc 4>
SEPAY_TRANSFER_PREFIX=HD          # noi dung CK: HD{maHoaDon}, vd HD1001
# (KHONG can BANK_ACCOUNT o day nua - moi Owner co TK rieng trong bang payment_accounts)
```

| Key | Là gì | Bắt buộc |
|---|---|---|
| `SEPAY_API_TOKEN` | Gọi API SePay (tra cứu giao dịch nếu cần) | ✅ |
| `SEPAY_WEBHOOK_API_KEY` | Xác thực webhook SePay gửi về (chống giả mạo) | ✅ |
| `SEPAY_TRANSFER_PREFIX` | Tiền tố nội dung CK để nhận diện hóa đơn Prop-Tech | ✅ |

> **Không** để các key này ở frontend. Chỉ backend dùng.

---

## D. Dữ liệu mẫu cần chuẩn bị (để seed `payment_accounts`)

Sau khi có 2-3 TK ngân hàng, cần map mỗi TK với 1 **Owner** (chủ nhà) trong hệ thống.

1. Xác định `owner_user_id` của các chủ nhà mẫu (query bảng USER role chủ nhà, hoặc
   `Building.OwnerUserId`).
2. Chuẩn bị dữ liệu như bảng ở Bước 2.

→ Khi code, tôi sẽ tạo migration bảng `payment_accounts` + seed 2-3 dòng này, HOẶC làm
màn "Owner kết nối tài khoản" để chủ nhà tự nhập.

---

## E. Checklist trước khi báo "sẵn sàng code thanh toán"

- [ ] Có tài khoản SePay, đăng nhập được Dashboard.
- [ ] Liên kết **2-3 tài khoản ngân hàng** mẫu → có đủ (số TK, BIN, tên NH, tên chủ TK).
- [ ] Có `SEPAY_API_TOKEN`.
- [ ] Tạo webhook + có `SEPAY_WEBHOOK_API_KEY`.
- [ ] (Dev) Cài **ngrok**/cloudflared để SePay gọi webhook vào máy.
- [ ] Biết `owner_user_id` của 2-3 chủ nhà mẫu để map với TK.

---

## F. Lưu ý quan trọng

- **Webhook cần URL public:** local phải tunnel (ngrok). Khi bảo vệ đồ án, hoặc deploy
  backend có domain, hoặc bật ngrok trước khi demo.
- **Đối soát theo nội dung CK:** cư dân PHẢI giữ nguyên nội dung `HD{id}` khi chuyển khoản.
  QR sinh sẵn nội dung này nên quét QR là đúng; chỉ lỗi nếu gõ tay sai.
- **Xác thực webhook bắt buộc:** không có `SEPAY_WEBHOOK_API_KEY` thì kẻ xấu giả webhook
  để đánh dấu hóa đơn đã trả. Backend sẽ kiểm tra header khớp key này.
- **Số tiền:** webhook báo `transferAmount` → backend đối chiếu với `HoaDon.TotalAmount`,
  lệch thì không tự Paid (hoặc đánh dấu "thanh toán một phần").
- **Demo không tiền thật:** vẫn có thể mock webhook (tự gọi endpoint với payload giả +
  đúng key) để trình diễn flow mà không cần chuyển tiền. Cấu trúc code multi-owner giữ nguyên.
