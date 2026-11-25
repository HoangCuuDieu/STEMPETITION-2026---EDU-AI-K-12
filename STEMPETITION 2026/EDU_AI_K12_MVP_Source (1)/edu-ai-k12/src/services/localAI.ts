import { KNOWLEDGE_BASE } from '../data/knowledgeBase';
import { CHEMISTRY_CATALOG } from '../data/chemistry/catalog100';
import { loadChemicalModelById } from '../data/chemistry/loader';
import { PHYSICS_CATALOG } from '../physics/catalog';
import { loadPhysicsSimulationById } from '../physics/loader';
import { MATH_SOLIDS } from '../utils/mathGeometry';
import type {
  ChatMessage,
  CurriculumSubject,
  InternalModelLink,
  KnowledgeEntry,
  SupportLevel,
} from '../types/assistant';
import type { ChemicalModel } from '../types/chemistry';
import type { PhysicsSimulationSpec } from '../types/physics';
import {
  solveAlgebraEquation,
  solveArithmeticQuery,
  solveChemistryCalculation,
} from './stemSolver';

export const RECOMMENDED_LOCAL_MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';

export interface LocalAIStatus {
  webGpuSupported: boolean;
  modelReady: boolean;
  modelLoading: boolean;
  loadProgressText: string;
  activeModelId: string | null;
  error?: string;
}

export interface AssistantReplyPayload {
  content: string;
  engineUsed: 'webllm-local' | 'structured-knowledge-fallback';
  limitationNotice?: string;
  relatedModels: InternalModelLink[];
}

const MATH_KEYWORDS: Record<string, string[]> = {
  'math-pyramid': ['hình chóp', 's.abcd', 'chóp', 'đáy vuông', 'góc giữa cạnh bên và mặt đáy'],
  'math-prism': ['lăng trụ', 'tam giác', 'pythagore', 'lăng trụ đứng'],
  'math-cuboid': ['hình hộp', 'chữ nhật', 'hình lập phương', 'đường chéo không gian'],
  'math-tetrahedron': ['tứ diện', 'oxyz', 'tọa độ không gian', 'tứ diện đều'],
};

const CHEMISTRY_VI_ALIASES: Record<string, string[]> = {
  'chem-001': ['hidro', 'hydro', 'khi hidro'],
  'chem-002': ['oxi', 'oxy', 'khi oxi'],
  'chem-004': ['nito', 'khi nito'],
  'chem-006': ['clo', 'khi clo'],
  'chem-014': ['kim cuong', 'diamond'],
  'chem-015': ['than chi', 'graphite'],
  'chem-016': ['natri'],
  'chem-017': ['magie'],
  'chem-018': ['nhom'],
  'chem-019': ['sat'],
  'chem-020': ['dong'],
  'chem-021': ['nuoc', 'water', 'h2o'],
  'chem-024': ['khi cacbonic', 'cacbon dioxit'],
  'chem-025': ['amoniac', 'ammonia'],
  'chem-026': ['axit clohidric', 'axit clohydric'],
  'chem-031': ['luu huynh dioxit', 'khi sunfuro'],
  'chem-037': ['axit nitric'],
  'chem-038': ['axit sunfuric', 'axit sulfuric'],
  'chem-039': ['axit photphoric'],
  'chem-049': ['natri clorua', 'muoi an', 'tinh the nacl'],
  'chem-054': ['canxi florua', 'florit'],
  'chem-055': ['natri hidroxit', 'xut an da'],
  'chem-057': ['canxi hidroxit', 'nuoc voi trong', 'voi toi'],
  'chem-058': ['natri cacbonat', 'soda'],
  'chem-060': ['canxi cacbonat', 'da voi'],
  'chem-061': ['metan', 'khi metan'],
  'chem-067': ['etilen', 'eten'],
  'chem-068': ['propen'],
  'chem-070': ['axetilen', 'etin'],
  'chem-072': ['benzen', 'benzene'],
  'chem-073': ['toluen'],
  'chem-076': ['xiclopropan'],
  'chem-077': ['metanol', 'ancol metylic'],
  'chem-078': ['etanol', 'ethanol', 'ancol etylic', 'ruou etylic'],
  'chem-081': ['glixerol', 'glyxerol'],
  'chem-082': ['fomandehit', 'andehit fomic'],
  'chem-084': ['axeton'],
  'chem-085': ['axit fomic'],
  'chem-086': ['axit axetic', 'giam an'],
  'chem-088': ['metyl axetat'],
  'chem-089': ['etyl axetat'],
  'chem-090': ['dimetyl ete'],
  'chem-094': ['ure', 'phan dam ure'],
  'chem-095': ['glixin', 'glyxin'],
  'chem-096': ['alanin'],
  'chem-097': ['glucozo', 'glucose', 'duong nho'],
  'chem-098': ['fructozo', 'fructose', 'duong mat ong'],
  'chem-099': ['saccarozo', 'sucrose', 'duong mia'],
  'chem-100': ['phenol'],
};

const SUBJECT_QUERY_HINTS: { subject: CurriculumSubject; patterns: string[] }[] = [
  { subject: 'Toán', patterns: ['toan', 'phuong trinh', 'dao ham', 'tich phan', 'logarit', 'hinh chop', 'tu dien', 'lang tru', 'hinh hop', 'xac suat', 'to hop', 'chinh hop', 'cap so', 'pythagore', 'vi-et', 'viet', 'oxyz', 'hang dang thuc'] },
  { subject: 'Vật lý', patterns: ['vat ly', 'vat li', 'dong hoc', 'nem xien', 'nem ngang', 'roi tu do', 'newton', 'ma sat', 'archimedes', 'con lac', 'song co', 'giao thoa', 'song dung', 'dang nhiet', 'dang ap', 'dang tich', 'coulomb', 'mach dien', 'tu truong', 'faraday', 'bien ap', 'khuc xa', 'thau kinh', 'xoay chieu', 'rlc', 'quang dien', 'hat nhan'] },
  { subject: 'Hóa học', patterns: ['hoa hoc', 'phan tu', 'tinh the', 'mol', 'nong do', 'oxi hoa', 'khu', 'dien phan', 'an mon', 'este', 'ancol', 'axit', 'hidrocacbon', 'benzen', 'nacl', 'h2so4', 'vsepr', 'polime', 'glucozo', 'glucose', 'ph '] },
  { subject: 'Sinh học', patterns: ['sinh hoc', 'te bao', 'nguyen phan', 'giam phan', 'quang hop', 'ho hap', 'adn', 'dna', 'arn', 'rna', 'phien ma', 'dich ma', 'mendel', 'hoan vi gen', 'hardy', 'sinh thai', 'tien hoa', 'nst'] },
  { subject: 'Tin học', patterns: ['tin hoc', 'nhi phan', 'binary', 'hex', 'python', 'thuat toan', 'sap xep', 'tim kiem nhi phan', 'binary search', 'quicksort', 'stack', 'queue', 'bfs', 'dfs', 'big o', 'sql', 'co so du lieu', 'mang may tinh', 'dns', 'http'] },
  { subject: 'Ngữ văn', patterns: ['ngu van', 'tieng viet', 'tu tu', 'an du', 'hoan du', 'nhan hoa', 'so sanh', 'phuong thuc bieu dat', 'nghi luan', 'truyen kieu', 'tuyen ngon doc lap', 'tay tien', 'viet bac', 'song', 'vo nhat', 'chiec thuyen ngoai xa'] },
  { subject: 'Tiếng Anh', patterns: ['tieng anh', 'english', 'thi trong tieng anh', '12 thi', 'present simple', 'present perfect', 'past simple', 'past perfect', 'cau dieu kien', 'conditional', 'bi dong', 'passive', 'gian tiep', 'reported', 'menh de quan he', 'dao ngu'] },
  { subject: 'Lịch sử', patterns: ['lich su', 'bach dang', 'trieu dai', 'cach mang thang tam', '1945', 'dien bien phu', '1954', '1975', 'doi moi', '1986', 'the chien', 'ianta', 'chien tranh lanh', 'asean', 'lien hop quoc'] },
  { subject: 'Địa lý', patterns: ['dia ly', 'dia li', 'khi hau', 'nhiet doi am gio mua', 'bien dong', 'mat do dan so', 'nang suat', 'co cau gdp', 'vung kinh te', 'bieu do'] },
  { subject: 'GDCD', patterns: ['gdcd', 'kinh te phap luat', 'cung cau', 'lam phat', 'that nghiep', 'hien phap', 'quyen cong dan', 'trach nhiem phap ly', 'ngan sach nha nuoc'] },
];

export function normalizeVi(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function cleanFormulaStr(formula: string): string {
  return formula.replace(/[₀-₉]/g, (d) =>
    String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d)),
  );
}

function tokenizeQuery(query: string): string[] {
  const norm = normalizeVi(cleanFormulaStr(query));
  return norm
    .split(/[^a-z0-9]+/)
    .filter((tok) => tok.length >= 2);
}

function detectQuerySubjects(query: string): CurriculumSubject[] {
  const norm = normalizeVi(query);
  const found: { subject: CurriculumSubject; hits: number }[] = [];
  for (const hint of SUBJECT_QUERY_HINTS) {
    let hits = 0;
    for (const p of hint.patterns) {
      if (norm.includes(p)) hits++;
    }
    if (hits > 0) found.push({ subject: hint.subject, hits });
  }
  return found.sort((a, b) => b.hits - a.hits).map((x) => x.subject);
}

const GENERIC_QUERY_STOPWORDS = new Set([
  'tinh', 'khoi', 'luong', 'cong', 'thuc', 'giai', 'thich', 'phan', 'tich',
  'dinh', 'luat', 'phuong', 'trinh', 'chuyen', 'cau', 'truc', 'lop', 'bai',
  'cho', 'cua', 'cac', 'mot', 'hai', 'hay', 'voi', 'theo', 'nhu', 'sau',
  'tren', 'duoi', 'trong', 'ngoai', 'hien', 'tuong', 'ban', 'chat', 'cach',
  'bao', 'nhieu', 'la', 'gi', 'nao', 'tu', 'va', 'hoac', 'nhung', 'khi',
  'so', 'sanh', 'biet', 'chi', 'tiet', 'tong', 'hop', 'diem', 'dai', 'luc',
]);

function hasWholeWord(normHay: string, token: string): boolean {
  return new RegExp(`(?:^|[^a-z0-9])${token}(?:$|[^a-z0-9])`).test(normHay);
}

export function findRelatedModels(
  query: string,
  maxItems = 4,
  subjectFilter: CurriculumSubject | 'ALL' = 'ALL',
): InternalModelLink[] {
  const norm = normalizeVi(cleanFormulaStr(query));
  const tokens = tokenizeQuery(query).filter((t) => !GENERIC_QUERY_STOPWORDS.has(t));
  const detectedSubjects = detectQuerySubjects(query);
  const nonLabPrimary =
    subjectFilter !== 'ALL'
      ? !['Toán', 'Vật lý', 'Hóa học'].includes(subjectFilter)
      : detectedSubjects.length > 0 &&
        !['Toán', 'Vật lý', 'Hóa học'].includes(detectedSubjects[0]) &&
        !detectedSubjects.includes('Toán') &&
        !detectedSubjects.includes('Vật lý') &&
        !detectedSubjects.includes('Hóa học');

  if (nonLabPrimary) {
    return [];
  }

  const allowMath = subjectFilter === 'ALL' || subjectFilter === 'Toán';
  const allowPhysics = subjectFilter === 'ALL' || subjectFilter === 'Vật lý';
  const allowChemistry = subjectFilter === 'ALL' || subjectFilter === 'Hóa học';

  const scored: { link: InternalModelLink; score: number }[] = [];

  if (allowMath) {
    for (const m of MATH_SOLIDS) {
      let score = 0;
      const kws = MATH_KEYWORDS[m.id] ?? [];
      for (const kw of kws) {
        if (norm.includes(normalizeVi(kw))) score += 6;
      }
      if (norm.includes(normalizeVi(m.name))) score += 10;
      if (score >= 6) {
        scored.push({ link: { domain: 'math', id: m.id, label: `${m.name} 3D` }, score });
      }
    }
  }

  if (allowPhysics) {
    for (const p of PHYSICS_CATALOG) {
      const hay = normalizeVi(`${p.name} ${p.groupName}`);
      let score = 0;
      if (norm.includes(normalizeVi(p.name))) score += 14;
      for (const tok of tokens) {
        if (tok.length >= 3 && hasWholeWord(hay, tok)) score += 3;
      }
      if (score >= 6) {
        scored.push({
          link: { domain: 'physics', id: p.id, label: `Vật lý #${p.orderNumber}: ${p.name}` },
          score,
        });
      }
    }
  }

  if (allowChemistry) {
    for (const c of CHEMISTRY_CATALOG) {
      const cleanF = cleanFormulaStr(c.formula);
      const aliases = CHEMISTRY_VI_ALIASES[c.id] ?? [];
      const hay = normalizeVi(`${c.nameVi} ${c.nameEn} ${cleanF} ${aliases.join(' ')}`);
      let score = 0;
      if (norm.includes(normalizeVi(c.nameVi)) || norm.includes(normalizeVi(c.nameEn))) {
        score += 10;
      }
      for (const alias of aliases) {
        if (hasWholeWord(norm, alias)) score += 10;
      }
      if (
        cleanF.length >= 2 &&
        new RegExp(`\\b${cleanF.replace(/[()]/g, '\\$&').toLowerCase()}\\b`, 'i').test(cleanFormulaStr(query))
      ) {
        score += 12;
      }
      for (const tok of tokens) {
        if (tok.length >= 3 && hasWholeWord(hay, tok)) score += 3;
      }
      if (score >= 6) {
        scored.push({
          link: {
            domain: 'chemistry',
            id: c.id,
            label: `Hóa học #${c.orderNumber}: ${c.formula} (${c.nameVi})`,
          },
          score,
        });
      }
    }
  }

  const seen = new Set<string>();
  return scored
    .sort((a, b) => b.score - a.score)
    .filter((item) => {
      if (seen.has(item.link.id)) return false;
      seen.add(item.link.id);
      return true;
    })
    .slice(0, maxItems)
    .map((x) => x.link);
}

export function matchKnowledgeEntries(
  query: string,
  limit = 3,
  subjectFilter: CurriculumSubject | 'ALL' = 'ALL',
): KnowledgeEntry[] {
  const norm = normalizeVi(cleanFormulaStr(query));
  const tokens = tokenizeQuery(query);
  const detectedSubjects = detectQuerySubjects(query);

  const pool =
    subjectFilter === 'ALL'
      ? KNOWLEDGE_BASE
      : KNOWLEDGE_BASE.filter((e) => e.subject === subjectFilter);

  const scored = pool.map((entry) => {
    let score = 0;
    const titleNorm = normalizeVi(entry.title);
    const summaryNorm = normalizeVi(entry.summary);
    const subjectNorm = normalizeVi(entry.subject);

    if (norm.includes(subjectNorm)) score += 6;
    if (detectedSubjects[0] === entry.subject) score += 3;

    for (const kw of entry.keywords) {
      const kwNorm = normalizeVi(kw);
      if (norm.includes(kwNorm)) {
        score += kwNorm.includes(' ') ? 7 : 5;
      }
    }
    for (const tok of tokens) {
      if (titleNorm.includes(tok)) score += 3;
      if (summaryNorm.includes(tok)) score += 1;
    }
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}

export function getLevelInstruction(level: SupportLevel): string {
  switch (level) {
    case 1:
      return 'Mức độ 1 (Gợi ý kiến thức liên quan): Chỉ nêu tên định lý, khái niệm và công thức nền tảng liên quan, không giải bài hộ.';
    case 2:
      return 'Mức độ 2 (Hướng dẫn phương pháp giải): Nêu rõ hướng tiếp cận, cách đặt ẩn/hệ quy chiếu và công thức trọng tâm nhưng chưa thay số ra đáp số cuối.';
    case 3:
      return 'Mức độ 3 (Phân tích từng bước, KHÔNG đưa ngay đáp án bài gốc): Chia nhỏ lộ trình giải từng bước logic để học sinh tự hoàn thành bước tính cuối cùng.';
  }
}

function levelHeader(level: SupportLevel, subjectLabel: string): string {
  if (level === 1) return `Mức 1 – Gợi ý kiến thức liên quan (${subjectLabel}):`;
  if (level === 2) return `Mức 2 – Hướng dẫn phương pháp giải (${subjectLabel}):`;
  return `Mức 3 – Phân tích từng bước (${subjectLabel}) — tự hoàn tất bước cuối:`;
}

function formatComparisonFromModels(
  chemModels: ChemicalModel[],
  level: SupportLevel,
): string | null {
  if (chemModels.length < 2) return null;
  const [a, b] = chemModels;
  const structLabel = (t: ChemicalModel['structureType']) => {
    switch (t) {
      case 'molecule':
        return 'Phân tử cộng hóa trị rời rạc';
      case 'ionic-crystal':
        return 'Mạng tinh thể ion';
      case 'metal-crystal':
        return 'Mạng tinh thể kim loại';
      case 'covalent-network':
        return 'Mạng nguyên tử cộng hóa trị';
      case 'monatomic':
        return 'Đơn nguyên tử';
    }
  };

  if (level === 1) {
    return (
      `${levelHeader(1, 'Hóa học')}\n` +
      `• Để so sánh **${a.nameVi} (${a.formula})** và **${b.nameVi} (${b.formula})**, hãy đối chiếu 3 tiêu chí cốt lõi: kiểu cấu trúc liên kết, hình học không gian/số phối trí và tính chất vật lý.\n` +
      `• **${a.formula}**: ${structLabel(a.structureType)}, $M = ${a.molarMass}\\text{ g/mol}$.\n` +
      `• **${b.formula}**: ${structLabel(b.structureType)}, $M = ${b.molarMass}\\text{ g/mol}$.`
    );
  }

  return (
    `${levelHeader(level, 'Hóa học · So sánh cấu trúc 3D')}\n` +
    `• **1. ${a.nameVi} (${a.formula}, $M = ${a.molarMass}\\text{ g/mol}$):**\n` +
    `  - Kiểu cấu trúc: ${structLabel(a.structureType)}.\n` +
    `  - Hình học 3D: ${a.geometryDescription}\n` +
    `  - Tính chất nổi bật: ${a.properties.slice(0, 2).join('; ')}.\n` +
    `• **2. ${b.nameVi} (${b.formula}, $M = ${b.molarMass}\\text{ g/mol}$):**\n` +
    `  - Kiểu cấu trúc: ${structLabel(b.structureType)}.\n` +
    `  - Hình học 3D: ${b.geometryDescription}\n` +
    `  - Tính chất nổi bật: ${b.properties.slice(0, 2).join('; ')}.\n` +
    `• **3. Điểm khác biệt mấu chốt:** Hãy mở cả 2 mô hình 3D bên dưới để xoay trực tiếp và quan sát góc liên kết / mạng lưới tinh thể.`
  );
}

function formatPhysicsDetailSection(sim: PhysicsSimulationSpec, level: SupportLevel): string {
  const formulas = sim.formulasLatex.map((f) => `$${f}$`).join(' ; ');
  const paramSummary = sim.parameters
    .map((p) => `${p.label} (${p.unit || 'không đơn vị'})`)
    .join(', ');

  if (level === 1) {
    return (
      `• **Mô hình Vật lý #${sim.orderNumber} – ${sim.name} (Nhóm ${sim.groupId} · Lớp ${sim.suggestedGrades.join(', ')}):**\n` +
      `  - Hiện tượng: ${sim.explanationVi}\n` +
      `  - Công thức nền tảng: ${formulas}`
    );
  }
  if (level === 2) {
    return (
      `• **Chuyên đề Vật lý #${sim.orderNumber} – ${sim.name} (Lớp ${sim.suggestedGrades.join(', ')}):**\n` +
      `  - Bản chất & hướng tiếp cận: ${sim.explanationVi}\n` +
      `  - Công thức thiết lập phương trình: ${formulas}\n` +
      `  - Thông số khảo sát trong phòng thí nghiệm: ${paramSummary}.`
    );
  }
  return (
    `• **Phân tích mô hình #${sim.orderNumber} – ${sim.name} (Lớp ${sim.suggestedGrades.join(', ')}):**\n` +
    `  - Cơ sở vật lý: ${sim.explanationVi}\n` +
    `  - Hệ công thức từng bước: ${formulas}\n` +
    `  - Điều kiện & giả thiết giới hạn: ${sim.assumptionsAndLimits.join(' ')}\n` +
    `  - Thực hành: Thay đổi các thanh trượt (${paramSummary}) trong mô phỏng bên dưới để kiểm chứng quy luật biến thiên.`
  );
}

function formatChemicalDetailSection(chem: ChemicalModel, level: SupportLevel): string {
  if (level === 1) {
    return (
      `• **Chất #${chem.orderNumber} – ${chem.nameVi} (${chem.formula}, $M = ${chem.molarMass}\\text{ g/mol}$):**\n` +
      `  - Cấu trúc không gian: ${chem.geometryDescription}`
    );
  }
  return (
    `• **Thông tin 3D chuẩn cho ${chem.nameVi} (${chem.formula}, $M = ${chem.molarMass}\\text{ g/mol}$):**\n` +
    `  - Cấu trúc không gian: ${chem.geometryDescription}\n` +
    (chem.lattice
      ? `  - Mạng tinh thể (${chem.lattice.crystalSystem}): $a=${chem.lattice.a}\\text{ \\AA}, b=${chem.lattice.b}\\text{ \\AA}, c=${chem.lattice.c}\\text{ \\AA}$ (${chem.lattice.cellRepresentationNote}).\n`
      : '') +
    `  - Tính chất đặc trưng: ${chem.properties.join('; ')}.\n` +
    `  - Ứng dụng thực tiễn: ${chem.applications.join('; ')}.`
  );
}

function formatKnowledgeSection(
  matched: KnowledgeEntry[],
  level: SupportLevel,
): string {
  const primary = matched[0];
  const formulaPreview = primary.formulasLatex.map((f) => `$${f}$`).join(' ; ');

  if (level === 1) {
    return (
      `${levelHeader(1, `${primary.subject} · ${primary.grade}`)}\n` +
      `• **Chủ đề trọng tâm:** ${primary.title}.\n` +
      `• **Tóm tắt kiến thức:** ${primary.summary}\n` +
      `• **Công thức / quy tắc cần nhớ:** ${formulaPreview}`
    );
  }
  if (level === 2) {
    return (
      `${levelHeader(2, `${primary.subject} · ${primary.grade}`)}\n` +
      `• **Phương pháp tiếp cận:** ${primary.methodHint}\n` +
      `• **Công thức / cấu trúc áp dụng:** ${formulaPreview}\n` +
      (primary.commonMistake ? `• **Lỗi thường gặp cần tránh:** ${primary.commonMistake}\n` : '') +
      (matched[1] ? `• **Kiến thức bổ trợ liên quan:** ${matched[1].title} (${matched[1].subject} · ${matched[1].grade}).` : '')
    );
  }
  return (
    `${levelHeader(3, `${primary.subject} · ${primary.grade}`)}\n` +
    `• **Lộ trình phân tích từng bước:** ${primary.stepScaffold}\n` +
    `• **Công thức / quy tắc dẫn đường:** ${formulaPreview}\n` +
    (primary.quickExample ? `• **Ví dụ mẫu định hướng:** ${primary.quickExample}\n` : '') +
    (primary.commonMistake ? `• **Lưu ý tránh sai sót:** ${primary.commonMistake}\n` : '') +
    (matched[1] ? `• **Chuyên đề mở rộng liên quan:** ${matched[1].title}.` : '')
  );
}

function buildSmartNoMatchGuide(
  userQuery: string,
  level: SupportLevel,
  subjectFilter: CurriculumSubject | 'ALL',
): string {
  const detected = detectQuerySubjects(userQuery);
  const subjNote =
    subjectFilter !== 'ALL'
      ? subjectFilter
      : detected[0] ?? 'Toán, Vật lý, Hóa học, Sinh học, Tin học, Ngữ văn, Tiếng Anh, Lịch sử, Địa lý, GDCD';

  if (level === 1) {
    return (
      `${levelHeader(1, subjNote)}\n` +
      `• Mình đã rà soát Kho kiến thức 10 môn (Lớp 1–12) và ${MATH_SOLIDS.length + 150} mô hình 2D/3D nhưng câu hỏi hiện tại hơi ngắn hoặc chưa rõ từ khóa chuyên đề.\n` +
      `• Bạn hãy bổ sung tên khái niệm/công thức, lớp học hoặc dán đề bài đầy đủ (ví dụ: *"Giải phương trình x^2 - 5x + 6 = 0"*, *"Tính M của Ca(OH)2"*, *"12 thì tiếng Anh"*, *"Nguyên phân vs giảm phân"*).`
    );
  }
  if (level === 2) {
    return (
      `${levelHeader(2, subjNote)}\n` +
      `1. **Xác định dữ kiện & yêu cầu:** Tóm tắt đề bài hoặc nêu rõ chủ đề bạn đang cần ôn tập.\n` +
      `2. **Chọn chuyên đề chương trình:** Bạn có thể chọn nhanh môn học ở cột bên trái hoặc tải ảnh/tệp PDF, DOCX đề bài lên để mình trích xuất và định hướng phương pháp giải chính xác.`
    );
  }
  return (
    `${levelHeader(3, subjNote)}\n` +
    `• **Bước 1:** Gửi rõ đề bài, phương trình hoặc câu hỏi cụ thể (hỗ trợ cả gõ chữ lẫn tải ảnh/PDF/DOCX).\n` +
    `• **Bước 2:** Mình sẽ phân tích cấu trúc bài toán, trích xuất công thức LaTeX chuẩn chương trình và hướng dẫn từng bước để bạn tự hoàn tất đáp số.\n` +
    `• **Bước 3:** Nếu là bài Toán 3D, Vật lý hay Hóa học, mình sẽ gắn luôn mô hình 2D/3D tương tác để bạn kiểm chứng trực quan.`
  );
}

export function generateStructuredFallbackReply(
  userQuery: string,
  level: SupportLevel,
  history: ChatMessage[],
  extractedFileText?: string,
  subjectFilter: CurriculumSubject | 'ALL' = 'ALL',
): AssistantReplyPayload {
  const directQuery = [userQuery, extractedFileText ? extractedFileText.slice(0, 700) : '']
    .filter(Boolean)
    .join(' ');

  // Solve deterministic STEM calculations directly on current query first
  const chemCalc = solveChemistryCalculation(directQuery, level);
  const algebraCalc = solveAlgebraEquation(directQuery, level);
  const arithCalc = !algebraCalc ? solveArithmeticQuery(directQuery) : null;

  let matched = matchKnowledgeEntries(directQuery, 2, subjectFilter);
  let relatedModels = findRelatedModels(directQuery, 4, subjectFilter);

  // Use recent conversation context ONLY if direct query is a short follow-up with weak/no matches
  const isShortFollowUp = userQuery.trim().split(/\s+/).length <= 8;
  if (
    matched.length === 0 &&
    relatedModels.length === 0 &&
    !chemCalc &&
    !algebraCalc &&
    !arithCalc &&
    history.length > 0 &&
    isShortFollowUp
  ) {
    const contextQuery = [
      ...history.slice(-3).map((m) => m.content.slice(0, 200)),
      directQuery,
    ].join(' ');
    matched = matchKnowledgeEntries(contextQuery, 2, subjectFilter);
    relatedModels = findRelatedModels(contextQuery, 4, subjectFilter);
  }

  // Also check MATH_SOLIDS direct match details
  const matchedSolid = MATH_SOLIDS.find((s) =>
    relatedModels.some((l) => l.domain === 'math' && l.id === s.id),
  );

  if (matched.length > 0 && matched[0].linkedModel) {
    const primaryLink = matched[0].linkedModel;
    if (!relatedModels.some((m) => m.id === primaryLink.id)) {
      relatedModels.unshift(primaryLink);
    }
  }

  const sections: string[] = [];

  if (algebraCalc) {
    sections.push(`${levelHeader(level, 'Toán · Giải phương trình')}\n${algebraCalc}`);
  } else if (chemCalc) {
    sections.push(`${levelHeader(level, 'Hóa học · Tính khối lượng mol & số mol')}\n${chemCalc}`);
  } else if (arithCalc) {
    sections.push(`${levelHeader(level, 'Toán · Tính toán biểu thức')}\n${arithCalc}`);
  }

  if (matched.length > 0) {
    sections.push(formatKnowledgeSection(matched, level));
  } else if (matchedSolid && !algebraCalc) {
    const solidFormulas = matchedSolid.formulasLatex.map((f) => `$${f}$`).join(' ; ');
    sections.push(
      `${levelHeader(level, 'Toán học 3D')}\n` +
        `• **Mô hình:** ${matchedSolid.name} (${matchedSolid.subtitle}).\n` +
        `• **Mô tả hình học:** ${matchedSolid.description}\n` +
        `• **Công thức trọng tâm:** ${solidFormulas}`,
    );
  } else if (sections.length === 0 && relatedModels.length > 0) {
    const topLink = relatedModels[0];
    const domainLabel =
      topLink.domain === 'physics'
        ? 'Vật lý 2D'
        : topLink.domain === 'chemistry'
          ? 'Hóa học 3D'
          : 'Toán học 3D';
    sections.push(
      `${levelHeader(level, domainLabel)}\n` +
        `• **Chủ đề đối chiếu trực tiếp trong phòng thí nghiệm:** ${topLink.label}.\n` +
        `• Bạn có thể nhấn mở mô hình tương tác bên dưới để xem phương trình, thông số và cấu trúc trực quan.`,
    );
  }

  const content =
    sections.length > 0
      ? sections.join('\n\n')
      : buildSmartNoMatchGuide(userQuery, level, subjectFilter);

  return {
    content,
    engineUsed: 'structured-knowledge-fallback',
    limitationNotice:
      'Đang sử dụng bộ suy luận chương trình 10 môn Lớp 1–12 & phòng thí nghiệm cục bộ (chưa kích hoạt WebLLM/WebGPU). Hệ thống đối chiếu dữ liệu chuẩn chương trình và bộ tính toán Toán–Hóa xác định, không suy diễn ngoài dữ liệu đã kiểm định.',
    relatedModels: relatedModels.slice(0, 4),
  };
}

async function hydrateDetailedModelContext(
  relatedModels: InternalModelLink[],
): Promise<{ physicsSpecs: PhysicsSimulationSpec[]; chemModels: ChemicalModel[] }> {
  const physicsLinks = relatedModels.filter((m) => m.domain === 'physics').slice(0, 2);
  const chemLinks = relatedModels.filter((m) => m.domain === 'chemistry').slice(0, 2);

  const [physicsRaw, chemRaw] = await Promise.all([
    Promise.all(
      physicsLinks.map((l) => {
        const catalogItem = PHYSICS_CATALOG.find((p) => p.id === l.id);
        return loadPhysicsSimulationById(l.id, catalogItem?.groupId);
      }),
    ),
    Promise.all(
      chemLinks.map((l) => {
        const catalogItem = CHEMISTRY_CATALOG.find((c) => c.id === l.id);
        return loadChemicalModelById(l.id, catalogItem?.category);
      }),
    ),
  ]);

  return {
    physicsSpecs: physicsRaw.filter((x): x is PhysicsSimulationSpec => Boolean(x)),
    chemModels: chemRaw.filter((x): x is ChemicalModel => Boolean(x)),
  };
}

class LocalAIService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private engine: any = null;
  private status: LocalAIStatus = {
    webGpuSupported:
      typeof navigator !== 'undefined' && 'gpu' in navigator,
    modelReady: false,
    modelLoading: false,
    loadProgressText: '',
    activeModelId: null,
  };

  getStatus(): LocalAIStatus {
    return { ...this.status };
  }

  async initLocalModel(
    onProgress?: (status: LocalAIStatus) => void,
  ): Promise<LocalAIStatus> {
    if (!this.status.webGpuSupported) {
      this.status.error =
        'Trình duyệt hoặc thiết bị hiện tại chưa hỗ trợ WebGPU để chạy mô hình WebLLM cục bộ.';
      onProgress?.(this.getStatus());
      return this.getStatus();
    }

    if (this.status.modelReady && this.engine) {
      return this.getStatus();
    }

    this.status.modelLoading = true;
    this.status.error = undefined;
    this.status.loadProgressText = 'Đang khởi tạo WebLLM trên thiết bị...';
    onProgress?.(this.getStatus());

    try {
      const webllm = await import('@mlc-ai/web-llm');
      this.engine = await webllm.CreateMLCEngine(RECOMMENDED_LOCAL_MODEL_ID, {
        initProgressCallback: (report) => {
          this.status.loadProgressText = report.text || 'Đang tải trọng số cục bộ...';
          onProgress?.(this.getStatus());
        },
      });
      this.status.modelReady = true;
      this.status.modelLoading = false;
      this.status.activeModelId = RECOMMENDED_LOCAL_MODEL_ID;
      this.status.loadProgressText = 'Mô hình cục bộ đã sẵn sàng (WebGPU).';
      onProgress?.(this.getStatus());
      return this.getStatus();
    } catch (err) {
      this.status.modelLoading = false;
      this.status.modelReady = false;
      this.status.error =
        err instanceof Error
          ? `Không thể nạp mô hình WebLLM cục bộ: ${err.message}`
          : 'Không thể nạp mô hình WebLLM cục bộ.';
      onProgress?.(this.getStatus());
      return this.getStatus();
    }
  }

  async generateReply(
    userQuery: string,
    level: SupportLevel,
    history: ChatMessage[],
    extractedFileText?: string,
    subjectFilter: CurriculumSubject | 'ALL' = 'ALL',
  ): Promise<AssistantReplyPayload> {
    const baseFallback = generateStructuredFallbackReply(
      userQuery,
      level,
      history,
      extractedFileText,
      subjectFilter,
    );
    const { physicsSpecs, chemModels } = await hydrateDetailedModelContext(
      baseFallback.relatedModels,
    );

    const isComparison = /(so sánh|phân biệt|khác nhau|giống nhau)/i.test(userQuery);
    const comparisonText =
      isComparison && chemModels.length >= 2
        ? formatComparisonFromModels(chemModels, level)
        : null;

    // Build grounded RAG context from all 10 subjects + 154 loaded models
    const ragSnippets: string[] = [];
    const kbMatched = matchKnowledgeEntries(
      `${userQuery} ${extractedFileText ?? ''}`,
      2,
      subjectFilter,
    );
    for (const k of kbMatched) {
      ragSnippets.push(
        `[${k.subject} · ${k.grade}] ${k.title}: ${k.summary} | Công thức: ${k.formulasLatex.join('; ')} | Phương pháp: ${k.methodHint}`,
      );
    }
    for (const p of physicsSpecs) {
      ragSnippets.push(
        `[Vật lý #${p.orderNumber}] ${p.name}: ${p.explanationVi} | Công thức: ${p.formulasLatex.join('; ')}`,
      );
    }
    for (const c of chemModels) {
      ragSnippets.push(
        `[Hóa học #${c.orderNumber}] ${c.nameVi} (${c.formula}, M=${c.molarMass} g/mol): ${c.geometryDescription} | Tính chất: ${c.properties.join(', ')}`,
      );
    }

    if (this.engine && this.status.modelReady) {
      try {
        const systemPrompt = [
          'Bạn là EduMind AI, trợ lý giáo dục toàn diện cho học sinh Việt Nam từ lớp 1 đến lớp 12 (đầy đủ 10 môn: Toán, Vật lý, Hóa học, Sinh học, Tin học, Ngữ văn, Tiếng Anh, Lịch sử, Địa lý, GDCD).',
          getLevelInstruction(level),
          'Trả lời chính xác, sư phạm, dễ hiểu bằng tiếng Việt, dùng LaTeX ($...$) cho công thức khi cần.',
          ragSnippets.length > 0
            ? `\n[Dữ liệu tham khảo chuẩn chương trình từ EduMind]:\n${ragSnippets.join('\n')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n');

        const messages = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          {
            role: 'user',
            content: extractedFileText
              ? `${userQuery}\n\n[Nội dung tệp đính kèm]:\n${extractedFileText.slice(0, 2000)}`
              : userQuery,
          },
        ];

        const completion = await this.engine.chat.completions.create({
          messages,
          temperature: 0.35,
          max_tokens: 650,
        });

        const replyText =
          completion?.choices?.[0]?.message?.content?.trim() || '';
        if (replyText) {
          return {
            content: replyText,
            engineUsed: 'webllm-local',
            relatedModels: baseFallback.relatedModels,
          };
        }
      } catch {
        // Fall through cleanly to enriched local engine
      }
    }

    // Enrich fallback reply with full hydrated 2D Physics & 3D Chemistry specs
    const enrichedSections: string[] = [];

    if (comparisonText) {
      enrichedSections.push(comparisonText);
    } else {
      enrichedSections.push(baseFallback.content);

      if (physicsSpecs.length > 0) {
        enrichedSections.push(
          physicsSpecs.map((p) => formatPhysicsDetailSection(p, level)).join('\n\n'),
        );
      }

      if (chemModels.length > 0) {
        enrichedSections.push(
          chemModels.map((c) => formatChemicalDetailSection(c, level)).join('\n\n'),
        );
      }
    }

    return {
      content: enrichedSections.join('\n\n'),
      engineUsed: 'structured-knowledge-fallback',
      limitationNotice: baseFallback.limitationNotice,
      relatedModels: baseFallback.relatedModels,
    };
  }
}

export const localAIService = new LocalAIService();
