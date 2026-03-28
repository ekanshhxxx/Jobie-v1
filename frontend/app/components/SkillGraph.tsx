'use client';

import { useMemo } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Profile } from './types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface SkillGraphProps {
  profile: Profile;
}

interface SkillDatum {
  id: string;
  confidence: number;
  category: string;
}

const CATEGORY_MAP: Record<string, string> = {
  javascript: 'frontend',
  typescript: 'frontend',
  react: 'frontend',
  'react.js': 'frontend',
  nextjs: 'frontend',
  'next.js': 'frontend',
  html: 'frontend',
  css: 'frontend',
  tailwindcss: 'frontend',
  tailwind: 'frontend',
  nodejs: 'backend',
  'node.js': 'backend',
  node: 'backend',
  express: 'backend',
  python: 'backend',
  django: 'backend',
  java: 'backend',
  c: 'backend',
  'c++': 'backend',
  'c#': 'backend',
  go: 'backend',
  rust: 'backend',
  mongodb: 'database',
  postgresql: 'database',
  mysql: 'database',
  redis: 'database',
  docker: 'devops',
  kubernetes: 'devops',
  aws: 'devops',
  gcp: 'devops',
  azure: 'devops',
  tensorflow: 'ai',
  pytorch: 'ai',
  'machine learning': 'ai',
  'deep learning': 'ai',
};

const CATEGORY_COLORS: Record<string, string> = {
  frontend: '#3b82f6',
  backend: '#10b981',
  database: '#f59e0b',
  devops: '#8b5cf6',
  ai: '#ec4899',
  other: '#64748b',
};

const normalizeSkill = (skill: string) => skill.trim().toLowerCase();

export default function SkillGraph({ profile }: SkillGraphProps) {
  const skillsData = useMemo<SkillDatum[]>(() => {
    const verified = profile.githubVerifiedSkills?.map((s) => ({
      id: s.skill,
      confidence: Math.max(0, Math.min(100, s.confidence)),
      category: CATEGORY_MAP[normalizeSkill(s.skill)] || 'other',
    }));

    if (verified && verified.length > 0) {
      return verified
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 20);
    }

    if (!profile.skills || profile.skills.length === 0) return [];

    return profile.skills
      .map((skill) => ({
        id: skill,
        confidence: 60,
        category: CATEGORY_MAP[normalizeSkill(skill)] || 'other',
      }))
      .slice(0, 20);
  }, [profile.githubVerifiedSkills, profile.skills]);

  if (skillsData.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-12">
        Not enough skill data to construct graph.
      </div>
    );
  }

  const labels = skillsData.map((skill) => skill.id);
  const backgroundColor = skillsData.map((skill) => CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.other);
  const borderColor = skillsData.map((skill) => CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.other);

  const data = {
    labels,
    datasets: [
      {
        label: 'Confidence',
        data: skillsData.map((skill) => skill.confidence),
        backgroundColor,
        borderColor,
        borderWidth: 1,
        borderRadius: 8,
        barThickness: 16,
        maxBarThickness: 20,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    animation: {
      duration: 600,
      easing: 'easeOutQuart' as const,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const index = context.dataIndex;
            const category = skillsData[index]?.category || 'other';
            const value = context.parsed.x;
            return `${value}% confidence (${category})`;
          },
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(148, 163, 184, 0.25)',
        },
        ticks: {
          color: '#64748b',
          callback: (value: string | number) => `${value}%`,
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#334155',
          font: {
            size: 11,
            weight: 500,
          },
        },
      },
    },
  };

  return (
    <div className="w-full relative bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-4">
      <div className="h-[400px]">
        <Bar data={data} options={options} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 pointer-events-none">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} className="flex items-center gap-1 text-[10px] font-medium text-gray-500 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}
