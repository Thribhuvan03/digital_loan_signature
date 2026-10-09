import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, RotateCcw, LogOut } from 'lucide-react';

export const Header = () => {
  const { user, logout, resetDemo } = useAuth();

  return (
    <header style={{
      height: '70px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
        }}>
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
            DIGITAL LOAN <span style={{ color: '#2563eb' }}>AGREEMENT SIGNING</span>
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
            eSign, eStamp & Paperless Office Platform
          </p>
        </div>
      </div>

      {/* Reset Demo Button & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={resetDemo}
          className="btn btn-sm btn-outline"
          style={{ color: '#dc2626', borderColor: '#fecaca' }}
          title="Reset system database to clean initial state"
        >
          <RotateCcw size={15} /> RESET DEMO
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid #e2e8f0' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: user.role === 'OFFICER' ? '#059669' : '#2563eb', fontWeight: 700 }}>
                {user.role}
              </div>
            </div>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: user.role === 'OFFICER' ? '#ecfdf5' : '#eff6ff',
              color: user.role === 'OFFICER' ? '#059669' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              border: `2px solid ${user.role === 'OFFICER' ? '#a7f3d0' : '#bfdbfe'}`
            }}>
              {user.name.charAt(0)}
            </div>
            <button
              onClick={logout}
              className="btn btn-sm btn-outline"
              style={{ padding: '0.4rem' }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};
