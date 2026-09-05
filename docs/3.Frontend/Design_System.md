# HỆ THỐNG THIẾT KẾ GIAO DIỆN (DESIGN SYSTEM SPECIFICATION) 🎨

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive  
> **Phong cách**: Glassmorphism, Dark / Modern Vibrant, Micro-animations, Apple Activity Ring Aesthetics  
> **Người phụ trách**: `Frontend Employee (AI Agent)`

---

## 🎨 1. BẢNG MÀU CHUẨN (COLOR PALETTE & TOKENS)

Hệ thống sử dụng các biến màu CSS Variables định nghĩa trong `:root`:

```css
:root {
  /* Brand Gradients */
  --primary-gradient: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
  --accent-gradient: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
  --success-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
  --warning-gradient: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  --danger-gradient: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);

  /* Surface & Glassmorphism */
  --bg-primary: #0f172a;        /* Xanh đen thẳm hiện đại */
  --bg-secondary: #1e293b;      /* Xanh xám Slate */
  --glass-bg: rgba(30, 41, 59, 0.7);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: blur(12px);

  /* Donut Ring Colors (Apple Rings Inspiration) */
  --donut-color-gk: #3b82f6;    /* Xanh dương - Giữa kỳ */
  --donut-color-ck: #ec4899;    /* Hồng Fuchsia - Cuối kỳ */
  --donut-color-btl: #10b981;   /* Xanh ngọc - Bài tập lớn */
  --donut-color-lab: #f59e0b;   /* Vàng hổ phách - Thực hành/Lab */
  --donut-color-other: #8b5cf6; /* Tím - Chuyên cần/Khác */
}
```

---

## 🔤 2. QUY CHUẨN PHÔNG CHỮ (TYPOGRAPHY)

- **Phông chữ chủ đạo**: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.
- **Thang kích thước (Font Scale)**:
  - `Display / Header`: `1.75rem (28px)` - `font-weight: 800`
  - `Card Title / Section`: `1.25rem (20px)` - `font-weight: 700`
  - `Body Regular`: `0.95rem (15px)` - `font-weight: 400`
  - `Caption / Badge`: `0.75rem (12px)` - `font-weight: 600`

---

## ✨ 3. HIỆU ỨNG TƯƠNG TÁC & MICRO-ANIMATIONS

### 3.1. Circular Node & Donut Progress Ring
- Kích thước chuẩn: `width: 90px; height: 90px;` (trên Desktop) và `80px x 80px` (trên Mobile).
- Đường kính SVG: `viewBox="0 0 100 100"`, bán kính `r="40"` (chu vi $C = 2 \times \pi \times 40 \approx 251.327$).
- Hiệu ứng hover: Phóng to nhẹ `transform: scale(1.06)`, đổ bóng hào quang `box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3)`.

### 3.2. Jiggle Animation (Rung lắc chế độ sửa)
```css
@keyframes jiggle {
  0% { transform: rotate(-1.5deg); }
  50% { transform: rotate(1.5deg); }
  100% { transform: rotate(-1.5deg); }
}
```

### 3.3. Pop-in Action Badges (Nút Cây bút ✏️ và Nút Xóa -)
- Khi kích hoạt Jiggle Mode, cả hai badge ở hai góc trên nảy ra với animation `badgePopIn`:
```css
@keyframes badgePopIn {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
```
