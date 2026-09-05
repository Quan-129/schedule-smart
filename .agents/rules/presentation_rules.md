# QUY TẮC TRÌNH BÀY & TIÊU CHUẨN THẨM MỸ (PRESENTATION & CODE STYLING RULES) 🎨

Tất cả AI Agent khi làm việc trên repository này **BẮT BUỘC** phải tuân thủ nghiêm ngặt các quy tắc trình bày sau:

---

## 🎨 1. QUY CHUẨN TRÌNH BÀY GIAO DIỆN & THẨM MỸ (UI/UX AESTHETICS)

1. **Thẩm mỹ Cao cấp & Hiện đại (Premium Aesthetics)**:
   - Áp dụng triệt để Dark Mode sang trọng kết hợp hiệu ứng **Glassmorphism** (`backdrop-filter: blur()`), viền mờ tinh tế (`border: 1px solid rgba(...)`), và đổ bóng đa tầng (`box-shadow: var(--shadow-...)`).
   - Sử dụng bảng màu phối hợp hài hòa (Curated Palette) thông qua CSS Variables trong `1.variables.css` (Emerald `#10b981`, Indigo `#6366f1`, Sky Blue `#0ea5e9`, Neon Amber `#f59e0b`). Tuyệt đối không dùng mã màu thô (plain red, green, blue).
2. **Kiểu chữ & Typography**:
   - Sử dụng phông chữ hiện đại: `Inter` / `Outfit` cho giao diện chính, `JetBrains Mono` / `Fira Code` cho khối mã lệnh và phím tắt.
   - Đảm bảo độ tương phản (contrast ratio) đạt chuẩn WCAG AA cho khả năng đọc tốt trong mọi điều kiện ánh sáng.
3. **Trải nghiệm Tương tác & Micro-animations**:
   - Mọi nút bấm, card, node tương tác đều phải có hiệu ứng Hover, Active, Focus mượt mà (`transition: all 0.2s cubic-bezier(...)`).
   - Sử dụng hiệu ứng phản hồi xúc giác thị giác (Visual Haptics): Glow ánh sáng khi active, rung nhẹ jiggle khi xóa, sóng nước ripple.
4. **Chuẩn Responsive & Đa Thiết bị**:
   - Mọi giao diện và component phải hiển thị hoàn hảo trên Mobile (< 768px), Tablet (768px–1024px) và Desktop (> 1024px).
   - Đặt toàn bộ media queries trong `src/1.Frontend/styles/8.responsive.css`.

---

## 💻 2. QUY CHUẨN TRÌNH BÀY MÃ NGUỒN & COMPONENT (CODE & TEMPLATE STYLING)

1. **Semantic HTML5 & Cấu trúc Template**:
   - Sử dụng các thẻ ngữ nghĩa: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<details>`, `<summary>`, `<dialog>`, `<footer>`.
   - Đặt ID duy nhất và có ý nghĩa rõ ràng cho các phần tử tương tác (phục vụ kiểm thử và truy xuất).
   - Đặt tên CSS Class theo chuẩn `kebab-case` hoặc `BEM` (ví dụ: `git-guide-section`, `guide-accordion`, `modal-header__title`).
2. **Định dạng Code Sạch (Clean Code Standards)**:
   - Thụt đầu dòng 2 spaces, dấu chấm phẩy rõ ràng, đặt tên biến/hàm theo `camelCase` mang tính tự diễn đạt (self-documenting).
   - Hàm và Class phải có JSDoc tóm tắt mục đích, tham số và giá trị trả về.
3. **Đóng gói Component Độc lập (Component Encapsulation)**:
   - Mỗi component trong `src/1.Frontend/components/` chỉ chịu trách nhiệm render template của chính nó và lắng nghe các sự kiện cục bộ.
   - Tuyệt đối không hardcode template dài vào `index.html` hoặc `main.js`.

---

## 💬 3. QUY CHUẨN TRÌNH BÀY PHẢN HỒI CỦA AI (AGENT RESPONSE & COMMUNICATION)

1. **Ngôn ngữ phản hồi**: 100% bằng **Tiếng Việt**.
2. **Trực diện & Súc tích**: Trả lời thẳng vào kết quả công việc, nêu rõ những gì đã làm, không giải thích dài dòng lan man.
3. **Định dạng Liên kết File Chuẩn**:
   - Mọi file và ký hiệu code khi nhắc đến trong phản hồi **BẮT BUỘC** phải gắn markdown link chuẩn `file:///` để người dùng có thể nhấp mở trực tiếp:
     - `[tên_file.js](file:///c:/Users/Acer/Documents/Dự án ma/tools_3/path/to/file.js)`
     - `[HàmHoặcClass](file:///c:/Users/Acer/Documents/Dự án ma/tools_3/path/to/file.js#L10-L25)`
4. **Không lặp lại Code dư thừa**:
   - Không in lại toàn bộ file code nếu chỉ sửa vài dòng; sử dụng diff block hoặc giải thích ngắn gọn kèm liên kết file.
