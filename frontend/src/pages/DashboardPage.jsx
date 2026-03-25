import React, { useEffect, useState } from 'react';
import { analyticsAPI, vehicleAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { Truck, Users, TrendingUp, Activity, Zap, AlertTriangle } from 'lucide-react';

const KPI = ({ label, value, sub, icon: Icon, color, glow }) => (
  <div className="nfx-card p-5 flex items-start gap-4 hover:scale-[1.02] transition-transform"
    style={{ boxShadow: `0 0 20px ${glow}20` }}>
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
      <Icon size={22} style={{ color }} />
    </div>
    <div>
      <div className="text-2xl font-bold text-white font-mono">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color }}>{sub}</div>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="nfx-card px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState({});
  const [tripData, setTripData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [vehicleUsage, setVehicleUsage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getKpis(),
      analyticsAPI.getTripsPerHour(),
      analyticsAPI.getWeeklyRevenue(),
      analyticsAPI.getVehicleUsage(),
    ]).then(([k, t, r, v]) => {
      setKpis(k.data);
      setTripData(t.data);
      setRevenueData(r.data);
      setVehicleUsage(v.data);
    }).catch(() => {
      // Fallback demo data
      setKpis({ totalVehicles:6, availableVehicles:3, activeTrips:2, totalBookings:24, revenue:187400 });
      setTripData([
        {hour:'8AM',trips:12},{hour:'9AM',trips:18},{hour:'10AM',trips:24},{hour:'11AM',trips:30},
        {hour:'12PM',trips:22},{hour:'1PM',trips:28},{hour:'2PM',trips:35},{hour:'3PM',trips:40},
        {hour:'4PM',trips:38},{hour:'5PM',trips:45},{hour:'6PM',trips:32},{hour:'7PM',trips:20},
      ]);
      setRevenueData([
        {day:'Mon',revenue:8200},{day:'Tue',revenue:9500},{day:'Wed',revenue:7800},
        {day:'Thu',revenue:11200},{day:'Fri',revenue:13400},{day:'Sat',revenue:15600},{day:'Sun',revenue:12100},
      ]);
      setVehicleUsage([
        {name:'City Cruiser',km:340},{name:'EV Bus Alpha',km:512},{name:'SUV Titan',km:280},
        {name:'Cargo Van X',km:0},{name:'EV Compact',km:195},{name:'Shuttle Pro',km:423},
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const kpiCards = [
    { label:'Total Vehicles',    value: kpis.totalVehicles    ?? '—', icon:Truck,       color:'#00d4ff', glow:'#00d4ff', sub:'Fleet size' },
    { label:'Available Now',     value: kpis.availableVehicles?? '—', icon:Zap,         color:'#00ff88', glow:'#00ff88', sub:'Ready to deploy' },
    { label:'Active Trips',      value: kpis.activeTrips      ?? '—', icon:Activity,    color:'#f59e0b', glow:'#f59e0b', sub:'In progress' },
    { label:'Total Bookings',    value: kpis.totalBookings    ?? '—', icon:Users,       color:'#a78bfa', glow:'#a78bfa', sub:'All time' },
    { label:'Revenue (₹)',       value: kpis.revenue ? `₹${(kpis.revenue/1000).toFixed(0)}K` : '—', icon:TrendingUp, color:'#34d399', glow:'#34d399', sub:'Total earned' },
    { label:'Maintenance Alerts',value:'3',                           icon:AlertTriangle,color:'#f87171', glow:'#f87171', sub:'Needs attention' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          Welcome back, <span style={{ color:'#00d4ff' }}>{user?.name?.split(' ')[0]}</span>
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          {new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · {user?.role?.replace('_',' ')}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((k,i) => <KPI key={i} {...k} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trips per Hour */}
        <div className="nfx-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Trips Per Hour</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={tripData}>
              <defs>
                <linearGradient id="tripGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="trips" name="Trips" stroke="#00d4ff" strokeWidth={2} fill="url(#tripGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Revenue */}
        <div className="nfx-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Weekly Revenue (₹)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#00ff88" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue ₹" fill="url(#revGrad)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vehicle Usage */}
      <div className="nfx-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Vehicle Utilisation (km driven)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={vehicleUsage} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} tickLine={false} width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="km" name="km" fill="#0ea5e9" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
