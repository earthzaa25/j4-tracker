import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShieldCheck, LayoutDashboard, ScrollText, FilePlus, 
  History as HistoryIcon, LogOut, Bot, MessageCircle, Send, 
  Filter, PieChart, BarChart, Plus, Edit, Trash2, Download, CloudUpload, ClipboardList, Building2,
  Briefcase, AlertTriangle, TrendingUp, CheckCircle, FileText, CheckSquare, ListTodo, Activity, Printer, Check, X, Lock, Key,
  UploadCloud, Clock, Trophy, Calendar, Paperclip, Bell
} from 'lucide-react';

import { createClient } from '@supabase/supabase-js';

// ============== SUPABASE SETUP ==============
// ดึงค่าเชื่อมต่อจากไฟล์ .env (สำคัญมาก ต้องมีไฟล์ .env ถึงจะบันทึกข้อมูลได้)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// ============== CONFIG ==============
const ADMIN_PASSCODE = "5721118";
const EXEC_PASSCODE = "1111";
const UNIT_PASSCODE = "1234";

const LOGO_URL = "/S__22413315.jpg";

const STATUS_COLORS = {
  'เสร็จแล้ว (100%)': '#10b981',
  'กำลังจะแล้วเสร็จ (91-99%)': '#0ea5e9',
  'ดำเนินการต่อเนื่อง (51-90%)': '#a855f7',
  'อยู่ระหว่างดำเนินการ (21-50%)': '#f97316',
  'ต่ำกว่าเกณฑ์ (0-20%)': '#ef4444'
};

const TASK_STATUS = {
  'รอดำเนินการ': 'bg-slate-700 text-slate-300 border-slate-600',
  'กำลังดำเนินการ': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'เสร็จสิ้น': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'ล่าช้า/ติดปัญหา': 'bg-red-500/20 text-red-400 border-red-500/30'
};

const TASK_STATUS_COLORS = {
  'รอดำเนินการ': '#64748b',
  'กำลังดำเนินการ': '#0ea5e9',
  'เสร็จสิ้น': '#10b981',
  'ล่าช้า/ติดปัญหา': '#ef4444'
};

const INITIAL_DATA = {
  units: [
    { id: "U-1", name: "กกล.กบ.ทหาร", passcode: "1234" },
    { id: "U-2", name: "กคง.กบ.ทหาร", passcode: "1234" },
    { id: "U-3", name: "กนผ.สสร.กบ.ทหาร", passcode: "1234" },
    { id: "U-4", name: "กสล.สสร.กบ.ทหาร", passcode: "1234" },
    { id: "U-5", name: "กบก.สสร.กบ.ทหาร", passcode: "1234" },
    { id: "U-6", name: "กยป.สสร.กบ.ทหาร", passcode: "1234" },
    { id: "U-7", name: "กบท.สบส.กบ.ทหาร", passcode: "1234" },
    { id: "U-8", name: "กจก.สบส.กบ.ทหาร", passcode: "1234" },
    { id: "U-9", name: "กขค.สบส.กบ.ทหาร", passcode: "1234" },
    { id: "U-10", name: "กมส.สบส.กบ.ทหาร", passcode: "1234" },
    { id: "U-11", name: "กสก.สบส.กบ.ทหาร", passcode: "1234" }
  ],
  policies: []
};

// ============== HELPERS ==============
const getBarColor = (p) => {
  if (p === 100) return '#10b981';
  if (p >= 91) return '#0ea5e9';
  if (p >= 51) return '#a855f7';
  if (p >= 21) return '#f97316';
  return '#ef4444';
};

const formatDate = (d) => {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }); } 
  catch (e) { return d; }
};

const getDeadlineStatus = (endDate, status) => {
  if (!endDate) return { label: '-', color: 'text-slate-400 bg-slate-800 border-slate-700' };
  if (status === 'เสร็จสิ้น') return { label: 'สำเร็จทันเวลา', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const end = new Date(endDate);
  
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { label: `ล่าช้า ${Math.abs(diffDays)} วัน`, color: 'text-red-400 bg-red-500/10 border-red-500/30 font-bold animate-pulse' };
  if (diffDays <= 7) return { label: `เหลือ ${diffDays} วัน`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  return { label: `เหลือ ${diffDays} วัน`, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
};

// ============== NOTIFICATION COMPONENT ==============
function NotificationBell({ appDb }) {
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const recentReports = useMemo(() => {
    return [...appDb.reports].sort((a, b) => new Date(b.created_at || b.report_date) - new Date(a.created_at || a.report_date)).slice(0, 8);
  }, [appDb.reports]);

  const hasNew = recentReports.some(r => {
    const diff = new Date() - new Date(r.created_at || r.report_date);
    return diff < 24 * 60 * 60 * 1000; 
  });

  return (
    <div className="relative" ref={bellRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2.5 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors border border-slate-600 shadow-lg">
        <Bell size={20} className={hasNew ? "text-amber-400 animate-pulse" : "text-slate-400"} />
        {hasNew && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-800"></span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden fade-in-up">
          <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-200 flex items-center gap-2"><Bell size={16} className="text-amber-400"/> การอัปเดตล่าสุด</h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{recentReports.length} รายการ</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {recentReports.map(r => (
              <div key={r.report_id} className="p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">{r.unit_name}</p>
                  <p className="text-[10px] text-slate-500">{new Date(r.created_at || r.report_date).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>
                <p className="text-sm text-slate-200 line-clamp-2 my-2">รายงาน: <span className="text-sky-400">[{r.policy_no}]</span> {r.policy_snippet}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">ความคืบหน้า</span>
                  <span className="font-bold" style={{ color: getBarColor(r.progress_percent) }}>{r.progress_percent}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1">
                  <div className="h-full rounded-full" style={{ width: `${r.progress_percent}%`, backgroundColor: getBarColor(r.progress_percent) }}></div>
                </div>
              </div>
            ))}
            {recentReports.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">ไม่มีการอัปเดต</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ============== MAIN COMPONENT ==============
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('DASHBOARD_POLICY');
  const [appDb, setAppDb] = useState({ reports: [], policies: [], units: [], tasks: [], settings: null, isLoaded: false });
  const [toastData, setToastData] = useState(null);

  const loadData = async () => {
    if (!supabase) {
      console.warn("Supabase is not connected. Previewing in local mode.");
      setAppDb(prev => ({...prev, units: INITIAL_DATA.units, policies: INITIAL_DATA.policies, isLoaded: true}));
      return;
    }
    
    try {
      const [resP, resR, resU, resT, resS] = await Promise.all([
        supabase.from('policies').select('*'),
        supabase.from('reports').select('*').order('created_at', { ascending: false }),
        supabase.from('units').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('settings').select('*').eq('id', 'global').maybeSingle()
      ]);
      setAppDb({
        policies: resP.data || [],
        reports: resR.data || [],
        units: resU.data?.sort((a,b)=>a.name.localeCompare(b.name)) || INITIAL_DATA.units,
        tasks: resT.data || [],
        settings: resS.data || { adminPasscode: ADMIN_PASSCODE, execPasscode: EXEC_PASSCODE },
        isLoaded: true
      });
    } catch (e) { 
      console.error("Load Error:", e); 
      setAppDb(prev => ({...prev, isLoaded: true}));
    }
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (msg, type = 'ok') => {
    setToastData({ msg, type });
    setTimeout(() => setToastData(null), 4000);
  };

  const handleLogin = (unit, role) => {
    setUser({ id: role === 'admin' ? 'admin' : role === 'executive' ? 'exec' : `user-${Date.now()}`, unitName: unit, role });
    setView(role === 'executive' ? 'EXEC_SUMMARY' : 'DASHBOARD_POLICY');
  };

  const handleLogout = () => {
    setUser(null);
    setView('DASHBOARD_POLICY');
  };

  if (!user || !appDb.isLoaded) {
    return <LoginScreen onLogin={handleLogin} isLoading={!appDb.isLoaded} appDb={appDb} />;
  }

  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen flex font-sans">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        .fade-in-up { animation: fadeInUp 0.3s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Sidebar Navigation */}
      <aside className="print-hide fixed left-0 top-0 h-screen z-40 bg-slate-800 border-r border-slate-700 flex flex-col w-16 lg:w-64 transition-all">
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-700 shrink-0">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-amber-500/50 shadow-sm overflow-hidden p-1 shrink-0">
            <img src={LOGO_URL} alt="J4 Logo" className="w-full h-full object-contain" onError={(e)=>{e.target.onerror=null; e.target.src='https://placehold.co/100x100/1e293b/f59e0b?text=J4'}} />
          </div>
          <div className="hidden lg:block ml-3">
            <h1 className="text-white font-bold text-lg leading-none">J4 Tracker</h1>
            <p className="text-amber-500 text-[10px] mt-0.5">Enterprise Edition</p>
          </div>
        </div>
        
        <div className="hidden lg:block p-4 border-b border-slate-700 bg-slate-800/50">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">เข้าใช้งานในนาม</p>
          <p className="text-sm font-medium text-amber-400 truncate">{user.unitName}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-2 custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 hidden lg:block">ภาพรวม (Dashboards)</p>
          <NavItem icon={<LayoutDashboard size={20}/>} label="ภาพรวมข้อสั่งการ" isActive={view === 'DASHBOARD_POLICY'} onClick={() => setView('DASHBOARD_POLICY')} />
          <NavItem icon={<PieChart size={20}/>} label="ภาพรวมภารกิจ" isActive={view === 'DASHBOARD_TASK'} onClick={() => setView('DASHBOARD_TASK')} />
          
          {isAdminOrExec && (
            <NavItem icon={<Briefcase size={20}/>} label="บทสรุปผู้บริหาร / KPI" isActive={view === 'EXEC_SUMMARY'} onClick={() => setView('EXEC_SUMMARY')} />
          )}

          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4 hidden lg:block">ระดับนโยบาย (Policy)</p>
          <NavItem icon={<ScrollText size={20}/>} label="นโยบาย/ข้อสั่งการ" isActive={view === 'POLICIES'} onClick={() => setView('POLICIES')} />
          {user.role !== 'executive' && (
            <NavItem icon={<FilePlus size={20}/>} label="บันทึกรายงานผล" isActive={view === 'REPORT_FORM'} onClick={() => setView('REPORT_FORM')} />
          )}
          <NavItem icon={<HistoryIcon size={20}/>} label="ประวัติ/Timeline" isActive={view === 'HISTORY'} onClick={() => setView('HISTORY')} />

          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4 hidden lg:block">ระดับปฏิบัติการ (Operations)</p>
          <NavItem icon={<CheckSquare size={20}/>} label="ติดตามการทำงาน" isActive={view === 'TASKS'} onClick={() => setView('TASKS')} />

          {user.role === 'admin' && (
            <>
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4 hidden lg:block">ตั้งค่า (Settings)</p>
              <NavItem icon={<Building2 size={20}/>} label="จัดการหน่วยงาน" isActive={view === 'UNITS_CONFIG'} onClick={() => setView('UNITS_CONFIG')} />
            </>
          )}
        </nav>

        <div className="p-2 lg:p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="w-full flex items-center justify-center lg:justify-start lg:px-4 py-2 rounded border border-slate-600 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500 transition-colors">
            <LogOut size={20} className="shrink-0" />
            <span className="hidden lg:block ml-3 font-medium">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="print-full-w flex-1 ml-16 lg:ml-64 p-4 md:p-8 min-w-0 h-screen overflow-y-auto custom-scrollbar relative">
        <div className="max-w-7xl mx-auto fade-in-up pb-24">
          <div className="flex items-center justify-between mb-6 print-hide">
            <h2 className="text-slate-400 text-sm md:text-base font-medium flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-500"/> ระบบติดตามการดำเนินการตามนโยบาย และ การปฏิบัติงาน
            </h2>
            {isAdminOrExec && <NotificationBell appDb={appDb} />}
          </div>

          {!supabase && (
            <div className="mb-6 bg-red-900/30 border border-red-500 p-4 rounded-xl flex items-center gap-3">
              <AlertTriangle className="text-red-500 shrink-0" size={24}/>
              <div>
                <h3 className="font-bold text-red-400">คำเตือน: ยังไม่ได้เชื่อมต่อฐานข้อมูล Supabase</h3>
                <p className="text-sm text-red-300 mt-1">ระบบกำลังทำงานในโหมดจำลอง <b>คุณจะไม่สามารถบันทึกหรือเพิ่มข้อมูลใดๆ ได้</b> กรุณาสร้างไฟล์ <code>.env</code> และใส่ค่า URL กับ KEY ของ Supabase ให้เรียบร้อยก่อนใช้งานจริงครับ</p>
              </div>
            </div>
          )}

          {view === 'DASHBOARD_POLICY' && <PolicyDashboard appDb={appDb} user={user} showToast={showToast} refresh={loadData} />}
          {view === 'DASHBOARD_TASK' && <TaskDashboard appDb={appDb} user={user} />}
          {view === 'EXEC_SUMMARY' && <ExecutiveSummary appDb={appDb} />}
          {view === 'POLICIES' && <Policies appDb={appDb} user={user} showToast={showToast} refresh={loadData} />}
          {view === 'TASKS' && <TaskTracker appDb={appDb} user={user} showToast={showToast} refresh={loadData} />}
          {view === 'UNITS_CONFIG' && <UnitsConfig appDb={appDb} showToast={showToast} refresh={loadData} />}
          {view === 'REPORT_FORM' && <ReportForm appDb={appDb} user={user} showToast={showToast} setView={setView} refresh={loadData} />}
          {view === 'HISTORY' && <History appDb={appDb} user={user} showToast={showToast} refresh={loadData} />}
        </div>
      </main>

      {toastData && (
        <div className="print-hide fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-2xl border flex items-center gap-3 fade-in-up bg-slate-800 text-white" style={{ borderColor: toastData.type === 'ok' ? '#10b981' : '#ef4444' }}>
          {toastData.type === 'ok' ? <CheckCircle className="text-emerald-500" size={20}/> : <AlertTriangle className="text-red-500" size={20}/>}
          <span className="font-medium text-sm">{toastData.msg}</span>
        </div>
      )}
    </div>
  );
}

// ============== SUB-COMPONENTS ==============

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-center lg:px-4 py-3 rounded-lg justify-center lg:justify-start transition-colors ${isActive ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
      <span className="shrink-0">{icon}</span>
      <span className="hidden lg:block ml-3 font-medium whitespace-nowrap">{label}</span>
    </button>
  );
}

function LoginScreen({ onLogin, isLoading, appDb }) {
  const dynamicUnits = appDb.units.length > 0 ? appDb.units.map(u => u.name) : INITIAL_DATA.units.map(u => u.name);
  const allOptions = [...dynamicUnits, "ผู้ดูแลภาพรวม (Admin)", "มุมมองผู้บริหาร (Executive)"];
  
  const [unit, setUnit] = useState(allOptions[allOptions.length - 2]); // Default to Admin
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const currentAdminPass = appDb.settings?.adminPasscode || ADMIN_PASSCODE;
    const currentExecPass = appDb.settings?.execPasscode || EXEC_PASSCODE;

    if (unit === 'ผู้ดูแลภาพรวม (Admin)') {
      if (password !== currentAdminPass) { setError('รหัสผ่านไม่ถูกต้อง'); return; }
      onLogin(unit, 'admin');
    } else if (unit === 'มุมมองผู้บริหาร (Executive)') {
      if (password !== currentExecPass) { setError('รหัสผ่านไม่ถูกต้อง'); return; }
      onLogin(unit, 'executive');
    } else {
      const selectedUnitData = appDb.units.find(u => u.name === unit);
      const unitPass = selectedUnitData?.passcode || UNIT_PASSCODE;
      
      if (password !== unitPass) { setError('รหัสผ่านไม่ถูกต้อง'); return; }
      onLogin(unit, 'user');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-amber-400 font-medium">กำลังโหลดข้อมูลระบบ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 fade-in-up relative overflow-hidden">
        <div className="text-center mb-8 relative z-10">
          <div className="bg-white w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-500/50 p-2">
            <img src={LOGO_URL} alt="J4 Logo" className="w-full h-full object-contain" onError={(e)=>{e.target.onerror=null; e.target.src='https://placehold.co/100x100/1e293b/f59e0b?text=J4'}} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">ระบบติดตามผลการปฏิบัติ</h1>
          <p className="text-amber-400/80 mt-2 text-sm font-medium">ข้อสั่งการ นโยบาย และ ภารกิจ</p>
          {!supabase && <p className="text-red-400 font-bold text-xs mt-3 bg-red-500/20 p-2 rounded border border-red-500/50">⚠️ ยังไม่เชื่อมต่อฐานข้อมูล (จำลอง)</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-medium">เลือกสิทธิ์เข้าใช้งาน</label>
            <select value={unit} onChange={(e) => { setUnit(e.target.value); setError(''); setPassword(''); }} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white outline-none focus:border-amber-500">
              {allOptions.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-medium flex items-center gap-2"><Lock size={14}/> รหัสผ่าน</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white outline-none focus:border-amber-500" 
              placeholder={unit === 'ผู้ดูแลภาพรวม (Admin)' ? "รหัสผ่าน Admin" : unit === 'มุมมองผู้บริหาร (Executive)' ? "รหัสผ่านผู้บริหาร" : "รหัสผ่านหน่วยงาน (1234)"} 
            />
          </div>
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl transition-all mt-4">เข้าสู่ระบบ</button>
        </form>
      </div>
    </div>
  );
}

// ============== POLICY DASHBOARD ==============
function PolicyDashboard({ appDb, user, showToast, refresh }) {
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const [filterUnit, setFilterUnit] = useState(isAdminOrExec ? 'ALL' : user.unitName);

  const stats = useMemo(() => {
    let fPolicies = appDb.policies;
    if (filterUnit !== 'ALL') fPolicies = fPolicies.filter(p => p.primary_unit === filterUnit || p.secondary_units?.includes(filterUnit) || p.primary_unit === 'ทุกหน่วย');
    let fReports = filterUnit !== 'ALL' ? appDb.reports.filter(r => r.unit_name === filterUnit) : appDb.reports;

    const progList = fPolicies.map(po => {
      const rs = fReports.filter(r => r.policy_id === po.policy_id).sort((a, b) => new Date(b.report_date) - new Date(a.report_date));
      return { id: po.policy_id, name: po.order, short: `[ลำดับ ${po.policy_no || '-'}] ${po.order.substring(0, 50)}...`, progress: rs.length ? rs[0].progress_percent : 0 };
    });

    const completed = progList.filter(x => x.progress === 100).length;
    const avg = progList.length ? progList.reduce((a, b) => a + b.progress, 0) / progList.length : 0;
    return { totalPolicies: fPolicies.length, completed, totalReports: fReports.length, avg, progList };
  }, [appDb, filterUnit]);

  return (
    <div className="space-y-6 fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-blue-500 shadow-md">
          <p className="text-slate-400 text-sm">จำนวนข้อสั่งการ</p>
          <h3 className="text-3xl font-bold text-white mt-1">{stats.totalPolicies}</h3>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-emerald-500 shadow-md">
          <p className="text-slate-400 text-sm">เสร็จสมบูรณ์</p>
          <h3 className="text-3xl font-bold text-white mt-1">{stats.completed}</h3>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-amber-500 shadow-md">
          <p className="text-slate-400 text-sm">ภาพรวมความคืบหน้า</p>
          <h3 className="text-3xl font-bold text-white mt-1">{stats.avg.toFixed(1)}%</h3>
        </div>
      </div>
    </div>
  );
}

// ============== TASK DASHBOARD ==============
function TaskDashboard({ appDb, user }) {
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const visibleTasks = isAdminOrExec ? appDb.tasks : appDb.tasks.filter(t => t.primary_unit === user.unitName || t.secondary_units?.includes(user.unitName));
  const completed = visibleTasks.filter(t => t.status === 'เสร็จสิ้น').length;
  
  return (
    <div className="space-y-6 fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-sky-500 shadow-md">
          <p className="text-slate-400 text-sm">จำนวนงาน/ภารกิจทั้งหมด</p>
          <h3 className="text-3xl font-bold text-white mt-1">{visibleTasks.length}</h3>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-emerald-500 shadow-md">
          <p className="text-slate-400 text-sm">เสร็จสมบูรณ์แล้ว</p>
          <h3 className="text-3xl font-bold text-white mt-1">{completed}</h3>
        </div>
      </div>
    </div>
  );
}

// ============== EXECUTIVE SUMMARY ==============
function ExecutiveSummary() {
  return <div className="text-center p-10 text-slate-400">หน้าต่างสรุปสำหรับผู้บริหาร</div>;
}

// ============== POLICIES ==============
function Policies({ appDb, user }) {
  return <div className="text-center p-10 text-slate-400">หน้าต่างแสดงข้อสั่งการทั้งหมด</div>;
}

// ============== TASK TRACKER ==============
function TaskTracker({ appDb, user, showToast, refresh }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const visible = isAdminOrExec ? appDb.tasks : appDb.tasks.filter(t => t.primary_unit === user.unitName || t.secondary_units?.includes(user.unitName));

  const handleSave = async (e) => {
    e.preventDefault();
    if(!supabase) return showToast('ยังไม่ได้เชื่อมต่อฐานข้อมูล กรุณาตั้งค่าไฟล์ .env', 'error');

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    
    data.task_id = `TSK-${Date.now()}`;
    data.primary_unit = user.role === 'admin' ? data.primary_unit : user.unitName;
    data.progress_percent = Number(data.progress_percent) || 0;
    
    await supabase.from('tasks').upsert(data);
    showToast('เพิ่มงานใหม่เรียบร้อย', 'ok');
    setModalOpen(false);
    refresh();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800 p-5 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
          <ListTodo size={24} /> ติดตามการทำงาน/ภารกิจ
        </h2>
        {/* ซ่อนปุ่มนี้เฉพาะบทบาท 'executive' */}
        {user.role !== 'executive' && (
          <button onClick={() => setModalOpen(true)} className="bg-amber-600 hover:bg-amber-500 px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105">
            <Plus size={18}/> เพิ่มงาน/ภารกิจใหม่
          </button>
        )}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        {visible.length === 0 ? (
          <p className="text-center text-slate-500 py-10">ยังไม่มีข้อมูลภารกิจในระบบ ลองกดปุ่ม "เพิ่มงาน/ภารกิจใหม่" ด้านบนดูสิครับ</p>
        ) : (
          <ul className="space-y-4">
            {visible.map(t => (
              <li key={t.task_id} className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white">{t.task_name}</h4>
                  <p className="text-xs text-slate-400">รับผิดชอบโดย: {t.primary_unit} | สถานะ: {t.status}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg text-emerald-400">{t.progress_percent}%</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg fade-in-up shadow-2xl">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2"><Plus size={20}/> เพิ่มงาน/ภารกิจใหม่</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="text-xs text-slate-400 block mb-1">ชื่องาน/ภารกิจ <span className="text-red-400">*</span></label><input name="task_name" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"/></div>
              
              {user.role === 'admin' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">หน่วยงานรับผิดชอบ</label>
                  <select name="primary_unit" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white">
                    {appDb.units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-slate-400 block mb-1">วันเริ่มต้น</label><input name="start_date" type="date" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" style={{colorScheme:'dark'}}/></div>
                <div><label className="text-xs text-slate-400 block mb-1">สถานะ</label>
                  <select name="status" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white">
                    <option value="รอดำเนินการ">รอดำเนินการ</option>
                    <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                    <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600">ยกเลิก</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 font-bold">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== UNITS CONFIG, REPORT FORM, HISTORY ==============
function UnitsConfig() { return <div className="text-center p-10 text-slate-400">หน้าตั้งค่าหน่วยงาน</div>; }
function ReportForm() { return <div className="text-center p-10 text-slate-400">หน้าบันทึกรายงาน</div>; }
function History() { return <div className="text-center p-10 text-slate-400">หน้าประวัติและ Timeline</div>; }