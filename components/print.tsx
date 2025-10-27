'use client';

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface PrintProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
}

const Print: React.FC<PrintProps> = ({ children, onClose, title = "Print Document" }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: title,
    pageStyle: `
      @media print {
        @page {
          margin: 0.5in;
          size: A4;
        }
         body {
           font-family: 'Poppins', sans-serif;
           font-size: 12px;
           line-height: 1.4;
           color: #000;
           font-weight: 400 !important;
         }
         
         /* Force all text to medium weight in print */
         * {
           font-weight: 400 !important;
         }
         
         /* Override specific elements that need different weights */
         .print-header h1 {
           font-weight: 500 !important;
         }
         .print-header {
           margin-bottom: 20px;
           border-bottom: 2px solid #000;
           padding-bottom: 15px;
         }
         
         .print-header h1 {
           font-size: 18px !important;
           margin: 0 !important;
           color: #000 !important;
         }
         
         .print-header h2 {
           font-size: 16px !important;
           font-weight: 400 !important;
           margin: 0 !important;
           color: #000 !important;
         }
         
         .print-header p {
           font-size: 12px !important;
           margin: 2px 0 !important;
           color: #666 !important;
         }
         
         .print-header img {
           width: 64px !important;
           height: 64px !important;
           object-fit: contain !important;
         }
         
         .print-header input {
           border: 1px solid #000 !important;
           padding: 4px 8px !important;
           font-size: 12px !important;
           width: 128px !important;
           background: white !important;
         }
         
         .print-header label {
           font-size: 12px !important;
           font-weight: 500 !important;
           color: #000 !important;
           margin-bottom: 2px !important;
         }
        .print-section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .print-section h3 {
          background-color: #f3f4f6;
          padding: 8px 12px;
          margin: 0 0 10px 0;
          bordereft: 4px solid #1e40af;
          font-size: 14px;
          font-weight: 600;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .print-table th,
        .print-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        .print-table th {
          background-color: #f3f4f6;
          font-weight: 600;
          text-align: center;
        }
        .print-table {
          margin-bottom: 20px;
        }
        .print-subjects {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 5px;
        }
         .print-subject-pill {
           background-color: #e5e7eb;
           border: 1px solid #9ca3af;
           padding: 2px 6px;
           border-radius: 3px;
           font-size: 10px;
           text-align: center;
           display: inline-block;
           margin: 1px;
         }
         
         .subject-color-dot {
           width: 12px !important;
           height: 12px !important;
           display: inline-block !important;
           margin-right: 8px !important;
           vertical-align: middle !important;
           border-radius: 2px !important;
         }
         
         /* Force colors for print - override any browser restrictions */
         .subject-color-dot {
           -webkit-print-color-adjust: exact !important;
           color-adjust: exact !important;
           print-color-adjust: exact !important;
         }
         
         /* Ensure colors are not stripped in print */
         * {
           -webkit-print-color-adjust: exact !important;
           color-adjust: exact !important;
           print-color-adjust: exact !important;
         }
         
         .qr-code {
           width: 100px !important;
           height: 100px !important;
           max-width: 100px !important;
           max-height: 100px !important;
         }
         
         /* Color classes for print - matching actual subject colors */
         .red-700 { background-color: #b91c1c !important; }
         .red-800 { background-color: #991b1b !important; }
         .blue-700 { background-color: #1d4ed8 !important; }
         .blue-800 { background-color: #1e40af !important; }
         .emerald-700 { background-color: #047857 !important; }
         .emerald-800 { background-color: #065f46 !important; }
         .yellow-700 { background-color: #a16207 !important; }
         .yellow-800 { background-color: #854d0e !important; }
         .orange-700 { background-color: #c2410c !important; }
         .orange-800 { background-color: #9a3412 !important; }
         .violet-700 { background-color: #6d28d9 !important; }
         .violet-800 { background-color: #5b21b6 !important; }
         .purple-700 { background-color: #7c3aed !important; }
         .purple-800 { background-color: #6b21a8 !important; }
         .indigo-700 { background-color: #4338ca !important; }
         .indigo-800 { background-color: #3730a3 !important; }
         .no-print {
           display: none !important;
         }
      }
    `,
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-800 text-white text-sm font-medium hover:bg-blue-900 transition-colors flex items-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white text-sm font-medium hover:bg-gray-600 transition-colors"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div ref={componentRef} className="print-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Print;
