# Kế hoạch triển khai: "Chiếc Cặp Thông Minh" (Smart Backpack) & Hỗ trợ Offline PWA

> **Nguồn**: Được lưu trữ từ giai đoạn phát triển tính năng Chiếc Cặp & PWA  
> **Vị trí lưu trữ**: `docs/9.More/implementation_plan.md`

---

Xây dựng tính năng **"Chiếc cặp thông minh" (Smart Backpack)** – hệ thống quản lý thư mục, tài liệu học tập theo từng môn học độc lập (File Explorer thu nhỏ), tích hợp liên kết Google Drive, lưu trữ offline bằng **IndexedDB** và nâng cấp ứng dụng thành **PWA (Progressive Web App)** có thể cài đặt lên điện thoại.

---

## 1. Mục tiêu và Kiến trúc hệ thống

### 🎒 Tính năng "Chiếc cặp thông minh" (Smart Backpack UI/UX)
- **Giao diện File Explorer độc lập**: Thiết kế đồng bộ Glassmorphism, có cây thư mục cho từng môn học:
  - 📁 `Slide & Bài giảng`
  - 📁 `Bài tập lớn & Dự án nhóm`
  - 📁 `Đề thi & Tài liệu ôn tập`
  - 📁 `Link Google Drive & Nộp bài`
- **Bộ lọc & Điều hướng thông minh**:
  - Breadcrumb navigation (`Chiếc cặp > Học máy > Slide bài giảng`).
  - Thanh tìm kiếm file tức thời theo tên tài liệu hoặc môn học.
  - Tự động ghim (Pin) môn học của ngày hôm nay lên đầu danh sách.
  - Nút shortcut **🎒 Chiếc cặp** trên từng tiết học ở bảng Lịch học để vào thẳng tài liệu môn đó.
- **Trình xem trước tệp tin (In-App Preview Modal)**:
  - Xem trước file PDF, hình ảnh, tài liệu văn bản, hoặc nhúng liên kết Google Drive trực tiếp mà không cần rời trang web.
- **Kéo & Thả (Drag & Drop)**: Hỗ trợ kéo file trực tiếp từ máy tính/điện thoại thả vào ngăn môn học để lưu trữ.

### 💾 Cơ chế Lưu trữ Offline (IndexedDB Engine)
- Sử dụng **IndexedDB** tích hợp sẵn trong trình duyệt (Chrome, Safari, Edge):
  - Hỗ trợ lưu trữ file thật (PDF, ảnh, docx, zip) dung lượng lớn trực tiếp trên thiết bị (PC/Điện thoại).
  - Không cần mạng (Offline 100%) vẫn mở slide ra đọc được khi lên giảng đường.
  - Cho phép tùy chỉnh thêm liên kết Google Drive hoặc tải file cục bộ.

### 📱 Hỗ trợ Cài đặt App Điện thoại (PWA - Progressive Web App)
- Tạo file `manifest.json`: Khai báo tên ứng dụng, icon balo học tập, chế độ hiển thị toàn màn hình (`standalone`).
- Tạo Service Worker `sw.js`: Lưu trữ bộ nhớ đệm (Cache) toàn bộ mã nguồn web, CSS, JS và lịch học để mở app khi không có Wi-Fi/4G.
- Người dùng có thể nhấn **"Thêm vào màn hình chính" (Add to Home Screen)** trên iPhone/Android để cài thành app riêng biệt.

---

## 2. Các thay đổi dự kiến

### [NEW] File mới
1. `manifest.json`: Cấu hình PWA để cài đặt lên điện thoại và máy tính.
2. `sw.js`: Service Worker quản lý cache tĩnh và hỗ trợ chạy offline không cần mạng.

### [MODIFY] File hiện có
1. `index.html`:
   - Khai báo thẻ link `manifest.json` và các meta tag hỗ trợ mobile app (Apple Touch Icon, Theme Color).
   - Thêm nút chuyển tab **"🎒 Chiếc cặp"** trên thanh Navbar.
   - Thêm Section `backpack-view-container`: Header cặp thông minh, thanh điều hướng thư mục, khu vực thả file (Dropzone), danh sách file/folder theo môn.
   - Thêm Modal xem trước tài liệu (`file-preview-modal`).
2. `style.css`:
   - Định dạng giao diện File Explorer, Folder Cards, File Items với icon nhận diện tệp (PDF, PPTX, DOC, XLS, ZIP, LINK).
   - Style khu vực kéo thả file (Drag & Drop dropzone) và hiệu ứng hover.
   - Style Modal Preview tài liệu toàn màn hình.
3. `app.js`:
   - Khởi tạo cơ sở dữ liệu `IndexedDB` (`SmartBackpackDB`).
   - Tích hợp dữ liệu tài liệu mặc định cho các môn học (Slide Học máy, Rubric BTL Tiếp thị căn bản, Deadline QLDA, Đề cương chi tiết).
   - Hàm tải file lên, xóa file, thêm link Drive, tìm kiếm file.
   - Tích hợp mở nhanh từ thời khóa biểu (khi bấm icon 🎒 ở tiết học).
   - Đăng ký Service Worker (`sw.js`).

---

## 3. Kế hoạch kiểm thử (Verification Plan)
1. **Kiểm tra giao diện Chiếc cặp**:
   - Chuyển tab mượt mà qua lại giữa *Lưới tuần*, *Hôm nay*, *Tỉ lệ điểm*, và *Chiếc cặp*.
   - Kiểm tra hiển thị đầy đủ các môn học và cấu trúc thư mục con.
2. **Kiểm tra tính năng Lưu trữ & Offline**:
   - Thử kéo thả hoặc upload 1 file PDF/ảnh vào môn học -> Kiểm tra file được lưu vào IndexedDB.
   - Thử bật chế độ Offline trong Developer Tools -> Kiểm tra ứng dụng và tài liệu vừa tải vẫn mở đọc bình thường.
   - Thử tính năng Preview tệp tin ngay trong modal.
3. **Kiểm tra PWA**:
   - Kiểm tra manifest.json hợp lệ qua Chrome DevTools Application tab.
   - Kiểm tra Service worker active và cache tài nguyên thành công.
