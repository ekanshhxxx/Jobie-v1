'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser } from '../../lib/api';
import { BarChart, Activity, Users, Target } from 'lucide-react';
import Header from '../components/Header';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Note: For a real production build, these would be fetched directly from `api.get('/api/analytics')`.
  // Here we use realistic generated data mapped to the ATS pipeline architecture.
  const [stats, setStats] = useState({
    totalApplicantsMonth: 482,
    avgMatchScore: 78,
    interviewsScheduled: 42,
    timeToHireDays: 14
  });

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'recruiter') {
      router.push('/login');
      return;
    }
    // Simulate data loading
    setTimeout(() => setLoading(false), 800);
  }, [router]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
      },
    },
    scales: {
      y: { display: false, beginAtZero: true },
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#94a3b8', font: { size: 12, family: "'Inter', sans-serif" } }
      }
    },
    interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false },
  };

  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Qualified Candidates',
        data: [45, 82, 65, 120, 95, 150],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
      }
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { padding: 20, color: '#64748b', font: { size: 13, family: "'Inter', sans-serif" }, usePointStyle: true, pointStyle: 'circle' }
      },
      tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12 }
    }
  };

  const donutData = {
    labels: ['Applied', 'Screening', 'Interviewing', 'Offer Extended', 'Hired'],
    datasets: [
      {
        data: [300, 150, 45, 12, 5],
        backgroundColor: ['#e2e8f0', '#94a3b8', '#8b5cf6', '#10b981', '#0f172a'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f1a] flex flex-col items-center justify-center transition-colors">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Computing predictive metrics...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 lg:space-y-8 bg-gray-50/50 dark:bg-[#0b0f1a] transition-colors">
      <div className="max-w-7xl w-full mx-auto space-y-6 lg:space-y-8">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              Intelligence Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">AI-driven predictive analytics for your hiring pipeline.</p>
          </div>
          
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm">
              Export PDF
            </button>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard title="Total Acquired (30d)" value={stats.totalApplicantsMonth} trend="+12.5%" icon={<Users className="w-5 h-5 text-blue-500" />} />
          <StatCard title="Avg Match Score" value={`${stats.avgMatchScore}%`} trend="+4.2%" icon={<Target className="w-5 h-5 text-indigo-500" />} />
          <StatCard title="Active Interviews" value={stats.interviewsScheduled} trend="+18.1%" icon={<Activity className="w-5 h-5 text-violet-500" />} />
          <StatCard title="Time to Hire" value={`${stats.timeToHireDays} Days`} trend="-2.4%" positive icon={<BarChart className="w-5 h-5 text-emerald-500" />} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Line Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-black/40 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Candidate Acquisition Rate</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Volume of AI-qualified candidates over time.</p>
              </div>
              <select className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-sm px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-500">
                <option>Last 6 Months</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="h-[300px] w-full relative">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="bg-white dark:bg-black/40 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pipeline Conversion</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Where candidates sit across all stages.</p>
            <div className="flex-1 min-h-[250px] relative">
              <div className="absolute inset-0 flex items-center justify-center flex-col -translate-x-12 mt-4 pointer-events-none">
                <span className="text-3xl font-black text-gray-900 dark:text-white">4.8%</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Hire Rate</span>
              </div>
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon, positive = false }: { title: string, value: string | number, trend: string, icon: any, positive?: boolean }) {
  const isTrendPositive = trend.startsWith('+') !== positive; // Simple heuristic for green/red coloring
  return (
    <div className="bg-white dark:bg-black/40 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm flex items-start justify-between group hover:-translate-y-1 transition-transform cursor-default">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-1">{title}</p>
        <h4 className="text-3xl font-black text-gray-900 dark:text-white">{value}</h4>
        <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${isTrendPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {isTrendPositive ? '↑' : '↓'} {trend} <span className="text-gray-400 font-medium">vs last month</span>
        </p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
  );
}
