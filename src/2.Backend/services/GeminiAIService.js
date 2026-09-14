// ==========================================================================
// 1. IMPORTS & CONFIG
// ==========================================================================
const STORAGE_KEY_GEMINI = 'smart_schedule_gemini_api_key';
const DEFAULT_MODEL = 'gemini-1.5-flash';

// ==========================================================================
// 2. API KEY MANAGEMENT
// ==========================================================================
export function getGeminiApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEY_GEMINI) || '';
  } catch (e) {
    return '';
  }
}

export function setGeminiApiKey(key) {
  try {
    if (!key || !key.trim()) {
      localStorage.removeItem(STORAGE_KEY_GEMINI);
    } else {
      localStorage.setItem(STORAGE_KEY_GEMINI, key.trim());
    }
    return true;
  } catch (e) {
    console.error('Không thể lưu Gemini API Key:', e);
    return false;
  }
}

// ==========================================================================
// 3. AI GENERATION ENGINE
// ==========================================================================

/**
 * Sinh câu hỏi trắc nghiệm Active Recall từ tri thức ghi chú của node
 * @param {string} nodeLabel - Tên chủ đề / khái niệm của node
 * @param {string} notesContent - Toàn bộ nội dung ghi chú (Markdown hoặc text)
 * @returns {Promise<Object>}
 */
export async function generateQuizFromNodeKnowledge(nodeLabel, notesContent) {
  const apiKey = getGeminiApiKey();

  // Nếu chưa có API Key -> Dùng Fallback generator thông minh
  if (!apiKey) {
    return generateFallbackQuiz(nodeLabel, notesContent, 'demo_no_key');
  }

  const prompt = `
Bạn là chuyên gia sư phạm đại học và cố vấn học tập hàng đầu theo phương pháp Active Recall & Phân tích chẩn đoán sai lầm tư duy (Diagnostic Testing).
Dưới đây là tri thức học tập của sinh viên trong chủ đề: "${nodeLabel}"

Nội dung ghi chú của sinh viên:
"""
${(notesContent || '').slice(0, 3500)}
"""

Hãy tạo ĐÚNG 1 câu hỏi trắc nghiệm chất lượng cao bám sát nội dung trên để sinh viên tự kiểm tra kiến thức.
Yêu cầu bắt buộc:
1. Câu hỏi mang tính tình huống thực tế hoặc đào sâu bản chất lý thuyết, KHÔNG hỏi máy móc đơn giản.
2. Có đúng 4 lựa chọn A, B, C, D (trong đó có 1 đáp án đúng và 3 đáp án nhiễu có bẫy tinh vi).
3. Bóc tách sâu sắc: Khái niệm cốt lõi, Lời giải thích, Bẫy/Sai lầm thường gặp mà sinh viên hay mắc phải, và Quy tắc/Bản chất cần nhớ (công thức hoặc chuỗi mũi tên ngắn gọn).
4. Trả về ĐÚNG 1 CHUỖI JSON thuần túy (KHÔNG dùng markdown codeblock \`\`\`json, KHÔNG có bất kỳ lời chào nào ngoài JSON).

Cấu trúc JSON bắt buộc:
{
  "question": "Nội dung câu hỏi tình huống hoặc nhận định trắc nghiệm...",
  "options": [
    "A. Nội dung lựa chọn A",
    "B. Nội dung lựa chọn B",
    "C. Nội dung lựa chọn C",
    "D. Nội dung lựa chọn D"
  ],
  "correctIndex": 0,
  "coreConcept": "Tên khái niệm / lý thuyết / mô hình cốt lõi",
  "explanation": "Giải thích chi tiết tại sao đáp án này đúng theo lập luận logic...",
  "trap": "Bẫy đề thi & Sai lầm tư duy thường gặp (tại sao sinh viên dễ chọn nhầm phương án khác)...",
  "rule": "Quy tắc / Bản chất cốt lõi cần nhớ (dạng chuỗi: Bước 1 ➔ Bước 2 ➔ Bước 3 hoặc công thức)",
  "source": "Trích dẫn ngắn chứng minh từ bài học hoặc tài liệu"
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `HTTP ${response.status}`;
      console.warn('Gemini API Error:', errMsg);
      return generateFallbackQuiz(nodeLabel, notesContent, `error_${errMsg}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON
    let cleaned = candidateText.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    parsed.id = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    parsed.createdAt = new Date().toISOString();
    parsed.isAiGenerated = true;
    return parsed;
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error);
    return generateFallbackQuiz(nodeLabel, notesContent, `catch_${error.message}`);
  }
}

// ==========================================================================
// 4. FALLBACK / MOCK GENERATOR (KHI CHƯA CÓ KEY HOẶC LỖI MẠNG)
// ==========================================================================
export function generateFallbackQuiz(nodeLabel, notesContent, reason = 'demo') {
  const cleanNotes = (notesContent || '').replace(/<[^>]*>/g, '').replace(/[#*_`]/g, '').trim();
  const title = nodeLabel || 'Kiến thức cốt lõi';
  
  // Tách các câu từ ghi chú để làm ngữ liệu mẫu
  const sentences = cleanNotes.split(/[.\n;]+/).map(s => s.trim()).filter(s => s.length > 15);
  const primarySentence = sentences[0] || `Nội dung cốt lõi của chuyên đề ${title}`;
  const secondarySentence = sentences[1] || `Các nguyên lý và ràng buộc cơ bản trong ${title}`;

  return {
    id: `quiz_fallback_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    isFallback: true,
    fallbackReason: reason,
    question: `Trong khuôn khổ nghiên cứu về "${title}", nhận định nào sau đây phản ánh chính xác nhất bản chất và quy luật vận hành?`,
    options: [
      `A. ${primarySentence} đóng vai trò điều kiện tiên quyết, dẫn dắt toàn bộ tiến trình khai thác thực tế.`,
      `B. ${title} chỉ là giai đoạn mang tính thủ tục hình thức, có thể lược bỏ nếu đã có nguồn lực đầy đủ.`,
      `C. ${secondarySentence} hoàn toàn tách rời và không chịu sự chi phối của các quy chuẩn học thuật chung.`,
      `D. Mọi hoạt động triển khai đều phải hoàn tất ngay từ bước đầu tiên mà không cần qua đánh giá khả thi.`
    ],
    correctIndex: 0,
    coreConcept: `${title} (Mô hình bản chất & Tiến trình vận hành)`,
    explanation: `Đáp án A đúng. Dựa trên cơ sở lý luận của chuyên đề, ${primarySentence} giữ vai trò trọng tâm dẫn dắt, tạo nền tảng vững chắc để chuyển từ nhận thức sang hành động thực tiễn.`,
    trap: `Sinh viên thường dễ mắc bẫy khi đồng nhất ${title} với kết quả cuối cùng (như phương án B), bỏ qua chuỗi liên kết logic nội tại được xây dựng trong tiến trình.`,
    rule: `${title} là chuỗi tương tác hữu cơ: Nhận diện ➔ Phân tích & Đánh giá ➔ Khai thác thực thi`,
    source: `Trích xuất từ ghi chú môn học: "${primarySentence.slice(0, 100)}..."`,
    createdAt: new Date().toISOString()
  };
}
