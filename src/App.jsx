import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShieldCheck, LayoutDashboard, ScrollText, FilePlus, History as HistoryIcon, LogOut, MessageCircle, Send, PieChart, BarChart, Plus, Edit, Trash2, Download, CloudUpload, Briefcase, AlertTriangle, TrendingUp, CheckCircle, CheckCircle2, FileText, CheckSquare, ListTodo, Activity, Printer, Check, X, Lock, Clock, Trophy, Paperclip, Bell, Sun, Moon, ChevronLeft, ChevronRight, Search, Columns, List, Target, AlertOctagon, GitMerge, Users, Circle, Star
} from 'lucide-react';

// ============================================================
// 1. นำ Web App URL ของคุณมาใส่ตรงนี้
// ============================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwgZZURz1cGNglxjEK-nGsm2g5cIT88GMG7gMkK2Zl2YydBCJyTlL65h8tcd63I2Z-R/exec";

const LOGO_URL = "/S__22413315.jpg";
const GARUDA_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Garuda_Emblem_of_Thailand.svg/150px-Garuda_Emblem_of_Thailand.svg.png";
const geminiApiKey = import.meta.env?.VITE_GEMINI_API_KEY || ''; 

const STATUS_COLORS = { 'เสร็จแล้ว (100%)': '#10b981', 'กำลังจะแล้วเสร็จ (91-99%)': '#0ea5e9', 'ดำเนินการต่อเนื่อง (51-90%)': '#a855f7', 'อยู่ระหว่างดำเนินการ (21-50%)': '#f97316', 'ต่ำกว่าเกณฑ์ (0-20%)': '#ef4444' };
const TASK_STATUS = { 'รอดำเนินการ': 'bg-slate-700 text-slate-300 border-slate-600', 'กำลังดำเนินการ': 'bg-sky-500/20 text-sky-400 border-sky-500/30', 'เสร็จสิ้น': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 'ล่าช้า/ติดปัญหา': 'bg-red-500/20 text-red-400 border-red-500/30' };
const TASK_STATUS_COLORS = { 'รอดำเนินการ': '#64748b', 'กำลังดำเนินการ': '#0ea5e9', 'เสร็จสิ้น': '#10b981', 'ล่าช้า/ติดปัญหา': '#ef4444' };
const ROOT_CAUSES = ['รอการอนุมัติ/สั่งการ', 'รองบประมาณ/การเงิน', 'ขาดอัตรากำลัง/บุคลากร', 'ความล่าช้าจากหน่วยร่วม/ภายนอก', 'ปัญหาข้อกฎหมาย/ระเบียบ', 'ปัจจัยภายนอก (ภัยพิบัติ, ฯลฯ)', 'อื่นๆ'];
const ITEMS_PER_PAGE = 10;
const FALLBACK_ACCOUNTS = [{ id: "A-1", name: "ผู้ดูแลระบบกลาง (Admin)", passcode: "5721118", role: "admin" }, { id: "E-1", name: "ผู้บริหารระดับสูง", passcode: "1111", role: "executive" }, { id: "U-1", name: "กกล.กบ.ทหาร", passcode: "1234", role: "user" }];

const getBarColor = (p) => { if (p === 100) return '#10b981'; if (p >= 91) return '#0ea5e9'; if (p >= 51) return '#a855f7'; if (p >= 21) return '#f97316'; return '#ef4444'; };
const formatDate = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return d; } };
const getEscalationBadge = (endDate) => { if (!endDate) return null; const diffDays = Math.floor((new Date().setHours(0,0,0,0) - new Date(endDate)) / 86400000); if (diffDays >= 15) return { label: '🔥 วิกฤต', class: 'bg-red-600 text-white animate-pulse shadow-lg' }; if (diffDays >= 7) return { label: '⚠️ รุนแรง', class: 'bg-orange-500 text-white' }; if (diffDays > 0) return { label: '👀 เฝ้าระวัง', class: 'bg-amber-500 text-white' }; return null; };
const getDeadlineStatus = (endDate, status) => { if (!endDate) return { label: '-', color: 'text-slate-400 bg-slate-800 border-slate-700' }; if (status === 'เสร็จสิ้น') return { label: 'สำเร็จทันเวลา', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }; const diffDays = Math.ceil((new Date(endDate) - new Date().setHours(0,0,0,0)) / 86400000); if (diffDays < 0) return { label: `ล่าช้า ${Math.abs(diffDays)} วัน`, color: 'text-red-400 bg-red-500/10 border-red-500/30 font-bold' }; if (diffDays <= 7) return { label: `เหลือ ${diffDays} วัน`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }; return { label: `เหลือ ${diffDays} วัน`, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' }; };
function getFiscalYearDates(fyString) { const fyNum = parseInt(fyString) - 543; return { start: `${fyNum - 1}-10-01`, end: `${fyNum}-09-30T23:59:59` }; }
const exportToExcel = (data, filename) => { if (!data || !data.length) return; let table = '<table><thead><tr>'; Object.keys(data[0]).forEach(key => { table += `<th>${key}</th>`; }); table += '</tr></thead><tbody>'; data.forEach(row => { table += '<tr>'; Object.values(row).forEach(val => { table += `<td>${val || '-'}</td>`; }); table += '</tr>'; }); table += '</tbody></table>'; const blob = new Blob([`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8" /></head><body>${table}</body></html>`], { type: 'application/vnd.ms-excel' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${filename}.xls`; link.click(); };

function Pagination({ currentPage, totalItems, onPageChange }) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-4 mt-6 pb-4 print-hide">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-30 text-slate-300 hover:bg-slate-700"><ChevronLeft size={20}/></button>
      <span className="text-sm font-medium text-slate-400">หน้า {currentPage} จาก {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-30 text-slate-300 hover:bg-slate-700"><ChevronRight size={20}/></button>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-center lg:px-4 py-3 rounded-lg justify-center lg:justify-start transition-all ${isActive ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}>
      <span className="shrink-0">{icon}</span><span className="hidden lg:block ml-3 font-medium whitespace-nowrap">{label}</span>
    </button>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('DASHBOARD_POLICY');
  const [theme, setTheme] = useState('dark');
  const [appDb, setAppDb] = useState({ reports: [], policies: [], units: [], tasks: [], isLoaded: false });
  const [toastData, setToastData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deployError, setDeployError] = useState(null);

  const showToast = (msg, type = 'ok') => { setToastData({ msg, type }); setTimeout(() => setToastData(null), 3000); };

  const loadData = async () => {
    setIsSyncing(true); setDeployError(null);
    try {
      const actions = ['units', 'policies', 'reports', 'tasks'];
      const results = await Promise.all(actions.map(async (action) => {
        const url = `${SCRIPT_URL}?action=${action}&t=${Date.now()}`;
        const res = await fetch(url);
        const text = await res.text();
        if (text.trim().startsWith('<')) throw new Error("PERMISSION");
        return JSON.parse(text);
      }));
      setAppDb({ units: results[0] || [], policies: results[1] || [], reports: results[2] || [], tasks: results[3] || [], isLoaded: true });
    } catch (e) {
      if (e.message === "PERMISSION") {
        setDeployError("PERMISSION"); showToast("สิทธิ์เข้าถึงถูกบล็อก! กรุณา Deploy ใหม่", "error");
      } else {
        setDeployError("NETWORK"); showToast("เชื่อมต่อข้อมูลไม่สำเร็จ เช็คลิงก์หรือเน็ต", "error");
      }
      setAppDb(prev => ({...prev, isLoaded: true}));
    } finally { setIsSyncing(false); }
  };

  useEffect(() => { loadData(); }, []);

  const callApi = async (method, action, data, idKey = "", idValue = "") => {
    try {
      await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ method, action, data, idKey, idValue }) });
      setTimeout(loadData, 1500); return true;
    } catch (e) { showToast("ส่งข้อมูลล้มเหลว", "error"); return false; }
  };

  if (!user) return <LoginScreen onLogin={(name, role) => { setUser({ id: `session-${Date.now()}`, unitName: name, role: role || 'user' }); setView(role === 'executive' ? 'EXEC_SUMMARY' : 'DASHBOARD_POLICY'); }} isLoading={!appDb.isLoaded} appDb={appDb} loadData={loadData} deployError={deployError} />;

  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-slate-100'}`}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .fade-in-up { animation: fadeInUp 0.3s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media print { .print-hide { display: none !important; } .bg-slate-900, .bg-slate-800 { background: white !important; color: black !important; border: 1px solid #ccc !important; box-shadow: none !important; } }
      `}</style>

      <aside className="print-hide fixed left-0 top-0 h-screen z-40 bg-slate-800 border-r border-slate-700 flex flex-col w-16 lg:w-64 transition-all">
        <div className="h-20 flex items-center justify-between px-2 lg:px-6 border-b border-slate-700">
          <div className="flex items-center">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-lg flex items-center justify-center p-1"><img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" /></div>
            <div className="hidden lg:block ml-3"><h1 className="font-bold text-lg leading-tight">J4 Tracker</h1><p className="text-amber-500 text-[10px]">Google Sheets API</p></div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-2">
          <NavItem icon={<LayoutDashboard size={20}/>} label="ภาพรวมข้อสั่งการ" isActive={view==='DASHBOARD_POLICY'} onClick={()=>setView('DASHBOARD_POLICY')} />
          <NavItem icon={<PieChart size={20}/>} label="ภาพรวมภารกิจ" isActive={view==='DASHBOARD_TASK'} onClick={()=>setView('DASHBOARD_TASK')} />
          {isAdminOrExec && <NavItem icon={<Briefcase size={20}/>} label="บทสรุปผู้บริหาร" isActive={view==='EXEC_SUMMARY'} onClick={()=>setView('EXEC_SUMMARY')} />}
          <div className="border-t border-slate-700 my-2"></div>
          <NavItem icon={<ScrollText size={20}/>} label="นโยบาย/ข้อสั่งการ" isActive={view==='POLICIES'} onClick={()=>setView('POLICIES')} />
          {user.role !== 'executive' && <NavItem icon={<FilePlus size={20}/>} label="บันทึกรายงานผล" isActive={view==='REPORT_FORM'} onClick={()=>setView('REPORT_FORM')} />}
          <NavItem icon={<HistoryIcon size={20}/>} label="ประวัติการรายงาน" isActive={view==='HISTORY'} onClick={()=>setView('HISTORY')} />
          <NavItem icon={<CheckSquare size={20}/>} label="ติดตามการทำงาน" isActive={view==='TASKS'} onClick={()=>setView('TASKS')} />
          {user.role === 'admin' && <NavItem icon={<Users size={20}/>} label="สิทธิ์ใช้งาน" isActive={view==='UNITS_CONFIG'} onClick={()=>setView('UNITS_CONFIG')} />}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={()=>{setUser(null); setView('DASHBOARD_POLICY');}} className="w-full flex justify-center lg:justify-start p-2 rounded text-slate-400 hover:text-red-500 transition-colors"><LogOut size={20}/><span className="hidden lg:block ml-3">ออกจากระบบ</span></button>
        </div>
      </aside>

      <main className="flex-1 ml-16 lg:ml-64 p-4 md:p-8 h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto pb-20">
          <div className="flex justify-between items-center mb-6 print-hide">
            <h2 className="text-slate-400 font-medium flex items-center gap-2"><ShieldCheck size={18} className="text-amber-500"/> ระบบติดตามงาน J4 Command Center</h2>
            <div className="flex gap-2 items-center">
                {isSyncing && <span className="text-amber-500 text-xs font-bold"><RefreshCcw size={12} className="animate-spin inline"/> กำลังซิงค์...</span>}
                <button onClick={loadData} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><RefreshCcw size={18}/></button>
            </div>
          </div>
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
      
      {toastData && (
        <div className="fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-xl border bg-slate-800 text-white flex items-center gap-3 fade-in-up" style={{borderColor: toastData.type === 'ok' ? '#10b981' : '#ef4444'}}>
          {toastData.type === 'ok' ? <CheckCircle className="text-emerald-500" size={20}/> : <AlertTriangle className="text-red-500" size={20}/>}<span>{toastData.msg}</span>
        </div>
      )}
    </div>
  );
}

// ============== LOGIN SCREEN ==============
function LoginScreen({ onLogin, isLoading, appDb, loadData, deployError }) {
  const accounts = appDb.units && appDb.units.length > 0 ? appDb.units : FALLBACK_ACCOUNTS;
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (accounts.length > 0 && !accounts.find(a => a.id === accountId)) setAccountId(accounts[0].id); }, [accounts, accountId]);

  const handleSubmit = (e) => {
    e.preventDefault(); setError('');
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    if (String(password) !== String(account.passcode)) { setError('รหัสผ่านไม่ถูกต้อง'); return; }
    onLogin(account.name, account.role || 'user');
  };

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4"><div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-amber-400 font-medium">กำลังโหลดข้อมูลระบบ...</p></div>;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 fade-in-up">
        <div className="text-center mb-8">
          <div className="bg-white w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-5 p-2"><img src={LOGO_URL} alt="J4" className="w-full h-full object-contain" /></div>
          <h1 className="text-2xl font-bold text-slate-100">ระบบติดตามผลการปฏิบัติ</h1><p className="text-amber-400 mt-2 text-sm">Google Sheets Edition</p>
        </div>

        {deployError === "PERMISSION" && (
          <div className="mb-6 bg-red-900/40 border border-red-500 p-4 rounded-xl">
             <h3 className="text-red-400 font-bold text-sm mb-2"><AlertTriangle size={16} className="inline mr-1"/> สิทธิ์เข้าถึงถูกบล็อก!</h3>
             <ol className="text-xs text-amber-200 list-decimal pl-4 space-y-1">
                <li>ไปที่ Google Apps Script กด <b>Deploy</b></li>
                <li>เลือก <b>Manage deployments</b> กดยกเลิกอันเก่าแล้วสร้างใหม่</li>
                <li>ตั้ง Version เป็น <b>New</b> และ Who has access เป็น <b>Anyone</b> เท่านั้น</li>
             </ol>
          </div>
        )}

        {deployError === "NETWORK" && <div className="mb-6 bg-red-900/40 p-4 text-center rounded-xl text-xs text-red-300">โหลดข้อมูลไม่สำเร็จ ตรวจสอบ URL หรืออินเทอร์เน็ต</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label className="block text-slate-400 text-sm mb-2">เลือกบัญชีผู้ใช้งาน</label><select value={accountId} onChange={(e) => { setAccountId(e.target.value); setError(''); }} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 outline-none">{accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}</select></div>
          <div><label className="block text-slate-400 text-sm mb-2">รหัสผ่าน</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 outline-none" placeholder="ระบุรหัสผ่าน..." /></div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {appDb.isLoaded && (!appDb.units || appDb.units.length === 0) && !deployError && <div className="text-[10px] text-amber-500 bg-amber-500/10 p-2 rounded text-center">⚠️ ใช้บัญชีสำรอง (ยังไม่มีข้อมูลใน Sheets)</div>}
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4">เข้าสู่ระบบ</button>
        </form>
        <div className="mt-6 text-center"><button onClick={loadData} className="text-slate-500 text-xs hover:text-white underline"><RefreshCcw size={12} className="inline mr-1"/> โหลดข้อมูลใหม่จากฐานข้อมูล</button></div>
      </div>
    </div>
  );
}

// ============== POLICY DASHBOARD ==============
function PolicyDashboard({ appDb, user }) {
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const [filterUnit, setFilterUnit] = useState(isAdminOrExec ? 'ALL' : user.unitName);
  const [selectedStatus, setSelectedStatus] = useState(null);
  
  const basePolicies = useMemo(() => {
    let f = appDb.policies || [];
    if (filterUnit !== 'ALL') f = f.filter(p => p.primary_unit === filterUnit || p.secondary_units?.includes(filterUnit) || p.primary_unit === 'ทุกหน่วย');
    return f;
  }, [appDb.policies, filterUnit]);

  const baseReports = useMemo(() => {
    let r = appDb.reports || [];
    if (filterUnit !== 'ALL') r = r.filter(x => x.unit_name === filterUnit);
    return r;
  }, [appDb.reports, filterUnit]);

  const overallStats = useMemo(() => {
    const sectionPolicyIds = basePolicies.map(p => p.policy_id);
    const sectionReports = baseReports.filter(r => sectionPolicyIds.includes(r.policy_id));
    const progList = basePolicies.map(po => {
      const rs = sectionReports.filter(r => r.policy_id === po.policy_id).sort((a, b) => new Date(b.report_date) - new Date(a.report_date));
      return { id: po.policy_id, progress: rs.length ? rs[0].progress_percent : 0 };
    });
    return {
      total: progList.length, completed: progList.filter(x => x.progress === 100).length,
      inProgress: progList.filter(x => x.progress > 0 && x.progress < 100).length, notStarted: progList.filter(x => x.progress === 0).length
    }
  }, [basePolicies, baseReports]);

  return (
    <div className="space-y-6 fade-in-up text-slate-100">
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 print-hide flex flex-col md:flex-row justify-between items-center gap-4">
        <div><h2 className="text-xl font-bold flex items-center gap-2 text-amber-500"><LayoutDashboard size={24} /> ภาพรวมนโยบายและข้อสั่งการ</h2></div>
        <div className="flex gap-3">
          {selectedStatus && <button onClick={() => setSelectedStatus(null)} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">ล้างตัวกรอง</button>}
          <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} disabled={!isAdminOrExec} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"><option value="ALL">ทุกหน่วยงาน</option>{(appDb.units||[]).map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
          <button onClick={() => window.print()} className="bg-slate-700 text-white p-2 rounded-lg"><Printer size={18}/></button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print-hide">
        {[
          { label: 'ข้อสั่งการรวม', val: overallStats.total, status: null, color: 'text-slate-100', bg: 'bg-slate-800' },
          { label: 'เสร็จสมบูรณ์', val: overallStats.completed, status: 'เสร็จแล้ว (100%)', color: 'text-emerald-400', bg: 'bg-emerald-950/20' },
          { label: 'กำลังดำเนินการ', val: overallStats.inProgress, status: 'ดำเนินการต่อเนื่อง (51-90%)', color: 'text-sky-400', bg: 'bg-sky-950/20' },
          { label: 'ยังไม่คืบหน้า (0%)', val: overallStats.notStarted, status: 'ต่ำกว่าเกณฑ์ (0-20%)', color: 'text-red-400', bg: 'bg-red-950/20' }
        ].map(kpi => (
            <div key={kpi.label} onClick={() => kpi.status ? setSelectedStatus(kpi.status) : setSelectedStatus(null)} className={`p-6 rounded-xl border-2 cursor-pointer shadow-lg ${selectedStatus === kpi.status ? `border-amber-500 ${kpi.bg}` : `border-slate-700 bg-slate-800`}`}>
              <p className="text-slate-400 text-sm font-medium">{kpi.label}</p><h3 className={`text-3xl font-bold mt-2 ${kpi.color}`}>{kpi.val}</h3>
            </div>
        ))}
      </div>
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
         <h3 className="text-lg font-bold mb-4 text-amber-500">นโยบายทั้งหมด {selectedStatus && `(กรอง: ${selectedStatus})`}</h3>
         <div className="space-y-4">
            {basePolicies.map(p => {
               const rs = baseReports.filter(r => r.policy_id === p.policy_id).sort((a,b)=>new Date(b.report_date)-new Date(a.report_date));
               const prog = rs.length ? rs[0].progress_percent : 0;
               let bucket = 'ต่ำกว่าเกณฑ์ (0-20%)'; if(prog===100)bucket='เสร็จแล้ว (100%)'; else if(prog>90)bucket='กำลังจะแล้วเสร็จ (91-99%)'; else if(prog>50)bucket='ดำเนินการต่อเนื่อง (51-90%)'; else if(prog>20)bucket='อยู่ระหว่างดำเนินการ (21-50%)';
               if (selectedStatus && bucket !== selectedStatus) return null;
               
               return (
                 <div key={p.policy_id} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div className="flex justify-between mb-2"><span className="font-bold text-sky-400">[{p.policy_no}] {p.commander}</span><span className="font-bold font-mono" style={{color: getBarColor(prog)}}>{prog}%</span></div>
                    <p className="text-sm text-slate-200">{p.order}</p>
                    <div className="w-full bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden"><div className="h-full" style={{width: `${prog}%`, background: getBarColor(prog)}}></div></div>
                    <p className="text-[10px] text-slate-500 mt-2">รับผิดชอบ: {p.primary_unit}</p>
                 </div>
               )
            })}
         </div>
      </div>
    </div>
  );
}

// ============== TASK DASHBOARD ==============
function TaskDashboard({ appDb, user }) {
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const [filterUnit, setFilterUnit] = useState(isAdminOrExec ? 'ALL' : user.unitName);
  
  const baseTasks = useMemo(() => {
    let tasks = appDb.tasks || [];
    if (filterUnit !== 'ALL') tasks = tasks.filter(t => t.primary_unit === filterUnit || t.secondary_units?.includes(filterUnit));
    return tasks;
  }, [appDb.tasks, filterUnit]);

  const stats = useMemo(() => {
    const totalTasks = baseTasks.length;
    const delayedTasks = baseTasks.filter(t => t.status === 'ล่าช้า/ติดปัญหา').length;
    return { totalTasks, delayedTasks, completed: baseTasks.filter(t=>t.status==='เสร็จสิ้น').length, active: baseTasks.filter(t=>t.status==='กำลังดำเนินการ').length };
  }, [baseTasks]);

  const delayedList = useMemo(() => baseTasks.filter(t => t.status === 'ล่าช้า/ติดปัญหา').sort((a, b) => new Date(a.end_date) - new Date(b.end_date)), [baseTasks]);

  return (
    <div className="space-y-6 fade-in-up text-slate-100">
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 print-hide flex justify-between items-center gap-4 theme-transition">
        <div><h2 className="text-xl font-bold flex items-center gap-2 text-amber-500"><PieChart size={24} /> ภาพรวมภารกิจและการปฏิบัติงาน</h2></div>
        <div className="flex items-center gap-3">
          <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} disabled={!isAdminOrExec} className="bg-slate-900 border border-slate-700 rounded-lg text-slate-100 p-2.5 text-sm disabled:opacity-50"><option value="ALL">ทุกหน่วยงาน</option>{(appDb.units||[]).map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
          <button onClick={() => window.print()} className="bg-slate-700 text-white p-2.5 rounded-lg text-sm"><Printer size={18}/></button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ภารกิจรวม', val: stats.totalTasks, color: 'text-slate-100', border: 'border-slate-600', bg: 'bg-slate-800' },
          { label: 'เสร็จสมบูรณ์', val: stats.completed, color: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-950/20' },
          { label: 'กำลังดำเนินการ', val: stats.active, color: 'text-sky-400', border: 'border-sky-500', bg: 'bg-sky-950/20' },
          { label: 'ล่าช้า/ติดปัญหา', val: stats.delayedTasks, color: 'text-red-400', border: 'border-red-500', bg: 'bg-red-950/20' }
        ].map(kpi => (
            <div key={kpi.label} className={`p-6 rounded-xl border-2 shadow-lg ${kpi.border} ${kpi.bg}`}>
              <p className="text-slate-400 text-sm font-medium">{kpi.label}</p><h3 className={`text-3xl font-bold mt-2 ${kpi.color}`}>{kpi.val}</h3>
            </div>
        ))}
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-red-500/30 shadow-md mt-6 theme-transition">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-500"><AlertTriangle size={20}/> ภารกิจที่ต้องติดตามด่วน (ล่าช้า / ติดปัญหา)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {delayedList.map(t => (
               <div key={t.task_id} className="bg-red-950/20 border border-red-900/50 p-4 rounded-lg">
                 <div className="flex justify-between items-start mb-2">
                   <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-1 rounded border border-red-500/30 font-semibold">{t.primary_unit}</span>
                   <span className="text-xs text-slate-500 font-mono">กำหนด: {formatDate(t.end_date)}</span>
                 </div>
                 <h4 className="font-bold text-slate-100 mb-2">{t.task_name}</h4>
                 <div className="text-xs text-red-400 bg-red-900/30 p-2.5 rounded border border-red-500/20 space-y-1">
                   <p><span className="font-bold text-red-500">สาเหตุหลัก:</span> <span className="px-2 py-0.5 bg-red-950 rounded text-red-300 ml-1">{t.root_cause || 'ไม่ระบุ'}</span></p>
                   <p><span className="font-bold text-red-500">รายละเอียด:</span> {t.note || '-'}</p>
                 </div>
               </div>
          ))}
          {delayedList.length === 0 && <div className="col-span-full py-8 text-center text-slate-500"><p>ไม่มีภารกิจที่ติดปัญหาในขณะนี้</p></div>}
        </div>
      </div>
    </div>
  );
}

// ============== EXECUTIVE SUMMARY ==============
function ExecutiveSummary({ appDb }) {
  const stats = useMemo(() => {
    const unitStats = {};
    (appDb.units || []).filter(u => u.role === 'user' || !u.role).forEach(u => { unitStats[u.name] = { totalPolicies: 0, progressSum: 0, completed: 0, reports: 0 }; });

    const policies = appDb.policies || [];
    const reports = appDb.reports || [];

    policies.forEach(p => {
      if (unitStats[p.primary_unit]) unitStats[p.primary_unit].totalPolicies += 1;
    });

    const latestReports = {};
    reports.filter(r => r.approval_status === 'อนุมัติแล้ว').forEach(r => {
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
    return { unitArray, totalReports: Object.keys(latestReports).length };
  }, [appDb]);

  return (
    <div className="space-y-6 fade-in-up text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3 items-center"><div className="bg-amber-500/20 p-3 rounded-xl"><Briefcase className="text-amber-500" size={28}/></div><h2 className="text-2xl font-bold">บทสรุปผู้บริหาร</h2></div>
        <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Printer size={16}/> พิมพ์รายงาน</button>
      </div>

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
        </div>
      </div>
    </div>
  )
}

// ============== POLICIES ==============
function Policies({ appDb, user, showToast, callApi, refresh }) {
  const [search, setSearch] = useState(''); 
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';

  const filtered = (appDb.policies || []).filter(p => p.order.toLowerCase().includes(search.toLowerCase()) || p.commander.toLowerCase().includes(search.toLowerCase())).sort((a,b) => parseInt(a.policy_no||0) - parseInt(b.policy_no||0));

  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const isUpdating = !!editData;
    const policyId = isUpdating ? editData.policy_id : `POL-${Date.now()}`;
    const payload = { ...data, policy_id: policyId, created_at: isUpdating ? editData.created_at : new Date().toISOString() };
    
    showToast('กำลังบันทึกข้อมูล...');
    const success = await callApi(isUpdating ? "update" : "insert", "policies", payload, "policy_id", policyId);
    if (success) { showToast('บันทึกเรียบร้อย', 'ok'); setModalOpen(false); }
  };

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันลบข้อสั่งการนี้?')) {
      const success = await callApi("delete", "policies", null, "policy_id", id);
      if (success) showToast('ลบเรียบร้อย', 'ok');
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex justify-between items-center bg-slate-800 p-5 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold flex gap-2 text-amber-500"><ScrollText size={24} /> นโยบายและข้อสั่งการ</h2>
        <div className="flex gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหา..." className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm outline-none text-white"/>
          {user.role === 'admin' && <button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"><Plus size={16}/> เพิ่ม</button>}
        </div>
      </div>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto">
         <table className="w-full text-sm text-left text-slate-200">
            <thead className="bg-slate-900 text-slate-400"><tr><th className="p-4">ลำดับ</th><th className="p-4">ผู้สั่งการ</th><th className="p-4 min-w-[300px]">ข้อสั่งการ</th><th className="p-4">หน่วยหลัก</th>{user.role === 'admin' && <th className="p-4">จัดการ</th>}</tr></thead>
            <tbody className="divide-y divide-slate-700/50">
               {filtered.map(p => (
                 <tr key={p.policy_id} className="hover:bg-slate-700/30">
                    <td className="p-4 font-bold text-amber-500">{p.policy_no || '-'}</td><td className="p-4 text-xs">{p.commander}</td>
                    <td className="p-4">{p.order}</td><td className="p-4 text-xs text-sky-400">{p.primary_unit}</td>
                    {user.role === 'admin' && <td className="p-4 flex gap-2"><button onClick={() => { setEditData(p); setModalOpen(true); }} className="text-sky-400 p-1"><Edit size={16}/></button><button onClick={() => handleDelete(p.policy_id)} className="text-red-400 p-1"><Trash2 size={16}/></button></td>}
                 </tr>
               ))}
            </tbody>
         </table>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-2xl text-white">
             <h3 className="text-xl font-bold mb-4">{editData ? 'แก้ไขข้อสั่งการ' : 'เพิ่มข้อสั่งการ'}</h3>
             <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                   <div><label className="text-xs text-slate-400">ประเภท</label><input name="category" defaultValue={editData?.category||'นโยบายหลัก'} className="w-full bg-slate-900 p-2 rounded border border-slate-700"/></div>
                   <div><label className="text-xs text-slate-400">ลำดับ</label><input name="policy_no" defaultValue={editData?.policy_no} required className="w-full bg-slate-900 p-2 rounded border border-slate-700"/></div>
                   <div><label className="text-xs text-slate-400">ผู้สั่งการ</label><input name="commander" defaultValue={editData?.commander||'ผบ.ทสส.'} required className="w-full bg-slate-900 p-2 rounded border border-slate-700"/></div>
                </div>
                <div><label className="text-xs text-slate-400">ข้อสั่งการ</label><textarea name="order" defaultValue={editData?.order} required rows="3" className="w-full bg-slate-900 p-2 rounded border border-slate-700"></textarea></div>
                <div><label className="text-xs text-slate-400">หน่วยหลัก</label><select name="primary_unit" defaultValue={editData?.primary_unit||'ทุกหน่วย'} className="w-full bg-slate-900 p-2 rounded border border-slate-700"><option value="ทุกหน่วย">ทุกหน่วย</option>{appDb.units.map(u=><option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-700"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2 bg-slate-700 rounded">ยกเลิก</button><button type="submit" className="px-4 py-2 bg-amber-600 rounded">บันทึก</button></div>
             </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ============== TASKS ==============
function TaskTracker({ appDb, user, showToast, callApi, refresh }) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  
  const tasks = appDb.tasks || [];
  const isAdmin = user.role === 'admin';
  const visible = isAdmin ? tasks : tasks.filter(t => t.primary_unit === user.unitName);
  const filtered = visible.filter(t => t.task_name.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>new Date(a.start_date)-new Date(b.start_date));

  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const isUpdating = !!editData;
    const taskId = isUpdating ? editData.task_id : `TSK-${Date.now()}`;
    const payload = { ...data, task_id: taskId, progress_percent: Number(data.progress_percent) || 0 };
    
    showToast('กำลังบันทึก...');
    const success = await callApi(isUpdating ? "update" : "insert", "tasks", payload, "task_id", taskId);
    if (success) { showToast('บันทึกเรียบร้อย', 'ok'); setModalOpen(false); }
  };

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันลบงานนี้?')) {
      const success = await callApi("delete", "tasks", null, "task_id", id);
      if (success) showToast('ลบเรียบร้อย', 'ok');
    }
  }

  return (
    <div className="space-y-6 fade-in-up">
       <div className="flex justify-between items-center bg-slate-800 p-5 rounded-xl border border-slate-700">
         <h2 className="text-xl font-bold flex gap-2 text-amber-500"><CheckSquare size={24} /> ติดตามการทำงาน</h2>
         <div className="flex gap-3">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหางาน..." className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"/>
            {user.role !== 'executive' && <button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-amber-600 text-white px-3 py-2 rounded-lg text-sm flex gap-2"><Plus size={16}/>เพิ่มงาน</button>}
         </div>
       </div>

       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto shadow-xl">
         <table className="w-full text-sm text-left text-slate-200">
           <thead className="bg-slate-900 border-b border-slate-700 text-slate-400"><tr><th className="p-4">ชื่องาน</th><th className="p-4">หน่วย</th><th className="p-4">สถานะ</th><th className="p-4">จัดการ</th></tr></thead>
           <tbody className="divide-y divide-slate-700/50">
              {filtered.map(t => (
                <tr key={t.task_id} className="hover:bg-slate-700/30">
                   <td className="p-4 font-bold">{t.task_name}</td><td className="p-4 text-xs text-sky-400">{t.primary_unit}</td>
                   <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] border ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>{t.status} {t.progress_percent}%</span></td>
                   <td className="p-4 flex gap-2">
                      {user.role !== 'executive' && <button onClick={() => { setEditData(t); setModalOpen(true); }} className="text-sky-400 hover:text-white p-1 rounded"><Edit size={16}/></button>}
                      {(isAdmin || t.primary_unit === user.unitName) && <button onClick={() => handleDelete(t.task_id)} className="text-red-400 hover:text-white p-1 rounded"><Trash2 size={16}/></button>}
                   </td>
                </tr>
              ))}
           </tbody>
         </table>
       </div>

       {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
             <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-xl text-white shadow-2xl border border-slate-700">
                <h3 className="text-xl font-bold mb-4">{editData ? 'อัปเดตงาน' : 'เพิ่มงาน'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                   <div><label className="text-xs text-slate-400">ชื่องาน</label><input name="task_name" defaultValue={editData?.task_name} required className="w-full bg-slate-900 p-2 rounded border border-slate-700"/></div>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs text-slate-400">วันที่เริ่ม</label><input type="date" name="start_date" defaultValue={editData?.start_date ? editData.start_date.substring(0,10) : ''} required className="w-full bg-slate-900 p-2 rounded border border-slate-700" style={{colorScheme:'dark'}}/></div>
                      <div><label className="text-xs text-slate-400">วันกำหนดเสร็จ</label><input type="date" name="end_date" defaultValue={editData?.end_date ? editData.end_date.substring(0,10) : ''} required className="w-full bg-slate-900 p-2 rounded border border-slate-700" style={{colorScheme:'dark'}}/></div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs text-slate-400">สถานะ</label><select name="status" defaultValue={editData?.status||'รอดำเนินการ'} className="w-full bg-slate-900 p-2 rounded border border-slate-700"><option value="รอดำเนินการ">รอดำเนินการ</option><option value="กำลังดำเนินการ">กำลังดำเนินการ</option><option value="เสร็จสิ้น">เสร็จสิ้น</option><option value="ล่าช้า/ติดปัญหา">ล่าช้า/ติดปัญหา</option></select></div>
                      <div><label className="text-xs text-slate-400">ความคืบหน้า (%)</label><input type="number" name="progress_percent" defaultValue={editData?.progress_percent||0} className="w-full bg-slate-900 p-2 rounded border border-slate-700"/></div>
                   </div>
                   <div><label className="text-xs text-slate-400">หน่วย</label><input name="primary_unit" value={editData?.primary_unit || user.unitName} readOnly={!isAdmin} className="w-full bg-slate-900 p-2 rounded border border-slate-700 opacity-70"/></div>
                   <div className="flex justify-end gap-2 pt-4 border-t border-slate-700"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2 bg-slate-700 rounded">ยกเลิก</button><button type="submit" className="px-4 py-2 bg-amber-600 rounded">บันทึก</button></div>
                </form>
             </div>
          </div>
       )}
    </div>
  )
}

// ============== REPORT FORM ==============
function ReportForm({ appDb, user, showToast, setView, callApi }) {
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
      report_id: reportId, policy_id: data.policy_id, policy_no: pol.policy_no || '-',
      policy_snippet: pol.order.substring(0, 100), unit_name: user.unitName,
      report_date: data.report_date, past_result: data.past_result, progress_percent: Number(data.progress_percent) || 0,
      approval_status: 'อนุมัติแล้ว', created_at: new Date().toISOString()
    };

    showToast('กำลังบันทึกรายงาน...');
    const success = await callApi("insert", "reports", payload, "report_id", reportId);
    if (success) { showToast('บันทึกเรียบร้อย', 'ok'); setView('HISTORY'); }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl fade-in-up text-white">
      <h2 className="text-2xl font-bold flex gap-2 text-amber-500 mb-6"><FilePlus size={28}/> บันทึกรายงานผล</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
         <div>
            <label className="text-xs text-slate-400 block mb-1">เลือกข้อสั่งการ</label>
            <select name="policy_id" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3">
               <option value="">-- กรุณาเลือก --</option>
               {availPolicies.map(p => <option key={p.policy_id} value={p.policy_id}>[{p.policy_no}] {p.order.substring(0,80)}...</option>)}
            </select>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-400 block mb-1">วันที่รายงาน</label><input type="date" name="report_date" defaultValue={new Date().toISOString().substring(0,10)} required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3" style={{colorScheme:'dark'}}/></div>
            <div><label className="text-xs text-slate-400 block mb-1">คืบหน้าสะสม (%)</label><input type="number" name="progress_percent" min="0" max="100" required defaultValue="0" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3"/></div>
         </div>
         <div><label className="text-xs text-slate-400 block mb-1">สรุปผลที่ทำไป</label><textarea name="past_result" required rows="4" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3"></textarea></div>
         <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 py-3 rounded-xl font-bold mt-4 flex justify-center gap-2"><Send size={20}/> ส่งรายงาน</button>
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
      showToast('กำลังลบ...');
      const success = await callApi("delete", "reports", null, "report_id", id);
      if (success) showToast('ลบแล้ว');
    }
  }

  return (
    <div className="space-y-6 fade-in-up">
       <div className="flex justify-between items-center bg-slate-800 p-5 rounded-xl border border-slate-700">
          <h2 className="font-bold flex items-center gap-2 text-amber-500"><HistoryIcon size={20}/> ประวัติการรายงาน ({sorted.length})</h2>
       </div>
       <div className="grid gap-4">
          {sorted.map(r => (
            <div key={r.report_id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between gap-4">
               <div>
                  <span className="text-xs text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded">{r.unit_name}</span>
                  <h4 className="text-sm font-medium text-slate-200 mt-2">[{r.policy_no}] {r.policy_snippet}</h4>
                  <p className="text-xs text-slate-400 mt-2"><b className="text-emerald-500">ผลปฏิบัติ:</b> {r.past_result}</p>
               </div>
               <div className="text-right flex flex-col justify-between items-end">
                  <span className="text-xl font-bold font-mono" style={{color: getBarColor(r.progress_percent)}}>{r.progress_percent}%</span>
                  {user.role === 'admin' && <button onClick={()=>handleDelete(r.report_id)} className="text-red-400 p-1"><Trash2 size={16}/></button>}
               </div>
            </div>
          ))}
          {sorted.length === 0 && <p className="text-center p-10 text-slate-500">ไม่มีประวัติการรายงาน</p>}
       </div>
    </div>
  )
}

function UnitsConfig({ appDb, showToast, callApi, refresh }) {
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
          <h2 className="font-bold flex gap-2 text-amber-500"><Users size={20}/> จัดการบัญชีผู้ใช้</h2>
          <p className="text-xs text-slate-400">*หากต้องการเพิ่ม ให้เพิ่มใน Google Sheets โดยตรง</p>
       </div>
       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <table className="w-full text-sm text-left text-slate-200">
             <thead className="bg-slate-900 text-slate-400"><tr><th className="p-4">ชื่อหน่วย/บัญชี</th><th className="p-4">สิทธิ์</th><th className="p-4">รหัสผ่าน</th><th className="p-4">ลบ</th></tr></thead>
             <tbody className="divide-y divide-slate-700/50">
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

// ============== CHATBOT ==============
function Chatbot({ appDb }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) setMessages([{ sender: 'bot', text: 'สวัสดีครับ! ผมคือ Assistant ประจำระบบ J4 ลองถามคำถามพื้นฐานได้ครับ' }]);
  }, [isOpen]);
  useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault(); if (!input.trim() || isTyping) return;
    const userMsg = input.trim(); setMessages(prev => [...prev, { sender: 'user', text: userMsg }]); setInput(''); setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const lo = userMsg.toLowerCase();
      let reply = "ขออภัย โหมด Assistant นี้รองรับคำสั่งพื้นฐาน ลองพิมพ์ 'สรุปภาพรวม'";
      if (lo.includes('สรุป') || lo.includes('ภาพรวม')) reply = `📊 นโยบายทั้งหมด: ${(appDb.policies||[]).length} เรื่อง\nภารกิจ: ${(appDb.tasks||[]).length} ภารกิจ`;
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 500);
  };

  return (
    <div className="print-hide fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[340px] md:w-[380px] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col h-[480px]">
          <div className="bg-slate-900 p-4 border-b border-amber-500/20 flex justify-between"><h3 className="font-bold text-white text-sm">Assistant</h3><button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">&times;</button></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((m, i) => (<div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap ${m.sender === 'user' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-100 rounded-bl-none'}`}>{m.text}</div></div>))}
            {isTyping && <div className="text-slate-400 text-xs">กำลังคิด...</div>}
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
