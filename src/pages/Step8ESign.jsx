import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendEsignOtp, verifyEsignOtp } from '../services/api';
import { WorkflowTracker } from '../components/WorkflowTracker';
import { SignedPdfView } from './SignedPdfView';
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

export const Step8ESign = ({ setActiveTab }) => {
  const { activeLoanData, refreshLoan, addToast } = useAuth();
  const loan = activeLoanData?.loan;
  const agreement = activeLoanData?.agreement;
  const estamp = activeLoanData?.estamp;
  const esign = activeLoanData?.esign;

  const [agreed, setAgreed] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!loan || loan.current_step < 7) {
    return (
      <div>
        <WorkflowTracker setActiveTab={setActiveTab} />
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Lock size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>STEP 8: eSIGN + OTP IS LOCKED</h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            eStamp Duty certificate must be attached in Step 7 before digital signature execution.
          </p>
          <button onClick={() => setActiveTab('estamp')} className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
            Go to Step 7: eStamp
          </button>
        </div>
      </div>
    );
  }

  const isSigned = !!esign;
  const borrowerName = loan.full_name || 'Thribhuvan';

  const handleSendOtp = async () => {
    if (!agreed) {
      addToast('Please accept the terms & conditions checkbox first', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await sendEsignOtp(loan.id);
      setOtpSent(true);
      setOtpInput(''); // Empty so user types manually
      addToast(res.message || 'Aadhaar eSign OTP sent to your registered email address.', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to send verification code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyEsignOtp(loan.id, otpInput);
      addToast(`AGREEMENT SIGNED SUCCESSFULLY! Signature Ref: ${res.signatureReference}`, 'success');
      await refreshLoan();
      // NO AUTO-NAVIGATION! Stay on page.
    } catch (err) {
      addToast(err.message || 'Invalid verification code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <WorkflowTracker setActiveTab={setActiveTab} />

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', pb: '1rem' }}>
          <div>
            <span className={`badge ${isSigned ? 'badge-verified' : 'badge-in-progress'}`} style={{ marginBottom: '0.4rem' }}>
              {isSigned ? 'AGREEMENT SIGNED' : 'STEP 8 OF 9'}
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              Aadhaar Digital Signature Execution (eSign + OTP)
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Legal digital signature authentication under Section 3A of Information Technology Act 2000
            </p>
          </div>
        </div>

        {/* Contract Summary */}
        <div className="form-grid" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>BORROWER NAME</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{borrowerName}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>AGREEMENT REF</span>
            <div style={{ fontWeight: 800, color: '#2563eb' }}>{agreement.id}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>eSTAMP REFERENCE</span>
            <div style={{ fontWeight: 800, color: '#059669' }}>{estamp.estamp_reference}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>LOAN AMOUNT</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>₹{loan.requested_amount.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {!isSigned ? (
          <div style={{ maxWidth: '540px', margin: '0 auto', background: '#ffffff', padding: '1.75rem', borderRadius: '16px', border: '1.5px solid #cbd5e1', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <input
                type="checkbox"
                id="consentCheck"
                style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '0.15rem' }}
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="consentCheck" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer', lineHeight: '1.4' }}>
                I have read and agree to all terms and conditions of Digital Loan Agreement #{agreement.id}.
              </label>
            </div>

            {!otpSent ? (
              <button
                onClick={handleSendOtp}
                disabled={loading || !agreed}
                className="btn btn-lg btn-primary"
                style={{ width: '100%', height: '48px', fontWeight: 800 }}
              >
                {loading ? 'Sending Verification Code...' : 'SEND OTP FOR eSIGN'}
              </button>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                    ENTER SIGNATURE VERIFICATION CODE
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ textAlign: 'center', fontSize: '1.35rem', letterSpacing: '0.4em', fontWeight: 800, height: '48px' }}
                    maxLength="6"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-lg btn-success"
                  style={{ width: '100%', height: '48px', fontWeight: 800 }}
                >
                  {loading ? 'Authenticating Signature...' : 'VERIFY & SIGN'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div style={{
            background: '#ecfdf5',
            border: '2px solid #10b981',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem', color: '#047857' }}>
              <CheckCircle2 size={32} />
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>✓ AGREEMENT SIGNED SUCCESSFULLY</h3>
                <p style={{ fontSize: '0.85rem', color: '#065f46' }}>Cryptographically signed via Aadhaar eSign OTP authentication</p>
              </div>
            </div>

            <div className="form-grid" style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #a7f3d0', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SIGNER</span>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{esign.signer_name}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SIGNATURE REFERENCE</span>
                <div style={{ fontWeight: 800, color: '#2563eb' }}>{esign.signature_reference}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SIGNED TIMESTAMP</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{esign.signed_at}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>eSIGN STATUS</span>
                <div><span className="badge badge-verified">SIGNED</span></div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '0.85rem 1rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #a7f3d0', fontSize: '0.85rem', color: '#047857', fontWeight: 700 }}>
              Step 9 (Disbursement) is now <strong>UNLOCKED</strong>. Please select Disbursement from the navigation bar to proceed.
            </div>

            {/* Download PDF Action Component */}
            <SignedPdfView />
          </div>
        )}
      </div>
    </div>
  );
};
