import type { PhysicsSimulationSpec } from '../types/physics';
import { drawArrow, drawLabel, drawStageBackground } from './canvasHelpers';

export const GROUP_J_SIMULATIONS: PhysicsSimulationSpec[] = [
  {
    id: 'phys-46',
    orderNumber: 46,
    name: 'Phản xạ ánh sáng trên gương phẳng',
    groupId: 'J',
    groupName: 'Quang học',
    suggestedGrades: [7, 9],
    isTimeDependent: false,
    previewType: 'optics',
    status: 'implemented',
    parameters: [
      { key: 'i', label: 'Góc tới so với phương thẳng đứng', unit: '°', min: 5, max: 70, step: 1, defaultValue: 35 },
      { key: 'mirrorAngle', label: 'Góc nghiêng gương α', unit: '°', min: -20, max: 20, step: 1, defaultValue: 0 },
    ],
    formulasLatex: ["i' = i", '\\text{Khi gương quay góc } \\alpha \\text{ thì tia phản xạ quay góc } 2\\alpha'],
    explanationVi:
      'Định luật phản xạ ánh sáng: Tia phản xạ nằm trong mặt phẳng chứa tia tới và pháp tuyến tại điểm tới; góc phản xạ i\' luôn bằng góc tới i. Khi gương quay một góc α, pháp tuyến quay góc α nên tia phản xạ quay một góc 2α.',
    assumptionsAndLimits: ['Gương phẳng phản xạ gương lý tưởng 100%.'],
    stepAndRender: (ctx, w, h, _t, params) => {
      const incidentVertDeg = params.i ?? 35;
      const alphaDeg = params.mirrorAngle ?? 0;
      const effectiveIncidentDeg = incidentVertDeg + alphaDeg;
      const radIn = (incidentVertDeg * Math.PI) / 180;
      const radAlpha = (alphaDeg * Math.PI) / 180;
      const radRefl = ((effectiveIncidentDeg + alphaDeg) * Math.PI) / 180;
      const ox = w * 0.5;
      const oy = h * 0.72;
      drawStageBackground(ctx, w, h, ox, oy, false);

      // Mirror rotated by alpha
      const mHalf = 190;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ox - mHalf * Math.cos(radAlpha), oy - mHalf * Math.sin(radAlpha));
      ctx.lineTo(ox + mHalf * Math.cos(radAlpha), oy + mHalf * Math.sin(radAlpha));
      ctx.stroke();

      // Normal rotated by alpha
      ctx.strokeStyle = '#64748b';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + 180 * Math.sin(radAlpha), oy - 180 * Math.cos(radAlpha));
      ctx.stroke();
      ctx.setLineDash([]);

      const rayLen = 185;
      const ix = ox - rayLen * Math.sin(radIn);
      const iy = oy - rayLen * Math.cos(radIn);
      const rx = ox + rayLen * Math.sin(radRefl);
      const ry = oy - rayLen * Math.cos(radRefl);

      drawArrow(ctx, ix, iy, ox, oy, '#facc15', `Tia tới`, 2.5);
      drawArrow(ctx, ox, oy, rx, ry, '#38bdf8', `i'=${Math.abs(effectiveIncidentDeg).toFixed(0)}°`, 2.5);

      return {
        readings: [
          { label: 'Góc tới i (với pháp tuyến)', value: `${Math.abs(effectiveIncidentDeg).toFixed(1)}`, unit: '°' },
          { label: 'Góc phản xạ i\'', value: `${Math.abs(effectiveIncidentDeg).toFixed(1)}`, unit: '°' },
          { label: 'Độ lệch tia phản xạ (2α)', value: `${(2 * alphaDeg).toFixed(1)}`, unit: '°' },
        ],
      };
    },
  },
  {
    id: 'phys-47',
    orderNumber: 47,
    name: 'Khúc xạ ánh sáng tại mặt phân cách hai môi trường',
    groupId: 'J',
    groupName: 'Quang học',
    suggestedGrades: [9, 11],
    isTimeDependent: false,
    previewType: 'optics',
    status: 'implemented',
    parameters: [
      { key: 'i', label: 'Góc tới i', unit: '°', min: 0, max: 85, step: 1, defaultValue: 40 },
      { key: 'n1', label: 'Chiết suất môi trường 1 (n₁)', unit: '', min: 1.0, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { key: 'n2', label: 'Chiết suất môi trường 2 (n₂)', unit: '', min: 1.0, max: 2.0, step: 0.05, defaultValue: 1.5 },
    ],
    formulasLatex: ['n_1 \\sin i = n_2 \\sin r'],
    explanationVi:
      'Định luật khúc xạ ánh sáng (Snell–Descartes): Khi tia sáng truyền xiên góc qua mặt phân cách hai môi trường trong suốt khác chiết suất, tia khúc xạ bị gãy khúc tuân theo n₁·sin(i) = n₂·sin(r).',
    assumptionsAndLimits: ['Tia sáng đơn sắc, mặt phân cách phẳng nằm ngang.'],
    stepAndRender: (ctx, w, h, _t, params) => {
      const iDeg = params.i ?? 40;
      const n1 = params.n1 ?? 1.0;
      const n2 = params.n2 ?? 1.5;
      const radI = (iDeg * Math.PI) / 180;
      const sinR = (n1 * Math.sin(radI)) / n2;
      const isTIR = sinR > 1;
      const radR = isTIR ? radI : Math.asin(sinR);
      const rDeg = (radR * 180) / Math.PI;

      const ox = w * 0.5;
      const oy = h * 0.5;
      drawStageBackground(ctx, w, h, ox, oy, false);

      ctx.fillStyle = 'rgba(14, 165, 233, 0.14)';
      ctx.fillRect(0, oy, w, h - oy);
      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(0, oy);
      ctx.lineTo(w, oy);
      ctx.stroke();

      ctx.strokeStyle = '#64748b';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ox, 20);
      ctx.lineTo(ox, h - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      const len = 140;
      drawArrow(ctx, ox - len * Math.sin(radI), oy - len * Math.cos(radI), ox, oy, '#facc15', `i=${iDeg}°`);
      if (isTIR) {
        drawArrow(ctx, ox, oy, ox + len * Math.sin(radI), oy - len * Math.cos(radI), '#f43f5e', 'Phản xạ toàn phần');
      } else {
        drawArrow(ctx, ox, oy, ox + len * Math.sin(radR), oy + len * Math.cos(radR), '#10b981', `r=${rDeg.toFixed(1)}°`);
      }

      return {
        readings: [
          { label: 'Góc tới i', value: `${iDeg}`, unit: '°' },
          { label: 'Góc khúc xạ r', value: isTIR ? 'Không có (PXTP)' : rDeg.toFixed(2), unit: isTIR ? '' : '°' },
          { label: 'Góc lệch D', value: isTIR ? `${180 - 2 * iDeg}` : Math.abs(iDeg - rDeg).toFixed(2), unit: '°' },
        ],
      };
    },
  },
  {
    id: 'phys-48',
    orderNumber: 48,
    name: 'Hiện tượng phản xạ toàn phần',
    groupId: 'J',
    groupName: 'Quang học',
    suggestedGrades: [9, 11],
    isTimeDependent: false,
    previewType: 'optics',
    status: 'implemented',
    parameters: [
      { key: 'i', label: 'Góc tới i', unit: '°', min: 5, max: 85, step: 1, defaultValue: 48 },
      { key: 'n1', label: 'Chiết suất môi trường tới n₁', unit: '', min: 1.2, max: 2.0, step: 0.05, defaultValue: 1.5 },
      { key: 'n2', label: 'Chiết suất môi trường khúc xạ n₂', unit: '', min: 1.0, max: 1.5, step: 0.05, defaultValue: 1.0 },
    ],
    formulasLatex: ['\\sin i_{gh} = \\frac{n_2}{n_1} \\; (n_1 > n_2)'],
    explanationVi:
      'Phản xạ toàn phần xảy ra khi ánh sáng truyền từ môi trường chiết quang hơn sang môi trường kém chiết quang hơn (n₁ > n₂) với góc tới i ≥ i_gh.',
    assumptionsAndLimits: ['Mặt phân cách phẳng sạch, n₁ > n₂ để có góc giới hạn i_gh.'],
    stepAndRender: (ctx, w, h, _t, params) => {
      const iDeg = params.i ?? 48;
      const n1 = params.n1 ?? 1.5;
      const n2 = params.n2 ?? 1.0;
      const canTIR = n1 > n2;
      const iCritDeg = canTIR ? (Math.asin(n2 / n1) * 180) / Math.PI : 90;
      const radI = (iDeg * Math.PI) / 180;
      const sinR = (n1 * Math.sin(radI)) / n2;
      const isTIR = sinR >= 1;

      const ox = w * 0.5;
      const oy = h * 0.5;
      drawStageBackground(ctx, w, h, ox, oy, false);
      ctx.fillStyle = 'rgba(14, 165, 233, 0.16)';
      ctx.fillRect(0, oy, w, h - oy);
      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(0, oy);
      ctx.lineTo(w, oy);
      ctx.stroke();

      const len = 140;
      drawArrow(ctx, ox - len * Math.sin(radI), oy + len * Math.cos(radI), ox, oy, '#facc15', `i=${iDeg}°`);
      if (isTIR) {
        drawArrow(ctx, ox, oy, ox + len * Math.sin(radI), oy + len * Math.cos(radI), '#f43f5e', 'Phản xạ toàn phần');
      } else {
        const radR = Math.asin(sinR);
        drawArrow(ctx, ox, oy, ox + len * Math.sin(radR), oy - len * Math.cos(radR), '#10b981', `r=${((radR * 180) / Math.PI).toFixed(1)}°`);
      }

      return {
        readings: [
          { label: 'Góc tới i', value: `${iDeg.toFixed(1)}`, unit: '°' },
          { label: 'Góc giới hạn i_gh', value: canTIR ? iCritDeg.toFixed(2) : 'Không tồn tại (n₁≤n₂)', unit: canTIR ? '°' : '' },
          { label: 'Hiện tượng', value: isTIR ? 'Phản xạ toàn phần' : 'Có tia khúc xạ', unit: '' },
        ],
      };
    },
  },
  {
    id: 'phys-49',
    orderNumber: 49,
    name: 'Sự tạo ảnh qua thấu kính hội tụ mỏng',
    groupId: 'J',
    groupName: 'Quang học',
    suggestedGrades: [9, 11],
    isTimeDependent: false,
    previewType: 'optics',
    status: 'implemented',
    parameters: [
      { key: 'f', label: 'Tiêu cự f', unit: 'cm', min: 10, max: 35, step: 1, defaultValue: 20 },
      { key: 'd', label: 'Khoảng cách vật d', unit: 'cm', min: 8, max: 70, step: 1, defaultValue: 35 },
      { key: 'hObj', label: 'Chiều cao vật AB', unit: 'cm', min: 2, max: 10, step: 0.5, defaultValue: 6 },
    ],
    formulasLatex: ['\\frac{1}{f} = \\frac{1}{d} + \\frac{1}{d\'}', 'k = -\\frac{d\'}{d}'],
    explanationVi:
      'Tia sáng song song trục chính qua thấu kính hội tụ cho tia ló đi qua tiêu điểm ảnh chính F\'; tia qua quang tâm O truyền thẳng. Khi d > f cho ảnh thật ngược chiều; khi d < f cho ảnh ảo cùng chiều lớn hơn vật.',
    assumptionsAndLimits: ['Thấu kính mỏng lý tưởng, vật đặt vuông góc trục chính và thỏa điều kiện gần trục.'],
    stepAndRender: (ctx, w, h, _t, params) => {
      const f = params.f ?? 20;
      const d = params.d ?? 35;
      const hObj = params.hObj ?? 6;
      const atFocus = Math.abs(d - f) < 0.1;
      const dp = atFocus ? 9999 : (d * f) / (d - f);
      const k = -dp / d;
      const hImg = hObj * k;

      const ox = w * 0.5;
      const oy = h * 0.55;
      const sc = 4.5;
      drawStageBackground(ctx, w, h, ox, oy, false);

      // Principal axis & Lens
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(20, oy);
      ctx.lineTo(w - 20, oy);
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ox, oy - 110);
      ctx.lineTo(ox, oy + 110);
      ctx.stroke();

      // Foci
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(ox - f * sc, oy, 4, 0, Math.PI * 2);
      ctx.arc(ox + f * sc, oy, 4, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, 'F', ox - f * sc, oy + 16, '#facc15', 'center');
      drawLabel(ctx, "F'", ox + f * sc, oy + 16, '#facc15', 'center');

      // Object AB
      const ax = ox - d * sc;
      const by = oy - hObj * sc;
      drawArrow(ctx, ax, oy, ax, by, '#10b981', 'B');

      // Ray 1: parallel then through F'
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ax, by);
      ctx.lineTo(ox, by);
      if (!atFocus) {
        ctx.lineTo(ox + dp * sc, oy - hImg * sc);
      }
      ctx.stroke();

      // Ray 2: through O
      ctx.beginPath();
      ctx.moveTo(ax, by);
      if (!atFocus) {
        ctx.lineTo(ox + dp * sc, oy - hImg * sc);
      } else {
        ctx.lineTo(w - 30, oy + ((w - 30 - ox) * (oy - by)) / (ox - ax));
      }
      ctx.stroke();

      // Image
      if (!atFocus && Math.abs(dp) < 120) {
        const ix = ox + dp * sc;
        const iy = oy - hImg * sc;
        drawArrow(ctx, ix, oy, ix, iy, dp > 0 ? '#f43f5e' : '#a855f7', dp > 0 ? "B' (Thật)" : "B' (Ảo)");
      }

      return {
        readings: [
          { label: "Vị trí ảnh d'", value: atFocus ? '∞' : dp.toFixed(2), unit: atFocus ? '' : 'cm' },
          { label: 'Độ phóng đại k', value: atFocus ? '∞' : k.toFixed(2), unit: '' },
          { label: 'Tính chất ảnh', value: atFocus ? 'Ở vô cực' : dp > 0 ? 'Ảnh thật, ngược chiều' : 'Ảnh ảo, cùng chiều', unit: '' },
        ],
      };
    },
  },
  {
    id: 'phys-50',
    orderNumber: 50,
    name: 'Sự tạo ảnh qua gương cầu lõm',
    groupId: 'J',
    groupName: 'Quang học',
    suggestedGrades: [8, 11],
    isTimeDependent: false,
    previewType: 'optics',
    status: 'implemented',
    parameters: [
      { key: 'R', label: 'Bán kính cong R', unit: 'cm', min: 20, max: 60, step: 2, defaultValue: 40 },
      { key: 'd', label: 'Khoảng cách vật d', unit: 'cm', min: 8, max: 80, step: 1, defaultValue: 30 },
      { key: 'hObj', label: 'Chiều cao vật AB', unit: 'cm', min: 2, max: 10, step: 0.5, defaultValue: 6 },
    ],
    formulasLatex: ['f = \\frac{R}{2}', '\\frac{1}{f} = \\frac{1}{d} + \\frac{1}{d\'}', 'k = -\\frac{d\'}{d}'],
    explanationVi:
      'Gương cầu lõm có tiêu cự f = R/2. Tia tới song song trục chính cho tia phản xạ đi qua tiêu điểm F; tia tới qua F cho tia phản xạ song song trục chính.',
    assumptionsAndLimits: ['Gương cầu mở nhỏ, chùm tia cận trục (paraxial).'],
    stepAndRender: (ctx, w, h, _t, params) => {
      const R = params.R ?? 40;
      const f = R / 2;
      const d = params.d ?? 30;
      const hObj = params.hObj ?? 6;
      const atFocus = Math.abs(d - f) < 0.1;
      const dp = atFocus ? 9999 : (d * f) / (d - f);
      const k = -dp / d;
      const hImg = hObj * k;

      const mirrorX = w * 0.72;
      const oy = h * 0.55;
      const sc = 4.2;
      drawStageBackground(ctx, w, h, mirrorX, oy, false);

      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(20, oy);
      ctx.lineTo(w - 20, oy);
      ctx.stroke();

      // Concave mirror arc
      const arcR = R * sc;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(mirrorX - arcR, oy, arcR, -0.45, 0.45);
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(mirrorX - f * sc, oy, 4, 0, Math.PI * 2);
      ctx.arc(mirrorX - R * sc, oy, 4, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, 'F', mirrorX - f * sc, oy + 16, '#facc15', 'center');
      drawLabel(ctx, 'C', mirrorX - R * sc, oy + 16, '#facc15', 'center');

      const ax = mirrorX - d * sc;
      const by = oy - hObj * sc;
      drawArrow(ctx, ax, oy, ax, by, '#10b981', 'B');

      if (!atFocus && Math.abs(dp) < 130) {
        const ix = mirrorX - dp * sc;
        const iy = oy - hImg * sc;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ax, by);
        ctx.lineTo(mirrorX, by);
        ctx.lineTo(ix, iy);
        ctx.moveTo(ax, by);
        ctx.lineTo(mirrorX, oy);
        ctx.lineTo(ix, iy);
        ctx.stroke();
        drawArrow(ctx, ix, oy, ix, iy, dp > 0 ? '#f43f5e' : '#a855f7', dp > 0 ? "B' (Thật)" : "B' (Ảo)");
      }

      return {
        readings: [
          { label: 'Tiêu cự f = R/2', value: f.toFixed(1), unit: 'cm' },
          { label: "Vị trí ảnh d'", value: atFocus ? '∞' : dp.toFixed(2), unit: atFocus ? '' : 'cm' },
          { label: 'Tính chất ảnh', value: atFocus ? 'Ở vô cực' : dp > 0 ? 'Ảnh thật, ngược chiều' : 'Ảnh ảo, cùng chiều', unit: '' },
        ],
      };
    },
  },
];
