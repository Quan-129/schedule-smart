# AGENTS.MD - NGUYÊN TẮC PHÁT TRIỂN, TỐI ƯU TOKEN & KIẾN TRÚC DỰ ÁN 🤖

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive (Smart Schedule & Drive Backpack)

Toàn bộ AI Agent hoạt động trên repository này **BẮT BUỘC PHẢI TỰ ĐỘNG TUÂN THỦ** các nguyên tắc sau trong mọi phiên làm việc:

---

## ⚡ 1. NGUYÊN TẮC CHUNG & TỰ ĐỘNG HÓA KỸ NĂNG (PROACTIVE AUTOMATION)
1. **Ngôn ngữ phản hồi**: Luôn luôn trả lời bằng **Tiếng Việt**.
2. **Tự động kích hoạt Skill & Rule**: Tự động áp dụng các skill tương ứng (`update-worklog`, `update-new-in4`, `9-more-archiver`, các skill chuyên môn 1–8) khi phát sinh tác vụ mà **không cần người dùng phải yêu cầu**.
3. **Deploy & Static Hosting**: Giữ nguyên cơ chế Zero-Dependency Native ES Modules (`type="module"`) để ứng dụng chạy mượt mà ngay trên GitHub Pages mà không cần build step.

---

## 🚀 2. TỐI ƯU HÓA TOKEN & ĐỌC HIỂU NGỮ CẢNH (TOKEN OPTIMIZATION)
1. **Targeted Retrieval**: Luôn dùng `grep_search` định vị vị trí trước khi đọc code. Giới hạn `view_file` trong khoảng 50–150 dòng quanh vùng cần sửa.
2. **Surgical Edits**: Ưu tiên sử dụng `replace_file_content` sửa chính xác từng khối dòng thay vì ghi đè lại file lớn.
3. **Fast Context Recovery**: Khi bắt đầu phiên hoặc sau khi context bị nén, chỉ cần đọc 25 dòng đầu của `docs/0.Log/WORKLOG.md` để nắm trạng thái mới nhất.
4. **Dọn dẹp file rác**: Tự động xóa ngay mọi file tạm (`temp_*`, scratch files) sau khi xử lý xong.

---

## 🏛 3. KIẾN TRÚC 5 TẦNG MÔ-ĐUN (`src/`), MODULAR CSS & APP SHELL
Mọi file mã nguồn phải nằm đúng trong 5 tầng và giữ mỗi file < 250–300 dòng:
- `index.html`: **App Shell Tối Giản (< 120–150 dòng)**. Chỉ giữ vai trò khung sườn DOM chính (`#app-root`, `#modal-root`), nạp thẻ meta, styles và script. Tuyệt đối không hardcode hàng trăm dòng modal/template tĩnh trong HTML.
- `src/1.Frontend/`: Giao diện, Components, Views, User Event handlers.
  * **Component Template Modules (`src/1.Frontend/components/`)**: Toàn bộ Modals và Sub-views phức tạp phải được đóng gói thành các Component JS độc lập (tự render template và gắn sự kiện).
  * **Modular CSS (`src/1.Frontend/styles/`)**: Toàn bộ CSS bắt buộc phải chia nhỏ theo từng Component / View (ví dụ: `1.variables.css`, `2.navbar.css`, `3.timetable-grid.css`, `4.grade-solver.css`, `5.backpack-drive.css`, `6.modals.css`, `7.markdown-editor.css`, `8.responsive.css`).
  * **Tuyệt đối không dồn CSS hoặc HTML vào một file khổng lồ**: Giúp tối ưu 90% token AI (chỉ đọc/sửa đúng file cần thiết ~100–250 dòng), ngăn ngừa xung đột style và tăng tốc độ tải HTTP/2.
- `src/2.Backend/`: Thuật toán tính điểm mục tiêu, Parser thời khóa biểu, Date Helpers (Pure Functions).
- `src/3.Database/`: State Management trung tâm, LocalStorage Engine, Seed Data, Firebase Auth.
- `src/4.Security/`: Hàm làm sạch dữ liệu `escapeHtml`, URL Validators.
- `src/5.Performance/`: Service Worker PWA Manager, Visibility Optimizer.

---

## 📁 4. CẬP NHẬT TÀI LIỆU & THU GOM (`docs/`)
1. **Ghi nhật ký kỹ thuật**: Tự động ghi vào `docs/0.Log/WORKLOG.md` theo skill `update-worklog`.
2. **Ghi nhật ký tiếp thị**: Tự động trích xuất USP/Hook vào `docs/0.Log/MARKETING_LOG.md` theo skill `update-new-in4`.
3. **Thu gom tài liệu (`docs/9.More/`)**: Thư mục gốc chỉ chứa `README.md` và `AGENTS.md`. Mọi file `.md` phát sinh khác phải tự động chuyển vào `docs/9.More/` kèm file mục lục `docs/9.More/README.md` theo skill `9-more-archiver`.

---

## 🎨 5. QUY CHUẨN TRÌNH BÀY MÃ NGUỒN & THẨM MỸ (CODE PRESENTATION & STYLING STANDARDS)
1. **Cấu trúc File & Phân đoạn (Banner Comments)**: Mọi file JS phải chia rõ các phần bằng comment phân đoạn: `1. IMPORTS`, `2. CONSTANTS`, `3. TEMPLATES / DOM`, `4. EVENT HANDLERS`, `5. EXPORTS`.
2. **Định dạng Code Sạch (Clean Code)**: Thụt lề chuẩn 2 spaces, bắt buộc dấu chấm phẩy `;` cuối câu, ngoặc nhọn 1TBS, biến/hàm `camelCase`, components `PascalCase.js`, hằng số `UPPER_SNAKE_CASE`.
3. **Template HTML trong JS**: Thụt lề thẻ lồng nhau theo đúng phân cấp DOM (2 spaces), bắt buộc bọc biến động qua `${escapeHtml()}`, dùng Semantic HTML5 (`<section>`, `<details>`, `<summary>`), không dùng inline style tĩnh.
4. **Chú thích & JSDoc**: Viết bằng Tiếng Việt, giải thích lý do (Why) thay vì cú pháp (What), JSDoc chuẩn cho mọi hàm và class quan trọng.
5. **Giao diện & UI/UX**: Dark mode cao cấp, Glassmorphism, CSS Tokens bảng màu hài hòa, phông chữ `Inter`/`JetBrains Mono`, micro-animations và responsive (`.agents/rules/presentation_rules.md`).
6. **Phản hồi của AI**: Luôn trả lời bằng **Tiếng Việt**, trực diện, súc tích, gắn link markdown chuẩn `file:///` cho mọi file mã nguồn và hàm/class được đề cập.


