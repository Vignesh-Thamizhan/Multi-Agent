import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles, Zap } from 'lucide-react';

const Feature = ({ title, desc }) => (
  <div
    className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-300 ease-out cursor-pointer hover:-translate-y-0.5 hover:bg-white/[0.05] hover:border-white/15 hover:shadow-[0_20px_60px_rgba(0,0,0,0.55)] focus-within:-translate-y-0.5 focus-within:bg-white/[0.05] focus-within:border-white/15 focus-within:shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
  >
    {/* Subtle glow ring on hover/focus */}
    <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
      <div className="absolute inset-0 rounded-2xl ring-1 ring-violet-500/12" />
      <div className="absolute -inset-10 rounded-3xl bg-gradient-to-r from-violet-500/6 via-transparent to-cyan-500/6 blur-2xl" />
    </div>

    <div className="relative flex items-start gap-3">
      <div className="mt-0.5 w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-white/8 group-hover:border-white/15 group-focus-within:bg-white/8 group-focus-within:border-white/15">
        <CheckCircle2 size={16} className="text-emerald-400" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const features = useMemo(() => ([
    {
      title: 'Plan → Code → Review, automatically',
      desc: 'A multi-agent workflow that designs the solution, implements it, then checks it for quality.',
    },
    {
      title: 'Live, real-time pipeline updates',
      desc: 'Watch agents stream progress as your request moves through the pipeline.',
    },
    {
      title: 'Markdown + code rendering built in',
      desc: 'Readable outputs with code blocks, tables, and copy-to-clipboard.',
    },
  ]), []);

  return (
    <div className="min-h-dvh bg-[#0a0a14] text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[700px] h-[700px] rounded-full bg-violet-600/5 blur-[140px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-cyan-600/5 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-pink-600/3 blur-[120px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10">
        {/* Nav */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              Neural<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Forge</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/auth?mode=login"
              className="px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            >
              Sign in
            </Link>
            <Link
              to="/auth?mode=register"
              className="px-3 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            >
              Create account
            </Link>
          </div>
        </header>

        {/* Hero */}
        <main className="px-4 sm:px-6 pt-10 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="min-w-0">
                <Motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs text-gray-300"
                >
                  <Sparkles size={14} className="text-violet-400" />
                  Multi-agent AI coding workspace
                </Motion.div>

                <Motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.05, ease: 'easeOut' }}
                  className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight leading-tight"
                >
                  Build faster with a pipeline that{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                    plans, codes, and reviews
                  </span>
                  .
                </Motion.h1>

                <Motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
                  className="mt-4 text-sm sm:text-base text-gray-400 max-w-xl leading-relaxed"
                >
                  Describe what you want. NeuralForge orchestrates specialized agents to design the approach,
                  implement the change, and verify quality—streaming progress as it goes.
                </Motion.p>

                <Motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
                  className="mt-7 flex flex-col sm:flex-row gap-3"
                >
                  <Link
                    to="/auth?mode=register"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  >
                    Get started
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/auth?mode=login"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  >
                    Sign in
                  </Link>
                </Motion.div>

                <div className="mt-8 flex flex-wrap items-center gap-2 text-xs">
                  {[
                    { label: 'Planner', icon: '🧠' },
                    { label: 'Coder', icon: '⚡' },
                    { label: 'Reviewer', icon: '🔍' },
                    { label: 'File upload', icon: '📎' },
                    { label: 'Realtime', icon: '🛰️' },
                  ].map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] hover:border-white/15 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                    >
                      <span className="text-sm">{b.icon}</span>
                      <span className="font-medium">{b.label}</span>
                      <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-white/10 group-hover:bg-violet-400/60 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Showcase */}
              <Motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                className="relative"
              >
                <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-2xl">
                  {/* Subtle inner glow (static) */}
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
                    <div className="absolute -inset-16 bg-gradient-to-r from-violet-500/8 via-transparent to-cyan-500/8 blur-3xl opacity-60" />
                  </div>
                  <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500/70" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500/70" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
                    </div>
                    <span className="text-xs text-gray-500">Pipeline preview</span>
                  </div>
                  <div className="relative p-5 space-y-3">
                    {[
                      { label: 'Planner', color: 'from-violet-500 to-indigo-400', text: 'Designing the approach and tasks…' },
                      { label: 'Coder', color: 'from-cyan-500 to-blue-400', text: 'Implementing changes and wiring routes…' },
                      { label: 'Reviewer', color: 'from-emerald-500 to-lime-400', text: 'Checking edge cases and polish…' },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-start gap-3 p-3 rounded-2xl bg-black/25 border border-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      >
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${row.color} flex items-center justify-center text-xs font-bold`}>
                          {row.label.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{row.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                              streaming
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{row.text}</p>
                          <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            {/* Static (no shimmer) so it doesn't look like refreshing */}
                            <div className="h-full w-2/3 bg-gradient-to-r from-violet-500/50 to-cyan-500/50" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Motion.div>
            </div>

            {/* Features */}
            <div className="mt-12 grid md:grid-cols-3 gap-4">
              {features.map((f) => (
                <Feature key={f.title} title={f.title} desc={f.desc} />
              ))}
            </div>

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-white/5 text-xs text-gray-600 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} NeuralForge</span>
              <span className="text-gray-600">Built with Vite + React</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;

