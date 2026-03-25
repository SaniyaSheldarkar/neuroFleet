import React, { useEffect, useState } from 'react';
import { bookingAPI, vehicleAPI, aiAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Plus, X, Sparkles, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

const STATUS_STYLES = {
  PENDING:     { color:'#f59e0b', bg:'rgba(245,158,11,0.1)',   border:'rgba(245,158,11,0.3)'  },
  CONFIRMED:   { color:'#00d4ff', bg:'rgba(0,212,255,0.1)',    border:'rgba(0,212,255,0.3)'   },
  IN_PROGRESS: { color:'#a78bfa', bg:'rgba(167,139,250,0.1)',  border:'rgba(167,139,250,0.3)' },
  COMPLETED:   { color:'#00ff88', bg:'rgba(0,255,136,0.1)',    border:'rgba(0,255,136,0.3)'   },
  CANCELLED:   { color:'#f87171', bg:'rgba(248,113,113,0.1)',  border:'rgba(248,113,113,0.3)' },
};

const BookingModal = ({ vehicles, onClose, onCreated }) => {
  const [form, setForm] = useState({ vehicleId:'', source:'', destination:'', pickupTime:'', passengers:1, preferEV:false, notes:'' });
  const [aiRec, setAiRec] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const available = vehicles.filter(v => v.status === 'AVAILABLE');

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const getAIRecommendation = async () => {
    setLoadingAI(true);
    try {
      const res = await aiAPI.recommendVehicle({
        passengers: form.passengers,
        distanceKm: 20,
        preferEV: form.preferEV,
      });
      setAiRec(res.data);
      // Auto-select best available
      const best = available.find(v => v.type === res.data.recommended);
      if (best) set('vehicleId', best.id);
    } catch {
      setAiRec({ recommended:'SEDAN', reason:'AI service unavailable — default recommendation' });
      const sedan = available.find(v=>v.type==='SEDAN');
      if (sedan) set('vehicleId', sedan.id);
    } finally { setLoadingAI(false); }
  };

  const handleCreate = async () => {
    if (!form.vehicleId || !form.source || !form.destination || !form.pickupTime) {
      setError('Please fill all required fields'); return;
    }
    setSaving(true); setError('');
    try {
      await bookingAPI.create({ ...form, vehicleId: Number(form.vehicleId) });
      onCreated();
    } catch (e) {
      setError(e.response?.data || 'Booking failed');
    } finally { setSaving(false); }
  };

  const inputStyle = { background:'#0d1117', border:'1px solid rgba(0,212,255,0.2)', color:'white', borderRadius:'8px', padding:'10px 14px', width:'100%', fontSize:'13px' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.85)', backdropFilter:'blur(4px)' }}>
      <div className="nfx-card w-full max-w-lg p-6 animate-fade-in overflow-y-auto" style={{ maxHeight:'90vh' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">New Booking</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg text-sm"
            style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171' }}>
            <AlertCircle size={14}/>{error}
          </div>
        )}

        <div className="space-y-4">
          {/* AI recommend */}
          <div className="p-4 rounded-xl" style={{ background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.15)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><Sparkles size={13} style={{ color:'#00d4ff' }}/>AI Vehicle Recommender</span>
              <button onClick={getAIRecommendation} disabled={loadingAI}
                className="px-3 py-1 rounded-lg text-xs font-semibold"
                style={{ background:'rgba(0,212,255,0.2)', color:'#00d4ff', border:'1px solid rgba(0,212,255,0.3)' }}>
                {loadingAI ? 'Analysing…' : 'Get Suggestion'}
              </button>
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 text-slate-400 text-xs cursor-pointer">
                <input type="number" min={1} max={60} value={form.passengers}
                  onChange={e=>set('passengers',+e.target.value)}
                  className="w-14 px-2 py-1 rounded text-center text-white text-xs"
                  style={{ background:'#0d1117', border:'1px solid rgba(0,212,255,0.2)' }} />
                Passengers
              </label>
              <label className="flex items-center gap-2 text-slate-400 text-xs cursor-pointer">
                <input type="checkbox" checked={form.preferEV} onChange={e=>set('preferEV',e.target.checked)}
                  className="w-4 h-4 accent-cyan-400" />
                Prefer EV
              </label>
            </div>
            {aiRec && (
              <div className="mt-2 text-xs p-2 rounded-lg flex items-center gap-2"
                style={{ background:'rgba(0,255,136,0.08)', color:'#00ff88', border:'1px solid rgba(0,255,136,0.2)' }}>
                <Sparkles size={12}/>
                Recommended: <strong>{aiRec.recommended?.replace('_',' ')}</strong> · {aiRec.reason}
              </div>
            )}
          </div>

          {/* Source / Dest */}
          {[['source','Pickup Location','e.g. Railway Station'],['destination','Drop Location','e.g. Airport']].map(([k,l,ph]) => (
            <div key={k}>
              <label className="block text-xs text-slate-400 mb-1">{l} *</label>
              <input type="text" placeholder={ph} value={form[k]} onChange={e=>set(k,e.target.value)} style={inputStyle} />
            </div>
          ))}

          {/* Vehicle */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Select Vehicle *</label>
            <select value={form.vehicleId} onChange={e=>set('vehicleId',e.target.value)} style={inputStyle}>
              <option value="">— Choose available vehicle —</option>
              {available.map(v=>(
                <option key={v.id} value={v.id}>
                  {v.name} · {v.type?.replace('_',' ')} · {v.seats} seats · {v.fuelType}
                </option>
              ))}
            </select>
          </div>

          {/* Pickup time */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Pickup Date & Time *</label>
            <input type="datetime-local" value={form.pickupTime} onChange={e=>set('pickupTime',e.target.value)} style={inputStyle} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea rows={2} placeholder="Any special instructions…" value={form.notes}
              onChange={e=>set('notes',e.target.value)}
              style={{ ...inputStyle, resize:'none' }} />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white"
            style={{ border:'1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
          <button onClick={handleCreate} disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background:'linear-gradient(135deg,#00d4ff,#0284c7)', boxShadow:'0 4px 15px rgba(0,212,255,0.3)' }}>
            {saving ? 'Booking…' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function BookingPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const load = () => {
    setLoading(true);
    const isCustomer = user?.role === 'CUSTOMER';
    Promise.all([
      isCustomer ? bookingAPI.getMy() : bookingAPI.getAll(),
      vehicleAPI.getAll(),
    ]).then(([b,v]) => {
      setBookings(b.data);
      setVehicles(v.data);
    }).catch(() => {
      setBookings([
        {id:1,source:'Railway Station',destination:'Airport',status:'CONFIRMED',fare:320,distanceKm:18.4,pickupTime:'2024-03-20T10:00:00',vehicle:{name:'City Cruiser 01',type:'SEDAN'},customer:{name:'Customer One'}},
        {id:2,source:'IT Park',destination:'Mall',status:'COMPLETED',fare:185,distanceKm:9.2,pickupTime:'2024-03-19T14:30:00',vehicle:{name:'SUV Titan',type:'SUV'},customer:{name:'Customer One'}},
        {id:3,source:'Hospital',destination:'University',status:'IN_PROGRESS',fare:240,distanceKm:13.7,pickupTime:'2024-03-20T09:15:00',vehicle:{name:'EV Bus Alpha',type:'EV_BUS'},customer:{name:'Customer Two'}},
      ]);
      setVehicles([
        {id:1,name:'City Cruiser 01',status:'AVAILABLE',type:'SEDAN',seats:4,fuelType:'PETROL'},
        {id:3,name:'SUV Titan',status:'AVAILABLE',type:'SUV',seats:7,fuelType:'DIESEL'},
        {id:5,name:'EV Compact 02',status:'AVAILABLE',type:'SEDAN',seats:4,fuelType:'ELECTRIC'},
      ]);
    }).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); },[]);

  const filtered = filter==='ALL' ? bookings : bookings.filter(b=>b.status===filter);

  const updateStatus = async (id, status) => {
    await bookingAPI.updateStatus(id,status).catch(()=>{});
    load();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Bookings</h2>
          <p className="text-slate-400 text-sm mt-0.5">{bookings.length} total bookings</p>
        </div>
        <button onClick={()=>setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background:'linear-gradient(135deg,#00d4ff,#0284c7)', boxShadow:'0 4px 15px rgba(0,212,255,0.3)' }}>
          <Plus size={16}/> New Booking
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['ALL','PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'].map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={filter===s
              ? {background:'rgba(0,212,255,0.2)',border:'1px solid rgba(0,212,255,0.4)',color:'#00d4ff'}
              : {background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'#64748b'}}>
            {s.replace('_',' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="nfx-card overflow-hidden">
        <table className="w-full nfx-table">
          <thead>
            <tr>
              <th className="text-left">ID</th>
              <th className="text-left">Route</th>
              <th className="text-left">Vehicle</th>
              <th className="text-left">Time</th>
              <th className="text-left">Fare</th>
              <th className="text-left">Status</th>
              {['ADMIN','FLEET_MANAGER'].includes(user?.role) && <th className="text-left">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(4).fill(0).map((_,i)=>(
                <tr key={i}><td colSpan={7} className="py-4"><div className="h-4 rounded animate-pulse" style={{background:'rgba(255,255,255,0.05)'}}/></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-slate-500 py-10">No bookings found</td></tr>
            ) : filtered.map(b => {
              const st = STATUS_STYLES[b.status] || STATUS_STYLES.PENDING;
              return (
                <tr key={b.id}>
                  <td className="font-mono text-xs text-slate-400">#{b.id}</td>
                  <td>
                    <div className="text-sm text-white flex items-center gap-1.5">
                      <MapPin size={12} style={{color:'#00d4ff'}}/>{b.source}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 pl-4">→ {b.destination}</div>
                  </td>
                  <td>
                    <div className="text-sm text-slate-300">{b.vehicle?.name||'—'}</div>
                    <div className="text-xs text-slate-600">{b.vehicle?.type?.replace('_',' ')}</div>
                  </td>
                  <td className="text-xs text-slate-400 font-mono">
                    {b.pickupTime ? new Date(b.pickupTime).toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}
                  </td>
                  <td className="font-mono text-sm" style={{color:'#00ff88'}}>₹{b.fare?.toFixed(0)||'—'}</td>
                  <td>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{background:st.bg,border:`1px solid ${st.border}`,color:st.color}}>
                      {b.status?.replace('_',' ')}
                    </span>
                  </td>
                  {['ADMIN','FLEET_MANAGER'].includes(user?.role) && (
                    <td>
                      <select value={b.status} onChange={e=>updateStatus(b.id,e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg text-white"
                        style={{background:'#0d1117',border:'1px solid rgba(0,212,255,0.2)'}}>
                        {['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'].map(s=>(
                          <option key={s} value={s}>{s.replace('_',' ')}</option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <BookingModal vehicles={vehicles} onClose={()=>setShowModal(false)} onCreated={()=>{setShowModal(false);load();}} />
      )}
    </div>
  );
}
