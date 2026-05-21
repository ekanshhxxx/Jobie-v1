import Link from "next/link";

export default function RecruiterOnboardingPage() {
  return (
    <main className="min-h-screen bg-[var(--bg0)] px-6 py-24 text-[var(--white)]">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
          Recruiter Setup
        </p>
        <h1 className="mt-4 text-4xl font-bold">Set up your hiring workspace</h1>
        <p className="mt-4 max-w-2xl text-[var(--t2)]">
          Create jobs, review candidates, and manage interviews from your
          recruiter dashboard.
        </p>
        <Link
          href="/recruiter/dashboard"
          className="mt-8 inline-flex rounded-lg bg-[var(--brand)] px-5 py-3 font-semibold text-white"
        >
          Open recruiter dashboard
        </Link>
      </div>
    </main>
  );
}
