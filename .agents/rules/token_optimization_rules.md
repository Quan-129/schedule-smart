# QUY TẮC TỐI ƯU HÓA TOKEN & ĐỌC HIỂU NGỮ CẢNH (TOKEN & CONTEXT OPTIMIZATION RULES) 🚀

Mọi AI Agent khi làm việc trên repository này **BẮT BUỘC TỰ ĐỘNG TUÂN THỦ** các nguyên tắc tối ưu token và ngữ cảnh sau mà không cần người dùng phải nhắc nhở:

---

## 🎯 1. NGUYÊN TẮC ĐỌC & ĐỊNH VỊ MỤC TIÊU (TARGETED RETRIEVAL)
1. **Sử dụng `grep_search` trước khi xem file**: Tuyệt đối không gọi `view_file` cả nghìn dòng để tìm kiếm. Luôn dùng `grep_search` để định vị đúng tên hàm/biến/class và số dòng trước.
2. **Cắt lát dòng chính xác (`StartLine` - `EndLine`)**: Khi xem code qua `view_file`, luôn chỉ định khoảng dòng cần quan tâm (tối đa 50–150 dòng) quanh vị trí chỉnh sửa.
3. **Bỏ qua file lớn / thư mục rác**: Không quét qua thư mục `node_modules/`, `dist/`, `.git/`, thư mục build cache.

---

## ✂️ 2. NGUYÊN TẮC CHỈNH SỬA PHẪU THUẬT (SURGICAL EDITS)
1. **Ưu tiên `replace_file_content`**: Chỉ thay thế chính xác khối code cần sửa thay vì dùng `write_to_file` ghi đè toàn bộ file hàng nghìn dòng.
2. **Không lặp lại code không đổi**: Trong phần giải thích trả lời, không paste lại toàn bộ file; chỉ dẫn link file dạng `[TênFile.js](file:///path/to/file#L10-L20)`.

---

## 🧠 3. NGUYÊN TẮC PHỤC HỒI NGỮ CẢNH TỐC ĐỘ CAO (FAST CONTEXT RECOVERY)
1. **Tự động đọc `WORKLOG.md` (Top 25 dòng)**: Khi bắt đầu một phiên làm việc hoặc tiếp tục sau khi bị nén context (compaction), Agent chỉ cần đọc 1–2 entry mới nhất ở đầu [docs/0.Log/WORKLOG.md](file:///c:/Users/Acer/Documents/D%E1%BB%B1%20%C3%A1n%20ma/tools_3/docs/0.Log/WORKLOG.md) để nắm toàn bộ quyết định kỹ thuật và việc cần làm tiếp theo.
2. **Giữ file nhỏ gọn (< 250 dòng)**: Phân tách mô-đun hóa 5 tầng (`src/1.Frontend/`, `src/2.Backend/`, `src/3.Database/`, `src/4.Security/`, `src/5.Performance/`) để mỗi file chỉ đảm nhiệm 1 việc.

---

## 🤖 4. QUY TRÌNH TỰ ĐỘNG KÍCH HOẠT SKILLS (PROACTIVE AUTOMATION)
Agent **TỰ ĐỘNG THỰC THI** các kỹ năng chuyên môn tương ứng khi hoàn thành tác vụ:
1. **Tự động cập nhật nhật ký**: Gọi skill `update-worklog` để lưu lại thay đổi kỹ thuật vào `docs/0.Log/WORKLOG.md`.
2. **Tự động trích xuất ý tưởng Marketing**: Gọi skill `update-new-in4` để ghi lại USP/Hook vào `docs/0.Log/MARKETING_LOG.md` khi phát triển tính năng mới.
3. **Tự động thu gom tài liệu**: Gọi skill `9-more-archiver` để gom các file `.md` phát sinh ở root vào `docs/9.More/`.
4. **Tự động dọn dẹp file tạm**: Xóa ngay các file `temp_*`, scratch scripts sau khi diff/test hoàn tất.
