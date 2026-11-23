import type { SupportLevel } from '../types/assistant';

const ATOMIC_MASSES: Record<string, number> = {
  H: 1.008,
  He: 4.0026,
  Li: 6.94,
  Be: 9.012,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  Ne: 20.18,
  Na: 22.99,
  Mg: 24.305,
  Al: 26.982,
  Si: 28.085,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  Ar: 39.948,
  K: 39.098,
  Ca: 40.078,
  Cr: 51.996,
  Mn: 54.938,
  Fe: 55.845,
  Cu: 63.546,
  Zn: 65.38,
  Br: 79.904,
  Ag: 107.868,
  I: 126.904,
  Ba: 137.327,
  Pb: 207.2,
};

export interface FormulaBreakdown {
  formula: string;
  elements: { symbol: string; count: number; atomicMass: number }[];
  molarMass: number;
}

function normalizeSubscripts(raw: string): string {
  return raw.replace(/[₀-₉]/g, (ch) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(ch)));
}

export function parseChemicalFormula(rawFormula: string): FormulaBreakdown | null {
  const formula = normalizeSubscripts(rawFormula.trim());
  if (!/^[A-Za-z0-9()]+$/.test(formula) || !/[A-Z]/.test(formula)) return null;

  let i = 0;
  function parseGroup(): Record<string, number> | null {
    const counts: Record<string, number> = {};
    while (i < formula.length) {
      const ch = formula[i];
      if (ch === ')') {
        i++;
        return counts;
      }
      if (ch === '(') {
        i++;
        const inner = parseGroup();
        if (!inner) return null;
        let numStr = '';
        while (i < formula.length && /\d/.test(formula[i])) {
          numStr += formula[i++];
        }
        const mult = numStr ? parseInt(numStr, 10) : 1;
        for (const [el, c] of Object.entries(inner)) {
          counts[el] = (counts[el] ?? 0) + c * mult;
        }
      } else if (/[A-Z]/.test(ch)) {
        let symbol = ch;
        i++;
        if (i < formula.length && /[a-z]/.test(formula[i])) {
          symbol += formula[i++];
        }
        if (!(symbol in ATOMIC_MASSES)) return null;
        let numStr = '';
        while (i < formula.length && /\d/.test(formula[i])) {
          numStr += formula[i++];
        }
        const count = numStr ? parseInt(numStr, 10) : 1;
        counts[symbol] = (counts[symbol] ?? 0) + count;
      } else {
        return null;
      }
    }
    return counts;
  }

  const parsed = parseGroup();
  if (!parsed || i !== formula.length || Object.keys(parsed).length === 0) return null;

  const elements = Object.entries(parsed).map(([symbol, count]) => ({
    symbol,
    count,
    atomicMass: ATOMIC_MASSES[symbol],
  }));

  const molarMass = elements.reduce(
    (sum, item) => sum + item.count * item.atomicMass,
    0,
  );

  return {
    formula: rawFormula.trim(),
    elements,
    molarMass: Number(molarMass.toFixed(2)),
  };
}

export function extractChemicalFormulasFromQuery(query: string): string[] {
  const normalized = normalizeSubscripts(query);
  const matches = normalized.match(/\b(?:[A-Z][a-z]?\d*|\([A-Za-z0-9]+\)\d*){1,8}\b/g) ?? [];
  const valid: string[] = [];
  for (const cand of matches) {
    // Skip normal English words like "In", "No" when lowercase/ambiguous unless unambiguous formula
    if (/^(In|At|As|He|Be|No|Co|So|If|Is|Of|Or|An|Am|By|Do|Go|My|On|To|Up|We)$/i.test(cand) && cand.length <= 2) {
      if (cand !== 'CO' && cand !== 'NO' && cand !== 'He') continue;
    }
    if (parseChemicalFormula(cand)) {
      if (!valid.includes(cand)) valid.push(cand);
    }
  }
  return valid;
}

export function solveChemistryCalculation(
  query: string,
  level: SupportLevel,
): string | null {
  const lower = query.toLowerCase();
  const isMolarMassAsk = /(khối lượng mol|phân tử khối|nguyên tử khối|tính m\b|m lớn|tính số mol|bao nhiêu mol|tính n\b|n =|m =)/i.test(
    lower,
  );
  if (!isMolarMassAsk) return null;

  const formulas = extractChemicalFormulasFromQuery(query);
  if (formulas.length === 0) return null;

  const targetFormula = formulas[0];
  const info = parseChemicalFormula(targetFormula);
  if (!info) return null;

  const breakdownStr = info.elements
    .map((e) => `${e.count > 1 ? `${e.count}\\cdot ` : ''}${e.atomicMass.toFixed(2).replace(/\.00$/, '')}\\text{ (${e.symbol})}`)
    .join(' + ');

  const massMatch = query.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gam)\b/i);
  const volMatch = query.match(/(\d+(?:[.,]\d+)?)\s*(?:l|lít|lit)\b/i);

  const lines: string[] = [];
  if (level === 1) {
    lines.push(
      `• Công thức tính khối lượng mol và số mol cho **${targetFormula}**: $M = \\sum (\\text{số nguyên tử} \\cdot M_{\\text{nguyên tố}})$ và $n = \\frac{m}{M}$.`,
    );
    lines.push(
      `• Khối lượng mol chuẩn của ${targetFormula}: $M = ${info.molarMass}\\text{ g/mol}$.`,
    );
    return lines.join('\n');
  }

  if (level === 2) {
    lines.push(
      `• Bước thiết lập khối lượng mol cho **${targetFormula}**: $M(${targetFormula}) = ${breakdownStr} = ${info.molarMass}\\text{ g/mol}$.`,
    );
    if (massMatch) {
      lines.push(
        `• Với khối lượng đề bài $m = ${massMatch[1]}\\text{ g}$, bạn áp dụng công thức $n = \\frac{m}{M}$ rồi tự thực hiện phép chia để ra số mol.`,
      );
    } else if (volMatch) {
      lines.push(
        `• Với thể tích khí $V = ${volMatch[1]}\\text{ lít}$, áp dụng $n = \\frac{V}{24{,}79}$ (ở đkc 25°C, 1 bar) hoặc $\\frac{V}{22{,}4}$ (nếu đề ghi đktc cũ).`,
      );
    }
    return lines.join('\n');
  }

  // Level 3
  lines.push(
    `• **Bước 1 (Tính khối lượng mol $M$):** $M(${targetFormula}) = ${breakdownStr} = ${info.molarMass}\\text{ g/mol}$.`,
  );
  if (massMatch) {
    const mVal = parseFloat(massMatch[1].replace(',', '.'));
    const mol = mVal / info.molarMass;
    lines.push(
      `• **Bước 2 (Thiết lập tỉ số số mol):** $n = \\frac{m}{M} = \\frac{${mVal}}{${info.molarMass}} \\approx ${mol.toFixed(4)}\\text{ mol}$.`,
    );
  } else if (volMatch) {
    const vVal = parseFloat(volMatch[1].replace(',', '.'));
    const molStd = vVal / 24.79;
    lines.push(
      `• **Bước 2 (Tính số mol khí ở đkc 25°C, 1 bar):** $n = \\frac{V}{24{,}79} = \\frac{${vVal}}{24{,}79} \\approx ${molStd.toFixed(4)}\\text{ mol}$.`,
    );
  } else {
    lines.push(
      `• **Bước 2 (Áp dụng tiếp):** Từ $M = ${info.molarMass}\\text{ g/mol}$, thay vào $n = \\frac{m}{M}$ hoặc $m = n \\cdot M$ theo dữ kiện đề bài.`,
    );
  }
  return lines.join('\n');
}

function parseLinearQuadraticExpr(side: string): { a: number; b: number; c: number } | null {
  let clean = side
    .replace(/²/g, '^2')
    .replace(/\s+/g, '')
    .replace(/,/g, '.');
  if (!clean) return null;
  if (!/^[0-9xX.+\-^*]+$/.test(clean)) return null;
  clean = clean.replace(/X/g, 'x').replace(/\*/g, '');
  if (!clean.startsWith('+') && !clean.startsWith('-')) {
    clean = '+' + clean;
  }

  const terms = clean.match(/[+-][^+-]+/g);
  if (!terms || terms.join('') !== clean) return null;

  let a = 0;
  let b = 0;
  let c = 0;

  for (const term of terms) {
    if (term.endsWith('x^2')) {
      const coeff = term.slice(0, -3);
      if (coeff === '+') a += 1;
      else if (coeff === '-') a -= 1;
      else {
        const v = Number(coeff);
        if (!Number.isFinite(v)) return null;
        a += v;
      }
    } else if (term.endsWith('x')) {
      const coeff = term.slice(0, -1);
      if (coeff === '+') b += 1;
      else if (coeff === '-') b -= 1;
      else {
        const v = Number(coeff);
        if (!Number.isFinite(v)) return null;
        b += v;
      }
    } else if (!term.includes('x') && !term.includes('^')) {
      const v = Number(term);
      if (!Number.isFinite(v)) return null;
      c += v;
    } else {
      return null;
    }
  }
  return { a, b, c };
}

export function solveAlgebraEquation(
  query: string,
  level: SupportLevel,
): string | null {
  const eqMatch = query.match(/([0-9xX²^.,+\-*\s]+=[0-9xX²^.,+\-*\s]+)/);
  if (!eqMatch) return null;

  const parts = eqMatch[1].split('=');
  if (parts.length !== 2) return null;
  const lhs = parseLinearQuadraticExpr(parts[0]);
  const rhs = parseLinearQuadraticExpr(parts[1]);
  if (!lhs || !rhs) return null;

  const a = Number((lhs.a - rhs.a).toFixed(6));
  const b = Number((lhs.b - rhs.b).toFixed(6));
  const c = Number((lhs.c - rhs.c).toFixed(6));

  if (a === 0 && b === 0) return null;

  if (a === 0) {
    // Linear equation bx + c = 0
    if (level === 1) {
      return `• Đây là **phương trình bậc nhất một ẩn** dạng $ax + b = 0$ ($a \\neq 0$), công thức nghiệm: $x = -\\frac{b}{a}$.`;
    }
    if (level === 2) {
      return (
        `• Đưa phương trình về dạng chuẩn: $${b}x ${c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`} = 0$.\n` +
        `• Chuyển hằng số sang vế phải rồi chia cả hai vế cho hệ số $${b}$ để tìm $x$.`
      );
    }
    const root = Number((-c / b).toFixed(4));
    return (
      `• **Bước 1 (Chuyển vế):** $${b}x = ${-c}$.\n` +
      `• **Bước 2 (Chia cho hệ số của $x$):** $x = \\frac{${-c}}{${b}}$.\n` +
      `• **Gợi ý đối chiếu:** Thực hiện phép chia trên bạn sẽ thu được $x = ${root}$ — hãy thử thay lại vào vế trái để kiểm chứng.`
    );
  }

  // Quadratic equation ax^2 + bx + c = 0
  const delta = Number((b * b - 4 * a * c).toFixed(6));
  if (level === 1) {
    return (
      `• Đây là **phương trình bậc hai một ẩn** $ax^2 + bx + c = 0$.\n` +
      `• Tính biệt thức $\\Delta = b^2 - 4ac$; nếu $\\Delta > 0$ dùng $x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$, kèm hệ thức Vi-ét $x_1 + x_2 = -\\frac{b}{a},\\; x_1 x_2 = \\frac{c}{a}$.`
    );
  }
  if (level === 2) {
    return (
      `• Xác định hệ số chuẩn: $a = ${a},\\; b = ${b},\\; c = ${c}$.\n` +
      `• Lập biểu thức biệt thức $\\Delta = (${b})^2 - 4\\cdot(${a})\\cdot(${c})$, sau đó xét dấu $\\Delta$ để áp dụng công thức nghiệm $x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$.`
    );
  }

  if (delta < 0) {
    return (
      `• **Bước 1 (Hệ số):** $a = ${a},\\; b = ${b},\\; c = ${c}$.\n` +
      `• **Bước 2 (Tính biệt thức):** $\\Delta = (${b})^2 - 4(${a})(${c}) = ${delta} < 0$.\n` +
      `• **Bước 3 (Kết luận):** Vì $\\Delta < 0$ nên phương trình vô nghiệm trên tập số thực $\\mathbb{R}$.`
    );
  }
  if (delta === 0) {
    const x0 = Number((-b / (2 * a)).toFixed(4));
    return (
      `• **Bước 1 (Hệ số):** $a = ${a},\\; b = ${b},\\; c = ${c}$.\n` +
      `• **Bước 2 (Tính biệt thức):** $\\Delta = ${delta} = 0$.\n` +
      `• **Bước 3 (Tính nghiệm kép):** $x_1 = x_2 = \\frac{-b}{2a} = \\frac{${-b}}{${2 * a}} = ${x0}$.`
    );
  }

  const sqrtD = Math.sqrt(delta);
  const x1 = Number(((-b + sqrtD) / (2 * a)).toFixed(4));
  const x2 = Number(((-b - sqrtD) / (2 * a)).toFixed(4));
  return (
    `• **Bước 1 (Hệ số):** $a = ${a},\\; b = ${b},\\; c = ${c}$.\n` +
    `• **Bước 2 (Tính biệt thức):** $\\Delta = (${b})^2 - 4(${a})(${c}) = ${delta} > 0$ (phương trình có 2 nghiệm phân biệt).\n` +
    `• **Bước 3 (Áp dụng công thức nghiệm & kiểm tra Vi-ét):** $x_{1,2} = \\frac{${-b} \\pm \\sqrt{${delta}}}{${2 * a}} \\Rightarrow x_1 = ${x1},\\; x_2 = ${x2}$ (kiểm tra tổng $S = ${Number((-b / a).toFixed(4))}$, tích $P = ${Number((c / a).toFixed(4))}$).`
  );
}

// Safe recursive-descent math expression evaluator (no eval / Function)
export function evaluateMathExpression(rawExpr: string): number | null {
  const expr = rawExpr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/,/g, '.')
    .replace(/\s+/g, '');

  if (!expr || expr.length > 80) return null;
  let pos = 0;

  function peek(): string {
    return expr[pos] ?? '';
  }

  function parseExpression(): number {
    let val = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = expr[pos++];
      const right = parseTerm();
      val = op === '+' ? val + right : val - right;
    }
    return val;
  }

  function parseTerm(): number {
    let val = parsePower();
    while (peek() === '*' || peek() === '/') {
      const op = expr[pos++];
      const right = parsePower();
      if (op === '/') {
        if (Math.abs(right) < 1e-12) throw new Error('div0');
        val = val / right;
      } else {
        val = val * right;
      }
    }
    return val;
  }

  function parsePower(): number {
    const base = parseUnary();
    if (peek() === '^') {
      pos++;
      const exp = parsePower();
      return Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary(): number {
    if (peek() === '+') {
      pos++;
      return parseUnary();
    }
    if (peek() === '-') {
      pos++;
      return -parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    if (peek() === '(') {
      pos++;
      const inner = parseExpression();
      if (peek() !== ')') throw new Error('paren');
      pos++;
      return inner;
    }

    // Function or constant
    const fnMatch = expr.slice(pos).match(/^(sqrt|abs|sin|cos|tan|log|ln|pi|e)/i);
    if (fnMatch) {
      const name = fnMatch[1].toLowerCase();
      pos += name.length;
      if (name === 'pi') return Math.PI;
      if (name === 'e') return Math.E;
      if (peek() !== '(') throw new Error('fnarg');
      pos++;
      const arg = parseExpression();
      if (peek() !== ')') throw new Error('paren');
      pos++;
      switch (name) {
        case 'sqrt':
          if (arg < 0) throw new Error('domain');
          return Math.sqrt(arg);
        case 'abs':
          return Math.abs(arg);
        case 'sin':
          return Math.sin(arg);
        case 'cos':
          return Math.cos(arg);
        case 'tan':
          return Math.tan(arg);
        case 'log':
          if (arg <= 0) throw new Error('domain');
          return Math.log10(arg);
        case 'ln':
          if (arg <= 0) throw new Error('domain');
          return Math.log(arg);
      }
    }

    const numMatch = expr.slice(pos).match(/^\d+(?:\.\d+)?/);
    if (!numMatch) throw new Error('token');
    pos += numMatch[0].length;
    return parseFloat(numMatch[0]);
  }

  try {
    const result = parseExpression();
    if (pos !== expr.length || !Number.isFinite(result)) return null;
    return Number(result.toFixed(6));
  } catch {
    return null;
  }
}

export function solveArithmeticQuery(query: string): string | null {
  // Ignore equations with variables like x, y
  if (/[=<>]/.test(query) && /[a-zA-Z]/.test(query.replace(/(sqrt|abs|sin|cos|tan|log|ln|pi|tính|giá trị|bằng|bao nhiêu)/gi, ''))) {
    return null;
  }
  const mathSegment = query.match(/([0-9(][\d+\-*/^().,×÷−\s]*(?:sqrt|sin|cos|tan|log|ln|pi|\d)[0-9)\d+\-*/^().,×÷−\s]*)/i);
  if (!mathSegment) return null;
  const candidate = mathSegment[1].trim();
  if (!/[+\-*/^×÷]/.test(candidate) && !/^(sqrt|sin|cos|tan|log|ln)/i.test(candidate)) {
    return null;
  }
  const value = evaluateMathExpression(candidate);
  if (value === null) return null;
  return `• **Tính toán biểu thức:** $${candidate.replace(/\*/g, '\\cdot ')} = ${value}$`;
}
