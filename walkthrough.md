# Tích Hợp Firebase Auth & Cloud Firestore Đồng Bộ Đa Thiết Bị ☁️✨

Đã tích hợp thành công hệ thống **Firebase Authentication (Đăng nhập Google)** và **Cloud Firestore (Đồng bộ thời gian thực Realtime)** vào ứng dụng:

---

## 🌟 1. 👤 Đăng Nhập Bằng Google 1-Chạm:
- Nút **`[ 👤 Đăng nhập ]`** xuất hiện tinh tế trên thanh Navbar.
- Khi bấm đăng nhập: Cửa sổ Google Auth xuất hiện để sinh viên đăng nhập bằng tài khoản Gmail cá nhân hoặc email trường `@hcmut.edu.vn`.
- Sau khi đăng nhập:
  * Hiển thị **Avatar + Tên người dùng** với hiệu ứng viền phát sáng neon.
  * Nút **Đăng xuất** nhanh gọn khi cần.

---

## 🌟 2. 🔄 Đồng Bộ Dữ Liệu Thời Gian Thực (Realtime Sync):
- **Độc lập người dùng**: Mỗi sinh viên có một vùng lưu trữ riêng biệt trên Cloud Firestore theo `User ID`.
- **Đồng bộ Máy tính ⇄ Điện thoại**:
  * Khi bạn thêm môn học hoặc đổi link Google Drive trên máy tính ➔ Điện thoại sẽ **tự động cập nhật tức thì (Realtime)** mà không cần tải lại trang!
- **Lưu trữ ngoại tuyến (Offline-First)**: Nếu không đăng nhập hoặc mất mạng, ứng dụng vẫn hoạt động bình thường nhờ cơ chế `localStorage` song song.

---

## 🌐 Triển Khai
- **Repository**: [`Quan-129/schedule-smart`](https://github.com/Quan-129/schedule-smart)
