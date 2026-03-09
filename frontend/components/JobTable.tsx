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
            <th className="text-left pb-4">Status</th>
            <th className="text-left pb-4">Posted</th>
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

                {/* Title */}

                <td className="py-4 font-medium">
                  {job.title}
                </td>

                {/* Company */}

                <td>
                  {job.company}
                </td>

                {/* Location */}

                <td>
                  {job.location}
                </td>

                {/* Status */}

                <td>
                  {getStatusBadge(job.status)}
                </td>

                {/* Posted Date */}

                <td className="text-[#6B7280] text-sm">
                  {new Date(job.createdAt).toLocaleDateString()}
                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>
  );
}