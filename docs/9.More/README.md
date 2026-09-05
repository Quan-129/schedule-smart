# MỤC LỤC & BÁO CÁO TỔNG HỢP TÀI LIỆU BỔ SUNG (MORE DOCS HUB) 📚

> **Thư mục**: `docs/9.More/`  
> **Chịu trách nhiệm**: `9-more-archiver (AI Agent Skill)`  
> **Mục tiêu**: Lưu trữ, phân loại và tóm tắt tập trung toàn bộ các bản kế hoạch thực thi, báo cáo tính năng và tài liệu kỹ thuật bổ sung phát sinh trong quá trình phát triển dự án.

---

## 📑 1. BẢNG DANH MỤC & MỤC LỤC TỔNG QUAN

| STT | Tên Tài Liệu & Đường Dẫn | Thể Loại | Tóm Tắt Mục Đích & Nội Dung Chính | Trạng Thái |
| :---: | :--- | :---: | :--- | :---: |
| **1** | [implementation_plan.md](./implementation_plan.md) | `Kế hoạch Kiến trúc` | Đặc tả kỹ thuật và kế hoạch xây dựng tính năng "Chiếc Cặp Thông Minh" (Smart Backpack), cơ chế lưu trữ IndexedDB và nâng cấp ứng dụng PWA. | 🟢 Đã hoàn thành |
| **2** | [walkthrough.md](./walkthrough.md) | `Báo cáo Tính năng` | Báo cáo trải nghiệm người dùng đối với Màn hình Đăng nhập riêng biệt (Authentication Gate) và đồng bộ Cloud Firestore. | 🟢 Đã hoàn thành |

---

## 🔍 2. CHI TIẾT & ĐÁNH GIÁ TỪNG TÀI LIỆU

### 🎒 1. [Kế Hoạch Triển Khai Chiếc Cặp Thông Minh & PWA](./implementation_plan.md)
- **Tập tin**: `docs/9.More/implementation_plan.md`
- **Mục tiêu giải quyết**:
  - Xây dựng giao diện File Explorer thu nhỏ cho từng môn học để quản lý Slide bài giảng, Bài tập lớn, Đề thi cũ.
  - Tích hợp công nghệ PWA (Progressive Web App) với `manifest.json` và Service Worker (`sw.js`) để cài đặt trực tiếp lên iPhone/Android.
  - Thiết lập cơ chế lưu trữ Offline bằng IndexedDB giúp sinh viên mở tài liệu bài giảng ngay cả khi không có kết nối Wi-Fi/4G.
- **Giá trị tra cứu**: Cung cấp tài liệu tham khảo chi tiết về các bước chuyển đổi Web App thông thường sang PWA hoàn chỉnh.

---

### 🚪 2. [Báo Cáo Màn Hình Đăng Nhập & Cổng Xác Thực](./walkthrough.md)
- **Tập tin**: `docs/9.More/walkthrough.md`
- **Mục tiêu giải quyết**:
  - Thiết kế màn hình Landing Login Gate phong cách Glassmorphism che chắn giao diện chính cho đến khi sinh viên đăng nhập Google.
  - Đảm bảo tính bảo mật và cá nhân hóa dữ liệu thời khóa biểu cho từng tài khoản.
- **Giá trị tra cứu**: Ghi lại luồng trải nghiệm đăng nhập và kiến trúc đồng bộ Firebase Auth / Firestore.

---

## 💡 3. NGUYÊN TẮC QUẢN LÝ THƯ MỤC NÀY

1. Mọi file `.md` phát sinh ở thư mục gốc (ngoại trừ `README.md` và `AGENTS.md`) sẽ tự động được skill `9-more-archiver` di chuyển vào đây.
2. File `README.md` này sẽ được tự động cập nhật thêm dòng vào bảng danh mục và phần tóm tắt chi tiết mỗi khi có tài liệu mới được lưu trữ.
