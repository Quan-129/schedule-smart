# LỰA CHỌN CÔNG NGHỆ (TECH STACK SPECIFICATION) 💻

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive  
> **Phiên bản**: `v1.2.0`  
> **Người phụ trách**: `Architecture Employee (AI Agent)`

---

## 📊 1. BẢNG TỔNG HỢP CÔNG NGHỆ (TECH MATRIX)

| Tầng / Thành Phần | Công Nghệ Lựa Chọn | Lý Do & Ưu Điểm Vượt Trội | Đánh Giá Rủi Ro / Giải Pháp |
| :--- | :--- | :--- | :--- |
| **Giao diện (Frontend Core)** | **Vanilla JavaScript (ES6+)** | Nhẹ tuyệt đối (0 dependencies, 0 bundle size), chạy trực tiếp trên mọi trình duyệt mà không cần build step. | Khó quản lý component nếu app quá lớn $\rightarrow$ Khắc phục bằng cấu trúc Modular State. |
| **Tạo kiểu (Styling)** | **Vanilla CSS3 (CSS Variables + Glassmorphism)** | Tự do sáng tạo hiệu ứng bóng mờ, gradient mượt mà, tối ưu 60fps trên di động, không phụ thuộc Tailwind/Bootstrap. | Cần tuân thủ chặt chẽ Design Tokens để tránh trùng lặp class. |
| **Đồ họa trực quan (Vector Engine)**| **Inline SVG Engine (Donut Rings)** | Vẽ vòng tròn tỉ lệ % điểm chính xác tới từng pixel, responsive tuyệt đối trên mọi độ phân giải màn hình Retina. | Tối ưu số lượng DOM element bằng cách chỉ render các lát cắt có giá trị > 0%. |
| **Lưu trữ cục bộ (Client Storage)**| **LocalStorage + Web Storage API** | Lưu trữ cấu hình, danh sách môn học và điểm số tức thì, không có độ trễ mạng (0ms latency). | Giới hạn dung lượng 5MB $\rightarrow$ Đủ cho hàng nghìn môn học dạng text JSON. |
| **Ứng dụng ngoại tuyến (PWA)** | **Service Worker API (Cache-First)** | Cho phép ứng dụng hoạt động mượt mà khi không có mạng, hỗ trợ cài đặt như Native App trên iOS/Android. | Cần cơ chế cập nhật cache khi có phiên bản mới $\rightarrow$ Đã tích hợp `CACHE_NAME` versioning. |
| **Hosting & CI/CD** | **GitHub Pages (Static Hosting)** | Miễn phí 100%, uptime 99.99%, hỗ trợ HTTPS bảo mật tự động, triển khai tức thì qua `git push`. | Không hỗ trợ server-side rendering $\rightarrow$ Phù hợp hoàn hảo với kiến trúc SPA/PWA. |

---

## 🎯 2. NGUYÊN TẮC LỰA CHỌN CÔNG NGHỆ (CORE PRINCIPLES)

1. **Zero-Dependency Architecture**: Không sử dụng các thư viện cồng kềnh như React/Vue hay các thư viện biểu đồ nặng nề (Chart.js, D3.js). Việc tự viết SVG Donut Ring giúp ứng dụng tải trang trong **chưa đầy 0.3 giây**.
2. **Mobile-First & Touch-Friendly**: Tối ưu toàn bộ tương tác cho ngón tay (vùng chạm $\ge 44px$, hỗ trợ cử chỉ Long-press, phản hồi rung qua Vibration API).
3. **Privacy by Design**: Toàn bộ dữ liệu điểm số, link tài liệu và thời khóa biểu của sinh viên được lưu trữ hoàn toàn trên thiết bị của sinh viên, không gửi về bất kỳ máy chủ bên thứ ba nào.
