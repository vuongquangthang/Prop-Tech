# Mobile App (Expo)

## Recommended Environment

- Node.js: 20.x LTS (recommended)
- npm: 10.x

The project currently targets Expo SDK 54. On Windows, using Node 22 can intermittently cause Metro worker failures such as:

`Error: spawn UNKNOWN`

## Start Commands

- `npm run start`: stable mode (`expo start --clear --max-workers 1`)
- `npm run start:default`: default Expo startup (no worker limit)

## If You Still See `spawn UNKNOWN`

1. Switch Node to 20 LTS.
2. Remove cache and reinstall dependencies:
	- `rd /s /q node_modules`
	- `del package-lock.json`
	- `npm install`
3. Run again with `npm run start`.

## ChatApp integration

Mobile không gọi trực tiếp ChatApp và không chứa `X-Internal-Api-Key`. Luồng chuẩn:

`Expo mobile -> JWT -> Prop-Tech backend (:5052) -> trusted headers/internal key -> ChatApp (:8000)`.

1. Sao chép `.env.example` thành `.env`.
2. Đặt `EXPO_PUBLIC_PROPTECH_API_BASE_URL` thành URL backend mà thiết bị truy cập được.
   Với Android Emulator có thể dùng `http://10.0.2.2:5052`; thiết bị thật cần IP LAN của máy chạy backend.
3. Cấu hình phía backend bằng biến môi trường:
   - `Chatbot__BaseUrl=http://localhost:8000` khi chạy local.
   - `Chatbot__BaseUrl=http://chatapp:8000` khi hai service chạy Docker Compose.
   - `Chatbot__InternalApiKey=<same-key-as-chatapp>`.
4. Khởi động ChatApp, backend Prop-Tech, sau đó chạy mobile.

Proxy chỉ dùng các claim đã được xác thực trong JWT để tạo tenant context cho ChatApp.
Phần tích hợp này không đọc hoặc thay đổi database Prop-Tech và không tin cậy
`building_code` gửi từ mobile.

Các màn hình đã tích hợp:

- Chat, tạo cuộc trò chuyện mới, lịch sử và xóa cuộc trò chuyện.
- Danh sách/chi tiết tài liệu.
- Upload tối đa 5 file PDF, DOCX, TXT hoặc Markdown; mỗi file tối đa 10 MB.
- Re-index và xóa tài liệu dành cho vai trò `Admin`, `QuanLy` hoặc `Manager`.
