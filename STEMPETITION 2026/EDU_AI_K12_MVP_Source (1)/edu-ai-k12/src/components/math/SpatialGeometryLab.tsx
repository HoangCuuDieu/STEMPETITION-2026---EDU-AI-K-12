import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Eye, EyeOff, Plus, RotateCcw, Ruler } from 'lucide-react';
import {
  MATH_SOLIDS,
  angleDegreesAtVertex,
  distanceBetween,
  midpointOf,
  type Point3D,
  type Segment3D,
  type SolidPreset,
} from '../../utils/mathGeometry';
import {
  afterDraw,
  attachStudioEnvironment,
  createStudioRenderer,
  disposeSceneObjects,
} from '../../utils/webgl';
import { KatexFormula } from '../common/KatexFormula';

interface SpatialGeometryLabProps {
  initialSolidId?: string;
}

interface ProjectedLabel {
  id: string;
  label: string;
  x: number;
  y: number;
  visible: boolean;
  isCustom?: boolean;
}

export function SpatialGeometryLab({ initialSolidId }: SpatialGeometryLabProps) {
  const [solidId, setSolidId] = useState<SolidPreset['id']>(() => {
    const found = MATH_SOLIDS.find((s) => s.id === initialSolidId);
    return found ? found.id : 'math-pyramid';
  });

  useEffect(() => {
    if (initialSolidId) {
      const found = MATH_SOLIDS.find((s) => s.id === initialSolidId);
      if (found) setSolidId(found.id);
    }
  }, [initialSolidId]);

  const activePreset = useMemo(
    () => MATH_SOLIDS.find((s) => s.id === solidId) ?? MATH_SOLIDS[0],
    [solidId],
  );

  const [customPoints, setCustomPoints] = useState<Point3D[]>([]);
  const [customSegments, setCustomSegments] = useState<Segment3D[]>([]);
  const [showLabels, setShowLabels] = useState(true);
  const [showFaces, setShowFaces] = useState(true);

  useEffect(() => {
    setCustomPoints([]);
    setCustomSegments([]);
    setCoordLabel('M');
  }, [solidId]);

  const allPoints = useMemo(
    () => [...activePreset.points, ...customPoints],
    [activePreset, customPoints],
  );
  const allSegments = useMemo(
    () => [...activePreset.segments, ...customSegments],
    [activePreset, customSegments],
  );

  const [coordLabel, setCoordLabel] = useState('M');
  const [coordX, setCoordX] = useState('0');
  const [coordY, setCoordY] = useState('2.25');
  const [coordZ, setCoordZ] = useState('1');

  const [midA, setMidA] = useState(activePreset.points[0]?.id ?? 'A');
  const [midB, setMidB] = useState(activePreset.points[activePreset.points.length - 1]?.id ?? 'S');
  const [midLabel, setMidLabel] = useState('N');

  const [connectA, setConnectA] = useState(activePreset.points[0]?.id ?? 'A');
  const [connectB, setConnectB] = useState(activePreset.points[activePreset.points.length - 1]?.id ?? 'S');

  const [measureA, setMeasureA] = useState(activePreset.points[0]?.id ?? 'A');
  const [measureB, setMeasureB] = useState(activePreset.points[activePreset.points.length - 1]?.id ?? 'S');
  const [angleVertex, setAngleVertex] = useState(activePreset.points[1]?.id ?? 'B');

  useEffect(() => {
    const pts = activePreset.points;
    if (pts.length >= 2) {
      setMidA(pts[0].id);
      setMidB(pts[pts.length - 1].id);
      setConnectA(pts[0].id);
      setConnectB(pts[pts.length - 1].id);
      setMeasureA(pts[0].id);
      setMeasureB(pts[pts.length - 1].id);
      setAngleVertex(pts[1].id);
    }
  }, [activePreset]);

  const measuredDistance = useMemo(() => {
    const p1 = allPoints.find((p) => p.id === measureA);
    const p2 = allPoints.find((p) => p.id === measureB);
    if (!p1 || !p2) return null;
    return distanceBetween(p1, p2);
  }, [allPoints, measureA, measureB]);

  const measuredAngle = useMemo(() => {
    const p1 = allPoints.find((p) => p.id === measureA);
    const pv = allPoints.find((p) => p.id === angleVertex);
    const p2 = allPoints.find((p) => p.id === measureB);
    if (!p1 || !pv || !p2 || p1.id === pv.id || p2.id === pv.id) return null;
    return angleDegreesAtVertex(p1, pv, p2);
  }, [allPoints, measureA, angleVertex, measureB]);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});
  const [projectedLabels, setProjectedLabels] = useState<ProjectedLabel[]>([]);

  const pointsRef = useRef<Point3D[]>(allPoints);
  pointsRef.current = allPoints;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 480;
    const { renderer, isSoftwareGl } = createStudioRenderer(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0c1322');
    const envTex = attachStudioEnvironment(renderer, scene);

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    camera.position.set(6.5, 5.2, 7.2);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 1.5, 0);
    controls.update();
    controlsRef.current = controls;

    const grid = new THREE.GridHelper(12, 12, '#334155', '#1e293b');
    scene.add(grid);
    const axes = new THREE.AxesHelper(2.2);
    scene.add(axes);

    const keyLight = new THREE.DirectionalLight('#fff7ed', 1.45);
    keyLight.position.set(6, 10, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.65);
    rimLight.position.set(-6, 4, -7);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight('#cbd5e1', 0.45));

    const contentGroup = new THREE.Group();
    scene.add(contentGroup);

    const scratchVec = new THREE.Vector3();
    let rafId = 0;
    let drawPending = false;
    let disposed = false;

    const updateProjectedLabels = () => {
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 480;
      const next: ProjectedLabel[] = pointsRef.current.map((pt) => {
        scratchVec.set(pt.x, pt.y, pt.z).project(camera);
        return {
          id: pt.id,
          label: pt.label,
          x: (scratchVec.x * 0.5 + 0.5) * w,
          y: (-scratchVec.y * 0.5 + 0.5) * h,
          visible: scratchVec.z >= -1 && scratchVec.z <= 1,
          isCustom: pt.isCustom,
        };
      });
      setProjectedLabels(next);
    };

    const renderFrame = () => {
      if (disposed) return;
      drawPending = false;
      controls.update();
      renderer.render(scene, camera);
      updateProjectedLabels();
    };

    const requestRender = () => {
      if (disposed || drawPending) return;
      drawPending = true;
      rafId = window.requestAnimationFrame(renderFrame);
    };
    requestRenderRef.current = requestRender;

    controls.addEventListener('change', requestRender);

    const onResize = () => {
      if (disposed || !container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    const buildGeometry = (
      pts: Point3D[],
      segs: Segment3D[],
      faces: string[][],
      facesVisible: boolean,
    ) => {
      disposeSceneObjects(contentGroup);
      contentGroup.clear();

      const ptMap = new Map(pts.map((p) => [p.id, p]));

      if (facesVisible) {
        const faceMat = new THREE.MeshStandardMaterial({
          color: '#38bdf8',
          transparent: true,
          opacity: 0.14,
          roughness: 0.35,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        for (const faceIds of faces) {
          const verts = faceIds
            .map((id) => ptMap.get(id))
            .filter((p): p is Point3D => Boolean(p));
          if (verts.length >= 3) {
            const positions: number[] = [];
            for (let i = 1; i < verts.length - 1; i++) {
              positions.push(
                verts[0].x,
                verts[0].y,
                verts[0].z,
                verts[i].x,
                verts[i].y,
                verts[i].z,
                verts[i + 1].x,
                verts[i + 1].y,
                verts[i + 1].z,
              );
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute(
              'position',
              new THREE.Float32BufferAttribute(positions, 3),
            );
            geo.computeVertexNormals();
            contentGroup.add(new THREE.Mesh(geo, faceMat));
          }
        }
      }

      const solidMat = new THREE.LineBasicMaterial({ color: '#f1f5f9' });
      const dashedMat = new THREE.LineDashedMaterial({
        color: '#94a3b8',
        dashSize: 0.22,
        gapSize: 0.14,
      });
      const customMat = new THREE.LineBasicMaterial({ color: '#f59e0b' });

      for (const seg of segs) {
        const p1 = ptMap.get(seg.fromId);
        const p2 = ptMap.get(seg.toId);
        if (!p1 || !p2) continue;
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(p1.x, p1.y, p1.z),
          new THREE.Vector3(p2.x, p2.y, p2.z),
        ]);
        const mat = seg.isCustom
          ? customMat
          : seg.dashed
            ? dashedMat
            : solidMat;
        const line = new THREE.Line(geo, mat);
        if (seg.dashed && !seg.isCustom) {
          line.computeLineDistances();
        }
        contentGroup.add(line);
      }

      const sphereGeo = new THREE.SphereGeometry(0.11, 18, 18);
      const baseVertexMat = new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        roughness: 0.25,
        metalness: 0.15,
      });
      const customVertexMat = new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.25,
        metalness: 0.2,
      });
      for (const pt of pts) {
        const mesh = new THREE.Mesh(
          sphereGeo,
          pt.isCustom ? customVertexMat : baseVertexMat,
        );
        mesh.position.set(pt.x, pt.y, pt.z);
        contentGroup.add(mesh);
      }

      requestRender();
    };

    (container as HTMLDivElement & { __rebuildMath?: typeof buildGeometry }).__rebuildMath =
      buildGeometry;

    buildGeometry(allPoints, allSegments, activePreset.faces, showFaces);

    const fenceTimer = afterDraw(renderer, () => {
      if (!disposed) updateProjectedLabels();
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(fenceTimer);
      ro.disconnect();
      controls.removeEventListener('change', requestRender);
      controls.dispose();
      disposeSceneObjects(scene);
      envTex.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const container = mountRef.current as
      | (HTMLDivElement & {
          __rebuildMath?: (
            pts: Point3D[],
            segs: Segment3D[],
            faces: string[][],
            facesVisible: boolean,
          ) => void;
        })
      | null;
    if (container?.__rebuildMath) {
      container.__rebuildMath(allPoints, allSegments, activePreset.faces, showFaces);
    }
  }, [allPoints, allSegments, activePreset, showFaces]);

  const handleResetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(6.5, 5.2, 7.2);
      controlsRef.current.target.set(0, 1.5, 0);
      controlsRef.current.update();
      requestRenderRef.current();
    }
  };

  const handleAddCoordPoint = () => {
    const label = coordLabel.trim() || `P${customPoints.length + 1}`;
    const x = Number(coordX);
    const y = Number(coordY);
    const z = Number(coordZ);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
    const newPt: Point3D = {
      id: `pt-${label}-${Date.now()}`,
      label,
      x,
      y,
      z,
      isCustom: true,
    };
    setCustomPoints((prev) => [...prev, newPt]);
    setCoordLabel(`P${customPoints.length + 2}`);
  };

  const handleAddMidpoint = () => {
    const p1 = allPoints.find((p) => p.id === midA);
    const p2 = allPoints.find((p) => p.id === midB);
    if (!p1 || !p2 || p1.id === p2.id) return;
    const label = midLabel.trim() || `M${customPoints.length + 1}`;
    const newPt = midpointOf(p1, p2, label);
    setCustomPoints((prev) => [...prev, newPt]);
    setMidLabel(`M${customPoints.length + 2}`);
  };

  const handleConnectPoints = () => {
    if (!connectA || !connectB || connectA === connectB) return;
    const exists = allSegments.some(
      (s) =>
        (s.fromId === connectA && s.toId === connectB) ||
        (s.fromId === connectB && s.toId === connectA),
    );
    if (exists) return;
    setCustomSegments((prev) => [
      ...prev,
      {
        id: `seg-${connectA}-${connectB}-${Date.now()}`,
        fromId: connectA,
        toId: connectB,
        isCustom: true,
      },
    ]);
  };

  return (
    <div className="rounded-2xl border border-violet-200/80 bg-white/95 p-5 sm:p-6 shadow-[0_6px_28px_rgba(124,58,237,0.07)] space-y-6">
      {/* Header & Solid Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-violet-100 pb-4">
        <div className="flex flex-wrap gap-2">
          {MATH_SOLIDS.map((solid) => {
            const active = solid.id === solidId;
            return (
              <button
                key={solid.id}
                type="button"
                onClick={() => setSolidId(solid.id)}
                className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border transition-all whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-sm shadow-violet-500/25'
                    : 'bg-violet-50/50 text-slate-700 border-violet-200/80 hover:border-violet-400 hover:bg-violet-50'
                }`}
              >
                {solid.name}
              </button>
            );
          })}
        </div>
        <div className="text-xs font-medium text-violet-700 bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-200/70 tabular-nums">
          4/4 khối hình không gian 3D · Kéo xoay 360° · Cuộn thu phóng
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 3D Stage & Solid Reference (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="relative rounded-2xl border-2 border-indigo-950/20 bg-[#0c1322] overflow-hidden h-[480px] shadow-md">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {showLabels && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {projectedLabels.map(
                  (lbl) =>
                    lbl.visible && (
                      <div
                        key={lbl.id}
                        style={{
                          transform: `translate(${Math.round(lbl.x)}px, ${Math.round(lbl.y - 16)}px)`,
                        }}
                        className={`absolute top-0 left-0 -translate-x-1/2 px-1.5 py-0.5 text-[11px] font-bold rounded-md border shadow-sm ${
                          lbl.isCustom
                            ? 'bg-amber-500 text-slate-950 border-amber-300'
                            : 'bg-indigo-950/90 text-sky-200 border-sky-400/50'
                        }`}
                      >
                        {lbl.label}
                      </div>
                    ),
                )}
              </div>
            )}

            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setShowLabels((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700 hover:bg-indigo-900 transition-colors"
                >
                  {showLabels ? <Eye className="w-3.5 h-3.5 text-sky-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                  Nhãn đỉnh
                </button>
                <button
                  type="button"
                  onClick={() => setShowFaces((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700 hover:bg-indigo-900 transition-colors"
                >
                  {showFaces ? 'Ẩn mặt phẳng' : 'Hiện mặt phẳng'}
                </button>
              </div>
              <button
                type="button"
                onClick={handleResetView}
                className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700 hover:bg-indigo-900 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                Đặt lại góc nhìn
              </button>
            </div>
          </div>

          {/* Editorial Description & KaTeX Formula Sheet */}
          <div className="space-y-3 pt-1">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">{activePreset.name}</h2>
              <p className="text-xs font-medium text-violet-700 mt-0.5">{activePreset.subtitle}</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{activePreset.description}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              {activePreset.formulasLatex.map((f, i) => (
                <div
                  key={i}
                  className="text-sm text-indigo-950 bg-gradient-to-br from-violet-50 to-sky-50 px-3.5 py-2.5 rounded-xl border border-violet-200/80 shadow-xs"
                >
                  <KatexFormula latex={f} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Unified Colorful Workbench (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-violet-200/80 bg-gradient-to-b from-violet-50/40 via-white to-sky-50/30 divide-y divide-violet-100">
          {/* Section 1: Midpoint */}
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 inline-flex items-center justify-center">
                <Plus className="w-3.5 h-3.5" />
              </span>
              Thêm trung điểm đoạn thẳng
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={midA}
                onChange={(e) => setMidA(e.target.value)}
                className="px-2.5 py-2 text-sm border border-violet-200 rounded-xl bg-white focus:outline-none focus:border-violet-500"
              >
                {allPoints.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <select
                value={midB}
                onChange={(e) => setMidB(e.target.value)}
                className="px-2.5 py-2 text-sm border border-violet-200 rounded-xl bg-white focus:outline-none focus:border-violet-500"
              >
                {allPoints.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={midLabel}
                onChange={(e) => setMidLabel(e.target.value)}
                placeholder="Tên điểm"
                className="px-2.5 py-2 text-sm border border-violet-200 rounded-xl bg-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddMidpoint}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:brightness-110 transition-all shadow-sm shadow-sky-500/20"
            >
              Tạo trung điểm mới
            </button>
          </div>

          {/* Section 2: Custom XYZ Point */}
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Thêm điểm theo tọa độ (x, y, z)</h3>
            <div className="grid grid-cols-4 gap-2">
              <input
                type="text"
                value={coordLabel}
                onChange={(e) => setCoordLabel(e.target.value)}
                placeholder="Tên"
                className="px-2.5 py-2 text-sm border border-violet-200 rounded-xl bg-white focus:outline-none focus:border-violet-500"
              />
              <input
                type="number"
                step="0.25"
                value={coordX}
                onChange={(e) => setCoordX(e.target.value)}
                aria-label="Tọa độ X"
                className="px-2.5 py-2 text-sm border border-violet-200 rounded-xl bg-white tabular-nums focus:outline-none focus:border-violet-500"
              />
              <input
                type="number"
                step="0.25"
                value={coordY}
                onChange={(e) => setCoordY(e.target.value)}
                aria-label="Tọa độ Y"
                className="px-2.5 py-2 text-sm border border-violet-200 rounded-xl bg-white tabular-nums focus:outline-none focus:border-violet-500"
              />
              <input
                type="number"
                step="0.25"
                value={coordZ}
                onChange={(e) => setCoordZ(e.target.value)}
                aria-label="Tọa độ Z"
                className="px-2.5 py-2 text-sm border border-violet-200 rounded-xl bg-white tabular-nums focus:outline-none focus:border-violet-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCoordPoint}
              className="w-full py-2.5 text-xs font-bold rounded-xl border border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100 transition-colors"
            >
              Đặt điểm vào không gian 3D
            </button>
          </div>

          {/* Section 3: Connect Segments */}
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Nối hai điểm thành đoạn thẳng</h3>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={connectA}
                onChange={(e) => setConnectA(e.target.value)}
                className="px-2.5 py-2 text-sm border border-violet-200 rounded-xl bg-white focus:outline-none focus:border-violet-500"
              >
                {allPoints.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <select
                value={connectB}
                onChange={(e) => setConnectB(e.target.value)}
                className="px-2.5 py-2 text-sm border border-violet-200 rounded-xl bg-white focus:outline-none focus:border-violet-500"
              >
                {allPoints.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleConnectPoints}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 transition-all shadow-sm shadow-amber-500/20"
            >
              Nối đoạn thẳng (màu hổ phách)
            </button>
          </div>

          {/* Section 4: Distance & Angle Measurement */}
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 inline-flex items-center justify-center">
                <Ruler className="w-3.5 h-3.5" />
              </span>
              Đo khoảng cách & góc không gian
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-600 font-medium block mb-1">Điểm 1</span>
                <select
                  value={measureA}
                  onChange={(e) => setMeasureA(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-violet-200 rounded-xl bg-white"
                >
                  {allPoints.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-slate-600 font-medium block mb-1">Đỉnh góc</span>
                <select
                  value={angleVertex}
                  onChange={(e) => setAngleVertex(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-violet-200 rounded-xl bg-white"
                >
                  {allPoints.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-slate-600 font-medium block mb-1">Điểm 2</span>
                <select
                  value={measureB}
                  onChange={(e) => setMeasureB(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-violet-200 rounded-xl bg-white"
                >
                  {allPoints.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200/80">
                <div className="text-[11px] font-semibold text-violet-700">Độ dài đoạn thẳng</div>
                <div className="text-base font-bold text-indigo-950 font-mono-tabular mt-0.5">
                  {measuredDistance !== null ? `${measuredDistance.toFixed(3)} đv` : '—'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80">
                <div className="text-[11px] font-semibold text-emerald-700">Góc tại đỉnh đã chọn</div>
                <div className="text-base font-bold text-emerald-950 font-mono-tabular mt-0.5">
                  {measuredAngle !== null ? `${measuredAngle.toFixed(2)}°` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Coordinate Table */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-violet-800">
                Bảng tọa độ điểm ({allPoints.length})
              </h3>
              {customPoints.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomPoints([]);
                    setCustomSegments([]);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Xóa điểm tự thêm
                </button>
              )}
            </div>
            <div className="max-h-36 overflow-y-auto divide-y divide-violet-100 text-xs">
              {allPoints.map((pt) => (
                <div key={pt.id} className="py-1.5 flex items-center justify-between tabular-nums">
                  <span className="font-bold text-indigo-950">{pt.label}</span>
                  <span className="font-mono text-slate-600">
                    ({pt.x.toFixed(2)}, {pt.y.toFixed(2)}, {pt.z.toFixed(2)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
