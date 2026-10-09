import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { processDisbursement } from '../services/api';
import { WorkflowTracker } from '../components/WorkflowTracker';
import { Banknote, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

export const Step9Disbursement = ({ setActiveTab }) => {
  const { activeLoanData, refreshLoan, addToast } = useAuth();
  const loan = activeLoanData?.loan;
  const disbursement = activeLoanData?.disbursement;

  const [loading, setLoading] = useState(false);

  if (!loan || loan.current_step < 8) {
    return (
      <div>
        <WorkflowTracker setActiveTab={setActiveTab} />
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Lock size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>STEP 9: DISBURSEMENT IS LOCKED</h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            Agreement must be eSigned via Aadhaar OTP in Step 8 before triggering core banking fund transfer.
          </p>
          <button onClick={() => setActiveTab('esign')} className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
            Go to Step 8: eSign
          </button>
        </div>
      </div>
    );
  }

  const handleDisbursement = async () => {
    setLoading(true);
    try {
      const res = await processDisbursement(loan.id);
      addToast(`LOAN DISBURSED SUCCESSFULLY! Txn Ref: ${res.transactionReference}`, 'success');
      await refreshLoan();
      // ABSOLUTELY NO AUTO-NAVIGATION! User stays on page.
    } catch (err) {
      addToast(err.message || 'Failed to process disbursement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isDisbursed = !!disbursement;
  const borrowerName = loan.full_name || 'Thribhuvan';

  return (
    <div>
      <WorkflowTracker setActiveTab={setActiveTab} />

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', pb: '1rem' }}>
          <div>
            <span className={`badge ${isDisbursed ? 'badge-verified' : 'badge-in-progress'}`} style={{ marginBottom: '0.4rem' }}>
              {isDisbursed ? 'DISBURSED' : 'STEP 9 OF 9'}
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              Core Banking System Loan Disbursement
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Real-time NEFT / RTGS fund transfer execution directly to borrower's verified bank account
            </p>
          </div>

          {!isDisbursed && (
            <button
              onClick={handleDisbursement}
              disabled={loading}
              className="btn btn-lg btn-success"
            >
              <Banknote size={18} /> {loading ? 'Processing Transfer...' : 'PROCESS DISBURSEMENT'}
            </button>
          )}
        </div>

        {/* Readiness Summary */}
        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            COMPLETED WORKFLOW VERIFICATION CHECKLIST:
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>
            <div>✓ 1. Loan Application</div>
            <div>✓ 2. eKYC Verified</div>
            <div>✓ 3. 5/5 Docs Verified</div>
            <div>✓ 4. 14 Rules Passed</div>
            <div>✓ 5. Officer Approved</div>
            <div>✓ 6. Agreement Generated</div>
            <div>✓ 7. eStamp Paid</div>
            <div>✓ 8. eSigned via OTP</div>
          </div>
        </div>

        {!isDisbursed ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}>
            <Banknote size={48} color="#059669" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>READY FOR DISBURSEMENT</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
              Click <strong>PROCESS DISBURSEMENT</strong> to transfer <strong>₹{loan.requested_amount.toLocaleString('en-IN')}</strong> to <strong>{borrowerName}'s</strong> HDFC Bank Account.
            </p>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: 'white',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 12px 30px rgba(5, 150, 105, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={40} color="#ffffff" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900 }}>✓ LOAN DISBURSED SUCCESSFULLY</h3>
                <p style={{ fontSize: '0.9rem', color: '#a7f3d0' }}>
                  Transaction Completed via Core Banking Gateway
                </p>
              </div>
            </div>

            <div className="form-grid" style={{ background: '#ffffff', color: '#0f172a', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TRANSACTION REFERENCE</span>
                <div style={{ fontWeight: 800, color: '#059669', fontSize: '1.1rem' }}>{disbursement.transaction_reference}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>BENEFICIARY BORROWER</span>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{borrowerName}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DISBURSED AMOUNT</span>
                <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.1rem' }}>₹{disbursement.amount.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CREDITED ACCOUNT</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{disbursement.account_number} ({disbursement.bank_ifsc})</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DISBURSEMENT TIMESTAMP</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{disbursement.disbursed_at}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveTab('paperless')} className="btn btn-lg btn-outline" style={{ color: 'white', borderColor: 'white' }}>
                <ShieldCheck size={20} /> VIEW PAPERLESS AUDIT VAULT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
