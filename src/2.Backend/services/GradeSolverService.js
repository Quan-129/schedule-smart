/**
 * ==========================================================================
 * BACKEND SERVICE - GRADE SOLVER SERVICE
 * Thuật toán tính toán tỉ lệ điểm & giải phương trình điểm thi cuối kỳ cần đạt
 * ==========================================================================
 */

/**
 * Thang điểm chữ quy đổi chuẩn tín chỉ
 */
export const GRADE_TARGET_THRESHOLDS = {
  'A': 8.5,
  'B+': 8.0,
  'B': 7.0,
  'C+': 6.5,
  'C': 5.5,
  'D+': 5.0,
  'D': 4.0
};

/**
 * Tính tổng phần trăm trọng số của danh sách cột điểm
 * @param {Array<{weight: number}>} gradeItems 
 * @returns {number}
 */
export function calculateGradeTotalWeight(gradeItems) {
  if (!Array.isArray(gradeItems)) return 0;
  return gradeItems.reduce((acc, item) => acc + (parseFloat(item.weight) || 0), 0);
}

/**
 * Tính điểm tổng kết dựa trên điểm các cột đã có
 * @param {Array<{id: string, weight: number}>} gradeItems - Cấu trúc điểm môn học
 * @param {Object} studentScores - Điểm sinh viên đã nhập { [itemId]: score }
 * @returns {{ currentScore: number, totalEnteredWeight: number, isComplete: boolean }}
 */
export function calculateCurrentGradeSummary(gradeItems, studentScores = {}) {
  if (!Array.isArray(gradeItems) || gradeItems.length === 0) {
    return { currentScore: 0, totalEnteredWeight: 0, isComplete: false };
  }

  let totalWeightedScore = 0;
  let totalEnteredWeight = 0;
  let allEntered = true;

  gradeItems.forEach(item => {
    const rawVal = studentScores[item.id];
    if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
      const score = parseFloat(rawVal);
      if (!isNaN(score)) {
        totalWeightedScore += score * (item.weight / 100);
        totalEnteredWeight += item.weight;
      }
    } else {
      allEntered = false;
    }
  });

  return {
    currentScore: parseFloat(totalWeightedScore.toFixed(2)),
    totalEnteredWeight,
    isComplete: allEntered && totalEnteredWeight >= 99.9
  };
}

/**
 * Giải phương trình tìm điểm thi Cuối kỳ cần đạt để đạt mục tiêu điểm chữ
 * @param {Array<{id: string, weight: number}>} gradeItems 
 * @param {Object} studentScores 
 * @param {string} targetLetter - Điểm chữ mong muốn ('A', 'B+'...)
 * @param {string} finalExamItemId - ID của cột thi cuối kỳ (mặc định tìm item có tên 'cuối kỳ' hoặc 'item-ck')
 * @returns {{ targetScore: number, requiredScore: number, status: 'achieved'|'feasible'|'impossible', message: string }}
 */
export function solveRequiredFinalExamScore(gradeItems, studentScores = {}, targetLetter = 'A', finalExamItemId = null) {
  const targetThreshold = GRADE_TARGET_THRESHOLDS[targetLetter] || 8.5;

  // Tìm cột điểm cuối kỳ
  let finalItem = null;
  if (finalExamItemId) {
    finalItem = gradeItems.find(i => i.id === finalExamItemId);
  }
  if (!finalItem) {
    finalItem = gradeItems.find(i => i.name.toLowerCase().includes('cuối kỳ') || i.id === 'item-ck') || gradeItems[0];
  }

  if (!finalItem) {
    return {
      targetScore: targetThreshold,
      requiredScore: 0,
      status: 'impossible',
      message: 'Chưa có cột điểm thi cuối kỳ trong cấu trúc môn học.'
    };
  }

  // Tính tổng điểm của các cột quá trình đã có
  let otherWeightedScore = 0;
  gradeItems.forEach(item => {
    if (item.id !== finalItem.id) {
      const val = parseFloat(studentScores[item.id] || 0);
      otherWeightedScore += val * (item.weight / 100);
    }
  });

  const finalWeightRatio = finalItem.weight / 100;
  if (finalWeightRatio <= 0) {
    return {
      targetScore: targetThreshold,
      requiredScore: 0,
      status: 'impossible',
      message: 'Trọng số bài thi cuối kỳ bằng 0%.'
    };
  }

  // Điểm cần đạt = (Mục tiêu - Điểm quá trình) / Trọng số cuối kỳ
  const rawRequired = (targetThreshold - otherWeightedScore) / finalWeightRatio;
  const requiredScore = parseFloat(rawRequired.toFixed(2));

  if (requiredScore <= 0) {
    return {
      targetScore: targetThreshold,
      requiredScore: 0,
      status: 'achieved',
      message: `🎉 Đã đủ điều kiện đạt điểm ${targetLetter}! Đi thi chỉ cần tránh điểm liệt.`
    };
  } else if (requiredScore > 10) {
    return {
      targetScore: targetThreshold,
      requiredScore,
      status: 'impossible',
      message: `⚠️ Không khả thi (Cần ${requiredScore} điểm, vượt quá 10 điểm tối đa). Hãy cân nhắc hạ mục tiêu.`
    };
  } else {
    return {
      targetScore: targetThreshold,
      requiredScore,
      status: 'feasible',
      message: `🎯 Cần đạt tối thiểu ${requiredScore} điểm thi ${finalItem.name} để đạt điểm ${targetLetter}.`
    };
  }
}
