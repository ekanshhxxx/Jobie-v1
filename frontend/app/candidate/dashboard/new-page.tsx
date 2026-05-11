'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  Search,
  MapPin,
  DollarSign,
  Clock,
  Star,
  ArrowRight,
  Sparkles,
  Target
} from 'lucide-react';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { GlassInput } from '../../../components/GlassInput';
import { GlassStats } from '../../../components/GlassStats';
import { GlassBadge } from '../../../components/GlassBadge';
import { useToast } from '../../components/ToastProvider';
import { api, getUser, clearAuth, isApiError } from '../../lib/api';

interface Job {
  id: number;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  type?: string;
  employmentType?: string;
  description?: string;
  createdAt?: string;
}

interface Application {
  id: number;
  jobId: number;
  status: string;
  createdAt?: string;
}

interface Profile {
  profileCompleteness?: number;
  skills?: string[];
  githubUsername?: string;
  headline?: string;
  bio?: string;
}

interface MatchResult {
  matchScore: number;
  hiringProbability?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
}

export default function CandidateDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [matchScores, setMatchScores] = useState<Record<number, MatchResult>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.role !== 'candidate') {
      router.push(`/${currentUser.role}/dashboard`);
      return;
    }
    setUser(currentUser);
  }, [router]);

  // Load data
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [jobsRes, appsRes, profileRes] = await Promise.allSettled([
          api.get('/api/jobs'),
          api.get(`/api/applications/user/${user.id}`),
          api.get(`/api/profile/${user.id}`),
        ]);

        if (jobsRes.status === 'fulfilled') {
          const loadedJobs = (jobsRes.value.jobs ?? jobsRes.value) as Job[];
          setJobs(loadedJobs);

          // Load match scores
          const scores = await Promise.allSettled(
            loadedJobs.slice(0, 10).map(job =>
              api.get(`/api/match/score/${user.id}/${job.id}`)
                .then(data => ({ jobId: job.id, data }))
            )
          );

          const matchData: Record<number, MatchResult> = {};
          scores.forEach(result => {
            if (result.status === 'fulfilled') {
              matchData[result.value.jobId] = result.value.data as MatchResult;
            }
          });
          setMatchScores(matchData);
        }

        if (appsRes.status === 'fulfilled') {
          setApplications((appsRes.value.applications ?? appsRes.value) as Application[]);
        }

        if (profileRes.status === 'fulfilled') {
          setProfile((profileRes.value.profile ?? profileRes.value) as Profile);
        }

      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          clearAuth();
          router.push('/login');
          return;
        }
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, router]);

  // Calculate stats
  const profileCompleteness = profile?.profileCompleteness ?? 
    (profile ? Math.min(100, 
      25 + 
      (profile.headline ? 20 : 0) +
      (profile.bio ? 15 : 0) +
      (profile.skills?.length ? 20 : 0) +
      (profile.githubUsername ? 20 : 0)
    ) : 25);

  const activeApplications = applications.filter(app => 
    !['hired', 'rejected', 'offer_rejected', 'offer_accepted'].includes(app.status)
  );

  const upcomingInterviews = applications.filter(app => 
    app.status === 'interview_scheduled'
  ).length;

  // Filter jobs by search
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by match score
  const topMatches = filteredJobs
    .sort((a, b) => {
      const scoreA = matchScores[a.id]?.matchScore ?? 0;
      const scoreB = matchScores[b.id]?.matchScore ?? 0;
      return scoreB - scoreA;
    })
    .slice(0, 6);

  const formatSalary = (job: Job) => {
    if (job.salary) {
      const num = Number(job.salary);
      if (!isNaN(num) && num > 999) {
        return `$${Math.round(num / 1000)}k`;
      }
      return job.salary;
    }
    if (job.salaryMin && job.salaryMax) {
      return `$${job.salaryMin}k - $${job.salaryMax}k`;
    }
    return 'Competitive';
  };

  const applyToJob = async (jobId: number) => {
    if (!user) return;
    
    const alreadyApplied = applications.some(app => app.jobId === jobId);
    if (alreadyApplied) {
      toast({ type: 'info', title: 'Already Applied', message: 'You already applied to this role' });
      return;
    }

    try {
      const response = await api.post('/api/applications/apply', { 
        userId: user.id, 
        jobId 
      });
      toast({ type: 'success', title: 'Applied!', message: 'Application submitted successfully' });
      setApplications([...applications, response.application ?? response]);
    } catch (error) {
      toast({ type: 'error', title: 'Error', message: 'Failed to submit application' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Gradient Mesh Background */}
      <div className="gradient-mesh" />

      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-slate-400 text-lg">
            Here's what's happening with your job search today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassStats
            title="Active Applications"
            value={activeApplications.length}
            subtitle="in progress"
            icon={<Briefcase className="w-6 h-6" />}
            trend={activeApplications.length > 0 ? { value: 12, isPositive: true } : undefined}
          />
          
          <GlassStats
            title="Upcoming Interviews"
            value={upcomingInterviews}
            subtitle="scheduled"
            icon={<Calendar className="w-6 h-6" />}
          />
          
          <GlassStats
            title="Profile Strength"
            value={`${profileCompleteness}%`}
            subtitle="completion"
            icon={<TrendingUp className="w-6 h-6" />}
            trend={profileCompleteness < 100 ? { value: profileCompleteness, isPositive: true } : undefined}
          />
        </div>

        {/* Profile Completion Alert */}
        {profileCompleteness < 100 && (
          <GlassCard className="p-6 mb-8" hover>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  Complete Your Profile
                </h3>
                <p className="text-slate-300 mb-4">
                  Your profile is {profileCompleteness}% complete. A complete profile increases your chances of getting noticed by recruiters.
                </p>
                <Link href="/profile">
                  <GlassButton variant="primary" size="sm">
                    Complete Profile
                    <ArrowRight className="w-4 h-4" />
                  </GlassButton>
                </Link>
              </div>
              <div className="ml-4">
                <div className="relative w-20 h-20">
                  <svg className="transform -rotate-90" width="80" height="80">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#3B82F6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - profileCompleteness / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{profileCompleteness}%</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <GlassInput
            type="text"
            placeholder="Search jobs by title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
            className="max-w-2xl"
          />
        </div>

        {/* Job Recommendations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-400" />
              Top Matches For You
            </h2>
            <Link href="/candidate/jobs">
              <GlassButton variant="ghost" size="sm">
                View All Jobs
                <ArrowRight className="w-4 h-4" />
              </GlassButton>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topMatches.map((job) => {
              const matchData = matchScores[job.id];
              const matchScore = matchData?.matchScore ?? 0;
              const hasApplied = applications.some(app => app.jobId === job.id);

              return (
                <GlassCard key={job.id} className="p-6 flex flex-col" hover>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">
                        {job.title}
                      </h3>
                      <p className="text-slate-400 text-sm">{job.company}</p>
                    </div>
                    {matchScore > 0 && (
                      <div className="ml-2 flex flex-col items-center">
                        <div className="relative w-12 h-12">
                          <svg className="transform -rotate-90" width="48" height="48">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="4"
                              fill="none"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke={matchScore >= 70 ? '#10B981' : matchScore >= 50 ? '#3B82F6' : '#F59E0B'}
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 20}`}
                              strokeDashoffset={`${2 * Math.PI * 20 * (1 - matchScore / 100)}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">{matchScore}%</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 mt-1">Match</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.location && (
                      <GlassBadge size="sm" variant="default">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </GlassBadge>
                    )}
                    <GlassBadge size="sm" variant="info">
                      <DollarSign className="w-3 h-3" />
                      {formatSalary(job)}
                    </GlassBadge>
                    {(job.type || job.employmentType) && (
                      <GlassBadge size="sm" variant="default">
                        <Clock className="w-3 h-3" />
                        {job.type || job.employmentType}
                      </GlassBadge>
                    )}
                  </div>

                  {/* Description Preview */}
                  {job.description && (
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {job.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-auto flex gap-2">
                    <Link href={`/jobs/${job.id}`} className="flex-1">
                      <GlassButton variant="secondary" size="sm" className="w-full">
                        View Details
                      </GlassButton>
                    </Link>
                    {hasApplied ? (
                      <GlassBadge variant="success" className="px-4 py-2">
                        Applied
                      </GlassBadge>
                    ) : (
                      <GlassButton 
                        variant="primary" 
                        size="sm"
                        onClick={() => applyToJob(job.id)}
                      >
                        Apply Now
                      </GlassButton>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {topMatches.length === 0 && (
            <GlassCard className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Jobs Found</h3>
              <p className="text-slate-400">
                {searchQuery ? 'Try adjusting your search' : 'Check back later for new opportunities'}
              </p>
            </GlassCard>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/candidate/applications">
            <GlassCard className="p-6 text-center" hover>
              <Briefcase className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">My Applications</h3>
              <p className="text-slate-400 text-sm">Track your application progress</p>
            </GlassCard>
          </Link>

          <Link href="/candidate/messages">
            <GlassCard className="p-6 text-center" hover>
              <Calendar className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Messages</h3>
              <p className="text-slate-400 text-sm">Chat with recruiters</p>
            </GlassCard>
          </Link>

          <Link href="/profile">
            <GlassCard className="p-6 text-center" hover>
              <Star className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">My Profile</h3>
              <p className="text-slate-400 text-sm">Update your information</p>
            </GlassCard>
          </Link>
        </div>

      </div>
    </div>
  );
}
