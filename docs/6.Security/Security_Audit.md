# BÁO CÁO RÀ SOÁT & KẾ HOẠCH BẢO MẬT (SECURITY AUDIT & PLAN) 🔒

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive  
> **Trạng thái**: Giai đoạn 2 Planning (Chờ phê duyệt triển khai mã nguồn)  
> **Người phụ trách**: `Security Employee (AI Agent)`

---

## 🛡 1. BÁO CÁO ĐÁNH GIÁ LỖ HỔNG & RỦI RO TIỀM ẨN

| Hạng Mục Rà Soát | Mức Độ Rủi Ro | Mô Tả Hiện Trạng | Giải Pháp Bảo Mật Đề Xuất (Giai đoạn 2) |
| :--- | :---: | :--- | :--- |
| **XSS (Cross-Site Scripting)** | **Trung bình** | Người dùng nhập tên môn học, mã môn hoặc link Drive qua Modal $\rightarrow$ render trực tiếp vào DOM. | Triển khai HTML Entity Sanitization (hàm `escapeHtml()`) trước khi inject vào innerHTML. |
| **Link Injection / Phishing** | **Thấp** | Trường liên kết Google Drive có thể bị chèn URL độc hại (`javascript:alert(1)`). | Kiểm tra regex giao thức URL bắt buộc phải là `https://` và thuộc whitelist domain `drive.google.com`. |
| **Lưu trữ dữ liệu nhạy cảm** | **Thấp** | Điểm số và thông tin cá nhân lưu trữ dạng Plaintext trong `localStorage`. | Nếu nâng cấp Cloud Sync, triển khai mã hóa AES-256 phía client trước khi gửi lên API. |
| **Bảo vệ PWA Content Security Policy (CSP)** | **Thấp** | Thiếu cấu hình thẻ meta CSP nghiêm ngặt để chặn tải script từ bên thứ 3 trái phép. | Thêm `<meta http-equiv="Content-Security-Policy" content="...">` trong `index.html`. |

---

## 📋 2. KẾ HOẠCH BẢO MẬT GIAI ĐOẠN 2 KHI ĐƯỢC PHÊ DUYỆT

1. **Bước 1**: Áp dụng hàm làm sạch đầu vào (Sanitize Input) cho tất cả các Form Modal (Thêm/Sửa môn học, link Drive).
2. **Bước 2**: Xác thực chặt chẽ URL Google Drive (`https://drive.google.com/...`) ngăn chặn URL chuyển hướng độc hại.
3. **Bước 3**: Thiết lập bộ nguyên tắc Content Security Policy (CSP) chặn triệt để mã độc XSS.
