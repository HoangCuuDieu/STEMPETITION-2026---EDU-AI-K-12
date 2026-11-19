# EDU AI K-12 — Nền tảng giáo dục AI (MVP có backend thật)

Dự án xây dựng theo tài liệu đặc tả **AI EDUCATION PLATFORM** do người dùng cung cấp. Không phải ảnh giao diện tĩnh: các tính năng đã triển khai có mã xử lý, lưu dữ liệu và API. Đây là **bản triển khai nền tảng và một phần các giai đoạn tiếp theo**, KHÔNG phải toàn bộ đặc tả đã hoàn thành.

## 1. Công nghệ

- **Frontend:** HTML5, CSS3, JavaScript ES modules, responsive, giao diện tiếng Việt, cùng origin với API. Không cần npm/build để chạy phần chính.
- **3D:** Three.js + OrbitControls qua importmap CDN. Phụ thuộc Internet để tải thư viện (chỉ khi mở phòng 3D). WebGL thực, không phải ảnh PNG.
- **Vật lý:** Canvas 2D, `requestAnimationFrame` và công thức vật lý đơn vị SI.
- **Backend:** Python FastAPI, Pydantic, SQLite với câu lệnh tham số hóa.
- **AI:** Google Gemini Developer API trên máy chủ bằng HTTPS (`generateContent`), qua `httpx`. Nhà cung cấp AI được cô lập trong `backend/ai.py`.
- **Tài liệu:** PDF (bao gồm gửi PDF quét cho Gemini Vision), DOCX, PPTX, XLSX, TXT, CSV, JPG/PNG/WEBP.

## 2. Khởi chạy trên Windows / macOS / Linux

Yêu cầu **Python 3.11+**, trình duyệt hiện đại. Lần đầu cài thư viện cần có Internet.

```bash
# Giải nén và mở terminal tại thư mục edu-ai-k12
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
# Sao chép .env.example thành .env (không công khai .env)
# Windows:
copy .env.example .env
# macOS/Linux:
# cp .env.example .env

# Chỉnh .env bằng trình soạn thảo văn bản: GEMINI_API_KEY và TEACHER_INVITE_CODE
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Mở **http://127.0.0.1:8000**. Tài liệu API: **http://127.0.0.1:8000/api/docs**. Kiểm tra server: **http://127.0.0.1:8000/api/health**.

**Cực kỳ quan trọng:** Phải thu hồi khóa Gemini đã từng dán vào cuộc trò chuyện và **tạo khóa mới**. File `.env.example` chỉ có chỗ trống, dự án **không chứa bất kỳ khóa API cá nhân nào**. Chỉ điền `GEMINI_API_KEY` trong `.env` ở backend; không được chèn vào frontend, JavaScript hay kho mã công khai. `TEACHER_INVITE_CODE` là chuỗi dài, bí mật do quản trị viên tự đặt và chia riêng cho giáo viên.

Nếu API trả `401/403/404`, kiểm tra hiệu lực khóa, quyền dùng mô hình và `GEMINI_MODEL` theo danh sách mô hình thực tế tài khoản đang được sử dụng. Bản này mặc định thử `gemini-2.5-flash`; lựa chọn này có thể cần thay đổi theo thời điểm và tài khoản.

## 3. Chức năng đã có mã thực tế

| Phân hệ | Phạm vi hoạt động của bản này |
|---|---|
| Người dùng & phân quyền | Đăng ký/đăng nhập, mật khẩu scrypt, session token ngẫu nhiên lưu dạng băm, cookie HttpOnly; giáo viên đăng ký qua mã mời; xác thực mọi API nhạy cảm |
| Giáo viên và lớp học | Tạo lớp, mã tham gia lớp, danh sách học sinh, số liệu tổng hợp lấy từ SQLite |
| AI gia sư | Hội thoại lưu theo tài khoản, ngữ cảnh lịch sử, lớp và môn; nhận file, gửi ngữ cảnh đến Gemini thật nếu khóa hợp lệ; không có key thì báo lỗi thật, không giả lập |
| Tải tài liệu | Trích xuất văn bản DOCX/PPTX/XLSX/TXT/CSV/PDF; ảnh và PDF đưa trực tiếp cho Gemini Vision; giới hạn 8 MB, kiểm tra định dạng, giới hạn xử lý |
| Hình học không gian | **7** hình khối bằng lưới Three.js thật, xoay, zoom, chọn/đổi tên đỉnh, sửa tọa độ, thêm điểm, nối điểm, undo/redo, lưu SQLite, xuất JSON, chụp PNG |
| Vật lý tương tác | **6** mô phỏng bằng công thức: ném ngang, ném xiên, rơi tự do, chuyển động đều, con lắc đơn góc nhỏ, con lắc lò xo không ma sát |
| Hóa học | **10** cấu trúc phân tử: H₂, O₂, N₂, H₂O, CO₂, CH₄, NH₃, C₂H₄, C₂H₂, C₆H₆; xoay 3D, liên kết đơn/đôi/ba, hai kiểu hiển thị, cảnh báo an toàn cơ bản |
| Đề kiểm tra | Giáo viên nhập câu thủ công hoặc yêu cầu Gemini soạn bản nháp; xem trước, xuất bản tạo mã, đóng bài |
| Học sinh thi | Nhập mã, làm 3 loại câu hỏi (chọn đáp án, đúng/sai một mệnh đề, trả lời ngắn), lưu nháp lên server, đồng hồ có thời gian bắt đầu từ server, nộp bài |
| Đánh giá & giám sát | Chấm tự động câu khách quan, câu ngắn chờ giáo viên duyệt; giáo viên sửa điểm; sự kiện tab ẩn/hiện, fullscreen, mất mạng (không khẳng định phát hiện gian lận) |
| AI chấm bài | Tải bài làm, tùy chọn barem; Gemini được yêu cầu kiểm tra môn, phân tích tiêu chí và giải thích; thông báo rõ chỉ là gợi ý, giáo viên kiểm tra lại |

**Không được gọi bản này là nền tảng đã hoàn thiện 50/50 mô phỏng.** Những chức năng còn thiếu được nêu riêng bên dưới.

## 4. Giao diện và cách sử dụng

### Học sinh
1. Đăng ký bằng email và mật khẩu tối thiểu 10 ký tự, chọn lớp từ 1 đến 12.
2. Trong **Gia sư AI**, chọn lớp/môn (hoặc Tự động), đặt câu hỏi, tùy chọn tải tài liệu.
3. Vào **Hình học 3D**, **Vật lý 2D**, **Hóa học 3D** để xem và điều chỉnh mô hình thật.
4. Trong **Phòng thi**, nhập mã lớp nếu được giao theo lớp, rồi nhập mã truy cập bài kiểm tra.
5. Câu trả lời được lưu lên máy chủ; chuyển tab/thoát fullscreen có thể được ghi nhận. Nộp xong không sửa được.

### Giáo viên
1. Quản trị viên đặt `TEACHER_INVITE_CODE` trong `.env` và cấp mã cho giáo viên qua kênh riêng.
2. Đăng ký vai trò **Giáo viên**, nhập đúng mã mời.
3. Vào **Quản lý giáo viên**, tạo lớp và gửi mã lớp cho học sinh.
4. Tạo đề thủ công hoặc dùng chức năng soạn đề AI (cần Gemini key); giáo viên tự rà soát từng câu.
5. Lưu đề nháp, bấm **Xuất bản**, gửi mã truy cập cho học sinh. Học sinh không nhận được `correct` hoặc `explanation` trong API lúc thi.
6. Xem lượt làm bài, các sự kiện do trình duyệt ghi nhận, điều chỉnh điểm và nhận xét.

## 5. Cấu trúc thư mục

```text
edu-ai-k12/
├── backend/
│   ├── __init__.py
│   ├── main.py         # Các API xác thực, lớp, chat, tài liệu, đề và chấm
│   ├── ai.py           # Gateway Gemini REST — duy nhất lớp chứa kết nối AI
│   ├── database.py     # Schema và SQLite connection
│   ├── security.py     # Mật khẩu, token, phân quyền
│   ├── parsers.py      # Nhận diện định dạng và đọc tài liệu
│   └── config.py       # Đọc cấu hình .env trên server
├── frontend/
│   ├── index.html
│   └── assets/
│       ├── app.js      # UI và luồng học sinh/giáo viên
│       ├── style.css   # Thiết kế responsive
│       ├── geometry.js # Các lưới 3D có đỉnh/cạnh/mặt
│       ├── physics.js  # Mô phỏng với công thức thật
│       └── chemistry.js# Mô hình phân tử Three.js
├── tests/test_api.py  # Integration tests; không cần Gemini key
├── data/              # Dữ liệu chạy thật (không đưa lên Git)
├── .env.example       # Chỉ có placeholder
├── .gitignore
├── requirements.txt
├── requirements-dev.txt
├── ARCHITECTURE.md
├── SECURITY.md
└── README.md
```

## 6. Kiểm thử

```bash
pip install -r requirements-dev.txt
python -m pytest tests -q
node --check frontend/assets/app.js
node --check frontend/assets/physics.js
node --check frontend/assets/geometry.js
node --check frontend/assets/chemistry.js
```

Các kiểm thử backend đã chạy với SQLite tạm trên môi trường tạo dự án (**7/7 đạt**) và các file JS đã qua kiểm tra cú pháp `node --check`. **Không kiểm thử cuộc gọi Gemini thật** vì không dùng khóa người dùng. **Chưa xác nhận kiểm thử giao diện đồ họa bằng trình duyệt** trong môi trường tạo file vì Chromium bị chặn quyền truy cập trang; cần QA WebGL và responsive trên máy sử dụng thực tế.

### Kịch bản cần kiểm thử thủ công trước cuộc thi
- Trên hai tài khoản tách biệt: học sinh không thấy API quản trị, đáp án hoặc tài liệu của người khác.
- Giáo viên tạo lớp → học sinh tham gia lớp → giáo viên xuất bản đề → học sinh dùng mã làm bài → nộp → giáo viên xem bài, sửa điểm.
- Upload nhiều loại file, PDF quét/ảnh chữ viết tay; xác nhận kết quả Gemini và các giới hạn OCR.
- Xoay/zoom và sửa 7 mô hình hình học; chạy/tạm dừng/thay tham số 6 mô phỏng; xoay 10 phân tử.
- Ngắt kết nối lúc làm bài và tải lại trang; làm bài trên điện thoại và máy tính.

## 7. Những hạng mục CHƯA hoàn thiện so với đặc tả

- **Vật lý:** mới 6/50, chưa có 44 mô phỏng còn lại.
- **Hóa học:** mới 10/50 phân tử; chưa có 40 mô hình còn lại, hệ tinh thể và đủ 18 trường thông tin được kiểm chứng từng chất.
- **Hình học:** mới dựng 7 khối và các thao tác cơ bản, chưa có công cụ dựng mặt phẳng từ 3 điểm, giao tuyến, nhận diện đầy đủ quan hệ hình học tự dựng, kéo đỉnh bằng chuột.
- **AI kiến thức:** chưa có kho học liệu RAG có nguồn kiểm chứng, phân biệt sách giáo khoa theo bộ sách; mô hình AI có thể sai và không nên dùng như nguồn duy nhất.
- **Chấm bài:** mới dùng Gemini Vision + barem qua prompt, chưa có hệ thống OCR đánh dấu độ tin cậy theo ký tự, xác minh tự động toàn bộ bài hình học hay rubric dạng cấu trúc chuyên nghiệp.
- **Phòng thi:** chưa có giám sát sự kiện thời gian thực qua WebSocket, giao diện tạo thời gian bắt đầu/kết thúc, ngân hàng câu hỏi nâng cao, xuất Excel/PDF. Giám sát web không thể ngăn chuyển tab hoàn toàn.
- **Bảo mật triển khai công khai:** chưa có quy trình xin đồng ý và quyền riêng tư dữ liệu trẻ em, backup tự động, hạn lưu trữ, xác thực email, chống brute-force đăng nhập, triển khai HTTPS/reverse proxy, sao lưu và chính sách xóa dữ liệu. **Chưa được đánh giá đạt yêu cầu vận hành với dữ liệu học sinh thật trên Internet.**

Tiếp tục phát triển từng giai đoạn, test hồi quy và không xóa những tính năng đang vận hành.

## 8. Đưa lên máy chủ

Đây là hướng triển khai kỹ thuật ban đầu **cho môi trường thử nghiệm**, không phải chứng nhận triển khai production:

1. Dùng Linux VPS hoặc container có Python 3.11+, chạy từ thư mục dự án.
2. Đặt `GEMINI_API_KEY`, `TEACHER_INVITE_CODE`, đường dẫn volume `DATABASE_PATH` / `UPLOAD_DIR` trong secret của môi trường.
3. Chạy Uvicorn sau reverse proxy (Nginx/Caddy) có TLS HTTPS. Đặt `COOKIE_SECURE=true` khi dùng HTTPS.
4. Hạn chế quyền đọc `data` và `.env`. Không đưa tệp data lên repository. Tổ chức backup có mã hóa và khôi phục thử được.
5. Giới hạn đăng ký, áp dụng xác thực email, rate limit cho login và chính sách dữ liệu học sinh trước khi cho người dùng thật sử dụng.
6. Khi cần nhiều máy chủ, chuyển sang PostgreSQL và object storage có access control thay vì chia sẻ SQLite qua nhiều server.
7. Kết nối Internet là bắt buộc khi gọi Gemini và khi tải Three.js từ CDN; để triển khai offline/intranet cần đóng gói thư viện Three.js thành tài sản local.

**Nguồn tài liệu kỹ thuật:** [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key), [generateContent](https://ai.google.dev/api/generate-content), [Document processing](https://ai.google.dev/gemini-api/docs/document-processing), [React Three Fiber](https://r3f.docs.pmnd.rs/) (tham khảo hướng React cho các giai đoạn tiếp theo).
