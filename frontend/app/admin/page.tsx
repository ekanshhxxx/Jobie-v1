'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser } from '../lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── Types ─────────────────────────────────────────────────────────────────
type Stats = {
  users: { total: number; candidates: number; recruiters: number; admins: number };
  jobs: { total: number; pending: number; approved: number; rejected: number };
  applications: { total: number; byStatus: { status: string; count: string }[] };
};
type AdminJob = {
  id: number; title: string; company: string; location: string;
  status: 'pending' | 'approved' | 'rejected'; recruiterId: number;
  createdAt: string; experienceLevel: string;
  recruiter?: { id: number; name: string; email: string };
};
type AdminUser = {
  id: number; name: string; email: string; role: string; createdAt: string; banned?: boolean;
};
type LogEntry = { text: string; type: 'ok' | 'err' | 'info' | 'cmd' | 'out'; cat: 'user' | 'job' | 'app' | 'system' };
type Toast    = { id: number; msg: string; type: 'ok' | 'err' | 'warn' };
type AdminApp = {
  id: number; status: string; createdAt: string;
  User?: { id: number; name: string; email: string };
  Job?: { id: number; title: string; company: string };
};

// ─── Theme palettes ─────────────────────────────────────────────────────────
const DARK = {
  bg:     '#0d1117',
  bg2:    '#161b22',
  border: '#30363d',
  muted:  '#8b949e',
  text:   '#e6edf3',
  green:  '#3fb950',
  amber:  '#d29922',
  red:    '#f85149',
  cyan:   '#2f81f7',
  // Reduced glows for better legibility on normal text
  gGlow:  'none',
  aGlow:  'none',
  rGlow:  'none',
  cGlow:  'none',
  grid:   '#21262d',
  chartBg:'#0d1117',
  chartAxis: '#8b949e',
  chartGridStroke: '#21262d',
  tooltipBg: '#161b22',
  tooltipBorder: '#30363d',
};
const LIGHT = {
  bg:     '#ffffff',
  bg2:    '#f6f8fa',
  border: '#d0d7de',
  muted:  '#656d76',
  text:   '#1F2328',
  green:  '#1a7f37',
  amber:  '#9a6700',
  red:    '#d1242f',
  cyan:   '#0969da',
  gGlow:  'none',
  aGlow:  'none',
  rGlow:  'none',
  cGlow:  'none',
  grid:   '#eaeef2',
  chartBg:'#ffffff',
  chartAxis: '#656d76',
  chartGridStroke: '#eaeef2',
  tooltipBg: '#ffffff',
  tooltipBorder: '#d0d7de',
};

type Theme = typeof DARK;
const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const TERM_FONT = 'var(--font-jetbrains), "JetBrains Mono", "Fira Code", monospace';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(d: string) {
  return new Date(d).toISOString().slice(0, 16).replace('T', ' ');
}
function fmtDay(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function ts() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

// ─── Custom chart tooltip ────────────────────────────────────────────────────
function makeChartTip(T: Theme) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function ChartTip(props: any) {
    const { active, payload, label } = props as { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string };
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: T.tooltipBg, border: `1px solid ${T.tooltipBorder}`, padding: '8px 12px', fontFamily: FONT, fontSize: '13px', fontWeight: 500 }}>
        <div style={{ color: T.muted, marginBottom: '4px' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color ?? T.text }}>{p.name}: <b>{p.value}</b></div>
        ))}
      </div>
    );
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Pane({ title, children, T, action }: { title: string; children: React.ReactNode; T: Theme; action?: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${T.border}`, fontFamily: FONT, backgroundColor: T.bg, width: '100%' }}>
      <div style={{ backgroundColor: T.muted, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 14px' }}>
        <span style={{ color: T.bg, fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em' }}>
          +─ {title.toUpperCase()} ──+
        </span>
        {action}
      </div>
      <div style={{ padding: '20px 20px' }}>{children}</div>
    </div>
  );
}

function StatBox({ label, value, sub, color, glow, T }: { label: string; value: string | number; sub?: string; color?: string; glow?: string; T: Theme }) {
  const c = color ?? T.green;
  const g = glow ?? T.gGlow;
  return (
    <div style={{ border: `1px solid ${T.border}`, padding: '20px 24px', backgroundColor: T.bg, fontFamily: FONT, flex: '1 1 140px' }}>
      <div style={{ fontSize: '13px', color: T.muted, fontWeight: 600, letterSpacing: '0.09em', marginBottom: '8px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '36px', fontWeight: 800, color: c, textShadow: g, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: T.muted, marginTop: '8px', fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function Badge({ status, T }: { status: string; T: Theme }) {
  const cfg: Record<string, { c: string; g: string }> = {
    pending:   { c: T.amber, g: T.aGlow },
    approved:  { c: T.green, g: T.gGlow },
    rejected:  { c: T.red,   g: T.rGlow },
    applied:   { c: T.cyan,  g: T.cGlow },
    accepted:  { c: T.green, g: T.gGlow },
    hired:     { c: T.green, g: T.gGlow },
    candidate: { c: T.cyan,  g: T.cGlow },
    recruiter: { c: T.amber, g: T.aGlow },
    admin:     { c: T.red,   g: T.rGlow },
    banned:    { c: T.red,   g: T.rGlow },
  };
  const s = cfg[status] ?? { c: T.muted, g: 'none' };
  return (
    <span style={{ border: `1px solid ${s.c}`, color: s.c, textShadow: s.g, fontSize: '12px', fontWeight: 600, padding: '3px 8px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
      [{status.toUpperCase()}]
    </span>
  );
}

function Btn({ label, onClick, color, glow, disabled, T }: { label: string; onClick: () => void; color?: string; glow?: string; disabled?: boolean; T: Theme }) {
  const c = color ?? T.green;
  const g = glow ?? T.gGlow;
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `1px solid ${disabled ? T.muted : c}`,
        color: hov && !disabled ? T.bg : (disabled ? T.muted : c),
        backgroundColor: hov && !disabled ? c : 'transparent',
        textShadow: hov || disabled ? 'none' : g,
        fontFamily: FONT, fontSize: '13px', fontWeight: 600, padding: '5px 12px',
        cursor: disabled ? 'not-allowed' : 'pointer', letterSpacing: '0.05em',
        transition: 'all 0.08s',
      }}
    >
      {label}
    </button>
  );
}

function TRow({ cells, head, T }: { cells: (string | React.ReactNode)[]; head?: boolean; T: Theme }) {
  return (
    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
      {cells.map((c, i) => (
        <td key={i} style={{
          padding: '12px 16px', fontSize: '14px',
          color: head ? T.muted : T.text,
          textShadow: head ? 'none' : T.gGlow,
          fontFamily: FONT, whiteSpace: 'nowrap', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis',
          fontWeight: head ? 700 : 500, letterSpacing: head ? '0.08em' : '0.02em',
          textTransform: head ? 'uppercase' : 'none',
        }}>
          {c}
        </td>
      ))}
    </tr>
  );
}

// ─── Chart wrapper ───────────────────────────────────────────────────────────
function ChartPane({ title, children, T }: { title: string; children: React.ReactNode; T: Theme }) {
  return (
    <div style={{ border: `1px solid ${T.border}`, backgroundColor: T.chartBg, fontFamily: FONT }}>
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: T.muted, letterSpacing: '0.08em' }}>
        CHART :: {title.toUpperCase()}
      </div>
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  );
}

// ─── Terminal COMMAND input ──────────────────────────────────────────────────
const COMMANDS: Record<string, (args: string[], ctx: { stats: Stats | null; users: AdminUser[]; jobs: AdminJob[]; apps: AdminApp[] }) => string[]> = {
  help: () => [
    'JOBIE ADMIN TERMINAL — command reference',
    '─── READ ───────────────────────────────────────────',
    '  stats               — system stats snapshot',
    '  users [role]        — list users (candidate|recruiter|admin)',
    '  jobs [status]       — list jobs (pending|approved|rejected)',
    '  apps [status]       — list applications',
    '  pending             — alias: jobs pending',
    '  info <name>         — show user details by name',
    '  find <name>         — find users matching name fragment',
    '─── ACTIONS ────────────────────────────────────────',
    '  block <name>        — suspend user account',
    '  unblock <name>      — restore user account',
    '  remove <name>       — permanently delete user',
    '  role <name> <role>  — change user role',
    '  approve <id>        — approve job by ID',
    '  reject <id>         — reject job by ID',
    '  deljob <id>         — delete job by ID',
    '  verify <email>      — approve recruiter profile',
    '─── SYSTEM ─────────────────────────────────────────',
    '  version             — build info',
    '  clear               — clear terminal log',
    '  logout              — logout and return to login page',
    '  exit                — alias: logout',
  ],
  version: () => ['JOBIE ADMIN TERMINAL v2.0.0 — build 2026.03', 'Stack: Next.js + Express + MySQL + recharts'],
  stats: (_, ctx) => {
    if (!ctx.stats) return ['[ERR] Stats not loaded yet'];
    const s = ctx.stats;
    return [
      `Users  : total=${s.users.total}  candidates=${s.users.candidates}  recruiters=${s.users.recruiters}  admins=${s.users.admins}`,
      `Jobs   : total=${s.jobs.total}  pending=${s.jobs.pending}  approved=${s.jobs.approved}  rejected=${s.jobs.rejected}`,
      `Apps   : total=${s.applications.total}  ${s.applications.byStatus.map(x => `${x.status}=${x.count}`).join('  ')}`,
    ];
  },
  pending: (_, ctx) => {
    const list = ctx.jobs.filter(j => j.status === 'pending');
    if (!list.length) return ['Job queue is empty [OK]'];
    return list.map(j => `#${j.id}  ${j.title}  @${j.company}  by ${j.recruiter?.name ?? 'uid:' + j.recruiterId}`);
  },
  users: (args, ctx) => {
    const role = args[0];
    const list = role ? ctx.users.filter(u => u.role === role) : ctx.users;
    if (!list.length) return ['No users found'];
    return list.map(u => `#${String(u.id).padEnd(4)} [${u.role.padEnd(9)}] ${u.name}  <${u.email}>`);
  },
  jobs: (args, ctx) => {
    const status = args[0];
    const list = status ? ctx.jobs.filter(j => j.status === status) : ctx.jobs;
    if (!list.length) return ['No jobs found'];
    return list.map(j => `#${String(j.id).padEnd(4)} [${(j.status ?? '—').padEnd(8)}] ${j.title}  @${j.company}`);
  },
  apps: (args, ctx) => {
    const status = args[0];
    const list = status ? ctx.apps.filter(a => a.status === status) : ctx.apps;
    if (!list.length) return ['No applications found'];
    return list.map(a => `#${String(a.id).padEnd(4)} [${a.status.padEnd(8)}] ${a.User?.name ?? '?'}  →  ${a.Job?.title ?? '?'} @ ${a.Job?.company ?? '?'}`);
  },
  info: (args, ctx) => {
    const q = args.join(' ').toLowerCase();
    if (!q) return ['Usage: info <name>'];
    const u = ctx.users.find(x => x.name.toLowerCase().includes(q) || x.email.toLowerCase().includes(q));
    if (!u) return [`No user found matching "${args.join(' ')}"`];
    return [
      `ID     : #${u.id}`,
      `Name   : ${u.name}`,
      `Email  : ${u.email}`,
      `Role   : ${u.role}`,
      `Joined : ${fmt(u.createdAt)}`,
      `Status : ${u.banned ? 'BANNED' : 'active'}`,
    ];
  },
  find: (args, ctx) => {
    const q = args.join(' ').toLowerCase();
    if (!q) return ['Usage: find <name>'];
    const list = ctx.users.filter(x => x.name.toLowerCase().includes(q) || x.email.toLowerCase().includes(q));
    if (!list.length) return [`No users found matching "${args.join(' ')}"`];
    return list.map(u => `#${String(u.id).padEnd(4)} [${u.role.padEnd(9)}] ${u.name}  <${u.email}>`);
  },
};

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [isDark, setIsDark] = useState(true);
  const T = isDark ? DARK : LIGHT;

  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingJobs, setPendingJobs] = useState<AdminJob[]>([]);
  const [allJobs, setAllJobs] = useState<AdminJob[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [applications, setApplications] = useState<AdminApp[]>([]);
  const [pendingRecruiters, setPendingRecruiters] = useState<any[]>([]);

  const [cmdLog, setCmdLog] = useState<LogEntry[]>([
    { text: `[${ts()}] JOBIE ADMIN TERMINAL v2.0.0 — SYSTEM READY`, type: 'ok', cat: 'system' },
    { text: `[${ts()}] Type 'help' for available commands`, type: 'info', cat: 'system' },
  ]);
  const [cmdInput, setCmdInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const histIdxRef = useRef(-1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const [actLogTab, setActLogTab] = useState<'all' | 'user' | 'job' | 'app' | 'system' | 'errors'>('all');

  const [tab, setTab] = useState<'analytics' | 'queue' | 'alljobs' | 'users' | 'apps' | 'recruiters'>('analytics');
  const [selectedRecruiter, setSelectedRecruiter] = useState<any | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [appStatus, setAppStatus] = useState('');
  const [clock, setClock] = useState('');
  const [loading, setLoading] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setClock(ts());
    const id = setInterval(() => setClock(ts()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'admin') { router.push('/login'); return; }
    setAuthed(true);
    setAdminName(u.name);
  }, [router]);

  const log = useCallback((msg: string, type: 'ok' | 'err' | 'info' = 'ok', cat: LogEntry['cat'] = 'system') => {
    setCmdLog(prev => {
      const next = [...prev, { text: `[${ts()}] ${msg}`, type, cat }];
      return next.slice(-120);
    });
    setTimeout(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, 50);
  }, []);

  const toast = useCallback((msg: string, type: Toast['type'] = 'ok') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [statsData, pendingData, allJobsData, usersData, appsData, pendingRecsData] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/jobs?status=pending'),
        api.get('/api/admin/jobs'),
        api.get('/api/admin/users'),
        api.get('/api/admin/applications'),
        api.get('/api/admin/recruiters/pending'),
      ]);
      setStats(statsData);
      setPendingRecruiters(Array.isArray(pendingRecsData) ? pendingRecsData : []);
      setPendingJobs(Array.isArray(pendingData) ? pendingData : []);
      setAllJobs(Array.isArray(allJobsData) ? allJobsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setApplications(Array.isArray(appsData) ? appsData : []);
    } catch (err) {
      log(`DATA LOAD ERROR — ${err instanceof Error ? err.message : 'unknown'}`, 'err');
    } finally {
      setLoading(false);
    }
  }, [log]);

  useEffect(() => {
    if (!authed) return;
    loadData();
    const id = setInterval(loadData, 30000);
    return () => clearInterval(id);
  }, [authed, loadData]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const approveJob = async (job: AdminJob) => {
    try {
      await api.patch(`/api/admin/jobs/${job.id}/approve`);
      log(`JOB #${job.id} "${job.title}" → APPROVED`, 'ok', 'job');
      toast(`[APPROVED] #${job.id} ${job.title}`, 'ok');
      await loadData();
    } catch (e) {
      log(`JOB #${job.id} APPROVE FAILED — ${e instanceof Error ? e.message : 'err'}`, 'err', 'job');
      toast(`APPROVE FAILED #${job.id}`, 'err');
    }
  };
  const rejectJob = async (job: AdminJob) => {
    try {
      await api.patch(`/api/admin/jobs/${job.id}/reject`);
      log(`JOB #${job.id} "${job.title}" → REJECTED`, 'ok', 'job');
      toast(`[REJECTED] #${job.id} ${job.title}`, 'warn');
      await loadData();
    } catch {
      log(`JOB #${job.id} REJECT FAILED`, 'err', 'job');
      toast(`REJECT FAILED #${job.id}`, 'err');
    }
  };
  const deleteJob = async (job: AdminJob) => {
    if (!confirm(`Delete job #${job.id} "${job.title}"?`)) return;
    try {
      await api.delete(`/api/admin/jobs/${job.id}`);
      log(`JOB #${job.id} "${job.title}" → DELETED`, 'ok', 'job');
      toast(`[DELETED] job #${job.id}`, 'warn');
      await loadData();
    } catch {
      log(`JOB #${job.id} DELETE FAILED`, 'err', 'job');
      toast(`DELETE FAILED job #${job.id}`, 'err');
    }
  };
  const deleteUser = async (user: AdminUser) => {
    if (!confirm(`Delete user #${user.id} "${user.name}"?`)) return;
    try {
      await api.delete(`/api/admin/users/${user.id}`);
      log(`USER #${user.id} "${user.name}" → DELETED`, 'ok', 'user');
      toast(`[DELETED] ${user.name}`, 'warn');
      await loadData();
    } catch {
      log(`USER #${user.id} DELETE FAILED`, 'err', 'user');
      toast(`DELETE FAILED ${user.name}`, 'err');
    }
  };
  const changeRole = async (user: AdminUser, role: string) => {
    try {
      await api.patch(`/api/admin/users/${user.id}/role`, { role });
      log(`USER #${user.id} "${user.name}" role → ${role.toUpperCase()}`, 'ok', 'user');
      toast(`[ROLE] ${user.name} → ${role}`, 'ok');
      await loadData();
    } catch {
      log(`USER #${user.id} ROLE CHANGE FAILED`, 'err', 'user');
      toast(`ROLE CHANGE FAILED ${user.name}`, 'err');
    }
  };
  const banUser = async (user: AdminUser) => {
    try {
      await api.patch(`/api/admin/users/${user.id}/ban`);
      log(`USER #${user.id} "${user.name}" → BANNED`, 'ok', 'user');
      toast(`[BANNED] ${user.name}`, 'warn');
      await loadData();
    } catch {
      log(`USER #${user.id} BAN FAILED`, 'err', 'user');
      toast(`BAN FAILED ${user.name}`, 'err');
    }
  };
  const unbanUser = async (user: AdminUser) => {
    try {
      await api.patch(`/api/admin/users/${user.id}/unban`);
      log(`USER #${user.id} "${user.name}" → UNBANNED`, 'ok', 'user');
      toast(`[UNBANNED] ${user.name}`, 'ok');
      await loadData();
    } catch {
      log(`USER #${user.id} UNBAN FAILED`, 'err', 'user');
      toast(`UNBAN FAILED ${user.name}`, 'err');
    }
  };

  const approveRecruiter = async (user: any) => {
    try {
      await api.patch(`/api/admin/recruiters/${user.id}/approve`);
      log(`RECRUITER #${user.id} "${user.name}" → VERIFIED`, 'ok', 'user');
      toast(`[VERIFIED] ${user.name}`, 'ok');
      setSelectedRecruiter(null);
      await loadData();
    } catch (e) {
      log(`RECRUITER #${user.id} VERIFY FAILED — ${e instanceof Error ? e.message : 'err'}`, 'err', 'user');
      toast(`VERIFY FAILED ${user.name}`, 'err');
    }
  };

  const rejectRecruiter = async (user: any) => {
    try {
      await api.patch(`/api/admin/recruiters/${user.id}/reject`);
      log(`RECRUITER #${user.id} "${user.name}" → REJECTED`, 'ok', 'user');
      toast(`[REJECTED] ${user.name}`, 'warn');
      setSelectedRecruiter(null);
      await loadData();
    } catch {
      log(`RECRUITER #${user.id} REJECT FAILED`, 'err', 'user');
      toast(`REJECT FAILED ${user.name}`, 'err');
    }
  };

  // ─── Terminal command handler ────────────────────────────────────────────
  const runCmd = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setCmdLog(prev => [...prev, { text: `ROOT@JOBIE:~$ ${trimmed}`, type: 'cmd', cat: 'system' as const }]);
    setCmdHistory(prev => [trimmed, ...prev.slice(0, 49)]);
    histIdxRef.current = -1;

    const addOut = (lines: string[]) => {
      setCmdLog(prev => [...prev, ...lines.map(l => ({ text: l, type: 'out' as const, cat: 'system' as const }))]);
      setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
    };
    const addErr = (msg: string) => setCmdLog(prev => [...prev, { text: msg, type: 'err', cat: 'system' as const }]);

    if (trimmed === 'clear') {
      setCmdLog([{ text: `[${ts()}] Terminal cleared`, type: 'info', cat: 'system' }]);
      return;
    }

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === 'block') {
      const name = args.join(' ');
      if (!name) { addErr('Usage: block <name>'); return; }
      const u = users.find(x => x.name.toLowerCase().includes(name.toLowerCase()));
      if (!u) { addErr(`No user found matching "${name}"`); return; }
      await banUser(u); addOut([`BLOCKED: #${u.id} ${u.name}`]); return;
    }
    if (cmd === 'unblock') {
      const name = args.join(' ');
      if (!name) { addErr('Usage: unblock <name>'); return; }
      const u = users.find(x => x.name.toLowerCase().includes(name.toLowerCase()));
      if (!u) { addErr(`No user found matching "${name}"`); return; }
      await unbanUser(u); addOut([`UNBLOCKED: #${u.id} ${u.name}`]); return;
    }
    if (cmd === 'remove') {
      const name = args.join(' ');
      if (!name) { addErr('Usage: remove <name>'); return; }
      const u = users.find(x => x.name.toLowerCase().includes(name.toLowerCase()));
      if (!u) { addErr(`No user found matching "${name}"`); return; }
      await deleteUser(u); addOut([`REMOVED: #${u.id} ${u.name}`]); return;
    }
    if (cmd === 'role') {
      const roleName = args[args.length - 1]?.toLowerCase();
      const nameParts = args.slice(0, -1).join(' ');
      if (!nameParts || !roleName) { addErr('Usage: role <name> <candidate|recruiter|admin>'); return; }
      if (!['candidate', 'recruiter', 'admin'].includes(roleName)) { addErr(`Invalid role: ${roleName}`); return; }
      const u = users.find(x => x.name.toLowerCase().includes(nameParts.toLowerCase()));
      if (!u) { addErr(`No user found matching "${nameParts}"`); return; }
      await changeRole(u, roleName); addOut([`ROLE SET: #${u.id} ${u.name} → ${roleName}`]); return;
    }
    if (cmd === 'approve') {
      const id = Number(args[0]);
      if (!id) { addErr('Usage: approve <job-id>'); return; }
      const j = allJobs.find(x => x.id === id);
      if (!j) { addErr(`Job #${id} not found`); return; }
      await approveJob(j); addOut([`APPROVED: job #${id} "${j.title}"`]); return;
    }
    if (cmd === 'reject') {
      const id = Number(args[0]);
      if (!id) { addErr('Usage: reject <job-id>'); return; }
      const j = allJobs.find(x => x.id === id);
      if (!j) { addErr(`Job #${id} not found`); return; }
      await rejectJob(j); addOut([`REJECTED: job #${id} "${j.title}"`]); return;
    }
    if (cmd === 'deljob') {
      const id = Number(args[0]);
      if (!id) { addErr('Usage: deljob <job-id>'); return; }
      const j = allJobs.find(x => x.id === id);
      if (!j) { addErr(`Job #${id} not found`); return; }
      await deleteJob(j); addOut([`DELETED: job #${id} "${j.title}"`]); return;
    }
    if (cmd === 'verify') {
      const q = args.join(' ').toLowerCase();
      if (!q) { addErr('Usage: verify <name|email>'); return; }
      const u = users.find(x => x.name.toLowerCase().includes(q) || x.email.toLowerCase().includes(q));
      if (!u) { addErr(`No user found matching "${q}"`); return; }
      if (u.role !== 'recruiter') { addErr(`User "${u.name}" is not a recruiter`); return; }
      await approveRecruiter(u); addOut([`VERIFIED: recruiter #${u.id} ${u.name}`]); return;
    }

    const handler = COMMANDS[cmd];
    if (!handler) { addErr(`command not found: ${cmd}. Type 'help'`); return; }
    const lines = handler(args, { stats, users, jobs: allJobs, apps: applications });
    addOut(lines);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, users, allJobs, applications]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void runCmd(cmdInput);
      setCmdInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdxRef.current + 1, cmdHistory.length - 1);
      histIdxRef.current = next;
      setCmdInput(cmdHistory[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdxRef.current - 1, -1);
      histIdxRef.current = next;
      setCmdInput(next === -1 ? '' : cmdHistory[next] ?? '');
    }
  }, [runCmd, cmdInput, cmdHistory]);

  // ─── Derived chart data ──────────────────────────────────────────────────
  const userRoleData = [
    { name: 'Candidates', value: stats?.users.candidates ?? 0, color: T.cyan },
    { name: 'Recruiters', value: stats?.users.recruiters ?? 0, color: T.amber },
    { name: 'Admins',     value: stats?.users.admins ?? 0,     color: T.red },
  ];
  const jobStatusData = [
    { name: 'Approved', value: stats?.jobs.approved ?? 0, color: T.green },
    { name: 'Pending',  value: stats?.jobs.pending  ?? 0, color: T.amber },
    { name: 'Rejected', value: stats?.jobs.rejected ?? 0, color: T.red },
  ];
  const appStatusData = (stats?.applications.byStatus ?? []).map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: Number(s.count),
    color: s.status === 'hired' ? T.green : s.status === 'accepted' ? T.cyan : s.status === 'rejected' ? T.red : T.amber,
  }));

  const jobsByDay = (() => {
    const map: Record<string, number> = {};
    allJobs.forEach(j => {
      const day = fmtDay(j.createdAt);
      map[day] = (map[day] ?? 0) + 1;
    });
    return Object.entries(map).slice(-14).map(([day, count]) => ({ day, count }));
  })();
  const appsByDay = (() => {
    const map: Record<string, number> = {};
    applications.forEach(a => {
      const day = fmtDay(a.createdAt);
      map[day] = (map[day] ?? 0) + 1;
    });
    return Object.entries(map).slice(-14).map(([day, count]) => ({ day, count }));
  })();

  const filteredUsers = users.filter(u => {
    const matchRole = !userRole || u.role === userRole;
    const matchSearch = !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchRole && matchSearch;
  });
  const filteredApps = applications.filter(a => !appStatus || a.status === appStatus);

  const pendingCount = stats?.jobs.pending ?? 0;

  if (!authed) return null;

  const ChartTip = makeChartTip(T);
  const logColors: Record<string, string> = { ok: T.green, err: T.red, info: T.muted, cmd: T.amber, out: T.text };
  const logGlows:  Record<string, string> = { ok: T.gGlow, err: T.rGlow, info: 'none', cmd: T.aGlow, out: 'none' };

  return (
    <div style={{ backgroundColor: T.bg, minHeight: '100vh', fontFamily: FONT, color: T.text, position: 'relative' }}>

      {isDark && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)',
          pointerEvents: 'none', zIndex: 9000,
        }} />
      )}

      {toasts.length > 0 && (
        <div style={{ position: 'fixed', top: '20px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FONT }}>
          {toasts.map(t => {
            const tColor = t.type === 'ok' ? T.green : t.type === 'err' ? T.red : T.amber;
            const tGlow  = t.type === 'ok' ? T.gGlow  : t.type === 'err' ? T.rGlow  : T.aGlow;
            return (
              <div key={t.id} style={{
                border: `1px solid ${tColor}`, backgroundColor: T.bg2, padding: '10px 18px',
                fontSize: '14px', fontWeight: 600, color: tColor, textShadow: tGlow, letterSpacing: '0.05em',
                minWidth: '220px', maxWidth: '360px', boxShadow: tGlow,
              }}>
                {t.msg}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: T.bg2 }}>
        <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '12px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: T.green, textShadow: T.gGlow, letterSpacing: '0.06em' }}>
                {'// JOBIE ADMIN TERMINAL'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: T.muted, marginTop: '5px', letterSpacing: '0.05em' }}>
                ROOT@JOBIE:~$ operator: {adminName.toUpperCase()} &nbsp;
                <span className={isDark ? 'term-blink' : ''} style={{ color: T.green }}>█</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', color: T.green, textShadow: T.gGlow, fontWeight: 700 }}>{clock}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: T.muted, letterSpacing: '0.05em' }}>
                  <span style={{ color: T.green }}>●</span> LIVE · AUTO-REFRESH 30s
                </div>
              </div>
              <button
                onClick={() => setIsDark(d => !d)}
                style={{
                  border: `1px solid ${T.amber}`, color: T.amber, backgroundColor: 'transparent',
                  fontFamily: FONT, fontSize: '13px', fontWeight: 600, padding: '5px 14px', cursor: 'pointer',
                  letterSpacing: '0.05em', textShadow: T.aGlow,
                }}
              >
                {isDark ? '[LIGHT MODE]' : '[DARK MODE]'}
              </button>
              <button
                onClick={() => { loadData(); log('MANUAL REFRESH TRIGGERED', 'info', 'system'); }}
                style={{
                  border: `1px solid ${T.border}`, color: T.muted, backgroundColor: 'transparent',
                  fontFamily: FONT, fontSize: '13px', fontWeight: 600, padding: '5px 14px', cursor: 'pointer', letterSpacing: '0.05em',
                }}
              >
                [REFRESH]
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                style={{
                  border: `1px solid ${T.red}`, color: T.red, backgroundColor: 'transparent',
                  fontFamily: FONT, fontSize: '13px', fontWeight: 600, padding: '5px 14px', cursor: 'pointer',
                  letterSpacing: '0.05em', textShadow: T.rGlow,
                }}
              >
                [LOGOUT]
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '20px 24px' }}>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', marginBottom: '20px', border: `1px solid ${T.border}` }}>
          <StatBox T={T} label="Total Users"   value={loading ? '…' : stats?.users.total ?? 0}
            sub={`${stats?.users.candidates ?? 0} candidates · ${stats?.users.recruiters ?? 0} recruiters`} />
          <StatBox T={T} label="Jobs Live"     value={loading ? '…' : stats?.jobs.approved ?? 0}
            sub={`${stats?.jobs.total ?? 0} total jobs`} />
          <StatBox T={T} label="Jobs Pending"  value={loading ? '…' : pendingCount}
            color={pendingCount > 0 ? T.amber : T.muted} glow={pendingCount > 0 ? T.aGlow : 'none'}
            sub="awaiting review" />
          <StatBox T={T} label="Applications"  value={loading ? '…' : stats?.applications.total ?? 0}
            sub={stats?.applications.byStatus.map(s => `${s.status}:${s.count}`).join(' · ')} />
          <StatBox T={T} label="Hired"
            value={loading ? '…' : stats?.applications.byStatus.find(s => s.status === 'hired')?.count ?? 0}
            color={T.cyan} glow={T.cGlow} sub="successful placements" />
          <StatBox T={T} label="Rejected Jobs" value={loading ? '…' : stats?.jobs.rejected ?? 0}
            color={T.red} glow={T.rGlow} sub="moderated" />
        </div>

        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: '20px', overflowX: 'auto' }}>
          {([
            ['analytics', 'ANALYTICS'],
            ['queue',     `JOB QUEUE [${pendingCount}]`],
            ['alljobs',   'ALL JOBS'],
            ['users',     `USERS [${users.length}]`],
            ['apps',      `APPLICATIONS [${applications.length}]`],
            ['recruiters',`REC QUEUE [${pendingRecruiters.length}]`],
          ] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              fontFamily: FONT, fontSize: '14px', fontWeight: 600, padding: '10px 24px', cursor: 'pointer',
              letterSpacing: '0.07em', border: 'none',
              borderBottom: tab === id ? `2px solid ${T.green}` : '2px solid transparent',
              color: tab === id ? T.green : T.muted, backgroundColor: 'transparent',
              textShadow: tab === id ? T.gGlow : 'none', whiteSpace: 'nowrap',
            }}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingRecruiters.length > 0 && (
              <div 
                onClick={() => setTab('recruiters')}
                style={{ 
                  backgroundColor: `${T.amber}22`, border: `1px solid ${T.amber}`, padding: '12px 20px', 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                  animation: 'pulse-glow 2s infinite', textShadow: T.aGlow
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <span style={{ color: T.amber, fontSize: '18px' }}>⚠️</span>
                   <span style={{ color: T.amber, fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em' }}>
                     [SYSTEM ALERT] {pendingRecruiters.length} RECRUITER{pendingRecruiters.length > 1 ? 'S' : ''} AWAITING VERIFICATION
                   </span>
                </div>
                <span style={{ color: T.amber, fontSize: '12px', fontWeight: 600, opacity: 0.8 }}>CLICK TO OPEN QUEUE →</span>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <ChartPane title="Applications Over Time" T={T}>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={appsByDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.green} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={T.green} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.chartGridStroke} />
                    <XAxis dataKey="day" tick={{ fill: T.chartAxis, fontSize: 10, fontFamily: FONT }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.chartAxis, fontSize: 10, fontFamily: FONT }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={ChartTip} />
                    <Area type="monotone" dataKey="count" name="Applications" stroke={T.green} strokeWidth={2} fill="url(#appGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartPane>

              <ChartPane title="Job Postings Over Time" T={T}>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={jobsByDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="jobGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.amber} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={T.amber} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.chartGridStroke} />
                    <XAxis dataKey="day" tick={{ fill: T.chartAxis, fontSize: 10, fontFamily: FONT }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.chartAxis, fontSize: 10, fontFamily: FONT }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={ChartTip} />
                    <Area type="monotone" dataKey="count" name="Jobs Posted" stroke={T.amber} strokeWidth={2} fill="url(#jobGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartPane>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
              <ChartPane title="Application Status Breakdown" T={T}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={appStatusData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.chartGridStroke} />
                    <XAxis dataKey="name" tick={{ fill: T.chartAxis, fontSize: 10, fontFamily: FONT }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.chartAxis, fontSize: 10, fontFamily: FONT }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={ChartTip} />
                    <Bar dataKey="value" name="Count" radius={[2,2,0,0]}>
                      {appStatusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartPane>

              <ChartPane title="Users by Role" T={T}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={userRoleData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                      {userRoleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={ChartTip} />
                    <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: '10px', fontFamily: FONT, color: T.muted }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartPane>

              <ChartPane title="Jobs by Status" T={T}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={jobStatusData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                      {jobStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={ChartTip} />
                    <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: '10px', fontFamily: FONT, color: T.muted }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartPane>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0', border: `1px solid ${T.border}` }}>
              {[
                { label: 'Approval Rate', value: stats?.jobs.total ? `${Math.round(((stats?.jobs.approved ?? 0) / stats.jobs.total) * 100)}%` : '—', color: T.green, glow: T.gGlow },
                { label: 'Rejection Rate', value: stats?.jobs.total ? `${Math.round(((stats?.jobs.rejected ?? 0) / stats.jobs.total) * 100)}%` : '—', color: T.red, glow: T.rGlow },
                { label: 'Hire Rate', value: stats?.applications.total ? `${Math.round((Number(stats.applications.byStatus.find(s=>s.status==='hired')?.count??0) / stats.applications.total) * 100)}%` : '—', color: T.cyan, glow: T.cGlow },
                { label: 'Rec / Cand Ratio', value: stats ? `1 : ${stats.users.candidates > 0 ? Math.round(stats.users.candidates / Math.max(stats.users.recruiters, 1)) : '?'}` : '—', color: T.amber, glow: T.aGlow },
              ].map(({ label, value, color, glow }) => (
                <div key={label} style={{ border: `1px solid ${T.border}`, padding: '18px 20px', backgroundColor: T.bg }}>
                  <div style={{ fontSize: '10px', color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color, textShadow: glow }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'queue' && (
          <Pane T={T} title={`Job Approval Queue — ${pendingCount} pending`}>
            {loading ? (
              <div style={{ color: T.muted, textAlign: 'center', padding: '30px' }}>LOADING… <span className="term-blink">█</span></div>
            ) : pendingJobs.length === 0 ? (
              <div style={{ color: T.muted, padding: '24px', textAlign: 'center', letterSpacing: '0.06em' }}>
                {'// NO PENDING JOBS — QUEUE EMPTY [OK]'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><TRow T={T} head cells={['#', 'Title', 'Company', 'Level', 'Recruiter', 'Posted', 'Actions']} /></thead>
                  <tbody>
                    {pendingJobs.map(job => (
                      <TRow T={T} key={job.id} cells={[
                        `#${job.id}`,
                        job.title,
                        job.company,
                        job.experienceLevel?.toUpperCase() ?? '—',
                        job.recruiter ? `${job.recruiter.name}` : `uid:${job.recruiterId}`,
                        fmt(job.createdAt),
                        <div key="a" style={{ display: 'flex', gap: '6px' }}>
                          <Btn T={T} label="[APPROVE]" onClick={() => approveJob(job)} color={T.green} glow={T.gGlow} />
                          <Btn T={T} label="[REJECT]"  onClick={() => rejectJob(job)}  color={T.red}   glow={T.rGlow} />
                        </div>,
                      ]} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Pane>
        )}

        {tab === 'alljobs' && (
          <Pane T={T} title={`All Jobs — ${allJobs.length} total`}>
            {loading ? (
              <div style={{ color: T.muted, textAlign: 'center', padding: '30px' }}>LOADING… <span className="term-blink">█</span></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><TRow T={T} head cells={['#', 'Title', 'Company', 'Level', 'Status', 'Recruiter', 'Posted', 'Actions']} /></thead>
                  <tbody>
                    {allJobs.map(job => (
                      <TRow T={T} key={job.id} cells={[
                        `#${job.id}`,
                        job.title,
                        job.company,
                        job.experienceLevel?.toUpperCase() ?? '—',
                        <Badge T={T} key="s" status={job.status ?? 'approved'} />,
                        job.recruiter?.name ?? `uid:${job.recruiterId}`,
                        fmt(job.createdAt),
                        <div key="a" style={{ display: 'flex', gap: '6px' }}>
                          {job.status !== 'approved'  && <Btn T={T} label="[APV]" onClick={() => approveJob(job)} color={T.green} />}
                          {job.status !== 'rejected'  && <Btn T={T} label="[REJ]" onClick={() => rejectJob(job)}  color={T.amber} glow={T.aGlow} />}
                          <Btn T={T} label="[DEL]" onClick={() => deleteJob(job)} color={T.red} glow={T.rGlow} />
                        </div>,
                      ]} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Pane>
        )}

        {tab === 'users' && (
          <Pane T={T} title={`User Registry — ${filteredUsers.length} / ${users.length}`}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: T.muted, fontSize: '11px' }}>ROLE:</span>
                {(['', 'candidate', 'recruiter', 'admin'] as const).map(r => (
                  <button key={r} onClick={() => setUserRole(r)} style={{
                    border: `1px solid ${userRole === r ? T.green : T.muted}`,
                    color: userRole === r ? T.green : T.muted,
                    backgroundColor: 'transparent', fontFamily: FONT, fontSize: '11px', padding: '2px 8px',
                    cursor: 'pointer', textShadow: userRole === r ? T.gGlow : 'none',
                  }}>
                    [{r.toUpperCase() || 'ALL'}]
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${T.muted}`, padding: '3px 10px', gap: '6px' }}>
                <span style={{ color: T.muted, fontSize: '11px' }}>SEARCH:~$</span>
                <input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="name or email..."
                  style={{
                    background: 'transparent', border: 'none', color: T.text, fontFamily: FONT,
                    fontSize: '12px', outline: 'none', width: '200px',
                  }}
                />
              </div>
            </div>
            {loading ? (
              <div style={{ color: T.muted, textAlign: 'center', padding: '30px' }}>LOADING… <span className="term-blink">█</span></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><TRow T={T} head cells={['#', 'Name', 'Email', 'Role', 'Status', 'Joined', 'Actions']} /></thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <TRow T={T} key={user.id} cells={[
                        `#${user.id}`,
                        user.name,
                        user.email,
                        <Badge T={T} key="r" status={user.role} />,
                        user.banned
                          ? <Badge T={T} key="b" status="banned" />
                          : <span key="b" style={{ fontSize: '12px', fontWeight: 500, color: T.muted, letterSpacing: '0.05em' }}>active</span>,
                        fmt(user.createdAt),
                        <div key="a" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {user.role !== 'candidate' && <Btn T={T} label="[→CAND]" onClick={() => changeRole(user, 'candidate')} color={T.green} />}
                          {user.role !== 'recruiter' && <Btn T={T} label="[→REC]"  onClick={() => changeRole(user, 'recruiter')} color={T.amber} glow={T.aGlow} />}
                          {!user.banned
                            ? <Btn T={T} label="[BLOCK]"   onClick={() => banUser(user)}   color={T.red}  glow={T.rGlow} />
                            : <Btn T={T} label="[UNBLOCK]" onClick={() => unbanUser(user)} color={T.cyan} glow={T.cGlow} />}
                          <Btn T={T} label="[DEL]" onClick={() => deleteUser(user)} color={T.red} glow={T.rGlow} />
                        </div>,
                      ]} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Pane>
        )}

        {tab === 'recruiters' && (
          <Pane T={T} title={`Recruiter Approval Queue — ${pendingRecruiters.length} pending`}>
            {loading ? (
              <div style={{ color: T.muted, textAlign: 'center', padding: '30px' }}>LOADING… <span className="term-blink">█</span></div>
            ) : pendingRecruiters.length === 0 ? (
              <div style={{ color: T.muted, padding: '24px', textAlign: 'center' }}>{'// NO PENDING RECRUITERS — QUEUE EMPTY [OK]'}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><TRow T={T} head cells={['#', 'Name', 'Email', 'Company', 'Website', 'Joined', 'Actions']} /></thead>
                  <tbody>
                    {pendingRecruiters.map(user => (
                      <TRow T={T} key={user.id} cells={[
                        `#${user.id}`,
                        user.name,
                        user.email,
                        user.profile?.companyName ?? '—',
                        user.profile?.website ? <a href={user.profile.website} target="_blank" rel="noreferrer" style={{ color: T.cyan }}>{user.profile.website.replace(/^https?:\/\//, '')}</a> : '—',
                        fmt(user.createdAt),
                        <div key="a" style={{ display: 'flex', gap: '6px' }}>
                          <Btn T={T} label="[REVIEW]" onClick={() => setSelectedRecruiter(user)} color={T.cyan} glow={T.cGlow} />
                          <Btn T={T} label="[VERIFY]" onClick={() => approveRecruiter(user)} color={T.green} glow={T.gGlow} />
                        </div>,
                      ]} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Pane>
        )}

        <div style={{ marginTop: '24px', border: `1px solid ${T.border}`, fontFamily: TERM_FONT, backgroundColor: T.bg }}>
          <div style={{ backgroundColor: T.muted, padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: T.bg, fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em' }}>
              +─ TERMINAL / ACTIVITY LOG ──+
            </span>
            <span style={{ color: T.bg, fontSize: '12px', opacity: 0.8, fontWeight: 500 }}>↑↓ history · enter to run</span>
          </div>

          <div style={{ borderBottom: `1px solid ${T.border}`, display: 'flex', gap: '0', overflowX: 'auto' }}>
            {(['all', 'user', 'job', 'app', 'system', 'errors'] as const).map(cat => {
              const labels: Record<string, string> = { all: 'ALL', user: 'USERS', job: 'JOBS', app: 'APPS', system: 'SYSTEM', errors: 'ERRORS' };
              const count = cat === 'all' ? cmdLog.length
                : cat === 'errors' ? cmdLog.filter(l => l.type === 'err').length
                : cmdLog.filter(l => l.cat === cat).length;
              return (
                <button key={cat} onClick={() => setActLogTab(cat)} style={{
                  fontFamily: TERM_FONT, fontSize: '13px', fontWeight: 600, padding: '8px 18px', cursor: 'pointer',
                  border: 'none', borderBottom: actLogTab === cat ? `2px solid ${cat === 'errors' ? T.red : T.green}` : '2px solid transparent',
                  color: actLogTab === cat ? (cat === 'errors' ? T.red : T.green) : T.muted,
                  backgroundColor: 'transparent',
                  textShadow: actLogTab === cat ? (cat === 'errors' ? T.rGlow : T.gGlow) : 'none',
                  letterSpacing: '0.07em', whiteSpace: 'nowrap',
                }}>
                  {labels[cat]} [{count}]
                </button>
              );
            })}
          </div>

          <div
            ref={logRef}
            style={{ maxHeight: '260px', overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '2px' }}
          >
            {(actLogTab === 'all' ? cmdLog
              : actLogTab === 'errors' ? cmdLog.filter(l => l.type === 'err')
              : cmdLog.filter(l => l.cat === actLogTab)
            ).map((line, i) => (
              <div key={i} style={{
                fontSize: '13px', fontWeight: 500,
                color: logColors[line.type] ?? T.text,
                textShadow: logGlows[line.type] ?? 'none',
                fontFamily: TERM_FONT, letterSpacing: '0.03em', lineHeight: '1.6',
              }}>
                {line.text}
              </div>
            ))}
          </div>

          <div
            style={{ borderTop: `1px solid ${T.border}`, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'text' }}
            onClick={() => inputRef.current?.focus()}
          >
            <span style={{ color: T.amber, fontSize: '14px', fontWeight: 700, textShadow: T.aGlow, whiteSpace: 'nowrap' }}>ROOT@JOBIE:~$</span>
            <input
              ref={inputRef}
              value={cmdInput}
              onChange={e => setCmdInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="help · stats · block <name> · remove <name> · approve <id>"
              style={{
                flex: 1, background: 'transparent', border: 'none', color: T.green, fontFamily: TERM_FONT,
                fontSize: '14px', fontWeight: 600, outline: 'none', textShadow: T.gGlow,
              }}
              spellCheck={false}
              autoComplete="off"
            />
            <span className={isDark ? 'term-blink' : ''} style={{ color: T.green, fontSize: '14px' }}>█</span>
          </div>
        </div>

        {selectedRecruiter && (
          <div style={{ 
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px'
          }}>
            <div style={{ 
              width: '100%', maxWidth: '600px', backgroundColor: T.bg, border: `1px solid ${T.border}`,
              padding: '0', animation: 'modal-pop 0.2s ease-out'
            }}>
              <div style={{ backgroundColor: T.muted, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: T.bg, fontSize: '13px', fontWeight: 700 }}>RECRUITER_VERIFICATION_PROTOCOL :: #{selectedRecruiter.id}</span>
                <button onClick={() => setSelectedRecruiter(null)} style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: '20px' }}>×</button>
              </div>
              
              <div style={{ padding: '30px' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'start', marginBottom: '30px' }}>
                  <div style={{ 
                    width: '80px', height: '80px', border: `1px solid ${T.border}`, backgroundColor: T.bg2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px'
                  }}>
                    {selectedRecruiter.name.charAt(0)}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '24px', color: T.green, textShadow: T.gGlow, margin: 0 }}>{selectedRecruiter.name}</h2>
                    <div style={{ color: T.muted, fontSize: '12px', marginTop: '4px' }}>{selectedRecruiter.email}</div>
                    <div style={{ marginTop: '12px' }}>
                       <Badge T={T} status="recruiter" />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  <div>
                    <div style={{ color: T.muted, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Company</div>
                    <div style={{ color: T.text, fontSize: '14px' }}>{selectedRecruiter.profile?.companyName || 'Unknown Corp'}</div>
                  </div>
                  <div>
                    <div style={{ color: T.muted, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Location</div>
                    <div style={{ color: T.text, fontSize: '14px' }}>{selectedRecruiter.profile?.location || 'Remote/Unknown'}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ color: T.muted, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Website</div>
                    <div style={{ color: T.cyan, fontSize: '14px' }}>{selectedRecruiter.profile?.website || '—'}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '40px' }}>
                  <div style={{ color: T.muted, fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px' }}>Security Bio / Verification Note</div>
                  <div style={{ 
                    color: T.text, fontSize: '12px', lineHeight: '1.6', opacity: 0.8,
                    padding: '12px', backgroundColor: T.bg2, borderLeft: `2px solid ${T.green}`
                  }}>
                    {selectedRecruiter.profile?.bio || 'No verification note provided. Recommended to review company website before approval.'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <Btn T={T} label="[DECLINE_CREDENTIALS]" onClick={() => rejectRecruiter(selectedRecruiter)} color={T.red} glow={T.rGlow} />
                  <Btn T={T} label="[PROCEED_WITH_VERIFICATION]" onClick={() => approveRecruiter(selectedRecruiter)} color={T.green} glow={T.gGlow} />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <style jsx global>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0px ${T.amber}00; }
          50% { box-shadow: 0 0 15px ${T.amber}44; }
          100% { box-shadow: 0 0 0px ${T.amber}00; }
        }
        @keyframes modal-pop {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
