# Chiếc Cặp Google Drive Tối Giản (Đồng Bộ 100% Đa Thiết Bị)

Đã tối giản toàn bộ hệ thống lưu trữ theo **Cách 1: Đồng bộ thuần qua Google Drive**, loại bỏ hoàn toàn việc lưu tệp nhị phân cục bộ trên máy tính để đảm bảo **máy tính và điện thoại luôn hiển thị giống nhau 100%**.

---

## 🎯 1. Nguyên Tắc Hoạt Động Mới
1. **Lưu trữ trên đám mây Google Drive**: 
   - Mọi tài liệu (slide bài giảng, đề cương, bài tập lớn, đề thi cũ) đều được liên kết trực tiếp tới Google Drive / LMS / Google Forms.
2. **Đồng bộ xuyên suốt qua file cấu hình `schedules/drive-links.json`**:
   - Mọi liên kết môn học được lưu trực tiếp vào file `schedules/drive-links.json` trên Git.
   - Bất cứ khi nào bạn cập nhật link Drive trên máy tính và push Git, **điện thoại của bạn mở lên là có đầy đủ ngay tức khắc**.
3. **Chỉnh sửa nhanh trực tiếp trên giao diện**:
   - Có nút bút chì ✏️ trên từng tài liệu để bạn dán link Drive của bạn.
   - Có nút **"Gắn Link Drive của bạn"** để thêm liên kết mới.

---

## 🎒 2. Giao Diện "Google Drive Hub" Tinh Gọn
- **Thẻ môn học theo màu nhận diện**: Mỗi môn (Học máy, QLDA, Tiếp thị căn bản, AI...) là 1 card sang trọng.
- **Nút `[📁 Folder Môn]`**: Bấm 1 phát là mở thẳng sang Thư mục Google Drive chính của môn học đó.
- **Nút `[👁️ Xem]`**: Mở trình xem trước tài liệu trực tiếp trong trang web.
- **Nút `[↗️ Mở Drive]`**: Mở sang Google Drive hoặc LMS trường học.
- **Nút 🎒 trên Thời Khóa Biểu**: Bấm vào tiết học bất kỳ sẽ tự động nhảy vào đúng thẻ Drive của môn đó.

---

## 🚀 3. Trạng Thái Triển Khai
- **Repository**: [`Quan-129/schedule-smart`](https://github.com/Quan-129/schedule-smart)
- **Commit**: `ce3de6b`
