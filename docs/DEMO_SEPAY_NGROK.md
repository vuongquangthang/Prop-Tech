# Demo SePay webhook thật qua ngrok (5 bước)

> Mục tiêu: cư dân chuyển tiền thật → SePay webhook → hóa đơn tự "Đã thanh toán".
> ngrok đã tải sẵn ở scratchpad. Backend Prop-Tech chạy port 5052.

---

## Bước 1 — Lấy ngrok authtoken (1 lần)

1. Đăng ký free tại https://dashboard.ngrok.com/signup (dùng Google/email).
2. Vào https://dashboard.ngrok.com/get-started/your-authtoken → copy authtoken.
3. Chạy lệnh (thay `<TOKEN>`):
   ```
   <đường-dẫn-ngrok>\ngrok.exe config add-authtoken <TOKEN>
   ```
   ngrok.exe nằm ở:
   `C:\Users\Admin\AppData\Local\Temp\claude\...\scratchpad\ngrok\ngrok.exe`
   (đường dẫn đầy đủ Claude sẽ đưa; hoặc copy ngrok.exe ra chỗ cố định như `D:\ngrok\`).

---

## Bước 2 — Chạy ngrok expose port 5052

```
ngrok.exe http 5052
```
→ ngrok hiện dòng `Forwarding  https://abc123.ngrok-free.app -> http://localhost:5052`
→ Copy URL `https://abc123.ngrok-free.app` (mỗi lần chạy 1 URL khác, trừ khi trả phí).

**Giữ cửa sổ ngrok mở** suốt lúc demo.

---

## Bước 3 — Nhập TK thật (đã liên kết SePay) vào form

1. Đăng nhập chủ nhà (Admin/QuanLy) → Trang cá nhân → mục "Tài khoản nhận tiền".
2. Chọn đúng ngân hàng + nhập **số TK thật đã liên kết SePay** + tên chủ TK → Lưu.
   (TK này SePay phải đang theo dõi thì mới có webhook.)

---

## Bước 4 — Cấu hình Webhook trên SePay Dashboard

1. Đăng nhập https://my.sepay.vn → **Webhooks** (hoặc Tích hợp → Webhooks).
2. **Thêm Webhook:**
   - **URL:** `https://abc123.ngrok-free.app/api/PaymentGateway/sepay-webhook`
     (thay `abc123...` bằng URL ngrok ở Bước 2)
   - **Kiểu xác thực:** API Key → nhập đúng chuỗi trong `.env`:
     `SEPAY_WEBHOOK_API_KEY=proptech-sepay-webhook-2026`
     (SePay gửi header `Authorization: Apikey proptech-sepay-webhook-2026`)
   - **Tài khoản áp dụng:** chọn TK đã liên kết (TK ở Bước 3).
   - **Sự kiện:** giao dịch tiền vào (money in).
3. Lưu webhook.

---

## Bước 5 — Test

1. App cư dân → mở hóa đơn → bấm "Thanh toán" → hiện QR (trỏ TK Bước 3, nội dung `HD{id}`).
2. Dùng app ngân hàng **quét QR + chuyển thật** (số tiền đúng hóa đơn, hoặc chuyển ít để test
   — xem lưu ý dưới). GIỮ NGUYÊN nội dung `HD{id}`.
3. Tiền vào TK → SePay phát hiện → gọi webhook về ngrok → backend:
   - Đối soát: TK nhận → Owner, nội dung `HD{id}` → hóa đơn, số tiền.
   - Khớp → hóa đơn chuyển **"Đã thanh toán"** → SignalR → app tự cập nhật.

---

## Kiểm tra khi lỗi

- **Không thấy webhook về:** kiểm tra cửa sổ ngrok (có dòng `POST /api/PaymentGateway/sepay-webhook`
  không). Nếu không → SePay chưa gọi (sai URL webhook, hoặc TK chưa liên kết).
- **Webhook về nhưng 401:** sai `SEPAY_WEBHOOK_API_KEY` (header không khớp `.env`).
- **Webhook về, 200 nhưng không Paid:** nội dung CK không chứa đúng `HD{id}`, hoặc số tiền lệch,
  hoặc TK nhận không khớp Owner của hóa đơn. Xem log backend (dòng có `Webhook SePay`).
- **Xem log webhook:** ngrok có web UI tại http://127.0.0.1:4040 — xem request/response chi tiết.

## Lưu ý

- **Số tiền test:** hóa đơn thật có thể lớn. Để test rẻ, tạo hóa đơn giá trị nhỏ, hoặc
  backend chấp nhận `transferAmount >= tổng tiền` (chuyển dư vẫn Paid; chuyển thiếu → "một phần").
- **ngrok free URL đổi mỗi lần chạy** → phải cập nhật lại URL webhook trên SePay mỗi lần.
  Trả phí ngrok hoặc deploy cloud để có URL cố định.
- **Máy phải bật + ngrok + backend chạy** suốt lúc demo.
