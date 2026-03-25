import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Truck, Map, BookOpen, Route,
  Wrench, LogOut, Menu, X, Zap, Bell
} from 'lucide-react';

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/fleet',       icon: Truck,           label: 'Fleet'       },
  { to: '/map',         icon: Map,             label: 'Live Map'    },
  { to: '/bookings',    icon: BookOpen,        label: 'Bookings'    },
  { to: '/route',       icon: Route,           label: 'AI Routes'   },
  { to: '/maintenance', icon: Wrench,          label: 'Maintenance' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleColor = {
    ADMIN: 'text-yellow-400', FLEET_MANAGER: 'text-blue-400',
    DRIVER: 'text-green-400', CUSTOMER: 'text-purple-400'
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-dark)' }}>
      {/* Sidebar */}
      <aside className={`flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'}`}
        style={{ background: '#050b14', borderRight: '1px solid rgba(0,212,255,0.1)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#0284c7)' }}>
            <Zap size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-white font-bold text-sm leading-tight">NeuroFleetX</div>
              <div className="text-xs" style={{ color: '#00d4ff' }}>AI Mobility</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} className="ml-auto text-slate-400 hover:text-white">
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg mb-1 text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'linear-gradient(135deg,rgba(0,212,255,0.15),rgba(2,132,199,0.1))',
                borderLeft: '2px solid #00d4ff'
              } : {}}>
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#00d4ff33,#0284c733)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-semibold truncate">{user?.name}</div>
                <div className={`text-xs ${roleColor[user?.role] || 'text-slate-400'}`}>{user?.role}</div>
              </div>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center text-slate-500 hover:text-red-400">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.07)', background: 'rgba(5,11,20,0.8)' }}>
          <div>
            <h1 className="text-white font-bold text-lg">NeuroFleetX</h1>
            <p className="text-xs text-slate-500">AI-Driven Urban Mobility Platform</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              System Live
            </div>
            <button className="relative text-slate-400 hover:text-white">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">3</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 grid-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
