# TỪ ĐIỂN DỮ LIỆU CHI TIẾT (DATA DICTIONARY) 📖

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive  
> **Người phụ trách**: `Database Employee (AI Agent)`

---

## 🗂 1. BẢNG `subjects` (Danh mục môn học)

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả Ý Nghĩa |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(20)` | `PRIMARY KEY` | Không có | Mã môn học chuẩn (VD: `CO3117`, `SP1031`) |
| `name` | `VARCHAR(150)`| `NOT NULL` | `''` | Tên đầy đủ của môn học |
| `room` | `VARCHAR(50)` | `NULL` | `''` | Phòng học chính (VD: `H6-204`) |
| `lecturer` | `VARCHAR(100)`| `NULL` | `''` | Họ tên giảng viên phụ trách |
| `drive_url` | `TEXT` | `NULL` | `''` | Liên kết thư mục Google Drive của môn |
| `credits` | `INT` | `DEFAULT 3` | `3` | Số tín chỉ của học phần |
| `created_at`| `DATETIME` | `NOT NULL` | `CURRENT_TIMESTAMP` | Thời điểm tạo môn học |

---

## 🗂 2. BẢNG `grade_components` (Cấu trúc % điểm môn học)

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả Ý Nghĩa |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | `UUID()` | Mã định danh duy nhất của cột điểm |
| `subject_id` | `VARCHAR(20)` | `FOREIGN KEY` | Không có | Liên kết tới `subjects.id` (ON DELETE CASCADE) |
| `name` | `VARCHAR(50)` | `NOT NULL` | `'Cột điểm'` | Tên cột điểm (GK, CK, BTL, Quiz...) |
| `percentage` | `DECIMAL(5,2)`| `NOT NULL` | `0.00` | Phần trăm trọng số (VD: `20.00`, `50.00`) |
| `color_hex` | `VARCHAR(10)` | `NOT NULL` | `'#3b82f6'` | Mã màu hiển thị trên vòng tròn Donut SVG |
| `display_order`| `INT` | `DEFAULT 0` | `0` | Thứ tự hiển thị trên vòng tròn |

---

## 🗂 3. BẢNG `schedule_slots` (Tiết học thời khóa biểu)

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả Ý Nghĩa |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | `UUID()` | Mã định danh tiết học |
| `subject_id` | `VARCHAR(20)` | `FOREIGN KEY` | Không có | Liên kết tới `subjects.id` |
| `day_of_week` | `INT` | `NOT NULL` | `2` | Thứ trong tuần (2 = Thứ Hai, 8 = Chủ Nhật) |
| `start_period`| `INT` | `NOT NULL` | `1` | Tiết bắt đầu (1 - 12) |
| `end_period` | `INT` | `NOT NULL` | `3` | Tiết kết thúc (1 - 12) |
| `room` | `VARCHAR(50)` | `NULL` | `''` | Phòng học của buổi học này |
| `week_pattern`| `VARCHAR(100)`| `NULL` | `'all'` | Chuỗi quy định tuần học (VD: `1-16`, `even`, `odd`) |
