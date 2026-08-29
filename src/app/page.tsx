export default function Home() {
  return (
    <main className="container-content">
      <div className="space-y-8">
        <section className="text-center">
          <h1 className="text-4xl font-bold text-primary md:text-5xl">
            UAE Malayalees
          </h1>
          <p className="mt-2 text-lg text-text-secondary">
            Connect with Malayalee individuals and businesses across UAE
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <a
            href="/auth/login"
            className="btn-primary w-full text-center py-3"
          >
            Sign In
          </a>
          <a
            href="/browse"
            className="btn-secondary w-full text-center py-3"
          >
            Browse Profiles
          </a>
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold">Get Started</h2>
          <p className="mt-2 text-text-secondary">
            Create your profile or business page to connect with the
            Malayalee community in UAE.
          </p>
        </section>
      </div>
    </main>
  );
}
