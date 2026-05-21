import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[var(--bg0)] px-6 py-24 text-[var(--white)]">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
          Profile
        </p>
        <h1 className="mt-4 text-4xl font-bold">Your Jobie profile</h1>
        <p className="mt-4 max-w-2xl text-[var(--t2)]">
          Manage your profile details and keep your hiring signal up to date.
        </p>
        <Link
          href="/profile/edit"
          className="mt-8 inline-flex rounded-lg bg-[var(--brand)] px-5 py-3 font-semibold text-white"
        >
          Edit profile
        </Link>
      </div>
    </main>
  );
}
