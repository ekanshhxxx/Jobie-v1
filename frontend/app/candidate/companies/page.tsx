import Link from "next/link";

export default function CandidateCompaniesPage() {
  return (
    <main className="min-h-screen bg-[var(--bg0)] px-6 py-24 text-[var(--white)]">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
          Companies
        </p>
        <h1 className="mt-4 text-4xl font-bold">Discover hiring teams</h1>
        <p className="mt-4 max-w-2xl text-[var(--t2)]">
          Browse companies, review open roles, and keep exploring matched
          opportunities from your candidate dashboard.
        </p>
        <Link
          href="/jobs"
          className="mt-8 inline-flex rounded-lg bg-[var(--brand)] px-5 py-3 font-semibold text-white"
        >
          View open jobs
        </Link>
      </div>
    </main>
  );
}
