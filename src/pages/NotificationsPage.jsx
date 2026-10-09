import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNotifications } from '../services/api';
import { Bell, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getNotifications(user.id)
        .then(res => setNotifications(res.notifications || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', pb: '1rem' }}>
        <Bell size={24} color="#2563eb" />
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>System Notifications & Activity Logs</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Real-time alerts for workflow progress, officer approvals, eSign, and disbursement</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          No notifications recorded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((n) => (
            <div key={n.id} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '1rem 1.25rem',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}>
              <CheckCircle2 color="#10b981" size={22} style={{ marginTop: '0.15rem' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{n.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{n.created_at}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
