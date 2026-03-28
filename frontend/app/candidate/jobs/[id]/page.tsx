"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, getUser, isApiError } from "../../../lib/api";
import { useToast } from "../../../components/ToastProvider";

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params?.id as string;
  const user = getUser();

  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const data = await api.get(`/api/jobs/${id}`);
      setJob(data);
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
    }
  };

  const applyToJob = async () => {
    if (!user?.id) {
      toast({
        type: "warning",
        title: "Sign in required",
        message: "Please sign in to apply for jobs.",
      });
      router.push("/login");
      return;
    }

    try {
      setApplying(true);
      await api.post("/api/applications", { jobId: Number(id) });
      toast({
        type: "success",
        title: "Application submitted!",
        message: `You've successfully applied for ${job?.title}.`,
      });
    } catch (error) {
      console.error(error);
      if (isApiError(error)) {
        toast({
          type: "error",
          title: "Application failed",
          message: error.message,
        });
      } else {
        toast({
          type: "error",
          title: "Application failed",
          message: "Something went wrong. Please try again.",
        });
      }
    } finally {
      setApplying(false);
    }
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 p-10 flex items-center justify-center">
        <div className="text-center text-gray-500">
          {loading ? "Loading job details..." : "Job not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
          <p className="text-gray-600 mt-2">{job.company} {job.location && `• ${job.location}`}</p>

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
            <button
              onClick={applyToJob}
              disabled={applying}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {applying ? "Submitting..." : "Apply Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
