import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Star,
} from 'lucide-react';
import { PHYSICS_CATALOG, PHYSICS_GROUPS } from '../../physics/catalog';
import { loadPhysicsSimulationById } from '../../physics/loader';
import { getFavoritesByDomain, toggleFavorite } from '../../services/db';
import type {
  GraphPoint,
  PhysicsGroupId,
  PhysicsSimulationResult,
  PhysicsSimulationSpec,
} from '../../types/physics';
import { KatexFormula } from '../common/KatexFormula';
import { PhysicsPreviewThumb } from './PhysicsPreviewThumb';

interface PhysicsLabViewProps {
  initialSimulationId?: string;
}

export function PhysicsLabView({ initialSimulationId }: PhysicsLabViewProps) {
  const [selectedId, setSelectedId] = useState<string>(
    () => initialSimulationId || 'phys-05',
  );
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [favoriteError, setFavoriteError] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  const [activeSim, setActiveSim] = useState<PhysicsSimulationSpec | null>(null);
  const [loadingSim, setLoadingSim] = useState(true);
  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const [simResult, setSimResult] = useState<PhysicsSimulationResult | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [simTime, setSimTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<GraphPoint[]>([]);
  const simTimeRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialSimulationId && PHYSICS_CATALOG.some((p) => p.id === initialSimulationId)) {
      setSelectedId(initialSimulationId);
    }
  }, [initialSimulationId]);

  useEffect(() => {
    getFavoritesByDomain('physics')
      .then(setFavorites)
      .catch(() => setFavoriteError('Chưa tải được danh sách yêu thích.'))
      .finally(() => setLoadingFavorites(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const item = PHYSICS_CATALOG.find((c) => c.id === selectedId);
    setLoadingSim(true);
    loadPhysicsSimulationById(selectedId, item?.groupId)
      .then((spec) => {
        if (cancelled || !spec) return;
        const defaults: Record<string, number> = {};
        for (const p of spec.parameters) defaults[p.key] = p.defaultValue;
        historyRef.current = [];
        simTimeRef.current = 0;
        lastFrameRef.current = null;
        setSimTime(0);
        setParamValues(defaults);
        setActiveSim(spec);
        setIsPlaying(spec.isTimeDependent);
        setLoadingSim(false);
      })
      .catch(() => {
        if (!cancelled) setLoadingSim(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const p=paramValues;
  const endTime = selectedId==='phys-03'||selectedId==='phys-04' ? Math.sqrt(2*p.h0/p.g) :
    selectedId==='phys-05' ? 2*p.v0*Math.sin(p.angle*Math.PI/180)/p.g : 30;
  const [probe,setProbe]=useState<{x:number;y:number;px:number;py:number}|null>(null);
  let probeText='';
  if(probe && selectedId==='phys-41'){
    const r=Math.hypot(probe.x-380,probe.y-210)/8;
    probeText=r<0.1?'Trên trục dây':('r = '+r.toFixed(2)+' cm · B = '+(20*Math.abs(p.I)/r).toFixed(2)+' μT');
  }
  if(probe && selectedId==='phys-26' && probe.x>=40){
    const x=(probe.x-40)/75;
    probeText='x = '+x.toFixed(2)+' m · u = '+(p.A*Math.cos(2*Math.PI*p.f*(simTime-x/p.v))).toFixed(2)+' cm';
  }
  const drawGraphCanvas = (result: PhysicsSimulationResult | null) => {
    const gCanvas = graphCanvasRef.current;
    if (!gCanvas || !result?.graphSeries) return;
    const ctx = gCanvas.getContext('2d');
    if (!ctx) return;

    const w = gCanvas.width;
    const h = gCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0c1322';
    ctx.fillRect(0, 0, w, h);

    const pts = result.graphSeries.points;
    if (pts.length < 2) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText('Đang ghi dữ liệu đồ thị theo thời gian...', 16, h / 2);
      return;
    }

    const padL = 46;
    const padR = 16;
    const padT = 26;
    const padB = 28;
    const gw = w - padL - padR;
    const gh = h - padT - padB;

    let minX = pts[0].x;
    let maxX = pts[0].x;
    let minY = pts[0].y;
    let maxY = pts[0].y;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    minY=Math.min(0,minY);maxY=Math.max(0,maxY);
    if(maxY===minY){minY-=1;maxY+=1}
    if(result.graphSeries.xLabel==='t (s)'){minX=0;maxX=endTime;}
    const spanX = Math.max(1e-4, maxX - minX);
    const spanY = Math.max(1e-4, maxY - minY);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, h - padB);
    ctx.lineTo(w - padR, h - padB);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.25;
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const px = padL + ((p.x - minX) / spanX) * gw;
      const py = h - padB - ((p.y - minY) / spanY) * gh;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px sans-serif';
    ctx.fillText(result.graphSeries.title, padL, 16);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(result.graphSeries.yLabel, 6, padT + 10);
    ctx.fillText(result.graphSeries.xLabel, w - 42, h - 8);
    ctx.fillText(maxY.toFixed(1), 6, padT + 24);
    ctx.fillText(minY.toFixed(1), 6, h - padB);
  };

  useEffect(() => {
    if (!activeSim) return;
    let rafId = 0;
    let lastPanelUpdate = -Infinity;

    const renderAtTime = (t: number, now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const res = activeSim.stepAndRender(
        ctx,
        canvas.width,
        canvas.height,
        t,
        paramValues,
        historyRef.current,
      );
      if (now - lastPanelUpdate >= 100 || t>=endTime) {
        lastPanelUpdate = now;
        setSimTime(t);
        setSimResult(res);
        drawGraphCanvas(res);
      }
    };

    renderAtTime(simTimeRef.current, performance.now());

    if (!activeSim.isTimeDependent || !isPlaying) {
      lastFrameRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = now;
      }
      const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;
      simTimeRef.current = Math.min(endTime,simTimeRef.current+dt);
      renderAtTime(simTimeRef.current, now);
      if(simTimeRef.current>=endTime){setIsPlaying(false);return}
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [activeSim, isPlaying, paramValues]);

  const handleResetSim = () => {
    historyRef.current = [];
    simTimeRef.current = 0;
    lastFrameRef.current = null;
    setSimTime(0);
    if (activeSim && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const res = activeSim.stepAndRender(
          ctx,
          canvasRef.current.width,
          canvasRef.current.height,
          0,
          paramValues,
          historyRef.current,
        );
        setSimResult(res);
        drawGraphCanvas(res);
      }
    }
  };

  const handleParamChange = (key: string, value: number) => {
    historyRef.current = [];
    simTimeRef.current=0;lastFrameRef.current=null;
    setParamValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleFavorite = async (id: string) => {
    if (savingFavorite || loadingFavorites) return;
    setSavingFavorite(true);
    setFavoriteError('');
    try {
      const saved = await toggleFavorite(id, 'physics', !favorites.includes(id));
      setFavorites(prev => saved ? [...new Set([...prev, id])] : prev.filter(item => item !== id));
    } catch {
      setFavoriteError('Chưa lưu được thay đổi. Vui lòng thử lại.');
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleFullscreen = () => {
    if (!stageRef.current) return;
    if (!document.fullscreenElement) {
      stageRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PHYSICS_CATALOG.filter((item) => {
      if (groupFilter !== 'ALL' && item.groupId !== (groupFilter as PhysicsGroupId)) {
        return false;
      }
      if (gradeFilter !== 'ALL' && !item.suggestedGrades.includes(Number(gradeFilter))) {
        return false;
      }
      if (onlyFavorites && !favorites.includes(item.id)) {
        return false;
      }
      if (
        q &&
        !item.name.toLowerCase().includes(q) &&
        !item.groupName.toLowerCase().includes(q) &&
        !String(item.orderNumber).includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [search, groupFilter, gradeFilter, onlyFavorites, favorites]);

  const isFav = activeSim ? favorites.includes(activeSim.id) : false;

  const groupBadgeStyle = (gid: PhysicsGroupId) => {
    const map: Record<PhysicsGroupId, string> = {
      A: 'bg-sky-100 text-sky-900 border-sky-200',
      B: 'bg-indigo-100 text-indigo-900 border-indigo-200',
      C: 'bg-amber-100 text-amber-900 border-amber-200',
      D: 'bg-violet-100 text-violet-900 border-violet-200',
      E: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      F: 'bg-cyan-100 text-cyan-900 border-cyan-200',
      G: 'bg-orange-100 text-orange-900 border-orange-200',
      H: 'bg-rose-100 text-rose-900 border-rose-200',
      I: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200',
      J: 'bg-teal-100 text-teal-900 border-teal-200',
    };
    return map[gid] || 'bg-sky-100 text-sky-900 border-sky-200';
  };

  const readingCardStyle = (idx: number) => {
    const styles = [
      'border-sky-200/90 bg-gradient-to-br from-sky-50 to-cyan-50/70',
      'border-violet-200/90 bg-gradient-to-br from-violet-50 to-indigo-50/70',
      'border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-teal-50/70',
      'border-amber-200/90 bg-gradient-to-br from-amber-50 to-orange-50/70',
      'border-rose-200/90 bg-gradient-to-br from-rose-50 to-pink-50/70',
      'border-indigo-200/90 bg-gradient-to-br from-indigo-50 to-sky-50/70',
    ];
    return styles[idx % styles.length];
  };

  return (
    <div className="space-y-6">
      {favoriteError && <p role="alert" className="text-sm text-red-700">{favoriteError}</p>}
      {/* Active Simulation Observatory Workbench */}
      <div
        ref={stageRef}
        className="scroll-mt-20 rounded-2xl border border-sky-200/80 bg-white/95 p-5 sm:p-6 shadow-[0_6px_28px_rgba(14,165,233,0.07)] space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-sky-100 pb-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/80 tabular-nums">
              {activeSim
                ? `Mô phỏng #${activeSim.orderNumber}/50 · Nhóm ${activeSim.groupId} – ${activeSim.groupName} · Lớp ${activeSim.suggestedGrades.join(', ')}`
                : 'Đang nạp mô phỏng...'}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950">
              {activeSim?.name || 'Phòng thí nghiệm Vật lý 2D'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeSim?.isTimeDependent && (
              <>
                <button
                  type="button"
                  onClick={() => {if(simTimeRef.current>=endTime)handleResetSim();setIsPlaying((p) => !p)}}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:brightness-110 transition-all shadow-sm shadow-sky-500/25"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={handleResetSim}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-sky-200 bg-white text-slate-700 hover:bg-sky-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
                  Reset
                </button>
              </>
            )}
            {!activeSim?.isTimeDependent && (
              <button
                type="button"
                onClick={handleResetSim}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-sky-200 bg-white text-slate-700 hover:bg-sky-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
                Reset mặc định
              </button>
            )}
            {activeSim && (
              <button
                type="button"
                disabled={savingFavorite || loadingFavorites}
                aria-busy={savingFavorite || loadingFavorites}
                onClick={() => handleToggleFavorite(activeSim.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors ${
                  isFav
                    ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                    : 'border-sky-200 bg-white text-slate-700 hover:bg-amber-50'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500 text-amber-500' : 'text-amber-500'}`} />
                {savingFavorite ? (isFav ? 'Đang bỏ lưu…' : 'Đang lưu…') : isFav ? 'Đã lưu' : 'Yêu thích'}
              </button>
            )}
            <button
              type="button"
              onClick={handleFullscreen}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-sky-200 bg-white text-slate-700 hover:bg-sky-50 transition-colors"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-indigo-600" /> : <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Canvas Stage & Live Graph (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border-2 border-sky-950/20 bg-[#0c1322] shadow-md">
              <canvas
                onPointerLeave={()=>setProbe(null)}
                onPointerMove={e=>{if(selectedId!=='phys-41'&&selectedId!=='phys-26')return;const r=e.currentTarget.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;setProbe({x:px*760/r.width,y:py*420/r.height,px:Math.max(0,Math.min(px+10,r.width-170)),py:Math.max(0,py-35)})}}
                ref={canvasRef}
                width={760}
                height={420}
                className="w-full h-auto block"
              />
              {probe && probeText && <div className="pointer-events-none absolute rounded bg-slate-950/90 px-2 py-1 text-xs text-white" style={{left:probe.px,top:probe.py}}>{probeText}</div>}
              {activeSim?.isTimeDependent && (
                <div className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-slate-900/90 border border-sky-400/40 text-xs font-mono font-bold text-sky-300 tabular-nums shadow-sm">
                  t = {simTime.toFixed(2)} s
                </div>
              )}
              {loadingSim && (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-sm text-slate-200">
                  Đang nạp mô phỏng...
                </div>
              )}
            </div>

            {simResult?.graphSeries && (
              <div className="rounded-2xl overflow-hidden border-2 border-indigo-950/20 bg-[#0c1322] shadow-sm">
                <canvas
                  ref={graphCanvasRef}
                  width={760}
                  height={170}
                  className="w-full h-auto block"
                />
              </div>
            )}

            {/* Colorful Telemetry Readouts */}
            {simResult && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {simResult.readings.map((r, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border px-4 py-3 shadow-xs ${readingCardStyle(idx)}`}
                  >
                    <div className="text-[11px] font-semibold text-slate-600">{r.label}</div>
                    <div className="text-base font-extrabold text-slate-950 font-mono-tabular mt-0.5">
                      {r.value}{' '}
                      {r.unit && <span className="text-xs font-semibold text-slate-600">{r.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Unified Colorful Control & Theory Deck (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl border border-sky-200/80 bg-gradient-to-b from-sky-50/40 via-white to-violet-50/40 divide-y divide-sky-100">
            {/* Parameter Sliders */}
            <div className="p-4 space-y-4">
              <h3 className="text-xs font-bold text-sky-800">Thông số điều chỉnh</h3>
              {activeSim?.parameters.map((param) => {
                const val = paramValues[param.key] ?? param.defaultValue;
                return (
                  <div key={param.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor={`param-${param.key}`} className="font-semibold text-slate-800">
                        {param.label}
                      </label>
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/70 tabular-nums">
                        {val} {param.unit}
                      </span>
                    </div>
                    <input
                      id={`param-${param.key}`}
                      type="range"
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      value={val}
                      onChange={(e) => handleParamChange(param.key, Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>

            {/* Formulas */}
            {activeSim && (
              <div className="p-4 space-y-2.5">
                <h3 className="text-xs font-bold text-violet-800">Công thức vật lý</h3>
                <div className="space-y-2">
                  {activeSim.formulasLatex.map((latex, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-50/80 to-sky-50/80 border border-violet-200/80 text-sm text-indigo-950 overflow-x-auto"
                    >
                      <KatexFormula latex={latex} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation & Limits */}
            {activeSim && (
              <div className="p-4 space-y-3 text-sm">
                <div>
                  <h3 className="text-xs font-bold text-emerald-800 mb-1">
                    Giải thích hiện tượng
                  </h3>
                  <p className="text-slate-700 leading-relaxed text-[13px]">
                    {activeSim.explanationVi}
                  </p>
                </div>
                <div className="pt-2.5 border-t border-amber-200/70 bg-amber-50/60 -mx-4 px-4 py-3 -mb-4 rounded-b-2xl">
                  <h4 className="text-xs font-bold text-amber-800 mb-1">
                    Giả thiết & giới hạn mô phỏng
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-amber-950/90">
                    {activeSim.assumptionsAndLimits.map((lim, i) => (
                      <li key={i}>{lim}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 50 Simulations Library Grid */}
      <div className="rounded-2xl border border-sky-200/80 bg-white/95 p-5 sm:p-6 shadow-[0_6px_28px_rgba(14,165,233,0.06)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-950">
              Thư viện 50 mô phỏng Vật lý 2D (Nhóm A – J)
            </h3>
            <p className="text-xs font-medium text-sky-700 tabular-nums mt-0.5">
              Hiển thị {filteredCatalog.length}/50 mô hình tương tác độc lập
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên mô phỏng..."
                className="pl-8 pr-3 py-2 text-xs sm:text-sm border border-sky-200 rounded-xl w-52 bg-sky-50/30 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-2.5 py-2 text-xs sm:text-sm border border-sky-200 rounded-xl bg-white focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Tất cả 10 nhóm (50)</option>
              {PHYSICS_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-2.5 py-2 text-xs sm:text-sm border border-sky-200 rounded-xl bg-white focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Mọi lớp</option>
              {[7, 8, 9, 10, 11, 12].map((gr) => (
                <option key={gr} value={String(gr)}>
                  Lớp {gr}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setOnlyFavorites((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                onlyFavorites
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'border-sky-200 text-slate-700 hover:bg-amber-50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-amber-500'}`} />
              Yêu thích ({favorites.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredCatalog.map((item) => {
            const active = item.id === selectedId;
            const fav = favorites.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedId(item.id);
                  stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`group text-left rounded-2xl border p-3.5 transition-all space-y-2.5 hover:-translate-y-0.5 ${
                  active
                    ? 'border-sky-500 bg-gradient-to-br from-sky-50 to-indigo-50 ring-2 ring-sky-500/80 shadow-md shadow-sky-500/10'
                    : 'border-slate-200/90 bg-white hover:border-sky-300 hover:shadow-md hover:shadow-sky-500/5'
                }`}
              >
                <PhysicsPreviewThumb previewType={item.previewType} />
                <div className="flex items-center justify-between gap-2 text-[11px] tabular-nums">
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${groupBadgeStyle(item.groupId)}`}
                  >
                    #{item.orderNumber} · Nhóm {item.groupId} · Lớp {item.suggestedGrades.join(', ')}
                  </span>
                  {fav && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />}
                </div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-sky-700 line-clamp-2 leading-snug">
                  {item.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

