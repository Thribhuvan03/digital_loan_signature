import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDocuments } from '../services/api';
import { WorkflowTracker } from '../components/WorkflowTracker';
import { FolderSearch, CheckCircle2, Lock, Download } from 'lucide-react';

export const Step3Documents = ({ setActiveTab }) => {
  const { activeLoanData, refreshLoan, addToast } = useAuth();
  const loan = activeLoanData?.loan;
  const docs = activeLoanData?.documents || [];

  const [loading, setLoading] = useState(false);

  if (!loan || loan.current_step < 2) {
    return (
      <div>
        <WorkflowTracker setActiveTab={setActiveTab} />
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Lock size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>STEP 3: DOCUMENTS IS LOCKED</h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            Aadhaar eKYC verification must be completed in Step 2 before retrieving DigiLocker official documents.
          </p>
          <button onClick={() => setActiveTab('ekyc')} className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
            Go to Step 2: eKYC
          </button>
        </div>
      </div>
    );
  }

  const handleFetchDocs = async () => {
    setLoading(true);
    try {
      await fetchDocuments(loan.id);
      addToast('5/5 DigiLocker official government documents fetched and verified!', 'success');
      await refreshLoan();
      // ABSOLUTELY NO AUTO-NAVIGATION! User stays on page.
    } catch (err) {
      addToast(err.message || 'Failed to fetch documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = docs.length === 5;

  return (
    <div>
      <WorkflowTracker setActiveTab={setActiveTab} />

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', pb: '1rem' }}>
          <div>
            <span className={`badge ${isCompleted ? 'badge-verified' : 'badge-in-progress'}`} style={{ marginBottom: '0.4rem' }}>
              {isCompleted ? 'COMPLETED' : 'STEP 3 OF 9'}
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              DigiLocker Digital Document Integration
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Automated document fetch & cryptographic verification via Ministry of Electronics & IT (MeitY) DigiLocker API
            </p>
          </div>

          <button
            onClick={handleFetchDocs}
            disabled={loading}
            className="btn btn-lg btn-primary"
          >
            <FolderSearch size={18} /> {loading ? 'Fetching DigiLocker Docs...' : 'FETCH DOCUMENTS'}
          </button>
        </div>

        {/* Status banner */}
        {isCompleted && (
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
                  ✓ 5/5 Official Documents Retrieved & Verified
                </div>
                <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '0.2rem' }}>
                  Step 4 (Underwriting) is now <strong>UNLOCKED</strong>. Please manually navigate to Underwriting using the sidebar or workflow tracker.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Table */}
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
          REQUIRED DIGITAL DOCUMENTS LIST
        </h3>

        {docs.length === 0 ? (
          <div style={{
            padding: '2.5rem',
            textAlign: 'center',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1.5px dashed #cbd5e1'
          }}>
            <FolderSearch size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>No Documents Fetched Yet</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
              Click the <strong>FETCH DOCUMENTS</strong> button above to pull official credentials from DigiLocker repository.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Category</th>
                <th>Issuing Authority</th>
                <th>Fetch Date</th>
                <th>Verification Status</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{d.doc_name}</td>
                  <td style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>{d.doc_type}</td>
                  <td style={{ fontSize: '0.85rem', color: '#475569' }}>{d.issuer}</td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{d.fetched_date}</td>
                  <td>
                    <span className="badge badge-verified" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={12} /> {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
