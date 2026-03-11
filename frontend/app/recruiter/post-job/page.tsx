"use client";

import { useState } from "react";

export default function PostJob() {

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [experience, setExperience] = useState("");
  const [jobType, setJobType] = useState("");
  const [description, setDescription] = useState("");

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [techSkills, setTechSkills] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");

  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);

  const addSkill = (e:any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (skillInput.trim() !== "") {
        setSkills([...skills, skillInput.trim()]);
        setSkillInput("");
      }
    }
  };

  const removeSkill = (skill:string) => {
    setSkills(skills.filter((s)=>s !== skill));
  };

  const addTechSkill = (e:any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (techInput.trim() !== "") {
        setTechSkills([...techSkills, techInput.trim()]);
        setTechInput("");
      }
    }
  };

  const removeTechSkill = (skill:string) => {
    setTechSkills(techSkills.filter((s)=>s !== skill));
  };

  const handleSubmit = async (e:any) => {

    e.preventDefault();

    if (
      !title ||
      !company ||
      !location ||
      !salary ||
      !experience ||
      !jobType ||
      !description
    ) {
      alert("Please fill all required fields.");
      return;
    }

    try {

      setLoading(true);

      // include last typed skill even if Enter wasn't pressed
      const finalSkills = skillInput.trim()
        ? [...skills, skillInput.trim()]
        : skills;

      const finalTechSkills = techInput.trim()
        ? [...techSkills, techInput.trim()]
        : techSkills;

      const jobData = {
        title,
        company,
        location,
        salary,
        experience,
        jobType,
        description,
        recruiterId: 1,
        status,
        skills: finalSkills.join(", "),
        techSkills: finalTechSkills.join(", ")
      };

      await fetch("http://localhost:4000/api/jobs/create",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify(jobData)
      });

      alert("Job posted successfully");

      setTitle("");
      setCompany("");
      setLocation("");
      setSalary("");
      setExperience("");
      setJobType("");
      setDescription("");
      setSkills([]);
      setTechSkills([]);
      setSkillInput("");
      setTechInput("");
      setStatus("active");

    } catch(error){
      console.log(error);
    }

    setLoading(false);
  };

  return (

    <div className="text-[#111827]">

      <h1 className="text-3xl font-bold mb-8">
        Post a New Job
      </h1>

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 max-w-2xl">

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Job Title */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B7280]">Job Title *</label>
            <input
              className="border border-[#E5E7EB] p-3 rounded-lg"
              placeholder="Enter Job Title"
              value={title}
              onChange={(e)=>setTitle(e.target.value)}
            />
          </div>

          {/* Company */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B7280]">Company *</label>
            <input
              className="border border-[#E5E7EB] p-3 rounded-lg"
              placeholder="Enter Company"
              value={company}
              onChange={(e)=>setCompany(e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B7280]">Location *</label>
            <input
              className="border border-[#E5E7EB] p-3 rounded-lg"
              placeholder="Enter Location"
              value={location}
              onChange={(e)=>setLocation(e.target.value)}
            />
          </div>

          {/* Salary */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B7280]">Salary *</label>
            <input
              className="border border-[#E5E7EB] p-3 rounded-lg"
              placeholder="Enter Salary"
              value={salary}
              onChange={(e)=>setSalary(e.target.value)}
            />
          </div>

          {/* Experience */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B7280]">Experience *</label>
            <input
              className="border border-[#E5E7EB] p-3 rounded-lg"
              placeholder="Enter Experience"
              value={experience}
              onChange={(e)=>setExperience(e.target.value)}
            />
          </div>

          {/* Job Type */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B7280]">Job Type *</label>
            <select
              className="border border-[#E5E7EB] p-3 rounded-lg"
              value={jobType}
              onChange={(e)=>setJobType(e.target.value)}
            >
              <option value="">Select Job Type</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Internship">Internship</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          {/* Skills */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B7280]">
              Skills (Soft Skills)
            </label>

            <input
              placeholder="Type skill and press Enter"
              value={skillInput}
              onChange={(e)=>setSkillInput(e.target.value)}
              onKeyDown={addSkill}
              className="border border-[#E5E7EB] p-3 rounded-lg"
            />

            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill,index)=>(
                <div
                  key={index}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={()=>removeSkill(skill)}
                    className="text-red-500"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Skills */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B7280]">
              Tech Skills / Tech Stack
            </label>

            <input
              placeholder="Type tech skill and press Enter"
              value={techInput}
              onChange={(e)=>setTechInput(e.target.value)}
              onKeyDown={addTechSkill}
              className="border border-[#E5E7EB] p-3 rounded-lg"
            />

            <div className="flex flex-wrap gap-2 mt-2">
              {techSkills.map((skill,index)=>(
                <div
                  key={index}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={()=>removeTechSkill(skill)}
                    className="text-red-500"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B7280]">
              Job Description *
            </label>

            <textarea
              className="border border-[#E5E7EB] p-3 rounded-lg"
              rows={5}
              placeholder="Describe the job role..."
              value={description}
              onChange={(e)=>setDescription(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B7280]">
              Job Status
            </label>

            <select
              className="border border-[#E5E7EB] p-3 rounded-lg"
              value={status}
              onChange={(e)=>setStatus(e.target.value)}
            >
              <option value="active">Active (Publish Now)</option>
              <option value="draft">Draft (Save For Later)</option>
            </select>
          </div>

          <button
            disabled={loading}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3 rounded-lg font-medium"
          >
            {loading ? "Posting..." : "Post Job"}
          </button>

        </form>

      </div>

    </div>
  );
}