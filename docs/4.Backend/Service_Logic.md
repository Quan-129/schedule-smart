# LOGIC NGHIỆP VỤ & THUẬT TOÁN HỆ THỐNG (SERVICE LOGIC) ⚙️

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive  
> **Người phụ trách**: `Backend Employee (AI Agent)`

---

## 🧮 1. THUẬT TOÁN TÍNH ĐIỂM MỤC TIÊU (GRADE TARGET ALGORITHM)

### 1.1. Công thức tính điểm tổng kết (Final Grade Formula)
$$Điểm\ Tổng\ Kết = \sum_{i=1}^{n} (Điểm_i \times \frac{Tỉ\ Lệ_i}{100})$$

Trong đó:
- $Điểm_i$: Điểm số của cột thành phần thứ $i$ (thang điểm 10).
- $Tỉ\ Lệ_i$: Phần trăm trọng số của cột thứ $i$ ($\sum Tỉ\ Lệ_i = 100\%$).

### 1.2. Giải phương trình điểm thi Cuối kỳ cần đạt:
Giả sử bài thi Cuối kỳ ($CK$) là cột điểm chưa có, các cột điểm quá trình ($QT$) đã biết:
$$Điểm_{CK\ Cần\ Đạt} = \frac{Mục\ Tiêu - \sum (Điểm_{QT} \times \frac{Tỉ\ Lệ_{QT}}{100})}{\frac{Tỉ\ Lệ_{CK}}{100}}$$

**Quy chuẩn điểm mục tiêu theo hệ thống tín chỉ**:
- Mục tiêu **A**: $\ge 8.5$
- Mục tiêu **B+**: $\ge 8.0$
- Mục tiêu **B**: $\ge 7.0$
- Mục tiêu **C+**: $\ge 6.5$
- Mục tiêu **C**: $\ge 5.5$
- Mục tiêu **D (Qua môn)**: $\ge 4.0$

### 1.3. Phân loại kết quả đầu ra:
1. **$Điểm_{CK} \le 0$**: `ĐÃ ĐẠT MỤC TIÊU 🎉` (Điểm quá trình đã đủ cao, đi thi chỉ cần tránh điểm liệt).
2. **$0 < Điểm_{CK} \le 10$**: `CẦN ĐẠT X.X ĐIỂM 🎯` (Mục tiêu khả thi).
3. **$Điểm_{CK} > 10$**: `KHÔNG KHẢ THI ⚠️` (Ngay cả khi được 10 điểm cuối kỳ cũng không đủ điểm tổng kết mong muốn).

---

## 🕒 2. THUẬT TOÁN TỰ ĐỘNG PHÁT HIỆN TIẾT HỌC HIỆN TẠI (REALTIME LESSON DETECTION)

### 2.1. Bảng quy đổi khung giờ tiết học:
| Tiết Học | Khung Giờ Bắt Đầu | Khung Giờ Kết Thúc | Buổi |
| :---: | :---: | :---: | :---: |
| **Tiết 1** | 07:00 | 07:50 | Sáng |
| **Tiết 2** | 08:00 | 08:50 | Sáng |
| **Tiết 3** | 09:00 | 09:50 | Sáng |
| **Tiết 4** | 10:00 | 10:50 | Sáng |
| **Tiết 5** | 11:00 | 11:50 | Sáng |
| **Tiết 6** | 12:00 | 12:50 | Trưa |
| **Tiết 7** | 13:00 | 13:50 | Chiều |
| **Tiết 8** | 14:00 | 14:50 | Chiều |
| **Tiết 9** | 15:00 | 15:50 | Chiều |
| **Tiết 10** | 16:00 | 16:50 | Chiều |
| **Tiết 11** | 17:00 | 17:50 | Chiều |
| **Tiết 12** | 18:00 | 18:50 | Tối |

### 2.2. Logic làm nổi bật:
- Lấy `new Date()` từ máy khách $\rightarrow$ Xác định Thứ trong tuần ($0 = CN, 1 = T2...$) và Giờ phút hiện tại.
- Lặp qua danh sách lịch học trong ngày $\rightarrow$ Nếu giờ hiện tại nằm trong khoảng [Bắt đầu, Kết thúc] của môn học $\rightarrow$ Thêm class `.current-active-lesson` để hiển thị hiệu ứng viền Neon.
