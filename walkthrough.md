# Tự Động Chọn Tuần Học Chứa Ngày Hôm Nay 📅✨

Đã bổ sung thuật toán thông minh tự động nhận diện ngày hiện tại và chuyển tuần học tương ứng:

---

## 🌟 Cách Thức Hoạt Động:
1. **Đối chiếu ngày theo thời gian thực**:
   - Thuật toán `findWeekForDate()` lấy ngày hôm nay (Ví dụ: **03/09/2026**).
   - Quét qua toàn bộ danh sách `schedules/index.json` (từ Tuần 35 đến Tuần 50).
   - Ngày 03/09/2026 nằm trong khoảng từ `2026-08-31` đến `2026-09-06` -> **Tự động kích hoạt Tuần 36 (31/08)**.

2. **Trải nghiệm mượt mà**:
   - Khi bạn mở trang web lên, dropdown và bảng thời khóa biểu sẽ tự động hiển thị ngay tuần học hiện tại mà bạn không cần phải bấm chọn thủ công.
   - Thẻ ngày hôm nay (Thứ 5, 03/09) sẽ được highlight phát sáng viền và gắn badge **"Hôm nay"**.

---

## 🌐 Triển Khai
- **Repository**: [`Quan-129/schedule-smart`](https://github.com/Quan-129/schedule-smart)
