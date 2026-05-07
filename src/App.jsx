import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShieldCheck, LayoutDashboard, ScrollText, FilePlus, History as HistoryIcon, 
  LogOut, MessageCircle, Send, PieChart, BarChart, Plus, Edit, Trash2, 
  Download, CloudUpload, Briefcase, AlertTriangle, TrendingUp, CheckCircle, 
  CheckCircle2, FileText, CheckSquare, ListTodo, Activity, Printer, Check, X, 
  Lock, Clock, Trophy, Paperclip, Bell, Sun, Moon, ChevronLeft, ChevronRight, 
  Search, Kanban, Columns, List, Target, AlertOctagon, GitMerge, Users, Circle, 
  Star, MousePointerClick, RefreshCcw, FilterX, CalendarDays, Table, ChevronDown, ChevronUp, Bot 
} from 'lucide-react';

// ============================================================
// 1. ตั้งค่า URL ของ Google Apps Script (ตรวจสอบให้ถูกต้อง)
// ============================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwPShuEyd348SncMpf9x2472fSeHyzHBvEqbOh_mz11X1eD_2p8Pkr5g9eiPFnHO8U_0A/exec";

const LOGO_URL = "/S__22413315.jpg";
const GARUDA_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Garuda_Emblem_of_Thailand.svg/150px-Garuda_Emblem_of_Thailand.svg.png";

// ============================================================
// ค่าคงที่และตัวแปรระบบ
// ============================================================
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

const FALLBACK_ACCOUNTS = [
  { id: "A-1", name: "ผู้ดูแลระบบกลาง (Admin)", passcode: "5721118", role: "admin" }, 
  { id: "E-1", name: "ผู้บริหารระดับสูง", passcode: "1111", role: "executive" }, 
  { id: "U-1", name: "กกล.กบ.ทหาร", passcode: "1234", role: "user" }
];

// ข้อมูลจำลองสำหรับโหมด Offline / Demo
const MOCK_DB = {
  units: FALLBACK_ACCOUNTS,
  policies: [
    { policy_id: "POL-1", policy_no: "1", category: "นโยบายหลัก", commander: "ผบ.ทสส.", order: "ทดสอบการเชื่อมต่อระบบและรายงานผลเบื้องต้น", timeframe: "ภายใน ก.ย. 68", primary_unit: "กกล.กบ.ทหาร", is_important: true },
    { policy_id: "POL-2", policy_no: "2", category: "สั่งการเพิ่มเติม", commander: "รอง ผบ.ทสส.", order: "จัดเตรียมแผนงบประมาณปี 2568 สำหรับหน่วยงานที่เกี่ยวข้อง", timeframe: "ภายใน ต.ค. 67", primary_unit: "กช.กบ.ทหาร", is_important: false }
  ],
  reports: [
    { report_id: "REP-1", policy_id: "POL-1", policy_no: "1", policy_snippet: "ทดสอบการเชื่อมต่อระบบ...", unit_name: "กกล.กบ.ทหาร", report_date: "2024-05-10", past_result: "ทดสอบระบบเสร็จสิ้น สามารถแสดงผลได้ตามปกติ", next_plan: "ขยายผลการใช้งานไปยังหน่วยอื่น", problems: "-", progress_percent: 100, approval_status: "อนุมัติแล้ว", created_at: "2024-05-10T10:00:00Z" }
  ],
  tasks: [
    { 
      task_id: "TSK-1", 
      task_name: "ทดสอบการลงข้อมูลผ่านโหมด Offline", 
      primary_unit: "กกล.กบ.ทหาร", 
      status: "กำลังดำเนินการ", 
      progress_percent: 50, 
      start_date: "2024-05-01", 
      end_date: "2024-05-31", 
      is_important: true,
      policy_id: "POL-1",
      subtasks: JSON.stringify([
        { id: 1, text: "ตรวจสอบระบบฐานข้อมูล", done: true },
        { id: 2, text: "ทดสอบเพิ่มภารกิจย่อย", done: false }
      ])
    }
  ]
};

// ============================================================
// ฟังก์ชันช่วยเหลือ (Helpers)
// ============================================================
const getBarColor = (p) => { 
  if (p === 100) return '#10b981'; 
  if (p >= 91) return '#0ea5e9'; 
  if (p >= 51) return '#a855f7'; 
  if (p >= 21) return '#f97316'; 
  return '#ef4444'; 
};

const formatDate = (d) => { 
  if (!d) return '-'; 
  try { 
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }); 
  } catch (e) { 
    return d; 
  } 
};

const getDeadlineStatus = (endDate, status) => { 
  if (!endDate) return { label: '-', color: 'text-slate-400 bg-slate-800 border-slate-700' }; 
  
  if (status === 'เสร็จสิ้น') {
    return { label: 'สำเร็จทันเวลา', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  }
  
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return { label: 'วันที่ไม่ถูกต้อง', color: 'text-slate-400 bg-slate-800' };

  const diffDays = Math.ceil((end - new Date().setHours(0,0,0,0)) / 86400000); 
  
  if (diffDays < 0) {
    return { label: `ล่าช้า ${Math.abs(diffDays)} วัน`, color: 'text-red-400 bg-red-500/10 border-red-500/30 font-bold' };
  }
  if (diffDays <= 7) {
    return { label: `เหลือ ${diffDays} วัน`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  }
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
  Object.keys(data[0]).forEach(k => {
    table += `<th>${k}</th>`;
  }); 
  table += '</tr></thead><tbody>';
  
  data.forEach(r => { 
    table += '<tr>'; 
    Object.values(r).forEach(v => {
      table += `<td>${v || '-'}</td>`;
    }); 
    table += '</tr>'; 
  }); 
  table += '</tbody></table>';
  
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8" /></head>
      <body>${table}</body>
    </html>
  `;
  
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a'); 
  link.href = URL.createObjectURL(blob); 
  link.download = `${filename}.xls`; 
  link.click();
};

// ============================================================
// UI Components ส่วนกลาง
// ============================================================
function Pagination({ currentPage, totalItems, onPageChange }) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex justify-center items-center gap-4 mt-8 pb-4 print-hide">
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1} 
        className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-30 text-slate-300 hover:bg-slate-700 transition-colors shadow-sm"
      >
        <ChevronLeft size={20}/>
      </button>
      
      <span className="text-sm text-slate-400 font-medium">
        หน้า {currentPage} จาก {totalPages}
      </span>
      
      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages} 
        className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-30 text-slate-300 hover:bg-slate-700 transition-colors shadow-sm"
      >
        <ChevronRight size={20}/>
      </button>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center w-full px-4 py-3.5 rounded-xl transition-all font-medium ${
        isActive 
          ? 'bg-amber-600 text-white shadow-lg' 
          : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="ml-3 truncate text-sm">{label}</span>
    </button>
  );
}

// ============================================================
// หน้าจอเข้าสู่ระบบ (Login Screen)
// ============================================================
function LoginScreen({ onLogin, isLoading, appDb, loadData, deployError }) {
  const accounts = appDb.units && appDb.units.length > 0 ? appDb.units : MOCK_DB.units;
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => { 
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id); 
    }
  }, [accounts, accountId]);

  const handleSubmit = (e) => {
    e.preventDefault(); 
    setLocalError('');
    
    if (accounts.length === 0) { 
      setLocalError('ไม่มีข้อมูลบัญชีในระบบ กรุณาตรวจสอบการตั้งค่าฐานข้อมูล'); 
      return; 
    }
    
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    
    if (String(password) !== String(account.passcode)) { 
      setLocalError('รหัสผ่านไม่ถูกต้อง (สำหรับ Demo ใช้ 1234 หรือ 5721118)'); 
      return; 
    }
    
    onLogin(account.name, account.role || 'user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
        <p className="text-amber-400 font-bold text-lg animate-pulse">กำลังโหลดข้อมูลระบบ J4 Tracker...</p>
        <p className="text-slate-500 text-sm mt-2">โปรดรอสักครู่ หรือกำลังตรวจจับข้อผิดพลาด...</p>
      </div>
    );
  }

  const adminAccounts = accounts.filter(a => a.role === 'admin');
  const execAccounts = accounts.filter(a => a.role === 'executive');
  const userAccounts = accounts.filter(a => a.role === 'user' || !a.role);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 z-0"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 z-0"></div>

      <div className="bg-slate-800 p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700 relative z-10 animate-fade-in-up">
        
        <div className="text-center mb-10">
          <div className="bg-white w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-6 p-2 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <img 
              src={LOGO_URL} 
              alt="J4" 
              className="w-full h-full object-contain" 
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = 'https://placehold.co/100x100/1e293b/f59e0b?text=J4';
              }} 
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2 tracking-wide">ระบบติดตามผลการปฏิบัติ</h1>
          <p className="text-amber-500 text-sm font-bold tracking-widest uppercase">J4 Command Center</p>
        </div>

        {/* ถ้าโหลด URL ไม่ผ่าน จะแจ้งเตือนและเข้าสู่ Demo Mode อัตโนมัติ */}
        {appDb.isDemoMode && (
          <div className="mb-6 bg-orange-950/50 border border-orange-500 p-5 rounded-xl text-left shadow-lg">
             <h3 className="text-orange-400 font-bold text-sm mb-3 flex items-center gap-2">
               <AlertTriangle size={18}/> กำลังใช้งาน "โหมดทดลอง (Demo)"
             </h3>
             <p className="text-xs text-slate-300 mb-2 leading-relaxed">
               ดึงข้อมูลจาก Google Sheets ไม่สำเร็จ คุณสามารถล็อกอินด้วย <b className="text-white bg-slate-700 px-1 rounded">รหัสผ่าน: 1234</b> หรือ <b className="text-white bg-slate-700 px-1 rounded">5721118</b> เพื่อดูตัวอย่างหน้าตาเว็บได้ทันที
             </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">เลือกบัญชีผู้ใช้งาน</label>
            <select 
              value={accountId} 
              onChange={(e) => { 
                setAccountId(e.target.value); 
                setLocalError(''); 
              }} 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-100 outline-none focus:border-amber-500 transition-colors shadow-inner font-medium"
            >
              {accounts.length === 0 && <option value="">ไม่มีข้อมูลในฐานระบบ</option>}
              
              {adminAccounts.length > 0 && (
                <optgroup label="--- ผู้ดูแลระบบกลาง ---">
                  {adminAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </optgroup>
              )}
              
              {execAccounts.length > 0 && (
                <optgroup label="--- ผู้บริหาร ---">
                  {execAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </optgroup>
              )}
              
              {userAccounts.length > 0 && (
                <optgroup label="--- หน่วยงานปฏิบัติการ ---">
                  {userAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2">
              <Lock size={14}/> รหัสผ่าน
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-100 outline-none focus:border-amber-500 transition-colors tracking-[0.3em] font-mono shadow-inner" 
              placeholder="••••••••" 
            />
          </div>
          
          {localError && (
            <div className="bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-xl flex items-center gap-2 text-red-400 text-sm font-medium animate-pulse">
              <AlertTriangle size={16}/> {localError}
            </div>
          )}
          
          <button 
            type="submit" 
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-[0_4px_15px_rgba(245,158,11,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0 text-lg mt-2 flex items-center justify-center gap-2"
          >
            เข้าสู่ระบบ <ChevronRight size={20}/>
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-slate-700/50 pt-6">
           <button 
             onClick={loadData} 
             className="text-slate-400 text-xs hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto font-medium"
           >
             <RefreshCcw size={14}/> โหลดการเชื่อมต่อใหม่
           </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// คอมโพเนนต์หลัก: App Component (จัดการ Layout & Router)
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('DASHBOARD_POLICY');
  const [appDb, setAppDb] = useState({ 
    policies: [], 
    reports: [], 
    tasks: [], 
    units: [], 
    isLoaded: false,
    isDemoMode: false
  });
  const [toastData, setToastData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deployError, setDeployError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showToast = (msg, type = 'ok') => { 
    setToastData({ msg, type }); 
    setTimeout(() => setToastData(null), 3000); 
  };

  const loadData = async () => {
    setIsSyncing(true); 
    setDeployError(null);
    try {
      const actions = ['units', 'policies', 'reports', 'tasks'];
      
      const results = await Promise.all(actions.map(async (action) => {
        const url = `${SCRIPT_URL}?action=${action}&t=${Date.now()}`;
        
        const res = await fetch(url, { redirect: "follow" }); 
        const text = await res.text();
        
        if (text.trim().startsWith('<') || text.includes('<!DOCTYPE html>')) {
          throw new Error("PERMISSION");
        }
        
        try {
          return JSON.parse(text);
        } catch (parseErr) {
          console.error("Parse Error for action:", action, text);
          throw new Error("PARSE_ERROR"); 
        }
      }));

      setAppDb({ 
        units: results[0] || [], 
        policies: results[1] || [], 
        reports: results[2] || [], 
        tasks: results[3] || [], 
        isLoaded: true,
        isDemoMode: false
      });
      if(user) showToast("ซิงค์ข้อมูลล่าสุดเรียบร้อย", "ok");
      
    } catch (err) {
      console.error("Fetch Execution Error:", err);
      setDeployError(err.message === "PERMISSION" ? "PERMISSION" : "NETWORK");
      
      setAppDb({
         ...MOCK_DB,
         isLoaded: true,
         isDemoMode: true
      });
      if(!appDb.isDemoMode) showToast("ระบบออฟไลน์: เข้าสู่โหมดจำลองการทำงาน", "error");
    } finally { 
      setIsSyncing(false); 
    }
  };

  useEffect(() => { 
    if (SCRIPT_URL && !SCRIPT_URL.includes("URL_ที่คุณได้มา")) {
      loadData(); 
    } else {
        setAppDb({
            ...MOCK_DB,
            isLoaded: true,
            isDemoMode: true
        });
    }
  }, []);

  const callApi = async (method, action, data, idKey, idValue) => {
    if (appDb.isDemoMode) {
      showToast("ในโหมดจำลอง จะเก็บข้อมูลไว้ชั่วคราว ไม่ส่งไปฐานข้อมูลจริง", "error");
      setAppDb(prev => {
          const newData = { ...prev };
          if (method === 'insert') {
              newData[action] = [...newData[action], data];
          } else if (method === 'update') {
              newData[action] = newData[action].map(item => item[idKey] === idValue ? { ...item, ...data } : item);
          } else if (method === 'delete') {
              newData[action] = newData[action].filter(item => item[idKey] !== idValue);
          }
          return newData;
      });
      return true;
    }

    try {
      await fetch(SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors',
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8' 
        }, 
        body: JSON.stringify({ method, action, data, idKey, idValue }) 
      });
      
      setTimeout(loadData, 2000); 
      return true;
    } catch (err) { 
      showToast("บันทึกไม่สำเร็จ ตรวจสอบอินเทอร์เน็ต", "error"); 
      return false; 
    }
  };

  const handleLogin = (unitName, role) => {
    setUser({ 
      id: `session-${Date.now()}`, 
      unitName: unitName, 
      role: role || 'user' 
    });
    setView('DASHBOARD_POLICY');
  };

  const handleLogout = () => { 
    setUser(null); 
    setView('DASHBOARD_POLICY'); 
  };

  const navigateTo = (viewName) => {
    setView(viewName);
    setIsMobileMenuOpen(false);
  };

  if (!user || !appDb.isLoaded) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        isLoading={!appDb.isLoaded} 
        appDb={appDb} 
        loadData={loadData} 
        deployError={deployError} 
      />
    );
  }

  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans selection:bg-amber-500 selection:text-white">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; border: 2px solid #0f172a; } 
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
        
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(15px); } 
          to { opacity: 1; transform: translateY(0); } 
        } 
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; } 
        
        @media print { 
          .print-hide { display: none !important; } 
          .bg-slate-900, .bg-slate-800 { background: white !important; color: black !important; border: 1px solid #ccc !important; box-shadow: none !important; } 
          .text-slate-100, .text-slate-200, .text-slate-300, .text-slate-400 { color: #333 !important; }
          body { background: white !important; }
        }
      `}</style>
      
      {/* Sidebar Desktop */}
      <aside className="print-hide fixed left-0 top-0 h-screen z-40 bg-slate-800 border-r border-slate-700 flex flex-col w-72 hidden lg:flex shadow-2xl">
        <div className="h-24 flex items-center justify-between px-6 border-b border-slate-700 shrink-0 bg-slate-900/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-md border border-amber-500/20">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" 
                 onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/1e293b/f59e0b?text=J4'; }} />
            </div>
            <div>
              <h1 className="font-bold text-xl leading-tight text-white tracking-wide">J4 Tracker</h1>
              <span className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">G-Sheets App</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-b border-slate-700 bg-slate-800/80">
          <p className="text-[10px] text-slate-400 mb-1.5 uppercase tracking-wider font-bold">บัญชีเข้าใช้งาน:</p>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30 shrink-0">
               <Users size={16}/>
             </div>
             <p className="font-bold text-amber-400 truncate text-sm leading-snug" title={user.unitName}>{user.unitName}</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">ระบบรายงานภาพรวม</p>
          <NavItem icon={<LayoutDashboard size={20}/>} label="ภาพรวมนโยบาย" isActive={view==='DASHBOARD_POLICY'} onClick={()=>navigateTo('DASHBOARD_POLICY')} />
          <NavItem icon={<PieChart size={20}/>} label="ภาพรวมภารกิจ" isActive={view==='DASHBOARD_TASK'} onClick={()=>navigateTo('DASHBOARD_TASK')} />
          
          <div className="border-t border-slate-700/50 my-6"></div>
          
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">ระบบปฏิบัติการ</p>
          <NavItem icon={<ScrollText size={20}/>} label="ฐานข้อมูลนโยบาย" isActive={view==='POLICIES'} onClick={()=>navigateTo('POLICIES')} />
          <NavItem icon={<CheckSquare size={20}/>} label="ติดตามภารกิจ (Tasks)" isActive={view==='TASKS'} onClick={()=>navigateTo('TASKS')} />
          {user.role !== 'executive' && <NavItem icon={<FilePlus size={20}/>} label="บันทึกรายงานผล" isActive={view==='REPORT_FORM'} onClick={()=>navigateTo('REPORT_FORM')} />}
          <NavItem icon={<HistoryIcon size={20}/>} label="ประวัติรายงานผล" isActive={view==='HISTORY'} onClick={()=>navigateTo('HISTORY')} />
          
          {user.role === 'admin' && (
            <>
              <div className="border-t border-slate-700/50 my-6"></div>
              <NavItem icon={<Users size={20}/>} label="ตั้งค่าบัญชีใช้งาน" isActive={view==='UNITS_CONFIG'} onClick={()=>navigateTo('UNITS_CONFIG')} />
            </>
          )}
        </nav>
        
        <div className="p-5 border-t border-slate-700 bg-slate-900/30">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 hover:bg-red-600 hover:border-red-500 hover:text-white text-slate-300 w-full py-3.5 rounded-xl transition-all font-bold shadow-sm">
            <LogOut size={18}/> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Topbar & Overlay Menu */}
      <div className="lg:hidden print-hide fixed top-0 left-0 right-0 h-16 bg-slate-800 border-b border-slate-700 z-50 flex items-center justify-between px-5 shadow-md">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center p-1"><img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/1e293b/f59e0b?text=J4'; }} /></div>
            <h1 className="font-bold text-white tracking-wide">J4 Tracker</h1>
         </div>
         <button onClick={()=>setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 p-2 hover:bg-slate-700 rounded-lg transition-colors">
            {isMobileMenuOpen ? <X size={24}/> : <List size={24}/>}
         </button>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden print-hide fixed inset-0 top-16 bg-slate-900 z-40 overflow-y-auto pb-20 animate-fade-in-up">
           <div className="p-6 border-b border-slate-800 bg-slate-800/50">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">บัญชีผู้ใช้:</p>
              <p className="text-amber-500 font-bold text-lg">{user.unitName}</p>
           </div>
           <div className="p-4 space-y-1.5">
              <NavItem icon={<LayoutDashboard size={20}/>} label="ภาพรวมนโยบาย" isActive={view==='DASHBOARD_POLICY'} onClick={()=>navigateTo('DASHBOARD_POLICY')} />
              <NavItem icon={<PieChart size={20}/>} label="ภาพรวมภารกิจ" isActive={view==='DASHBOARD_TASK'} onClick={()=>navigateTo('DASHBOARD_TASK')} />
              
              <div className="border-t border-slate-800 my-4"></div>
              
              <NavItem icon={<ScrollText size={20}/>} label="ฐานข้อมูลนโยบาย" isActive={view==='POLICIES'} onClick={()=>navigateTo('POLICIES')} />
              <NavItem icon={<CheckSquare size={20}/>} label="ติดตามภารกิจ (Tasks)" isActive={view==='TASKS'} onClick={()=>navigateTo('TASKS')} />
              {user.role !== 'executive' && <NavItem icon={<FilePlus size={20}/>} label="บันทึกรายงานผล" isActive={view==='REPORT_FORM'} onClick={()=>navigateTo('REPORT_FORM')} />}
              <NavItem icon={<HistoryIcon size={20}/>} label="ประวัติรายงานผล" isActive={view==='HISTORY'} onClick={()=>navigateTo('HISTORY')} />
              {user.role === 'admin' && <NavItem icon={<Users size={20}/>} label="ตั้งค่าผู้ใช้งาน" isActive={view==='UNITS_CONFIG'} onClick={()=>navigateTo('UNITS_CONFIG')} />}
              
              <div className="mt-8 p-4">
                <button onClick={()=>{setUser(null); setIsMobileMenuOpen(false);}} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg">
                  <LogOut size={20}/> ออกจากระบบ
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 pt-20 lg:pt-0 p-4 md:p-8 min-h-screen overflow-y-auto custom-scrollbar relative">
        <div className="max-w-7xl mx-auto pb-24">
          
          {appDb.isDemoMode && (
            <div className="mb-6 bg-orange-950/80 border border-orange-500/50 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
              <div className="bg-orange-500/20 p-2 rounded-full text-orange-400"><AlertTriangle size={24}/></div>
              <div>
                <p className="font-bold text-orange-400">ระบบทำงานในโหมดออฟไลน์ / จำลอง (Demo Mode)</p>
                <p className="text-xs text-slate-300">เนื่องจากไม่สามารถดึงข้อมูลจาก Google Sheets ได้ ข้อมูลที่คุณเห็นหรือบันทึกตอนนี้ จะเก็บไว้ชั่วคราวและไม่ถูกส่งไปที่ฐานข้อมูลจริง</p>
              </div>
            </div>
          )}

          {/* Top Bar */}
          <div className="flex justify-between items-center mb-8 bg-slate-800/80 p-4 rounded-xl border border-slate-700 backdrop-blur-sm print-hide shadow-md">
            <h2 className="text-slate-300 font-medium flex items-center gap-2 md:gap-3 text-sm md:text-base tracking-wide">
              <ShieldCheck size={22} className="text-amber-500"/> ระบบอำนวยการ J4 Command Center
            </h2>
            <div className="flex items-center gap-3 md:gap-4">
              {isSyncing && <span className="text-amber-500 text-xs font-bold flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 shadow-sm"><RefreshCcw size={12} className="animate-spin"/> อัปเดตข้อมูล</span>}
              <button onClick={loadData} className="p-2.5 bg-slate-900 rounded-xl hover:bg-slate-700 text-slate-400 transition-colors border border-slate-700 shadow-sm hover:text-white" title="ซิงค์ข้อมูลล่าสุด">
                <RefreshCcw size={18}/>
              </button>
            </div>
          </div>

          {/* Router Views Management */}
          {view === 'DASHBOARD_POLICY' && <PolicyDashboard appDb={appDb} user={user} />}
          {view === 'DASHBOARD_TASK' && <TaskDashboard appDb={appDb} user={user} />}
          {view === 'POLICIES' && <Policies appDb={appDb} user={user} showToast={showToast} callApi={callApi} refresh={loadData} />}
          {view === 'TASKS' && <TaskTracker appDb={appDb} user={user} showToast={showToast} callApi={callApi} refresh={loadData} />}
          {view === 'REPORT_FORM' && <ReportForm appDb={appDb} user={user} showToast={showToast} setView={setView} callApi={callApi} refresh={loadData} />}
          {view === 'HISTORY' && <History appDb={appDb} user={user} showToast={showToast} callApi={callApi} refresh={loadData} />}
          {view === 'UNITS_CONFIG' && <UnitsConfig appDb={appDb} showToast={showToast} callApi={callApi} refresh={loadData} />}

        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastData && (
        <div className="fixed top-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl border bg-slate-800 text-white flex items-center gap-3 animate-fade-in-up" style={{borderColor: toastData.type === 'ok' ? '#10b981' : '#ef4444'}}>
          {toastData.type === 'ok' ? <CheckCircle className="text-emerald-500" size={24}/> : <AlertTriangle className="text-red-500" size={24}/>}
          <span className="font-bold text-sm">{toastData.msg}</span>
        </div>
      )}

      {/* AI Chatbot Assistant */}
      <Chatbot appDb={appDb} />
    </div>
  );
}

// ============================================================
// 1. นโยบายและข้อสั่งการ (Policy Dashboard)
// ============================================================
function PolicyDashboard({ appDb, user }) {
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const [filterUnit, setFilterUnit] = useState(isAdminOrExec ? 'ALL' : user.unitName);
  const [fiscalYear, setFiscalYear] = useState('ALL');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [expandedPolicyId, setExpandedPolicyId] = useState(null);

  useEffect(() => {
    if (fiscalYear !== 'ALL' && fiscalYear !== 'CUSTOM') {
      const dates = getFiscalYearDates(fiscalYear);
      setFilterStart(dates.start);
      setFilterEnd(dates.end.substring(0, 10));
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

  const overallStats = useMemo(() => {
    const pIds = basePolicies.map(p => p.policy_id); 
    const reps = baseReports.filter(r => pIds.includes(r.policy_id));
    
    const progList = basePolicies.map(po => { 
      const rs = reps.filter(r => r.policy_id === po.policy_id).sort((a, b) => {
        const d1 = new Date(b.report_date || b.created_at || 0).getTime();
        const d2 = new Date(a.report_date || a.created_at || 0).getTime();
        return (isNaN(d1)?0:d1) - (isNaN(d2)?0:d2);
      });
      return { progress: rs.length ? (rs[0].progress_percent || 0) : 0 }; 
    });
    
    return {
      total: progList.length, 
      completed: progList.filter(x => x.progress === 100).length, 
      inProgress: progList.filter(x => x.progress > 0 && x.progress < 100).length, 
      notStarted: progList.filter(x => x.progress === 0).length,
      avg: progList.length > 0 ? (progList.reduce((a, b) => a + (b.progress || 0), 0) / progList.length) : 0
    };
  }, [basePolicies, baseReports]);

  const getStatusBucket = (progress) => {
    if (progress === 100) return 'เสร็จแล้ว (100%)';
    if (progress >= 91) return 'กำลังจะแล้วเสร็จ (91-99%)';
    if (progress >= 51) return 'ดำเนินการต่อเนื่อง (51-90%)';
    if (progress >= 21) return 'อยู่ระหว่างดำเนินการ (21-50%)';
    return 'ต่ำกว่าเกณฑ์ (0-20%)';
  };

  const renderTimeline = (pid) => {
    const validTasks = (tasksByPolicy[pid] || []).filter(t => t.start_date && t.end_date);
    
    if (validTasks.length === 0) {
      return (
        <div className="bg-slate-900/80 p-5 rounded-xl text-center border border-slate-700/50 mt-3 shadow-inner">
           <CalendarDays size={24} className="mx-auto text-slate-500 mb-3 opacity-30"/>
           <p className="text-slate-400 text-xs font-medium">ยังไม่มีการระบุไทม์ไลน์ภารกิจย่อยในข้อสั่งการนี้</p>
        </div>
      );
    }

    const minDate = Math.min(...validTasks.map(t => new Date(t.start_date).getTime())); 
    const maxDate = Math.max(...validTasks.map(t => new Date(t.end_date).getTime()));
    const totalDuration = maxDate - minDate || 1; 

    return (
      <div className="bg-slate-900/80 p-5 rounded-xl mt-4 overflow-x-auto border border-slate-700/50 shadow-inner custom-scrollbar">
        <div className="min-w-[600px] space-y-4">
          <div className="flex border-b border-slate-700 pb-3 mb-3">
            <div className="w-1/3 text-amber-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><CalendarDays size={14}/> ภารกิจย่อย</div>
            <div className="w-2/3 flex justify-between text-[10px] text-slate-500 font-mono font-bold tracking-widest px-2">
              <span>{formatDate(minDate)}</span>
              <span>{formatDate(maxDate)}</span>
            </div>
          </div>
          
          {validTasks.sort((a,b) => new Date(a.start_date) - new Date(b.start_date)).map(t => {
            const leftPercent = Math.max(0, ((new Date(t.start_date).getTime() - minDate) / totalDuration) * 100); 
            const widthPercent = Math.max(1, ((new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) / totalDuration) * 100);
            
            return (
              <div key={t.task_id} className="flex text-xs items-center group">
                <div className="w-1/3 truncate pr-4 flex flex-col border-r border-slate-700/50">
                  <span className="text-slate-200 font-bold truncate mb-0.5" title={t.task_name}>{t.task_name}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{formatDate(t.start_date)} - {formatDate(t.end_date)}</span>
                </div>
                <div className="w-2/3 relative bg-slate-800 rounded-md h-6 border border-slate-700 overflow-hidden shadow-inner ml-3">
                  <div 
                    className={`absolute h-full rounded-md shadow flex items-center px-1.5 transition-all duration-500 ease-out ${
                      t.status === 'เสร็จสิ้น' ? 'bg-emerald-500/90' : 
                      t.status === 'ล่าช้า/ติดปัญหา' ? 'bg-red-500/90 animate-pulse' : 
                      'bg-sky-500/90'
                    }`} 
                    style={{left: `${leftPercent}%`, width: `${widthPercent}%`, minWidth: '6px'}}
                    title={`${t.status} - ${t.progress_percent}%`}
                  >
                    {widthPercent > 10 && <span className="text-[10px] font-bold text-white drop-shadow-md truncate font-mono">{t.progress_percent}%</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  const renderSection = (title, icon, sectionPolicies) => {
    if (sectionPolicies.length === 0) return null;
    
    let list = sectionPolicies.map(po => {
      const rs = baseReports.filter(r => r.policy_id === po.policy_id).sort((a,b) => {
        const d1 = new Date(b.report_date || b.created_at || 0).getTime();
        const d2 = new Date(a.report_date || a.created_at || 0).getTime();
        return (isNaN(d1)?0:d1) - (isNaN(d2)?0:d2);
      });
      const prog = rs.length ? (rs[0].progress_percent || 0) : 0;
      return { 
        id: po.policy_id, 
        short: `[${po.policy_no||'-'}] ${po.order.substring(0,80)}...`, 
        order: po.order,
        prog: prog, 
        bucket: getStatusBucket(prog), 
        tCount: (tasksByPolicy[po.policy_id]||[]).length, 
        is_important: po.is_important, 
        cmd: po.commander 
      };
    });
    
    const cmds = [...new Set(sectionPolicies.map(p => p.commander))];
    
    return (
      <div className="mt-12 pt-8 border-t-2 border-slate-700/80 animate-fade-in-up">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl border border-amber-500/30 shadow-inner">{icon}</div>
          <h2 className="text-2xl font-bold tracking-wide">{title}</h2>
        </div>

        {cmds.map(cmd => {
           const cList = list.filter(l => l.cmd === cmd); 
           const filtered = selectedStatus ? cList.filter(l => l.bucket === selectedStatus) : cList;
           
           const statsCount = [
             { n:'เสร็จแล้ว (100%)', v: cList.filter(x => x.prog === 100).length },
             { n:'กำลังจะแล้วเสร็จ (91-99%)', v: cList.filter(x => x.prog >= 91 && x.prog <= 99).length },
             { n:'ดำเนินการต่อเนื่อง (51-90%)', v: cList.filter(x => x.prog >= 51 && x.prog <= 90).length },
             { n:'อยู่ระหว่างดำเนินการ (21-50%)', v: cList.filter(x => x.prog >= 21 && x.prog <= 50).length },
             { n:'ต่ำกว่าเกณฑ์ (0-20%)', v: cList.filter(x => x.prog <= 20).length }
           ].filter(x => x.v > 0);
           
           let cum = 0; 
           const bgDonut = statsCount.map(s => {
             const st = cum; 
             cum += (s.v / cList.length) * 100; 
             return `${STATUS_COLORS[s.n]} ${st}% ${cum}%`;
           }).join(', ');
           
           return (
             <div key={cmd} className="mb-10 bg-slate-800/30 p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-sm">
               <h3 className="text-xl font-bold text-sky-400 mb-6 flex items-center gap-2">
                 <ShieldCheck size={24}/> ผู้สั่งการ: <span className="text-white ml-1">{cmd}</span>
                 <span className="text-xs bg-slate-800 px-3 py-1.5 rounded-full text-slate-400 border border-slate-700 ml-3 shadow-inner">ทั้งหมด {cList.length} เรื่อง</span>
               </h3>

               <div className="grid lg:grid-cols-12 gap-8">
                 {/* Chart Section */}
                 <div className="lg:col-span-4 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col items-center">
                    <h4 className="font-bold mb-6 text-slate-300 w-full text-center text-sm uppercase tracking-widest">สัดส่วนความคืบหน้า</h4>
                    
                    <div className="w-52 h-52 rounded-full mb-8 cursor-pointer transform hover:scale-105 transition-all shadow-2xl relative" onClick={() => setSelectedStatus(null)} style={{ background: cList.length > 0 ? `conic-gradient(${bgDonut})` : '#334155' }}>
                       <div className="absolute inset-0 m-auto w-36 h-36 bg-slate-800 rounded-full flex flex-col items-center justify-center border-4 border-slate-800 shadow-inner">
                         <span className="font-bold text-4xl text-white">{cList.length}</span>
                         <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">ข้อสั่งการ</span>
                       </div>
                    </div>

                    <div className="w-full text-xs space-y-2 mt-auto">
                       {statsCount.map(s => (
                         <div key={s.n} onClick={() => setSelectedStatus(s.n === selectedStatus ? null : s.n)} className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all border shadow-sm ${selectedStatus === s.n ? 'bg-slate-700 border-amber-500 scale-105' : 'border-slate-700/50 bg-slate-900/30 hover:bg-slate-700/50 hover:border-slate-600'}`}>
                           <div className="flex items-center gap-2.5">
                             <span className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ background: STATUS_COLORS[s.n] }}></span>
                             <span className={selectedStatus === s.n ? 'text-amber-400 font-bold' : 'text-slate-300 font-medium'}>{s.n}</span>
                           </div>
                           <span className="font-bold text-slate-100 text-sm">{s.v}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* List Section */}
                 <div className="lg:col-span-8 bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-lg flex flex-col">
                    <h4 className="font-bold mb-6 text-slate-300 flex justify-between items-center text-sm uppercase tracking-widest border-b border-slate-700 pb-4">
                      รายการข้อสั่งการ 
                      {selectedStatus && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-3 py-1.5 rounded-full border border-amber-500/30 font-bold tracking-normal normal-case">ตัวกรอง: {selectedStatus}</span>}
                    </h4>
                    <div className="flex-1 overflow-y-auto max-h-[450px] space-y-4 pr-3 custom-scrollbar">
                       {filtered.map(p => (
                         <div key={p.id} className={`p-5 rounded-2xl border transition-all shadow-sm ${expandedPolicyId === p.id ? 'bg-slate-700/60 border-amber-500' : 'bg-slate-900 border-slate-700 hover:border-amber-500/50'}`}>
                           <div className="flex justify-between cursor-pointer group" onClick={() => setExpandedPolicyId(expandedPolicyId === p.id ? null : p.id)}>
                             <div className="text-sm font-bold text-slate-200 pr-6 leading-relaxed flex items-start gap-2">
                               {p.is_important && (
                                 <Star size={16} className="shrink-0 text-amber-500 fill-amber-500 mt-0.5 drop-shadow-md"/>
                               )}
                               <span className="group-hover:text-amber-400 transition-colors" title={p.order}>{p.short}</span>
                             </div>
                             <div className="flex flex-col items-end shrink-0">
                               <span className="font-mono font-bold text-xl drop-shadow-md" style={{ color: getBarColor(p.prog) }}>{p.prog}%</span>
                               {expandedPolicyId === p.id ? <ChevronUp size={18} className="text-amber-500 mt-1"/> : <ChevronDown size={18} className="text-slate-500 mt-1 group-hover:text-amber-500 transition-colors"/>}
                             </div>
                           </div>
                           
                           <div className="w-full bg-slate-800 h-2 mt-4 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                             <div className="h-full rounded-full transition-all duration-1000 relative" style={{ width: `${p.prog}%`, background: getBarColor(p.prog) }}>
                               <div className="absolute inset-0 bg-white/20"></div>
                             </div>
                           </div>
                           
                           {p.tCount > 0 && !expandedPolicyId && (
                             <p className="text-[11px] text-sky-400 mt-4 flex items-center gap-1.5 font-bold"><GitMerge size={14}/> ภารกิจย่อยในระบบ {p.tCount} งาน <span className="text-slate-500 font-normal">(คลิกเพื่อดูไทม์ไลน์)</span></p>
                           )}
                           
                           {expandedPolicyId === p.id && renderTimeline(p.id)}
                         </div>
                       ))}
                       {filtered.length === 0 && (
                         <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                            <FilterX size={40} className="mx-auto mb-3 opacity-20"/>
                            <p className="text-base font-medium">ไม่พบข้อสั่งการตามเงื่อนไขที่เลือก</p>
                         </div>
                       )}
                    </div>
                 </div>
               </div>
             </div>
           )
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up text-slate-100">
      
      {/* Filters & Actions Bar */}
      <div className="bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-lg print-hide flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-white mb-1.5">
            <LayoutDashboard size={32} className="text-amber-500"/> ภาพรวมนโยบายและข้อสั่งการ
          </h2>
          <p className="text-sm text-slate-400 font-medium">คลิกที่กราฟโดนัทเพื่อคัดกรอง หรือ <b className="text-amber-400">คลิกที่ชื่อนโยบาย</b> เพื่อดู Timeline การปฏิบัติงาน</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto relative z-10">
          {selectedStatus && (
            <button onClick={() => setSelectedStatus(null)} className="text-sm font-bold bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-5 py-3 rounded-xl transition-colors flex items-center gap-2 shadow-sm">
              <FilterX size={18}/> ล้างตัวกรอง
            </button>
          )}
          <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} disabled={!isAdminOrExec} className="flex-1 md:w-auto bg-slate-900 px-4 py-3 rounded-xl border border-slate-600 text-sm font-bold text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-50 transition-colors shadow-inner">
            <option value="ALL">- ทุกหน่วยงาน -</option>
            {(appDb.units||[]).filter(u => u.role === 'user' || !u.role).map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
          </select>
          <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} className="flex-1 md:w-auto bg-slate-900 px-4 py-3 rounded-xl border border-slate-600 text-sm font-bold text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors shadow-inner">
            <option value="ALL">- ทุกปีงบประมาณ -</option>
            <option value="2567">ปีงบประมาณ 2567</option>
            <option value="2568">ปีงบประมาณ 2568</option>
            <option value="2569">ปีงบประมาณ 2569</option>
          </select>
          <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all shadow-lg hover:-translate-y-0.5" title="พิมพ์รายงานภาพรวม">
            <Printer size={20}/>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 print-hide">
        {[
          { l: 'ข้อสั่งการรวม', v: overallStats.total, s: null, c: 'text-white', bg: 'bg-slate-800 border-slate-600', ic: <ScrollText size={24} className="text-slate-500"/> },
          { l: 'เสร็จสมบูรณ์', v: overallStats.completed, s: 'เสร็จแล้ว (100%)', c: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/50', ic: <CheckCircle2 size={24} className="text-emerald-500/50"/> },
          { l: 'กำลังดำเนินการ', v: overallStats.inProgress, s: 'ดำเนินการต่อเนื่อง (51-90%)', c: 'text-sky-400', bg: 'bg-sky-950/30 border-sky-500/50', ic: <Activity size={24} className="text-sky-500/50"/> },
          { l: 'ยังไม่คืบหน้า (0%)', v: overallStats.notStarted, s: 'ต่ำกว่าเกณฑ์ (0-20%)', c: 'text-red-400', bg: 'bg-red-950/30 border-red-500/50', ic: <AlertOctagon size={24} className="text-red-500/50"/> }
        ].map(k => (
          <div key={k.l} onClick={() => setSelectedStatus(k.s)} className={`p-6 md:p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 shadow-xl relative group overflow-hidden ${selectedStatus === k.s ? 'ring-2 ring-offset-4 ring-offset-slate-900 border-transparent ' + k.bg : k.bg}`}>
            <div className="absolute -right-4 -bottom-4 opacity-20 transform group-hover:scale-125 transition-transform duration-500">{k.ic}</div>
            <MousePointerClick size={18} className={`absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${k.c}`}/>
            
            <p className="text-slate-300 text-sm font-bold tracking-wider uppercase mb-1">{k.l}</p>
            <h3 className={`text-5xl font-bold mt-2 font-mono ${k.c}`}>{k.v}</h3>
          </div>
        ))}
      </div>

      {/* Policy Sections */}
      <div className="space-y-16">
        {renderSection('นโยบายหลัก', <ShieldCheck size={36}/>, basePolicies.filter(p => p.category === 'นโยบายหลัก'))}
        {renderSection('สั่งการเพิ่มเติม', <FileText size={36}/>, basePolicies.filter(p => p.category === 'สั่งการเพิ่มเติม'))}
        
        {basePolicies.length === 0 && (
          <div className="text-center py-24 text-slate-500 bg-slate-800/50 rounded-3xl border-2 border-slate-700 border-dashed shadow-inner">
            <LayoutDashboard size={64} className="mx-auto mb-5 opacity-20" />
            <p className="text-xl font-bold">ไม่พบข้อมูลนโยบายหรือข้อสั่งการในระบบ</p>
            <p className="text-sm mt-2">โปรดรอการขึ้นทะเบียนจากแอดมิน หรือเปลี่ยนการคัดกรอง</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 2. ภาพรวมภารกิจ (Task Dashboard)
// ============================================================
function TaskDashboard({ appDb, user }) {
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const [filterUnit, setFilterUnit] = useState(isAdminOrExec ? 'ALL' : user.unitName);
  const [fiscalYear, setFiscalYear] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedRootCause, setSelectedRootCause] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  
  const currentUnits = useMemo(() => (appDb.units || []).filter(u => u.role === 'user' || !u.role), [appDb.units]);

  const baseTasks = useMemo(() => {
    let tasks = appDb.tasks || [];
    if (filterUnit !== 'ALL') tasks = tasks.filter(t => t.primary_unit === filterUnit || t.secondary_units?.includes(filterUnit));
    if (fiscalYear !== 'ALL') {
      const dates = getFiscalYearDates(fiscalYear);
      tasks = tasks.filter(t => {
        const dStart = new Date(t.start_date);
        const dEnd = new Date(t.end_date);
        if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime())) return false;
        return dStart >= new Date(dates.start) && dEnd <= new Date(dates.end);
      });
    }
    return tasks;
  }, [appDb.tasks, filterUnit, fiscalYear]);

  const stats = useMemo(() => {
    const totalTasks = baseTasks.length;
    const completedTasks = baseTasks.filter(t => t.status === 'เสร็จสิ้น').length;
    const delayedTasks = baseTasks.filter(t => t.status === 'ล่าช้า/ติดปัญหา').length;
    
    const statusCount = [
      { name: 'เสร็จสิ้น', value: completedTasks },
      { name: 'กำลังดำเนินการ', value: baseTasks.filter(t => t.status === 'กำลังดำเนินการ').length },
      { name: 'รอดำเนินการ', value: baseTasks.filter(t => t.status === 'รอดำเนินการ').length },
      { name: 'ล่าช้า/ติดปัญหา', value: delayedTasks }
    ].filter(x => x.value > 0);

    const rootCounts = {}; 
    baseTasks.filter(t => t.status === 'ล่าช้า/ติดปัญหา').forEach(t => {
       const rc = t.root_cause || 'ไม่ระบุสาเหตุ';
       rootCounts[rc] = (rootCounts[rc] || 0) + 1;
    });
    const rootCausesArray = Object.entries(rootCounts).map(([cause, count]) => ({ cause, count })).sort((a,b) => b.count - a.count);

    return { totalTasks, completedTasks, delayedTasks, statusCount, rootCausesArray };
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
    const start = cumulativePercent; 
    cumulativePercent += (d.value / stats.totalTasks) * 100; 
    return `${TASK_STATUS_COLORS[d.name]} ${start}% ${cumulativePercent}%`;
  }).join(', ') : 'transparent 0% 100%';

  const clearFilters = () => { 
    setSelectedStatus(null); 
    setSelectedRootCause(null); 
  };

  return (
    <div className="space-y-6 animate-fade-in-up text-slate-100">
      <div className="bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-700 print-hide flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold flex gap-3 text-amber-500 mb-1.5"><PieChart size={32}/> ภาพรวมการปฏิบัติภารกิจ (Tasks)</h2>
          <p className="text-sm text-slate-400 font-medium">คลิกที่แผนภูมิ หรือ การ์ด เพื่อคัดกรองข้อมูลอย่างละเอียด</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto relative z-10">
          {(selectedStatus || selectedRootCause) && (
            <button onClick={clearFilters} className="text-sm font-bold bg-red-500/20 text-red-400 px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-red-500 hover:text-white transition-colors shadow-sm">
              <FilterX size={18}/> ล้างตัวกรอง
            </button>
          )}
          <select value={filterUnit} onChange={e => {setFilterUnit(e.target.value); clearFilters();}} disabled={!isAdminOrExec} className="flex-1 md:w-auto bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50 outline-none focus:border-amber-500 shadow-inner transition-colors">
            <option value="ALL">- ทุกหน่วยงาน -</option>
            {currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
          </select>
          <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} className="flex-1 md:w-auto bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500 shadow-inner transition-colors">
            <option value="ALL">- ทุกปีงบประมาณ -</option>
            <option value="2567">ปีงบประมาณ 2567</option>
            <option value="2568">ปีงบประมาณ 2568</option>
          </select>
          <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5" title="พิมพ์รายงาน">
            <Printer size={20}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'ภารกิจรวม', val: stats.totalTasks, status: null, color: 'text-white', border: 'border-slate-600', bg: 'bg-slate-800' },
          { label: 'เสร็จสมบูรณ์', val: stats.completedTasks, status: 'เสร็จสิ้น', color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-950/30' },
          { label: 'กำลังดำเนินการ', val: baseTasks.filter(t=>t.status==='กำลังดำเนินการ').length, status: 'กำลังดำเนินการ', color: 'text-sky-400', border: 'border-sky-500/50', bg: 'bg-sky-950/30' },
          { label: 'ล่าช้า/ติดปัญหา', val: stats.delayedTasks, status: 'ล่าช้า/ติดปัญหา', color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-950/30' }
        ].map(kpi => (
          <div key={kpi.label} onClick={() => { setSelectedStatus(kpi.status); setSelectedRootCause(null); }} className={`p-6 md:p-8 rounded-2xl border-2 cursor-pointer transition-all transform hover:-translate-y-1.5 shadow-xl relative group overflow-hidden ${selectedStatus === kpi.status ? `ring-2 ring-offset-4 ring-offset-slate-900 border-transparent ${kpi.bg}` : `border-slate-700 bg-slate-800 hover:${kpi.border}`}`}>
             <MousePointerClick size={18} className={`absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${kpi.color}`}/>
             <p className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-1">{kpi.label}</p>
             <h3 className={`text-4xl font-bold mt-2 font-mono ${kpi.color}`}>{kpi.val}</h3>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Donut Chart */}
         <div className="lg:col-span-4 bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center relative overflow-hidden">
            <h3 className="font-bold w-full mb-8 text-slate-300 text-center text-sm uppercase tracking-widest border-b border-slate-700 pb-4">สัดส่วนสถานะภารกิจ</h3>
            <div className="relative w-56 h-56 rounded-full mb-10 cursor-pointer transform hover:scale-105 transition-all shadow-2xl" onClick={() => { setSelectedStatus(null); setSelectedRootCause(null); }} style={{ background: stats.totalTasks > 0 ? `conic-gradient(${donutGradientStops})` : '#334155' }}>
               <div className="absolute inset-0 m-auto w-40 h-40 bg-slate-800 rounded-full flex flex-col items-center justify-center border-[6px] border-slate-800 shadow-inner">
                 <span className="text-5xl font-bold text-white font-mono">{stats.totalTasks}</span>
                 <span className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold">{selectedStatus ? selectedStatus : 'ภารกิจทั้งหมด'}</span>
               </div>
            </div>
            <div className="w-full space-y-2 mt-auto">
               {stats.statusCount.map(s => (
                 <div key={s.name} onClick={() => { setSelectedStatus(s.name === selectedStatus ? null : s.name); setSelectedRootCause(null); }} className={`flex justify-between items-center p-3.5 rounded-xl cursor-pointer transition-all border shadow-sm ${selectedStatus === s.name ? 'bg-slate-700 border-amber-500 scale-105' : 'border-slate-700/50 bg-slate-900/30 hover:bg-slate-700/50 hover:border-slate-600'}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ background: TASK_STATUS_COLORS[s.name] }}></span>
                      <span className={`font-medium ${selectedStatus === s.name ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>{s.name}</span>
                    </div>
                    <span className="font-bold text-xl text-slate-100">{s.value}</span>
                 </div>
               ))}
               {stats.statusCount.length === 0 && <p className="text-center text-slate-500 text-sm py-4">ไม่มีข้อมูล</p>}
            </div>
         </div>
         
         {/* Root Causes Bar Chart */}
         <div className="lg:col-span-8 bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl flex flex-col">
            <h3 className="font-bold mb-6 flex gap-3 text-red-500 items-center border-b border-slate-700 pb-4 text-lg">
              <div className="bg-red-500/20 p-2 rounded-lg border border-red-500/30"><AlertOctagon size={20}/></div>
              วิเคราะห์สาเหตุความล่าช้า 
              {selectedRootCause && <span className="text-[10px] bg-red-900/50 text-red-300 px-3 py-1.5 rounded-full ml-auto border border-red-500/30 font-bold uppercase tracking-wider">กรอง: {selectedRootCause}</span>}
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4 max-h-[450px]">
               {stats.rootCausesArray.map((rc, i) => {
                 const maxVal = Math.max(...stats.rootCausesArray.map(x => x.count), 1);
                 const pct = (rc.count / maxVal) * 100;
                 const isSelected = selectedRootCause === rc.cause;
                 return (
                   <div key={i} onClick={() => { setSelectedRootCause(isSelected ? null : rc.cause); setSelectedStatus('ล่าช้า/ติดปัญหา'); }} className={`group cursor-pointer p-4 rounded-xl transition-all border shadow-sm ${isSelected ? 'border-red-500 bg-red-950/40' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800/80'}`}>
                     <div className="flex justify-between text-sm mb-3 items-center">
                       <span className={`truncate pr-4 flex items-center gap-2 ${isSelected ? 'text-red-400 font-bold' : 'text-slate-300 font-medium'}`}>{rc.cause}</span>
                       <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 shadow-inner">{rc.count} งาน</span>
                     </div>
                     <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex shadow-inner border border-slate-700/50">
                       <div className={`h-full rounded-full transition-all duration-1000 ease-out relative ${isSelected ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-red-500/60 group-hover:bg-red-400'}`} style={{ width: `${pct}%` }}>
                          <div className="absolute inset-0 bg-white/20"></div>
                       </div>
                     </div>
                   </div>
                 );
               })}
               {stats.rootCausesArray.length === 0 && (
                 <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/30">
                   <CheckCircle size={48} className="mx-auto mb-4 opacity-30 text-emerald-500"/>
                   <p className="text-xl font-bold text-slate-400">ยอดเยี่ยม!</p>
                   <p className="text-sm mt-1">ไม่มีข้อมูลภารกิจที่ล่าช้าหรือติดปัญหาในระบบ</p>
                 </div>
               )}
            </div>
         </div>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl theme-transition mt-8">
        <div className="p-5 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-100 flex items-center gap-2 text-lg">
            <ListTodo size={22} className="text-amber-500" /> รายการภารกิจที่ตรงตามเงื่อนไข 
            {(selectedStatus || selectedRootCause) && <span className="bg-amber-600 text-white text-xs px-2.5 py-0.5 rounded-full shadow-sm ml-2">{filteredTasksList.length} รายการ</span>}
          </h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 sticky top-0 z-10 shadow-sm uppercase tracking-wider text-xs">
              <tr>
                <th className="p-5 font-bold min-w-[300px]">รายละเอียดภารกิจ</th>
                <th className="p-5 font-bold whitespace-nowrap">หน่วยรับผิดชอบ</th>
                <th className="p-5 font-bold whitespace-nowrap text-center">สถานะ</th>
                <th className="p-5 font-bold w-48 text-center">ความคืบหน้า</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredTasksList.map(t => {
                let parsedSubtasks = [];
                if (t.subtasks) {
                  try {
                    parsedSubtasks = typeof t.subtasks === 'string' ? JSON.parse(t.subtasks) : t.subtasks;
                  } catch(e) {}
                }
                const hasSubtasks = parsedSubtasks && parsedSubtasks.length > 0;
                const isExpanded = expandedTaskId === t.task_id;

                return (
                  <React.Fragment key={t.task_id}>
                    <tr 
                      onClick={() => hasSubtasks && setExpandedTaskId(isExpanded ? null : t.task_id)}
                      className={`transition-colors align-top ${hasSubtasks ? 'cursor-pointer hover:bg-slate-700/60' : 'hover:bg-slate-700/40'} ${isExpanded ? 'bg-slate-800/80' : ''}`}
                    >
                      <td className="p-5 text-slate-200">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-bold text-base leading-relaxed mb-1" title={t.task_name}>{t.task_name}</p>
                            <p className="text-[11px] text-slate-400 font-mono mb-2"><Clock size={12} className="inline mr-1.5 mb-0.5 text-slate-500"/> กำหนด: {formatDate(t.start_date)} - {formatDate(t.end_date)}</p>
                            
                            {t.status === 'ล่าช้า/ติดปัญหา' && t.root_cause && (
                              <div className="block mt-2">
                                <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-900/50 px-3 py-2 rounded-lg inline-flex items-center gap-1.5">
                                  <AlertOctagon size={14}/> <span className="font-bold">สาเหตุหลัก:</span> {t.root_cause}
                                </div>
                              </div>
                            )}
                          </div>
                          {hasSubtasks && (
                            <div className="mt-1 text-slate-500 shrink-0 bg-slate-900/50 p-1.5 rounded-lg border border-slate-700">
                              {isExpanded ? <ChevronUp size={18} className="text-amber-500"/> : <ChevronDown size={18}/>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-5 text-sm font-medium text-sky-400 whitespace-nowrap pt-6">{t.primary_unit}</td>
                      <td className="p-5 text-center whitespace-nowrap pt-6">
                        <span className={`px-4 py-2 rounded-full text-xs font-bold border shadow-sm ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>{t.status}</span>
                      </td>
                      <td className="p-5 pt-6">
                        <div className="flex flex-col items-center gap-2 mt-1">
                          <span className="text-lg font-bold font-mono drop-shadow-md" style={{ color: getBarColor(t.progress_percent) }}>{t.progress_percent}%</span>
                          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                            <div className="h-full rounded-full transition-all duration-1000 relative" style={{ width: `${t.progress_percent}%`, backgroundColor: getBarColor(t.progress_percent) }}>
                               <div className="absolute inset-0 bg-white/20"></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Subtasks Row */}
                    {isExpanded && hasSubtasks && (
                      <tr className="bg-slate-900/40 border-b border-slate-700/50">
                        <td colSpan={4} className="p-0">
                          <div className="pl-8 py-5 pr-5 border-l-4 border-sky-500 ml-[18px] animate-fade-in-up shadow-inner">
                            <h5 className="text-[11px] font-bold text-sky-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
                              <GitMerge size={14} /> แผนงาน/ภารกิจย่อย ({parsedSubtasks.filter(s=>s.done).length}/{parsedSubtasks.length})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {parsedSubtasks.map((st, i) => (
                                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${st.done ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-slate-800 border-slate-700/50'}`}>
                                  <div className="mt-0.5 shrink-0">
                                    {st.done ? (
                                      <CheckCircle2 size={16} className="text-emerald-500 drop-shadow-md" />
                                    ) : (
                                      <Circle size={16} className="text-slate-500" />
                                    )}
                                  </div>
                                  <span className={`text-sm leading-relaxed ${st.done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                                    {st.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredTasksList.length === 0 && (
                <tr><td colSpan={4} className="p-16 text-center text-slate-500 text-lg">ไม่มีข้อมูลภารกิจตามเงื่อนไขที่เลือก</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 4. ฐานข้อมูลนโยบาย (Policies)
// ============================================================
function Policies({ appDb, user, showToast, callApi, refresh }) {
  const [search, setSearch] = useState(''); 
  const [isModalOpen, setModalOpen] = useState(false); 
  const [editData, setEditData] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const isAdmin = user.role === 'admin';

  const filtered = (appDb.policies||[]).filter(p => 
    p.order.toLowerCase().includes(search.toLowerCase()) || 
    p.commander.toLowerCase().includes(search.toLowerCase()) || 
    p.primary_unit.toLowerCase().includes(search.toLowerCase())
  ).sort((a,b) => parseInt(a.policy_no||0) - parseInt(b.policy_no||0));
  
  const paginated = filtered.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE);

  const handleSave = async (e) => {
    e.preventDefault(); 
    const fd = new FormData(e.target); 
    const data = Object.fromEntries(fd.entries());
    const isUpdating = !!editData; 
    const policyId = isUpdating ? editData.policy_id : `POL-${Date.now()}`;
    const payload = { ...data, policy_id: policyId, created_at: isUpdating ? editData.created_at : new Date().toISOString() };
    
    showToast('กำลังส่งข้อมูลไปยังระบบ...'); 
    const success = await callApi(isUpdating ? "update" : "insert", "policies", payload, "policy_id", policyId);
    if (success) { showToast('บันทึกข้อสั่งการเรียบร้อย', 'ok'); setModalOpen(false); refresh(); }
  };

  const handleDelete = async (id) => { 
    if(window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อสั่งการนี้อย่างถาวร?')) { 
      showToast('กำลังลบข้อมูล...'); 
      const success = await callApi("delete", "policies", null, "policy_id", id); 
      if (success) { showToast('ลบสำเร็จ', 'ok'); refresh(); } 
    } 
  };

  return (
    <div className="space-y-6 animate-fade-in-up text-slate-100">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-xl gap-4">
        <h2 className="text-2xl md:text-3xl font-bold flex gap-4 text-amber-500 items-center">
          <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30 shadow-inner"><ScrollText size={32} /></div> 
          ฐานข้อมูลข้อสั่งการ
        </h2>
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[300px] shadow-md">
             <Search size={20} className="absolute left-4 top-4 text-slate-400" />
             <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาเนื้อหา, ผู้สั่งการ, หน่วยงาน..." className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 transition-all"/>
          </div>
          {isAdmin && (
            <button onClick={()=>{setEditData(null);setModalOpen(true);}} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-1">
              <Plus size={20}/> เพิ่มข้อสั่งการใหม่
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left text-slate-200">
             <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700 uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-6 font-bold w-20 text-center">ลำดับ</th>
                  <th className="p-6 font-bold whitespace-nowrap w-40">ผู้สั่งการ</th>
                  <th className="p-6 font-bold min-w-[400px]">รายละเอียดข้อสั่งการ</th>
                  <th className="p-6 font-bold whitespace-nowrap w-36">กำหนดเสร็จ</th>
                  <th className="p-6 font-bold whitespace-nowrap w-48">หน่วยรับผิดชอบ</th>
                  {isAdmin&&<th className="p-6 font-bold text-center w-32">จัดการ</th>}
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-700/50">
                {paginated.map(p=>(
                  <tr key={p.policy_id} className="hover:bg-slate-700/40 transition-colors align-top group">
                     <td className="p-6 font-bold text-amber-500 text-center text-xl font-mono">{p.policy_no||'-'}</td>
                     <td className="p-6 whitespace-nowrap font-bold text-slate-300">
                       <span className="bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-600 shadow-sm">{p.commander}</span>
                     </td>
                     <td className="p-6 leading-relaxed text-slate-200 text-base">{p.order}</td>
                     <td className="p-6 text-emerald-400 font-bold whitespace-nowrap flex items-center gap-2 mt-1 bg-slate-900/30 px-3 py-1.5 rounded-lg border border-slate-700 w-max">
                       <CalendarDays size={16}/> {p.timeframe||'-'}
                     </td>
                     <td className="p-6 text-sky-400 font-bold whitespace-nowrap tracking-wide">{p.primary_unit}</td>
                     {isAdmin&& (
                       <td className="p-6 text-center whitespace-nowrap">
                         {/* เปลี่ยนจาก opacity-0 group-hover:opacity-100 ให้เห็นชัดตลอดเวลา */}
                         <div className="flex justify-center gap-2 transition-opacity">
                           <button onClick={()=>{setEditData(p);setModalOpen(true);}} className="text-sky-400 p-2.5 bg-sky-900/30 rounded-xl hover:bg-sky-600 hover:text-white transition-all shadow-sm hover:scale-110" title="แก้ไข"><Edit size={18}/></button>
                           <button onClick={()=>handleDelete(p.policy_id)} className="text-red-400 p-2.5 bg-red-900/30 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm hover:scale-110" title="ลบ"><Trash2 size={18}/></button>
                         </div>
                       </td>
                     )}
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan="6" className="p-20 text-center text-slate-500 text-xl border-dashed border-2 border-slate-700/50 m-4 rounded-2xl bg-slate-900/30">ไม่พบข้อมูลที่ค้นหา</td></tr>}
             </tbody>
          </table>
        </div>
      </div>
      <Pagination currentPage={currentPage} totalItems={filtered.length} onPageChange={setCurrentPage} />
      
      {/* Modal เพิ่ม/แก้ไขข้อสั่งการ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-md overflow-y-auto">
          <div className="flex min-h-screen items-start justify-center p-4 md:p-8">
             <div className="my-auto relative transform overflow-hidden bg-slate-800 p-8 md:p-10 rounded-3xl w-full max-w-4xl text-left text-white shadow-2xl border border-slate-600 animate-fade-in-up">
               <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-5">
                 <h3 className="text-3xl font-bold text-amber-500 flex items-center gap-4 tracking-wide">
                   <div className="bg-amber-500/20 p-3 rounded-2xl shadow-inner border border-amber-500/30">{editData?<Edit size={28}/>:<Plus size={28}/>}</div> 
                   {editData?'แก้ไขข้อมูลข้อสั่งการ':'ขึ้นทะเบียนข้อสั่งการใหม่'}
                 </h3>
                 <button onClick={()=>setModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-900 p-3 rounded-full transition-colors border border-slate-700 hover:bg-red-600 hover:border-red-500"><X size={24}/></button>
               </div>
               
               <form onSubmit={handleSave} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                       <label className="text-xs font-bold text-slate-400 mb-2.5 block uppercase tracking-widest">ประเภท</label>
                       <select name="category" defaultValue={editData?.category||'นโยบายหลัก'} className="w-full bg-slate-800 p-3.5 rounded-xl border border-slate-600 outline-none focus:border-amber-500 transition-colors font-bold text-sm shadow-inner">
                         <option value="นโยบายหลัก">นโยบายหลัก</option>
                         <option value="สั่งการเพิ่มเติม">สั่งการเพิ่มเติม</option>
                       </select>
                     </div>
                     <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                       <label className="text-xs font-bold text-slate-400 mb-2.5 block uppercase tracking-widest">ลำดับข้อ (เช่น 1, 2.1) <span className="text-red-500">*</span></label>
                       <input name="policy_no" defaultValue={editData?.policy_no} required className="w-full bg-slate-800 p-3.5 rounded-xl border border-slate-600 outline-none focus:border-amber-500 font-mono text-lg font-bold transition-colors shadow-inner" placeholder="00"/>
                     </div>
                     <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                       <label className="text-xs font-bold text-slate-400 mb-2.5 block uppercase tracking-widest">ผู้สั่งการ <span className="text-red-500">*</span></label>
                       <input name="commander" defaultValue={editData?.commander||'ผบ.ทสส.'} required className="w-full bg-slate-800 p-3.5 rounded-xl border border-slate-600 outline-none focus:border-amber-500 transition-colors font-bold text-sm shadow-inner" placeholder="ระบุตำแหน่ง..."/>
                     </div>
                  </div>
                  
                  <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700">
                    <label className="text-sm font-bold text-slate-300 mb-3 block flex items-center gap-2"><FileText size={18} className="text-amber-500"/> รายละเอียดข้อสั่งการ / นโยบาย <span className="text-red-500">*</span></label>
                    <textarea name="order" defaultValue={editData?.order} required rows="5" className="w-full bg-slate-800 p-4 rounded-xl border border-slate-600 outline-none focus:border-amber-500 leading-relaxed transition-colors text-base shadow-inner" placeholder="พิมพ์รายละเอียดข้อสั่งการที่นี่..."></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                     <div>
                       <label className="text-sm font-bold text-slate-300 mb-3 block flex items-center gap-2"><CalendarDays size={18} className="text-emerald-500"/> กรอบเวลา / กำหนดเสร็จ (ถ้ามี)</label>
                       <input name="timeframe" defaultValue={editData?.timeframe} placeholder="เช่น ภายใน ก.ย. 68" className="w-full bg-slate-800 p-4 rounded-xl border border-slate-600 outline-none focus:border-emerald-500 transition-colors font-medium shadow-inner"/>
                     </div>
                     <div>
                       <label className="text-sm font-bold text-slate-300 mb-3 block flex items-center gap-2"><Target size={18} className="text-sky-500"/> หน่วยงานรับผิดชอบหลัก</label>
                       <select name="primary_unit" defaultValue={editData?.primary_unit||'ทุกหน่วย'} className="w-full bg-slate-800 p-4 rounded-xl border border-slate-600 outline-none focus:border-sky-500 transition-colors font-bold text-sky-400 shadow-inner">
                         <option value="ทุกหน่วย">- ทุกหน่วยงาน -</option>
                         {(appDb.units||[]).filter(u=>u.role==='user'||!u.role).map(u=><option key={u.id} value={u.name}>{u.name}</option>)}
                       </select>
                     </div>
                  </div>
                  
                  <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-slate-700">
                    <button type="button" onClick={()=>setModalOpen(false)} className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors text-lg">ยกเลิก</button>
                    <button type="submit" className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-3 text-lg"><Send size={22}/> บันทึกข้อมูลลงระบบ</button>
                  </div>
               </form>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 5. ติดตามภารกิจ (Tasks Tracker)
// ============================================================
function TaskTracker({ appDb, user, showToast, callApi, refresh }) {
  const [search, setSearch] = useState(''); 
  const [isModalOpen, setModalOpen] = useState(false); 
  const [editData, setEditData] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  
  // State สำหรับจัดการงานย่อย (Subtasks)
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [formProgress, setFormProgress] = useState(0);
  const [formStatus, setFormStatus] = useState('รอดำเนินการ');
  
  const tasks = appDb.tasks || []; 
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const visible = isAdminOrExec ? tasks : tasks.filter(t => t.primary_unit === user.unitName);
  
  const filtered = visible.filter(t => 
    t.task_name.toLowerCase().includes(search.toLowerCase()) || 
    t.primary_unit.toLowerCase().includes(search.toLowerCase())
  ).sort((a,b)=>new Date(a.start_date)-new Date(b.start_date));

  // ฟังก์ชันสำหรับ ปักหมุด / เลิกปักหมุด
  const handleToggleImportant = async (e, task) => {
    e.stopPropagation(); // ป้องกันไม่ให้คลิกแล้วแถวขยาย
    const updatedStatus = !task.is_important;
    const payload = { ...task, is_important: updatedStatus };
    
    showToast(updatedStatus ? 'ปักหมุดภารกิจสำคัญแล้ว' : 'ยกเลิกการปักหมุด', 'ok');
    
    const success = await callApi("update", "tasks", payload, "task_id", task.task_id);
    if (success) { 
      refresh(); 
    }
  };

  // เปิด Modal และโหลดข้อมูล
  const openModal = (data = null) => {
    setEditData(data);
    setFormStatus(data?.status || 'รอดำเนินการ');
    setFormProgress(data?.progress_percent || 0);

    let parsedSubtasks = [];
    if (data && data.subtasks) {
      try {
        parsedSubtasks = typeof data.subtasks === 'string' ? JSON.parse(data.subtasks) : data.subtasks;
      } catch(e) {
        parsedSubtasks = [];
      }
    }
    setSubtasks(parsedSubtasks);
    setNewSubtask('');
    setModalOpen(true);
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
      const progress = Math.round((doneCount / subtasks.length) * 100);
      setFormProgress(progress);
      
      if (progress === 100 && formStatus !== 'เสร็จสิ้น') {
        setFormStatus('เสร็จสิ้น');
      } else if (progress > 0 && progress < 100 && formStatus === 'รอดำเนินการ') {
        setFormStatus('กำลังดำเนินการ');
      }
    }
  }, [subtasks]);

  const handleSave = async (e) => {
    e.preventDefault(); 
    const fd = new FormData(e.target); 
    const data = Object.fromEntries(fd.entries());
    const isUpdating = !!editData; 
    const taskId = isUpdating ? editData.task_id : `TSK-${Date.now()}`;
    
    const payload = { 
      ...data, 
      task_id: taskId, 
      progress_percent: Number(formProgress) || 0,
      status: formStatus
    };
    
    if (subtasks.length > 0) {
      payload.subtasks = JSON.stringify(subtasks);
    } else {
      payload.subtasks = "";
    }
    
    if(payload.status !== 'ล่าช้า/ติดปัญหา') payload.root_cause = '';
    
    showToast('กำลังอัปเดตภารกิจ...'); 
    const success = await callApi(isUpdating ? "update" : "insert", "tasks", payload, "task_id", taskId);
    if (success) { showToast('บันทึกสำเร็จ', 'ok'); setModalOpen(false); refresh(); }
  };

  const handleDelete = async (id) => { 
    if(window.confirm('ยืนยันลบภารกิจนี้ออกจากระบบ?')) { 
      const success = await callApi("delete", "tasks", null, "task_id", id); 
      if (success) { showToast('ลบสำเร็จ', 'ok'); refresh(); } 
    } 
  }

  return (
    <div className="space-y-6 animate-fade-in-up text-slate-100">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-xl gap-6">
         <div className="flex items-center gap-4">
            <div className="bg-sky-500/20 p-4 rounded-2xl border border-sky-500/30 text-sky-400 shadow-inner"><CheckSquare size={32} /></div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold whitespace-nowrap text-white">ติดตามการปฏิบัติงาน (Tasks)</h2>
              <p className="text-sm text-slate-400 mt-1 font-medium tracking-wide">อัปเดตความคืบหน้าภารกิจย่อยในหน่วยของท่าน</p>
            </div>
         </div>
         <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="relative flex-1 min-w-[300px] shadow-md">
               <Search size={20} className="absolute left-4 top-4 text-slate-400" />
               <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่องาน, หน่วย..." className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white font-medium focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50 outline-none transition-all"/>
            </div>
            {user.role !== 'executive' && (
              <button onClick={() => openModal()} className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap shadow-lg transition-transform hover:-translate-y-1">
                <Plus size={20}/>เพิ่มภารกิจใหม่
              </button>
            )}
         </div>
       </div>

       <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
         <div className="overflow-x-auto custom-scrollbar">
           <table className="w-full text-sm text-left text-slate-200">
             <thead className="bg-slate-900/80 border-b border-slate-700 text-slate-400 uppercase tracking-widest text-[11px]">
               <tr>
                 <th className="p-6 font-bold min-w-[350px]">รายละเอียดภารกิจ</th>
                 <th className="p-6 font-bold whitespace-nowrap">หน่วยรับผิดชอบ</th>
                 <th className="p-6 font-bold whitespace-nowrap text-center">ระยะเวลา</th>
                 <th className="p-6 font-bold text-center">สถานะ</th>
                 <th className="p-6 font-bold w-52 text-center">ความคืบหน้า</th>
                 {user.role !== 'executive' && <th className="p-6 font-bold text-center w-28">จัดการ</th>}
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-700/50">
                {filtered.map(t=>{
                  let tSubtasks = [];
                  if(t.subtasks) {
                    try { tSubtasks = typeof t.subtasks === 'string' ? JSON.parse(t.subtasks) : t.subtasks; }
                    catch(e) {}
                  }
                  const completedSt = tSubtasks.filter(s=>s.done).length;
                  const hasSubtasks = tSubtasks && tSubtasks.length > 0;
                  const isExpanded = expandedTaskId === t.task_id;

                  return (
                  <React.Fragment key={t.task_id}>
                    <tr 
                      onClick={() => hasSubtasks && setExpandedTaskId(isExpanded ? null : t.task_id)}
                      className={`transition-colors align-top ${hasSubtasks ? 'cursor-pointer hover:bg-slate-700/60' : 'hover:bg-slate-700/40'} ${isExpanded ? 'bg-slate-800/80' : ''}`}
                    >
                       <td className="p-6">
                         <div className="flex justify-between items-start gap-4">
                           <div className="flex items-start gap-3 w-full">
                              <button
                                 onClick={(e) => handleToggleImportant(e, t)}
                                 className={`mt-0.5 shrink-0 transition-transform hover:scale-125 ${t.is_important ? 'text-amber-500' : 'text-slate-600 hover:text-amber-500/50'}`}
                                 title={t.is_important ? "ยกเลิกปักหมุดภารกิจสำคัญ" : "ปักหมุดไปที่หน้าสรุปผู้บริหาร"}
                               >
                                 <Star size={20} className={t.is_important ? 'fill-amber-500 drop-shadow-md' : ''} />
                               </button>
                               
                              <div className="flex-1">
                                <p className="font-bold text-slate-100 text-base leading-relaxed mb-2" title={t.task_name}>{t.task_name}</p>
                                
                                {hasSubtasks && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-3 bg-slate-900/50 px-2 py-1.5 rounded-lg border border-slate-700/50 w-max">
                                    <CheckSquare size={14} className="text-emerald-500"/> งานย่อย: <span className="text-white ml-1">{completedSt}/{tSubtasks.length}</span>
                                  </div>
                                )}

                                {t.status === 'ล่าช้า/ติดปัญหา' && t.root_cause && (
                                  <div className="block mt-2 mb-3">
                                    <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-900/50 px-3 py-2 rounded-lg inline-flex items-center gap-1.5">
                                      <AlertOctagon size={14}/> <span className="font-bold">สาเหตุหลัก:</span> {t.root_cause}
                                    </div>
                                  </div>
                                )}

                                {t.note && <p className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 line-clamp-2 mt-2 leading-relaxed shadow-inner font-medium"><span className="text-sky-500 font-bold mb-1 block">หมายเหตุล่าสุด:</span>{t.note}</p>}
                                
                                {/* แสดงนโยบายที่อ้างอิง */}
                                {t.policy_id && (
                                  <div className="mt-3 inline-block">
                                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded-lg flex items-center gap-1.5 font-bold shadow-sm">
                                      <ShieldCheck size={12}/> สนับสนุนนโยบาย: [{(appDb.policies||[]).find(p => p.policy_id === t.policy_id)?.policy_no || '-'}]
                                    </span>
                                  </div>
                                )}
                              </div>
                           </div>
                           {hasSubtasks && (
                             <div className="mt-1 text-slate-500 shrink-0 bg-slate-900/50 p-1.5 rounded-lg border border-slate-700">
                               {isExpanded ? <ChevronUp size={18} className="text-amber-500"/> : <ChevronDown size={18}/>}
                             </div>
                           )}
                         </div>
                       </td>
                       <td className="p-6">
                          <span className="text-sm font-bold text-sky-400 bg-sky-900/20 px-4 py-2 rounded-xl border border-sky-500/30 block w-max whitespace-nowrap shadow-sm">{t.primary_unit}</span>
                       </td>
                       <td className="p-6 text-center">
                         <div className="flex flex-col items-center gap-2 mt-2">
                            <span className="text-2xl font-bold font-mono drop-shadow-md" style={{color:getBarColor(t.progress_percent)}}>{t.progress_percent}%</span>
                            <div className="w-full bg-slate-900 h-3 rounded-full border border-slate-700 overflow-hidden shadow-inner">
                              <div className="h-full rounded-full transition-all duration-1000 relative" style={{width:`${t.progress_percent}%`, background:getBarColor(t.progress_percent)}}>
                                <div className="absolute inset-0 bg-white/20"></div>
                              </div>
                            </div>
                         </div>
                       </td>
                       <td className="p-6 text-center whitespace-nowrap">
                         <span className={`px-4 py-2 rounded-full text-xs font-bold border shadow-sm ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>{t.status}</span>
                       </td>
                       {user.role !== 'executive' && (
                         <td className="p-6 align-middle">
                           {/* ปุ่มเห็นชัดตลอดเวลา */}
                           <div className="flex flex-col gap-2 w-28 mx-auto transition-opacity" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openModal(t)} className="w-full bg-sky-500/20 text-sky-400 hover:bg-sky-500 hover:text-white border border-sky-500/30 py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm">
                              <Edit size={14}/> อัปเดตงาน
                            </button>
                            {(user.role === 'admin' || t.primary_unit === user.unitName) && (
                              <button onClick={() => handleDelete(t.task_id)} className="w-full bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 border border-slate-700 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm">
                                <Trash2 size={12}/> ลบ
                              </button>
                            )}
                           </div>
                         </td>
                       )}
                    </tr>
                    
                    {/* Expanded Subtasks Row */}
                    {isExpanded && hasSubtasks && (
                      <tr className="bg-slate-900/40 border-b border-slate-700/50">
                        <td colSpan={6} className="p-0">
                          <div className="pl-8 py-5 pr-5 border-l-4 border-sky-500 ml-[46px] animate-fade-in-up shadow-inner">
                            <h5 className="text-[11px] font-bold text-sky-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
                              <GitMerge size={14} /> แผนงาน/ภารกิจย่อย ({tSubtasks.filter(s=>s.done).length}/{tSubtasks.length})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {tSubtasks.map((st, i) => (
                                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${st.done ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-slate-800 border-slate-700/50'}`}>
                                  <div className="mt-0.5 shrink-0">
                                    {st.done ? (
                                      <CheckCircle2 size={16} className="text-emerald-500 drop-shadow-md" />
                                    ) : (
                                      <Circle size={16} className="text-slate-500" />
                                    )}
                                  </div>
                                  <span className={`text-sm leading-relaxed ${st.done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                                    {st.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )})}
                {filtered.length===0&&<tr><td colSpan="6" className="p-20 text-center text-slate-500 text-xl border-dashed border-2 border-slate-700/50 m-4 rounded-2xl bg-slate-900/30">ไม่มีข้อมูลภารกิจในขณะนี้</td></tr>}
             </tbody>
           </table>
         </div>
       </div>

       {/* Modal ฟอร์มงาน พร้อมระบบ Checklist (Subtasks) */}
       {isModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md overflow-y-auto">
             <div className="flex min-h-screen items-start justify-center p-4 md:p-8">
               <div className="my-auto relative transform overflow-hidden bg-slate-800 p-8 md:p-10 rounded-3xl w-full max-w-4xl text-left text-white shadow-2xl border border-slate-600 animate-fade-in-up">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-5">
                     <h3 className="text-3xl font-bold text-sky-400 flex items-center gap-4 tracking-wide">
                        <div className="bg-sky-500/20 p-3 rounded-2xl shadow-inner border border-sky-500/30">{editData?<Activity size={28}/>:<Plus size={28}/>}</div> 
                        {editData?'รายงานความคืบหน้าภารกิจ':'เพิ่มภารกิจใหม่'}
                     </h3>
                     <button onClick={()=>setModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-900 p-3 rounded-full transition-colors border border-slate-700 hover:bg-red-600 hover:border-red-500"><X size={24}/></button>
                  </div>
                  
                  <form onSubmit={handleSave} className="space-y-8">
                     
                     <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-700 space-y-6 shadow-inner">
                       <h4 className="font-bold text-slate-300 border-b border-slate-700/50 pb-3 flex items-center gap-2 text-lg uppercase tracking-widest"><LayoutDashboard size={20} className="text-amber-500"/> ข้อมูลพื้นฐานภารกิจ</h4>
                       <div><label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-widest">ชื่องาน/ภารกิจ <span className="text-red-500">*</span></label><input name="task_name" defaultValue={editData?.task_name} required className="w-full bg-slate-800 p-4 rounded-xl border border-slate-600 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100 transition-colors text-lg" placeholder="พิมพ์ชื่องานที่นี่..."/></div>
                       
                       {/* Dropdown เชื่อมโยงนโยบาย */}
                       <div>
                         <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14} className="text-amber-500"/> อ้างอิงนโยบาย/ข้อสั่งการ (ถ้ามี)</label>
                         <select name="policy_id" defaultValue={editData?.policy_id || ''} className="w-full bg-slate-800 p-4 rounded-xl border border-slate-600 outline-none focus:border-amber-500 transition-colors font-medium text-sm text-slate-200 shadow-inner cursor-pointer">
                           <option value="">-- ไม่ระบุ (ภารกิจทั่วไป) --</option>
                           {(appDb.policies||[]).map(p => (
                             <option key={p.policy_id} value={p.policy_id}>[{p.policy_no||'-'}] {p.order.substring(0,100)}...</option>
                           ))}
                         </select>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div><label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-widest">วันที่เริ่ม <span className="text-red-500">*</span></label><input type="date" name="start_date" defaultValue={editData?.start_date?editData.start_date.substring(0,10):new Date().toISOString().substring(0,10)} required className="w-full bg-slate-800 p-4 rounded-xl border border-slate-600 outline-none focus:border-sky-500 transition-colors font-mono" style={{colorScheme:'dark'}}/></div>
                          <div><label className="text-xs font-bold text-emerald-400 mb-2 block flex items-center gap-1.5 uppercase tracking-widest"><Clock size={14}/> วันกำหนดเสร็จ (Deadline)</label><input type="date" name="end_date" defaultValue={editData?.end_date?editData.end_date.substring(0,10):''} required className="w-full bg-slate-800 p-4 rounded-xl border border-slate-600 outline-none focus:border-emerald-500 transition-colors text-emerald-400 font-mono font-bold shadow-inner" style={{colorScheme:'dark'}}/></div>
                       </div>
                       
                       {/* Dropdown ให้เลือกหน่วยงานได้ */}
                       <div>
                         <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-widest">หน่วยรับผิดชอบหลัก <span className="text-red-500">*</span></label>
                         <select 
                           name="primary_unit" 
                           defaultValue={editData?.primary_unit || user.unitName} 
                           disabled={user.role !== 'admin'}
                           className="w-full bg-slate-800 p-4 rounded-xl border border-slate-600 outline-none focus:border-sky-500 text-sky-400 font-bold transition-colors shadow-inner cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                         >
                           {(appDb.units||[]).filter(u=>u.role==='user'||!u.role).map(u => (
                             <option key={u.id} value={u.name}>{u.name}</option>
                           ))}
                         </select>
                       </div>
                     </div>

                     {/* ระบบงานย่อย (Subtasks / Checklist) */}
                     <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-700 space-y-5 shadow-inner">
                        <h4 className="font-bold text-emerald-400 border-b border-slate-700/50 pb-3 flex items-center justify-between text-lg uppercase tracking-widest">
                           <span className="flex items-center gap-2"><CheckSquare size={20}/> งานย่อย (Checklist)</span>
                           <span className="text-xs bg-slate-800 px-3 py-1.5 rounded-full text-slate-400 border border-slate-600 shadow-sm">{subtasks.filter(s=>s.done).length} / {subtasks.length} สำเร็จ</span>
                        </h4>
                        
                        <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                           {subtasks.map(st => (
                             <div key={st.id} className={`flex items-center gap-4 p-3.5 rounded-xl border transition-colors ${st.done ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-slate-800 border-slate-700'}`}>
                               <button type="button" onClick={() => toggleSubtask(st.id)} className={`shrink-0 transition-transform hover:scale-110 ${st.done ? 'text-emerald-500' : 'text-slate-500'}`}>
                                  {st.done ? <CheckCircle2 size={24}/> : <Circle size={24}/>}
                               </button>
                               <span className={`flex-1 text-base font-medium transition-all ${st.done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{st.text}</span>
                               <button type="button" onClick={() => removeSubtask(st.id)} className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-slate-700 transition-colors"><Trash2 size={18}/></button>
                             </div>
                           ))}
                           {subtasks.length === 0 && (
                              <div className="text-center py-6 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50">
                                 <p className="text-sm">ยังไม่มีการเพิ่มงานย่อย</p>
                                 <p className="text-xs mt-1">สามารถเพิ่มงานย่อยเพื่อคำนวณความคืบหน้าแบบอัตโนมัติได้</p>
                              </div>
                           )}
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                           <input 
                             value={newSubtask} 
                             onChange={e=>setNewSubtask(e.target.value)} 
                             onKeyDown={(e) => { if(e.key==='Enter'){ e.preventDefault(); handleAddSubtask(); } }} 
                             placeholder="พิมพ์รายละเอียดงานย่อยแล้วกด Enter หรือปุ่มเพิ่ม..." 
                             className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-5 py-3.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors shadow-inner"
                           />
                           <button type="button" onClick={handleAddSubtask} className="bg-slate-700 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-colors shadow-md">เพิ่ม</button>
                        </div>
                     </div>

                     <div className="bg-sky-950/20 p-8 rounded-3xl border border-sky-900/50 space-y-6 shadow-inner relative overflow-hidden">
                       <div className="absolute right-0 bottom-0 opacity-5"><Activity size={200} className="text-sky-500"/></div>
                       <h4 className="font-bold text-sky-400 border-b border-sky-900/50 pb-3 flex items-center gap-2 text-lg uppercase tracking-widest relative z-10"><Activity size={20}/> การรายงานสถานะ</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                          <div>
                            <label className="text-xs font-bold text-sky-300 mb-2 block uppercase tracking-widest">สถานะปัจจุบัน <span className="text-red-500">*</span></label>
                            <select 
                              name="status" 
                              value={formStatus}
                              onChange={(e) => setFormStatus(e.target.value)}
                              className="w-full bg-slate-900 p-4 rounded-xl border border-sky-700/50 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-500 transition-colors font-bold text-base shadow-inner cursor-pointer"
                            >
                              <option value="รอดำเนินการ">รอดำเนินการ</option>
                              <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                              <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                              <option value="ล่าช้า/ติดปัญหา">ล่าช้า/ติดปัญหา</option>
                            </select>
                          </div>
                          <div className="relative">
                            <label className="text-xs font-bold text-sky-300 mb-2 block uppercase tracking-widest flex items-center gap-2">
                               ความคืบหน้า (%) <span className="text-red-500">*</span>
                               {subtasks.length > 0 && <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/30">คำนวณอัตโนมัติจากงานย่อย</span>}
                            </label>
                            <input 
                              type="number" 
                              name="progress_percent" 
                              value={formProgress} 
                              onChange={(e) => setFormProgress(e.target.value)}
                              min="0" max="100" required 
                              readOnly={subtasks.length > 0}
                              className={`w-full bg-slate-900 p-4 rounded-xl border border-sky-700/50 outline-none text-4xl font-mono text-center transition-colors font-bold shadow-inner ${subtasks.length > 0 ? 'text-emerald-400 opacity-80 cursor-not-allowed border-emerald-500/30 bg-emerald-950/20' : 'text-sky-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-500'}`}
                            />
                            <div className="absolute right-6 top-[60%] mt-1 text-slate-500 font-bold text-xl">%</div>
                          </div>
                       </div>
                       
                       {/* โชว์สาเหตุถ้าเลือกสถานะ ล่าช้า/ติดปัญหา */}
                       {formStatus === 'ล่าช้า/ติดปัญหา' && (
                         <div className="bg-red-950/40 p-5 rounded-2xl border border-red-900/50 relative z-10 animate-fade-in-up">
                            <label className="text-xs font-bold text-red-400 mb-2 block uppercase tracking-widest flex items-center gap-2"><AlertOctagon size={16}/> กรุณาระบุสาเหตุหลัก (Root Cause) <span className="text-red-500">*</span></label>
                            <select name="root_cause" defaultValue={editData?.root_cause || ''} required className="w-full bg-slate-900 p-4 rounded-xl border border-red-500/50 outline-none focus:border-red-500 transition-colors font-bold text-base shadow-inner text-slate-200 cursor-pointer">
                               <option value="">-- เลือกระบุสาเหตุที่ทำให้งานล่าช้า --</option>
                               {ROOT_CAUSES.map(rc => <option key={rc} value={rc}>{rc}</option>)}
                            </select>
                         </div>
                       )}

                       <div className="relative z-10"><label className="text-xs font-bold text-sky-300 mb-2 block uppercase tracking-widest">หมายเหตุ / อัปเดตล่าสุด</label><textarea name="note" defaultValue={editData?.note} rows="4" className="w-full bg-slate-900 p-4 rounded-xl border border-sky-700/50 outline-none focus:border-sky-400 transition-colors leading-relaxed shadow-inner text-base" placeholder="ระบุความคืบหน้าล่าสุดที่ได้ทำไป..."></textarea></div>
                     </div>

                     <div className="flex justify-end gap-5 pt-8 mt-10 border-t border-slate-700">
                       <button type="button" onClick={()=>setModalOpen(false)} className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors text-lg">ยกเลิก</button>
                       <button type="submit" className="px-8 py-4 bg-sky-600 hover:bg-sky-500 font-bold rounded-xl shadow-[0_4px_20px_rgba(2,132,199,0.4)] transition-transform hover:-translate-y-1 flex items-center gap-3 text-white text-lg"><Send size={22}/> บันทึกอัปเดตลงระบบ</button>
                     </div>
                  </form>
               </div>
             </div>
          </div>
       )}
    </div>
  )
}

// ============================================================
// 6. บันทึกรายงานผล (Report Form)
// ============================================================
function ReportForm({ appDb, user, showToast, setView, callApi, refresh }) {
  const policies = appDb.policies || [];
  const availPolicies = user.role === 'admin' ? policies : policies.filter(p => p.primary_unit === user.unitName || p.secondary_units?.includes(user.unitName) || p.primary_unit === 'ทุกหน่วย');

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    const fd = new FormData(e.target); 
    const data = Object.fromEntries(fd.entries());
    
    const pol = policies.find(p => p.policy_id === data.policy_id);
    if (!pol) return showToast('กรุณาเลือกข้อสั่งการ', 'error');

    const reportId = `RP-${Date.now()}`;
    const payload = { 
      report_id: reportId, 
      policy_id: data.policy_id, 
      policy_no: pol.policy_no||'-', 
      policy_snippet: pol.order.substring(0,100), 
      unit_name: user.unitName, 
      report_date: data.report_date, 
      past_result: data.past_result, 
      next_plan: data.next_plan, 
      problems: data.problems, 
      progress_percent: Number(data.progress_percent)||0, 
      approval_status: 'อนุมัติแล้ว', 
      created_at: new Date().toISOString() 
    };

    showToast('กำลังส่งแบบรายงานไปยังระบบ...'); 
    const success = await callApi("insert", "reports", payload, "report_id", reportId);
    if (success) { showToast('จัดส่งรายงานสำเร็จ', 'ok'); refresh(); setView('HISTORY'); }
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-800 p-8 lg:p-12 rounded-3xl border border-slate-700 shadow-2xl animate-fade-in-up text-white relative overflow-hidden mt-4">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 z-0"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 z-0"></div>
      
      <div className="relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-4 text-amber-500 mb-4"><div className="bg-amber-500/20 p-3 rounded-2xl shadow-inner border border-amber-500/30"><FilePlus size={36}/></div> ส่งรายงานผลการปฏิบัติงาน</h2>
        <p className="text-base text-slate-400 mb-10 border-b border-slate-700 pb-6 flex items-center gap-2">
          รายงานในนามหน่วยงาน: 
          <span className="text-amber-400 font-bold text-lg ml-2 bg-slate-900 px-4 py-1.5 rounded-xl border border-slate-700 shadow-sm">{user.unitName}</span>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-8">
           <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-700 shadow-inner">
              <label className="text-sm font-bold text-slate-300 block mb-3 uppercase tracking-widest flex items-center gap-2"><ScrollText size={18} className="text-amber-500"/> อ้างอิงข้อสั่งการ / โครงการ <span className="text-red-500">*</span></label>
              <select name="policy_id" required className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-2xl p-5 outline-none transition-colors text-base font-medium shadow-sm cursor-pointer">
                 <option value="">-- คลิกเพื่อเลือกข้อสั่งการที่ท่านรับผิดชอบ --</option>
                 {availPolicies.map(p=><option key={p.policy_id} value={p.policy_id}>[{p.policy_no}] {p.order.substring(0,120)}...</option>)}
              </select>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-700 shadow-inner">
                <label className="text-sm font-bold text-slate-300 block mb-3 uppercase tracking-widest flex items-center gap-2"><CalendarDays size={18} className="text-sky-500"/> วันที่รายงานผล <span className="text-red-500">*</span></label>
                <input type="date" name="report_date" defaultValue={new Date().toISOString().substring(0,10)} required className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 rounded-2xl p-5 outline-none font-mono text-lg shadow-sm" style={{colorScheme:'dark'}}/>
              </div>
              <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-700 relative overflow-hidden shadow-inner">
                <div className="absolute right-0 bottom-0 opacity-10"><PieChart size={140}/></div>
                <label className="text-sm font-bold text-slate-300 block mb-3 relative z-10 uppercase tracking-widest flex items-center gap-2"><Target size={18} className="text-emerald-500"/> ความคืบหน้าสะสม (%) <span className="text-red-500">*</span></label>
                <div className="relative z-10">
                  <input type="number" name="progress_percent" min="0" max="100" required defaultValue="0" className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 rounded-2xl p-5 outline-none text-4xl font-mono text-center text-amber-400 font-bold shadow-sm"/>
                  <span className="absolute right-6 top-[45%] mt-1 text-slate-500 font-bold text-xl">%</span>
                </div>
              </div>
           </div>
           
           <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-700 shadow-inner">
              <label className="text-sm font-bold text-slate-300 block mb-3 uppercase tracking-widest flex items-center gap-2"><CheckSquare size={18} className="text-emerald-500"/> สรุปผลการดำเนินการที่ผ่านมา (ทำอะไรไปแล้วบ้าง) <span className="text-red-500">*</span></label>
              <textarea name="past_result" required rows="6" className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 rounded-2xl p-5 outline-none leading-relaxed text-base shadow-sm" placeholder="อธิบายรายละเอียดผลการปฏิบัติ..."></textarea>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-700/50">
              <div className="bg-emerald-950/20 p-8 rounded-3xl border border-emerald-900/50 shadow-inner">
                <label className="text-sm text-emerald-400 font-bold block mb-3 flex items-center gap-2 uppercase tracking-widest"><TrendingUp size={20}/> แผนดำเนินการในระยะต่อไป</label>
                <textarea name="next_plan" rows="5" className="w-full bg-slate-900/80 border border-emerald-900/50 focus:border-emerald-500 rounded-2xl p-5 outline-none leading-relaxed shadow-sm text-slate-200" placeholder="ระบุก้าวต่อไป..."></textarea>
              </div>
              <div className="bg-red-950/20 p-8 rounded-3xl border border-red-900/50 shadow-inner">
                <label className="text-sm text-red-400 font-bold block mb-3 flex items-center gap-2 uppercase tracking-widest"><AlertTriangle size={20}/> ปัญหา / ข้อขัดข้อง</label>
                <textarea name="problems" rows="5" className="w-full bg-slate-900/80 border border-red-900/50 focus:border-red-500 rounded-2xl p-5 outline-none leading-relaxed shadow-sm text-slate-200" placeholder="หากมีข้อขัดข้องให้ระบุที่นี่..."></textarea>
              </div>
           </div>
           
           <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white py-6 rounded-3xl font-bold mt-10 flex justify-center items-center gap-3 text-2xl shadow-[0_10px_25px_rgba(245,158,11,0.3)] transition-all transform hover:-translate-y-1 active:translate-y-0 border border-amber-400/30">
             <Send size={28}/> ยืนยันการจัดส่งรายงานเข้าระบบ
           </button>
        </form>
      </div>
    </div>
  )
}

// ============================================================
// 7. ประวัติการรายงาน (Audit Log)
// ============================================================
function History({ appDb, user, showToast, callApi, refresh }) {
  const reports = appDb.reports || [];
  const visible = (user.role === 'admin' || user.role === 'executive') ? reports : reports.filter(r => r.unit_name === user.unitName);
  const sorted = visible.sort((a,b) => {
    const d1 = new Date(b.created_at || 0).getTime();
    const d2 = new Date(a.created_at || 0).getTime();
    return (isNaN(d1)?0:d1) - (isNaN(d2)?0:d2);
  });

  const handleDelete = async (id) => {
    if(window.confirm('คุณแน่ใจหรือไม่ที่จะลบรายงานฉบับนี้ออกจากฐานข้อมูลอย่างถาวร?')) { 
      showToast('กำลังส่งคำสั่งลบ...'); 
      const success = await callApi("delete", "reports", null, "report_id", id); 
      if (success) { showToast('ลบประวัติรายงานเรียบร้อย', 'ok'); refresh(); } 
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-xl gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-amber-500">
             <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30 shadow-inner"><HistoryIcon size={28}/></div> 
             ทะเบียนประวัติรายงานผล ({sorted.length} ฉบับ)
          </h2>
          <button className="bg-slate-700 p-3 rounded-xl text-white hover:bg-slate-600 print-hide transition-colors shadow-md border border-slate-600 hover:border-slate-500" onClick={()=>window.print()} title="พิมพ์ประวัติ">
            <Printer size={22}/>
          </button>
       </div>
       <div className="grid gap-6">
          {sorted.map(r => (
            <div key={r.report_id} className="bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 flex flex-col md:flex-row justify-between gap-6 shadow-lg hover:border-amber-500/40 transition-colors relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-2.5 h-full transition-all duration-500 group-hover:w-3" style={{background: getBarColor(r.progress_percent)}}></div>
               <div className="flex-1 pl-6">
                  <div className="flex flex-wrap gap-4 items-center mb-4">
                     <span className="text-sm text-sky-400 font-bold bg-sky-900/30 px-4 py-1.5 rounded-lg border border-sky-500/30 shadow-sm">{r.unit_name}</span>
                     <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-1.5"><Clock size={14}/> {formatDate(r.report_date)}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-100 mb-4 leading-relaxed border-b border-slate-700/50 pb-4">อ้างอิง: <span className="text-amber-500">[{r.policy_no}]</span> {r.policy_snippet}</h4>
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
                     <p className="text-sm text-slate-300 leading-relaxed"><b className="text-emerald-500 flex items-center gap-1.5 mb-2 font-bold uppercase tracking-wider text-[11px]"><CheckCircle size={14}/> ผลการปฏิบัติ:</b> {r.past_result}</p>
                     {r.problems && r.problems !== '-' && <p className="text-sm text-red-400 mt-4 border-t border-slate-700/50 pt-4 leading-relaxed"><b className="text-red-500 flex items-center gap-1.5 mb-2 font-bold uppercase tracking-wider text-[11px]"><AlertOctagon size={14}/> ปัญหาที่พบ:</b> {r.problems}</p>}
                  </div>
               </div>
               <div className="md:w-48 flex flex-col justify-between items-end shrink-0 border-t md:border-t-0 md:border-l border-slate-700 pt-5 md:pt-0 md:pl-8 bg-slate-800/30 rounded-r-3xl">
                  <div className="text-right w-full flex flex-col items-center justify-center h-full p-5 bg-slate-900/80 rounded-2xl border border-slate-700 shadow-inner">
                     <span className="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-widest">ความคืบหน้าสะสม</span>
                     <span className="text-5xl font-bold font-mono drop-shadow-lg" style={{color: getBarColor(r.progress_percent)}}>{r.progress_percent}%</span>
                  </div>
                  {user.role === 'admin' && (
                     <button onClick={()=>handleDelete(r.report_id)} className="mt-5 w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-red-600 p-3.5 rounded-xl transition-colors border border-slate-700 hover:border-red-500 font-bold shadow-md">
                        <Trash2 size={18}/> ลบถาวร
                     </button>
                  )}
               </div>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="text-center py-24 text-slate-500 bg-slate-800/50 rounded-3xl border-2 border-slate-700 border-dashed shadow-inner m-4">
              <HistoryIcon size={64} className="mx-auto mb-5 opacity-20"/>
              <p className="text-xl font-bold">ยังไม่มีประวัติการส่งรายงานในระบบ</p>
              <p className="text-sm mt-2">เมื่อมีการส่งรายงาน ข้อมูลจะปรากฏที่นี่</p>
            </div>
          )}
       </div>
    </div>
  )
}

// ============================================================
// 8. ตั้งค่าบัญชีผู้ใช้ (Admin Only)
// ============================================================
function UnitsConfig({ appDb, showToast, callApi, refresh }) {
  const units = appDb.units || [];
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  
  const handleDelete = async (id) => { 
    if(window.confirm('คำเตือน: ยืนยันลบบัญชีนี้ออกจากระบบอย่างถาวร?')) { 
      const success = await callApi("delete", "units", null, "id", id); 
      if (success) { showToast('ลบบัญชีเรียบร้อย', 'ok'); refresh(); } 
    } 
  }

  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newName = fd.get('name').trim();
    const newPasscode = fd.get('passcode').trim();
    const newRole = fd.get('role');

    if (!newName) {
      showToast('กรุณากรอกชื่อหน่วยงาน/บัญชี', 'error');
      return;
    }

    const isUpdating = !!editData;
    const unitId = isUpdating ? editData.id : `U-${Date.now()}`;
    const payload = { id: unitId, name: newName, passcode: newPasscode, role: newRole };

    showToast('กำลังบันทึกข้อมูล...');
    const success = await callApi(isUpdating ? "update" : "insert", "units", payload, "id", unitId);
    if (success) {
      showToast(isUpdating ? 'แก้ไขบัญชีเรียบร้อย' : 'เพิ่มบัญชีเรียบร้อย', 'ok');
      setModalOpen(false);
      refresh();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in-up">
       <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3 text-amber-500">
               <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30 shadow-inner"><Users size={28}/></div>
               จัดการบัญชีผู้ใช้ระบบ
            </h2>
            <p className="text-sm text-slate-400 mt-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">สามารถเพิ่ม ลบ หรือแก้ไขรหัสผ่านบัญชีการใช้งานของระบบได้ที่นี่ หรือแก้ไขผ่าน Google Sheets ได้เช่นกัน</p>
          </div>
          <div className="flex flex-wrap gap-3">
             <button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-amber-600 text-white px-6 py-4 rounded-xl text-base font-bold flex items-center gap-2 hover:bg-amber-500 transition-all shadow-lg hover:scale-105 active:scale-95 whitespace-nowrap">
                <Plus size={20}/> เพิ่มบัญชีใหม่
             </button>
             <button onClick={refresh} className="bg-sky-600 text-white px-6 py-4 rounded-xl text-base font-bold flex items-center gap-2 hover:bg-sky-500 transition-all shadow-lg hover:scale-105 active:scale-95 whitespace-nowrap">
                <CloudUpload size={20}/> ซิงค์ฐานข้อมูล
             </button>
          </div>
       </div>
       
       <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left text-slate-200">
               <thead className="bg-slate-900 text-slate-400 border-b border-slate-700 uppercase tracking-widest text-xs">
                 <tr>
                    <th className="p-6 font-bold">Ref ID</th>
                    <th className="p-6 font-bold">ชื่อหน่วยงาน / ชื่อบัญชี</th>
                    <th className="p-6 font-bold text-center">สิทธิ์ (Role)</th>
                    <th className="p-6 font-bold text-center">รหัสผ่าน (Passcode)</th>
                    <th className="p-6 font-bold text-center">จัดการ</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-700/50">
                  {units.map(u => (
                    <tr key={u.id} className="hover:bg-slate-700/40 transition-colors">
                       <td className="p-6 text-xs font-mono text-slate-500 font-bold">{u.id}</td>
                       <td className="p-6 font-bold text-slate-100 text-base">{u.name}</td>
                       <td className="p-6 text-center">
                          <span className={`px-4 py-2 rounded-lg border text-xs font-bold shadow-sm uppercase tracking-wider ${
                             u.role === 'admin' ? 'bg-purple-900/30 border-purple-500/50 text-purple-400' : 
                             u.role === 'executive' ? 'bg-amber-900/30 border-amber-500/50 text-amber-400' : 
                             'bg-sky-900/30 border-sky-500/50 text-sky-400'
                          }`}>
                            {String(u.role)}
                          </span>
                       </td>
                       <td className="p-6 font-mono text-emerald-400 tracking-widest text-xl text-center font-bold">{u.passcode}</td>
                       <td className="p-6 text-center whitespace-nowrap">
                          {/* นำ opacity ออกเพื่อให้ปุ่มเห็นชัดตลอดเวลา */}
                          <div className="flex justify-center gap-2 transition-opacity">
                            <button onClick={()=>{setEditData(u); setModalOpen(true);}} className="text-sky-400 hover:text-white bg-slate-900 hover:bg-sky-600 p-3 rounded-xl border border-slate-700 hover:border-sky-500 transition-all shadow-sm">
                               <Edit size={20}/>
                            </button>
                            <button onClick={()=>handleDelete(u.id)} className="text-slate-400 hover:text-white bg-slate-900 hover:bg-red-600 p-3 rounded-xl border border-slate-700 hover:border-red-500 transition-all shadow-sm">
                               <Trash2 size={20}/>
                            </button>
                          </div>
                       </td>
                    </tr>
                  ))}
                  {units.length === 0 && <tr><td colSpan="5" className="p-20 text-center text-slate-500 text-xl border-dashed border-2 border-slate-700/50 m-4 rounded-3xl bg-slate-900/30">ไม่พบข้อมูลบัญชีผู้ใช้</td></tr>}
               </tbody>
            </table>
          </div>
       </div>

       {/* Modal เพิ่ม/แก้ไข บัญชี */}
       {isModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md overflow-y-auto">
             <div className="flex min-h-screen items-start justify-center p-4 md:p-8">
               <div className="my-auto relative transform overflow-hidden bg-slate-800 p-8 md:p-10 rounded-3xl w-full max-w-2xl text-left text-white shadow-2xl border border-slate-600 animate-fade-in-up">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-5">
                     <h3 className="text-3xl font-bold text-amber-500 flex items-center gap-4 tracking-wide">
                        <div className="bg-amber-500/20 p-3 rounded-2xl shadow-inner border border-amber-500/30">{editData?<Edit size={28}/>:<Plus size={28}/>}</div> 
                        {editData?'แก้ไขบัญชีผู้ใช้':'เพิ่มบัญชีใหม่'}
                     </h3>
                     <button onClick={()=>setModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-900 p-3 rounded-full transition-colors border border-slate-700 hover:bg-red-600 hover:border-red-500"><X size={24}/></button>
                  </div>
                  
                  <form onSubmit={handleSave} className="space-y-6">
                     <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700 space-y-5 shadow-inner">
                       <div>
                         <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-widest">ชื่อหน่วยงาน / ชื่อบัญชี <span className="text-red-500">*</span></label>
                         <input name="name" defaultValue={editData?.name} required className="w-full bg-slate-800 p-4 rounded-xl border border-slate-600 outline-none focus:border-amber-500 text-slate-100 transition-colors text-lg" placeholder="เช่น กก.กบ.ทหาร"/>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-widest">ระดับสิทธิ์ (Role) <span className="text-red-500">*</span></label>
                            <select name="role" defaultValue={editData?.role || 'user'} className="w-full bg-slate-800 p-4 rounded-xl border border-slate-600 outline-none focus:border-amber-500 transition-colors font-bold text-slate-200">
                               <option value="user">User (หน่วยงานปฏิบัติการ)</option>
                               <option value="executive">Executive (ผู้บริหาร)</option>
                               <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-widest">รหัสผ่าน (Passcode) <span className="text-red-500">*</span></label>
                            <input name="passcode" defaultValue={editData?.passcode} required className="w-full bg-slate-800 p-4 rounded-xl border border-slate-600 outline-none focus:border-amber-500 transition-colors font-mono text-emerald-400 font-bold tracking-widest text-lg" placeholder="ตั้งรหัสผ่าน..."/>
                          </div>
                       </div>
                     </div>

                     <div className="flex justify-end gap-4 pt-6 mt-8 border-t border-slate-700">
                       <button type="button" onClick={()=>setModalOpen(false)} className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors text-lg">ยกเลิก</button>
                       <button type="submit" className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.3)] transition-transform hover:-translate-y-1 flex items-center gap-3 text-lg"><Send size={22}/> บันทึกข้อมูลบัญชี</button>
                     </div>
                  </form>
               </div>
             </div>
          </div>
       )}
    </div>
  )
}

// ============================================================
// 9. Chatbot Assistant (Gemini / Offline)
// ============================================================
function Chatbot({ appDb }) {
  const [isOpen, setIsOpen] = useState(false); 
  const [messages, setMessages] = useState([]); 
  const [input, setInput] = useState(''); 
  const [isTyping, setIsTyping] = useState(false); 
  const messagesEndRef = useRef(null);

  useEffect(() => { 
    if (isOpen && messages.length === 0) {
      setMessages([{ sender: 'bot', text: 'สวัสดีครับ! ผมคือ Assistant ประจำระบบ J4 พิมพ์ "สรุปภาพรวม" เพื่อดูยอดงานทั้งหมดได้ครับ' }]); 
    }
  }, [isOpen]);
  
  useEffect(() => { 
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); 
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault(); 
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim(); 
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]); 
    setInput(''); 
    setIsTyping(true);

    // ระบบตอบโต้อัตโนมัติ (Rule-based)
    setTimeout(() => {
      setIsTyping(false); 
      const lo = userMsg.toLowerCase(); 
      let reply = "โหมด Assistant พื้นฐานรองรับคำสั่ง: \n- สรุปภาพรวม\n- งานที่ล่าช้า\n- ใกล้เสร็จ";
      
      if (lo.includes('สรุป') || lo.includes('ภาพรวม')) { 
        const avgProg = (appDb.policies||[]).length ? (appDb.reports||[]).reduce((a,b)=>a+(Number(b.progress_percent)||0),0)/(appDb.reports||[]).length : 0; 
        reply = `📊 ภาพรวมระบบ J4:\n\n- นโยบายทั้งหมด: ${(appDb.policies||[]).length} เรื่อง\n- ภารกิจย่อยทั้งหมด: ${(appDb.tasks||[]).length} ภารกิจ\n- ความคืบหน้าเฉลี่ยทั้งระบบ: ${avgProg.toFixed(1)}%`; 
      }
      else if (lo.includes('ช้า') || lo.includes('ปัญหา')) { 
        const delayed = (appDb.tasks||[]).filter(t=>t.status==='ล่าช้า/ติดปัญหา'); 
        reply = `⚠️ พบภารกิจที่ล่าช้า/ติดปัญหา จำนวน ${delayed.length} รายการ ${delayed.length > 0 ? `ได้แก่:\n\n${delayed.map(t=>`- ${t.task_name} (${t.primary_unit})`).join('\n')}` : 'ยอดเยี่ยม! ไม่มีงานล่าช้าเลยครับ'} `; 
      }
      else if (lo.includes('ใกล้เสร็จ')) { 
        const almost = (appDb.reports||[]).filter(r=>r.progress_percent >= 80 && r.progress_percent < 100).slice(0,3); 
        reply = `🎯 ข้อสั่งการที่ใกล้เสร็จ (Top 3):\n\n${almost.length > 0 ? almost.map(r=>`- [${r.progress_percent}%] ${r.policy_snippet}`).join('\n\n') : 'ยังไม่มีข้อสั่งการที่อยู่ในช่วง 80-99% ครับ'}`; 
      }
      
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 800);
  };

  return (
    <div className="print-hide fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {isOpen && (
        <div className="mb-5 w-[350px] md:w-[400px] bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl flex flex-col h-[550px] animate-fade-in-up overflow-hidden">
          <div className="bg-slate-900 p-4 md:p-5 border-b border-amber-500/20 flex justify-between items-center shadow-md z-10">
             <div className="flex gap-3 items-center">
               <div className="bg-amber-500/20 p-2.5 rounded-full border border-amber-500/30"><Bot className="text-amber-500" size={24}/></div>
               <div>
                 <h3 className="font-bold text-white text-sm md:text-base tracking-wide">J4 Assistant</h3>
                 <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse"></span> Online System</span>
               </div>
             </div>
             <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white bg-slate-800 border border-slate-700 hover:bg-red-500 hover:border-red-500 transition-colors p-2 rounded-full shadow-sm"><X size={18}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-slate-800/50">
            {messages.map((m, i) => (
               <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-5 py-3.5 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed shadow-md ${m.sender === 'user' ? 'bg-amber-600 text-white rounded-br-sm' : 'bg-slate-700 border border-slate-600 text-slate-100 rounded-bl-sm'}`}>{m.text}</div>
               </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="px-5 py-4 rounded-2xl bg-slate-700 border border-slate-600 rounded-bl-sm text-slate-400 text-xs flex gap-2 items-center shadow-md">
                  กำลังประมวลผล 
                  <span className="flex gap-1 ml-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'0.1s'}}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>
          
          <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-700 flex gap-3 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] z-10">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              disabled={isTyping} 
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-5 py-3.5 text-sm text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner" 
              placeholder="พิมพ์คำถามที่นี่..." 
            />
            <button type="submit" disabled={isTyping || !input.trim()} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-amber-600 p-4 rounded-xl text-white transition-all hover:scale-105 active:scale-95 shadow-lg">
              <Send size={20} className={input.trim() ? 'translate-x-0.5 -translate-y-0.5 transition-transform' : ''}/>
            </button>
          </form>
        </div>
      )}
      
      {!isOpen && (
         <button onClick={() => setIsOpen(true)} className="text-white rounded-full p-4 md:p-5 shadow-2xl hover:scale-110 transition-all border border-amber-500/50 bg-amber-600 hover:bg-amber-500 group relative">
            <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-20"></div>
            <MessageCircle size={28} className="group-hover:animate-pulse"/>
         </button>
      )}
    </div>
  );
}
