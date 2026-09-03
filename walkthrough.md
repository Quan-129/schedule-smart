# Đồng Bộ Giao Diện & Tối Ưu Thẩm Mỹ Chiếc Cặp Google Drive

Đã hoàn tất đồng bộ 100% giao diện **Chiếc Cặp Google Drive** với các tab khác (Lưới tuần, Hôm nay, Tỉ lệ điểm):

---

## 🎨 Cải Tiến Thẩm Mỹ & Trải Nghiệm (UI/UX):
1. **Đồng bộ Header & Thanh Tìm Kiếm**:
   - Hero Header Card dạng Glassmorphism cao cấp (`.backpack-header-card`).
   - Ô tìm kiếm bo tròn (`.backpack-filter-box`) tích hợp icon kính lúp và nút xóa nhanh, đồng bộ với tab Tỉ lệ điểm.
   - Nút **`[+ Gắn Link Mới]`** nổi bật dạng gradient Google Drive xanh lá.
2. **Bộ Thẻ Lọc Môn Học (Subject Filter Pills)**:
   - Thanh trượt tag lọc môn học mượt mà, hỗ trợ chạm lướt trên điện thoại (`.backpack-filter-bar`).
3. **Thẻ Môn Học Chuẩn Thiết Kế Cao Cấp**:
   - Viền trái (`border-left: 4px solid ...`) hiển thị dải màu riêng biệt của từng môn, đồng bộ hoàn toàn với các ô tiết học trên Thời Khóa Biểu.
   - Header thẻ chứa icon môn học, mã môn (`CO3117`), và badge trạng thái (`Drive + 2 link`, `1 Folder Drive`, `Chưa gắn Drive`).
   - Nút **Mở Folder Google Drive chính**:
     * Khi đã có link: Nút Gradient xanh lá Drive sang trọng, rõ ràng.
     * Khi chưa có link: Khung viền nét đứt thanh lịch, mời gọi gắn link.
4. **Tối Ưu Responsive 100% Trên Điện Thoại & Tablet**:
   - Hệ thống Grid tự co giãn theo kích thước màn hình (`auto-fill, minmax(360px, 1fr)`).
   - Tối ưu kích thước nút bấm và khoảng cách ngón tay chạm trên màn hình cảm ứng di động.

---

## 🚀 Trạng Thái Triển Khai
- **Repository**: [`Quan-129/schedule-smart`](https://github.com/Quan-129/schedule-smart)
