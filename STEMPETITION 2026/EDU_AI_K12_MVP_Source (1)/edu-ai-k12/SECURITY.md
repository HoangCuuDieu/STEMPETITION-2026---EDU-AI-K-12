# An toàn bảo mật và quyền riêng tư

- **API key:** tuyệt đối không commit `.env`, không đưa token lên trình duyệt, không xuất trong log hoặc ảnh demo. Khóa từng xuất hiện công khai phải bị thu hồi/tạo lại.
- **Học sinh là người chưa thành niên:** không thu thập dữ liệu cá nhân không cần thiết; cần chính sách thông báo, sự đồng ý phù hợp và tuân thủ quy định pháp luật hiện hành trước khi dùng thật.
- **Tải tài liệu:** người tải phải có quyền với dữ liệu. File hình ảnh/PDF mà học sinh gửi cho AI sẽ được chuyển đến nhà cung cấp Gemini; cần thông báo rõ và sự chấp thuận thích hợp.
- **Mật khẩu:** dùng `hashlib.scrypt` có salt ngẫu nhiên, không lưu plaintext.
- **Phiên:** token ngẫu nhiên, chỉ lưu SHA-256 token trong DB, cookie HttpOnly + SameSite Lax, cần Secure khi chạy HTTPS.
- **Phân quyền:** máy chủ xác minh vai trò và chủ sở hữu; UI ẩn menu không thay thế được phân quyền API.
- **Bài kiểm tra:** JSON gửi cho học sinh loại bỏ trường đáp án và giải thích trước khi nộp; các API xem đáp án chỉ cho giáo viên chủ sở hữu.
- **Chống CSRF:** mọi yêu cầu mutation /api phải mang custom header X-Requested-With; site không mở CORS tùy tiện.
- **Hạn chế:** tài liệu <=8 MB, tối đa 80 trang PDF cho parser, giới hạn Office trước giải nén, giới hạn kí tự; AI calls có rate limit trên backend.
- **Không khẳng định giám sát tuyệt đối:** event tab/hidden chỉ là tín hiệu; không kết luận gian lận từ một sự kiện.

## Việc phải làm trước khi triển khai công khai

1. HTTPS, reverse proxy, cấu hình security headers CSP và tối thiểu HSTS.
2. Xác thực email, chống thử mật khẩu hàng loạt, quản lý mã mời theo giáo viên.
3. Chính sách lưu/xóa dữ liệu, cơ chế xóa tài khoản và toàn bộ dữ liệu liên quan, phân quyền quản trị dữ liệu.
4. Sao lưu và mã hóa khi lưu trữ, mã hóa bucket upload.
5. Bảo vệ trước kiểm tra phần mềm độc hại tại upload và nâng cấp parser sandbox đối với tài liệu chưa tin cậy.
6. Kiểm toán và test thâm nhập bảo mật; nâng cấp SQL migrations/PostgreSQL.
7. Xác minh mô hình AI, an toàn lứa tuổi và cơ chế giáo viên/nhân sự hỗ trợ trong tình huống khẩn cấp.
8. Rà soát chính sách xử lý dữ liệu của bên thứ ba và quy định quyền riêng tư trẻ em tại khu vực triển khai.
