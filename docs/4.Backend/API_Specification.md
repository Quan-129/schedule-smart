# ĐẶC TẢ GIAO TIẾP VÀ HỢP ĐỒNG DỮ LIỆU (API SPECIFICATION) 🔌

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive  
> **Mô hình**: Client-Side Service Contracts & External Integration Endpoints  
> **Người phụ trách**: `Backend Employee (AI Agent)`

---

## 📡 1. HỢP ĐỒNG TÍCH HỢP NGOẠI VI (EXTERNAL CONTRACTS)

### 1.1. Google Drive Deep-Linking Contract
- **Mục đích**: Mở nhanh thư mục tài liệu môn học trên ứng dụng Google Drive hoặc nền tảng Web.
- **Quy chuẩn URL**:
  - Web URL: `https://drive.google.com/drive/folders/{FOLDER_ID}?usp=sharing`
  - Fallback Search URL: `https://drive.google.com/drive/search?q={SUBJECT_NAME}+{SUBJECT_CODE}`
- **Hành vi**:
  - Ứng dụng tự động kiểm tra định dạng URL hợp lệ trước khi điều hướng.
  - Hỗ trợ mở trực tiếp trong ứng dụng Google Drive trên thiết bị di động (nếu đã cài đặt).

### 1.2. iCalendar / myBK Schedule Import Spec (.ics Parser)
- **Mục đích**: Chuyển đổi định dạng file lịch xuất từ myBK portal thành cấu trúc dữ liệu thời khóa biểu chuẩn của hệ thống.
- **Dữ liệu đầu vào**: Chuỗi MIME type `text/calendar` chuẩn RFC 5545.
- **Trường dữ liệu trích xuất (Extracted Fields)**:
  - `SUMMARY`: Tên môn học & Mã môn (VD: `CO3117 - Thiết kế hệ thống số`).
  - `LOCATION`: Phòng học (VD: `H6-204`, `A4-102`).
  - `DESCRIPTION`: Giảng viên, Mã lớp, Ghi chú.
  - `DTSTART / DTEND`: Thời gian bắt đầu và kết thúc tiết học.
  - `RRULE`: Quy tắc lặp lại theo tuần.

---

## 📦 2. CONTRACT LƯU TRỮ NỘI BỘ (LOCAL STORAGE API SCHEMA)

### 2.1. Key: `smart_schedule_drive_v2`
- **Mô tả**: Lưu trữ danh sách môn học, liên kết Drive và cấu trúc % điểm.
- **Cấu trúc JSON**:
```json
[
  {
    "id": "CO3117",
    "name": "Thiết Kế Hệ Thống Số",
    "room": "H6-204",
    "lecturer": "TS. Phạm Văn A",
    "driveUrl": "https://drive.google.com/drive/folders/sample_folder_id",
    "gradeItems": [
      { "name": "Giữa kỳ (GK)", "pct": 20, "color": "#3b82f6" },
      { "name": "Bài tập lớn (BTL)", "pct": 30, "color": "#10b981" },
      { "name": "Cuối kỳ (CK)", "pct": 50, "color": "#ec4899" }
    ]
  }
]
```

### 2.2. Key: `smart_schedule_grades_v1`
- **Mô tả**: Lưu trữ điểm số thực tế sinh viên đã nhập cho từng môn.
- **Cấu trúc JSON**:
```json
{
  "CO3117": {
    "GK": 8.0,
    "BTL": 8.5,
    "target": "A"
  }
}
```
