import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateAgreement } from '../services/api';
import { WorkflowTracker } from '../components/WorkflowTracker';
import { FileSignature, CheckCircle2, Lock, FileText } from 'lucide-react';

export const Step6Agreement = ({ setActiveTab }) => {
  const { activeLoanData, refreshLoan, addToast } = useAuth();
  const loan = activeLoanData?.loan;
  const agreement = activeLoanData?.agreement;

  const [loading, setLoading] = useState(false);

  if (!loan || (loan.status !== 'APPROVED' && loan.current_step < 5)) {
    return (
      <div>
        <WorkflowTracker setActiveTab={setActiveTab} />
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Lock size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>STEP 6: DIGITAL AGREEMENT IS LOCKED</h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            Senior Credit Officer approval is required before generating the legally binding digital loan contract.
          </p>
          <button onClick={() => setActiveTab('officer-dashboard')} className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
            Go to Step 5: Officer Review
          </button>
        </div>
      </div>
    );
  }

  const handleGenerateAgreement = async () => {
    setLoading(true);
    try {
      const res = await generateAgreement(loan.id);
      addToast(`Digital Loan Agreement ${res.agreementId} generated successfully!`, 'success');
      await refreshLoan();
      // ABSOLUTELY NO AUTO-NAVIGATION! User stays on page.
    } catch (err) {
      addToast(err.message || 'Failed to generate agreement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isGenerated = !!agreement;
  const borrowerName = loan.full_name || 'Thribhuvan';

  return (
    <div>
      <WorkflowTracker setActiveTab={setActiveTab} />

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', pb: '1rem' }}>
          <div>
            <span className={`badge ${isGenerated ? 'badge-verified' : 'badge-in-progress'}`} style={{ marginBottom: '0.4rem' }}>
              {isGenerated ? 'GENERATED' : 'STEP 6 OF 9'}
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              Digital Loan Agreement Contract Generation
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Automated binding legal document creation under Indian Contract Act 1872
            </p>
          </div>

          {!isGenerated && (
            <button
              onClick={handleGenerateAgreement}
              disabled={loading}
              className="btn btn-lg btn-primary"
            >
              <FileSignature size={18} /> {loading ? 'Generating Agreement...' : 'GENERATE AGREEMENT'}
            </button>
          )}
        </div>

        {!isGenerated ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #cbd5e1' }}>
            <FileText size={44} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Ready to Generate Agreement</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
              Click <strong>GENERATE AGREEMENT</strong> to create the binding contract for <strong>{borrowerName}</strong> (₹{loan.requested_amount.toLocaleString('en-IN')}).
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
                    ✓ Digital Loan Agreement Generated: {agreement.id}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '0.2rem' }}>
                    Step 7 (eStamp) is now <strong>UNLOCKED</strong>. Please manually navigate to eStamp using the sidebar or workflow tracker.
                  </div>
                </div>
              </div>
            </div>

            {/* Document Preview Box */}
            <div style={{
              border: '2px solid #cbd5e1',
              borderRadius: '12px',
              padding: '2rem',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>PERSONAL LOAN AGREEMENT</h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Ref ID: {agreement.id} | Date: {agreement.generated_at}</p>
              </div>

              {/* Schedule of Terms */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.75rem' }}>SCHEDULE I: KEY LOAN TERMS</h4>
                <div className="form-grid">
                  <div><strong>Borrower Name:</strong> {agreement.borrower_name}</div>
                  <div><strong>Loan Principal:</strong> ₹{agreement.loan_amount.toLocaleString('en-IN')}</div>
                  <div><strong>Annual Interest Rate:</strong> {agreement.interest_rate}% p.a.</div>
                  <div><strong>Loan Tenure:</strong> {agreement.tenure_months} Months</div>
                  <div><strong>Equated Monthly Installment (EMI):</strong> ₹{agreement.emi_amount.toLocaleString('en-IN')}</div>
                  <div><strong>Loan Purpose:</strong> {agreement.purpose}</div>
                </div>
              </div>

              {/* Contract Clauses */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>TERMS & CONDITIONS CLAUSES</h4>
              <ol style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.6', paddingLeft: '1.25rem' }}>
                <li><strong>Disbursement & Repayment:</strong> The Lender agrees to disburse ₹{agreement.loan_amount.toLocaleString('en-IN')} to the Borrower's bank account upon execution of eStamp duty and Aadhaar eSign.</li>
                <li><strong>EMI Obligation:</strong> The Borrower agrees to pay a monthly EMI of ₹{agreement.emi_amount.toLocaleString('en-IN')} on or before the 5th of every month.</li>
                <li><strong>Default & Late Charges:</strong> A penal interest of 2% per month shall apply on overdue installments.</li>
                <li><strong>eStamp & eSign Legal Validity:</strong> This document derives full legal validity under Section 3A of the Information Technology Act, 2000 and the Indian Stamp Act, 1899.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
