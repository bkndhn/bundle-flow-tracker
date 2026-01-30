// Print Report Utility - Opens print dialog via about:blank window
// Works perfectly with Tamil fonts on mobile

import { format } from 'date-fns';

interface PrintableRow {
  'Dispatch Date': string;
  'Item': string;
  'Movement Type': string;
  'Bundles': string | number;
  'Pieces': string | number;
  'Source': string;
  'Destination': string;
  'Auto Name': string;
  'Sent By': string;
  'Accompanying Person': string;
  'Fare Payment': string;
  'Received By': string;
  'Received At': string;
  'Status': string;
  'Dispatch Notes': string;
  'Receive Notes': string;
}

export const printReport = (
  rows: PrintableRow[],
  title: string = 'Goods Movement Report'
): void => {
  if (rows.length === 0) {
    alert('No data to print');
    return;
  }

  // Open a new blank window
  const printWindow = window.open('about:blank', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print the report');
    return;
  }

  // Get column headers
  const headers = Object.keys(rows[0]);

  // Generate table HTML
  const tableRows = rows.map(row => {
    const cells = headers.map(header => {
      const value = (row as any)[header];
      return `<td style="border: 1px solid #ddd; padding: 8px; font-size: 11px; white-space: nowrap;">${value || '-'}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const tableHeaders = headers.map(h => 
    `<th style="border: 1px solid #ddd; padding: 10px; background: #3b82f6; color: white; font-size: 11px; font-weight: bold; white-space: nowrap;">${h}</th>`
  ).join('');

  // Generate full HTML document with Tamil font support
  const htmlContent = `
<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Noto Sans Tamil', 'Latha', 'Tamil Sangam MN', 'Nirmala UI', Arial, sans-serif;
      padding: 20px;
      background: white;
      color: #333;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #3b82f6;
    }
    
    .header h1 {
      font-size: 24px;
      color: #1e40af;
      margin-bottom: 8px;
    }
    
    .header .meta {
      font-size: 12px;
      color: #666;
    }
    
    .summary {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 20px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-item .label {
      font-size: 11px;
      color: #666;
    }
    
    .summary-item .value {
      font-size: 18px;
      font-weight: bold;
      color: #1e40af;
    }
    
    .table-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background: #3b82f6;
      color: white;
      font-weight: 600;
      position: sticky;
      top: 0;
    }
    
    tr:nth-child(even) {
      background: #f8fafc;
    }
    
    tr:hover {
      background: #e0f2fe;
    }
    
    .footer {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 10px;
      color: #888;
    }
    
    .print-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      z-index: 1000;
    }
    
    .print-button:hover {
      background: #2563eb;
    }
    
    @media print {
      .print-button {
        display: none !important;
      }
      
      body {
        padding: 10px;
        font-size: 10px;
      }
      
      th, td {
        padding: 4px 6px;
        font-size: 9px;
      }
      
      .header h1 {
        font-size: 18px;
      }
      
      .summary {
        padding: 10px;
      }
      
      @page {
        size: landscape;
        margin: 10mm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📦 ${title}</h1>
    <div class="meta">
      Generated on: ${format(new Date(), 'dd/MM/yyyy hh:mm a')} | Total Records: ${rows.length}
    </div>
  </div>
  
  <div class="summary">
    <div class="summary-item">
      <div class="value">${rows.length}</div>
      <div class="label">Total Records</div>
    </div>
    <div class="summary-item">
      <div class="value">${rows.filter(r => r.Status === 'Received').length}</div>
      <div class="label">Received</div>
    </div>
    <div class="summary-item">
      <div class="value">${rows.filter(r => r.Status === 'Dispatched').length}</div>
      <div class="label">Pending</div>
    </div>
  </div>
  
  <div class="table-container">
    <table>
      <thead>
        <tr>${tableHeaders}</tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>
  
  <div class="footer">
    Goods Movement Tracker | ${format(new Date(), 'yyyy')}
  </div>
  
  <button class="print-button" onclick="window.print()">
    🖨️ Print Report
  </button>
  
  <script>
    // Auto-focus for better UX
    document.addEventListener('DOMContentLoaded', function() {
      // On mobile, scroll to print button
      if (window.innerWidth < 768) {
        window.scrollTo(0, document.body.scrollHeight);
      }
    });
  </script>
</body>
</html>
`;

  // Write to the new window
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
