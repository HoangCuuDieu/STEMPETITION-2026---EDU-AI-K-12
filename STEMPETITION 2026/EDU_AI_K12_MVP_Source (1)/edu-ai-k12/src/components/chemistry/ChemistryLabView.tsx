import { useEffect, useMemo, useRef, useState } from 'react';
import { Atom, GitCompare, Search, Star } from 'lucide-react';
import { CHEMISTRY_CATALOG } from '../../data/chemistry/catalog100';
import { loadChemicalModelById } from '../../data/chemistry/loader';
import { getFavoritesByDomain, toggleFavorite } from '../../services/db';
import type {
  Atom3D,
  ChemicalModel,
  ChemistryCategory,
  ChemistryStructureType,
} from '../../types/chemistry';
import { ChemistryViewer3D } from './ChemistryViewer3D';

interface ChemistryLabViewProps {
  initialModelId?: string;
}

const STRUCTURE_LABELS: Record<ChemistryStructureType, string> = {
  molecule: 'Phân tử cộng hóa trị',
  monatomic: 'Đơn nguyên tử (khí hiếm)',
  'ionic-crystal': 'Mạng tinh thể ion',
  'metal-crystal': 'Mạng tinh thể kim loại',
  'covalent-network': 'Mạng tinh thể cộng hóa trị',
};

const CATEGORY_LABELS: Record<ChemistryCategory, string> = {
  element: 'Đơn chất (20)',
  inorganic: 'Hợp chất vô cơ (40)',
  organic: 'Hợp chất hữu cơ (40)',
};

export function ChemistryLabView({ initialModelId }: ChemistryLabViewProps) {
  const [selectedId, setSelectedId] = useState<string>(
    () => initialModelId || 'chem-072',
  );
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ChemistryCategory>('ALL');
  const [structureFilter, setStructureFilter] = useState<'ALL' | ChemistryStructureType>('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  const [activeModel, setActiveModel] = useState<ChemicalModel | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [selectedAtom, setSelectedAtom] = useState<Atom3D | null>(null);

  const viewerTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialModelId && CHEMISTRY_CATALOG.some((c) => c.id === initialModelId)) {
      setSelectedId(initialModelId);
    }
  }, [initialModelId]);

  useEffect(() => {
    getFavoritesByDomain('chemistry')
      .then(setFavorites)
      .catch(() => setFavorites([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const meta = CHEMISTRY_CATALOG.find((c) => c.id === selectedId);
    setLoadingModel(true);
    setSelectedAtom(null);
    loadChemicalModelById(selectedId, meta?.category)
      .then((model) => {
        if (cancelled || !model) return;
        setActiveModel(model);
        setLoadingModel(false);
      })
      .catch(() => {
        if (!cancelled) setLoadingModel(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const isomerPeers = useMemo(() => {
    if (!activeModel?.isomerGroup) return [];
    return CHEMISTRY_CATALOG.filter(
      (c) => c.isomerGroup === activeModel.isomerGroup && c.id !== activeModel.id,
    );
  }, [activeModel]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CHEMISTRY_CATALOG.filter((item) => {
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (structureFilter !== 'ALL' && item.structureType !== structureFilter) return false;
      if (onlyFavorites && !favorites.includes(item.id)) return false;
      if (q) {
        const hay = `${item.nameVi} ${item.nameEn} ${item.formula} ${item.orderNumber}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [search, categoryFilter, structureFilter, onlyFavorites, favorites]);

  const handleToggleFavorite = async (id: string) => {
    const next = await toggleFavorite(id, 'chemistry');
    setFavorites((prev) =>
      next ? [...new Set([...prev, id])] : prev.filter((f) => f !== id),
    );
  };

  const isFav = activeModel ? favorites.includes(activeModel.id) : false;

  const categoryBadgeColor = (cat: ChemistryCategory) => {
    if (cat === 'element') return 'bg-amber-100/90 text-amber-900 border-amber-200';
    if (cat === 'inorganic') return 'bg-sky-100/90 text-sky-900 border-sky-200';
    return 'bg-emerald-100/90 text-emerald-900 border-emerald-200';
  };

  return (
    <div className="space-y-6">
      {/* Active 3D Chemical Structure Workspace */}
      <div
        ref={viewerTopRef}
        className="scroll-mt-20 rounded-2xl border border-emerald-200/80 bg-white/95 p-5 sm:p-6 shadow-[0_6px_28px_rgba(16,185,129,0.07)] space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-emerald-100 pb-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 tabular-nums">
              {activeModel
                ? `Chất #${activeModel.orderNumber}/100 · ${CATEGORY_LABELS[activeModel.category]} · ${STRUCTURE_LABELS[activeModel.structureType]}`
                : 'Đang nạp cấu trúc 3D...'}
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950">
                {activeModel?.nameVi || 'Phòng thí nghiệm Hóa học 3D'}
              </h2>
              {activeModel && (
                <span className="text-lg font-mono font-bold px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/80">
                  {activeModel.formula}
                </span>
              )}
              {activeModel?.molarMass && (
                <span className="text-xs font-semibold text-slate-600 tabular-nums">
                  M = {activeModel.molarMass} g/mol
                </span>
              )}
            </div>
          </div>

          {activeModel && (
            <button
              type="button"
              onClick={() => handleToggleFavorite(activeModel.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors ${
                isFav
                  ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                  : 'border-emerald-200 bg-white text-slate-700 hover:bg-amber-50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500 text-amber-500' : 'text-amber-500'}`} />
              {isFav ? 'Đã lưu' : 'Yêu thích'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 3D Viewport (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {activeModel ? (
              <ChemistryViewer3D
                model={activeModel}
                selectedAtomId={selectedAtom?.id ?? null}
                onSelectAtom={setSelectedAtom}
              />
            ) : (
              <div className="h-[480px] rounded-2xl bg-[#0c1322] flex items-center justify-center text-sm text-slate-300">
                {loadingModel ? 'Đang tải tọa độ 3D...' : 'Chọn một chất từ thư viện bên dưới'}
              </div>
            )}

            <div className="rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-white to-sky-50/70 px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-2">
              {selectedAtom ? (
                <>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Atom className="w-4 h-4 text-amber-600" />
                    <span>
                      Nguyên tử #{selectedAtom.id + 1}: {selectedAtom.element} (Z ={' '}
                      {selectedAtom.atomicNumber})
                      {selectedAtom.formalCharge
                        ? ` · Điện tích hình thức: ${selectedAtom.formalCharge > 0 ? `+${selectedAtom.formalCharge}` : selectedAtom.formalCharge}`
                        : ''}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-indigo-700 tabular-nums">
                    Tọa độ: ({selectedAtom.x.toFixed(2)}, {selectedAtom.y.toFixed(2)},{' '}
                    {selectedAtom.z.toFixed(2)}) Å
                  </span>
                </>
              ) : (
                <span className="text-slate-700 font-medium">
                  Nhấp trực tiếp vào một nguyên tử trong khung 3D để xem thông tin chi tiết và tọa độ Ångström.
                </span>
              )}
            </div>
          </div>

          {/* Right Unified Colorful Chemical Dossier (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 via-white to-teal-50/30 divide-y divide-emerald-100">
            {isomerPeers.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 space-y-2 rounded-t-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <GitCompare className="w-4 h-4 text-violet-600" />
                  So sánh đồng phân / thù hình cùng nhóm ({activeModel?.isomerGroup})
                </div>
                <div className="flex flex-wrap gap-2">
                  {isomerPeers.map((peer) => (
                    <button
                      key={peer.id}
                      type="button"
                      onClick={() => setSelectedId(peer.id)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors shadow-xs"
                    >
                      Chuyển sang {peer.nameVi} ({peer.formula})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeModel && (
              <>
                <div className="p-4 grid grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/70">
                    <span className="text-emerald-700 font-semibold block">Nguyên tử</span>
                    <span className="text-base font-extrabold text-emerald-950 font-mono-tabular">
                      {activeModel.atoms.length}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-sky-50/90 border border-sky-200/70">
                    <span className="text-sky-700 font-semibold block">Liên kết</span>
                    <span className="text-base font-extrabold text-sky-950 font-mono-tabular">
                      {activeModel.bonds.length}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-violet-50/90 border border-violet-200/70">
                    <span className="text-violet-700 font-semibold block">Tên tiếng Anh</span>
                    <span className="font-bold text-violet-950 truncate block mt-0.5">
                      {activeModel.nameEn}
                    </span>
                  </div>
                </div>

                {activeModel.geometryDescription && (
                  <div className="p-4 space-y-1">
                    <h4 className="text-xs font-bold text-emerald-800">Cấu trúc không gian 3D</h4>
                    <p className="text-[13px] text-slate-700 leading-relaxed">
                      {activeModel.geometryDescription}
                    </p>
                  </div>
                )}

                {activeModel.lattice && (
                  <div className="p-4 bg-sky-50/40 space-y-1.5 text-xs">
                    <div className="font-bold text-sky-950">
                      Thông số mạng tinh thể ({activeModel.lattice.crystalSystem} · Bravais{' '}
                      {activeModel.lattice.bravaisType})
                    </div>
                    <div className="font-mono font-semibold text-sky-800 tabular-nums">
                      a = {activeModel.lattice.a} Å · b = {activeModel.lattice.b} Å · c ={' '}
                      {activeModel.lattice.c} Å | α = {activeModel.lattice.alpha}°, β ={' '}
                      {activeModel.lattice.beta}°, γ = {activeModel.lattice.gamma}°
                    </div>
                    <p className="text-slate-600">{activeModel.lattice.cellRepresentationNote}</p>
                  </div>
                )}

                <div className="p-4 space-y-1.5">
                  <h4 className="text-xs font-bold text-teal-800">Tính chất đặc trưng</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700 leading-relaxed">
                    {activeModel.properties.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 space-y-1.5">
                  <h4 className="text-xs font-bold text-amber-800">Ứng dụng thực tiễn</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700 leading-relaxed">
                    {activeModel.applications.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 100 Chemical Models Library Grid */}
      <div className="rounded-2xl border border-emerald-200/80 bg-white/95 p-5 sm:p-6 shadow-[0_6px_28px_rgba(16,185,129,0.06)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-950">
              Thư viện 100 mô hình Hóa học 3D (20 đơn chất · 40 vô cơ · 40 hữu cơ)
            </h3>
            <p className="text-xs font-medium text-emerald-700 tabular-nums mt-0.5">
              Hiển thị {filteredCatalog.length}/100 cấu trúc đã kiểm định tọa độ 3D
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên hoặc công thức..."
                className="pl-8 pr-3 py-2 text-xs sm:text-sm border border-emerald-200 rounded-xl w-52 bg-emerald-50/30 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | ChemistryCategory)}
              className="px-2.5 py-2 text-xs sm:text-sm border border-emerald-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Tất cả 100 chất</option>
              <option value="element">20 Đơn chất</option>
              <option value="inorganic">40 Hợp chất vô cơ</option>
              <option value="organic">40 Hợp chất hữu cơ</option>
            </select>

            <select
              value={structureFilter}
              onChange={(e) =>
                setStructureFilter(e.target.value as 'ALL' | ChemistryStructureType)
              }
              className="px-2.5 py-2 text-xs sm:text-sm border border-emerald-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Mọi kiểu cấu trúc</option>
              <option value="molecule">Phân tử</option>
              <option value="ionic-crystal">Tinh thể ion</option>
              <option value="metal-crystal">Tinh thể kim loại</option>
              <option value="covalent-network">Mạng cộng hóa trị</option>
              <option value="monatomic">Đơn nguyên tử</option>
            </select>

            <button
              type="button"
              onClick={() => setOnlyFavorites((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                onlyFavorites
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'border-emerald-200 text-slate-700 hover:bg-amber-50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-amber-500'}`} />
              Yêu thích ({favorites.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredCatalog.map((item) => {
            const active = item.id === selectedId;
            const fav = favorites.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedId(item.id);
                  viewerTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`group text-left rounded-xl border p-3.5 transition-all space-y-1.5 hover:-translate-y-0.5 ${
                  active
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 ring-2 ring-emerald-500/80 shadow-md shadow-emerald-500/10'
                    : 'border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/5'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] tabular-nums">
                  <span
                    className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${categoryBadgeColor(item.category)}`}
                  >
                    #{item.orderNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {item.isomerGroup && (
                      <span className="px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-800 text-[10px] font-bold">
                        Đồng phân
                      </span>
                    )}
                    {fav && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />}
                  </div>
                </div>
                <div className="text-base font-mono font-extrabold text-slate-950 group-hover:text-emerald-700">
                  {item.formula}
                </div>
                <div className="text-xs font-bold text-slate-800 truncate">{item.nameVi}</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {STRUCTURE_LABELS[item.structureType]}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
