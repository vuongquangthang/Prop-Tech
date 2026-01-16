# Huong dan test Building API

Tai lieu nay huong dan test nhanh cac endpoint Building trong du an.

## 1) Chuan bi

- Dam bao backend dang chay.
  - Docker: http://localhost:8080
  - Local dotnet: http://localhost:5000 (hoac https://localhost:5001)
- Co tai khoan MANAGER de goi cac endpoint tao/sua/xoa.

## 2) Lay JWT token (register/login)

Dang ky tai khoan MANAGER (neu chua co):

```bash
curl -X POST http://localhost:8080/api/Auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\":\"0900000001\",\"password\":\"P@ssw0rd!\",\"fullName\":\"Manager Test\",\"role\":\"MANAGER\"}"
```

Dang nhap de lay token:

```bash
curl -X POST http://localhost:8080/api/Auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\":\"0900000001\",\"password\":\"P@ssw0rd!\"}"
```

Lay `accessToken` trong response va gan vao bien `TOKEN`:

```bash
set TOKEN=eyJhbGciOi...
```

## 3) Test Building API (route /api/Buildings)

### 3.1) Lay danh sach building (can dang nhap)

```bash
curl -X GET http://localhost:8080/api/Buildings ^
  -H "Authorization: Bearer %TOKEN%"
```

### 3.2) Tao building (MANAGER)

```bash
curl -X POST http://localhost:8080/api/Buildings ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"buildingCode\":\"B01\",\"buildingName\":\"Block A\",\"address\":\"123 Main St\"}"
```

### 3.3) Lay building theo id

```bash
curl -X GET http://localhost:8080/api/Buildings/1 ^
  -H "Authorization: Bearer %TOKEN%"
```

### 3.4) Cap nhat building (MANAGER)

```bash
curl -X PUT http://localhost:8080/api/Buildings/1 ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"buildingName\":\"Block A1\",\"address\":\"456 New St\"}"
```

### 3.5) Xoa building (MANAGER)

```bash
curl -X DELETE http://localhost:8080/api/Buildings/1 ^
  -H "Authorization: Bearer %TOKEN%"
```

## 4) Route thay the (neu can)

Du an co them controller route goc (khong co tien to /api):

- GET /buildings
- GET /buildings/{id}
- POST /buildings
- PUT /buildings/{id}

Tat ca cac route tren yeu cau role MANAGER.

## 5) Test bang Swagger

Mo Swagger UI: http://localhost:8080/swagger

1) Login lay token
2) Click "Authorize" va nhap `Bearer {token}`
3) Test cac endpoint Building
