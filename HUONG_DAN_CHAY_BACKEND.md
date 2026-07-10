# Huong dan chay backend Prop-Tech

Backend Prop-Tech la ASP.NET Core API nam o:

```powershell
D:\Web_TroUyTin\Prop-Tech\Prop-Tech\backend
```

Port local mac dinh:

```text
http://localhost:5052
```

Backend hien tai dung Supabase Postgres qua Npgsql. SQL Server chi con la rollback option khi can.

## 1. Cau hinh Supabase dung cach

Supabase project hien tai:

```text
Project ref: dksprovurepanjwkoygq
Host:        aws-0-ap-northeast-1.pooler.supabase.com
Database:    postgres
Username:    postgres.dksprovurepanjwkoygq
Schema:      proptech
```

Luu y quan trong:

- `trouytin` la ten project/he thong, khong phai database name mac dinh cua Supabase.
- Database name dung cho connection string la `postgres`.
- Du lieu Prop-Tech nam trong schema rieng `proptech`.
- Password phai la database password trong Supabase, khong phai Cloudflare token, R2 secret, Supabase anon key hay service role key.

Dang connection string cho .NET/Npgsql:

```text
Host=aws-0-ap-northeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.dksprovurepanjwkoygq;Password=<database-password>;SSL Mode=Require;Trust Server Certificate=true
```

## 2. File backend .env

Backend tu nap file nay khi start:

```text
D:\Web_TroUyTin\Prop-Tech\Prop-Tech\backend\.env
```

File `.env` khong commit len Git. Noi dung can co:

```env
R2__AccountId=<cloudflare-account-id>
R2__Bucket=anhtrouytin
R2__AccessKey=<r2-access-key-id>
R2__SecretKey=<r2-secret-access-key>
R2__PublicBaseUrl=https://pub-xxxxxxxxxxxxxxxx.r2.dev

Database__Provider=Postgres
Database__Schema=proptech
ConnectionStrings__DefaultConnection="Host=aws-0-ap-northeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.dksprovurepanjwkoygq;Password=<database-password>;SSL Mode=Require;Trust Server Certificate=true"

Chatbot__BaseUrl=http://localhost:8000
```

Neu terminal da tung set bien moi truong cung ten, bien terminal se uu tien hon `.env`. Khi gap loi ket noi DB, nen mo terminal moi hoac xoa bien cu:

```powershell
Remove-Item Env:ConnectionStrings__DefaultConnection -ErrorAction SilentlyContinue
Remove-Item Env:Database__Provider -ErrorAction SilentlyContinue
Remove-Item Env:Database__Schema -ErrorAction SilentlyContinue
```

## 3. Chay backend bang dotnet

Dung terminal rieng cho Prop-Tech:

```powershell
Get-Process backend -ErrorAction SilentlyContinue | Stop-Process

Remove-Item Env:ConnectionStrings__DefaultConnection -ErrorAction SilentlyContinue
Remove-Item Env:Database__Provider -ErrorAction SilentlyContinue
Remove-Item Env:Database__Schema -ErrorAction SilentlyContinue

cd D:\Web_TroUyTin\Prop-Tech\Prop-Tech\backend
dotnet restore
dotnet run --launch-profile http
```

Khi chay dung, log se co dang:

```text
Storage: Cloudflare R2
Database config: provider=Postgres; host=aws-0-ap-northeast-1.pooler.supabase.com; port=5432; database=postgres; username=postgres.dksprovurepanjwkoygq; schema=proptech
Now listening on: http://localhost:5052
Application started. Press Ctrl+C to shut down.
```

Terminal dung lai o day la binh thuong vi backend dang chay. Muon chay lenh tiep thi mo terminal khac.

Backend chi tao schema/table neu chua co:

```text
CREATE SCHEMA IF NOT EXISTS "proptech";
```

Lenh nay khong tao database Supabase moi. No chi dam bao schema `proptech` ton tai trong database `postgres`.

## 4. Kiem tra backend

Swagger:

```text
http://localhost:5052/swagger
```

API public:

```powershell
Invoke-RestMethod http://localhost:5052/api/public/rooms
```

Neu tra ve `[]` thi API va DB da doc duoc, chi la chua co phong public hoac query hien tai khong co du lieu phu hop.

## 5. Cloudflare R2 luu anh

Khi du 5 bien R2 trong `.env`, backend se upload anh qua Cloudflare R2.

Flow upload:

```text
Frontend -> POST /api/File/upload -> Cloudflare R2 -> tra URL public -> luu URL vao DB
```

URL tra ve se duoc frontend luu vao `imageUrls`, sau do backend luu trong cac cot JSON nhu `ANH_PHONG_JSON` hoac `ANH_JSON`.

Neu thieu mot bien R2, backend fallback ve local disk `/uploads`. Kiem tra log:

```text
Storage: Cloudflare R2
```

## 6. Ket noi Chatbot RAG

Prop-Tech backend goi Chatbot qua:

```text
Chatbot__BaseUrl=http://localhost:8000
```

Thu tu chay de mobile app hoi chatbot bang du lieu Supabase:

```powershell
# Terminal 1: Prop-Tech backend
cd D:\Web_TroUyTin\Prop-Tech\Prop-Tech\backend
dotnet run --launch-profile http
```

```powershell
# Terminal 2: nap du lieu Prop-Tech/Supabase vao ChromaDB
cd D:\Web_TroUyTin\Chatbot\chatbotApp
venv\Scripts\python.exe ingest_from_db.py --rebuild
```

```powershell
# Terminal 3: Chatbot API
cd D:\Web_TroUyTin\Chatbot\chatbotApp
venv\Scripts\python.exe app.py
```

Mobile app goi `/api/Chat/send` tren Prop-Tech backend. Backend tu xac dinh toa nha cua cu dan tu hop dong/phong hien tai va goi Chatbot API `/api/v1/chat`.

Khi chu nha/BQL cap nhat kho tri thuc o frontend `/knowledge-base`, chay lai ingest:

```powershell
cd D:\Web_TroUyTin\Chatbot\chatbotApp
venv\Scripts\python.exe ingest_from_db.py --rebuild
```

Neu Prop-Tech backend chay trong Docker con Chatbot chay local tren may host, dung:

```powershell
$env:Chatbot__BaseUrl="http://host.docker.internal:8000"
```

## 7. Frontend/mobile tro ve backend

Frontend Prop-Tech mac dinh dung:

```text
VITE_API_BASE_URL=http://localhost:5052
```

Mobile chay tren dien thoai that khong nen dung `localhost`. Hay dung IP LAN cua may dang chay backend:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://<IP-LAN-CUA-MAY>:5052"
```

## 8. Docker Compose neu can

Flow local khuyen nghi hien tai la chay Prop-Tech backend bang `dotnet run`. Neu can Docker Compose, truyen bien moi truong thay vi copy `.env` vao image:

```powershell
$env:PROPTECH_DATABASE_URL="Host=aws-0-ap-northeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.dksprovurepanjwkoygq;Password=<database-password>;SSL Mode=Require;Trust Server Certificate=true"
$env:Database__Schema="proptech"
$env:Chatbot__BaseUrl="http://host.docker.internal:8000"
docker compose up --build
```

Neu backend chay trong Docker va can goi Chatbot local tren may host, dung `http://host.docker.internal:8000`.

## 9. Loi thuong gap

### `28P01: password authentication failed`

- Sai database password hoac terminal dang override `.env`.
- Kiem tra log `Database config` xem username co dung `postgres.dksprovurepanjwkoygq` khong.
- Database password lay trong Supabase Database Settings, khong phai R2/Supabase API key.
- Mo terminal moi hoac xoa `Env:ConnectionStrings__DefaultConnection`.

### `3D000: database "trouytin" does not exist`

- Connection string dang sai `Database=trouytin`.
- Sua ve `Database=postgres`.
- Giu `Database__Schema=proptech`.

### Backend van `Now listening` sau khi loi DB

Code hien tai co the bat loi ensure schema va tiep tuc mo port. Hay test API that:

```powershell
Invoke-RestMethod http://localhost:5052/api/public/rooms
```

Neu API tra `200`, backend doc DB duoc. Neu API loi, doc log chi tiet trong terminal backend.

### Port 5052 bi chiem

```powershell
Get-NetTCPConnection -LocalPort 5052 -ErrorAction SilentlyContinue
Get-Process backend -ErrorAction SilentlyContinue | Stop-Process
```

### Upload anh van luu local

- Kiem tra log co `Storage: Cloudflare R2`.
- Kiem tra `.env` co du `R2__AccountId`, `R2__Bucket`, `R2__AccessKey`, `R2__SecretKey`, `R2__PublicBaseUrl`.
- Restart backend sau khi sua `.env`.

### Chatbot bao chua co du lieu

- Kiem tra Chatbot API dang chay o `http://localhost:8000/health`.
- Chay lai `venv\Scripts\python.exe ingest_from_db.py --rebuild`.
- Kiem tra cu dan da co hop dong/phong hien tai de backend resolve `building_code`.

## 10. Rollback SQL Server neu can

Chi dung khi can quay lai DB local cu:

```powershell
$env:Database__Provider="SqlServer"
$env:ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=apartment_management_dev;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;MultipleActiveResultSets=true"
dotnet run --launch-profile http
```

Khi provider la Postgres, backend bo qua cac patch raw SQL Server legacy.
