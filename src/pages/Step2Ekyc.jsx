import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendEkycOtp, verifyEkycOtp } from '../services/api';
import { maskEmail } from '../utils';
import { WorkflowTracker } from '../components/WorkflowTracker';
import { UserCheck, CheckCircle2, Lock, Mail } from 'lucide-react';

export const Step2Ekyc = ({ setActiveTab }) => {
  const { user, activeLoanData, refreshLoan, addToast } = useAuth();
  const loan = activeLoanData?.loan;
  const ekyc = activeLoanData?.ekyc;

  // STRICT REQUIREMENT: Initial state is ALWAYS false. No automatic OTP dispatch on page load.
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState(ekyc ? {
    name: ekyc.verified_name || 'Thribhuvan',
    dob: ekyc.verified_dob,
    gender: ekyc.verified_gender,
    address: ekyc.verified_address,
    mobile: ekyc.mobile
  } : null);

  if (!loan) {
    return (
      <div>
        <WorkflowTracker setActiveTab={setActiveTab} />
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Lock size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>STEP 2: eKYC IS LOCKED</h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            You must complete and submit Step 1 (Loan Application) before initiating eKYC identity verification.
          </p>
          <button onClick={() => setActiveTab('apply')} className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
            Go to Step 1: Loan Application
          </button>
        </div>
      </div>
    );
  }

  const registeredEmail = user?.email || loan?.email || '';
  const isVerified = ekyc || verifiedData;

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const res = await sendEkycOtp(loan.id);
      setOtpSent(true);
      setOtpInput(''); // Empty field for manual entry
      addToast(res.message || 'Verification OTP has been sent to your registered email address.', 'info');
    } catch (err) {
      addToast(err.message || 'Unable to send verification OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyEkycOtp(loan.id, otpInput);
      setVerifiedData(res.verifiedData);
      addToast('Identity authenticated successfully via UIDAI Aadhaar Vault!', 'success');
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
            <span className={`badge ${isVerified ? 'badge-verified' : 'badge-in-progress'}`} style={{ marginBottom: '0.4rem' }}>
              {isVerified ? 'IDENTITY VERIFIED' : 'STEP 2 OF 9'}
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              Aadhaar eKYC Identity Verification
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              UIDAI Aadhaar OTP-based paperless identity authentication
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>APPLICATION ID</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb' }}>{loan.id}</div>
          </div>
        </div>

        {/* Application Details Summary */}
        <div className="form-grid" style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>APPLICANT NAME</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{loan.full_name || 'Thribhuvan'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>AADHAAR REFERENCE</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{loan.aadhaar}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>REGISTERED EMAIL</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{maskEmail(registeredEmail)}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>VERIFICATION STATUS</span>
            <div>
              <span className={`badge ${isVerified ? 'badge-verified' : 'badge-pending'}`}>
                {isVerified ? 'VERIFIED' : 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        {/* OTP Action or Verified Results */}
        {!isVerified ? (
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '480px',
            margin: '0 auto',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <UserCheck size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>UIDAI Aadhaar Identity Authentication</h3>
            
            {!otpSent ? (
              <>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem', marginBottom: '1.5rem' }}>
                  To verify your identity, request a verification code sent to your registered email address (<strong>{maskEmail(registeredEmail)}</strong>).
                </p>
                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="btn btn-lg btn-primary"
                  style={{ width: '100%', height: '46px', fontWeight: 800 }}
                >
                  {loading ? 'Sending Verification Code...' : 'SEND OTP'}
                </button>
              </>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div style={{
                  padding: '0.85rem',
                  background: '#ecfdf5',
                  borderRadius: '10px',
                  border: '1px solid #a7f3d0',
                  marginBottom: '1.25rem',
                  fontSize: '0.825rem',
                  color: '#047857',
                  fontWeight: 700
                }}>
                  <Mail size={18} color="#059669" style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
                  ✓ Verification code sent to your registered email address.
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', textAlign: 'left' }}>
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ textAlign: 'center', fontSize: '1.35rem', letterSpacing: '0.4em', fontWeight: 800, height: '48px' }}
                    maxLength="6"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpInput.length !== 6}
                  className="btn btn-lg btn-success"
                  style={{ width: '100%', height: '46px', fontWeight: 800 }}
                >
                  {loading ? 'Authenticating Code...' : 'VERIFY OTP'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div style={{
            background: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            borderRadius: '16px',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem', color: '#047857' }}>
              <CheckCircle2 size={32} />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>✓ Identity Verified</h3>
                <p style={{ fontSize: '0.825rem', color: '#065f46' }}>
                  Aadhaar eKYC verified via UIDAI Email OTP authentication
                </p>
              </div>
            </div>

            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
              AUTHENTICATED DEMOGRAPHIC PROFILE:
            </h4>

            <div className="form-grid" style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>FULL NAME</span>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{verifiedData.name}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DATE OF BIRTH</span>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{verifiedData.dob}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>GENDER</span>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{verifiedData.gender}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>REGISTERED MOBILE</span>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{verifiedData.mobile}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>VERIFIED RESIDENTIAL ADDRESS</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{verifiedData.address}</div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #a7f3d0', fontSize: '0.85rem', color: '#047857', fontWeight: 700 }}>
              Step 3 (Documents) is now <strong>UNLOCKED</strong>. Please select Documents from the navigation bar to proceed.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
