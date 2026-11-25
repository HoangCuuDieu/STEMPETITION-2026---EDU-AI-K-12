import { MATH_SOLIDS } from './utils/mathGeometry';
import type { KnowledgeEntry } from './types/assistant';
import { SignIn } from './SignIn';
import { AccountContext, request, type Account } from './services/account';
import { useEffect, useState, type ComponentType } from 'react';
import {
  Atom,
  Award,
  BookOpen,
  Box,
  ClipboardCheck,
  FlaskConical,
  GraduationCap,
  Sparkles,
  Waves,
} from 'lucide-react';
import { AssistantView } from './components/assistant/AssistantView';
import { ChemistryLabView } from './components/chemistry/ChemistryLabView';
import { GradingView } from './components/grading/GradingView';
import { KnowledgeBaseView } from './components/knowledge/KnowledgeBaseView';
import { SpatialGeometryLab } from './components/math/SpatialGeometryLab';
import { PhysicsLabView } from './components/physics/PhysicsLabView';
import { ProgressView } from './components/progress/ProgressView';
import type { AppTab, InternalModelLink, LabDomain } from './types/assistant';

const NAV_TABS: {
  id: AppTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
  activeClass: string;
  underlineClass: string;
}[] = [
  {
    id: 'assistant',
    label: 'Trợ lý AI',
    icon: Sparkles,
    activeClass: 'text-violet-700 font-semibold',
    underlineClass: 'bg-gradient-to-r from-violet-600 to-fuchsia-500',
  },
  {
    id: 'lab',
    label: 'Phòng thí nghiệm',
    icon: FlaskConical,
    activeClass: 'text-sky-700 font-semibold',
    underlineClass: 'bg-gradient-to-r from-sky-500 to-indigo-600',
  },
  {
    id: 'grading',
    label: 'Chấm bài',
    icon: ClipboardCheck,
    activeClass: 'text-amber-700 font-semibold',
    underlineClass: 'bg-gradient-to-r from-amber-500 to-rose-500',
  },
  {
    id: 'knowledge',
    label: 'Kho kiến thức',
    icon: BookOpen,
    activeClass: 'text-teal-700 font-semibold',
    underlineClass: 'bg-gradient-to-r from-teal-500 to-emerald-500',
  },
  {
    id: 'progress',
    label: 'Tiến độ',
    icon: Award,
    activeClass: 'text-indigo-700 font-semibold',
    underlineClass: 'bg-gradient-to-r from-indigo-500 to-purple-500',
  },
];

export default function App() {
  const [user, setUser] = useState<Account | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const account = await request('auth/me');
        if (active) setUser(account.id ? account : null);
      } catch { if (active) setUser(null); }
      finally { if (active) setChecking(false); }
    }
    const expire = () => setUser(null);
    window.addEventListener('session-expired', expire);
    void refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); window.removeEventListener('session-expired', expire); };
  }, []);
  if (!user) return <SignIn checking={checking} onLogin={setUser}/>;
  return <AccountContext.Provider value={user}><Workspace key={user.id} user={user} onLogout={() => setUser(null)}/></AccountContext.Provider>;
}

function Workspace({user, onLogout}: {user: Account; onLogout: () => void}) {
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  async function logout() {
    setLoggingOut(true);
    try { await request('auth/logout', {}); onLogout(); }
    catch { setLogoutError('Đăng xuất chưa thành công. Vui lòng thử lại.'); setLoggingOut(false); }
  }
  const [lesson, setLesson] = useState<KnowledgeEntry | null>(null);
  const [visitedAssistant, setVisitedAssistant] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('lab');
  useEffect(() => { if (activeTab === 'assistant') setVisitedAssistant(true); }, [activeTab]);
  const [labDomain, setLabDomain] = useState<LabDomain>('physics');
  const [selectedMathId, setSelectedMathId] = useState<string>('math-pyramid');
  const [selectedPhysicsId, setSelectedPhysicsId] = useState<string>('phys-05');
  const [selectedChemistryId, setSelectedChemistryId] = useState<string>('chem-072');

  const handleOpenModel = (link: InternalModelLink) => {
    setLabDomain(link.domain);
    if (link.domain === 'math') setSelectedMathId(link.id);
    if (link.domain === 'physics') setSelectedPhysicsId(link.id);
    if (link.domain === 'chemistry') setSelectedChemistryId(link.id);
    setActiveTab('lab');
  };

  return (
    <div className="min-h-screen flex flex-col bg-vibrant-studio text-slate-900">
      {/* Top Rainbow Accent Ribbon + Friendly Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-indigo-100/90 bg-white/92 backdrop-blur-md shadow-[0_2px_12px_rgba(79,70,229,0.06)]">
        <div
          aria-hidden="true"
          className="h-1 w-full bg-gradient-to-r from-violet-600 via-sky-500 via-50% to-emerald-500"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-15 flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Friendly Brand Emblem + Gradient Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('lab')}
            className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-violet-600 rounded-lg"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 via-sky-500 to-emerald-500 text-white inline-flex items-center justify-center shadow-sm shadow-sky-500/25">
              <GraduationCap className="w-4.5 h-4.5" />
            </span>
            <span className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-violet-700 via-sky-700 to-emerald-600 bg-clip-text text-transparent">
              EduMind AI
            </span>
          </button>

          {/* Zone 2 (Desktop): Colorful Icon + Typographic Nav */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden lg:flex items-center gap-4 h-full"
          >
            {NAV_TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative h-full inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-sky-600 ${
                    active ? tab.activeClass : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full ${tab.underlineClass}`}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'lab' ? 'assistant' : 'lab')}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 text-white hover:brightness-110 transition-all whitespace-nowrap shrink-0 shadow-sm shadow-indigo-500/25"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {activeTab === 'lab' ? 'Hỏi Trợ lý' : 'Mở Thí nghiệm'}
          </button>
          <details className="relative min-w-0 text-center text-sm" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.open = false; }} onKeyDown={e => { if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary')?.focus(); } }}>
            <summary title={user.name} className="block max-w-32 truncate cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold">{user.name}</summary>
            <div className="absolute inset-x-0 top-full mt-1">
              <button disabled={loggingOut} aria-busy={loggingOut} onClick={logout} className="w-full rounded-xl border border-slate-200 bg-white py-2 shadow">Đăng xuất</button>
            </div>
          </details>
          </div>
        </div>

        {/* Mobile sub-navigation bar so all 5 tabs remain unclipped on narrow screens */}
        <nav
          aria-label="Điều hướng di động"
          className="lg:hidden border-t border-indigo-100/70 px-2.5 h-10 flex items-center justify-between gap-1 overflow-x-auto bg-white/80"
        >
          {NAV_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative h-full inline-flex items-center px-1 text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                  active ? tab.activeClass : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {tab.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full ${tab.underlineClass}`}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {logoutError && <p role="alert">{logoutError}</p>}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {activeTab === 'lab' && (
          <div className="space-y-6">
            {/* Vibrant Subject-Coded Lab Domain Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-indigo-100/90 bg-white/95 px-3 sm:px-4 py-3 shadow-[0_4px_20px_rgba(99,102,241,0.06)]">
              <div
                role="tablist"
                aria-label="Lĩnh vực phòng thí nghiệm"
                className="grid grid-cols-3 sm:inline-flex w-full sm:w-auto items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/70"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={labDomain === 'math'}
                  onClick={() => setLabDomain('math')}
                  className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 text-[10.5px] sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    labDomain === 'math'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm shadow-violet-500/25'
                      : 'text-slate-600 hover:text-violet-700 hover:bg-violet-50/70'
                  }`}
                >
                  <Box className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  Toán học 3D ({MATH_SOLIDS.length})
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={labDomain === 'physics'}
                  onClick={() => setLabDomain('physics')}
                  className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 text-[10.5px] sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    labDomain === 'physics'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-500/25'
                      : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/70'
                  }`}
                >
                  <Waves className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  Vật lý 2D (50)
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={labDomain === 'chemistry'}
                  onClick={() => setLabDomain('chemistry')}
                  className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 text-[10.5px] sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    labDomain === 'chemistry'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/25'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70'
                  }`}
                >
                  <Atom className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  Hóa học 3D (100)
                </button>
              </div>

              <div className="text-xs font-semibold">
                {labDomain === 'math' && (
                  <span className="text-violet-700">
                    Hình học không gian 3D · Đặt điểm & đo khoảng cách, góc
                  </span>
                )}
                {labDomain === 'physics' && (
                  <span className="text-sky-700">
                    50 mô phỏng tương tác tính toán theo thời gian thực
                  </span>
                )}
                {labDomain === 'chemistry' && (
                  <span className="text-emerald-700">
                    100 cấu trúc phân tử & tinh thể 3D tương tác
                  </span>
                )}
              </div>
            </div>

            {labDomain === 'math' && (
              <SpatialGeometryLab initialSolidId={selectedMathId} />
            )}
            {labDomain === 'physics' && (
              <PhysicsLabView initialSimulationId={selectedPhysicsId} />
            )}
            {labDomain === 'chemistry' && (
              <ChemistryLabView initialModelId={selectedChemistryId} />
            )}
          </div>
        )}

        {(activeTab === 'assistant' || visitedAssistant) && (
          <div hidden={activeTab !== 'assistant'}><AssistantView onOpenModel={handleOpenModel} lesson={lesson} onRemoveLesson={item => setLesson(current => current === item ? null : current)} /></div>
        )}

        {activeTab === 'grading' && <GradingView />}

        {activeTab === 'knowledge' && (
          <KnowledgeBaseView onOpenModel={handleOpenModel} onAsk={item => { setLesson(item); setActiveTab('assistant'); }} />
        )}

        {activeTab === 'progress' && <ProgressView />}
      </main>
    </div>
  );
}


