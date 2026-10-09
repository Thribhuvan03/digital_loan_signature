import React from 'react';
import { useAuth } from '../context/AuthContext';
import { WorkflowTracker } from '../components/WorkflowTracker';
import {
  FilePlus,
  UserCheck,
  FolderSearch,
  Calculator,
  FileSignature,
  Stamp,
  CheckCircle2,
  Banknote,
  ArrowRight,
  ShieldCheck,
  Clock,
  Award
} from 'lucide-react';

export const CustomerDashboard = ({ setActiveTab }) => {
  const { user, activeLoanData } = useAuth();
  const loan = activeLoanData?.loan;
  const ekyc = activeLoanData?.ekyc;
  const docs = activeLoanData?.documents || [];
  const underwriting = activeLoanData?.underwriting;
  const agreement = activeLoanData?.agreement;
  const estamp = activeLoanData?.estamp;
  const esign = activeLoanData?.esign;
  const disbursement = activeLoanData?.disbursement;

  const displayName = user?.name || 'Thribhuvan';

  const isUnderReview = loan?.status === 'UNDERWRITTEN';
  const isApproved = loan?.status === 'APPROVED' || loan?.status === 'AGREEMENT_GENERATED' || loan?.status === 'STAMPED' || loan?.status === 'SIGNED' || loan?.status === 'DISBURSED';

  const cards = [
    {
      title: 'Loan Application',
      tab: 'apply',
      icon: FilePlus,
      status: loan ? loan.status : 'NOT STARTED',
      value: loan ? `₹${loan.requested_amount.toLocaleString('en-IN')} (${loan.tenure_months} Mo)` : 'Not Submitted',
      description: loan ? `App ID: ${loan.id}` : 'Fill loan application form'
    },
    {
      title: 'eKYC Verification',
      tab: 'ekyc',
      icon: UserCheck,
      status: ekyc ? 'VERIFIED' : loan ? 'PENDING' : 'LOCKED',
      value: ekyc ? 'Aadhaar Verified' : 'UIDAI OTP Check',
      description: ekyc ? `Verified on ${ekyc.verification_timestamp}` : 'Authenticate via Aadhaar OTP'
    },
    {
      title: 'Document Fetch',
      tab: 'documents',
      icon: FolderSearch,
      status: docs.length === 5 ? 'COMPLETED' : loan?.current_step >= 2 ? 'PENDING' : 'LOCKED',
      value: docs.length > 0 ? `${docs.length}/5 Verified` : 'DigiLocker Integration',
      description: 'Aadhaar, PAN, Salary Slips, Bank Statement'
    },
    {
      title: 'Credit Underwriting',
      tab: 'underwriting',
      icon: Calculator,
      status: underwriting ? 'COMPLETED' : loan?.current_step >= 3 ? 'PENDING' : 'LOCKED',
      value: underwriting ? `${underwriting.passed_rules}/14 Rules Passed` : '14 Algorithmic Rules',
      description: underwriting ? `Score: ${underwriting.score}% - ${underwriting.final_result}` : 'Automated risk evaluation'
    },
    {
      title: 'Digital Agreement',
      tab: 'agreement',
      icon: FileSignature,
      status: agreement ? 'GENERATED' : isApproved ? 'READY' : isUnderReview ? 'UNDER REVIEW' : 'LOCKED',
      value: agreement ? `Ref: ${agreement.id}` : isApproved ? 'Ready to Generate' : 'Credit Officer Review',
      description: agreement ? `EMI: ₹${agreement.emi_amount.toLocaleString('en-IN')}` : 'Requires Senior Officer Approval'
    },
    {
      title: 'eStamp Certificate',
      tab: 'estamp',
      icon: Stamp,
      status: estamp ? 'VALID' : loan?.current_step >= 6 ? 'PENDING' : 'LOCKED',
      value: estamp ? `Ref: ${estamp.estamp_reference}` : '₹500 Stamp Duty',
      description: estamp ? 'Digital Certificate Attached' : 'State Stamp Duty payment'
    },
    {
      title: 'Aadhaar eSign',
      tab: 'esign',
      icon: CheckCircle2,
      status: esign ? 'SIGNED' : loan?.current_step >= 7 ? 'PENDING' : 'LOCKED',
      value: esign ? `Ref: ${esign.signature_reference}` : 'Aadhaar OTP Signature',
      description: esign ? `Signed at ${esign.signed_at}` : 'Cryptographic legal signature'
    },
    {
      title: 'Bank Disbursement',
      tab: 'disbursement',
      icon: Banknote,
      status: disbursement ? 'DISBURSED' : loan?.current_step >= 8 ? 'PENDING' : 'LOCKED',
      value: disbursement ? `Ref: ${disbursement.transaction_reference}` : 'Core Banking Gateway',
      description: disbursement ? `₹${disbursement.amount.toLocaleString('en-IN')} Transferred` : 'NEFT / RTGS fund transfer'
    }
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        padding: '2.25rem',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.3)'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            APPLICANT DASHBOARD
          </span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, marginTop: '0.2rem' }}>
            Welcome back, {displayName}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Manage your digital loan agreement, eKYC, eStamp, eSign, and disbursement execution.
          </p>
        </div>

        <div>
          {!loan ? (
            <button onClick={() => setActiveTab('apply')} className="btn btn-lg btn-primary" style={{ padding: '0.85rem 1.5rem', fontSize: '0.95rem', fontWeight: 800 }}>
              <FilePlus size={20} /> START NEW LOAN APPLICATION
            </button>
          ) : isUnderReview ? (
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fcd34d', padding: '0.85rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Clock size={20} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>APPLICATION UNDER REVIEW</div>
                <div style={{ fontSize: '0.75rem', color: '#fef3c7' }}>Awaiting Senior Credit Officer approval</div>
              </div>
            </div>
          ) : isApproved ? (
            <button onClick={() => setActiveTab('agreement')} className="btn btn-lg btn-success" style={{ padding: '0.85rem 1.5rem', fontSize: '0.95rem', fontWeight: 800 }}>
              <FileSignature size={20} /> PROCEED TO DIGITAL AGREEMENT <ArrowRight size={18} />
            </button>
          ) : (
            <button onClick={() => setActiveTab('paperless')} className="btn btn-lg btn-outline" style={{ color: 'white', borderColor: '#475569' }}>
              <ShieldCheck size={20} /> VIEW PAPERLESS AUDIT VAULT
            </button>
          )}
        </div>
      </div>

      {/* Under Review Notice Banner for Customer */}
      {isUnderReview && (
        <div style={{
          background: '#fffbeb',
          border: '1.5px solid #fde68a',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Clock size={32} color="#d97706" />
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#92400e' }}>
              APPLICATION UNDER OFFICER REVIEW
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#b45309', marginTop: '0.2rem' }}>
              Your loan application has passed automated underwriting with a 100% score (14/14 rules passed). It is currently being reviewed by Senior Credit Officer <strong>Priya Sharma</strong>. Please sign in as Officer (<code>officer@demo.com</code>) to evaluate and approve the application.
            </p>
          </div>
        </div>
      )}

      {/* Approved Banner for Customer */}
      {isApproved && loan?.status === 'APPROVED' && (
        <div style={{
          background: '#ecfdf5',
          border: '1.5px solid #a7f3d0',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Award size={32} color="#059669" />
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#065f46' }}>
                ✓ LOAN APPLICATION APPROVED!
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#047857', marginTop: '0.2rem' }}>
                Approved Amount: <strong>₹{loan.requested_amount.toLocaleString('en-IN')}</strong> | Senior Credit Officer <strong>Priya Sharma</strong> has approved your loan. You may now generate your Digital Loan Agreement.
              </p>
            </div>
          </div>
          <button onClick={() => setActiveTab('agreement')} className="btn btn-success">
            GENERATE AGREEMENT <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Prominent Workflow Tracker */}
      <WorkflowTracker setActiveTab={setActiveTab} />

      {/* Module Workflow Status Cards Grid */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
        MODULE WORKFLOW STATUS CARDS
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem'
      }}>
        {cards.map((c, idx) => {
          const Icon = c.icon;
          const isLocked = c.status === 'LOCKED';

          return (
            <div
              key={idx}
              className="card"
              style={{
                marginBottom: 0,
                opacity: isLocked ? 0.75 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                borderLeft: `4px solid ${
                  c.status === 'COMPLETED' || c.status === 'VERIFIED' || c.status === 'VALID' || c.status === 'SIGNED' || c.status === 'DISBURSED' || c.status === 'APPROVED'
                    ? '#10b981'
                    : c.status === 'GENERATED' || c.status === 'SUBMITTED' || c.status === 'READY'
                    ? '#2563eb'
                    : c.status === 'PENDING' || c.status === 'UNDER REVIEW'
                    ? '#f59e0b'
                    : '#cbd5e1'
                }`
              }}
              onClick={() => !isLocked && setActiveTab(c.tab)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb'
                }}>
                  <Icon size={20} />
                </div>
                <span className={`badge badge-${c.status.toLowerCase().replace(/ /g, '-')}`}>
                  {c.status}
                </span>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{c.title}</h4>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', marginTop: '0.35rem' }}>
                {c.value}
              </div>
              <p style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '0.2rem' }}>
                {c.description}
              </p>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.775rem', fontWeight: 700, color: isLocked ? '#94a3b8' : '#2563eb', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {isLocked ? 'Locked' : 'Open Module'} {!isLocked && <ArrowRight size={14} />}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
