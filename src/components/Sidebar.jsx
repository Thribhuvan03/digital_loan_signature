import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  UserCheck,
  FolderSearch,
  Calculator,
  FileSignature,
  Stamp,
  CheckCircle2,
  Banknote,
  FileDown,
  Archive,
  Bell,
  User,
  ShieldAlert,
  ClipboardList
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, activeLoanData } = useAuth();
  const step = activeLoanData?.loan?.current_step || 0;

  const isOfficer = user?.role === 'OFFICER';

  const customerNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, stepRequired: 0 },
    { id: 'apply', label: 'Apply Loan', icon: FilePlus, stepRequired: 0 },
    { id: 'my-loans', label: 'My Loans', icon: FileText, stepRequired: 1 },
    { id: 'ekyc', label: 'eKYC', icon: UserCheck, stepRequired: 1 },
    { id: 'documents', label: 'Documents', icon: FolderSearch, stepRequired: 2 },
    { id: 'underwriting', label: 'Underwriting', icon: Calculator, stepRequired: 3 },
    { id: 'agreement', label: 'Agreement', icon: FileSignature, stepRequired: 5 }, // Unlocked after Officer Approval (Step 5)
    { id: 'estamp', label: 'eStamp', icon: Stamp, stepRequired: 6 },
    { id: 'esign', label: 'eSign', icon: CheckCircle2, stepRequired: 7 },
    { id: 'disbursement', label: 'Disbursement', icon: Banknote, stepRequired: 8 },
    { id: 'signed-pdfs', label: 'Signed PDFs', icon: FileDown, stepRequired: 8 },
    { id: 'paperless', label: 'Paperless Office', icon: Archive, stepRequired: 1 },
    { id: 'notifications', label: 'Notifications', icon: Bell, stepRequired: 0 },
    { id: 'profile', label: 'Profile', icon: User, stepRequired: 0 }
  ];

  const officerNav = [
    { id: 'officer-dashboard', label: 'Officer Dashboard', icon: ClipboardList },
    { id: 'paperless', label: 'Audit Records', icon: Archive },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const navItems = isOfficer ? officerNav : customerNav;

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#0f172a',
      color: '#94a3b8',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 70px)',
      borderRight: '1px solid #1e293b'
    }}>
      {/* Sidebar Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1e293b' }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700 }}>
          {isOfficer ? 'CREDIT OFFICER PANEL' : 'CUSTOMER PORTAL'}
        </div>
        {activeLoanData?.loan && (
          <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
            Active Ref: {activeLoanData.loan.id}
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem' }}>
        <ul style={{ listStyle: 'none' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            const isLocked = !isOfficer && item.stepRequired > 0 && step < item.stepRequired;

            return (
              <li key={item.id} style={{ marginBottom: '0.25rem' }}>
                <button
                  onClick={() => !isLocked && setActiveTab(item.id)}
                  disabled={isLocked}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isSelected ? '#2563eb' : 'transparent',
                    color: isSelected ? '#ffffff' : isLocked ? '#475569' : '#cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isLocked) e.currentTarget.style.backgroundColor = '#1e293b';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={18} style={{ opacity: isSelected ? 1 : 0.7 }} />
                    <span>{item.label}</span>
                  </div>

                  {!isOfficer && isLocked && (
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>🔒</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Secure Platform Badge */}
      <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', background: '#090d16', fontSize: '0.75rem' }}>
        <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldAlert size={14} color="#38bdf8" /> SECURE BANKING GATEWAY
        </div>
        <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
          Aadhaar eKYC & eSign Certified Gateway | IT Act 2000 Compliant
        </div>
      </div>
    </aside>
  );
};
