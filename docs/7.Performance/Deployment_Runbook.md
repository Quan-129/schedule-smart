# SỔ TAY TRIỂN KHAI VÀ VẬN HÀNH (DEPLOYMENT RUNBOOK) 🛠

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive  
> **Nền tảng**: GitHub Pages & PWA Hosting  
> **Người phụ trách**: `Performance Employee (AI Agent)`

---

## 🚀 1. QUY TRÌNH TRIỂN KHAI PHIÊN BẢN MỚI (DEPLOYMENT STEPS)

Khi có bản cập nhật mã nguồn (HTML, CSS, JS):

1. **Bước 1: Tăng số hiệu Cache trong `sw.js`**
   - Mở file `sw.js` và tăng `CACHE_NAME` (ví dụ từ `v6` lên `v7`).
2. **Bước 2: Commit và Push lên GitHub**
   ```bash
   git add .
   git commit -m "Mo ta tinh nang moi hoac sua loi"
   git push origin main
   ```
3. **Bước 3: Kiểm tra trạng thái GitHub Pages Deployment**
   - Truy cập tab **Actions** trên GitHub repository: `https://github.com/Quan-129/schedule-smart/actions`
   - Chờ job `pages build and deployment` chuyển sang màu xanh lá (thường mất 30-45 giây).
4. **Bước 4: Kiểm tra trên trình duyệt & Xóa cache**
   - Truy cập: `https://quan-129.github.io/schedule-smart/`
   - Bấm `Ctrl + Shift + R` (hoặc `Ctrl + F5`) để nạp phiên bản Service Worker mới nhất.

---

## 📱 2. HƯỚNG DẪN CÀI ĐẶT ỨNG DỤNG PWA (ADD TO HOME SCREEN)

- **Trên iPhone (iOS Safari)**:
  1. Mở trang web bằng trình duyệt **Safari**.
  2. Bấm vào nút **Chia sẻ (Share icon)** ở thanh công cụ dưới cùng.
  3. Chọn **"Thêm vào màn hình chính" (Add to Home Screen)**.
  4. Ứng dụng sẽ xuất hiện như một ứng dụng Native độc lập, không có thanh địa chỉ trình duyệt.

- **Trên Android (Chrome)**:
  1. Mở trang web bằng trình duyệt **Chrome**.
  2. Bấm vào biểu tượng menu ba chấm $\rightarrow$ Chọn **"Cài đặt ứng dụng"** hoặc bấm nút **"Cài đặt"** nổi trên giao diện.
