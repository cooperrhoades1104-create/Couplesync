import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import logoV1 from '/logo-v1.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoV1} alt="CoupleSync" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="gradient-heading text-4xl font-bold">CoupleSync</h1>
          <p className="text-muted mt-2">Stay in sync, together</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-card shadow-card p-6 space-y-5">
          <h2 className="text-2xl font-semibold text-charcoal text-center">Welcome back</h2>

          {error && (
            <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-input focus:ring-2 focus:ring-rose/40 focus:border-rose outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-input focus:ring-2 focus:ring-rose/40 focus:border-rose outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-rose text-white font-semibold rounded-button hover:opacity-90 transition disabled:opacity-50 min-h-[44px]"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-rose hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}