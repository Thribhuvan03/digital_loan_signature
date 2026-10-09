import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPaperlessAudit } from '../services/api';
import { WorkflowTracker } from '../components/WorkflowTracker';
import { ShieldCheck, CheckCircle2, FileText, Lock, Clock, FileCheck } from 'lucide-react';

export const PaperlessOffice = ({ setActiveTab }) => {
  const { activeLoanData } = useAuth();
  const loan = activeLoanData?.loan;

  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loan?.id) {
      setLoading(true);
      getPaperlessAudit(loan.id)
        .then(res => setAuditData(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [loan?.id]);

  if (!loan) {
    return (
      <div>
        <WorkflowTracker setActiveTab={setActiveTab} />
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Lock size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>PAPERLESS VAULT IS EMPTY</h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            Submit a loan application to populate digital records in the Paperless Office Vault.
          </p>
          <button onClick={() => setActiveTab('apply')} className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
            Go to Step 1: Loan Application
          </button>
        </div>
      </div>
    );
  }

  const borrowerName = loan.full_name || 'Thribhuvan';
  const ekyc = auditData?.ekyc;
  const docs = auditData?.documents || [];
  const underwriting = auditData?.underwriting;
  const review = auditData?.officerReview;
  const agreement = auditData?.agreement;
  const estamp = auditData?.estamp;
  const esign = auditData?.esign;
  const disbursement = auditData?.disbursement;
  const auditLogs = auditData?.auditLogs || [];

  const vaultItems = [
    { title: 'Loan Application Form', status: 'SUBMITTED', ref: loan.id, detail: `Applied for ₹${loan.requested_amount.toLocaleString('en-IN')}` },
    { title: 'Aadhaar eKYC Verification Record', status: ekyc ? 'VERIFIED' : 'PENDING', ref: ekyc ? `UIDAI-${ekyc.aadhaar_ref}` : 'N/A', detail: ekyc ? `Verified ${ekyc.verification_timestamp}` : 'Not verified' },
    { title: 'DigiLocker Government Documents (5/5)', status: docs.length === 5 ? 'VERIFIED' : 'PENDING', ref: `${docs.length}/5 Docs`, detail: 'Aadhaar, PAN, Salary Slips, Bank Statement, Address' },
    { title: '14-Rule Automated Underwriting Certificate', status: underwriting ? 'COMPLETED' : 'PENDING', ref: underwriting ? `Score: ${underwriting.score}%` : 'N/A', detail: underwriting ? `${underwriting.passed_rules}/14 Rules Passed` : 'Pending evaluation' },
    { title: 'Credit Officer Review & Approval Log', status: review ? review.decision : 'PENDING', ref: review ? review.officer_email : 'N/A', detail: review ? `Reviewed ${review.reviewed_at}` : 'Pending officer approval' },
    { title: 'Digital Loan Agreement Contract', status: agreement ? 'GENERATED' : 'PENDING', ref: agreement ? agreement.id : 'N/A', detail: agreement ? `EMI ₹${agreement.emi_amount.toLocaleString('en-IN')}` : 'Pending generation' },
    { title: 'eStamp Duty Certificate (₹500)', status: estamp ? 'VALID' : 'PENDING', ref: estamp ? estamp.estamp_reference : 'N/A', detail: estamp ? `Hash: ${estamp.document_hash.substring(0, 16)}...` : 'Pending payment' },
    { title: 'Aadhaar eSign OTP Signature Record', status: esign ? 'SIGNED' : 'PENDING', ref: esign ? esign.signature_reference : 'N/A', detail: esign ? `Signed ${esign.signed_at}` : 'Pending eSign' },
    { title: 'Core Banking Disbursement Receipt', status: disbursement ? 'DISBURSED' : 'PENDING', ref: disbursement ? disbursement.transaction_reference : 'N/A', detail: disbursement ? `Disbursed ₹${disbursement.amount.toLocaleString('en-IN')}` : 'Pending disbursement' }
  ];

  return (
    <div>
      <WorkflowTracker setActiveTab={setActiveTab} />

      {/* Header Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              DIGITAL ARCHIVE & AUDIT VAULT
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem' }}>
              Paperless Office Module
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Borrower: <strong>{borrowerName}</strong> | Application ID: <strong>{loan.id}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.75rem 1.25rem', borderRadius: '10px' }}>
            <ShieldCheck size={32} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>CRYPTOGRAPHIC INTEGRITY</div>
              <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.9rem' }}>SHA-256 TAMPER-PROOF</div>
            </div>
          </div>
        </div>
      </div>

      {/* 9 Digital Record Vault Grid */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
        PAPERLESS DIGITAL DOCUMENT VAULT (100% PAPERLESS)
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {vaultItems.map((item, idx) => {
          const isDone = item.status === 'VERIFIED' || item.status === 'COMPLETED' || item.status === 'APPROVED' || item.status === 'GENERATED' || item.status === 'VALID' || item.status === 'SIGNED' || item.status === 'DISBURSED' || item.status === 'SUBMITTED';

          return (
            <div key={idx} className="card" style={{ marginBottom: 0, borderLeft: `4px solid ${isDone ? '#10b981' : '#cbd5e1'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>RECORD #{idx + 1}</span>
                <span className={`badge ${isDone ? 'badge-verified' : 'badge-pending'}`}>
                  {item.status}
                </span>
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{item.title}</h4>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', marginTop: '0.35rem' }}>
                {item.ref}
              </div>
              <p style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '0.2rem' }}>
                {item.detail}
              </p>
            </div>
          );
        })}
      </div>

      {/* Complete Audit Trail Timeline */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="#2563eb" /> CHRONOLOGICAL AUDIT TRAIL TIMELINE
        </h3>

        {auditLogs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            No audit events recorded yet.
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid #e2e8f0' }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <div style={{
                  position: 'absolute',
                  left: '-2.1rem',
                  top: '0.2rem',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem'
                }}>
                  ✓
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{log.action}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{log.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#334155' }}>{log.details}</div>
                  <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700, marginTop: '0.35rem' }}>
                    Actor: {log.actor}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
