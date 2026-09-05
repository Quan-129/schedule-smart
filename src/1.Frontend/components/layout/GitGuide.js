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
    <!-- Lưu Ý & Nhắc Nhở Tuần Này -->
    <section class="notes-section">
      <div class="notes-card">
        <div class="notes-header">
          <div class="notes-icon"><i class="fa-solid fa-bell"></i></div>
          <div>
            <h3>Lưu Ý & Nhắc Nhở Tuần Này</h3>
            <span class="notes-sub">Nội dung trích xuất tự động từ file Markdown</span>
          </div>
        </div>
        <div class="notes-body" id="notes-body">
          <p style="color: var(--text-muted); font-size: 0.9rem;">Đang tải ghi chú...</p>
        </div>
      </div>
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
