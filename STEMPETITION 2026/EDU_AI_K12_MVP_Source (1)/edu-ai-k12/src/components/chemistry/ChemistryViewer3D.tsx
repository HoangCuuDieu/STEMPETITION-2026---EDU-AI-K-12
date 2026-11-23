import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Eye, EyeOff, Link2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import type { Atom3D, ChemicalModel } from '../../types/chemistry';
import {
  afterDraw,
  attachStudioEnvironment,
  createStudioRenderer,
  disposeSceneObjects,
} from '../../utils/webgl';

export type ChemistryDisplayStyle = 'ball-stick' | 'space-fill' | 'wireframe';

interface ChemistryViewer3DProps {
  model: ChemicalModel;
  selectedAtomId: number | null;
  onSelectAtom: (atom: Atom3D | null) => void;
}

const CPK_COLOR: Record<string, string> = {
  H: '#f8fafc',
  He: '#d9ffff',
  B: '#ffb5b5',
  C: '#334155',
  N: '#2563eb',
  O: '#dc2626',
  F: '#22c55e',
  Ne: '#b3e3f5',
  Na: '#8b5cf6',
  Mg: '#16a34a',
  Al: '#94a3b8',
  Si: '#d97706',
  P: '#ea580c',
  S: '#eab308',
  Cl: '#10b981',
  Ar: '#80d1e3',
  K: '#7c3aed',
  Ca: '#059669',
  Fe: '#b45309',
  Cu: '#c2410c',
  Br: '#991b1b',
  I: '#7e22ce',
};

const COVALENT_RADIUS: Record<string, number> = {
  H: 0.28,
  He: 0.45,
  B: 0.48,
  C: 0.44,
  N: 0.42,
  O: 0.4,
  F: 0.38,
  Ne: 0.48,
  Na: 0.62,
  Mg: 0.56,
  Al: 0.54,
  Si: 0.52,
  P: 0.5,
  S: 0.49,
  Cl: 0.48,
  Ar: 0.56,
  K: 0.7,
  Ca: 0.64,
  Fe: 0.56,
  Cu: 0.56,
  Br: 0.54,
  I: 0.59,
};

const VDW_RADIUS: Record<string, number> = {
  H: 0.95,
  He: 1.15,
  B: 1.45,
  C: 1.38,
  N: 1.3,
  O: 1.25,
  F: 1.2,
  Ne: 1.25,
  Na: 1.6,
  Mg: 1.45,
  Al: 1.45,
  Si: 1.55,
  P: 1.48,
  S: 1.48,
  Cl: 1.45,
  Ar: 1.5,
  K: 1.75,
  Ca: 1.65,
  Fe: 1.5,
  Cu: 1.45,
  Br: 1.55,
  I: 1.65,
};

const BG_PRESETS = [
  { id: 'dark', label: 'Nền tối', hex: '#0c1322', darkText: false },
  { id: 'slate', label: 'Xanh than', hex: '#1e293b', darkText: false },
  { id: 'light', label: 'Lab sáng', hex: '#f1f5f9', darkText: true },
];

interface ProjectedAtomLabel {
  id: number;
  text: string;
  x: number;
  y: number;
  visible: boolean;
}

export function ChemistryViewer3D({
  model,
  selectedAtomId,
  onSelectAtom,
}: ChemistryViewer3DProps) {
  const [displayStyle, setDisplayStyle] = useState<ChemistryDisplayStyle>('ball-stick');
  const [showBonds, setShowBonds] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [bgHex, setBgHex] = useState('#0c1322');
  const [projectedLabels, setProjectedLabels] = useState<ProjectedAtomLabel[]>([]);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const contentGroupRef = useRef<THREE.Group | null>(null);
  const atomMeshesRef = useRef<THREE.Mesh[]>([]);
  const requestRenderRef = useRef<() => void>(() => {});
  const defaultDistRef = useRef<number>(6.5);
  const atomsRef = useRef<Atom3D[]>(model.atoms);
  atomsRef.current = model.atoms;
  const onSelectAtomRef = useRef(onSelectAtom);
  onSelectAtomRef.current = onSelectAtom;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 480;
    const { renderer, isSoftwareGl } = createStudioRenderer(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgHex);
    sceneRef.current = scene;
    const envTex = attachStudioEnvironment(renderer, scene);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 150);
    camera.position.set(0, 2.2, 6.5);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.8;
    controls.maxDistance = 40;
    controlsRef.current = controls;

    // Three-Point Studio Lighting (Key, Fill, Rim)
    const keyLight = new THREE.DirectionalLight('#fff7ed', 1.45);
    keyLight.position.set(6, 8, 7);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#bae6fd', 0.65);
    fillLight.position.set(-6, -4, 4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.55);
    rimLight.position.set(0, 6, -8);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight('#ffffff', 0.35));

    const contentGroup = new THREE.Group();
    scene.add(contentGroup);
    contentGroupRef.current = contentGroup;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const scratchVec = new THREE.Vector3();

    let rafId = 0;
    let drawPending = false;
    let disposed = false;
    let pointerDownPos = { x: 0, y: 0 };

    const updateLabels = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 480;
      const next: ProjectedAtomLabel[] = atomsRef.current.map((atom) => {
        scratchVec.set(atom.x, atom.y, atom.z).project(camera);
        return {
          id: atom.id,
          text: atom.label || `${atom.element}${atom.id + 1}`,
          x: (scratchVec.x * 0.5 + 0.5) * w,
          y: (-scratchVec.y * 0.5 + 0.5) * h,
          visible: scratchVec.z >= -1 && scratchVec.z <= 1,
        };
      });
      setProjectedLabels(next);
    };

    const renderFrame = () => {
      if (disposed) return;
      drawPending = false;
      controls.update();
      renderer.render(scene, camera);
      updateLabels();
    };

    const requestRender = () => {
      if (disposed || drawPending) return;
      drawPending = true;
      rafId = window.requestAnimationFrame(renderFrame);
    };
    requestRenderRef.current = requestRender;

    controls.addEventListener('change', requestRender);

    const onPointerDown = (ev: PointerEvent) => {
      pointerDownPos = { x: ev.clientX, y: ev.clientY };
    };

    const onPointerUp = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - pointerDownPos.x, ev.clientY - pointerDownPos.y);
      if (dist > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(atomMeshesRef.current, false);
      if (hits.length > 0) {
        const hitAtom = hits[0].object.userData.atom as Atom3D | undefined;
        onSelectAtomRef.current(hitAtom ?? null);
      } else {
        onSelectAtomRef.current(null);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const ro = new ResizeObserver(() => {
      if (disposed || !container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    });
    ro.observe(container);

    const fenceTimer = afterDraw(renderer, () => {
      if (!disposed) updateLabels();
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(fenceTimer);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.removeEventListener('change', requestRender);
      controls.dispose();
      disposeSceneObjects(scene);
      envTex.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(bgHex);
      requestRenderRef.current();
    }
  }, [bgHex]);

  useEffect(() => {
    const group = contentGroupRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!group || !camera || !controls) return;

    disposeSceneObjects(group);
    group.clear();
    atomMeshesRef.current = [];

    const atomMap = new Map(model.atoms.map((a) => [a.id, a]));
    const sphereGeo = new THREE.SphereGeometry(1, 24, 24);
    const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 12);

    for (const atom of model.atoms) {
      const baseColor = CPK_COLOR[atom.element] || '#cbd5e1';
      const isSelected = atom.id === selectedAtomId;
      const radius =
        displayStyle === 'space-fill'
          ? VDW_RADIUS[atom.element] ?? 1.35
          : displayStyle === 'wireframe'
            ? (COVALENT_RADIUS[atom.element] ?? 0.42) * 0.45
            : COVALENT_RADIUS[atom.element] ?? 0.42;

      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.25,
        metalness: model.structureType === 'metal-crystal' ? 0.58 : 0.14,
        wireframe: displayStyle === 'wireframe',
        emissive: isSelected ? new THREE.Color('#f59e0b') : new THREE.Color('#000000'),
        emissiveIntensity: isSelected ? 0.5 : 0,
      });

      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.set(atom.x, atom.y, atom.z);
      mesh.scale.setScalar(radius);
      mesh.userData.atom = atom;
      group.add(mesh);
      atomMeshesRef.current.push(mesh);

      if (isSelected) {
        const ringGeo = new THREE.TorusGeometry(radius * 1.35, 0.045, 10, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(atom.x, atom.y, atom.z);
        group.add(ring);
      }
    }

    if (showBonds && displayStyle !== 'space-fill') {
      const up = new THREE.Vector3(0, 1, 0);
      const vStart = new THREE.Vector3();
      const vEnd = new THREE.Vector3();
      const dir = new THREE.Vector3();
      const mid = new THREE.Vector3();
      const perp = new THREE.Vector3();
      const quat = new THREE.Quaternion();

      for (const bond of model.bonds) {
        const a1 = atomMap.get(bond.fromAtomId);
        const a2 = atomMap.get(bond.toAtomId);
        if (!a1 || !a2) continue;

        vStart.set(a1.x, a1.y, a1.z);
        vEnd.set(a2.x, a2.y, a2.z);
        dir.subVectors(vEnd, vStart);
        const len = dir.length();
        if (len < 1e-4) continue;

        const dirNorm = dir.clone().normalize();
        quat.setFromUnitVectors(up, dirNorm);
        mid.addVectors(vStart, vEnd).multiplyScalar(0.5);

        perp.set(1, 0, 0);
        if (Math.abs(dirNorm.dot(perp)) > 0.9) perp.set(0, 0, 1);
        perp.crossVectors(dirNorm, perp).normalize();

        const isCoord = bond.type === 'ionic-coordination' || bond.type === 'metallic';
        const bondColor =
          bond.type === 'ionic-coordination'
            ? '#64748b'
            : bond.type === 'metallic'
              ? '#94a3b8'
              : bond.type === 'aromatic'
                ? '#38bdf8'
                : '#cbd5e1';

        const mat = new THREE.MeshStandardMaterial({
          color: bondColor,
          roughness: 0.35,
          metalness: 0.18,
          transparent: isCoord,
          opacity: isCoord ? 0.5 : 1,
          wireframe: displayStyle === 'wireframe',
        });

        const baseRadius = displayStyle === 'wireframe' ? 0.035 : isCoord ? 0.045 : 0.075;
        const offsets =
          bond.order === 2
            ? [-0.09, 0.09]
            : bond.order === 3
              ? [-0.11, 0, 0.11]
              : bond.order === 1.5
                ? [-0.07, 0.07]
                : [0];

        offsets.forEach((off, idx) => {
          const stick = new THREE.Mesh(
            cylGeo,
            idx === 1 && bond.order === 1.5
              ? new THREE.MeshStandardMaterial({
                  color: '#38bdf8',
                  roughness: 0.35,
                  transparent: true,
                  opacity: 0.6,
                })
              : mat,
          );
          stick.position.copy(mid).addScaledVector(perp, off);
          stick.quaternion.copy(quat);
          stick.scale.set(
            offsets.length > 1 ? baseRadius * 0.72 : baseRadius,
            len,
            offsets.length > 1 ? baseRadius * 0.72 : baseRadius,
          );
          group.add(stick);
        });
      }
    }

    const box = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const maxDim = Math.max(2.2, size.x, size.y, size.z);
    const dist = maxDim * 1.9;
    defaultDistRef.current = dist;

    if (group.userData.lastModelId !== model.id) {
      group.userData.lastModelId = model.id;
      controls.target.copy(center);
      camera.position.set(center.x + dist * 0.35, center.y + dist * 0.28, center.z + dist * 0.9);
      controls.update();
    }

    requestRenderRef.current();
  }, [model, displayStyle, showBonds, selectedAtomId]);

  const handleResetView = () => {
    const group = contentGroupRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!group || !camera || !controls) return;
    const box = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const dist = defaultDistRef.current;
    controls.target.copy(center);
    camera.position.set(center.x + dist * 0.35, center.y + dist * 0.28, center.z + dist * 0.9);
    controls.update();
    requestRenderRef.current();
  };

  const handleZoom = (factor: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const offset = camera.position.clone().sub(controls.target);
    const nextLen = Math.max(1.8, Math.min(35, offset.length() * factor));
    offset.setLength(nextLen);
    camera.position.copy(controls.target).add(offset);
    controls.update();
    requestRenderRef.current();
  };

  const isLightBg = BG_PRESETS.find((b) => b.hex === bgHex)?.darkText ?? false;

  return (
    <div className="space-y-3">
      <div
        className="relative rounded-2xl border-2 border-emerald-950/20 overflow-hidden h-[480px] shadow-md"
        style={{ backgroundColor: bgHex }}
      >
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {showLabels && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {projectedLabels.map(
              (lbl) =>
                lbl.visible && (
                  <div
                    key={lbl.id}
                    style={{
                      transform: `translate(${Math.round(lbl.x)}px, ${Math.round(lbl.y - 18)}px)`,
                    }}
                    className={`absolute top-0 left-0 -translate-x-1/2 px-1.5 py-0.5 text-[10px] font-bold rounded-md border shadow-xs ${
                      lbl.id === selectedAtomId
                        ? 'bg-amber-400 text-slate-950 border-amber-200'
                        : isLightBg
                          ? 'bg-white/95 text-slate-900 border-emerald-300'
                          : 'bg-slate-900/90 text-emerald-200 border-emerald-500/40'
                    }`}
                  >
                    {lbl.text}
                  </div>
                ),
            )}
          </div>
        )}

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleZoom(0.8)}
            title="Phóng to"
            className="p-2 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700 hover:bg-emerald-900 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(1.25)}
            title="Thu nhỏ"
            className="p-2 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700 hover:bg-emerald-900 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700 hover:bg-emerald-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            Đặt lại góc nhìn
          </button>
        </div>
      </div>

      {/* Colorful Viewer Interaction Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/70 px-3.5 py-2.5">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-emerald-100/70 border border-emerald-200/60">
          {(
            [
              { id: 'ball-stick', label: 'Que – Cầu' },
              { id: 'space-fill', label: 'Đặc khít (VDW)' },
              { id: 'wireframe', label: 'Khung dây' },
            ] as const
          ).map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => setDisplayStyle(style.id)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                displayStyle === style.id
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-emerald-900'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLabels((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
              showLabels
                ? 'bg-sky-100 border-sky-300 text-sky-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Ký hiệu
          </button>

          <button
            type="button"
            onClick={() => setShowBonds((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
              showBonds
                ? 'bg-violet-100 border-violet-300 text-violet-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Liên kết
          </button>

          <div className="flex items-center gap-1.5 border-l border-emerald-200 pl-2.5">
            {BG_PRESETS.map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => setBgHex(bg.hex)}
                title={bg.label}
                className={`w-5 h-5 rounded-md border transition-transform hover:scale-110 ${
                  bgHex === bg.hex ? 'ring-2 ring-emerald-500 border-white' : 'border-slate-300'
                }`}
                style={{ backgroundColor: bg.hex }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
