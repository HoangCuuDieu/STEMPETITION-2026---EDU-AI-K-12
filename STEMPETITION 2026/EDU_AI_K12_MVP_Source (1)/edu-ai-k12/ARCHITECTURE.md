# Kiến trúc và kế hoạch triển khai EDU AI K-12

## Kiến trúc luồng dữ liệu

```text
  Trình duyệt (HTML/CSS/JS ES Modules)
        | HTTPS /api + cookie HttpOnly
        v
  FastAPI (schema validation + role authorization)
      |          |                    |
      |          |                    +-> Gemini API Gateway (backend/ai.py)
      |          |                               |
      |          |                        HTTPS Google Gemini
      |          +-> File processor + upload storage (private)
      +-> SQLite database
             | users/sessions/classes/enrollments
             | files/chat_messages/saved_models
             | exams/attempts/exam_events/ai_usage

  Three.js -> WebGL 3D trong trình duyệt (các mô hình cấu trúc thật)
  Canvas 2D -> JavaScript formula-driven animations
```

### Quyết định công nghệ

- **Backend một origin:** tránh lộ key, đơn giản hóa cookie và CORS trong bản chạy đầu; frontend có thể chuyển React/Next.js nếu phát triển thêm.
- **SQLite:** phù hợp demo một máy, dễ kiểm thử; phải nâng lên PostgreSQL khi phục vụ nhiều người đồng thời và nhiều instance.
- **Gemini REST:** dùng `systemInstruction`, `contents`, `inlineData` với image/PDF và tùy chọn JSON; thay nhà cung cấp bằng gateway riêng, không phải sửa giao diện.
- **Không giả AI:** thiếu khóa => 503 giải thích rõ, không có dữ liệu mẫu được đưa ra như phản hồi AI.
- **Giáo viên và học sinh tách bởi quyền API:** frontend không phải hàng rào bảo mật. Mỗi thao tác nhạy cảm đều xác minh quyền từ session trong SQLite.
- **Tài liệu:** văn bản trích xuất cho Office/TXT; ảnh/PDF gốc gửi đến Gemini để phân tích thị giác trong phạm vi cho phép.

### Lược đồ dữ liệu

| Bảng | Mục đích |
|---|---|
| users | Danh tính, mật khẩu hash, vai trò và lớp |
| sessions | Băm token phiên, thời hạn |
| classrooms | Lớp học thuộc giáo viên, mã tham gia |
| enrollments | Quan hệ học sinh-lớp |
| files | Metadata và văn bản trích xuất cho từng chủ sở hữu |
| chat_messages | Lịch sử chat tách theo người dùng |
| saved_models | JSON hình học hoặc lựa chọn mô hình hóa học |
| exams | Đề và đáp án riêng trong server, trạng thái, mã truy cập |
| attempts | Bài làm học sinh, thời gian server, trạng thái, điểm |
| exam_events | Các sự kiện trình duyệt trong quá trình làm bài |
| ai_usage | Rate limit chi phí Gemini theo tài khoản |

## Lộ trình theo đặc tả gốc

**Giai đoạn 1:** Nền tảng backend, login, lớp học, phân quyền và UI — đã có MVP.

**Giai đoạn 2:** Gia sư Gemini, tài liệu và lịch sử — đã có cơ sở chạy thật; cần nguồn giáo dục và kiểm thử AI trên bộ đề chuẩn.

**Giai đoạn 3:** Hình học 3D — đã có 7 khối và sửa tọa độ; cần công cụ quan hệ, điểm trên mặt/cạnh, mặt phẳng và chia sẻ.

**Giai đoạn 4:** Vật lý 50 mô phỏng và Hóa học 50 cấu trúc — đã có 6 + 10; phải hoàn thiện thêm từng mô hình và xác minh bằng nguồn chuyên ngành.

**Giai đoạn 5:** Chấm bài AI và OCR — đã có lối vào Gemini Vision; cần hệ thống đánh dấu OCR không chắc chắn và rubric có cấu trúc, duyệt giáo viên.

**Giai đoạn 6:** Phòng thi trực tuyến — đã có tạo đề, mã, tham gia, tự lưu, nộp, ghi nhận sự kiện và giáo viên chấm; cần thời gian bắt đầu/kết thúc, giới hạn số lượt, analytics và báo cáo.

**Giai đoạn 7:** QA, kiểm thử hiệu năng, bảo mật và bảo vệ dữ liệu trẻ em — đang triển khai, chưa đạt tiêu chuẩn công bố ra Internet.
