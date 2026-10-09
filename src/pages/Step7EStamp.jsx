import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateEstamp } from '../services/api';
import { WorkflowTracker } from '../components/WorkflowTracker';
import { Stamp, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

export const Step7EStamp = ({ setActiveTab }) => {
  const { activeLoanData, refreshLoan, addToast } = useAuth();
  const loan = activeLoanData?.loan;
  const agreement = activeLoanData?.agreement;
  const estamp = activeLoanData?.estamp;

  const [loading, setLoading] = useState(false);

  if (!loan || loan.current_step < 6) {
    return (
      <div>
        <WorkflowTracker setActiveTab={setActiveTab} />
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Lock size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>STEP 7: eSTAMP DUTY IS LOCKED</h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            Digital Loan Agreement contract must be generated in Step 6 before executing state eStamp duty integration.
          </p>
          <button onClick={() => setActiveTab('agreement')} className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
            Go to Step 6: Agreement
          </button>
        </div>
      </div>
    );
  }

  const handleGenerateEstamp = async () => {
    setLoading(true);
    try {
      const res = await generateEstamp(loan.id);
      addToast(`eStamp Duty Certificate ${res.estampReference} generated successfully!`, 'success');
      await refreshLoan();
      // ABSOLUTELY NO AUTO-NAVIGATION! User stays on page.
    } catch (err) {
      addToast(err.message || 'Failed to generate eStamp', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isStamped = !!estamp;
  const borrowerName = loan.full_name || 'Thribhuvan';

  return (
    <div>
      <WorkflowTracker setActiveTab={setActiveTab} />

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', pb: '1rem' }}>
          <div>
            <span className={`badge ${isStamped ? 'badge-verified' : 'badge-in-progress'}`} style={{ marginBottom: '0.4rem' }}>
              {isStamped ? 'VALID eSTAMP' : 'STEP 7 OF 9'}
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              eStamp Duty Certificate Generation
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Digital revenue stamp payment under Indian Stamp Act 1899 with SHCIL / State Treasury registry
            </p>
          </div>

          {!isStamped && (
            <button
              onClick={handleGenerateEstamp}
              disabled={loading}
              className="btn btn-lg btn-primary"
            >
              <Stamp size={18} /> {loading ? 'Generating eStamp...' : 'GENERATE eSTAMP'}
            </button>
          )}
        </div>

        {!isStamped ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #cbd5e1' }}>
            <Stamp size={44} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Ready to Pay eStamp Duty</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
              Click <strong>GENERATE eSTAMP</strong> to issue the ₹500 digital stamp duty certificate for <strong>{borrowerName}</strong> (Agreement: {agreement.id}).
            </p>
          </div>
        ) : (
          <div>
            <div style={{
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              borderRadius: '10px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={26} color="#059669" />
                <div>
                  <div style={{ fontWeight: 800, color: '#065f46', fontSize: '1rem' }}>
                    ✓ eStamp Certificate Attached: {estamp.estamp_reference}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '0.2rem' }}>
                    Step 8 (eSign + OTP) is now <strong>UNLOCKED</strong>. Please manually navigate to eSign using the sidebar or workflow tracker.
                  </div>
                </div>
              </div>
            </div>

            {/* Official eStamp Certificate Preview Box */}
            <div style={{
              border: '2px dashed #059669',
              borderRadius: '12px',
              padding: '2rem',
              backgroundColor: '#f0fdf4',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #059669', pb: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldCheck size={36} color="#059669" />
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#065f46' }}>e-STAMP DUTY CERTIFICATE</h3>
                    <p style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>GOVERNMENT OF KARNATAKA / SHCIL STAMP REGISTRY</p>
                  </div>
                </div>
                <div className="badge badge-verified" style={{ background: '#059669', color: 'white', fontSize: '0.85rem' }}>
                  STAMP DUTY PAID: ₹500
                </div>
              </div>

              <div className="form-grid" style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                <div><strong>Certificate Reference:</strong> <span style={{ color: '#2563eb', fontWeight: 800 }}>{estamp.estamp_reference}</span></div>
                <div><strong>Agreement Reference:</strong> {estamp.agreement_id}</div>
                <div><strong>First Party (Lender):</strong> National Digital Bank Ltd</div>
                <div><strong>Second Party (Borrower):</strong> {borrowerName}</div>
                <div><strong>Stamp Duty Paid:</strong> ₹{estamp.stamp_duty_amount} INR</div>
                <div><strong>Issue Date & Time:</strong> {estamp.issue_date}</div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Cryptographic Document Hash (SHA-256):</strong>
                  <code style={{ display: 'block', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.75rem', color: '#0f172a', wordBreak: 'break-all', marginTop: '0.25rem' }}>
                    {estamp.document_hash}
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
