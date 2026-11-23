import type { PhysicsCatalogItem } from '../../types/physics';

export function PhysicsPreviewThumb({
  previewType,
}: {
  previewType: PhysicsCatalogItem['previewType'];
}) {
  return (
    <svg
      viewBox="0 0 120 48"
      className="w-full h-12 rounded-lg bg-[#0c1322] border border-slate-800/80"
      aria-hidden="true"
    >
      {previewType === 'motion' && (
        <>
          <line x1="12" y1="36" x2="108" y2="36" stroke="#334155" strokeWidth="1.5" />
          <rect x="24" y="22" width="18" height="12" rx="2" fill="#38bdf8" />
          <line x1="46" y1="28" x2="86" y2="28" stroke="#facc15" strokeWidth="2" />
          <polygon points="86,24 94,28 86,32" fill="#facc15" />
        </>
      )}
      {previewType === 'projectile' && (
        <>
          <line x1="10" y1="40" x2="110" y2="40" stroke="#334155" strokeWidth="1.5" />
          <path d="M16,38 Q60,4 102,38" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 2" />
          <circle cx="62" cy="21" r="4" fill="#facc15" />
        </>
      )}
      {previewType === 'force' && (
        <>
          <line x1="12" y1="38" x2="108" y2="14" stroke="#475569" strokeWidth="2" />
          <rect x="50" y="14" width="18" height="14" rx="2" transform="rotate(-14 59 21)" fill="#38bdf8" />
          <line x1="66" y1="20" x2="94" y2="12" stroke="#10b981" strokeWidth="2" />
        </>
      )}
      {previewType === 'energy' && (
        <>
          <rect x="28" y="12" width="14" height="28" rx="1.5" fill="#10b981" opacity="0.9" />
          <rect x="52" y="20" width="14" height="20" rx="1.5" fill="#f59e0b" opacity="0.9" />
          <rect x="76" y="8" width="14" height="32" rx="1.5" fill="#38bdf8" opacity="0.9" />
        </>
      )}
      {previewType === 'orbit' && (
        <>
          <ellipse cx="60" cy="24" rx="40" ry="15" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="60" cy="24" r="6" fill="#f59e0b" />
          <circle cx="96" cy="18" r="3.5" fill="#38bdf8" />
        </>
      )}
      {previewType === 'oscillation' && (
        <path
          d="M12,24 Q24,6 36,24 T60,24 T84,24 T108,24"
          fill="none"
          stroke="#a855f7"
          strokeWidth="2"
        />
      )}
      {previewType === 'wave' && (
        <>
          <path d="M10,24 Q25,8 40,24 T70,24 T100,24" fill="none" stroke="#38bdf8" strokeWidth="2" />
          <path d="M10,24 Q25,40 40,24 T70,24 T100,24" fill="none" stroke="#6366f1" strokeWidth="1.2" opacity="0.65" />
        </>
      )}
      {previewType === 'thermo' && (
        <>
          <rect x="26" y="10" width="68" height="28" rx="3" fill="none" stroke="#475569" strokeWidth="1.5" />
          <circle cx="42" cy="20" r="2.5" fill="#f43f5e" />
          <circle cx="58" cy="28" r="2.5" fill="#38bdf8" />
          <circle cx="76" cy="18" r="2.5" fill="#f59e0b" />
        </>
      )}
      {previewType === 'electric' && (
        <>
          <circle cx="36" cy="24" r="6" fill="#ef4444" />
          <circle cx="84" cy="24" r="6" fill="#3b82f6" />
          <path d="M44,24 L76,24" stroke="#38bdf8" strokeWidth="1.5" />
          <path d="M42,18 Q60,8 78,18" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
          <path d="M42,30 Q60,40 78,30" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
        </>
      )}
      {previewType === 'magnetic' && (
        <>
          <rect x="20" y="14" width="22" height="20" rx="2" fill="#3b82f6" />
          <rect x="42" y="14" width="22" height="20" rx="2" fill="#ef4444" />
          <ellipse cx="86" cy="24" rx="8" ry="14" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
        </>
      )}
      {previewType === 'optics' && (
        <>
          <line x1="60" y1="6" x2="60" y2="42" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="16" y1="14" x2="60" y2="14" stroke="#facc15" strokeWidth="1.5" />
          <line x1="60" y1="14" x2="104" y2="32" stroke="#facc15" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}
