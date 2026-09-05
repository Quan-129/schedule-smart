# 🎒 Lịch Học Thông Minh & Chiếc Cặp Google Drive (Smart Schedule & Drive Backpack PWA)

> **Trợ lý học tập cá nhân PWA tất-cả-trong-một (All-in-One Personal Study Assistant)** dành riêng cho sinh viên Bách Khoa (HCMUT) và sinh viên đại học. Tích hợp thời khóa biểu trực quan, chiếc cặp tài liệu liên kết Google Drive, vòng tròn Donut % điểm học phần và công cụ tính điểm thi mục tiêu.

🔗 **Trải nghiệm trực tuyến**: [https://quan-129.github.io/schedule-smart/](https://quan-129.github.io/schedule-smart/)

---

## ✨ TÍNH NĂNG NỔI BẬT

### 1. 🎒 Chiếc Cặp Môn Học & Donut Ring % Điểm (Apple Rings Style)
- **Node môn học hình tròn cực cuốn**: Trực quan hóa cấu trúc điểm số từng môn bằng vòng tròn **SVG Donut Ring đa sắc** bao quanh node môn học.
- **1 Chạm mở Google Drive**: Bấm nhẹ vào ô tròn môn học để mở ngay thư mục tài liệu/slide bài giảng trên Google Drive.
- **Chế độ Jiggle Mode (Rung lắc chỉnh sửa như iOS)**:
  - Ở chế độ xem thông thường: Giao diện hoàn toàn sạch đẹp, không nút bấm thừa.
  - **Nhấn giữ (Long-press 0.5s)** hoặc chuột phải: Kích hoạt chế độ rung lắc, nảy ra **nút cây bút vàng (✏️)** để chỉnh sửa tỉ lệ % và **nút đỏ (-)** để xóa môn.
- **Bộ soạn thảo tỉ lệ điểm động**: Cho phép tự do thêm/xóa các cột điểm (GK, CK, BTL, Lab, Quiz) và tự động kiểm tra tổng 100%.

### 2. 📅 Thời Khóa Biểu Thông Minh (Smart Timetable)
- **Ma trận lưới tuần trực quan**: Hiển thị 7 ngày x 12 tiết học, làm nổi bật tiết học và ngày hôm nay theo thời gian thực (Realtime Highlight).
- **Lọc theo tuần học & môn học**: Dễ dàng theo dõi lịch học cách tuần (tuần chẵn/lẻ) từ Tuần 1 đến Tuần 20.
- **Hỗ trợ nạp lịch myBK**: Nhập dữ liệu thời khóa biểu từ file lịch hoặc cấu hình JSON nhanh chóng.

### 3. 🎯 Bộ Tính Điểm Mục Tiêu (Grade & Target Solver)
- Tự động lấy cấu trúc % điểm đã thiết lập từ Chiếc Cặp.
- Nhập điểm Giữa kỳ, Quá trình, Bài tập lớn $\rightarrow$ Hệ thống tự động giải phương trình để đưa ra **điểm thi Cuối kỳ tối thiểu cần đạt** để đạt điểm chữ A, B+, B, C+.

### 4. 📱 Ứng Dụng Ngoại Tuyến PWA (Progressive Web App)
- **Cài đặt như App Native**: Hỗ trợ "Thêm vào màn hình chính" (Add to Home Screen) trên iPhone Safari và Android Chrome.
- **Chạy Offline 100%**: Sử dụng Service Worker Cache-First, không có mạng Wi-Fi/4G trong giảng đường vẫn tra cứu lịch học và thông tin môn bình thường.
- **Zero-Dependency**: Xây dựng hoàn toàn bằng HTML5, Vanilla CSS3 và ES6+ JavaScript, tải trang trong **chưa đầy 0.3 giây**.

---

## 📂 CẤU TRÚC THƯ MỤC DỰ ÁN

```text
tools_3/
├── .agents/                      # Hệ thống 11 Nhân sự Ảo & Kỹ năng (Custom Skills)
│   └── skills/
├── docs/                         # HỆ THỐNG TÀI LIỆU TOÀN DIỆN DỰ ÁN
│   ├── 0.Log/
│   │   ├── WORKLOG.md            # Nhật ký phát triển, quyết định kỹ thuật (Dev Diary)
│   │   └── MARKETING_LOG.md      # Ngân hàng tư liệu truyền thông, viral hooks
│   ├── 1.ProductBusiness/
│   │   ├── PRD.md                # Đặc tả yêu cầu sản phẩm (Product Requirements Document)
│   │   └── User_Stories.md       # Danh sách User Stories & Tiêu chí nghiệm thu
│   ├── 2.Architecture/
│   │   ├── System_Architecture.md# Kiến trúc tổng thể, luồng dữ liệu & Sơ đồ Mermaid
│   │   └── Tech_Stack.md         # Bảng phân tích và lựa chọn công nghệ
│   ├── 3.Frontend/
│   │   ├── Design_System.md      # Bảng màu, typography, CSS tokens & animation
│   │   ├── Component_Specs.md    # Đặc tả chi tiết các component giao diện
│   │   └── UI_Wireframe_Flow.md  # Luồng điều hướng và các trạng thái màn hình
│   ├── 4.Backend/
│   │   ├── API_Specification.md  # Hợp đồng dữ liệu & tích hợp Google Drive / iCal
│   │   └── Service_Logic.md      # Thuật toán tính điểm mục tiêu & nhận diện tiết học
│   ├── 5.Database/
│   │   ├── ERD_Diagram.md        # Sơ đồ quan hệ thực thể (ERD Mermaid)
│   │   ├── Data_Dictionary.md    # Từ điển dữ liệu chi tiết các bảng
│   │   └── Schema_Design.sql     # Kịch bản DDL SQL khởi tạo cơ sở dữ liệu
│   ├── 6.Security/
│   │   ├── Security_Audit.md     # Đánh giá lỗ hổng & kế hoạch bảo mật (Phase 2)
│   │   └── Auth_RBAC_Spec.md     # Ma trận phân quyền & Luồng OAuth2 Google (Phase 2)
│   ├── 7.Performance/
│   │   ├── Optimization_Plan.md  # Kế hoạch tối ưu Core Web Vitals & Caching (Phase 3)
│   │   └── Deployment_Runbook.md # Hướng dẫn CI/CD và cài đặt ứng dụng PWA
│   ├── 8.Marketing/
│   │   ├── MARKETING_INSIGHTS.md # Ngân hàng ý tưởng, kịch bản TikTok/Reels & bài đăng
│   │   └── USP_Matrix.md         # Ma trận so sánh điểm độc đáo vượt trội
│   └── 9.More/
│       ├── README.md             # Mục lục & báo cáo tổng hợp chi tiết tài liệu bổ sung
│       ├── implementation_plan.md# Kế hoạch kiến trúc Chiếc Cặp & PWA
│       └── walkthrough.md        # Báo cáo cổng đăng nhập Authentication Gate
├── src/                          # 📂 TOÀN BỘ MÃ NGUỒN 5 TẦNG MÔ-ĐUN (ES MODULES)
│   ├── 1.Frontend/               # Giao diện, Components (CircularNode, EditModal), Views
│   ├── 2.Backend/                # Thuật toán tính điểm mục tiêu, Parser thời khóa biểu
│   ├── 3.Database/               # State Management trung tâm, LocalStorage Engine, Seed Data
│   ├── 4.Security/               # Hàm làm sạch dữ liệu escapeHtml, URL Validators
│   └── 5.Performance/            # Service Worker PWA Manager, Visibility Optimizer
├── index.html                    # Cấu trúc giao diện ứng dụng (nạp main.js type="module")
├── style.css                     # Thiết kế Glassmorphism, CSS Variables & Jiggle Animation
├── manifest.json                 # Cấu hình PWA Web App Manifest
├── sw.js                         # Service Worker xử lý Cache & Offline First (v8)
├── AGENTS.md                     # Nguyên tắc phát triển & style guide toàn dự án
└── README.md                     # Tài liệu giới thiệu dự án
```

---

## 🚀 HƯỚNG DẪN CẬP NHẬT & DEPLOY GITHUB PAGES

Khi bạn thực hiện thay đổi mã nguồn hoặc cập nhật tài liệu:

```bash
# 1. Thêm tất cả thay đổi
git add .

# 2. Tạo commit với thông điệp rõ ràng
git commit -m "Cap nhat he thong tai lieu toan dien tu docs/1 den docs/8"

# 3. Đẩy lên nhánh main trên GitHub
git push origin main
```

Sau khi push, GitHub Actions sẽ tự động deploy lên **GitHub Pages** sau ~30 giây. Bạn chỉ cần truy cập trang web và bấm **`Ctrl + Shift + R`** để làm mới!

---

## 📜 BẢN QUYỀN & GIẤY PHÉP

Dự án được xây dựng và phát triển phục vụ cộng đồng sinh viên Đại học Bách Khoa (HCMUT) và sinh viên cả nước. Mã nguồn mở theo giấy phép [MIT License](LICENSE).
