import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import {
  Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2
} from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/* ── tiny inline Google "G" logo (SVG) ──────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const initialIsLogin = useMemo(() => searchParams.get('mode') !== 'signup', [searchParams]);
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  const navigate = useNavigate();
  const { login, register, googleAuth, loading, error, clearError } = useAuthStore();

  const googleBtnRef = useRef(null);

  /* ── Google Sign-In callback ────────────────────────────── */
  const handleGoogleResponse = useCallback(async (response) => {
    clearError();
    try {
      await googleAuth(response.credential);
      toast.success('Signed in with Google!');
      navigate('/chat');
    } catch (err) {
      toast.error(err.message);
    }
  }, [googleAuth, clearError, navigate]);

  /* ── Initialize Google Identity Services ────────────────── */
  useEffect(() => {
    // Wait for the GIS script to load
    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      // Render the hidden button — we use a custom styled button instead
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          width: googleBtnRef.current.offsetWidth,
          text: isLogin ? 'signin_with' : 'signup_with',
        });
      }
    };

    // If GIS script already loaded
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      // Poll until loaded (script has async defer)
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [handleGoogleResponse, isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password });
      } else {
        await register({
          username: form.username,
          email: form.email,
          password: form.password,
        });
      }
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      navigate('/chat');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
    setForm({ username: '', email: '', password: '' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-cyan-600/5 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-pink-600/3 blur-[100px]" />
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

      <Motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-cyan-600/20 border border-violet-500/20 mb-4"
            animate={{
              boxShadow: [
                '0 0 20px rgba(139,92,246,0.1)',
                '0 0 40px rgba(139,92,246,0.2)',
                '0 0 20px rgba(139,92,246,0.1)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Zap size={28} className="text-violet-400" />
          </Motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Neural<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Forge</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Multi-Agent AI Coding System
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl mb-6">
            {['Login', 'Sign Up'].map((label, i) => (
              <button
                key={label}
                onClick={() => {
                  setIsLogin(i === 0);
                  clearError();
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                  (i === 0) === isLogin
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Google Sign-In Button */}
          <div className="mb-4">
            <div
              ref={googleBtnRef}
              id="google-signin-btn"
              className="w-full flex items-center justify-center [&>div]:!w-full [&_iframe]:!w-full"
              style={{ minHeight: 44 }}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500 font-medium">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <Motion.div
                  key="username"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                    Username
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm placeholder:text-gray-600 outline-none focus:border-violet-500/50 transition-colors"
                      placeholder="Choose a username"
                      required={!isLogin}
                      minLength={3}
                      id="auth-username"
                    />
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm placeholder:text-gray-600 outline-none focus:border-violet-500/50 transition-colors"
                  placeholder="you@example.com"
                  required
                  id="auth-email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm placeholder:text-gray-600 outline-none focus:border-violet-500/50 transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  id="auth-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <Motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg"
              >
                {error}
              </Motion.p>
            )}

            <Motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </Motion.button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-5">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={toggleMode}
              className="text-violet-400 hover:text-violet-300 transition-colors cursor-pointer font-medium"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Agent pipeline preview */}
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-3 mt-8"
        >
          {['🧠 Plan', '⚡ Code', '🔍 Review'].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              {i > 0 && <div className="w-6 h-px bg-white/10" />}
              <span className="text-xs text-gray-600">{step}</span>
            </div>
          ))}
        </Motion.div>
      </Motion.div>
    </div>
  );
};

export default AuthPage;
