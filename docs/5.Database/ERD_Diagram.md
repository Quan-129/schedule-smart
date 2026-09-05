# SƠ ĐỒ QUAN HỆ THỰC THỂ (ERD DIAGRAM) 🗄

> **Dự án**: Lịch Học Thông Minh & Chiếc Cặp Google Drive  
> **Người phụ trách**: `Database Employee (AI Agent)`

---

## 📊 1. SƠ ĐỒ ERD CHI TIẾT (MERMAID)

```mermaid
erDiagram
    SUBJECT ||--o{ GRADE_COMPONENT : contains
    SUBJECT ||--o{ SCHEDULE_SLOT : scheduled_at
    SUBJECT ||--o{ STUDENT_GRADE : evaluated_by

    SUBJECT {
        string id PK "Mã môn học (VD: CO3117)"
        string name "Tên môn học"
        string room "Phòng học chính"
        string lecturer "Giảng viên phụ trách"
        string drive_url "Link thư mục Google Drive"
        int credits "Số tín chỉ"
        datetime created_at "Thời điểm tạo"
    }

    GRADE_COMPONENT {
        string id PK "Mã cột điểm"
        string subject_id FK "Liên kết môn học"
        string name "Tên cột điểm (GK, CK, BTL...)"
        float percentage "Tỉ lệ phần trăm (0 - 100)"
        string color_hex "Mã màu hiển thị Donut Ring"
        int display_order "Thứ tự sắp xếp"
    }

    SCHEDULE_SLOT {
        string id PK "Mã tiết học"
        string subject_id FK "Liên kết môn học"
        int day_of_week "Thứ trong tuần (2 - 8)"
        int start_period "Tiết bắt đầu (1 - 12)"
        int end_period "Tiết kết thúc (1 - 12)"
        string room "Phòng học cụ thể"
        string week_pattern "Chuỗi tuần học (VD: 1-15 hoặc chẵn/lẻ)"
    }

    STUDENT_GRADE {
        string id PK "Mã bản ghi điểm"
        string subject_id FK "Liên kết môn học"
        string component_name "Tên cột điểm"
        float score "Điểm số đạt được (0.0 - 10.0)"
        string target_grade "Điểm chữ mục tiêu (A, B+, B...)"
        datetime updated_at "Lần cập nhật cuối"
    }
```

---

## 🔗 2. MỐI QUAN HỆ GIỮA CÁC THỰC THỂ

1. **SUBJECT - GRADE_COMPONENT (1 - Nhiều)**:
   - Mỗi môn học có 1 hoặc nhiều cột điểm thành phần với tổng phần trăm bằng 100%.
   - Khi xóa môn học, toàn bộ cột điểm cấu hình của môn đó sẽ được dọn dẹp theo cơ chế Cascade.

2. **SUBJECT - SCHEDULE_SLOT (1 - Nhiều)**:
   - Một môn học có thể có nhiều buổi học trong tuần (ví dụ: Thứ 2 học Lý thuyết, Thứ 5 học Thực hành).

3. **SUBJECT - STUDENT_GRADE (1 - Nhiều)**:
   - Lưu trữ lịch sử điểm số thực tế và mục tiêu điểm chữ của sinh viên đối với môn học đó.
