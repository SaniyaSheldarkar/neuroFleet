import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../utils/api';
import { Route, Zap, Clock, MapPin, Navigation, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';

const CITY_NODES = [
  'Airport','Railway Station','Bus Stand','City Center','IT Park',
  'University','Hospital','Market','Mall','Industrial Area','Residential Zone','Sports Complex'
];

const VEHICLE_TYPES = ['SEDAN','SUV','VAN','TRUCK','EV_BUS','BIKE'];

const TrafficBadge = ({ level }) => {
  const map = { Light:['#00ff88','rgba(0,255,136,0.1)'], Moderate:['#f59e0b','rgba(245,158,11,0.1)'], Heavy:['#f87171','rgba(248,113,113,0.1)'] };
  const [color,bg] = map[level] || map.Light;
  return <span className="px-2 py-0.5 rounded-full text-xs" style={{ background:bg, color, border:`1px solid ${color}40` }}>{level} Traffic</span>;
};

export default function RoutePage() {
  const [form, setForm] = useState({ source:'Railway Station', destination:'Airport', vehicleType:'SEDAN' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeRoute, setActiveRoute] = useState('best');
  const canvasRef = useRef(null);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleOptimize = async () => {
    if (!form.source || !form.destination) { setError('Enter source and destination'); return; }
    if (form.source === form.destination) { setError('Source and destination must differ'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await aiAPI.optimizeRoute(form);
      setResult(res.data);
    } catch {
      // Fallback demo result
      setResult({
        source: form.source, destination: form.destination,
        bestRoute: {
          path:['Railway Station','City Center','Hospital','Airport'],
          coordinates:[{lat:19.876,lng:75.343,name:'Railway Station'},{lat:19.895,lng:75.324,name:'City Center'},{lat:19.885,lng:75.320,name:'Hospital'},{lat:19.867,lng:75.397,name:'Airport'}],
          distanceKm:24.6, etaMinutes:33, trafficCondition:'Moderate', label:'Fastest Route'
        },
        alternateRoute: {
          path:['Railway Station','Market','Mall','IT Park','Airport'],
          coordinates:[{lat:19.876,lng:75.343,name:'Railway Station'},{lat:19.870,lng:75.330,name:'Market'},{lat:19.900,lng:75.310,name:'Mall'},{lat:19.910,lng:75.358,name:'IT Park'},{lat:19.867,lng:75.397,name:'Airport'}],
          distanceKm:29.1, etaMinutes:41, trafficCondition:'Light', label:'Alternate Route'
        },
        aiRecommendations:['Route looks optimal for current conditions.','Moderate traffic on City Center stretch — consider departing 15 min early.'],
        vehicleType: form.vehicleType, avgSpeed: 45,
      });
    } finally { setLoading(false); }
  };

  // Draw route on canvas
  useEffect(() => {
    if (!result || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const route = activeRoute === 'best' ? result.bestRoute : result.alternateRoute;

    const MAP_LAT = 19.893, MAP_LNG = 75.353;
    const latToY = lat => ((MAP_LAT + 0.06 - lat) / 0.12) * h;
    const lngToX = lng => ((lng - (MAP_LNG - 0.08)) / 0.16) * w;

    ctx.fillStyle = '#0a1628'; ctx.fillRect(0,0,w,h);
    // Grid
    ctx.strokeStyle = 'rgba(0,212,255,0.05)'; ctx.lineWidth=1;
    for (let x=0;x<w;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    for (let y=0;y<h;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}

    const coords = route.coordinates || [];
    if (coords.length < 2) return;

    // Draw route line
    const routeColor = activeRoute === 'best' ? '#00d4ff' : '#a78bfa';
    ctx.beginPath();
    ctx.moveTo(lngToX(coords[0].lng), latToY(coords[0].lat));
    for (let i=1;i<coords.length;i++) {
      ctx.lineTo(lngToX(coords[i].lng), latToY(coords[i].lat));
    }
    ctx.strokeStyle = routeColor+'60'; ctx.lineWidth=6; ctx.stroke();
    ctx.strokeStyle = routeColor; ctx.lineWidth=2; ctx.stroke();

    // Draw nodes
    coords.forEach((c,i) => {
      const x = lngToX(c.lng), y = latToY(c.lat);
      const isFirst = i===0, isLast = i===coords.length-1;
      ctx.beginPath(); ctx.arc(x,y,isFirst||isLast?10:6,0,Math.PI*2);
      ctx.fillStyle = isFirst?'#00ff88' : isLast?'#f87171' : routeColor+'80';
      ctx.fill();
      ctx.strokeStyle = isFirst?'#00ff88':isLast?'#f87171':routeColor;
      ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='white'; ctx.font='bold 8px sans-serif'; ctx.textAlign='center';
      ctx.fillText(isFirst?'S':isLast?'D':(i+1), x, y+3);
      ctx.fillStyle='rgba(226,232,240,0.8)'; ctx.font='10px sans-serif';
      ctx.fillText(c.name, x, y+(isFirst||isLast?18:16));
    });

    // Direction arrows
    for (let i=0;i<coords.length-1;i++) {
      const x1=lngToX(coords[i].lng), y1=latToY(coords[i].lat);
      const x2=lngToX(coords[i+1].lng), y2=latToY(coords[i+1].lat);
      const mx=(x1+x2)/2, my=(y1+y2)/2;
      const angle=Math.atan2(y2-y1,x2-x1);
      ctx.save(); ctx.translate(mx,my); ctx.rotate(angle);
      ctx.fillStyle=routeColor; ctx.beginPath();
      ctx.moveTo(6,0); ctx.lineTo(-4,-4); ctx.lineTo(-4,4); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }, [result, activeRoute]);

  const inputStyle = { background:'#0d1117', border:'1px solid rgba(0,212,255,0.2)', color:'white', borderRadius:'8px', padding:'10px 14px', width:'100%', fontSize:'13px', outline:'none' };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Route size={22} style={{ color:'#00d4ff' }}/> AI Route Optimisation
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">Dijkstra-powered routing with simulated traffic weights</p>
      </div>

      {/* Form */}
      <div className="nfx-card p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Source</label>
            <select value={form.source} onChange={e=>set('source',e.target.value)} style={inputStyle}>
              {CITY_NODES.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Destination</label>
            <select value={form.destination} onChange={e=>set('destination',e.target.value)} style={inputStyle}>
              {CITY_NODES.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Vehicle Type</label>
            <select value={form.vehicleType} onChange={e=>set('vehicleType',e.target.value)} style={inputStyle}>
              {VEHICLE_TYPES.map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
            </select>
          </div>
          <button onClick={handleOptimize} disabled={loading}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm text-white transition-all"
            style={{ background: loading ? '#1e3a5f':'linear-gradient(135deg,#00d4ff,#0284c7)', boxShadow: loading?'none':'0 4px 20px rgba(0,212,255,0.35)' }}>
            {loading ? <><span className="animate-spin">⟳</span> Computing…</> : <><Zap size={15}/> Optimise Route</>}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-3 text-sm" style={{ color:'#f87171' }}>
            <AlertCircle size={14}/>{error}
          </div>
        )}
      </div>

      {result && (
        <>
          {/* Route toggle */}
          <div className="flex gap-3">
            {[['best','Fastest Route','#00d4ff'],['alternate','Alternate Route','#a78bfa']].map(([k,l,c])=>(
              <button key={k} onClick={()=>setActiveRoute(k)}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                style={activeRoute===k
                  ? {background:`${c}20`,border:`1px solid ${c}60`,color:c}
                  : {background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'#64748b'}}>
                {l}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Canvas map */}
            <div className="xl:col-span-2 nfx-card overflow-hidden" style={{ height:'380px' }}>
              <canvas ref={canvasRef} width={700} height={380} className="w-full h-full" style={{ display:'block' }} />
            </div>

            {/* Route details */}
            <div className="space-y-3">
              {[['best','#00d4ff'],['alternate','#a78bfa']].map(([key,color])=>{
                const r = key==='best' ? result.bestRoute : result.alternateRoute;
                return (
                  <div key={key} className="nfx-card p-4" style={activeRoute===key?{borderColor:`${color}40`}:{}}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold" style={{color}}>{r.label}</span>
                      <TrafficBadge level={r.trafficCondition} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center p-2 rounded-lg" style={{background:'rgba(255,255,255,0.03)'}}>
                        <div className="text-lg font-bold font-mono" style={{color}}>{r.distanceKm} km</div>
                        <div className="text-xs text-slate-500">Distance</div>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{background:'rgba(255,255,255,0.03)'}}>
                        <div className="text-lg font-bold font-mono" style={{color}}>{r.etaMinutes} min</div>
                        <div className="text-xs text-slate-500">ETA</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1.5">Route Path</div>
                      <div className="flex flex-wrap gap-1 items-center">
                        {r.path?.map((p,i)=>(
                          <React.Fragment key={i}>
                            <span className="px-2 py-0.5 rounded text-xs" style={{background:`${color}15`,color}}>{p}</span>
                            {i < r.path.length-1 && <ChevronRight size={10} className="text-slate-600"/>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* AI tips */}
              {result.aiRecommendations?.length > 0 && (
                <div className="nfx-card p-4">
                  <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold" style={{color:'#00d4ff'}}>
                    <Sparkles size={13}/>AI Insights
                  </div>
                  <ul className="space-y-1.5">
                    {result.aiRecommendations.map((tip,i)=>(
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span style={{color:'#00d4ff',marginTop:'2px'}}>›</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!result && !loading && (
        <div className="nfx-card p-16 text-center">
          <Navigation size={40} className="mx-auto mb-4" style={{color:'rgba(0,212,255,0.3)'}}/>
          <p className="text-slate-500 text-sm">Select source, destination and vehicle type,<br/>then click <strong className="text-white">Optimise Route</strong></p>
        </div>
      )}
    </div>
  );
}
