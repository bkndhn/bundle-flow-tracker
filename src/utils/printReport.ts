// Print Report Utility - Opens print dialog via about:blank window
// Works perfectly with Tamil fonts on mobile - Shows ALL columns

import { format } from 'date-fns';

interface PrintableRow {
  'Dispatch Date': string;
  'Item': string;
  'Movement Type': string;
  'Bundles': string | number;
  'Pieces': string | number;
  'Source': string;
  'Destination': string;
  'Transport': string;
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

  // Get column headers - ALL columns
  const headers = Object.keys(rows[0]);

  // Generate table HTML with ALL columns
  const tableRows = rows.map((row, index) => {
    const cells = headers.map(header => {
      const value = (row as any)[header];
      return `<td>${value || '-'}</td>`;
    }).join('');
    return `<tr class="${index % 2 === 0 ? 'even' : 'odd'}">${cells}</tr>`;
  }).join('');

  const tableHeaders = headers.map(h => `<th>${h}</th>`).join('');

  // Count statistics
  const receivedCount = rows.filter(r => r.Status === 'Received').length;
  const pendingCount = rows.filter(r => r.Status === 'Dispatched').length;

  // Generate full HTML document with Tamil font support and ALL columns visible
  const htmlContent = `<!DOCTYPE html>
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
      font-family: 'Noto Sans Tamil', 'Latha', 'Tamil Sangam MN', Arial, sans-serif;
      padding: 15px;
      background: #fff;
      color: #333;
      font-size: 12px;
      line-height: 1.4;
    }
    
    .header {
      text-align: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #3b82f6;
    }
    
    .header h1 {
      font-size: 18px;
      color: #1e40af;
      margin-bottom: 5px;
    }
    
    .header .meta {
      font-size: 11px;
      color: #666;
    }
    
    .summary {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 15px;
      padding: 10px;
      background: #f0f9ff;
      border-radius: 6px;
      flex-wrap: wrap;
    }
    
    .summary-item {
      text-align: center;
      min-width: 60px;
    }
    
    .summary-item .value {
      font-size: 16px;
      font-weight: bold;
      color: #1e40af;
    }
    
    .summary-item .label {
      font-size: 10px;
      color: #666;
    }
    
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin-bottom: 15px;
    }
    
    table {
      width: max-content;
      min-width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    
    th {
      background: #3b82f6;
      color: white;
      font-weight: 600;
      padding: 8px 6px;
      text-align: left;
      white-space: nowrap;
      border: 1px solid #2563eb;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    
    td {
      padding: 6px;
      border: 1px solid #e5e7eb;
      white-space: nowrap;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    tr.even {
      background: #f8fafc;
    }
    
    tr.odd {
      background: #ffffff;
    }
    
    tr:hover {
      background: #dbeafe;
    }
    
    .footer {
      margin-top: 15px;
      text-align: center;
      font-size: 10px;
      color: #888;
      padding-top: 10px;
      border-top: 1px solid #ddd;
    }
    
    .print-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 14px 28px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .print-btn:active {
      transform: scale(0.98);
    }
    
    .scroll-hint {
      text-align: center;
      font-size: 11px;
      color: #666;
      margin-bottom: 10px;
      padding: 8px;
      background: #fef3c7;
      border-radius: 6px;
    }
    
    @media print {
      .print-btn, .scroll-hint {
        display: none !important;
      }
      
      body {
        padding: 5mm;
        font-size: 8px;
      }
      
      .header h1 {
        font-size: 14px;
      }
      
      th, td {
        padding: 3px 4px;
        font-size: 7px;
      }
      
      .summary {
        padding: 5px;
      }
      
      .summary-item .value {
        font-size: 12px;
      }
      
      .table-wrapper {
        overflow: visible;
      }
      
      table {
        width: 100%;
        table-layout: auto;
      }
      
      td {
        white-space: normal;
        word-wrap: break-word;
        max-width: none;
      }
      
      @page {
        size: landscape;
        margin: 5mm;
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
      <div class="value">${receivedCount}</div>
      <div class="label">Received</div>
    </div>
    <div class="summary-item">
      <div class="value">${pendingCount}</div>
      <div class="label">Pending</div>
    </div>
  </div>
  
  <div class="scroll-hint">
    👆 Swipe left/right to see all ${headers.length} columns
  </div>
  
  <div class="table-wrapper">
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
    Goods Movement Tracker | ${format(new Date(), 'yyyy')} | All ${headers.length} columns included
  </div>
  
  <button class="print-btn" onclick="window.print()">
    🖨️ Print Report
  </button>
  
  <script>
    // Fallback if onload doesn't fire
    setTimeout(function() {
      document.querySelector('.print-btn').style.display = 'flex';
    }, 500);
    
    // Auto-scroll to show table on mobile
    if (window.innerWidth < 768) {
      document.querySelector('.table-wrapper').scrollLeft = 0;
    }
  </script>
</body>
</html>`;

  // Write to the new window
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
