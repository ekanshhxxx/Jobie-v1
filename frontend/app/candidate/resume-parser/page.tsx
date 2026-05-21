import Link from "next/link";

export default function CandidateResumeParserPage() {
  return (
    <main className="min-h-screen bg-[var(--bg0)] px-6 py-24 text-[var(--white)]">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
          Resume Parser
        </p>
        <h1 className="mt-4 text-4xl font-bold">Prepare your resume</h1>
        <p className="mt-4 max-w-2xl text-[var(--t2)]">
          Upload and improve your resume from the candidate dashboard, then use
          Jobie matches to find roles that fit your profile.
        </p>
        <Link
          href="/candidate/dashboard"
          className="mt-8 inline-flex rounded-lg bg-[var(--brand)] px-5 py-3 font-semibold text-white"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
