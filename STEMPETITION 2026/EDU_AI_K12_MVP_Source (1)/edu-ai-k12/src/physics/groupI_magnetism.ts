import type { PhysicsSimulationSpec } from '../types/physics';
import { drawArrow, drawLabel, drawStageBackground } from './canvasHelpers';

export const GROUP_I_SIMULATIONS: PhysicsSimulationSpec[] = [
  {
    id: 'phys-41',
    orderNumber: 41,
    name: 'Từ trường xung quanh dây dẫn thẳng có dòng điện',
    groupId: 'I',
    groupName: 'Từ trường và cảm ứng điện từ',
    suggestedGrades: [9, 12],
    isTimeDependent: false,
    previewType: 'magnetic',
    status: 'implemented',
    parameters: [
      { key: 'I', label: 'Cường độ dòng điện I', unit: 'A', min: -15, max: 15, step: 1, defaultValue: 8 },
      { key: 'r', label: 'Khoảng cách r', unit: 'cm', min: 2, max: 20, step: 1, defaultValue: 5 },
    ],
    formulasLatex: ['B = 2 \\times 10^{-7} \\frac{|I|}{r}'],
    explanationVi:
      'Đường sức từ quanh dây dẫn thẳng dài mang dòng điện là những đường tròn đồng tâm nằm trong mặt phẳng vuông góc với dây, chiều xác định theo quy tắc nắm tay phải.',
    assumptionsAndLimits: ['Dây dẫn thẳng dài vô hạn trong không khí; mặt cắt vuông góc với dòng điện.'],
    stepAndRender: (ctx, w, h, _t, params) => {
      const I = params.I ?? 8;
      const rCm = params.r ?? 5;
      const B = (2e-7 * Math.abs(I)) / (rCm * 0.01);
      const cx = w * 0.5;
      const cy = h * 0.5;
      drawStageBackground(ctx, w, h, cx, cy, false);

      (I===0?[]:[45, 85, 125]).forEach((rad) => {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.8+Math.abs(I)*5/rad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.stroke();
        if (I !== 0) {
          const dir = I > 0 ? -1 : 1; // +I out of page => CCW
          drawArrow(ctx, cx, cy - rad, cx + dir * 24, cy - rad, '#f59e0b');
        }
      });

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawLabel(ctx, I===0?'0':I>0?'•':'×', cx, cy + 5, '#facc15', 'center');

      const probeX=cx+rCm*8;ctx.fillStyle="#fb7185";ctx.beginPath();ctx.arc(probeX,cy,4,0,2*Math.PI);ctx.fill();
      if(I)drawArrow(ctx,probeX,cy,probeX,cy-Math.sign(I)*Math.min(65,B*1e6),"#fbbf24","B");
      return {
        readings: [
          { label: 'Cảm ứng từ B', value: (B * 1e6).toFixed(2), unit: 'μT' },
          { label: 'Chiều dòng I', value: I===0?'Không có dòng điện':I>0 ? 'Hướng ra (•)' : 'Hướng vào (×)', unit: '' },
        ],
      };
    },
  },
  {
    id: 'phys-42',
    orderNumber: 42,
    name: 'Từ trường của ống dây có dòng điện',
    groupId: 'I',
    groupName: 'Từ trường và cảm ứng điện từ',
    suggestedGrades: [9, 12],
    isTimeDependent: false,
    previewType: 'magnetic',
    status: 'implemented',
    parameters: [
      { key: 'I', label: 'Dòng điện I', unit: 'A', min: 0.5, max: 10, step: 0.5, defaultValue: 4 },
      { key: 'n', label: 'Mật độ vòng dây n = N/L', unit: 'vòng/m', min: 200, max: 2000, step: 100, defaultValue: 1000 },
    ],
    formulasLatex: ['B = 4\\pi \\times 10^{-7} n I'],
    explanationVi:
      'Trong lòng ống dây hình trụ dài có dòng điện chạy qua, từ trường gần như đều với các đường sức song song cách đều nhau, chiều tuân theo quy tắc nắm tay phải.',
    assumptionsAndLimits: ['Ống dây dài, bỏ qua hiệu ứng rìa ở hai đầu khi tính B trong lòng ống dây.'],
    stepAndRender: (ctx, w, h, _t, params) => {
      const I = params.I ?? 4;
      const n = params.n ?? 1000;
      const B = 4 * Math.PI * 1e-7 * n * I;
      const cx = w * 0.5;
      const cy = h * 0.5;
      drawStageBackground(ctx, w, h, cx, cy, false);

      // Solenoid coils
      const left = 180;
      const right = w - 180;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      const turns = Math.round(6 + (n / 2000) * 10);
      for (let i = 0; i < turns; i++) {
        const x = left + (i / (turns - 1)) * (right - left);
        ctx.beginPath();
        ctx.ellipse(x, cy, 10, 62, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Field lines inside
      [-32, 0, 32].forEach((dy) => {
        drawArrow(ctx, left - 45, cy + dy, right + 45, cy + dy, '#38bdf8', dy === 0 ? 'B' : undefined, 2);
      });
      drawLabel(ctx, 'S', left - 24, cy - 72, '#93c5fd', 'center');
      drawLabel(ctx, 'N', right + 24, cy - 72, '#fca5a5', 'center');

      return {
        readings: [
          { label: 'Cảm ứng từ B', value: (B * 1000).toFixed(2), unit: 'mT' },
          { label: 'Mật độ vòng n', value: `${n}`, unit: 'vòng/m' },
        ],
      };
    },
  },
  {
    id: 'phys-43',
    orderNumber: 43,
    name: 'Chuyển động của điện tích trong từ trường đều',
    groupId: 'I',
    groupName: 'Từ trường và cảm ứng điện từ',
    suggestedGrades: [12],
    isTimeDependent: true,
    previewType: 'magnetic',
    status: 'implemented',
    parameters: [
      { key: 'v', label: 'Vận tốc vào vùng từ trường v', unit: '×10⁵ m/s', min: 1, max: 10, step: 0.5, defaultValue: 4 },
      { key: 'B', label: 'Cảm ứng từ B', unit: 'mT', min: 1, max: 10, step: 0.5, defaultValue: 3 },
      { key: 'qSign', label: 'Dấu điện tích (1: +, -1: -)', unit: '', min: -1, max: 1, step: 2, defaultValue: 1 },
    ],
    formulasLatex: ['f_L = |q| v B', 'R = \\frac{m v}{|q| B}'],
    explanationVi:
      'Điện tích bay vuông góc với đường sức từ chịu tác dụng của lực Lorentz luôn vuông góc với vận tốc, đóng vai trò lực hướng tâm làm điện tích chuyển động tròn đều.',
    assumptionsAndLimits: ['Hạt mang điện quy chuẩn (e/m tỷ lệ cố định trong khung quan sát 2D), từ trường đều hướng vào mặt phẳng (×).'],
    stepAndRender: (ctx, w, h, t, params) => {
      const v = params.v ?? 4;
      const B = params.B ?? 3;
      const sign = (params.qSign ?? 1) >= 0 ? 1 : -1;
      const R = (v / B) * 58;
      const omega = (B * 0.9) * sign;

      const cx = w * 0.5;
      const cy = h * 0.5;
      drawStageBackground(ctx, w, h, cx, cy, false);

      for (let gx = 60; gx < w - 40; gx += 70) {
        for (let gy = 40; gy < h - 30; gy += 60) {
          drawLabel(ctx, '×', gx, gy, '#334155', 'center');
        }
      }

      ctx.strokeStyle = '#38bdf8';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(140, R), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const radDraw = Math.min(140, R);
      const ang = omega * t;
      const px = cx + radDraw * Math.cos(ang);
      const py = cy + radDraw * Math.sin(ang);
      ctx.fillStyle = sign > 0 ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fill();

      const ux = (cx - px) / Math.max(1, radDraw);
      const uy = (cy - py) / Math.max(1, radDraw);
      drawArrow(ctx, px, py, px + ux * 40, py + uy * 40, '#facc15', 'F_L');

      return {
        readings: [
          { label: 'Bán kính quỹ đạo R (tỉ lệ)', value: (v / B).toFixed(2), unit: 'đv' },
          { label: 'Chiều quay', value: sign > 0 ? 'Theo lực Lorentz (+q)' : 'Ngược lại (-q)', unit: '' },
        ],
      };
    },
  },
  {
    id: 'phys-44',
    orderNumber: 44,
    name: 'Hiện tượng cảm ứng điện từ và định luật Faraday – Lenz',
    groupId: 'I',
    groupName: 'Từ trường và cảm ứng điện từ',
    suggestedGrades: [12],
    isTimeDependent: true,
    previewType: 'magnetic',
    status: 'implemented',
    parameters: [
      { key: 'B0', label: 'Cảm ứng từ cực đại B₀', unit: 'T', min: 0.1, max: 1.5, step: 0.1, defaultValue: 0.6 },
      { key: 'N', label: 'Số vòng khung dây N', unit: 'vòng', min: 10, max: 200, step: 10, defaultValue: 50 },
      { key: 'freq', label: 'Tần số tịnh tiến nam châm', unit: 'Hz', min: 0.2, max: 1.5, step: 0.1, defaultValue: 0.5 },
    ],
    formulasLatex: ['\\Phi = N B S \\cos\\alpha', 'e_c = -\\frac{\\Delta\\Phi}{\\Delta t}'],
    explanationVi:
      'Khi từ thông qua mạch kín biến thiên theo thời gian, trong mạch xuất hiện suất điện động cảm ứng. Theo định luật Lenz, dòng điện cảm ứng có chiều chống lại sự biến thiên từ thông đã sinh ra nó.',
    assumptionsAndLimits: ['Phần định lượng tính theo từ thông điều hòa qua khung dây diện tích S = 0.02 m²; hình nam châm minh họa trực quan sự lại gần/ra xa theo định tính.'],
    stepAndRender: (ctx, w, h, t, params, history) => {
      const B0 = params.B0 ?? 0.6;
      const N = params.N ?? 50;
      const freq = params.freq ?? 0.5;
      const S = 0.02;
      const omega = 2 * Math.PI * freq;
      const Bcur = B0 * 0.5 * (1 + Math.sin(omega * t));
      const dBdt = B0 * 0.5 * omega * Math.cos(omega * t);
      const flux = N * Bcur * S;
      const emf = -N * S * dBdt;

      drawStageBackground(ctx, w, h, w / 2, h / 2, false);
      // Magnet moving near coil
      const magX = 160 + 90 * (0.5 + 0.5 * Math.sin(omega * t));
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(magX - 80, h / 2 - 24, 50, 48);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(magX - 30, h / 2 - 24, 50, 48);
      drawLabel(ctx, 'S', magX - 55, h / 2 + 5, '#fff', 'center');
      drawLabel(ctx, 'N', magX - 5, h / 2 + 5, '#fff', 'center');

      // Coil
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(w * 0.62, h / 2, 22, 70, 0, 0, Math.PI * 2);
      ctx.stroke();

      const lenzDir = emf > 0 ? 'I_c cùng chiều kim' : 'I_c ngược chiều kim';
      drawLabel(ctx, Math.abs(emf) > 0.02 ? lenzDir : 'ΔΦ/Δt ≈ 0', w * 0.62, h / 2 - 88, '#38bdf8', 'center');

      history.push({ x: Number(t.toFixed(2)), y: Number(emf.toFixed(3)) });
      return {
        readings: [
          { label: 'Từ thông tức thời Φ', value: (flux * 1000).toFixed(2), unit: 'mWb' },
          { label: 'Từ thông cực đại Φ_max', value: (N * B0 * S * 1000).toFixed(2), unit: 'mWb' },
          { label: 'Suất điện động e_c', value: emf.toFixed(3), unit: 'V' },
        ],
        graphSeries: { title: 'Suất điện động cảm ứng e_c(t)', xLabel: 't (s)', yLabel: 'e_c (V)', points: history },
      };
    },
  },
  {
    id: 'phys-45',
    orderNumber: 45,
    name: 'Nguyên lý hoạt động của máy biến áp lý tưởng',
    groupId: 'I',
    groupName: 'Từ trường và cảm ứng điện từ',
    suggestedGrades: [12],
    isTimeDependent: true,
    previewType: 'magnetic',
    status: 'implemented',
    parameters: [
      { key: 'U1', label: 'Điện áp sơ cấp U₁', unit: 'V', min: 10, max: 220, step: 10, defaultValue: 220 },
      { key: 'N1', label: 'Số vòng sơ cấp N₁', unit: 'vòng', min: 100, max: 1000, step: 50, defaultValue: 500 },
      { key: 'N2', label: 'Số vòng thứ cấp N₂', unit: 'vòng', min: 50, max: 1000, step: 50, defaultValue: 250 },
    ],
    formulasLatex: ['\\frac{U_1}{U_2} = \\frac{N_1}{N_2}', '\\frac{I_2}{I_1} = \\frac{N_1}{N_2}'],
    explanationVi:
      'Máy biến áp hoạt động dựa trên hiện tượng cảm ứng điện từ với dòng điện xoay chiều, biến đổi điện áp theo tỉ lệ số vòng dây N₂/N₁ nhờ từ thông biến thiên dẫn qua lõi thép kỹ thuật.',
    assumptionsAndLimits: ['Máy biến áp lý tưởng (hiệu suất 100%, bỏ qua hao phí đồng và dòng Foucault).'],
    stepAndRender: (ctx, w, h, t, params) => {
      const U1 = params.U1 ?? 220;
      const N1 = params.N1 ?? 500;
      const N2 = params.N2 ?? 250;
      const U2 = (U1 * N2) / N1;

      drawStageBackground(ctx, w, h, w / 2, h / 2, false);
      // Iron core
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 22;
      ctx.strokeRect(w / 2 - 120, 75, 240, 170);

      // Coils
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 4;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(w / 2 - 142, 105 + i * 20);
        ctx.lineTo(w / 2 - 98, 105 + i * 20);
        ctx.stroke();
      }
      ctx.strokeStyle = '#10b981';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(w / 2 + 98, 105 + i * 20);
        ctx.lineTo(w / 2 + 142, 105 + i * 20);
        ctx.stroke();
      }

      // Magnetic flux pulse inside core
      const pulse = Math.abs(Math.sin(t * 4));
      ctx.strokeStyle = `rgba(250, 204, 21, ${0.25 + pulse * 0.65})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(w / 2 - 120, 75, 240, 170);
      ctx.setLineDash([]);

      drawLabel(ctx, `U₁=${U1}V (${N1}v)`, w / 2 - 165, 160, '#38bdf8', 'right');
      drawLabel(ctx, `U₂=${U2.toFixed(1)}V (${N2}v)`, w / 2 + 165, 160, '#10b981', 'left');

      return {
        readings: [
          { label: 'Điện áp thứ cấp U₂', value: U2.toFixed(1), unit: 'V' },
          { label: 'Loại máy biến áp', value: U2 > U1 ? 'Tăng áp' : U2 < U1 ? 'Hạ áp' : 'Tỉ lệ 1:1', unit: '' },
        ],
      };
    },
  },
];
