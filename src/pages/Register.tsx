import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import logoV1 from '/logo-v1.png';

export default function Register() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [coupleCode, setCoupleCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const code = await register(email, name, password, coupleCode || undefined);
      if (!coupleCode) {
        setSuccess(`Your couple code is: ${code}. Share this with your partner!`);
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        navigate('/dashboard');
      }
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
          <p className="text-muted mt-2">Start syncing your lives</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-card shadow-card p-6 space-y-5">
          <h2 className="text-2xl font-semibold text-charcoal text-center">Create account</h2>

          {error && <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm">{error}</div>}

          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm font-medium text-center">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-input focus:ring-2 focus:ring-rose/40 focus:border-rose outline-none transition"
              placeholder="Your name"
              required
            />
          </div>

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
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Couple Code <span className="text-muted font-normal">(optional — to join partner)</span>
            </label>
            <input
              type="text"
              value={coupleCode}
              onChange={(e) => setCoupleCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-gray-200 rounded-input focus:ring-2 focus:ring-rose/40 focus:border-rose outline-none transition uppercase tracking-wider"
              placeholder="ABC123"
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full py-3 bg-rose text-white font-semibold rounded-button hover:opacity-90 transition disabled:opacity-50 min-h-[44px]"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-rose hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}