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
 * Thay thế các lệnh LaTeX cơ bản thành Unicode toán học trang nhã, sắc nét
 * @param {string} str - Chuỗi LaTeX thô
 * @returns {string} Chuỗi Unicode toán học
 */
function prettifyLatexString(str) {
  if (!str) return '';
  return str
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\s+([a-zA-Z0-9])/g, '$1')
    .replace(/\\boldsymbol\{([^}]+)\}/g, '$1')
    .replace(/\\boldsymbol\s+([a-zA-Z0-9])/g, '$1')
    .replace(/\\bm\{([^}]+)\}/g, '$1')
    .replace(/\\bm\s+([a-zA-Z0-9])/g, '$1')
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    .replace(/\\bold\{([^}]+)\}/g, '$1')
    .replace(/\\bold\s+([a-zA-Z0-9])/g, '$1')
    .replace(/\\rm\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\mathit\{([^}]+)\}/g, '$1')
    .replace(/\\mathsf\{([^}]+)\}/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\vec\{([^}]+)\}/g, '$1⃗')
    .replace(/\\vec\s+([a-zA-Z0-9])/g, '$1⃗')
    .replace(/\\hat\{([a-zA-Z\\]+)\}/g, '$1̂')
    .replace(/\\hat\s+([a-zA-Z\\])/g, '$1̂')
    .replace(/\\bar\{([^}]+)\}/g, '$1̄')
    .replace(/\\tilde\{([^}]+)\}/g, '$1̃')
    .replace(/\\dot\{([^}]+)\}/g, '$1̇')
    .replace(/\\ddot\{([^}]+)\}/g, '$1̈')
    .replace(/\\overline\{([^}]+)\}/g, '$1̄')
    .replace(/\\(c|l|d)?dots/g, '…')
    .replace(/\\beta/g, 'β')
    .replace(/\\alpha/g, 'α')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\epsilon/g, 'ε')
    .replace(/\\varepsilon/g, 'ε')
    .replace(/\\zeta/g, 'ζ')
    .replace(/\\eta/g, 'η')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\sum/g, '∑')
    .replace(/\\prod/g, '∏')
    .replace(/\\int/g, '∫')
    .replace(/\\approx/g, '≈')
    .replace(/\\equiv/g, '≡')
    .replace(/\\le(q)?/g, '≤')
    .replace(/\\ge(q)?/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\infty/g, '∞')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\to/g, '→')
    .replace(/\\in/g, '∈')
    .replace(/\\notin/g, '∉')
    .replace(/\\subset/g, '⊂')
    .replace(/\\subseteq/g, '⊆')
    .replace(/\\cap/g, '∩')
    .replace(/\\cup/g, '∪')
    .replace(/\\forall/g, '∀')
    .replace(/\\exists/g, '∃')
    .replace(/\\partial/g, '∂')
    .replace(/\\nabla/g, '∇')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\^T\b/g, 'ᵀ')
    .replace(/\^T(?=[^a-zA-Z0-9])/g, 'ᵀ')
    .replace(/\^\{T\}/g, 'ᵀ')
    .replace(/\^\{-1\}/g, '⁻¹')
    .replace(/\^2\b/g, '²')
    .replace(/\^3\b/g, '³')
    .replace(/_\{?([0-9])\}?/g, (m, d) => '₀₁₂₃₄₅₆₇₈₉'[d] || m)
    .replace(/_\{?([nmijk])\}?/g, (m, c) => ({ n: 'ₙ', m: 'ₘ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ' }[c] || c))
    .replace(/_\{ij\}/g, 'ᵢⱼ')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/\\(?![a-zA-Z0-9])/g, '')
    .trim();
}

/**
 * Chuyển đổi mã ma trận LaTeX (\begin{bmatrix} ... \end{bmatrix}) thành bảng ma trận ngoặc vuông HTML/CSS tuyệt đẹp
 * @param {string} matrixInner - Nội dung giữa \begin{...matrix} và \end{...matrix}
 * @returns {string} HTML bảng ma trận ngoặc vuông
 */
function renderLatexMatrix(matrixInner) {
  if (!matrixInner || typeof matrixInner !== 'string') return '';

  // Tách các hàng theo dấu xuống dòng \\ hoặc \cr hoặc \newline hoặc xuống dòng vật lý
  const rawRows = matrixInner
    .trim()
    .split(/\\\\|\\cr|\\newline|\r?\n/)
    .map(r => r.trim())
    .filter(r => r.length > 0);

  if (rawRows.length === 0) return '';

  const tableRows = rawRows.map(row => {
    // Tách các cột theo dấu &
    const cells = row.split('&').map(c => c.trim()).filter(c => c.length > 0);
    const tds = cells.map(val => `<td class="neural-matrix-cell">${prettifyLatexString(val)}</td>`).join('');
    return `<tr>${tds}</tr>`;
  }).join('');

  return `<div class="neural-matrix-bracket"><table class="neural-matrix-table"><tbody>${tableRows}</tbody></table></div>`;
}

/**
 * Phân tích và kết hợp vế tiền tố (x =, \mathbf{x} =), ma trận và hậu tố trên cùng một hàng ngang cân đối
 * @param {string} formulaStr - Biểu thức toán học
 * @param {boolean} isBlock - true nếu là toán khối ($$), false nếu là nội dòng ($)
 * @returns {string} HTML hoàn chỉnh
 */
function renderMathExpression(formulaStr, isBlock = true) {
  const matrixRegex = /\\?begin\{(?:b|p|v|V)?matrix\}([\s\S]*?)\\?end\{(?:b|p|v|V)?matrix\}/gi;
  const trimmed = (formulaStr || '').trim();

  if (matrixRegex.test(trimmed)) {
    matrixRegex.lastIndex = 0;
    const parts = [];
    let lastIdx = 0;
    let match;

    while ((match = matrixRegex.exec(trimmed)) !== null) {
      const before = trimmed.slice(lastIdx, match.index).trim();
      if (before) {
        const prettyBefore = prettifyLatexString(before);
        if (prettyBefore) {
          parts.push(`<span class="neural-math-prefix">${prettyBefore}</span>`);
        }
      }
      parts.push(renderLatexMatrix(match[1]));
      lastIdx = matrixRegex.lastIndex;
    }
    const after = trimmed.slice(lastIdx).trim();
    if (after) {
      const prettyAfter = prettifyLatexString(after);
      if (prettyAfter) {
        parts.push(`<span class="neural-math-prefix">${prettyAfter}</span>`);
      }
    }

    const innerContent = parts.join(' ');
    if (isBlock) {
      return `<div class="neural-math-block" tabindex="0" title="Lăn chuột hoặc kéo thanh trượt ngang để xem toàn bộ công thức"><div class="neural-math-expression">${innerContent}</div></div>`;
    } else {
      return `<span class="neural-math-inline-matrix">${innerContent}</span>`;
    }
  } else {
    const cleaned = prettifyLatexString(trimmed);
    if (isBlock) {
      return `<div class="neural-math-block" tabindex="0" title="Lăn chuột hoặc kéo thanh trượt ngang để xem toàn bộ công thức"><code>${cleaned}</code></div>`;
    } else {
      return `<span class="neural-math-inline">${cleaned}</span>`;
    }
  }
}

/**
 * Tự động làm sạch các thẻ HTML hoặc ký tự rác vô tình lọt vào dòng phân cách cột bảng (delimiter).
 * @param {string} text - Nội dung Markdown thô
 * @returns {string} Markdown đã chuẩn hóa dòng bảng
 */
function normalizeTableDelimiters(text) {
  if (!text || typeof text !== 'string') return '';
  return text.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const stripped = trimmed.replace(/<[^>]+>/g, '').trim();
      if (/^\|[\s\-:]+(\|[\s\-:]+)+\|$/.test(stripped)) {
        return stripped;
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
 * Tích hợp Placeholder Engine để bảo vệ công thức toán LaTeX & ma trận không bị biến dạng.
 * 
 * @param {string} rawMarkdown - Nội dung Markdown thô
 * @returns {string} HTML string đã render chuẩn hóa
 */
export function renderMarkdownToHtml(rawMarkdown) {
  if (!rawMarkdown || typeof rawMarkdown !== 'string' || !rawMarkdown.trim()) {
    return '<p class="neural-notepad-empty-text">Chưa có nội dung ghi chú nào...</p>';
  }

  // 1. Dọn dẹp ký tự $ đơn lẻ gãy dở dang ở cuối (chỉ xóa nếu tổng số dấu $ đơn lẻ là số lẻ)
  let cleanInput = rawMarkdown;
  const nonBlockDollars = cleanInput.replace(/\$\$[\s\S]*?\$\$/g, '');
  const singleDollarMatches = nonBlockDollars.match(/(?<!\\)\$/g);
  if (singleDollarMatches && singleDollarMatches.length % 2 !== 0) {
    cleanInput = cleanInput.replace(/(?<!\$)\$\s*\\?\s*$/g, '');
  }
  cleanInput = normalizeTableDelimiters(cleanInput);

  // 2. Trích xuất và bảo vệ công thức Toán & Ma trận bằng Token Placeholder
  const mathPlaceholders = [];
  const matrixRegex = /\\?begin\{(?:b|p|v|V)?matrix\}([\s\S]*?)\\?end\{(?:b|p|v|V)?matrix\}/gi;

  // A. Gom công thức toán khối ($$ ... $$)
  cleanInput = cleanInput.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    const idx = mathPlaceholders.length;
    mathPlaceholders.push({ type: 'block', html: renderMathExpression(formula, true) });
    return `\n\n<div data-math-block="${idx}"></div>\n\n`;
  });

  // B. Gom công thức toán nội dòng ($ ... $) kể cả khi có ma trận lồng bên trong
  const inlineMathRegex = /\$((?:\\begin\{(?:b|p|v|V)?matrix\}[\s\S]*?\\end\{(?:b|p|v|V)?matrix\}|[^\$\n])+?)\$/g;
  cleanInput = cleanInput.replace(inlineMathRegex, (match, formula) => {
    const idx = mathPlaceholders.length;
    mathPlaceholders.push({ type: 'inline', html: renderMathExpression(formula, false) });
    return `<span data-math-inline="${idx}"></span>`;
  });

  // C. Gom ma trận độc lập (nếu không có $ hay $$ bọc ngoài)
  // Bắt cả tiền tố (ví dụ: x =, \mathbf{x} =, $x$ =, =) đi liền trước ma trận trên cùng dòng
  const standaloneMatrixRegex = /(\$?([a-zA-Z0-9_\^\\{}]+|\$[^\$\n]+\$)?\s*(?:=|\\approx|\\equiv|:|->|→)\s*)?\\?begin\{(?:b|p|v|V)?matrix\}([\s\S]*?)\\?end\{(?:b|p|v|V)?matrix\}\$?/gi;
  cleanInput = cleanInput.replace(standaloneMatrixRegex, (match, prefix, varName, inner) => {
    const idx = mathPlaceholders.length;
    const cleanPrefix = prefix ? prefix.replace(/\$/g, '').trim() : '';
    const formula = (cleanPrefix ? cleanPrefix + ' ' : '') + `\\begin{bmatrix}${inner}\\end{bmatrix}`;
    mathPlaceholders.push({ type: 'block', html: renderMathExpression(formula, true) });
    return `\n\n<div data-math-block="${idx}"></div>\n\n`;
  });

  // 3. Kiểm tra bộ máy Marked.js tiêu chuẩn
  const markedEngine = (typeof window !== 'undefined' && window.marked) ? window.marked : null;

  if (markedEngine && typeof markedEngine.parse === 'function') {
    try {
      const options = {
        gfm: true,
        breaks: true,
        pedantic: false
      };

      // Marked.js parse cấu trúc Markdown nguyên bản (Bảng GFM, List, Blockquote, Link, Code)
      let html = markedEngine.parse(cleanInput, options);

      // 4. Post-processing cho Highlight: ==nội dung== hoặc <mark>nội dung</mark>
      html = html.replace(/==([^=\n<]+)==/g, '<mark class="neural-highlight">$1</mark>');
      html = html.replace(/<mark(?:\s+class="[^"]*")?>([\s\S]*?)<\/mark>/gi, '<mark class="neural-highlight">$1</mark>');

      // 5. Post-processing cho Gạch chân: <u>nội dung</u>
      html = html.replace(/<u>([\s\S]*?)<\/u>/gi, '<span class="neural-underline">$1</span>');

      // 6. Bọc Bảng dữ liệu GFM (chỉ bọc các bảng thông thường, KHÔNG bọc ma trận)
      html = html.replace(/<table(?!\s+class="neural-matrix-table")(?:\s+[^>]*)?>/gi, '<div class="neural-table-wrapper"><table>');
      html = html.replace(/<\/table>(?!<\/div>)/gi, '</table></div>');

      // 7. Tự động thêm target="_blank" cho liên kết
      html = html.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi, '<a href="$1" target="_blank" rel="noopener noreferrer"$2>');

      // 8. Khôi phục lại toàn bộ công thức Toán và Ma trận từ Token Placeholder
      mathPlaceholders.forEach((p, idx) => {
        if (p.type === 'block') {
          html = html.replace(new RegExp(`<p>\\s*<div data-math-block="${idx}"><\\/div>\\s*<\\/p>`, 'g'), p.html);
          html = html.replace(new RegExp(`<div data-math-block="${idx}"><\\/div>`, 'g'), p.html);
        } else {
          html = html.replace(new RegExp(`<span data-math-inline="${idx}"><\\/span>`, 'g'), p.html);
        }
      });

      return html;
    } catch (err) {
      console.warn('[MarkdownRenderer] Lỗi khi parse với Marked.js, kích hoạt fallback:', err);
    }
  }

  // 9. Fallback Engine: Xử lý an toàn nếu Marked.js chưa tải kịp
  return fallbackRender(cleanInput, mathPlaceholders);
}

/**
 * Thuật toán Fallback dự phòng khi Marked.js chưa sẵn sàng
 * @param {string} text - Chuỗi markdown
 * @param {Array} mathPlaceholders - Danh sách placeholders toán học
 * @returns {string} HTML an toàn
 */
function fallbackRender(text, mathPlaceholders = []) {
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
  let resultHtml = formatted.join('');

  // Khôi phục mathPlaceholders trong fallback
  if (Array.isArray(mathPlaceholders) && mathPlaceholders.length > 0) {
    mathPlaceholders.forEach((p, idx) => {
      if (p.type === 'block') {
        resultHtml = resultHtml.replace(new RegExp(`<p>\\s*&lt;div data-math-block=&quot;${idx}&quot;&gt;&lt;\\/div&gt;\\s*<\\/p>`, 'g'), p.html);
        resultHtml = resultHtml.replace(new RegExp(`&lt;div data-math-block=&quot;${idx}&quot;&gt;&lt;\\/div&gt;`, 'g'), p.html);
        resultHtml = resultHtml.replace(new RegExp(`<div data-math-block="${idx}"><\\/div>`, 'g'), p.html);
      } else {
        resultHtml = resultHtml.replace(new RegExp(`&lt;span data-math-inline=&quot;${idx}&quot;&gt;&lt;\\/span&gt;`, 'g'), p.html);
        resultHtml = resultHtml.replace(new RegExp(`<span data-math-inline="${idx}"><\\/span>`, 'g'), p.html);
      }
    });
  }

  return resultHtml;
}
