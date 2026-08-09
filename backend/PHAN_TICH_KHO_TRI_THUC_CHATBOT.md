---
noteId: "e79b7451940811f1b68ce98536b44eef"
tags: []

---

# Phân tích & đề xuất: Kho tri thức chủ nhà ↔ Chatbot RAG

> Cập nhật theo đúng ý định gốc: **khi chủ nhà tải file lên, chatbot phải tự chạy
> ingest để BÓC TÁCH FILE rồi lưu vào `chroma_db`** — tức khâu bóc tách nằm ở
> chatbot (Python), không phải ở backend .NET.

---

## 0. TL;DR

- Luồng **hiện tại** làm **ngược** với ý định gốc: backend .NET bóc tách file, chatbot
  chỉ kéo *text đã dựng sẵn* về rồi embed.
- **Quan trọng:** kiểm tra toàn bộ code + git history của chatbot cho thấy **chưa bao
  giờ tồn tại code bóc tách file ở phía chatbot**. Đây là chức năng **phải xây mới**,
  không phải khôi phục.
- Bạn đã chốt: **giữ DB (`KnowledgeBase`) làm bản lưu song song** để chủ nhà vẫn
  quản lý được; chatbot là nơi bóc tách thật sự để embed.
- Còn 1 điểm cần quyết: **đường truyền file** (backend forward hay upload thẳng) — mục
  4 phân tích dựa trên chức năng thực tế của chatbot.

---

## 1. Chatbot thực sự có những gì (đã kiểm tra toàn bộ)

### 1.1 Endpoints (FastAPI — `app.py`)

| Route | File | Chức năng |
|-------|------|-----------|
| `POST /api/v1/chat` | `controllers/chatbotAppController.py` | Hỏi/đáp RAG. Nhận `building_code` + `question`. |
| `POST /api/internal/ingest/rebuild` | `controllers/ingestController.py` | Rebuild Chroma: kéo text từ Prop-Tech rồi embed. Có khóa `X-Internal-Api-Key`, có `asyncio.Lock`. |
| `GET /health` | `app.py` | Health check. |

### 1.2 Services

- **`services/chatbotappService.py`** — RAG production đang chạy:
  - `HuggingFaceEmbeddings("BAAI/bge-m3", CPU)` + `Chroma(persist_directory="chroma_db")`.
  - `RAGRetriever`: **hybrid search** = vector (`similarity_search_with_relevance_scores`,
    threshold 0.35) **+ BM25** (`rank-bm25`), lọc theo `metadata.building_code`.
  - `ChatGroq("llama-3.3-70b-versatile")` + **query rewrite** (LLM mở rộng từ khóa).
  - `reload_vector_db()`: nạp lại Chroma vào RAM sau khi ingest.
  - `retriever_cache` theo `building_code`.
- **`services/chatbotver2.py`** — bản CLI thử nghiệm (có `main()` chạy terminal), logic
  gần giống, threshold 0.4, top-3. Không nối vào API. (Có thể coi là bản nháp.)
- **`ingest_from_db.py`** — script/hàm `run_ingest()`:
  - Gọi `GET {PROPTECH}/api/internal/chatbot/knowledge-documents` lấy **text sẵn**.
  - `build_documents()` → `Chroma.add_documents()`. **Không đọc file, không chunk.**

### 1.3 Điều KHÔNG có ở chatbot (mấu chốt)

Đã `grep` toàn bộ `.py` (trừ venv) và soi git history 2 commit (`4b514d8 chatbot v1`,
`dbcf5ff ingest endpoint`):

- ❌ Không có `PyPDFLoader` / `TextLoader` / `Docx` / `Unstructured` / bất kỳ loader nào.
- ❌ Không có `RecursiveCharacterTextSplitter` / chunk / split.
- ❌ Không có route nhận **file upload** (`UploadFile`).
- ❌ `chroma_db` gốc trong commit v1 được **dựng sẵn từ trước** bằng nguồn không nằm
  trong repo (không có script tạo ra nó).

→ **Khả năng "chatbot tự bóc tách file" chưa từng được viết.** Cần **xây mới**.

### 1.4 Phía Prop-Tech đang bóc tách file (làm thay việc của chatbot)

- `KnowledgeBaseService.UploadDocumentAsync()`:
  - Bóc tách bằng **UglyToad.PdfPig** (PDF) + **OpenXml** (docx) + StreamReader (txt).
  - `SplitIntoChunks()` cắt thô theo `\n\n`, cắt cứng `content[..2000]` ký tự.
  - Lưu N bản ghi `KnowledgeBase` vào Postgres/Supabase.
- `KnowledgeBaseController.UploadDocument()` sau khi lưu DB → gọi
  `_chatbotIngestService.RebuildAsync()` (đồng bộ, `rebuild=true`, không truyền
  `building_id`).
- `InternalChatbotKnowledgeController` dựng text từ DB (toà nhà + phòng + dịch vụ + KB)
  trả cho chatbot ingest.

---

## 2. Vì sao "chưa ổn" — so với ý định gốc

Ý định gốc: **file → chatbot bóc tách → chroma_db**. Thực tế: **file → backend bóc
tách → DB → chatbot chỉ embed lại text**. Hệ quả:

1. **Sai nơi bóc tách.** Thư viện RAG mạnh (loader đa định dạng, splitter theo token,
   xử lý bảng/hình) nằm ở hệ sinh thái Python/LangChain — nhưng chatbot lại không dùng
   để bóc tách. Backend .NET tự chunk thô → chất lượng embedding kém.
2. **Chunk thô** (mục 1.4): cắt 2000 ký tự, không overlap, có thể cắt giữa câu/bảng.
3. **Rebuild toàn bộ mỗi lần upload**: `RebuildAsync()` gọi `rebuild=true`,
   `building_id=null` → `run_ingest` **xoá sạch** Chroma rồi nạp lại **mọi** tòa của mọi
   owner. Trong lúc đó Chroma trống → người khác hỏi bị "không có dữ liệu".
4. **Ingest đồng bộ** chặn response upload (timeout tới 5 phút).
5. **`KnowledgeBase` không có `BuildingId`** (chỉ `OwnerUserId`) → không tách kiến thức
   theo từng tòa; `IsKnowledgeForBuilding` gán chung mọi tòa của owner.
6. **`building_code` lệch định dạng**: internal controller đặt `building.Id.ToString()`
   ("12"), nhưng client chatbot mẫu gửi `"S1.01"`. Filter Chroma không khớp →
   retriever rỗng → **chatbot luôn trả NO_DATA**. (Lỗi độc lập, phải sửa dù chọn PA nào.)

---

## 3. Kiến trúc mục tiêu (theo ý định gốc + quyết định "giữ DB song song")

```
Chủ nhà upload file (PDF/docx/txt)
   │
   ▼
Prop-Tech backend  (KnowledgeBaseController.UploadDocument)
   ├─ (tùy chọn) lưu metadata bản ghi KnowledgeBase để chủ nhà quản lý     ← bản lưu song song
   └─ FORWARD FILE (multipart) sang chatbot: POST /api/internal/ingest/file
        │
        ▼
   Chatbot (route MỚI cần xây)
        ├─ Loader theo đuôi file: PyPDFLoader / Docx2txtLoader / TextLoader
        ├─ RecursiveCharacterTextSplitter (chunk theo token, có overlap)
        ├─ gắn metadata: building_code, source, knowledge_id (map ngược về DB)
        ├─ Chroma.add_documents()  → chroma_db
        └─ reload_vector_db()
   │
   ▼
Cư dân hỏi → /api/v1/chat → RAGRetriever (hybrid) lọc building_code → Groq LLM
```

Điểm mấu chốt của kiến trúc này:

- **Chatbot là nơi bóc tách + chunk + embed** (đúng ý định gốc, đúng thế mạnh Python).
- **DB `KnowledgeBase` là bản lưu song song** để chủ nhà xem/sửa/xoá và để có `source of
  truth` khi cần rebuild (bạn đã chốt).
- **Đồng bộ 2 chiều bằng `knowledge_id`**: mỗi vector trong Chroma mang `knowledge_id`
  trỏ về bản ghi DB → xoá/sửa KB thì xoá đúng vector tương ứng, không phải rebuild all.

---

## 4. Đường truyền file — dựa trên chức năng thực tế của chatbot

Chatbot **hiện chưa có** route nhận file, nên dù chọn cách nào cũng phải **xây route
mới**. Hai lựa chọn:

### 4A. Backend forward file sang chatbot  ✅ khuyến nghị

```
Frontend → (đã có) POST /api/knowledge-base/upload  [JWT của chủ nhà]
        → backend lưu metadata KB (song song)
        → backend POST multipart file → chatbot POST /api/internal/ingest/file
              header X-Internal-Api-Key + buildingId + knowledgeId
```

- **Ưu:**
  - Giữ nguyên **auth/phân quyền hiện có** (`User.GetOwnerUserId()`), chủ nhà không gọi
    thẳng chatbot.
  - Chatbot chỉ tin request nội bộ (đã có cơ chế `X-Internal-Api-Key`).
  - Backend biết chắc file thuộc **tòa nào / owner nào** → truyền metadata chuẩn.
  - Frontend **không đổi** (vẫn upload vào backend như cũ).
- **Nhược:** file đi qua 2 chặng (frontend→backend→chatbot); backend cần
  `MultipartFormDataContent` để forward.
- Phù hợp vì chatbot đã có sẵn khuôn `ingestController` + khóa nội bộ để nhận thêm route
  `/ingest/file`.

### 4B. Frontend upload thẳng vào chatbot

- **Ưu:** ít chặng, backend không phải forward.
- **Nhược:** chatbot phải **tự làm auth** (hiện chỉ có internal key, không hiểu JWT chủ
  nhà), phải tự biết file thuộc tòa nào, và CORS đang mở `*`. Rủi ro bảo mật + phải sửa
  frontend. Chatbot hiện **không có** hạ tầng cho việc này.

> **Khuyến nghị 4A.** Nó khớp với hạ tầng chatbot đang có (internal key + ingest router)
> và không phá vỡ phân quyền/flow upload hiện tại.

---

## 5. Việc cần làm (theo thứ tự)

### Phía Chatbot (Python) — xây khả năng bóc tách file

1. **Thêm deps** vào `requirements.txt`: `pypdf` (hoặc `PyMuPDF`), `docx2txt`,
   `langchain-text-splitters` (RecursiveCharacterTextSplitter đã nằm trong
   `langchain-core`/`langchain-text-splitters`).
2. **Route mới** `POST /api/internal/ingest/file` (trong `ingestController.py`):
   - Nhận `UploadFile` + form `building_code` + `knowledge_id` + `X-Internal-Api-Key`.
   - Lưu file tạm → chọn loader theo đuôi → load text.
   - `RecursiveCharacterTextSplitter(chunk_size≈800, chunk_overlap≈120)`.
   - Gắn metadata `{building_code, source, knowledge_id}` cho mỗi chunk.
   - `vector_db.add_documents()` → `chroma_db`; rồi `reload_vector_db()`.
   - Dùng lại `_ingest_lock` để tránh chạy song song.
3. **Xóa cục bộ khi cập nhật/xoá KB**: route `DELETE /api/internal/ingest/knowledge/{id}`
   → `vector_db.delete(where={"knowledge_id": id})`. Tránh rebuild all.

### Phía Prop-Tech backend (.NET)

4. **Chốt `building_code` = `building.Id`** nhất quán ở internal controller + metadata
   + **sửa client gọi `/api/v1/chat`** để gửi đúng khóa này. (Sửa **lỗi 2.6** — nếu
   không, chatbot vẫn "câm".)
5. **`UploadDocument`**: sau khi lưu metadata KB, **forward file** sang
   `/api/internal/ingest/file` (thay cho `RebuildAsync` toàn bộ). Chạy **bất đồng bộ**,
   trả response upload ngay + cờ trạng thái.
6. **Thêm `BuildingId` (nullable)** cho `KnowledgeBase` + migration, cho phép chủ nhà
   chọn tòa khi upload. (nullable = áp dụng chung mọi tòa của owner.)
7. **Giữ `RebuildAsync` (kéo text DB)** cho phần dữ liệu **cấu trúc** (toà/phòng/dịch
   vụ) — phần này vẫn nên sinh từ DB, không phải từ file. Chỉ **phần tài liệu upload**
   mới chuyển sang luồng bóc tách ở chatbot.

> Lưu ý: sau thay đổi này tồn tại **hai nguồn** nạp vào Chroma:
> (a) dữ liệu cấu trúc toà/phòng/dịch vụ — sinh từ DB qua `run_ingest` (giữ nguyên);
> (b) tài liệu chủ nhà upload — bóc tách ở chatbot (mới). Cả hai gắn `building_code`
> nên retriever hợp nhất tự nhiên.

---

## 6. Câu hỏi còn lại cần bạn chốt

1. **Đường truyền file**: 4A (backend forward — khuyến nghị) hay 4B (upload thẳng)?
2. **`building_code`**: chốt dùng `building.Id` (số) đúng không? Nếu frontend đang gửi
   mã chữ ("S1.01") thì cần sửa cả frontend — bạn xác nhận.
3. **Phạm vi tài liệu upload**: 1 file gắn 1 tòa, hay có loại "chung mọi tòa"?
4. **Có lưu file gốc** (R2/Supabase Storage) để rebuild lại sau không, hay chatbot bóc
   tách xong là bỏ file tạm?

> Mặc định tôi đề xuất: (1) 4A, (2) `building.Id`, (3) 1 file gắn 1 tòa + cho phép để
> trống = chung, (4) chưa cần lưu file gốc (bóc tách xong xoá file tạm; muốn rebuild thì
> chủ nhà upload lại — DB vẫn giữ metadata).
