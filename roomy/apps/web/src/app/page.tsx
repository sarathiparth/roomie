import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background to-surface">
      <div className="fixed top-0 w-full h-1/2 bg-[radial-gradient(ellipse_at_top,var(--primary-dark)_0%,transparent_50%)] opacity-20 pointer-events-none" />
      
      <div className="max-w-md w-full text-center space-y-10 z-10">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-2xl shadow-primary/30 text-white font-bold text-4xl transform -rotate-6">
            R
          </div>
          <h1 className="text-5xl font-black tracking-tighter">
            Roomy.
          </h1>
          <p className="text-xl text-text-muted font-light leading-relaxed px-4">
            Data-driven matching for people who want more than just a place to sleep.
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <Link
            href="/auth/signup"
            className="flex items-center justify-center w-full py-4 bg-primary hover:bg-primary-dark text-black font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Create Account
          </Link>
          <Link
            href="/auth/login"
            className="flex items-center justify-center w-full py-4 bg-surface text-text font-medium rounded-2xl glass hover:bg-white/10 transition-all border border-text/10"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
