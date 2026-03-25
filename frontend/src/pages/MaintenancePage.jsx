import React, { useEffect, useState } from 'react';
import { maintenanceAPI, vehicleAPI } from '../utils/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Wrench, AlertTriangle, CheckCircle, RefreshCw, Activity, Shield, Download } from 'lucide-react';

const SEVERITY_STYLE = {
  LOW:      { color:'#94a3b8', bg:'rgba(148,163,184,0.1)', border:'rgba(148,163,184,0.3)' },
  MEDIUM:   { color:'#f59e0b', bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.3)'  },
  HIGH:     { color:'#f87171', bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.3)' },
  CRITICAL: { color:'#ef4444', bg:'rgba(239,68,68,0.15)',  border:'rgba(239,68,68,0.5)'   },
};

const generateHealthHistory = (current) => {
  const arr = [];
  for (let i = 10; i >= 0; i--) {
    const t = new Date();
    t.setHours(t.getHours() - i * 2);
    arr.push({
      time: t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      engineHealth: Math.max(10, (current?.engineHealth || 90) + (Math.random() - 0.4) * (10 - i) * 0.5),
      tireWear:     Math.max(10, (current?.tireWear     || 85) + (Math.random() - 0.4) * (10 - i) * 0.4),
      battery:      Math.max(5,  (current?.batteryLevel || 80) - i * Math.random() * 0.8),
      fuel:         Math.max(5,  (current?.fuelLevel    || 75) - i * Math.random() * 1.2),
    });
  }
  return arr;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="nfx-card px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value?.toFixed(1)}%</strong></p>
      ))}
    </div>
  );
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const exportAlertsCSV = (alerts) => {
  const headers = ['ID','Vehicle','Alert Type','Severity','Message','Resolved','Created At'];
  const rows = alerts.map(a => [
    a.id, a.vehicle?.name || 'N/A', a.alertType || 'N/A', a.severity || 'N/A',
    '"' + (a.message || 'N/A') + '"',
    a.isResolved ? 'Yes' : 'No',
    a.createdAt ? new Date(a.createdAt).toLocaleString() : 'N/A',
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'maintenance_alerts.csv';
  a.click();
  URL.revokeObjectURL(url);
};

export default function MaintenancePage() {
  const [vehicles, setVehicles]               = useState([]);
  const [alerts, setAlerts]                   = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [healthHistory, setHealthHistory]     = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [checkingId, setCheckingId]           = useState(null);

  const DEMO_VEHICLES = [
    { id:1, name:'City Cruiser 01', status:'AVAILABLE',   engineHealth:92, tireWear:88, batteryLevel:100, fuelLevel:85  },
    { id:2, name:'EV Bus Alpha',    status:'IN_USE',       engineHealth:88, tireWear:75, batteryLevel:72,  fuelLevel:100 },
    { id:3, name:'SUV Titan',       status:'AVAILABLE',   engineHealth:95, tireWear:91, batteryLevel:100, fuelLevel:60  },
    { id:4, name:'Cargo Van X',     status:'MAINTENANCE', engineHealth:45, tireWear:55, batteryLevel:100, fuelLevel:40  },
    { id:5, name:'EV Compact 02',   status:'AVAILABLE',   engineHealth:97, tireWear:93, batteryLevel:90,  fuelLevel:100 },
    { id:6, name:'Shuttle Pro',     status:'IN_USE',       engineHealth:82, tireWear:79, batteryLevel:65,  fuelLevel:78  },
  ];

  const DEMO_ALERTS = [
    { id:1, vehicle:{id:4,name:'Cargo Van X'},  alertType:'ENGINE_HEALTH', severity:'CRITICAL', message:'Engine health critical: 45%', isResolved:false, createdAt:'2024-03-20T08:30:00' },
    { id:2, vehicle:{id:4,name:'Cargo Van X'},  alertType:'TIRE_WEAR',    severity:'HIGH',     message:'Tire wear low: 55%',           isResolved:false, createdAt:'2024-03-20T08:30:00' },
    { id:3, vehicle:{id:2,name:'EV Bus Alpha'}, alertType:'LOW_BATTERY',  severity:'MEDIUM',   message:'Battery low: 72%',             isResolved:false, createdAt:'2024-03-20T09:00:00' },
    { id:4, vehicle:{id:6,name:'Shuttle Pro'},  alertType:'LOW_FUEL',     severity:'MEDIUM',   message:'Fuel level low: 78%',          isResolved:false, createdAt:'2024-03-20T09:15:00' },
  ];

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, aRes] = await Promise.all([vehicleAPI.getAll(), maintenanceAPI.getActiveAlerts()]);
      setVehicles(vRes.data);
      setAlerts(aRes.data);
      if (vRes.data.length) { setSelectedVehicle(vRes.data[0]); setHealthHistory(generateHealthHistory(vRes.data[0])); }
    } catch {
      setVehicles(DEMO_VEHICLES);
      setAlerts(DEMO_ALERTS);
      setSelectedVehicle(DEMO_VEHICLES[0]);
      setHealthHistory(generateHealthHistory(DEMO_VEHICLES[0]));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const selectVehicle = (v) => { setSelectedVehicle(v); setHealthHistory(generateHealthHistory(v)); };
  const runCheck = async (id) => { setCheckingId(id); await maintenanceAPI.runCheck(id).catch(() => {}); await load(); setCheckingId(null); };
  const resolveAlert = async (id) => { await maintenanceAPI.resolveAlert(id).catch(() => {}); setAlerts(a => a.filter(x => x.id !== id)); };
  const healthColor = (v) => v > 70 ? '#00ff88' : v > 40 ? '#f59e0b' : '#f87171';

  const healthy  = vehicles.filter(v => Math.min(v.engineHealth||100, v.tireWear||100) > 70).length;
  const due      = vehicles.filter(v => { const w = Math.min(v.engineHealth||100, v.tireWear||100); return w > 40 && w <= 70; }).length;
  const critical = vehicles.filter(v => Math.min(v.engineHealth||100, v.tireWear||100) <= 40).length;
  const pieData  = [
    { name:'Healthy',  value: healthy  || 3, color:'#00ff88' },
    { name:'Due',      value: due      || 2, color:'#f59e0b' },
    { name:'Critical', value: critical || 1, color:'#f87171' },
  ].filter(d => d.value > 0);

  const HealthGauge = ({ label, value }) => (
    <div className="nfx-card p-3 text-center">
      <div className="relative w-16 h-16 mx-auto mb-2">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"/>
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke={healthColor(value)} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${value} 100`}/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono" style={{ color: healthColor(value) }}>
          {Math.round(value)}%
        </div>
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wrench size={22} style={{ color:'#00d4ff' }}/> Predictive Maintenance
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">Vehicle health monitoring and AI-powered alerts</p>
        </div>
        <button onClick={load} className="p-2.5 rounded-lg text-slate-400 hover:text-white" style={{ border:'1px solid rgba(255,255,255,0.1)' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="nfx-card p-5">
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <Activity size={15} style={{ color:'#00d4ff' }}/> Fleet Health Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-3">Overall maintenance status</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" labelLine={false} label={CustomPieLabel}>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke={entry.color + '40'} strokeWidth={2}/>
                ))}
              </Pie>
              <Tooltip contentStyle={{ background:'#0d1117', border:'1px solid rgba(0,212,255,0.2)', borderRadius:'8px', fontSize:'12px' }} itemStyle={{ color:'#e2e8f0' }}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: d.color }}/>
                <span className="text-xs text-slate-400">{d.name}</span>
                <span className="text-xs font-bold font-mono" style={{ color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-2 overflow-y-auto" style={{ maxHeight:'320px' }}>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Individual Vehicle Health</h3>
          {vehicles.map(v => {
            const worst = Math.min(v.engineHealth || 100, v.tireWear || 100);
            return (
              <div key={v.id} onClick={() => selectVehicle(v)}
                className="nfx-card p-3 cursor-pointer transition-all hover:scale-[1.01]"
                style={selectedVehicle?.id === v.id ? { borderColor:'rgba(0,212,255,0.4)', background:'rgba(0,212,255,0.05)' } : {}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white font-medium">{v.name}</span>
                  <div className="flex items-center gap-2">
                    {worst < 50 && <AlertTriangle size={13} style={{ color:'#f87171' }}/>}
                    <span className="text-xs font-mono" style={{ color: healthColor(worst) }}>{Math.round(worst)}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width:`${worst}%`, background: healthColor(worst) }}/>
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-slate-600">
                  <span>Engine {Math.round(v.engineHealth || 100)}%</span>
                  <span>Tyres {Math.round(v.tireWear || 100)}%</span>
                  <button onClick={e => { e.stopPropagation(); runCheck(v.id); }}
                    className="text-xs px-2 py-0.5 rounded" style={{ color:'rgba(0,212,255,0.6)', border:'1px solid rgba(0,212,255,0.2)' }}>
                    {checkingId === v.id ? '...' : 'Check'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedVehicle && (
        <div className="space-y-4">
          <div className="nfx-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">{selectedVehicle.name} - Health Overview</h3>
              <Activity size={16} style={{ color:'#00d4ff' }}/>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <HealthGauge label="Engine"  value={selectedVehicle.engineHealth  || 100}/>
              <HealthGauge label="Tyres"   value={selectedVehicle.tireWear      || 100}/>
              <HealthGauge label="Battery" value={selectedVehicle.batteryLevel  || 100}/>
              <HealthGauge label="Fuel"    value={selectedVehicle.fuelLevel     || 100}/>
            </div>
          </div>
          <div className="nfx-card p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Health Trend (last 20h)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={healthHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="time" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Legend wrapperStyle={{ fontSize:'11px', color:'#94a3b8' }}/>
                <Line type="monotone" dataKey="engineHealth" name="Engine"  stroke="#00d4ff" strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="tireWear"     name="Tyres"   stroke="#f59e0b" strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="battery"      name="Battery" stroke="#a78bfa" strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="fuel"         name="Fuel"    stroke="#00ff88" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="nfx-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor:'rgba(0,212,255,0.07)' }}>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <AlertTriangle size={15} style={{ color:'#f87171' }}/> Active Alerts
            {alerts.length > 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">{alerts.length}</span>}
          </h3>
          <button onClick={() => exportAlertsCSV(alerts)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold hover:scale-105 transition-all"
            style={{ background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.3)', color:'#00d4ff' }}>
            <Download size={13}/> Export CSV
          </button>
        </div>
        <table className="w-full nfx-table">
          <thead>
            <tr>
              <th className="text-left">Vehicle</th>
              <th className="text-left">Type</th>
              <th className="text-left">Severity</th>
              <th className="text-left">Message</th>
              <th className="text-left">Time</th>
              <th className="text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10">
                <Shield size={32} className="mx-auto mb-2" style={{ color:'rgba(0,255,136,0.3)' }}/>
                <div className="text-slate-500 text-sm">All systems healthy</div>
              </td></tr>
            ) : alerts.map(a => {
              const st = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.LOW;
              return (
                <tr key={a.id}>
                  <td className="text-sm text-white">{a.vehicle?.name || 'N/A'}</td>
                  <td className="text-xs font-mono text-slate-400">{a.alertType?.replace('_',' ')}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background:st.bg, border:`1px solid ${st.border}`, color:st.color }}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="text-sm text-slate-400 max-w-xs truncate">{a.message}</td>
                  <td className="text-xs text-slate-600 font-mono">
                    {a.createdAt ? new Date(a.createdAt).toLocaleString('en-IN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'N/A'}
                  </td>
                  <td>
                    <button onClick={() => resolveAlert(a.id)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs hover:scale-105 transition-all"
                      style={{ background:'rgba(0,255,136,0.1)', border:'1px solid rgba(0,255,136,0.3)', color:'#00ff88' }}>
                      <CheckCircle size={11}/> Resolve
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
