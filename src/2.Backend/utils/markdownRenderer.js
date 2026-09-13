// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { escapeHtml } from '../../4.Security/sanitizer.js';

// ==========================================================================
// 2. HELPER FUNCTIONS: TABLE DELIMITER NORMALIZER
// ==========================================================================

/**
 * Tự động làm sạch các thẻ HTML hoặc ký tự rác vô tình lọt vào dòng phân cách cột bảng (delimiter).
 * Ví dụ: | :<u>-</u> | :-: | hoặc | :-- | sẽ được làm sạch thành | :- | :-: | để Marked.js luôn nhận diện được Table.
 * 
 * @param {string} text - Nội dung Markdown thô
 * @returns {string} Markdown đã chuẩn hóa dòng bảng
 */
function normalizeTableDelimiters(text) {
  if (!text || typeof text !== 'string') return '';
  return text.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Loại bỏ toàn bộ thẻ HTML trong dòng này để kiểm tra xem có phải dòng delimiter không
      const stripped = trimmed.replace(/<[^>]+>/g, '').trim();
      // Dòng delimiter hợp lệ chỉ gồm: |, -, :, khoảng trắng
      if (/^\|[\s\-:]+(\|[\s\-:]+)+\|$/.test(stripped)) {
        return stripped; // Trả về dòng delimiter chuẩn sạch sẽ
      }
    }
    return line;
  }).join('\n');
}

// ==========================================================================
// 3. MARKDOWN RENDERER ENGINE (POWERED BY MARKED.JS & NATIVE EXTENSIONS)
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

  // 1. Tự động chuẩn hóa và làm sạch dòng phân cách bảng (ngăn ngừa lỗi vỡ Table do thẻ rác)
  const cleanMarkdown = normalizeTableDelimiters(rawMarkdown);

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

      // Để Marked.js parse cấu trúc Markdown nguyên bản trước (Bảng, Codeblock, Blockquote, List)
      let html = markedEngine.parse(cleanMarkdown, options);

      // 3. Post-processing cho Highlight: ==nội dung== hoặc <mark>nội dung</mark>
      html = html.replace(/==([^=\n<]+)==/g, '<mark class="neural-highlight">$1</mark>');
      html = html.replace(/<mark(?:\s+class="[^"]*")?>([\s\S]*?)<\/mark>/gi, '<mark class="neural-highlight">$1</mark>');

      // 4. Post-processing cho Gạch chân: <u>nội dung</u>
      html = html.replace(/<u>([\s\S]*?)<\/u>/gi, '<span class="neural-underline">$1</span>');

      // 5. Bọc Table trong wrapper để hỗ trợ cuộn ngang mượt mà trên panel 50%
      html = html.replace(/<table(?:\s+[^>]*)?>/gi, '<div class="neural-table-wrapper"><table>');
      html = html.replace(/<\/table>/gi, '</table></div>');

      // 6. Tự động thêm target="_blank" và rel="noopener noreferrer" cho mọi thẻ <a>
      html = html.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi, '<a href="$1" target="_blank" rel="noopener noreferrer"$2>');

      return html;
    } catch (err) {
      console.warn('[MarkdownRenderer] Lỗi khi parse với Marked.js, kích hoạt fallback:', err);
    }
  }

  // 7. Fallback Engine: Xử lý an toàn nếu Marked.js chưa tải kịp
  return fallbackRender(cleanMarkdown);
}

/**
 * Thuật toán Fallback dự phòng khi Marked.js chưa sẵn sàng
 * @param {string} text - Chuỗi markdown
 * @returns {string} HTML an toàn
 */
function fallbackRender(text) {
  let safeText = escapeHtml(text);

  // Highlight
  safeText = safeText.replace(/==([^=\n]+)==/g, '<mark class="neural-highlight">$1</mark>');
  // Underline
  safeText = safeText.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<span class="neural-underline">$1</span>');

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
