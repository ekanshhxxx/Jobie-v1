'use client';

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleDollarSign,
  FileText,
  Loader2,
  MapPin,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { api, clearAuth, getUser, isApiError } from '../../lib/api';
import { useToast } from '../../components/ToastProvider';

type RecruiterUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  companyName?: string;
};

type ExperienceLevel = 'junior' | 'mid' | 'senior';

type FormState = {
  title: string;
  company: string;
  location: string;
  salary: string;
  experienceLevel: ExperienceLevel;
  description: string;
};

const INITIAL_FORM: FormState = {
  title: '',
  company: '',
  location: '',
  salary: '',
  experienceLevel: 'mid',
  description: '',
};

const EXPERIENCE_COPY: Record<ExperienceLevel, string> = {
  junior: 'Early-career role with coaching and defined execution ownership.',
  mid: 'Independent contributor with solid delivery range and strong communication.',
  senior: 'High-ownership leader who can shape systems, mentor others, and drive outcomes.',
};

const HIRING_NOTES = [
  'Use Save Draft when role details are still being reviewed internally.',
  'Publish moves lifecycle to live hiring mode for approved candidate traffic.',
  'Use concise, candidate-friendly descriptions to improve match quality.',
  'Add both soft skills and tech stack so AI parsing stays accurate.',
];

function normalizeTag(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export default function RecruiterPostJobPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<RecruiterUser | null>(() => {
    if (typeof window === 'undefined') return null;
    return getUser() as RecruiterUser | null;
  });
  const [form, setForm] = useState<FormState>(() => {
    if (typeof window === 'undefined') return INITIAL_FORM;
    const storedUser = getUser() as RecruiterUser | null;
    return {
      ...INITIAL_FORM,
      company: storedUser?.companyName || '',
    };
  });
  const [skillInput, setSkillInput] = useState('');
  const [techInput, setTechInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [techStack, setTechStack] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pageReady, setPageReady] = useState(() => typeof window !== 'undefined');

  useEffect(() => {
    const nextUser = getUser() as RecruiterUser | null;

    if (!nextUser) {
      router.push('/login');
      return;
    }

    if (nextUser.role !== 'recruiter') {
      router.push('/candidate/dashboard');
      return;
    }

    setUser(nextUser);
    setForm((current) => ({
      ...current,
      company: current.company || nextUser.companyName || '',
    }));
    setPageReady(true);
  }, [router]);

  const stats = useMemo(() => {
    const words = form.description.trim().split(/\s+/).filter(Boolean).length;
    const hasEnoughContext = words >= 35;
    const totalSignals = requiredSkills.length + techStack.length;

    return {
      words,
      hasEnoughContext,
      totalSignals,
    };
  }, [form.description, requiredSkills.length, techStack.length]);

  const previewTitle = form.title.trim() || 'Senior Product Designer';
  const previewCompany = form.company.trim() || user?.companyName || 'Your company';
  const previewLocation = form.location.trim() || 'Remote / Hybrid';
  const previewSalary = form.salary.trim() || 'Compensation not shared';

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const appendUniqueTag = (
    rawValue: string,
    collection: string[],
    setCollection: (next: string[]) => void,
    resetInput: () => void
  ) => {
    const value = normalizeTag(rawValue);
    if (!value) return;
    if (collection.some((item) => item.toLowerCase() === value.toLowerCase())) {
      resetInput();
      return;
    }
    setCollection([...collection, value]);
    resetInput();
  };

  const onTagKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    value: string,
    collection: string[],
    setCollection: (next: string[]) => void,
    resetInput: () => void
  ) => {
    if (event.key !== 'Enter' && event.key !== ',') return;
    event.preventDefault();
    appendUniqueTag(value, collection, setCollection, resetInput);
  };

  const removeTag = (value: string, collection: string[], setCollection: (next: string[]) => void) => {
    setCollection(collection.filter((item) => item !== value));
  };

  const flushPendingTags = () => {
    let nextSkills = requiredSkills;
    let nextTech = techStack;

    const normalizedSkillInput = normalizeTag(skillInput);
    if (normalizedSkillInput && !requiredSkills.some((item) => item.toLowerCase() === normalizedSkillInput.toLowerCase())) {
      nextSkills = [...requiredSkills, normalizedSkillInput];
      setRequiredSkills(nextSkills);
    }

    const normalizedTechInput = normalizeTag(techInput);
    if (normalizedTechInput && !techStack.some((item) => item.toLowerCase() === normalizedTechInput.toLowerCase())) {
      nextTech = [...techStack, normalizedTechInput];
      setTechStack(nextTech);
    }

    setSkillInput('');
    setTechInput('');

    return { nextSkills, nextTech };
  };

  const resetForm = () => {
    setForm({
      ...INITIAL_FORM,
      company: user?.companyName || '',
    });
    setRequiredSkills([]);
    setTechStack([]);
    setSkillInput('');
    setTechInput('');
  };

  const submitJob = async (intent: 'draft' | 'publish') => {
    if (!user) return;

    const { nextSkills, nextTech } = flushPendingTags();

    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      salary: form.salary.trim(),
      description: form.description.trim(),
      experienceLevel: form.experienceLevel,
      recruiterId: user.id,
      requiredSkills: nextSkills,
      techStack: nextTech,
      intent,
    };

    const legacyFallbackPayload = {
      title: payload.title,
      company: payload.company,
      location: payload.location,
      salary: payload.salary,
      description: payload.description,
      recruiterId: user.id,
      status: intent === 'draft' ? 'pending' : 'approved',
      skills: nextSkills,
      techSkills: nextTech,
      experience: payload.experienceLevel,
    };

    if (!payload.title || !payload.company || !payload.location || !payload.salary || !payload.description) {
      toast({
        type: 'warning',
        title: 'Finish the required fields',
        message: 'Title, company, location, salary, and description are all required before posting.',
      });
      return;
    }

    if (payload.description.split(/\s+/).filter(Boolean).length < 20) {
      toast({
        type: 'warning',
        title: 'Description is too short',
        message: 'Add a bit more detail so candidates and AI matching can understand the role clearly.',
      });
      return;
    }

    setSubmitting(true);

    try {
      try {
        await api.post('/api/jobs', payload);
      } catch (error: unknown) {
        // Compatibility retry for environments still running older backend job payload contracts.
        if (isApiError(error) && error.status >= 500) {
          await api.post('/api/jobs', legacyFallbackPayload);
        } else {
          throw error;
        }
      }
      toast({
        type: 'success',
        title: intent === 'publish' ? 'Job published successfully' : 'Draft saved successfully',
        message: intent === 'publish'
          ? `${payload.title} is now live in your recruiter workspace.`
          : `${payload.title} is saved as draft for later publishing.`,
      });
      resetForm();
      router.push('/recruiter/dashboard');
      router.refresh();
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) {
        clearAuth();
        toast({
          type: 'error',
          title: 'Session expired',
          message: 'Please sign in again to continue posting jobs.',
        });
        router.push('/login');
        return;
      }

      toast({
        type: 'error',
        title: 'Posting failed',
        message: isApiError(error) ? error.message : 'Something went wrong while creating this role.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitJob('publish');
  };

  if (!pageReady || !user) {
    return <div className="r-main"><div className="text-sm text-[var(--t2)]">Loading recruiter workspace...</div></div>;
  }

  return (
    <main className="r-main">
      <section className="r-post-hero">
        <div className="r-post-hero-copy">
          <div className="r-post-eyebrow">Post A Role</div>
          <h1 className="r-post-title">Create a job post that looks sharp and publishes correctly.</h1>
          <p className="r-post-subtitle">
            This version is wired to the real recruiter jobs API, so publishing now creates a live role instead of getting stuck on a loading button.
          </p>

          <div className="r-post-hero-pills">
            <span className="r-post-pill">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Draft or publish with lifecycle controls</span>
            </span>
            <span className="r-post-pill">
              <Wand2 className="h-3.5 w-3.5" />
              <span>AI matching works better with detailed skills</span>
            </span>
          </div>
        </div>

        <div className="r-post-hero-stats">
          <div className="r-post-stat">
            <div className="r-post-stat-label">Description Words</div>
            <div className="r-post-stat-value">{stats.words}</div>
            <div className="r-post-stat-copy">{stats.hasEnoughContext ? 'Healthy detail level' : 'Aim for 35+ words'}</div>
          </div>
          <div className="r-post-stat">
            <div className="r-post-stat-label">Skill Signals</div>
            <div className="r-post-stat-value">{stats.totalSignals}</div>
            <div className="r-post-stat-copy">Soft skills + tech stack combined</div>
          </div>
        </div>
      </section>

      <div className="r-post-layout">
        <form className="r-post-form-card" onSubmit={handleSubmit}>
          <div className="r-post-section">
            <div className="r-post-section-head">
              <div>
                <div className="r-post-section-kicker">Role Basics</div>
                <div className="r-post-section-title">Core job details</div>
              </div>
              <div className="r-post-section-note">Required fields are marked automatically by validation.</div>
            </div>

            <div className="r-post-grid">
              <label className="r-post-field">
                <span>Job title</span>
                <input
                  aria-label="Job title"
                  value={form.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder="Senior Frontend Engineer"
                />
              </label>

              <label className="r-post-field">
                <span>Company</span>
                <input
                  aria-label="Company"
                  value={form.company}
                  onChange={(event) => updateField('company', event.target.value)}
                  placeholder="Acme Labs"
                />
              </label>

              <label className="r-post-field">
                <span>Location</span>
                <input
                  aria-label="Location"
                  value={form.location}
                  onChange={(event) => updateField('location', event.target.value)}
                  placeholder="Bengaluru / Remote"
                />
              </label>

              <label className="r-post-field">
                <span>Salary</span>
                <input
                  aria-label="Salary"
                  value={form.salary}
                  onChange={(event) => updateField('salary', event.target.value)}
                  placeholder="18-24 LPA"
                />
              </label>
            </div>
          </div>

          <div className="r-post-section">
            <div className="r-post-section-head">
              <div>
                <div className="r-post-section-kicker">Hiring Fit</div>
                <div className="r-post-section-title">Seniority and match signals</div>
              </div>
            </div>

            <div className="r-post-grid r-post-grid-tight">
              <label className="r-post-field">
                <span>Experience level</span>
                <select
                  aria-label="Experience level"
                  value={form.experienceLevel}
                  onChange={(event) => updateField('experienceLevel', event.target.value as ExperienceLevel)}
                >
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                </select>
              </label>

              <div className="r-post-helper-card">
                <div className="r-post-helper-title">Level guide</div>
                <p>{EXPERIENCE_COPY[form.experienceLevel]}</p>
              </div>
            </div>

            <div className="r-post-grid">
              <div className="r-post-field">
                <span>Soft skills</span>
                <input
                  aria-label="Soft skills"
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={(event) =>
                    onTagKeyDown(event, skillInput, requiredSkills, setRequiredSkills, () => setSkillInput(''))
                  }
                  placeholder="Communication, stakeholder management, ownership"
                />
                <div className="r-post-field-hint">Press Enter or comma to add each skill.</div>
                <div className="r-post-tags">
                  {requiredSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      className="r-post-tag"
                      onClick={() => removeTag(skill, requiredSkills, setRequiredSkills)}
                    >
                      <span>{skill}</span>
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="r-post-field">
                <span>Tech stack</span>
                <input
                  aria-label="Tech stack"
                  value={techInput}
                  onChange={(event) => setTechInput(event.target.value)}
                  onKeyDown={(event) =>
                    onTagKeyDown(event, techInput, techStack, setTechStack, () => setTechInput(''))
                  }
                  placeholder="React, TypeScript, Node.js, Figma"
                />
                <div className="r-post-field-hint">These are sent directly to the backend match model.</div>
                <div className="r-post-tags">
                  {techStack.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      className="r-post-tag r-post-tag-tech"
                      onClick={() => removeTag(skill, techStack, setTechStack)}
                    >
                      <span>{skill}</span>
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="r-post-section">
            <div className="r-post-section-head">
              <div>
                <div className="r-post-section-kicker">Job Story</div>
                <div className="r-post-section-title">Tell candidates what success looks like</div>
              </div>
              <div className="r-post-section-note">The backend stores this description exactly as written.</div>
            </div>

            <label className="r-post-field">
              <span>Description</span>
              <textarea
                aria-label="Description"
                rows={8}
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Describe the mission, core responsibilities, team context, and what strong candidates should bring in their first 90 days."
              />
              <div className="r-post-field-hint">Candidates respond better when the scope, outcomes, and collaboration model are obvious.</div>
            </label>
          </div>

          <div className="r-post-actions">
            <button type="button" className="r-post-secondary" onClick={resetForm} disabled={submitting}>
              Reset form
            </button>
            <button
              type="button"
              className="r-post-secondary"
              onClick={() => submitJob('draft')}
              disabled={submitting}
            >
              Save draft
            </button>
            <button type="submit" className="r-post-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving role...</span>
                </>
              ) : (
                <>
                  <span>Publish job</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="r-post-sidebar">
          <div className="r-post-preview">
            <div className="r-post-preview-kicker">Live Preview</div>
            <div className="r-post-preview-title">{previewTitle}</div>
            <div className="r-post-preview-company">{previewCompany}</div>

            <div className="r-post-preview-meta">
              <div className="r-post-preview-item">
                <MapPin className="h-4 w-4" />
                <span>{previewLocation}</span>
              </div>
              <div className="r-post-preview-item">
                <CircleDollarSign className="h-4 w-4" />
                <span>{previewSalary}</span>
              </div>
              <div className="r-post-preview-item">
                <BriefcaseBusiness className="h-4 w-4" />
                <span>{form.experienceLevel} level</span>
              </div>
              <div className="r-post-preview-item">
                <FileText className="h-4 w-4" />
                <span>{stats.words || 0} description words</span>
              </div>
            </div>

            <div className="r-post-preview-block">
              <div className="r-post-preview-label">Required skills</div>
              <div className="r-post-tags">
                {(requiredSkills.length ? requiredSkills : ['Communication', 'Ownership']).map((skill) => (
                  <span key={skill} className="r-post-tag static-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="r-post-preview-block">
              <div className="r-post-preview-label">Tech stack</div>
              <div className="r-post-tags">
                {(techStack.length ? techStack : ['React', 'TypeScript']).map((skill) => (
                  <span key={skill} className="r-post-tag r-post-tag-tech static-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="r-post-side-card">
            <div className="r-post-side-title">Posting notes</div>
            <div className="r-post-note-list">
              {HIRING_NOTES.map((note) => (
                <div key={note} className="r-post-note-item">
                  <span className="r-post-note-dot" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
