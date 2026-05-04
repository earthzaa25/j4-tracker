import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Shield, ShieldCheck, Layout, LayoutDashboard, ScrollText, FilePlus, 
  History as HistoryIcon, LogOut, Bot, MessageCircle, Send, 
  PieChart, BarChart, Plus, Edit, Trash2, Download, CloudUpload, 
  Briefcase, AlertTriangle, TrendingUp, CheckCircle, CheckCircle2, FileText, CheckSquare, ListTodo, Activity, Printer, Check, X, Lock, 
  Clock, Trophy, Paperclip, Bell, Sun, Moon, ChevronLeft, ChevronRight, Search,
  Kanban, Columns, List, Target, AlertOctagon, GitMerge, Users, Circle, Star, Sparkles,
  MousePointerClick, RefreshCcw, FilterX, CalendarDays, Table, ChevronDown, ChevronUp
} from 'lucide-react';

// ============================================================
// การตั้งค่า Google Sheets API (ใส่ URL ของคุณเรียบร้อยแล้ว)
// ============================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwgZZURz1cGNglxjEK-nGsm2g5cIT88GMG7gMkK2Zl2YydBCJyTlL65h8tcd63I2Z-R/exec";
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || ''; 

const LOGO_URL = "/S__22413315.jpg";
const GARUDA_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Garuda_Emblem_of_Thailand.svg/150px-Garuda_Emblem_of_Thailand.svg.png";

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

const ROOT_CAUSES = [
  'รอการอนุมัติ/สั่งการ', 
  'รองบประมาณ/การเงิน', 
  'ขาดอัตรากำลัง/บุคลากร', 
  'ความล่าช้าจากหน่วยร่วม/ภายนอก', 
  'ปัญหาข้อกฎหมาย/ระเบียบ',
  'ปัจจัยภายนอก (ภัยพิบัติ, ฯลฯ)',
  'อื่นๆ'
];

const ITEMS_PER_PAGE = 10;

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

const getEscalationBadge = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  const end = new Date(endDate);
  const diffDays = Math.floor((today - end) / (1000 * 60 * 60 * 24));

  if (diffDays >= 15) return { label: '🔥 วิกฤต (>15 วัน)', class: 'bg-red-600 text-white animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]' };
  if (diffDays >= 7) return { label: '⚠️ รุนแรง (>7 วัน)', class: 'bg-orange-500 text-white' };
  if (diffDays > 0) return { label: '👀 เฝ้าระวัง', class: 'bg-amber-500 text-white' };
  return null;
};

const getDeadlineStatus = (endDate, status) => {
  if (!endDate) return { label: '-', color: 'text-slate-400 bg-slate-800 border-slate-700' };
  if (status === 'เสร็จสิ้น') return { label: 'สำเร็จทันเวลา', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const end = new Date(endDate);
  
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { label: `ล่าช้า ${Math.abs(diffDays)} วัน`, color: 'text-red-400 bg-red-500/10 border-red-500/30 font-bold' };
  if (diffDays <= 7) return { label: `เหลือ ${diffDays} วัน`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  return { label: `เหลือ ${diffDays} วัน`, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
};

function getFiscalYearDates(fyString) {
  const fyNum = parseInt(fyString) - 543;
  return {
    start: `${fyNum - 1}-10-01`,
    end: `${fyNum}-09-30T23:59:59`
  };
}

const exportToExcel = (data, filename) => {
  if (!data || !data.length) return;
  let table = '<table><thead><tr>';
  Object.keys(data[0]).forEach(key => { table += `<th>${key}</th>`; });
  table += '</tr></thead><tbody>';
  data.forEach(row => {
     table += '<tr>';
     Object.values(row).forEach(val => { table += `<td>${val || '-'}</td>`; });
     table += '</tr>';
  });
  table += '</tbody></table>';

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8" /></head><body>${table}</body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============== PAGINATION & UI COMPONENTS ==============
function Pagination({ currentPage, totalItems, onPageChange }) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-4 mt-6 pb-4 print-hide">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-30 hover:bg-slate-700 transition-colors text-slate-300">
        <ChevronLeft size={20}/>
      </button>
      <span className="text-sm font-medium text-slate-400">หน้า {currentPage} จาก {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-30 hover:bg-slate-700 transition-colors text-slate-300">
        <ChevronRight size={20}/>
      </button>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-center lg:px-4 py-3 rounded-lg justify-center lg:justify-start theme-transition ${isActive ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}>
      <span className="shrink-0">{icon}</span>
      <span className="hidden lg:block ml-3 font-medium whitespace-nowrap">{label}</span>
    </button>
  );
}

// ============== MAIN APP COMPONENT ==============
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('DASHBOARD_POLICY');
  const [theme, setTheme] = useState('dark');
  const [appDb, setAppDb] = useState({ reports: [], policies: [], units: [], tasks: [], isLoaded: false });
  const [toastData, setToastData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const showToast = (msg, type = 'ok') => {
    setToastData({ msg, type });
    setTimeout(() => setToastData(null), 3000);
  };

  // ดึงข้อมูลทั้งหมดจาก Google Sheets
  const loadData = async () => {
    setIsSyncing(true);
    try {
      const actions = ['units', 'policies', 'reports', 'tasks'];
      const results = await Promise.all(actions.map(action => 
        fetch(`${SCRIPT_URL}?action=${action}`).then(res => res.json())
      ));

      setAppDb({
        units: results[0] && !results[0].error ? results[0] : [],
        policies: results[1] && !results[1].error ? results[1] : [],
        reports: results[2] && !results[2].error ? results[2] : [],
        tasks: results[3] && !results[3].error ? results[3] : [],
        isLoaded: true
      });
    } catch (e) { 
      console.error("Load Error:", e); 
      showToast('การดึงข้อมูลจาก Google Sheets ขัดข้อง', 'error');
      setAppDb(prev => ({...prev, isLoaded: true}));
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ฟังก์ชันส่วนกลางส่งข้อมูลไปเขียน/แก้ไขใน Google Sheets
  const callApi = async (method, action, data, idKey = "", idValue = "") => {
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // ป้องกัน CORS issue
        body: JSON.stringify({ method, action, data, idKey, idValue })
      });
      // หน่วงเวลาโหลดใหม่เล็กน้อยเพื่อให้ฝั่ง Sheet เซฟเสร็จ
      setTimeout(loadData, 1500); 
      return true;
    } catch (e) {
      console.error(e);
      showToast('การส่งข้อมูลล้มเหลว', 'error');
      return false;
    }
  };

  const handleLogin = (unitName, role) => {
    setUser({ id: `session-${Date.now()}`, unitName, role: role || 'user' });
    setView(role === 'executive' ? 'EXEC_SUMMARY' : 'DASHBOARD_POLICY');
  };

  const handleLogout = () => {
    setUser(null);
    setView('DASHBOARD_POLICY');
  };

  if (!user || !appDb.isLoaded) {
    return <LoginScreen onLogin={handleLogin} isLoading={!appDb.isLoaded} appDb={appDb} loadData={loadData} />;
  }

  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${theme === 'light' ? 'light-mode bg-slate-50 text-slate-900' : 'bg-slate-900 text-slate-100'}`}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark-mode .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
        .fade-in-up { animation: fadeInUp 0.3s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .theme-transition { transition: background-color 0.3s, border-color 0.3s, color 0.3s; }

        /* Light Mode */
        .light-mode .bg-slate-900 { background-color: #f8fafc; border-color: #e2e8f0; }
        .light-mode .bg-slate-800 { background-color: #ffffff; border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
        .light-mode .text-white { color: #0f172a; }
        .light-mode .text-slate-100, .light-mode .text-slate-200 { color: #1e293b; }
        .light-mode .text-slate-300, .light-mode .text-slate-400 { color: #475569; }
        .light-mode .border-slate-700, .light-mode .border-slate-600 { border-color: #e2e8f0; }
        .light-mode input, .light-mode select, .light-mode textarea { background-color: #ffffff; color: #0f172a; border-color: #cbd5e1; }
        .light-mode .hover\\:bg-slate-700:hover { background-color: #f1f5f9; color: #0f172a; }
        .light-mode .hover\\:bg-slate-700\\/30:hover { background-color: #f8fafc; }
        .light-mode .divide-slate-700\\/50 > :not([hidden]) ~ :not([hidden]) { border-color: #e2e8f0; }
        .light-mode .bg-slate-900\\/50 { background-color: #f1f5f9; }
        .kanban-col { min-width: 280px; }
        .dragging { opacity: 0.5; }

        /* Print Mode */
        @media print {
          @page { size: A4; margin: 10mm 15mm; }
          body { background-color: #ffffff !important; color: #000000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hide { display: none !important; }
          .print-full-w { width: 100% !important; margin: 0 !important; max-width: 100% !important; padding: 0 !important; }
          .bg-slate-900, .bg-slate-800, .bg-amber-900\\/40, .bg-red-900\\/20, .bg-slate-900\\/50 { background-color: #ffffff !important; color: #000000 !important; border: 1px solid #cbd5e1 !important; box-shadow: none !important; }
          .text-slate-100, .text-slate-200, .text-slate-300, .text-slate-400, .text-white { color: #0f172a !important; }
          .text-amber-400, .text-amber-500, .text-amber-600 { color: #b45309 !important; font-weight: bold; }
          .text-emerald-400, .text-emerald-500 { color: #059669 !important; font-weight: bold; }
          .text-red-400, .text-red-500 { color: #dc2626 !important; font-weight: bold; }
          .border-slate-700, .border-slate-700\\/50, .border-red-500\\/30 { border-color: #cbd5e1 !important; }
          .shadow-md, .shadow-xl, .shadow-lg { box-shadow: none !important; }
          
          .print-header { display: block !important; text-align: center; margin-bottom: 2rem; border-bottom: 2px solid black; padding-bottom: 1rem; }
          .print-header img { width: 80px; margin: 0 auto 10px; }
          .print-header h1 { font-size: 22pt; font-weight: bold; color: black; line-height: 1.2; }
          .print-header h2 { font-size: 16pt; color: black; margin-top: 5px; }
          .print-header p { font-size: 12pt; color: #475569; margin-top: 5px; }
        }
      `}</style>

      {/* Sidebar Navigation */}
      <aside className="print-hide fixed left-0 top-0 h-screen z-40 bg-slate-800 border-r border-slate-700 flex flex-col w-16 lg:w-64 theme-transition">
        <div className="h-20 flex items-center justify-between lg:px-6 border-b border-slate-700 shrink-0 theme-transition px-2">
          <div className="flex items-center justify-center lg:justify-start">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-lg flex items-center justify-center border border-amber-500/50 shadow-sm overflow-hidden p-1 shrink-0">
              <img src={LOGO_URL} alt="J4 Logo" className="w-full h-full object-contain" onError={(e)=>{e.target.onerror=null; e.target.src='https://placehold.co/100x100/1e293b/f59e0b?text=J4'}} />
            </div>
            <div className="hidden lg:block ml-3">
              <h1 className="font-bold text-lg leading-none text-slate-100">J4 Tracker</h1>
              <p className="text-amber-500 text-[10px] mt-0.5">Google Sheets Edition</p>
            </div>
          </div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="hidden lg:flex p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-amber-400 theme-transition">
            {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
        </div>
        
        <div className="hidden lg:block p-4 border-b border-slate-700 bg-slate-800/50 theme-transition">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">สถานะผู้ใช้งาน ({user.role})</p>
          <p className="text-sm font-bold text-amber-500 truncate" title={user.unitName}>{user.unitName}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-2 custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 hidden lg:block">ภาพรวม (Dashboards)</p>
          <NavItem icon={<LayoutDashboard size={20}/>} label="ภาพรวมข้อสั่งการ" isActive={view === 'DASHBOARD_POLICY'} onClick={() => setView('DASHBOARD_POLICY')} />
          <NavItem icon={<PieChart size={20}/>} label="ภาพรวมภารกิจ" isActive={view === 'DASHBOARD_TASK'} onClick={() => setView('DASHBOARD_TASK')} />
          {isAdminOrExec && <NavItem icon={<Briefcase size={20}/>} label="บทสรุปผู้บริหาร" isActive={view === 'EXEC_SUMMARY'} onClick={() => setView('EXEC_SUMMARY')} />}

          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4 hidden lg:block">ระดับนโยบาย (Policy)</p>
          <NavItem icon={<ScrollText size={20}/>} label="นโยบาย/ข้อสั่งการ" isActive={view === 'POLICIES'} onClick={() => setView('POLICIES')} />
          {user.role !== 'executive' && <NavItem icon={<FilePlus size={20}/>} label="บันทึกรายงานผล" isActive={view === 'REPORT_FORM'} onClick={() => setView('REPORT_FORM')} />}
          <NavItem icon={<HistoryIcon size={20}/>} label="ประวัติการรายงาน" isActive={view === 'HISTORY'} onClick={() => setView('HISTORY')} />

          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4 hidden lg:block">ระดับปฏิบัติการ (Operations)</p>
          <NavItem icon={<CheckSquare size={20}/>} label="ติดตามการทำงาน" isActive={view === 'TASKS'} onClick={() => setView('TASKS')} />

          {user.role === 'admin' && (
            <>
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4 hidden lg:block">ตั้งค่าส่วนกลาง</p>
              <NavItem icon={<Users size={20}/>} label="บัญชีและสิทธิ์ใช้งาน" isActive={view === 'UNITS_CONFIG'} onClick={() => setView('UNITS_CONFIG')} />
            </>
          )}
        </nav>

        <div className="p-2 lg:p-4 border-t border-slate-700 theme-transition">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex lg:hidden items-center justify-center py-2 mb-2 rounded border border-slate-600 text-slate-400 theme-transition">
             {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center justify-center lg:justify-start lg:px-4 py-2 rounded border border-slate-600 text-slate-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500 transition-colors theme-transition">
            <LogOut size={20} className="shrink-0" />
            <span className="hidden lg:block ml-3 font-medium">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="print-full-w flex-1 ml-16 lg:ml-64 p-4 md:p-8 min-w-0 h-screen overflow-y-auto custom-scrollbar relative">
        <div className="hidden print-header">
           <img src={GARUDA_URL} alt="ตราครุฑ" />
           <h1>บันทึกข้อความ / รายงานสรุปผล</h1>
           <h2>ระบบติดตามและประเมินผลการปฏิบัติราชการ (J4 Tracker)</h2>
           <p>พิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</p>
        </div>

        <div className="max-w-7xl mx-auto fade-in-up pb-24">
          <div className="flex items-center justify-between mb-6 print-hide">
            <h2 className="text-slate-400 text-sm md:text-base font-medium flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-500"/> ระบบติดตามการดำเนินการตามนโยบาย (Connected to Google Sheets)
            </h2>
            <div className="flex items-center gap-3">
              {isSyncing && <span className="text-amber-500 text-xs font-bold flex items-center gap-1"><RefreshCcw size={12} className="animate-spin"/> กำลังดึงข้อมูล...</span>}
              <button onClick={loadData} className="bg-slate-800 border border-slate-700 p-2 rounded-full hover:bg-slate-700 transition-colors">
                <RefreshCcw size={16} className="text-slate-400 hover:text-white"/>
              </button>
            </div>
          </div>

          {view === 'DASHBOARD_POLICY' && <PolicyDashboard appDb={appDb} user={user} />}
          {view === 'DASHBOARD_TASK' && <TaskDashboard appDb={appDb} user={user} />}
          {view === 'EXEC_SUMMARY' && <ExecutiveSummary appDb={appDb} />}
          {view === 'POLICIES' && <Policies appDb={appDb} user={user} showToast={showToast} callApi={callApi} refresh={loadData} />}
          {view === 'TASKS' && <TaskTracker appDb={appDb} user={user} showToast={showToast} callApi={callApi} refresh={loadData} />}
          {view === 'UNITS_CONFIG' && <UnitsConfig appDb={appDb} showToast={showToast} callApi={callApi} refresh={loadData} />}
          {view === 'REPORT_FORM' && <ReportForm appDb={appDb} user={user} showToast={showToast} setView={setView} callApi={callApi} refresh={loadData} />}
          {view === 'HISTORY' && <History appDb={appDb} user={user} showToast={showToast} callApi={callApi} refresh={loadData} />}
        </div>
      </main>

      <Chatbot appDb={appDb} />

      {toastData && (
        <div className="print-hide fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-2xl border flex items-center gap-3 fade-in-up bg-slate-800 text-white max-w-sm" style={{ borderColor: toastData.type === 'ok' ? '#10b981' : '#ef4444' }}>
          {toastData.type === 'ok' ? <CheckCircle className="text-emerald-500" size={20}/> : <AlertTriangle className="text-red-500" size={20}/>}
          <span className="font-medium text-sm">{toastData.msg}</span>
        </div>
      )}
    </div>
  );
}

// ============== LOGIN COMPONENT ==============
function LoginScreen({ onLogin, isLoading, appDb, loadData }) {
  const accounts = appDb.units || [];
  
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (accounts.length > 0 && !accounts.find(a => a.id === accountId)) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (accounts.length === 0) {
      setError('ไม่พบฐานข้อมูล รบกวนกด "โหลดข้อมูลอีกครั้ง"');
      return;
    }

    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    if (String(password) !== String(account.passcode)) { 
      setError('รหัสผ่านไม่ถูกต้อง'); 
      return; 
    }
    
    onLogin(account.name, account.role || 'user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-amber-400 font-medium">กำลังโหลดข้อมูลระบบ J4 Tracker...</p>
      </div>
    );
  }

  const adminAccounts = accounts.filter(a => a.role === 'admin');
  const execAccounts = accounts.filter(a => a.role === 'executive');
  const userAccounts = accounts.filter(a => a.role === 'user' || !a.role);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 dark-mode">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 fade-in-up relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
        <div className="text-center mb-8 relative z-10">
          <div className="bg-white w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-500/50 overflow-hidden p-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <img src={LOGO_URL} alt="J4 Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-wide">ระบบติดตามผลการปฏิบัติ</h1>
          <p className="text-amber-400/80 mt-2 text-sm font-medium">Google Sheets Edition</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-medium">เลือกบัญชีผู้ใช้งาน (Account)</label>
            <select value={accountId} onChange={(e) => { setAccountId(e.target.value); setError(''); setPassword(''); }} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all appearance-none">
              {accounts.length === 0 && <option value="">ไม่มีข้อมูลในระบบ</option>}
              {adminAccounts.length > 0 && (
                <optgroup label="=== ผู้ดูแลระบบกลาง ===">
                  {adminAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </optgroup>
              )}
              {execAccounts.length > 0 && (
                <optgroup label="=== ผู้บริหารระดับสูง ===">
                  {execAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </optgroup>
              )}
              {userAccounts.length > 0 && (
                <optgroup label="=== หน่วยงานปฏิบัติการ ===">
                  {userAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          
          <div className="fade-in-up">
            <label className="block text-slate-400 text-sm mb-2 font-medium flex items-center gap-2"><Lock size={14}/> รหัสผ่านเข้าสู่ระบบ</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
              placeholder="ระบุรหัสผ่านของบัญชีนี้..." 
            />
          </div>
          
          {error && <p className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg">{error}</p>}
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] transition-all mt-4">เข้าสู่ระบบ</button>
        </form>
        
        <div className="mt-6 text-center">
           <button onClick={loadData} className="text-slate-500 text-xs hover:text-slate-300 underline underline-offset-2 flex items-center gap-1 mx-auto"><RefreshCcw size={12}/> โหลดข้อมูลใหม่จากฐานข้อมูล</button>
        </div>
      </div>
    </div>
  );
}

// ============== POLICY DASHBOARD ==============
function PolicyDashboard({ appDb, user }) {
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const [filterUnit, setFilterUnit] = useState(isAdminOrExec ? 'ALL' : user.unitName);
  const [fiscalYear, setFiscalYear] = useState('ALL');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [expandedPolicyId, setExpandedPolicyId] = useState(null);

  useEffect(() => {
    if (fiscalYear !== 'ALL') {
      const dates = getFiscalYearDates(fiscalYear);
      setFilterStart(dates.start);
      setFilterEnd(dates.end.substring(0, 10));
    } else {
      setFilterStart('');
      setFilterEnd('');
    }
  }, [fiscalYear]);

  const currentUnits = useMemo(() => (appDb.units || []).filter(u => u.role === 'user' || !u.role), [appDb.units]);

  const basePolicies = useMemo(() => {
    let f = appDb.policies || [];
    if (filterUnit !== 'ALL') {
      f = f.filter(p => p.primary_unit === filterUnit || p.secondary_units?.includes(filterUnit) || p.primary_unit === 'ทุกหน่วย');
    }
    return f;
  }, [appDb.policies, filterUnit]);

  const baseReports = useMemo(() => {
    let r = appDb.reports || [];
    if (filterUnit !== 'ALL') r = r.filter(x => x.unit_name === filterUnit);
    if (filterStart) r = r.filter(x => new Date(x.report_date) >= new Date(filterStart));
    if (filterEnd) {
      const end = new Date(filterEnd);
      end.setHours(23, 59, 59, 999);
      r = r.filter(x => new Date(x.report_date) <= end);
    }
    return r;
  }, [appDb.reports, filterUnit, filterStart, filterEnd]);

  const tasksByPolicy = useMemo(() => {
    const map = {};
    (appDb.tasks || []).forEach(t => {
       if (t.policy_id) {
         if (!map[t.policy_id]) map[t.policy_id] = [];
         map[t.policy_id].push(t);
       }
    });
    return map;
  }, [appDb.tasks]);

  const overallStats = useMemo(() => {
    const sectionPolicyIds = basePolicies.map(p => p.policy_id);
    const sectionReports = baseReports.filter(r => sectionPolicyIds.includes(r.policy_id));

    const progList = basePolicies.map(po => {
      const rs = sectionReports.filter(r => r.policy_id === po.policy_id).sort((a, b) => new Date(b.report_date || b.created_at) - new Date(a.report_date || a.created_at));
      return { id: po.policy_id, progress: rs.length ? (rs[0].progress_percent || 0) : 0 };
    });

    return {
      total: progList.length,
      completed: progList.filter(x => x.progress === 100).length,
      inProgress: progList.filter(x => x.progress > 0 && x.progress < 100).length,
      notStarted: progList.filter(x => x.progress === 0).length,
      avg: progList.length > 0 ? (progList.reduce((a, b) => a + (b.progress || 0), 0) / progList.length) : 0
    }
  }, [basePolicies, baseReports]);

  const getStatusBucket = (progress) => {
    if (progress === 100) return 'เสร็จแล้ว (100%)';
    if (progress >= 91) return 'กำลังจะแล้วเสร็จ (91-99%)';
    if (progress >= 51) return 'ดำเนินการต่อเนื่อง (51-90%)';
    if (progress >= 21) return 'อยู่ระหว่างดำเนินการ (21-50%)';
    return 'ต่ำกว่าเกณฑ์ (0-20%)';
  };

  const renderPolicyTimeline = (policyId) => {
    const policyTasks = tasksByPolicy[policyId] || [];
    const validTasks = policyTasks.filter(t => t.start_date && t.end_date);
    
    if (validTasks.length === 0) {
      return (
        <div className="bg-slate-900/80 p-6 rounded-lg text-center border border-slate-700 mt-2">
           <CalendarDays size={24} className="mx-auto text-slate-500 mb-2 opacity-50"/>
           <p className="text-slate-400 text-sm">ยังไม่มีการระบุช่วงเวลา (Timeline) สำหรับภารกิจย่อยในนโยบายนี้</p>
        </div>
      );
    }

    const minDate = Math.min(...validTasks.map(t => new Date(t.start_date).getTime()));
    const maxDate = Math.max(...validTasks.map(t => new Date(t.end_date).getTime()));
    const totalDuration = maxDate - minDate || 1; 

    return (
      <div className="bg-slate-900/80 rounded-lg border border-slate-700 p-4 mt-2 overflow-x-auto custom-scrollbar">
         <div className="min-w-[600px]">
            <div className="flex border-b border-slate-700 pb-2 mb-4 relative">
               <div className="w-1/3 shrink-0 font-bold text-amber-500 text-xs px-2 flex items-center gap-1">
                 <CalendarDays size={14}/> แผนงาน/ภารกิจย่อย
               </div>
               <div className="w-2/3 relative flex justify-between text-[10px] text-slate-500 font-mono px-2">
                 <span>{formatDate(minDate)}</span>
                 <span>{formatDate(maxDate)}</span>
               </div>
            </div>
            
            <div className="space-y-3">
               {validTasks.sort((a,b) => new Date(a.start_date) - new Date(b.start_date)).map(t => {
                 const leftPercent = Math.max(0, ((new Date(t.start_date).getTime() - minDate) / totalDuration) * 100);
                 const widthPercent = Math.max(1, ((new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) / totalDuration) * 100);
                 
                 return (
                   <div key={t.task_id} className="flex items-center group">
                      <div className="w-1/3 shrink-0 px-2 flex flex-col justify-center border-r border-slate-700/50 pr-3">
                         <div className="text-xs text-slate-300 font-medium truncate" title={t.task_name}>{t.task_name}</div>
                         <div className="text-[9px] text-slate-500 mt-0.5">{formatDate(t.start_date)} - {formatDate(t.end_date)}</div>
                      </div>
                      <div className="w-2/3 relative h-5 bg-slate-800/50 rounded flex items-center ml-2 border border-slate-700/30">
                         <div 
                           className={`absolute h-3.5 rounded-full shadow-sm flex items-center px-1.5 transition-transform hover:scale-y-125
                             ${t.status === 'เสร็จสิ้น' ? 'bg-emerald-500/80' : t.status === 'ล่าช้า/ติดปัญหา' ? 'bg-red-500/80 animate-pulse' : 'bg-sky-500/80'}
                           `}
                           style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, minWidth: '4px' }}
                           title={`${t.status} - คืบหน้า ${t.progress_percent}%`}
                         >
                           {widthPercent > 10 && <span className="text-[8px] font-bold text-white drop-shadow-md truncate">{t.progress_percent}%</span>}
                         </div>
                      </div>
                   </div>
                 )
               })}
            </div>
         </div>
      </div>
    );
  };

  const renderDashboardSection = (title, iconComponent, sectionPolicies) => {
    if (sectionPolicies.length === 0) return null;

    const sectionPolicyIds = sectionPolicies.map(p => p.policy_id);
    const sectionReports = baseReports.filter(r => sectionPolicyIds.includes(r.policy_id));

    let progList = sectionPolicies.map(po => {
      const rs = sectionReports.filter(r => r.policy_id === po.policy_id).sort((a, b) => new Date(b.report_date || b.created_at) - new Date(a.report_date || a.created_at));
      const linkedTasks = tasksByPolicy[po.policy_id] || [];
      const taskAvgProgress = linkedTasks.length > 0 ? linkedTasks.reduce((acc, t) => acc + (Number(t.progress_percent)||0), 0) / linkedTasks.length : null;
      const progress = rs.length ? (rs[0].progress_percent || 0) : 0;
      
      return { 
        id: po.policy_id, 
        name: po.order,
        short: `[ลำดับ ${po.policy_no || '-'}] ${po.order.length > 50 ? po.order.substring(0, 50) + '...' : po.order}`,
        progress: progress,
        statusBucket: getStatusBucket(progress),
        linkedTasksCount: linkedTasks.length,
        taskAvgProgress: taskAvgProgress,
        is_important: po.is_important
      };
    });

    const cmds = [...new Set(sectionPolicies.map(p => p.commander || 'ไม่ระบุผู้สั่งการ'))];
    const groupedByCommander = cmds.map(cmd => {
      const cPols = sectionPolicies.filter(p => (p.commander || 'ไม่ระบุผู้สั่งการ') === cmd);
      let cProgList = progList.filter(pl => cPols.some(cp => cp.policy_id === pl.id));
      
      const cCompleted = cProgList.filter(x => x.progress === 100).length;
      const cAvg = cProgList.length > 0 ? (cProgList.reduce((a, b) => a + (b.progress || 0), 0) / cProgList.length) : 0;
      
      const cStatusCount = [
        { name: 'เสร็จแล้ว (100%)', value: cProgList.filter(x => x.progress === 100).length },
        { name: 'กำลังจะแล้วเสร็จ (91-99%)', value: cProgList.filter(x => x.progress >= 91 && x.progress <= 99).length },
        { name: 'ดำเนินการต่อเนื่อง (51-90%)', value: cProgList.filter(x => x.progress >= 51 && x.progress <= 90).length },
        { name: 'อยู่ระหว่างดำเนินการ (21-50%)', value: cProgList.filter(x => x.progress >= 21 && x.progress <= 50).length },
        { name: 'ต่ำกว่าเกณฑ์ (0-20%)', value: cProgList.filter(x => x.progress <= 20).length }
      ].filter(x => x.value > 0);

      let cumulativePercent = 0;
      const donutGradientStops = cStatusCount.length > 0 ? cStatusCount.map(d => {
        const start = cumulativePercent;
        const slicePercent = (d.value / cPols.length) * 100;
        cumulativePercent += slicePercent;
        return `${STATUS_COLORS[d.name]} ${start}% ${cumulativePercent}%`;
      }).join(', ') : 'transparent 0% 100%';

      if (selectedStatus) cProgList = cProgList.filter(x => x.statusBucket === selectedStatus);

      return { commander: cmd, total: cPols.length, completed: cCompleted, avg: cAvg, progList: cProgList, statusCount: cStatusCount, donutGradientStops };
    }).sort((a, b) => b.total - a.total); 

    return (
      <div className="mt-12 pt-8 border-t-[3px] border-slate-700/80 first:mt-0 first:pt-0 first:border-0 theme-transition">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-amber-500/20 p-3 rounded-xl text-amber-400 border border-amber-500/30">{iconComponent}</div>
          <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
        </div>

        {groupedByCommander.map((group, index) => (
          <div key={index} className="mt-8 pt-8 border-t border-slate-700/50 first:mt-0 first:pt-0 first:border-0 theme-transition">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h3 className="text-xl font-bold text-sky-500 flex items-center gap-2"><ShieldCheck size={24} /> ผู้สั่งการ: {group.commander}</h3>
              <div className="flex items-center gap-3">
                <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-sm border border-slate-700">ทั้งหมด {group.total} เรื่อง | เสร็จแล้ว {group.completed} เรื่อง</span>
                <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full text-sm font-bold border border-sky-500/30">คืบหน้าเฉลี่ย {group.avg.toFixed(1)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col items-center">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 w-full text-slate-100"><PieChart size={20} className="text-slate-400"/> สัดส่วนความคืบหน้า</h3>
                <div className="relative w-48 h-48 rounded-full mb-6 cursor-pointer hover:scale-105 transition-transform" 
                     onClick={() => setSelectedStatus(null)} style={{ background: group.total > 0 ? `conic-gradient(${group.donutGradientStops})` : '#e2e8f0' }}>
                  <div className="absolute inset-0 m-auto w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center border-[8px] border-slate-800">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-100">{group.total}</div>
                      <div className="text-[10px] text-slate-400">ข้อสั่งการ</div>
                    </div>
                  </div>
                </div>
                <div className="w-full space-y-2 mt-auto">
                  {group.statusCount.map(s => (
                    <div key={s.name} onClick={() => setSelectedStatus(selectedStatus === s.name ? null : s.name)}
                         className={`flex justify-between text-xs p-2 rounded-lg cursor-pointer border ${selectedStatus === s.name ? 'border-amber-500 bg-slate-700/50' : 'border-transparent hover:bg-slate-700/30'}`}>
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[s.name] }}></span><span className={selectedStatus === s.name ? 'text-amber-400 font-bold' : 'text-slate-400'}>{s.name}</span></div>
                      <span className="font-medium text-slate-100">{s.value}</span>
                    </div>
                  ))}
                  {group.total === 0 && <p className="text-center text-sm text-slate-500">ไม่มีข้อมูล</p>}
                </div>
              </div>

              <div className="lg:col-span-8 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-100"><BarChart size={20} className="text-slate-400"/> รายการข้อสั่งการ {selectedStatus && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-1 rounded ml-2">กรอง: {selectedStatus}</span>}</h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5" style={{ maxHeight: '600px' }}>
                  {group.progList.map(p => {
                    const isExpanded = expandedPolicyId === p.id;
                    return (
                      <div key={p.id} className={`relative flex flex-col gap-2 p-3 rounded-lg border transition-all ${isExpanded ? 'bg-slate-700/40 border-amber-500 shadow-inner' : 'bg-slate-900/50 border-slate-700/50 hover:border-amber-500/50'}`}>
                        <div className="cursor-pointer" onClick={() => setExpandedPolicyId(isExpanded ? null : p.id)}>
                          <div className="flex justify-between items-start text-xs mb-2">
                            <span className="text-slate-200 font-medium pr-4 flex items-start gap-1" title={p.name}>
                              {p.is_important && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0 mt-0.5" />}
                              <span className="leading-snug">{p.short}</span>
                            </span>
                            <div className="text-right shrink-0 flex flex-col items-end">
                              <span className="font-bold font-mono text-base" style={{ color: getBarColor(p.progress) }}>{p.progress}%</span>
                              {isExpanded ? <ChevronUp size={14} className="text-slate-400 mt-1"/> : <ChevronDown size={14} className="text-slate-400 mt-1"/>}
                            </div>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.progress}%`, backgroundColor: getBarColor(p.progress) }}></div>
                          </div>
                          {p.linkedTasksCount > 0 && !isExpanded && (
                            <div className="flex items-center justify-between text-[10px] mt-2 text-slate-400"><span className="flex items-center gap-1"><GitMerge size={10}/> มีภารกิจย่อย {p.linkedTasksCount} รายการ (คลิกดูไทม์ไลน์)</span></div>
                          )}
                        </div>
                        {isExpanded && <div className="mt-2 pt-2 border-t border-slate-700 fade-in-up">{renderPolicyTimeline(p.id)}</div>}
                      </div>
                    )
                  })}
                  {group.progList.length === 0 && <p className="text-center text-sm text-slate-500 mt-10">ไม่พบข้อสั่งการในสถานะที่เลือก</p>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const mainPolicies = basePolicies.filter(p => p.category === 'นโยบายหลัก');
  const additionalPolicies = basePolicies.filter(p => p.category === 'สั่งการเพิ่มเติม');

  return (
    <div className="space-y-6 fade-in-up text-slate-100">
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 print-hide flex flex-col md:flex-row items-start md:items-center justify-between gap-4 theme-transition">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500"><LayoutDashboard size={24} /> ภาพรวมนโยบายและข้อสั่งการ</h2>
          <p className="text-sm text-slate-400 mt-1">คลิกที่กราฟเพื่อคัดกรอง หรือ <b className="text-amber-400">คลิกที่นโยบาย</b> เพื่อดู Timeline การปฏิบัติงาน</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-1 justify-end">
          {selectedStatus && <button onClick={() => setSelectedStatus(null)} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"><RefreshCcw size={16}/> ล้างการกรอง</button>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:max-w-md">
            <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} disabled={!isAdminOrExec} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 disabled:opacity-50"><option value="ALL">ทุกหน่วยงาน</option>{currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
            <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100"><option value="ALL">ทุกปีงบประมาณ</option><option value="2567">ปีงบประมาณ 2567</option><option value="2568">ปีงบประมาณ 2568</option><option value="2569">ปีงบประมาณ 2569</option></select>
          </div>
          <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg text-sm font-semibold"><Printer size={18}/></button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print-hide">
        {[
          { label: 'ข้อสั่งการรวม', val: overallStats.total, status: null, color: 'text-slate-100', border: 'border-slate-600', bg: 'bg-slate-800' },
          { label: 'เสร็จสมบูรณ์', val: overallStats.completed, status: 'เสร็จแล้ว (100%)', color: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-950/20' },
          { label: 'กำลังดำเนินการ', val: overallStats.inProgress, status: 'ดำเนินการต่อเนื่อง (51-90%)', color: 'text-sky-400', border: 'border-sky-500', bg: 'bg-sky-950/20' },
          { label: 'ยังไม่คืบหน้า (0%)', val: overallStats.notStarted, status: 'ต่ำกว่าเกณฑ์ (0-20%)', color: 'text-red-400', border: 'border-red-500', bg: 'bg-red-950/20' }
        ].map(kpi => {
          const isSelected = selectedStatus === kpi.status && kpi.status !== null;
          return (
            <div key={kpi.label} onClick={() => setSelectedStatus(kpi.status === selectedStatus ? null : kpi.status)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 shadow-lg relative overflow-hidden group ${isSelected ? `ring-2 ring-offset-2 ring-offset-slate-900 border-transparent ${kpi.bg}` : `border-slate-700 bg-slate-800 hover:${kpi.border}`}`}>
              <MousePointerClick size={16} className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity ${kpi.color}`}/>
              <p className="text-slate-400 text-sm font-medium">{kpi.label}</p>
              <h3 className={`text-3xl font-bold mt-2 ${kpi.color}`}>{kpi.val}</h3>
            </div>
          )
        })}
      </div>

      <div className="space-y-12">
        {renderDashboardSection('นโยบายหลัก', <ShieldCheck size={28} />, mainPolicies)}
        {renderDashboardSection('สั่งการเพิ่มเติม', <FileText size={28} />, additionalPolicies)}
        {mainPolicies.length === 0 && additionalPolicies.length === 0 && (
          <div className="text-center py-16 text-slate-500 bg-slate-800 rounded-xl border border-slate-700"><LayoutDashboard size={48} className="mx-auto mb-4 opacity-20" /><p>ไม่พบข้อมูลนโยบายในระบบ</p></div>
        )}
      </div>
    </div>
  );
}

// ============== TASK DASHBOARD ==============
function TaskDashboard({ appDb, user }) {
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const [filterUnit, setFilterUnit] = useState(isAdminOrExec ? 'ALL' : user.unitName);
  const [fiscalYear, setFiscalYear] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedRootCause, setSelectedRootCause] = useState(null);

  const currentUnits = useMemo(() => (appDb.units || []).filter(u => u.role === 'user' || !u.role), [appDb.units]);

  const baseTasks = useMemo(() => {
    let tasks = appDb.tasks || [];
    if (filterUnit !== 'ALL') tasks = tasks.filter(t => t.primary_unit === filterUnit || t.secondary_units?.includes(filterUnit));
    if (fiscalYear !== 'ALL') {
      const dates = getFiscalYearDates(fiscalYear);
      tasks = tasks.filter(t => new Date(t.start_date) >= new Date(dates.start) && new Date(t.end_date) <= new Date(dates.end));
    }
    return tasks;
  }, [appDb.tasks, filterUnit, fiscalYear]);

  const stats = useMemo(() => {
    const totalTasks = baseTasks.length;
    const statusCount = [
      { name: 'เสร็จสิ้น', value: baseTasks.filter(t => t.status === 'เสร็จสิ้น').length },
      { name: 'กำลังดำเนินการ', value: baseTasks.filter(t => t.status === 'กำลังดำเนินการ').length },
      { name: 'รอดำเนินการ', value: baseTasks.filter(t => t.status === 'รอดำเนินการ').length },
      { name: 'ล่าช้า/ติดปัญหา', value: baseTasks.filter(t => t.status === 'ล่าช้า/ติดปัญหา').length }
    ].filter(x => x.value > 0);

    const rootCauseCounts = {};
    baseTasks.filter(t => t.status === 'ล่าช้า/ติดปัญหา').forEach(t => {
       const rc = t.root_cause || 'ไม่ระบุสาเหตุ';
       rootCauseCounts[rc] = (rootCauseCounts[rc] || 0) + 1;
    });
    const rootCausesArray = Object.entries(rootCauseCounts).map(([cause, count]) => ({ cause, count })).sort((a,b) => b.count - a.count);

    return { totalTasks, completedTasks: statusCount.find(x=>x.name==='เสร็จสิ้น')?.value || 0, delayedTasks: statusCount.find(x=>x.name==='ล่าช้า/ติดปัญหา')?.value || 0, statusCount, rootCausesArray };
  }, [baseTasks]);

  const filteredTasksList = useMemo(() => {
    let list = baseTasks;
    if (selectedStatus) list = list.filter(t => t.status === selectedStatus);
    if (selectedRootCause) list = list.filter(t => t.root_cause === selectedRootCause && t.status === 'ล่าช้า/ติดปัญหา');
    return list.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  }, [baseTasks, selectedStatus, selectedRootCause]);

  const delayedList = useMemo(() => baseTasks.filter(t => t.status === 'ล่าช้า/ติดปัญหา').sort((a, b) => new Date(a.end_date) - new Date(b.end_date)), [baseTasks]);

  let cumulativePercent = 0;
  const donutGradientStops = stats.statusCount.length > 0 ? stats.statusCount.map(d => {
    const start = cumulativePercent; const slicePercent = (d.value / stats.totalTasks) * 100; cumulativePercent += slicePercent;
    return `${TASK_STATUS_COLORS[d.name]} ${start}% ${cumulativePercent}%`;
  }).join(', ') : 'transparent 0% 100%';

  return (
    <div className="space-y-6 fade-in-up text-slate-100">
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 print-hide flex justify-between items-center gap-4 theme-transition">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500"><PieChart size={24} /> ภาพรวมภารกิจและการปฏิบัติงาน</h2>
          <p className="text-sm text-slate-400 mt-1">คลิกที่การ์ดหรือกราฟ เพื่อกรองข้อมูล</p>
        </div>
        <div className="flex items-center gap-3">
          {(selectedStatus || selectedRootCause) && <button onClick={() => {setSelectedStatus(null); setSelectedRootCause(null);}} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold"><FilterX size={16}/> ล้างการกรอง</button>}
          <select value={filterUnit} onChange={e => {setFilterUnit(e.target.value); setSelectedStatus(null); setSelectedRootCause(null);}} disabled={!isAdminOrExec} className="bg-slate-900 border border-slate-700 rounded-lg text-slate-100 p-2.5 text-sm disabled:opacity-50"><option value="ALL">ทุกหน่วยงาน</option>{currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
          <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg"><Printer size={18}/></button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ภารกิจรวม', val: stats.totalTasks, status: null, color: 'text-slate-100', border: 'border-slate-600', bg: 'bg-slate-800' },
          { label: 'เสร็จสมบูรณ์', val: stats.completedTasks, status: 'เสร็จสิ้น', color: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-950/20' },
          { label: 'กำลังดำเนินการ', val: baseTasks.filter(t=>t.status==='กำลังดำเนินการ').length, status: 'กำลังดำเนินการ', color: 'text-sky-400', border: 'border-sky-500', bg: 'bg-sky-950/20' },
          { label: 'ล่าช้า/ติดปัญหา', val: stats.delayedTasks, status: 'ล่าช้า/ติดปัญหา', color: 'text-red-400', border: 'border-red-500', bg: 'bg-red-950/20' }
        ].map(kpi => (
            <div key={kpi.label} onClick={() => { setSelectedStatus(kpi.status); setSelectedRootCause(null); }} className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 shadow-lg ${selectedStatus === kpi.status && kpi.status !== null ? `ring-2 ring-offset-2 ring-offset-slate-900 border-transparent ${kpi.bg}` : `border-slate-700 bg-slate-800 hover:${kpi.border}`}`}>
              <p className="text-slate-400 text-sm font-medium">{kpi.label}</p>
              <h3 className={`text-3xl font-bold mt-2 ${kpi.color}`}>{kpi.val}</h3>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col items-center">
          <h3 className="font-semibold w-full mb-6 text-slate-100">สัดส่วนสถานะงาน</h3>
          <div className="relative w-48 h-48 rounded-full mb-6 cursor-pointer" style={{ background: stats.totalTasks > 0 ? `conic-gradient(${donutGradientStops})` : '#334155' }} onClick={() => { setSelectedStatus(null); setSelectedRootCause(null); }}>
            <div className="absolute inset-0 m-auto w-32 h-32 bg-slate-800 rounded-full flex flex-col items-center justify-center border-[8px] border-slate-800">
              <span className="text-2xl font-bold text-slate-100">{stats.totalTasks}</span>
              <span className="text-[10px] text-slate-400">{selectedStatus ? selectedStatus : 'ล้างการกรอง'}</span>
            </div>
          </div>
          <div className="w-full space-y-2 mt-auto">
            {stats.statusCount.map(s => (
              <div key={s.name} onClick={() => { setSelectedStatus(selectedStatus === s.name ? null : s.name); setSelectedRootCause(null); }} className={`flex justify-between text-xs p-2 rounded-lg cursor-pointer border ${selectedStatus === s.name ? 'border-amber-500 bg-slate-700' : 'border-transparent hover:bg-slate-700/50'}`}>
                <div className="flex gap-2"><span className="w-3 h-3 rounded-full" style={{ background: TASK_STATUS_COLORS[s.name] }}></span><span className={selectedStatus===s.name?'text-amber-400':'text-slate-300'}>{s.name}</span></div>
                <span className="text-slate-100">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col">
          <h3 className="font-semibold mb-6 text-slate-100 flex gap-2"><AlertOctagon size={20} className="text-red-500"/> วิเคราะห์สาเหตุความล่าช้า</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4" style={{ maxHeight: '350px' }}>
            {stats.rootCausesArray.map((rc, i) => {
              const pct = (rc.count / Math.max(...stats.rootCausesArray.map(x=>x.count), 1)) * 100;
              const isSelected = selectedRootCause === rc.cause;
              return (
                <div key={i} onClick={() => { setSelectedRootCause(isSelected ? null : rc.cause); setSelectedStatus('ล่าช้า/ติดปัญหา'); }} className={`cursor-pointer p-2 rounded-lg border ${isSelected ? 'border-red-500 bg-red-950/20' : 'border-transparent hover:bg-slate-700/30'}`}>
                  <div className="flex justify-between text-xs mb-1.5"><span className={isSelected?'text-red-400 font-bold':'text-slate-300'}>{rc.cause}</span><span className="font-bold text-slate-100">{rc.count} งาน</span></div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden"><div className={`h-full rounded-full ${isSelected ? 'bg-red-500' : 'bg-red-500/60'}`} style={{ width: `${pct}%` }}></div></div>
                </div>
              );
            })}
            {stats.rootCausesArray.length === 0 && <p className="text-center text-sm text-slate-500 mt-10">ไม่มีข้อมูลงานล่าช้า</p>}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
         <div className="p-4 bg-slate-900/50 flex justify-between items-center"><h3 className="font-bold text-slate-100 flex items-center gap-2"><ListTodo size={18} className="text-amber-500" /> ภารกิจที่กรองแล้ว ({filteredTasksList.length})</h3></div>
         <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
            <table className="w-full text-sm">
               <thead className="bg-slate-900 text-slate-400 text-left sticky top-0"><th className="p-4">ชื่องาน</th><th className="p-4">หน่วยงาน</th><th className="p-4 text-center">สถานะ</th><th className="p-4">คืบหน้า</th></thead>
               <tbody className="divide-y divide-slate-700/50">
                  {filteredTasksList.map(t => (
                     <tr key={t.task_id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-4 font-medium"><p className="line-clamp-2" title={t.task_name}>{t.task_name}</p>{t.status === 'ล่าช้า/ติดปัญหา' && <span className="text-[10px] text-red-400 block mt-1">สาเหตุ: {t.root_cause}</span>}</td>
                        <td className="p-4 text-xs text-slate-400">{t.primary_unit}</td>
                        <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-[10px] border ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>{t.status}</span></td>
                        <td className="p-4"><div className="flex gap-2 items-center"><div className="flex-1 bg-slate-900 h-1.5 rounded-full"><div style={{ width: `${t.progress_percent}%`, background: getBarColor(t.progress_percent) }} className="h-full rounded-full"></div></div><span className="text-[10px] font-bold font-mono" style={{color: getBarColor(t.progress_percent)}}>{t.progress_percent}%</span></div></td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

// ============== POLICIES ==============
function Policies({ appDb, user, showToast, callApi, refresh }) {
  const [search, setSearch] = useState(''); 
  const [currentPage, setCurrentPage] = useState(1); 
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [formCategory, setFormCategory] = useState('นโยบายหลัก');
  const [primaryUnit, setPrimaryUnit] = useState('ทุกหน่วย');
  const [secUnits, setSecUnits] = useState([]);

  const policies = appDb.policies || [];
  const currentUnits = (appDb.units || []).filter(u => u.role === 'user' || !u.role);

  const filtered = policies.filter(p => p.order.toLowerCase().includes(search.toLowerCase()) || p.commander.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      if (a.is_important && !b.is_important) return -1;
      if (!a.is_important && b.is_important) return 1;
      return parseInt(a.policy_no||0) - parseInt(b.policy_no||0);
    });

  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.primary_unit = primaryUnit;
    data.secondary_units = primaryUnit === 'ทุกหน่วย' ? [] : secUnits;
    if (data.category === 'นโยบายหลัก') { data.audience = '-'; data.meeting = '-'; }

    const isUpdating = !!editData;
    const policyId = isUpdating ? editData.policy_id : `POL-${Date.now()}`;
    const payload = { ...data, policy_id: policyId, created_at: isUpdating ? editData.created_at : new Date().toISOString() };

    showToast('กำลังบันทึกข้อมูลไปที่ Google Sheets...');
    const success = await callApi(isUpdating ? "update" : "insert", "policies", payload, "policy_id", policyId);
    if (success) {
      showToast('บันทึกข้อสั่งการเรียบร้อย', 'ok');
      setModalOpen(false);
    }
  };

  const toggleImportant = async (policy) => {
    const success = await callApi("update", "policies", { is_important: !policy.is_important }, "policy_id", policy.policy_id);
    if (success) showToast(!policy.is_important ? 'ปักหมุดข้อสั่งการสำคัญ' : 'ยกเลิกการปักหมุด', 'ok');
  };

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันการลบข้อสั่งการนี้?')) {
      const success = await callApi("delete", "policies", null, "policy_id", id);
      if (success) showToast('ลบข้อสั่งการเรียบร้อย', 'ok');
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 p-5 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold flex gap-2 text-amber-500"><ScrollText size={24} /> นโยบายและข้อสั่งการ</h2>
        <div className="flex gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาข้อสั่งการ..." className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 outline-none"/>
          {user.role === 'admin' && (
            <button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"><Plus size={16}/> เพิ่มข้อสั่งการ</button>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-x-auto custom-scrollbar">
         <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 text-left">
               <tr>
                  <th className="p-4 w-16">ลำดับ</th>
                  <th className="p-4">ประเภท/ผู้สั่งการ</th>
                  <th className="p-4 min-w-[300px]">ข้อสั่งการ</th>
                  <th className="p-4">หน่วยรับผิดชอบ</th>
                  {user.role === 'admin' && <th className="p-4 text-center">จัดการ</th>}
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
               {paginated.map(p => (
                 <tr key={p.policy_id} className={`hover:bg-slate-700/30 ${p.is_important ? 'bg-amber-900/10' : ''}`}>
                    <td className="p-4 text-center">
                       <button onClick={() => toggleImportant(p)}><Star size={16} className={p.is_important ? "text-amber-500 fill-amber-500" : "text-slate-500"} /></button>
                       <div className="font-bold text-amber-500">{p.policy_no || '-'}</div>
                    </td>
                    <td className="p-4 text-xs"><span className="px-2 py-0.5 rounded border border-amber-500/30 text-amber-500 block mb-1 w-max">{p.category}</span>{p.commander}</td>
                    <td className="p-4 text-slate-200">{p.order}</td>
                    <td className="p-4 text-xs text-slate-400"><p className="font-medium text-slate-300">{p.primary_unit}</p>{p.secondary_units?.length > 0 && <p className="text-[10px] text-sky-400 mt-1">ร่วม: {p.secondary_units.join(', ')}</p>}</td>
                    {user.role === 'admin' && (
                      <td className="p-4 text-center space-y-2">
                         <button onClick={() => { setEditData(p); setPrimaryUnit(p.primary_unit); setSecUnits(p.secondary_units || []); setModalOpen(true); }} className="w-full text-sky-400 hover:text-sky-300 bg-sky-400/10 py-1 rounded">แก้ไข</button>
                         <button onClick={() => handleDelete(p.policy_id)} className="w-full text-red-400 hover:text-red-300 bg-red-400/10 py-1 rounded">ลบ</button>
                      </td>
                    )}
                 </tr>
               ))}
               {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">ไม่มีข้อมูลข้อสั่งการ</td></tr>}
            </tbody>
         </table>
         <Pagination currentPage={currentPage} totalItems={filtered.length} onPageChange={setCurrentPage} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto text-slate-100">
             <h3 className="text-xl font-bold mb-5 flex items-center gap-2">{editData ? <Edit size={20}/> : <Plus size={20}/>} {editData ? 'แก้ไขข้อสั่งการ' : 'เพิ่มข้อสั่งการ'}</h3>
             <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div><label className="text-xs text-slate-400 block mb-1">ประเภท</label><select name="category" value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5"><option value="นโยบายหลัก">นโยบายหลัก</option><option value="สั่งการเพิ่มเติม">สั่งการเพิ่มเติม</option></select></div>
                   <div><label className="text-xs text-slate-400 block mb-1">ลำดับ (เช่น 1, 2, 3)</label><input name="policy_no" defaultValue={editData?.policy_no} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5"/></div>
                   <div><label className="text-xs text-slate-400 block mb-1">ผู้สั่งการ</label><select name="commander" defaultValue={editData?.commander || 'ผบ.ทสส.'} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5"><option value="ผบ.ทสส.">ผบ.ทสส.</option><option value="รอง ผบ.ทสส.">รอง ผบ.ทสส.</option><option value="เสธ.ทหาร">เสธ.ทหาร</option><option value="จก.กบ.ทหาร">จก.กบ.ทหาร</option></select></div>
                </div>
                <div><label className="text-xs text-slate-400 block mb-1">รายละเอียดข้อสั่งการ</label><textarea name="order" defaultValue={editData?.order} rows="4" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5"></textarea></div>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                   <label className="text-xs text-amber-500 font-bold block mb-2">หน่วยรับผิดชอบหลัก</label>
                   <select value={primaryUnit} onChange={e => setPrimaryUnit(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 mb-4">
                      <option value="ทุกหน่วย">ทุกหน่วย</option>
                      {currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                   </select>
                   {primaryUnit !== 'ทุกหน่วย' && (
                     <div>
                       <label className="text-xs text-amber-500 font-bold block mb-2">หน่วยร่วมปฏิบัติ (ติ๊กเลือก)</label>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{currentUnits.filter(u => u.name !== primaryUnit).map(u => (
                          <label key={u.id} className="flex gap-2 text-sm text-slate-300"><input type="checkbox" checked={secUnits.includes(u.name)} onChange={() => { setSecUnits(prev => prev.includes(u.name) ? prev.filter(x => x !== u.name) : [...prev, u.name]) }} className="rounded"/> {u.name}</label>
                       ))}</div>
                     </div>
                   )}
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-700 pt-4"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-700 rounded-lg">ยกเลิก</button><button type="submit" className="px-4 py-2 bg-amber-600 text-white font-bold rounded-lg shadow-lg">บันทึกข้อมูล</button></div>
             </form>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskTracker({ appDb, user, showToast, callApi, refresh }) {
  const [viewMode, setViewMode] = useState('list'); 
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [primaryUnit, setPrimaryUnit] = useState(user.unitName);
  const [formStatus, setFormStatus] = useState('รอดำเนินการ');
  const [formProgress, setFormProgress] = useState(0);

  const tasks = appDb.tasks || [];
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';

  const visible = isAdminOrExec ? tasks : tasks.filter(t => t.primary_unit === user.unitName || t.secondary_units?.includes(user.unitName));
  const filtered = visible.filter(t => t.task_name.toLowerCase().includes(search.toLowerCase()) && (filterStatus === '' || t.status === filterStatus))
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.progress_percent = Number(formProgress);
    data.primary_unit = primaryUnit;

    const isUpdating = !!editData;
    const taskId = isUpdating ? editData.task_id : `TSK-${Date.now()}`;
    const payload = { ...data, task_id: taskId };

    showToast('กำลังบันทึกข้อมูลไปที่ Google Sheets...');
    const success = await callApi(isUpdating ? "update" : "insert", "tasks", payload, "task_id", taskId);
    if (success) { showToast('บันทึกงานเรียบร้อย', 'ok'); setModalOpen(false); }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find(t => t.task_id === taskId);
    if (!task || task.status === newStatus) return;

    showToast('อัปเดตสถานะ...');
    await callApi("update", "tasks", { status: newStatus }, "task_id", taskId);
  };

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันการลบภารกิจนี้?')) {
      const success = await callApi("delete", "tasks", null, "task_id", id);
      if (success) showToast('ลบงานเรียบร้อย');
    }
  };

  const renderTimeline = () => {
    const validTasks = filtered.filter(t => t.start_date && t.end_date);
    if (validTasks.length === 0) return <div className="p-10 text-center text-slate-500">ไม่มีข้อมูล Timeline</div>;
    
    const minDate = Math.min(...validTasks.map(t => new Date(t.start_date).getTime()));
    const maxDate = Math.max(...validTasks.map(t => new Date(t.end_date).getTime()));
    const totalDuration = maxDate - minDate || 1; 

    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 overflow-x-auto shadow-xl">
         <div className="min-w-[800px]">
            <div className="flex border-b border-slate-700 pb-2 mb-4 relative">
               <div className="w-1/3 font-bold text-slate-400 text-sm px-2">ชื่องาน</div>
               <div className="w-2/3 flex justify-between text-xs text-slate-500 font-mono"><span>{formatDate(minDate)}</span><span>{formatDate(maxDate)}</span></div>
            </div>
            <div className="space-y-4">
               {validTasks.map(t => {
                 const left = Math.max(0, ((new Date(t.start_date).getTime() - minDate) / totalDuration) * 100);
                 const width = Math.max(1, ((new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) / totalDuration) * 100);
                 return (
                   <div key={t.task_id} className="flex items-center group">
                      <div className="w-1/3 px-2 flex flex-col justify-center">
                         <div className="text-xs text-slate-200 font-medium truncate cursor-pointer hover:text-amber-400" onClick={()=>setModalOpen(true)}>{t.task_name}</div>
                         <div className="text-[9px] text-slate-500">{t.primary_unit}</div>
                      </div>
                      <div className="w-2/3 relative h-6 bg-slate-900/50 rounded flex items-center border border-slate-700/50">
                         <div className={`absolute h-4 rounded-full shadow-sm px-2 cursor-pointer ${t.status === 'เสร็จสิ้น' ? 'bg-emerald-500/80' : t.status === 'ล่าช้า/ติดปัญหา' ? 'bg-red-500/80 animate-pulse' : 'bg-sky-500/80'}`}
                              style={{ left: `${left}%`, width: `${width}%`, minWidth: '4px' }}>
                           {width > 10 && <span className="text-[9px] font-bold text-white drop-shadow-md">{t.progress_percent}%</span>}
                         </div>
                      </div>
                   </div>
                 )
               })}
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 fade-in-up">
       <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-slate-800 p-5 rounded-xl border border-slate-700">
         <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500"><CheckSquare size={24} /> ติดตามภารกิจ</h2>
         <div className="flex gap-3 items-center">
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
              <button onClick={()=>setViewMode('list')} className={`p-1.5 rounded-md text-sm font-medium ${viewMode==='list'?'bg-amber-600 text-white':'text-slate-400'}`}><List size={16}/></button>
              <button onClick={()=>setViewMode('kanban')} className={`p-1.5 rounded-md text-sm font-medium ${viewMode==='kanban'?'bg-amber-600 text-white':'text-slate-400'}`}><Columns size={16}/></button>
              <button onClick={()=>setViewMode('timeline')} className={`p-1.5 rounded-md text-sm font-medium ${viewMode==='timeline'?'bg-amber-600 text-white':'text-slate-400'}`}><CalendarDays size={16}/></button>
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหางาน..." className="w-48 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none"/>
            {user.role !== 'executive' && <button onClick={() => { setEditData(null); setFormStatus('รอดำเนินการ'); setFormProgress(0); setModalOpen(true); }} className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm flex gap-2"><Plus size={16}/>เพิ่มงาน</button>}
         </div>
       </div>

       {viewMode === 'timeline' ? renderTimeline() : viewMode === 'list' ? (
         <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto shadow-xl">
           <table className="w-full text-sm text-left">
             <thead className="bg-slate-900 border-b border-slate-700 text-slate-400"><tr><th className="p-4">ชื่องาน</th><th className="p-4">หน่วย</th><th className="p-4">สถานะ/คืบหน้า</th><th className="p-4">อัปเดต</th></tr></thead>
             <tbody className="divide-y divide-slate-700/50">
                {filtered.map(t => (
                  <tr key={t.task_id} className="hover:bg-slate-700/30">
                     <td className="p-4 font-bold text-slate-200">{t.task_name}</td><td className="p-4 text-xs text-slate-400">{t.primary_unit}</td>
                     <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] border ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>{t.status} {t.progress_percent}%</span></td>
                     <td className="p-4 flex gap-2">
                        {user.role !== 'executive' && <button onClick={() => { setEditData(t); setPrimaryUnit(t.primary_unit); setFormStatus(t.status); setFormProgress(t.progress_percent); setModalOpen(true); }} className="text-sky-400 hover:bg-sky-400/20 p-1.5 rounded"><Edit size={14}/></button>}
                        {(user.role === 'admin' || t.primary_unit === user.unitName) && <button onClick={() => handleDelete(t.task_id)} className="text-red-400 hover:bg-red-400/20 p-1.5 rounded"><Trash2 size={14}/></button>}
                     </td>
                  </tr>
                ))}
             </tbody>
           </table>
         </div>
       ) : (
         <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 min-h-[500px]">
            {["รอดำเนินการ", "กำลังดำเนินการ", "เสร็จสิ้น", "ล่าช้า/ติดปัญหา"].map(col => {
               const colTasks = filtered.filter(t => t.status === col);
               return (
                 <div key={col} className="kanban-col flex-1 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col" onDragOver={e=>e.preventDefault()} onDrop={e=>handleDrop(e, col)}>
                    <div className="p-4 border-b border-slate-700 font-bold bg-slate-800">{col} <span className="text-xs text-slate-400">({colTasks.length})</span></div>
                    <div className="p-3 space-y-3">
                       {colTasks.map(t => (
                         <div key={t.task_id} draggable onDragStart={e => e.dataTransfer.setData("taskId", t.task_id)} className="bg-slate-900 p-3 rounded-lg border border-slate-700 cursor-grab hover:border-amber-500/50">
                           <div className="flex justify-between text-xs mb-2"><span className="text-amber-500 font-bold">{t.primary_unit}</span><span style={{color: getBarColor(t.progress_percent)}}>{t.progress_percent}%</span></div>
                           <h4 className="text-sm font-bold text-slate-200">{t.task_name}</h4>
                         </div>
                       ))}
                    </div>
                 </div>
               )
            })}
         </div>
       )}

       {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-xl text-slate-100 shadow-2xl">
                <h3 className="text-xl font-bold mb-4">{editData ? 'แก้ไข/อัปเดตสถานะงาน' : 'เพิ่มงานใหม่'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                   <div><label className="text-xs text-slate-400 block mb-1">ชื่องาน</label><input name="task_name" defaultValue={editData?.task_name} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5"/></div>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs text-slate-400 block mb-1">วันที่เริ่ม</label><input type="date" name="start_date" defaultValue={editData?.start_date ? editData.start_date.substring(0,10) : ''} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5" style={{colorScheme:'dark'}}/></div>
                      <div><label className="text-xs text-slate-400 block mb-1">วันกำหนดเสร็จ</label><input type="date" name="end_date" defaultValue={editData?.end_date ? editData.end_date.substring(0,10) : ''} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5" style={{colorScheme:'dark'}}/></div>
                   </div>
                   <div className="grid grid-cols-2 gap-4 bg-sky-900/10 p-4 border border-sky-500/30 rounded-lg">
                      <div><label className="text-xs text-sky-400 block mb-1 font-bold">สถานะ</label><select name="status" value={formStatus} onChange={e=>setFormStatus(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5"><option value="รอดำเนินการ">รอดำเนินการ</option><option value="กำลังดำเนินการ">กำลังดำเนินการ</option><option value="เสร็จสิ้น">เสร็จสิ้น</option><option value="ล่าช้า/ติดปัญหา">ล่าช้า/ติดปัญหา</option></select></div>
                      <div><label className="text-xs text-sky-400 block mb-1 font-bold">ความคืบหน้า (%)</label><input name="progress_percent" type="number" min="0" max="100" value={formProgress} onChange={e=>setFormProgress(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5"/></div>
                   </div>
                   <div className="flex justify-end gap-3 pt-4 border-t border-slate-700"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2 bg-slate-700 rounded-lg">ยกเลิก</button><button type="submit" className="px-4 py-2 bg-amber-600 text-white font-bold rounded-lg">บันทึกข้อมูล</button></div>
                </form>
             </div>
          </div>
       )}
    </div>
  )
}

function ReportForm({ appDb, user, showToast, setView, callApi }) {
  const [fileUrl, setFileUrl] = useState('');
  const policies = appDb.policies || [];
  const availPolicies = policies.filter(p => user.role === 'admin' || p.primary_unit === user.unitName || p.secondary_units?.includes(user.unitName) || p.primary_unit === 'ทุกหน่วย');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const pol = policies.find(p => p.policy_id === data.policy_id);
    if (!pol) return showToast('กรุณาเลือกข้อสั่งการ', 'error');

    const reportId = `RP-${Date.now()}`;
    const report = {
      report_id: reportId, policy_id: data.policy_id, policy_no: pol.policy_no || '-',
      policy_snippet: pol.order.substring(0, 150), unit_name: user.unitName,
      report_date: data.report_date, past_result: data.past_result, next_plan: data.next_plan,
      progress_percent: Number(data.progress_percent) || 0, problems: data.problems, note: data.note,
      attachment_url: fileUrl, approval_status: 'อนุมัติแล้ว', created_at: new Date().toISOString()
    };

    showToast('กำลังบันทึกรายงาน...');
    const success = await callApi("insert", "reports", report, "report_id", reportId);
    if (success) { showToast('บันทึกรายงานเรียบร้อย', 'ok'); setView('HISTORY'); }
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl fade-in-up">
      <h2 className="text-2xl font-bold flex gap-2 text-amber-500 mb-6"><FilePlus size={28}/> รายงานผลการดำเนินการ</h2>
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-100">
         <div>
            <label className="text-xs text-slate-400 block mb-1">อ้างอิงข้อสั่งการ</label>
            <select name="policy_id" required className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3">
               <option value="">-- เลือกข้อสั่งการ --</option>
               {availPolicies.map(p => <option key={p.policy_id} value={p.policy_id}>[{p.policy_no}] {p.order.substring(0,100)}</option>)}
            </select>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-400 block mb-1">วันที่รายงาน</label><input type="date" name="report_date" defaultValue={new Date().toISOString().substring(0,10)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3" style={{colorScheme:'dark'}}/></div>
            <div><label className="text-xs text-slate-400 block mb-1">ความคืบหน้าสะสม (%)</label><input type="number" name="progress_percent" min="0" max="100" required defaultValue="0" className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3"/></div>
         </div>
         <div><label className="text-xs text-slate-400 block mb-1">ผลการดำเนินการ</label><textarea name="past_result" required rows="3" className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3"></textarea></div>
         <div><label className="text-xs text-red-400 block mb-1">ปัญหา/ข้อขัดข้อง (ถ้ามี)</label><textarea name="problems" rows="2" className="w-full bg-slate-900 border border-red-900/50 rounded-xl p-3"></textarea></div>
         <div className="bg-slate-900/50 p-4 border border-slate-700 rounded-xl">
            <label className="text-xs text-slate-400 block mb-1">แนบลิงก์เอกสาร (Google Drive, Docs ฯลฯ)</label>
            <input value={fileUrl} onChange={e=>setFileUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5"/>
         </div>
         <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 py-4 rounded-xl font-bold text-white shadow-lg flex justify-center gap-2 mt-6"><Send size={20}/> ส่งรายงาน</button>
      </form>
    </div>
  )
}

function History({ appDb, user, showToast, callApi }) {
  const reports = appDb.reports || [];
  const visible = (user.role === 'admin' || user.role === 'executive') ? reports : reports.filter(r => r.unit_name === user.unitName);
  const sorted = visible.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันลบรายงานนี้?')) {
      const success = await callApi("delete", "reports", null, "report_id", id);
      if (success) showToast('ลบแล้ว');
    }
  }

  return (
    <div className="space-y-6 fade-in-up">
       <div className="flex justify-between items-center bg-slate-800 p-5 rounded-xl border border-slate-700">
          <h2 className="font-bold flex items-center gap-2 text-amber-500"><HistoryIcon size={20}/> ประวัติการรายงานผล ({sorted.length} รายการ)</h2>
          <button onClick={() => exportToExcel(sorted, 'ReportHistory')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
            <Table size={14}/> ส่งออก Excel
          </button>
       </div>
       <div className="grid gap-4">
          {sorted.map(r => (
            <div key={r.report_id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between gap-4">
               <div>
                  <div className="flex items-center gap-2 mb-1"><span className="text-xs text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded">{r.unit_name}</span> <span className="text-[10px] text-slate-500">{formatDate(r.report_date)}</span></div>
                  <h4 className="text-sm font-medium text-slate-200">[{r.policy_no}] {r.policy_snippet}</h4>
                  <p className="text-xs text-slate-400 mt-2"><b className="text-emerald-500">ผลปฏิบัติ:</b> {r.past_result}</p>
               </div>
               <div className="text-right flex flex-col items-end justify-between">
                  <span className="text-xl font-bold font-mono" style={{color: getBarColor(r.progress_percent)}}>{r.progress_percent}%</span>
                  {user.role === 'admin' && <button onClick={()=>handleDelete(r.report_id)} className="text-red-400 hover:bg-red-500/20 p-1.5 rounded"><Trash2 size={16}/></button>}
               </div>
            </div>
          ))}
          {sorted.length === 0 && <p className="text-center p-10 text-slate-500">ไม่มีร่องรอยการรายงาน</p>}
       </div>
    </div>
  )
}

function UnitsConfig({ appDb, showToast, callApi }) {
  const units = appDb.units || [];
  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันลบบัญชีนี้?')) {
      const success = await callApi("delete", "units", null, "id", id);
      if (success) showToast('ลบบัญชีแล้ว');
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto fade-in-up">
       <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex justify-between items-center">
          <h2 className="font-bold flex gap-2 text-amber-500"><Users size={20}/> จัดการบัญชีผู้ใช้ (รายหน่วย)</h2>
          <p className="text-xs text-slate-400">*หากต้องการเพิ่ม ให้เพิ่มในหน้า Sheet โดยตรง</p>
       </div>
       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <table className="w-full text-sm text-left">
             <thead className="bg-slate-900 text-slate-400"><tr><th className="p-4">ชื่อหน่วย/บัญชี</th><th className="p-4">สิทธิ์</th><th className="p-4">รหัสผ่าน</th><th className="p-4">ลบ</th></tr></thead>
             <tbody className="divide-y divide-slate-700/50 text-slate-200">
                {units.map(u => (
                  <tr key={u.id} className="hover:bg-slate-700/30">
                     <td className="p-4 font-bold">{u.name}</td>
                     <td className="p-4 text-xs"><span className="bg-slate-700 px-2 py-1 rounded">{u.role}</span></td>
                     <td className="p-4 font-mono text-emerald-400">{u.passcode}</td>
                     <td className="p-4"><button onClick={()=>handleDelete(u.id)} className="text-red-400 p-1"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  )
}

function ExecutiveSummary({ appDb }) {
   const [fiscalYear, setFiscalYear] = useState('ALL');
   const stats = useMemo(() => {
    const unitStats = {};
    const currentUnits = (appDb.units || []).filter(u => u.role === 'user' || !u.role);
    currentUnits.forEach(u => { unitStats[u.name] = { totalPolicies: 0, progressSum: 0, completed: 0, reports: 0, policyNames: [] }; });

    const policies = appDb.policies || [];
    let reports = appDb.reports || [];
    if (fiscalYear !== 'ALL') {
      const dates = getFiscalYearDates(fiscalYear);
      reports = reports.filter(r => r.report_date >= dates.start && r.report_date <= dates.end);
    }

    policies.forEach(p => {
      const shortName = `[ลำดับ ${p.policy_no || '-'}] ${p.order.substring(0, 40)}`;
      if (unitStats[p.primary_unit]) { unitStats[p.primary_unit].totalPolicies += 1; unitStats[p.primary_unit].policyNames.push(shortName); }
    });

    const latestReports = {};
    reports.forEach(r => {
      const key = `${r.policy_id}_${r.unit_name}`;
      if (!latestReports[key] || new Date(r.report_date) > new Date(latestReports[key].report_date)) latestReports[key] = r;
    });

    Object.values(latestReports).forEach(r => {
      if (unitStats[r.unit_name]) {
        unitStats[r.unit_name].progressSum += r.progress_percent;
        unitStats[r.unit_name].reports += 1;
        if (r.progress_percent === 100) unitStats[r.unit_name].completed += 1;
      }
    });

    const unitArray = Object.entries(unitStats).map(([name, data]) => ({ name, ...data, avgProgress: data.reports > 0 ? (data.progressSum / data.reports) : 0 })).filter(u => u.totalPolicies > 0).sort((a,b) => b.avgProgress - a.avgProgress);
    return { unitArray, totalPolicies: policies.length, totalReports: Object.keys(latestReports).length };
  }, [appDb, fiscalYear]);

  const handleExportSummaryExcel = () => {
    const dataToExport = stats.unitArray.map(u => ({ "หน่วยงาน": u.name, "นโยบายรับผิดชอบ": u.totalPolicies, "ความคืบหน้าเฉลี่ย (%)": u.avgProgress.toFixed(2), "เสร็จสิ้น": u.completed }));
    exportToExcel(dataToExport, `สรุปผลการปฏิบัติราชการ_${new Date().toISOString().substring(0,10)}`);
  };

  return (
    <div className="space-y-6 fade-in-up text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3 items-center"><div className="bg-amber-500/20 p-3 rounded-xl"><Briefcase className="text-amber-500" size={28}/></div><h2 className="text-2xl font-bold">บทสรุปผู้บริหาร</h2></div>
        <div className="flex gap-3">
          <select value={fiscalYear} onChange={e=>setFiscalYear(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"><option value="ALL">ทุกปีงบประมาณ</option><option value="2567">ปี 2567</option><option value="2568">ปี 2568</option></select>
          <button onClick={handleExportSummaryExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm flex gap-2"><Table size={16}/> ส่งออก Excel</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-5">
            <h3 className="text-lg font-bold text-amber-500 mb-4 flex gap-2"><TrendingUp size={20}/> จัดอันดับความสำเร็จ (KPI)</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
               {stats.unitArray.map((u, i) => (
                 <div key={u.name} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold shrink-0">{i+1}</div>
                    <div className="flex-1">
                       <div className="flex justify-between mb-1"><h4 className="font-bold">{u.name}</h4><span className="font-mono" style={{color: getBarColor(u.avgProgress)}}>{u.avgProgress.toFixed(1)}%</span></div>
                       <p className="text-xs text-slate-500 mb-2">รับผิดชอบ {u.totalPolicies} เรื่อง | เสร็จ {u.completed}</p>
                       <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="h-full rounded-full" style={{width: `${u.avgProgress}%`, background: getBarColor(u.avgProgress)}}></div></div>
                    </div>
                 </div>
               ))}
               {stats.unitArray.length === 0 && <div className="text-center p-10 text-slate-500">ไม่มีข้อมูลหน่วยงานรับผิดชอบ</div>}
            </div>
         </div>
         <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-5">
            <h3 className="text-lg font-bold text-sky-500 mb-4 flex gap-2"><PieChart size={20}/> สรุปสถิติระบบ</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-center"><p className="text-slate-400 text-sm mb-2">ข้อสั่งการทั้งหมด</p><h3 className="text-4xl font-bold text-amber-500">{stats.totalPolicies}</h3></div>
               <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-center"><p className="text-slate-400 text-sm mb-2">อัปเดตล่าสุดสะสม</p><h3 className="text-4xl font-bold text-sky-400">{stats.totalReports}</h3></div>
            </div>
            <p className="text-sm text-slate-500 mt-6 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">ในโหมด Google Sheets, คุณสามารถดึงข้อมูลและทำสรุปด้วยสูตรฝั่ง Excel (Google Sheets) ได้โดยตรง ซึ่งจะมีความยืดหยุ่นสูงขึ้นสำหรับการวิเคราะห์ข้อมูลชั้นสูงครับ</p>
         </div>
      </div>
    </div>
  )
}

function Chatbot({ appDb }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ sender: 'bot', text: 'สวัสดีครับ! ผมคือ Assistant ประจำระบบ J4 (G-Sheets Mode) ลองถามผมได้เลยครับ เช่น "สรุปภาพรวม"' }]);
    }
  }, [isOpen]);

  useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const processQueryBasic = (q) => {
    const lo = q.toLowerCase();
    const allPol = appDb.policies || [];
    if (lo.includes('สรุป') || lo.includes('ภาพรวม')) return `📊 นโยบายทั้งหมด: ${allPol.length} เรื่อง\nภารกิจ: ${(appDb.tasks||[]).length} ภารกิจ`;
    return 'ขออภัย โหมด Assistant ยังรับคำสั่งพื้นฐาน พิมพ์ "สรุป" เพื่อดูข้อมูล';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    if (geminiApiKey) {
      try {
        const prompt = `ข้อมูล: นโยบาย ${appDb.policies?.length} เรื่อง\nผู้ใช้ถาม: ${userMsg}\nตอบสั้น กระชับ เป็นมิตร`;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
        const data = await res.json();
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        setMessages(prev => [...prev, { sender: 'bot', text: aiText || processQueryBasic(userMsg) }]);
      } catch (err) { setMessages(prev => [...prev, { sender: 'bot', text: processQueryBasic(userMsg) }]); }
    } else {
      setTimeout(() => setMessages(prev => [...prev, { sender: 'bot', text: processQueryBasic(userMsg) }]), 500);
    }
    setIsTyping(false);
  };

  return (
    <div className="print-hide fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[340px] md:w-[380px] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col h-[480px]">
          <div className="bg-slate-900 p-4 border-b border-amber-500/20 flex justify-between"><h3 className="font-bold text-white text-sm">Policy Assistant</h3><button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">&times;</button></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((m, i) => (<div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap ${m.sender === 'user' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-100 rounded-bl-none'}`}>{m.text}</div></div>))}
            {isTyping && <div className="text-slate-400 text-xs">กำลังพิมพ์...</div>}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} disabled={isTyping} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 text-sm text-white outline-none" placeholder="ถามคำถาม..." />
            <button type="submit" disabled={isTyping || !input.trim()} className="bg-amber-600 hover:bg-amber-500 p-3 rounded-xl text-white"><Send size={18} /></button>
          </form>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className={`${isOpen ? 'bg-slate-700' : 'bg-amber-600'} text-white rounded-full p-4 shadow-xl hover:scale-105 transition-all`}>{isOpen ? <X size={24}/> : <MessageCircle size={24}/>}</button>
    </div>
  );
}
