import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  UserCheck,
  FolderSearch,
  Calculator,
  UserCheck2,
  FileSignature,
  Stamp,
  CheckCircle2,
  Banknote,
  Lock,
  Check
} from 'lucide-react';

export const WorkflowTracker = ({ setActiveTab }) => {
  const { activeLoanData } = useAuth();
  const loan = activeLoanData?.loan;
  const currentStep = loan?.current_step || 0;
  const status = loan?.status || 'NO_LOAN';

  const steps = [
    { id: 1, label: '1. Loan Application', tab: 'apply', icon: FileText },
    { id: 2, label: '2. eKYC', tab: 'ekyc', icon: UserCheck },
    { id: 3, label: '3. Documents', tab: 'documents', icon: FolderSearch },
    { id: 4, label: '4. Underwriting', tab: 'underwriting', icon: Calculator },
    { id: 5, label: '5. Officer Review', tab: 'officer-dashboard', icon: UserCheck2 },
    { id: 6, label: '6. Agreement', tab: 'agreement', icon: FileSignature },
    { id: 7, label: '7. eStamp', tab: 'estamp', icon: Stamp },
    { id: 8, label: '8. eSign + OTP', tab: 'esign', icon: CheckCircle2 },
    { id: 9, label: '9. Disbursement', tab: 'disbursement', icon: Banknote }
  ];

  const getStepState = (stepId) => {
    if (!loan) {
      return stepId === 1 ? { state: 'PENDING', badge: 'badge-pending' } : { state: 'LOCKED', badge: 'badge-locked' };
    }

    if (stepId < currentStep) {
      return { state: 'COMPLETED', badge: 'badge-completed' };
    } else if (stepId === currentStep) {
      // Check if step itself is finished
      if (stepId === 1 && status !== 'SUBMITTED') return { state: 'COMPLETED', badge: 'badge-completed' };
      if (stepId === 2 && (status === 'KYC_VERIFIED' || status === 'DOCS_VERIFIED')) return { state: 'COMPLETED', badge: 'badge-completed' };
      if (stepId === 3 && status === 'DOCS_VERIFIED') return { state: 'COMPLETED', badge: 'badge-completed' };
      if (stepId === 4 && status === 'UNDERWRITTEN') return { state: 'COMPLETED', badge: 'badge-completed' };
      if (stepId === 5 && status === 'APPROVED') return { state: 'COMPLETED', badge: 'badge-completed' };
      if (stepId === 6 && status === 'AGREEMENT_GENERATED') return { state: 'COMPLETED', badge: 'badge-completed' };
      if (stepId === 7 && status === 'STAMPED') return { state: 'COMPLETED', badge: 'badge-completed' };
      if (stepId === 8 && status === 'SIGNED') return { state: 'COMPLETED', badge: 'badge-completed' };
      if (stepId === 9 && status === 'DISBURSED') return { state: 'COMPLETED', badge: 'badge-completed' };

      return { state: 'IN PROGRESS', badge: 'badge-in-progress' };
    } else if (stepId === currentStep + 1) {
      return { state: 'PENDING', badge: 'badge-pending' };
    } else {
      return { state: 'LOCKED', badge: 'badge-locked' };
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
            WORKFLOW PROGRESS TRACKER
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Sequential end-to-end loan execution status
          </p>
        </div>
        {loan && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>OVERALL STATUS:</span>
            <span className={`badge badge-${status.toLowerCase().replace('_', '-')}`}>
              {status}
            </span>
          </div>
        )}
      </div>

      {/* Stepper horizontal grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(9, 1fr)',
        gap: '0.5rem',
        position: 'relative'
      }}>
        {steps.map((s) => {
          const { state, badge } = getStepState(s.id);
          const isCurrent = state === 'IN PROGRESS';
          const isCompleted = state === 'COMPLETED';
          const isLocked = state === 'LOCKED';
          const Icon = s.icon;

          return (
            <div
              key={s.id}
              onClick={() => !isLocked && setActiveTab(s.tab)}
              style={{
                background: isCurrent ? '#eff6ff' : isCompleted ? '#f0fdf4' : '#f8fafc',
                border: `1.5px solid ${isCurrent ? '#2563eb' : isCompleted ? '#86efac' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '0.6rem 0.4rem',
                textAlign: 'center',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              {/* Top Step Icon */}
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: isCompleted ? '#10b981' : isCurrent ? '#2563eb' : '#cbd5e1',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.35rem auto',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {isCompleted ? <Check size={14} /> : isLocked ? <Lock size={12} /> : s.id}
              </div>

              {/* Title */}
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: isCurrent ? '#1d4ed8' : isCompleted ? '#166534' : '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {s.label.split('. ')[1]}
              </div>

              {/* Status Badge */}
              <div style={{ marginTop: '0.35rem' }}>
                <span className={`badge ${badge}`} style={{ fontSize: '0.6rem', padding: '0.15rem 0.35rem' }}>
                  {state}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
