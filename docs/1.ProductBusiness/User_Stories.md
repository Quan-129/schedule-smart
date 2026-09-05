# DANH SÁCH USER STORIES & TIÊU CHÍ NGHIỆM THU 📝

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive  
> **Tài liệu tham chiếu**: [PRD.md](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/docs/1.ProductBusiness/PRD.md)

---

## 🎒 EPIC 1: CHIẾC CẶP MÔN HỌC (DRIVE BACKPACK)

### US-BP-01: Xem danh mục môn học dạng hình tròn
- **Là một**: Sinh viên
- **Tôi muốn**: Xem danh sách tất cả các môn học đã đăng ký dưới dạng các ô tròn kèm viền Donut Ring thể hiện % điểm
- **Để**: Dễ dàng phân biệt các môn và nắm bắt ngay cấu trúc điểm mà không làm rối mắt
- **Acceptance Criteria**:
  - [x] Mỗi môn học được vẽ thành 1 Node hình tròn với biểu tượng/tên viết tắt ở trung tâm.
  - [x] Bao quanh node là vòng tròn Donut SVG chia thành các cung màu khác nhau tương ứng với các cột điểm (GK, CK, BTL...).
  - [x] Khi hover/click vào cung tròn hoặc node, hiển thị tên môn, mã môn, phòng học, giảng viên.

### US-BP-02: Truy cập thư mục Google Drive của môn học
- **Là một**: Sinh viên
- **Tôi muốn**: Bấm vào ô môn học để mở ngay thư mục Google Drive bài giảng
- **Để**: Tải tài liệu hoặc tra cứu slide học tập tức thì trong lớp học
- **Acceptance Criteria**:
  - [x] Click chuột/chạm vào ô tròn sẽ mở link Google Drive trong tab mới.
  - [x] Nếu môn học chưa có link Drive, mở dialog cho phép dán link nhanh.

### US-BP-03: Kích hoạt chế độ chỉnh sửa Jiggle Mode (Long-press)
- **Là một**: Sinh viên
- **Tôi muốn**: Nhấn giữ (Long-press) 500ms vào ô môn học để kích hoạt chế độ chỉnh sửa
- **Để**: Ẩn các nút thao tác lúc bình thường và chỉ hiện khi có nhu cầu sửa/xóa môn
- **Acceptance Criteria**:
  - [x] Nhấn giữ 500ms (hoặc click chuột phải) $\rightarrow$ Thiết bị rung nhẹ (haptic feedback) và kích hoạt Jiggle Mode.
  - [x] Toàn bộ các node môn học nảy ra nút `(-)` (Xóa môn ở góc trên-trái) và nút `(✏️)` (Sửa tỉ lệ % ở góc trên-phải).
  - [x] Bấm nút "Xong" hoặc chạm ra ngoài vùng môn học $\rightarrow$ Tắt Jiggle Mode, ẩn cả 2 nút.

### US-BP-04: Tùy biến tỉ lệ phần trăm điểm môn học (Dynamic Grade Breakdown Editor)
- **Là một**: Sinh viên
- **Tôi muốn**: Chỉnh sửa linh hoạt danh sách cột điểm và phần trăm (thêm/xóa/sửa hàng)
- **Để**: Phù hợp với đề cương môn học thực tế của giảng viên (VD: GK 20%, Lab 30%, CK 50%)
- **Acceptance Criteria**:
  - [x] Modal chỉnh sửa hiển thị danh sách các hàng: Tên cột điểm, %, màu sắc.
  - [x] Có nút "+ Thêm cột điểm" và nút thùng rác xóa cột.
  - [x] Tự động tính tổng % và đổi màu Badge (Xanh lá khi đủ 100%, Đỏ khi khác 100%).
  - [x] Sau khi bấm "Lưu Thay Đổi", Donut Ring trên ô môn tròn được vẽ lại tức thì.

---

## 📅 EPIC 2: THỜI KHÓA BIỂU THÔNG MINH (TIMETABLE)

### US-TT-01: Xem lưới thời khóa biểu trực quan
- **Là một**: Sinh viên
- **Tôi muốn**: Xem ma trận lịch học từ Thứ 2 đến Chủ nhật theo các tiết học (Tiết 1 đến 12)
- **Để**: Nắm được lộ trình học tập trong tuần một cách tổng quát
- **Acceptance Criteria**:
  - [x] Hiển thị rõ ràng tên môn, mã lớp, phòng học và giảng viên trong từng ô tiết.
  - [x] Highlight cột ngày hôm nay và tiết học hiện tại theo thời gian thực của máy tính/điện thoại.

### US-TT-02: Lọc lịch học theo tuần và môn
- **Là một**: Sinh viên
- **Tôi muốn**: Chọn tuần học (ví dụ: Tuần 5) hoặc lọc theo tên môn
- **Để**: Tránh nhầm lẫn với các môn học cách tuần (tuần chẵn/lẻ)
- **Acceptance Criteria**:
  - [x] Dropdown chọn tuần hiển thị chính xác các môn có lịch trong tuần đó.
  - [x] Tìm kiếm nhanh theo mã môn hoặc tên phòng học.

---

## 🎯 EPIC 3: BỘ TÍNH ĐIỂM MỤC TIÊU (GRADE CALCULATOR)

### US-GC-01: Tính điểm thi cuối kỳ cần đạt
- **Là một**: Sinh viên
- **Tôi muốn**: Nhập điểm Giữa kỳ, Bài tập lớn, Quá trình và chọn mục tiêu điểm chữ (A, B+, B, C)
- **Để**: Biết bài thi Cuối kỳ cần làm bao nhiêu điểm để đạt được học lực mong muốn
- **Acceptance Criteria**:
  - [x] Tự động lấy tỉ lệ % từ đề cương môn học đã thiết lập ở Chiếc Cặp.
  - [x] Hiển thị kết quả điểm số cần đạt rõ ràng (ví dụ: "Cần đạt tối thiểu 7.5 điểm Cuối kỳ").
  - [x] Cảnh báo nếu mục tiêu vượt quá 10 điểm (bất khả thi) hoặc đã chắc chắn đạt mục tiêu.
