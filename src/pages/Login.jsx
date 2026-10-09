import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCaptcha, validateCaptchaApi, sendLoginOtp, verifyLoginOtp, loginOfficer } from '../services/api';
import { maskEmail } from '../utils';
import { ShieldCheck, User, Lock, ArrowRight, RefreshCw, Mail, CheckCircle2, KeyRound, Building2 } from 'lucide-react';

export const Login = ({ setActiveTab }) => {
  const { setSessionUser, addToast } = useAuth();
  const [roleTab, setRoleTab] = useState('CUSTOMER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // CAPTCHA State
  const [captchaData, setCaptchaData] = useState(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // Customer OTP State
  const [step, setStep] = useState(1); // 1 = Credentials & CAPTCHA, 2 = Email OTP
  const [otpInput, setOtpInput] = useState('');
  const [infoNotice, setInfoNotice] = useState('');

  // UI State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      const data = await getCaptcha();
      setCaptchaData(data);
      setCaptchaInput('');
    } catch (err) {
      console.error('Failed to load CAPTCHA', err);
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleRoleChange = (role) => {
    setRoleTab(role);
    setStep(1);
    setError('');
    setInfoNotice('');
    setEmail('');
    setPassword('');
    setOtpInput('');
    fetchCaptcha();
  };

  // CUSTOMER LOGIN FLOW (Credentials + CAPTCHA -> Send Email OTP -> Verify OTP)
  const handleCustomerSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoNotice('');
    setLoading(true);

    const startTime = performance.now();

    try {
      // Step 1: Ultra-fast server-side CAPTCHA validation (< 50ms on localhost)
      setStatusMsg('Validating Challenge...');
      const captchaRes = await validateCaptchaApi(captchaData?.captchaId, captchaInput);
      const captchaTime = Math.round(performance.now() - startTime);
      console.log(`[AUTH SPEED DIAGNOSTIC] CAPTCHA validated successfully in ${captchaTime}ms`);

      // Step 2: Update UI state immediately & trigger real email OTP dispatch
      setStatusMsg('Dispatching OTP email...');
      const res = await sendLoginOtp(email, password, captchaRes.captchaToken);

      setStep(2);
      setInfoNotice(res.message || 'OTP sent to your registered email address.');
      addToast('OTP sent to your registered email address.', 'success');
    } catch (err) {
      setError(err.message || 'Failed to send OTP email. Please check server configuration.');
      fetchCaptcha(); // Refresh CAPTCHA challenge on failure
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  const handleCustomerVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await verifyLoginOtp(email, otpInput);
      setSessionUser(data.user);
      setActiveTab('dashboard');
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  // CREDIT OFFICER LOGIN FLOW (Credentials + CAPTCHA -> Direct Login, NO OTP)
  const handleOfficerLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      setStatusMsg('Validating Challenge...');
      const captchaRes = await validateCaptchaApi(captchaData?.captchaId, captchaInput);
      setStatusMsg('Authenticating Officer...');
      const data = await loginOfficer(email, password, captchaRes.captchaToken);
      setSessionUser(data.user);
      addToast(`Welcome Officer ${data.user.name}`, 'success');
      setActiveTab('officer-dashboard');
    } catch (err) {
      setError(err.message || 'Credit Officer login failed. Please check credentials and CAPTCHA.');
      fetchCaptcha(); // Refresh CAPTCHA challenge on failure
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header Branding */}
        <div style={{
          backgroundColor: '#0f172a',
          color: 'white',
          padding: '2.5rem 2rem 1.75rem 2rem',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)'
          }}>
            <ShieldCheck size={36} color="#ffffff" />
          </div>

          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            NATIONAL DIGITAL BANK
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, marginTop: '0.2rem', color: '#ffffff' }}>
            Digital Loan Signing Portal
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            eSign, eStamp & Paperless Office Platform
          </p>

          {/* Role Navigation Toggle */}
          <div style={{
            display: 'flex',
            background: '#1e293b',
            padding: '0.3rem',
            borderRadius: '12px',
            marginTop: '1.5rem',
            border: '1px solid #334155'
          }}>
            <button
              onClick={() => handleRoleChange('CUSTOMER')}
              type="button"
              style={{
                flex: 1,
                padding: '0.6rem',
                border: 'none',
                borderRadius: '9px',
                background: roleTab === 'CUSTOMER' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: roleTab === 'CUSTOMER' ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'
              }}
            >
              CUSTOMER PORTAL
            </button>
            <button
              onClick={() => handleRoleChange('OFFICER')}
              type="button"
              style={{
                flex: 1,
                padding: '0.6rem',
                border: 'none',
                borderRadius: '9px',
                background: roleTab === 'OFFICER' ? 'linear-gradient(135deg, #059669, #047857)' : 'transparent',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: roleTab === 'OFFICER' ? '0 4px 12px rgba(5, 150, 105, 0.3)' : 'none'
              }}
            >
              CREDIT OFFICER PORTAL
            </button>
          </div>
        </div>

        {/* Login Body */}
        <div style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          {infoNotice && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={18} color="#2563eb" />
              <span>{infoNotice}</span>
            </div>
          )}

          {/* CREDIT OFFICER LOGIN FORM (Credentials + CAPTCHA -> Direct Login, NO OTP) */}
          {roleTab === 'OFFICER' ? (
            <form onSubmit={handleOfficerLogin}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Credit Officer Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-control"
                    style={{ width: '100%', paddingLeft: '2.75rem', height: '46px' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@demo.com"
                    required
                  />
                  <User size={18} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="form-control"
                    style={{ width: '100%', paddingLeft: '2.75rem', height: '46px' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <Lock size={18} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>

              {/* REAL CAPTCHA SECTION */}
              <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.6rem' }}>
                  Security Verification (CAPTCHA)
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    height: '50px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1
                  }}>
                    {captchaData?.captchaImage ? (
                      <img src={captchaData.captchaImage} alt="CAPTCHA" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Loading CAPTCHA...</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    disabled={captchaLoading}
                    className="btn btn-outline"
                    style={{ padding: '0.6rem 0.8rem', height: '50px' }}
                    title="Refresh CAPTCHA"
                  >
                    <RefreshCw size={18} className={captchaLoading ? 'spin' : ''} />
                  </button>
                </div>

                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%', height: '44px', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, textAlign: 'center' }}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Enter CAPTCHA Code"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password || !captchaInput}
                className="btn btn-lg btn-success"
                style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800 }}
              >
                {loading ? (statusMsg || 'Authenticating Officer...') : 'SIGN IN TO OFFICER PORTAL'} <ArrowRight size={18} />
              </button>
            </form>
          ) : step === 1 ? (
            /* CUSTOMER LOGIN STEP 1: CREDENTIALS & REAL CAPTCHA */
            <form onSubmit={handleCustomerSendOtp}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Registered Customer Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-control"
                    style={{ width: '100%', paddingLeft: '2.75rem', height: '46px' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                  <User size={18} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    Password
                  </label>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="form-control"
                    style={{ width: '100%', paddingLeft: '2.75rem', height: '46px' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <Lock size={18} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>

              {/* REAL CAPTCHA SECTION */}
              <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.6rem' }}>
                  Security Verification (CAPTCHA)
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    height: '50px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1
                  }}>
                    {captchaData?.captchaImage ? (
                      <img src={captchaData.captchaImage} alt="CAPTCHA" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Loading CAPTCHA...</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    disabled={captchaLoading}
                    className="btn btn-outline"
                    style={{ padding: '0.6rem 0.8rem', height: '50px' }}
                    title="Refresh CAPTCHA"
                  >
                    <RefreshCw size={18} className={captchaLoading ? 'spin' : ''} />
                  </button>
                </div>

                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%', height: '44px', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, textAlign: 'center' }}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Enter CAPTCHA Code"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password || !captchaInput}
                className="btn btn-lg btn-primary"
                style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800 }}
              >
                {loading ? (statusMsg || 'Validating Challenge...') : 'SEND OTP'} <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            /* CUSTOMER LOGIN STEP 2: EMAIL OTP VERIFICATION */
            <form onSubmit={handleCustomerVerifyOtp}>
              <div style={{
                textAlign: 'center',
                padding: '1.25rem',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem'
              }}>
                <Mail size={32} color="#2563eb" style={{ margin: '0 auto 0.5rem auto' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                  Email Verification Code Sent
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                  OTP sent to registered email address (<strong>{maskEmail(email)}</strong>). Please check your inbox.
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', textAlign: 'center' }}>
                  Enter 6-Digit Email OTP
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%', height: '50px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.3em' }}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpInput.length !== 6}
                className="btn btn-lg btn-success"
                style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem' }}
              >
                {loading ? 'Authenticating OTP...' : 'VERIFY OTP & LOGIN'} <KeyRound size={18} />
              </button>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  ← Back to Login / CAPTCHA
                </button>
              </div>
            </form>
          )}

          {/* Secure Footer Notice */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
            fontSize: '0.775rem',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}>
            <Building2 size={14} color="#059669" />
            <span>256-Bit SSL Encrypted Banking Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
};
