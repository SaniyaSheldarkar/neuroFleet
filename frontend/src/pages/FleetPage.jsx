import React, { useEffect, useState } from 'react';
import { vehicleAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, RefreshCw, Battery, Gauge, MapPin, X, CheckCircle, Download } from 'lucide-react';

const STATUS_STYLES = {
  AVAILABLE:   { cls:'badge-available',    label:'Available'    },
  IN_USE:      { cls:'badge-inuse',        label:'In Use'       },
  MAINTENANCE: { cls:'badge-maintenance',  label:'Maintenance'  },
};

const FUEL_ICON = { ELECTRIC:'⚡', PETROL:'⛽', DIESEL:'🛢️', HYBRID:'🔋' };

const HealthBar = ({ value, color }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.1)' }}>
      <div className="h-full rounded-full transition-all" style={{ width:`${value}%`, background:color }}/>
    </div>
    <span className="text-xs font-mono" style={{ color, minWidth:'32px' }}>{Math.round(value)}%</span>
  </div>
);

// Export fleet to CSV
const exportFleetCSV = (vehicles) => {
  const headers = ['ID','Name','Type','License Plate','Status','Fuel Type','Seats','Speed (km/h)','Fuel %','Battery %','Engine Health %','Tyre Wear %','Total KM','Model','Year'];
  const rows = vehicles.map(v => [
    v.id, v.name, v.type, v.licensePlate, v.status,
    v.fuelType, v.seats,
    Math.round(v.speed || 0),
    Math.round(v.fuelLevel || 0),
    Math.round(v.batteryLevel || 0),
    Math.round(v.engineHealth || 0),
    Math.round(v.tireWear || 0),
    Math.round(v.totalKm || 0),
    v.model || '—', v.year || '—'
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'fleet_report.csv';
  a.click();
  URL.revokeObjectURL(url);
};

const VehicleModal = ({ vehicle, onClose, onSave }) => {
  const blank = { name:'', type:'SEDAN', licensePlate:'', fuelType:'PETROL', seats:4, model:'', year:2023, status:'AVAILABLE' };
  const [form, setForm]   = useState(vehicle || blank);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      vehicle?.id ? await vehicleAPI.update(vehicle.id, form) : await vehicleAPI.create(form);
      onSave();
    } catch (e) {
      alert('Save failed: ' + (e.response?.data || e.message));
    } finally { setSaving(false); }
  };

  const inputStyle = { background:'#0d1117', border:'1px solid rgba(0,212,255,0.2)', color:'white', borderRadius:'8px', padding:'8px 12px', width:'100%', fontSize:'13px', outline:'none' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.8)', backdropFilter:'blur(4px)' }}>
      <div className="nfx-card w-full max-w-lg p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{vehicle?.id ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[['name','Vehicle Name','text'],['licensePlate','License Plate','text'],['model','Model','text']].map(([k,l,t]) => (
            <div key={k} className={k === 'name' ? 'col-span-2' : ''}>
              <label className="block text-xs text-slate-400 mb-1">{l}</label>
              <input type={t} value={form[k] || ''} onChange={e => set(k, e.target.value)} style={inputStyle}/>
            </div>
          ))}
          {[
            ['type',     'Type',   ['SEDAN','SUV','VAN','TRUCK','EV_BUS','BIKE']],
            ['fuelType', 'Fuel',   ['PETROL','DIESEL','ELECTRIC','HYBRID']],
            ['status',   'Status', ['AVAILABLE','IN_USE','MAINTENANCE']],
          ].map(([k,l,opts]) => (
            <div key={k}>
              <label className="block text-xs text-slate-400 mb-1">{l}</label>
              <select value={form[k] || ''} onChange={e => set(k, e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>
                {opts.map(o => <option key={o} value={o}>{o.replace('_',' ')}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Seats</label>
            <input type="number" min={1} max={60} value={form.seats || 4} onChange={e => set('seats', +e.target.value)} style={inputStyle}/>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Year</label>
            <input type="number" min={2010} max={2025} value={form.year || 2023} onChange={e => set('year', +e.target.value)} style={inputStyle}/>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
            style={{ border:'1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background:'linear-gradient(135deg,#00d4ff,#0284c7)', boxShadow:'0 4px 15px rgba(0,212,255,0.3)' }}>
            {saving ? 'Saving…' : 'Save Vehicle'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FleetPage() {
  const { user }    = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [filter, setFilter]     = useState('ALL');
  const [statusMsg, setStatusMsg] = useState('');

  const canEdit = ['ADMIN','FLEET_MANAGER'].includes(user?.role);

  const DEMO = [
    { id:1, name:'City Cruiser 01', type:'SEDAN',  licensePlate:'MH20AB1234', status:'AVAILABLE',   fuelType:'PETROL',   seats:4,  speed:0,  fuelLevel:85,  batteryLevel:100, engineHealth:92, tireWear:88, model:'Toyota Camry',   year:2022, latitude:19.8762, longitude:75.3433 },
    { id:2, name:'EV Bus Alpha',    type:'EV_BUS', licensePlate:'MH20CD5678', status:'IN_USE',       fuelType:'ELECTRIC', seats:20, speed:48, fuelLevel:100, batteryLevel:72,  engineHealth:88, tireWear:75, model:'BYD K9',          year:2023, latitude:19.88,   longitude:75.35   },
    { id:3, name:'SUV Titan',       type:'SUV',    licensePlate:'MH20EF9012', status:'AVAILABLE',   fuelType:'DIESEL',   seats:7,  speed:0,  fuelLevel:60,  batteryLevel:100, engineHealth:95, tireWear:91, model:'Toyota Fortuner', year:2021, latitude:19.87,   longitude:75.335  },
    { id:4, name:'Cargo Van X',     type:'VAN',    licensePlate:'MH20GH3456', status:'MAINTENANCE', fuelType:'DIESEL',   seats:2,  speed:0,  fuelLevel:40,  batteryLevel:100, engineHealth:45, tireWear:55, model:'Tata Ace',        year:2020, latitude:19.885,  longitude:75.36   },
    { id:5, name:'EV Compact 02',   type:'SEDAN',  licensePlate:'MH20IJ7890', status:'AVAILABLE',   fuelType:'ELECTRIC', seats:4,  speed:0,  fuelLevel:100, batteryLevel:90,  engineHealth:97, tireWear:93, model:'Tata Nexon EV',  year:2023, latitude:19.872,  longitude:75.347  },
    { id:6, name:'Shuttle Pro',     type:'VAN',    licensePlate:'MH20KL2345', status:'IN_USE',       fuelType:'HYBRID',   seats:12, speed:55, fuelLevel:78,  batteryLevel:65,  engineHealth:82, tireWear:79, model:'Toyota HiAce',   year:2022, latitude:19.878,  longitude:75.352  },
  ];

  const load = () => {
    setLoading(true);
    vehicleAPI.getAll()
      .then(r => setVehicles(r.data))
      .catch(() => setVehicles(DEMO))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    await vehicleAPI.delete(id).catch(() => {});
    load();
  };

  const handleStatusChange = async (id, status) => {
    await vehicleAPI.updateStatus(id, status).catch(() => {});
    setStatusMsg('Status updated');
    setTimeout(() => setStatusMsg(''), 2000);
    load();
  };

  const filtered = filter === 'ALL' ? vehicles : vehicles.filter(v => v.status === filter);
  const healthColor = (v) => v > 70 ? '#00ff88' : v > 40 ? '#f59e0b' : '#f87171';

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Fleet Management</h2>
          <p className="text-slate-400 text-sm mt-0.5">{vehicles.length} vehicles registered</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export CSV */}
          <button
            onClick={() => exportFleetCSV(vehicles)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background:'rgba(0,255,136,0.1)', border:'1px solid rgba(0,255,136,0.3)', color:'#00ff88' }}>
            <Download size={15}/> Export CSV
          </button>
          <button onClick={load}
            className="p-2.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            style={{ border:'1px solid rgba(255,255,255,0.1)' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
          </button>
          {canEdit && (
            <button onClick={() => setModal({})}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background:'linear-gradient(135deg,#00d4ff,#0284c7)', boxShadow:'0 4px 15px rgba(0,212,255,0.3)' }}>
              <Plus size={16}/> Add Vehicle
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm w-fit"
          style={{ background:'rgba(0,255,136,0.1)', border:'1px solid rgba(0,255,136,0.2)', color:'#00ff88' }}>
          <CheckCircle size={14}/>{statusMsg}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['ALL','AVAILABLE','IN_USE','MAINTENANCE'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={filter === s
              ? { background:'rgba(0,212,255,0.2)', border:'1px solid rgba(0,212,255,0.4)', color:'#00d4ff' }
              : { background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#64748b' }}>
            {s.replace('_',' ')}
            <span className="ml-1.5 opacity-70">
              {s === 'ALL' ? vehicles.length : vehicles.filter(v => v.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Vehicle Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="nfx-card p-5 animate-pulse h-52" style={{ background:'#0d1117' }}/>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(v => {
            const st = STATUS_STYLES[v.status] || STATUS_STYLES.AVAILABLE;
            return (
              <div key={v.id} className="nfx-card p-5 hover:scale-[1.01] transition-transform">
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{FUEL_ICON[v.fuelType] || '🚗'}</span>
                    <div>
                      <div className="text-white font-semibold text-sm">{v.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{v.licensePlate}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    <span className="text-xs text-slate-500">{v.type?.replace('_',' ')} · {v.seats}s</span>
                  </div>
                </div>

                {/* Health bars */}
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Gauge size={11}/>Engine</div>
                  <HealthBar value={v.engineHealth || 100} color={healthColor(v.engineHealth || 100)}/>
                  <div className="text-xs text-slate-500">Tyres</div>
                  <HealthBar value={v.tireWear || 100} color={healthColor(v.tireWear || 100)}/>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Battery size={11}/>{v.fuelType === 'ELECTRIC' ? 'Battery' : 'Fuel'}
                  </div>
                  <HealthBar
                    value={v.fuelType === 'ELECTRIC' ? (v.batteryLevel || 100) : (v.fuelLevel || 100)}
                    color={healthColor(v.fuelType === 'ELECTRIC' ? (v.batteryLevel || 100) : (v.fuelLevel || 100))}
                  />
                </div>

                {/* Location + Speed */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin size={11}/>{v.latitude?.toFixed(4)}, {v.longitude?.toFixed(4)}
                  </span>
                  <span className="font-mono" style={{ color:'#00d4ff' }}>{Math.round(v.speed || 0)} km/h</span>
                </div>

                {/* Actions */}
                {canEdit && (
                  <div className="flex gap-2 pt-3 border-t" style={{ borderColor:'rgba(255,255,255,0.05)' }}>
                    <select value={v.status} onChange={e => handleStatusChange(v.id, e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg text-xs text-white"
                      style={{ background:'#0d1117', border:'1px solid rgba(0,212,255,0.2)' }}>
                      {['AVAILABLE','IN_USE','MAINTENANCE'].map(s => (
                        <option key={s} value={s}>{s.replace('_',' ')}</option>
                      ))}
                    </select>
                    <button onClick={() => setModal(v)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                      style={{ border:'1px solid rgba(255,255,255,0.08)' }}>
                      <Edit2 size={14}/>
                    </button>
                    <button onClick={() => handleDelete(v.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                      style={{ border:'1px solid rgba(255,255,255,0.08)' }}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && (
        <VehicleModal
          vehicle={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
