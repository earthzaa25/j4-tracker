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
let supabaseUrl = '';
let supabaseKey = '';

try {
  // ดึงค่า URL และ KEY อัตโนมัติจาก Environment Variables (ใน Railway หรือไฟล์ .env)
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
} catch (error) {
  console.warn("ไม่พบการตั้งค่า Environment Variables");
}

let supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

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
  policies: [
    { policy_id: "POL-SAMPLE-1", policy_no: "1", category: "นโยบายหลัก", commander: "ผบ.ทสส.", order: "[ตัวอย่าง] ขับเคลื่อนนโยบายการจัดซื้อจัดจ้างสีเขียว (Green Procurement)", timeframe: "ภายใน ก.ย. 68", primary_unit: "กกล.กบ.ทหาร", created_at: new Date().toISOString() },
    { policy_id: "POL-SAMPLE-2", policy_no: "2", category: "สั่งการเพิ่มเติม", commander: "เสธ.ทหาร", order: "[ตัวอย่าง] ยกระดับความปลอดภัยทางไซเบอร์ของระบบโลจิสติกส์ทหาร", timeframe: "ต่อเนื่อง", primary_unit: "กคง.กบ.ทหาร", created_at: new Date().toISOString() },
    { policy_id: "POL-SAMPLE-3", policy_no: "3", category: "นโยบายหลัก", commander: "จก.กบ.ทหาร", order: "[ตัวอย่าง] บริหารจัดการงบประมาณอย่างมีประสิทธิภาพ", timeframe: "ปีงบประมาณ 68", primary_unit: "กนผ.สสร.กบ.ทหาร", created_at: new Date().toISOString() }
  ],
  reports: [
    { report_id: "RP-SAMPLE-1", policy_id: "POL-SAMPLE-1", policy_no: "1", policy_snippet: "[ตัวอย่าง] ขับเคลื่อนนโยบายGreen Procurement...", unit_name: "กกล.กบ.ทหาร", progress_percent: 75, past_result: "จัดประชุมคณะทำงานเรียบร้อย", report_date: new Date().toISOString(), approval_status: 'อนุมัติแล้ว', created_at: new Date().toISOString() },
    { report_id: "RP-SAMPLE-2", policy_id: "POL-SAMPLE-2", policy_no: "2", policy_snippet: "[ตัวอย่าง] ยกระดับ Cybersecurity...", unit_name: "กคง.กบ.ทหาร", progress_percent: 90, past_result: "ติดตั้งระบบระยะที่ 1 เรียบร้อย", report_date: new Date().toISOString(), approval_status: 'อนุมัติแล้ว', created_at: new Date().toISOString() }
  ],
  tasks: [
    { task_id: "TSK-SAMPLE-1", task_name: "[ตัวอย่างภารกิจ] จัดเตรียมวัสดุสำหรับฝึกร่วม Cobra Gold 25", unit_name: "กสล.สสร.กบ.ทหาร", primary_unit: "กสล.สสร.กบ.ทหาร", status: "เสร็จสิ้น", progress_percent: 100, assignee: "ร.อ.สมชาย", start_date: new Date().toISOString(), end_date: new Date().toISOString() },
    { task_id: "TSK-SAMPLE-2", task_name: "[ตัวอย่างภารกิจ] จัดทำแผนเผชิญเหตุภัยพิบัติและเตรียมความพร้อมศูนย์โลจิสติกส์", unit_name: "กยป.สสร.กบ.ทหาร", primary_unit: "กยป.สสร.กบ.ทหาร", status: "ล่าช้า/ติดปัญหา", progress_percent: 15, note: "รองบประมาณสนับสนุนในไตรมาสที่ 3", assignee: "พ.ต.อนันต์", start_date: new Date().toISOString(), end_date: new Date().toISOString() }
  ]
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
      console.warn("Supabase is not connected. Missing Environment Variables.");
      setAppDb(prev => ({
        ...prev, 
        units: INITIAL_DATA.units, 
        policies: INITIAL_DATA.policies, 
        isLoaded: true
      }));
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
        units: resU.data?.sort((a,b)=>a.name.localeCompare(b.name)) || [],
        tasks: resT.data || [],
        settings: resS.data || { adminPasscode: ADMIN_PASSCODE, execPasscode: EXEC_PASSCODE },
        isLoaded: true
      });
    } catch (e) { 
      console.error("Load Error:", e); 
      setAppDb(prev => ({...prev, isLoaded: true}));
    }
  };

  useEffect(() => {
    const initSupabaseAndLoad = () => {
      // โค้ดส่วนนี้จะลองโหลด Supabase แบบทางเลือกเผื่อว่าการ import ขัดข้องในบางโฮสติ้ง
      if (!supabase && supabaseUrl && supabaseKey && typeof window !== 'undefined') {
        if (window.supabase) {
          supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        }
      }
      loadData();
    };

    if (!supabase && supabaseUrl && supabaseKey && typeof window !== 'undefined' && !window.supabase) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.onload = initSupabaseAndLoad;
      document.head.appendChild(script);
    } else {
      initSupabaseAndLoad();
    }
  }, []);

  const showToast = (msg, type = 'ok') => {
    setToastData({ msg, type });
    setTimeout(() => setToastData(null), 3000);
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
        
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background-color: #ffffff !important; color: #000000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hide { display: none !important; }
          .print-full-w { width: 100% !important; margin: 0 !important; max-width: 100% !important; padding: 0 !important; }
          .bg-slate-900, .bg-slate-800, .bg-amber-900\\/40, .bg-red-900\\/20, .bg-slate-900\\/50 { background-color: #ffffff !important; color: #000000 !important; border: 1px solid #ccc !important; box-shadow: none !important; }
          .text-slate-100, .text-slate-200, .text-slate-300, .text-slate-400, .text-white { color: #111827 !important; }
          .text-amber-400 { color: #b45309 !important; font-weight: bold; }
          .text-emerald-400 { color: #059669 !important; font-weight: bold; }
          .text-red-400 { color: #dc2626 !important; font-weight: bold; }
          .border-slate-700, .border-slate-700\\/50, .border-red-500\\/30 { border-color: #e2e8f0 !important; }
        }
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
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">สถานะผู้ใช้งาน</p>
          <p className="text-sm font-medium text-amber-400 truncate">{user.unitName}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-2 custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 hidden lg:block">ภาพรวม (Dashboards)</p>
          <NavItem icon={<LayoutDashboard size={20}/>} label="ภาพรวมข้อสั่งการ" isActive={view === 'DASHBOARD_POLICY'} onClick={() => setView('DASHBOARD_POLICY')} />
          <NavItem icon={<PieChart size={20}/>} label="ภาพรวมภารกิจ" isActive={view === 'DASHBOARD_TASK'} onClick={() => setView('DASHBOARD_TASK')} />
          
          {isAdminOrExec && (
            <NavItem icon={<Briefcase size={20}/>} label="บทสรุปผู้บริหาร" isActive={view === 'EXEC_SUMMARY'} onClick={() => setView('EXEC_SUMMARY')} />
          )}

          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4 hidden lg:block">ระดับนโยบาย (Policy)</p>
          <NavItem icon={<ScrollText size={20}/>} label="นโยบาย/ข้อสั่งการ" isActive={view === 'POLICIES'} onClick={() => setView('POLICIES')} />
          {user.role !== 'executive' && (
            <NavItem icon={<FilePlus size={20}/>} label="บันทึกรายงานผล" isActive={view === 'REPORT_FORM'} onClick={() => setView('REPORT_FORM')} />
          )}
          <NavItem icon={<HistoryIcon size={20}/>} label="ประวัติการรายงาน" isActive={view === 'HISTORY'} onClick={() => setView('HISTORY')} />

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
          
          <div className="mt-5 text-center hidden lg:block opacity-60 hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-slate-500 tracking-wider">ออกแบบและพัฒนาโดย</p>
            <p className="text-[11px] font-bold text-amber-500 mt-1">จ.ส.อ. ปริยวิศว์ ทองใบอ่อน</p>
          </div>
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
                <h3 className="font-bold text-red-400">ยังไม่ได้เชื่อมต่อฐานข้อมูลออนไลน์</h3>
                <p className="text-sm text-red-300 mt-1">ระบบกำลังทำงานแบบออฟไลน์ สำหรับการใช้งานจริงร่วมกับผู้อื่น กรุณาตั้งค่า <code>VITE_SUPABASE_URL</code> และ <code>VITE_SUPABASE_ANON_KEY</code> ใน <b>Environment Variables</b> ของแพลตฟอร์มที่คุณโฮสต์</p>
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
  
  const [unit, setUnit] = useState(allOptions[0]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!allOptions.includes(unit)) setUnit(allOptions[0]);
  }, [allOptions, unit]);

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
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
        <div className="text-center mb-8 relative z-10">
          <div className="bg-white w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-500/50 overflow-hidden p-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <img src={LOGO_URL} alt="J4 Logo" className="w-full h-full object-contain" onError={(e)=>{e.target.onerror=null; e.target.src='https://placehold.co/100x100/1e293b/f59e0b?text=J4'}} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">ระบบติดตามผลการปฏิบัติ</h1>
          <p className="text-amber-400/80 mt-2 text-sm font-medium">ข้อสั่งการ นโยบาย และ ภารกิจ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-medium">เลือกหน่วยงาน หรือ สิทธิ์การเข้าถึง</label>
            <select value={unit} onChange={(e) => { setUnit(e.target.value); setError(''); setPassword(''); }} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all appearance-none">
              {allOptions.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          
          <div className="fade-in-up">
            <label className="block text-slate-400 text-sm mb-2 font-medium flex items-center gap-2"><Lock size={14}/> รหัสผ่านเข้าสู่ระบบ</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
              placeholder={
                unit === 'ผู้ดูแลภาพรวม (Admin)' ? "รหัสผ่าน Admin" : 
                unit === 'มุมมองผู้บริหาร (Executive)' ? "รหัสผ่านผู้บริหาร" : 
                "รหัสผ่านหน่วยงาน (ค่าเริ่มต้น: 1234)"
              } 
            />
          </div>
          
          {error && <p className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg">{error}</p>}
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] transition-all mt-4">เข้าสู่ระบบ</button>
        </form>
      </div>
    </div>
  );
}

// ============== POLICY DASHBOARD ==============
function PolicyDashboard({ appDb, user, showToast, refresh }) {
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const [filterUnit, setFilterUnit] = useState(isAdminOrExec ? 'ALL' : user.unitName);
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const currentUnits = appDb.units.length > 0 ? appDb.units : INITIAL_DATA.units;

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

  const renderDashboardSection = (title, iconComponent, sectionPolicies) => {
    if (sectionPolicies.length === 0) return null;

    const sectionPolicyIds = sectionPolicies.map(p => p.policy_id);
    const sectionReports = baseReports.filter(r => sectionPolicyIds.includes(r.policy_id));

    const progList = sectionPolicies.map(po => {
      const rs = sectionReports.filter(r => r.policy_id === po.policy_id).sort((a, b) => new Date(b.report_date || b.created_at) - new Date(a.report_date || a.created_at));
      return { 
        id: po.policy_id, 
        name: po.order,
        short: `[ลำดับ ${po.policy_no || '-'}] ${po.order.length > 50 ? po.order.substring(0, 50) + '...' : po.order}`,
        progress: rs.length ? (rs[0].progress_percent || 0) : 0 
      };
    });

    const completed = progList.filter(x => x.progress === 100).length;
    const avg = progList.length > 0 ? (progList.reduce((a, b) => a + (b.progress || 0), 0) / progList.length) : 0;

    const cmds = [...new Set(sectionPolicies.map(p => p.commander || 'ไม่ระบุผู้สั่งการ'))];
    const groupedByCommander = cmds.map(cmd => {
      const cPols = sectionPolicies.filter(p => (p.commander || 'ไม่ระบุผู้สั่งการ') === cmd);
      const cProgList = cPols.map(po => {
        const rs = sectionReports.filter(r => r.policy_id === po.policy_id).sort((a, b) => new Date(b.report_date || b.created_at) - new Date(a.report_date || a.created_at));
        return {
          id: po.policy_id,
          name: po.order,
          short: `[ลำดับ ${po.policy_no || '-'}] ${po.order.length > 50 ? po.order.substring(0, 50) + '...' : po.order}`,
          progress: rs.length ? (rs[0].progress_percent || 0) : 0
        };
      });
      
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
      <div className="mt-12 pt-8 border-t-[3px] border-slate-700/80 first:mt-0 first:pt-0 first:border-0">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-amber-500/20 p-3 rounded-xl text-amber-400 border border-amber-500/30">
            {iconComponent}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">{title}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-blue-500 shadow-md">
            <p className="text-slate-400 text-sm">จำนวนข้อสั่งการรวม</p>
            <h3 className="text-3xl font-bold text-white mt-1">{sectionPolicies.length}</h3>
            <p className="text-xs text-slate-500 mt-2">เรื่องที่รับผิดชอบ</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-emerald-500 shadow-md">
            <p className="text-slate-400 text-sm">เสร็จสมบูรณ์รวม</p>
            <h3 className="text-3xl font-bold text-white mt-1">{completed}</h3>
            <p className="text-xs text-slate-500 mt-2">เรื่อง (100%)</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-sky-500 shadow-md">
            <p className="text-slate-400 text-sm">การรายงานความคืบหน้ารวม</p>
            <h3 className="text-3xl font-bold text-white mt-1">{sectionReports.length}</h3>
            <p className="text-xs text-slate-500 mt-2">ฉบับ (ทั้งหมด)</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-amber-500 shadow-md">
            <p className="text-slate-400 text-sm">ความคืบหน้าเฉลี่ยรวม</p>
            <h3 className="text-3xl font-bold text-white mt-1">{avg.toFixed(1)}%</h3>
            <div className="w-full bg-slate-900 h-2 rounded-full mt-2 overflow-hidden border border-slate-700">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${avg}%` }}></div>
            </div>
          </div>
        </div>

        {groupedByCommander.map((group, index) => (
          <div key={index} className="mt-8 pt-8 border-t border-slate-700/50 first:mt-0 first:pt-0 first:border-0">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h3 className="text-xl font-bold text-sky-400 flex items-center gap-2">
                <ShieldCheck size={24} /> ผู้สั่งการ: {group.commander}
              </h3>
              <div className="flex items-center gap-3">
                <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm border border-slate-700">
                  ทั้งหมด {group.total} เรื่อง | เสร็จแล้ว {group.completed} เรื่อง
                </span>
                <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full text-sm font-bold border border-sky-500/30">
                  คืบหน้าเฉลี่ย {group.avg.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col items-center">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 w-full"><PieChart size={20} className="text-slate-400"/> สถานะการดำเนินงาน</h3>
                <div className="relative w-48 h-48 rounded-full mb-6" style={{ background: group.total > 0 ? `conic-gradient(${group.donutGradientStops})` : '#1e293b' }}>
                  <div className="absolute inset-0 m-auto w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center border-[8px] border-slate-800">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{group.total}</div>
                      <div className="text-[10px] text-slate-400">ข้อสั่งการ</div>
                    </div>
                  </div>
                </div>
                <div className="w-full space-y-2 mt-auto">
                  {group.statusCount.map(s => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[s.name] }}></span>
                        <span className="text-slate-300">{s.name}</span>
                      </div>
                      <span className="font-medium">{s.value}</span>
                    </div>
                  ))}
                  {group.total === 0 && <p className="text-center text-sm text-slate-500">ไม่มีข้อมูล</p>}
                </div>
              </div>

              <div className="lg:col-span-8 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><BarChart size={20} className="text-slate-400"/> ความคืบหน้ารายข้อสั่งการ</h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5" style={{ maxHeight: '350px' }}>
                  {group.progList.map(p => (
                    <div key={p.id} className="relative group">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-300 font-medium truncate pr-4" title={p.name}>{p.short}</span>
                        <span className="font-bold font-mono" style={{ color: getBarColor(p.progress) }}>{p.progress}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                        <div className="h-full rounded-full transition-all duration-1000 relative" style={{ width: `${p.progress}%`, backgroundColor: getBarColor(p.progress) }}>
                          <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {group.progList.length === 0 && <p className="text-center text-sm text-slate-500 mt-10">ไม่มีข้อมูล</p>}
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

  const handleSyncInitialData = async () => {
    if (!supabase) return showToast('ยังไม่ได้เชื่อมต่อฐานข้อมูล', 'error');
    if (window.confirm("ระบบจะทำการสร้างข้อมูล 'หน่วยงาน' และ 'ข้อสั่งการ' ตั้งต้น คุณแน่ใจหรือไม่? (ข้อมูลเดิมจะถูกทับ)")) {
      showToast('กำลังตั้งค่าระบบ...', 'ok');
      try {
        await supabase.from('settings').upsert({ id: 'global', adminPasscode: ADMIN_PASSCODE, execPasscode: EXEC_PASSCODE });
        for (const u of INITIAL_DATA.units) await supabase.from('units').upsert(u);
        for (const p of INITIAL_DATA.policies) await supabase.from('policies').upsert(p);
        showToast('ตั้งค่าระบบเริ่มต้นสำเร็จ!', 'ok');
        refresh();
      } catch (err) {
        console.error(err);
        showToast('เกิดข้อผิดพลาดในการตั้งค่า: ' + err.message, 'error');
      }
    }
  };

  const isDbEmpty = appDb.policies.length === 0;

  return (
    <div className="space-y-6 fade-in-up">
      {isDbEmpty && user.role === 'admin' && supabase && (
        <div className="bg-amber-900/40 border border-amber-500 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 print-hide">
          <div>
            <h3 className="text-amber-400 font-bold text-lg">ฐานข้อมูลตั้งต้นของระบบยังว่างเปล่า</h3>
            <p className="text-slate-300 text-sm mt-1">กดปุ่มด้านขวาเพื่อนำรายชื่อหน่วยงาน และข้อสั่งการตั้งต้นเข้าสู่ระบบ</p>
          </div>
          <button onClick={handleSyncInitialData} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all shrink-0">
            <CloudUpload size={20}/> ตั้งค่าข้อมูลเริ่มต้นระบบ
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 print-hide flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-amber-400">
          <LayoutDashboard size={20} />
          <h3 className="font-semibold text-lg">ภาพรวมนโยบายและข้อสั่งการของผู้บังคับบัญชา</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto flex-1">
          <div>
            <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} disabled={!isAdminOrExec} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white p-2.5 text-sm disabled:opacity-50">
              <option value="ALL">ทุกหน่วยงาน</option>
              {currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white p-2.5 text-sm" style={{colorScheme:'dark'}}/>
          </div>
          <div>
            <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white p-2.5 text-sm" style={{colorScheme:'dark'}}/>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {renderDashboardSection('นโยบายหลัก', <ShieldCheck size={28} />, mainPolicies)}
        {renderDashboardSection('สั่งการเพิ่มเติม', <FileText size={28} />, additionalPolicies)}
        
        {mainPolicies.length === 0 && additionalPolicies.length === 0 && !isDbEmpty && (
          <div className="text-center py-16 text-slate-500 bg-slate-800 rounded-xl border border-slate-700">
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
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const currentUnits = appDb.units.length > 0 ? appDb.units : INITIAL_DATA.units;

  const stats = useMemo(() => {
    let fTasks = appDb.tasks || [];
    if (filterUnit !== 'ALL') {
      fTasks = fTasks.filter(t => t.primary_unit === filterUnit || t.secondary_units?.includes(filterUnit));
    }
    if (filterStart) fTasks = fTasks.filter(t => new Date(t.start_date) >= new Date(filterStart));
    if (filterEnd) {
      const end = new Date(filterEnd);
      end.setHours(23, 59, 59, 999);
      fTasks = fTasks.filter(t => new Date(t.end_date) <= end);
    }

    const totalTasks = fTasks.length;
    const completedTasks = fTasks.filter(t => t.status === 'เสร็จสิ้น').length;
    const delayedTasks = fTasks.filter(t => t.status === 'ล่าช้า/ติดปัญหา').length;
    const avgProgress = totalTasks > 0 ? fTasks.reduce((a, b) => a + (Number(b.progress_percent) || 0), 0) / totalTasks : 0;

    const progList = fTasks.map(t => ({
      id: t.task_id,
      name: t.task_name,
      short: t.task_name.length > 40 ? t.task_name.substring(0, 40) + '...' : t.task_name,
      progress: Number(t.progress_percent) || 0
    })).sort((a,b) => b.progress - a.progress);

    const statusCount = [
      { name: 'เสร็จสิ้น', value: completedTasks },
      { name: 'กำลังดำเนินการ', value: fTasks.filter(t => t.status === 'กำลังดำเนินการ').length },
      { name: 'รอดำเนินการ', value: fTasks.filter(t => t.status === 'รอดำเนินการ').length },
      { name: 'ล่าช้า/ติดปัญหา', value: delayedTasks }
    ].filter(x => x.value > 0);

    const delayedList = fTasks
      .filter(t => t.status === 'ล่าช้า/ติดปัญหา')
      .sort((a, b) => new Date(a.end_date) - new Date(b.end_date));

    return { totalTasks, completedTasks, delayedTasks, avgProgress, progList, statusCount, delayedList };
  }, [appDb, filterUnit, filterStart, filterEnd]);

  let cumulativePercent = 0;
  const donutGradientStops = stats.statusCount.length > 0 ? stats.statusCount.map(d => {
    const start = cumulativePercent; const slicePercent = (d.value / stats.totalTasks) * 100; cumulativePercent += slicePercent;
    return `${TASK_STATUS_COLORS[d.name]} ${start}% ${cumulativePercent}%`;
  }).join(', ') : 'transparent 0% 100%';

  return (
    <div className="space-y-6 fade-in-up">
      {/* Filters */}
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 print-hide">
        <div className="flex items-center gap-2 mb-4 text-amber-400">
          <PieChart size={20} />
          <h3 className="font-semibold text-lg">ภาพรวมภารกิจและการปฏิบัติงาน</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">หน่วยงานรับผิดชอบ</label>
            <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} disabled={!isAdminOrExec} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white p-2.5 text-sm disabled:opacity-50">
              <option value="ALL">ทุกหน่วยงาน</option>
              {currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">ตั้งแต่วันที่</label>
            <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white p-2.5 text-sm" style={{colorScheme:'dark'}}/>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">ถึงวันที่</label>
            <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white p-2.5 text-sm" style={{colorScheme:'dark'}}/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-sky-500 shadow-md">
          <p className="text-slate-400 text-sm font-medium">จำนวนงาน/ภารกิจ</p>
          <h3 className="text-3xl font-bold text-white mt-1">{stats.totalTasks}</h3>
          <p className="text-xs text-slate-500 mt-2">รายการทั้งหมด</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-emerald-500 shadow-md">
          <p className="text-slate-400 text-sm font-medium">เสร็จสมบูรณ์</p>
          <h3 className="text-3xl font-bold text-white mt-1">{stats.completedTasks}</h3>
          <p className="text-xs text-slate-500 mt-2">งาน (100%)</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-red-500 shadow-md">
          <p className="text-slate-400 text-sm font-medium">ล่าช้า/ติดปัญหา</p>
          <h3 className="text-3xl font-bold text-red-400 mt-1">{stats.delayedTasks}</h3>
          <p className="text-xs text-slate-500 mt-2">ต้องติดตามด่วน</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-amber-500 shadow-md">
          <p className="text-slate-400 text-sm font-medium">ความคืบหน้าเฉลี่ย</p>
          <h3 className="text-3xl font-bold text-white mt-1">{stats.avgProgress.toFixed(1)}%</h3>
          <div className="w-full bg-slate-900 h-2 rounded-full mt-2 overflow-hidden border border-slate-700">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.avgProgress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center">
          <h3 className="font-semibold w-full mb-6">สถานะการดำเนินงาน</h3>
          <div className="w-48 h-48 rounded-full mb-6" style={{ background: stats.totalTasks > 0 ? `conic-gradient(${donutGradientStops})` : '#1e293b' }}></div>
          <div className="w-full space-y-2 mt-auto">
            {stats.statusCount.map(s => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: TASK_STATUS_COLORS[s.name] }}></span>
                  <span className="text-slate-300">{s.name}</span>
                </div>
                <span className="font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="font-semibold mb-6">ความคืบหน้ารายการ</h3>
          <div className="overflow-y-auto space-y-5" style={{ maxHeight: '350px' }}>
            {stats.progList.map(p => (
              <div key={p.id}>
                <div className="flex justify-between text-xs mb-1.5"><span className="truncate pr-4">{p.short}</span><span style={{ color: getBarColor(p.progress) }}>{p.progress}%</span></div>
                <div className="w-full h-3 bg-slate-900 rounded-full"><div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: getBarColor(p.progress) }}></div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-red-500/30 shadow-md mt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
          <AlertTriangle size={20}/> ภารกิจที่ต้องติดตามด่วน (ล่าช้า / ติดปัญหา)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.delayedList.map(t => (
            <div key={t.task_id} className="bg-red-950/20 border border-red-900/50 p-4 rounded-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full"></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded border border-red-500/30">{t.primary_unit}</span>
                <span className="text-xs text-slate-400 font-mono">กำหนด: {formatDate(t.end_date)}</span>
              </div>
              <h4 className="font-bold text-slate-200 mb-2 relative z-10">{t.task_name}</h4>
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${t.progress_percent}%` }}></div>
                </div>
                <span className="text-xs font-bold text-red-400">{t.progress_percent}%</span>
              </div>
              <p className="text-xs text-red-200 bg-red-900/30 p-2.5 rounded border border-red-500/20 relative z-10">
                <span className="font-bold text-red-400">ปัญหาที่พบ:</span> {t.note || 'ไม่มีการระบุรายละเอียด'}
              </p>
            </div>
          ))}
          {stats.delayedList.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500 flex flex-col items-center">
              <CheckCircle size={32} className="text-emerald-500/30 mb-3"/> 
              <p>ยอดเยี่ยม! ไม่มีภารกิจที่ติดปัญหาในขณะนี้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============== EXECUTIVE SUMMARY ==============
function ExecutiveSummary({ appDb }) {
  const stats = useMemo(() => {
    const unitStats = {};
    const currentUnits = appDb.units.length > 0 ? appDb.units : INITIAL_DATA.units;
    
    currentUnits.forEach(u => {
      unitStats[u.name] = { totalPolicies: 0, progressSum: 0, completed: 0, reports: 0, policyNames: [] };
    });

    const policies = appDb.policies || [];
    const reports = appDb.reports || [];

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
    const pendingReportsCount = reports.filter(r => r.approval_status === 'รอตรวจสอบ').length;

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

    const problemReports = reports
      .filter(r => r.problems && r.problems.trim().length > 2 && r.problems.trim() !== '-')
      .sort((a, b) => new Date(b.report_date || b.created_at) - new Date(a.report_date || a.created_at))
      .slice(0, 5);

    const today = new Date();
    today.setHours(0,0,0,0);
    const todayUpdatesCount = reports.filter(r => new Date(r.created_at || r.report_date) >= today).length;

    return { unitArray, problemReports, totalPolicies: policies.length, totalReports: approvedReports.length, pendingReportsCount, todayUpdatesCount };
  }, [appDb]);

  return (
    <div className="space-y-6 fade-in-up bg-white text-black p-4 md:bg-transparent md:text-slate-100 rounded-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/20 p-3 rounded-xl print-hide">
            <Briefcase className="text-amber-400" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold md:text-white print-text-black">บทสรุปผู้บริหาร (Executive Summary)</h2>
            <p className="text-amber-500 md:text-amber-400 text-sm font-bold mt-1">ภาพรวมการขับเคลื่อนข้อสั่งการและนโยบาย</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="print-hide bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg">
          <Printer size={16}/> พิมพ์รายงานสรุป (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-amber-600/90 to-amber-800/90 p-5 rounded-xl border border-amber-500/30 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">🏆 หน่วยงานผลงานยอดเยี่ยม</h3>
            <Trophy size={20} className="text-amber-200"/>
          </div>
          {stats.unitArray.length > 0 ? (
             <div>
                <p className="text-2xl font-bold">{stats.unitArray[0].name}</p>
                <p className="text-amber-100 text-sm mt-1">ความคืบหน้าเฉลี่ย {stats.unitArray[0].avgProgress.toFixed(1)}%</p>
             </div>
          ) : <p className="text-sm text-amber-200">ยังไม่มีข้อมูล</p>}
        </div>
        
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
           <p className="text-slate-400 text-sm font-medium mb-1">การรายงานความคืบหน้า</p>
           <h3 className="text-3xl font-bold md:text-white print-text-black tracking-tight">
             {stats.totalReports} <span className="text-sm font-normal text-slate-500">ฉบับ</span>
           </h3>
        </div>
        
        <div className="bg-sky-900/20 p-6 rounded-xl border border-sky-500/30 shadow-lg relative overflow-hidden">
           <p className="text-sky-400 text-sm font-medium mb-1">อัปเดตล่าสุด (วันนี้)</p>
           <h3 className="text-3xl font-bold text-sky-500 tracking-tight">
             {stats.todayUpdatesCount} <span className="text-sm font-normal text-slate-500">รายการ</span>
           </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-5">
          <h3 className="text-lg font-bold text-amber-500 md:text-amber-400 mb-4 flex items-center gap-2">
            <TrendingUp size={20} /> ตารางจัดอันดับ KPI หน่วยงาน (Leaderboard)
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {stats.unitArray.map((u, index) => (
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 flex items-start gap-4 hover:border-amber-500/30 transition-colors" key={u.name}>
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-slate-400 shrink-0 mt-1">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold md:text-slate-200 print-text-black truncate">{u.name}</h4>
                    <span className="text-sm font-mono font-bold" style={{ color: getBarColor(u.avgProgress) }}>{u.avgProgress.toFixed(1)}%</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">รับผิดชอบ {u.totalPolicies} เรื่อง | {u.completed} เสร็จสิ้น</p>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${u.avgProgress}%`, backgroundColor: getBarColor(u.avgProgress) }}></div>
                  </div>
                  
                  {/* แสดงรายชื่อแผนงานที่หน่วยรับผิดชอบ */}
                  {u.policyNames && u.policyNames.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-700/50">
                      <p className="text-[11px] text-amber-400/80 font-bold mb-1">แผนงาน/ข้อสั่งการที่รับผิดชอบ:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {u.policyNames.map((pn, i) => (
                          <li key={i} className="text-[10px] text-slate-400 leading-tight">{pn}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {stats.unitArray.length === 0 && <p className="text-center text-slate-500 py-4">ยังไม่มีข้อมูล</p>}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-5">
          <h3 className="text-lg font-bold text-red-500 md:text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} /> ประเด็นข้อขัดข้อง/ปัญหาสำคัญล่าสุด
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {stats.problemReports.map(r => (
              <div key={r.report_id} className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg relative">
                <div className="absolute top-4 right-4 text-xs font-mono text-slate-500">{formatDate(r.report_date || r.created_at)}</div>
                <span className="inline-block px-2 py-0.5 bg-slate-900 text-amber-500 md:text-amber-400 text-[10px] rounded border border-slate-700 mb-2">{r.unit_name}</span>
                <h4 className="text-sm font-bold md:text-slate-200 print-text-black mb-2 pr-16 line-clamp-2" title={r.policy_snippet}>[ลำดับ {r.policy_no || '-'}] {r.policy_snippet}</h4>
                <div className="bg-red-950/50 p-3 rounded border border-red-900/30">
                  <p className="text-xs text-red-400 md:text-red-200 leading-relaxed"><span className="font-bold">ปัญหา:</span> {r.problems}</p>
                </div>
                {r.next_plan && r.next_plan !== '-' && (
                  <p className="text-xs text-slate-400 mt-2"><span className="font-medium md:text-slate-300 print-text-black">แผนแก้ไข:</span> {r.next_plan}</p>
                )}
              </div>
            ))}
            {stats.problemReports.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <CheckCircle size={48} className="text-emerald-500/30 mb-3" />
                <p>ไม่พบรายงานข้อขัดข้องในขณะนี้</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== POLICIES ==============
function Policies({ appDb, user, showToast, refresh }) {
  const [filterAudience, setFilterAudience] = useState('');
  const [filterMeeting, setFilterMeeting] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formCategory, setFormCategory] = useState('นโยบายหลัก');
  const [primaryUnit, setPrimaryUnit] = useState('ทุกหน่วย');
  const [secUnits, setSecUnits] = useState([]);

  const policies = appDb.policies || [];
  const currentUnits = appDb.units.length > 0 ? appDb.units : INITIAL_DATA.units;

  const audiences = [...new Set(policies.map(p => p.audience).filter(a => a && a !== '-'))];
  const meetings = [...new Set(policies.map(p => p.meeting).filter(m => m && m !== '-'))];
  const categories = ["นโยบายหลัก", "สั่งการเพิ่มเติม"];
  const commanders = ["ผบ.ทสส.", "รอง ผบ.ทสส.", "เสธ.ทหาร", "จก.กบ.ทหาร", "ผู้บังคับบัญชาอื่นๆ"];
  
  const filtered = policies.filter(p => 
    (!filterAudience || p.audience === filterAudience) &&
    (!filterMeeting || p.meeting === filterMeeting) &&
    (!filterCategory || p.category === filterCategory)
  ).sort((a, b) => {
    const numA = parseInt(a.policy_no);
    const numB = parseInt(b.policy_no);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return (a.policy_no || '').localeCompare(b.policy_no || '');
  });

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันการลบข้อสั่งการนี้?')) {
      if(!supabase) return showToast('ไม่ได้เชื่อมต่อฐานข้อมูล', 'error');
      try {
        const { error } = await supabase.from('policies').delete().eq('policy_id', id);
        if (error) throw error;
        showToast('ลบข้อสั่งการเรียบร้อย', 'ok');
        refresh();
      } catch (err) {
        showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
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
    if(!supabase) return showToast('ไม่ได้เชื่อมต่อ Supabase Database', 'error');

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    
    data.primary_unit = primaryUnit;
    data.secondary_units = primaryUnit === 'ทุกหน่วย' ? [] : secUnits;

    if (data.category === 'นโยบายหลัก') {
      data.audience = '-';
      data.meeting = '-';
    }
    
    try {
      if (editData) {
        data.policy_id = editData.policy_id;
        const { error } = await supabase.from('policies').upsert(data);
        if (error) throw error;
        
        if (data.policy_no !== editData.policy_no) {
          const relatedReports = (appDb.reports || []).filter(r => r.policy_id === data.policy_id);
          for(const r of relatedReports) {
            await supabase.from('reports').upsert({ ...r, policy_no: data.policy_no });
          }
        }
        showToast('แก้ไขข้อสั่งการเรียบร้อย', 'ok');
      } else {
        data.policy_id = `POL-${Date.now()}`;
        data.created_at = new Date().toISOString();
        const { error } = await supabase.from('policies').upsert(data);
        if (error) throw error;
        showToast('เพิ่มข้อสั่งการใหม่เรียบร้อย', 'ok');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      console.error(err);
      showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800 p-5 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
          <ScrollText size={24} /> นโยบายและข้อสั่งการ ({filtered.length})
        </h2>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} className="flex-1 md:w-auto bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="">ทุกประเภท</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterAudience} onChange={e=>setFilterAudience(e.target.value)} className="flex-1 md:w-auto bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="">ทุกที่ประชุม</option>
            {audiences.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterMeeting} onChange={e=>setFilterMeeting(e.target.value)} className="flex-1 md:w-auto bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="">ทุกครั้ง</option>
            {meetings.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {user.role === 'admin' && (
            <button onClick={() => openModal(null)} className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg">
              <Plus size={16}/> เพิ่มข้อสั่งการ
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 text-left">
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
              {filtered.map(p => (
                <tr key={p.policy_id} className="hover:bg-slate-700/30 align-top transition-colors">
                  <td className="p-4 text-xs font-bold text-amber-400/90 text-center">{p.policy_no || '-'}</td>
                  <td className="p-4 text-xs whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-[10px] border ${p.category === 'นโยบายหลัก' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-sky-500/20 text-sky-400 border-sky-500/30'}`}>
                      {p.category || 'ไม่ระบุ'}
                    </span>
                  </td>
                  <td className="p-4 text-xs whitespace-nowrap text-slate-300">{p.commander}</td>
                  <td className="p-4 text-xs whitespace-nowrap text-slate-400">
                    {p.category === 'นโยบายหลัก' ? '-' : `${p.audience || '-'} (${p.meeting || '-'})`}
                  </td>
                  <td className="p-4 text-xs text-slate-200 leading-relaxed">{p.order}</td>
                  <td className="p-4 text-xs text-emerald-400/90 whitespace-nowrap">{p.timeframe || '-'}</td>
                  <td className="p-4 text-xs text-slate-400">
                    <p className="font-medium text-slate-300">{p.primary_unit || p.responsible_unit || '-'}</p>
                    {p.secondary_units?.length > 0 && <p className="text-[10px] text-sky-400 mt-1">ร่วม: {p.secondary_units.join(', ')}</p>}
                  </td>
                  {user.role === 'admin' && (
                    <td className="p-4 text-xs space-y-2 text-center">
                      <button onClick={() => openModal(p)} className="w-full text-sky-400 hover:text-sky-300 hover:bg-sky-400/10 py-1 rounded transition-colors">แก้ไข</button>
                      <button onClick={() => handleDelete(p.policy_id)} className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 py-1 rounded transition-colors">ลบ</button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-500">ไม่มีข้อมูลข้อสั่งการ</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl fade-in-up shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">{editData ? <Edit size={20}/> : <Plus size={20}/>} {editData ? 'แก้ไขข้อสั่งการ' : 'เพิ่มข้อสั่งการใหม่'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ประเภท</label>
                  <select name="category" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white">
                    <option value="นโยบายหลัก">นโยบายหลัก</option>
                    <option value="สั่งการเพิ่มเติม">สั่งการเพิ่มเติม</option>
                  </select>
                </div>
                <div><label className="text-xs text-slate-400 block mb-1">ลำดับ (เช่น 1, 2, 3)</label><input name="policy_no" defaultValue={editData?.policy_no} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"/></div>
                <div><label className="text-xs text-slate-400 block mb-1">ระยะเวลาการดำเนินการ</label><input name="timeframe" defaultValue={editData?.timeframe} placeholder="เช่น ภายใน ก.ย. 69" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"/></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ผู้สั่งการ</label>
                  <select name="commander" defaultValue={editData?.commander || 'ผบ.ทสส.'} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white">
                    {commanders.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {formCategory === 'สั่งการเพิ่มเติม' && (
                  <>
                    <div><label className="text-xs text-slate-400 block mb-1">ที่ประชุม</label><input name="audience" defaultValue={editData?.audience} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"/></div>
                    <div><label className="text-xs text-slate-400 block mb-1">ครั้งที่</label><input name="meeting" defaultValue={editData?.meeting} required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"/></div>
                  </>
                )}
              </div>
              
              <div><label className="text-xs text-slate-400 block mb-1">รายละเอียดข้อสั่งการ</label><textarea name="order" defaultValue={editData?.order} rows="4" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"></textarea></div>
              
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <label className="text-sm text-amber-400 font-bold block mb-3">หน่วยงานรับผิดชอบ</label>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">หน่วยรับผิดชอบหลัก (Primary)</label>
                    <select name="primary_unit" value={primaryUnit} onChange={e => setPrimaryUnit(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-white">
                      <option value="ทุกหน่วย">ทุกหน่วย</option>
                      {currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                  </div>
                  {primaryUnit !== 'ทุกหน่วย' && (
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">หน่วยร่วมปฏิบัติ (Secondary - ไม่บังคับ)</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-800 p-3 rounded-lg border border-slate-600 max-h-32 overflow-y-auto custom-scrollbar">
                        {currentUnits.filter(u => u.name !== primaryUnit).map(u => (
                          <label key={u.id} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={secUnits.includes(u.name)} onChange={() => toggleSecUnit(u.name)} className="rounded border-slate-500 bg-slate-700 text-amber-500 focus:ring-amber-500"/>
                            {u.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium transition-colors">ยกเลิก</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 font-medium shadow-lg transition-colors">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== TASK TRACKER ==============
function TaskTracker({ appDb, user, showToast, refresh }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [primaryUnit, setPrimaryUnit] = useState(user.unitName);
  const [secUnits, setSecUnits] = useState([]);

  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const currentUnits = appDb.units.length > 0 ? appDb.units : INITIAL_DATA.units;
  const tasks = appDb.tasks || [];

  const visible = isAdminOrExec ? tasks : tasks.filter(t => t.primary_unit === user.unitName || t.secondary_units?.includes(user.unitName));
  const filtered = visible.filter(t => 
    (t.task_name + t.primary_unit + (t.assignee||'')).toLowerCase().includes(search.toLowerCase()) &&
    (filterStatus === '' || t.status === filterStatus)
  ).sort((a, b) => {
    // ดันงานที่ล่าช้าขึ้นบนสุด ตามด้วยวันที่เริ่ม
    if (a.status === 'ล่าช้า/ติดปัญหา' && b.status !== 'ล่าช้า/ติดปัญหา') return -1;
    if (b.status === 'ล่าช้า/ติดปัญหา' && a.status !== 'ล่าช้า/ติดปัญหา') return 1;
    return new Date(a.start_date) - new Date(b.start_date);
  });

  const statuses = ["รอดำเนินการ", "กำลังดำเนินการ", "เสร็จสิ้น", "ล่าช้า/ติดปัญหา"];

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันการลบภารกิจ/งานนี้?')) {
      if(!supabase) return showToast('ไม่ได้เชื่อมต่อฐานข้อมูล', 'error');
      try {
        const { error } = await supabase.from('tasks').delete().eq('task_id', id);
        if (error) throw error;
        showToast('ลบงานเรียบร้อย', 'ok');
        refresh();
      } catch (err) {
        showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
      }
    }
  };

  const openModal = (data = null) => {
    setEditData(data);
    setPrimaryUnit(data?.primary_unit || user.unitName || currentUnits[0].name);
    setSecUnits(data?.secondary_units || []);
    setModalOpen(true);
  };

  const toggleSecUnit = (uName) => {
    setSecUnits(prev => prev.includes(uName) ? prev.filter(x => x !== uName) : [...prev, uName]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if(!supabase) return showToast('ไม่ได้เชื่อมต่อ Supabase Database', 'error');

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    
    if (!data.task_name?.trim()) { showToast('กรุณาระบุชื่องาน/ภารกิจ', 'error'); return; }
    if (!data.start_date) { showToast('กรุณาระบุวันเริ่มต้น', 'error'); return; }

    data.progress_percent = Number(data.progress_percent) || 0;
    data.primary_unit = primaryUnit;
    data.secondary_units = secUnits;
    
    try {
      if (editData) {
        data.task_id = editData.task_id;
        const { error } = await supabase.from('tasks').upsert(data);
        if (error) throw error;
        showToast('อัปเดตและรายงานความคืบหน้าเรียบร้อย', 'ok');
      } else {
        data.task_id = `TSK-${Date.now()}`;
        const { error } = await supabase.from('tasks').upsert(data);
        if (error) throw error;
        showToast('เพิ่มงาน/ภารกิจใหม่เรียบร้อย', 'ok');
      }
      setModalOpen(false);
      refresh();
    } catch (error) {
      console.error(error);
      showToast('บันทึกไม่สำเร็จ: ' + error.message, 'error');
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800 p-5 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
          <ListTodo size={24} /> ติดตามการทำงานและสถานภาพภารกิจ ({filtered.length})
        </h2>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="flex-1 md:w-auto bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="">ทุกสถานะ</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหางาน หรือ ผู้รับผิดชอบ..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"/>
          {user.role !== 'executive' && (
            <button onClick={() => openModal(null)} className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 whitespace-nowrap shadow-lg">
              <Plus size={16}/> เพิ่มงานใหม่
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 text-left">
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
              {filtered.map(t => {
                const deadline = getDeadlineStatus(t.end_date, t.status);
                // ทำไฮไลท์สีสำหรับงานที่ล่าช้า หรือ ทำตัวจางสำหรับงานที่เสร็จแล้ว
                const rowClass = t.status === 'เสร็จสิ้น' ? 'opacity-50 hover:opacity-100' : t.status === 'ล่าช้า/ติดปัญหา' ? 'bg-red-950/20' : 'hover:bg-slate-700/30';
                
                return (
                <tr key={t.task_id} className={`${rowClass} transition-colors align-middle`}>
                  <td className="p-4 text-slate-200">
                    <p className="font-medium text-base">{t.task_name}</p>
                    {t.note && (
                      <div className="mt-2 bg-slate-900/80 p-2 rounded border border-slate-700 text-xs text-slate-400 flex gap-2 items-start">
                        <Activity size={12} className="text-amber-500 shrink-0 mt-0.5"/>
                        <span className="line-clamp-2">{t.note}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-xs text-slate-400">
                    <p className="font-medium text-slate-300">{t.primary_unit || t.unit_name || '-'}</p>
                    {t.secondary_units?.length > 0 && <p className="text-[10px] text-sky-400 mt-1">ร่วม: {t.secondary_units.join(', ')}</p>}
                  </td>
                  <td className="p-4 text-xs whitespace-nowrap">
                    <div className="text-slate-400 mb-1">{formatDate(t.start_date)} - {formatDate(t.end_date)}</div>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${deadline.color}`}>
                      <Clock size={10} /> {deadline.label}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] border ${TASK_STATUS[t.status] || TASK_STATUS['รอดำเนินการ']}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-20 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                        <div style={{ width: `${t.progress_percent}%`, backgroundColor: getBarColor(t.progress_percent) }} className="h-full rounded-full"></div>
                      </div>
                      <span className="text-xs font-bold" style={{ color: getBarColor(t.progress_percent) }}>{t.progress_percent}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-400">{t.assignee || '-'}</td>
                  {user.role !== 'executive' && (
                    <td className="p-4 text-xs text-center whitespace-nowrap">
                      <div className="flex flex-col gap-2 items-center justify-center">
                        {(user.role === 'admin' || t.primary_unit === user.unitName || t.secondary_units?.includes(user.unitName)) && (
                          <button onClick={() => openModal(t)} className="bg-sky-500/20 hover:bg-sky-500 border border-sky-500/30 text-sky-400 hover:text-white px-3 py-1.5 rounded flex items-center gap-1.5 transition-all w-full justify-center">
                            <Edit size={14}/> รายงานสถานะ
                          </button>
                        )}
                        {(user.role === 'admin' || t.primary_unit === user.unitName) && (
                          <button onClick={() => handleDelete(t.task_id)} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="ลบภารกิจนี้">
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl fade-in-up shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
              {editData ? <Activity size={24} className="text-sky-400"/> : <Plus size={24}/>} 
              {editData ? 'รายงานสถานภาพ / แก้ไขภารกิจ' : 'เพิ่มภารกิจใหม่'}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* ข้อมูลพื้นฐานของงาน */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-4">
                <h4 className="text-sm font-bold text-amber-400 border-b border-slate-700 pb-2">1. ข้อมูลภารกิจ (Task Info)</h4>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ชื่องาน/ภารกิจ <span className="text-red-400">*</span></label>
                  <input name="task_name" defaultValue={editData?.task_name} required className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-white" readOnly={user.role !== 'admin' && editData}/>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">หน่วยรับผิดชอบหลัก (Primary) <span className="text-red-400">*</span></label>
                    <select name="primary_unit" value={primaryUnit} onChange={e => setPrimaryUnit(e.target.value)} disabled={user.role !== 'admin' && editData && editData.primary_unit !== user.unitName} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-white disabled:opacity-50">
                      {currentUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">หน่วยร่วมปฏิบัติ (Secondary - ไม่บังคับ)</label>
                    {user.role === 'admin' || editData?.primary_unit === user.unitName || !editData ? (
                      <div className="grid grid-cols-1 gap-2 bg-slate-800 p-3 rounded-lg border border-slate-600 max-h-32 overflow-y-auto custom-scrollbar">
                        {currentUnits.filter(u => u.name !== primaryUnit).map(u => (
                          <label key={u.id} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={secUnits.includes(u.name)} onChange={() => toggleSecUnit(u.name)} className="rounded border-slate-500 bg-slate-700 text-amber-500 focus:ring-amber-500"/>
                            {u.name}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 mt-2">{secUnits.join(', ') || '-'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="text-xs text-slate-400 block mb-1">ผู้รับผิดชอบ (ชื่อ-สกุล)</label><input name="assignee" defaultValue={editData?.assignee} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-white"/></div>
                  <div><label className="text-xs text-slate-400 block mb-1">วันเริ่มต้น <span className="text-red-400">*</span></label><input name="start_date" type="date" defaultValue={editData?.start_date || new Date().toISOString().substring(0,10)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-white" style={{colorScheme:'dark'}}/></div>
                  <div><label className="text-xs text-slate-400 block mb-1">วันกำหนดเสร็จ</label><input name="end_date" type="date" defaultValue={editData?.end_date} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-white" style={{colorScheme:'dark'}}/></div>
                </div>
              </div>

              {/* อัปเดตสถานะ */}
              <div className="bg-sky-900/10 p-4 rounded-xl border border-sky-500/30 space-y-4 relative">
                <h4 className="text-sm font-bold text-sky-400 border-b border-sky-500/30 pb-2 flex items-center gap-2">
                  <Activity size={16}/> 2. รายงานสถานภาพ (Status Update)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-sky-200 block mb-1 font-bold">สถานะงาน <span className="text-red-400">*</span></label>
                    <select name="status" defaultValue={editData?.status || 'รอดำเนินการ'} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-white focus:border-sky-500 outline-none">
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-sky-200 block mb-1 font-bold">ความคืบหน้าปัจจุบัน (%) <span className="text-red-400">*</span></label>
                    <input name="progress_percent" type="number" min="0" max="100" defaultValue={editData?.progress_percent || 0} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-white focus:border-sky-500 outline-none text-lg font-mono"/>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-sky-200 block mb-1 font-bold">สรุปผลการปฏิบัติล่าสุด / ปัญหาข้อขัดข้อง</label>
                  <textarea name="note" defaultValue={editData?.note} rows="3" placeholder="ระบุสิ่งที่ทำไปแล้วล่าสุด หรือปัญหาที่ทำให้งานล่าช้า เพื่อรายงานผู้บริหาร..." className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-white focus:border-sky-500 outline-none"></textarea>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium transition-colors">ยกเลิก</button>
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

// ============== UNITS CONFIG ==============
function UnitsConfig({ appDb, showToast, refresh }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  
  const [adminPass, setAdminPass] = useState(ADMIN_PASSCODE);
  const [execPass, setExecPass] = useState(EXEC_PASSCODE);

  useEffect(() => {
    if (appDb.settings) {
      setAdminPass(appDb.settings.adminPasscode || ADMIN_PASSCODE);
      setExecPass(appDb.settings.execPasscode || EXEC_PASSCODE);
    }
  }, [appDb.settings]);

  const unitsList = appDb.units || [];

  const saveGlobalSettings = async () => {
    if(!supabase) return showToast('ไม่ได้เชื่อมต่อฐานข้อมูล', 'error');
    try {
      const { error } = await supabase.from('settings').upsert({ id: 'global', adminPasscode: adminPass, execPasscode: execPass });
      if (error) throw error;
      showToast('อัปเดตรหัสผ่านส่วนกลางเรียบร้อย', 'ok');
      refresh();
    } catch (err) {
      showToast('บันึกไม่สำเร็จ: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันการลบหน่วยงานนี้?')) {
      if(!supabase) return showToast('ไม่ได้เชื่อมต่อฐานข้อมูล', 'error');
      try {
        const { error } = await supabase.from('units').delete().eq('id', id);
        if (error) throw error;
        showToast('ลบหน่วยงานเรียบร้อย', 'ok');
        refresh();
      } catch (err) {
        showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if(!supabase) return showToast('ไม่ได้เชื่อมต่อฐานข้อมูล', 'error');
    const fd = new FormData(e.target);
    const newName = fd.get('name').trim();
    const newPasscode = fd.get('passcode').trim() || '1234';
    
    if (!newName) {
      showToast('กรุณากรอกชื่อหน่วยงาน', 'error');
      return;
    }

    try {
      if (editData) {
        const { error } = await supabase.from('units').upsert({ id: editData.id, name: newName, passcode: newPasscode });
        if (error) throw error;
        showToast('แก้ไขหน่วยงานเรียบร้อย', 'ok');
      } else {
        const { error } = await supabase.from('units').upsert({ id: `U-${Date.now()}`, name: newName, passcode: newPasscode });
        if (error) throw error;
        showToast('เพิ่มหน่วยงานเรียบร้อย', 'ok');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      showToast('บันึกไม่สำเร็จ: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto fade-in-up">
      
      {/* Global Passwords Section */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400 mb-6">
          <Key size={24} /> ตั้งค่ารหัสผ่านส่วนกลาง (Global Passwords)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-slate-400 block mb-2">รหัสผ่าน ผู้ดูแลภาพรวม (Admin)</label>
            <input 
              type="text" 
              value={adminPass} 
              onChange={(e) => setAdminPass(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-emerald-400 font-mono focus:border-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-2">รหัสผ่าน มุมมองผู้บริหาร (Executive)</label>
            <input 
              type="text" 
              value={execPass} 
              onChange={(e) => setExecPass(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-emerald-400 font-mono focus:border-amber-500 outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={saveGlobalSettings} className="bg-amber-600 hover:bg-amber-500 px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg transition-all">
            บันทึกรหัสผ่านส่วนกลาง
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800 p-5 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
          <Building2 size={24} /> จัดการรายชื่อและรหัสผ่านหน่วยงาน ({unitsList.length})
        </h2>
        <button onClick={() => { setEditData(null); setModalOpen(true); }} className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg">
          <Plus size={16}/> เพิ่มหน่วยงานใหม่
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 text-left">
            <tr>
              <th className="p-4 font-medium w-24">ID</th>
              <th className="p-4 font-medium">ชื่อหน่วยงาน</th>
              <th className="p-4 font-medium">รหัสผ่านเข้าสู่ระบบ</th>
              <th className="p-4 font-medium text-center w-32">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {unitsList.map(u => (
              <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="p-4 text-xs font-mono text-amber-400/80">{u.id}</td>
                <td className="p-4 text-slate-200 font-medium">{u.name}</td>
                <td className="p-4 text-emerald-400 font-mono tracking-widest">{u.passcode || '1234'}</td>
                <td className="p-4 text-xs space-x-3 text-center whitespace-nowrap">
                  <button onClick={() => { setEditData(u); setModalOpen(true); }} className="text-sky-400 hover:text-sky-300 transition-colors"><Edit size={16}/></button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md fade-in-up shadow-2xl">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">{editData ? <Edit size={20}/> : <Plus size={20}/>} {editData ? 'แก้ไขข้อมูลหน่วยงาน' : 'เพิ่มหน่วยงานใหม่'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">ชื่อหน่วยงาน</label>
                <input name="name" defaultValue={editData?.name} required placeholder="ระบุชื่อหน่วยงาน" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none"/>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">รหัสผ่านสำหรับเข้าสู่ระบบ (ค่าเริ่มต้น 1234)</label>
                <input name="passcode" defaultValue={editData?.passcode || '1234'} required placeholder="ตั้งรหัสผ่านให้กองงานนี้" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-emerald-400 font-mono focus:border-amber-500 outline-none"/>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium transition-colors">ยกเลิก</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 font-medium shadow-lg transition-colors">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== REPORT FORM ==============
function ReportForm({ appDb, user, showToast, setView, refresh }) {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const policies = appDb.policies || [];
  
  const availPolicies = isAdminOrExec 
    ? policies
    : policies.filter(p => p.primary_unit === user.unitName || p.secondary_units?.includes(user.unitName) || p.primary_unit === 'ทุกหน่วย' || !p.primary_unit);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if(!file || !supabase) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage.from('attachments').upload(fileName, file);
      if (error) {
        showToast('ไม่สามารถอัปโหลดไฟล์ได้ โปรดตรวจสอบว่าสร้าง Bucket ชื่อ attachments แล้ว', 'error');
      } else {
        const { data: linkData } = supabase.storage.from('attachments').getPublicUrl(fileName);
        setFileUrl(linkData.publicUrl);
        showToast('อัปโหลดไฟล์สำเร็จ', 'ok');
      }
    } catch (err) {
      showToast('Error uploading: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!supabase) return showToast('ไม่ได้เชื่อมต่อ Supabase Database', 'error');

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
      approval_status: 'รอตรวจสอบ',
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('reports').upsert(report);
      if (error) throw error;
      showToast('บันทึกรายงานความคืบหน้าและส่งรอตรวจสอบเรียบร้อย', 'ok');
      refresh();
      setView('HISTORY');
    } catch (err) {
      console.error(err);
      showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto fade-in-up">
      <div className="bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400">
              <FilePlus size={24} />
            </div>
            <h2 className="text-2xl font-bold">บันทึกรายงานผลการดำเนินการ (ข้อสั่งการ)</h2>
          </div>
          <p className="text-sm text-slate-400 mb-8 border-b border-slate-700 pb-4">
            เข้าใช้งานในนามหน่วยงาน: <span className="text-amber-400 font-medium px-2 py-1 bg-amber-500/10 rounded">{user.unitName}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">อ้างอิงข้อสั่งการ/นโยบาย ที่ต้องการรายงาน <span className="text-red-400">*</span></label>
              <select name="policy_id" required className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3 text-sm text-white outline-none transition-colors">
                <option value="">-- เลือกข้อสั่งการ (ที่มีชื่อหน่วยท่านเกี่ยวข้อง) --</option>
                {availPolicies.sort((a,b) => parseInt(a.policy_no||0) - parseInt(b.policy_no||0)).map(p => (
                  <option key={p.policy_id} value={p.policy_id}>
                    [ลำดับ {p.policy_no || '-'}] {p.order.substring(0, 100)}{p.order.length > 100 ? '...' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="text-sm font-medium text-slate-300 block mb-2">วันที่รายงาน <span className="text-red-400">*</span></label><input name="report_date" type="date" required defaultValue={new Date().toISOString().substring(0,10)} className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3 text-sm text-white outline-none" style={{colorScheme:'dark'}}/></div>
              <div><label className="text-sm font-medium text-slate-300 block mb-2">ความคืบหน้าสะสม (%) <span className="text-red-400">*</span></label><input name="progress_percent" type="number" min="0" max="100" required defaultValue="0" className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3 text-sm text-white outline-none"/></div>
            </div>
            
            <div className="space-y-4">
              <div><label className="text-sm font-medium text-slate-300 block mb-2">ผลการดำเนินการที่ผ่านมา <span className="text-red-400">*</span></label><textarea name="past_result" rows="3" required placeholder="สรุปผลการปฏิบัติตามข้อสั่งการในห้วงที่ผ่านมา..." className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3 text-sm text-white outline-none"></textarea></div>
              <div><label className="text-sm font-medium text-slate-300 block mb-2">แผนดำเนินการต่อไป</label><textarea name="next_plan" rows="3" placeholder="สิ่งที่จะดำเนินการในก้าวถัดไป..." className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3 text-sm text-white outline-none"></textarea></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700/50">
              <div><label className="text-sm font-medium text-slate-300 block mb-2 text-red-400">ปัญหา/ข้อขัดข้อง</label><textarea name="problems" rows="2" placeholder="ระบุข้อขัดข้องที่ทำให้งานล่าช้า..." className="w-full bg-slate-900 border border-slate-600 focus:border-red-500/50 rounded-xl p-3 text-sm text-white outline-none"></textarea></div>
              <div><label className="text-sm font-medium text-slate-300 block mb-2">ข้อพิจารณา/หมายเหตุ</label><textarea name="note" rows="2" className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-xl p-3 text-sm text-white outline-none"></textarea></div>
            </div>
            
            {/* ระบบอัปโหลดไฟล์ */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <label className="text-sm font-medium text-slate-300 block mb-2">เอกสารแนบ (อัปโหลด หรือ แปะ URL)</label>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <input name="attachment_url" value={fileUrl} onChange={e=>setFileUrl(e.target.value)} placeholder="URL ไฟล์เอกสารอ้างอิง" className="w-full bg-slate-900 border border-slate-600 focus:border-amber-500 rounded-lg p-3 pl-10 text-sm text-white outline-none"/>
                  <Paperclip size={16} className="absolute left-3 top-3.5 text-slate-500"/>
                </div>
                <div className="relative overflow-hidden shrink-0">
                  <button type="button" className="bg-slate-700 hover:bg-slate-600 text-white w-full md:w-auto px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border border-slate-600">
                    {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <UploadCloud size={16} />}
                    {uploading ? 'กำลังอัปโหลด...' : 'เลือกไฟล์อัปโหลด'}
                  </button>
                  <input type="file" onChange={handleFileUpload} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"/>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">* หากต้องการอัปโหลดไฟล์ ต้องตั้งค่าสร้าง Bucket ชื่อ <b>attachments</b> ใน Supabase Storage ก่อน</p>
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
function History({ appDb, user, showToast, refresh }) {
  const [search, setSearch] = useState('');
  
  const isAdminOrExec = user.role === 'admin' || user.role === 'executive';
  const reports = appDb.reports || [];
  const visible = isAdminOrExec ? reports : reports.filter(r => r.unit_name === user.unitName);
  const filtered = visible
    .filter(r => (r.policy_snippet + r.unit_name + r.past_result).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.created_at || b.report_date) - new Date(a.created_at || a.report_date));

  const handleDelete = async (id) => {
    if(window.confirm('ยืนยันการลบรายงานฉบับนี้ถาวร?')) {
      if(!supabase) return showToast('ไม่ได้เชื่อมต่อฐานข้อมูล', 'error');
      try {
        const { error } = await supabase.from('reports').delete().eq('report_id', id);
        if (error) throw error;
        showToast('ลบรายงานเรียบร้อย', 'ok');
        refresh();
      } catch (err) {
        showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
      }
    }
  };

  const handleStatusChange = async (report, newStatus) => {
    if(!supabase) return;
    try {
      const { error } = await supabase.from('reports').upsert({ ...report, approval_status: newStatus });
      if (error) throw error;
      showToast(newStatus === 'อนุมัติแล้ว' ? '✅ อนุมัติรายงานแล้ว' : '❌ ตีกลับรายงานแล้ว');
      refresh();
    } catch (err) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800 p-5 rounded-xl border border-slate-700">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
            <HistoryIcon size={24} /> ประวัติและร่องรอยการรายงาน (Audit Log)
          </h2>
          <p className="text-sm text-slate-400 mt-1">แสดงผลการรายงานทั้งหมด ({filtered.length} รายการ)</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาเนื้อหารายงาน..." className="flex-1 md:w-64 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"/>
          <button onClick={handleExportCSV} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg transition-colors whitespace-nowrap">
            <Download size={16}/> ส่งออก CSV
          </button>
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-6">
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
          {filtered.map(r => (
            <div key={r.report_id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              {/* Marker */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors ${r.approval_status === 'รอตรวจสอบ' ? 'bg-amber-500/20 text-amber-500' : r.approval_status === 'ตีกลับ' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                {r.approval_status === 'รอตรวจสอบ' ? <Clock size={16}/> : r.approval_status === 'ตีกลับ' ? <X size={16}/> : <Check size={16}/>}
              </div>
              
              {/* Card */}
              <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-900 p-4 rounded-xl border shadow-md transition-colors ${r.approval_status === 'รอตรวจสอบ' ? 'border-amber-500/50' : r.approval_status === 'ตีกลับ' ? 'border-red-500/50' : 'border-slate-700 hover:border-emerald-500/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 text-sm">{r.unit_name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${r.approval_status === 'รอตรวจสอบ' ? 'bg-amber-900/30 text-amber-400 border-amber-500/30' : r.approval_status === 'ตีกลับ' ? 'bg-red-900/30 text-red-400 border-red-500/30' : 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30'}`}>
                      {r.approval_status || 'อนุมัติแล้ว'}
                    </span>
                  </div>
                  <time className="text-xs font-mono text-slate-500">{new Date(r.created_at || r.report_date).toLocaleString('th-TH')}</time>
                </div>
                
                <h4 className="text-sm font-bold text-slate-200 mb-2 line-clamp-2" title={r.policy_snippet}>
                  <span className="text-sky-400">[{r.policy_no || '-'}]</span> {r.policy_snippet}
                </h4>
                
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">ความคืบหน้า</span>
                    <span className="font-bold" style={{ color: getBarColor(r.progress_percent) }}>{r.progress_percent}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 mb-2">
                    <div className="h-full rounded-full" style={{ width: `${r.progress_percent}%`, backgroundColor: getBarColor(r.progress_percent) }}></div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed"><span className="text-emerald-400 font-medium">ผล:</span> {r.past_result}</p>
                  {r.problems && r.problems !== '-' && <p className="text-xs text-red-300 mt-1 leading-relaxed"><span className="text-red-400 font-medium">ปัญหา:</span> {r.problems}</p>}
                </div>

                {/* Actions & Links */}
                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                  {r.attachment_url ? (
                     <a href={r.attachment_url} target="_blank" rel="noreferrer" className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1">
                       <Paperclip size={12}/> เปิดไฟล์แนบ
                     </a>
                  ) : <span className="text-xs text-slate-600">ไม่มีไฟล์แนบ</span>}

                  {user.role === 'admin' && (
                    <div className="flex gap-2">
                      {r.approval_status === 'รอตรวจสอบ' && (
                        <>
                          <button onClick={() => handleStatusChange(r, 'อนุมัติแล้ว')} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded text-xs transition-colors border border-emerald-500/20">อนุมัติ</button>
                          <button onClick={() => handleStatusChange(r, 'ตีกลับ')} className="px-2 py-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded text-xs transition-colors border border-amber-500/20">ตีกลับ</button>
                        </>
                      )}
                      <button onClick={() => handleDelete(r.report_id)} className="p-1.5 bg-slate-800 text-slate-400 border border-slate-700 hover:text-red-400 hover:border-red-500 rounded transition-colors" title="ลบข้อมูล"><Trash2 size={14}/></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center text-slate-500 py-10">ไม่มีร่องรอยการทำงานในระบบ</div>}
        </div>
      </div>
    </div>
  );
}

// ============== CHATBOT ==============
function Chatbot({ appDb }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ sender: 'bot', text: 'สวัสดีครับ! ผมคือ Assistant ช่วยสรุปข้อมูลระบบติดตามข้อสั่งการ \n\nลองถามผมเช่น:\n• "สรุปภาพรวม"\n• "ข้อสั่งการใกล้เสร็จ"\n• "ปัญหา"\n• หรือพิมพ์ชื่อหน่วยงาน เช่น "กกล."' }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processQuery = (q) => {
    const lo = q.toLowerCase();
    const allPol = appDb.policies || [];
    // สำหรับบอท ให้คำนวณจากรายงานที่อนุมัติแล้วเท่านั้น เพื่อความถูกต้อง
    const allRep = (appDb.reports || []).filter(r => r.approval_status === 'อนุมัติแล้ว');
    const currentUnits = appDb.units.map(u=>u.name);
    
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

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: processQuery(userMsg) }]);
    }, 400);
  };

  return (
    <div className="print-hide fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[340px] md:w-[380px] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden fade-in-up" style={{ height: '480px' }}>
          <div className="bg-slate-900 p-4 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-full"><Bot className="text-amber-500" size={20}/></div>
              <div>
                <h3 className="font-bold text-white text-sm">Policy Assistant</h3>
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
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none" 
              placeholder="ถามคำถามที่นี่..." 
            />
            <button type="submit" className="bg-amber-600 hover:bg-amber-500 p-3 rounded-xl text-white transition-colors">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`${isOpen ? 'bg-slate-700' : 'bg-amber-600 hover:bg-amber-500'} text-white rounded-full p-4 shadow-xl hover:shadow-amber-500/30 transition-all hover:scale-105 active:scale-95`}
      >
        {isOpen ? <LogOut size={24} className="rotate-90"/> : <MessageCircle size={24}/>}
      </button>
    </div>
  );
}
