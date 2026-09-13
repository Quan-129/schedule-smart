// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { escapeHtml } from '../../4.Security/sanitizer.js';

// ==========================================================================
// 2. MARKDOWN RENDERER ENGINE (POWERED BY MARKED.JS & NATIVE EXTENSIONS)
// ==========================================================================

/**
 * Bộ chuyển đổi Markdown công nghiệp mạnh mẽ sang HTML hiển thị an toàn.
 * Tích hợp thư viện Marked.js (GFM: Tables, Code Blocks, Blockquotes, Task Lists, Links)
 * Kết hợp 4 định dạng cốt lõi: In đậm, In nghiêng, Gạch chân, Tô sáng (Highlight)
 * 
 * @param {string} rawMarkdown - Nội dung Markdown thô
 * @returns {string} HTML string đã render chuẩn hóa
 */
export function renderMarkdownToHtml(rawMarkdown) {
  if (!rawMarkdown || typeof rawMarkdown !== 'string' || !rawMarkdown.trim()) {
    return '<p class="neural-notepad-empty-text">Chưa có nội dung ghi chú nào...</p>';
  }

  // 1. Tiền xử lý cho cú pháp độc quyền: Highlight và Underline
  let processed = rawMarkdown;

  // Highlight: ==nội dung== hoặc <mark>nội dung</mark>
  processed = processed.replace(/==([^=\n]+)==/g, '<mark class="neural-highlight">$1</mark>');
  processed = processed.replace(/<mark>([\s\S]*?)<\/mark>/gi, '<mark class="neural-highlight">$1</mark>');

  // Underline: <u>nội dung</u> hoặc --nội dung--
  processed = processed.replace(/<u>([\s\S]*?)<\/u>/gi, '<span class="neural-underline">$1</span>');
  processed = processed.replace(/--([^-\n]+)--/g, '<span class="neural-underline">$1</span>');

  // 2. Kiểm tra bộ máy Marked.js tiêu chuẩn
  const markedEngine = (typeof window !== 'undefined' && window.marked) ? window.marked : null;

  if (markedEngine && typeof markedEngine.parse === 'function') {
    try {
      // Cấu hình GFM (GitHub Flavored Markdown)
      const options = {
        gfm: true,
        breaks: true,
        pedantic: false
      };

      let html = markedEngine.parse(processed, options);

      // Bọc Table trong wrapper để hỗ trợ cuộn ngang mượt mà trên panel 50%
      html = html.replace(/<table(?:\s+[^>]*)?>/gi, '<div class="neural-table-wrapper"><table>');
      html = html.replace(/<\/table>/gi, '</table></div>');

      // Tự động thêm target="_blank" và rel="noopener noreferrer" cho mọi thẻ <a>
      html = html.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi, '<a href="$1" target="_blank" rel="noopener noreferrer"$2>');

      return html;
    } catch (err) {
      console.warn('[MarkdownRenderer] Lỗi khi parse với Marked.js, kích hoạt fallback:', err);
    }
  }

  // 3. Fallback Engine: Xử lý an toàn nếu Marked.js chưa tải kịp
  return fallbackRender(processed);
}

/**
 * Thuật toán Fallback dự phòng khi Marked.js chưa sẵn sàng
 * @param {string} text - Chuỗi markdown
 * @returns {string} HTML an toàn
 */
function fallbackRender(text) {
  let safeText = escapeHtml(text);

  // Khôi phục thẻ an toàn đã tiền xử lý
  safeText = safeText.replace(/&lt;mark class="neural-highlight"&gt;([\s\S]*?)&lt;\/mark&gt;/g, '<mark class="neural-highlight">$1</mark>');
  safeText = safeText.replace(/&lt;span class="neural-underline"&gt;([\s\S]*?)&lt;\/span&gt;/g, '<span class="neural-underline">$1</span>');

  // In đậm & In nghiêng
  safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  safeText = safeText.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  safeText = safeText.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');

  // Code inline
  safeText = safeText.replace(/`([^`\n]+)`/g, '<code class="neural-inline-code">$1</code>');

  // Lines
  const lines = safeText.split(/\r?\n/);
  const formatted = [];
  let inList = false;

  for (let line of lines) {
    let trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      if (inList) { formatted.push('</ul>'); inList = false; }
      formatted.push(`<h2>${trimmed.slice(2)}</h2>`);
    } else if (trimmed.startsWith('## ')) {
      if (inList) { formatted.push('</ul>'); inList = false; }
      formatted.push(`<h3>${trimmed.slice(3)}</h3>`);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) { formatted.push('<ul class="neural-notepad-list">'); inList = true; }
      formatted.push(`<li>${trimmed.slice(2)}</li>`);
    } else if (!trimmed) {
      if (inList) { formatted.push('</ul>'); inList = false; }
      formatted.push('<div class="neural-line-spacer"></div>');
    } else {
      if (inList) { formatted.push('</ul>'); inList = false; }
      formatted.push(`<p>${line}</p>`);
    }
  }

  if (inList) formatted.push('</ul>');
  return formatted.join('');
}
