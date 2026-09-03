# Hướng dẫn & Tổng kết: "Chiếc Cặp Thông Minh" & Cài Đặt Ứng Dụng PWA

Hệ thống đã được bổ sung thành công tính năng **"Chiếc cặp thông minh" (Smart Backpack)** độc lập, tích hợp công nghệ lưu trữ tệp **Offline bằng IndexedDB** và nâng cấp thành **Ứng dụng Web cấp tiến (PWA)** có thể cài đặt trực tiếp lên điện thoại (iOS / Android) và máy tính.

---

## 🎒 1. Các Tính Năng Của "Chiếc Cặp Thông Minh"

### 📁 Quản lý Tệp Tin Theo Từng Môn Học
- Truy cập thông qua Tab **"Chiếc cặp"** trên thanh Menu hoặc bấm icon chiếc cặp 🎒 trên bất kỳ tiết học nào trong Thời Khóa Biểu.
- Mỗi môn học được phân chia thành 4 ngăn rõ ràng:
  - 📂 **Slide & Bài giảng**: Đề cương, slide bài học các chương.
  - 📂 **Bài tập lớn & Dự án nhóm**: Hướng dẫn đề tài, tiêu chí chấm (Rubric), link nộp bài (30/11), link đăng ký nhóm (15/09).
  - 📂 **Đề thi & Ôn tập**: Tổng hợp đề thi các năm cũ, bài tập mẫu.
  - 📂 **Tài liệu khác & Google Drive**: Folder Drive chung của môn, liên kết tài liệu mở rộng.

### 💾 Lưu Trữ Offline 100% Không Cần Mạng (IndexedDB)
- **Kéo & Thả (Drag & Drop)**: Kéo file PDF, Slide PowerPoint, Word, Ảnh từ máy tính thả trực tiếp vào giao diện Chiếc cặp để lưu trữ.
- **Nút "Tải tệp vào máy (Offline)"**: Chọn tệp từ máy để lưu vào bộ nhớ cơ sở dữ liệu IndexedDB của trình duyệt.
- **Xem trước tệp (In-App Preview Modal)**: Bấm nút mắt 👁️ trên tài liệu để đọc bài giảng PDF hoặc xem ảnh trực tiếp ngay trong web mà không cần rời trang.
- **Tải về (Download)**: Tải lại tệp tin đã lưu trong máy bất cứ lúc nào.

### 🔗 Tùy Biến Gắn Link Google Drive
- Bấm nút **"Thêm Link Drive"**: Cho phép bạn dán bất kỳ đường link Google Drive, thư mục nhóm, hoặc link nộp bài nào vào môn học mong muốn.

---

## 📱 2. Hướng Dẫn Cài Đặt Thành App Trên Điện Thoại (PWA)

### Trên iPhone / iPad (Trình duyệt Safari):
1. Mở link trang web trên Safari.
2. Bấm vào nút **Chia sẻ (Share)** (biểu tượng hình vuông có mũi tên chỉ lên ở thanh dưới cùng).
3. Cuộn xuống và chọn **"Thêm vào MH chính" (Add to Home Screen)**.
4. Bấm **Thêm (Add)**. 
👉 Một biểu tượng ứng dụng **🎒 Lịch Học** sẽ xuất hiện trên màn hình chính của iPhone. Khi mở ra, app sẽ chạy toàn màn hình, mượt mà và hoạt động được ngay cả khi mất mạng!

### Trên Android (Trình duyệt Chrome):
1. Mở link trang web trên Google Chrome.
2. Bấm vào menu **3 dấu chấm ⋮** ở góc trên bên phải.
3. Chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào màn hình chính" (Install app / Add to Home Screen)**.
4. Xác nhận Cài đặt.
👉 Ứng dụng sẽ được cài đặt vào danh sách ứng dụng của điện thoại như một app native.

---

## 🚀 3. Trạng Thái Triển Khai
- **Repository**: [`Quan-129/schedule-smart`](https://github.com/Quan-129/schedule-smart)
- **Mã Commit**: `0121b75`
- **GitHub Pages**: Đang tự động cập nhật phiên bản mới nhất qua GitHub Actions.
