import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShieldCheck, LayoutDashboard, ScrollText, FilePlus, History as HistoryIcon, LogOut, MessageCircle, Send, PieChart, BarChart, Plus, Edit, Trash2, Download, CloudUpload, Briefcase, AlertTriangle, TrendingUp, CheckCircle, CheckCircle2, FileText, CheckSquare, ListTodo, Activity, Printer, Check, X, Lock, Clock, Trophy, Paperclip, Bell, Sun, Moon, ChevronLeft, ChevronRight, Search, Kanban, Columns, List, Target, AlertOctagon, GitMerge, Users, Circle, Star, MousePointerClick, RefreshCcw, FilterX, CalendarDays, Table, ChevronDown, ChevronUp
} from 'lucide-react';

// ============================================================
// ตั้งค่า SCRIPT_URL 
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
  return { start: `${fyNum - 1}-10-01`, end: `${fyNum}-09-30T23:59:59` };
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

// ============== COMPONENTS ==============
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
    <button onClick={onClick} className={`flex items-center w-full lg:px-4 py-3 rounded-lg justify-center lg:justify-start transition-all ${isActive ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}>
      <span className="shrink-0">{icon}</span>
      <span className="hidden lg:block ml-3 font-medium whitespace-nowrap">{label}</span>
    </button>
  );
}

// ============== LOGIN SCREEN ==============
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
      setLocalError('ไม่มีข้อมูลบัญชี'); return;
    }
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    if (String(password) !== String(account.passcode)) { 
      setLocalError('รหัสผ่านไม่ถูกต้อง'); return; 
    }
    onLogin(account.name, account.role || 'user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-amber-400 font-medium">กำลังโหลดข้อมูลระบบ...</p>
      </div>
    );
  }

  const adminAccounts = accounts.filter(a => a.role === 'admin');
  const execAccounts = accounts.filter(a => a.role === 'executive');
  const userAccounts = accounts.filter(a => a.role === 'user' || !a.role);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
        <div className="text-center mb-8 relative z-10">
          <div className="bg-white w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-500/50 p-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <img src={LOGO_URL} alt="J4 Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">ระบบติดตามผลการปฏิบัติ</h1>
          <p className="text-amber-400 mt-2 text-sm font-medium">J4 Tracker</p>
        </div>

        {deployError === "PERMISSION" && (
          <div className="mb-6 bg-red-900/40 border border-red-500 p-4 rounded-xl relative z-10">
             <h3 className="text-red-400 font-bold text-sm flex items-center gap-1.5 mb-2"><AlertTriangle size={16}/> สิทธิ์เข้าถึงฐานข้อมูลถูกปฏิเสธ!</h3>
             <p className="text-xs text-slate-300 mb-2">กรุณาตั้งค่า Google Apps Script ดังนี้:</p>
             <ol className="text-xs text-amber-200 pl-4 list-decimal space-y-1">
                <li>กด <b>Deploy</b> {'>'} <b>Manage deployments</b></li>
                <li>กดรูปดินสอเพื่อแก้ไข (Edit)</li>
                <li>เปลี่ยน Version เป็น <b>New</b></li>
                <li>ตั้ง Who has access เป็น <b>Anyone</b></li>
                <li>กด <b>Deploy</b> แล้วโหลดหน้านี้ใหม่</li>
             </ol>
          </div>
        )}

        {deployError === "NETWORK" && (
          <div className="mb-6 bg-red-900/40 border border-red-500 p-4 rounded-xl relative z-10 text-center">
             <p className="text-sm text-red-300 flex justify-center items-center gap-2"><AlertTriangle size={16}/> เชื่อมต่อข้อมูลล้มเหลว</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-medium">เลือกบัญชีผู้ใช้งาน</label>
            <select value={accountId} onChange={(e) => { setAccountId(e.target.value); setLocalError(''); setPassword(''); }} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-slate-100 focus:border-amber-500 outline-none">
              {accounts.length === 0 && <option value="">ไม่มีข้อมูล</option>}
              {adminAccounts.length > 0 && <optgroup label="--- ผู้ดูแลระบบกลาง ---">{adminAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>}
              {execAccounts.length > 0 && <optgroup label="--- ผู้บริหาร ---">{execAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>}
              {userAccounts.length > 0 && <optgroup label="--- หน่วยงานปฏิบัติการ ---">{userAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-medium flex items-center gap-2"><Lock size={14}/> รหัสผ่าน</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-slate-100 focus:border-amber-500 outline-none" placeholder="ระบุรหัสผ่าน..." />
          </div>
          {localError && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{localError}</p>}
          {appDb.isLoaded && (!appDb.units || appDb.units.length === 0) && !deployError && (
            <div className="text-[10px] text-amber-500 bg-amber-500/10 p-2 rounded text-center border border-amber-500/20">
              ⚠️ ใช้บัญชีสำรอง (ยังไม่มีข้อมูลใน Sheets)
            </div>
          )}
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] transition-colors mt-4">เข้าสู่ระบบ</button>
        </form>
        <div className="mt-6 text-center">
           <button onClick={loadData} className="text-slate-500 text-xs hover:text-slate-300 underline underline-offset-2 flex items-center gap-1 mx-auto"><RefreshCcw size={12}/> โหลดข้อมูลซ้ำ (Refresh)</button>
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
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [expandedPolicyId, setExpandedPolicyId] = useState(null);

  const currentUnits = useMemo(() => (appDb.units || []).filter(u => u.role === 'user' || !u.role), [appDb.units]);

  const basePolicies = useMemo(() => {
    let f = appDb.policies || [];
    if (filterUnit !== 'ALL') f = f.filter(p => p.primary_unit === filterUnit || p.secondary_units?.includes(filterUnit) || p.primary_unit === 'ทุกหน่วย');
    return f;
  }, [appDb.policies, filterUnit]);

  const baseReports = useMemo(() => {
    let r = appDb.reports || [];
    if (filterUnit !== 'ALL') r = r.filter(x => x.unit_name === filterUnit);
    if (fiscalYear !== 'ALL') {
      const dates = getFiscalYearDates(fiscalYear);
      r = r.filter(x => {
        const d = new Date(x.report_date);
        return d >= new Date(dates.start) && d <= new Date(dates.end);
      });
    }
    return r;
  }, [appDb.reports, filterUnit, fiscalYear]);

  const tasksByPolicy = useMemo(() => {
    const map = {};
    (appDb.tasks || []).forEach(t => {
       if (t.policy_id) { if (!map[t.policy_id]) map[t.policy_id] = []; map[t.policy_id].push(t); }
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

  const renderDashboardSection = (title, iconComponent, sectionPolicies) => {
    if (sectionPolicies.length === 0) return null;
    const sectionPolicyIds = sectionPolicies.map(p => p.policy_id);
    const sectionReports = baseReports.filter(r => sectionPolicyIds.includes(r.policy_id));

    let progList = sectionPolicies.map(po => {
      const rs = sectionReports.filter(r => r.policy_id === po.policy_id).sort((a, b) => new Date(b.report_date || b.created_at) - new Date(a.report_date || a.created_at));
      const linkedTasks = tasksByPolicy[po.policy_id] || [];
      const progress = rs.length ? (rs[0].progress_percent || 0) : 0;
      return { 
        id: po.policy_id, name: po.order, short: `[ลำดับ ${po.policy_no || '-'}] ${po.order.length > 50 ? po.order.substring(0, 50) + '...' : po.order}`,
        progress: progress, statusBucket: getStatusBucket(progress), linkedTasksCount: linkedTasks.length, is_important: po.is_important
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
        const start = cumulativePercent; const slicePercent = (d.value / cPols.length) * 100; cumulativePercent += slicePercent;
        return `${STATUS_COLORS[d.name]} ${start}% ${cumulativePercent}%`;
      }).join(', ') : 'transparent 0% 100%';

      if (selectedStatus) cProgList = cProgList.filter(x => x.statusBucket === selectedStatus);

      return { commander: cmd, total: cPols.length, completed: cCompleted, avg: cAvg, progList: cProgList, statusCount: cStatusCount, donutGradientStops };
    }).sort((a, b) => b.total - a.total); 

    return (
      <div className="mt-12 pt-8 border-t-[3px] border-slate-700/80 first:mt-0 first:pt-0 first:border-0">
        <div className="flex items-center gap-4 mb-6"><div className="bg-amber-500/20 p-3 rounded-xl text-amber-400 border border-amber-500/30">{iconComponent}</div><h2 className="text-2xl md:text-3xl font-bold">{title}</h2></div>
        {groupedByCommander.map((group, index) => (
          <div key={index} className="mt-8 pt-8 border-t border-slate-700/50 first:mt-0 first:pt-0 first:border-0">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h3 className="text-xl font-bold text-sky-500 flex items-center gap-2"><ShieldCheck size={24} /> ผู้สั่งการ: {group.commander}</h3>
              <div className="flex items-center gap-3">
                <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-sm border border-slate-700">ทั้งหมด {group.total} เรื่อง | เสร็จแล้ว {group.completed} เรื่อง</span>
                <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full text-sm font-bold border border-sky-500/30">คืบหน้าเฉลี่ย {group.avg.toFixed(1)}%</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col items-center">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 w-full"><PieChart size={20} className="text-slate-400"/> สัดส่วนความคืบหน้า</h3>
                <div className="relative w-48 h-48 rounded-full mb-6 cursor-pointer transform hover:scale-105 transition-transform" onClick={() => setSelectedStatus(null)} style={{ background: group.total > 0 ? `conic-gradient(${group.donutGradientStops})` : '#334155' }}>
                  <div className="absolute inset-0 m-auto w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center border-[8px] border-slate-800"><div className="text-center"><div className="text-2xl font-bold">{group.total}</div><div className="text-[10px] text-slate-400">ข้อสั่งการ</div></div></div>
                </div>
                <div className="w-full space-y-2 mt-auto">
                  {group.statusCount.map(s => (
                    <div key={s.name} onClick={() => setSelectedStatus(selectedStatus === s.name ? null : s.name)} className={`flex items-center justify-between text-xs p-2 rounded-lg cursor-pointer border ${selectedStatus === s.name ? 'border-amber-500 bg-slate-700/50' : 'border-transparent hover:bg-slate-700/30'}`}>
                      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[s.name] }}></span><span className={selectedStatus === s.name ? 'text-amber-400 font-bold' : 'text-slate-400'}>{s.name}</span></div><span className="font-medium">{s.value}</span>
                    </div>
                  ))}
                  {group.total === 0 && <p className="text-center text-sm text-slate-500">ไม่มีข้อมูล</p>}
                </div>
              </div>
              <div className="lg:col-span-8 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><BarChart size={20} className="text-slate-400"/> รายการข้อสั่งการ {selectedStatus && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-1 rounded ml-2">กรอง: {selectedStatus}</span>}</h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5" style={{ maxHeight: '350px' }}>
                  {group.progList.map(p => {
                    const isExpanded = expandedPolicyId === p.id;
                    return (
                      <div key={p.id} className={`relative flex flex-col gap-2 p-3 rounded-lg border transition-all ${isExpanded ? 'bg-slate-700/40 border-amber-500 shadow-inner' : 'bg-slate-900/50 border-slate-700/50 hover:border-amber-500/50'}`}>
                        <div className="cursor-pointer" onClick={() => setExpandedPolicyId(isExpanded ? null : p.id)}>
                          <div className="flex justify-between items-start text-xs mb-2">
                            <span className="font-medium pr-4 flex items-start gap-1" title={p.name}>{p.is_important && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0 mt-0.5" />}<span className="leading-snug text-slate-200">{p.short}</span></span>
                            <div className="text-right shrink-0 flex flex-col items-end"><span className="font-bold font-mono text-base" style={{ color: getBarColor(p.progress) }}>{p.progress}%</span>{isExpanded ? <ChevronUp size={14} className="text-slate-400 mt-1"/> : <ChevronDown size={14} className="text-slate-400 mt-1"/>}</div>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.progress}%`, backgroundColor: getBarColor(p.progress) }}></div></div>
                          {p.linkedTasksCount > 0 && !isExpanded && <div className="flex items-center justify-between text-[10px] mt-2 text-slate-400"><span className="flex items-center gap-1"><GitMerge size={10}/> มีภารกิจย่อย {p.linkedTasksCount} รายการ</span></div>}
                        </div>
                        {isExpanded && p.linkedTasksCount > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-700"><p className="text-xs text-sky-400">มีภารกิจเชื่อมโยง {p.linkedTasksCount} รายการ (ตรวจสอบในแท็บ "ติดตามภารกิจ")</p></div>
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
    <div className="space-y-6 animate-fade-in-up text-slate-100">
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 print-hide flex flex-col md:flex-row justify-between items-center gap-4">
        <div><h2 className="text-xl font-bold flex items-center gap-2 text-amber-500"><LayoutDashboard size={24} /> ภาพรวมนโยบายและข้อสั่งการ</h2></div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {selectedStatus && <button onClick={() => setSelectedStatus(null)} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"><FilterX size={16}/> ล้างการกรอง</button>}
          <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} disabled={!isAdminOrExec} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm outline-none"><option value="ALL">ทุกหน่วยงาน</option>{currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
          <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm outline-none"><option value="ALL">ทุกปีงบประมาณ</option><option value="2567">ปีงบประมาณ 2567</option><option value="2568">ปีงบประมาณ 2568</option><option value="2569">ปีงบประมาณ 2569</option></select>
          <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg text-sm transition-colors"><Printer size={18}/></button>
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
            <div key={kpi.label} onClick={() => kpi.status ? setSelectedStatus(kpi.status) : setSelectedStatus(null)} className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 shadow-lg relative group ${isSelected ? `ring-2 ring-offset-2 ring-offset-slate-900 border-transparent ${kpi.bg}` : `border-slate-700 bg-slate-800 hover:${kpi.border} hover:bg-slate-700/50`}`}>
              <p className="text-slate-400 text-sm font-medium">{kpi.label}</p><h3 className={`text-3xl font-bold mt-2 ${kpi.color}`}>{kpi.val}</h3>
            </div>
          )
        })}
      </div>
      <div className="space-y-12">
        {renderDashboardSection('นโยบายหลัก', <ShieldCheck size={28} />, mainPolicies)}
        {renderDashboardSection('สั่งการเพิ่มเติม', <FileText size={28} />, additionalPolicies)}
        {mainPolicies.length === 0 && additionalPolicies.length === 0 && <div className="text-center py-16 text-slate-500 bg-slate-800 rounded-xl border border-slate-700"><LayoutDashboard size={48} className="mx-auto mb-4 opacity-20" /><p>ไม่พบข้อมูลนโยบายหรือข้อสั่งการ</p></div>}
      </div>
    </div>
  );
}

// ============== TASK DASHBOARD ==============
function TaskDashboard({ appDb, user }) {
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const [filterUnit, setFilterUnit] = useState(isAdminOrExec ? 'ALL' : user.unitName);
  const [selectedStatus, setSelectedStatus] = useState(null);
  
  const baseTasks = useMemo(() => {
    let tasks = appDb.tasks || [];
    if (filterUnit !== 'ALL') tasks = tasks.filter(t => t.primary_unit === filterUnit || t.secondary_units?.includes(filterUnit));
    return tasks;
  }, [appDb.tasks, filterUnit]);

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
    return { totalTasks, completedTasks, delayedTasks, statusCount };
  }, [baseTasks]);

  let cumulativePercent = 0;
  const donutGradientStops = stats.statusCount.length > 0 ? stats.statusCount.map(d => {
    const start = cumulativePercent; const slicePercent = (d.value / stats.totalTasks) * 100; cumulativePercent += slicePercent;
    return `${TASK_STATUS_COLORS[d.name]} ${start}% ${cumulativePercent}%`;
  }).join(', ') : 'transparent 0% 100%';

  return (
    <div className="space-y-6 animate-fade-in-up text-slate-100">
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex justify-between items-center gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500"><PieChart size={24} /> ภาพรวมภารกิจ</h2>
        <div className="flex gap-3">
          {selectedStatus && <button onClick={() => setSelectedStatus(null)} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">ล้างการกรอง</button>}
          <select value={filterUnit} onChange={e => {setFilterUnit(e.target.value); setSelectedStatus(null);}} disabled={!isAdminOrExec} className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm disabled:opacity-50"><option value="ALL">ทุกหน่วยงาน</option>{(appDb.units||[]).map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
          <button onClick={() => window.print()} className="bg-slate-700 text-white p-2.5 rounded-lg text-sm"><Printer size={18}/></button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'จำนวนภารกิจรวม', val: stats.totalTasks, status: null, color: 'text-slate-100', border: 'border-slate-600', bg: 'bg-slate-800' },
          { label: 'เสร็จสมบูรณ์', val: stats.completedTasks, status: 'เสร็จสิ้น', color: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-950/20' },
          { label: 'กำลังดำเนินการ', val: baseTasks.filter(t=>t.status==='กำลังดำเนินการ').length, status: 'กำลังดำเนินการ', color: 'text-sky-400', border: 'border-sky-500', bg: 'bg-sky-950/20' },
          { label: 'ล่าช้า/ติดปัญหา', val: stats.delayedTasks, status: 'ล่าช้า/ติดปัญหา', color: 'text-red-400', border: 'border-red-500', bg: 'bg-red-950/20' }
        ].map(kpi => (
          <div key={kpi.label} onClick={() => setSelectedStatus(kpi.status)} className={`p-6 rounded-xl border-2 cursor-pointer transition-all shadow-lg ${selectedStatus === kpi.status ? `border-amber-500 ${kpi.bg}` : `border-slate-700 bg-slate-800 hover:${kpi.border}`}`}>
             <p className="text-slate-400 text-sm font-medium">{kpi.label}</p><h3 className={`text-3xl font-bold mt-2 ${kpi.color}`}>{kpi.val}</h3>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center">
            <h3 className="font-semibold w-full mb-6">สัดส่วนสถานะงาน</h3>
            <div className="relative w-48 h-48 rounded-full mb-6 cursor-pointer" onClick={()=>setSelectedStatus(null)} style={{ background: stats.totalTasks > 0 ? `conic-gradient(${donutGradientStops})` : '#334155' }}>
               <div className="absolute inset-0 m-auto w-32 h-32 bg-slate-800 rounded-full flex flex-col items-center justify-center border-[8px] border-slate-800"><span className="text-2xl font-bold">{stats.totalTasks}</span></div>
            </div>
            <div className="w-full space-y-2">
               {stats.statusCount.map(s => (
                 <div key={s.name} onClick={() => setSelectedStatus(selectedStatus === s.name ? null : s.name)} className={`flex justify-between text-xs p-2 rounded cursor-pointer border ${selectedStatus === s.name ? 'border-amber-500 bg-slate-700' : 'border-transparent'}`}>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: TASK_STATUS_COLORS[s.name] }}></span><span className={selectedStatus===s.name?'text-amber-400 font-bold':''}>{s.name}</span></div><span>{s.value}</span>
                 </div>
               ))}
            </div>
         </div>
         
         <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col">
            <h3 className="font-semibold mb-6 flex items-center gap-2"><ListTodo size={20} className="text-amber-500"/> รายการภารกิจ {selectedStatus && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-1 rounded">กรอง: {selectedStatus}</span>}</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 max-h-[400px]">
               {baseTasks.filter(t => selectedStatus ? t.status === selectedStatus : true).map(t => (
                  <div key={t.task_id} className="p-4 bg-slate-900 rounded-lg border border-slate-700/50">
                     <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>{t.status}</span>
                        <span className="text-xs font-mono font-bold" style={{ color: getBarColor(t.progress_percent) }}>{t.progress_percent}%</span>
                     </div>
                     <p className="text-sm font-bold text-slate-200 line-clamp-2">{t.task_name}</p>
                     <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${t.progress_percent}%`, backgroundColor: getBarColor(t.progress_percent) }}></div></div>
                     {t.status === 'ล่าช้า/ติดปัญหา' && t.root_cause && <p className="text-[10px] text-red-400 mt-2 bg-red-950/30 p-1.5 rounded inline-block border border-red-900/50">สาเหตุ: {t.root_cause}</p>}
                  </div>
               ))}
               {baseTasks.filter(t => selectedStatus ? t.status === selectedStatus : true).length === 0 && <p className="text-center py-10 text-slate-500">ไม่มีข้อมูลตามเงื่อนไข</p>}
            </div>
         </div>
      </div>
    </div>
  );
}

// ============== EXECUTIVE SUMMARY ==============
function ExecutiveSummary({ appDb }) {
  const stats = useMemo(() => {
    const unitStats = {};
    const policies = appDb.policies || [];
    const reports = appDb.reports || [];

    (appDb.units || []).filter(u => u.role === 'user' || !u.role).forEach(u => { unitStats[u.name] = { totalPolicies: 0, progressSum: 0, completed: 0, reports: 0 }; });

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
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center bg-slate-800 p-5 rounded-xl border border-slate-700">
        <h2 className="text-2xl font-bold flex gap-2 text-amber-500"><Briefcase size={28}/> บทสรุปผู้บริหาร</h2>
        <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm flex gap-2"><Printer size={16}/> พิมพ์รายงาน</button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-6">
        <h3 className="text-lg font-bold text-amber-500 mb-6 flex gap-2"><TrendingUp size={20}/> จัดอันดับความสำเร็จของหน่วยงาน (Leaderboard)</h3>
        <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
           {stats.unitArray.map((u, i) => (
             <div key={u.name} className="p-5 rounded-xl bg-slate-900 border border-slate-700 flex items-center gap-5">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-lg border border-amber-500/30 shrink-0">{i+1}</div>
                <div className="flex-1">
                   <div className="flex justify-between items-end mb-2"><h4 className="font-bold text-lg">{u.name}</h4><span className="font-mono text-xl font-bold" style={{color: getBarColor(u.avgProgress)}}>{u.avgProgress.toFixed(1)}%</span></div>
                   <p className="text-sm text-slate-400 mb-3">รับผิดชอบข้อสั่งการ {u.totalPolicies} เรื่อง | ดำเนินการเสร็จแล้ว {u.completed} เรื่อง</p>
                   <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700"><div className="h-full rounded-full transition-all duration-1000" style={{width: `${u.avgProgress}%`, background: getBarColor(u.avgProgress)}}></div></div>
                </div>
             </div>
           ))}
           {stats.unitArray.length === 0 && <p className="text-center py-10 text-slate-500">ไม่มีข้อมูลการปฏิบัติงาน</p>}
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
  const [currentPage, setCurrentPage] = useState(1);
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';

  const policies = appDb.policies || [];
  const filtered = policies.filter(p => p.order.toLowerCase().includes(search.toLowerCase()) || p.commander.toLowerCase().includes(search.toLowerCase())).sort((a,b) => parseInt(a.policy_no||0) - parseInt(b.policy_no||0));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const isUpdating = !!editData;
    const policyId = isUpdating ? editData.policy_id : `POL-${Date.now()}`;
    const payload = { ...data, policy_id: policyId, created_at: isUpdating ? editData.created_at : new Date().toISOString() };
    
    showToast('กำลังบันทึกข้อมูล...');
    const success = await callApi(isUpdating ? "update" : "insert", "policies", payload, "policy_id", policyId);
    if (success) { showToast('บันทึกเรียบร้อย', 'ok'); setModalOpen(false); refresh(); }
  };

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันลบข้อสั่งการนี้?')) {
      showToast('กำลังลบ...');
      const success = await callApi("delete", "policies", null, "policy_id", id);
      if (success) { showToast('ลบเรียบร้อย', 'ok'); refresh(); }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 p-5 rounded-xl border border-slate-700 gap-4">
        <h2 className="text-xl font-bold flex gap-2 text-amber-500 whitespace-nowrap"><ScrollText size={24} /> ฐานข้อมูลข้อสั่งการ</h2>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1">
             <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
             <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาข้อสั่งการ..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm outline-none text-white focus:border-amber-500"/>
          </div>
          {user.role === 'admin' && <button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"><Plus size={16}/> เพิ่ม</button>}
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto shadow-xl">
         <table className="w-full text-sm text-left text-slate-200">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400">
               <tr><th className="p-4">ลำดับ</th><th className="p-4">ผู้สั่งการ</th><th className="p-4 min-w-[300px]">ข้อสั่งการ</th><th className="p-4">กำหนดเสร็จ</th><th className="p-4">หน่วยรับผิดชอบ</th>{user.role === 'admin' && <th className="p-4 text-center">จัดการ</th>}</tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
               {paginated.map(p => (
                 <tr key={p.policy_id} className="hover:bg-slate-700/30">
                    <td className="p-4 font-bold text-amber-500 text-center">{p.policy_no || '-'}</td>
                    <td className="p-4 text-xs whitespace-nowrap">{p.commander}</td>
                    <td className="p-4 leading-relaxed">{p.order}</td>
                    <td className="p-4 text-xs text-emerald-400 whitespace-nowrap">{p.timeframe || '-'}</td>
                    <td className="p-4 font-medium text-sky-400">{p.primary_unit}</td>
                    {user.role === 'admin' && (
                      <td className="p-4 text-center whitespace-nowrap">
                        <button onClick={() => { setEditData(p); setModalOpen(true); }} className="text-sky-400 hover:text-white p-1.5 rounded mr-2 bg-sky-900/30"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(p.policy_id)} className="text-red-400 hover:text-white p-1.5 rounded bg-red-900/30"><Trash2 size={16}/></button>
                      </td>
                    )}
                 </tr>
               ))}
               {filtered.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-500">ไม่มีข้อมูล</td></tr>}
            </tbody>
         </table>
      </div>
      <Pagination currentPage={currentPage} totalItems={filtered.length} onPageChange={setCurrentPage} />
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-2xl text-white border border-slate-700 shadow-2xl animate-fade-in-up">
             <h3 className="text-2xl font-bold mb-6 text-amber-500 border-b border-slate-700 pb-3">{editData ? 'แก้ไขข้อสั่งการ' : 'เพิ่มข้อสั่งการใหม่'}</h3>
             <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   <div><label className="text-xs text-slate-400 block mb-1">ประเภท</label><select name="category" defaultValue={editData?.category||'นโยบายหลัก'} className="w-full bg-slate-900 p-3 rounded-lg border border-slate-600 focus:border-amber-500 outline-none"><option value="นโยบายหลัก">นโยบายหลัก</option><option value="สั่งการเพิ่มเติม">สั่งการเพิ่มเติม</option></select></div>
                   <div><label className="text-xs text-slate-400 block mb-1">ลำดับ (เช่น 1, 2)</label><input name="policy_no" defaultValue={editData?.policy_no} required className="w-full bg-slate-900 p-3 rounded-lg border border-slate-600 focus:border-amber-500 outline-none"/></div>
                   <div><label className="text-xs text-slate-400 block mb-1">ผู้สั่งการ</label><input name="commander" defaultValue={editData?.commander||'ผบ.ทสส.'} required className="w-full bg-slate-900 p-3 rounded-lg border border-slate-600 focus:border-amber-500 outline-none"/></div>
                </div>
                <div><label className="text-xs text-slate-400 block mb-1">รายละเอียดข้อสั่งการ</label><textarea name="order" defaultValue={editData?.order} required rows="4" className="w-full bg-slate-900 p-3 rounded-lg border border-slate-600 focus:border-amber-500 outline-none"></textarea></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div><label className="text-xs text-slate-400 block mb-1">กำหนดเสร็จ (ถ้ามี)</label><input name="timeframe" defaultValue={editData?.timeframe} placeholder="เช่น ภายใน ส.ค. 69" className="w-full bg-slate-900 p-3 rounded-lg border border-slate-600 focus:border-amber-500 outline-none"/></div>
                   <div>
                     <label className="text-xs text-slate-400 block mb-1">หน่วยรับผิดชอบหลัก</label>
                     <select name="primary_unit" defaultValue={editData?.primary_unit||'ทุกหน่วย'} className="w-full bg-slate-900 p-3 rounded-lg border border-slate-600 focus:border-amber-500 outline-none">
                       <option value="ทุกหน่วย">ทุกหน่วย</option>
                       {(appDb.units||[]).filter(u=>u.role==='user'||!u.role).map(u=><option key={u.id} value={u.name}>{u.name}</option>)}
                     </select>
                   </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-700 mt-6"><button type="button" onClick={()=>setModalOpen(false)} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">ยกเลิก</button><button type="submit" className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 font-bold rounded-lg transition-colors">บันทึกข้อมูล</button></div>
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
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const visible = isAdminOrExec ? tasks : tasks.filter(t => t.primary_unit === user.unitName);
  const filtered = visible.filter(t => t.task_name.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>new Date(a.start_date)-new Date(b.start_date));

  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const isUpdating = !!editData;
    const taskId = isUpdating ? editData.task_id : `TSK-${Date.now()}`;
    const payload = { ...data, task_id: taskId, progress_percent: Number(data.progress_percent) || 0 };
    if(data.status !== 'ล่าช้า/ติดปัญหา') payload.root_cause = '';
    
    showToast('กำลังบันทึก...');
    const success = await callApi(isUpdating ? "update" : "insert", "tasks", payload, "task_id", taskId);
    if (success) { showToast('บันทึกเรียบร้อย', 'ok'); setModalOpen(false); refresh(); }
  };

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันลบงานนี้?')) {
      const success = await callApi("delete", "tasks", null, "task_id", id);
      if (success) { showToast('ลบเรียบร้อย', 'ok'); refresh(); }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
       <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 p-5 rounded-xl border border-slate-700 gap-4">
         <h2 className="text-xl font-bold flex gap-2 text-amber-500 whitespace-nowrap"><CheckSquare size={24} /> ติดตามการทำงาน (Tasks)</h2>
         <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1">
               <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
               <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหางาน..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-amber-500 outline-none"/>
            </div>
            {user.role !== 'executive' && <button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors"><Plus size={16}/>เพิ่มงาน</button>}
         </div>
       </div>

       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto shadow-xl">
         <table className="w-full text-sm text-left text-slate-200">
           <thead className="bg-slate-900 border-b border-slate-700 text-slate-400">
              <tr><th className="p-4 min-w-[200px]">ชื่องาน</th><th className="p-4">หน่วย</th><th className="p-4">ระยะเวลา</th><th className="p-4">สถานะ</th><th className="p-4 w-32">ความคืบหน้า</th>{user.role !== 'executive' && <th className="p-4 text-center">จัดการ</th>}</tr>
           </thead>
           <tbody className="divide-y divide-slate-700/50">
              {filtered.map(t => (
                <tr key={t.task_id} className="hover:bg-slate-700/30">
                   <td className="p-4 font-bold text-slate-100">{t.task_name}</td>
                   <td className="p-4 text-xs font-medium text-sky-400">{t.primary_unit}</td>
                   <td className="p-4 text-xs text-slate-400">{formatDate(t.start_date)} - {formatDate(t.end_date)}</td>
                   <td className="p-4"><span className={`px-2.5 py-1 rounded text-[10px] border ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>{t.status}</span></td>
                   <td className="p-4">
                     <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700"><div className="h-full rounded-full" style={{width:`${t.progress_percent}%`, background:getBarColor(t.progress_percent)}}></div></div>
                        <span className="text-[10px] font-bold font-mono" style={{color:getBarColor(t.progress_percent)}}>{t.progress_percent}%</span>
                     </div>
                   </td>
                   {user.role !== 'executive' && (
                     <td className="p-4 text-center whitespace-nowrap">
                        <button onClick={() => { setEditData(t); setModalOpen(true); }} className="text-sky-400 hover:text-white p-1.5 rounded bg-sky-900/30 mr-2"><Edit size={16}/></button>
                        {(user.role === 'admin' || t.primary_unit === user.unitName) && <button onClick={() => handleDelete(t.task_id)} className="text-red-400 hover:text-white p-1.5 rounded bg-red-900/30"><Trash2 size={16}/></button>}
                     </td>
                   )}
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-500">ไม่มีข้อมูลภารกิจ</td></tr>}
           </tbody>
         </table>
       </div>

       {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-xl text-white shadow-2xl border border-slate-700 animate-fade-in-up">
                <h3 className="text-2xl font-bold mb-6 text-amber-500 border-b border-slate-700 pb-3">{editData ? 'อัปเดตงาน' : 'เพิ่มงานใหม่'}</h3>
                <form onSubmit={handleSave} className="space-y-5">
                   <div><label className="text-xs text-slate-400 block mb-1">ชื่องาน/ภารกิจ</label><input name="task_name" defaultValue={editData?.task_name} required className="w-full bg-slate-900 p-3 rounded-lg border border-slate-600 focus:border-amber-500 outline-none"/></div>
                   <div className="grid grid-cols-2 gap-5">
                      <div><label className="text-xs text-slate-400 block mb-1">วันที่เริ่ม</label><input type="date" name="start_date" defaultValue={editData?.start_date ? editData.start_date.substring(0,10) : new Date().toISOString().substring(0,10)} required className="w-full bg-slate-900 p-3 rounded-lg border border-slate-600 focus:border-amber-500 outline-none" style={{colorScheme:'dark'}}/></div>
                      <div><label className="text-xs text-slate-400 block mb-1">วันกำหนดเสร็จ</label><input type="date" name="end_date" defaultValue={editData?.end_date ? editData.end_date.substring(0,10) : ''} required className="w-full bg-slate-900 p-3 rounded-lg border border-slate-600 focus:border-amber-500 outline-none" style={{colorScheme:'dark'}}/></div>
                   </div>
                   <div className="grid grid-cols-2 gap-5 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                      <div><label className="text-xs text-sky-400 font-bold block mb-1">สถานะ</label><select name="status" defaultValue={editData?.status||'รอดำเนินการ'} className="w-full bg-slate-900 p-3 rounded-lg border border-sky-500/50 outline-none"><option value="รอดำเนินการ">รอดำเนินการ</option><option value="กำลังดำเนินการ">กำลังดำเนินการ</option><option value="เสร็จสิ้น">เสร็จสิ้น</option><option value="ล่าช้า/ติดปัญหา">ล่าช้า/ติดปัญหา</option></select></div>
                      <div><label className="text-xs text-sky-400 font-bold block mb-1">ความคืบหน้า (%)</label><input type="number" name="progress_percent" defaultValue={editData?.progress_percent||0} min="0" max="100" className="w-full bg-slate-900 p-3 rounded-lg border border-sky-500/50 outline-none text-lg font-mono"/></div>
                   </div>
                   <div><label className="text-xs text-slate-400 block mb-1">หน่วยรับผิดชอบ</label><input name="primary_unit" value={editData?.primary_unit || user.unitName} readOnly={user.role !== 'admin'} className="w-full bg-slate-900 p-3 rounded-lg border border-slate-600 opacity-70"/></div>
                   <div className="flex justify-end gap-3 pt-6 border-t border-slate-700 mt-6"><button type="button" onClick={()=>setModalOpen(false)} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">ยกเลิก</button><button type="submit" className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 font-bold rounded-lg transition-colors">บันทึกข้อมูล</button></div>
                </form>
             </div>
          </div>
       )}
    </div>
  )
}

// ============== REPORT FORM ==============
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
      report_id: reportId, policy_id: data.policy_id, policy_no: pol.policy_no || '-',
      policy_snippet: pol.order.substring(0, 100), unit_name: user.unitName,
      report_date: data.report_date, past_result: data.past_result, next_plan: data.next_plan, 
      problems: data.problems, progress_percent: Number(data.progress_percent) || 0,
      approval_status: 'อนุมัติแล้ว', created_at: new Date().toISOString()
    };

    showToast('กำลังบันทึกรายงานไปยังระบบ...');
    const success = await callApi("insert", "reports", payload, "report_id", reportId);
    if (success) { showToast('บันทึกรายงานสำเร็จ', 'ok'); refresh(); setView('HISTORY'); }
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl animate-fade-in-up text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      <h2 className="text-2xl font-bold flex items-center gap-3 text-amber-500 mb-2 relative z-10"><FilePlus size={28}/> บันทึกรายงานผลการดำเนินงาน</h2>
      <p className="text-sm text-slate-400 mb-8 border-b border-slate-700 pb-4 relative z-10">รายงานในนามหน่วยงาน: <span className="text-amber-400 font-bold">{user.unitName}</span></p>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
         <div>
            <label className="text-sm text-slate-300 font-bold block mb-2">อ้างอิงนโยบาย/ข้อสั่งการ <span className="text-red-500">*</span></label>
            <select name="policy_id" required className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3.5 outline-none transition-colors">
               <option value="">-- กรุณาเลือกข้อสั่งการที่เกี่ยวข้อง --</option>
               {availPolicies.map(p => <option key={p.policy_id} value={p.policy_id}>[{p.policy_no}] {p.order.substring(0,80)}...</option>)}
            </select>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="text-sm text-slate-300 font-bold block mb-2">วันที่รายงาน <span className="text-red-500">*</span></label><input type="date" name="report_date" defaultValue={new Date().toISOString().substring(0,10)} required className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3.5 outline-none" style={{colorScheme:'dark'}}/></div>
            <div><label className="text-sm text-slate-300 font-bold block mb-2">ความคืบหน้าสะสม (%) <span className="text-red-500">*</span></label><input type="number" name="progress_percent" min="0" max="100" required defaultValue="0" className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3.5 outline-none text-lg font-mono text-amber-400"/></div>
         </div>
         <div><label className="text-sm text-slate-300 font-bold block mb-2">สรุปผลการดำเนินการที่ผ่านมา <span className="text-red-500">*</span></label><textarea name="past_result" required rows="4" placeholder="ระบุสิ่งที่ได้ดำเนินการไปแล้ว..." className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3.5 outline-none"></textarea></div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-700 pt-6 mt-2">
            <div><label className="text-sm text-emerald-400 font-bold block mb-2">แผนดำเนินการต่อไป</label><textarea name="next_plan" rows="3" placeholder="สิ่งที่จะทำในก้าวถัดไป..." className="w-full bg-slate-900 border border-slate-600 focus:border-emerald-500 rounded-xl p-3.5 outline-none"></textarea></div>
            <div><label className="text-sm text-red-400 font-bold block mb-2">ปัญหา / ข้อขัดข้อง</label><textarea name="problems" rows="3" placeholder="ระบุปัญหาที่ทำให้งานล่าช้า..." className="w-full bg-slate-900 border border-slate-600 focus:border-red-500 rounded-xl p-3.5 outline-none"></textarea></div>
         </div>
         <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-xl font-bold mt-6 shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] transition-all flex justify-center items-center gap-2 text-lg"><Send size={20}/> ส่งรายงาน</button>
      </form>
    </div>
  )
}

function History({ appDb, user, showToast, callApi, refresh }) {
  const reports = appDb.reports || [];
  const visible = (user.role === 'admin' || user.role === 'executive') ? reports : reports.filter(r => r.unit_name === user.unitName);
  const sorted = visible.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันลบรายงานนี้อย่างถาวร?')) {
      showToast('กำลังลบข้อมูล...');
      const success = await callApi("delete", "reports", null, "report_id", id);
      if (success) { showToast('ลบเรียบร้อย', 'ok'); refresh(); }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
       <div className="flex justify-between items-center bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md">
          <h2 className="text-xl font-bold flex items-center gap-2 text-amber-500"><HistoryIcon size={24}/> ประวัติการส่งรายงาน ({sorted.length})</h2>
       </div>
       <div className="grid gap-4">
          {sorted.map(r => (
            <div key={r.report_id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between gap-4 shadow-lg hover:border-amber-500/50 transition-colors">
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-xs text-sky-400 font-bold bg-sky-900/30 px-2 py-1 rounded border border-sky-500/20">{r.unit_name}</span>
                     <span className="text-xs text-slate-500 font-mono">{formatDate(r.report_date)}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mb-2 leading-relaxed">[{r.policy_no}] {r.policy_snippet}</h4>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-700/50">
                     <p className="text-xs text-slate-300 leading-relaxed"><b className="text-emerald-500">ผลการปฏิบัติ:</b> {r.past_result}</p>
                     {r.problems && r.problems !== '-' && <p className="text-xs text-red-400 mt-2 border-t border-slate-700 pt-2"><b className="text-red-500">ปัญหา:</b> {r.problems}</p>}
                  </div>
               </div>
               <div className="md:w-32 flex flex-row md:flex-col justify-between items-end shrink-0 border-t md:border-t-0 md:border-l border-slate-700 pt-3 md:pt-0 md:pl-4">
                  <div className="text-right w-full flex flex-col items-end">
                     <span className="text-sm text-slate-400 mb-1">ความคืบหน้า</span>
                     <span className="text-3xl font-bold font-mono" style={{color: getBarColor(r.progress_percent)}}>{r.progress_percent}%</span>
                  </div>
                  {user.role === 'admin' && <button onClick={()=>handleDelete(r.report_id)} className="text-slate-400 hover:text-red-500 hover:bg-red-900/30 p-2 rounded transition-colors"><Trash2 size={18}/></button>}
               </div>
            </div>
          ))}
          {sorted.length === 0 && <p className="text-center p-12 text-slate-500 bg-slate-800 rounded-xl border border-slate-700">ไม่มีประวัติการรายงานในระบบ</p>}
       </div>
    </div>
  )
}

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
       <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex justify-between items-center shadow-md">
          <div>
            <h2 className="text-xl font-bold flex gap-2 text-amber-500"><Users size={24}/> จัดการบัญชีผู้ใช้ระบบ</h2>
            <p className="text-xs text-slate-400 mt-1">ใช้จัดการหน่วยงาน ผู้บริหาร และแอดมิน เพื่อเข้าใช้งานระบบ (เพิ่ม/แก้ ใน Google Sheets โดยตรง)</p>
          </div>
       </div>
       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto shadow-xl">
          <table className="w-full text-sm text-left text-slate-200">
             <thead className="bg-slate-900 text-slate-400 border-b border-slate-700"><tr><th className="p-4">รหัสอ้างอิง</th><th className="p-4">ชื่อหน่วย/บัญชี</th><th className="p-4">สิทธิ์การใช้งาน (Role)</th><th className="p-4">รหัสผ่าน</th><th className="p-4 text-center">ลบ</th></tr></thead>
             <tbody className="divide-y divide-slate-700/50">
                {units.map(u => (
                  <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                     <td className="p-4 text-xs font-mono text-slate-500">{u.id}</td>
                     <td className="p-4 font-bold text-slate-100">{u.name}</td>
                     <td className="p-4 text-xs">
                        <span className={`px-2.5 py-1 rounded border font-bold ${u.role === 'admin' ? 'bg-purple-900/30 border-purple-500/30 text-purple-400' : u.role === 'executive' ? 'bg-amber-900/30 border-amber-500/30 text-amber-400' : 'bg-sky-900/30 border-sky-500/30 text-sky-400'}`}>{u.role}</span>
                     </td>
                     <td className="p-4 font-mono text-emerald-400 tracking-widest">{u.passcode}</td>
                     <td className="p-4 text-center"><button onClick={()=>handleDelete(u.id)} className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-900/30 transition-colors"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
                {units.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500">ไม่มีข้อมูลบัญชีผู้ใช้งาน</td></tr>}
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
    if (isOpen && messages.length === 0) setMessages([{ sender: 'bot', text: 'สวัสดีครับ! ผมคือ Assistant ประจำระบบ J4 ลองถามคำถามพื้นฐานเกี่ยวกับการทำงานหรือข้อสั่งการได้เลยครับ' }]);
  }, [isOpen]);
  
  useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault(); if (!input.trim() || isTyping) return;
    const userMsg = input.trim(); setMessages(prev => [...prev, { sender: 'user', text: userMsg }]); setInput(''); setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const lo = userMsg.toLowerCase();
      let reply = "ขออภัย โหมด Assistant เบื้องต้นรองรับคำสั่งพื้นฐาน ลองพิมพ์ 'สรุปภาพรวม', 'งานที่ล่าช้า' หรือ 'ใกล้เสร็จ' ดูนะครับ";
      
      if (lo.includes('สรุป') || lo.includes('ภาพรวม')) {
         const avgProg = (appDb.policies||[]).length ? (appDb.reports||[]).reduce((a,b)=>a+(Number(b.progress_percent)||0),0)/(appDb.reports||[]).length : 0;
         reply = `📊 ภาพรวมระบบ:\n- นโยบายทั้งหมด: ${(appDb.policies||[]).length} เรื่อง\n- ภารกิจทั้งหมด: ${(appDb.tasks||[]).length} ภารกิจ\n- ความคืบหน้าเฉลี่ยคร่าวๆ: ${avgProg.toFixed(1)}%`;
      } else if (lo.includes('ช้า') || lo.includes('ปัญหา')) {
         const delayed = (appDb.tasks||[]).filter(t=>t.status==='ล่าช้า/ติดปัญหา');
         reply = `⚠️ พบงานที่ล่าช้า/ติดปัญหาจำนวน ${delayed.length} รายการครับ ${delayed.length > 0 ? `ได้แก่:\n${delayed.map(t=>`- ${t.task_name}`).join('\n')}` : 'ยอดเยี่ยมมาก!'} `;
      } else if (lo.includes('ใกล้เสร็จ')) {
         const almost = (appDb.reports||[]).filter(r=>r.progress_percent >= 80 && r.progress_percent < 100).slice(0,3);
         reply = `🎯 ข้อสั่งการที่ใกล้เสร็จ (Top 3):\n${almost.length > 0 ? almost.map(r=>`- [${r.progress_percent}%] ${r.policy_snippet}`).join('\n') : 'ยังไม่มีข้อสั่งการที่อยู่ในช่วง 80-99% ครับ'}`;
      }
      
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 600);
  };

  return (
    <div className="print-hide fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[340px] md:w-[380px] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col h-[500px] animate-fade-in-up overflow-hidden">
          <div className="bg-slate-900 p-4 border-b border-amber-500/20 flex justify-between items-center">
             <div className="flex gap-2 items-center"><Bot className="text-amber-500"/><h3 className="font-bold text-white text-sm">J4 Assistant</h3></div>
             <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-800/50">
            {messages.map((m, i) => (
               <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${m.sender === 'user' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-slate-700 border border-slate-600 text-slate-100 rounded-bl-none'}`}>{m.text}</div>
               </div>
            ))}
            {isTyping && <div className="flex justify-start"><div className="px-4 py-3 rounded-2xl bg-slate-700 border border-slate-600 rounded-bl-none text-slate-400 text-xs flex gap-1"><span className="animate-bounce">.</span><span className="animate-bounce" style={{animationDelay:'0.1s'}}>.</span><span className="animate-bounce" style={{animationDelay:'0.2s'}}>.</span></div></div>}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} disabled={isTyping} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 text-sm text-white outline-none focus:border-amber-500 transition-colors" placeholder="ถามคำถาม..." />
            <button type="submit" disabled={isTyping || !input.trim()} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 p-3 rounded-xl text-white transition-colors"><Send size={18} /></button>
          </form>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className={`${isOpen ? 'bg-slate-700' : 'bg-amber-600 hover:bg-amber-500'} text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-all border border-slate-600`}>{isOpen ? <X size={24}/> : <MessageCircle size={24}/>}</button>
    </div>
  );
}
