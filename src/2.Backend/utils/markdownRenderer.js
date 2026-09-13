// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { escapeHtml } from '../../4.Security/sanitizer.js';

// ==========================================================================
// 2. MARKDOWN RENDERER ENGINE
// ==========================================================================

/**
 * Chuyển đổi chuỗi Markdown đơn giản sang HTML hiển thị an toàn
 * Hỗ trợ 4 định dạng chính: In đậm, In nghiêng, Gạch chân, Highlight
 * Cùng với Headings, Lists, Code inline và ngắt dòng
 * 
 * @param {string} rawMarkdown - Nội dung Markdown thô
 * @returns {string} HTML string an toàn
 */
export function renderMarkdownToHtml(rawMarkdown) {
  if (!rawMarkdown || typeof rawMarkdown !== 'string') {
    return '<p class="neural-notepad-empty-text">Chưa có nội dung ghi chú nào...</p>';
  }

  // 1. Escape HTML an toàn tuyệt đối
  let text = escapeHtml(rawMarkdown);

  // 2. Chuyển đổi Highlight: ==nội dung== hoặc &lt;mark&gt;nội dung&lt;/mark&gt;
  text = text.replace(/==([^=\n]+)==/g, '<mark class="neural-highlight">$1</mark>');
  text = text.replace(/&lt;mark&gt;([\s\S]*?)&lt;\/mark&gt;/gi, '<mark class="neural-highlight">$1</mark>');

  // 3. Chuyển đổi Gạch chân: &lt;u&gt;nội dung&lt;/u&gt; hoặc --nội dung-- hoặc ~~nội dung~~
  text = text.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<span class="neural-underline">$1</span>');
  text = text.replace(/--([^-\n]+)--/g, '<span class="neural-underline">$1</span>');
  text = text.replace(/~~([^~\n]+)~~/g, '<span class="neural-underline">$1</span>');

  // 4. Chuyển đổi In đậm: **nội dung** hoặc __nội dung__
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // 5. Chuyển đổi In nghiêng: *nội dung* hoặc _nội dung_
  text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  text = text.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>');

  // 6. Chuyển đổi Code Inline: `code`
  text = text.replace(/`([^`\n]+)`/g, '<code class="neural-inline-code">$1</code>');

  // 7. Xử lý theo từng dòng: Headings và Lists
  const lines = text.split(/\r?\n/);
  const formattedLines = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Headers
    if (line.startsWith('### ')) {
      if (inList) { formattedLines.push('</ul>'); inList = false; }
      formattedLines.push(`<h4>${line.slice(4)}</h4>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { formattedLines.push('</ul>'); inList = false; }
      formattedLines.push(`<h3>${line.slice(3)}</h3>`);
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) { formattedLines.push('</ul>'); inList = false; }
      formattedLines.push(`<h2>${line.slice(2)}</h2>`);
      continue;
    }

    // Bullet Lists: - hoặc *
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        formattedLines.push('<ul class="neural-notepad-list">');
        inList = true;
      }
      formattedLines.push(`<li>${line.slice(2)}</li>`);
      continue;
    }

    if (inList) {
      formattedLines.push('</ul>');
      inList = false;
    }

    // Dòng trống
    if (!line) {
      formattedLines.push('<div class="neural-line-spacer"></div>');
      continue;
    }

    formattedLines.push(`<p>${line}</p>`);
  }

  if (inList) {
    formattedLines.push('</ul>');
  }

  return formattedLines.join('');
}
