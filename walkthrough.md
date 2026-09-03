# Chiếc Cặp Google Drive - App Launcher & Hệ Thống Node Linh Hoạt 🎒

Đã triển khai hoàn tất giao diện **Nút Vuông App Launcher** và **Hệ thống Node Quản lý Tài Liệu** cho Chiếc Cặp:

---

## 🚀 Các Tính Năng Mới Đã Hoàn Thành:

### 1. 📱 Lưới App Launcher Nút Vuông (Mini App Grid):
- Mỗi môn học là một **Nút Vuông Bo Góc Siêu Đẹp (Squircle App Icon)**:
  * Viền màu thương hiệu môn học phát sáng viền neon khi hover.
  * Góc trên: Mã môn học (`CO3117`, `IM1025`, `CO3061`...) + Đèn báo xanh Google Drive.
  * Chính giữa: Icon môn học lớn với hiệu ứng bo cong mềm mại.
  * Bên dưới: Tên môn học + Badge số lượng Node tài liệu (`3 nodes`, `0 node`...).
- Nút vuông cuối cùng: **`[➕ Thêm Môn]`** cho phép tạo thêm môn học mới tùy ý.

---

### 2. 🗂️ Bảng Quản Lý Node Môn Học (Subject Drawer Modal):
- Khi bấm vào 1 Nút Vuông Môn Học:
  * **Thanh Google Drive Chính**: Nút to rõ `[📁 Mở Folder Google Drive Chính ↗]` (hoặc `[+ Gắn Link Drive]` nếu chưa có).
  * **Danh Sách Các Node Tài Liệu**:
    - Hiển thị từng Node con với Icon nhận diện định dạng (Google Drive 📁, Slide bài giảng 📊, PDF 📄, Bài tập lớn 👥, Đề thi 📝, Link web 🔗).
    - Tên Node tài liệu.
    - Ghi chú / Deadline / Tag.
    - Nhóm nút thao tác: Xem trước (👁️), Mở đường dẫn (↗️), Sửa Node (✏️), Xóa Node (🗑️).
  * **Nút `[➕ Thêm Node Mới]`**: Mở form điền thông tin Node nhanh chóng.

---

### 3. 📝 Form Điền Thông Tin Node Tài Liệu:
- **Tên Node**: (*Ví dụ: Slide Bài 1-5, Báo cáo BTL Nhóm, Đề thi GK 2024...*)
- **Loại Node / Định dạng**: (*Thư mục Drive, Slide PPT, PDF, BTL nhóm, Đề thi, Link web*)
- **Đường dẫn Google Drive / Web URL**: (*https://drive.google.com/...*)
- **Ghi chú / Deadline / Tag**: (*Hạn nộp 30/11, Đọc trước khi lên lớp...*)

---

## 🌐 Triển Khai
- **Repository**: [`Quan-129/schedule-smart`](https://github.com/Quan-129/schedule-smart)
