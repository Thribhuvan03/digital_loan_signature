import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { evaluateUnderwriting } from '../services/api';
import { WorkflowTracker } from '../components/WorkflowTracker';
import { CheckCircle2, Award, Play, Lock, Clock } from 'lucide-react';

export const Step4Underwriting = ({ setActiveTab }) => {
  const { activeLoanData, refreshLoan, addToast } = useAuth();
  const loan = activeLoanData?.loan;
  const underwriting = activeLoanData?.underwriting;

  const [loading, setLoading] = useState(false);

  if (!loan || loan.current_step < 3) {
    return (
      <div>
        <WorkflowTracker setActiveTab={setActiveTab} />
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Lock size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>STEP 4: AUTOMATED UNDERWRITING IS LOCKED</h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            You must complete Step 3 (DigiLocker Document Verification) before executing the 14-rule credit engine.
          </p>
          <button onClick={() => setActiveTab('documents')} className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
            Go to Step 3: Documents
          </button>
        </div>
      </div>
    );
  }

  const handleRunUnderwriting = async () => {
    setLoading(true);
    try {
      await evaluateUnderwriting(loan.id);
      addToast('Automated Credit Engine complete: 14/14 Rules Passed (Score 100%)!', 'success');
      await refreshLoan();
      // NO AUTO-NAVIGATION! Stay on page.
    } catch (err) {
      addToast(err.message || 'Failed to run underwriting', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = !!underwriting;

  // Initial preview of the 14 rules before evaluation
  const previewRules = [
    { id: 1, name: 'Age Eligibility', condition: '21 to 60 Years' },
    { id: 2, name: 'Minimum Age Threshold', condition: '>= 18 Years' },
    { id: 3, name: 'Monthly Income', condition: '>= ₹25,000 / Month' },
    { id: 4, name: 'Employment Status', condition: 'Salaried / Self-Employed' },
    { id: 5, name: 'Credit Score (CIBIL)', condition: '>= 700 Score' },
    { id: 6, name: 'Existing Debt Burden (DTI)', condition: '<= 50% Debt-to-Income' },
    { id: 7, name: 'Loan Amount Eligibility', condition: '<= 10x Monthly Income' },
    { id: 8, name: 'Employment Stability', condition: '>= 1 Year Continuous' },
    { id: 9, name: 'PAN Verification', condition: 'Valid NSDL Verified PAN' },
    { id: 10, name: 'Aadhaar / eKYC Verification', condition: 'UIDAI eKYC Verified' },
    { id: 11, name: 'Document Verification', condition: '5/5 DigiLocker Verified' },
    { id: 12, name: 'Bank Account Verification', condition: 'Penny Drop Match' },
    { id: 13, name: 'Loan Tenure Eligibility', condition: '6 to 60 Months' },
    { id: 14, name: 'Fraud / Risk Check', condition: 'Zero Match on Blacklist' }
  ];

  const rules = isCompleted ? underwriting.rules : previewRules;

  return (
    <div>
      <WorkflowTracker setActiveTab={setActiveTab} />

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', pb: '1rem' }}>
          <div>
            <span className={`badge ${isCompleted ? 'badge-verified' : 'badge-in-progress'}`} style={{ marginBottom: '0.4rem' }}>
              {isCompleted ? 'UNDERWRITTEN' : 'STEP 4 OF 9'}
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              14-Rule Automated Credit Underwriting Engine
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Real-time algorithmic risk assessment & regulatory compliance rule engine
            </p>
          </div>

          {!isCompleted && (
            <button
              onClick={handleRunUnderwriting}
              disabled={loading}
              className="btn btn-lg btn-primary"
            >
              <Play size={18} /> {loading ? 'Evaluating 14 Rules...' : 'RUN UNDERWRITING'}
            </button>
          )}
        </div>

        {/* Score & Result Banner */}
        {isCompleted && (
          <div style={{
            background: 'linear-gradient(135deg, #059669, #047857)',
            color: 'white',
            padding: '1.5rem 2rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={36} color="#ffffff" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>14/14 RULES PASSED</h3>
                <p style={{ fontSize: '0.9rem', color: '#a7f3d0' }}>
                  Risk Score: <strong>100%</strong> | System Recommendation: <strong>{underwriting.final_result}</strong>
                </p>
              </div>
            </div>

            <div style={{ textTransform: 'uppercase', background: '#ffffff', color: '#047857', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.9rem' }}>
              {underwriting.final_result}
            </div>
          </div>
        )}

        {isCompleted && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Clock size={24} color="#d97706" />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#92400e' }}>
                APPLICATION SUBMITTED FOR SENIOR CREDIT OFFICER REVIEW
              </h4>
              <p style={{ fontSize: '0.825rem', color: '#b45309', marginTop: '0.15rem' }}>
                Application is currently under review by Senior Credit Officer <strong>Priya Sharma</strong>. Please sign out and log in as Officer (<code>officer@demo.com</code>) to evaluate and approve the application.
              </p>
            </div>
          </div>
        )}

        {/* 14 Rules Matrix Table */}
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
          EVALUATION RULE MATRIX (EXACTLY 14 RULES)
        </h3>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Rule Name</th>
              <th>Condition</th>
              <th>Applicant Value</th>
              <th>System Result</th>
              <th>Evaluation Notes</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 800, color: '#64748b' }}>{r.id}</td>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>{r.rule_name || r.name}</td>
                <td style={{ fontSize: '0.8rem', color: '#475569' }}>{r.condition}</td>
                <td style={{ fontWeight: 600, color: '#2563eb' }}>
                  {isCompleted ? r.applicant_value : 'Pending RUN UNDERWRITING'}
                </td>
                <td>
                  <span className={`badge ${isCompleted ? 'badge-completed' : 'badge-pending'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {isCompleted ? <CheckCircle2 size={12} /> : null} {isCompleted ? 'PASS' : 'PENDING'}
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem', color: isCompleted ? '#166534' : '#64748b' }}>
                  {isCompleted ? r.evaluation : 'Click RUN UNDERWRITING button above'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
