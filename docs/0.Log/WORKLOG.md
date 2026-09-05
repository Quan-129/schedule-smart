# NHẬT KÝ CÔNG VIỆC DỰ ÁN (DEV WORKLOG) 🛠

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive (Smart Schedule & Drive Backpack)  
> **Repository**: `Quan-129/schedule-smart`  
> **Nguyên tắc quản lý**: Cập nhật tự động sau mỗi phiên làm việc hoặc thay đổi tính năng. Phiên mới nhất luôn nằm ở trên cùng.

---

## 📅 [2026-09-05 10:48] - Khắc Phục Lỗi Hiển Thị Nút Cây Bút ✏️ Trong Chế Độ Jiggle Mode

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
