import type { PhysicsSimulationSpec } from '../types/physics';
import { drawLabel, drawStageBackground } from './canvasHelpers';

export const GROUP_G_SIMULATIONS: PhysicsSimulationSpec[] = [
  {
    id: 'phys-31',
    orderNumber: 31,
    name: 'Quá trình đẳng nhiệt của khí lý tưởng',
    groupId: 'G',
    groupName: 'Nhiệt học',
    suggestedGrades: [12],
    isTimeDependent: false,
    previewType: 'thermo',
    status: 'implemented',
    parameters: [
      { key: 'V', label: 'Thể tích V', unit: 'L', min: 1, max: 10, step: 0.5, defaultValue: 4 },
      { key: 'T', label: 'Nhiệt độ cố định T', unit: 'K', min: 200, max: 600, step: 20, defaultValue: 300 },
      { key: 'n', label: 'Số mol khí n', unit: 'mol', min: 0.5, max: 3, step: 0.25, defaultValue: 1 },
    ],
    formulasLatex: ['p \\cdot V = n R T = \\text{const}', 'p_1 V_1 = p_2 V_2'],
    explanationVi:
      'Định luật Boyle: Ở nhiệt độ không đổi, áp suất của một lượng khí xác định tỉ lệ nghịch với thể tích của nó. Đường đẳng nhiệt trong hệ tọa độ (p, V) là đường hypebol.',
    assumptionsAndLimits: ['Khí lý tưởng, quá trình biến đổi chuẩn tĩnh giữ nhiệt độ T không đổi.'],
    stepAndRender: (ctx, w, h, _t, params, history) => {
      const V = params.V ?? 4;
      const T = params.T ?? 300;
      const n = params.n ?? 1;
      const R = 0.0821; // L·atm/(mol·K)
      const pAtm = (n * R * T) / V;
      const pkPa = pAtm * 101.325;

      drawStageBackground(ctx, w, h, 40, h - 24, false);
      const cylX = 180;
      const cylY = 90;
      const cylW = 360;
      const cylH = 140;
      const pistonX = cylX + (V / 10) * (cylW - 40) + 20;

      ctx.fillStyle = `rgba(14, 165, 233, ${Math.min(0.65, 0.15 + pAtm * 0.04)})`;
      ctx.fillRect(cylX, cylY, pistonX - cylX, cylH);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.strokeRect(cylX, cylY, cylW, cylH);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(pistonX, cylY + 2, 16, cylH - 4);
      drawLabel(ctx, `V = ${V.toFixed(1)} L | p = ${pAtm.toFixed(2)} atm`, cylX, cylY - 12, '#e2e8f0');

      const pts: { x: number; y: number }[] = [];
      for (let vs = 1; vs <= 10; vs += 0.5) {
        pts.push({ x: vs, y: Number(((n * R * T) / vs).toFixed(2)) });
      }
      history.length = 0;
      history.push(...pts);

      return {
        readings: [
          { label: 'Áp suất p (atm)', value: pAtm.toFixed(2), unit: 'atm' },
          { label: 'Áp suất p (kPa)', value: pkPa.toFixed(1), unit: 'kPa' },
          { label: 'Tích p·V', value: (pAtm * V).toFixed(2), unit: 'L·atm' },
        ],
        graphSeries: { title: 'Đường đẳng nhiệt p(V)', xLabel: 'V (L)', yLabel: 'p (atm)', points: pts },
      };
    },
  },
  {
    id: 'phys-32',
    orderNumber: 32,
    name: 'Quá trình đẳng áp của khí lý tưởng',
    groupId: 'G',
    groupName: 'Nhiệt học',
    suggestedGrades: [12],
    isTimeDependent: false,
    previewType: 'thermo',
    status: 'implemented',
    parameters: [
      { key: 'T', label: 'Nhiệt độ tuyệt đối T', unit: 'K', min: 200, max: 600, step: 10, defaultValue: 300 },
      { key: 'p', label: 'Áp suất không đổi p', unit: 'atm', min: 0.5, max: 3, step: 0.25, defaultValue: 1 },
      { key: 'n', label: 'Số mol n', unit: 'mol', min: 0.5, max: 2, step: 0.25, defaultValue: 1 },
    ],
    formulasLatex: ['\\frac{V}{T} = \\frac{n R}{p} = \\text{const}'],
    explanationVi:
      'Định luật Charles: Khi giữ áp suất không đổi, thể tích của một lượng khí tỉ lệ thuận với nhiệt độ tuyệt đối T (tính theo thang Kelvin).',
    assumptionsAndLimits: ['Khí lý tưởng, piston chuyển động tự do không ma sát giữ áp suất p không đổi.'],
    stepAndRender: (ctx, w, h, _t, params, history) => {
      const T = params.T ?? 300;
      const p = params.p ?? 1;
      const n = params.n ?? 1;
      const R = 0.0821;
      const V = (n * R * T) / p;

      drawStageBackground(ctx, w, h, 40, h - 24, false);
      const cylX = 180;
      const cylY = 90;
      const cylW = 380;
      const cylH = 140;
      const frac = Math.min(0.92, Math.max(0.1, V / 80));
      const pistonX = cylX + frac * cylW;

      ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.fillRect(cylX, cylY, pistonX - cylX, cylH);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.strokeRect(cylX, cylY, cylW, cylH);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(pistonX, cylY + 2, 14, cylH - 4);
      drawLabel(ctx, `T = ${T} K (${(T - 273.15).toFixed(0)} °C) → V = ${V.toFixed(2)} L`, cylX, cylY - 12, '#e2e8f0');

      const pts: { x: number; y: number }[] = [];
      for (let ts = 200; ts <= 600; ts += 25) {
        pts.push({ x: ts, y: Number(((n * R * ts) / p).toFixed(2)) });
      }
      history.length = 0;
      history.push(...pts);

      return {
        readings: [
          { label: 'Thể tích V', value: V.toFixed(2), unit: 'L' },
          { label: 'Tỉ số V / T', value: (V / T).toFixed(4), unit: 'L/K' },
        ],
        graphSeries: { title: 'Đường đẳng áp V(T)', xLabel: 'T (K)', yLabel: 'V (L)', points: pts },
      };
    },
  },
  {
    id: 'phys-33',
    orderNumber: 33,
    name: 'Quá trình đẳng tích của khí lý tưởng',
    groupId: 'G',
    groupName: 'Nhiệt học',
    suggestedGrades: [12],
    isTimeDependent: false,
    previewType: 'thermo',
    status: 'implemented',
    parameters: [
      { key: 'T', label: 'Nhiệt độ T', unit: 'K', min: 200, max: 700, step: 10, defaultValue: 320 },
      { key: 'V', label: 'Thể tích bình kín V', unit: 'L', min: 5, max: 30, step: 1, defaultValue: 15 },
      { key: 'n', label: 'Số mol n', unit: 'mol', min: 0.5, max: 3, step: 0.25, defaultValue: 1 },
    ],
    formulasLatex: ['\\frac{p}{T} = \\frac{n R}{V} = \\text{const}'],
    explanationVi:
      'Trong bình kín có thể tích không đổi, áp suất chất khí tỉ lệ thuận với nhiệt độ tuyệt đối T do động năng trung bình của phân tử tăng lên theo T.',
    assumptionsAndLimits: ['Bình kín tuyệt đối cứng, giãn nở nhiệt của vỏ bình không đáng kể.'],
    stepAndRender: (ctx, w, h, _t, params, history) => {
      const T = params.T ?? 320;
      const V = params.V ?? 15;
      const n = params.n ?? 1;
      const R = 0.0821;
      const p = (n * R * T) / V;

      drawStageBackground(ctx, w, h, 40, h - 24, false);
      const bx = w * 0.5 - 110;
      const by = 70;
      const bw = 220;
      const bh = 180;
      ctx.fillStyle = `rgba(244, 63, 94, ${Math.min(0.6, 0.1 + (T - 200) / 800)})`;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.strokeRect(bx, by, bw, bh);
      drawLabel(ctx, `p = ${p.toFixed(2)} atm`, w * 0.5, by + bh / 2, '#ffffff', 'center');

      const pts: { x: number; y: number }[] = [];
      for (let ts = 200; ts <= 700; ts += 25) {
        pts.push({ x: ts, y: Number(((n * R * ts) / V).toFixed(2)) });
      }
      history.length = 0;
      history.push(...pts);

      return {
        readings: [
          { label: 'Áp suất p', value: p.toFixed(2), unit: 'atm' },
          { label: 'Tỉ số p / T', value: (p / T).toFixed(5), unit: 'atm/K' },
        ],
        graphSeries: { title: 'Đường đẳng tích p(T)', xLabel: 'T (K)', yLabel: 'p (atm)', points: pts },
      };
    },
  },
  {
    id: 'phys-34',
    orderNumber: 34,
    name: 'Trao đổi nhiệt giữa hai vật',
    groupId: 'G',
    groupName: 'Nhiệt học',
    suggestedGrades: [8, 12],
    isTimeDependent: true,
    previewType: 'thermo',
    status: 'implemented',
    parameters: [
      { key: 'm1', label: 'Khối lượng vật nóng m₁', unit: 'kg', min: 0.5, max: 5, step: 0.5, defaultValue: 1 },
      { key: 'T1', label: 'Nhiệt độ đầu t₁', unit: '°C', min: 40, max: 100, step: 5, defaultValue: 80 },
      { key: 'm2', label: 'Khối lượng nước lạnh m₂', unit: 'kg', min: 0.5, max: 5, step: 0.5, defaultValue: 2 },
      { key: 'T2', label: 'Nhiệt độ đầu t₂', unit: '°C', min: 10, max: 40, step: 2, defaultValue: 20 },
    ],
    formulasLatex: ['Q_{\\text{tỏa}} = Q_{\\text{thu}}', 't_{cb} = \\frac{m_1 c_1 t_1 + m_2 c_2 t_2}{m_1 c_1 + m_2 c_2}'],
    explanationVi:
      'Khi hai vật có nhiệt độ khác nhau tiếp xúc trong hệ cô lập, nhiệt năng truyền từ vật nóng sang vật lạnh cho đến khi đạt cùng nhiệt độ cân bằng t_cb.',
    assumptionsAndLimits: ['Lấy nhiệt dung riêng c₁ = c₂ = 4180 J/(kg·K) để khảo sát định lượng rõ ràng, bỏ qua tỏa nhiệt ra môi trường.'],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const m1 = params.m1 ?? 1;
      const T10 = params.T1 ?? 80;
      const m2 = params.m2 ?? 2;
      const T20 = params.T2 ?? 20;
      const c = 4180;
      const Teq = (m1 * T10 + m2 * T20) / (m1 + m2);
      const decay = Math.exp(-t * 0.45);
      const T1t = Teq + (T10 - Teq) * decay;
      const T2t = Teq + (T20 - Teq) * decay;
      const Q = m1 * c * (T10 - T1t);

      drawStageBackground(ctx, w, h, 40, h - 24, false);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(180, 90, 160, 150);
      drawLabel(ctx, `Vật 1: ${T1t.toFixed(1)} °C`, 260, 170, '#ffffff', 'center');

      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(340, 90, 160, 150);
      drawLabel(ctx, `Vật 2: ${T2t.toFixed(1)} °C`, 420, 170, '#ffffff', 'center');

      history.push({ x: Number(t.toFixed(2)), y: Number(T1t.toFixed(2)) });
      return {
        readings: [
          { label: 'Nhiệt độ vật 1', value: T1t.toFixed(1), unit: '°C' },
          { label: 'Nhiệt độ vật 2', value: T2t.toFixed(1), unit: '°C' },
          { label: 'Nhiệt độ cân bằng t_cb', value: Teq.toFixed(1), unit: '°C' },
          { label: 'Nhiệt lượng trao đổi Q', value: (Q / 1000).toFixed(1), unit: 'kJ' },
        ],
        graphSeries: { title: 'Nhiệt độ vật nóng t₁(t)', xLabel: 't (s)', yLabel: 't₁ (°C)', points: history.slice(-150) },
      };
    },
  },
  {
    id: 'phys-35',
    orderNumber: 35,
    name: 'Truyền nhiệt bằng dẫn nhiệt trong vật rắn',
    groupId: 'G',
    groupName: 'Nhiệt học',
    suggestedGrades: [8, 12],
    isTimeDependent: true,
    previewType: 'thermo',
    status: 'implemented',
    parameters: [
      { key: 'k', label: 'Hệ số dẫn nhiệt k', unit: 'W/(m·K)', min: 20, max: 400, step: 20, defaultValue: 200 },
      { key: 'Thot', label: 'Nhiệt độ đầu nóng T_nóng', unit: '°C', min: 50, max: 200, step: 10, defaultValue: 120 },
      { key: 'Tcold', label: 'Nhiệt độ đầu lạnh T_lạnh', unit: '°C', min: 0, max: 40, step: 5, defaultValue: 20 },
    ],
    formulasLatex: ['\\Phi = \\frac{\\Delta Q}{\\Delta t} = k A \\frac{T_{\\text{nóng}} - T_{\\text{lạnh}}}{L}'],
    explanationVi:
      'Nhiệt truyền dọc theo thanh kim loại từ đầu nóng sang đầu lạnh mà không có sự dịch chuyển vĩ mô của vật chất. Dòng nhiệt tỉ lệ với độ dẫn nhiệt k và hiệu nhiệt độ.',
    assumptionsAndLimits: ['Thanh tiết diện đều A = 0.01 m², chiều dài L = 0.5 m, cách nhiệt mặt bên.'],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const k = params.k ?? 200;
      const Thot = params.Thot ?? 120;
      const Tcold = params.Tcold ?? 20;
      const A = 0.01;
      const L = 0.5;
      const flux = (k * A * (Thot - Tcold)) / L;

      drawStageBackground(ctx, w, h, 40, h - 24, false);
      const segs = 24;
      const barX = 110;
      const barW = w - 220;
      const barY = 120;
      const segW = barW / segs;
      const alpha = (k / 400) * 0.6;
      const prog = Math.min(1, 1 - Math.exp(-t * (0.3 + alpha)));

      for (let i = 0; i < segs; i++) {
        const frac = i / (segs - 1);
        const steadyT = Thot - (Thot - Tcold) * frac;
        const curT = Tcold + (steadyT - Tcold) * (1 - frac * (1 - prog));
        const ratio = Math.max(0, Math.min(1, (curT - Tcold) / Math.max(1, Thot - Tcold)));
        const r = Math.round(50 + ratio * 200);
        const b = Math.round(230 - ratio * 180);
        ctx.fillStyle = `rgb(${r}, 70, ${b})`;
        ctx.fillRect(barX + i * segW, barY, segW + 1, 70);
      }
      drawLabel(ctx, `${Thot} °C`, barX, barY - 12, '#fca5a5');
      drawLabel(ctx, `${Tcold} °C`, barX + barW, barY - 12, '#93c5fd', 'right');

      history.push({ x: Number(t.toFixed(2)), y: Number(flux.toFixed(1)) });
      return {
        readings: [
          { label: 'Công suất dẫn nhiệt Φ', value: flux.toFixed(1), unit: 'W' },
          { label: 'Độ dẫn nhiệt k', value: `${k}`, unit: 'W/(m·K)' },
        ],
        graphSeries: { title: 'Dòng nhiệt ổn định Φ', xLabel: 't (s)', yLabel: 'Φ (W)', points: history.slice(-120) },
      };
    },
  },
];
