import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateStructuredFallbackReply,
  findRelatedModels,
  localAIService,
} from './localAI.ts';
import {
  evaluateMathExpression,
  parseChemicalFormula,
  solveAlgebraEquation,
  solveChemistryCalculation,
} from './stemSolver.ts';
import { KNOWLEDGE_BASE } from '../data/knowledgeBase.ts';
import {
  analyzeStudentWork,
  gradeAgainstRubric,
  parseRubricText,
} from './gradingService.ts';
import {
  MATH_SOLIDS,
  distanceBetween,
  midpointOf,
  angleDegreesAtVertex,
} from '../utils/mathGeometry.ts';

describe('LocalAI, Smart Grading & Math 3D Geometry pure logic', () => {
  it('supports 3 educational levels and provides explicit fallback limitation notice', () => {
    const r1 = generateStructuredFallbackReply('Tính tầm xa bài toán ném xiên', 1, []);
    const r2 = generateStructuredFallbackReply('Tính tầm xa bài toán ném xiên', 2, []);
    const r3 = generateStructuredFallbackReply('Tính tầm xa bài toán ném xiên', 3, []);

    assert.equal(r1.engineUsed, 'structured-knowledge-fallback');
    assert.ok(r1.limitationNotice && r1.limitationNotice.length > 20);
    assert.match(r1.content, /Mức 1/);
    assert.match(r2.content, /Mức 2/);
    assert.match(r3.content, /Mức 3/);
    assert.ok(r1.relatedModels.some((m) => m.id === 'phys-05'));
  });

  it('links Chemistry and Math models from user queries', () => {
    const chemLinks = findRelatedModels('So sánh cấu trúc phân tử benzene và tinh thể NaCl');
    assert.ok(chemLinks.some((l) => l.id === 'chem-072'));
    assert.ok(chemLinks.some((l) => l.id === 'chem-049'));

    const mathLinks = findRelatedModels('Tìm góc giữa SB và đáy của hình chóp S.ABCD');
    assert.ok(mathLinks.some((l) => l.id === 'math-pyramid'));
  });

  it('covers all 10 K-12 curriculum subjects in chatbot fallback & async reply', async () => {
    const subjects = new Set(KNOWLEDGE_BASE.map((k) => k.subject));
    for (const req of [
      'Toán',
      'Vật lý',
      'Hóa học',
      'Sinh học',
      'Tin học',
      'Ngữ văn',
      'Tiếng Anh',
      'Lịch sử',
      'Địa lý',
      'GDCD',
    ] as const) {
      assert.ok(subjects.has(req), `Missing subject ${req} in KNOWLEDGE_BASE`);
    }

    const bio = generateStructuredFallbackReply('Công thức tính số nuclêôtit ADN và phiên mã mARN', 2, []);
    assert.match(bio.content, /Sinh học/);

    const cs = generateStructuredFallbackReply('Độ phức tạp thuật toán Tìm kiếm nhị phân Binary Search', 2, []);
    assert.match(cs.content, /Tin học/);

    const lit = generateStructuredFallbackReply('Phân biệt ẩn dụ và hoán dụ trong Ngữ văn', 2, []);
    assert.match(lit.content, /Ngữ văn/);

    const eng = generateStructuredFallbackReply('Tổng hợp 12 thì tiếng Anh và câu điều kiện', 2, []);
    assert.match(eng.content, /Tiếng Anh/);

    const hist = generateStructuredFallbackReply('Cách mạng tháng Tám 1945 và Điện Biên Phủ 1954', 2, []);
    assert.match(hist.content, /Lịch sử/);

    const geo = generateStructuredFallbackReply('Công thức tính mật độ dân số và năng suất Địa lý', 2, []);
    assert.match(geo.content, /Địa lý/);

    const civ = generateStructuredFallbackReply('Quy luật cung cầu và lạm phát GDCD', 2, []);
    assert.match(civ.content, /GDCD/);

    const compared = await localAIService.generateReply(
      'So sánh cấu trúc phân tử Benzene (C6H6) và tinh thể NaCl',
      3,
      [],
    );
    assert.match(compared.content, /Benzene|C₆H₆/);
    assert.match(compared.content, /Sodium chloride|NaCl/);
  });

  it('solves chemical molar mass, moles, quadratic equations, and arithmetic accurately', () => {
    const parsedH2SO4 = parseChemicalFormula('H2SO4');
    assert.ok(parsedH2SO4 && Math.abs(parsedH2SO4.molarMass - 98.07) < 0.05);

    const parsedCaOH2 = parseChemicalFormula('Ca(OH)2');
    assert.ok(parsedCaOH2 && Math.abs(parsedCaOH2.molarMass - 74.09) < 0.05);

    const chemAns = solveChemistryCalculation('Tính khối lượng mol và số mol của 9.8g H2SO4', 3);
    assert.ok(chemAns && chemAns.includes('98.07') && chemAns.includes('0.0999'));

    const quad2 = solveAlgebraEquation('Giải phương trình x^2 - 5x + 6 = 0', 2);
    assert.ok(quad2 && quad2.includes('a = 1') && !quad2.includes('x_1 = 3'));

    const quad3 = solveAlgebraEquation('Giải phương trình x^2 - 5x + 6 = 0', 3);
    assert.ok(quad3 && quad3.includes('x_1 = 3') && quad3.includes('x_2 = 2'));

    assert.equal(evaluateMathExpression('sqrt(144) + 2^3 * 5'), 52);
  });

  it('analyzes student work step-by-step and detects arithmetic mismatch', () => {
    const res = analyzeStudentWork({
      text: 'Áp dụng định luật II Newton: F = m * a\n2 * 5 = 12\nĐáp số: 12 N',
      ocrConfidence: 0.92,
    });
    assert.equal(res.canAutoEvaluate, true);
    assert.ok(res.analysisSteps && res.analysisSteps.length === 3);
    assert.equal(res.analysisSteps[1].status, 'warning');
  });

  it('refuses fabricated scores when OCR confidence is too low', () => {
    const resAnalyze = analyzeStudentWork({
      text: 'F = ma = 10 N',
      ocrConfidence: 0.32,
    });
    assert.equal(resAnalyze.canAutoEvaluate, false);
    assert.ok(resAnalyze.limitationNotice);

    const resRubric = gradeAgainstRubric({
      studentText: 'v = v0 + at = 12 m/s',
      rubricText: '1. Viết công thức vận tốc - 1.0 điểm\n2. Thay số đúng - 1.0 điểm',
      ocrConfidence: 0.35,
    });
    assert.equal(resRubric.canAutoEvaluate, false);
    assert.ok(resRubric.rubricItems?.every((i) => i.suggestedScore === null && i.requiresTeacherReview));
  });

  it('parses teacher rubric and computes component scores accurately', () => {
    const criteria = parseRubricText(
      '1. Nêu công thức động năng và thế năng - 1.5 điểm\n2. Bảo toàn cơ năng - 2.0 điểm',
    );
    assert.equal(criteria.length, 2);
    assert.equal(criteria[0].maxScore, 1.5);
    assert.equal(criteria[1].maxScore, 2);

    const graded = gradeAgainstRubric({
      studentText:
        'Ta có công thức động năng và thế năng tại vị trí ban đầu.\nÁp dụng định luật bảo toàn cơ năng suy ra vận tốc.',
      rubricText:
        '1. Nêu công thức động năng và thế năng - 1.5 điểm\n2. Bảo toàn cơ năng - 2.0 điểm',
      ocrConfidence: 0.98,
    });
    assert.equal(graded.canAutoEvaluate, true);
    assert.equal(graded.rubricItems?.[0].suggestedScore, 1.5);
    assert.equal(graded.rubricItems?.[1].suggestedScore, 2);
  });

  it('computes Math 3D solid presets, midpoints, distances, and angles accurately', () => {
    assert.equal(MATH_SOLIDS.length, 17);
    const p1 = { id: 'P1', label: 'P1', x: 0, y: 0, z: 0 };
    const p2 = { id: 'P2', label: 'P2', x: 3, y: 4, z: 0 };
    assert.equal(distanceBetween(p1, p2), 5);
    const mid = midpointOf(p1, p2, 'M');
    assert.equal(mid.x, 1.5);
    assert.equal(mid.y, 2);
    const p3 = { id: 'P3', label: 'P3', x: 0, y: 4, z: 0 };
    const angle = angleDegreesAtVertex(p3, p1, { id: 'X', label: 'X', x: 4, y: 0, z: 0 });
    assert.ok(angle !== null && Math.abs(angle - 90) < 1e-6);
  });
});
