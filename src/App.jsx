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
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwgZZURz1cGNglxjEK-nGsm2g5cIT88GMG7gMkK2Zl2YydBCJyTlL65h8tcd63I2Z-R/exec";

const LOGO_URL = "/S__22413315.jpg";
const GARUDA_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Garuda_Emblem_of_Thailand.svg/150px-Garuda_Emblem_of_Thailand.svg.png";
const geminiApiKey = import.meta.env?.VITE_GEMINI_API_KEY || ''; 

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
    return new Date(d).toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }); 
  } 
  catch (e) { 
    return d; 
  } 
};

const getEscalationBadge = (endDate) => { 
  if (!endDate) return null; 
  const diffDays = Math.floor((new Date().setHours(0,0,0,0) - new Date(endDate)) / 86400000); 
  
  if (diffDays >= 15) {
    return { label: '🔥 วิกฤต (>15 วัน)', class: 'bg-red-600 text-white animate-pulse shadow-lg' }; 
  }
  if (diffDays >= 7) {
    return { label: '⚠️ รุนแรง (>7 วัน)', class: 'bg-orange-500 text-white' }; 
  }
  if (diffDays > 0) {
    return { label: '👀 เฝ้าระวัง', class: 'bg-amber-500 text-white' }; 
  }
  return null; 
};

const getDeadlineStatus = (endDate, status) => { 
  if (!endDate) return { label: '-', color: 'text-slate-400 bg-slate-800 border-slate-700' }; 
  if (status === 'เสร็จสิ้น') return { label: 'สำเร็จทันเวลา', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }; 
  
  const diffDays = Math.ceil((new Date(endDate) - new Date().setHours(0,0,0,0)) / 86400000); 
  
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
    <div className="flex justify-center items-center gap-4 mt-6 pb-4 print-hide">
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1} 
        className="p-2 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-30 text-slate-300 hover:bg-slate-700 transition-colors"
      >
        <ChevronLeft size={20}/>
      </button>
      
      <span className="text-sm text-slate-400">
        หน้า {currentPage} จาก {totalPages}
      </span>
      
      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages} 
        className="p-2 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-30 text-slate-300 hover:bg-slate-700 transition-colors"
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
      className={`flex items-center w-full px-4 py-3 rounded-lg transition-all ${
        isActive 
          ? 'bg-amber-600 text-white shadow-md' 
          : 'text-slate-400 hover:bg-slate-700'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="ml-3 font-medium truncate">{label}</span>
    </button>
  );
}

// ============================================================
// หน้าจอเข้าสู่ระบบ (Login Screen)
// ============================================================
function LoginScreen({ onLogin, isLoading, appDb, loadData, deployError }) {
  const accounts = appDb.units && appDb.units.length > 0 ? appDb.units : FALLBACK_ACCOUNTS;
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
      setLocalError('ไม่มีข้อมูลบัญชีในระบบ กรุณาตรวจสอบการตั้งค่า'); 
      return; 
    }
    
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    
    if (String(password) !== String(account.passcode)) { 
      setLocalError('รหัสผ่านไม่ถูกต้อง'); 
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>

      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 relative z-10 animate-fade-in-up">
        
        <div className="text-center mb-8">
          <div className="bg-white w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-5 p-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
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
          <h1 className="text-2xl font-bold text-slate-100">ระบบติดตามผลการปฏิบัติ</h1>
          <p className="text-amber-400 mt-2 text-sm font-medium tracking-wider uppercase">J4 Command Center</p>
        </div>

        {deployError === "PERMISSION" && (
          <div className="mb-6 bg-red-900/40 border border-red-500 p-4 rounded-xl text-left shadow-lg">
             <h3 className="text-red-400 font-bold text-sm mb-2 flex items-center gap-1.5">
               <AlertTriangle size={16}/> สิทธิ์เข้าถึงฐานข้อมูลถูกปฏิเสธ!
             </h3>
             <p className="text-xs text-slate-300 mb-2 leading-relaxed">
               กรุณาตั้งค่า Deploy ใน Google Apps Script ดังนี้:
             </p>
             <ol className="text-xs text-amber-200 list-decimal pl-4 space-y-1">
                <li>ไปที่ <b>Deploy</b> {'>'} <b>Manage deployments</b></li>
                <li>กดรูปดินสอ (แก้ไข) ด้านขวา</li>
                <li>ช่อง Version เลือกเป็น <b>New</b></li>
                <li>ช่อง Who has access เลือก <b>Anyone</b></li>
                <li>กดปุ่ม Deploy แล้วรีเฟรชหน้านี้</li>
             </ol>
          </div>
        )}

        {deployError === "NETWORK" && (
          <div className="mb-6 bg-red-900/40 border border-red-500 p-4 rounded-xl text-red-200 text-center text-sm flex items-center justify-center gap-2 shadow-lg">
            <AlertTriangle size={16}/> เชื่อมต่อข้อมูลล้มเหลว ตรวจสอบ URL หรือ อินเทอร์เน็ต
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-medium">เลือกบัญชีผู้ใช้งาน</label>
            <select 
              value={accountId} 
              onChange={(e) => { 
                setAccountId(e.target.value); 
                setLocalError(''); 
              }} 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-slate-100 outline-none focus:border-amber-500 transition-colors"
            >
              {accounts.length === 0 && <option value="">ไม่มีข้อมูล</option>}
              
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
            <label className="block text-slate-400 text-sm mb-2 font-medium flex items-center gap-2">
              <Lock size={14}/> รหัสผ่าน
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-slate-100 outline-none focus:border-amber-500 transition-colors tracking-widest font-mono" 
              placeholder="••••••••" 
            />
          </div>
          
          {localError && (
            <p className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded-lg border border-red-500/20">
              {localError}
            </p>
          )}
          
          {appDb.isLoaded && (!appDb.units || appDb.units.length === 0) && !deployError && (
            <div className="text-xs text-amber-500 bg-amber-500/10 p-3 rounded-xl text-center border border-amber-500/20">
              ⚠️ ใช้บัญชีสำรองฉุกเฉิน (ฐานข้อมูลยังว่างเปล่า)
            </div>
          )}
          
          <button 
            type="submit" 
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg mt-4 transition-all hover:scale-[1.02] active:scale-95"
          >
            เข้าสู่ระบบ
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-slate-700 pt-6">
           <button 
             onClick={loadData} 
             className="text-slate-500 text-xs hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto"
           >
             <RefreshCcw size={12}/> โหลดข้อมูลเชื่อมต่อใหม่
           </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// คอมโพเนนต์หลัก: App
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('DASHBOARD_POLICY');
  const [appDb, setAppDb] = useState({ 
    policies: [], 
    reports: [], 
    tasks: [], 
    units: [], 
    isLoaded: false 
  });
  const [toastData, setToastData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deployError, setDeployError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showToast = (msg, type = 'ok') => { 
    setToastData({ msg, type }); 
    setTimeout(() => setToastData(null), 3000); 
  };

  // ดึงข้อมูลทั้งหมดจาก Google Sheets พร้อมตรวจสอบ Error แบบละเอียด
  const loadData = async () => {
    setIsSyncing(true); 
    setDeployError(null);
    try {
      const actions = ['units', 'policies', 'reports', 'tasks'];
      
      const results = await Promise.all(actions.map(async (action) => {
        // เพิ่ม Cache buster `t` เพื่อให้ดึงข้อมูลล่าสุดเสมอ
        const url = `${SCRIPT_URL}?action=${action}&t=${Date.now()}`;
        
        const res = await fetch(url, { redirect: "follow" }); 
        const text = await res.text();
        
        // ถ้า Google ส่ง HTML Login กลับมา แปลว่าตั้งสิทธิ์ผิด
        if (text.trim().startsWith('<') || text.includes('<!DOCTYPE html>')) {
          throw new Error("PERMISSION");
        }
        
        return JSON.parse(text);
      }));

      setAppDb({ 
        units: results[0] || [], 
        policies: results[1] || [], 
        reports: results[2] || [], 
        tasks: results[3] || [], 
        isLoaded: true 
      });
    } catch (err) {
      console.error(err);
      setDeployError(err.message === "PERMISSION" ? "PERMISSION" : "NETWORK");
      showToast(err.message === "PERMISSION" ? "สิทธิ์เข้าถึงถูกบล็อก!" : "เชื่อมต่อไม่สำเร็จ", "error");
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

  const callApi = async (method, action, data, idKey, idValue) => {
    try {
      await fetch(SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors', // สำคัญมาก ป้องกันปัญหา CORS ตอน Post
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
        body: JSON.stringify({ method, action, data, idKey, idValue }) 
      });
      
      // หน่วงเวลาให้ Google Sheets บันทึกเสร็จก่อนดึงใหม่
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
    setView(role === 'executive' ? 'EXEC_SUMMARY' : 'DASHBOARD_POLICY');
  };

  const handleLogout = () => { 
    setUser(null); 
    setView('DASHBOARD_POLICY'); 
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

  const navigateTo = (viewName) => {
    setView(viewName);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; } 
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } } 
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; } 
        @media print { 
          .print-hide { display: none !important; } 
          .bg-slate-900, .bg-slate-800 { background: white !important; color: black !important; border: 1px solid #ccc !important; box-shadow: none !important; } 
          body { background: white !important; }
        }
      `}</style>
      
      {/* Sidebar - Desktop */}
      <aside className="print-hide fixed left-0 top-0 h-screen z-40 bg-slate-800 border-r border-slate-700 flex flex-col w-64 hidden lg:flex">
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-white">J4 Tracker</h1>
              <span className="text-[10px] text-amber-500 uppercase tracking-wider font-bold">G-Sheets App</span>
            </div>
          </div>
        </div>
        
        <div className="p-5 border-b border-slate-700 bg-slate-800/50">
          <p className="text-xs text-slate-400 mb-1">เข้าใช้งานในนาม:</p>
          <p className="font-bold text-amber-500 truncate text-sm bg-amber-500/10 py-1.5 px-3 rounded border border-amber-500/20">{user.unitName}</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 mb-2">ระบบรายงานผู้บริหาร</p>
          <NavItem icon={<LayoutDashboard size={20}/>} label="ภาพรวมนโยบาย" isActive={view==='DASHBOARD_POLICY'} onClick={()=>navigateTo('DASHBOARD_POLICY')} />
          <NavItem icon={<PieChart size={20}/>} label="ภาพรวมภารกิจ" isActive={view==='DASHBOARD_TASK'} onClick={()=>navigateTo('DASHBOARD_TASK')} />
          {isAdminOrExec && <NavItem icon={<Briefcase size={20}/>} label="บทสรุปผู้บริหาร" isActive={view==='EXEC_SUMMARY'} onClick={()=>navigateTo('EXEC_SUMMARY')} />}
          
          <div className="border-t border-slate-700/50 my-4"></div>
          
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">ระบบปฏิบัติการ</p>
          <NavItem icon={<ScrollText size={20}/>} label="ฐานข้อมูลนโยบาย" isActive={view==='POLICIES'} onClick={()=>navigateTo('POLICIES')} />
          {user.role !== 'executive' && <NavItem icon={<FilePlus size={20}/>} label="บันทึกรายงานผล" isActive={view==='REPORT_FORM'} onClick={()=>navigateTo('REPORT_FORM')} />}
          <NavItem icon={<HistoryIcon size={20}/>} label="ประวัติรายงานผล" isActive={view==='HISTORY'} onClick={()=>navigateTo('HISTORY')} />
          <NavItem icon={<CheckSquare size={20}/>} label="ติดตามภารกิจ (Tasks)" isActive={view==='TASKS'} onClick={()=>navigateTo('TASKS')} />
          
          {user.role === 'admin' && (
            <>
              <div className="border-t border-slate-700/50 my-4"></div>
              <NavItem icon={<Users size={20}/>} label="ตั้งค่าบัญชีใช้งาน" isActive={view==='UNITS_CONFIG'} onClick={()=>navigateTo('UNITS_CONFIG')} />
            </>
          )}
        </nav>
        
        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-red-600 hover:text-white text-slate-300 w-full py-3 rounded-lg transition-colors font-medium">
            <LogOut size={18}/> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div className="lg:hidden print-hide fixed top-0 left-0 right-0 h-16 bg-slate-800 border-b border-slate-700 z-50 flex items-center justify-between px-4">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center p-1"><img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" /></div>
            <h1 className="font-bold text-white">J4 Tracker</h1>
         </div>
         <button onClick={()=>setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 p-2">
            {isMobileMenuOpen ? <X size={24}/> : <List size={24}/>}
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden print-hide fixed inset-0 top-16 bg-slate-900 z-40 overflow-y-auto pb-20 animate-fade-in-up">
           <div className="p-4 border-b border-slate-800">
              <p className="text-xs text-slate-500 mb-1">บัญชีผู้ใช้:</p>
              <p className="text-amber-500 font-bold">{user.unitName}</p>
           </div>
           <div className="p-2 space-y-1">
              <NavItem icon={<LayoutDashboard size={20}/>} label="ภาพรวมนโยบาย" isActive={view==='DASHBOARD_POLICY'} onClick={()=>navigateTo('DASHBOARD_POLICY')} />
              <NavItem icon={<PieChart size={20}/>} label="ภาพรวมภารกิจ" isActive={view==='DASHBOARD_TASK'} onClick={()=>navigateTo('DASHBOARD_TASK')} />
              {isAdminOrExec && <NavItem icon={<Briefcase size={20}/>} label="บทสรุปผู้บริหาร" isActive={view==='EXEC_SUMMARY'} onClick={()=>navigateTo('EXEC_SUMMARY')} />}
              
              <div className="border-t border-slate-800 my-2"></div>
              
              <NavItem icon={<ScrollText size={20}/>} label="ฐานข้อมูลนโยบาย" isActive={view==='POLICIES'} onClick={()=>navigateTo('POLICIES')} />
              {user.role !== 'executive' && <NavItem icon={<FilePlus size={20}/>} label="บันทึกรายงานผล" isActive={view==='REPORT_FORM'} onClick={()=>navigateTo('REPORT_FORM')} />}
              <NavItem icon={<HistoryIcon size={20}/>} label="ประวัติรายงานผล" isActive={view==='HISTORY'} onClick={()=>navigateTo('HISTORY')} />
              <NavItem icon={<CheckSquare size={20}/>} label="ติดตามภารกิจ (Tasks)" isActive={view==='TASKS'} onClick={()=>navigateTo('TASKS')} />
              
              {user.role === 'admin' && <NavItem icon={<Users size={20}/>} label="ตั้งค่าผู้ใช้งาน" isActive={view==='UNITS_CONFIG'} onClick={()=>navigateTo('UNITS_CONFIG')} />}
              
              <div className="mt-8 p-4">
                <button onClick={()=>{setUser(null); setIsMobileMenuOpen(false);}} className="w-full bg-red-600 text-white py-3 rounded-lg flex items-center justify-center gap-2">
                  <LogOut size={18}/> ออกจากระบบ
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 lg:ml-64 pt-20 lg:pt-0 p-4 md:p-8 min-h-screen overflow-y-auto custom-scrollbar relative">
        <div className="max-w-7xl mx-auto pb-24">
          
          <div className="flex justify-between items-center mb-8 bg-slate-800/80 p-4 rounded-xl border border-slate-700 backdrop-blur-sm print-hide">
            <h2 className="text-slate-300 font-medium flex items-center gap-2 text-sm md:text-base">
              <ShieldCheck size={20} className="text-amber-500"/> ระบบอำนวยการ J4 Command Center
            </h2>
            <div className="flex items-center gap-3">
              {isSyncing && <span className="text-amber-500 text-xs font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-full"><RefreshCcw size={12} className="animate-spin"/> อัปเดตข้อมูล</span>}
              <button onClick={loadData} className="p-2 bg-slate-900 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700" title="ซิงค์ข้อมูลล่าสุด"><RefreshCcw size={16}/></button>
            </div>
          </div>

          {/* Router Views Management */}
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

      {/* Floating Toast Notification */}
      {toastData && (
        <div className="fixed top-6 right-6 z-[100] px-5 py-4 rounded-xl shadow-2xl border bg-slate-800 text-white flex items-center gap-3 animate-fade-in-up" style={{borderColor: toastData.type === 'ok' ? '#10b981' : '#ef4444'}}>
          {toastData.type === 'ok' ? <CheckCircle className="text-emerald-500" size={24}/> : <AlertTriangle className="text-red-500" size={24}/>}
          <span className="font-medium">{toastData.msg}</span>
        </div>
      )}

      <Chatbot appDb={appDb} />
    </div>
  );
}

// ============================================================
// 1. นโยบายและข้อสั่งการ (Dashboard)
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
      const rs = reps.filter(r => r.policy_id === po.policy_id).sort((a, b) => new Date(b.report_date || b.created_at) - new Date(a.report_date || a.created_at));
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
        <div className="bg-slate-900/80 p-4 rounded-lg text-center border border-slate-700 mt-2">
           <CalendarDays size={20} className="mx-auto text-slate-500 mb-2 opacity-50"/>
           <p className="text-slate-400 text-xs">ยังไม่มีการระบุไทม์ไลน์ภารกิจย่อยในนโยบายนี้</p>
        </div>
      );
    }

    const minDate = Math.min(...validTasks.map(t => new Date(t.start_date).getTime())); 
    const maxDate = Math.max(...validTasks.map(t => new Date(t.end_date).getTime()));
    const totalDuration = maxDate - minDate || 1; 

    return (
      <div className="bg-slate-900/80 p-4 rounded-lg mt-3 overflow-x-auto border border-slate-700/50 custom-scrollbar">
        <div className="min-w-[500px] space-y-3">
          <div className="flex border-b border-slate-700 pb-2 mb-2">
            <div className="w-1/3 text-amber-500 text-xs font-bold">ภารกิจย่อย</div>
            <div className="w-2/3 flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{formatDate(minDate)}</span>
              <span>{formatDate(maxDate)}</span>
            </div>
          </div>
          
          {validTasks.sort((a,b) => new Date(a.start_date) - new Date(b.start_date)).map(t => {
            const leftPercent = Math.max(0, ((new Date(t.start_date).getTime() - minDate) / totalDuration) * 100); 
            const widthPercent = Math.max(1, ((new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) / totalDuration) * 100);
            
            return (
              <div key={t.task_id} className="flex text-xs items-center group">
                <div className="w-1/3 truncate pr-3 flex flex-col">
                  <span className="text-slate-300 font-medium truncate" title={t.task_name}>{t.task_name}</span>
                  <span className="text-[9px] text-slate-500">{formatDate(t.start_date)} - {formatDate(t.end_date)}</span>
                </div>
                <div className="w-2/3 relative bg-slate-800 rounded h-5 border border-slate-700 overflow-hidden">
                  <div 
                    className={`absolute h-full rounded shadow flex items-center px-1 transition-all ${
                      t.status === 'เสร็จสิ้น' ? 'bg-emerald-500/80' : 
                      t.status === 'ล่าช้า/ติดปัญหา' ? 'bg-red-500/80 animate-pulse' : 
                      'bg-sky-500/80'
                    }`} 
                    style={{left: `${leftPercent}%`, width: `${widthPercent}%`, minWidth: '4px'}}
                    title={`${t.status} - ${t.progress_percent}%`}
                  >
                    {widthPercent > 10 && <span className="text-[9px] font-bold text-white drop-shadow truncate">{t.progress_percent}%</span>}
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
      const rs = baseReports.filter(r => r.policy_id === po.policy_id).sort((a,b) => new Date(b.report_date) - new Date(a.report_date));
      const prog = rs.length ? (rs[0].progress_percent || 0) : 0;
      return { 
        id: po.policy_id, 
        short: `[${po.policy_no||'-'}] ${po.order.substring(0,60)}...`, 
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
      <div className="mt-12 pt-8 border-t-2 border-slate-700/80">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl border border-amber-500/30">{icon}</div>
          <h2 className="text-2xl font-bold">{title}</h2>
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
             <div key={cmd} className="mb-10 bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
               <h3 className="text-xl font-bold text-sky-400 mb-6 flex items-center gap-2">
                 <ShieldCheck size={20}/> ผู้สั่งการ: {cmd} 
                 <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-400 border border-slate-700 ml-2">ทั้งหมด {cList.length} เรื่อง</span>
               </h3>

               <div className="grid lg:grid-cols-12 gap-8">
                 <div className="lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col items-center">
                    <h4 className="font-bold mb-6 text-slate-300 w-full text-center">สัดส่วนความคืบหน้า</h4>
                    
                    <div className="w-48 h-48 rounded-full mb-6 cursor-pointer transform hover:scale-105 transition-all shadow-lg relative" onClick={() => setSelectedStatus(null)} style={{ background: cList.length > 0 ? `conic-gradient(${bgDonut})` : '#334155' }}>
                       <div className="absolute inset-0 m-auto w-32 h-32 bg-slate-800 rounded-full flex flex-col items-center justify-center border-4 border-slate-800 shadow-inner">
                         <span className="font-bold text-3xl">{cList.length}</span>
                         <span className="text-[10px] text-slate-400">ข้อสั่งการ</span>
                       </div>
                    </div>

                    <div className="w-full text-xs space-y-2 mt-auto">
                       {statsCount.map(s => (
                         <div key={s.n} onClick={() => setSelectedStatus(s.n === selectedStatus ? null : s.n)} className={`flex justify-between items-center p-2.5 rounded-lg cursor-pointer transition-colors border ${selectedStatus === s.n ? 'bg-slate-700 border-amber-500' : 'border-transparent hover:bg-slate-700/50'}`}>
                           <div className="flex items-center gap-2">
                             <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: STATUS_COLORS[s.n] }}></span>
                             <span className={selectedStatus === s.n ? 'text-amber-400 font-bold' : 'text-slate-300'}>{s.n}</span>
                           </div>
                           <span className="font-bold text-slate-100">{s.v}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="lg:col-span-8 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col">
                    <h4 className="font-bold mb-6 text-slate-300 flex justify-between items-center">
                      รายการข้อสั่งการ 
                      {selectedStatus && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-1 rounded border border-amber-500/30 font-normal">กรอง: {selectedStatus}</span>}
                    </h4>
                    <div className="flex-1 overflow-y-auto max-h-[400px] space-y-4 pr-2 custom-scrollbar">
                       {filtered.map(p => (
                         <div key={p.id} className={`p-4 rounded-xl border transition-all ${expandedPolicyId === p.id ? 'bg-slate-700/50 border-amber-500 shadow-lg' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                           <div className="flex justify-between cursor-pointer group" onClick={() => setExpandedPolicyId(expandedPolicyId === p.id ? null : p.id)}>
                             <div className="text-sm font-medium text-slate-200 pr-4 leading-relaxed flex items-start gap-1.5">
                               {p.is_important && <Star size={14} className="shrink-0 text-amber-500 fill-amber-500 mt-0.5"/>}
                               <span className="group-hover:text-amber-400 transition-colors" title={p.order}>{p.short}</span>
                             </div>
                             <div className="flex flex-col items-end shrink-0">
                               <span className="font-mono font-bold text-lg" style={{ color: getBarColor(p.prog) }}>{p.prog}%</span>
                               {expandedPolicyId === p.id ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
                             </div>
                           </div>
                           
                           <div className="w-full bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden border border-slate-700">
                             <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.prog}%`, background: getBarColor(p.prog) }}></div>
                           </div>
                           
                           {p.tCount > 0 && !expandedPolicyId && (
                             <p className="text-[10px] text-sky-400 mt-3 flex items-center gap-1"><GitMerge size={12}/> มีภารกิจย่อย {p.tCount} งาน (คลิกเพื่อดูไทม์ไลน์)</p>
                           )}
                           
                           {expandedPolicyId === p.id && renderTimeline(p.id)}
                         </div>
                       ))}
                       {filtered.length === 0 && <p className="text-center text-sm text-slate-500 py-10">ไม่พบข้อสั่งการตามเงื่อนไขที่เลือก</p>}
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
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md print-hide gap-4">
        <div>
          <h2 className="text-2xl font-bold flex gap-2 text-amber-500"><LayoutDashboard size={28} /> ภาพรวมนโยบายและข้อสั่งการ</h2>
          <p className="text-sm text-slate-400 mt-1">คลิกที่กราฟโดนัทเพื่อคัดกรอง หรือ <b className="text-amber-400">คลิกที่ชื่อนโยบาย</b> เพื่อดู Timeline</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {selectedStatus && (
            <button onClick={() => setSelectedStatus(null)} className="text-sm font-bold bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2">
              <FilterX size={16}/> ล้างตัวกรอง
            </button>
          )}
          <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} disabled={!isAdminOrExec} className="flex-1 md:w-auto bg-slate-900 p-3 rounded-lg border border-slate-600 text-sm font-medium outline-none focus:border-amber-500 disabled:opacity-50">
            <option value="ALL">ทุกหน่วยงาน</option>
            {(appDb.units||[]).filter(u => u.role === 'user' || !u.role).map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
          </select>
          <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} className="flex-1 md:w-auto bg-slate-900 p-3 rounded-lg border border-slate-600 text-sm font-medium outline-none focus:border-amber-500">
            <option value="ALL">ทุกปีงบประมาณ</option>
            <option value="2567">ปีงบประมาณ 2567</option>
            <option value="2568">ปีงบประมาณ 2568</option>
            <option value="2569">ปีงบประมาณ 2569</option>
          </select>
          <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg transition-colors shadow-lg" title="พิมพ์รายงานภาพรวม">
            <Printer size={18}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print-hide">
        {[
          { l: 'ข้อสั่งการรวม', v: overallStats.total, s: null, c: 'text-white', bg: 'bg-slate-800 border-slate-600' },
          { l: 'เสร็จสมบูรณ์', v: overallStats.completed, s: 'เสร็จแล้ว (100%)', c: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/50' },
          { l: 'กำลังดำเนินการ', v: overallStats.inProgress, s: 'ดำเนินการต่อเนื่อง (51-90%)', c: 'text-sky-400', bg: 'bg-sky-950/30 border-sky-500/50' },
          { l: 'ยังไม่คืบหน้า (0%)', v: overallStats.notStarted, s: 'ต่ำกว่าเกณฑ์ (0-20%)', c: 'text-red-400', bg: 'bg-red-950/30 border-red-500/50' }
        ].map(k => (
          <div key={k.l} onClick={() => setSelectedStatus(k.s)} className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:-translate-y-1 shadow-lg relative group ${selectedStatus === k.s ? 'ring-2 ring-offset-2 ring-offset-slate-900 border-transparent ' + k.bg : k.bg}`}>
            <MousePointerClick size={16} className={`absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity ${k.c}`}/>
            <p className="text-slate-400 text-sm font-medium">{k.l}</p>
            <h3 className={`text-4xl font-bold mt-2 ${k.c}`}>{k.v}</h3>
          </div>
        ))}
      </div>

      <div className="space-y-12">
        {renderSection('นโยบายหลัก', <ShieldCheck size={32}/>, basePolicies.filter(p => p.category === 'นโยบายหลัก'))}
        {renderSection('สั่งการเพิ่มเติม', <FileText size={32}/>, basePolicies.filter(p => p.category === 'สั่งการเพิ่มเติม'))}
        
        {basePolicies.length === 0 && (
          <div className="text-center py-20 text-slate-500 bg-slate-800 rounded-xl border border-slate-700 border-dashed">
            <LayoutDashboard size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">ไม่พบข้อมูลนโยบายหรือข้อสั่งการในระบบ</p>
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
    const completedTasks = baseTasks.filter(t => t.status === 'เสร็จสิ้น').length;
    const delayedTasks = baseTasks.filter(t => t.status === 'ล่าช้า/ติดปัญหา').length;
    const avgProgress = totalTasks > 0 ? baseTasks.reduce((a, b) => a + (Number(b.progress_percent) || 0), 0) / totalTasks : 0;
    
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
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 print-hide flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
        <div>
          <h2 className="text-xl font-bold flex gap-2 text-amber-500"><PieChart size={24}/> ภาพรวมการปฏิบัติภารกิจ (Tasks)</h2>
          <p className="text-sm text-slate-400 mt-1">คลิกที่แผนภูมิเพื่อคัดกรองข้อมูล</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {(selectedStatus || selectedRootCause) && (
            <button onClick={clearFilters} className="text-sm font-bold bg-red-500/20 text-red-400 px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-red-500 hover:text-white transition-colors shadow-sm">
              <FilterX size={16}/> ล้างตัวกรอง
            </button>
          )}
          <select value={filterUnit} onChange={e => {setFilterUnit(e.target.value); clearFilters();}} disabled={!isAdminOrExec} className="flex-1 md:w-auto bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm disabled:opacity-50 outline-none focus:border-amber-500">
            <option value="ALL">ทุกหน่วยงาน</option>
            {currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
          </select>
          <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} className="flex-1 md:w-auto bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm outline-none focus:border-amber-500">
            <option value="ALL">ทุกปีงบประมาณ</option>
            <option value="2567">ปีงบประมาณ 2567</option>
            <option value="2568">ปีงบประมาณ 2568</option>
          </select>
          <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg shadow-md transition-colors" title="พิมพ์รายงาน">
            <Printer size={18}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ภารกิจรวม', val: stats.totalTasks, status: null, color: 'text-white', border: 'border-slate-600', bg: 'bg-slate-800' },
          { label: 'เสร็จสมบูรณ์', val: stats.completedTasks, status: 'เสร็จสิ้น', color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-950/30' },
          { label: 'กำลังดำเนินการ', val: baseTasks.filter(t=>t.status==='กำลังดำเนินการ').length, status: 'กำลังดำเนินการ', color: 'text-sky-400', border: 'border-sky-500/50', bg: 'bg-sky-950/30' },
          { label: 'ล่าช้า/ติดปัญหา', val: stats.delayedTasks, status: 'ล่าช้า/ติดปัญหา', color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-950/30' }
        ].map(kpi => (
          <div key={kpi.label} onClick={() => { setSelectedStatus(kpi.status); setSelectedRootCause(null); }} className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:-translate-y-1 shadow-lg relative group ${selectedStatus === kpi.status ? `ring-2 ring-offset-2 ring-offset-slate-900 border-transparent ${kpi.bg}` : `border-slate-700 bg-slate-800 hover:${kpi.border}`}`}>
             <MousePointerClick size={16} className={`absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity ${kpi.color}`}/>
             <p className="text-slate-400 text-sm font-medium">{kpi.label}</p>
             <h3 className={`text-4xl font-bold mt-2 ${kpi.color}`}>{kpi.val}</h3>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         <div className="lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col items-center">
            <h3 className="font-bold w-full mb-6 text-slate-300 text-center text-lg">สัดส่วนสถานะงาน</h3>
            <div className="relative w-56 h-56 rounded-full mb-8 cursor-pointer transform hover:scale-105 transition-all shadow-xl" onClick={() => { setSelectedStatus(null); setSelectedRootCause(null); }} style={{ background: stats.totalTasks > 0 ? `conic-gradient(${donutGradientStops})` : '#334155' }}>
               <div className="absolute inset-0 m-auto w-36 h-36 bg-slate-800 rounded-full flex flex-col items-center justify-center border-4 border-slate-800 shadow-inner">
                 <span className="text-4xl font-bold">{stats.totalTasks}</span>
                 <span className="text-xs text-slate-400 mt-1">ภารกิจ</span>
               </div>
            </div>
            <div className="w-full space-y-2 mt-auto">
               {stats.statusCount.map(s => (
                 <div key={s.name} onClick={() => { setSelectedStatus(s.name === selectedStatus ? null : s.name); setSelectedRootCause(null); }} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer border transition-colors ${selectedStatus === s.name ? 'bg-slate-700 border-amber-500' : 'border-transparent hover:bg-slate-700/50'}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ background: TASK_STATUS_COLORS[s.name] }}></span>
                      <span className={`font-medium ${selectedStatus === s.name ? 'text-amber-400 font-bold' : ''}`}>{s.name}</span>
                    </div>
                    <span className="font-bold text-lg">{s.value}</span>
                 </div>
               ))}
               {stats.statusCount.length === 0 && <p className="text-center text-slate-500 text-sm">ไม่มีข้อมูล</p>}
            </div>
         </div>
         
         <div className="lg:col-span-8 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col">
            <h3 className="font-bold mb-6 flex gap-2 text-lg items-center border-b border-slate-700 pb-4">
              <AlertOctagon size={24} className="text-red-500"/> วิเคราะห์สาเหตุความล่าช้า 
              {selectedRootCause && <span className="text-[10px] bg-red-500/20 text-red-400 px-3 py-1 rounded-full ml-2 font-normal border border-red-500/30">กรอง: {selectedRootCause}</span>}
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4 max-h-[400px]">
               {stats.rootCausesArray.map((rc, i) => {
                 const maxVal = Math.max(...stats.rootCausesArray.map(x => x.count), 1);
                 const pct = (rc.count / maxVal) * 100;
                 const isSelected = selectedRootCause === rc.cause;
                 return (
                   <div key={i} onClick={() => { setSelectedRootCause(isSelected ? null : rc.cause); setSelectedStatus('ล่าช้า/ติดปัญหา'); }} className={`group cursor-pointer p-3 rounded-xl transition-all border ${isSelected ? 'border-red-500 bg-red-950/30 shadow-md' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}>
                     <div className="flex justify-between text-sm mb-2 items-center">
                       <span className={`truncate pr-4 flex items-center gap-2 ${isSelected ? 'text-red-400 font-bold' : 'text-slate-300 font-medium'}`}>{rc.cause}</span>
                       <span className="font-bold text-slate-100 bg-slate-800 px-2 py-1 rounded">{rc.count} งาน</span>
                     </div>
                     <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                       <div className={`h-full rounded-full transition-all duration-1000 ease-out relative ${isSelected ? 'bg-red-500' : 'bg-red-500/60 group-hover:bg-red-400'}`} style={{ width: `${pct}%` }}>
                          <div className="absolute inset-0 bg-white/20"></div>
                       </div>
                     </div>
                   </div>
                 );
               })}
               {stats.rootCausesArray.length === 0 && (
                 <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                   <CheckCircle size={40} className="mx-auto mb-3 opacity-20 text-emerald-500"/>
                   <p className="text-lg font-medium">ยอดเยี่ยม! ไม่มีข้อมูลภารกิจที่ล่าช้า</p>
                 </div>
               )}
            </div>
         </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl theme-transition">
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
              {filteredTasksList.map(t => (
                <tr key={t.task_id} className="hover:bg-slate-700/40 transition-colors align-top">
                  <td className="p-5 text-slate-200">
                    <p className="font-bold text-base leading-relaxed mb-1" title={t.task_name}>{t.task_name}</p>
                    <p className="text-xs text-slate-500 font-mono mb-2"><Clock size={12} className="inline mr-1"/> กำหนด: {formatDate(t.start_date)} - {formatDate(t.end_date)}</p>
                    {t.status === 'ล่าช้า/ติดปัญหา' && t.root_cause && (
                      <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-900/50 p-2 rounded-md mt-2 inline-block">
                        <span className="font-bold"><AlertOctagon size={12} className="inline mr-1"/>สาเหตุ:</span> {t.root_cause}
                      </div>
                    )}
                  </td>
                  <td className="p-5 text-sm font-medium text-sky-400 whitespace-nowrap">{t.primary_unit}</td>
                  <td className="p-5 text-center whitespace-nowrap">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>{t.status}</span>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col items-center gap-2 mt-1">
                      <span className="text-lg font-bold font-mono" style={{ color: getBarColor(t.progress_percent) }}>{t.progress_percent}%</span>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                        <div className="h-full rounded-full transition-all duration-1000 relative" style={{ width: `${t.progress_percent}%`, backgroundColor: getBarColor(t.progress_percent) }}>
                           <div className="absolute inset-0 bg-white/20"></div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTasksList.length === 0 && (
                <tr><td colSpan={4} className="p-12 text-center text-slate-500 text-lg">ไม่มีข้อมูลภารกิจตามเงื่อนไขที่เลือก</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 3. บทสรุปผู้บริหาร (Executive Summary)
// ============================================================
function ExecutiveSummary({ appDb }) {
  const [fiscalYear, setFiscalYear] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState(null);

  const stats = useMemo(() => {
    const unitStats = {}; 
    (appDb.units||[]).filter(u => u.role === 'user' || !u.role).forEach(u => { 
      unitStats[u.name] = { totalPolicies: 0, progressSum: 0, completed: 0, reports: 0, policyNames: [] }; 
    });

    const policies = appDb.policies || [];
    let reports = appDb.reports || [];

    if (fiscalYear !== 'ALL') {
      const dates = getFiscalYearDates(fiscalYear);
      reports = reports.filter(r => {
        const d = new Date(r.report_date || r.created_at);
        return d >= new Date(dates.start) && d <= new Date(dates.end);
      });
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
      if (!latestReports[key] || new Date(r.report_date) > new Date(latestReports[key].report_date)) {
        latestReports[key] = r;
      }
    });

    Object.values(latestReports).forEach(r => {
      if (unitStats[r.unit_name]) {
        unitStats[r.unit_name].progressSum += r.progress_percent;
        unitStats[r.unit_name].reports += 1;
        if (r.progress_percent === 100) unitStats[r.unit_name].completed += 1;
      }
    });

    const unitArray = Object.entries(unitStats).map(([name, data]) => ({
      name, 
      ...data, 
      avgProgress: data.reports > 0 ? (data.progressSum / data.reports) : 0
    })).filter(u => u.totalPolicies > 0 || u.reports > 0).sort((a,b) => b.avgProgress - a.avgProgress);

    const problemReports = reports.filter(r => r.problems && r.problems.trim().length > 2 && r.problems.trim() !== '-').sort((a, b) => new Date(b.report_date || b.created_at) - new Date(a.report_date || a.created_at));

    const today = new Date();
    today.setHours(0,0,0,0);
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

    return { 
      unitArray, problemReports, totalPolicies: policies.length, 
      totalReports: approvedReports.length, todayUpdatesCount, 
      trendData, maxTrendCount, importantPolicies, importantTasks 
    };
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
      "หน่วยงาน": u.name, 
      "นโยบาย/ข้อสั่งการที่รับผิดชอบ": u.totalPolicies, 
      "รายงานที่อนุมัติแล้ว": u.reports,
      "ความคืบหน้าเฉลี่ย (%)": u.avgProgress.toFixed(2), 
      "ภารกิจเสร็จสมบูรณ์ (รายการ)": u.completed
    }));
    exportToExcel(dataToExport, filename);
  };

  return (
    <div className="space-y-8 animate-fade-in-up text-slate-100">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg gap-4 print-hide">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30 shadow-inner">
            <Briefcase size={32} className="text-amber-500"/>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">บทสรุปผู้บริหาร</h2>
            <p className="text-sm text-amber-400 mt-1 font-medium">Executive Summary Dashboard</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {selectedUnit && (
             <button onClick={() => setSelectedUnit(null)} className="text-sm font-bold bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2">
               <FilterX size={16}/> ล้างการกรองหน่วย
             </button>
          )}
          <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} className="flex-1 lg:w-auto bg-slate-900 border border-slate-600 rounded-xl p-3 text-sm outline-none focus:border-amber-500 transition-colors">
             <option value="ALL">ทุกปีงบประมาณ</option>
             <option value="2567">ปีงบประมาณ 2567</option>
             <option value="2568">ปีงบประมาณ 2568</option>
             <option value="2569">ปีงบประมาณ 2569</option>
          </select>
          <button onClick={handleExportSummaryExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5">
             <Table size={18}/> ส่งออก Excel
          </button>
          <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5">
             <Printer size={18}/> พิมพ์รายงาน
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print-hide">
        <div className="bg-gradient-to-br from-amber-600/90 to-amber-800/90 p-6 rounded-2xl border border-amber-500/30 shadow-xl text-white relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-20 transform group-hover:scale-110 transition-transform"><Trophy size={120}/></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-amber-100 font-bold tracking-wider"><Star size={16} className="fill-amber-100"/> หน่วยงานยอดเยี่ยม</div>
            {stats.unitArray.length > 0 ? (
               <div>
                  <p className="text-3xl font-bold mb-1 truncate" title={stats.unitArray[0].name}>{stats.unitArray[0].name}</p>
                  <p className="text-amber-200 text-sm font-medium">ความคืบหน้าเฉลี่ย {stats.unitArray[0].avgProgress.toFixed(1)}%</p>
               </div>
            ) : <p className="text-sm text-amber-200 py-2">ยังไม่มีข้อมูล</p>}
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
           <div className="absolute right-0 bottom-0 opacity-5"><FileText size={120}/></div>
           <p className="text-slate-400 text-sm font-bold tracking-wider mb-2 relative z-10 uppercase">การรายงานความคืบหน้า</p>
           <h3 className="text-5xl font-bold text-white tracking-tight relative z-10">
             {stats.totalReports} <span className="text-lg font-normal text-slate-500 ml-1">ฉบับ</span>
           </h3>
        </div>
        
        <div className="bg-sky-900/20 p-6 rounded-2xl border border-sky-500/30 shadow-xl relative overflow-hidden">
           <div className="absolute right-0 bottom-0 opacity-5 text-sky-500"><Activity size={120}/></div>
           <p className="text-sky-400 text-sm font-bold tracking-wider mb-2 relative z-10 uppercase">อัปเดตล่าสุด (วันนี้)</p>
           <h3 className="text-5xl font-bold text-sky-400 tracking-tight relative z-10">
             {stats.todayUpdatesCount} <span className="text-lg font-normal text-sky-700 ml-1">รายการ</span>
           </h3>
        </div>
      </div>

      {/* Priority Section */}
      {(stats.importantPolicies.length > 0 || stats.importantTasks.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* ปักหมุดนโยบาย */}
          <div className="bg-slate-800/50 rounded-2xl border-t-4 border-amber-500 shadow-xl p-6 relative overflow-hidden">
            <h3 className="text-xl font-bold text-amber-500 flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
              <Star size={24} className="fill-amber-500" /> นโยบาย/ข้อสั่งการสำคัญ (Priority)
            </h3>
            <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
              {stats.importantPolicies.map(p => {
                const reps = (appDb.reports || []).filter(r => r.policy_id === p.policy_id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                const progress = reps.length > 0 ? reps[0].progress_percent : 0;
                return (
                  <div key={p.policy_id} className="p-5 bg-slate-900/80 rounded-xl border border-slate-700/50 shadow-sm hover:border-amber-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold text-sky-400 bg-sky-900/30 px-2 py-1 rounded">[{p.policy_no}] {p.commander}</span>
                      <span className="text-lg font-mono font-bold" style={{ color: getBarColor(progress) }}>{progress}%</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed line-clamp-3 mb-4" title={p.order}>{p.order}</p>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                      <div className="h-full rounded-full transition-all duration-1000 relative" style={{ width: `${progress}%`, backgroundColor: getBarColor(progress) }}>
                         <div className="absolute inset-0 bg-white/20"></div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3 font-medium">หน่วยรับผิดชอบ: <span className="text-amber-400 font-bold">{p.primary_unit}</span></p>
                  </div>
                );
              })}
              {stats.importantPolicies.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                  <Star size={32} className="mx-auto mb-2 opacity-20"/>
                  <p>ไม่มีนโยบายที่ถูกปักหมุดไว้</p>
                </div>
              )}
            </div>
          </div>

          {/* ปักหมุดภารกิจ */}
          <div className="bg-slate-800/50 rounded-2xl border-t-4 border-sky-500 shadow-xl p-6 relative overflow-hidden">
            <h3 className="text-xl font-bold text-sky-400 flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
              <CheckSquare size={24} className="text-sky-400" /> ภารกิจสำคัญ (Priority Tasks) 
              {selectedUnit && <span className="text-xs bg-sky-900/50 px-3 py-1 rounded-full text-sky-300 font-normal border border-sky-500/30">{selectedUnit}</span>}
            </h3>
            <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
              {filteredPriorityTasks.map(t => {
                const deadline = getDeadlineStatus(t.end_date, t.status);
                return (
                  <div key={t.task_id} className="p-5 bg-slate-900/80 rounded-xl border border-slate-700/50 shadow-sm hover:border-sky-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>{t.status}</span>
                      <span className="text-lg font-mono font-bold" style={{ color: getBarColor(t.progress_percent) }}>{t.progress_percent}%</span>
                    </div>
                    <p className="text-sm font-bold text-slate-100 leading-relaxed mb-4">{t.task_name}</p>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                      <div className="h-full rounded-full transition-all duration-1000 relative" style={{ width: `${t.progress_percent}%`, backgroundColor: getBarColor(t.progress_percent) }}>
                         <div className="absolute inset-0 bg-white/20"></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                       <p className="text-[10px] text-slate-500 font-medium">หน่วย: <span className="text-sky-400 font-bold">{t.primary_unit}</span></p>
                       <span className={`text-[10px] px-2 py-1 rounded border ${deadline.color} flex items-center gap-1.5 font-medium`}>
                         <Clock size={12} /> {deadline.label}
                       </span>
                    </div>
                  </div>
                );
              })}
              {filteredPriorityTasks.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                  <CheckSquare size={32} className="mx-auto mb-2 opacity-20"/>
                  <p>ไม่มีภารกิจสำคัญสำหรับหน่วยที่เลือก</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6 md:p-8">
          <h3 className="text-xl font-bold text-amber-500 mb-6 flex items-center gap-3 border-b border-slate-700 pb-4">
            <TrendingUp size={24} /> ตารางจัดอันดับความสำเร็จ (Leaderboard)
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-3">
            {stats.unitArray.map((u, index) => {
              const isSelected = selectedUnit === u.name;
              return (
                <div 
                  key={u.name} 
                  onClick={() => setSelectedUnit(isSelected ? null : u.name)}
                  className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-5 cursor-pointer transition-all duration-300 shadow-sm
                    ${isSelected ? 'bg-slate-700/80 border-amber-500 shadow-md ring-1 ring-amber-500/50' : 'bg-slate-900/50 border-slate-700/50 hover:border-amber-500/30 hover:bg-slate-800/80'}
                  `} 
                >
                  <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-bold text-xl shrink-0 shadow-inner
                    ${isSelected ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 
                      index === 0 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' :
                      index === 1 ? 'bg-slate-300/20 text-slate-300 border-slate-400/50' :
                      index === 2 ? 'bg-orange-700/20 text-orange-400 border-orange-700/50' :
                      'bg-slate-800 border-slate-600 text-slate-400'}
                  `}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex justify-between items-end mb-2">
                      <h4 className={`font-bold text-base md:text-lg truncate ${isSelected ? 'text-amber-400' : 'text-slate-100'}`}>{u.name}</h4>
                      <span className="text-xl font-mono font-bold" style={{ color: getBarColor(u.avgProgress) }}>{u.avgProgress.toFixed(1)}%</span>
                    </div>
                    
                    <p className="text-xs text-slate-400 mb-3 font-medium">รับผิดชอบ <b className="text-slate-300">{u.totalPolicies}</b> เรื่อง | <b className="text-emerald-400">เสร็จ {u.completed}</b></p>
                    
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                      <div className="h-full rounded-full transition-all duration-1000 relative" style={{ width: `${u.avgProgress}%`, backgroundColor: getBarColor(u.avgProgress) }}>
                         <div className="absolute inset-0 bg-white/20"></div>
                      </div>
                    </div>
                    
                    {/* แสดงรายละเอียดงานเมื่อกดเลือก */}
                    {isSelected && u.policyNames && u.policyNames.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-700/50 animate-fade-in-up">
                        <p className="text-[11px] text-amber-500 font-bold mb-2 uppercase tracking-wider">นโยบาย/ข้อสั่งการที่รับผิดชอบ:</p>
                        <ul className="list-disc pl-5 space-y-1.5">
                          {u.policyNames.map((pn, i) => (
                            <li key={i} className="text-xs text-slate-300 leading-relaxed">{pn}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {stats.unitArray.length === 0 && (
              <div className="text-center text-slate-500 py-16 border-2 border-dashed border-slate-700 rounded-xl">
                 <p className="text-lg">ยังไม่มีข้อมูลการปฏิบัติงานเพื่อใช้จัดอันดับ</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          {/* Trend Chart */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6 print-hide relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-5"><Activity size={100}/></div>
            <h3 className="text-base font-bold text-slate-300 mb-6 flex items-center gap-2 relative z-10">
              <Activity size={20} className="text-sky-400"/> แนวโน้มส่งรายงานผลย้อนหลัง 7 วัน
            </h3>
            <div className="flex items-end justify-between gap-3 h-36 mt-2 relative z-10">
              {stats.trendData.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 gap-2 group">
                  <div className="text-xs text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold bg-sky-900/50 px-2 py-0.5 rounded border border-sky-500/30">{d.count}</div>
                  <div className="w-full bg-slate-700 rounded-t-md relative overflow-hidden group-hover:bg-slate-600 transition-colors" style={{ height: '100%' }}>
                     <div className="absolute bottom-0 w-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] transition-all duration-700 ease-out group-hover:bg-amber-400" style={{ height: `${(d.count / stats.maxTrendCount) * 100}%`, minHeight: d.count > 0 ? '4px' : '0px' }}></div>
                  </div>
                  <div className="text-[10px] text-slate-400 whitespace-nowrap overflow-hidden text-center w-full font-medium">{d.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Problem Reports List */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6">
            <h3 className="text-lg font-bold text-red-500 mb-6 flex items-center gap-2 border-b border-slate-700 pb-3">
              <AlertTriangle size={22} /> ประเด็นข้อขัดข้องสำคัญล่าสุด
              {selectedUnit && <span className="text-[10px] bg-red-900/50 px-2.5 py-1 rounded-full text-red-300 font-normal ml-auto border border-red-500/30">กรอง: {selectedUnit}</span>}
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {filteredProblems.map(r => (
                <div key={r.report_id} className="p-5 bg-red-950/20 border border-red-900/40 rounded-xl relative shadow-sm hover:border-red-500/50 transition-colors">
                  <div className="absolute top-5 right-5 text-[10px] font-mono text-slate-500">{formatDate(r.report_date || r.created_at)}</div>
                  <span className="inline-block px-2.5 py-1 bg-slate-900 text-amber-500 text-[10px] font-bold rounded border border-slate-700 mb-3 shadow-sm">{r.unit_name}</span>
                  
                  <h4 className="text-sm font-bold text-slate-200 mb-3 pr-16 line-clamp-2 leading-relaxed" title={r.policy_snippet}>
                    <span className="text-sky-400">[{r.policy_no || '-'}]</span> {r.policy_snippet}
                  </h4>
                  
                  <div className="bg-red-950/40 p-3.5 rounded-lg border border-red-900/30 shadow-inner">
                    <p className="text-xs text-red-400 leading-relaxed"><span className="font-bold flex items-center gap-1 mb-1 text-red-500"><AlertOctagon size={12}/> ปัญหา:</span> {r.problems}</p>
                  </div>
                  
                  {r.next_plan && r.next_plan !== '-' && (
                    <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-700/50 leading-relaxed">
                      <span className="font-bold text-emerald-500 flex items-center gap-1 mb-1"><TrendingUp size={12}/> แผนแก้ไข:</span> {r.next_plan}
                    </p>
                  )}
                </div>
              ))}
              {filteredProblems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                  <CheckCircle size={40} className="text-emerald-500/30 mb-3" />
                  <p className="text-sm font-medium">ไม่พบรายงานข้อขัดข้องในขณะนี้</p>
                </div>
              )}
            </div>
          </div>
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg gap-4">
        <h2 className="text-2xl font-bold flex gap-3 text-amber-500 items-center">
          <div className="bg-amber-500/20 p-2 rounded-xl"><ScrollText size={28} /></div> 
          ฐานข้อมูลข้อสั่งการ
        </h2>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[250px] shadow-sm">
             <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
             <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาเนื้อหา, ผู้สั่งการ, หน่วยงาน..." className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-12 pr-4 py-3 text-sm outline-none text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"/>
          </div>
          {isAdmin && (
            <button onClick={()=>{setEditData(null);setModalOpen(true);}} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5">
              <Plus size={18}/> เพิ่มข้อสั่งการใหม่
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left text-slate-200">
             <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700 uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-5 font-bold w-16 text-center">ลำดับ</th>
                  <th className="p-5 font-bold whitespace-nowrap w-32">ผู้สั่งการ</th>
                  <th className="p-5 font-bold min-w-[400px]">รายละเอียดข้อสั่งการ</th>
                  <th className="p-5 font-bold whitespace-nowrap w-32">กำหนดเสร็จ</th>
                  <th className="p-5 font-bold whitespace-nowrap w-40">หน่วยรับผิดชอบ</th>
                  {isAdmin&&<th className="p-5 font-bold text-center w-28">จัดการ</th>}
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-700/50">
                {paginated.map(p=>(
                  <tr key={p.policy_id} className="hover:bg-slate-700/40 transition-colors align-top">
                     <td className="p-5 font-bold text-amber-500 text-center text-lg">{p.policy_no||'-'}</td>
                     <td className="p-5 whitespace-nowrap font-medium text-slate-300">
                       <span className="bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-600">{p.commander}</span>
                     </td>
                     <td className="p-5 leading-relaxed text-slate-200">{p.order}</td>
                     <td className="p-5 text-emerald-400 font-medium whitespace-nowrap flex items-center gap-1.5 mt-1">
                       <CalendarDays size={14}/> {p.timeframe||'-'}
                     </td>
                     <td className="p-5 text-sky-400 font-bold whitespace-nowrap">{p.primary_unit}</td>
                     {isAdmin&& (
                       <td className="p-5 text-center whitespace-nowrap">
                         <div className="flex justify-center gap-2">
                           <button onClick={()=>{setEditData(p);setModalOpen(true);}} className="text-sky-400 p-2.5 bg-sky-900/30 rounded-lg hover:bg-sky-600 hover:text-white transition-colors shadow-sm"><Edit size={16}/></button>
                           <button onClick={()=>handleDelete(p.policy_id)} className="text-red-400 p-2.5 bg-red-900/30 rounded-lg hover:bg-red-600 hover:text-white transition-colors shadow-sm"><Trash2 size={16}/></button>
                         </div>
                       </td>
                     )}
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan="6" className="p-16 text-center text-slate-500 text-lg border-dashed border-2 border-slate-700/50 m-4 rounded-xl">ไม่พบข้อมูลที่ค้นหา</td></tr>}
             </tbody>
          </table>
        </div>
      </div>
      <Pagination currentPage={currentPage} totalItems={filtered.length} onPageChange={setCurrentPage} />
      
      {/* Modal เพิ่ม/แก้ไขข้อสั่งการ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up overflow-y-auto">
          <div className="bg-slate-800 p-8 md:p-10 rounded-3xl w-full max-w-3xl text-white shadow-2xl border border-slate-600 my-8">
             <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-5">
               <h3 className="text-2xl font-bold text-amber-500 flex items-center gap-3">
                 <div className="bg-amber-500/20 p-2 rounded-xl">{editData?<Edit size={24}/>:<Plus size={24}/>}</div> 
                 {editData?'แก้ไขข้อมูลข้อสั่งการ':'ขึ้นทะเบียนข้อสั่งการใหม่'}
               </h3>
               <button onClick={()=>setModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-900 p-2 rounded-full transition-colors"><X size={24}/></button>
             </div>
             
             <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div>
                     <label className="text-xs font-bold text-slate-400 mb-2 block">ประเภท</label>
                     <select name="category" defaultValue={editData?.category||'นโยบายหลัก'} className="w-full bg-slate-900 p-4 rounded-xl border border-slate-600 outline-none focus:border-amber-500 transition-colors">
                       <option value="นโยบายหลัก">นโยบายหลัก</option>
                       <option value="สั่งการเพิ่มเติม">สั่งการเพิ่มเติม</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-400 mb-2 block">ลำดับข้อ (ใส่ตัวเลข) <span className="text-red-500">*</span></label>
                     <input name="policy_no" defaultValue={editData?.policy_no} required className="w-full bg-slate-900 p-4 rounded-xl border border-slate-600 outline-none focus:border-amber-500 font-mono transition-colors" placeholder="เช่น 1, 2.1"/>
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-400 mb-2 block">ผู้สั่งการ <span className="text-red-500">*</span></label>
                     <input name="commander" defaultValue={editData?.commander||'ผบ.ทสส.'} required className="w-full bg-slate-900 p-4 rounded-xl border border-slate-600 outline-none focus:border-amber-500 transition-colors" placeholder="ระบุตำแหน่ง..."/>
                   </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-2 block">รายละเอียดข้อสั่งการ / นโยบาย <span className="text-red-500">*</span></label>
                  <textarea name="order" defaultValue={editData?.order} required rows="5" className="w-full bg-slate-900 p-4 rounded-xl border border-slate-600 outline-none focus:border-amber-500 leading-relaxed transition-colors" placeholder="พิมพ์รายละเอียดข้อสั่งการที่นี่..."></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                   <div>
                     <label className="text-xs font-bold text-slate-400 mb-2 block flex items-center gap-2"><CalendarDays size={14}/> กรอบเวลา / กำหนดเสร็จ (ถ้ามี)</label>
                     <input name="timeframe" defaultValue={editData?.timeframe} placeholder="เช่น ภายใน ก.ย. 68" className="w-full bg-slate-800 p-4 rounded-xl border border-slate-600 outline-none focus:border-amber-500 transition-colors"/>
                   </div>
                   <div>
                     <label className="text-xs font-bold text-amber-500 mb-2 block flex items-center gap-2"><Target size={14}/> หน่วยงานรับผิดชอบหลัก</label>
                     <select name="primary_unit" defaultValue={editData?.primary_unit||'ทุกหน่วย'} className="w-full bg-slate-800 p-4 rounded-xl border border-amber-500/50 outline-none focus:border-amber-500 transition-colors shadow-sm">
                       <option value="ทุกหน่วย">- ทุกหน่วยงาน -</option>
                       {(appDb.units||[]).filter(u=>u.role==='user'||!u.role).map(u=><option key={u.id} value={u.name}>{u.name}</option>)}
                     </select>
                   </div>
                </div>
                
                <div className="flex justify-end gap-4 pt-6 mt-8">
                  <button type="button" onClick={()=>setModalOpen(false)} className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors">ยกเลิก</button>
                  <button type="submit" className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-2 text-lg"><Send size={20}/> บันทึกข้อมูลลงระบบ</button>
                </div>
             </form>
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
  
  const tasks = appDb.tasks || []; 
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const visible = isAdminOrExec ? tasks : tasks.filter(t => t.primary_unit === user.unitName);
  
  const filtered = visible.filter(t => 
    t.task_name.toLowerCase().includes(search.toLowerCase()) || 
    t.primary_unit.toLowerCase().includes(search.toLowerCase())
  ).sort((a,b)=>new Date(a.start_date)-new Date(b.start_date));

  const handleSave = async (e) => {
    e.preventDefault(); 
    const fd = new FormData(e.target); 
    const data = Object.fromEntries(fd.entries());
    const isUpdating = !!editData; 
    const taskId = isUpdating ? editData.task_id : `TSK-${Date.now()}`;
    const payload = { ...data, task_id: taskId, progress_percent: Number(data.progress_percent) || 0 };
    
    // เคลียร์ root_cause ถ้าสถานะไม่ใช่ ล่าช้า
    if(data.status !== 'ล่าช้า/ติดปัญหา') payload.root_cause = '';
    
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
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg gap-4">
         <div className="flex items-center gap-4">
            <div className="bg-sky-500/20 p-3 rounded-xl border border-sky-500/30 text-sky-400"><CheckSquare size={28} /></div>
            <div>
              <h2 className="text-2xl font-bold whitespace-nowrap text-white">ติดตามการปฏิบัติงาน (Tasks)</h2>
              <p className="text-sm text-slate-400 mt-1">อัปเดตความคืบหน้าภารกิจย่อยในหน่วยของท่าน</p>
            </div>
         </div>
         <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative flex-1 min-w-[250px] shadow-sm">
               <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
               <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่องาน, หน่วย..." className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-sky-500 outline-none transition-colors"/>
            </div>
            {user.role !== 'executive' && (
              <button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5">
                <Plus size={18}/>เพิ่มภารกิจใหม่
              </button>
            )}
         </div>
       </div>

       <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
         <div className="overflow-x-auto custom-scrollbar">
           <table className="w-full text-sm text-left text-slate-200">
             <thead className="bg-slate-900/80 border-b border-slate-700 text-slate-400 uppercase tracking-wider text-xs">
               <tr>
                 <th className="p-5 font-bold min-w-[300px]">รายละเอียดภารกิจ</th>
                 <th className="p-5 font-bold whitespace-nowrap">หน่วยรับผิดชอบ</th>
                 <th className="p-5 font-bold whitespace-nowrap text-center">ระยะเวลา</th>
                 <th className="p-5 font-bold text-center">สถานะ</th>
                 <th className="p-5 font-bold w-48 text-center">ความคืบหน้า</th>
                 {user.role !== 'executive' && <th className="p-5 font-bold text-center">อัปเดต</th>}
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-700/50">
                {filtered.map(t=>(
                  <tr key={t.task_id} className="hover:bg-slate-700/40 transition-colors align-top">
                     <td className="p-5">
                       <p className="font-bold text-slate-100 text-base leading-relaxed mb-2">{t.task_name}</p>
                       {t.note && <p className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-700 line-clamp-2 mt-1">{t.note}</p>}
                     </td>
                     <td className="p-5">
                        <span className="text-sm font-bold text-sky-400 bg-sky-900/20 px-3 py-1.5 rounded-lg border border-sky-500/20 block w-max whitespace-nowrap">{t.primary_unit}</span>
                     </td>
                     <td className="p-5 text-center">
                        <div className="text-xs text-slate-400 font-mono bg-slate-900/60 rounded-lg p-2 border border-slate-700 inline-block w-max">
                          <span className="text-slate-500 block mb-1">เริ่ม: {formatDate(t.start_date)}</span>
                          <span className="text-emerald-400 font-bold block border-t border-slate-700 pt-1">สิ้นสุด: {formatDate(t.end_date)}</span>
                        </div>
                     </td>
                     <td className="p-5 text-center whitespace-nowrap">
                       <span className={`px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>{t.status}</span>
                     </td>
                     <td className="p-5 text-center">
                       <div className="flex flex-col items-center gap-1.5 mt-2">
                          <span className="text-xl font-bold font-mono drop-shadow-md" style={{color:getBarColor(t.progress_percent)}}>{t.progress_percent}%</span>
                          <div className="w-full bg-slate-900 h-2.5 rounded-full border border-slate-700 overflow-hidden shadow-inner">
                            <div className="h-full rounded-full transition-all duration-1000 relative" style={{width:`${t.progress_percent}%`, background:getBarColor(t.progress_percent)}}>
                               <div className="absolute inset-0 bg-white/20"></div>
                            </div>
                          </div>
                       </div>
                     </td>
                     {user.role !== 'executive' && (
                       <td className="p-5 text-center whitespace-nowrap">
                         <div className="flex justify-center gap-2 mt-2">
                          <button onClick={() => { setEditData(t); setModalOpen(true); }} className="text-sky-400 hover:text-white p-2.5 rounded-lg bg-sky-900/30 hover:bg-sky-600 transition-colors shadow-sm"><Edit size={18}/></button>
                          {(user.role === 'admin' || t.primary_unit === user.unitName) && <button onClick={() => handleDelete(t.task_id)} className="text-red-400 hover:text-white p-2.5 rounded-lg bg-red-900/30 hover:bg-red-600 transition-colors shadow-sm"><Trash2 size={18}/></button>}
                         </div>
                       </td>
                     )}
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan="6" className="p-16 text-center text-slate-500 text-lg border-dashed border-2 border-slate-700/50 m-4 rounded-xl">ไม่มีข้อมูลภารกิจในขณะนี้</td></tr>}
             </tbody>
           </table>
         </div>
       </div>

       {/* Modal ฟอร์มงาน */}
       {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up overflow-y-auto">
             <div className="bg-slate-800 p-8 md:p-10 rounded-3xl w-full max-w-3xl text-white shadow-2xl border border-slate-600 my-8">
                <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-5">
                   <h3 className="text-2xl font-bold text-sky-400 flex items-center gap-3">
                      <div className="bg-sky-500/20 p-2 rounded-xl">{editData?<Activity size={28}/>:<Plus size={28}/>}</div> 
                      {editData?'รายงานความคืบหน้าภารกิจ':'เพิ่มภารกิจใหม่'}
                   </h3>
                   <button onClick={()=>setModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-900 p-2 rounded-full transition-colors"><X size={24}/></button>
                </div>
                
                <form onSubmit={handleSave} className="space-y-6">
                   
                   <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 space-y-5">
                     <h4 className="font-bold text-slate-300 border-b border-slate-700/50 pb-3 flex items-center gap-2"><LayoutDashboard size={16}/> ข้อมูลพื้นฐานภารกิจ</h4>
                     <div><label className="text-xs font-bold text-slate-400 mb-2 block">ชื่องาน/ภารกิจ <span className="text-red-500">*</span></label><input name="task_name" defaultValue={editData?.task_name} required className="w-full bg-slate-900 p-4 rounded-xl border border-slate-600 outline-none focus:border-sky-500 text-slate-100 transition-colors" placeholder="พิมพ์ชื่องานที่นี่..."/></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="text-xs font-bold text-slate-400 mb-2 block">วันที่เริ่ม <span className="text-red-500">*</span></label><input type="date" name="start_date" defaultValue={editData?.start_date?editData.start_date.substring(0,10):new Date().toISOString().substring(0,10)} required className="w-full bg-slate-900 p-4 rounded-xl border border-slate-600 outline-none focus:border-sky-500 transition-colors" style={{colorScheme:'dark'}}/></div>
                        <div><label className="text-xs font-bold text-slate-400 mb-2 block flex items-center gap-1.5"><Clock size={12}/> วันกำหนดเสร็จ (Deadline)</label><input type="date" name="end_date" defaultValue={editData?.end_date?editData.end_date.substring(0,10):''} required className="w-full bg-slate-900 p-4 rounded-xl border border-slate-600 outline-none focus:border-sky-500 transition-colors text-emerald-400" style={{colorScheme:'dark'}}/></div>
                     </div>
                     <div><label className="text-xs font-bold text-slate-400 mb-2 block">หน่วยรับผิดชอบหลัก</label><input name="primary_unit" value={editData?.primary_unit||user.unitName} readOnly={user.role!=='admin'} className="w-full bg-slate-800 p-4 rounded-xl border border-slate-600 text-sky-400 font-bold opacity-80 cursor-not-allowed"/></div>
                   </div>

                   <div className="bg-sky-950/20 p-6 rounded-2xl border border-sky-900/50 space-y-5">
                     <h4 className="font-bold text-sky-400 border-b border-sky-900/50 pb-3 flex items-center gap-2"><Activity size={16}/> การรายงานสถานะ</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-bold text-sky-300 mb-2 block">สถานะปัจจุบัน <span className="text-red-500">*</span></label>
                          <select name="status" defaultValue={editData?.status||'รอดำเนินการ'} className="w-full bg-slate-900 p-4 rounded-xl border border-sky-700/50 outline-none focus:border-sky-400 transition-colors font-bold">
                            <option value="รอดำเนินการ">รอดำเนินการ</option><option value="กำลังดำเนินการ">กำลังดำเนินการ</option><option value="เสร็จสิ้น">เสร็จสิ้น</option><option value="ล่าช้า/ติดปัญหา">ล่าช้า/ติดปัญหา</option>
                          </select>
                        </div>
                        <div className="relative">
                          <label className="text-xs font-bold text-sky-300 mb-2 block">ความคืบหน้า (%) <span className="text-red-500">*</span></label>
                          <input type="number" name="progress_percent" defaultValue={editData?.progress_percent||0} min="0" max="100" required className="w-full bg-slate-900 p-4 rounded-xl border border-sky-700/50 outline-none focus:border-sky-400 text-3xl font-mono text-center text-emerald-400 transition-colors font-bold"/>
                          <div className="absolute right-4 top-1/2 mt-1 text-slate-500 font-bold">%</div>
                        </div>
                     </div>
                     <div><label className="text-xs font-bold text-sky-300 mb-2 block">หมายเหตุ / อัปเดตล่าสุด</label><textarea name="note" defaultValue={editData?.note} rows="3" className="w-full bg-slate-900 p-4 rounded-xl border border-sky-700/50 outline-none focus:border-sky-400 transition-colors leading-relaxed" placeholder="ระบุความคืบหน้าล่าสุดที่ได้ทำไป..."></textarea></div>
                   </div>

                   <div className="flex justify-end gap-4 pt-6 mt-8 border-t border-slate-700">
                     <button type="button" onClick={()=>setModalOpen(false)} className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors">ยกเลิก</button>
                     <button type="submit" className="px-8 py-4 bg-sky-600 hover:bg-sky-500 font-bold rounded-xl shadow-[0_4px_15px_rgba(2,132,199,0.4)] transition-transform hover:-translate-y-1 flex items-center gap-3 text-white text-lg"><Send size={22}/> บันทึกอัปเดตลงระบบ</button>
                   </div>
                </form>
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

    showToast('กำลังส่งแบบรายงานไปยัง Google Sheets...'); 
    const success = await callApi("insert", "reports", payload, "report_id", reportId);
    if (success) { showToast('จัดส่งรายงานสำเร็จ', 'ok'); refresh(); setView('HISTORY'); }
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-800 p-8 lg:p-10 rounded-3xl border border-slate-700 shadow-2xl animate-fade-in-up text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 z-0"></div>
      
      <div className="relative z-10">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-amber-500 mb-3"><FilePlus size={32}/> ส่งรายงานผลการปฏิบัติงาน</h2>
        <p className="text-sm text-slate-400 mb-8 border-b border-slate-700 pb-5">รายงานในนามหน่วยงาน: <span className="text-amber-400 font-bold text-base ml-1 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">{user.unitName}</span></p>
        
        <form onSubmit={handleSubmit} className="space-y-8">
           <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
              <label className="text-sm font-bold text-slate-300 block mb-3">อ้างอิงข้อสั่งการ / โครงการ <span className="text-red-500">*</span></label>
              <select name="policy_id" required className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 rounded-xl p-4 outline-none transition-colors">
                 <option value="">-- คลิกเพื่อเลือกข้อสั่งการที่ท่านรับผิดชอบ --</option>
                 {availPolicies.map(p=><option key={p.policy_id} value={p.policy_id}>[{p.policy_no}] {p.order.substring(0,100)}...</option>)}
              </select>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                <label className="text-sm font-bold text-slate-300 block mb-3">วันที่รายงานผล <span className="text-red-500">*</span></label>
                <input type="date" name="report_date" defaultValue={new Date().toISOString().substring(0,10)} required className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 rounded-xl p-4 outline-none" style={{colorScheme:'dark'}}/>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10"><PieChart size={100}/></div>
                <label className="text-sm font-bold text-slate-300 block mb-3 relative z-10">ความคืบหน้าสะสม (%) <span className="text-red-500">*</span></label>
                <input type="number" name="progress_percent" min="0" max="100" required defaultValue="0" className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 rounded-xl p-4 outline-none text-2xl font-mono text-amber-400 font-bold relative z-10"/>
              </div>
           </div>
           
           <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
              <label className="text-sm font-bold text-slate-300 block mb-3">สรุปผลการดำเนินการที่ผ่านมา (ทำอะไรไปแล้วบ้าง) <span className="text-red-500">*</span></label>
              <textarea name="past_result" required rows="5" className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 rounded-xl p-4 outline-none leading-relaxed" placeholder="อธิบายรายละเอียดผลการปฏิบัติ..."></textarea>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="bg-emerald-950/20 p-6 rounded-2xl border border-emerald-900/50">
                <label className="text-sm text-emerald-400 font-bold block mb-3 flex items-center gap-2"><TrendingUp size={18}/> แผนดำเนินการในระยะต่อไป</label>
                <textarea name="next_plan" rows="4" className="w-full bg-slate-900 border border-emerald-900/50 focus:border-emerald-500 rounded-xl p-4 outline-none" placeholder="ระบุก้าวต่อไป..."></textarea>
              </div>
              <div className="bg-red-950/20 p-6 rounded-2xl border border-red-900/50">
                <label className="text-sm text-red-400 font-bold block mb-3 flex items-center gap-2"><AlertTriangle size={18}/> ปัญหา / ข้อขัดข้อง</label>
                <textarea name="problems" rows="4" className="w-full bg-slate-900 border border-red-900/50 focus:border-red-500 rounded-xl p-4 outline-none" placeholder="หากมีข้อขัดข้องให้ระบุที่นี่..."></textarea>
              </div>
           </div>
           
           <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white py-5 rounded-2xl font-bold mt-8 flex justify-center items-center gap-3 text-xl shadow-[0_4px_20px_rgba(245,158,11,0.3)] transition-all hover:-translate-y-1">
             <Send size={24}/> ยืนยันการจัดส่งรายงาน
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
  const sorted = visible.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  const handleDelete = async (id) => {
    if(window.confirm('คุณแน่ใจหรือไม่ที่จะลบรายงานฉบับนี้ออกจากฐานข้อมูลอย่างถาวร?')) { 
      showToast('กำลังส่งคำสั่งลบ...'); 
      const success = await callApi("delete", "reports", null, "report_id", id); 
      if (success) { showToast('ลบประวัติรายงานเรียบร้อย', 'ok'); refresh(); } 
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
       <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-amber-500"><HistoryIcon size={28}/> ทะเบียนประวัติรายงานผล ({sorted.length} ฉบับ)</h2>
          <button className="bg-slate-700 p-2.5 rounded-lg text-white hover:bg-slate-600 print-hide transition-colors" onClick={()=>window.print()}><Printer size={20}/></button>
       </div>
       <div className="grid gap-6">
          {sorted.map(r => (
            <div key={r.report_id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col md:flex-row justify-between gap-6 shadow-lg hover:border-amber-500/40 transition-colors relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-2 h-full" style={{background: getBarColor(r.progress_percent)}}></div>
               <div className="flex-1 pl-4">
                  <div className="flex flex-wrap gap-3 items-center mb-3">
                     <span className="text-sm text-sky-400 font-bold bg-sky-900/30 px-3 py-1 rounded-md border border-sky-500/20 shadow-sm">{r.unit_name}</span>
                     <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg"><Clock size={12} className="inline mr-1 mb-0.5"/>{formatDate(r.report_date)}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-100 mb-3 leading-relaxed border-b border-slate-700/50 pb-3">อ้างอิง: [{r.policy_no}] {r.policy_snippet}</h4>
                  <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
                     <p className="text-sm text-slate-300 leading-relaxed"><b className="text-emerald-500 block mb-1 flex items-center gap-1"><CheckCircle size={14}/> ผลการปฏิบัติ:</b> {r.past_result}</p>
                     {r.problems && r.problems !== '-' && <p className="text-sm text-red-400 mt-4 border-t border-slate-700/50 pt-4 leading-relaxed"><b className="text-red-500 block mb-1 flex items-center gap-1"><AlertOctagon size={14}/> ปัญหาที่พบ:</b> {r.problems}</p>}
                  </div>
               </div>
               <div className="md:w-40 flex flex-col justify-between items-end shrink-0 border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-6 bg-slate-800/50 rounded-r-xl">
                  <div className="text-right w-full flex flex-col items-center justify-center h-full p-4 bg-slate-900 rounded-xl border border-slate-700 shadow-inner">
                     <span className="text-xs text-slate-500 mb-2 uppercase font-bold tracking-widest">ความคืบหน้า</span>
                     <span className="text-4xl font-bold font-mono drop-shadow-md" style={{color: getBarColor(r.progress_percent)}}>{r.progress_percent}%</span>
                  </div>
                  {user.role === 'admin' && <button onClick={()=>handleDelete(r.report_id)} className="mt-4 w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-red-600 p-3 rounded-xl transition-colors border border-slate-700 hover:border-red-500 font-bold"><Trash2 size={16}/> ลบถาวร</button>}
               </div>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="text-center py-20 text-slate-500 bg-slate-800 rounded-2xl border border-slate-700 border-dashed m-2">
              <HistoryIcon size={48} className="mx-auto mb-4 opacity-20"/>
              <p className="text-lg">ยังไม่มีประวัติการส่งรายงานในระบบ</p>
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
  const handleDelete = async (id) => { 
    if(window.confirm('ยืนยันลบบัญชีนี้ออกจากระบบ?')) { 
      const success = await callApi("delete", "units", null, "id", id); 
      if (success) { showToast('ลบบัญชีแล้ว', 'ok'); refresh(); } 
    } 
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in-up">
       <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3 text-amber-500"><Users size={28}/> จัดการบัญชีผู้ใช้ระบบ</h2>
            <p className="text-sm text-slate-400 mt-2">หากต้องการแก้ไขรหัสผ่าน หรือเพิ่มบัญชีใหม่จำนวนมาก ให้ทำใน Google Sheets (แผ่น units) โดยตรง</p>
          </div>
          <button onClick={refresh} className="bg-sky-600 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-sky-500 transition-colors shadow-lg"><CloudUpload size={18}/> ซิงค์ข้อมูลล่าสุด</button>
       </div>
       <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left text-slate-200">
               <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700 uppercase tracking-wider text-xs">
                 <tr><th className="p-5 font-bold">Ref ID</th><th className="p-5 font-bold">ชื่อหน่วยงาน / ชื่อบัญชี</th><th className="p-5 font-bold text-center">สิทธิ์ (Role)</th><th className="p-5 font-bold text-center">รหัสผ่าน (Passcode)</th><th className="p-5 font-bold text-center">จัดการ</th></tr>
               </thead>
               <tbody className="divide-y divide-slate-700/50">
                  {units.map(u => (
                    <tr key={u.id} className="hover:bg-slate-700/40 transition-colors">
                       <td className="p-5 text-xs font-mono text-slate-500">{u.id}</td>
                       <td className="p-5 font-bold text-slate-100 text-base">{u.name}</td>
                       <td className="p-5 text-center">
                          <span className={`px-3 py-1.5 rounded-md border text-xs font-bold shadow-sm ${u.role === 'admin' ? 'bg-purple-900/30 border-purple-500/50 text-purple-400' : u.role === 'executive' ? 'bg-amber-900/30 border-amber-500/50 text-amber-400' : 'bg-sky-900/30 border-sky-500/50 text-sky-400'}`}>
                            {String(u.role).toUpperCase()}
                          </span>
                       </td>
                       <td className="p-5 font-mono text-emerald-400 tracking-widest text-lg text-center font-bold">{u.passcode}</td>
                       <td className="p-5 text-center"><button onClick={()=>handleDelete(u.id)} className="text-slate-400 hover:text-white bg-slate-900 hover:bg-red-600 p-2.5 rounded-lg border border-slate-700 hover:border-red-500 transition-all shadow-sm"><Trash2 size={18}/></button></td>
                    </tr>
                  ))}
                  {units.length === 0 && <tr><td colSpan="5" className="p-16 text-center text-slate-500 text-lg border-dashed border-2 border-slate-700/50 m-4 rounded-xl">ไม่พบข้อมูลบัญชีผู้ใช้</td></tr>}
               </tbody>
            </table>
          </div>
       </div>
    </div>
  )
}

// ============================================================
// 9. Chatbot Assistant (Gemini)
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

    // จำลองการคิดและตอบแบบ Rule-based เบื้องต้น (Offline mode)
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
        <div className="mb-4 w-[350px] md:w-[400px] bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl flex flex-col h-[550px] animate-fade-in-up overflow-hidden">
          <div className="bg-slate-900 p-4 md:p-5 border-b border-amber-500/20 flex justify-between items-center shadow-md z-10">
             <div className="flex gap-3 items-center">
               <div className="bg-amber-500/20 p-2 rounded-full"><Bot className="text-amber-500" size={24}/></div>
               <div>
                 <h3 className="font-bold text-white text-sm md:text-base">J4 Assistant</h3>
                 <span className="text-[10px] text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse"></span> Online</span>
               </div>
             </div>
             <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-red-500 transition-colors p-1.5 rounded-full"><X size={20}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-slate-800/50">
            {messages.map((m, i) => (
               <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed shadow-md ${m.sender === 'user' ? 'bg-amber-600 text-white rounded-br-sm' : 'bg-slate-700 border border-slate-600 text-slate-100 rounded-bl-sm'}`}>{m.text}</div>
               </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="px-5 py-3 rounded-2xl bg-slate-700 border border-slate-600 rounded-bl-sm text-slate-400 text-xs flex gap-1 items-center shadow-md">
                  กำลังประมวลผล 
                  <span className="flex gap-0.5 ml-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'0.1s'}}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>
          
          <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-700 flex gap-3 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] z-10">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              disabled={isTyping} 
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner" 
              placeholder="พิมพ์คำถามที่นี่..." 
            />
            <button type="submit" disabled={isTyping || !input.trim()} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-amber-600 p-3.5 rounded-xl text-white transition-all hover:scale-105 active:scale-95 shadow-lg">
              <Send size={20} className={input.trim() ? 'translate-x-0.5 -translate-y-0.5 transition-transform' : ''}/>
            </button>
          </form>
        </div>
      )}
      
      {!isOpen && (
         <button onClick={() => setIsOpen(true)} className="text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-all border border-amber-500/50 bg-amber-600 hover:bg-amber-500 group relative">
            <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-20"></div>
            <MessageCircle size={28} className="group-hover:animate-pulse"/>
         </button>
      )}
    </div>
  );
}
