import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Code2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const passwordRules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
];

const RegisterPage = () => {
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setError('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }
    const failing = passwordRules.filter((r) => !r.test(form.password));
    if (failing.length) {
      setError(failing.map((r) => r.label).join(', ') + ' required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await register(form);
      // DEV: If user is returned directly (auto-verified), log them in
      if (data?.data?.role) {
        // Already logged in (dev skip mode) — login to set context
        const user = await login({ email: form.email, password: form.password });
        toast.success(`Welcome, ${user.fullName ? user.fullName.split(' ')[0] : 'User'}!`);
        const roleMap = { admin: '/admin', teacher: '/teacher', student: '/student' };
        navigate(roleMap[user.role] || '/student', { replace: true });
      } else {
        // Email verification required
        setSuccess(data?.message || 'Account created! Check your email to verify.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-zinc-400 text-sm mb-6">{success}</p>
          <Link to="/login" className="btn-primary w-full justify-center">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Code2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">College</h1>
            <p className="text-xs text-violet-400 font-medium">Coding Platform</p>
          </div>
        </div>

        <div className="card border-zinc-800/80 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Create account</h2>
            <p className="text-zinc-400 text-sm mt-1">Your email must be pre-authorized by the admin</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 animate-fade-in">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="reg-name" className="label">Full name</label>
              <input
                id="reg-name"
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Aarav Sharma"
                className="input"
                autoComplete="name"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="reg-email" className="label">Email address <span className="text-red-400">*</span></label>
              <input
                id="reg-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@college.edu"
                className="input"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="reg-password" className="label">Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input pr-10"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength hints */}
              {form.password && (
                <div className="flex flex-col gap-1 mt-2">
                  {passwordRules.map((rule) => {
                    const pass = rule.test(form.password);
                    return (
                      <div key={rule.label} className={`flex items-center gap-2 text-xs transition-colors ${pass ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${pass ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                        {rule.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-primary btn-lg mt-2 w-full"
            >
              {loading ? (
                <><div className="spinner w-4 h-4" /> Creating account...</>
              ) : (
                <><UserPlus size={16} /> Create account</>
              )}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-zinc-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
