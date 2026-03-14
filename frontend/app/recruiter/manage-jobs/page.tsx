"use client";

import { useEffect, useState } from "react";
import Header from "../../../components/Header";
import { currentUser } from "@/lib/user";

export default function ManageJobs() {

  const [jobs, setJobs] = useState<any[]>([]);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {

      setLoading(true);

      const res = await fetch(
  `http://localhost:4000/api/jobs/recruiter?recruiterId=${currentUser.id}`
);

      const data = await res.json();

      setJobs(data);

      setLoading(false);

    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const confirmDelete = (id:number) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      deleteJob(id);
    }
  };

  const deleteJob = async (id:number) => {
    try {

      await fetch(`http://localhost:4000/api/jobs/${id}`, {
        method:"DELETE",
      });

      alert("Job deleted successfully");

      fetchJobs();

    } catch (error) {
      console.log(error);
    }
  };

  const editJob = (job:any) => {
    setEditingJob(job);
  };

  const updateJob = async () => {
    try {

      await fetch(`http://localhost:4000/api/jobs/${editingJob.id}`, {
        method:"PUT",
        headers:{
          "Content-Type":"application/json",
        },
        body:JSON.stringify(editingJob),
      });

      alert("Job updated successfully");

      setEditingJob(null);

      fetchJobs();

    } catch (error) {
      console.log(error);
    }
  };

  const changeStatus = async (id:number,status:string) => {
    try {

      await fetch(`http://localhost:4000/api/jobs/${id}`, {
        method:"PUT",
        headers:{
          "Content-Type":"application/json",
        },
        body:JSON.stringify({ status }),
      });

      fetchJobs();

    } catch (error) {
      console.log(error);
    }
  };

  const getStatusBadge = (status:string) => {

    if (status === "active") {
      return (
        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
          Active
        </span>
      );
    }

    if (status === "draft") {
      return (
        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
          Draft
        </span>
      );
    }

    if (status === "closed") {
      return (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
          Closed
        </span>
      );
    }
  };

  const getTimeAgo = (date:string) => {

    const now = new Date();
    const posted = new Date(date);

    const diff = Math.floor(
      (now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff === 0) return "today";
    if (diff === 1) return "1 day ago";
    return `${diff} days ago`;
  };

  const filteredJobs = jobs.filter((job) =>
    job.title?.toLowerCase().includes(search.toLowerCase()) ||
    job.company?.toLowerCase().includes(search.toLowerCase()) ||
    job.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (

    <div className="text-[#111827]">

      <Header search={search} setSearch={setSearch} />

      <h1 className="text-3xl font-bold mb-8">
        Manage Jobs
      </h1>

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 overflow-x-auto">

        <table className="w-full">

          <thead className="bg-[#F8FAFC] text-[#6B7280] border-b border-[#E5E7EB]">

            <tr>
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Company</th>
              <th className="p-4 text-left">Tech Skills</th>
              <th className="p-4 text-left">Skills</th>
              <th className="p-4 text-left">Salary</th>
              <th className="p-4 text-left">Experience</th>
              <th className="p-4 text-left">Job Type</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td colSpan={9} className="text-center py-6 text-[#6B7280]">
                  Loading jobs...
                </td>
              </tr>

            ) : filteredJobs.length === 0 ? (

              <tr>
                <td colSpan={9} className="text-center py-6 text-[#6B7280]">
                  No jobs found
                </td>
              </tr>

            ) : (

              filteredJobs.map((job) => {

                const techSkills = job.techSkills
                  ? job.techSkills.split(",").map((s:string)=>s.trim()).filter(Boolean)
                  : [];

                const skills = job.skills
                  ? job.skills.split(",").map((s:string)=>s.trim()).filter(Boolean)
                  : [];

                return (

                  <tr
                    key={job.id}
                    className="border-b border-[#E5E7EB] hover:bg-[#F8FAFC]"
                  >

                    <td className="p-4">
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Posted {getTimeAgo(job.createdAt)}
                      </div>
                    </td>

                    <td className="p-4">{job.company}</td>

                    {/* TECH SKILLS */}

                    <td className="p-4 text-sm">

                      {techSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {techSkills.map((skill:string,index:number)=>(
                            <span
                              key={index}
                              className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : "-"}

                    </td>

                    {/* SKILLS */}

                    <td className="p-4 text-sm">

                      {skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {skills.map((skill:string,index:number)=>(
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : "-"}

                    </td>

                    <td className="p-4">{job.salary || "-"}</td>

                    <td className="p-4">{job.experience || "-"}</td>

                    <td className="p-4">{job.jobType || "-"}</td>

                    <td className="p-4">{getStatusBadge(job.status)}</td>

                    <td className="p-4">

                      <div className="flex items-center justify-center gap-2">

                        <button
                          onClick={() => editJob(job)}
                          className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                        >
                          Edit
                        </button>

                        {job.status === "active" && (
                          <button
                            onClick={() => changeStatus(job.id,"closed")}
                            className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded"
                          >
                            Close
                          </button>
                        )}

                        {job.status === "draft" && (
                          <button
                            onClick={() => changeStatus(job.id,"active")}
                            className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded"
                          >
                            Publish
                          </button>
                        )}

                        {job.status === "closed" && (
                          <button
                            onClick={() => changeStatus(job.id,"active")}
                            className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded"
                          >
                            Reopen
                          </button>
                        )}

                        <button
                          onClick={() => confirmDelete(job.id)}
                          className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                )

              })

            )}

          </tbody>

        </table>

      </div>

      {/* EDIT FORM */}

      {editingJob && (

        <div className="mt-10 bg-white border border-[#E5E7EB] p-6 rounded-xl max-w-xl">

          <h2 className="text-xl font-semibold mb-4">
            Edit Job
          </h2>

          <div className="flex flex-col gap-4">

            <input
              className="border p-3 rounded-lg"
              value={editingJob.title}
              onChange={(e)=>
                setEditingJob({ ...editingJob, title:e.target.value })
              }
            />

            <input
              className="border p-3 rounded-lg"
              value={editingJob.company}
              onChange={(e)=>
                setEditingJob({ ...editingJob, company:e.target.value })
              }
            />

            <input
              className="border p-3 rounded-lg"
              value={editingJob.techSkills || ""}
              placeholder="Tech Skills (comma separated)"
              onChange={(e)=>
                setEditingJob({ ...editingJob, techSkills:e.target.value })
              }
            />

            <input
              className="border p-3 rounded-lg"
              value={editingJob.skills || ""}
              placeholder="Skills (comma separated)"
              onChange={(e)=>
                setEditingJob({ ...editingJob, skills:e.target.value })
              }
            />

            <button
              onClick={updateJob}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg w-fit"
            >
              Update Job
            </button>

          </div>

        </div>

      )}

    </div>
  );
}