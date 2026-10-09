import React from 'react';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import { Download, FileCheck } from 'lucide-react';

export const SignedPdfView = () => {
  const { activeLoanData, addToast } = useAuth();
  const loan = activeLoanData?.loan;
  const agreement = activeLoanData?.agreement;
  const estamp = activeLoanData?.estamp;
  const esign = activeLoanData?.esign;

  const borrowerName = loan?.full_name || 'Thribhuvan';

  const generatePDF = () => {
    if (!loan || !agreement || !estamp || !esign) {
      addToast('Cannot generate PDF: Missing signed contract data', 'error');
      return;
    }

    const doc = new jsPDF();
    const primaryColor = [15, 23, 42]; // #0f172a
    const accentColor = [37, 99, 235]; // #2563eb
    const successColor = [5, 150, 105]; // #059669

    // Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NATIONAL DIGITAL BANK LTD', 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('DIGITAL LOAN AGREEMENT & eSTAMP CERTIFICATE', 14, 26);

    doc.setFillColor(...successColor);
    doc.rect(145, 10, 50, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('VERIFIED & SIGNED', 148, 19);

    // Document Details Section
    let y = 45;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('DIGITAL CONTRACT EXECUTION SUMMARY', 14, y);

    y += 8;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 182, 36, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Borrower Name: ${borrowerName}`, 20, y + 10);
    doc.text(`Application ID: ${loan.id}`, 20, y + 18);
    doc.text(`Agreement ID: ${agreement.id}`, 20, y + 26);

    doc.text(`Loan Amount: Rs. ${loan.requested_amount.toLocaleString('en-IN')}`, 110, y + 10);
    doc.text(`Tenure: ${loan.tenure_months} Months @ ${agreement.interest_rate}% p.a.`, 110, y + 18);
    doc.text(`Calculated EMI: Rs. ${agreement.emi_amount.toLocaleString('en-IN')}`, 110, y + 26);

    // eStamp Section
    y += 45;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...successColor);
    doc.text('OFFICIAL eSTAMP DUTY CERTIFICATE', 14, y);

    y += 6;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(14, y, 182, 38, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`eStamp Certificate Ref: ${estamp.estamp_reference}`, 20, y + 10);
    doc.text(`Stamp Duty Paid: Rs. ${estamp.stamp_duty_amount} INR`, 20, y + 18);
    doc.text(`Issue Date: ${estamp.issue_date}`, 20, y + 26);

    doc.text(`Issuing Authority: SHCIL / State Govt Treasury`, 110, y + 10);
    doc.text(`Certificate Status: VALID`, 110, y + 18);
    doc.text(`Document SHA-256: ${estamp.document_hash.substring(0, 20)}...`, 110, y + 26);

    // eSign Section
    y += 48;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text('AADHAAR eSIGN DIGITAL SIGNATURE STAMP', 14, y);

    y += 6;
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(14, y, 182, 38, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`Digitally Signed By: ${esign.signer_name}`, 20, y + 10);
    doc.text(`Signature Reference: ${esign.signature_reference}`, 20, y + 18);
    doc.text(`Signed Timestamp: ${esign.signed_at}`, 20, y + 26);

    doc.text(`Authentication Method: Aadhaar OTP (UIDAI Vault)`, 110, y + 10);
    doc.text(`Legal Validity: IT Act 2000 (Section 3A)`, 110, y + 18);
    doc.text(`Signature Status: VERIFIED & COMPLETED`, 110, y + 26);

    // Key Terms & Conditions
    y += 48;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('CONTRACT TERMS & CONDITIONS SUMMARY', 14, y);

    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('1. The borrower agrees to repay the loan principal along with accrued interest in 36 equated monthly installments.', 14, y);
    doc.text('2. All transactions and eSignatures attached to this agreement carry legal enforceability in courts of law in India.', 14, y + 5);
    doc.text('3. This document is archived permanently in the Paperless Audit Vault with SHA-256 tamper-evident integrity.', 14, y + 10);

    // Footer Stamp Box
    y += 22;
    doc.setDrawColor(15, 23, 42);
    doc.rect(14, y, 182, 18);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIALLY EXECUTED DIGITAL CONTRACT - PAPERLESS OFFICE RECORD', 25, y + 11);

    // Save File
    doc.save(`Signed_Loan_Agreement_${agreement.id}_${borrowerName}.pdf`);
    addToast('Signed Loan Agreement PDF downloaded successfully!', 'success');
  };

  return (
    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
      <button
        onClick={generatePDF}
        className="btn btn-lg btn-outline"
        style={{
          borderColor: '#2563eb',
          color: '#2563eb',
          padding: '0.85rem 1.75rem',
          fontSize: '1rem',
          fontWeight: 800
        }}
      >
        <Download size={20} /> DOWNLOAD SIGNED AGREEMENT PDF
      </button>
    </div>
  );
};
