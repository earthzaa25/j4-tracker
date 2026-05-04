import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShieldCheck, LayoutDashboard, ScrollText, FilePlus, 
  History as HistoryIcon, LogOut, Bot, MessageCircle, Send, 
  PieChart, BarChart, Plus, Edit, Trash2, Download, CloudUpload, 
  Briefcase, AlertTriangle, TrendingUp, CheckCircle, CheckCircle2, FileText, CheckSquare, ListTodo, Activity, Printer, Check, X, Lock, 
  Clock, Trophy, Paperclip, Bell, Sun, Moon, ChevronLeft, ChevronRight, Search,
  Kanban, Columns, List, Target, AlertOctagon, GitMerge, Users, Circle, Star, Sparkles,
  MousePointerClick, RefreshCcw, FilterX, CalendarDays, Table, ChevronDown, ChevronUp
} from 'lucide-react';

// ============================================================
// 1. นำ Web App URL จาก Google Apps Script มาวางที่นี่
// ============================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwgZZURz1cGNglxjEK-nGsm2g5cIT88GMG7gMkK2Zl2YydBCJyTlL65h8tcd63I2Z-R/exec"; 

const LOGO_URL = "/S__22413315.jpg";
const GARUDA_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Garuda_Emblem_of_Thailand.svg/150px-Garuda_Emblem_of_Thailand.svg.png";

const geminiApiKey = import.meta.env?.VITE_GEMINI_API_KEY || ''; 

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

// ============== บัญชีและข้อมูลสำรองกรณีฉุกเฉิน ==============
const FALLBACK_ACCOUNTS = [
  { id: "A-1", name: "ผู้ดูแลระบบกลาง (Admin)", passcode: "5721118", role: "admin" },
  { id: "E-1", name: "ผู้บริหารระดับสูง", passcode: "1111", role: "executive" },
  { id: "U-1", name: "กกล.กบ.ทหาร", passcode: "1234", role: "user" }
];

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
    return [...(appDb.reports || [])].sort((a, b) => new Date(b.created_at || b.report_date) - new Date(a.created_at || a.report_date)).slice(0, 8);
  }, [appDb.reports]);

  const hasNew = recentReports.some(r => {
    const diff = new Date() - new Date(r.created_at || r.report_date);
    return diff < 24 * 60 * 60 * 1000; 
  });

  return (
    <div className="relative" ref={bellRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2.5 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors border border-slate-600 shadow-lg theme-transition">
        <Bell size={20} className={hasNew ? "text-amber-400 animate-pulse" : "text-slate-400"} />
        {hasNew && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-800"></span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden fade-in-up theme-transition">
          <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center theme-transition">
            <h3 className="font-bold text-slate-200 flex items-center gap-2"><Bell size={16} className="text-amber-400"/> การอัปเดตล่าสุด</h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">วันนี้ {recentReports.length} รายการ</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {recentReports.map(r => (
              <div key={r.report_id} className="p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{r.unit_name}</p>
                  <p className="text-[10px] text-slate-500">{new Date(r.created_at || r.report_date).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>
                <p className="text-sm text-slate-200 line-clamp-2 my-2">รายงาน: <span className="text-sky-400">[{r.policy_no}]</span> {r.policy_snippet}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">ความคืบหน้า</span>
                  <span className="font-bold" style={{ color: getBarColor(r.progress_percent) }}>{r.progress_percent}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1 theme-transition">
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

  // ดึงข้อมูลทั้งหมดจาก Google Sheets พร้อมตรวจสอบ Error แบบละเอียด
  const loadData = async () => {
    setIsSyncing(true);
    try {
      const actions = ['units', 'policies', 'reports', 'tasks'];
      const results = await Promise.all(actions.map(async (action) => {
        const res = await fetch(`${SCRIPT_URL}?action=${action}`);
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (parseErr) {
          console.error("Invalid Response:", text);
          throw new Error("PERMISSION_ERROR"); // โยน Error พิเศษออกไปถ้าแปลงเป็น JSON ไม่ได้
        }
      }));

      setAppDb({
        units: results[0] && !results[0].error ? results[0] : [],
        policies: results[1] && !results[1].error ? results[1] : [],
        reports: results[2] && !results[2].error ? results[2] : [],
        tasks: results[3] && !results[3].error ? results[3] : [],
        isLoaded: true
      });
    } catch (e) {
      console.error("Load Error:", e);
      if (e.message === "PERMISSION_ERROR") {
        showToast("สิทธิ์การเข้าถึงถูกบล็อก! กรุณาตรวจสอบการตั้งค่า Deploy ใหม่", "error");
      } else {
        showToast("เชื่อมต่อ Google Sheets ไม่สำเร็จ (ตรวจสอบ URL หรือ Network)", "error");
      }
      setAppDb(prev => ({...prev, isLoaded: true}));
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (SCRIPT_URL && !SCRIPT_URL.includes("URL_ที่คุณได้มา")) {
        loadData();
    }
  }, []);

  const callApi = async (method, action, data, idKey = "", idValue = "") => {
      try {
          // Google Apps Script ต้องการ mode 'no-cors' เพื่อไม่ให้ถูกบล็อกการส่งข้อมูลแบบ POST จาก Browser โดยตรง
          await fetch(SCRIPT_URL, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
              body: JSON.stringify({ method, action, data, idKey, idValue })
          });
          // สั่งโหลดข้อมูลใหม่หลังบันทึก เนื่องจากโหมด no-cors ไม่สามารถอ่านค่าตอบกลับได้
          setTimeout(loadData, 1500);
          return true;
      } catch (e) {
          console.error(e);
          showToast("ส่งข้อมูลล้มเหลว กรุณาตรวจสอบอินเทอร์เน็ต", "error");
          return false;
      }
  };

  const handleLogin = (unitName, role) => {
    setUser({ id: `session-${Date.now()}`, unitName, role: role || 'user' });
    setView(role === 'executive' ? 'EXEC_SUMMARY' : 'DASHBOARD_POLICY');
  };

  const handleLogout = () => { setUser(null); setView('DASHBOARD_POLICY'); };

  if (!user) {
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
          
          .print-header { display: block !important; text-align: center; border-bottom: 2px solid #000; margin-bottom: 20px; padding-bottom: 10px; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className="print-hide fixed left-0 top-0 h-screen z-40 bg-slate-800 border-r border-slate-700 flex flex-col w-16 lg:w-64 theme-transition">
        <div className="h-20 flex items-center justify-between lg:px-6 border-b border-slate-700 shrink-0 px-2">
          <div className="flex items-center">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-lg flex items-center justify-center border border-amber-500 p-1">
               <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" onError={(e)=>{e.target.onerror=null; e.target.src='https://placehold.co/100x100/1e293b/f59e0b?text=J4'}} />
            </div>
            <div className="hidden lg:block ml-3">
              <h1 className="font-bold text-lg text-slate-100">J4 Tracker</h1>
              <p className="text-amber-500 text-[10px]">G-Sheets Edition</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-2">
          <NavItem icon={<LayoutDashboard size={20}/>} label="ภาพรวมข้อสั่งการ" isActive={view === 'DASHBOARD_POLICY'} onClick={() => setView('DASHBOARD_POLICY')} />
          <NavItem icon={<PieChart size={20}/>} label="ภาพรวมภารกิจ" isActive={view === 'DASHBOARD_TASK'} onClick={() => setView('DASHBOARD_TASK')} />
          {isAdminOrExec && <NavItem icon={<Briefcase size={20}/>} label="บทสรุปผู้บริหาร" isActive={view === 'EXEC_SUMMARY'} onClick={() => setView('EXEC_SUMMARY')} />}
          <div className="border-t border-slate-700 my-2"></div>
          <NavItem icon={<ScrollText size={20}/>} label="นโยบาย/ข้อสั่งการ" isActive={view === 'POLICIES'} onClick={() => setView('POLICIES')} />
          {user.role !== 'executive' && <NavItem icon={<FilePlus size={20}/>} label="บันทึกรายงานผล" isActive={view === 'REPORT_FORM'} onClick={() => setView('REPORT_FORM')} />}
          <NavItem icon={<HistoryIcon size={20}/>} label="ประวัติการรายงาน" isActive={view === 'HISTORY'} onClick={() => setView('HISTORY')} />
          <NavItem icon={<CheckSquare size={20}/>} label="ติดตามการทำงาน" isActive={view === 'TASKS'} onClick={() => setView('TASKS')} />
          {user.role === 'admin' && <NavItem icon={<Users size={20}/>} label="สิทธิ์ใช้งาน" isActive={view === 'UNITS_CONFIG'} onClick={() => setView('UNITS_CONFIG')} />}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="hidden lg:block mb-4">
             <p className="text-[10px] text-slate-500">หน่วยงาน:</p>
             <p className="text-xs font-bold text-amber-500 truncate">{user.unitName}</p>
          </div>
           <button onClick={handleLogout} className="w-full flex items-center justify-center lg:justify-start lg:px-4 py-2 rounded border border-slate-600 text-slate-400 hover:text-red-500 hover:border-red-500 transition-colors">
            <LogOut size={20}/><span className="hidden lg:block ml-3">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-16 lg:ml-64 p-4 md:p-8 h-screen overflow-y-auto custom-scrollbar">
        <div className="hidden print-header">
           <img src={GARUDA_URL} alt="ตราครุฑ" />
           <h1>บันทึกข้อความ / รายงานสรุปผล</h1>
           <h2>ระบบติดตามและประเมินผลการปฏิบัติราชการ (J4 Tracker)</h2>
           <p>พิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</p>
        </div>

        <div className="max-w-7xl mx-auto pb-20">
          <div className="flex justify-between items-center mb-6 print-hide">
            <h2 className="text-slate-400 font-medium flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-500"/> ระบบติดตามงาน J4 Command Center
            </h2>
            <div className="flex gap-2 items-center">
                {isSyncing && <span className="text-amber-500 text-xs font-bold flex items-center gap-1"><RefreshCcw size={12} className="animate-spin"/> กำลังสื่อสารกับเซิร์ฟเวอร์...</span>}
                <button onClick={loadData} className="p-2 hover:bg-slate-700 rounded-full text-slate-400" title="Refresh Data"><RefreshCcw size={18}/></button>
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 hover:bg-slate-700 rounded-full text-slate-400">
                  {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
                </button>
            </div>
          </div>

          {/* Router Views */}
          {view === 'DASHBOARD_POLICY' && <PolicyDashboard appDb={appDb} user={user} />}
          {view === 'DASHBOARD_TASK' && <TaskDashboard appDb={appDb} user={user} />}
          {view === 'EXEC_SUMMARY' && <ExecutiveSummary appDb={appDb} />}
          {view === 'POLICIES' && <Policies appDb={appDb} user={user} showToast={showToast} callApi={callApi} refresh={loadData} />}
          {view === 'TASKS' && <TaskTracker appDb={appDb} user={user} showToast={showToast} callApi={callApi} refresh={loadData} />}
          {view === 'REPORT_FORM' && <ReportForm appDb={appDb} user={user} showToast={showToast} setView={setView} callApi={callApi} refresh={loadData} />}
          {view === 'HISTORY' && <History appDb={appDb} user={user} showToast={showToast} callApi={callApi} refresh={loadData} />}
          {view === 'UNITS_CONFIG' && <UnitsConfig appDb={appDb} showToast={showToast} callApi={callApi} refresh={loadData} />}
        </div>
      </main>

      <Chatbot appDb={appDb} />

      {toastData && (
        <div className="fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-2xl border bg-slate-800 text-white flex items-center gap-3 animate-bounce" style={{borderColor: toastData.type === 'ok' ? '#10b981' : '#ef4444'}}>
          <CheckCircle size={20} className={toastData.type === 'ok' ? 'text-emerald-500' : 'text-red-500'}/>
          <span>{toastData.msg}</span>
        </div>
      )}
    </div>
  );
}

// ============== LOGIN SCREEN ==============
function LoginScreen({ onLogin, isLoading, appDb, loadData }) {
  const accounts = appDb.units && appDb.units.length > 0 ? appDb.units : FALLBACK_ACCOUNTS;
  
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
        <p className="text-amber-400 font-medium">กำลังเชื่อมต่อกับ Google Sheets...</p>
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
            <img src={LOGO_URL} alt="J4 Logo" className="w-full h-full object-contain" onError={(e)=>{e.target.onerror=null; e.target.src='https://placehold.co/100x100/1e293b/f59e0b?text=J4'}}/>
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
          
          {/* แจ้งเตือนกรณีใช้บัญชีสำรอง */}
          {appDb.isLoaded && (!appDb.units || appDb.units.length === 0) && (
            <div className="text-[10px] text-amber-500 bg-amber-500/10 p-2 rounded text-center border border-amber-500/20">
              ⚠️ กำลังใช้งานบัญชีสำรอง เนื่องจากยังไม่ได้เพิ่มรายชื่อใน Google Sheets
            </div>
          )}

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
  
  // Interactive Filter State
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [expandedPolicyId, setExpandedPolicyId] = useState(null);

  useEffect(() => {
    if (fiscalYear !== 'ALL' && fiscalYear !== 'CUSTOM') {
      const dates = getFiscalYearDates(fiscalYear);
      setFilterStart(dates.start);
      setFilterEnd(dates.end.substring(0, 10)); // just display part
    } else if (fiscalYear === 'ALL') {
      setFilterStart('');
      setFilterEnd('');
    }
  }, [fiscalYear]);

  const currentUnits = useMemo(() => {
     return (appDb.units || []).filter(u => u.role === 'user' || !u.role);
  }, [appDb.units]);

  const basePolicies = useMemo(() => {
    let f = appDb.policies || [];
    if (filterUnit !== 'ALL') {
      f = f.filter(p => p.primary_unit === filterUnit || p.secondary_units?.includes(filterUnit) || p.primary_unit === 'ทุกหน่วย');
    }
    return f;
  }, [appDb.policies, filterUnit]);

  const baseReports = useMemo(() => {
    let r = appDb.reports || [];
    if (filterUnit !== 'ALL') {
      r = r.filter(x => x.unit_name === filterUnit);
    }
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

  // Overall calculations for KPI cards
  const overallStats = useMemo(() => {
    const sectionPolicyIds = basePolicies.map(p => p.policy_id);
    const sectionReports = baseReports.filter(r => sectionPolicyIds.includes(r.policy_id));

    const progList = basePolicies.map(po => {
      const rs = sectionReports.filter(r => r.policy_id === po.policy_id).sort((a, b) => new Date(b.report_date || b.created_at) - new Date(a.report_date || a.created_at));
      return { 
        id: po.policy_id, 
        progress: rs.length ? (rs[0].progress_percent || 0) : 0,
      };
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
      
      // Calculate donut before applying interactive filter so the chart doesn't disappear
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

      // Apply Interactive Filter to the list shown
      if (selectedStatus) {
        cProgList = cProgList.filter(x => x.statusBucket === selectedStatus);
      }

      return {
        commander: cmd,
        total: cPols.length,
        completed: cCompleted,
        avg: cAvg,
        progList: cProgList,
        statusCount: cStatusCount,
        donutGradientStops
      };
    }).sort((a, b) => b.total - a.total); 

    return (
      <div className="mt-12 pt-8 border-t-[3px] border-slate-700/80 first:mt-0 first:pt-0 first:border-0 theme-transition">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-amber-500/20 p-3 rounded-xl text-amber-400 border border-amber-500/30">
            {iconComponent}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-wide">{title}</h2>
        </div>

        {groupedByCommander.map((group, index) => (
          <div key={index} className="mt-8 pt-8 border-t border-slate-700/50 first:mt-0 first:pt-0 first:border-0 theme-transition">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h3 className="text-xl font-bold text-sky-500 flex items-center gap-2">
                <ShieldCheck size={24} /> ผู้สั่งการ: {group.commander}
              </h3>
              <div className="flex items-center gap-3">
                <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-sm border border-slate-700 theme-transition">
                  ทั้งหมด {group.total} เรื่อง | เสร็จแล้ว {group.completed} เรื่อง
                </span>
                <span className="bg-sky-500/20 text-sky-600 dark:text-sky-400 px-3 py-1 rounded-full text-sm font-bold border border-sky-500/30">
                  คืบหน้าเฉลี่ย {group.avg.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col items-center theme-transition">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 w-full text-slate-100"><PieChart size={20} className="text-slate-400"/> สัดส่วนความคืบหน้า</h3>
                <div className="relative w-48 h-48 rounded-full mb-6 cursor-pointer transform hover:scale-105 transition-transform" 
                     onClick={() => setSelectedStatus(null)}
                     style={{ background: group.total > 0 ? `conic-gradient(${group.donutGradientStops})` : '#e2e8f0' }}>
                  <div className="absolute inset-0 m-auto w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center border-[8px] border-slate-800 theme-transition">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-100">{group.total}</div>
                      <div className="text-[10px] text-slate-400">ข้อสั่งการ</div>
                    </div>
                  </div>
                </div>
                <div className="w-full space-y-2 mt-auto">
                  {group.statusCount.map(s => (
                    <div key={s.name} 
                         onClick={() => setSelectedStatus(selectedStatus === s.name ? null : s.name)}
                         className={`flex items-center justify-between text-xs p-2 rounded-lg cursor-pointer transition-colors border ${selectedStatus === s.name ? 'border-amber-500 bg-slate-700/50' : 'border-transparent hover:bg-slate-700/30'}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[s.name] }}></span>
                        <span className={selectedStatus === s.name ? 'text-amber-400 font-bold' : 'text-slate-400'}>{s.name}</span>
                      </div>
                      <span className="font-medium text-slate-100">{s.value}</span>
                    </div>
                  ))}
                  {group.total === 0 && <p className="text-center text-sm text-slate-500">ไม่มีข้อมูล</p>}
                </div>
              </div>

              <div className="lg:col-span-8 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col theme-transition">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-100">
                  <BarChart size={20} className="text-slate-400"/> 
                  รายการข้อสั่งการ 
                  {selectedStatus && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-1 rounded ml-2">กรอง: {selectedStatus}</span>}
                </h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5" style={{ maxHeight: '350px' }}>
                  {group.progList.map(p => {
                    const isExpanded = expandedPolicyId === p.id;
                    return (
                      <div key={p.id} className={`relative flex flex-col gap-2 p-3 rounded-lg border transition-all theme-transition ${isExpanded ? 'bg-slate-700/40 border-amber-500 shadow-inner' : 'bg-slate-900/50 border-slate-700/50 hover:border-amber-500/50'}`}>
                        
                        {/* Policy Header (Clickable) */}
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
                          
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 theme-transition">
                            <div className="h-full rounded-full transition-all duration-1000 relative" style={{ width: `${p.progress}%`, backgroundColor: getBarColor(p.progress) }}></div>
                          </div>
                          
                          {p.linkedTasksCount > 0 && !isExpanded && (
                            <div className="flex items-center justify-between text-[10px] mt-2 text-slate-400">
                              <span className="flex items-center gap-1"><GitMerge size={10}/> มีภารกิจย่อย {p.linkedTasksCount} รายการ (คลิกเพื่อดูไทม์ไลน์)</span>
                            </div>
                          )}
                        </div>

                        {/* Expanded Timeline View */}
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-slate-700 fade-in-up">
                             {renderPolicyTimeline(p.id)}
                          </div>
                        )}
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
      {/* Filters */}
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 print-hide flex flex-col md:flex-row items-start md:items-center justify-between gap-4 theme-transition">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500">
            <LayoutDashboard size={24} /> ภาพรวมนโยบายและข้อสั่งการ
          </h2>
          <p className="text-sm text-slate-400 mt-1">คลิกที่กราฟเพื่อคัดกรอง หรือ <b className="text-amber-400">คลิกที่นโยบาย</b> เพื่อดู Timeline การปฏิบัติงาน</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-1 justify-end">
          {selectedStatus && (
            <button onClick={() => setSelectedStatus(null)} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors w-full md:w-auto justify-center shrink-0">
              <RefreshCcw size={16}/> ล้างการกรอง
            </button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:max-w-md">
            <div>
              <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} disabled={!isAdminOrExec} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-slate-100 p-2.5 text-sm disabled:opacity-50 theme-transition">
                <option value="ALL">ทุกหน่วยงาน</option>
                {currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-slate-100 p-2.5 text-sm theme-transition">
                <option value="ALL">ทุกปีงบประมาณ</option>
                <option value="2567">ปีงบประมาณ 2567</option>
                <option value="2568">ปีงบประมาณ 2568</option>
                <option value="2569">ปีงบประมาณ 2569</option>
              </select>
            </div>
          </div>
          <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg text-sm font-semibold flex items-center justify-center shadow-lg transition-colors print-hide shrink-0" title="พิมพ์รายงานภาพรวม (PDF)">
            <Printer size={18}/>
          </button>
        </div>
      </div>

      {/* Overview Interactive Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print-hide">
        {[
          { label: 'ข้อสั่งการรวม', val: overallStats.total, status: null, color: 'text-slate-100', border: 'border-slate-600', bg: 'bg-slate-800' },
          { label: 'เสร็จสมบูรณ์', val: overallStats.completed, status: 'เสร็จแล้ว (100%)', color: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-950/20' },
          { label: 'กำลังดำเนินการ', val: overallStats.inProgress, status: 'ดำเนินการต่อเนื่อง (51-90%)', color: 'text-sky-400', border: 'border-sky-500', bg: 'bg-sky-950/20' },
          { label: 'ยังไม่คืบหน้า (0%)', val: overallStats.notStarted, status: 'ต่ำกว่าเกณฑ์ (0-20%)', color: 'text-red-400', border: 'border-red-500', bg: 'bg-red-950/20' }
        ].map(kpi => {
          const isSelected = selectedStatus === kpi.status && kpi.status !== null;
          return (
            <div 
              key={kpi.label} 
              onClick={() => kpi.status ? setSelectedStatus(kpi.status) : setSelectedStatus(null)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden group
                ${isSelected ? `ring-2 ring-offset-2 ring-offset-slate-900 border-transparent ${kpi.bg}` : `border-slate-700 bg-slate-800 hover:${kpi.border} hover:bg-slate-700/50`}
              `}
            >
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
          <div className="text-center py-16 text-slate-500 bg-slate-800 rounded-xl border border-slate-700 theme-transition">
            <LayoutDashboard size={48} className="mx-auto mb-4 opacity-20" />
            <p>ไม่พบข้อมูลนโยบายหรือข้อสั่งการในระบบ</p>
          </div>
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
  
  // Interactive Filters
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedRootCause, setSelectedRootCause] = useState(null);

  const currentUnits = useMemo(() => {
     return (appDb.units || []).filter(u => u.role === 'user' || !u.role);
  }, [appDb.units]);

  // Compute Base tasks based on Dropdowns
  const baseTasks = useMemo(() => {
    let tasks = appDb.tasks || [];
    if (filterUnit !== 'ALL') {
      tasks = tasks.filter(t => t.primary_unit === filterUnit || t.secondary_units?.includes(filterUnit));
    }
    if (fiscalYear !== 'ALL') {
      const dates = getFiscalYearDates(fiscalYear);
      tasks = tasks.filter(t => new Date(t.start_date) >= new Date(dates.start) && new Date(t.end_date) <= new Date(dates.end));
    }
    return tasks;
  }, [appDb.tasks, filterUnit, fiscalYear]);

  // Compute Stats for Charts
  const stats = useMemo(() => {
    const totalTasks = baseTasks.length;
    const completedTasks = baseTasks.filter(t => t.status === 'เสร็จสิ้น').length;
    const delayedTasks = baseTasks.filter(t => t.status === 'ล่าช้า/ติดปัญหา').length;
    const avgProgress = totalTasks > 0 ? baseTasks.reduce((a, b) => a + (Number(b.progress_percent) || 0), 0) / totalTasks : 0;

    const statusCount = [
      { name: 'เสร็จสิ้น', value: completedTasks },
      { name: 'กำลังดำเนินการ', value: baseTasks.filter(t => t.status === 'กำลังดำเนินการ').length },
      { name: 'รอดำเนินการ', value: baseTasks.filter(t => t.status === 'รอดำเนินการ').length },
      { name: 'ล่าช้า/ติดปัญหา', value: delayedTasks }
    ].filter(x => x.value > 0);

    const rootCauseCounts = {};
    baseTasks.filter(t => t.status === 'ล่าช้า/ติดปัญหา').forEach(t => {
       const rc = t.root_cause || 'ไม่ระบุสาเหตุ';
       rootCauseCounts[rc] = (rootCauseCounts[rc] || 0) + 1;
    });
    const rootCausesArray = Object.entries(rootCauseCounts)
      .map(([cause, count]) => ({ cause, count }))
      .sort((a,b) => b.count - a.count);

    return { totalTasks, completedTasks, delayedTasks, avgProgress, statusCount, rootCausesArray };
  }, [baseTasks]);

  const filteredTasksList = useMemo(() => {
    let list = baseTasks;
    if (selectedStatus) list = list.filter(t => t.status === selectedStatus);
    if (selectedRootCause) list = list.filter(t => t.root_cause === selectedRootCause && t.status === 'ล่าช้า/ติดปัญหา');
    return list.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  }, [baseTasks, selectedStatus, selectedRootCause]);

  const delayedList = useMemo(() => {
    return baseTasks.filter(t => t.status === 'ล่าช้า/ติดปัญหา').sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
  }, [baseTasks]);

  let cumulativePercent = 0;
  const donutGradientStops = stats.statusCount.length > 0 ? stats.statusCount.map(d => {
    const start = cumulativePercent; const slicePercent = (d.value / stats.totalTasks) * 100; cumulativePercent += slicePercent;
    return `${TASK_STATUS_COLORS[d.name]} ${start}% ${cumulativePercent}%`;
  }).join(', ') : 'transparent 0% 100%';

  const clearFilters = () => {
    setSelectedStatus(null);
    setSelectedRootCause(null);
  };

  return (
    <div className="space-y-6 fade-in-up text-slate-100">
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 print-hide flex flex-col md:flex-row justify-between items-start md:items-center gap-4 theme-transition">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500">
            <PieChart size={24} /> ภาพรวมภารกิจและการปฏิบัติงาน
          </h2>
          <p className="text-sm text-slate-400 mt-1">คลิกที่การ์ด แผนภูมิ หรือกราฟ เพื่อคัดกรองข้อมูลในตารางด้านล่าง</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-1 justify-end">
          {(selectedStatus || selectedRootCause) && (
            <button onClick={clearFilters} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors w-full md:w-auto justify-center shrink-0">
              <FilterX size={16}/> ล้างการกรองทั้งหมด
            </button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:max-w-md">
            <select value={filterUnit} onChange={e => {setFilterUnit(e.target.value); clearFilters();}} disabled={!isAdminOrExec} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-slate-100 p-2.5 text-sm disabled:opacity-50 theme-transition">
              <option value="ALL">ทุกหน่วยงาน</option>
              {currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
            <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-slate-100 p-2.5 text-sm theme-transition">
              <option value="ALL">ทุกปีงบประมาณ</option>
              <option value="2567">ปีงบประมาณ 2567</option>
              <option value="2568">ปีงบประมาณ 2568</option>
            </select>
          </div>
          <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg text-sm font-semibold flex items-center justify-center shadow-lg transition-colors print-hide shrink-0" title="พิมพ์รายงาน">
            <Printer size={18}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'จำนวนภารกิจรวม', val: stats.totalTasks, status: null, color: 'text-slate-100', border: 'border-slate-600', bg: 'bg-slate-800' },
          { label: 'เสร็จสมบูรณ์', val: stats.completedTasks, status: 'เสร็จสิ้น', color: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-950/20' },
          { label: 'กำลังดำเนินการ', val: baseTasks.filter(t=>t.status==='กำลังดำเนินการ').length, status: 'กำลังดำเนินการ', color: 'text-sky-400', border: 'border-sky-500', bg: 'bg-sky-950/20' },
          { label: 'ล่าช้า/ติดปัญหา', val: stats.delayedTasks, status: 'ล่าช้า/ติดปัญหา', color: 'text-red-400', border: 'border-red-500', bg: 'bg-red-950/20' }
        ].map(kpi => {
          const isSelected = selectedStatus === kpi.status && kpi.status !== null;
          return (
            <div 
              key={kpi.label} 
              onClick={() => { setSelectedStatus(kpi.status); setSelectedRootCause(null); }}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden group
                ${isSelected ? `ring-2 ring-offset-2 ring-offset-slate-900 border-transparent ${kpi.bg}` : `border-slate-700 bg-slate-800 hover:${kpi.border} hover:bg-slate-700/50`}
              `}
            >
              <MousePointerClick size={16} className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity ${kpi.color}`}/>
              <p className="text-slate-400 text-sm font-medium">{kpi.label}</p>
              <h3 className={`text-3xl font-bold mt-2 ${kpi.color}`}>{kpi.val}</h3>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col items-center">
          <h3 className="font-semibold w-full mb-6 text-slate-100 flex justify-between items-center">สัดส่วนสถานะงาน</h3>
          <div className="relative w-48 h-48 rounded-full mb-6 transition-all duration-500 hover:scale-105 cursor-pointer" 
               style={{ background: stats.totalTasks > 0 ? `conic-gradient(${donutGradientStops})` : '#334155' }}
               onClick={() => { setSelectedStatus(null); setSelectedRootCause(null); }}>
            <div className="absolute inset-0 m-auto w-32 h-32 bg-slate-800 rounded-full flex flex-col items-center justify-center border-[8px] border-slate-800 shadow-inner">
              <span className="text-2xl font-bold text-slate-100">{stats.totalTasks}</span>
              <span className="text-[10px] text-slate-400 text-center px-2">{selectedStatus ? selectedStatus : '(คลิกเพื่อล้างตัวกรอง)'}</span>
            </div>
          </div>
          <div className="w-full space-y-2 mt-auto">
            {stats.statusCount.map(s => (
              <div key={s.name} onClick={() => { setSelectedStatus(selectedStatus === s.name ? null : s.name); setSelectedRootCause(null); }}
                className={`flex items-center justify-between text-xs p-2 rounded-lg cursor-pointer transition-colors border ${selectedStatus === s.name ? 'border-amber-500 bg-slate-700' : 'border-transparent hover:bg-slate-700/50'}`}>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full shadow-sm" style={{ background: TASK_STATUS_COLORS[s.name] }}></span><span className={selectedStatus === s.name ? 'font-bold text-amber-400' : 'text-slate-300'}>{s.name}</span></div>
                <span className="font-medium text-slate-100">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col">
          <h3 className="font-semibold mb-6 text-slate-100 flex items-center gap-2">
            <AlertOctagon size={20} className="text-red-500"/> วิเคราะห์สาเหตุความล่าช้า 
            {selectedRootCause && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded ml-2 font-normal">กรอง: {selectedRootCause}</span>}
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4" style={{ maxHeight: '350px' }}>
            {stats.rootCausesArray.map((rc, i) => {
              const maxVal = Math.max(...stats.rootCausesArray.map(x=>x.count), 1);
              const pct = (rc.count / maxVal) * 100;
              const isSelected = selectedRootCause === rc.cause;
              return (
                <div key={i} onClick={() => { setSelectedRootCause(isSelected ? null : rc.cause); setSelectedStatus('ล่าช้า/ติดปัญหา'); }}
                  className={`group cursor-pointer p-2 rounded-lg transition-colors border ${isSelected ? 'border-red-500 bg-red-950/20' : 'border-transparent hover:bg-slate-700/30'}`}>
                  <div className="flex justify-between text-xs mb-1.5"><span className={`truncate pr-4 flex items-center gap-1 ${isSelected ? 'text-red-400 font-bold' : 'text-slate-300'}`}>{rc.cause}</span><span className="font-bold text-slate-100">{rc.count} งาน</span></div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex"><div className={`h-full rounded-full transition-all duration-700 ease-out ${isSelected ? 'bg-red-500' : 'bg-red-500/60 group-hover:bg-red-400'}`} style={{ width: `${pct}%` }}></div></div>
                </div>
              );
            })}
            {stats.rootCausesArray.length === 0 && <p className="text-center text-sm text-slate-500 mt-10">ไม่มีข้อมูลงานล่าช้า</p>}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl theme-transition">
        <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-100 flex items-center gap-2">
            <ListTodo size={18} className="text-amber-500" /> รายการภารกิจที่ตรงตามเงื่อนไข 
            {(selectedStatus || selectedRootCause) && <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full">{filteredTasksList.length}</span>}
          </h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 text-left sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 font-medium whitespace-nowrap min-w-[200px]">ชื่องาน</th>
                <th className="p-4 font-medium whitespace-nowrap">หน่วยงาน</th>
                <th className="p-4 font-medium whitespace-nowrap text-center">สถานะ</th>
                <th className="p-4 font-medium w-32">ความคืบหน้า</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredTasksList.map(t => (
                <tr key={t.task_id} className="hover:bg-slate-700/30 transition-colors theme-transition">
                  <td className="p-4 text-slate-200 font-medium">
                    <p className="line-clamp-2" title={t.task_name}>{t.task_name}</p>
                    {t.status === 'ล่าช้า/ติดปัญหา' && t.root_cause && <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded mt-1 inline-block">สาเหตุ: {t.root_cause}</span>}
                  </td>
                  <td className="p-4 text-xs text-slate-400">{t.primary_unit}</td>
                  <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-[10px] border ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>{t.status}</span></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700"><div style={{ width: `${t.progress_percent}%`, backgroundColor: getBarColor(t.progress_percent) }} className="h-full rounded-full"></div></div>
                      <span className="text-[10px] font-bold font-mono" style={{ color: getBarColor(t.progress_percent) }}>{t.progress_percent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTasksList.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">ไม่มีข้อมูลภารกิจตามเงื่อนไขที่เลือก</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============== EXECUTIVE SUMMARY ==============
function ExecutiveSummary({ appDb }) {
  const [fiscalYear, setFiscalYear] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState(null);

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
      const shortName = `[ลำดับ ${p.policy_no || '-'}] ${p.order.substring(0, 40)}${p.order.length > 40 ? '...' : ''}`;
      if (unitStats[p.primary_unit]) {
        unitStats[p.primary_unit].totalPolicies += 1;
        unitStats[p.primary_unit].policyNames.push(shortName);
      }
      p.secondary_units?.forEach(su => { 
        if (unitStats[su]) {
          unitStats[su].totalPolicies += 1;
          unitStats[su].policyNames.push(`(ร่วม) ${shortName}`);
        }
      });
      if (p.primary_unit === 'ทุกหน่วย') {
        Object.keys(unitStats).forEach(k => {
          unitStats[k].totalPolicies += 1;
          unitStats[k].policyNames.push(`(ทุกหน่วย) ${shortName}`);
        });
      }
    });

    const latestReports = {};
    const approvedReports = reports.filter(r => r.approval_status === 'อนุมัติแล้ว');
    
    approvedReports.forEach(r => {
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

    const unitArray = Object.entries(unitStats).map(([name, data]) => ({
      name, ...data, avgProgress: data.reports > 0 ? (data.progressSum / data.reports) : 0
    })).filter(u => u.totalPolicies > 0 || u.reports > 0).sort((a,b) => b.avgProgress - a.avgProgress);

    const problemReports = reports.filter(r => r.problems && r.problems.trim().length > 2 && r.problems.trim() !== '-').sort((a, b) => new Date(b.report_date || b.created_at) - new Date(a.report_date || a.created_at));
    const today = new Date(); today.setHours(0,0,0,0);
    const todayUpdatesCount = reports.filter(r => new Date(r.created_at || r.report_date) >= today).length;

    const trendData = [];
    for(let i=6; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0,10);
      const label = d.toLocaleDateString('th-TH', {day:'numeric', month:'short'});
      const count = reports.filter(r => {
         const rd = new Date(r.created_at || r.report_date);
         return rd.toISOString().substring(0,10) === dateStr;
      }).length;
      trendData.push({ label, count });
    }
    const maxTrendCount = Math.max(...trendData.map(d => d.count), 1);

    const importantPolicies = policies.filter(p => p.is_important);
    const importantTasks = (appDb.tasks || []).filter(t => t.is_important);

    return { unitArray, problemReports, totalPolicies: policies.length, totalReports: approvedReports.length, todayUpdatesCount, trendData, maxTrendCount, importantPolicies, importantTasks };
  }, [appDb, fiscalYear]);

  const filteredProblems = useMemo(() => {
    let probs = stats.problemReports;
    if (selectedUnit) probs = probs.filter(r => r.unit_name === selectedUnit);
    return probs.slice(0, 5); 
  }, [stats.problemReports, selectedUnit]);

  const filteredPriorityTasks = useMemo(() => {
    let tasks = stats.importantTasks;
    if (selectedUnit) tasks = tasks.filter(t => t.primary_unit === selectedUnit || t.secondary_units?.includes(selectedUnit));
    return tasks;
  }, [stats.importantTasks, selectedUnit]);

  const handleExportSummaryExcel = () => {
    const filename = `สรุปผลการปฏิบัติราชการ_${new Date().toISOString().substring(0,10)}`;
    const dataToExport = stats.unitArray.map(u => ({
      "หน่วยงาน": u.name, "นโยบาย/ข้อสั่งการที่รับผิดชอบ": u.totalPolicies, "รายงานที่อนุมัติแล้ว": u.reports,
      "ความคืบหน้าเฉลี่ย (%)": u.avgProgress.toFixed(2), "ภารกิจเสร็จสมบูรณ์ (รายการ)": u.completed
    }));
    exportToExcel(dataToExport, filename);
  };

  return (
    <div className="space-y-6 fade-in-up text-slate-900 md:text-slate-100 rounded-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/20 p-3 rounded-xl print-hide"><Briefcase className="text-amber-500 dark:text-amber-400" size={28} /></div>
          <div><h2 className="text-2xl font-bold md:text-slate-100 print-text-black">บทสรุปผู้บริหาร (Executive Summary)</h2><p className="text-amber-600 md:text-amber-400 text-sm font-bold mt-1">คลิกเลือกหน่วยงานในตารางเพื่อดูเจาะลึกเฉพาะส่วน</p></div>
        </div>
        <div className="flex items-center gap-3 print-hide">
          {selectedUnit && <button onClick={() => setSelectedUnit(null)} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"><FilterX size={16}/> ล้างการกรอง</button>}
          <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg text-slate-100 p-2 text-sm"><option value="ALL">ทุกปีงบประมาณ</option><option value="2567">ปีงบประมาณ 2567</option><option value="2568">ปีงบประมาณ 2568</option><option value="2569">ปีงบประมาณ 2569</option></select>
          <button onClick={handleExportSummaryExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg"><Table size={16}/> ส่งออก Excel</button>
          <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg"><Printer size={16}/> พิมพ์รายงานสรุป</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-amber-600/90 to-amber-800/90 p-5 rounded-xl border border-amber-500/30 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2"><h3 className="font-bold">🏆 หน่วยงานผลงานยอดเยี่ยม</h3><Trophy size={20} className="text-amber-200"/></div>
          {stats.unitArray.length > 0 ? (<div><p className="text-2xl font-bold">{stats.unitArray[0].name}</p><p className="text-amber-100 text-sm mt-1">ความคืบหน้าเฉลี่ย {stats.unitArray[0].avgProgress.toFixed(1)}%</p></div>) : <p className="text-sm text-amber-200">ยังไม่มีข้อมูล</p>}
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg theme-transition"><p className="text-slate-400 text-sm font-medium mb-1">การรายงานความคืบหน้า</p><h3 className="text-3xl font-bold md:text-slate-100 print-text-black tracking-tight">{stats.totalReports} <span className="text-sm font-normal text-slate-500">ฉบับ</span></h3></div>
        <div className="bg-sky-900/20 p-6 rounded-xl border border-sky-500/30 shadow-lg relative overflow-hidden theme-transition"><p className="text-sky-600 dark:text-sky-400 text-sm font-medium mb-1">อัปเดตล่าสุด (วันนี้)</p><h3 className="text-3xl font-bold text-sky-600 dark:text-sky-500 tracking-tight">{stats.todayUpdatesCount} <span className="text-sm font-normal text-slate-500">รายการ</span></h3></div>
      </div>

      {(stats.importantPolicies.length > 0 || stats.importantTasks.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800/50 rounded-xl border-t-4 border-amber-500 shadow-lg p-5 theme-transition">
            <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-4"><Star size={20} className="fill-amber-500" /> นโยบาย/ข้อสั่งการสำคัญ (Priority)</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {stats.importantPolicies.map(p => {
                const reps = (appDb.reports || []).filter(r => r.policy_id === p.policy_id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                const progress = reps.length > 0 ? reps[0].progress_percent : 0;
                return (
                  <div key={p.policy_id} className="p-4 bg-slate-900/80 rounded-lg border border-slate-700/50 theme-transition">
                    <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-sky-400">[{p.policy_no}] {p.commander}</span><span className="text-xs font-mono font-bold" style={{ color: getBarColor(progress) }}>{progress}%</span></div>
                    <p className="text-sm text-slate-200 leading-snug line-clamp-2" title={p.order}>{p.order}</p>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden theme-transition"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: getBarColor(progress) }}></div></div>
                    <p className="text-[10px] text-slate-500 mt-2">หน่วยรับผิดชอบ: <span className="text-amber-400">{p.primary_unit}</span></p>
                  </div>
                );
              })}
              {stats.importantPolicies.length === 0 && <p className="text-sm text-slate-500 text-center py-4">ไม่มีนโยบายที่ถูกปักหมุดไว้</p>}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl border-t-4 border-amber-500 shadow-lg p-5 theme-transition">
            <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-4"><Star size={20} className="fill-amber-500" /> ภารกิจสำคัญ (Priority Tasks) {selectedUnit && <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-normal ml-2">{selectedUnit}</span>}</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {filteredPriorityTasks.map(t => {
                const deadline = getDeadlineStatus(t.end_date, t.status);
                return (
                  <div key={t.task_id} className="p-4 bg-slate-900/80 rounded-lg border border-slate-700/50 theme-transition">
                    <div className="flex justify-between items-start mb-2"><span className={`px-2 py-0.5 rounded text-[10px] border ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>{t.status}</span><span className="text-xs font-mono font-bold" style={{ color: getBarColor(t.progress_percent) }}>{t.progress_percent}%</span></div>
                    <p className="text-sm font-bold text-slate-200 leading-snug line-clamp-2" title={t.task_name}>{t.task_name}</p>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden theme-transition"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${t.progress_percent}%`, backgroundColor: getBarColor(t.progress_percent) }}></div></div>
                    <div className="flex justify-between items-center mt-3"><p className="text-[10px] text-slate-500">หน่วย: <span className="text-amber-400">{t.primary_unit}</span></p><span className={`text-[10px] px-1.5 py-0.5 rounded border ${deadline.color} flex items-center gap-1`}><Clock size={8} /> {deadline.label}</span></div>
                  </div>
                );
              })}
              {filteredPriorityTasks.length === 0 && <p className="text-sm text-slate-500 text-center py-4">ไม่มีภารกิจสำคัญสำหรับหน่วยที่เลือก</p>}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-5 theme-transition">
          <h3 className="text-lg font-bold text-amber-600 md:text-amber-500 mb-4 flex items-center gap-2"><TrendingUp size={20} /> ตารางจัดอันดับ KPI หน่วยงาน (Leaderboard)</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {stats.unitArray.map((u, index) => {
              const isSelected = selectedUnit === u.name;
              return (
                <div className={`p-4 rounded-lg border flex items-start gap-4 cursor-pointer transition-all duration-300 theme-transition ${isSelected ? 'bg-slate-700/80 border-amber-500 shadow-md ring-1 ring-amber-500/50' : 'bg-slate-900/50 border-slate-700/50 hover:border-amber-500/30'}`} key={u.name} onClick={() => setSelectedUnit(isSelected ? null : u.name)}>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold shrink-0 mt-1 theme-transition ${isSelected ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1"><h4 className={`font-bold md:text-slate-100 print-text-black truncate ${isSelected ? 'text-amber-400' : ''}`}>{u.name}</h4><span className="text-sm font-mono font-bold" style={{ color: getBarColor(u.avgProgress) }}>{u.avgProgress.toFixed(1)}%</span></div>
                    <p className="text-xs text-slate-500 mb-2">รับผิดชอบ {u.totalPolicies} เรื่อง | {u.completed} เสร็จสิ้น</p>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden theme-transition"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${u.avgProgress}%`, backgroundColor: getBarColor(u.avgProgress) }}></div></div>
                    {isSelected && u.policyNames && u.policyNames.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-700/50 fade-in-up">
                        <p className="text-[11px] text-amber-600 dark:text-amber-400/80 font-bold mb-1">แผนงาน/ข้อสั่งการที่รับผิดชอบ:</p>
                        <ul className="list-disc pl-4 space-y-1">{u.policyNames.map((pn, i) => (<li key={i} className="text-[10px] text-slate-400 leading-tight">{pn}</li>))}</ul>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {stats.unitArray.length === 0 && <p className="text-center text-slate-500 py-4">ยังไม่มีข้อมูล</p>}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-5 theme-transition print-hide">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2"><Activity size={16} /> แนวโน้มการรายงานผลย้อนหลัง 7 วัน</h3>
            <div className="flex items-end justify-between gap-2 h-32 mt-2">
              {stats.trendData.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 gap-1 group">
                  <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">{d.count}</div>
                  <div className="w-full bg-sky-500/80 rounded-t-sm transition-all duration-500 hover:bg-amber-500" style={{ height: `${(d.count / stats.maxTrendCount) * 100}%`, minHeight: d.count > 0 ? '4px' : '0px' }}></div>
                  <div className="text-[9px] text-slate-500 mt-1 whitespace-nowrap overflow-hidden text-center w-full">{d.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-5 theme-transition">
            <h3 className="text-lg font-bold text-red-600 md:text-red-500 mb-4 flex items-center gap-2"><AlertTriangle size={20} /> ประเด็นข้อขัดข้องสำคัญล่าสุด {selectedUnit && <span className="text-xs bg-red-500/20 px-2 py-0.5 rounded text-red-400 font-normal ml-2">{selectedUnit}</span>}</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {filteredProblems.map(r => (
                <div key={r.report_id} className="p-4 bg-red-950/10 border border-red-900/30 rounded-lg relative">
                  <div className="absolute top-4 right-4 text-xs font-mono text-slate-500">{formatDate(r.report_date || r.created_at)}</div>
                  <span className="inline-block px-2 py-0.5 bg-slate-900 text-amber-600 dark:text-amber-500 text-[10px] rounded border border-slate-700 mb-2 theme-transition">{r.unit_name}</span>
                  <h4 className="text-sm font-bold md:text-slate-100 print-text-black mb-2 pr-16 line-clamp-2" title={r.policy_snippet}>[ลำดับ {r.policy_no || '-'}] {r.policy_snippet}</h4>
                  <div className="bg-red-950/20 p-3 rounded border border-red-900/20"><p className="text-xs text-red-600 dark:text-red-400 leading-relaxed"><span className="font-bold">ปัญหา:</span> {r.problems}</p></div>
                  {r.next_plan && r.next_plan !== '-' && <p className="text-xs text-slate-500 mt-2"><span className="font-medium md:text-slate-400 print-text-black">แผนแก้ไข:</span> {r.next_plan}</p>}
                </div>
              ))}
              {filteredProblems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-slate-500"><CheckCircle size={32} className="text-emerald-500/30 mb-3" /><p className="text-sm">ไม่พบรายงานข้อขัดข้องในขณะนี้</p></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== POLICIES ==============
function Policies({ appDb, user, showToast, callApi, refresh }) {
  const [filterAudience, setFilterAudience] = useState('');
  const [filterMeeting, setFilterMeeting] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState(''); 
  const [currentPage, setCurrentPage] = useState(1); 
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formCategory, setFormCategory] = useState('นโยบายหลัก');
  const [primaryUnit, setPrimaryUnit] = useState('ทุกหน่วย');
  const [secUnits, setSecUnits] = useState([]);

  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';

  const policies = appDb.policies || [];
  const currentUnits = (appDb.units || []).filter(u => u.role === 'user' || !u.role);

  const audiences = [...new Set(policies.map(p => p.audience).filter(a => a && a !== '-'))];
  const meetings = [...new Set(policies.map(p => p.meeting).filter(m => m && m !== '-'))];
  const categories = ["นโยบายหลัก", "สั่งการเพิ่มเติม"];
  const commanders = ["ผบ.ทสส.", "รอง ผบ.ทสส.", "เสธ.ทหาร", "จก.กบ.ทหาร", "ผู้บังคับบัญชาอื่นๆ"];
  
  useEffect(() => { setCurrentPage(1); }, [filterAudience, filterMeeting, filterCategory, search]);

  const filtered = policies.filter(p => {
    const searchTerms = search.toLowerCase().split(' ').filter(t => t);
    const textToSearch = `${p.order} ${p.commander} ${p.primary_unit} ${p.policy_no}`.toLowerCase();
    const matchesSearch = searchTerms.every(term => textToSearch.includes(term));
    
    return matchesSearch &&
      (!filterAudience || p.audience === filterAudience) &&
      (!filterMeeting || p.meeting === filterMeeting) &&
      (!filterCategory || p.category === filterCategory);
  }).sort((a, b) => {
    if (a.is_important && !b.is_important) return -1;
    if (!a.is_important && b.is_important) return 1;

    const numA = parseInt(a.policy_no);
    const numB = parseInt(b.policy_no);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return (a.policy_no || '').localeCompare(b.policy_no || '');
  });

  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleImportant = async (policy) => {
    const success = await callApi("update", "policies", { is_important: !policy.is_important }, "policy_id", policy.policy_id);
    if (success) {
      showToast(!policy.is_important ? 'ปักหมุดข้อสั่งการสำคัญ' : 'ยกเลิกการปักหมุด', 'ok');
      refresh();
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันการลบข้อสั่งการนี้?')) {
      const success = await callApi("delete", "policies", null, "policy_id", id);
      if (success) {
        showToast('ลบข้อสั่งการเรียบร้อย', 'ok');
        refresh();
      }
    }
  };

  const openModal = (data = null) => {
    setEditData(data);
    setFormCategory(data?.category || 'นโยบายหลัก');
    setPrimaryUnit(data?.primary_unit || 'ทุกหน่วย');
    setSecUnits(data?.secondary_units || []);
    setModalOpen(true);
  };

  const toggleSecUnit = (uName) => {
    setSecUnits(prev => prev.includes(uName) ? prev.filter(x => x !== uName) : [...prev, uName]);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    
    data.primary_unit = primaryUnit;
    data.secondary_units = primaryUnit === 'ทุกหน่วย' ? [] : secUnits;

    if (data.category === 'นโยบายหลัก') {
      data.audience = '-';
      data.meeting = '-';
    }
    
    const isUpdating = !!editData;
    const policyId = isUpdating ? editData.policy_id : `POL-${Date.now()}`;
    const payload = { ...data, policy_id: policyId, created_at: isUpdating ? editData.created_at : new Date().toISOString() };

    showToast('กำลังบันทึกข้อมูลไปที่ Google Sheets...');
    const success = await callApi(isUpdating ? "update" : "insert", "policies", payload, "policy_id", policyId);
    
    if (success) {
      if (isUpdating && data.policy_no !== editData.policy_no) {
        const relatedReports = (appDb.reports || []).filter(r => r.policy_id === policyId);
        for(const r of relatedReports) {
          await callApi("update", "reports", { policy_no: data.policy_no }, "report_id", r.report_id);
        }
      }
      showToast('บันทึกข้อสั่งการเรียบร้อย', 'ok');
      setModalOpen(false);
      refresh();
    }
  };

  const handleExportExcel = () => {
    const filename = `นโยบายและข้อสั่งการ_${new Date().toISOString().substring(0,10)}`;
    const dataToExport = filtered.map(p => ({
      "ลำดับ": p.policy_no || '-',
      "ประเภท": p.category,
      "ผู้สั่งการ": p.commander,
      "ที่ประชุม": p.audience || '-',
      "ครั้งที่": p.meeting || '-',
      "รายละเอียด": p.order,
      "ระยะเวลา": p.timeframe || '-',
      "หน่วยรับผิดชอบหลัก": p.primary_unit,
      "หน่วยร่วมปฏิบัติ": (p.secondary_units || []).join(', ')
    }));
    exportToExcel(dataToExport, filename);
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-slate-800 p-5 rounded-xl border border-slate-700 theme-transition">
        <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500 whitespace-nowrap">
          <ScrollText size={24} /> นโยบายและข้อสั่งการ ({filtered.length})
        </h2>
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <div className="relative flex-1 md:w-48 min-w-[200px]">
             <Search size={16} className="absolute left-3 top-3 text-slate-400" />
             <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาข้อสั่งการ..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 focus:border-amber-500 outline-none theme-transition"/>
          </div>
          <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} className="flex-1 md:w-auto bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 theme-transition">
            <option value="">ทุกประเภท</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterAudience} onChange={e=>setFilterAudience(e.target.value)} className="flex-1 md:w-auto bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 theme-transition">
            <option value="">ทุกที่ประชุม</option>
            {audiences.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg transition-colors">
            <Table size={16}/> ส่งออก
          </button>
          {user.role === 'admin' && (
            <button onClick={() => openModal(null)} className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-lg w-full md:w-auto text-white">
              <Plus size={16}/> เพิ่มข้อสั่งการ
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl theme-transition">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 text-left theme-transition">
              <tr>
                <th className="p-4 font-medium whitespace-nowrap w-16">ลำดับ</th>
                <th className="p-4 font-medium whitespace-nowrap w-24">ประเภท</th>
                <th className="p-4 font-medium whitespace-nowrap w-24">ผู้สั่งการ</th>
                <th className="p-4 font-medium whitespace-nowrap">ที่ประชุม/ครั้งที่</th>
                <th className="p-4 font-medium min-w-[300px]">ข้อสั่งการ</th>
                <th className="p-4 font-medium whitespace-nowrap w-32">ระยะเวลา</th>
                <th className="p-4 font-medium min-w-[150px]">หน่วยรับผิดชอบ</th>
                {user.role === 'admin' && <th className="p-4 font-medium text-center w-24">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.map(p => (
                <tr key={p.policy_id} className={`hover:bg-slate-700/30 align-top transition-colors theme-transition ${p.is_important ? 'bg-amber-900/10' : ''}`}>
                  <td className="p-4 text-xs font-bold text-amber-500 text-center">
                    <div className="flex flex-col items-center gap-1">
                       {isAdminOrExec ? (
                          <button onClick={() => toggleImportant(p)} title="ปักหมุดเรื่องสำคัญ" className="hover:scale-110 transition-transform">
                             <Star size={16} className={p.is_important ? "text-amber-500 fill-amber-500" : "text-slate-500"} />
                          </button>
                       ) : (
                          p.is_important && <Star size={14} className="text-amber-500 fill-amber-500" />
                       )}
                       <span>{p.policy_no || '-'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-[10px] border ${p.category === 'นโยบายหลัก' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' : 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30'}`}>
                      {p.category || 'ไม่ระบุ'}
                    </span>
                  </td>
                  <td className="p-4 text-xs whitespace-nowrap text-slate-500 dark:text-slate-300">{p.commander}</td>
                  <td className="p-4 text-xs whitespace-nowrap text-slate-400">
                    {p.category === 'นโยบายหลัก' ? '-' : `${p.audience || '-'} (${p.meeting || '-'})`}
                  </td>
                  <td className="p-4 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{p.order}</td>
                  <td className="p-4 text-xs text-emerald-600 dark:text-emerald-400/90 whitespace-nowrap">{p.timeframe || '-'}</td>
                  <td className="p-4 text-xs text-slate-400">
                    <p className="font-medium text-slate-600 dark:text-slate-300">{p.primary_unit || p.responsible_unit || '-'}</p>
                    {p.secondary_units?.length > 0 && <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-1">ร่วม: {p.secondary_units.join(', ')}</p>}
                  </td>
                  {user.role === 'admin' && (
                    <td className="p-4 text-xs space-y-2 text-center">
                      <button onClick={() => openModal(p)} className="w-full text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 hover:bg-sky-400/10 py-1 rounded transition-colors">แก้ไข</button>
                      <button onClick={() => handleDelete(p.policy_id)} className="w-full text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-400/10 py-1 rounded transition-colors">ลบ</button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-500">ไม่มีข้อมูลข้อสั่งการ</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalItems={filtered.length} onPageChange={setCurrentPage} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl fade-in-up shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar theme-transition text-slate-100">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">{editData ? <Edit size={20}/> : <Plus size={20}/>} {editData ? 'แก้ไขข้อสั่งการ' : 'เพิ่มข้อสั่งการใหม่'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ประเภท</label>
                  <select name="category" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 theme-transition">
                    <option value="นโยบายหลัก">นโยบายหลัก</option>
                    <option value="สั่งการเพิ่มเติม">สั่งการเพิ่มเติม</option>
                  </select>
                </div>
                <div><label className="text-xs text-slate-400 block mb-1">ลำดับ (เช่น 1, 2, 3)</label><input name="policy_no" defaultValue={editData?.policy_no} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 theme-transition"/></div>
                <div><label className="text-xs text-slate-400 block mb-1">ระยะเวลาการดำเนินการ</label><input name="timeframe" defaultValue={editData?.timeframe} placeholder="เช่น ภายใน ก.ย. 69" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 theme-transition"/></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ผู้สั่งการ</label>
                  <select name="commander" defaultValue={editData?.commander || 'ผบ.ทสส.'} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 theme-transition">
                    {commanders.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {formCategory === 'สั่งการเพิ่มเติม' && (
                  <>
                    <div><label className="text-xs text-slate-400 block mb-1">ที่ประชุม</label><input name="audience" defaultValue={editData?.audience} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 theme-transition"/></div>
                    <div><label className="text-xs text-slate-400 block mb-1">ครั้งที่</label><input name="meeting" defaultValue={editData?.meeting} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 theme-transition"/></div>
                  </>
                )}
              </div>
              
              <div><label className="text-xs text-slate-400 block mb-1">รายละเอียดข้อสั่งการ</label><textarea name="order" defaultValue={editData?.order} rows="4" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 theme-transition"></textarea></div>
              
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 theme-transition">
                <label className="text-sm text-amber-500 font-bold block mb-3">หน่วยงานรับผิดชอบ</label>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">หน่วยรับผิดชอบหลัก (Primary)</label>
                    <select name="primary_unit" value={primaryUnit} onChange={e => setPrimaryUnit(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 theme-transition">
                      <option value="ทุกหน่วย">ทุกหน่วย</option>
                      {currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                  </div>
                  {primaryUnit !== 'ทุกหน่วย' && (
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">หน่วยร่วมปฏิบัติ (Secondary - ไม่บังคับ)</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-800 p-3 rounded-lg border border-slate-600 max-h-32 overflow-y-auto custom-scrollbar theme-transition">
                        {currentUnits.filter(u => u.name !== primaryUnit).map(u => (
                          <label key={u.id} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={secUnits.includes(u.name)} onChange={() => toggleSecUnit(u.name)} className="rounded border-slate-500 bg-slate-700 text-amber-500 focus:ring-amber-500"/>
                            <span className="text-slate-200">{u.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700 mt-6 theme-transition">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors">ยกเลิก</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-lg transition-colors">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskTracker({ appDb, user, showToast, callApi, refresh }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban' | 'timeline'
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const [primaryUnit, setPrimaryUnit] = useState(user.unitName);
  const [secUnits, setSecUnits] = useState([]);
  const [formStatus, setFormStatus] = useState('รอดำเนินการ');
  const [formProgress, setFormProgress] = useState(0);

  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');

  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const currentUnits = (appDb.units || []).filter(u => u.role === 'user' || !u.role);
  const tasks = appDb.tasks || [];
  const policies = appDb.policies || [];

  useEffect(() => { setCurrentPage(1); }, [search, filterStatus, viewMode]);

  const visible = isAdminOrExec ? tasks : tasks.filter(t => t.primary_unit === user.unitName || t.secondary_units?.includes(user.unitName));
  const filtered = visible.filter(t => {
    const searchTerms = search.toLowerCase().split(' ').filter(term => term);
    const textToSearch = `${t.task_name} ${t.primary_unit} ${t.assignee||''}`.toLowerCase();
    const matchesSearch = searchTerms.every(term => textToSearch.includes(term));
    return matchesSearch && (filterStatus === '' || t.status === filterStatus);
  }).sort((a, b) => {
    if (a.is_important && !b.is_important) return -1;
    if (!a.is_important && b.is_important) return 1;

    if (a.status === 'ล่าช้า/ติดปัญหา' && b.status !== 'ล่าช้า/ติดปัญหา') return -1;
    if (b.status === 'ล่าช้า/ติดปัญหา' && a.status !== 'ล่าช้า/ติดปัญหา') return 1;
    return new Date(a.start_date) - new Date(b.start_date);
  });

  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const statuses = ["รอดำเนินการ", "กำลังดำเนินการ", "เสร็จสิ้น", "ล่าช้า/ติดปัญหา"];

  const handleExportExcel = () => {
    const filename = `รายการภารกิจและการปฏิบัติงาน_${new Date().toISOString().substring(0,10)}`;
    const dataToExport = filtered.map(t => ({
      "ชื่องาน/ภารกิจ": t.task_name,
      "หน่วยงานรับผิดชอบหลัก": t.primary_unit,
      "หน่วยร่วม": (t.secondary_units || []).join(', '),
      "วันเริ่มต้น": formatDate(t.start_date),
      "วันกำหนดเสร็จ": formatDate(t.end_date),
      "สถานะ": t.status,
      "ความคืบหน้า (%)": t.progress_percent,
      "สาเหตุล่าช้า": t.root_cause || '-',
      "ผู้รับผิดชอบ": t.assignee || '-',
      "หมายเหตุ": t.note || '-'
    }));
    exportToExcel(dataToExport, filename);
  };

  const toggleImportant = async (task) => {
    const success = await callApi("update", "tasks", { is_important: !task.is_important }, "task_id", task.task_id);
    if (success) {
      showToast(!task.is_important ? 'ปักหมุดภารกิจสำคัญ' : 'ยกเลิกการปักหมุด', 'ok');
      refresh();
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันการลบภารกิจ/งานนี้?')) {
      const success = await callApi("delete", "tasks", null, "task_id", id);
      if (success) {
        showToast('ลบงานเรียบร้อย', 'ok');
        refresh();
      }
    }
  };

  const openModal = (data = null) => {
    setEditData(data);
    setPrimaryUnit(data?.primary_unit || (user.role === 'user' ? user.unitName : currentUnits[0]?.name));
    setSecUnits(data?.secondary_units || []);
    setFormStatus(data?.status || 'รอดำเนินการ');
    setFormProgress(data?.progress_percent || 0);
    
    let parsedSubtasks = [];
    if (data?.subtasks) {
      try { parsedSubtasks = typeof data.subtasks === 'string' ? JSON.parse(data.subtasks) : data.subtasks; } 
      catch(e) { parsedSubtasks = []; }
    }
    setSubtasks(parsedSubtasks);

    setModalOpen(true);
  };

  const toggleSecUnit = (uName) => {
    setSecUnits(prev => prev.includes(uName) ? prev.filter(x => x !== uName) : [...prev, uName]);
  };

  const handleAddSubtask = () => {
    if(!newSubtask.trim()) return;
    setSubtasks([...subtasks, { id: Date.now(), text: newSubtask.trim(), done: false }]);
    setNewSubtask('');
  };
  const toggleSubtask = (id) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s));
  };
  const removeSubtask = (id) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  useEffect(() => {
    if (subtasks.length > 0) {
      const doneCount = subtasks.filter(s => s.done).length;
      setFormProgress(Math.round((doneCount / subtasks.length) * 100));
      if (doneCount === subtasks.length && formStatus !== 'เสร็จสิ้น') setFormStatus('เสร็จสิ้น');
    }
  }, [subtasks]);

  const handleSave = async (e) => {
    e.preventDefault();

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    
    if (!data.task_name?.trim()) { showToast('กรุณาระบุชื่องาน/ภารกิจ', 'error'); return; }
    if (!data.start_date) { showToast('กรุณาระบุวันเริ่มต้น', 'error'); return; }

    data.progress_percent = Number(formProgress) || 0;
    data.primary_unit = primaryUnit;
    data.secondary_units = secUnits;
    if (formStatus !== 'ล่าช้า/ติดปัญหา') data.root_cause = null; 

    if (!data.policy_id) delete data.policy_id;
    if (!data.root_cause) delete data.root_cause;
    if (!data.depends_on) delete data.depends_on;
    
    if (subtasks.length > 0) {
      data.subtasks = subtasks;
    } else {
      delete data.subtasks;
    }
    
    const isUpdating = !!editData;
    const taskId = isUpdating ? editData.task_id : `TSK-${Date.now()}`;
    const payload = { ...data, task_id: taskId };

    showToast('กำลังบันทึกข้อมูลไปที่ Google Sheets...');
    const success = await callApi(isUpdating ? "update" : "insert", "tasks", payload, "task_id", taskId);
    
    if (success) {
      showToast('อัปเดตและรายงานความคืบหน้าเรียบร้อย', 'ok');
      setModalOpen(false);
      refresh();
    }
  };

  const handleDragStart = (e, id) => {
    const task = tasks.find(t => t.task_id === id);
    const isBlocked = task?.depends_on && tasks.find(x => x.task_id === task.depends_on)?.status !== 'เสร็จสิ้น';
    if (isBlocked) {
      e.preventDefault();
      showToast('ไม่สามารถย้ายได้ เนื่องจากยังติดภารกิจที่ต้องทำก่อน', 'error');
      return;
    }

    setDraggedTaskId(id);
    e.dataTransfer.setData("taskId", id);
    setTimeout(() => { e.target.classList.add('opacity-30'); }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-30');
    setDraggedTaskId(null);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find(t => t.task_id === taskId);
    
    if (!task || task.status === newStatus) return;

    const updates = { status: newStatus };
    if (newStatus === 'ล่าช้า/ติดปัญหา' && !task.root_cause) updates.root_cause = 'อื่นๆ';
    else if (newStatus !== 'ล่าช้า/ติดปัญหา') updates.root_cause = null;

    showToast('กำลังอัปเดตสถานะ...');
    const success = await callApi("update", "tasks", updates, "task_id", taskId);
    if (success) {
      showToast(`ย้ายงานไปที่: ${newStatus}`, 'ok');
      refresh();
    }
  };

  // FEATURE 3: Render Timeline (Gantt Chart) Helper
  const renderTimeline = () => {
    const validTasks = filtered.filter(t => t.start_date && t.end_date);
    if (validTasks.length === 0) return <p className="text-center text-slate-500 py-10">ไม่มีข้อมูลภารกิจที่ระบุช่วงเวลาชัดเจน</p>;

    const minDate = Math.min(...validTasks.map(t => new Date(t.start_date).getTime()));
    const maxDate = Math.max(...validTasks.map(t => new Date(t.end_date).getTime()));
    const totalDuration = maxDate - minDate || 1; 
    
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 overflow-x-auto shadow-xl theme-transition">
         <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex border-b border-slate-700 pb-2 mb-4 relative">
               <div className="w-1/3 shrink-0 font-bold text-slate-400 text-sm px-2">รายชื่อภารกิจ ({validTasks.length})</div>
               <div className="w-2/3 relative flex justify-between text-xs text-slate-500 font-mono px-2">
                 <span>{formatDate(minDate)}</span>
                 <span>{formatDate(maxDate)}</span>
               </div>
            </div>
            
            {/* Timeline Rows */}
            <div className="space-y-4">
               {validTasks.map(t => {
                 const leftPercent = Math.max(0, ((new Date(t.start_date).getTime() - minDate) / totalDuration) * 100);
                 const widthPercent = Math.max(1, ((new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) / totalDuration) * 100);
                 
                 return (
                   <div key={t.task_id} className="flex items-center group">
                      <div className="w-1/3 shrink-0 px-2 flex flex-col justify-center border-r border-slate-700/50 pr-4">
                         <div className="text-xs text-slate-200 font-medium truncate cursor-pointer group-hover:text-amber-400 transition-colors" title={t.task_name} onClick={() => openModal(t)}>
                           {t.task_name}
                         </div>
                         <div className="text-[9px] text-slate-500">{t.primary_unit}</div>
                      </div>
                      <div className="w-2/3 relative h-6 bg-slate-900/50 rounded flex items-center ml-2 border border-slate-700/50">
                         {/* Grid background lines */}
                         <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                            {[1,2,3,4].map(i => <div key={i} className="border-l border-slate-500 h-full"></div>)}
                         </div>
                         
                         {/* Gantt Bar */}
                         <div 
                           className={`absolute h-4 rounded-full shadow-sm flex items-center px-2 cursor-pointer transition-transform hover:scale-y-110
                             ${t.status === 'เสร็จสิ้น' ? 'bg-emerald-500/80' : t.status === 'ล่าช้า/ติดปัญหา' ? 'bg-red-500/80 animate-pulse' : 'bg-sky-500/80'}
                           `}
                           style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, minWidth: '4px' }}
                           onClick={() => openModal(t)}
                           title={`${t.task_name}\n${formatDate(t.start_date)} - ${formatDate(t.end_date)}`}
                         >
                           {widthPercent > 10 && <span className="text-[9px] font-bold text-white drop-shadow-md truncate">{t.progress_percent}%</span>}
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
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-slate-800 p-5 rounded-xl border border-slate-700 theme-transition">
        <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500 whitespace-nowrap">
          <ListTodo size={24} /> ติดตามการทำงานและสถานภาพ ({filtered.length})
        </h2>
        <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 theme-transition">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md flex items-center gap-1 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`} title="มุมมองตาราง">
              <List size={16}/> <span className="hidden md:inline">ตาราง</span>
            </button>
            <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md flex items-center gap-1 text-sm font-medium transition-colors ${viewMode === 'kanban' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`} title="มุมมองบอร์ด">
              <Columns size={16}/> <span className="hidden md:inline">บอร์ด</span>
            </button>
            <button onClick={() => setViewMode('timeline')} className={`p-1.5 rounded-md flex items-center gap-1 text-sm font-medium transition-colors ${viewMode === 'timeline' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`} title="มุมมองไทม์ไลน์">
              <CalendarDays size={16}/> <span className="hidden md:inline">ไทม์ไลน์</span>
            </button>
          </div>

          <div className="relative flex-1 md:w-48 min-w-[150px]">
             <Search size={16} className="absolute left-3 top-3 text-slate-400" />
             <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหางาน..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 focus:border-amber-500 outline-none theme-transition"/>
          </div>
          
          {(viewMode === 'list' || viewMode === 'timeline') && (
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="flex-1 md:w-auto bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 theme-transition">
              <option value="">ทุกสถานะ</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          
          <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
             <Table size={16}/> ส่งออก
          </button>

          {user.role !== 'executive' && (
            <button onClick={() => openModal(null)} className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap shadow-lg w-full md:w-auto text-white">
              <Plus size={16}/> เพิ่มงานใหม่
            </button>
          )}
        </div>
      </div>

      {viewMode === 'timeline' ? renderTimeline() : viewMode === 'list' ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl theme-transition">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 text-left theme-transition">
                <tr>
                  <th className="p-4 font-medium whitespace-nowrap min-w-[250px]">ชื่องาน/ภารกิจ</th>
                  <th className="p-4 font-medium whitespace-nowrap">หน่วยงาน</th>
                  <th className="p-4 font-medium whitespace-nowrap">ระยะเวลา (Deadline)</th>
                  <th className="p-4 font-medium whitespace-nowrap text-center">สถานะ</th>
                  <th className="p-4 font-medium w-40">ความคืบหน้า</th>
                  <th className="p-4 font-medium whitespace-nowrap">ผู้รับผิดชอบ</th>
                  {user.role !== 'executive' && <th className="p-4 font-medium text-center w-28">อัปเดต</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {paginated.map(t => {
                  const deadline = getDeadlineStatus(t.end_date, t.status);
                  const rowClass = t.status === 'เสร็จสิ้น' ? 'opacity-50 hover:opacity-100' : t.status === 'ล่าช้า/ติดปัญหา' ? 'bg-red-950/20' : 'hover:bg-slate-700/30';
                  const escBadge = getEscalationBadge(t.end_date);
                  const isBlocked = t.depends_on && tasks.find(x => x.task_id === t.depends_on)?.status !== 'เสร็จสิ้น';
                  const blockedByTask = isBlocked ? tasks.find(x => x.task_id === t.depends_on) : null;

                  let tSubtasks = [];
                  if(t.subtasks) try{ tSubtasks = typeof t.subtasks === 'string' ? JSON.parse(t.subtasks) : t.subtasks; }catch(e){}
                  const completedSt = tSubtasks.filter(s=>s.done).length;
                  
                  return (
                  <tr key={t.task_id} className={`${rowClass} transition-colors align-middle theme-transition ${t.is_important ? 'bg-amber-900/10' : ''}`}>
                    <td className="p-4 text-slate-700 dark:text-slate-200">
                      <div className="flex items-start gap-2 mb-1">
                        {isAdminOrExec ? (
                           <button onClick={() => toggleImportant(t)} title="ปักหมุดภารกิจสำคัญ" className="mt-0.5 hover:scale-110 transition-transform shrink-0">
                              <Star size={16} className={t.is_important ? "text-amber-500 fill-amber-500" : "text-slate-500"} />
                           </button>
                        ) : (
                           t.is_important && <Star size={14} className="text-amber-500 fill-amber-500 mt-0.5 shrink-0" />
                        )}
                        <p className="font-bold text-base">{t.task_name}</p>
                      </div>
                      
                      {t.policy_id && (
                        <p className="text-[10px] text-sky-600 dark:text-sky-400 flex items-center gap-1 mb-2 ml-6"><Target size={10}/> โครงการ: {(policies.find(p=>p.policy_id===t.policy_id)?.order||'').substring(0,60)}...</p>
                      )}

                      {isBlocked && (
                         <div className="mt-1 mb-2 ml-6 bg-orange-100 dark:bg-orange-950/30 p-1.5 rounded border border-orange-300 dark:border-orange-500/20 text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1.5 theme-transition font-medium">
                           <Lock size={12}/> <span>รอให้งาน <b>{blockedByTask?.task_name}</b> เสร็จก่อน</span>
                         </div>
                      )}

                      {tSubtasks.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mb-2 ml-6">
                           <CheckSquare size={12}/> งานย่อย: สำเร็จ {completedSt}/{tSubtasks.length}
                        </div>
                      )}

                      {t.note && (
                        <div className="mt-1 ml-6 bg-slate-100 dark:bg-slate-900/80 p-2 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex gap-2 items-start theme-transition">
                          <Activity size={12} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5"/>
                          <span className="line-clamp-2">{t.note}</span>
                        </div>
                      )}
                      
                      {t.status === 'ล่าช้า/ติดปัญหา' && (
                         <div className="mt-1 ml-6 text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertOctagon size={12}/> สาเหตุ: {t.root_cause || 'ไม่ระบุ'}</div>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                      <p className="font-medium text-slate-600 dark:text-slate-300">{t.primary_unit || t.unit_name || '-'}</p>
                      {t.secondary_units?.length > 0 && <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-1">ร่วม: {t.secondary_units.join(', ')}</p>}
                    </td>
                    <td className="p-4 text-xs whitespace-nowrap">
                      <div className="text-slate-500 dark:text-slate-400 mb-1">{formatDate(t.start_date)} - {formatDate(t.end_date)}</div>
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${deadline.color}`}>
                          <Clock size={10} /> {deadline.label}
                        </span>
                        {/* FEATURE 4: Escalation badge */}
                        {t.status !== 'เสร็จสิ้น' && escBadge && <span className={`px-1.5 py-0.5 rounded text-[10px] border border-white/20 ${escBadge.class}`}>{escBadge.label}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] border ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-20 bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 theme-transition">
                          <div style={{ width: `${t.progress_percent}%`, backgroundColor: getBarColor(t.progress_percent) }} className="h-full rounded-full transition-all duration-500"></div>
                        </div>
                        <span className="text-xs font-bold" style={{ color: getBarColor(t.progress_percent) }}>{t.progress_percent}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">{t.assignee || '-'}</td>
                    {user.role !== 'executive' && (
                      <td className="p-4 text-xs text-center whitespace-nowrap">
                        <div className="flex flex-col gap-2 items-center justify-center">
                          {(user.role === 'admin' || t.primary_unit === user.unitName || t.secondary_units?.includes(user.unitName)) && (
                            <button onClick={() => openModal(t)} className="bg-sky-500/20 hover:bg-sky-500 border border-sky-500/30 text-sky-600 dark:text-sky-400 hover:text-white px-3 py-1.5 rounded flex items-center gap-1.5 transition-all w-full justify-center">
                              <Edit size={14}/> รายงานสถานะ
                            </button>
                          )}
                          {(user.role === 'admin' || t.primary_unit === user.unitName) && (
                            <button onClick={() => handleDelete(t.task_id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="ลบภารกิจนี้">
                              <Trash2 size={16}/>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )})}
                {filtered.length === 0 && <tr><td colSpan={user.role!=='executive'?7:6} className="p-8 text-center text-slate-500">ไม่มีข้อมูลงาน/ภารกิจ</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalItems={filtered.length} onPageChange={setCurrentPage} />
        </div>
      ) : (
        // FEATURE 2: KANBAN BOARD VIEW
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 print-hide min-h-[600px]">
           {statuses.map(statusCol => {
              const colTasks = filtered.filter(t => t.status === statusCol);
              const headerColor = statusCol === 'ล่าช้า/ติดปัญหา' ? 'border-t-red-500' : statusCol === 'เสร็จสิ้น' ? 'border-t-emerald-500' : statusCol === 'กำลังดำเนินการ' ? 'border-t-sky-500' : 'border-t-slate-500';
              
              return (
                <div 
                  key={statusCol} 
                  className={`kanban-col flex-1 bg-slate-800/80 rounded-xl border border-slate-700/50 flex flex-col theme-transition shadow-inner overflow-hidden`}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-slate-700/50'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('bg-slate-700/50'); }}
                  onDrop={(e) => { e.currentTarget.classList.remove('bg-slate-700/50'); handleDrop(e, statusCol); }}
                >
                  <div className={`p-4 border-b border-slate-700/50 border-t-4 ${headerColor} bg-slate-800 flex justify-between items-center theme-transition`}>
                    <h3 className="font-bold text-slate-100">{statusCol}</h3>
                    <span className="bg-slate-900 text-slate-400 text-xs px-2 py-1 rounded-full font-mono">{colTasks.length}</span>
                  </div>
                  
                  <div className="p-3 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                    {colTasks.map(t => {
                       const deadline = getDeadlineStatus(t.end_date, t.status);
                       const escBadge = getEscalationBadge(t.end_date);
                       
                       const isBlocked = t.depends_on && tasks.find(x => x.task_id === t.depends_on)?.status !== 'เสร็จสิ้น';
                       const blockedByTask = isBlocked ? tasks.find(x => x.task_id === t.depends_on) : null;
                       
                       let tSubtasks = [];
                       if(t.subtasks) try{ tSubtasks = typeof t.subtasks === 'string' ? JSON.parse(t.subtasks) : t.subtasks; }catch(e){}
                       const completedSt = tSubtasks.filter(s=>s.done).length;

                       return (
                         <div 
                           key={t.task_id}
                           draggable={user.role !== 'executive' && (user.role === 'admin' || t.primary_unit === user.unitName || t.secondary_units?.includes(user.unitName))}
                           onDragStart={(e) => handleDragStart(e, t.task_id)}
                           onDragEnd={handleDragEnd}
                           onClick={() => (user.role === 'admin' || t.primary_unit === user.unitName || t.secondary_units?.includes(user.unitName)) ? openModal(t) : null}
                           className={`bg-slate-900 p-3.5 rounded-lg border border-slate-700 shadow-md cursor-grab active:cursor-grabbing hover:border-amber-500/50 transition-colors theme-transition group ${isBlocked ? 'opacity-80' : ''} ${t.is_important ? 'ring-1 ring-amber-500' : ''}`}
                         >
                           <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-1.5">
                                {t.is_important && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">{t.primary_unit}</span>
                             </div>
                             <span className="text-[10px] font-mono font-bold" style={{ color: getBarColor(t.progress_percent) }}>{t.progress_percent}%</span>
                           </div>
                           <h4 className="text-sm font-bold text-slate-100 mb-1 leading-tight">{t.task_name}</h4>
                           
                           {t.policy_id && <p className="text-[9px] text-sky-400 line-clamp-1 mb-2"><Target size={8} className="inline mr-1"/> นโยบาย: {(policies.find(p=>p.policy_id===t.policy_id)?.order||'').substring(0,30)}</p>}

                           {/* FEATURE 5: Visual Lock in Kanban */}
                           {isBlocked && (
                             <div className="mb-2 text-[9px] text-orange-400 flex items-center gap-1 bg-orange-950/30 p-1.5 rounded border border-orange-500/20 leading-tight">
                               <Lock size={10} className="shrink-0"/> รอ: {blockedByTask?.task_name}
                             </div>
                           )}

                           {tSubtasks.length > 0 && (
                             <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium mb-2">
                               <CheckSquare size={10}/> งานย่อย: {completedSt}/{tSubtasks.length}
                             </div>
                           )}

                           <div className="w-full bg-slate-800 rounded-full h-1 mb-3">
                              <div className="h-full rounded-full" style={{ width: `${t.progress_percent}%`, backgroundColor: getBarColor(t.progress_percent) }}></div>
                           </div>

                           {statusCol === 'ล่าช้า/ติดปัญหา' && (
                             <div className="mb-2 bg-red-950/30 border border-red-900/50 p-1.5 rounded text-[10px] text-red-400 font-medium line-clamp-1"><AlertOctagon size={10} className="inline mr-1"/> {t.root_cause || 'ไม่ระบุ'}</div>
                           )}

                           <div className="flex justify-between items-center border-t border-slate-800 pt-2 mt-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${deadline.color} flex items-center gap-1`}>
                                <Clock size={8} /> {deadline.label}
                              </span>
                              {t.status !== 'เสร็จสิ้น' && escBadge && <span className={`text-[9px] px-1.5 py-0.5 rounded border border-white/20 ${escBadge.class}`}>{escBadge.label}</span>}
                           </div>
                         </div>
                       )
                    })}
                    {colTasks.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-slate-700/50 rounded-lg flex items-center justify-center text-slate-500 text-xs">
                        ลากการ์ดมาวางที่นี่
                      </div>
                    )}
                  </div>
                </div>
              )
           })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl fade-in-up shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar theme-transition text-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {editData ? <Activity size={24} className="text-sky-500"/> : <Plus size={24}/>} 
                {editData ? 'รายงานสถานภาพ / แก้ไขภารกิจ' : 'เพิ่มภารกิจใหม่'}
              </h3>
              {editData && isAdminOrExec && (
                 <button type="button" onClick={() => toggleImportant(editData)} className="flex items-center gap-1.5 text-sm font-bold bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors">
                    <Star size={16} className={editData.is_important ? "text-amber-500 fill-amber-500" : "text-slate-500"} />
                    <span className={editData.is_important ? "text-amber-500" : "text-slate-400"}>ปักหมุดเรื่องสำคัญ</span>
                 </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ข้อมูลพื้นฐานของงาน */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-4 theme-transition">
                  <h4 className="text-sm font-bold text-amber-500 border-b border-slate-700 pb-2">1. ข้อมูลภารกิจ (Task Info)</h4>
                  
                  {/* FEATURE 1: Link task to policy */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">ความเชื่อมโยงกับนโยบาย (ตอบสนองข้อสั่งการใด)</label>
                    <select name="policy_id" defaultValue={editData?.policy_id || ''} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 theme-transition" disabled={user.role !== 'admin' && editData}>
                      <option value="">-- ไม่ระบุ / เป็นภารกิจปกติของหน่วย --</option>
                      {policies.map(p => (
                        <option key={p.policy_id} value={p.policy_id}>[ลำดับ {p.policy_no||'-'}] {p.order.substring(0, 80)}...</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">ชื่องาน/ภารกิจ <span className="text-red-500">*</span></label>
                    <input name="task_name" defaultValue={editData?.task_name} required className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 theme-transition" readOnly={user.role !== 'admin' && editData}/>
                  </div>

                  {/* FEATURE 5: Depends On */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1"><Lock size={12}/> ลำดับงาน (ต้องรอให้งานใดเสร็จก่อน)</label>
                    <select name="depends_on" defaultValue={editData?.depends_on || ''} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 theme-transition">
                      <option value="">-- ไม่ต้องรองานอื่น --</option>
                      {tasks.filter(t => t.task_id !== editData?.task_id).map(t => (
                        <option key={t.task_id} value={t.task_id}>{t.task_name.substring(0, 50)}...</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">หน่วยรับผิดชอบหลัก <span className="text-red-500">*</span></label>
                      <select name="primary_unit" value={primaryUnit} onChange={e => setPrimaryUnit(e.target.value)} disabled={user.role !== 'admin' && editData && editData.primary_unit !== user.unitName} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 disabled:opacity-50 theme-transition">
                        {currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </div>
                    <div><label className="text-xs text-slate-400 block mb-1">ผู้รับผิดชอบ (ชื่อ)</label><input name="assignee" defaultValue={editData?.assignee} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 theme-transition"/></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-xs text-slate-400 block mb-1">วันเริ่มต้น <span className="text-red-500">*</span></label><input name="start_date" type="date" defaultValue={editData?.start_date ? editData.start_date.substring(0,10) : new Date().toISOString().substring(0,10)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 theme-transition" style={{colorScheme:'auto'}}/></div>
                    <div><label className="text-xs text-slate-400 block mb-1">วันกำหนดเสร็จ</label><input name="end_date" type="date" defaultValue={editData?.end_date ? editData.end_date.substring(0,10) : ''} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 theme-transition" style={{colorScheme:'auto'}}/></div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* FEATURE 5: SUBTASKS (Checklist) */}
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-4 theme-transition">
                    <h4 className="text-sm font-bold text-emerald-500 border-b border-slate-700 pb-2 flex items-center gap-2">
                       <CheckSquare size={16}/> งานย่อย (Checklist)
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                      {subtasks.map(st => (
                        <div key={st.id} className="flex items-center gap-2">
                          <button type="button" onClick={() => toggleSubtask(st.id)} className={`shrink-0 ${st.done ? 'text-emerald-500' : 'text-slate-500'}`}>
                             {st.done ? <CheckCircle2 size={18}/> : <Circle size={18}/>}
                          </button>
                          <span className={`flex-1 text-sm ${st.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{st.text}</span>
                          <button type="button" onClick={() => removeSubtask(st.id)} className="text-slate-600 hover:text-red-400 p-1"><Trash2 size={14}/></button>
                        </div>
                      ))}
                      {subtasks.length === 0 && <p className="text-xs text-slate-500">ยังไม่มีงานย่อย สามารถเพิ่มเพื่อคำนวณ % อัตโนมัติได้</p>}
                    </div>
                    <div className="flex gap-2">
                      <input value={newSubtask} onChange={e=>setNewSubtask(e.target.value)} onKeyDown={(e) => { if(e.key==='Enter'){ e.preventDefault(); handleAddSubtask(); } }} placeholder="พิมพ์งานย่อย..." className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-emerald-500 outline-none"/>
                      <button type="button" onClick={handleAddSubtask} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">เพิ่ม</button>
                    </div>
                  </div>

                  {/* อัปเดตสถานะ */}
                  <div className="bg-sky-900/10 p-4 rounded-xl border border-sky-500/30 space-y-4 relative theme-transition">
                    <h4 className="text-sm font-bold text-sky-600 dark:text-sky-400 border-b border-sky-500/30 pb-2 flex items-center gap-2">
                      <Activity size={16}/> 2. สถานภาพ (Status)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-sky-700 dark:text-sky-200 block mb-1 font-bold">สถานะงาน <span className="text-red-500">*</span></label>
                        <select name="status" value={formStatus} onChange={e=>setFormStatus(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-slate-100 focus:border-sky-500 outline-none theme-transition">
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-sky-700 dark:text-sky-200 block mb-1 font-bold">
                          ความคืบหน้า (%) {subtasks.length > 0 && <span className="text-emerald-400 font-normal">(คำนวณจากงานย่อย)</span>}
                        </label>
                        <input 
                          name="progress_percent" type="number" min="0" max="100" 
                          value={formProgress} onChange={e => setFormProgress(e.target.value)} 
                          readOnly={subtasks.length > 0}
                          className={`w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-slate-100 focus:border-sky-500 outline-none text-lg font-mono theme-transition ${subtasks.length > 0 ? 'opacity-70 cursor-not-allowed' : ''}`}
                        />
                      </div>
                    </div>
                    
                    {/* FEATURE 3: Root Cause Dropdown if Delayed */}
                    {formStatus === 'ล่าช้า/ติดปัญหา' && (
                      <div className="bg-red-950/20 p-3 rounded-lg border border-red-900/50 animate-pulse-once">
                         <label className="text-xs text-red-500 block mb-1 font-bold">⚠️ กรุณาระบุสาเหตุหลัก (Root Cause)</label>
                         <select name="root_cause" defaultValue={editData?.root_cause || ''} required className="w-full bg-slate-900 border border-red-500/50 rounded-lg p-2.5 text-sm text-slate-100 focus:border-red-500 outline-none theme-transition">
                            <option value="">-- ระบุสาเหตุที่ทำให้งานล่าช้า --</option>
                            {ROOT_CAUSES.map(rc => <option key={rc} value={rc}>{rc}</option>)}
                         </select>
                      </div>
                    )}

                    <div>
                      <label className="text-xs text-sky-700 dark:text-sky-200 block mb-1 font-bold">สรุปผลปฏิบัติล่าสุด / หมายเหตุ</label>
                      <textarea name="note" defaultValue={editData?.note} rows="3" placeholder="ระบุสิ่งที่ทำไปแล้วล่าสุด หรือปัญหา..." className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-slate-100 focus:border-sky-500 outline-none theme-transition"></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700 mt-6 theme-transition">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors">ยกเลิก</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 font-bold shadow-lg transition-colors flex items-center gap-2 text-white">
                  <Send size={18}/> บันทึกการอัปเดต
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== REPORT FORM ==============
function ReportForm({ appDb, user, showToast, setView, callApi }) {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const policies = appDb.policies || [];
  
  const availPolicies = isAdminOrExec 
    ? policies
    : policies.filter(p => p.primary_unit === user.unitName || p.secondary_units?.includes(user.unitName) || p.primary_unit === 'ทุกหน่วย' || !p.primary_unit);

  const handleFileUpload = async (e) => {
    // Note: การอัปโหลดไฟล์ในเวอร์ชันนี้ จะทำได้เฉพาะแปะลิงก์ URL ครับ 
    alert("ในโหมด Google Sheets โปรดอัปโหลดไฟล์ขึ้น Google Drive ของท่าน แล้วนำลิงก์ (URL) มาวางในช่องด้านล่างครับ");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const pol = policies.find(p => p.policy_id === data.policy_id);
    
    if (!pol) {
      showToast('กรุณาเลือกข้อสั่งการ', 'error');
      return;
    }

    const reportId = `RP-${Date.now()}`;
    const report = {
      report_id: reportId,
      policy_id: data.policy_id,
      policy_no: pol.policy_no || '-',
      policy_snippet: pol.order.substring(0, 150),
      unit_name: user.unitName,
      report_date: data.report_date,
      past_result: data.past_result,
      next_plan: data.next_plan,
      progress_percent: Number(data.progress_percent) || 0,
      problems: data.problems,
      note: data.note,
      attachment_url: fileUrl || data.attachment_url,
      approval_status: 'อนุมัติแล้ว', // อนุมัติอัตโนมัติ
      created_at: new Date().toISOString()
    };

    showToast('กำลังบันทึกรายงานไปยัง Google Sheets...');
    const success = await callApi("insert", "reports", report, "report_id", reportId);
    
    if (success) {
      showToast('บันทึกรายงานความคืบหน้าเรียบร้อย', 'ok');
      setView('HISTORY');
    }
  };

  return (
    <div className="max-w-4xl mx-auto fade-in-up text-slate-100">
      <div className="bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden theme-transition">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-500/20 p-2 rounded-lg text-amber-500">
              <FilePlus size={24} />
            </div>
            <h2 className="text-2xl font-bold">บันทึกรายงานผลการดำเนินการ (ข้อสั่งการ)</h2>
          </div>
          <p className="text-sm text-slate-400 mb-8 border-b border-slate-700 pb-4">
            เข้าใช้งานในนามหน่วยงาน: <span className="text-amber-600 dark:text-amber-400 font-medium px-2 py-1 bg-amber-500/10 rounded">{user.unitName}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-300 block mb-2">อ้างอิงข้อสั่งการ/นโยบาย ที่ต้องการรายงาน <span className="text-red-500">*</span></label>
              <select name="policy_id" required className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3 text-sm text-slate-100 outline-none theme-transition">
                <option value="">-- เลือกข้อสั่งการ (ที่มีชื่อหน่วยท่านเกี่ยวข้อง) --</option>
                {availPolicies.sort((a,b) => parseInt(a.policy_no||0) - parseInt(b.policy_no||0)).map(p => (
                  <option key={p.policy_id} value={p.policy_id}>
                    [ลำดับ {p.policy_no || '-'}] {p.order.substring(0, 100)}{p.order.length > 100 ? '...' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="text-sm font-medium text-slate-500 dark:text-slate-300 block mb-2">วันที่รายงาน <span className="text-red-500">*</span></label><input name="report_date" type="date" required defaultValue={new Date().toISOString().substring(0,10)} className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3 text-sm text-slate-100 outline-none theme-transition" style={{colorScheme:'auto'}}/></div>
              <div><label className="text-sm font-medium text-slate-500 dark:text-slate-300 block mb-2">ความคืบหน้าสะสม (%) <span className="text-red-500">*</span></label><input name="progress_percent" type="number" min="0" max="100" required defaultValue="0" className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3 text-sm text-slate-100 outline-none theme-transition"/></div>
            </div>
            
            <div className="space-y-4">
              <div><label className="text-sm font-medium text-slate-500 dark:text-slate-300 block mb-2">ผลการดำเนินการที่ผ่านมา <span className="text-red-500">*</span></label><textarea name="past_result" rows="3" required placeholder="สรุปผลการปฏิบัติตามข้อสั่งการในห้วงที่ผ่านมา..." className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3 text-sm text-slate-100 outline-none theme-transition"></textarea></div>
              <div><label className="text-sm font-medium text-slate-500 dark:text-slate-300 block mb-2">แผนดำเนินการต่อไป</label><textarea name="next_plan" rows="3" placeholder="สิ่งที่จะดำเนินการในก้าวถัดไป..." className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3 text-sm text-slate-100 outline-none theme-transition"></textarea></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700/50 theme-transition">
              <div><label className="text-sm font-medium text-slate-500 dark:text-slate-300 block mb-2 text-red-500">ปัญหา/ข้อขัดข้อง</label><textarea name="problems" rows="2" placeholder="ระบุข้อขัดข้องที่ทำให้งานล่าช้า..." className="w-full bg-slate-900 border border-slate-600 focus:border-red-500/50 rounded-xl p-3 text-sm text-slate-100 outline-none theme-transition"></textarea></div>
              <div><label className="text-sm font-medium text-slate-500 dark:text-slate-300 block mb-2">ข้อพิจารณา/หมายเหตุ</label><textarea name="note" rows="2" className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3 text-sm text-slate-100 outline-none theme-transition"></textarea></div>
            </div>
            
            {/* ระบบอัปโหลดไฟล์ */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 theme-transition">
              <label className="text-sm font-medium text-slate-500 dark:text-slate-300 block mb-2">เอกสารแนบ (อัปโหลด หรือ แปะ URL)</label>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <input name="attachment_url" value={fileUrl} onChange={e=>setFileUrl(e.target.value)} placeholder="URL ไฟล์เอกสารอ้างอิง" className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-lg p-3 pl-10 text-sm text-slate-100 outline-none theme-transition"/>
                  <Paperclip size={16} className="absolute left-3 top-3.5 text-slate-400"/>
                </div>
                <div className="relative overflow-hidden shrink-0">
                  <button type="button" onClick={handleFileUpload} className="bg-slate-700 hover:bg-slate-600 text-white w-full md:w-auto px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border border-slate-600">
                    <UploadCloud size={16} /> อัปโหลด
                  </button>
                </div>
              </div>
            </div>
            
            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-amber-500/25 transition-all text-lg mt-4 flex items-center justify-center gap-2">
              <Send size={20} /> บันทึกและอัปเดตความคืบหน้า
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============== HISTORY (Audit Trail) ==============
function History({ appDb, user, showToast, callApi, refresh }) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1); 
  
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const reports = appDb.reports || [];

  useEffect(() => { setCurrentPage(1); }, [search]);

  const visible = isAdminOrExec ? reports : reports.filter(r => r.unit_name === user.unitName);
  const filtered = visible
    .filter(r => {
       const searchTerms = search.toLowerCase().split(' ').filter(t => t);
       const text = `${r.policy_snippet} ${r.unit_name} ${r.past_result} ${r.problems||''} ${r.policy_no||''}`.toLowerCase();
       return searchTerms.every(term => text.includes(term));
    })
    .sort((a, b) => new Date(b.created_at || b.report_date) - new Date(a.created_at || a.report_date));

  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันการลบรายงานฉบับนี้ถาวร?')) {
      showToast('กำลังลบข้อมูลจาก Google Sheets...');
      const success = await callApi("delete", "reports", null, "report_id", id);
      if (success) {
        showToast('ลบรายงานเรียบร้อย', 'ok');
        refresh();
      }
    }
  };

  const handleStatusChange = async (report, newStatus) => {
    showToast('กำลังอัปเดตสถานะการอนุมัติ...');
    const success = await callApi("update", "reports", { approval_status: newStatus }, "report_id", report.report_id);
    if (success) {
      showToast(newStatus === 'อนุมัติแล้ว' ? '✅ อนุมัติรายงานแล้ว' : '❌ ตีกลับรายงานแล้ว');
      refresh();
    }
  };

  const handleExportCSV = () => {
    const headers = ['ลำดับข้อสั่งการ', 'วันที่สร้าง', 'หน่วยงาน', 'สถานะการอนุมัติ', 'อ้างอิงข้อสั่งการ', 'ความคืบหน้า(%)', 'ผลดำเนินการ', 'แผนถัดไป', 'ปัญหา', 'หมายเหตุ', 'ผู้รายงาน/ไฟล์'];
    const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
    
    const rows = filtered.map(r => [
      escapeCSV(r.policy_no || '-'), escapeCSV(new Date(r.created_at || r.report_date).toLocaleString('th-TH')), escapeCSV(r.unit_name), escapeCSV(r.approval_status || 'อนุมัติแล้ว'), escapeCSV(r.policy_snippet),
      r.progress_percent, escapeCSV(r.past_result), escapeCSV(r.next_plan), escapeCSV(r.problems),
      escapeCSV(r.note), escapeCSV(r.attachment_url)
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Policy_Audit_Log_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('สร้างไฟล์ CSV เรียบร้อย');
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800 p-5 rounded-xl border border-slate-700 theme-transition">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500">
            <HistoryIcon size={24} /> ประวัติและร่องรอยการรายงาน (Audit Log)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">แสดงผลการรายงานทั้งหมด ({filtered.length} รายการ)</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาเนื้อหารายงาน, ชื่อหน่วย..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 focus:border-amber-500 outline-none theme-transition"/>
          </div>
          <button onClick={handleExportCSV} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg transition-colors whitespace-nowrap">
            <Download size={16}/> ส่งออก CSV
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-6 theme-transition">
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-700 before:to-transparent">
          {paginated.map(r => (
            <div key={r.report_id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              {/* Marker */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-100 dark:border-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors theme-transition ${r.approval_status === 'รอตรวจสอบ' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-500' : r.approval_status === 'ตีกลับ' ? 'bg-red-500/20 text-red-600 dark:text-red-500' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-500'}`}>
                {r.approval_status === 'รอตรวจสอบ' ? <Clock size={16}/> : r.approval_status === 'ตีกลับ' ? <X size={16}/> : <Check size={16}/>}
              </div>
              
              {/* Card */}
              <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border shadow-md transition-colors theme-transition ${r.approval_status === 'รอตรวจสอบ' ? 'border-amber-500/50' : r.approval_status === 'ตีกลับ' ? 'border-red-500/50' : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{r.unit_name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${r.approval_status === 'รอตรวจสอบ' ? 'bg-amber-900/10 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-500/30' : r.approval_status === 'ตีกลับ' ? 'bg-red-900/10 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-500/30' : 'bg-emerald-900/10 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'}`}>
                      {r.approval_status || 'อนุมัติแล้ว'}
                    </span>
                  </div>
                  <time className="text-xs font-mono text-slate-500">{new Date(r.created_at || r.report_date).toLocaleString('th-TH')}</time>
                </div>
                
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 line-clamp-2" title={r.policy_snippet}>
                  <span className="text-sky-600 dark:text-sky-400">[{r.policy_no || '-'}]</span> {r.policy_snippet}
                </h4>
                
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-3 theme-transition">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">ความคืบหน้า</span>
                    <span className="font-bold" style={{ color: getBarColor(r.progress_percent) }}>{r.progress_percent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-1.5 mb-2 theme-transition">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${r.progress_percent}%`, backgroundColor: getBarColor(r.progress_percent) }}></div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"><span className="text-emerald-600 dark:text-emerald-400 font-medium">ผล:</span> {r.past_result}</p>
                  {r.problems && r.problems !== '-' && <p className="text-xs text-red-600 dark:text-red-300 mt-1 leading-relaxed"><span className="text-red-500 dark:text-red-400 font-medium">ปัญหา:</span> {r.problems}</p>}
                </div>

                {/* Actions & Links */}
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 theme-transition">
                  {r.attachment_url ? (
                     <a href={r.attachment_url} target="_blank" rel="noreferrer" className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center gap-1">
                       <Paperclip size={12}/> เปิดไฟล์แนบ
                     </a>
                  ) : <span className="text-xs text-slate-400 dark:text-slate-600">ไม่มีไฟล์แนบ</span>}

                  {user.role === 'admin' && (
                    <div className="flex gap-2">
                      {r.approval_status === 'รอตรวจสอบ' && (
                        <>
                          <button onClick={() => handleStatusChange(r, 'อนุมัติแล้ว')} className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded text-xs transition-colors border border-emerald-500/20">อนุมัติ</button>
                          <button onClick={() => handleStatusChange(r, 'ตีกลับ')} className="px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white rounded text-xs transition-colors border border-amber-500/20">ตีกลับ</button>
                        </>
                      )}
                      <button onClick={() => handleDelete(r.report_id)} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:text-red-500 hover:border-red-500 rounded transition-colors theme-transition" title="ลบข้อมูล"><Trash2 size={14}/></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center text-slate-500 py-10">ไม่มีร่องรอยการทำงานในระบบ</div>}
        </div>
        <Pagination currentPage={currentPage} totalItems={filtered.length} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

// ============== UNITS CONFIG ==============
function UnitsConfig({ appDb, showToast, callApi, refresh }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const unitsList = appDb.units || [];

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันการลบบัญชีนี้?')) {
      showToast('กำลังลบข้อมูลจาก Google Sheets...');
      const success = await callApi("delete", "units", null, "id", id);
      if (success) {
        showToast('ลบบัญชีเรียบร้อย', 'ok');
        refresh();
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    const fd = new FormData(e.target);
    const newName = fd.get('name').trim();
    const newPasscode = fd.get('passcode').trim();
    const newRole = fd.get('role');
    
    if (!newName) {
      showToast('กรุณากรอกชื่อบัญชีผู้ใช้งาน', 'error');
      return;
    }

    showToast('กำลังบันทึกข้อมูลไปที่ Google Sheets...');
    
    if (editData) {
      const payload = { id: editData.id, name: newName, passcode: newPasscode, role: newRole };
      const success = await callApi("update", "units", payload, "id", editData.id);
      if (success) {
        showToast('แก้ไขบัญชีเรียบร้อย', 'ok');
        setModalOpen(false);
        refresh();
      }
    } else {
      const newId = `ACC-${Date.now()}`;
      const payload = { id: newId, name: newName, passcode: newPasscode, role: newRole };
      const success = await callApi("insert", "units", payload, "id", newId);
      if (success) {
        showToast('เพิ่มบัญชีเรียบร้อย', 'ok');
        setModalOpen(false);
        refresh();
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto fade-in-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800 p-5 rounded-xl border border-slate-700 theme-transition">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500">
            <Users size={24} /> จัดการบัญชีและสิทธิ์ผู้ใช้งาน ({unitsList.length})
          </h2>
          <p className="text-sm text-slate-400 mt-1">ใช้เพิ่มผู้บริหาร, แอดมิน หรือหน่วยงานใหม่ และกำหนดรหัสผ่านเฉพาะบุคคล</p>
        </div>
        <button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shrink-0">
          <Plus size={16}/> เพิ่มบัญชีใหม่
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl theme-transition">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 text-left theme-transition">
            <tr>
              <th className="p-4 font-medium w-24">ID</th>
              <th className="p-4 font-medium">ชื่อบัญชี / หน่วยงาน</th>
              <th className="p-4 font-medium text-center">สิทธิ์การใช้งาน (Role)</th>
              <th className="p-4 font-medium text-center">รหัสผ่าน (Passcode)</th>
              <th className="p-4 font-medium text-center w-32">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {unitsList.map(u => (
              <tr key={u.id} className="hover:bg-slate-700/30 transition-colors theme-transition">
                <td className="p-4 text-xs font-mono text-slate-500">{u.id}</td>
                <td className="p-4 text-slate-700 dark:text-slate-200 font-bold">{u.name}</td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : u.role === 'executive' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-sky-500/20 text-sky-400 border-sky-500/30'}`}>
                    {u.role === 'admin' ? 'Admin' : u.role === 'executive' ? 'Executive' : 'User (หน่วยงาน)'}
                  </span>
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-mono tracking-widest text-center">{u.passcode || '1234'}</td>
                <td className="p-4 text-xs space-x-3 text-center whitespace-nowrap">
                  <button onClick={() => { setEditData(u); setModalOpen(true); }} className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition-colors"><Edit size={16}/></button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md fade-in-up shadow-2xl theme-transition text-slate-100">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">{editData ? <Edit size={20}/> : <Plus size={20}/>} {editData ? 'แก้ไขบัญชีผู้ใช้งาน' : 'เพิ่มบัญชีใหม่'}</h3>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-sm text-slate-400 block mb-2 font-bold">ชื่อผู้ใช้งาน หรือ ชื่อหน่วยงาน <span className="text-red-500">*</span></label>
                <input name="name" defaultValue={editData?.name} required placeholder="เช่น ผู้บริหาร: ผบ.ทสส. หรือ กองกลาง" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:border-amber-500 outline-none theme-transition"/>
              </div>
              
              <div>
                <label className="text-sm text-slate-400 block mb-2 font-bold">ระดับสิทธิ์ (Role) <span className="text-red-500">*</span></label>
                <select name="role" defaultValue={editData?.role || 'user'} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:border-amber-500 outline-none theme-transition">
                  <option value="user">หน่วยงานปฏิบัติการ (เพิ่มงานและรายงานผลได้)</option>
                  <option value="executive">ผู้บริหาร (ดู Dashboard ได้อย่างเดียว)</option>
                  <option value="admin">ผู้ดูแลระบบกลาง (Admin) (จัดการได้ทุกเมนู)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-2">* หมายเหตุ: ถ้าใช้ฐานข้อมูลจริง โปรดมั่นใจว่าสร้างตารางคอลัมน์ชื่อ <b>role</b> ไว้ในตาราง <b>units</b> แล้ว</p>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2 font-bold">รหัสผ่าน (Passcode) <span className="text-red-500">*</span></label>
                <input name="passcode" defaultValue={editData?.passcode || ''} required placeholder="กำหนดรหัสผ่าน..." className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-emerald-500 font-mono focus:border-amber-500 outline-none theme-transition"/>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700 mt-6 theme-transition">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors">ยกเลิก</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-lg transition-colors">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== CHATBOT ==============
function Chatbot({ appDb }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Gemini API Function
  const callGeminiAPI = async (userMessage, contextData) => {
    if (!geminiApiKey || geminiApiKey === 'your_api_key_here') return null; // เพิ่มการตรวจสอบคีย์หลอก
    
    const prompt = `
      คุณคือ "Assistant J4" ผู้ช่วยอัจฉริยะสำหรับระบบติดตามงาน J4 Tracker ของกรมส่งกำลังบำรุงทหาร
      จงตอบคำถามผู้ใช้โดยอ้างอิงจากข้อมูลในระบบต่อไปนี้เท่านั้น:
      === ข้อมูลในระบบปัจจุบัน ===
      ${contextData}
      =============================
      คำถามผู้ใช้: ${userMessage}
      
      เงื่อนไข:
      1. ตอบสั้น กระชับ ตรงประเด็น ใช้ภาษาทางการแต่เป็นมิตร
      2. ถ้าคำถามไม่เกี่ยวกับข้อมูลในระบบ ให้ตอบว่า "ผมเป็นผู้ช่วยสำหรับระบบ J4 Tracker เท่านั้นครับ มีเรื่องงานใดให้ผมช่วยไหมครับ?"
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return null;
    }
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initMsg = (geminiApiKey && geminiApiKey !== 'your_api_key_here')
        ? 'สวัสดีครับ! ผมคือ Assistant อัจฉริยะที่ขับเคลื่อนด้วย Gemini AI ✨ สามารถถามลึกๆ ได้เลย เช่น "งานไหนล่าช้าที่สุดและเพราะอะไร?" หรือ "สรุปภาพรวมงบประมาณให้หน่อย"'
        : 'สวัสดีครับ! ผมคือ Assistant (โหมดพื้นฐาน) \nลองถามผมเช่น: "สรุปภาพรวม", "ข้อสั่งการใกล้เสร็จ", หรือพิมพ์ชื่อหน่วยงาน เช่น "กกล."';
      
      setMessages([{ sender: 'bot', text: initMsg }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getSystemContext = () => {
    const activeTasks = (appDb.tasks || []).filter(t => t.status !== 'เสร็จสิ้น');
    const delayedTasks = activeTasks.filter(t => t.status === 'ล่าช้า/ติดปัญหา');
    const completedTasks = (appDb.tasks || []).filter(t => t.status === 'เสร็จสิ้น');
    
    return `
      งานทั้งหมดที่ยังไม่เสร็จ: ${activeTasks.length} งาน
      งานที่ล่าช้า: ${delayedTasks.length} งาน ได้แก่ ${delayedTasks.map(t => `${t.task_name} (สาเหตุ: ${t.root_cause || 'ไม่ระบุ'})`).join(', ')}
      งานที่เสร็จแล้ว: ${completedTasks.length} งาน
    `;
  };

  const processQueryBasic = (q) => {
    const lo = q.toLowerCase();
    const allPol = appDb.policies || [];
    const allRep = (appDb.reports || []).filter(r => r.approval_status === 'อนุมัติแล้ว');
    const currentUnits = (appDb.units || []).map(u=>u.name);
    
    if (lo.includes('สรุป') || lo.includes('ภาพรวม')) {
      const latestByPol = {};
      allRep.forEach(r => { if (!latestByPol[r.policy_id] || new Date(r.report_date || r.created_at) > new Date(latestByPol[r.policy_id].report_date || latestByPol[r.policy_id].created_at)) latestByPol[r.policy_id]=r; });
      const avg = Object.keys(latestByPol).length ? Object.values(latestByPol).reduce((a,b)=>a+(b.progress_percent||0),0) / Object.keys(latestByPol).length : 0;
      const completed = Object.values(latestByPol).filter(r=>r.progress_percent===100).length;
      return `📊 สรุปภาพรวมข้อสั่งการ (เฉพาะรายงานที่อนุมัติ)\n• ข้อสั่งการทั้งหมด: ${allPol.length}\n• การรายงานรวม: ${allRep.length} ครั้ง\n• เสร็จสมบูรณ์: ${completed} เรื่อง\n• ความคืบหน้าเฉลี่ย: ${avg.toFixed(1)}%`;
    }
    if (lo.includes('ใกล้เสร็จ') || lo.includes('เสร็จ')) {
      const latest = {};
      allRep.forEach(r => { if (!latest[r.policy_id] || new Date(r.report_date || r.created_at) > new Date(latest[r.policy_id].report_date || latest[r.policy_id].created_at)) latest[r.policy_id]=r; });
      const list = Object.values(latest).filter(r=>(r.progress_percent||0)>=80 && (r.progress_percent||0)<100).sort((a,b)=>b.progress_percent-a.progress_percent).slice(0,5);
      if (!list.length) return 'ไม่มีข้อสั่งการที่สถานะ 80-99% ในขณะนี้ครับ';
      return '🎯 ข้อสั่งการที่ใกล้เสร็จ:\n' + list.map(r=>`• [${r.progress_percent}%] ${r.policy_snippet.substring(0,40)}...`).join('\n');
    }
    if (lo.includes('ปัญหา') || lo.includes('ขัดข้อง')) {
      const probs = allRep.filter(r=>r.problems && r.problems.trim().length > 2 && r.problems.trim() !== '-').slice(0,3);
      if (!probs.length) return 'เยี่ยมมาก! ยังไม่มีรายงานที่ระบุข้อขัดข้อง/ปัญหาในขณะนี้';
      return '⚠️ ปัญหา/ข้อขัดข้องในรายงานล่าสุด:\n' + probs.map(r=>`• [${r.unit_name}] ${r.problems.substring(0,60)}...`).join('\n');
    }
    for (const u of currentUnits) {
      if (lo.includes(u.toLowerCase().substring(0,5))) {
        const ur = allRep.filter(r=>r.unit_name===u);
        const up = allPol.filter(p=>p.primary_unit===u || p.secondary_units?.includes(u));
        const avg = ur.length ? ur.reduce((a,b)=>a+(b.progress_percent||0),0)/ur.length : 0;
        return `📁 ข้อมูลของ ${u}\n• รับผิดชอบ (หลักและร่วม): ${up.length} ข้อสั่งการ\n• ส่งรายงานแล้ว: ${ur.length} ครั้ง\n• ความคืบหน้าเฉลี่ย: ${avg.toFixed(1)}%`;
      }
    }
    return 'ขออภัยครับ ไม่เข้าใจคำถาม ลองพิมพ์ "สรุปภาพรวม", "ใกล้เสร็จ", หรือ "ปัญหา" ดูนะครับ';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    if (geminiApiKey && geminiApiKey !== 'your_api_key_here') {
      const context = getSystemContext();
      const aiResponse = await callGeminiAPI(userMsg, context);
      setIsTyping(false);
      if (aiResponse) {
        setMessages(prev => [...prev, { sender: 'bot', text: aiResponse }]);
      } else {
        // Fallback to basic mode if API fails
        setMessages(prev => [...prev, { sender: 'bot', text: processQueryBasic(userMsg) }]);
      }
    } else {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { sender: 'bot', text: processQueryBasic(userMsg) }]);
      }, 500);
    }
  };

  return (
    <div className="print-hide fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[340px] md:w-[380px] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden fade-in-up" style={{ height: '480px' }}>
          <div className="bg-slate-900 p-4 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-full relative">
                <MessageCircle className="text-amber-500" size={20}/>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-1">
                  Policy Assistant {geminiApiKey && geminiApiKey !== 'your_api_key_here' && <span className="bg-sky-500/20 text-sky-400 text-[9px] px-1.5 py-0.5 rounded">AI Powered</span>}
                </h3>
                <p className="text-[10px] text-amber-500">ออนไลน์พร้อมให้ข้อมูล</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-800/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${m.sender === 'user' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-slate-700 border border-slate-600 text-slate-100 rounded-bl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl bg-slate-700 border border-slate-600 rounded-bl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none disabled:opacity-50" 
              placeholder={isTyping ? "กำลังประมวลผล..." : "ถามคำถามที่นี่..."} 
            />
            <button type="submit" disabled={isTyping || !input.trim()} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-amber-600 p-3 rounded-xl text-white transition-colors">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`${isOpen ? 'bg-slate-700' : 'bg-amber-600 hover:bg-amber-500'} text-white rounded-full p-4 shadow-xl hover:shadow-amber-500/30 transition-all hover:scale-105 active:scale-95`}
      >
        {isOpen ? <X size={24}/> : <MessageCircle size={24}/>}
      </button>
    </div>
  );
}
