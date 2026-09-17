// ==========================================================================
// 1. IMPORTS
// ==========================================================================
import { escapeHtml } from '../../4.Security/sanitizer.js';

// ==========================================================================
// 2. HELPER FUNCTIONS: TABLE DELIMITER & MATH FORMULAS NORMALIZER
// ==========================================================================

/**
 * Chuyển đổi các công thức LaTeX ($...$ và $$...$$) sang HTML và Unicode toán học trực quan
 * @param {string} text - Nội dung thô
 * @returns {string} Văn bản đã định dạng công thức toán
 */
/**
 * Chuyển đổi mã ma trận LaTeX (\begin{bmatrix} ... \end{bmatrix}) thành bảng ma trận ngoặc vuông HTML/CSS tuyệt đẹp
 * @param {string} matrixInner - Nội dung giữa \begin{...matrix} và \end{...matrix}
 * @returns {string} HTML bảng ma trận ngoặc vuông
 */
function renderLatexMatrix(matrixInner) {
  if (!matrixInner || typeof matrixInner !== 'string') return '';

  // Tách các hàng theo dấu xuống dòng \\ hoặc \cr hoặc xuống dòng vật lý
  const rawRows = matrixInner
    .trim()
    .split(/\\\\|\\cr|\r?\n/)
    .map(r => r.trim())
    .filter(r => r.length > 0);

  if (rawRows.length === 0) return '';

  const tableRows = rawRows.map(row => {
    // Tách các cột theo dấu &
    const cells = row.split('&').map(c => c.trim()).filter(c => c.length > 0);
    const tds = cells.map(val => `<td class="neural-matrix-cell">${prettifyLatexString(val)}</td>`).join('');
    return `<tr>${tds}</tr>`;
  }).join('');

  return `<div class="neural-matrix-wrapper"><div class="neural-matrix-bracket"><table class="neural-matrix-table"><tbody>${tableRows}</tbody></table></div></div>`;
}

/**
 * Chuyển đổi các công thức LaTeX ($...$ và $$...$$) và Ma trận sang HTML và Unicode toán học trực quan
 * @param {string} text - Nội dung thô
 * @returns {string} Văn bản đã định dạng công thức toán
 */
function formatMathFormulas(text) {
  if (!text || typeof text !== 'string') return '';

  // 1. Dọn dẹp các ký tự LaTeX gãy hoặc chưa đóng ở cuối chuỗi (ví dụ: `$\` hoặc `$` lẻ loi)
  let result = text.replace(/\$\s*\\?\s*$/g, '');

  // 2. Regex nhận diện cấu trúc ma trận LaTeX (bmatrix, pmatrix, matrix, vmatrix)
  const matrixRegex = /\\?begin\{(?:b|p|v|V)?matrix\}([\s\S]*?)\\?end\{(?:b|p|v|V)?matrix\}/gi;

  // 3. Chuyển đổi công thức toán khối ($$ ... $$)
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    const trimmed = formula.trim();
    if (matrixRegex.test(trimmed)) {
      matrixRegex.lastIndex = 0;
      return trimmed.replace(matrixRegex, (m, inner) => renderLatexMatrix(inner));
    }
    const cleaned = prettifyLatexString(trimmed);
    return `<div class="neural-math-block"><code>${cleaned}</code></div>`;
  });

  // 4. Chuyển đổi ma trận LaTeX nếu nằm độc lập bên ngoài $$
  result = result.replace(matrixRegex, (match, inner) => {
    return renderLatexMatrix(inner);
  });

  // 5. Chuyển đổi công thức toán nội dòng ($ ... $)
  result = result.replace(/\$([^\$\n]+)\$/g, (match, formula) => {
    const trimmed = formula.trim();
    if (matrixRegex.test(trimmed)) {
      matrixRegex.lastIndex = 0;
      return trimmed.replace(matrixRegex, (m, inner) => renderLatexMatrix(inner));
    }
    const cleaned = prettifyLatexString(trimmed);
    return `<span class="neural-math-inline">${cleaned}</span>`;
  });

  return result;
}

/**
 * Thay thế các lệnh LaTeX cơ bản thành Unicode toán học trang nhã, sắc nét
 */
function prettifyLatexString(str) {
  if (!str) return '';
  return str
    .replace(/\\hat\{([a-zA-Z\\]+)\}/g, '$1̂')
    .replace(/\\hat\s+([a-zA-Z\\])/g, '$1̂')
    .replace(/\\beta/g, 'β')
    .replace(/\\alpha/g, 'α')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\epsilon/g, 'ε')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\sum/g, '∑')
    .replace(/\\prod/g, '∏')
    .replace(/\\int/g, '∫')
    .replace(/\\approx/g, '≈')
    .replace(/\\le(q)?/g, '≤')
    .replace(/\\ge(q)?/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\infty/g, '∞')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\to/g, '→')
    .replace(/\\in/g, '∈')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\^T\b/g, 'ᵀ')
    .replace(/\^T(?=[^a-zA-Z0-9])/g, 'ᵀ')
    .replace(/\^\{T\}/g, 'ᵀ')
    .replace(/\^\{-1\}/g, '⁻¹')
    .replace(/\^2\b/g, '²')
    .replace(/\^3\b/g, '³')
    .replace(/_1\b/g, '₁')
    .replace(/_2\b/g, '₂')
    .replace(/_3\b/g, '₃')
    .replace(/_0\b/g, '₀')
    .replace(/_i\b/g, 'ᵢ')
    .replace(/_j\b/g, 'ⱼ')
    .replace(/_\{ij\}/g, 'ᵢⱼ')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/\\(?![a-zA-Z0-9])/g, '');
}

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

  // 1. Tự động chuẩn hóa công thức toán LaTeX & dòng phân cách bảng
  const mathCleaned = formatMathFormulas(rawMarkdown);
  const cleanMarkdown = normalizeTableDelimiters(mathCleaned);

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
