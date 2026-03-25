import React, { useEffect, useRef, useState } from 'react';
import { vehicleAPI } from '../utils/api';
import { MapPin, Radio, Truck, RefreshCw, Info } from 'lucide-react';

// We use Leaflet via CDN since react-leaflet needs a DOM
// This implements a canvas-based simulation map when Leaflet isn't available

const STATUS_COLOR = { AVAILABLE:'#00ff88', IN_USE:'#00d4ff', MAINTENANCE:'#ff6b35' };

// Haversine + fake movement
const jitter = (val, range=0.004) => val + (Math.random()-0.5)*range;

export default function MapPage() {
  const [vehicles, setVehicles] = useState([]);
  const [liveVehicles, setLiveVehicles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [wsStatus, setWsStatus] = useState('simulating');
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const vehiclesRef = useRef([]);
  const intervalRef = useRef(null);

  // Center: Aurangabad
  const MAP = { lat:19.885, lng:75.345, zoom:13 };

  const latToY = (lat, h) => ((MAP.lat + 0.08 - lat) / 0.16) * h;
  const lngToX = (lng, w) => ((lng - (MAP.lng - 0.08)) / 0.16) * w;

  useEffect(() => {
    vehicleAPI.getAll()
      .then(r => {
        const v = r.data;
        setVehicles(v);
        setLiveVehicles(v.map(x=>({...x})));
        vehiclesRef.current = v.map(x=>({...x}));
      })
      .catch(() => {
        const demo = [
          {id:1,name:'City Cruiser 01',status:'AVAILABLE',latitude:19.876,longitude:75.343,speed:0,type:'SEDAN',fuelLevel:85,batteryLevel:100,engineHealth:92},
          {id:2,name:'EV Bus Alpha',status:'IN_USE',latitude:19.882,longitude:75.351,speed:48,type:'EV_BUS',fuelLevel:100,batteryLevel:72,engineHealth:88},
          {id:3,name:'SUV Titan',status:'AVAILABLE',latitude:19.870,longitude:75.335,speed:0,type:'SUV',fuelLevel:60,batteryLevel:100,engineHealth:95},
          {id:4,name:'Cargo Van X',status:'MAINTENANCE',latitude:19.888,longitude:75.360,speed:0,type:'VAN',fuelLevel:40,batteryLevel:100,engineHealth:45},
          {id:5,name:'EV Compact 02',status:'AVAILABLE',latitude:19.872,longitude:75.347,speed:0,type:'SEDAN',fuelLevel:100,batteryLevel:90,engineHealth:97},
          {id:6,name:'Shuttle Pro',status:'IN_USE',latitude:19.879,longitude:75.353,speed:55,type:'VAN',fuelLevel:78,batteryLevel:65,engineHealth:82},
        ];
        setVehicles(demo);
        setLiveVehicles(demo.map(x=>({...x})));
        vehiclesRef.current = demo.map(x=>({...x}));
      });
  }, []);

  // Simulate live movement for IN_USE vehicles
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      vehiclesRef.current = vehiclesRef.current.map(v => {
        if (v.status !== 'IN_USE') return v;
        return {
          ...v,
          latitude: v.latitude + (Math.random()-0.5)*0.0015,
          longitude: v.longitude + (Math.random()-0.5)*0.0015,
          speed: 30 + Math.random()*50,
          fuelLevel: Math.max(5, (v.fuelLevel||80) - Math.random()*0.1),
          batteryLevel: Math.max(5, (v.batteryLevel||80) - Math.random()*0.1),
        };
      });
      setLiveVehicles([...vehiclesRef.current]);
    }, 2000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Draw canvas map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    const draw = () => {
      // Background
      ctx.fillStyle = '#0a1628';
      ctx.fillRect(0,0,w,h);

      // Grid
      ctx.strokeStyle = 'rgba(0,212,255,0.06)';
      ctx.lineWidth = 1;
      for (let x=0; x<w; x+=40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      for (let y=0; y<h; y+=40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

      // Road network (simulated)
      const roads = [
        [[0.15,0.5],[0.85,0.5]],
        [[0.5,0.1],[0.5,0.9]],
        [[0.15,0.2],[0.85,0.8]],
        [[0.15,0.8],[0.85,0.2]],
        [[0.3,0.1],[0.7,0.9]],
        [[0.1,0.4],[0.9,0.6]],
      ];
      ctx.strokeStyle = 'rgba(99,179,237,0.12)';
      ctx.lineWidth = 2;
      roads.forEach(([[x1,y1],[x2,y2]]) => {
        ctx.beginPath(); ctx.moveTo(x1*w,y1*h); ctx.lineTo(x2*w,y2*h); ctx.stroke();
      });

      // City nodes
      const nodes = [
        {name:'Railway Stn',lat:19.876,lng:75.343},
        {name:'Airport',lat:19.867,lng:75.397},
        {name:'City Center',lat:19.895,lng:75.324},
        {name:'IT Park',lat:19.910,lng:75.358},
        {name:'Hospital',lat:19.885,lng:75.320},
        {name:'University',lat:19.920,lng:75.370},
        {name:'Mall',lat:19.900,lng:75.310},
        {name:'Market',lat:19.870,lng:75.330},
      ];
      nodes.forEach(n => {
        const x = lngToX(n.lng, w), y = latToY(n.lat, h);
        ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2);
        ctx.fillStyle = 'rgba(0,212,255,0.3)'; ctx.fill();
        ctx.strokeStyle = 'rgba(0,212,255,0.6)'; ctx.lineWidth=1; ctx.stroke();
        ctx.fillStyle = 'rgba(148,163,184,0.8)';
        ctx.font = '9px JetBrains Mono, monospace'; ctx.textAlign='center';
        ctx.fillText(n.name, x, y-8);
      });

      // Vehicles
      vehiclesRef.current.forEach(v => {
        const x = lngToX(v.longitude||75.343, w);
        const y = latToY(v.latitude||19.876, h);
        const color = STATUS_COLOR[v.status] || '#94a3b8';
        const isSelected = selected?.id === v.id;

        // Ping ring for IN_USE
        if (v.status === 'IN_USE') {
          const t = (Date.now() % 2000) / 2000;
          ctx.beginPath(); ctx.arc(x,y,12+t*12,0,Math.PI*2);
          ctx.strokeStyle = `rgba(0,212,255,${0.6*(1-t)})`; ctx.lineWidth=1; ctx.stroke();
        }

        // Selection ring
        if (isSelected) {
          ctx.beginPath(); ctx.arc(x,y,16,0,Math.PI*2);
          ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth=2; ctx.stroke();
        }

        // Vehicle dot
        ctx.beginPath(); ctx.arc(x,y,8,0,Math.PI*2);
        ctx.fillStyle = color+'33'; ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth=2; ctx.stroke();

        // Icon letter
        ctx.fillStyle = color;
        ctx.font = 'bold 8px sans-serif'; ctx.textAlign='center';
        ctx.fillText(v.type?.[0]||'V', x, y+3);

        // Name label
        ctx.fillStyle = 'rgba(226,232,240,0.9)';
        ctx.font = '9px Syne, sans-serif'; ctx.textAlign='center';
        ctx.fillText(v.name?.split(' ')[0]||'', x, y+20);
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [selected, liveVehicles]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width/rect.width);
    const my = (e.clientY - rect.top) * (canvas.height/rect.height);

    let closest = null, minDist = 30;
    vehiclesRef.current.forEach(v => {
      const vx = lngToX(v.longitude||75.343, canvas.width);
      const vy = latToY(v.latitude||19.876, canvas.height);
      const dist = Math.hypot(mx-vx, my-vy);
      if (dist < minDist) { minDist=dist; closest=v; }
    });
    setSelected(closest);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Live Fleet Map</h2>
          <p className="text-slate-400 text-sm mt-0.5">Real-time vehicle tracking · Aurangabad, MH</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{ background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.2)', color:'#00d4ff' }}>
            <Radio size={12} className="animate-pulse"/>{wsStatus}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Map */}
        <div className="xl:col-span-3 nfx-card overflow-hidden" style={{ height:'520px' }}>
          <canvas ref={canvasRef} width={900} height={520} className="w-full h-full cursor-crosshair"
            onClick={handleCanvasClick} style={{ display:'block' }} />
        </div>

        {/* Sidebar */}
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight:'520px' }}>
          {/* Legend */}
          <div className="nfx-card p-3">
            <div className="text-xs font-semibold text-slate-400 mb-2">LEGEND</div>
            {[['#00ff88','Available'],['#00d4ff','In Use'],['#ff6b35','Maintenance']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background:c }} />
                <span className="text-xs text-slate-400">{l}</span>
              </div>
            ))}
          </div>

          {/* Vehicle list */}
          {liveVehicles.map(v => {
            const color = STATUS_COLOR[v.status] || '#94a3b8';
            return (
              <div key={v.id} onClick={()=>setSelected(s=>s?.id===v.id?null:v)}
                className="nfx-card p-3 cursor-pointer hover:scale-[1.02] transition-all"
                style={selected?.id===v.id ? { borderColor:`${color}60` } : {}}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-white truncate">{v.name}</div>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:color }} />
                </div>
                {v.status==='IN_USE' && (
                  <div className="text-xs font-mono" style={{ color:'#00d4ff' }}>
                    {Math.round(v.speed||0)} km/h
                  </div>
                )}
                <div className="text-xs text-slate-600 font-mono mt-1">
                  {v.latitude?.toFixed(4)}, {v.longitude?.toFixed(4)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected vehicle details */}
      {selected && (
        <div className="nfx-card p-4 animate-slide-in">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-bold">{selected.name}</h3>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {[
                  ['Speed', `${Math.round(selected.speed||0)} km/h`,'#00d4ff'],
                  ['Fuel/Battery', `${Math.round(selected.fuelType==='ELECTRIC' ? selected.batteryLevel : selected.fuelLevel)||'—'}%`,'#00ff88'],
                  ['Engine', `${Math.round(selected.engineHealth||100)}%`, selected.engineHealth < 50 ? '#f87171' : '#34d399'],
                  ['Type', selected.type?.replace('_',' '),'#a78bfa'],
                ].map(([k,v,c]) => (
                  <div key={k} className="px-3 py-1 rounded-lg text-xs" style={{ background:`${c}15`, border:`1px solid ${c}30`, color:c }}>
                    {k}: <strong>{v}</strong>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={()=>setSelected(null)} className="text-slate-500 hover:text-white"><X size={16}/></button>
          </div>
        </div>
      )}
    </div>
  );
}

// X import fix
import { X } from 'lucide-react';
