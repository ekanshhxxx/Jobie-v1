'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Profile } from './types';

interface SkillGraphProps {
  profile: Profile;
}

// Simple data transformation: use verified skills and give them a score
// In a real app, this logic would be more complex
const transformData = (profile: Profile) => {
  if (!profile.githubVerifiedSkills || profile.githubVerifiedSkills.length === 0) {
    // Fallback to regular skills if no verified ones
    return profile.skills.slice(0, 8).map(skill => ({
      subject: skill,
      A: 50, // Assign a default value
      fullMark: 100,
    }));
  }

  return profile.githubVerifiedSkills.slice(0, 8).map(skill => ({
    subject: skill.skill,
    A: skill.confidence,
    fullMark: 100,
  }));
};

export default function SkillGraph({ profile }: SkillGraphProps) {
  const data = transformData(profile);

  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        Not enough skill data to display graph.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <defs>
          <radialGradient id="skillGradient">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
          </radialGradient>
        </defs>
        <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Skill Confidence"
          dataKey="A"
          stroke="#3b82f6"
          fill="url(#skillGradient)"
          fillOpacity={0.8}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '0.5rem',
          }}
          labelStyle={{ color: '#cbd5e1' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
