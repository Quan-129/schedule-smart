# TÀI LIỆU ĐẶC TẢ YÊU CẦU SẢN PHẨM (PRD) 📋

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive (Smart Schedule & Drive Backpack)  
> **Phiên bản**: `v1.2.0`  
> **Ngày cập nhật**: `2026-09-05`  
> **Người phụ trách**: `ProductBusiness Employee (AI Agent)`

---

## 🎯 1. TỔNG QUAN SẢN PHẨM (EXECUTIVE SUMMARY)

### 1.1. Bối cảnh & Vấn đề thực tế (Problem Statement)
- Sinh viên đại học (đặc biệt là khối kỹ thuật như ĐH Bách Khoa TP.HCM - HCMUT) phải quản lý khối lượng học phần lớn, lịch học thay đổi theo tuần chẵn/lẻ, lịch thi và tài liệu học tập rải rác.
- Các hệ thống quản lý đào tạo hiện tại (như myBK, portal trường) thường có giao diện cũ kỹ trên điện thoại, khó tra cứu nhanh phòng học/giảng viên khi đang di chuyển, và không có giải pháp liên kết trực tiếp tới tài liệu học tập cá nhân.
- Sinh viên thường thiếu công cụ theo dõi tiến độ điểm số và không tính toán được chính xác điểm thi cuối kỳ cần đạt để đạt mục tiêu học lực (GPA/Điểm chữ A, B+, B).

### 1.2. Mục tiêu sản phẩm & Tầm nhìn (Product Vision & Goals)
- **Tầm nhìn**: Trở thành trợ lý học tập cá nhân PWA tất-cả-trong-một (All-in-One Personal Study Assistant) nhẹ nhất, đẹp nhất và tiện lợi nhất cho sinh viên.
- **Giá trị cốt lõi**:
  1. *Xem lịch học tức thì*: Thời khóa biểu ma trận trực quan, tự động làm nổi bật tiết học hiện tại, hỗ trợ tuần học và lọc môn.
  2. *Chiếc cặp tài liệu thông minh*: Node môn học tròn hiển thị tỉ lệ % điểm qua vòng Donut đa sắc, 1 chạm mở link Google Drive bài giảng.
  3. *Tính điểm mục tiêu*: Tự động giải phương trình điểm số để đưa ra điểm số tối thiểu cần đạt cho bài thi cuối kỳ.
  4. *Offline First & PWA*: Cài đặt nhanh như Native App, hoạt động mượt mà không cần mạng internet.

---

## 👥 2. CHÂN DUNG NGƯỜI DÙNG (USER PERSONAS)

| Tiêu Chí | Sinh viên Bách Khoa / Kỹ thuật (Alex) | Sinh viên năm nhất (Linh) |
| :--- | :--- | :--- |
| **Độ tuổi / Đối tượng** | 20 - 22 tuổi (Năm 3 - 4) | 18 - 19 tuổi (Năm 1) |
| **Thiết bị sử dụng** | Smartphone (iOS/Android), Laptop | Smartphone, iPad |
| **Nhu cầu chính** | Tra cứu nhanh phòng học, link Drive đề cương ôn thi, tính điểm đồ án & bài tập lớn | Nắm bắt tuần học, không đi lạc phòng, theo dõi lịch thi |
| **Nỗi đau (Pain Points)**| Quá nhiều môn đồ án/thực hành, tài liệu Drive thất lạc, không nhớ tỉ lệ điểm thi | Lúng túng với hệ thống portal trường, khó xem trên điện thoại |

---

## 📖 3. DANH SÁCH TÍNH NĂNG & USER STORIES

### Module 1: Thời Khóa Biểu Thông Minh (Smart Timetable)
- **US-01**: Là một sinh viên, tôi muốn xem thời khóa biểu dạng lưới theo từng thứ trong tuần để biết ngay hôm nay học môn gì ở phòng nào.
- **US-02**: Là một sinh viên, tôi muốn hệ thống tự động làm nổi bật tiết học đang diễn ra hoặc sắp diễn ra để không bị trễ giờ.
- **US-03**: Là một sinh viên, tôi muốn lọc lịch học theo tuần học cụ thể (Tuần 1 đến 20) hoặc theo mã môn học.

### Module 2: Chiếc Cặp Môn Học & Google Drive (Drive Backpack)
- **US-04**: Là một sinh viên, tôi muốn có danh mục các môn học dạng icon hình tròn để dễ dàng truy cập thư mục Google Drive của từng môn.
- **US-05**: Là một sinh viên, tôi muốn nhìn thấy tỉ lệ % điểm các cột (GK, CK, BTL) thể hiện trực quan bằng vòng Donut Ring bao quanh môn học.
- **US-06**: Là một sinh viên, tôi muốn nhấn giữ (Long-press) để mở chế độ chỉnh sửa/xóa môn học và tùy biến tỉ lệ % điểm cho từng môn.

### Module 3: Tính Điểm Mục Tiêu (Grade & Target Calculator)
- **US-07**: Là một sinh viên, tôi muốn nhập điểm các cột quá trình để tính toán xem bài thi cuối kỳ cần đạt bao nhiêu điểm để đạt điểm chữ A / B+ / B.
- **US-08**: Là một sinh viên, tôi muốn hệ thống cảnh báo nếu mục tiêu điểm quá cao không thể đạt được hoặc đã chắc chắn qua môn.

---

## ⚙️ 4. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

| Mã FR | Tên Chức Năng | Mô Tả Nghiệp Vụ | Mức Ưu Tiên | Giai Đoạn |
| :--- | :--- | :--- | :---: | :---: |
| **FR-01** | Lưới Thời Khóa Biểu | Hiển thị ma trận 7 ngày x 12 tiết học, có chỉ báo thời gian thực | Must-have | Giai đoạn 1 |
| **FR-02** | Quản lý Chiếc Cặp | Thêm/Sửa/Xóa môn học, liên kết link thư mục Google Drive | Must-have | Giai đoạn 1 |
| **FR-03** | Circular Donut Ring | Vẽ vòng tròn tỉ lệ % điểm cho từng môn học bằng SVG động | Must-have | Giai đoạn 1 |
| **FR-04** | Jiggle Edit Mode | Nhấn giữ 0.5s hiển thị nút xóa (-) và nút bút sửa (✏️) | Must-have | Giai đoạn 1 |
| **FR-05** | Bộ tính điểm mục tiêu | Tính điểm cuối kỳ cần đạt dựa trên công thức trọng số | Must-have | Giai đoạn 1 |
| **FR-06** | Lưu trữ Offline | Tự động đồng bộ cấu hình và môn học vào `localStorage` | Must-have | Giai đoạn 1 |

---

## 🔒 5. ĐÁNH GIÁ BẢO MẬT & HIỆU NĂNG (GIAI ĐOẠN 2 & 3)

- 🟡 **Giai đoạn 2 (Security)**:
  - Tích hợp Google OAuth 2.0 để tự động đồng bộ tài liệu Drive chính thức của sinh viên (hiện tại hỗ trợ gắn link trực tiếp).
  - Mã hóa dữ liệu điểm số cá nhân lưu trữ trên Cloud nếu nâng cấp lên cơ chế Database đồng bộ nhiều thiết bị.
- 🟣 **Giai đoạn 3 (Performance & Notification)**:
  - Web Push Notification qua Service Worker: Báo thức trước giờ vào lớp 15 phút ngay cả khi đóng trình duyệt.
  - Tối ưu hóa bộ nhớ Cache Service Worker khi số lượng môn học và tài liệu tăng cao.

---

## 🗺 6. LỘ TRÌNH PHÁT TRIỂN (ROADMAP)

- [x] **Sprint 1 (Hoàn thành)**: Core Timetable, View ma trận, Import lịch mẫu.
- [x] **Sprint 2 (Hoàn thành)**: Chiếc Cặp Google Drive, Node hình tròn Donut Ring, Jiggle Mode, Bộ tính điểm mục tiêu.
- [ ] **Sprint 3 (Hiện tại)**: Chuẩn hóa hệ thống tài liệu kỹ thuật & nghiệp vụ toàn diện.
- [ ] **Sprint 4 (Kế tiếp)**: Tích hợp đồng bộ tự động file TKB myBK (.ics / .xlsx) và Web Push Notification.
