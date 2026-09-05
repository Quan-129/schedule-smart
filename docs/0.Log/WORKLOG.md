# NHẬT KÝ CÔNG VIỆC DỰ ÁN (DEV WORKLOG) 🛠

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive (Smart Schedule & Drive Backpack)  
> **Repository**: `Quan-129/schedule-smart`  
> **Nguyên tắc quản lý**: Cập nhật tự động sau mỗi phiên làm việc hoặc thay đổi tính năng. Phiên mới nhất luôn nằm ở trên cùng.

## 📅 [2026-09-05 14:40] - Tối Ưu Hóa Responsive Layout Toàn Diện Cho Modal, Form & Controls Trên Mobile/Tablet

- **🎯 Mục tiêu**:
  - Đảm bảo toàn bộ hệ thống Modal ("Thêm Tuần Học Mới", "Thêm Môn Học Mới", "Chỉnh Sửa Môn & Điểm"), Forms và Grid hiển thị hoàn hảo, không bị tràn viền hay xô lệch trên các kích thước màn hình nhỏ (Mobile 360px–600px, Tablet 600px–900px).

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / CSS Grid]` Thiết lập class `.modal-grid-2col` hỗ trợ chia 2 cột trên desktop và tự động co thành 1 cột mượt mà trên mobile (< 540px).
  - `[Frontend / Responsive Specs]` Bổ sung media queries chi tiết cho `.modal-backdrop`, `.modal-card`, `.modal-header`, `.modal-form`, `.modal-nav-tabs`, `.modal-footer` và các form inputs:
    + Căn chỉnh padding, font-size, touch target của nút bấm và input tối ưu cho thao tác chạm trên điện thoại.
    + Giới hạn chiều cao và thanh cuộn tự động thích ứng với viewport chiều dọc (`calc(90vh - 150px)`).
  - `[Performance / PWA]` Nâng cấp `CACHE_NAME` lên `smart-schedule-modular-v15` trong `sw.js`.

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - Thiết kế Mobile-First Fluid Adapting: loại bỏ hoàn toàn các inline-style cố định, sử dụng hệ thống token và class linh hoạt.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Toàn bộ hệ thống Modal và Form đã đạt chuẩn responsive 100% trên mọi thiết bị.
  - [x] Sẵn sàng commit và push lên GitHub remote.

---

## 📅 [2026-09-05 14:22] - Nâng Cấp Thẩm Mỹ UI Cao Cấp Cho Toàn Bộ Form & Modal Controls

- **🎯 Mục tiêu**:
  - Khắc phục triệt để tình trạng các trường nhập liệu (`input[type="text"]`, `input[type="date"]`, `input[type="url"]`, `textarea`) bị vỡ hoặc rơi về style mặc định thô cứng của trình duyệt trong Modal "Thêm Tuần Học Mới" và Modal "Thêm Môn Học Mới".
  - Mang lại trải nghiệm thị giác cao cấp (Rich Aesthetics), hiện đại với hiệu ứng Emerald Glow, font chữ sắc nét, icon trực quan và thanh cuộn tùy chỉnh siêu mượt.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / CSS System]` Bổ sung hệ thống định dạng `.form-group-styled` toàn diện: nền kính mờ `rgba(15, 23, 42, 0.6)`, bo góc `12px` mềm mại, viền kính siêu mỏng, hiệu ứng hover/focus viền xanh ngọc `emerald` kèm bóng đổ neon glow đa tầng.
  - `[Frontend / CSS & PWA]` Đồng bộ hóa `color-scheme: dark` và tùy biến biểu tượng lịch cho ô chọn ngày (`<input type="date">`), loại bỏ hoàn toàn các control mặc định xám xịt của trình duyệt.
  - `[Frontend / Components]` Thiết lập custom scrollbar tinh tế cho ô soạn thảo Markdown (`textarea`) và nội dung modal, sử dụng font `JetBrains Mono` cho mã ID và mã Markdown.
  - `[Frontend / Markup]` Tinh chỉnh `index.html`: bổ sung icon nhận diện chuyên nghiệp cho từng label, dấu sao bắt buộc `required-star`, nút sao chép tuần học dạng pill-chip trang nhã và nâng cấp nút submit gradient.
  - `[Performance / PWA]` Nâng cấp `CACHE_NAME` lên `smart-schedule-modular-v14` trong `sw.js` để người dùng nhận ngay giao diện mới nhất.

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - Thiết kế thích ứng kép (Dual Theme Support): hỗ trợ đồng bộ hoàn hảo cho cả Dark Mode (`theme-dark`) và Light Mode (`theme-light`).

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Giao diện modal Thêm tuần học và Thêm môn học đã đạt chuẩn thiết kế cao cấp, đồng bộ và chuyên nghiệp.
  - [x] Đã cập nhật nhật ký dự án và cache PWA.

---

## 📅 [2026-09-05 14:10] - Thiết Lập Bộ Quy Chuẩn Tối Ưu Token & Cơ Chế Tự Động Kích Hoạt Kỹ Năng (Proactive Skill Automation)

- **🎯 Mục tiêu**:
  - Tối ưu hóa tối đa chi phí tiêu thụ token và nâng cao khả năng đọc hiểu ngữ cảnh cho AI Agent trong suốt quá trình phát triển dự án.
  - Thiết lập cơ chế tự động kích hoạt các kỹ năng (`update-worklog`, `update-new-in4`, `9-more-archiver`, các skill chuyên môn 1–8) và các nguyên tắc kiến trúc mà không cần người dùng nhắc nhở thủ công.

- **✅ Công việc đã hoàn thành**:
  - `[Agent System / Rules]` Tạo mới tài liệu `.agents/rules/token_optimization_rules.md` quy định chi tiết 4 trụ cột tối ưu: *Targeted Retrieval* (`grep_search` + slice `view_file`), *Surgical Edits* (`replace_file_content`), *Fast Context Recovery* (25 dòng đầu `WORKLOG.md`), và *Proactive Automation*.
  - `[Agent System / Core Rules]` Cập nhật `AGENTS.md` thành trung tâm điều phối hành vi tự động cho toàn bộ Agent: bắt buộc phản hồi Tiếng Việt, tự động ghi log kỹ thuật/tiếp thị, dọn dẹp file thừa và duy trì kiến trúc 5 tầng mã nguồn.

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - *Autonomous Workflow Policy*: Mọi phiên làm việc từ nay sẽ tự động kích hoạt chu trình khép kín: Thực hiện thay đổi -> Kiểm tra quy chuẩn 5 tầng -> Cập nhật `WORKLOG.md` & `MARKETING_LOG.md` -> Thu gom tài liệu thừa vào `docs/9.More/`.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Đã hoàn tất cấu hình Rules và Skills tự động.
  - [x] Đã chuẩn bị sẵn sàng để commit và push lên GitHub.

---

## 📅 [2026-09-05 13:59] - Tích Hợp Nút (+) & Modal Tạo Tuần Học Mới Ngay Trên Giao Diện

- **🎯 Mục tiêu**:
  - Bổ sung nút (+) trên thanh chọn tuần và tùy chọn `➕ Thêm tuần mới...` ở cuối dropdown tuần học để người dùng có thể dễ dàng tạo thêm tuần học mới bất kỳ lúc nào.
  - Tự động gợi ý tên tuần tiếp theo (VD: Tuần 51), ngày bắt đầu, và tự sinh khung lịch Markdown mẫu 7 ngày.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend/HTML]` Thêm nút `#btn-add-week-modal` vào `.week-navigation` và tạo Modal `#add-week-modal` trong `index.html`.
  - `[Frontend/CSS]` Cập nhật `style.css`: Thêm kiểu dáng phát sáng `.btn-add-week-nav` và giao diện Form thêm tuần học.
  - `[Frontend/Logic]` Nâng cấp `main.js`: Xây dựng `initAddWeekModal()`, tự tính toán số tuần tiếp theo, hỗ trợ sao chép Markdown từ tuần trước, lưu trữ `smart_schedule_custom_weeks` và `smart_schedule_custom_md_*` vào LocalStorage và nạp tuần mới vào dropdown.
  - `[Config / DevOps]` Nâng cấp Service Worker Cache lên `smart-schedule-modular-v13` trong `sw.js`.

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - *Dynamic Weeks Storage*: Kết hợp danh sách tĩnh từ `schedules/index.json` và các tuần tùy biến từ `LocalStorage` giúp ứng dụng hoàn toàn linh hoạt mà vẫn duy trì cơ chế chạy Offline Zero-backend.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Tính năng Thêm Tuần mới hoạt động mượt mà, lưu trữ bền vững trên trình duyệt.
  - [x] Đã đồng bộ và đẩy lên GitHub Pages.

---

## 📅 [2026-09-05 13:36] - Thiết Kế Lại Modal Chỉnh Sửa Môn Học Thành 3 Phần Chuyên Nghiệp (Segmented Tab Bar)

- **🎯 Mục tiêu**:
  - Tái cấu trúc Modal Chỉnh sửa Môn học thành 3 phần rõ ràng, khắc phục hiện tượng dồn nén, rớt dòng nút xóa (-) và mất cân đối giao diện.
  - Xây dựng thanh điều hướng 3 Tab dạng Segmented Pill: **1. Google Drive**, **2. Tỉ Lệ Điểm (%)**, **3. Quy Chế & Lưu Ý**.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend/HTML]` Nâng cấp `index.html`: Tạo thanh Tab `.modal-nav-tabs` với 3 Tab chuyên biệt, phân chia các pane `.modal-tab-pane` gọn gàng, thêm nút "Mở thử link Drive ↗" và các chip gợi ý nhanh (Preset chips).
  - `[Frontend/CSS]` Cập nhật `style.css`: Sửa lỗi rớt dòng nút xóa bằng bảng Grid 6 cột chuẩn (`28px 1fr 90px 105px 36px 36px`), căn chỉnh Header và Close button `[X]` cân đối, thêm hiệu ứng chuyển tab mượt mà.
  - `[Frontend/Components]` Nâng cấp `EditModal.js`: Xử lý chuyển tab tự động, gán preset ghi chú nhanh và mở tab phù hợp khi gọi từ Chiếc Cặp hoặc Bảng Điểm.
  - `[Config / DevOps]` Nâng cấp Service Worker Cache lên `smart-schedule-modular-v12` trong `sw.js`.

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - *3-Part Segmented Layout*: Thay vì dồn mọi thông tin vào một khung dọc dài gây chật chội, chia thành 3 phần độc lập giúp người dùng tập trung chỉnh sửa nhanh chóng mà không cần cuộn trang.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Modal 3 phần hiển thị đẹp mắt, trực quan và hiện đại.
  - [x] Đã đồng bộ và đẩy mã nguồn lên GitHub Pages.

---

## 📅 [2026-09-05 13:28] - Nâng Cấp Bộ Thoát Chế Độ Chỉnh Sửa Jiggle Mode (Nút Xong, Click Ngoài, Phím ESC)

- **🎯 Mục tiêu**:
  - Khắc phục tình trạng khi nhấn giữ bật chế độ Jiggle Mode (chỉnh sửa/xóa môn học) trong Chiếc Cặp mà không thấy nút thoát hoặc không có cách thoát.
  - Tích hợp 3 cơ chế thoát Jiggle Mode tiện lợi: Nút "✓ Xong" trên thanh tác vụ, Click vào khoảng trống nền, hoặc Nhấn phím `Escape`.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend/HTML]` Thêm nút `#bp-done-jiggle-btn` chuẩn styling `.btn-bp-done` và gắn ID `#backpack-hint-text` trong `index.html`.
  - `[Frontend/Views]` Nâng cấp `BackpackView.js`: Tự động bật/tắt hiển thị nút "✓ Xong", đổi text hướng dẫn động, bắt sự kiện click ngoài khoảng trống và lắng nghe sự kiện phím `Escape`.
  - `[Config / DevOps]` Nâng cấp Service Worker Cache lên `smart-schedule-modular-v11` trong `sw.js`.

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - *Multi-way Exit*: Cho phép người dùng thoát chế độ rung lắc bằng nhiều cử chỉ tự nhiên (chuột, phím, chạm) giúp trải nghiệm mượt mà giống hệt ứng dụng iOS/Android gốc.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Thoát Jiggle Mode hoạt động nhạy bén và ổn định trên mọi thiết bị.
  - [x] Đã đồng bộ và đẩy lên GitHub Pages.

---

## 📅 [2026-09-05 11:58] - Khôi Phục 100% Giao Diện CSS, Donut Charts & Đồng Bộ Markup Chuẩn `style.css`

- **🎯 Mục tiêu**:
  - Khắc phục triệt để lỗi mất định dạng CSS (lưới lịch học và bảng điểm bị vỡ, mất biểu đồ Donut và thanh thống kê) sau khi tách mô-đun 5 tầng.
  - Đồng bộ 100% cấu trúc HTML (`index.html`) và JavaScript DOM Generators (`TimetableGrid.js`, `GradesView.js`, `main.js`) khớp chuẩn với 2882 dòng CSS trong `style.css`.
  - Khôi phục đầy đủ các tính năng: Thẻ Hero Banner có đèn nhấp nháy, đếm số môn/tiết, bộ lọc tag màu môn học, chọn tuần, tìm kiếm trực tiếp và trình sửa Markdown.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend/HTML]` Cập nhật `index.html`: Khôi phục cấu trúc `.hero-left`, `.schedule-main-title`, `.next-class-card`, `.stats-row`, `.stat-pill`, `.brand-logo`, `.brand-info`, `.week-navigation`, `.today-timeline-wrapper`.
  - `[Frontend/Views]` Xây dựng lại `TimetableGrid.js` và `GradesView.js` với toàn bộ thẻ CSS gốc (`.day-card`, `.classes-list`, `.class-item`, `.grade-card`, `generateDonutChartSvg`, `.breakdown-item`, `.breakdown-bar`, `.breakdown-bar-fill`).
  - `[Frontend/Core]` Hoàn thiện `main.js`: Khởi tạo `initWeekSelector()` từ `schedules/index.json`, tính toán `updateNextClassBadge()`, `updateHeroStats()`, `renderSubjectFilters()`, `initSearchAndFilters()`, `initRawMarkdownEditor()`.
  - `[Config / DevOps]` Nâng cấp Service Worker Cache lên `smart-schedule-modular-v10` trong `sw.js`.

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - *Pixel-Perfect Consistency*: Giữ nguyên `style.css` gốc nguyên bản 2882 dòng và điều chỉnh toàn bộ mã nguồn JavaScript để xuất đúng từng selector CSS $\rightarrow$ Giao diện kính mờ Glassmorphism, hiệu ứng nảy nút và biểu đồ Donut hoạt động hoàn hảo.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Giao diện CSS và hiệu ứng khôi phục 100% rực rỡ, chuẩn phong cách hiện đại.
  - [x] Các tính năng lọc, tìm kiếm, chỉnh sửa môn học và chuyển tab hoạt động trơn tru.

## 📅 [2026-09-05 11:30] - Đóng Gói Module `FirebaseAuthService` & Kết Nối Cổng Đăng Nhập Google

- **🎯 Mục tiêu**:
  - Khắc phục lỗi bấm nút Đăng nhập bằng Google không phản hồi sau khi tái cấu trúc mô-đun.
  - Tách logic xác thực thành module độc lập `src/3.Database/auth/FirebaseAuthService.js`.
  - Nạp lại Firebase SDKs tương thích và kết nối điều hướng tự động giữa Màn hình Đăng nhập và Màn hình Chính.

- **✅ Công việc đã hoàn thành**:
  - `[Auth]` Xây dựng `src/3.Database/auth/FirebaseAuthService.js` xử lý `handleGoogleLogin()`, `handleLogout()`, `updateAuthUI()`, và lắng nghe đồng bộ Realtime Firestore.
  - `[Frontend]` Thêm lại Firebase SDK scripts vào `index.html` và gọi `initFirebaseAuth()` trong `main.js`.
  - `[Config / DevOps]` Cập nhật Service Worker lên `smart-schedule-modular-v9`.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Đăng nhập Google hoạt động mượt mà, tự động mở ứng dụng sau khi đăng nhập.
  - [x] Đã thử nghiệm chế độ fallback offline an toàn.

---

## 📅 [2026-09-05 11:23] - Thiết Lập Skill `9-more-archiver` & Quản Lý Tập Trung Tài Liệu Bổ Sung Trong `docs/9.More/`

- **🎯 Mục tiêu**:
  - Tạo skill `9-more-archiver` để tự động phát hiện, thu gom các file `.md` phát sinh ở thư mục gốc vào `docs/9.More/`.
  - Thiết lập file mục lục tổng hợp `docs/9.More/README.md` tóm tắt chi tiết, dễ hiểu mọi tài liệu lưu trữ.
  - Bổ sung quy tắc bắt buộc vào `.agents/rules/architecture_rules.md` và `AGENTS.md` để toàn bộ Agent luôn tuân thủ việc giữ thư mục gốc tinh gọn.

- **✅ Công việc đã hoàn thành**:
  - `[Skill]` Tạo `.agents/skills/9-more-archiver/SKILL.md` và `.agents/skills/9-more-archiver/resources/MORE_INDEX_TEMPLATE.md`.
  - `[Docs]` Khởi tạo thư mục `docs/9.More/` kèm file mục lục báo cáo [docs/9.More/README.md](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/docs/9.More/README.md).
  - `[Archive]` Thu gom an toàn `implementation_plan.md` và `walkthrough.md` từ thư mục gốc vào `docs/9.More/` và dọn dẹp sạch sẽ thư mục gốc.
  - `[Rules]` Cập nhật quy tắc bắt buộc trong [architecture_rules.md](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/.agents/rules/architecture_rules.md) và [AGENTS.md](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/AGENTS.md).

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - *Clean Root Policy*: Thư mục gốc chỉ lưu giữ `README.md` và `AGENTS.md` giúp cấu trúc repo luôn sạch đẹp, chuyên nghiệp theo chuẩn quốc tế.
  - *Centralized Docs Index*: File `docs/9.More/README.md` giúp người dùng và Agent tra cứu lại các quyết định, thiết kế cũ trong 3 giây.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Thiết lập thành công Skill `9-more-archiver` và tích hợp Rule.
  - [x] Đã dọn dẹp thư mục gốc và khởi tạo `docs/9.More/`.
  - [ ] Sẵn sàng cho các phiên làm việc phát triển tính năng mới.

- **🎯 Mục tiêu**:
  - Phân rã mã nguồn monolithic thành 5 tầng mô-đun hóa sạch sẽ (`src/1.Frontend/`, `src/2.Backend/`, `src/3.Database/`, `src/4.Security/`, `src/5.Performance/`).
  - Thiết lập bộ quy tắc bắt buộc `.agents/rules/architecture_rules.md` và `AGENTS.md` để AI Agent luôn tuân thủ cấu trúc này.
  - Sử dụng Native ES Modules (`type="module"`), không phụ thuộc bundler, deploy tức thì lên GitHub Pages.

- **✅ Công việc đã hoàn thành**:
  - `[Architecture]` Thiết lập thư mục `src/` và phân chia 5 tầng chuyên môn độc lập.
  - `[Security]` Xây dựng `src/4.Security/sanitizer.js` (`escapeHtml`) và `src/4.Security/urlValidator.js`.
  - `[Database]` Xây dựng `src/3.Database/state.js` (Reactive State), `src/3.Database/storage/LocalStorageEngine.js` và `src/3.Database/storage/SeedData.js`.
  - `[Backend]` Xây dựng `src/2.Backend/services/GradeSolverService.js`, `src/2.Backend/services/TimetableParser.js` và `src/2.Backend/utils/dateHelpers.js`.
  - `[Frontend]` Xây dựng `src/1.Frontend/components/CircularNode.js`, `EditModal.js`, `Toast.js`, `BackpackView.js`, `GradesView.js`, `TimetableGrid.js` và `main.js`.
  - `[Performance]` Xây dựng `src/5.Performance/pwaManager.js`, `visibilityOptimizer.js` và nâng cấp Service Worker lên `smart-schedule-modular-v8`.
  - `[Rules]` Thiết lập `.agents/rules/architecture_rules.md` và `AGENTS.md`.

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - *Native ES Modules*: Không sử dụng Webpack/Vite build step phức tạp $\rightarrow$ Git push lên GitHub Pages là chạy ngay lập tức.
  - *Pure Logic Separation*: Toàn bộ thuật toán tính điểm và phân tích lịch học ở tầng Backend là Pure Functions, không chạm vào DOM $\rightarrow$ dễ dàng test và bảo trì.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Tái cấu trúc 100% mã nguồn theo kiến trúc 5 tầng.
  - [x] Kiểm thử toàn bộ giao diện và chức năng.
  - [ ] Khảo sát mở rộng đồng bộ Google Calendar API.

- **🎯 Mục tiêu**:
  - Sửa triệt để lỗi nút cây bút vàng (✏️) không xuất hiện khi người dùng kích hoạt chế độ nhấn giữ (Jiggle Mode).
  - Tối ưu hóa vị trí hiển thị song song của 2 nút: Nút Đỏ Xóa `(-)` (góc trên-trái) và Nút Vàng Sửa `(✏️)` (góc trên-phải) trên ô tròn môn học.

- **✅ Công việc đã hoàn thành**:
  - `[Bugfix]` Loại bỏ quy tắc CSS cũ `.is-jiggle-mode .btn-edit-node-pencil { display: none !important; }` trong `style.css`.
  - `[UI/UX]` Cập nhật style nổi bật cho `.btn-edit-node-pencil` với gradient vàng hổ phách, hiệu ứng nảy `badgePopIn` và `display: flex !important;` khi ở Jiggle Mode.
  - `[Config / DevOps]` Tăng phiên bản bộ đệm Service Worker lên `smart-schedule-backpack-v7` trong `sw.js`.

---

## 📅 [2026-09-05 10:25] - Nâng Cấp Circular Node Donut Ring & Chế Độ Jiggle Mode Tinh Gọn

- **🎯 Mục tiêu**:
  - Chuyển đổi các node môn học trong Chiếc Cặp sang dạng hình tròn (Circular Nodes) có vòng Donut % điểm bao quanh.
  - Tích hợp chỉnh sửa tỉ lệ điểm động (GK, CK, BTL, v.v.) trực tiếp trong Modal môn học.
  - Tinh giản giao diện: Ẩn toàn bộ nút sửa ✏️ và xóa (-) ở chế độ xem bình thường, chỉ hiển thị khi người dùng **nhấn giữ (Long-press / Jiggle Mode)**.

- **✅ Công việc đã hoàn thành**:
  - `[Feature]` Nâng cấp `renderBackpackView()` trong `app.js` để render Circular Node với SVG Donut Ring đa sắc biểu thị tỉ lệ điểm.
  - `[Feature]` Xây dựng bộ soạn thảo tỉ lệ điểm động (`renderGradeEditorRows()`, `addGradeEditorRow()`, `getGradeEditorData()`) có thanh kiểm tra tổng % (Badge 100%).
  - `[Refactor]` Hợp nhất model dữ liệu môn học `INITIAL_SUBJECT_DRIVE` và `GRADE_SCHEMES` thành một nguồn dữ liệu duy nhất (`gradeItems`).
  - `[UI/UX]` Tinh chỉnh cơ chế Jiggle Mode: Ở chế độ thường không có nút nào đè lên node. Khi nhấn giữ 500ms, cả nút xóa `(-)` (góc trên-trái) và nút cây bút `(✏️)` (góc trên-phải) cùng nảy ra với animation `badgePopIn`.
  - `[Config / DevOps]` Cập nhật Service Worker Cache `smart-schedule-backpack-v6` và đẩy mã nguồn lên GitHub Pages (`main`).

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - *SVG Donut Ring*: Sử dụng `stroke-dasharray` và `stroke-dashoffset` trên nhiều thẻ `<circle>` SVG xếp chồng với `transform: rotate(-90deg)` giúp hiển thị mượt mà trên mọi thiết bị di động mà không cần thư viện chart nặng nề.
  - *Unified Subject Model*: Đưa cấu trúc tỉ lệ điểm vào từng đối tượng môn học trong `state.driveSubjects` thay vì lưu tách biệt trong `GRADE_SCHEMES`, giúp dữ liệu đồng bộ tức thì giữa Chiếc Cặp và Bảng Điểm.

- **⚠️ Thách thức & Khắc phục**:
  - *Vấn đề*: Khi click mở modal môn học lúc đang ở Jiggle mode, nút sửa môn bị chồng chéo sự kiện mở link Google Drive.
  - *Giải pháp*: Bắt sự kiện `stopPropagation()` trên nút cây bút và chặn mở link Drive khi `state.isJiggleMode === true`.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Triển khai thành công Circular Node & Jiggle Mode trên GitHub Pages.
  - [ ] Thiết lập hệ thống tài liệu toàn diện (`docs/1` đến `docs/8`).
  - [ ] Khảo sát tích hợp đồng bộ Google Drive API chính thức (OAuth2 token).
  - [ ] Khảo sát tính năng thông báo tiết học tự động qua Web Push / ServiceWorker Notifications.

---

## 📅 [2026-09-04 18:30] - Tích Hợp Chiếc Cặp Google Drive & Tính Điểm Mục Tiêu

- **🎯 Mục tiêu**:
  - Phát triển tính năng "Chiếc Cặp Môn Học" liên kết thư mục tài liệu Drive và công cụ tính toán điểm thi cần đạt (Target Grade Calculator).

- **✅ Công việc đã hoàn thành**:
  - `[Feature]` Xây dựng giao diện Chiếc Cặp với lưới danh thiếp môn học, phân loại theo mã môn, giảng viên, phòng học.
  - `[Feature]` Tích hợp thuật toán tính điểm thi cuối kỳ cần đạt dựa trên điểm quá trình và mục tiêu điểm chữ (A, B+, B, C+...).
  - `[Feature]` Thêm môn học thủ công hoặc nạp từ file thời khóa biểu myBK (iCal / CSV).
  - `[PWA]` Cấu hình `manifest.json` và Service Worker hỗ trợ cài đặt ứng dụng độc lập trên điện thoại / máy tính.
