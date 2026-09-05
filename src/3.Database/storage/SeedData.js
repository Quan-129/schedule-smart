/**
 * ==========================================================================
 * DATABASE SEED DATA
 * Dữ liệu mẫu ban đầu cho môn học, tỉ lệ điểm và thời khóa biểu
 * ==========================================================================
 */

export const DEFAULT_WEEK_35_MD = `# Lịch học Tuần 35

## Thứ 2
- 10:00 - 11:50 (Tiết 5 - 6): Quản lý Dự án cho Kỹ sư | Phòng: B1-212 (CS1)
- 14:00 - 15:50 (Tiết 9 - 10): Tư tưởng Hồ Chí Minh | Phòng: B4-505 (CS1)

## Thứ 3
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)
- 13:00 - 14:50 (Tiết 8 - 9): Nhập môn Trí tuệ Nhân tạo | Phòng: B4-301 (CS1)

## Thứ 4
- 07:00 - 08:50 (Tiết 2 - 3): Pháp luật Việt Nam Đại cương | Phòng: C4-402 (CS1)
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)

## Thứ 5
- 07:00 - 08:50 (Tiết 2 - 3): Tiếp thị Căn bản | Phòng: B4-303 (CS1)
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)

## Thứ 6
- 07:00 - 08:50 (Tiết 2 - 3): Học máy | Phòng: B1-305 (CS1)
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)

## Thứ 7 & Chủ Nhật
- Nghỉ.

## Lưu ý nhỏ:
- Môn Đồ án Chuyên ngành đã bắt đầu tính từ tuần 35, bạn nhớ chủ động sắp xếp thời gian làm việc với giáo viên hướng dẫn nhé.
- Tuần này bạn học Tiếng Nhật 7 liên tục 4 buổi sáng (từ Thứ 3 đến Thứ 6).`;

export const DEFAULT_WEEK_36_MD = `# Lịch học Tuần 36

## Thứ 2, Thứ 3 & Thứ 4
- Nghỉ (Lịch trống hoàn toàn, khả năng cao là nghỉ Lễ Quốc khánh 2/9).

## Thứ 5
- 07:00 - 08:50 (Tiết 2 - 3): Tiếp thị Căn bản | Phòng: B4-303 (CS1)
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)

## Thứ 6
- 07:00 - 08:50 (Tiết 2 - 3): Học máy | Phòng: B1-305 (CS1)
- 09:00 - 11:50 (Tiết 4 - 6): Tiếng Nhật 7 | Phòng: B9-202 (CS1)

## Thứ 7 & Chủ Nhật
- Nghỉ.

## Lưu ý nhỏ:
- Tuần này bạn được nghỉ từ Thứ 2 đến hết Thứ 4, lịch học trên trường chỉ tập trung vào buổi sáng Thứ 5 và Thứ 6.
- Môn Đồ án Chuyên ngành vẫn tiếp tục tiến độ, bạn nhớ tự sắp xếp thời gian làm việc nhé.`;

export const SUBJECT_COLORS = [
  { border: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },
  { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', text: '#f472b6' },
  { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', text: '#22d3ee' },
  { border: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399' },
  { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24' },
  { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', text: '#a78bfa' },
  { border: '#14b8a6', bg: 'rgba(20, 184, 166, 0.12)', text: '#2dd4bf' },
  { border: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', text: '#fb923c' },
  { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa' }
];

export const INITIAL_SUBJECT_DRIVE = [
  {
    code: 'CO3117',
    name: 'Học máy',
    englishName: 'Machine Learning',
    credits: 3,
    lecturers: 'Lê Thành Sách, Trương Vĩnh Lân, Nguyễn Đức Dũng, Lê Hồng Trang, Võ Thanh Hùng, Nguyễn An Khương',
    department: 'Khoa Khoa học & Kỹ thuật Máy tính (CSE)',
    icon: 'fa-solid fa-robot',
    color: '#6366f1',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 60, type: 'Tự luận', duration: '90 phút', color: '#6366f1', note: 'Từ chương 6 đến chương 10' },
      { id: 'item-gk', name: 'Kiểm tra giữa kỳ (Midterm Exam)', weight: 30, type: 'Tự luận', duration: '60 phút', color: '#ec4899', note: 'Đến hết chương 5' },
      { id: 'item-btl', name: 'Bài tập lớn (Group Assignment)', weight: 10, type: 'Project nhóm thực hành', duration: '45 tiết', color: '#10b981', note: 'Triển khai mô hình bài toán thực tế' }
    ],
    notes: 'Quy định AI: Chỉ cho phép dùng hỗ trợ tìm kiếm tài liệu. Nghiêm cấm nộp sản phẩm hoàn toàn do AI tạo ra.'
  },
  {
    code: 'IM1025',
    name: 'Quản lý Dự án cho Kỹ sư',
    englishName: 'Project Management for Engineers',
    credits: 3,
    lecturers: 'Huỳnh Thị Phương Lan, Nguyễn Thùy Trang, Nguyễn Thị Đức Nguyên, Nguyễn Bắc Nguyên, Đường Võ Hùng, Lê Phước Luông',
    department: 'Khoa Quản Lý Công Nghiệp (SIM)',
    icon: 'fa-solid fa-diagram-project',
    color: '#f59e0b',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 40, type: 'Trắc nghiệm chấm máy', duration: '70 phút', color: '#6366f1', note: 'Bắt buộc tham gia >= 80% số giờ học' },
      { id: 'item-gk', name: 'Kiểm tra giữa kỳ (Midterm Exam)', weight: 30, type: 'Trắc nghiệm chấm máy', duration: '50 phút', color: '#f59e0b', note: 'Đánh giá kiến thức nửa đầu học kỳ' },
      { id: 'item-cn', name: 'Bài tập cá nhân (Individual)', weight: 15, type: 'Bài tập về nhà & Phản tư', duration: '--', color: '#06b6d4', note: 'Đánh giá nhận thức cá nhân' },
      { id: 'item-nhom', name: 'Bài tập nhóm (Group Assignment)', weight: 15, type: 'Báo cáo dự án & Thuyết trình', duration: '--', color: '#10b981', note: 'Phối hợp làm việc nhóm' }
    ],
    notes: 'Nộp bài trễ trên LMS bị trừ 2 điểm/ngày. Tham dự tối thiểu 80% số giờ học là điều kiện bắt buộc.'
  },
  {
    code: 'IM1019',
    name: 'Tiếp thị Căn bản',
    englishName: 'Principle of Marketing',
    credits: 3,
    lecturers: 'Bùi Huy Hải Bích, Phạm Ngọc Trâm Anh, Mai Thị Mỹ Quyên, Nguyễn Văn Tuấn, Dương Thị Ngọc Liên, Lê Nguyễn Hậu',
    department: 'Khoa Quản Lý Công Nghiệp (SIM)',
    icon: 'fa-solid fa-chart-line',
    color: '#ec4899',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Trắc nghiệm', duration: '60 phút', color: '#6366f1', note: 'Thi tập trung theo lịch chung' },
      { id: 'item-btl', name: 'Bài tập lớn (Group Project)', weight: 30, type: 'Dự án nhóm & Thuyết trình', duration: 'Nhóm 6-7 SV', color: '#ec4899', note: 'Vắng thuyết trình BTL bị 0 điểm BTL' },
      { id: 'item-tx', name: 'Đánh giá thường xuyên (Formative)', weight: 20, type: 'Bài tập trên lớp / Online', duration: '--', color: '#10b981', note: 'Vắng bài tập nào bị 0 điểm bài đó' }
    ],
    notes: 'Sinh viên làm việc nhóm 6-7 người. Vắng buổi thuyết trình BTL bị 0 điểm BTL.'
  },
  {
    code: 'CO3061',
    name: 'Nhập môn Trí tuệ Nhân tạo',
    englishName: 'Introduction to Artificial Intelligence',
    credits: 3,
    lecturers: 'Bộ môn Khoa học Máy tính',
    department: 'Khoa Khoa học và Kỹ thuật Máy tính (CSE)',
    icon: 'fa-solid fa-brain',
    color: '#06b6d4',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Tự luận / Trắc nghiệm', duration: '90 phút', color: '#6366f1', note: 'Đánh giá toàn diện các chủ đề AI' },
      { id: 'item-gk', name: 'Kiểm tra giữa kỳ (Midterm Exam)', weight: 30, type: 'Tự luận / Trắc nghiệm', duration: '60 phút', color: '#f59e0b', note: 'Thuật toán tìm kiếm, Logic, CSP' },
      { id: 'item-btl', name: 'Bài tập lớn / Thực hành', weight: 20, type: 'Project lập trình AI theo nhóm', duration: 'Hạn: 30/11', color: '#10b981', note: 'Cài đặt thuật toán & nộp báo cáo' }
    ],
    notes: 'Deadline nộp Bài tập lớn vào Thứ 2 (30/11/2026).'
  },
  {
    code: 'SP1035',
    name: 'Tư tưởng Hồ Chí Minh',
    englishName: 'Ho Chi Minh Ideology',
    credits: 2,
    lecturers: 'Bộ môn Lý luận Chính trị',
    department: 'Khoa Khoa học Ứng dụng',
    icon: 'fa-solid fa-landmark',
    color: '#10b981',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Trắc nghiệm / Tự luận', duration: '60 phút', color: '#6366f1', note: 'Thi tập trung cuối kỳ' },
      { id: 'item-qt', name: 'Đánh giá quá trình (Quá trình & GK)', weight: 50, type: 'Chuyên cần & Trắc nghiệm online', duration: '--', color: '#ec4899', note: 'Bài tập trên hệ thống BKEL' }
    ],
    notes: 'Tuần 47 là tuần học cuối môn.'
  },
  {
    code: 'SP1039',
    name: 'Pháp luật Việt Nam Đại cương',
    englishName: 'General Vietnamese Law',
    credits: 2,
    lecturers: 'Bộ môn Khoa học Xã hội',
    department: 'Khoa Khoa học Ứng dụng',
    icon: 'fa-solid fa-scale-balanced',
    color: '#8b5cf6',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 70, type: 'Trắc nghiệm', duration: '60 phút', color: '#6366f1', note: 'Thi tập trung cuối kỳ' },
      { id: 'item-qt', name: 'Đánh giá quá trình (Giữa kỳ & Thảo luận)', weight: 30, type: 'Trắc nghiệm online / Bài tập lớp', duration: '--', color: '#f59e0b', note: 'Kiểm tra trên hệ thống BKEL' }
    ],
    notes: 'Tuần 47 là tuần học cuối môn.'
  },
  {
    code: 'JP1007',
    name: 'Tiếng Nhật 7',
    englishName: 'Japanese 7',
    credits: 4,
    lecturers: 'Giảng viên Bộ môn Ngoại ngữ',
    department: 'Văn phòng Đào tạo Quốc tế (OISP)',
    icon: 'fa-solid fa-torii-gate',
    color: '#14b8a6',
    driveUrl: '',
    gradeItems: [
      { id: 'item-ck', name: 'Thi cuối kỳ (Final Exam)', weight: 50, type: 'Nghe, Đọc, Viết & Kaiwa', duration: '90 phút', color: '#6366f1', note: 'Đánh giá toàn diện 4 kỹ năng' },
      { id: 'item-qt', name: 'Đánh giá quá trình (Quá trình & GK)', weight: 50, type: 'Kiểm tra từ vựng, Kaiwa, Chuyên cần', duration: '--', color: '#10b981', note: 'Kiểm tra định kỳ theo từng tuần học' }
    ],
    notes: 'Lịch học 4 buổi sáng liên tục mỗi tuần (Thứ 3 đến Thứ 6).'
  }
];
