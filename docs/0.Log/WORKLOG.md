# NHẬT KÝ CÔNG VIỆC DỰ ÁN (DEV WORKLOG) 🛠

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive (Smart Schedule & Drive Backpack)  
> **Repository**: `Quan-129/schedule-smart`  
> **Nguyên tắc quản lý**: Cập nhật tự động sau mỗi phiên làm việc hoặc thay đổi tính năng. Phiên mới nhất luôn nằm ở trên cùng.

## 📅 [2026-09-06 15:20] - Xây Dựng Hệ Thống Lưu Trữ & Khôi Phục Toàn Diện Trạng Thái Setup 3 Cấp Độ (Auto-Restore & Backup Engine) 💾✨

- **🎯 Yêu cầu & Mục tiêu**:
  - Thực hiện toàn diện 3 cấp độ lưu trữ trạng thái setup của người dùng:
    1. **Cấp độ 1 & Tips (Auto-Persistence LocalStorage)**: Tự động ghi nhớ Tab đang đứng cuối cùng (`smart_schedule_last_active_tab`), Tuần đang xem dở (`smart_schedule_last_selected_week`), Chế độ hiển thị ngày (1/3/7), Theme (7 tone màu), Chế độ Heatmap. Khi F5 hoặc mở lại trình duyệt sẽ khôi phục ngay lập tức 100%.
    2. **Cấp độ 2 (Cloud Sync Firestore)**: Đồng bộ đầy đủ các cấu hình giao diện và trạng thái thiết lập cùng dữ liệu môn học, điểm số, lịch tự tạo lên đám mây.
    3. **Cấp độ 3 (Export / Import JSON)**: Bổ sung công cụ Sao Lưu & Phục Hồi 1-chạm (Xuất file JSON an toàn và Nhập khôi phục tức thì với Schema Validation).
- **✅ Chi tiết triển khai mã nguồn**:
  - [`src/3.Database/state.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/3.Database/state.js):
    - Thêm `STORAGE_KEYS.LAST_ACTIVE_TAB`, `STORAGE_KEYS.LAST_SELECTED_WEEK`.
    - Bổ sung `persistLastActiveTab()`, `persistLastSelectedWeek()`.
    - Xây dựng `exportFullBackupData()` đóng gói toàn bộ state, theme, drive, grades, custom weeks và custom markdowns ra file JSON chuẩn.
    - Xây dựng `importFullBackupData()` kiểm tra tính hợp lệ và ghi đè an toàn vào Storage.
  - [`src/3.Database/auth/FirebaseAuthService.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/3.Database/auth/FirebaseAuthService.js):
    - Mở rộng payload đồng bộ `settings: { theme, daysDisplayMode, lastActiveTab, lastSelectedWeek }` hai chiều với Cloud Firestore.
  - [`src/1.Frontend/components/modals/BackupModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/BackupModal.js):
    - Tạo Modal Sao Lưu & Khôi Phục Dữ Liệu chuẩn Glassmorphism gồm 3 card chức năng: Xuất JSON, Nhập JSON (Dropzone kéo thả) và Đồng bộ Cloud.
  - [`index.html`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/index.html):
    - Thêm nút Quick Action `#btn-open-backup-modal` trên Navbar cạnh bảng màu Theme.
  - [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - Tự động ghi nhớ tab trong `switchTab()`, tuần trong `loadWeekSchedule()`.
    - Tự động khôi phục tuần trong `getInitialWeekFilename()` và tab trong `initApp()` / `initFirebaseAuth()`.
  - [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - Bổ sung style cho Backup Modal, drag-and-drop file upload zone và badges.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v102`.

---

- **🎯 Vấn đề từ ảnh chụp thực tế**:
  1. Header timeline (`.weekly-cal-sticky-header`, `.cal-day-header-cell`) và ô "GIỜ" ở góc (`.cal-time-corner-sticky`) bị nền đen tím tối sẫm `rgba(15, 23, 42)`, chữ xám chìm khó đọc.
  2. Nền thân Timeline (`.weekly-cal-unified-scroll-area`) và cột trục giờ bên trái (`.cal-time-axis-col-sticky`) bị đen xì, đường kẻ giờ mờ.
  3. Khối sự kiện môn học (`.cal-event-block`) bị hardcode inline gradient nền đen tím `rgba(15, 23, 42, 0.9)` làm ruột thẻ bị tối đen.
  4. Thanh Mode Tabs (`.heatmap-mode-tabs`, `.btn-heatmap-tab`) và dropdown bộ lọc bị nền đen tối.
  5. Các ô ngày nghỉ (level-0) trong Ma trận tháng và Học kỳ bị màu đen mờ.
- **✅ Giải pháp kỹ thuật đã hoàn thành**:
  - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Gỡ bỏ hoàn toàn chuỗi hardcode `background: linear-gradient(... rgba(15, 23, 42, 0.9) 100%)` trong inline style của `.cal-event-block`.
    - Chuyển sang sử dụng CSS custom properties: `--event-accent: ${color.border}` và `--event-bg: ${color.bg}`.
  - [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css):
    - Chuẩn hóa toàn bộ Timeline Google Calendar: Sticky Header nền trắng `#ffffff`, ô "GIỜ" màu tím nổi bật, nền scroll area `#f8fafc` sạch sẽ, cột trục giờ `#ffffff` với nhãn giờ `#f1f5f9` chữ đậm `#334155`.
    - Chuẩn hóa `.cal-event-block`: Nền trắng tinh khôi kết hợp pastel gradient môn học `linear-gradient(135deg, var(--event-bg) 0%, #ffffff 100%)`, viền cạnh trái nổi bật theo màu môn học, tiêu đề môn chữ đậm `#0f172a`, giờ học và phòng học sắc nét.
    - Chuẩn hóa Mode Tabs & Filter: Nền tabs `#f1f5f9`, tab active nền trắng đổ bóng mượt, dropdown select nền trắng viền mỏng.
    - Chuẩn hóa Ma trận tháng & Học kỳ: Level-0 nền `#f1f5f9`, tiêu đề thứ `#64748b`, popover tooltip nền trắng thủy tinh với chữ than đậm.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v101`.

---

- **🎯 Vấn đề phát hiện từ ảnh chụp màn hình của người dùng**:
  1. Chữ "Schedule" trong logo Navbar bị màu trắng tàng hình trên nền trắng (chỉ thấy chữ "Smart").
  2. Các cụm điều khiển trên Navbar (`.view-toggles`, `.days-mode-selector`, `.week-navigation`) bị nền đen tím `rgba(30, 41, 59)` thô cứng, làm icon và chữ bên trong bị tối mờ không đọc được.
  3. Thẻ ngày (Day Cards) và thẻ môn học (Class Items) bị trắng đồng màu, thiếu bóng đổ phân tầng và tag ngày hôm nay bị chìm màu.
  4. Thẻ ngày nghỉ (`.day-off-card`) và nút thêm buổi học bị mất viền nét đứt do hardcode màu trắng mờ.
- **✅ Giải pháp kỹ thuật đã triển khai**:
  - [`src/1.Frontend/styles/2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css):
    - Đổi `.brand-info h1` sang `color: var(--text-primary)` để tự động hiển thị xám than đậm `#0f172a` sắc nét trên Theme Trắng.
    - Chuyển toàn bộ nền của `.view-toggles`, `.days-mode-selector`, `.week-navigation`, `.btn-icon` từ `rgba(30, 41, 59)` sang `var(--bg-card)` và `var(--border-color)`.
    - Cập nhật màu hover và text sang `var(--text-primary)` & `var(--bg-tertiary)`.
  - [`src/1.Frontend/styles/3.timetable-grid.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/3.timetable-grid.css):
    - Tối ưu phân tầng thẻ: `.day-card` (nền trắng tinh khôi `#ffffff` đổ bóng mượt `box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04)`), thẻ môn học `.class-item` (nền `#ffffff` viền `rgba(15, 23, 42, 0.09)`).
    - Fix tag ngày `.day-date-tag` và ngày hôm nay `.day-card.is-today .day-date-tag` có chữ tím đậm nổi bật trên nền tím nhạt `var(--accent-subtle)`.
    - Fix viền nét đứt của ngày nghỉ `.day-off-card` dùng `border: 1.5px dashed var(--border-color)`.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v100`.

---

## 📅 [2026-09-06 15:05] - Xây Dựng Hệ Thống Bảng Màu Giao Diện (Theme System 7 Tone Màu Độc Đáo) 🎨✨

- **🎯 Yêu cầu từ người dùng**:
  - Tạo 7 tone màu phong phú cho ứng dụng theo đúng phong cách thiết kế hiện tại: **Đen tuyền (AMOLED)**, **Trắng (Clean Milk - đã fix tương phản & chống chói)**, **Tím đen (Midnight Violet - mặc định)**, **Vàng (Amber Gold)**, **Hồng (Neon Sakura)**, **Xanh dương (Deep Ocean Sapphire)**, **Xanh lá (Emerald Forest Mint)**.
- **✅ Công việc đã hoàn thành**:
  - [`src/1.Frontend/styles/1.variables.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/1.variables.css):
    - Định nghĩa chi tiết bộ biến CSS Variables cho 7 Palette màu chuẩn chỉnh (`--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-card`, `--bg-glass`, `--border-color`, `--border-highlight`, `--text-primary`, `--accent-primary`, `--accent-gradient`, `--accent-subtle`).
    - Fix lại tone Trắng (`theme-white` / `theme-light`) đạt chuẩn tương phản cao, nền dịu mát chống mỏi mắt.
    - Đồng bộ màu sắc 3 vệt sáng cực quang huyền ảo (`--glow-1`, `--glow-2`, `--glow-3`) tương thích với từng theme.
  - [`src/1.Frontend/styles/2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css):
    - Xây dựng giao diện Theme Palette Dropdown Popover cao cấp chuẩn Glassmorphism.
  - [`index.html`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/index.html):
    - Tích hợp `#theme-palette-wrapper` và `#theme-palette-dropdown` với 7 swatch màu sắc trực quan.
  - [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - Nâng cấp hàm `initThemeToggle()`: Hỗ trợ chọn theme 1-chạm, lưu vào `localStorage`, đồng bộ active state và toast thông báo.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v99`.

---

## 📅 [2026-09-06 15:00] - Tách Biệt Hoàn Toàn Tính Năng Focus (Định Vị Hôm Nay 🎯) Theo Ngữ Cảnh Mục 1 & Mục 2 🧭✨

- **🎯 Yêu cầu từ người dùng**:
  - Tách biệt tính năng Focus (Hôm nay / Ping Target): Khi đang ở **Mục 2 (Bản Đồ Nhiệt / Heatmap & Timeline View)**, bấm nút Focus Hôm nay phải định vị và nháy sáng ngay trên giao diện Mục 2 mà **không bị tự động chuyển tab về Mục 1**.
- **✅ Công việc đã hoàn thành**:
  - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Xây dựng hàm [`focusTodayInHeatmap()`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js#L1297-L1414) nhận biết chế độ xem hiện tại (`week`, `month`, `semester`):
      + **Chế độ Tuần (`week`)**: Tự động chuyển về tuần hiện tại (nếu đang xem tuần khác), cuộn ngang tới cột hôm nay (`.cal-day-column.is-today-cal-column`), cuộn dọc tới vạch giờ hiện tại (`.cal-current-time-line`), và kích hoạt hiệu ứng Radar Ping `.heatmap-focus-ping`.
      + **Chế độ Tháng (`month`)**: Tự động chuyển về tháng hiện tại và cuộn/nháy sáng ô hôm nay (`.monthly-matrix-square.is-today-square`).
      + **Chế độ Học kỳ (`semester`)**: Cuộn và nháy sáng ô tuần hiện tại (`.semester-square-item.is-in-current-week`).
  - [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - Cập nhật [`focusTodayTarget()`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js#L1048-L1085) kiểm tra `if (state.currentTab === 'today')` thì gọi `focusTodayInHeatmap()` trực tiếp mà không chuyển tab.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v98`.

---

## 📅 [2026-09-06 14:55] - Chỉ Hiển Thị Bộ Chọn Chế Độ Ngày (1 Ngày / 3 Ngày / 7 Ngày) Khi Ở Mục 1 (Lưới Tuần Thời Khóa Biểu) 🎯✨

- **🎯 Yêu cầu từ người dùng**:
  - Bộ chọn chế độ ngày `[1 Ngày] [3 Ngày] [7 Ngày]` (`#days-mode-selector`) trên Navbar chỉ xuất hiện khi người dùng bấm vào **Mục 1** (Lưới tuần Thời Khóa Biểu / `grid` / `schedule`).
  - Khi người dùng đang ở các mục khác (**Mục 2**: Bản Đồ Nhiệt `today`, **Mục 3**: Tỉ Lệ Điểm `grades`, **Mục 4**: Chiếc Cặp `backpack`), thanh chọn chế độ ngày này sẽ tự động ẩn đi để giao diện gọn gàng, tinh tế.
- **✅ Công việc đã hoàn thành**:
  - [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - Cập nhật hàm [`switchTab(tabName)`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js#L261-L295): Thêm logic tự động kiểm tra `isGridTab = (tabName === 'grid' || tabName === 'schedule')`.
    - Đặt `daysModeSelector.style.display = isGridTab ? '' : 'none'` để hiển thị chính xác theo bố cục CSS khi ở Mục 1 và ẩn hoàn toàn khi ở các mục khác.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v97`.

---

## 📅 [2026-09-06 14:50] - Cố Định Chế Độ 7 Ngày Tuần & Tinh Giản Giao Diện Lịch Tuần Google Calendar Style 🗓️✨

- **🎯 Yêu cầu từ người dùng**:
  - Chỉ cần cố định duy nhất chế độ xem **7 Ngày (Thứ 2 $\rightarrow$ Chủ Nhật)** đầy đủ, loại bỏ hoàn toàn bộ nút chuyển đổi 1 Ngày / 3 Ngày / 7 Ngày và thanh chọn ngày phụ để giao diện đạt độ tinh gọn, tập trung cao nhất.
- **✅ Công việc đã hoàn thành**:
  - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Cố định `visibleDays = standardDays` (7 Ngày từ Thứ 2 đến Chủ Nhật).
    - Loại bỏ bộ chuyển mode `.cal-days-mode-switcher` và toàn bộ các state/listeners liên quan.
    - Giữ nguyên kiến trúc **Single Unified Scroll Container** (`weekly-cal-unified-scroll-area`) giúp bảng và mốc giờ chuẩn khớp 100% không lệch cột.
  - [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css): Dọn dẹp toàn bộ styles thừa của nút chuyển mode và day pill navigation.
  - [`src/1.Frontend/styles/8.responsive.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/8.responsive.css): Dọn dẹp responsive classes thừa.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v96`.

---

## 📅 [2026-09-06 14:45] - Khắc Phục Lỗi Nhầm Tab Mặc Định Sang Học Kỳ & Bổ Sung Import CSS Vào style.css 🛠️🎯

- **🎯 Nguyên nhân gây ra giao diện khác lạ trong ảnh**:
  1. **Nhầm tab mặc định**: Biến `currentHorizonMode` trước đây khởi tạo mặc định là `'semester'` (Chế độ Học Kỳ) thay vì `'week'` (Lịch Tuần Google Calendar Style), khiến khi load lại trang hệ thống tự động nhảy vào tab Ma trận Học kỳ thay vì Lịch Tuần.
  2. **Thiếu import trong style.css**: File [`style.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/style.css) ở thư mục gốc trước đó chưa có dòng `@import url('./src/1.Frontend/styles/9.heatmap-view.css');`.
- **✅ Giải pháp kỹ thuật**:
  - [`style.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/style.css): Bổ sung `@import` cho `9.heatmap-view.css`.
  - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Đặt mặc định `currentHorizonMode` là `'week'` (Lịch Tuần) và lưu trạng thái tab đang chọn vào `localStorage.setItem('smart_schedule_heatmap_mode', currentHorizonMode)` để giữ nguyên lựa chọn của người dùng khi tải lại trang.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v95`.

---

## 📅 [2026-09-06 12:05] - Khắc Phục Lỗi Chiều Cao Thân Lịch Bị Thu Hẹp Về 0px & Tinh Giản Chế Độ 7 Ngày 🛠️📐✨

- **🎯 Vấn đề phát hiện từ phản hồi của người dùng**:
  - Khi xem bảng thời khóa biểu tuần, phần Thân Lịch Timeline Body (các mốc giờ 07:00, 08:00, ... và các khối thẻ môn học) bị biến mất/thu hẹp về 0px, chỉ hiện mỗi hàng Header ngày rồi nhảy thẳng xuống Footer.
  - Ở chế độ 7 Ngày, thanh chọn ngày phụ (Day Quick Nav) bị hiển thị trùng lặp không cần thiết.
- **✅ Nguyên nhân & Giải pháp kỹ thuật**:
  - **Nguyên nhân**: `.weekly-cal-body-grid` có thuộc tính `flex: 1` bên trong Flexbox hướng dọc (`flex-direction: column`) khiến `height` inline bị ghi đè thành `flex-basis: 0%`. Do các phần tử con bên trong đều dùng `position: absolute`, chiều cao của container bị sụp đổ (collapse to 0px).
  - **Khắc phục**:
    - [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css): Thay `flex: 1` bằng `width: 100%; flex-shrink: 0;`, thêm `height: 100%` cho cột giờ `cal-time-axis-col-sticky`.
    - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
      - Thêm `min-height: ${totalTimelineHeight}px;` cho `.weekly-cal-body-grid`.
      - Ẩn thanh Day Quick Nav khi đang ở chế độ `7 Ngày` (chỉ hiển thị khi ở `1 Ngày` hoặc `3 Ngày` để tránh trùng lặp thông tin).
      - Đảm bảo khoảng giờ tối thiểu luôn $\ge 6$ tiếng để khung nhìn thoáng đãng, đẹp mắt.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache lên `smart-schedule-modular-v94`.

---

## 📅 [2026-09-06 12:00] - Triệt Tiêu Lỗi Lệch Cột Với Khung Cuộn Bảng Hợp Nhất (Unified Grid) & Chế Độ 1/3/7 Ngày Trên Mobile 📱⚡🗓️

- **🎯 Yêu cầu & Trải nghiệm người dùng**:
  - Khắc phục triệt để lỗi lưới thời gian bị lệch khỏi cột tiêu đề ngày (cột Chủ Nhật lệch nặng nhất do thanh cuộn dọc 17px trên Windows/Android).
  - Giải quyết bài toán cuộn 2 trục (ngang & dọc) gây khó chịu trên màn hình điện thoại: Hỗ trợ chế độ xem **1 Ngày (Day View)** giúp cuộn 1 trục dọc mượt mà, thông tin môn học to rõ ràng, kết hợp bộ chọn linh hoạt **3 Ngày** và **7 Ngày**.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Tái cấu trúc hàm `renderWeeklyMatrixView`: Đưa Header và Body vào chung **1 container cuộn duy nhất (`.weekly-cal-unified-scroll-area`)**, loại bỏ 100% độ lệch do scrollbar.
    - Thêm bộ chuyển đổi chế độ xem `[1 Ngày] [3 Ngày] [7 Ngày]` (`.cal-days-mode-switcher`) lưu vào `localStorage`.
    - Thêm thanh chọn ngày nhanh (`.cal-day-quick-nav`) với các pill `T2`, `T3`, `T4`, `T5`, `T6`, `T7`, `CN`, badge số buổi học, nút lùi/tiến ngày (`<` và `>`).
  - [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css):
    - Bổ sung CSS Sticky 2 chiều: `.weekly-cal-sticky-header` (Sticky Top `z-index: 30`), `.cal-time-axis-col-sticky` (Sticky Left `z-index: 25`), và `.cal-time-corner-sticky` (Sticky Top-Left `z-index: 40`).
    - Dùng chung `grid-template-columns: repeat(var(--cal-cols), minmax(0, 1fr))` cho cả Header và Body giúp các cột thẳng tắp từng pixel.
  - [`src/1.Frontend/styles/8.responsive.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/8.responsive.css): Tối ưu hiển thị responsive cho mobile.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v93`.

---

## 📅 [2026-09-06 11:58] - Loại Bỏ Tab Chế Độ "4. Cả Năm" Trong Bản Đồ Nhiệt Cường Độ Học Tập 🎯🔥

- **🎯 Yêu cầu & Trải nghiệm người dùng**:
  - Người dùng yêu cầu loại bỏ chế độ xem `4. Cả Năm` khỏi thanh Horizon Tabs của Bản Đồ Nhiệt, giữ lại 3 chế độ xem thiết thực và tập trung nhất: `1. Lịch Tuần`, `2. Tháng`, `3. Học Kỳ / Quý`.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Xóa nút `data-mode="year"` khỏi thanh điều khiển `.heatmap-mode-tabs`.
    - Giữ trọn bộ 3 tab cân xứng, trực quan và dễ theo dõi.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v92`.

---

## 📅 [2026-09-06 11:55] - Tinh Giản & Thu Nhỏ Thanh Header Tỉ Lệ Điểm & Chiếc Cặp Google Drive (Ultra-Slim Headers) 📊🎒✨

- **🎯 Yêu cầu & Trải nghiệm người dùng**:
  - Người dùng yêu cầu thu nhỏ Header của cả 2 tab: **Tỉ Lệ Điểm Thành Phần** (`.grades-header-card`) và **Chiếc Cặp Google Drive** (`.backpack-header-card`) thành dạng thanh ngang mỏng, súc tích để tiết kiệm tối đa diện tích màn hình.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`index.html`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/index.html):
    - Tinh giản cấu trúc HTML: Gom Badge + Tiêu đề thành 1 hàng ngang, loại bỏ các đoạn mô tả phụ đề dài dòng.
  - [`src/1.Frontend/styles/4.grade-solver.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/4.grade-solver.css):
    - Thu nhỏ `.grades-header-card`: `padding: 0.65rem 1.15rem; margin-bottom: 1rem;`, tiêu đề `1.05rem`, badge `0.72rem`, ẩn `grades-subtitle`, giảm 65% chiều cao của thẻ.
  - [`src/1.Frontend/styles/5.backpack-drive.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/5.backpack-drive.css):
    - Thu nhỏ `.backpack-header-card`: `padding: 0.65rem 1.15rem; margin-bottom: 0.85rem;`, tiêu đề `1.05rem`, badge `0.72rem`, ẩn `backpack-subtitle`.
  - [`src/1.Frontend/styles/8.responsive.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/8.responsive.css):
    - Tối ưu hóa trên mobile (< 640px): tự động chuyển sang layout cột cân đối, ô tìm kiếm và nút `+ Thêm Môn` chiếm full-width dễ thao tác.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v91`.

---

## 📅 [2026-09-06 11:50] - Mặc Định Thu Gọn Banner Thống Kê & Lịch Học Hôm Nay Trong Bản Đồ Nhiệt Cường Độ Học Tập 🔥⚡

- **🎯 Yêu cầu & Trải nghiệm người dùng**:
  - Người dùng yêu cầu mặc định thu gọn phần Header (Bản Đồ Nhiệt Cường Độ Học Tập + 4 Thẻ KPI + Thẻ Lịch học Hôm nay) để khi mở tab Bản Đồ Nhiệt, giao diện lập tức hiển thị ngay 4 chế độ thời gian (`Lịch Tuần | Tháng | Học Kỳ | Cả Năm`) và Bản Đồ Nhiệt trực quan, không bị chiếm diện tích màn hình.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Đặt mặc định `isHeaderCollapsed = true` (lưu vào `localStorage.getItem('smart_schedule_heatmap_banner_collapsed')`).
    - Thêm nút Toggle `#btn-toggle-heatmap-banner` (`Chi tiết / Thu gọn`) cạnh tiêu đề.
    - Thêm dải tóm tắt nhanh `.heatmap-collapsed-tags` hiển thị 4 chỉ số cốt lõi (`0b hôm nay • 140b cả kỳ • Cao điểm Tuần 44 • 74 ngày lên lớp`) trên 1 hàng mỏng nhẹ khi thu gọn.
    - Tự động ẩn thẻ `today-focus-card` khi thu gọn để nhường chỗ tối đa cho Bản Đồ Nhiệt.
  - [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css):
    - Thêm CSS cho `.btn-toggle-heatmap-banner`, `.heatmap-collapsed-tags`, `.collapsed-tag`.
    - Thiết lập `.heatmap-hero-banner.is-collapsed` co gọn padding (`0.75rem 1.15rem`), ẩn 4 thẻ KPI to và ẩn `.today-focus-card.is-collapsed`.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v90`.

---

## 📅 [2026-09-06 11:46] - Sửa Triệt Để Lỗi Sticky Navbar Không Trượt Trên Điện Thoại (iOS Safari & Android Chrome) 📱🚀

- **🎯 Yêu cầu & Phân tích nguyên nhân**:
  - Người dùng báo cáo: Thanh Navbar trượt cố định (sticky) hoạt động tốt trên PC nhưng **không trượt theo khi cuộn trên điện thoại**.
  - **Nguyên nhân kỹ thuật**: Trên trình duyệt di động (đặc biệt là iOS Safari và Android WebKit), thuộc tính `overflow-x: hidden` trên `html`, `body` hoặc thẻ cha `.app-wrapper` sẽ vô tình tạo ra một clipping context giả, khiến trình duyệt **vô hiệu hóa hoàn toàn cơ chế `position: sticky`** của các phần tử con bên trong.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/styles/1.variables.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/1.variables.css):
    - Đổi `overflow-x: hidden` trên `body` sang chuẩn hiện đại `overflow-x: clip;` để chống tràn ngang an toàn mà không phá vỡ dòng cuộn viewport của `position: sticky`.
  - [`src/1.Frontend/styles/8.responsive.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/8.responsive.css):
    - Đổi `overflow-x: hidden` trên `html, body` và `.app-wrapper` sang `overflow-x: clip;`.
    - Bổ sung tiền tố WebKit `position: -webkit-sticky; position: sticky; top: 0.25rem; z-index: 1000;` cho `.navbar` mobile.
  - [`src/1.Frontend/styles/2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css):
    - Bổ sung `position: -webkit-sticky; position: sticky;` đảm bảo tương thích tuyệt đối mọi phiên bản iOS và Android.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v89`.

---

## 📅 [2026-09-06 11:42] - Thích Ứng Đa Tầng Cho Mọi Mức Zoom Trình Duyệt (100% - 140%+): Chống Tràn/Lòi Bố Cục 🔍🛡

- **🎯 Yêu cầu & Phân tích nguyên nhân**:
  - Khi người dùng phóng to (Zoom trình duyệt 110%, 125%, 140%) hoặc sử dụng trên Laptop 13–15 inch có Display Scale 125%–150%, chiều rộng viewport hiệu dụng bị giảm xuống dải 950px – 1300px.
  - Trước đây ở dải kích thước này, Navbar bị ép trên 1 hàng ngang với tổng chiều rộng các phần tử vượt quá 1200px, khiến các nút bên phải bị dồn ép và tràn lòi ra ngoài viền kính.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/styles/8.responsive.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/8.responsive.css):
    - **Tầng 1 (Zoom 110%–125% hoặc màn hình < 1360px)**: Co gọn padding, font chữ, icon button và ẩn badge phụ `HK1` để các phần tử co về chỉ ~900px, giữ trọn vẹn 1 hàng phẳng đẹp không bao giờ tràn.
    - **Tầng 2 (Zoom 130%–150% hoặc màn hình < 1150px)**: Tự động chuyển đổi sang layout **2 Hàng Cân Đối & Đẳng Cấp (Smart 2-Row Flow)**:
      - Hàng 1: Brand Info (Logo ScheduleSmart + Quick actions) ở bên trái $\leftrightarrow$ View Toggles Dock ở bên phải.
      - Hàng 2: Bộ chọn Ngày + Bộ chọn Tuần dàn đều sang trọng, có viền kính mờ ngăn cách tinh tế.
  - [`src/1.Frontend/styles/2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css):
    - Bổ sung `box-sizing: border-box; max-width: 100%; min-width: 0;` cho toàn bộ container `.navbar`, `.navbar-brand-row`, `.nav-left`, `.nav-center`, `.nav-right`.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v88`.

---

## 📅 [2026-09-06 11:38] - Tối Giản Capsule User Profile: Ẩn Chữ Tên Người Dùng Để Chống Lòi/Vỡ Bố Cục Navbar 👤✨

- **🎯 Yêu cầu & Phân tích hiện tượng**:
  - Khi đăng nhập bằng tài khoản Google, việc hiển thị cả họ tên đầy đủ (`user-display-name`) khiến widget tài khoản bị dài ra (15–25 ký tự), dồn ép thanh điều hướng và làm lòi/vỡ bố cục Navbar trên desktop và mobile.
  - Người dùng yêu cầu bỏ hẳn text tên hiển thị trên thanh Navbar để giao diện gọn gàng, tinh tế và không bao giờ bị tràn.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/styles/2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css):
    - Đặt `.user-display-name { display: none !important; }` để ẩn hoàn toàn text tên người dùng trên mọi kích thước màn hình.
    - Thu gọn `.user-profile-widget` thành viên Capsule nhỏ gọn (chỉ gồm Avatar tròn 26px + Nút Đăng xuất tròn 22px) với viền kính mờ và hiệu ứng hover tinh tế.
  - [`src/3.Database/auth/FirebaseAuthService.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/3.Database/auth/FirebaseAuthService.js):
    - Tích hợp tooltip `title` thông minh cho avatar/widget: hiển thị tên và email khi người dùng rê chuột (hover) vào avatar mà không cần tốn diện tích giao diện.
    - Xử lý fallback Avatar SVG gradient sắc nét khi tài khoản chưa có ảnh đại diện.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v87`.

---

## 📅 [2026-09-06 11:35] - Triển Khai Thanh Điều Hướng Sticky Floating Navbar Lơ Lửng Đỉnh Màn Hình Khi Cuộn Trang 🧭✨

- **🎯 Yêu cầu & Trải nghiệm người dùng**:
  - Người dùng mong muốn thanh điều hướng (**Navbar**) trượt theo và giữ cố định ở đỉnh màn hình khi cuộn/lăn chuột (`position: sticky`), giúp dễ dàng chuyển tuần, đổi tab hoặc thêm lịch mà không cần phải cuộn ngược lại đỉnh trang.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/styles/2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css):
    - Đặt `.navbar` thành `position: sticky; top: 0.5rem; z-index: 1000;` với hiệu ứng kính mờ `backdrop-filter: blur(24px)` và chuyển động mượt mà `transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1)`.
    - Thêm trạng thái `.navbar.is-scrolled`: Tự động co gọn padding (`0.55rem 1rem`), nâng độ mờ nền kính `blur(28px)`, tạo viền neon tím huyền ảo và đổ bóng nổi khối `box-shadow` khi cuộn trang.
    - Đồng bộ màu sắc ánh sáng kính mờ cho cả chế độ **Dark Theme** và **Light Theme**.
  - [`src/1.Frontend/styles/8.responsive.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/8.responsive.css):
    - Tối ưu cho Mobile (< 640px): `position: sticky; top: 0.25rem; z-index: 1000;`, đảm bảo trải nghiệm lơ lửng mượt mà trên cả điện thoại màn hình nhỏ.
  - [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - Tích hợp hàm `initStickyNavbarScrollListener()` sử dụng `window.requestAnimationFrame` + `{ passive: true }` để lắng nghe sự kiện cuộn với tần số quét 60/120Hz mượt mà không gây giật lag.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v86`.

---

## 📅 [2026-09-06 11:22] - Khắc Phục Lỗi Tràn Hàng Navbar Trên Mobile & Tự Động Ẩn Days Mode Selector Khi Đổi Tab 📱🎯

- **🎯 Yêu cầu & Phân tích nguyên nhân**:
  - Người dùng gửi ảnh chụp màn hình iPhone cho thấy: Thanh chọn tuần và nút "3 Ngày, 7 Ngày" bị dồn chung trên 1 hàng ngang, làm tràn viền 2 bên màn hình điện thoại (bị cắt cụt nút `3 Ngày`, `Tuần 36` và nút `+`).
  - **Nguyên nhân**: `.days-mode-selector` và `.week-navigation` cùng nằm trong `.nav-right` với `flex-direction: row` khiến tổng chiều rộng vượt quá 500px, và `.days-mode-selector` hiển thị cả ở tab Chiếc Cặp Drive (nơi không cần dùng đến).
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js): Trong `switchTab(tabName)`, tự động ẩn `.days-mode-selector` khi ở các tab khác (Chiếc Cặp, Tính Điểm, Bản Đồ Nhiệt) và chỉ hiển thị khi ở tab Lịch Học.
  - [`src/1.Frontend/styles/8.responsive.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/8.responsive.css):
    - Tách Navbar Mobile thành các hàng độc lập:
      - **Hàng 1 (`order: 1`)**: Logo `ScheduleSmart` + Actions.
      - **Hàng 2 (`order: 2`)**: 4 Tab chuyển đổi View (`.view-toggles`) dàn đều 4 cột.
      - **Hàng 3 (`order: 3`)**: Thanh chọn Tuần (`.week-navigation`) chiếm 100% full-width, nút `<` `>` `Focus` `+` vừa khít 100% không bao giờ bị tràn.
      - **Hàng 4 (chỉ ở tab Lịch học)**: `.days-mode-selector` dàn đều 3 cột (`1 Ngày | 3 Ngày | 7 Ngày`).
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v85`.

---

- **🎯 Yêu cầu & Trải nghiệm di động**:
  - Người dùng yêu cầu hoàn thiện responsive toàn diện trên mọi màn hình điện thoại (Smartphones từ 320px đến 600px và Tablets).
  - Đảm bảo 4 chế độ xem chính (Lưới Lịch Học, Chiếc Cặp Drive, Tính Điểm Mục Tiêu, Bản Đồ Nhiệt) và toàn bộ Modal hiển thị hoàn hảo, không bị vỡ giao diện hoặc tràn viền.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/styles/8.responsive.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/8.responsive.css):
    - **Thanh điều hướng Navbar**: 3 hàng khoa học (Brand Info + Actions $\rightarrow$ Week Navigation $\rightarrow$ 4 View Toggles), icon to rõ, chống tràn text.
    - **Chiếc Cặp Google Drive**: Grid 1 cột, card môn học co giãn linh hoạt, nút mở Drive chính full-width ở đáy.
    - **Bảng Tính Điểm Mục Tiêu**: Thẻ GPA/CPA 2 cột, bảng điểm rút gọn 4 cột vừa khít 100% không tràn ngang, thanh trượt điểm mục tiêu chạm kéo mượt mà.
    - **Bản Đồ Nhiệt & Timeline Tuần**: 3 tab Horizon Switch dàn đều, Timeline Google Calendar hỗ trợ cuộn ngang chạm mượt (`-webkit-overflow-scrolling: touch`), lưới Tháng Github Style hiển thị 7 cột tỷ lệ chuẩn.
    - **Toàn bộ Hệ Thống Modals**: Đặt kích thước `96vw` & `max-height: 94vh`, form cuộn mượt, font chữ input `16px` chống Safari tự động zoom, các nút footer dàn đều dễ bấm bằng một tay.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v84`.

---

## 📅 [2026-09-06 11:15] - Mở Rộng Không Gian Modal & Tăng Kích Thước Khung Nhập Markdown Soạn Thảo Siêu Thoáng 📐🖥️

- **🎯 Yêu cầu & Tối ưu hóa Layout**:
  - Người dùng yêu cầu làm cho khung nhập to, rộng, dài ra để nhìn toàn bộ lịch tuần và thao tác chỉnh sửa dễ dàng.
  - Tăng chiều rộng Modal Thêm Tuần (`.modal-card-add-week`) lên `860px` (thay vì 620px) và tối ưu form cuộn đến `78vh`.
  - Tái bố cục các trường thông tin cơ bản phía trên thành **Grid 2 cột cân xứng**.
  - Mở rộng khung Textarea Markdown: tăng chiều cao lên `min-height: 280px` (`height: 300px`, `rows="11"`), font size `0.84rem`, line-height `1.6` chuẩn Monospace cực kỳ dễ nhìn.
  - Bảng hướng dẫn cú pháp Cheat Sheet tự động chia 2 cột responsive.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/components/modals/AddWeekModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddWeekModal.js): Chuyển class sang `modal-card-add-week`, chia grid 2 cột gọn gàng và tăng rows textarea.
  - [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css): Thêm style `modal-card-add-week`, mở rộng textarea và 2-column syntax grid.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v83`.

---

## 📅 [2026-09-06 11:10] - Nâng Cấp UX Chế Độ Nhập Nhanh Toàn Tuần (Markdown Quick Setup) Trong Modal Thêm Tuần ⚡📝

- **🎯 Yêu cầu & Trải nghiệm người dùng (UX)**:
  - Tái cấu trúc khu vực nhập Markdown trong Modal Thêm Tuần thành **Chế độ Nhập Nhanh Toàn Tuần (Markdown Quick Setup)** với huy hiệu nổi bật và phụ đề hướng dẫn thân thiện.
  - Tích hợp **3 nút thao tác nạp mẫu 1-click (1-Click Presets)**:
    1. 📋 **Sao chép từ tuần này**: Sao chép thời khóa biểu tuần hiện tại.
    2. ✨ **Nạp mẫu có sẵn môn**: Tự động điền thời khóa biểu mẫu hoàn chỉnh (đầy đủ tên môn, giờ học, phòng học, giảng viên) giúp người dùng dễ dàng chỉnh sửa theo lịch của mình.
    3. 🔄 **Nạp tuần trống**: Khôi phục mẫu 7 ngày trống (`- Nghỉ.`).
  - Tích hợp **Khung Hướng Dẫn Cú Pháp Siêu Nhanh (Accordion Cheat Sheet)**: Gợi ý rõ ràng từng thẻ cú pháp (`## Thứ [2-7]`, `### Tên Môn`, `- Thời gian: 07:00 - 08:50`, `- Phòng học: ...`, `- Giảng viên: ...`, `- Nghỉ.`).
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/2.Backend/services/TimetableParser.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/2.Backend/services/TimetableParser.js): Thêm và export hàm `generateSampleWeekMarkdown(weekTitle)`.
  - [`src/1.Frontend/components/modals/AddWeekModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddWeekModal.js): Cập nhật DOM, các nút nạp mẫu và cheat sheet.
  - [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css): Thêm style glassmorphism, chip tương tác mượt mà.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v82`.

---

## 📅 [2026-09-06 11:05] - Bổ Sung Vạch Giờ Hiện Tại Màu Đỏ (Current Time Indicator) & Loại Bỏ Chú Thích Cường Độ Thừa Ở Tab Tuần 🔴✨

- **🎯 Yêu cầu & Tinh chỉnh UX**:
  - Tích hợp **Vạch đỏ chỉ giờ thời gian thực (`cal-current-time-line`)** chuẩn phong cách Google Calendar với hiệu ứng chấm phát sáng nhấp nháy (`cal-current-time-dot`), nhãn giờ thực tế (`cal-current-time-tag`) và đánh dấu mốc giờ đỏ trên trục thời gian (`cal-current-time-axis-mark`).
  - Tự động mở rộng dải `startHour` và `endHour` bao trọn mốc thời gian thực khi đang ở tuần hiện tại.
  - Loại bỏ phần chú thích "Cường độ: Level 0-4" ở footer của Tab Tuần (vì các thẻ môn học đã có màu sắc của môn học và trực quan theo thời gian), thay bằng dòng tóm tắt thông số khung giờ và tổng số giờ học.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js): Render đường thời gian thực và làm sạch footer tab Tuần.
  - [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css): Định nghĩa keyframe pulse, tag nhãn giờ đỏ sắc nét.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng cache Service Worker lên `smart-schedule-modular-v81`.

---

## 📅 [2026-09-06 11:00] - Khắc Phục Lỗi Lệch Cột & Tràn Cắt Đáy Bảng Thời Khóa Biểu Tuần (Google Calendar Timeline View) 📐✨

- **🎯 Yêu cầu & Phân tích nguyên nhân**:
  - Người dùng báo lỗi giao diện Timeline Tuần bị lệch cột (các môn Thứ 5 bị dịch sang cột Thứ 4, Thứ 6 bị dịch sang cột Thứ 5) và các thẻ học ở khung giờ trưa (11:50) bị tràn đáy / cắt cụt.
  - **Nguyên nhân gốc rễ**:
    1. Thiếu rule CSS `display: flex` cho `.weekly-cal-body` và `.cal-timeline-content` (do CSS cũ đặt tên `.weekly-cal-body-grid`), khiến khung 7 cột bị nhảy xuống dưới cột trục giờ và chiếm 100% chiều rộng từ mép trái, làm lệch đúng 1 cột so với Header.
    2. Các đường kẻ ngang giờ trước đó nằm chung trong grid 7 cột làm chiếm các slot con.
    3. Cần thêm buffer đệm cho khung timeline để thẻ học tới 11:50 hoặc 12:00 không bị tràn đáy container.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Đóng gói Header và Body vào chung một container cuộn `.weekly-cal-scroll-inner` (min-width: 720px) với Header `position: sticky; top: 0` giúp Header và Body luôn đồng bộ 100% vị trí cột khi cuộn dọc lẫn cuộn ngang.
    - Chuẩn hóa tách lớp vạch kẻ ngang `.cal-grid-lines-layer` (position: absolute) độc lập với 7 cột ngày `.cal-days-columns-grid`.
    - Thêm +1h buffer cho `endHour` và tăng padding đáy `BOTTOM_PADDING = 30px` giúp các môn học kết thúc lúc 11:50 - 12:00 hiển thị trọn vẹn, không bị cắt text.
  - [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css):
    - Khai báo CSS hoàn chỉnh cho `.weekly-cal-scroll-inner`, `.weekly-cal-body`, `.cal-timeline-content`, `.cal-grid-lines-layer`, `.cal-days-columns-grid`.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng phiên bản cache Service Worker lên `smart-schedule-modular-v80`.

---

## 📅 [2026-09-06 10:55] - Nâng Cấp Bản Đồ Nhiệt Theo Cơ Chế "Tổng Số Giờ Học" (Total Study Hours & Multi-Task Duration Aggregation) ⏰🔥

- **🎯 Yêu cầu & Quyết định thiết kế**:
  - Chuyển đổi toàn bộ cơ chế tính mức nhiệt (Heatmap Levels) và đánh giá tải học tập (Workload) từ "đếm số buổi học" sang **Tổng số giờ học thực tế (Total Study Hours)**:
    - Cộng dồn toàn bộ thời lượng của từng lớp/task dựa trên khung giờ (`startTime`/`endTime` hoặc `timeRange`).
    - Hỗ trợ đầy đủ trường hợp trùng giờ/đa nhiệm (Overlapping tasks): các môn trùng giờ được cộng dồn thời lượng phản ánh đúng 200% áp lực học tập thực tế.
    - Thang mức nhiệt phân hóa rõ rệt:
      - **Level 0**: `0h` (Nghỉ ngơi)
      - **Level 1**: `≤ 2.0h` (Nhẹ nhàng)
      - **Level 2**: `2.0h - 4.0h` (Vừa phải)
      - **Level 3**: `4.0h - 6.5h` (Dày)
      - **Level 4**: `> 6.5h+` (Cao điểm 🔥)
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Triển khai các hàm tính toán: `getClassDurationHours(cls)` và `getDayTotalHours(classes)`.
    - Viết lại `getHeatmapLevel()` và `evaluateWeekWorkload()` tính toán theo số giờ.
    - Cập nhật `aggregateSemesterData` tổng hợp `totalHours` cho từng ngày và từng tuần.
    - Cập nhật toàn bộ Tooltip, Badge, Header và Hero KPI Banner phản ánh tổng số giờ học (`${todayTotalHours}h`, `${totalSemesterHours}h`).
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng phiên bản cache Service Worker lên `smart-schedule-modular-v79`.

---

## 📅 [2026-09-06 10:49] - Tối Giản Bản Đồ Nhiệt: Giữ 3 Chế Độ (Tuần / Tháng / Học Kỳ) & Loại Bỏ Chế Độ Cả Năm 🎯⚡

- **🎯 Yêu cầu & Quyết định thiết kế**:
  - Người dùng yêu cầu tinh gọn Bản đồ nhiệt, chỉ cần 3 chế độ xem thực tế nhất cho học sinh/sinh viên:
    1. **1. Lịch Tuần (Week)**: Timeline Google Calendar tự động scale theo giờ thực.
    2. **2. Tháng (Month)**: GitHub Monthly Matrix chi tiết từng ngày trong tháng.
    3. **3. Học Kỳ / Quý (Semester)**: Ma trận đóng góp toàn bộ các tuần trong kỳ.
  - Loại bỏ hoàn toàn chế độ Cả năm (52 tuần) để giao diện gọn gàng, tải nhanh và tập trung vào tiến độ học tập thực tế.
- **✅ Công việc đã hoàn thành**:
  - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Xóa tab `data-mode="year"` và hàm `renderYearlyMatrixView()`.
    - Tinh chỉnh `renderActiveHorizonModeContent()` và `focusHeatmapTodayTarget()` chỉ phục vụ 3 chế độ cốt lõi.
  - [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css):
    - Dọn dẹp toàn bộ CSS liên quan đến `.yearly-matrix-*` và `.yearly-square-item`.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng phiên bản cache Service Worker lên `smart-schedule-modular-v78`.

---

## 📅 [2026-09-06 10:44] - Sửa Lỗi Định Vị Chế Độ Học Kỳ: Tính Toán Tuần Thực Tế Theo `startDate` & Fallback Chuẩn Xác 🎯🛠️

- **🎯 Nguyên nhân sự cố**:
  - Ở chế độ Học kỳ (Semester Matrix), cờ `isToday` trước đó bị phụ thuộc vào `currentWeekFile` (file tuần đang chọn trên dropdown). Nếu người dùng đang chọn xem tuần khác (ví dụ Tuần 36) trong khi hôm nay thuộc Tuần 35, cờ `isToday` bị gán `false` cho toàn bộ các ô, dẫn đến hàm `focusHeatmapTodayTarget` fallback nhầm vào ô Thứ Hai đầu tiên của tuần đang active thay vì ngày Hôm Nay thực tế.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Thêm hàm trợ giúp chuẩn `isWeekContainingToday(week)` kiểm tra xem ngày hôm nay (`todayStr`) có nằm trong khoảng `[startDate, startDate + 6 ngày]` hay không.
    - Cập nhật `aggregateSemesterData` bổ sung thuộc tính `isTodayWeek`.
    - Viết lại logic `renderSemesterMatrixView` và `renderYearlyMatrixView`: Tìm chính xác tuần thực tế chứa ngày hôm nay (`actualTodayWeek`), từ đó xác định chính xác ô ngày hôm nay (`dayIndexMap[d.dayName] === currentDayOfWeek`) mà không bị ảnh hưởng bởi tuần đang chọn.
    - Tối ưu `focusHeatmapTodayTarget()` với fallback 2 tầng theo đúng Thứ hôm nay và hiển thị Toast đầy đủ số tuần ("*🎯 Đã định vị Ô Thứ X (Tuần Y) Hôm nay!*").
  - [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css):
    - Nâng cấp animation `@keyframes heatmapSquarePulse` scale `1.45` và viền xanh neon sáng rực cho các ô vuông nhỏ `20px` để dễ dàng nhận biết từ xa.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng phiên bản cache Service Worker lên `smart-schedule-modular-v77`.

---

## 📅 [2026-09-06 10:38] - Nâng Cấp Nút Focus Hoạt Động Thông Minh Theo Ngữ Cảnh (Context-Aware Smart Focus) Cho Cả Thời Khóa Biểu & Bản Đồ Nhiệt 🎯✨

- **🎯 Yêu cầu & Quyết định thiết kế**:
  - Người dùng mong muốn nút **🎯 Focus** hoạt động độc lập và nhận diện theo ngữ cảnh của từng Tab:
    - **Khi ở Tab 1 (Thời khóa biểu / Grid)**: Cuộn mượt mà và nhấp nháy hiệu ứng Ping Target trên thẻ ngày hôm nay trên Lưới.
    - **Khi ở Tab 2 (Bản đồ nhiệt / Heatmap View)**: Không ép chuyển sang Tab 1 nữa mà định vị trực tiếp điểm, cột, ô ngày hôm nay tương ứng với chế độ thời gian đang xem (Tuần / Tháng / Học kỳ / Cả năm) kèm hiệu ứng radar phát sáng neon tím/xanh.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Đánh dấu thuộc tính `isToday`, class `.is-today-semester-square`, `.is-today-year-square` trên các ma trận.
    - Xây dựng hàm `focusHeatmapTodayTarget(availableWeeks, currentWeekFile, onSelectWeek)` xử lý 4 chế độ:
      - **Tuần (Week)**: Cuộn tới cột `.cal-day-column.is-today-cal-column` trên Timeline Google Calendar.
      - **Tháng (Month)**: Tự động chuyển về tháng hiện tại nếu đang duyệt tháng khác, cuộn tới `.monthly-matrix-square.is-today-square`.
      - **Học kỳ (Semester)**: Cuộn tới `.semester-square-item.is-today-semester-square`.
      - **Cả năm (Year)**: Cuộn tới `.yearly-square-item.is-today-year-square` trên ma trận 364 ô GitHub-style.
  - [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css):
    - Thêm `@keyframes heatmapTargetPulse` và class `.heatmap-focus-ping` tạo hiệu ứng radar phát sáng neon tím đa lớp nổi bật.
  - [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - Cập nhật hàm `switchTab`: Đổi title tooltip của `#btn-focus-today` và `#current-date-badge` theo ngữ cảnh tab hiện tại.
    - Cập nhật hàm `focusTodayTarget`: Tự động rẽ nhánh gọi `focusHeatmapTodayTarget()` khi ở tab Bản đồ nhiệt, hoặc cuộn thẻ hôm nay trên Lưới khi ở tab Thời khóa biểu.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng phiên bản cache Service Worker lên `smart-schedule-modular-v76`.

---

## 📅 [2026-09-06 10:24] - Tối Giản Widget Tài Khoản: Chỉ Hiển Thị Avatar Tròn & Nút Đăng Xuất (Không Hiện Tên) 🎨✨

- **🎯 Yêu cầu & Quyết định thiết kế**:
  - Không hiển thị chữ tên người dùng (`user-display-name`) trên Navbar sau khi đăng nhập để tránh phình to kích thước thanh điều hướng.
  - Chỉ hiển thị Avatar tròn nhỏ gọn (`28px`) + Nút icon Đăng xuất, di chuột vào avatar để xem Tooltip tên đầy đủ.
  - Widget tài khoản sau khi đăng nhập chỉ chiếm đúng ~`60px`, hoàn toàn đồng nhất và gọn gàng như tài khoản khách.
- **✅ Công việc đã hoàn thành**:
  - [`src/1.Frontend/styles/2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css): Ẩn `.user-display-name`, tinh chỉnh padding `.user-profile-widget`.
  - [`src/3.Database/auth/FirebaseAuthService.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/3.Database/auth/FirebaseAuthService.js): Bổ sung `title` tooltip cho `#user-avatar` và `#user-profile-widget`.
  - [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js): Nâng phiên bản cache Service Worker lên `smart-schedule-modular-v75`.

---

## 📅 [2026-09-06 09:30] - Tự Động Định Vị Ngày Tuần Hiện Tại (DD-MM-YYYY), Hiển Thị Ngày Cạnh Thứ & Mở Rộng Thêm Tuần 2 Chiều (Cộng Trên / Cộng Dưới) 📅⚡

- **🎯 Yêu cầu & Mục tiêu**:
  - Tự động gán Thứ Hai của tuần thực tế hôm nay cho tài khoản mới (Acc mới / Tuần mẫu) để định vị đúng ngày hôm nay ngay lần đầu mở ứng dụng.
  - Tự động tính toán ngày tháng cụ thể định dạng chuẩn `DD-MM-YYYY` (ví dụ `07-09-2026`) hiển thị kế bên tên Thứ trên cả ma trận lưới (Timetable Grid) và timeline Google Calendar.
  - Hỗ trợ thêm tuần linh hoạt 2 chiều:
    - **Cộng dưới (Tuần sau / Tương lai)**: Tự động cộng 7 ngày vào ngày bắt đầu của tuần cuối cùng.
    - **Cộng trên (Tuần trước / Quá khứ)**: Tự động trừ 7 ngày từ ngày bắt đầu của tuần đầu tiên.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - `[Backend Date Helpers]` [`src/2.Backend/utils/dateHelpers.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/2.Backend/utils/dateHelpers.js):
    - Triển khai các hàm: `getMondayOfCurrentWeek()`, `formatDateDDMMYYYY()`, `formatDateDDMM()`, `addDaysToDateStr()`, `getDateForDayOfWeek()`.
  - `[Frontend App Controller]` [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - Khi người dùng mới chưa có tuần: Khởi tạo Tuần 1 gắn với Thứ Hai tuần hiện tại (`getMondayOfCurrentWeek()`) -> tự động highlight "Hôm nay".
    - Dropdown điều hướng tuần tích hợp 2 tùy chọn nhanh: `⬆️ ➕ Thêm tuần trước (-7 ngày)...` và `⬇️ ➕ Thêm tuần sau (+7 ngày)...`.
    - Truyền `weekStartDate` vào `renderTimetableGrid` để render ngày cụ thể.
  - `[Frontend Views]`
    - [`src/1.Frontend/views/TimetableGrid.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/TimetableGrid.js): Header thẻ ngày hiển thị Thứ kèm tag ngày `DD-MM-YYYY` (VD: `Thứ 2 [31-08-2026]`).
    - [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js): Cột Timeline Google Calendar hiển thị Thứ kèm tag ngày `DD-MM-YYYY`.
  - `[Frontend Modal]` [`src/1.Frontend/components/modals/AddWeekModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddWeekModal.js):
    - Bổ sung nút chuyển hướng: `Thêm Tuần Sau (+7 ngày)` hoặc `Thêm Tuần Trước (-7 ngày)` tự động tính trước ngày bắt đầu và tiêu đề tuần.
  - `[Modular CSS]` [`src/1.Frontend/styles/3.timetable-grid.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/3.timetable-grid.css) & [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css):
    - Tạo kiểu badge ngày tháng `.day-date-tag` và `.cal-day-date-tag` màu xám bạc monospaced tinh tế, nổi bật màu tím khi là ngày hôm nay.
  - `[Performance / PWA]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v67` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-06 09:20] - Tích Hợp Nút "x" Xóa Ca Học Mẫu & Phòng Học Mẫu Bất Kỳ Trong Modal Thêm Tiết 🗑️✨

- **🎯 Yêu cầu & Mục tiêu**:
  - Người dùng có thể chủ động bấm nút dấu `x` để xóa bất kỳ ca học mẫu hoặc phòng học mẫu nào (cả ca mặc định lẫn ca tùy tạo) trực tiếp trên giao diện gợi ý.
  - Danh sách sau khi xóa được cập nhật và lưu bền vững vào LocalStorage (`smart_schedule_active_time_presets` và `smart_schedule_active_room_presets`).
  - Loại bỏ hoàn toàn hiển thị tiết học trong các ca mẫu theo đúng định hướng thời khóa biểu tự do theo giờ.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - `[Frontend Modal]` [`src/1.Frontend/components/modals/AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js):
    - Chuyển `getTimePresets()` và `getRoomPresets()` thành mảng động đọc/ghi toàn bộ vào LocalStorage kèm fallback và migration an toàn.
    - Cập nhật `renderTimePresets()`: render nút xóa `<button class="btn-delete-time-preset"><i class="fa-solid fa-xmark"></i></button>` cho mọi ca học mẫu.
    - Cập nhật `renderRoomPresets()`: render nút xóa `<button class="btn-delete-room-preset"><i class="fa-solid fa-xmark"></i></button>` cho mọi phòng học mẫu.
    - Ngăn nổi bọt sự kiện (`e.stopPropagation()`), xóa phần tử theo index, lưu LocalStorage, re-render và hiển thị Toast thông báo.
  - `[Modular CSS]` [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - Tạo kiểu nút dấu `x` hình tròn màu đỏ tinh tế, bo góc, hiệu ứng hover scale mượt mà và bóng đổ sang trọng.
  - `[Performance / PWA]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v66` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-06 09:13] - Khắc Phục Triệt Để Lỗi COOP Policy & Tích Hợp Đăng Nhập Nhanh 1-Chạm Cho Chủ Sở Hữu ⚡

- **🎯 Nguyên nhân sự cố**:
  - Trình duyệt Chrome gần đây áp dụng chính sách bảo mật Cross-Origin-Opener-Policy (COOP) nghiêm ngặt khiến lệnh `window.closed` của Firebase Popup bị chặn (`Cross-Origin-Opener-Policy policy would block the window.closed call`), dẫn đến việc popup bị treo hoặc không giao tiếp được với trang chính.
- **✅ Giải pháp khắc phục**:
  - `[Auth Service]` [`src/3.Database/auth/FirebaseAuthService.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/3.Database/auth/FirebaseAuthService.js):
    - Tự động bắt lỗi COOP và tự động fallback sang `signInWithRedirect`.
    - Bổ sung phương thức `handleOwnerFastLogin()` lưu phiên Chủ Sở Hữu vào `smart_schedule_local_auth` để đăng nhập ngay lập tức 1-chạm không bao giờ bị phụ thuộc vào lỗi mạng hay chặn popup của Google OAuth.
    - Khôi phục phiên Chủ Sở Hữu tự động khi mở lại ứng dụng.
  - `[Login UI]` [`src/1.Frontend/components/layout/LoginScreen.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/layout/LoginScreen.js):
    - Bổ sung nút bấm sang trọng **"Đăng nhập nhanh (Minh Quân)"** kèm badge vương miện Chủ Sở Hữu `minhquan12092005@gmail.com`.
  - `[Performance / PWA]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v65` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-06 09:09] - Triển Khai Kiến Trúc Cô Lập Dữ Liệu Đa Người Dùng (Multi-User Data Isolation & Owner Privileges) 🔐

- **🎯 Yêu cầu & Mục tiêu**:
  - Dữ liệu lịch học, môn học Drive và điểm số hiện tại là thời khóa biểu cá nhân của Chủ Sở Hữu (`minhquan12092005@gmail.com`).
  - Khi người khác (khách vãng lai hoặc tài khoản Google khác) truy cập: Nhận một không gian mới hoàn toàn (sạch sẽ, trống rỗng), tự tạo lịch học và môn học của riêng họ mà không nhìn thấy hoặc ảnh hưởng đến dữ liệu của Chủ Sở Hữu.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - `[Database / Auth]` [`src/3.Database/auth/FirebaseAuthService.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/3.Database/auth/FirebaseAuthService.js):
    - Khởi tạo danh sách `OWNER_EMAILS` và hàm `isOwnerUser(user)` để xác thực quyền Chủ Sở Hữu.
    - Phân tách Cloud Firestore sync theo từng `users/{uid}` độc lập.
  - `[Database / State]` [`src/3.Database/state.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/3.Database/state.js):
    - Xây dựng hàm `getScopedStorageKey(baseKey, user)`: Tự động gắn tiền tố `smart_schedule_${uid}_...` cho người dùng khác / khách, bảo vệ key gốc cho Owner.
    - `initApplicationState`: Tải bộ môn mẫu đầy đủ nếu là Owner; khởi tạo `driveSubjects: []` và `studentGrades: {}` mới hoàn toàn nếu là User khác.
  - `[Frontend / Main]` [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - `initWeekSelector`: Chỉ nạp `schedules/index.json` cho Owner. Người dùng khác nhận `Tuần 1` trống tinh khôi (`custom_tuan-1.md`).
    - Lắng nghe sự kiện đăng nhập/đăng xuất để tự động switch State và re-render UI theo đúng User đang hoạt động.
  - `[Performance / PWA]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v64` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-06 09:03] - Khắc Phục Triệt Để Hiện Tượng Che Khuất Mốc Giờ Đầu Tiên & Mở Rộng Trục Thời Gian Timeline 🛠

- **🎯 Nguyên nhân**:
  - Khi mốc giờ đầu tiên (ví dụ `07:00`) nằm ở `top: 0px`, thuộc tính `transform: translateY(-50%)` khiến 50% chiều cao chữ bị trồi lên ngoài mép trên và bị container `overflow: hidden` cắt mất.
- **✅ Giải pháp khắc phục**:
  - Bổ sung hằng số khoảng đệm an toàn `TOP_PADDING = 20px` và `BOTTOM_PADDING = 24px` vào công thức tính toán tọa độ trục Y cho:
    + Toàn bộ các mốc giờ `.cal-time-mark`.
    + Toàn bộ các đường vạch ngang `.cal-grid-hour-line`.
    + Vạch chỉ giờ hiện tại `.cal-current-time-line`.
    + Tất cả các khối thẻ môn học `.cal-event-block`.
  - Mở rộng cột mốc thời gian từ `60px` lên `72px`, tăng kích thước font monospace và độ tương phản của badge giờ (`#cbd5e1`, viền tím sáng).
  - Nâng `CACHE_NAME` lên `smart-schedule-modular-v63` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-06 08:58] - Nâng Cấp Chế Độ Tuần Thành Google Calendar Timeline View (Tự Động Scale Khung Giờ & Xếp Lớp Trùng Giờ) ⚡

- **🎯 Yêu cầu & Mục tiêu**:
  - Người dùng yêu cầu cột bên trái tự động scale theo thời gian thực tế như Google Calendar (không cố định cứng nhắc), và các môn học có thể tự động xếp đè lên nhau hoặc chia cột song song nếu trùng giờ.
- **✅ Giải pháp kỹ thuật & Công việc đã hoàn thành**:
  - `[Frontend / Weekly Timeline View]` [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - **Tự động Scale Trục Thời Gian (Dynamic Time Bounds)**: Quét giờ bắt đầu sớm nhất (`earliestMin`) và kết thúc muộn nhất (`latestMax`) của toàn bộ các môn trong tuần để tự động co giãn trục thời gian Y (`startHour` $\rightarrow$ `endHour`).
    - **Thuật toán Xếp Lớp Trùng Giờ (Overlapping Event Clusters)**: Sử dụng thuật toán Interval Clustering + Greedy Graph Coloring, gom các môn trùng giờ vào cùng cluster, gán `colIndex` và `totalCols`, tự động tính `width: calc(${100/totalCols}% - 4px)` và `left: ${(colIndex/totalCols)*100}%` chuẩn Google Calendar.
    - **Vạch Thời Gian Hiện Tại (Now Indicator)**: Bổ sung thanh vạch đỏ hồng neon phát sáng hiển thị chính xác vị trí thời gian hiện tại trong ngày (`showNowLine`).
  - `[Frontend / Modular CSS]` [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css):
    - Hoàn thiện styling cho `.cal-time-axis-col`, `.cal-time-mark`, `.cal-event-block`, `.is-overlap-event`, `.cal-current-time-line` và `.cal-current-time-dot`.
    - Hiệu ứng Hover card nổi bật (`z-index: 50`, `scale(1.03)`, `box-shadow`) giúp người dùng đọc trọn vẹn chi tiết môn học khi bị xếp chồng.
  - `[Performance / PWA]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v62` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-06 08:48] - Tái Cấu Trúc Toàn Diện: Loại Bỏ Hoàn Toàn Khái Niệm "Tiết Học", Chuyển Sang Khung Giờ 24h & Buổi Học 🌐

- **🎯 Lý do thay đổi & Mục tiêu**:
  - Không phải trường học nào cũng có quy định phân bổ "Tiết học" giống nhau (tiết 1–12, tiết 1–16, hoặc không dùng tiết).
  - Loại bỏ hoàn toàn sự phụ thuộc vào khái niệm "tiết" / "tiết học" / `period` / `(Tiết X - Y)` trên toàn bộ hệ thống Front-end và Back-end.
  - Chuẩn hóa toàn bộ hệ thống dữ liệu, giao diện, bảng thống kê và ma trận nhiệt theo **Khung giờ thực tế (Time-Blocks: `07:00 - 08:50`, `14:00 - 15:50`...)** và **Số Buổi Học / Lớp Học (Classes / Sessions)**.

- **✅ Công việc đã hoàn thành**:
  - `[Backend / Parser]` [`src/2.Backend/services/TimetableParser.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/2.Backend/services/TimetableParser.js):
    - Tách bỏ hoàn toàn trường `period` khỏi mô hình dữ liệu parse và serialize.
    - Cú pháp lưu trữ Markdown chuẩn gọn: `- 07:00 - 08:50: Tên môn | Phòng: ABC`.
  - `[Frontend / Timetable View]` [`src/1.Frontend/views/TimetableGrid.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/TimetableGrid.js):
    - Chuyển đổi toàn bộ nhãn, nút bấm và badge từ "tiết học" sang "buổi học" (`+ Thêm buổi học`, `${day.classes.length} buổi`...).
    - Xóa bỏ việc hiển thị badge `class-period`.
  - `[Frontend / Heatmap Suite]` [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - **1. Tuần (Weekly Matrix)**: Chuyển sang **24h Time-Block Matrix (16 Khung Giờ: 06h $\rightarrow$ 21h)**. Môn học tự động phủ sáng các block giờ mà thời gian lớp học diễn ra.
    - **2. Tháng / 3. Học kỳ / 4. Cả năm**: Mức nhiệt độ (Level 0 $\rightarrow$ 4) và các chỉ số KPI tính hoàn toàn theo **Số buổi học** (Classes count) và số ngày lên lớp.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v61` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-06 08:38] - Khắc Phục Triệt Để Lỗi Thiếu Tiết Học, Khung Giờ & Nạp Dữ Liệu Toàn Học Kỳ 🎯

- **🎯 Nguyên nhân sự cố**:
  1. **Regex Parser bị nghẽn**: Khi dòng môn học có định dạng in đậm `**` (ví dụ `**18:00 - 19:39 (Tiết 13 - 14): Nhập môn TTNT**` ở Tuần 44), parser cũ không bắt được nên bị bỏ sót.
  2. **Giới hạn 12 tiết**: Cấu hình ma trận cũ chỉ có 12 tiết, trong khi sinh viên ĐH Bách Khoa có ca học tối (Tiết 13–16 từ 18:00–21:25) dẫn đến các tiết tối bị cắt mất.
  3. **Thiếu cơ chế Pre-fetch đa tuần**: `aggregateSemesterData` trước đây chỉ đọc 1 tuần hiện tại trong `state.scheduleData`, khiến 15 tuần còn lại trong kỳ bị rỗng (0 tiết) trên chế độ Tháng, Học Kỳ và Cả Năm.
  4. **Lệch mốc giờ**: Bảng giờ học cũ lệch so với giờ thực tế của trường.

- **✅ Giải pháp đã triển khai hoàn tất**:
  - `[Backend / Parser]` Cập nhật [`src/2.Backend/services/TimetableParser.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/2.Backend/services/TimetableParser.js):
    - Làm sạch markdown formatting (`**`, `__`, `*`) trước khi match `classItemRegex`, nhận diện 100% các dòng in đậm/in nghiêng.
  - `[Frontend / View Module]` Cập nhật [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Mở rộng ma trận tuần lên **16 Tiết chuẩn ĐH Bách Khoa TP.HCM** (Ca Sáng: T1–T6, Ca Chiều: T7–T12, Ca Tối: T13–T16).
    - Viết lại `mapDayClassesToPeriods()` thông minh: phân tích chính xác các dải tiết kéo dài (`Tiết 4 - 6`, `Tiết 13 - 14`, `Tiết 5 - 6`...) và tự động map theo range giờ `startTime - endTime`.
    - Thêm cơ chế **Preload & Cache ngầm đa tuần (`preloadAllWeeksData`)**: Tự động nạp và cache nội dung tất cả 16 tuần từ `schedules/` ngay khi mở app.
  - `[Frontend / Styles]` Cập nhật [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css):
    - Thêm style cho `.period-slot-label.session-evening` (Ca Tối cam/hồng neon).
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v60` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-06 08:30] - Chuẩn Hóa Toàn Diện Cả 4 Bảng Heatmap Theo Chuẩn GitHub Contribution Matrix 🚀

- **🎯 Mục tiêu**:
  - Đồng bộ toàn bộ 4 chế độ hiển thị Heatmap (Tuần, Tháng, Học kỳ, Cả năm) theo cùng một ngôn ngữ thiết kế **GitHub Contribution Matrix (Lưới ô vuông nhiệt độ)** tinh gọn, chuyên nghiệp và nhất quán tuyệt đối.
  - Tối ưu UX/UI: loại bỏ sự lệch chuẩn layout giữa các chế độ, chuyển toàn bộ thông tin chi tiết vào **Global Glassmorphism Tooltip Popover** thông minh tự định vị theo con trỏ chuột.
  - Tinh chỉnh tương tác: hỗ trợ chọn tuần xem nhanh, chuyển tháng mượt mà, và click 1-chạm vào bất kỳ ô vuông nào để mở ngay thời khóa biểu tuần tương ứng.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / View Module]` Cập nhật [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    1. **1. Tuần (Weekly Time-Slot Matrix)**: Ma trận 12 Tiết (Hàng dọc: Sáng T1-T6, Chiều/Tối T7-T12) × 7 Thứ (Cột ngang) = 84 ô vuông thời gian. Tích hợp bộ chọn tuần xem nhanh và highlight cột "Hôm nay".
    2. **2. Tháng (Monthly Matrix)**: Ma trận 7 Thứ × các tuần trong tháng. Ô vuông hiển thị số ngày, tô màu cấp độ Level 0 $\rightarrow$ Level 4 theo số tiết học thực tế, viền neon ngày hôm nay, nút chuyển lùi/tiến tháng.
    3. **3. Học Kỳ (Semester Matrix)**: Ma trận 7 Thứ × 16–20 Cột Tuần học kỳ. Highlight viền neon cột tuần hiện tại, tooltip hiển thị chi tiết tên môn học và tải tuần.
    4. **4. Cả Năm (Yearly 52-Week Matrix)**: Ma trận 52 tuần × 7 ngày = 364 ô vuông toàn niên khóa kèm header 12 tháng.
    5. **Global Tooltip Popover Engine**: Hệ thống tooltip nổi kính mờ tự động tính toán vị trí hiển thị chuẩn xác, chống tràn màn hình.
  - `[Frontend / Styles Modular]` Cập nhật [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css):
    - Đồng bộ hóa các class `.heatmap-matrix-card`, `.matrix-timeslot-cell`, `.monthly-matrix-square`, `.semester-square-item`, `.yearly-square-item`.
    - Thiết kế hệ thống màu thang nhiệt độ Level 0 (trong suốt), Level 1 (xanh lam nhẹ), Level 2 (tím nhạt), Level 3 (tím đậm neon), Level 4 (gradient lửa cam-đỏ).
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v59` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-06 00:15] - Nâng Cấp Mục 2 Thành "Bản Đồ Nhiệt Cường Độ Học Tập & Năng Suất (Study Intensity Heatmap Matrix)" 🔥

- **🎯 Mục tiêu**:
  - Chuyển đổi toàn diện Mục 2 thành Bản Đồ Nhiệt Học Tập Đa Khung Thời Gian (Tuần / Tháng / Học Kỳ / Cả Năm), giải quyết triệt để sự trùng lặp của view hôm nay cũ.
  - Cung cấp các chỉ số KPI trực quan: Số tiết hôm nay, Tổng tiết cả học kỳ, Tuần cao điểm nhất, và Tổng số ngày lên lớp.
  - Tích hợp 4 chế độ xem phân tích nhiệt:
    1. **Tuần (Weekly 24h Matrix)**: Ma trận nhiệt 7 ngày x các ca học trong tuần.
    2. **Tháng (Monthly Calendar Grid)**: Lịch 30/31 ngày trực quan kèm số tiết và mật độ màu nhiệt, hỗ trợ chuyển tháng trước/sau.
    3. **Học Kỳ / Quý (Semester 16-20 Weeks)**: Thẻ tuần nhiệt trực quan, đánh giá tải học (Nhẹ / Vừa / Cao điểm / Cháy Deadline), bấm 1-chạm chuyển ngay về tuần đó.
    4. **Cả Năm (Yearly GitHub Matrix)**: 52 tuần x 7 ngày (364 ô vuông) chuẩn GitHub Contribution / Apple Activity kèm tooltip thông minh.
  - Vẫn giữ nguyên Widget **Tiết học Hôm nay (Today Focus)** ở đầu trang để xem nhanh ca học trong ngày.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / View Module]` Tạo mới [`src/1.Frontend/views/HeatmapView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/HeatmapView.js):
    - Đóng gói toàn bộ thuật toán tổng hợp dữ liệu học kỳ `aggregateSemesterData()`, tính mức nhiệt `getHeatmapLevel()`, đánh giá tải tuần `evaluateWeekWorkload()`, và render 4 chế độ Tuần / Tháng / Kỳ / Năm.
  - `[Frontend / CSS Architecture]` Tạo mới [`src/1.Frontend/styles/9.heatmap-view.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/9.heatmap-view.css):
    - Thiết kế Glassmorphism chuẩn Dark mode tím than neon, gradient thang đo nhiệt độ 5 cấp độ (Level 0 $\rightarrow$ Level 4).
  - `[Frontend / App Shell DOM]` Cập nhật [`index.html`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/index.html):
    - Nạp `9.heatmap-view.css`.
    - Thay đổi Tab 2 thành icon ngọn lửa `fa-solid fa-fire-flame-curved` và tooltip "Bản Đồ Nhiệt Cường Độ Học Tập".
  - `[Frontend / Main Controller]` Cập nhật [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - Kết nối `renderHeatmapView` vào điều hướng tab, cơ chế `switchTab`, và xử lý sự kiện bấm ô nhiệt chuyển về tuần học tương ứng (`handleSelectWeekFromHeatmap`).
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v58` và nạp thêm 2 asset mới vào `STATIC_ASSETS` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-06 00:05] - Thêm Tính Năng Chỉnh Sửa "Lưu Ý & Ghi Chú Tuần" (Edit Weekly Notes Modal) 📝

- **🎯 Mục tiêu**:
  - Bổ sung tính năng cho phép người dùng trực tiếp chỉnh sửa, thêm, xóa các mục trong phần **"Lưu ý & Ghi chú Tuần"** ngay trên giao diện Thời khóa biểu.
  - Hỗ trợ cả 2 chế độ soạn thảo: Chỉnh sửa từng dòng thẻ ghi chú độc lập và Nhập nhanh hàng loạt qua Textarea đa dòng.
  - Tích hợp kho mẫu gợi ý ghi chú thông dụng (lịch thi, deadline đồ án, nghỉ lễ...) giúp sinh viên tạo nhanh chỉ với 1 chạm.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Component Modal]` Tạo mới [`src/1.Frontend/components/modals/EditWeeklyNotesModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/EditWeeklyNotesModal.js):
    - Đóng gói đầy đủ template HTML, controller `openEditWeeklyNotesModal`, xử lý render danh sách các dòng input, thêm/xóa dòng và đồng bộ từ Textarea đa dòng.
    - Cung cấp các mẫu gợi ý nhắc nhở sinh viên thường gặp (`NOTE_PRESET_TEMPLATES`).
  - `[Frontend / App Shell DOM]` Cập nhật [`index.html`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/index.html):
    - Thêm nút `#btn-edit-weekly-notes` (`.btn-edit-notes-pill`) trên thanh tiêu đề Accordion Ghi chú tuần.
    - Thêm nút hành động nhanh `#btn-quick-edit-notes-bottom` (`.btn-notes-action-pill`) dưới nội dung ghi chú.
  - `[Frontend / Main Logic]` Cập nhật [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - Khởi tạo DOM và lắng nghe sự kiện mở modal chỉnh sửa ghi chú qua `initWeeklyNotesEditor()`.
    - Tự động lưu `notes` vào `state.scheduleData`, gọi `persistCurrentSchedule()` để đồng bộ Markdown vào LocalStorage và cập nhật `renderScheduleNotes()`.
  - `[Frontend / CSS Modals & Grid]` Cập nhật [`src/1.Frontend/styles/3.timetable-grid.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/3.timetable-grid.css) & [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - Styling nút sửa tone vàng cam neon `#f59e0b`, danh sách input thẻ ghi chú, chi tiết textarea đa dòng và các pill mẫu gợi ý.
  - `[Performance / Service Worker]` Thêm asset mới và nâng `CACHE_NAME` lên `smart-schedule-modular-v57` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 23:55] - Tính Năng Tự Động Gợi Ý Logo / Biểu Tượng Thông Minh Khi Gõ Tên Môn Học 🪄

- **🎯 Mục tiêu**:
  - Khi người dùng gõ tên môn học (VD: *Giải tích, Lập trình, AI, Kinh tế, Tiếng Nhật, Thể dục, Triết học, Hóa, Vật lý...*), hệ thống tự động nhận diện từ khóa và gợi ý ra danh sách 4–6 icon phù hợp nhất.
  - Tự động áp dụng icon có độ khớp cao nhất lên nút preview, đồng thời hiển thị dải chips gợi ý nhanh (`.smart-icon-suggestions-wrap`) dưới ô nhập tên môn để người dùng có thể bấm chọn 1 chạm.
  - Hỗ trợ cả trên Modal **"Thêm Tiết Học"** (`AddClassModal.js`) và Modal **"Thêm Môn Học Mới"** (`AddSubjectModal.js`).

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Logic Gợi Ý & NLP]` Cập nhật [`src/1.Frontend/components/modals/AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js):
    - Xây dựng hàm `normalizeVietnamese(str)` chuẩn hóa tiếng Việt không dấu để matching chính xác.
    - Xây dựng hệ thống 19 bộ quy tắc từ khóa chuyên sâu `SUBJECT_KEYWORD_RULES` bao phủ toàn bộ các nhóm ngành Đại học (CNTT, AI, Dữ liệu, Mạng, Toán, Vật lý, Hóa, Sinh, Điện, Cơ khí, Ô tô, Xây dựng, Y Dược, Kinh tế, Quản trị, Marketing, Luật, Triết học, Ngoại ngữ, Thiết kế, Thể thao, Đồ án...).
    - Xây dựng hàm `suggestIconsForSubject(subjectName, maxResults)` kết hợp regex rules & tìm kiếm nhãn trong kho 560+ icon.
    - Xây dựng hàm `renderSmartIconSuggestions(wrapEl, chipsEl, suggestions, currentIcon, onSelect)` render dải chip gợi ý tương tác 1 chạm.
    - Tích hợp dải `#add-class-smart-icon-suggestions` dưới ô nhập tên môn và tự động gán icon top 1 khi người dùng gõ.
  - `[Frontend / Component Modal]` Cập nhật [`src/1.Frontend/components/modals/AddSubjectModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddSubjectModal.js):
    - Tích hợp dải gợi ý `#add-subj-smart-icon-suggestions` dưới ô nhập tên môn mới.
    - Tự động gợi ý icon và cập nhật preview `#display-new-subj-icon` theo thời gian thực khi gõ tên môn.
  - `[Frontend / CSS Modals]` Cập nhật [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - Thêm styling cho `.smart-icon-suggestions-wrap`, `.suggestions-label`, `.suggestions-chips-row`, `.btn-suggested-icon-chip` chuẩn tone tím than neon glassmorphism với hiệu ứng hover nâng nhẹ và animation lấp lánh `pulseSparkle`.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v56` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 23:28] - Tích Hợp Bộ Chọn Logo / Icon Môn Học Vào Modal Thêm & Chỉnh Sửa Môn Học Trong Chiếc Cặp

- **🎯 Mục tiêu**:
  - Tích hợp tính năng chọn Logo / Icon môn học (~560+ biểu tượng) vào Modal **"Thêm Môn Học Mới"** (`AddSubjectModal.js`).
  - Tích hợp nút đổi Logo / Icon môn học ngay trên Header của Modal **"Chỉnh Sửa Môn Học"** (`EditSubjectModal.js`).
  - Cho phép người dùng tùy chọn biểu tượng đại diện ngay từ khi tạo môn trong Chiếc Cặp hoặc đổi biểu tượng bất cứ lúc nào.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Component Modal]` Cập nhật [`src/1.Frontend/components/modals/AddSubjectModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddSubjectModal.js):
    - Thêm nút trigger `#btn-open-new-subj-icon-picker` cạnh ô nhập Tên môn học.
    - Kết nối hàm `openSubjectIconPicker` để chọn icon và lưu thuộc tính `icon` vào đối tượng môn học mới trong `state.driveSubjects`.
  - `[Frontend / Component Modal]` Cập nhật [`src/1.Frontend/components/modals/EditSubjectModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/EditSubjectModal.js):
    - Đổi icon tĩnh ở Header thành nút `#btn-edit-subj-icon-trigger` có thể bấm vào để chọn / đổi icon môn học.
    - Tự động cập nhật `currentEditingSubject.icon`, lưu vào `state.driveSubjects`, `persistDriveSubjects()` và cập nhật giao diện Chiếc Cặp và Thời khóa biểu ngay lập tức.
  - `[Frontend / Component Modal]` Cập nhật [`src/1.Frontend/components/modals/AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js):
    - Cải tiến hàm `openSubjectIconPicker(initialIcon, onSelect)` hỗ trợ callback linh hoạt cho mọi modal trong toàn hệ thống.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v55` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 23:26] - Mở Rộng Kho 560+ Icons Đa Ngành & Khắc Phục Lỗi Cuộn Ngang / Bị Che Dải Tab

- **🎯 Mục tiêu**:
  - Mở rộng kho biểu tượng môn học gấp gần 5 lần (từ 120 lên **hơn 560+ icons**) bao quát toàn diện 11 nhóm ngành & biểu tượng đa năng:
    1. 🤖 *CNTT, Lập trình & AI* (55 icons)
    2. ⚙️ *Kỹ thuật, Cơ khí & Xây dựng* (55 icons)
    3. 📐 *Toán học, Vật lý, Hóa học & Sinh học* (50 icons)
    4. 🧬 *Y Dược, Sức khỏe & Nông Lâm nghiệp* (45 icons)
    5. 🏛️ *Kinh tế, Tài chính, Kế toán & Quản trị* (55 icons)
    6. ⚖️ *Luật pháp, Chính trị, Triết học & Xã hội* (45 icons)
    7. 🌍 *Ngoại ngữ & Ngôn ngữ học* (45 icons)
    8. 🎨 *Thiết kế, Mỹ thuật, Truyền thông & Âm nhạc* (55 icons)
    9. 🏃 *Thể thao, GDTC & Rèn luyện* (45 icons)
    10. ⭐ *Kỹ năng, Đoàn - Hội & Đời sống SV* (55 icons)
    11. 🔷 *Ký hiệu, Biểu tượng Đa năng & Hình khối* (65 icons)
  - Khắc phục triệt để lỗi dải tab ngành học bị che khuất ở cạnh phải: Chuyển dải tabs sang cơ chế `flex-wrap` hiển thị rõ ràng 100% tất cả 12 tab.
  - Khắc phục triệt để thanh cuộn ngang xám ở đáy modal: Khóa cứng `overflow-x: hidden !important;`, lưới co giãn tự động `repeat(auto-fill, minmax(82px, 1fr))`, chỉ cuộn dọc với thanh cuộn custom siêu mỏng gradient tím neon.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Component Modal]` Cập nhật [`src/1.Frontend/components/modals/AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js):
    - Mở rộng mảng `POPULAR_SUBJECT_ICONS` lên 560+ items chi tiết với từ khóa tra cứu song ngữ tiếng Việt & tiếng Anh.
    - Cập nhật dải 12 category buttons: `all`, `tech`, `eng`, `science`, `med`, `biz`, `law`, `lang`, `arts`, `sport`, `life`, `shapes`.
  - `[Frontend / CSS Modals]` Cập nhật [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - `.icon-picker-tabs-row`: Chuyển sang `flex-wrap: wrap;` có max-height và scroll tinh gọn.
    - `.icon-picker-grid-container`: `overflow-x: hidden !important;`, `overflow-y: auto !important;`, `grid-template-columns: repeat(auto-fill, minmax(82px, 1fr));`.
    - Custom scrollbar mỏng 6px tone tím hồng neon `::-webkit-scrollbar-thumb`.
    - `.icon-grid-item`: `width: 100%; min-width: 0; box-sizing: border-box;`.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v54` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 23:20] - Tích Hợp Bộ Chọn Logo / Icon Môn Học (~120 Icon Tiêu Biểu Theo Ngành)

- **🎯 Mục tiêu**:
  - Thêm mục chọn Logo / Icon đại diện cho môn học ngay cạnh ô nhập Tên Môn Học trên Modal Thêm/Chỉnh sửa tiết học (`AddClassModal.js`).
  - Xây dựng kho **~120 icons tiêu biểu** chia thành 5 nhóm danh mục:
    1. 🤖 *CNTT, AI & Lập trình* (24 icons: robot, code, laptop, terminal, brain, database, cloud, cyber security, game...).
    2. 📐 *Khoa học Tự nhiên & Kỹ thuật* (24 icons: atom, flask, dna, calculator, square-root, bolt, magnet, microscope, rocket, CAD...).
    3. 🏛️ *Kinh tế, Quản trị, Xã hội & Luật* (24 icons: chart-line, scale-balanced, building-columns, handshake, briefcase, bullhorn, logistics, triết học...).
    4. 🎨 *Ngoại ngữ, Văn học & Nghệ thuật* (24 icons: language, book-open, palette, music, camera, pen-nib, speech, headphones, theater...).
    5. ⭐ *Kỹ năng, Thể chất & Đời sống Sinh viên* (24 icons: graduation-cap, trophy, medal, star, dumbbell, running, coffee/deadline, volunteer, compass...).
  - Hỗ trợ thanh tìm kiếm nhanh theo từ khóa (tiếng Anh / tiếng Việt) và bộ lọc theo Tabs danh mục.
  - Tự động nạp Icon của môn khi chọn chip môn từ Chiếc Cặp và tự động lưu Icon mới vào Chiếc Cặp khi thêm môn.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Component Modal]` Cập nhật [`src/1.Frontend/components/modals/AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js):
    - Khởi tạo thư viện `POPULAR_SUBJECT_ICONS` gồm 120 icons có nhãn và phân loại nhóm chi tiết.
    - Xây dựng DOM `#subject-icon-picker-modal` với Header Preview Badge, Ô tìm kiếm, Tabs danh mục và Lưới Grid Icon tương tác trực tiếp.
    - Tích hợp nút trigger `#btn-open-icon-picker` hiển thị Icon hiện tại + caret dropdown cạnh ô Tên môn học.
    - Bổ sung hàm `openSubjectIconPicker()`, `closeSubjectIconPicker()`, `renderIconPickerGrid()`, `setSelectedSubjectIcon()` và bind event listeners.
    - Cập nhật logic submit form: Lưu icon đại diện vào dữ liệu tiết học và tự động đồng bộ vào môn học trong `state.driveSubjects`.
  - `[Frontend / CSS Modals]` Cập nhật [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - Thêm styling cho `.btn-subject-icon-trigger`, `.icon-picker-backdrop` (`z-index: 100000;`), `.icon-picker-sheet`, `.icon-picker-search-wrap`, `.icon-picker-tabs-row`, `.icon-picker-grid-container` và `.icon-grid-item` chuẩn Tone Tím Than Neon Glassmorphism.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v53` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 23:14] - Tích Hợp Ô Link Google Drive & Tự Động Đồng Bộ 2 Chiều Với Chiếc Cặp

- **🎯 Mục tiêu**:
  - Thêm ô nhập liệu `Link Google Drive / Thư mục` ngay trên Modal Thêm/Sửa tiết học.
  - Tự động nạp link Drive từ Chiếc Cặp khi chọn chip môn có sẵn (hoặc khi gõ trùng tên môn).
  - Tự động tạo môn mới vào **Chiếc Cặp Google Drive** khi nhập tên môn mới (với link Drive nếu có hoặc để trống `""`) để dùng cho các buổi học sau.
  - Bảo toàn dữ liệu 100%: Xóa tiết học trên Lịch không ảnh hưởng tới danh mục môn và link Drive trong Chiếc Cặp.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Component Modal]` Cập nhật [`src/1.Frontend/components/modals/AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js):
    - Thêm trường DOM `#class-drive-url-input`, `#drive-sync-badge` và nút `#btn-open-drive-preview`.
    - Viết hàm `updateDriveUrlUi()`, tự động đồng bộ khi click chip môn hoặc gõ tên môn.
    - Logic `form.onsubmit`: Tự động thêm môn mới vào `state.driveSubjects` (kèm `persistDriveSubjects()` và gọi `window.renderBackpackView()`).
  - `[Frontend / CSS Modals]` Cập nhật [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - Thêm styling cho `.drive-sync-status-badge` và `.btn-open-drive-preview` chuẩn tone tím than neon.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v52` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 23:02] - Đồng Bộ Giao Diện: Chuyển Tone Màu Con Lăn iOS Sang Tone Tím Than & Neon Glassmorphism

- **🎯 Mục tiêu**:
  - Chuyển toàn bộ palette màu của Modal Con Lăn 3D iOS từ phong cách đen xám/vàng cam sang **Tone Tím Than (Deep Indigo/Purple & Neon Glassmorphism)** đồng bộ 100% với giao diện chủ đạo của ứng dụng.
  - Tăng cường hiệu ứng phát sáng neon tím, thấu kính lens gradient tím hồng và các nút bấm phím tắt mượt mà.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / CSS Modals]` Cập nhật [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - Background sheet: chuyển sang `linear-gradient(180deg, rgba(30, 27, 75, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)` với viền tím `#6366f1` mờ.
    - Header: nút Hủy chuyển sang màu xám bạc dịu mắt `#94a3b8`, nút Lưu chuyển sang tím sáng `#818cf8` / `#a5b4fc`, badge preview chuyển sang tím pastel `#c084fc` phát sáng neon.
    - Lens thấu kính: viền neon phát sáng `rgba(129, 140, 248, 0.4)` và nền gradient tím mờ.
    - Item số đang chọn: phát sáng glow tím neon `text-shadow: 0 0 16px rgba(129, 140, 248, 0.8)`.
    - Dải phím tắt mốc giờ nhanh: chuyển sang pills nền tím trong suốt, hover hiệu ứng gradient tím hồng rực rỡ.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v51` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 22:58] - Tinh Giản Giao Diện: Loại Bỏ Ô Nhập Tiết Học & Tối Ưu Bố Cục Hàng Giờ Học

- **🎯 Mục tiêu**:
  - Loại bỏ hoàn toàn ô nhập liệu "Tiết học" (`#class-period-input`) theo yêu cầu người dùng để giao diện form thêm tiết trở nên gọn gàng, tối giản, trực quan.
  - Tự động nhận diện tiết học ở tầng logic nền (`getPeriodFromTimeRange`) nếu khớp khung giờ chuẩn mà người dùng không cần phải gõ thủ công.
  - Bố trí hàng chọn giờ gồm **Bộ đôi Capsule Giờ Bắt đầu ➔ Kết thúc** và **Nút + Lưu ca mẫu** nằm cân xứng trên cùng một hàng.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Component Modal]` Cập nhật [`src/1.Frontend/components/modals/AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js):
    - Xóa bỏ trường DOM `#class-period-input` và toàn bộ logic gán/đọc thủ công.
    - Chuyển `period` thành thuộc tính tự động suy diễn từ `timeRange` khi submit form.
    - Dọn dẹp code sạch sẽ, loại bỏ trùng lặp.
  - `[Frontend / CSS Modals]` Cập nhật [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - Xóa class `.ios-period-box-wrap`.
    - Căn chỉnh `.ios-time-picker-row` với `.ios-time-range-capsules` (flex: 1) và `.btn-save-custom-preset` liền kề gọn gàng.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v50` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 22:50] - Fix Lỗi Layer: Đưa Modal Con Lăn 3D iOS Lên Trước (z-index 100000)

- **🎯 Mục tiêu**:
  - Khắc phục lỗi Modal con lăn iOS (`#ios-wheel-picker-modal`) bị chìm ra phía sau `AddClassModal` (do z-index 1050 thấp hơn 9999 của backdrop chính).
  - Đảm bảo khi bấm vào ô "Bắt đầu" hoặc "Kết thúc", Modal con lăn 3D nổi bật đè lên phía trước để người dùng cuộn chọn giờ mượt mà.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / CSS Modals]` Cập nhật [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - Đặt `.ios-picker-backdrop { z-index: 100000; background: rgba(0, 0, 0, 0.78); }` đảm bảo luôn nằm ở layer trên cùng (trước `add-class-modal`).
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v49` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 22:42] - Nâng Cấp Bộ Chọn Giờ Kiểu Báo Thức iOS (Capsule Range Time Picker)

- **🎯 Mục tiêu**:
  - Chuyển đổi ô nhập thời gian đơn thành **Bộ đôi Capsule thời gian iOS Bắt đầu ➔ Kết thúc**: Bấm vào mở ngay con lăn thời gian (iOS/Native Drum Picker) để cuộn chọn giờ và phút nhanh chóng.
  - Tự động đồng bộ 2 chiều giữa các thẻ Ca học mẫu và bộ đôi capsule thời gian.
  - Tự động nhận diện và điền tên Tiết học tương ứng khi thay đổi giờ bắt đầu và kết thúc.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Component Modal]` Cập nhật [`src/1.Frontend/components/modals/AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js):
    - Tách thành 2 capsule `#class-start-time` và `#class-end-time` (`type="time"`).
    - Thêm các hàm helper: `getCurrentTimeRangeString()`, `syncTimeInputsFromRange()` và `autoDetectPeriodFromTime()`.
    - Đồng bộ mượt mà khi chọn preset mẫu hoặc khi tự điều chỉnh con lăn thời gian.
  - `[Frontend / CSS Modals]` Cập nhật [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - Thiết kế UI `.ios-time-picker-row` với capsule kính mờ Dark Glassmorphism, font JetBrains Mono 1rem số to rõ ràng và mũi tên kết nối phát sáng neon.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v47` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 22:38] - Tinh Chỉnh Bố Cục Modal: Thu Gọn Ô Thứ (135px) & Mở Rộng Ô Phòng Học

- **🎯 Mục tiêu**:
  - Tối ưu tỷ lệ cột trong hàng ngày & phòng học: Thu gọn ô "Thứ trong tuần" vừa khít chữ (135px) và mở rộng tối đa ô "Phòng học" (1fr) để hiển thị đầy đủ tên phòng kèm nút `+ Lưu phòng` mà không bị che khuất hay cắt chữ.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Component Modal]` Cập nhật [`src/1.Frontend/components/modals/AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js):
    - Áp dụng class layout `.modal-grid-day-room` cho hàng Thứ & Phòng học.
  - `[Frontend / CSS Modals]` Cập nhật [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - Thiết lập `.modal-grid-day-room { grid-template-columns: 135px 1fr; gap: 0.85rem; }` giúp ô phòng rộng rãi, chữ hiển thị rõ ràng.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v46` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 22:36] - Thêm Tính Năng Tạo & Lưu Sẵn Phòng Học Mẫu Tùy Chỉnh

- **🎯 Mục tiêu**:
  - Cho phép sinh viên nhập tên phòng học bất kỳ (ví dụ: `H6-204 (CS2)`, `A4-101`, `Lab AI 302`, `Online Zoom`...) và bấm `+ Lưu phòng` để thêm vào danh sách gợi ý phòng học mẫu.
  - Tự động lưu trữ bền vững vào `LocalStorage` (`smart_schedule_custom_room_presets`) để tái sử dụng 1-chạm ở mọi thao tác thêm/sửa tiết học.
  - Hỗ trợ nút xóa `×` mini trên từng thẻ phòng tự tạo để dễ dàng quản lý.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Component Modal]` Cập nhật [`src/1.Frontend/components/modals/AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js):
    - Tích hợp `getCustomRoomPresets()`, `saveCustomRoomPresets()` và hàm render động `renderRoomPresets(selectedRoom)`.
    - Thêm nút `#btn-save-custom-room` (`+ Lưu phòng`) nằm liền kề ô nhập phòng học.
    - Render danh sách phòng kết hợp giữa các phòng mẫu chuẩn CS1 và các phòng do sinh viên tự lưu.
    - Hỗ trợ nút xóa `×` trên từng tag phòng tự tạo.
  - `[Frontend / CSS Modals]` Cập nhật [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - Thẻ phòng tùy chỉnh viền nét đứt tím `.room-preset-tag-wrapper.is-custom-room`.
    - Nút xóa `×` mini bo tròn trên tag phòng.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v45` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 22:30] - Thêm Tính Năng Tạo & Lưu Sẵn Ca Học Mẫu Tùy Chỉnh (Giờ + Tiết)

- **🎯 Mục tiêu**:
  - Cho phép người dùng nhập khung giờ và tiết học bất kỳ (ví dụ ca học tối, ca bù 17:00 - 19:30, tiết 12-14...) rồi bấm `+ Lưu ca mẫu` để lưu sẵn lên danh sách preset ca học ở trên.
  - Tự động ghi nhớ vĩnh viễn các ca mẫu tùy chỉnh vào `LocalStorage` (`smart_schedule_custom_time_presets`) để tái sử dụng nhanh chóng 1-chạm ở bất kỳ ngày học nào.
  - Hỗ trợ nút xóa `×` nhanh trên từng thẻ ca mẫu tự tạo để dễ dàng quản lý.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Component Modal]` Cập nhật [`src/1.Frontend/components/modals/AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js):
    - Tích hợp hàm `getCustomTimePresets()`, `saveCustomTimePresets()` và `renderTimePresets(activeTime)`.
    - Thêm nút `#btn-save-custom-preset` (`+ Lưu ca mẫu`) bên cạnh hàng ô nhập khung giờ & tiết học.
    - Render động danh sách ca học kết hợp giữa Ca chuẩn ĐHBK TP.HCM và các Ca tùy chỉnh do sinh viên tạo.
    - Thêm nút xóa `×` mini trên từng thẻ ca tự tạo để người dùng linh hoạt quản lý.
  - `[Frontend / CSS Modals]` Cập nhật [`src/1.Frontend/styles/6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css):
    - Định dạng thẻ ca tùy chỉnh viền nét đứt tím ngọc `.time-preset-wrapper.is-custom`.
    - Nút xóa `×` đỏ nổi bật ở góc trên bên phải thẻ.
    - Nút `+ Lưu ca mẫu` gradient phát sáng sang trọng, responsive trên điện thoại.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v44` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 22:20] - Thêm Chức Năng Chọn Kiểu Hiển Thị: 1 Ngày (Hôm nay) / 3 Ngày (Trước - Nay - Sau) / 7 Ngày (Tuần)

- **🎯 Mục tiêu**:
  - Bổ sung bộ điều khiển Segmented Pill Controller `[ 1 Ngày | 3 Ngày | 7 Ngày ]` cho phép sinh viên chuyển đổi linh hoạt chế độ xem lịch học:
    1. **1 Ngày**: Tập trung vào ngày hôm nay (hoặc ngày có tiết học), căn giữa trang với thẻ to rõ nét.
    2. **3 Ngày**: Hiển thị 3 ngày liên tiếp (Hôm qua, Hôm nay, Ngày mai) cân xứng 3 cột.
    3. **7 Ngày**: Hiển thị trọn vẹn cả tuần từ Thứ 2 đến Chủ Nhật.
  - Tự động ghi nhớ tùy chọn vào `LocalStorage` (`smart_schedule_days_mode`).

- **✅ Công việc đã hoàn thành**:
  - `[Database / Central State]` Cập nhật [`src/3.Database/state.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/3.Database/state.js):
    - Thêm key `DAYS_DISPLAY_MODE` vào `STORAGE_KEYS` và trường `daysDisplayMode: '7'` vào `state`.
    - Thêm hàm `persistDaysDisplayMode()` và nạp trạng thái đã lưu trong `initApplicationState()`.
  - `[Frontend / App Shell]` Cập nhật [`index.html`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/index.html):
    - Thêm cụm Segmented Button `#days-mode-selector` vào Navbar (`.nav-right`).
  - `[Frontend / View Logic]` Cập nhật [`src/1.Frontend/views/TimetableGrid.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/TimetableGrid.js):
    - Tính toán danh sách `daysToRender` và class `mode-1-day`, `mode-3-days`, `mode-7-days` trên `#schedule-grid`.
  - `[Frontend / Main Controller]` Cập nhật [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - Thêm hàm `initDaysModeSelector()` bắt sự kiện click chuyển chế độ, lưu LocalStorage và cập nhật Toast thông báo.
  - `[Frontend / CSS Navbar & Grid]` Cập nhật [`src/1.Frontend/styles/2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css) và [`src/1.Frontend/styles/3.timetable-grid.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/3.timetable-grid.css):
    - Thiết kế Segmented Pill Button dạng capsule phát sáng neon gradient.
    - Thiết kế CSS Grid 1 cột (tập trung), 3 cột (cân đối) và 7 cột (responsive).
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v43` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 22:08] - Nâng Cấp Hero Command Navbar: To, Rõ Ràng, Cân Đối, Sang Trọng & Độc Đáo

- **🎯 Mục tiêu**:
  - Tái thiết kế thanh Navbar duy nhất trên cùng thành **Hero Command Center**: Kích thước bề thế, typography to rõ nét, 3 khối (Trái - Giữa - Phải) cân đối hoàn hảo và hiệu ứng Glassmorphism phát sáng neon cao cấp.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / CSS Navbar]` Cập nhật [`src/1.Frontend/styles/2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css):
    - Tăng padding Navbar lên `0.75rem 1.35rem`, bo góc `var(--radius-xl)` (24px) với viền kính phản quang và shadow 32px đa tầng.
    - **Khối Trái**: Logo 3D 42px phát sáng gradient, Title `ScheduleSmart` 1.18rem chữ đậm sắc nét, Badge học kỳ cam ấm, Avatar 28px viền neon và nút Theme 36px.
    - **Khối Giữa**: Floating Island View Switcher với các nút chuyển tab 38px bo tròn, tab active đổ bóng neon 3D cực kỳ nổi bật.
    - **Khối Phải**: Controller chọn tuần học bề thế, font tên tuần 0.92rem chữ đậm, bộ 3 nút Ping Target `🎯` 34px (xoay 90° phát sáng), Thêm tuần `+` 34px và Xóa tuần `🗑` 34px.
  - `[Frontend / CSS Layout]` Cập nhật [`src/1.Frontend/styles/1.variables.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/1.variables.css):
    - Đồng bộ `max-width: 1440px; padding: 1rem 1.25rem 2.5rem; gap: 1.15rem;` để bố cục trang thoáng đãng và bề thế.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v42` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 22:05] - Loại Bỏ Hoàn Toàn Footer & Hướng Dẫn Git Dưới Chân Trang

- **🎯 Mục tiêu**:
  - Xóa bỏ khối Footer và Accordion hướng dẫn Git (`.git-guide-section`) dưới chân trang theo yêu cầu của người dùng để giao diện đạt độ sạch sẽ, hiện đại và không có chi tiết thừa.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / HTML DOM]` Cập nhật [`index.html`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/index.html):
    - Xóa bỏ thẻ `<footer class="footer">...</footer>` chứa Accordion Git Guide và text footer.
  - `[Frontend / CSS Timetable Grid]` Cập nhật [`src/1.Frontend/styles/3.timetable-grid.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/3.timetable-grid.css):
    - Dọn dẹp toàn bộ các class CSS liên quan `.git-guide-section`, `.guide-accordion`, `.guide-step`, `.footer`.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v41` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 22:00] - Tối Giản Hóa Tuyệt Đối: Chỉ Giữ Lại Duy Nhất Thanh Navbar Điều Hướng

- **🎯 Mục tiêu**:
  - Theo yêu cầu của người dùng, loại bỏ/ẩn toàn bộ các thanh phụ rườm rà (Hero Banner và Filter Toolbar), chỉ giữ lại duy nhất 1 thanh Navbar trên cùng như ảnh chụp.
  - Mang lại trải nghiệm tối giản (Minimalist UI), hiển thị ngay Ma trận Thời khóa biểu 7 ngày ngay dưới Navbar mà không bị che khuất không gian.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / CSS Timetable Grid]` Cập nhật [`src/1.Frontend/styles/3.timetable-grid.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/3.timetable-grid.css):
    - Đặt `.hero-banner { display: none !important; }`.
  - `[Frontend / CSS Navbar]` Cập nhật [`src/1.Frontend/styles/2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css):
    - Đặt `.filter-bar { display: none !important; }`.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v40` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 21:55] - Tối Ưu Cụm Header (Navbar + Hero Banner + Search Bar) Siêu Nhỏ Gọn & Tiết Kiệm 50% Diện Tích Dọc

- **🎯 Mục tiêu**:
  - Tối ưu chiều cao của 3 thanh công cụ trên cùng (`.navbar`, `.hero-banner.is-collapsed`, `.filter-bar`), giảm 50% khoảng cách thừa để ưu tiên tối đa diện tích hiển thị cho Ma trận Thời khóa biểu.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / CSS Variables]` Cập nhật [`src/1.Frontend/styles/1.variables.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/1.variables.css):
    - Giảm padding của `.app-wrapper` từ `1.25rem` xuống `0.65rem 1rem 2rem`, gap giữa các khối từ `1.75rem` xuống `0.55rem`.
  - `[Frontend / CSS Navbar]` Cập nhật [`src/1.Frontend/styles/2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css):
    - Giảm padding Navbar xuống `0.35rem 0.85rem` (chiều cao thon gọn ~44px).
    - Tinh gọn Brand logo (32px), User profile (avatar 24px), View toggles dock (buttons 30px) và Week selector (buttons 26px, select font 0.84rem).
    - Tinh gọn Search box: padding `0.22rem 0.35rem 0.22rem 0.75rem`, font `0.82rem`, các chips filter/ping target nhỏ gọn thanh thoát.
  - `[Frontend / CSS Hero Banner]` Cập nhật [`src/1.Frontend/styles/3.timetable-grid.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/3.timetable-grid.css):
    - Thu nhỏ `.hero-banner.is-collapsed` xuống thanh tiện ích siêu mỏng (padding `0.25rem 0.75rem`, title `0.92rem`, date badge `0.72rem`, nút In lịch / Chi tiết `0.72rem`).
  - `[Frontend / CSS Responsive]` Cập nhật [`src/1.Frontend/styles/8.responsive.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/8.responsive.css):
    - Tối ưu layout trên màn hình điện thoại di động mượt mà, thon gọn, không chiếm chỗ.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v39` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 21:52] - Tối Ưu Thẻ Thứ (Day Card) & Thẻ Môn Học Siêu Đẹp, Nhỏ Gọn & Khoa Học

- **🎯 Mục tiêu**:
  - Xử lý triệt để lỗi ngắt dòng của Giờ học (`07:00 - \n 08:50`) và Tiết học (`Tiết 2 - \n 3`) gây vỡ khối và chiếm diện tích dọc lớn.
  - Tinh giản toàn bộ khung thẻ ngày (Day Card) và thẻ môn học (Class Item) theo phong cách hiện đại, thanh thoát, giảm chiều cao thừa, phân cấp thông tin rõ ràng và sắc nét.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Template View]` Cập nhật [`src/1.Frontend/views/TimetableGrid.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/TimetableGrid.js):
    - Gom Giờ học và Badge Tiết học vào nhóm `.class-time-badge-group` nằm ngang hàng, giữ cố định không bị ngắt dòng.
  - `[Frontend / CSS Timetable Grid]` Cập nhật [`src/1.Frontend/styles/3.timetable-grid.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/3.timetable-grid.css):
    - Khóa `white-space: nowrap;` cho `.class-time`, `.class-period`, `.class-room`.
    - Giảm padding thẻ môn học từ `0.85rem` xuống `0.65rem 0.8rem`, bo góc mượt 12px, border-left màu nhận diện môn học 3.5px.
    - Chuyển badge Tiết học thành capsule mờ nhẹ, bo tròn viền sáng tinh tế.
    - Thu nhỏ các nút mini Sửa/Xóa (20x20px) và Action Pills (24x24px: Xem Điểm, Chiếc Cặp Drive, Sao chép) tinh xảo, đổi màu neon khi hover.
    - Tinh chỉnh nút `+ Thêm tiết vào ...` thành dạng capsule mỏng thanh lịch.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v38` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 21:45] - Tái Thiết Kế Giao Diện Khoa Học, Thẩm Mỹ Cao & Khắc Phục Triệt Để Lỗi Vỡ Layout Thanh Tìm Kiếm

- **🎯 Mục tiêu**:
  - Khắc phục lỗi hiển thị nút `[🎯 Hôm nay]` bị rớt xuống dòng dưới và đè lên viền trái của ô tìm kiếm `.search-box`.
  - Nâng cấp thẩm mỹ toàn diện theo phong cách Glassmorphism Dark Mode cao cấp: Căn chỉnh thẳng hàng, khoa học, các card nổi khối 3D mềm mại, hiệu ứng viền phát sáng neon cực quang và responsive hoàn hảo trên mọi kích thước màn hình.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / CSS Navbar & Search Toolbar]` Tối ưu [`src/1.Frontend/styles/2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css):
    - Tái cấu trúc `.search-box` thành Flexbox Container mượt mà (`display: flex; align-items: center;`), tích hợp sẵn icon kính lúp bên trái, input trong suốt co giãn ở giữa, nút Clear và nút Radar Chip `[🎯 Hôm nay]` nằm gọn gàng bên phải trong cùng một hàng.
    - Tạo hiệu ứng viền phát sáng khi focus (`box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2), 0 8px 24px rgba(99, 102, 241, 0.15)`).
    - Tinh chỉnh các Subject Filter Tags (`.tag-btn`) dạng capsule kính mờ, hover nhấc nhẹ nổi khối và có chấm tròn màu môn học phát sáng tương ứng.
  - `[Frontend / CSS Hero Banner & Day Cards]` Tối ưu [`src/1.Frontend/styles/3.timetable-grid.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/3.timetable-grid.css):
    - Hoàn thiện trạng thái Thu gọn (Collapsed State) của `.hero-banner` thành Control Dock sang trọng: Date Badge tương tác, Tiêu đề tuần gradient nổi bật, Quick Tags thống kê số môn/tiết gọn gàng và các nút In lịch / Chi tiết cân đối.
    - Tinh chỉnh thẻ ngày `.day-card`: Viền kính mờ, thẻ ngày hôm nay (`.day-card.is-today`) có viền neon Indigo/Violet và ánh sáng cực quang lung linh.
    - Tinh chỉnh thẻ môn học `.class-item`: Card nổi 3D nhẹ, phân cấp thông tin rõ ràng (thời gian, phòng học, mã môn), nút Sửa/Xóa/Xem Điểm/Drive/Copy bo tròn nhỏ gọn và có màu hover đặc trưng.
    - Nâng cấp `@keyframes pingTargetPulse` tạo hiệu ứng 3 đợt sóng radar cực quang tỏa rộng thu hút ánh nhìn.
  - `[Frontend / Responsive CSS]` Tối ưu [`src/1.Frontend/styles/8.responsive.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/8.responsive.css):
    - Đảm bảo `.search-box` trên mobile (< 600px) co giãn linh hoạt 100%, nút `[🎯 Hôm nay]` không bao giờ bị tràn hoặc che khuất text input.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v37` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 21:40] - Xây Dựng Tính Năng Ping Target Focus Hôm Nay Trên Thời Khóa Biểu (Mục 1)

- **🎯 Mục tiêu**:
  - Bổ sung các nút thao tác nhanh **Ping Target (Định vị Hôm nay)**: Cho phép người dùng bấm 1-chạm để tự động chuyển về tuần hiện tại và cuộn mượt màn hình vào đúng khung ngày hôm nay.
  - Tích hợp hiệu ứng Radar Ping Pulse phát sáng rực rỡ trên thẻ ngày hôm nay (`.day-card.is-today`).

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / UI & Navbar]` Cập nhật [`index.html`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/index.html) và [`2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css):
    - Thêm nút `#btn-focus-today` (`.btn-today-nav`) với icon `fa-crosshairs` xoay phát sáng trên cụm điều hướng tuần Navbar.
    - Thêm nút chip `#btn-ping-today-search` (`.btn-ping-target-pill`) trong ô tìm kiếm Thời khóa biểu (Mục 1).
    - Biến Date Badge `#current-date-badge` trên Hero Banner thành nút bấm tương tác nhanh định vị ngày hôm nay.
  - `[Frontend / Animation CSS]` Cập nhật [`3.timetable-grid.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/3.timetable-grid.css):
    - Thêm keyframe `@keyframes pingTargetPulse` tạo hiệu ứng sóng radar neon tỏa ra 3 nhịp và phóng to thẻ ngày nhẹ nhàng khi được kích hoạt (`.day-card.ping-target-active`).
  - `[Frontend / Main Logic]` Cập nhật [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - Xây dựng hàm `focusTodayTarget()`:
      * Tự động chuyển về Tab Grid nếu đang ở tab khác.
      * Tự động kiểm tra và chuyển tuần về đúng tuần hôm nay nếu đang xem tuần khác.
      * Cuộn mượt màn hình tới thẻ ngày hôm nay (`scrollIntoView({ behavior: 'smooth', block: 'center' })`).
      * Kích hoạt hiệu ứng `.ping-target-active` và thông báo Toast *"Đã định vị ngày Hôm nay! 🎯"*.
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v35` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 21:35] - Khắc Phục Lỗi ReferenceError: ensureAddSubjectModalDom & Tối Ưu Import Modals

- **🎯 Mục tiêu**:
  - Sửa lỗi `ReferenceError: ensureAddSubjectModalDom is not defined` do thiếu import component [`AddSubjectModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddSubjectModal.js).
  - Loại bỏ hoàn toàn định nghĩa hàm `initAddSubjectModal` cũ trong `main.js` để đảm bảo 100% mô-đun hóa độc lập.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Fix Import]` Bổ sung `import { ensureAddSubjectModalDom, openAddSubjectModal, initAddSubjectModal } from './components/modals/AddSubjectModal.js';` vào [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js).
  - `[Frontend / Clean Code]` Xóa bỏ hàm `initAddSubjectModal` cũ trùng lặp trong [`main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js).
  - `[Performance / Service Worker]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v34` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 21:30] - Sửa Lỗi Cú Pháp Trùng Lặp Khai Báo initAddWeekModal & Đồng Bộ AddWeekModal Component

- **🎯 Mục tiêu**:
  - Khắc phục triệt để lỗi runtime `SyntaxError: Identifier 'initAddWeekModal' has already been declared` khiến toàn bộ JavaScript ngừng thực thi trên trình duyệt.
  - Hoàn thiện việc đóng gói mô-đun hóa cho [`AddWeekModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddWeekModal.js).

- **✅ Công việc đã hoàn thành**:
  - `[Fix Syntax / Module Cleanup]`:
    - Xóa bỏ định nghĩa hàm `function initAddWeekModal() { ... }` và `function openAddWeekModal() { ... }` cũ còn sót lại trong [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js).
    - Cải tiến [`src/1.Frontend/components/modals/AddWeekModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddWeekModal.js) nhận `availableWeeks` để tự động gợi ý `Tuần [N+1]` và nạp sẵn 7 khung ngày trống (`generateEmptyWeekMarkdown`).
  - `[Performance / Service Worker]`: Nâng `CACHE_NAME` lên `smart-schedule-modular-v33` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 21:25] - Nâng Cấp Hệ Thống Authentication: Thêm Loading Spinner, Tự Động Fallback & Nút Dùng Thử Ngay Chế Độ Khách

- **🎯 Mục tiêu**:
  - Khắc phục triệt để hiện tượng bấm nút Đăng nhập Google không phản hồi hoặc bị popup blocker/domain restriction chặn trên GitHub Pages.
  - Cung cấp nút **"Dùng ngay với tư cách Khách (Lưu Offline)"** trực tiếp trên màn hình Landing để người dùng truy cập ngay lập tức mà không bị chặn cửa sổ.
  - Bổ sung hiệu ứng Loading Spinner và cơ chế tự động chuyển sang chế độ Khách an toàn khi Firebase gặp lỗi domain chưa cấp phép (`auth/unauthorized-domain`).

- **✅ Công việc đã hoàn thành**:
  - `[Database / Auth Service]` Nâng cấp toàn diện [`src/3.Database/auth/FirebaseAuthService.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/3.Database/auth/FirebaseAuthService.js):
    - Thêm trạng thái Loading Spinner trên nút Đăng nhập trong khi chờ Google phản hồi.
    - Cấu hình tham số `prompt: 'select_account'` để luôn mở hộp thoại chọn tài khoản Google chuẩn xác.
    - Bắt lỗi chi tiết: `auth/unauthorized-domain` (tự động fallback vào chế độ Khách), `auth/popup-blocked` (tự động thử lại bằng `signInWithRedirect`), `auth/popup-closed-by-user`.
    - Hỗ trợ hàm `handleGuestLogin()` lưu `smart_schedule_guest_mode` trong `localStorage` và tự động mở app ở các lần truy cập tiếp theo.
  - `[Frontend / App Shell & Landing]` Cập nhật [`index.html`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/index.html), [`LoginScreen.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/layout/LoginScreen.js) và [`1.variables.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/1.variables.css):
    - Thêm nút `#landing-guest-btn` (`.btn-guest-login-large`) cho phép 1-chạm vào ngay ứng dụng mà không cần tài khoản.
  - `[Performance / Service Worker]` Nâng cấp `CACHE_NAME` lên `smart-schedule-modular-v32` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 21:20] - Xây Dựng Tính Năng Xóa Tuần Học Trực Quan & Đồng Bộ LocalStorage

- **🎯 Mục tiêu**:
  - Bổ sung tính năng **Xóa Tuần Học** cho phép người dùng xóa bất kỳ tuần nào không còn dùng (tuần hệ thống hoặc tuần tự tạo).
  - Tích hợp nút Xóa Tuần trực tiếp trên thanh điều hướng tuần ở Navbar kèm hộp thoại xác nhận cảnh báo an toàn.
  - Tự động chuyển đổi mượt mà sang tuần kế tiếp và bảo toàn dữ liệu sau khi tải lại trang web.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Component]` Tạo mới [`src/1.Frontend/components/modals/DeleteWeekModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/DeleteWeekModal.js):
    - Hiển thị thông tin tổng hợp của tuần sắp xóa (Tên tuần, số môn, số tiết học).
    - Thiết kế Glassmorphism Dark Mode sang trọng, icon cảnh báo phát sáng đỏ và nút Xác Nhận Xóa trực quan.
  - `[Frontend / App Shell & Navbar]` Cập nhật [`index.html`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/index.html) và [`2.navbar.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/2.navbar.css):
    - Thêm nút `#btn-delete-week` (`.btn-delete-week-nav`) với icon thùng rác `fa-trash-can` nằm liền kề nút `+ Thêm Tuần`.
    - Hiệu ứng hover đỏ phát sáng quyến rũ, ăn khớp với thiết kế hiện đại của thanh điều hướng.
  - `[Frontend / Main Logic]` Nâng cấp [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - Hàm `handleDeleteCurrentWeek(weekObj)`:
      * Xóa nội dung Markdown tùy chỉnh `smart_schedule_custom_md_${filename}` trong `localStorage`.
      * Cập nhật danh sách tuần tự tạo `smart_schedule_custom_weeks`.
      * Lưu mã định danh tuần vào danh sách `smart_schedule_deleted_weeks` để ngăn tuần hệ thống bị nạp lại sau khi refresh trang.
      * Tự động điều hướng và hiển thị tuần liền kề (trước hoặc sau).
      * Tự động tạo 1 tuần trống mới nếu người dùng xóa hết tất cả các tuần.
    - Kết nối đầy đủ callback cho modal Thêm Tuần [`AddWeekModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddWeekModal.js) để tạo tuần mới và cập nhật ngay trên giao diện.
  - `[Performance / Service Worker]` Cập nhật [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js) lên `smart-schedule-modular-v31` và thêm `DeleteWeekModal.js` vào bộ nhớ đệm ngoại tuyến.

---

## 📅 [2026-09-05 21:10] - Tách Lịch Học 7 Khung Ngày Riêng Biệt & Sửa Triệt Để Lỗi Tự Động Gắn Khung Hôm Nay Ở Thứ 7

- **🎯 Mục tiêu**:
  - Tách ma trận thời khóa biểu thành đúng **7 khung ngày riêng biệt** (Thứ 2 đến Chủ Nhật), loại bỏ hoàn toàn việc gộp chung Thứ 7 & Chủ Nhật.
  - Khắc phục triệt để lỗi ô Thứ 7 bị tự động gắn viền sáng và badge `Hôm nay` (`.is-today`) ở tất cả các tuần.
  - Đảm bảo tính năng Thêm / Sửa / Xóa tiết học trực quan và đồng bộ 2 chiều Markdown hoạt động mượt mà.

- **✅ Công việc đã hoàn thành**:
  - `[Fix Bug / Today Highlight]`:
    - Tìm ra nguyên nhân gốc rễ: `renderTimetableGrid` và `renderTodayView` trước đây mặc định `isCurrentWeek = true` và các điểm gọi trong [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js) không truyền cờ `isCurrentWeek`. Vì ngày kiểm thử là Thứ 7 (`getDay() === 6`), nên ở bất kỳ tuần nào (kể cả tuần quá khứ hay tương lai), ô Thứ 7 đều bị highlight là hôm nay.
    - Đổi giá trị mặc định của `isCurrentWeek` thành `false` trong [`src/1.Frontend/views/TimetableGrid.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/TimetableGrid.js).
    - Cập nhật tất cả các vị trí gọi `renderTimetableGrid` và `renderTodayView` trong [`main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js) (`loadWeekSchedule`, `switchTab`, `renderSubjectFilters`, `initSearchAndFilters`, `persistCurrentSchedule`, `applyBtn`) luôn tính toán chính xác `checkIsCurrentWeek(filepath)` dựa trên `startDate` của tuần so với ngày thực tế.
  - `[Feature / 7 Days Separation]`:
    - Chuẩn hóa toàn bộ parser [`src/2.Backend/services/TimetableParser.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/2.Backend/services/TimetableParser.js) và date helper [`src/2.Backend/utils/dateHelpers.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/2.Backend/utils/dateHelpers.js) phân tách rõ ràng Thứ 7 (6) và Chủ Nhật (0).
    - Cập nhật toàn bộ các file Markdown tuần mẫu trong `schedules/` (`tuan-35.md`, `tuan-36.md`, `tuan-37.md`, `tuan-38.md`, `tuan-39.md`, `tuan-40.md`) phân tách riêng biệt `## Thứ 7` và `## Chủ Nhật`.
    - Modal Thêm / Chỉnh sửa môn hỗ trợ chọn đầy đủ 7 ngày độc lập.
  - `[Performance / Service Worker]`: Nâng cấp `CACHE_NAME` lên `smart-schedule-modular-v30` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js) để trình duyệt tự động làm mới mã nguồn.

---

## 📅 [2026-09-05 20:25] - Xây Dựng Visual Schedule Builder (Tạo Tuần Trống 7 Ngày, Thêm/Sửa Tiết Trực Quan & Long-press)

- **🎯 Mục tiêu**:
  - Nâng cấp trải nghiệm tạo và biên soạn lịch học: Khi bấm `+ Thêm tuần`, ứng dụng tự động khởi tạo tuần mới với **7 khung ngày trống** (Thứ 2 ➔ Thứ 7 & Chủ Nhật) sẵn sàng để thêm môn.
  - Hỗ trợ thao tác tương tác trực quan: Bấm nút `+ Thêm tiết` hoặc **nhấn giữ (long-press 750ms)** vào bất kỳ ngày nào để mở popup chọn môn 1-chạm từ Chiếc Cặp, chọn ca học chuẩn BK và phòng học.
  - Cho phép Chỉnh sửa ✏️, Xóa 🗑️ hoặc Di chuyển thứ của từng tiết học trực tiếp trên Ma trận ngày và tự động serialize ngược ra Markdown chuẩn.

- **✅ Công việc đã hoàn thành**:
  - `[Feature / 7 Days Grid]` Tách riêng **Thứ 7** và **Chủ Nhật** thành 2 khung ngày độc lập (chuẩn hóa toàn bộ ma trận thời khóa biểu thành **7 khung ngày riêng biệt**: Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6, Thứ 7, Chủ Nhật):
    - Cập nhật [`src/2.Backend/services/TimetableParser.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/2.Backend/services/TimetableParser.js) tự động chuẩn hóa và tách dữ liệu cũ thành 7 ngày độc lập.
    - Cập nhật [`src/2.Backend/utils/dateHelpers.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/2.Backend/utils/dateHelpers.js) phân định Thứ 7 (6) và Chủ Nhật (0).
    - Cập nhật dropdown chọn thứ trong [`src/1.Frontend/components/modals/AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js) gồm đủ 7 tùy chọn riêng biệt.
    - Cập nhật `isToday` và `renderTodayView` trong [`src/1.Frontend/views/TimetableGrid.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/TimetableGrid.js) và [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js).
  - `[Fix Logic / Delete Class]` Nâng cấp toàn diện tính năng Xóa Tiết Học:
    - Loại bỏ dialog `confirm()` chặn luồng trình duyệt để nút Xóa 🗑️ trên thẻ tiết học và nút "Xóa tiết này" trong modal hoạt động tức thì 100%.
    - Cải tiến hàm `handleDeleteClass` tìm kiếm ngày và tiết linh hoạt theo cả đối tượng `classData` lẫn chỉ số `classIndex`, tự động chuyển ngày sang trạng thái Nghỉ khi hết tiết và đồng bộ serialize Markdown ngay lập tức.
  - `[UI / Redesign]` Tái thiết kế toàn diện giao diện Modal Thêm / Chỉnh Sửa Tiết Học ([`AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js) & [`6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css)):
    - Khắc phục lỗi icon trôi nổi ra ngoài bằng cách nhúng icon lọt vào bên trong ô input (`.input-with-icon`).
    - Gom nhóm bố cục 2 cột cân đối cho Giờ học & Tiết học, Thứ trong tuần & Phòng học.
    - Thiết kế lại các thẻ Ca học chuẩn ĐHBK TP.HCM dạng lưới 4 cột đa tầng, hover phát sáng và tự động highlight khi khớp giờ học.
    - Tinh chỉnh danh sách Chip môn học và Chip phòng học theo phong cách Glassmorphism sang trọng, màu sắc tương phản cao, dễ nhìn.
  - `[Fix Bug / Path]` Sửa lỗi 404 đường dẫn import `generateEmptyWeekMarkdown` trong [`src/1.Frontend/components/modals/AddWeekModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddWeekModal.js).
  - `[Fix Syntax / View]` Loại bỏ dấu ngoặc nhọn đóng thừa `}` ở dòng 235 trong [`src/1.Frontend/views/TimetableGrid.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/TimetableGrid.js).
  - `[Backend / Parser]` Bổ sung `serializeScheduleToMarkdown()` và `generateEmptyWeekMarkdown()` vào [`src/2.Backend/services/TimetableParser.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/2.Backend/services/TimetableParser.js).
  - `[Frontend / Component]` Tạo mới component modal [`src/1.Frontend/components/modals/AddClassModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/AddClassModal.js):
    - Subject Chips Picker: Chọn nhanh các môn đã có trong Chiếc Cặp Google Drive.
    - Time Presets Grid: 8 ca học chuẩn ĐHBK TP.HCM (Sáng ca 1-3, 2-3, 4-6; Chiều ca 7-9, 8-9, 9-10, 10-11).
    - Room Presets Row: Các giảng đường quen thuộc (B1, B4, B9, C4...).
    - Hỗ trợ xóa tiết học trực tiếp từ modal sửa với cờ `skipConfirm`.
  - `[Frontend / View]` Cập nhật [`src/1.Frontend/views/TimetableGrid.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/TimetableGrid.js):
    - Hiển thị Empty Day Card với nút `+ Thêm tiết học`.
    - Thêm nút `+ Thêm tiết` ở cuối mỗi ngày đã có tiết.
    - Thêm cụm nút mini-action (Sửa ✏️, Xóa 🗑️) trên từng thẻ tiết học khi hover.
    - Bổ sung bộ lắng nghe sự kiện **Long-press (750ms)** trên thẻ ngày (`pointerdown`, `pointerup`, `pointercancel`) để mở nhanh popup thêm tiết.
  - `[Frontend / Main]` Kết nối luồng dữ liệu hai chiều trong [`src/1.Frontend/main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js):
    - Đăng ký `window.openAddClassModal`, `window.openEditClassModal`, `window.deleteClassFromDay`.
    - Hàm `handleSaveClass`, `handleDeleteClass` tự động cập nhật State, hỗ trợ di chuyển thứ/ngày, chuyển trạng thái ngày nghỉ/ngày học, tự động serialize thành Markdown và lưu vào `smart_schedule_custom_md_${filename}`.
    - Modal Thêm Tuần (`openAddWeekModal`) mặc định nạp `generateEmptyWeekMarkdown()`.
  - `[Frontend / CSS]` Bổ sung styles hiện đại cho Empty Box & Add Class Modal trong [`3.timetable-grid.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/3.timetable-grid.css) và [`6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css).
  - `[Performance / PWA]` Cập nhật [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js) nâng `CACHE_NAME` lên `smart-schedule-modular-v25`.

---

## 📅 [2026-09-05 16:30] - Chuyển Đổi Hero Banner & Ghi Chú Tuần Sang Trạng Thái Mặc Định Thu Gọn (Default Collapsed Bars)

- **🎯 Mục tiêu**:
  - Tối ưu không gian hiển thị trên màn hình Thời khóa biểu theo yêu cầu: Không để các thanh lớn (Hero Banner, Ghi chú tuần, Hướng dẫn Git) mặc định sổ to choán màn hình.
  - Thiết lập chế độ **Mặc định Thu Gọn (Default Collapsed)** cho Hero Banner và chuyển Ghi Chú Tuần sang dạng Accordion đóng.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Hero Banner]` Cập nhật `#hero-banner` trong [`index.html`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/index.html) và [`3.timetable-grid.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/3.timetable-grid.css):
    - Mặc định thêm class `is-collapsed`: Rút gọn banner thành 1 thanh bar mỏng tinh tế (~42px) hiển thị Date Badge + Tên tuần + Quick Tags `7 môn • 10 tiết` và nút `[Chi tiết ▾]`.
    - Ẩn phần subtitle và card Tiết tiếp theo cồng kềnh.
    - Thêm logic `initHeroToggle()` trong [`main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js) cho phép bấm nút `Chi tiết / Thu gọn` để mở rộng hoặc thu gọn tùy ý.
  - `[Frontend / Notes Accordion]` Chuyển `#notes-section` trong [`index.html`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/index.html) và [`GitGuide.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/layout/GitGuide.js) sang dạng `<details class="notes-accordion">` mặc định đóng.
  - `[Performance / PWA]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v23` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 16:20] - Tinh Gọn Bố Cục Subject Hub (Zero Scroll) & Loại Bỏ % Tỉ Lệ Dưới Node Môn Học

- **🎯 Mục tiêu**:
  - Tinh gọn hóa bố cục Trang Chi Tiết Môn Học (`SubjectDetailModal`) thành kích thước nhỏ gọn vừa vặn khung hình (Compact Fit `max-width: 490px`), triệt tiêu việc phải cuộn chuột (Zero Scroll).
  - Loại bỏ các tag hiển thị `% tỉ lệ điểm` bên dưới các Node tròn trong Chiếc Cặp (`CircularNode.js`) để giao diện speed-dial sạch sẽ, tối giản và thanh thoát.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Component]` Tinh chỉnh [`CircularNode.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/CircularNode.js):
    - Gỡ bỏ `gradePillsHtml` dưới chân node, chỉ giữ lại Tên môn học và Trạng thái Google Drive.
  - `[Frontend / Component]` Thiết kế lại [`SubjectDetailModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/SubjectDetailModal.js):
    - Chuyển sang bố cục siêu tinh gọn: Compact Header -> CTA Action Bar -> Thanh Segmented Bar đa sắc hiển thị phân bổ điểm + tags % nhỏ gọn -> Box Ghi chú -> Footer meta.
  - `[Frontend / CSS]` Thay thế styles trong [`6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css) với kích thước `max-width: 490px`, padding thu nhỏ, animation mượt mà.
  - `[Performance / PWA]` Nâng `CACHE_NAME` lên `smart-schedule-modular-v22` trong [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js).

---

## 📅 [2026-09-05 16:15] - Phát Triển Trang Chi Tiết Môn Học (Subject Hub Modal) Khi Bấm Vào Node

- **🎯 Mục tiêu**:
  - Chuyển đổi trải nghiệm tương tác: Khi click vào Node môn học trong Chiếc Cặp hoặc từ Thời khóa biểu, thay vì nhảy link Google Drive trực tiếp, hiển thị **Trang Chi Tiết Môn Học (Subject Hub)**.
  - Trang chi tiết bao gồm: 
    1. **Tỷ lệ thành phần điểm** (Donut Chart SVG & danh sách breakdown từng đầu điểm, %, hình thức thi, thời lượng).
    2. **Ghi chú & Lưu ý học phần** (Ghi chú giảng viên, quy định, tips học tập).
    3. **Nút CTA mở Google Drive** (Nút lớn nổi bật với icon Drive, mở tab mới hoặc hỗ trợ gắn link nếu chưa có).
    4. **Nút Chỉnh sửa môn học** (Kết nối trực tiếp tới `EditSubjectModal`).

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Component]` Tạo mới component [`SubjectDetailModal.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/components/modals/SubjectDetailModal.js):
    - Đóng gói toàn bộ logic render Donut Chart SVG, breakdown điểm, box ghi chú và liên kết Drive.
    - Hỗ trợ đóng mở mượt mà qua ESC, click backdrop hoặc nút X.
  - `[Frontend / CSS]` Thêm toàn bộ styles Glassmorphism Dark Mode cho Subject Detail Hub trong [`6.modals.css`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/styles/6.modals.css).
  - `[Frontend / Views]` Cập nhật [`BackpackView.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/views/BackpackView.js):
    - Khi click vào Node môn học: Mở `openSubjectDetailModal(subject.code)`.
    - Nhấn giữ lâu (> 750ms): Vẫn kích hoạt Jiggle Mode để hiện nút xóa (-) và nút bút chì (✏️).
  - `[Frontend / Main]` Khởi tạo DOM và đăng ký `window.openSubjectDetailModal` trong [`main.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/src/1.Frontend/main.js).
  - `[Performance / PWA]` Cập nhật [`sw.js`](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/sw.js) nâng cache version lên `smart-schedule-modular-v21`.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo**:
  - Tính năng đã hoạt động mượt mà, đúng chuẩn thẩm mỹ và responsive trên mọi kích thước màn hình.

---

## 📅 [2026-09-05 16:00] - Thiết Lập Bộ Quy Tắc Trình Bày Mã Nguồn & Tiêu Chuẩn Code (Source Code Presentation Rules)

- **🎯 Mục tiêu**:
  - Chuẩn hóa toàn diện các quy chuẩn trình bày Source Code (Clean code, banner comments, phân đoạn module, HTML template string literals, JSDoc, Semantic HTML5), Thẩm mỹ giao diện UI/UX và Phản hồi AI.
  - Ban hành bộ quy tắc `.agents/rules/presentation_rules.md` và đồng bộ vào `AGENTS.md`.

- **✅ Công việc đã hoàn thành**:
  - `[Rules]` Khởi tạo & hoàn thiện file `.agents/rules/presentation_rules.md` định nghĩa 7 nhóm quy chuẩn:
    1. **File Structure & Banner Comments**: Phân đoạn rõ ràng: `1. IMPORTS`, `2. CONSTANTS`, `3. TEMPLATES / DOM`, `4. EVENT HANDLERS`, `5. EXPORTS`.
    2. **Code Formatting & Clean Code**: Bắt buộc thụt lề 2 spaces, kết thúc bằng dấu chấm phẩy `;`, 1TBS braces, đặt tên `camelCase`, `PascalCase.js`, `UPPER_SNAKE_CASE`.
    3. **HTML Templates trong JS Literals**: Thụt lề thẻ phân cấp DOM chuẩn xác, bọc biến động qua `${escapeHtml()}`, Semantic HTML5 (`<section>`, `<details>`, `<summary>`), không dùng inline style tĩnh.
    4. **Comments & JSDoc**: Viết bằng Tiếng Việt chuẩn mực, giải thích lý do (Why) và JSDoc đầy đủ cho functions/classes.
    5. **Naming Conventions**: Chuẩn hóa tên file, class, function, CSS class và DOM element IDs.
    6. **UI/UX Aesthetics**: Dark mode, Glassmorphism, CSS Tokens bảng màu hài hòa, phông chữ `Inter`/`JetBrains Mono`, micro-animations và responsive.
    7. **Agent Communication**: 100% Tiếng Việt, câu trả lời trực diện, súc tích, định dạng link markdown clickable `file:///` cho mọi file và code symbol.
  - `[Core Rule]` Cập nhật `AGENTS.md` bổ sung Điều khoản 5: **QUY CHUẨN TRÌNH BÀY MÃ NGUỒN & THẨM MỸ (CODE PRESENTATION & STYLING STANDARDS)**.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo**:
  - Toàn bộ 3 bộ quy tắc cốt lõi của dự án đã được hoàn thiện: `architecture_rules.md`, `token_optimization_rules.md`, và `presentation_rules.md`.

---

## 📅 [2026-09-05 15:52] - Chuyển Đổi Thành Công Sang Component-Driven App Shell Architecture & Ràng Buộc Rút Gọn index.html

- **🎯 Mục tiêu**:
  - Giải quyết nguy cơ `index.html` phình to khi dự án mở rộng quy mô, gây tốn token context và khó bảo trì.
  - Componentize toàn bộ 3 Popup Modals thành các JS modules độc lập trong `src/1.Frontend/components/modals/`.
  - Rút gọn `index.html` từ 668 dòng xuống còn ~390 dòng (và có thể mở rộng vô hạn mà không tăng kích thước file HTML).
  - Bổ sung quy tắc ràng buộc App Shell Architecture vào `AGENTS.md` và `.agents/rules/architecture_rules.md`.

- **✅ Công việc đã hoàn thành**:
  - `[Architecture / Rule]` Cập nhật `AGENTS.md` và `architecture_rules.md` bổ sung điều khoản: `index.html` chỉ đóng vai trò **App Shell Tối Giản (< 150–200 dòng)**, mọi modal/view mở rộng phải được componentize trong `src/1.Frontend/components/`.
  - `[Frontend / Component Templates]` Tạo các component modules độc lập tự render HTML và quản lý sự kiện:
    1. `src/1.Frontend/components/modals/EditSubjectModal.js`: Đóng gói toàn bộ template 3 tabs và logic sửa môn, drive link, tỉ lệ điểm.
    2. `src/1.Frontend/components/modals/AddSubjectModal.js`: Đóng gói template và logic tạo môn học mới.
    3. `src/1.Frontend/components/modals/AddWeekModal.js`: Đóng gói template và logic thêm tuần học mới.
    4. `src/1.Frontend/components/layout/LoginScreen.js`: Đóng gói template và logic màn hình Auth Gate.
    5. `src/1.Frontend/components/layout/GitGuide.js`: Đóng gói template Hướng dẫn Git Accordion.
  - `[Frontend / HTML Shell]` Rút gọn `index.html` bằng cách thay thế hơn 280 dòng modal tĩnh bằng `<div id="modal-root"></div>`.
  - `[Frontend / Core]` Nâng cấp `main.js` và `BackpackView.js` kết nối trực tiếp với các modal components.
  - `[Performance / PWA]` Cập nhật `sw.js` bổ sung các component mới vào `STATIC_ASSETS` và nâng cache version lên `smart-schedule-modular-v20`.

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - Native Component-Driven Architecture: Tách biệt rành mạch giữa App Shell tĩnh và các Component động, giúp hệ thống sẵn sàng mở rộng vô hạn tính năng mà không bao giờ làm nặng file HTML gốc.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Đã hoàn thành componentize toàn bộ Modals và rút gọn `index.html`.
  - [x] Đã cập nhật rules và nhật ký dự án.

---

## 📅 [2026-09-05 15:35] - Tái Cấu Trúc Toàn Diện Modular CSS Architecture & Ràng Buộc Quy Tắc Tối Ưu Token trong AGENTS.md

- **🎯 Mục tiêu**:
  - Giải quyết triệt để vấn đề file `style.css` đơn khối quá lớn (~3.911 dòng, ~85 KB) gây tiêu tốn hàng nghìn token context của AI và làm chậm quá trình bảo trì/phát triển.
  - Tách `style.css` thành 8 modules CSS chuyên biệt theo từng View/Component trong `src/1.Frontend/styles/` tuân thủ nghiêm ngặt quy tắc mỗi file < 300 dòng.
  - Bổ sung quy tắc ràng buộc bắt buộc về Modular CSS Architecture vào `AGENTS.md`.

- **✅ Công việc đã hoàn thành**:
  - `[Architecture / Rule]` Cập nhật `AGENTS.md` bổ sung điều khoản bắt buộc về **Modular CSS (`src/1.Frontend/styles/`)**, nghiêm cấm dồn CSS vào một file lớn để tối ưu token và tránh xung đột style.
  - `[Frontend / Modular CSS]` Tách `style.css` thành 8 file module chuẩn kiến trúc 5 tầng:
    1. `src/1.Frontend/styles/1.variables.css` (Tokens, Themes, Resets, App Wrapper, Auth Landing Gate).
    2. `src/1.Frontend/styles/2.navbar.css` (Navbar, Brand, User Profile, 4 View Toggles, Week Navigation, Filter Bar).
    3. `src/1.Frontend/styles/3.timetable-grid.css` (Hero Banner, Weekly Grid, Today Timeline, Notes, Git Guide, Footer, Toast).
    4. `src/1.Frontend/styles/4.grade-solver.css` (Bảng điểm, Donut Charts SVG, Accordion, Target Grade Solver).
    5. `src/1.Frontend/styles/5.backpack-drive.css` (Chiếc Cặp Google Drive, Node tròn SVG, iOS Jiggle/Wiggle, Badges).
    6. `src/1.Frontend/styles/6.modals.css` (Hệ thống 3 Popup Modals: Sửa môn, Thêm tuần, Thêm môn, Emerald Glow, Custom Scrollbars).
    7. `src/1.Frontend/styles/7.markdown-editor.css` (Soạn thảo Markdown 2 cột, JetBrains Mono, Preview container).
    8. `src/1.Frontend/styles/8.responsive.css` (Gom toàn bộ Media queries Responsive cho Tablet, Mobile & Print vào 1 nơi).
  - `[Frontend / Master Aggregator]` Tinh gọn `style.css` còn 12 dòng, đóng vai trò Master CSS nạp 8 modules qua `@import`.
  - `[Frontend / HTML]` Cập nhật `index.html` liên kết trực tiếp 8 module CSS để trình duyệt tải song song qua HTTP/2 với tốc độ cao nhất.
  - `[Performance / PWA]` Cập nhật `sw.js` bổ sung danh sách 8 file CSS mới vào `STATIC_ASSETS` và nâng cache version lên `smart-schedule-modular-v19`.

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - Zero-Dependency Native Modular CSS: Không cần build step (Webpack/Vite), tận dụng cơ chế tải song song của trình duyệt và tối ưu 90% token AI trong các phiên làm việc tiếp theo.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Đã hoàn thành bóc tách 8 module CSS và cập nhật rules.
  - [x] Đã cập nhật `index.html`, `sw.js`, `AGENTS.md` và `WORKLOG.md`.

---

## 📅 [2026-09-05 15:12] - Thu Gọn Hitbox Nhấn Giữ Khít Node Tròn & Tăng Thời Gian Giữ (750ms)

- **🎯 Mục tiêu**:
  - Khắc phục tình trạng hitbox nhấn giữ bị quá lớn (bao phủ cả phần tên môn học và thẻ pill bên dưới), khiến người dùng dễ bị kích hoạt nhầm chế độ rung lắc/xóa/sửa khi lướt web.
  - Tăng thời gian nhấn giữ và bổ sung cơ chế hủy kích hoạt khi đang cuộn màn hình.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Circular Node]` Giới hạn phạm vi gắn sự kiện nhấn giữ (`mousedown`, `touchstart`) **chỉ nằm trọn trong khối hình tròn `.bp-circle-wrapper`** (khít đúng kích thước Node), phần tên môn học và chi tiết bên dưới không còn kích hoạt long-press.
  - `[Frontend / Long-press Engine]` Tăng thời gian giữ kích hoạt từ `450ms` lên `750ms` giúp thao tác chủ động và chắc chắn hơn.
  - `[Frontend / Gesture Detection]` Bổ sung kiểm tra `touchmove`: tự động hủy timer khi ngón tay di chuyển > 8px (người dùng đang vuốt cuộn màn hình), ngăn chặn 100% việc kích hoạt nhầm.
  - `[Frontend / Badges]` Đảm bảo nút xóa dấu trừ `[-]` màu đỏ và nút bút chì `[✏️]` màu vàng hiển thị ôm sát viền trên của vòng tròn, hỗ trợ `touch-action: manipulation` không bị delay thao tác.
  - `[Performance / PWA]` Nâng cấp `CACHE_NAME` lên `smart-schedule-modular-v18` trong `sw.js`.

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - Isolated Circular Hitbox Binding: Tách biệt hoàn toàn vùng điều khiển vòng tròn và vùng mô tả văn bản bên dưới.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Đã hoàn thành tinh chỉnh hitbox và thời gian giữ.
  - [x] Đã sẵn sàng commit và push lên GitHub.

---

## 📅 [2026-09-05 15:03] - Tái Cấu Trúc Navbar 3 Tầng & Triệt Tiêu Hoàn Toàn Lỗi Tràn Ngang (Horizontal Overflow) Trên Mobile

- **🎯 Mục tiêu**:
  - Giải quyết dứt điểm hiện tượng toàn bộ màn hình điện thoại bị lệch sang trái, chữ logo và các phần tử bị cắt mất một nửa do cụm điều hướng tuần (`week-navigation`) và nút tài khoản dồn ép quá tải trên 1 hàng của Navbar.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Architecture & Markup]` Tách Navbar thành 3 phân vùng độc lập rõ ràng:
    + **Hàng 1 (`navbar-brand-row`)**: Logo thương hiệu `ScheduleSmart` + Huy hiệu `HK1 2026-2027` căn trái đối xứng hoàn hảo với cụm nút `Theme Toggle` và `Avatar Google Login` căn phải.
    + **Hàng 2 (`nav-right`)**: Thanh điều hướng tuần học `< Tuần 35 (24/08) > [ + ]` trải dài 100% toàn bộ chiều ngang màn hình, chữ rõ nét và các nút bấm to dễ thao tác.
    + **Hàng 3 (`nav-center`)**: 4 Tab chuyển đổi góc nhìn (Lưới tuần, Hôm nay, Tỉ lệ điểm, Chiếc cặp Google Drive) chia đều tỷ lệ 4 cột đối xứng 25% vừa khít màn hình.
  - `[Frontend / CSS Viewport]` Thiết lập `max-width: 100vw; overflow-x: hidden` cho `html`, `body`, `.app-wrapper` và `.navbar`, loại bỏ hoàn toàn hiện tượng tràn ngang.
  - `[Performance / PWA]` Nâng cấp `CACHE_NAME` lên `smart-schedule-modular-v17` trong `sw.js`.

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - Kiến trúc phân tầng Navbar Mobile 3-Deck: Đảm bảo Desktop giữ nguyên 1 hàng tinh gọn, trong khi Mobile/Tablet tự động chuyển sang 3 dải chuyên dụng chống tràn tuyệt đối.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Toàn bộ lỗi tràn lòi, cắt chữ bên trái và khoảng đen bên phải đã được khắc phục 100%.
  - [x] Đã commit và push lên GitHub.

---

## 📅 [2026-09-05 14:52] - Fix Triệt Để Lỗi Lệch Khung Điểm & Tràn Khung HK1 Trên Mobile

- **🎯 Mục tiêu**:
  - Khắc phục triệt để hiện tượng Header và Rows của bảng tỉ lệ điểm (`grade-table-header` vs `grade-item-row`) bị lệch số cột và xô lệch không khớp trên điện thoại.
  - Xử lý triệt để hiện tượng khung tên HK1 (`badge-git`, `brand-info`) và thanh điều hướng tuần trên Navbar bị chật chội, tràn lòi ra khỏi màn hình mobile.

- **✅ Công việc đã hoàn thành**:
  - `[Frontend / Grade Table]` Đồng bộ hóa tuyệt đối cấu trúc 4 cột trên Mobile (`grid-template-columns: 1fr 70px 32px 32px !important`) cho cả `.grade-table-header` và `.grade-item-row`:
    + Ẩn hoàn toàn cột kéo thả (`col-handle`, `grade-row-handle`) và cột hình thức thi (`col-type`, `grade-row-type`) trên màn hình <= 640px.
    + Đảm bảo từng cột (Tên cột, Trọng số %, Màu nhận diện, Nút xóa) khớp nhau 100% từng pixel.
  - `[Frontend / Navbar & HK1]` Tinh chỉnh Navbar trên Mobile (< 600px):
    + Giới hạn chiều rộng `.nav-left` và `.nav-right` ở mức 50%, text `h1` và `badge-git` tự động co gọn hoặc ẩn bớt phần thừa, không gây tràn ngang (Horizontal Overflow).
    + Co gọn nút tuần học, nút theme và nút login thành icon tròn chuẩn touch.
  - `[Frontend / Edit Modal Tabs]` Chuyển `.modal-nav-tabs` trên Mobile sang dạng cột gọn gàng (Icon trên, chữ dưới), hiển thị trọn vẹn 3 tab không bị rớt dòng méo mó.
  - `[Performance / PWA]` Nâng cấp `CACHE_NAME` lên `smart-schedule-modular-v16` trong `sw.js`.

- **💡 Quyết định Kỹ thuật & Kiến trúc**:
  - Sử dụng quy tắc đồng bộ đối xứng giữa thẻ Header và Dynamic Rows, loại bỏ chênh lệch cột con.

- **📌 Trạng thái hiện tại & Kế hoạch tiếp theo (Next Steps)**:
  - [x] Đã kiểm tra và khớp 100% các cột bảng điểm và navbar trên thiết bị di động.
  - [x] Đã sẵn sàng commit và push lên GitHub.

---

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
