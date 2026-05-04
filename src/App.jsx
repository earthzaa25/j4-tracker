import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShieldCheck, LayoutDashboard, ScrollText, FilePlus, History as HistoryIcon, LogOut, MessageCircle, Send, PieChart, BarChart, Plus, Edit, Trash2, Download, CloudUpload, Briefcase, AlertTriangle, TrendingUp, CheckCircle, CheckCircle2, FileText, CheckSquare, ListTodo, Activity, Printer, Check, X, Lock, Clock, Trophy, Paperclip, Bell, Sun, Moon, ChevronLeft, ChevronRight, Search, Kanban, Columns, List, Target, AlertOctagon, GitMerge, Users, Circle, Star, MousePointerClick, RefreshCcw, FilterX, CalendarDays, Table, ChevronDown, ChevronUp
} from 'lucide-react';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwgZZURz1cGNglxjEK-nGsm2g5cIT88GMG7gMkK2Zl2YydBCJyTlL65h8tcd63I2Z-R/exec";
const LOGO_URL = "/S__22413315.jpg";
const ITEMS_PER_PAGE = 10;

const FALLBACK_ACCOUNTS = [
  { id: "A-1", name: "ผู้ดูแลระบบกลาง (Admin)", passcode: "5721118", role: "admin" },
  { id: "E-1", name: "ผู้บริหารระดับสูง", passcode: "1111", role: "executive" },
  { id: "U-1", name: "หน่วยงานทดสอบ", passcode: "1234", role: "user" }
];

const STATUS_COLORS = { 'เสร็จแล้ว (100%)': '#10b981', 'กำลังจะแล้วเสร็จ (91-99%)': '#0ea5e9', 'ดำเนินการต่อเนื่อง (51-90%)': '#a855f7', 'อยู่ระหว่างดำเนินการ (21-50%)': '#f97316', 'ต่ำกว่าเกณฑ์ (0-20%)': '#ef4444' };
const TASK_STATUS_COLORS = { 'รอดำเนินการ': '#64748b', 'กำลังดำเนินการ': '#0ea5e9', 'เสร็จสิ้น': '#10b981', 'ล่าช้า/ติดปัญหา': '#ef4444' };

const getBarColor = (p) => { if (p === 100) return '#10b981'; if (p >= 91) return '#0ea5e9'; if (p >= 51) return '#a855f7'; if (p >= 21) return '#f97316'; return '#ef4444'; };

// --- UI Components ---
function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}>
      <span className="shrink-0">{icon}</span>
      <span className="ml-3 font-medium truncate">{label}</span>
    </button>
  );
}

// --- Screens ---
function LoginScreen({ onLogin, isLoading, appDb, loadData, errorMsg }) {
  const accounts = appDb.units && appDb.units.length > 0 ? appDb.units : FALLBACK_ACCOUNTS;
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => { if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id); }, [accounts, accountId]);

  const handleSubmit = (e) => {
    e.preventDefault(); setLocalError('');
    if (accounts.length === 0) { setLocalError('ไม่มีข้อมูลบัญชี'); return; }
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    if (String(password) !== String(account.passcode)) { setLocalError('รหัสผ่านไม่ถูกต้อง'); return; }
    onLogin(account.name, account.role || 'user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-amber-400 font-medium">กำลังเชื่อมต่อฐานข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 relative overflow-hidden">
        <div className="text-center mb-8 relative z-10">
          <div className="bg-white w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-5 p-2"><img src={LOGO_URL} alt="J4" className="w-full h-full object-contain" /></div>
          <h1 className="text-2xl font-bold text-slate-100">ระบบติดตามผลการปฏิบัติ</h1>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-900/40 border border-red-500 p-4 rounded-xl z-10 relative">
             <h3 className="text-red-400 font-bold text-sm mb-2"><AlertTriangle size={16} className="inline mr-1"/> ดึงข้อมูลไม่สำเร็จ</h3>
             <p className="text-xs text-red-200">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-medium">เลือกบัญชีผู้ใช้งาน</label>
            <select value={accountId} onChange={(e) => { setAccountId(e.target.value); setLocalError(''); }} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-slate-100 outline-none">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-medium">รหัสผ่าน</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-slate-100 outline-none" placeholder="รหัสผ่าน..." />
          </div>
          {localError && <p className="text-red-400 text-sm text-center">{localError}</p>}
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 transition-colors">เข้าสู่ระบบ</button>
        </form>
        <div className="mt-6 text-center"><button onClick={loadData} className="text-slate-500 text-xs hover:text-white underline flex items-center justify-center gap-1 mx-auto"><RefreshCcw size={12}/> โหลดข้อมูลใหม่</button></div>
      </div>
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('DASHBOARD');
  const [appDb, setAppDb] = useState({ policies: [], reports: [], tasks: [], units: [], isLoaded: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsSyncing(true); setErrorMsg('');
    try {
      const actions = ['units', 'policies', 'reports', 'tasks'];
      const results = await Promise.all(actions.map(async (action) => {
        const url = `${SCRIPT_URL}?action=${action}&t=${Date.now()}`; // ป้องกัน cache
        const res = await fetch(url);
        const text = await res.text();
        if (text.startsWith('<')) throw new Error("เกิดข้อผิดพลาดในการดึงข้อมูล (อาจลืมเปิดสิทธิ์ Anyone ให้ Web App)");
        return JSON.parse(text);
      }));
      setAppDb({ units: results[0] || [], policies: results[1] || [], reports: results[2] || [], tasks: results[3] || [], isLoaded: true });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'เชื่อมต่ออินเทอร์เน็ตล้มเหลว');
      setAppDb(prev => ({...prev, isLoaded: true}));
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const callApi = async (method, action, data, idKey, idValue) => {
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // บังคับเพื่อไม่ให้ติด CORS ของเบราว์เซอร์
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ method, action, data, idKey, idValue })
      });
      // เนื่องจาก no-cors อ่าน response ไม่ได้ ให้หน่วงเวลาแล้วดึงข้อมูลใหม่
      setTimeout(loadData, 2000); 
      return true;
    } catch (err) {
      console.error("Save Error:", err);
      alert("บันทึกข้อมูลไม่สำเร็จ");
      return false;
    }
  };

  if (!user || !appDb.isLoaded) {
    return <LoginScreen onLogin={(name, role) => { setUser({ unitName: name, role: role }); setView('DASHBOARD'); }} isLoading={!appDb.isLoaded} appDb={appDb} loadData={loadData} errorMsg={errorMsg} />;
  }

  // --- Views ---
  const renderDashboard = () => {
    const totalPolicies = appDb.policies.length;
    const completedPolicies = appDb.policies.filter(p => {
       const rs = appDb.reports.filter(r => r.policy_id === p.policy_id).sort((a,b)=>new Date(b.report_date)-new Date(a.report_date));
       return rs.length > 0 && rs[0].progress_percent === 100;
    }).length;

    return (
      <div className="space-y-6 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-amber-500 flex items-center gap-2"><LayoutDashboard/> ภาพรวมระบบ</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg"><p className="text-slate-400 text-sm">ข้อสั่งการทั้งหมด</p><h3 className="text-3xl font-bold text-white mt-2">{totalPolicies}</h3></div>
          <div className="bg-slate-800 p-6 rounded-xl border border-emerald-500/50 shadow-lg"><p className="text-emerald-400 text-sm">เสร็จสมบูรณ์</p><h3 className="text-3xl font-bold text-emerald-400 mt-2">{completedPolicies}</h3></div>
          <div className="bg-slate-800 p-6 rounded-xl border border-sky-500/50 shadow-lg"><p className="text-sky-400 text-sm">รายงานล่าสุด (สัปดาห์นี้)</p><h3 className="text-3xl font-bold text-sky-400 mt-2">{appDb.reports.length}</h3></div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg"><p className="text-slate-400 text-sm">ภารกิจย่อย (Tasks)</p><h3 className="text-3xl font-bold text-white mt-2">{appDb.tasks.length}</h3></div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mt-6">
          <h3 className="text-lg font-bold text-slate-200 mb-4">รายการข้อสั่งการล่าสุด</h3>
          <div className="space-y-3">
             {appDb.policies.slice(0, 5).map(p => {
                const rs = appDb.reports.filter(r => r.policy_id === p.policy_id).sort((a,b)=>new Date(b.report_date)-new Date(a.report_date));
                const prog = rs.length > 0 ? rs[0].progress_percent : 0;
                return (
                  <div key={p.policy_id} className="p-4 bg-slate-900 rounded-lg border border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-sky-400 font-bold mb-1">[{p.policy_no}] {p.commander}</p>
                      <p className="text-sm text-slate-200">{p.order}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className="text-lg font-bold font-mono" style={{color: getBarColor(prog)}}>{prog}%</span>
                    </div>
                  </div>
                )
             })}
             {appDb.policies.length === 0 && <p className="text-slate-500 text-center py-4">ยังไม่มีข้อมูล</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderDataGrid = (title, dataList, columns) => {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <h2 className="text-xl font-bold text-amber-500">{title} ({dataList.length})</h2>
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto shadow-xl">
           <table className="w-full text-sm text-left text-slate-200">
             <thead className="bg-slate-900 border-b border-slate-700 text-slate-400">
                <tr>{columns.map((c, i) => <th key={i} className="p-4">{c.header}</th>)}</tr>
             </thead>
             <tbody className="divide-y divide-slate-700/50">
                {dataList.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-700/30">
                    {columns.map((c, j) => <td key={j} className="p-4">{c.render ? c.render(row) : row[c.key]}</td>)}
                  </tr>
                ))}
                {dataList.length === 0 && <tr><td colSpan={columns.length} className="p-8 text-center text-slate-500">ไม่มีข้อมูล</td></tr>}
             </tbody>
           </table>
        </div>
      </div>
    )
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-screen shrink-0 hidden lg:flex">
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded flex items-center justify-center p-1"><img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" /></div>
          <div><h1 className="font-bold text-lg leading-none text-white">J4 Tracker</h1><span className="text-[10px] text-amber-500">G-Sheets App</span></div>
        </div>
        <div className="p-4 border-b border-slate-700"><p className="text-xs text-slate-400 mb-1">หน่วยงาน:</p><p className="font-bold text-amber-500 truncate">{user.unitName}</p></div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
          <NavItem icon={<LayoutDashboard size={20}/>} label="หน้าหลัก (Dashboard)" isActive={view==='DASHBOARD'} onClick={()=>setView('DASHBOARD')} />
          <NavItem icon={<ScrollText size={20}/>} label="ฐานข้อมูลข้อสั่งการ" isActive={view==='POLICIES'} onClick={()=>setView('POLICIES')} />
          <NavItem icon={<HistoryIcon size={20}/>} label="ประวัติรายงานผล" isActive={view==='REPORTS'} onClick={()=>setView('REPORTS')} />
          <NavItem icon={<CheckSquare size={20}/>} label="ติดตามภารกิจ (Tasks)" isActive={view==='TASKS'} onClick={()=>setView('TASKS')} />
        </nav>
        <div className="p-4 border-t border-slate-700"><button onClick={()=>setUser(null)} className="flex items-center gap-2 text-slate-400 hover:text-red-400 w-full p-2"><LogOut size={18}/> ออกจากระบบ</button></div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto pb-10">
          <div className="flex justify-between items-center mb-8 bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h2 className="text-slate-400 flex items-center gap-2"><ShieldCheck size={18} className="text-amber-500"/> ระบบติดตาม J4 Command Center</h2>
            <div className="flex items-center gap-4">
              {isSyncing && <span className="text-amber-500 text-xs font-bold animate-pulse">กำลังซิงค์ข้อมูล...</span>}
              <button onClick={loadData} className="p-2 bg-slate-900 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors" title="โหลดข้อมูลใหม่"><RefreshCcw size={16}/></button>
              <button onClick={()=>setUser(null)} className="lg:hidden p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900 transition-colors"><LogOut size={16}/></button>
            </div>
          </div>

          {view === 'DASHBOARD' && renderDashboard()}
          
          {view === 'POLICIES' && renderDataGrid("ฐานข้อมูลนโยบายและข้อสั่งการ", appDb.policies, [
             { header: "ลำดับ", key: "policy_no" },
             { header: "ผู้สั่งการ", key: "commander" },
             { header: "ข้อสั่งการ", render: (r) => <div className="max-w-md line-clamp-2" title={r.order}>{r.order}</div> },
             { header: "หน่วยหลัก", render: (r) => <span className="text-amber-400">{r.primary_unit}</span> },
             { header: "กำหนดเสร็จ", key: "timeframe" }
          ])}

          {view === 'REPORTS' && renderDataGrid("ประวัติการรายงานความคืบหน้า", appDb.reports.sort((a,b)=>new Date(b.report_date)-new Date(a.report_date)), [
             { header: "วันที่รายงาน", render: (r) => formatDate(r.report_date) },
             { header: "หน่วยรายงาน", key: "unit_name" },
             { header: "ผลการดำเนินการ", render: (r) => <div className="max-w-md line-clamp-2" title={r.past_result}>{r.past_result}</div> },
             { header: "ความคืบหน้า", render: (r) => <span className="font-bold text-lg" style={{color: getBarColor(r.progress_percent)}}>{r.progress_percent}%</span> }
          ])}

          {view === 'TASKS' && renderDataGrid("รายการภารกิจที่กำลังดำเนินงาน", appDb.tasks.filter(t=>t.status!=='เสร็จสิ้น'), [
             { header: "ชื่องาน", render: (r) => <div className="font-bold max-w-sm line-clamp-2">{r.task_name}</div> },
             { header: "หน่วยรับผิดชอบ", key: "primary_unit" },
             { header: "สถานะ", render: (r) => <span className={`px-2 py-1 rounded text-[10px] border ${TASK_STATUS[r.status]}`}>{r.status}</span> },
             { header: "กำหนดการ", render: (r) => <div className="text-xs text-slate-400">{formatDate(r.start_date)} - {formatDate(r.end_date)}</div> }
          ])}

        </div>
      </main>
    </div>
  );
}
