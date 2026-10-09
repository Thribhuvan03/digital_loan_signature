import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitLoanApplication } from '../services/api';
import { WorkflowTracker } from '../components/WorkflowTracker';
import { FilePlus, CheckCircle2, User, Building, CreditCard, Banknote, ShieldCheck, Save } from 'lucide-react';

export const Step1LoanApp = ({ setActiveTab }) => {
  const { user, activeLoanData, refreshLoan, addToast } = useAuth();
  const existingLoan = activeLoanData?.loan;

  const [formData, setFormData] = useState({
    full_name: 'Thribhuvan',
    dob: '15-08-1998',
    mobile: '9876543210',
    email: user?.email || '',
    pan: 'ABCDE1234F',
    aadhaar: 'XXXX-XXXX-1234',
    employment_type: 'SALARIED',
    monthly_income: '55000',
    company_name: 'ABC Technologies Pvt Ltd',
    requested_amount: '250000',
    tenure_months: '36',
    purpose: 'Personal',
    existing_emi: '4500',
    cibil_score: '760'
  });

  const [loading, setLoading] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState(null);

  const handleSaveDraft = () => {
    addToast('Loan Application draft saved locally.', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submitLoanApplication({
        ...formData,
        userId: user?.id || 1
      });

      setSubmittedAppId(res.applicationId);
      addToast(`Loan Application ${res.applicationId} submitted successfully! eKYC step is now unlocked.`, 'success');
      await refreshLoan();
      // NO AUTO-NAVIGATION! Stay on page.
    } catch (err) {
      addToast(err.message || 'Failed to submit loan application', 'error');
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
            <span className="badge badge-in-progress" style={{ marginBottom: '0.4rem' }}>
              STEP 1 OF 9
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              PERSONAL LOAN APPLICATION FORM
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Provide accurate personal, demographic & financial information to initiate automated loan origination
            </p>
          </div>
        </div>

        {(existingLoan || submittedAppId) && (
          <div style={{
            padding: '1.25rem',
            borderRadius: '10px',
            backgroundColor: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={28} color="#059669" />
              <div>
                <div style={{ fontWeight: 800, color: '#065f46', fontSize: '1.05rem' }}>
                  ✓ Loan Application Submitted: {existingLoan?.id || submittedAppId}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '0.2rem' }}>
                  Status: <strong>SUBMITTED</strong> | Step 2 (eKYC) is now <strong>UNLOCKED</strong>. Please manually select eKYC from the navigation bar or workflow tracker.
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* SECTION 1: PERSONAL INFORMATION */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563eb', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} /> 1. PERSONAL INFORMATION
          </h3>

          <div className="form-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="form-group">
              <label>Full Legal Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Date of Birth (DD-MM-YYYY)</label>
              <input
                type="text"
                className="form-control"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          {/* SECTION 2: IDENTITY INFORMATION */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563eb', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} /> 2. IDENTITY INFORMATION
          </h3>

          <div className="form-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="form-group">
              <label>PAN Card Number</label>
              <input
                type="text"
                className="form-control"
                style={{ textTransform: 'uppercase' }}
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="form-group">
              <label>Aadhaar Reference Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.aadhaar}
                onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                required
              />
            </div>
          </div>

          {/* SECTION 3: EMPLOYMENT INFORMATION */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563eb', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={18} /> 3. EMPLOYMENT INFORMATION
          </h3>

          <div className="form-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="form-group">
              <label>Employment Type</label>
              <select
                className="form-control"
                value={formData.employment_type}
                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
              >
                <option value="SALARIED">SALARIED</option>
                <option value="SELF_EMPLOYED">SELF_EMPLOYED</option>
                <option value="BUSINESS">BUSINESS</option>
              </select>
            </div>

            <div className="form-group">
              <label>Monthly Net Income (₹)</label>
              <input
                type="number"
                className="form-control"
                value={formData.monthly_income}
                onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Employer / Company Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Existing Monthly Obligations / EMI (₹)</label>
              <input
                type="number"
                className="form-control"
                value={formData.existing_emi}
                onChange={(e) => setFormData({ ...formData, existing_emi: e.target.value })}
              />
            </div>
          </div>

          {/* SECTION 4: LOAN & CREDIT INFORMATION */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563eb', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Banknote size={18} /> 4. LOAN & CREDIT INFORMATION
          </h3>

          <div className="form-grid" style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <label>Requested Loan Amount (₹)</label>
              <input
                type="number"
                className="form-control"
                value={formData.requested_amount}
                onChange={(e) => setFormData({ ...formData, requested_amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Loan Tenure (Months)</label>
              <select
                className="form-control"
                value={formData.tenure_months}
                onChange={(e) => setFormData({ ...formData, tenure_months: e.target.value })}
              >
                <option value="12">12 Months</option>
                <option value="24">24 Months</option>
                <option value="36">36 Months</option>
                <option value="48">48 Months</option>
                <option value="60">60 Months</option>
              </select>
            </div>

            <div className="form-group">
              <label>Loan Purpose</label>
              <input
                type="text"
                className="form-control"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>CIBIL Credit Score</label>
              <input
                type="number"
                className="form-control"
                value={formData.cibil_score}
                onChange={(e) => setFormData({ ...formData, cibil_score: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn btn-outline"
            >
              <Save size={16} /> SAVE DRAFT
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-lg btn-primary"
            >
              {loading ? 'Submitting Application...' : 'SUBMIT LOAN APPLICATION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
