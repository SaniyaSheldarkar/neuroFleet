import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', role:'CUSTOMER' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const input = (field) => ({
    value: form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value })),
    className: "w-full px-4 py-2.5 rounded-lg text-sm outline-none",
    style: { background:'#0d1117', border:'1px solid rgba(0,212,255,0.2)', color:'white' },
    onFocus: e => e.target.style.borderColor = '#00d4ff',
    onBlur:  e => e.target.style.borderColor = 'rgba(0,212,255,0.2)',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 grid-bg" style={{ background:'var(--bg-dark)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
            style={{ background:'linear-gradient(135deg,#00d4ff,#0284c7)', boxShadow:'0 0 30px rgba(0,212,255,0.3)' }}>
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join NeuroFleetX</p>
        </div>

        <div className="nfx-card p-8">
          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg text-sm"
              style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171' }}>
              <AlertCircle size={16}/>{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg text-sm"
              style={{ background:'rgba(0,255,136,0.1)', border:'1px solid rgba(0,255,136,0.3)', color:'#00ff88' }}>
              <CheckCircle size={16}/>Registered! Redirecting…
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[['Full Name','name','text','John Doe'],['Email','email','email','john@example.com'],
              ['Password','password','password','••••••••'],['Phone','phone','tel','+91 99990 00001']].map(([label,field,type,ph]) => (
              <div key={field}>
                <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
                <input type={type} required={field!=='phone'} placeholder={ph} {...input(field)} />
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Role</label>
              <select {...input('role')} style={{ background:'#0d1117', border:'1px solid rgba(0,212,255,0.2)', color:'white', borderRadius:'8px', padding:'10px 16px', width:'100%', fontSize:'14px' }}>
                {['CUSTOMER','DRIVER','FLEET_MANAGER','ADMIN'].map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm text-white transition-all"
              style={{ background: loading ? '#1e3a5f':'linear-gradient(135deg,#00d4ff,#0284c7)',
                       boxShadow: loading ? 'none':'0 4px 20px rgba(0,212,255,0.3)' }}>
              {loading ? 'Creating…':'Create Account'}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#00d4ff' }} className="hover:text-white transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
