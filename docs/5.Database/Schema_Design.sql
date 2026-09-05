-- ====================================================================
-- KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU (DATABASE DDL SCHEMA)
-- Dự án: Lịch Học Thông Minh & Chiếc Cặp Google Drive
-- Thiết kế bởi: Database Employee (AI Agent)
-- ====================================================================

-- 1. Tạo bảng Danh Mục Môn Học
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    room VARCHAR(50) DEFAULT '',
    lecturer VARCHAR(100) DEFAULT '',
    drive_url TEXT DEFAULT '',
    credits INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tạo bảng Cấu Trúc Điểm Thành Phần (Dynamic Grade Components)
CREATE TABLE IF NOT EXISTS grade_components (
    id VARCHAR(36) PRIMARY KEY,
    subject_id VARCHAR(20) NOT NULL,
    name VARCHAR(50) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    color_hex VARCHAR(10) NOT NULL DEFAULT '#3b82f6',
    display_order INT DEFAULT 0,
    CONSTRAINT fk_grade_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 3. Tạo bảng Lịch Học & Tiết Học (Schedule Slots)
CREATE TABLE IF NOT EXISTS schedule_slots (
    id VARCHAR(36) PRIMARY KEY,
    subject_id VARCHAR(20) NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 2 AND 8),
    start_period INT NOT NULL CHECK (start_period BETWEEN 1 AND 12),
    end_period INT NOT NULL CHECK (end_period BETWEEN 1 AND 12),
    room VARCHAR(50) DEFAULT '',
    week_pattern VARCHAR(100) DEFAULT 'all',
    CONSTRAINT fk_slot_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 4. Tạo bảng Điểm Sinh Viên & Mục Tiêu (Student Grade Records)
CREATE TABLE IF NOT EXISTS student_grades (
    id VARCHAR(36) PRIMARY KEY,
    subject_id VARCHAR(20) NOT NULL,
    component_name VARCHAR(50) NOT NULL,
    score DECIMAL(4,2) DEFAULT NULL CHECK (score >= 0 AND score <= 10),
    target_grade VARCHAR(5) DEFAULT 'A',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_grade_record_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- ====================================================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA HK241 / HK261)
-- ====================================================================

INSERT INTO subjects (id, name, room, lecturer, drive_url, credits) VALUES
('CO3117', 'Thiết Kế Hệ Thống Số', 'H6-204', 'TS. Huỳnh Việt Thắng', 'https://drive.google.com/drive/folders/sample_co3117', 3),
('CO3093', 'Mạng Máy Tính', 'A4-402', 'ThS. Nguyễn Hoàng Nam', 'https://drive.google.com/drive/folders/sample_co3093', 3),
('SP1031', 'Triết Học Mác - Lênin', 'C5-101', 'TS. Trần Thị Bích Vân', 'https://drive.google.com/drive/folders/sample_sp1031', 3);

INSERT INTO grade_components (id, subject_id, name, percentage, color_hex, display_order) VALUES
('gc_01', 'CO3117', 'Giữa kỳ (GK)', 20.00, '#3b82f6', 1),
('gc_02', 'CO3117', 'Bài tập lớn (BTL)', 30.00, '#10b981', 2),
('gc_03', 'CO3117', 'Cuối kỳ (CK)', 50.00, '#ec4899', 3),
('gc_04', 'CO3093', 'Kiểm tra GK', 30.00, '#3b82f6', 1),
('gc_05', 'CO3093', 'Thực hành Lab', 20.00, '#f59e0b', 2),
('gc_06', 'CO3093', 'Thi Cuối kỳ', 50.00, '#ec4899', 3);
