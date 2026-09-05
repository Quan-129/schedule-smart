# AGENTS.MD - NGUYÊN TẮC PHÁT TRIỂN & KIẾN TRÚC DỰ ÁN 🤖

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive (Smart Schedule & Drive Backpack)

Toàn bộ AI Agent hoạt động trên repository này phải tuân thủ nghiêm ngặt các nguyên tắc sau:

1. **Ngôn ngữ phản hồi**: Luôn luôn trả lời bằng Tiếng Việt.
2. **Kiến trúc 5 Tầng Mô-đun (`src/`)**:
   - `src/1.Frontend/`: Giao diện, Components, Views, CSS Modules, User Event handlers.
   - `src/2.Backend/`: Thuật toán tính điểm mục tiêu, Parser thời khóa biểu, Date Helpers.
   - `src/3.Database/`: State Management trung tâm, LocalStorage Engine, Seed Data.
   - `src/4.Security/`: Hàm làm sạch dữ liệu `escapeHtml`, URL Validators.
   - `src/5.Performance/`: Service Worker PWA Manager, Visibility Optimizer.
3. **Cơ chế cập nhật tài liệu**:
   - Ghi nhận lịch sử làm việc vào `docs/0.Log/WORKLOG.md` theo skill `update-worklog`.
   - Trích xuất điểm độc đáo / ý tưởng vào `docs/0.Log/MARKETING_LOG.md` theo skill `update-new-in4`.
   - Khi có thay đổi kiến trúc, cập nhật `docs/` tương ứng.
4. **Deploy & Static Hosting**: Giữ nguyên cơ chế Zero-Dependency ES Modules để chạy mượt mà trên GitHub Pages.
