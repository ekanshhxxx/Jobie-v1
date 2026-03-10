"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function JobDetails() {

  const params = useParams();
  const id = params.id;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJob();
  }, []);

  const fetchJob = async () => {

    try {

      const res = await fetch(
        `http://localhost:4000/api/jobs/${id}`
      );

      const data = await res.json();

      setJob(data);

      setLoading(false);

    } catch (error) {
      console.log(error);
      setLoading(false);
    }

  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">
        Loading job details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20 text-gray-500">
        Job not found
      </div>
    );
  }

  return (

    <div className="max-w-4xl mx-auto p-6">

      {/* Title */}

      <h1 className="text-3xl font-bold mb-2">
        {job.title}
      </h1>

      <p className="text-gray-600 mb-6">
        {job.company} • {job.location}
      </p>

      {/* Job Info */}

      <div className="grid grid-cols-2 gap-6 mb-8">

        <div>
          <p className="text-gray-500 text-sm">Salary</p>
          <p className="font-medium">{job.salary}</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Experience</p>
          <p className="font-medium">{job.experience}</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Job Type</p>
          <p className="font-medium">{job.jobType}</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Status</p>
          <p className="font-medium capitalize">{job.status}</p>
        </div>

      </div>

      {/* Tech Skills */}

      <div className="mb-8">

        <h2 className="text-xl font-semibold mb-2">
          Tech Skills
        </h2>

        {job.techSkills
          ? job.techSkills.split(",").map((skill: string, index: number) => (
              <div key={index}>{skill.trim()}</div>
            ))
          : "-"
        }

      </div>

      {/* Skills */}

      <div className="mb-8">

        <h2 className="text-xl font-semibold mb-2">
          Skills
        </h2>

        {job.skills
          ? job.skills.split(",").map((skill: string, index: number) => (
              <div key={index}>{skill.trim()}</div>
            ))
          : "-"
        }

      </div>

      {/* Description */}

      <div>

        <h2 className="text-xl font-semibold mb-2">
          Job Description
        </h2>

        <p className="text-gray-700 leading-relaxed">
          {job.description}
        </p>

      </div>

    </div>

  );
}