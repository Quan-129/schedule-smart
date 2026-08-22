# 📅 Weekly Study Schedule • Markdown Git Deploy Hub

Hệ thống quản lý thời khóa biểu & lịch học sinh viên thông minh, tự động chuyển đổi các file **Markdown (`.md`)** thành giao diện Dashboard thời khóa biểu trực quan, hiện đại và hỗ trợ triển khai (deploy) hoàn toàn miễn phí qua **GitHub Pages** thông qua Git.

---

## ✨ Tính Năng Nổi Bật

- 🚀 **Tự động hóa hoàn toàn với Git**: Mỗi khi thêm/sửa file `.md` và `git push`, website sẽ tự động cập nhật sau vài giây.
- 🎨 **Giao diện Glassmorphism Hiện Đại**: Hỗ trợ Dark / Light Theme, tối ưu hiển thị mượt mà trên cả Điện thoại và Máy tính.
- 🧠 **Bộ phân tích Markdown thông minh**: Tự động nhận diện giờ học, tiết học, môn học, phòng học, cơ sở (CS1/CS2) và các mục lưu ý.
- 🌈 **Tự động gắn nhãn màu môn học**: Mỗi môn học tự động được tạo mã màu riêng biệt giúp dễ nhìn.
- 🕒 **Chế độ xem đa dạng**:
  - **Lưới tuần (Week Grid)**: Xem toàn bộ các thứ trong tuần.
  - **Hôm nay (Today Focus)**: Tập trung hiển thị lịch học của ngày hiện tại và đếm ngược tiết học kế tiếp.
  - **Xem & Sửa Markdown trực tiếp (Live Editor)**: Cho phép sửa và kiểm tra nhanh hiển thị trước khi lưu.
- 🔍 **Tìm kiếm & Lọc**: Tìm kiếm theo tên môn, phòng học, hoặc lọc theo từng môn học chỉ với 1 cú nhấp chuột.
- 🖨️ **Hỗ trợ In ấn / Xuất PDF**: Có nút in được tối ưu riêng biệt cho trang giấy A4.

---

## 📁 Cấu Trúc Thư Mục

```text
tools_3/
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD tự động build & deploy lên GitHub Pages
├── schedules/                # Thư mục chứa các file .md lịch học từng tuần
│   ├── index.json            # Danh sách các tuần để hiển thị trên menu chọn
│   ├── tuan-35.md            # File lịch học Tuần 35
│   └── tuan-36.md            # File lịch học Tuần 36 (mẫu)
├── index.html                # Giao diện chính của ứng dụng
├── style.css                 # File style giao diện
├── app.js                    # Bộ phân tích Markdown và logic render
├── .gitignore
└── README.md
```

---

## 📝 Định Dạng File Markdown Lịch Học

Bạn có thể viết lịch học cho tuần mới trong thư mục `schedules/` (ví dụ `schedules/tuan-37.md`) theo định dạng chuẩn cực kỳ đơn giản sau:

```markdown
# Lịch học Tuần 37

## Thứ 2
- 10:00 - 11:50 (Tiết 5 - 6): Quản lý Dự án cho Kỹ sư | Phòng: B1-212 (CS1)
- 14:00 - 15:50 (Tiết 9 - 10): Tư tưởng Hồ Chí Minh | Phòng: B4-505 (CS1)

## Thứ 3
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)
- 13:00 - 14:50 (Tiết 8 - 9): Nhập môn Trí tuệ Nhân tạo | Phòng: B4-301 (CS1)

## Thứ 4
- 07:00 - 08:50 (Tiết 2 - 3): Pháp luật Việt Nam Đại cương | Phòng: C4-402 (CS1)
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)

## Thứ 5
- 07:00 - 08:50 (Tiết 2 - 3): Tiếp thị Căn bản | Phòng: B4-303 (CS1)
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)

## Thứ 6
- 07:00 - 08:50 (Tiết 2 - 3): Học máy | Phòng: B1-305 (CS1)
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)

## Thứ 7 & Chủ Nhật
- Nghỉ.

## Lưu ý nhỏ:
- Tuần này nộp báo cáo Đồ án Chuyên ngành.
- Nhớ ôn bài Tiếng Nhật 7 trước khi đến lớp.
```

---

## 🚀 Hướng Dẫn Deploy Lên GitHub Pages Từng Bước

### Bước 1: Khởi tạo Git và Commit mã nguồn
Mở Terminal / PowerShell tại thư mục này và chạy:

```bash
git init
git add .
git commit -m "Khởi tạo hệ thống lịch học Markdown deploy qua Git"
```

### Bước 2: Tạo Repository trên GitHub và Push lên
1. Vào [github.com/new](https://github.com/new) và tạo một repository mới (ví dụ đặt tên là `lich-hoc` hoặc `study-schedule`).
2. Chạy lệnh liên kết và đẩy code lên:

```bash
git branch -M main
git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repo>.git
git push -u origin main
```

### Bước 3: Kích hoạt GitHub Pages (Chỉ cần làm 1 lần duy nhất)
1. Trên trang GitHub repository của bạn, vào tab **Settings** ⚙️.
2. Chọn mục **Pages** ở thanh menu bên trái.
3. Tại phần **Build and deployment > Source**, chọn:
   👉 **GitHub Actions**
4. Sau đó hệ thống sẽ tự động chạy workflow trong `.github/workflows/deploy.yml` và cung cấp cho bạn một đường link website (dạng `https://<tai-khoan>.github.io/<ten-repo>/`) để xem mọi lúc mọi nơi!

---

## ➕ Cách Thêm Lịch Học Tuần Mới Sau Này

Mỗi khi bắt đầu tuần mới, bạn chỉ cần thực hiện 2 bước đơn giản:

1. Tạo file `schedules/tuan-XX.md` và viết lịch học.
2. Mở file `schedules/index.json` và thêm tuần mới vào danh sách, ví dụ:
```json
[
  {
    "id": "tuan-37",
    "title": "Tuần 37",
    "filename": "schedules/tuan-37.md"
  },
  ...
]
```
3. Chạy lệnh đẩy lên Git:
```bash
git add .
git commit -m "Cập nhật lịch học tuần 37"
git push
```
Trang web của bạn sẽ tự động cập nhật ngay lập tức!
