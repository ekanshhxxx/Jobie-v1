
"use client";

type Props = {
  jobs: any[];
};

export default function JobTable({ jobs }: Props) {

  const getStatusBadge = (status: string) => {

    if (status === "active") {
      return (
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
          Active
        </span>
      );
    }

    if (status === "draft") {
      return (
        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
          Draft
        </span>
      );
    }

    if (status === "closed") {
      return (
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
          Closed
        </span>
      );
    }

    return null;
  };

  // Calculate "Posted X days ago"

  const getPostedTime = (date: string) => {

    const created = new Date(date);
    const today = new Date();

    const diffTime = today.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Posted today";
    if (diffDays === 1) return "Posted 1 day ago";

    return `Posted ${diffDays} days ago`;
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">

      <h2 className="text-lg font-semibold text-[#111827] mb-6">
        Recent Job Postings
      </h2>

      <table className="w-full">

        <thead className="text-[#6B7280] border-b border-[#E5E7EB]">

          <tr>
            <th className="text-left pb-4">Job Title</th>
            <th className="text-left pb-4">Company</th>
            <th className="text-left pb-4">Location</th>
            <th className="text-left pb-4">Applications</th>
            <th className="text-left pb-4">Status</th>
          </tr>

        </thead>

        <tbody className="text-[#111827]">

          {jobs.length === 0 ? (

            <tr>
              <td colSpan={5} className="py-8 text-center text-[#6B7280]">
                No jobs found
              </td>
            </tr>

          ) : (

            jobs.map((job) => (

              <tr
                key={job.id}
                className="border-b border-[#E5E7EB] hover:bg-[#F8FAFC] transition"
              >

                {/* Job Title + Posted time */}

                <td className="py-4 font-medium">
                  <div>{job.title}</div>
                  <div className="text-sm text-[#6B7280]">
                    {getPostedTime(job.createdAt)}
                  </div>
                </td>

                {/* Company */}

                <td>
                  {job.company}
                </td>

                {/* Location */}

                <td>
                  {job.location}
                </td>

                {/* Applications Count */}

                <td>
                  {job.applicationsCount || 0}
                </td>

                {/* Status */}

                <td>
                  {getStatusBadge(job.status)}
                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>
  );
}
