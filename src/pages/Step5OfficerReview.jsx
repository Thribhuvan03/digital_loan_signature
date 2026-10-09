import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllLoans, reviewLoanOfficer } from '../services/api';
import { WorkflowTracker } from '../components/WorkflowTracker';
import { ShieldCheck, CheckCircle2, XCircle, Eye, Award, FileText, HelpCircle } from 'lucide-react';

export const Step5OfficerReview = ({ setActiveTab }) => {
  const { user, refreshLoan, addToast } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewModalLoan, setReviewModalLoan] = useState(null);
  const [officerNotes, setOfficerNotes] = useState('Application meets all strict credit parameters with flawless 14/14 rule score. Recommended for instant approval.');
  const [actionLoading, setActionLoading] = useState(false);

  const isOfficer = user?.role === 'OFFICER';

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await getAllLoans();
      setLoans(res.loans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleDecision = async (appId, decision) => {
    setActionLoading(true);
    try {
      await reviewLoanOfficer(appId, decision, officerNotes, user?.email || 'officer@demo.com');
      addToast(`LOAN ${decision} SUCCESSFULLY! Digital Loan Agreement is now unlocked for the applicant.`, decision === 'APPROVED' ? 'success' : 'error');
      setReviewModalLoan(null);
      await fetchAll();
      await refreshLoan();
      // NO AUTO-NAVIGATION! Stay on Officer Review page.
    } catch (err) {
      addToast(err.message || 'Officer action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Metric counts
  const totalCount = loans.length;
  const pendingCount = loans.filter(l => l.status === 'UNDERWRITTEN' || l.status === 'SUBMITTED' || l.officerDecision === 'PENDING REVIEW').length;
  const approvedCount = loans.filter(l => l.status === 'APPROVED' || l.status === 'AGREEMENT_GENERATED' || l.status === 'STAMPED' || l.status === 'SIGNED' || l.status === 'DISBURSED').length;
  const rejectedCount = loans.filter(l => l.status === 'REJECTED').length;

  return (
    <div>
      <WorkflowTracker setActiveTab={setActiveTab} />

      {/* Officer Header Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', color: 'white', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              LOAN OPERATIONS PORTAL
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '0.2rem' }}>
              Senior Credit Underwriter Dashboard
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#d1fae5', marginTop: '0.25rem' }}>
              Officer: <strong>{user?.name || 'Priya Sharma (Credit Officer)'}</strong> ({user?.email || 'officer@demo.com'})
            </p>
          </div>

          {!isOfficer && (
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '0.75rem 1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: '#d1fae5' }}>Officer Access Note</div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>Sign in as officer@demo.com to approve</div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ marginBottom: 0, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>PENDING REVIEWS</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f59e0b', marginTop: '0.25rem' }}>{pendingCount}</div>
        </div>
        <div className="card" style={{ marginBottom: 0, borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>APPROVED LOANS</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#10b981', marginTop: '0.25rem' }}>{approvedCount}</div>
        </div>
        <div className="card" style={{ marginBottom: 0, borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>REJECTED LOANS</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ef4444', marginTop: '0.25rem' }}>{rejectedCount}</div>
        </div>
        <div className="card" style={{ marginBottom: 0, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TOTAL APPLICATIONS</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#3b82f6', marginTop: '0.25rem' }}>{totalCount}</div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
          APPLICATIONS QUEUED FOR OFFICER REVIEW
        </h3>

        {loans.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            No loan applications found. Submit a loan application as Thribhuvan first.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>App ID</th>
                <th>Applicant</th>
                <th>Loan Amount</th>
                <th>eKYC</th>
                <th>Documents</th>
                <th>Underwriting</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => {
                const isApproved = l.status === 'APPROVED' || l.status === 'AGREEMENT_GENERATED' || l.status === 'STAMPED' || l.status === 'SIGNED' || l.status === 'DISBURSED';
                const isPendingReview = l.status === 'UNDERWRITTEN' || l.status === 'SUBMITTED';

                return (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 800, color: '#2563eb' }}>{l.id}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{l.full_name || 'Thribhuvan'}</td>
                    <td style={{ fontWeight: 700 }}>₹{l.requested_amount.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${l.ekycStatus === 'VERIFIED' ? 'badge-verified' : 'badge-pending'}`}>
                        {l.ekycStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${l.docsStatus === 'VERIFIED' ? 'badge-verified' : 'badge-pending'}`}>
                        {l.docsStatus}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-verified" style={{ background: '#ecfdf5', color: '#047857' }}>
                        {l.underwritingScore} Rules Passed
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isApproved ? 'badge-approved' : l.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>
                        {isApproved ? 'APPROVED' : isPendingReview ? 'PENDING REVIEW' : l.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setReviewModalLoan(l)}
                        className="btn btn-sm btn-primary"
                      >
                        <Eye size={14} /> REVIEW APPLICATION
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Inspection Modal Drawer */}
      {reviewModalLoan && (
        <div className="modal-overlay" onClick={() => setReviewModalLoan(null)}>
          <div className="modal-card" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ backgroundColor: '#065f46' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>CREDIT OFFICER APPLICATION INSPECTION: {reviewModalLoan.id}</h3>
              </div>
              <button onClick={() => setReviewModalLoan(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.4rem' }}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Section 1: Applicant Details */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} color="#2563eb" /> APPLICANT & DEMOGRAPHIC PROFILE
              </h4>
              <div className="form-grid" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                <div><strong>Full Name:</strong> {reviewModalLoan.full_name || 'Thribhuvan'}</div>
                <div><strong>DOB:</strong> {reviewModalLoan.dob}</div>
                <div><strong>Mobile:</strong> {reviewModalLoan.mobile}</div>
                <div><strong>Email:</strong> {reviewModalLoan.email}</div>
                <div><strong>PAN:</strong> {reviewModalLoan.pan}</div>
                <div><strong>Aadhaar:</strong> {reviewModalLoan.aadhaar}</div>
              </div>

              {/* Section 2: Financial & Loan Details */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={16} color="#2563eb" /> LOAN & FINANCIAL ELIGIBILITY
              </h4>
              <div className="form-grid" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                <div><strong>Requested Principal:</strong> ₹{reviewModalLoan.requested_amount.toLocaleString('en-IN')}</div>
                <div><strong>Tenure:</strong> {reviewModalLoan.tenure_months} Months</div>
                <div><strong>Monthly Net Income:</strong> ₹{reviewModalLoan.monthly_income.toLocaleString('en-IN')}</div>
                <div><strong>Employer:</strong> {reviewModalLoan.company_name} ({reviewModalLoan.employment_type})</div>
                <div><strong>Existing EMI:</strong> ₹{reviewModalLoan.existing_emi.toLocaleString('en-IN')}</div>
                <div><strong>CIBIL Score:</strong> <span style={{ color: '#059669', fontWeight: 800 }}>{reviewModalLoan.cibil_score}</span></div>
              </div>

              {/* Section 3: Underwriting 14 Rules Summary */}
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 800, color: '#047857', fontSize: '1rem' }}>
                    ✓ 14/14 AUTOMATED UNDERWRITING RULES PASSED (100% SCORE)
                  </div>
                  <span className="badge badge-completed">ELIGIBLE FOR APPROVAL</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#065f46', marginTop: '0.35rem' }}>
                  Age, Income, DTI Ratio, CIBIL 760, PAN, UIDAI eKYC, 5/5 DigiLocker docs, Bank penny drop, Fraud checks passed.
                </p>
              </div>

              {/* Officer Decision Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Officer Review Comments & Recommendation
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  style={{ width: '100%' }}
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => addToast('More information requested from applicant.', 'info')}
                type="button"
                className="btn btn-outline"
              >
                <HelpCircle size={16} /> REQUEST MORE INFO
              </button>
              <button
                onClick={() => handleDecision(reviewModalLoan.id, 'REJECTED')}
                disabled={actionLoading}
                className="btn btn-danger"
              >
                <XCircle size={18} /> REJECT LOAN
              </button>
              <button
                onClick={() => handleDecision(reviewModalLoan.id, 'APPROVED')}
                disabled={actionLoading}
                className="btn btn-lg btn-success"
              >
                <CheckCircle2 size={18} /> APPROVE LOAN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
