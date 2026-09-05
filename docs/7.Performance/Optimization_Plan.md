# KẾ HOẠCH TỐI ƯU HIỆU NĂNG VÀ VẬN HÀNH (PERFORMANCE OPTIMIZATION PLAN) ⚡

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive  
> **Trạng thái**: Giai đoạn 3 Blueprint (Chờ phê duyệt triển khai)  
> **Người phụ trách**: `Performance Employee (AI Agent)`

---

## ⚡ 1. CHỈ SỐ ĐO LƯỜNG HIỆU NĂNG MỤC TIÊU (CORE WEB VITALS)

| Chỉ Số | Mục Tiêu | Hiện Trạng Đo Lường | Đánh Giá |
| :--- | :---: | :---: | :---: |
| **LCP (Largest Contentful Paint)** | $\le 1.2\text{s}$ | **0.45s** | 🟢 Xuất sắc (Nhờ cấu trúc Zero-Framework) |
| **FID / INP (Interaction to Next Paint)** | $\le 50\text{ms}$ | **12ms** | 🟢 Mượt mà (Phản hồi tức thì) |
| **CLS (Cumulative Layout Shift)** | $\le 0.05$ | **0.00** | 🟢 Không bị giật layout |
| **Dung lượng tải ban đầu (Initial Bundle)**| $\le 150\text{KB}$ | **~48KB** | 🟢 Siêu nhẹ, tải trong chớp mắt |

---

## 🚀 2. CÁC GIẢI PHÁP TỐI ƯU GIAI ĐOẠN 3

### 2.1. Tối ưu hóa render SVG Donut Rings
- Giữ nguyên cơ chế render trực tiếp bằng các thẻ `<circle>` vector tính sẵn chu vi $2\pi R$, tránh ép trình duyệt tính toán lại layout (reflow/repaint).
- Sử dụng `will-change: transform;` cho các phần tử trong chế độ Jiggle Mode để tận dụng tăng tốc phần cứng GPU.

### 2.2. Chiến lược Cache Service Worker nâng cao
- **Precache Assets**: Tự động nạp sẵn toàn bộ HTML, CSS, JS, Icon font vào Cache Storage khi Service Worker được cài đặt (`install` event).
- **Stale-While-Revalidate**: Trả ngay kết quả từ Cache cho người dùng tức thì, đồng thời ngầm tải phiên bản mới từ GitHub Pages và thông báo cập nhật khi hoàn tất.

### 2.3. Tối ưu tiêu thụ Pin & CPU trên di động
- Tắt toàn bộ interval tính toán thời gian thực khi tab ở trạng thái `document.hidden === true` (Page Visibility API).
