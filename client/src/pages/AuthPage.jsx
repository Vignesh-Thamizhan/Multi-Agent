import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import {
  Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2
} from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  const navigate = useNavigate();
  const { login, register, loading, error, clearError } = useAuthStore();

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

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
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
          </motion.div>
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
            {['Login', 'Register'].map((label, i) => (
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
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
                </motion.div>
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
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <motion.button
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
            </motion.button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-5">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={toggleMode}
              className="text-violet-400 hover:text-violet-300 transition-colors cursor-pointer font-medium"
            >
              {isLogin ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Agent pipeline preview */}
        <motion.div
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
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
