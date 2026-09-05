/**
 * ==========================================================================
 * FRONTEND COMPONENT - GIT GUIDE ACCORDION & NOTES SECTION
 * ==========================================================================
 */

/**
 * Render Hướng dẫn Git Accordion & Ghi chú
 * @param {HTMLElement} containerEl 
 */
export function renderGitGuideSection(containerEl) {
  if (!containerEl) return;

  containerEl.innerHTML = `
    <!-- Lưu Ý & Nhắc Nhở Tuần Này (Mặc định Thu Gọn) -->
    <section class="notes-section">
      <details class="notes-accordion">
        <summary class="notes-accordion-summary">
          <div class="notes-summary-left">
            <div class="notes-icon-mini"><i class="fa-solid fa-bell"></i></div>
            <span class="notes-summary-title">Lưu Ý & Nhắc Nhở Tuần Này</span>
            <span class="notes-summary-hint">(Bấm để xem)</span>
          </div>
          <i class="fa-solid fa-chevron-down arrow-icon"></i>
        </summary>
        <div class="notes-accordion-content">
          <div class="notes-body" id="notes-body">
            <p style="color: var(--text-muted); font-size: 0.9rem;">Đang tải ghi chú...</p>
          </div>
        </div>
      </details>
    </section>

    <!-- Hướng Dẫn Git Accordion Cho Sinh Viên -->
    <section class="git-guide-section">
      <details class="guide-accordion">
        <summary>
          <span><i class="fa-brands fa-git-alt"></i> Hướng Dẫn Nhanh: Thêm & Chỉnh Sửa Lịch Bằng Git (3 Bước)</span>
          <i class="fa-solid fa-chevron-down arrow-icon"></i>
        </summary>
        <div class="guide-content">
          <div class="guide-steps">
            <div class="guide-step">
              <div class="step-num">1</div>
              <div class="step-text">
                <h4>Tạo File Markdown Mới</h4>
                <p>Sao chép file tuần trước thành <code>schedules/tuan-XX.md</code> và chỉnh sửa nội dung theo lịch học của bạn.</p>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">2</div>
              <div class="step-text">
                <h4>Khai Báo Vào <code>index.json</code></h4>
                <p>Mở <code>schedules/index.json</code>, thêm dòng khai báo tuần mới vào danh sách <code>"weeks"</code>.</p>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">3</div>
              <div class="step-text">
                <h4>Commit & Push Lên GitHub</h4>
                <p>Chạy lệnh <code>git add .</code>, <code>git commit -m "update"</code> và <code>git push</code>. Web sẽ tự cập nhật ngay!</p>
              </div>
            </div>
          </div>
        </div>
      </details>
    </section>
  `;
}
