import type {
  AnalysisStepFeedback,
  GradingResult,
  RubricCriterion,
  RubricEvaluationItem,
} from '../types/assistant';

export const MIN_CONFIDENCE_FOR_AUTO_GRADING = 0.55;

function splitWorkIntoSteps(text: string): string[] {
  const lines = text
    .split(/\r?\n|(?<=;)\s+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return lines.slice(0, 12);
}

function evaluateEquationSyntax(line: string): {
  status: 'correct' | 'warning' | 'uncertain';
  observation: string;
} {
  const openParens = (line.match(/\(/g) || []).length;
  const closeParens = (line.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return {
      status: 'warning',
      observation:
        'Số dấu ngoặc mở và ngoặc đóng chưa khớp nhau; cần kiểm tra lại phép nhóm biểu thức.',
    };
  }

  if (/=\s*$/.test(line) || /^\s*=/.test(line)) {
    return {
      status: 'warning',
      observation:
        'Biểu thức có dấu "=" bị thiếu vế trái hoặc vế phải, cần viết đầy đủ hai vế.',
    };
  }

  if (/\d/.test(line) && /=/.test(line)) {
    // Check simple pure-numeric equality like "2 + 3 = 6"
    const parts = line.split('=');
    if (parts.length === 2) {
      const lhs = parts[0].trim();
      const rhs = parts[1].trim();
      if (/^[\d\s+\-*/().]+$/.test(lhs) && /^[\d.]+$/.test(rhs)) {
        try {
          const val = Function(`"use strict"; return (${lhs})`)();
          const expectedRhs = Number(rhs);
          if (typeof val === 'number' && Number.isFinite(val) && Number.isFinite(expectedRhs)) {
            if (Math.abs(val - expectedRhs) < 1e-4) {
              return {
                status: 'correct',
                observation: 'Phép tính số học giữa hai vế nhất quán.',
              };
            }
            return {
              status: 'warning',
              observation: `Giá trị tính toán của vế trái (${Number(val.toFixed(4))}) chưa khớp với vế phải (${expectedRhs}).`,
            };
          }
        } catch {
          // Non-evaluable expression falls through to neutral step check
        }
      }
    }
    return {
      status: 'correct',
      observation: 'Bước thiết lập phương trình/biểu thức rõ ràng, cân đối hai vế.',
    };
  }

  if (/(nên|suy ra|=>|vậy|kết luận|áp dụng|ta có)/i.test(line)) {
    return {
      status: 'correct',
      observation: 'Có bước lập luận chuyển tiếp và nêu căn cứ suy luận.',
    };
  }

  return {
    status: 'uncertain',
    observation:
      'Dòng trình bày mang tính mô tả ngắn; nên bổ sung rõ công thức, đơn vị đo hoặc căn cứ định lý.',
  };
}

export function analyzeStudentWork(input: {
  text: string;
  ocrConfidence: number;
  fileName?: string;
}): GradingResult {
  const trimmed = input.text.trim();
  const lowConfidence =
    input.ocrConfidence < MIN_CONFIDENCE_FOR_AUTO_GRADING || trimmed.length < 8;

  if (lowConfidence) {
    return {
      id: `grade-${Date.now()}`,
      mode: 'analyze',
      createdAt: Date.now(),
      fileName: input.fileName,
      extractedText: trimmed,
      ocrConfidence: input.ocrConfidence,
      canAutoEvaluate: false,
      limitationNotice:
        trimmed.length < 8
          ? 'Chưa có đủ nội dung bài làm rõ ràng để phân tích từng bước. Vui lòng nhập trực tiếp lời giải hoặc tải tệp rõ nét hơn.'
          : `Độ tin cậy nhận dạng nội dung (${Math.round(input.ocrConfidence * 100)}%) thấp hơn ngưỡng an toàn (${Math.round(MIN_CONFIDENCE_FOR_AUTO_GRADING * 100)}%). Hệ thống không tự động đánh giá sai lệch mà chờ học sinh/giáo viên rà soát lại văn bản.`,
      analysisSteps: [],
      improvementAdvice: [
        'Kiểm tra và chỉnh sửa lại nội dung văn bản đã trích xuất nếu ảnh chụp bị mờ hoặc nghiêng.',
        'Đảm bảo mỗi bước tính toán và đơn vị đo được viết tách dòng rõ ràng.',
      ],
    };
  }

  const lines = splitWorkIntoSteps(trimmed);
  const analysisSteps: AnalysisStepFeedback[] = lines.map((line, index) => {
    const check = evaluateEquationSyntax(line);
    return {
      stepNumber: index + 1,
      excerpt: line,
      observation: check.observation,
      status: check.status,
    };
  });

  const warningCount = analysisSteps.filter((s) => s.status === 'warning').length;
  const uncertainCount = analysisSteps.filter((s) => s.status === 'uncertain').length;

  const improvementAdvice: string[] = [];
  if (warningCount > 0) {
    improvementAdvice.push(
      `Có ${warningCount} bước phát hiện sai lệch cú pháp hoặc phép tính số học — hãy rà soát lại dấu ngoặc và kết quả vế phải.`,
    );
  }
  if (uncertainCount > 0) {
    improvementAdvice.push(
      'Một số dòng còn thiếu căn cứ công thức hoặc đơn vị kèm theo; nên ghi rõ tên định luật trước khi thay số.',
    );
  }
  if (!/(đáp số|kết luận|vậy)/i.test(trimmed)) {
    improvementAdvice.push(
      'Nên bổ sung dòng kết luận cuối bài kèm đơn vị đo chuẩn (m, s, kg, mol, N...) để hoàn chỉnh bài làm.',
    );
  }
  if (improvementAdvice.length === 0) {
    improvementAdvice.push(
      'Bố cục các bước trình bày mạch lạc và hợp lý. Bạn có thể tự kiểm tra lại chiều biến thiên của kết quả trong Phòng thí nghiệm.',
    );
  }

  return {
    id: `grade-${Date.now()}`,
    mode: 'analyze',
    createdAt: Date.now(),
    fileName: input.fileName,
    extractedText: trimmed,
    ocrConfidence: input.ocrConfidence,
    canAutoEvaluate: true,
    analysisSteps,
    improvementAdvice,
  };
}

export function parseRubricText(rawRubric: string): RubricCriterion[] {
  const lines = rawRubric
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const criteria: RubricCriterion[] = [];
  lines.forEach((line, idx) => {
    const scoreMatch = line.match(/(\d+(?:[.,]\d+)?)\s*(?:điểm|đ|pt|pts)/i);
    const maxScore = scoreMatch ? Number(scoreMatch[1].replace(',', '.')) : 1;
    const desc = line
      .replace(/^\d+[.)]\s*/, '')
      .replace(/\s*[-–:]?\s*\d+(?:[.,]\d+)?\s*(?:điểm|đ|pt|pts)\.?/i, '')
      .trim();

    const keywords = desc
      .toLowerCase()
      .split(/[^a-zA-Z0-9À-ỹ₀-₉]+/)
      .filter((w) => w.length >= 3);

    if (desc) {
      criteria.push({
        id: `crit-${idx + 1}`,
        description: desc,
        maxScore: Number.isFinite(maxScore) && maxScore > 0 ? maxScore : 1,
        requiredKeywords: [...new Set(keywords)].slice(0, 8),
      });
    }
  });

  return criteria;
}

export function gradeAgainstRubric(input: {
  studentText: string;
  rubricText: string;
  ocrConfidence: number;
  fileName?: string;
}): GradingResult {
  const criteria = parseRubricText(input.rubricText);
  const trimmed = input.studentText.trim();
  const lowConfidence =
    input.ocrConfidence < MIN_CONFIDENCE_FOR_AUTO_GRADING || trimmed.length < 8;

  if (lowConfidence || criteria.length === 0) {
    return {
      id: `grade-${Date.now()}`,
      mode: 'rubric',
      createdAt: Date.now(),
      fileName: input.fileName,
      extractedText: trimmed,
      ocrConfidence: input.ocrConfidence,
      canAutoEvaluate: false,
      limitationNotice:
        criteria.length === 0
          ? 'Chưa có tiêu chí biểu điểm hợp lệ (ví dụ: "1. Viết đúng công thức vận tốc - 1.0 điểm").'
          : `Không tự động gán điểm số giả tạo do độ tin cậy trích xuất (${Math.round(input.ocrConfidence * 100)}%) chưa đạt ngưỡng hoặc bài làm quá ngắn. Giáo viên vui lòng tự nhập điểm bên dưới.`,
      rubricItems: criteria.map((c) => ({
        criterionId: c.id,
        description: c.description,
        suggestedScore: null,
        teacherScore: null,
        maxScore: c.maxScore,
        reason: 'Chưa đủ độ tin cậy để gợi ý điểm tự động — cần giáo viên trực tiếp chấm.',
        requiresTeacherReview: true,
      })),
    };
  }

  const lowerStudent = trimmed.toLowerCase();
  const rubricItems: RubricEvaluationItem[] = criteria.map((c) => {
    const matchedKeywords = c.requiredKeywords.filter((kw) =>
      lowerStudent.includes(kw),
    );
    const ratio =
      c.requiredKeywords.length > 0
        ? matchedKeywords.length / c.requiredKeywords.length
        : 0;

    let suggestedScore: number | null = null;
    let reason = '';
    let requiresTeacherReview = true;

    if (ratio >= 0.65) {
      suggestedScore = c.maxScore;
      reason = `Bài làm thể hiện đầy đủ ý chính (${matchedKeywords.slice(0, 4).join(', ')}).`;
      requiresTeacherReview = false;
    } else if (ratio >= 0.25) {
      suggestedScore = Math.round(c.maxScore * 0.5 * 4) / 4;
      reason = `Bài làm có đề cập một phần ý (${matchedKeywords.join(', ')}), giáo viên cần kiểm tra tính chính xác chi tiết.`;
      requiresTeacherReview = true;
    } else {
      suggestedScore = 0;
      reason = 'Chưa tìm thấy từ khóa/ý tương ứng với tiêu chí trong văn bản trích xuất.';
      requiresTeacherReview = true;
    }

    return {
      criterionId: c.id,
      description: c.description,
      suggestedScore,
      teacherScore: suggestedScore,
      maxScore: c.maxScore,
      reason,
      requiresTeacherReview,
    };
  });

  return {
    id: `grade-${Date.now()}`,
    mode: 'rubric',
    createdAt: Date.now(),
    fileName: input.fileName,
    extractedText: trimmed,
    ocrConfidence: input.ocrConfidence,
    canAutoEvaluate: true,
    rubricItems,
  };
}
