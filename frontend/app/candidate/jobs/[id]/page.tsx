"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, getUser, isApiError, uploadFile } from "../../../lib/api";
import { useToast } from "../../../components/ToastProvider";

interface AtsCheck {
  matchScore: number;
  summary: string;
  matchedKeywords?: string[];
  missingKeywords?: string[];
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params?.id as string;
  const user = getUser();

  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [atsCheck, setAtsCheck] = useState<AtsCheck | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumeOption, setResumeOption] = useState<"profile" | "custom">("profile");
  const [customResume, setCustomResume] = useState<File | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchJob();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/jobs/${id}`);
      setJob(data);

      // If logged in as candidate, fetch the latest ATS check for this job
      if (user?.id && user.role === 'candidate') {
        fetchAtsScore(user.id, Number(id));
      }
    } catch (error) {
      console.error(error);
      if (isApiError(error)) {
        toast({
          type: "error",
          title: "Failed to load job",
          message: error.message,
        });
      }
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAtsScore = async (userId: number, jobId: number) => {
    setAtsLoading(true);
    try {
      const res = await api.get(`/api/ats/latest/${jobId}/${userId}`);
      if (res?.check?.matchScore != null) {
        setAtsCheck(res.check);
      }
    } catch {
      // ATS check not available yet — that's fine
    } finally {
      setAtsLoading(false);
    }
  };

  const handleRunAts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setAtsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // Parse resume PDF
      const parseRes = await uploadFile("/api/uploads/parse-jd", formData);
      const resumeText = parseRes.text;
      
      // Run evaluation
      await api.post(`/api/ats/evaluate/${id}/${user.id}`, { text: resumeText });
      
      // Fetch latest score
      await fetchAtsScore(user.id, Number(id));
      toast({ type: "success", title: "ATS Scan Complete", message: "Your resume has been analyzed." });
    } catch (error: any) {
      toast({ type: "error", title: "Scan Failed", message: error.message || "Failed to analyze resume." });
      setAtsLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (!user?.id) {
      toast({
        type: "warning",
        title: "Sign in required",
        message: "Please sign in to apply for jobs.",
      });
      router.push("/login");
      return;
    }
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    try {
      setApplying(true);

      let finalAtsMatchScore = atsCheck?.matchScore;
      let finalResumeUrl = null;

      if (resumeOption === "custom" && customResume) {
        const formData = new FormData();
        formData.append("resume", customResume);
        
        const uploadRes = await uploadFile("/api/uploads/application-resume", formData);
        finalResumeUrl = uploadRes.url;
        
        if (uploadRes.text) {
          const evaluateRes = await api.post(`/api/ats/evaluate/${id}/${user.id}`, { text: uploadRes.text });
          if (evaluateRes?.check?.matchScore != null) {
            finalAtsMatchScore = evaluateRes.check.matchScore;
          }
        }
      }

      await api.post("/api/applications/apply", { 
        userId: user!.id, 
        jobId: Number(id),
        resumeUrl: finalResumeUrl,
        atsMatchScore: finalAtsMatchScore
      });

      setApplied(true);
      setShowApplyModal(false);
      toast({
        type: "success",
        title: "Application submitted!",
        message: `You've successfully applied for ${job?.title}.`,
      });
    } catch (error) {
      console.error(error);
      if (isApiError(error)) {
        toast({ type: "error", title: "Application failed", message: error.message });
      } else {
        toast({ type: "error", title: "Application failed", message: "Something went wrong. Please try again." });
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-10 flex items-center justify-center">
        <div className="text-center text-gray-500">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 p-10 flex items-center justify-center">
        <div className="text-center text-gray-500">Job not found</div>
      </div>
    );
  }

  const scoreColor = atsCheck
    ? atsCheck.matchScore >= 75
      ? 'text-emerald-600 border-emerald-300 bg-emerald-50'
      : atsCheck.matchScore >= 50
      ? 'text-amber-600 border-amber-300 bg-amber-50'
      : 'text-red-500 border-red-300 bg-red-50'
    : 'text-gray-400 border-gray-200 bg-gray-50';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-8">
          {/* Header row with ATS score badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600 mt-2">{job.company} {job.location && `• ${job.location}`}</p>
            </div>

            {/* ATS Match Score */}
            {user?.role === 'candidate' && (
              <div className={`flex flex-col items-center rounded-2xl border-2 px-5 py-3 shrink-0 ${scoreColor}`}>
                {atsLoading ? (
                  <div className="w-12 h-6 bg-gray-100 rounded animate-pulse" />
                ) : atsCheck ? (
                  <>
                    <span className="text-3xl font-bold leading-none">{atsCheck.matchScore}%</span>
                    <span className="text-xs font-semibold uppercase tracking-wider mt-1 opacity-80">ATS Score</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold leading-none text-gray-300">—</span>
                    <label className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1">
                      Upload Resume
                      <input type="file" accept=".pdf" className="hidden" onChange={handleRunAts} />
                    </label>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ATS summary (if available) */}
          {atsCheck?.summary && (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 leading-relaxed">
              <span className="font-semibold">ATS Analysis: </span>
              {atsCheck.summary}
            </div>
          )}

          {/* ATS keyword chips (if available) */}
          {(atsCheck?.matchedKeywords?.length || atsCheck?.missingKeywords?.length) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {atsCheck.matchedKeywords?.slice(0, 5).map((kw) => (
                <span key={kw} className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">✓ {kw}</span>
              ))}
              {atsCheck.missingKeywords?.slice(0, 5).map((kw) => (
                <span key={kw} className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-medium">✗ {kw}</span>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {job.salary && (
              <div>
                <p className="text-sm text-gray-500">Salary</p>
                <p className="font-medium text-gray-900">{job.salary}</p>
              </div>
            )}
            {job.experienceLevel && (
              <div>
                <p className="text-sm text-gray-500">Experience</p>
                <p className="font-medium text-gray-900 capitalize">{job.experienceLevel}</p>
              </div>
            )}
            {job.applicantCount !== undefined && (
              <div>
                <p className="text-sm text-gray-500">Applicants</p>
                <p className="font-medium text-gray-900">{job.applicantCount}</p>
              </div>
            )}
          </div>

          {job.techStack && job.techStack.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {job.techStack.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About the Role</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </p>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back
            </button>
            {applied ? (
              <button
                disabled
                className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg opacity-90 cursor-default"
              >
                ✓ Applied
              </button>
            ) : (
              <button
                onClick={handleApplyClick}
                disabled={applying}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {applying ? "Submitting..." : "Apply Now"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Apply for {job.title}</h2>
              <p className="text-sm text-gray-500 mt-1">Choose which resume to submit for this application.</p>
            </div>
            
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <label className={`block p-4 border rounded-lg cursor-pointer transition-colors ${resumeOption === "profile" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"}`}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="resumeOption" 
                    value="profile" 
                    checked={resumeOption === "profile"} 
                    onChange={() => setResumeOption("profile")}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Use Profile Resume</p>
                    <p className="text-xs text-gray-500 mt-0.5">Submit the resume currently attached to your main profile.</p>
                  </div>
                </div>
              </label>

              <label className={`block p-4 border rounded-lg cursor-pointer transition-colors ${resumeOption === "custom" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"}`}>
                <div className="flex items-start gap-3">
                  <input 
                    type="radio" 
                    name="resumeOption" 
                    value="custom" 
                    checked={resumeOption === "custom"} 
                    onChange={() => setResumeOption("custom")}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Upload Custom Resume</p>
                    <p className="text-xs text-gray-500 mt-0.5 mb-2">Upload a specific resume tailored just for this job.</p>
                    {resumeOption === "custom" && (
                      <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={(e) => setCustomResume(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    )}
                  </div>
                </div>
              </label>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={applying}
              >
                Cancel
              </button>
              <button
                onClick={submitApplication}
                disabled={applying || (resumeOption === "custom" && !customResume)}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {applying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
