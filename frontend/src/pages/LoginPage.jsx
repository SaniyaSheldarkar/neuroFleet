import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Admin',      email: 'admin@neurofleetx.com',    color: '#fbbf24' },
  { label: 'Fleet Mgr', email: 'manager@neurofleetx.com',  color: '#60a5fa' },
  { label: 'Driver',    email: 'driver@neurofleetx.com',   color: '#34d399' },
  { label: 'Customer',  email: 'customer@neurofleetx.com', color: '#a78bfa' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password. Check backend is running on port 8081.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 grid-bg"
      style={{ background: 'var(--bg-dark)' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#0284c7)',
                     boxShadow: '0 0 40px rgba(0,212,255,0.4)' }}>
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">NeuroFleetX</h1>
          <p className="text-slate-400 mt-1 text-sm">AI-Driven Urban Mobility Platform</p>
        </div>

        {/* Card */}
        <div className="nfx-card p-8">
          <h2 className="text-xl font-bold text-white mb-6">Sign In</h2>

          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg text-sm"
              style={{ background: 'rgba(239,68,68,0.1)',
                       border: '1px solid rgba(239,68,68,0.3)',
                       color: '#f87171' }}>
              <AlertCircle size={16} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@neurofleetx.com"
                style={{
                  background: '#0d1117',
                  border: '1px solid rgba(0,212,255,0.2)',
                  color: 'white',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-xs text-slate-400 mb-1.5">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="password123"
                  style={{
                    background: '#0d1117',
                    border: '1px solid rgba(0,212,255,0.2)',
                    color: 'white',
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading
                  ? '#1e3a5f'
                  : 'linear-gradient(135deg,#00d4ff,#0284c7)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(0,212,255,0.3)',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                fontFamily: 'Syne, sans-serif'
              }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-4">
            No account?{' '}
            <Link to="/register"
              style={{ color: '#00d4ff' }}
              className="hover:text-white transition-colors">
              Register
            </Link>
          </p>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 nfx-card p-4">
          <p className="text-xs text-slate-500 mb-3 text-center">
            DEMO ACCOUNTS — click to fill credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map(a => (
              <button
                key={a.email}
                type="button"
                onClick={() => fillDemo(a.email)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: `${a.color}15`,
                  border: `1px solid ${a.color}40`,
                  color: a.color,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontFamily: 'Syne, sans-serif'
                }}>
                <div style={{ fontWeight: '600' }}>{a.label}</div>
                <div style={{ opacity: 0.6, fontSize: '11px' }}>
                  {a.email.split('@')[0]}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}