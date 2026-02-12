// Generate a colorful HTML dispatch card and allow sharing as image

const locationNames: Record<string, string> = {
  godown: 'Godown',
  big_shop: 'Big Shop',
  small_shop: 'Small Shop',
};

const transportLabels: Record<string, { label: string; emoji: string }> = {
  auto: { label: 'Auto', emoji: '🚗' },
  bike: { label: 'Bike', emoji: '🏍️' },
  by_walk: { label: 'By Walk', emoji: '🚶' },
};

export interface DispatchImageData {
  item: string;
  bundles_count: number;
  movement_type: string;
  source: string;
  destination: string;
  transport_method?: string;
  auto_name?: string;
  sent_by_name: string;
  accompanying_person?: string;
  dispatch_notes?: string;
  fare_display_msg?: string;
  shirt_bundles?: number;
  pant_bundles?: number;
}

export function generateDispatchImageHTML(data: DispatchImageData): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const countLabel = data.movement_type === 'pieces' ? 'Pcs' : 'Bundles';
  const transport = transportLabels[data.transport_method || 'auto'] || transportLabels.auto;
  const itemName = data.item === 'both' ? 'Both (Shirt + Pant)' : data.item.charAt(0).toUpperCase() + data.item.slice(1);

  let itemRows = '';
  if (data.item === 'both') {
    itemRows = `
      <tr><td class="label">👕 Shirt</td><td class="value">${data.shirt_bundles || 0} ${countLabel}</td></tr>
      <tr><td class="label">👖 Pant</td><td class="value">${data.pant_bundles || 0} ${countLabel}</td></tr>
      <tr class="total-row"><td class="label">📊 Total</td><td class="value highlight">${data.bundles_count} ${countLabel}</td></tr>
    `;
  } else {
    const emoji = data.item === 'shirt' ? '👕' : '👖';
    itemRows = `<tr class="total-row"><td class="label">${emoji} ${itemName}</td><td class="value highlight">${data.bundles_count} ${countLabel}</td></tr>`;
  }

  const autoRows = data.transport_method === 'auto' ? `
    ${data.auto_name ? `<tr><td class="label">🚗 Auto Name</td><td class="value">${data.auto_name}</td></tr>` : ''}
    ${data.fare_display_msg ? `<tr><td class="label">💰 Fare</td><td class="value fare">${data.fare_display_msg}</td></tr>` : ''}
  ` : '';

  const personLabel = data.transport_method === 'auto' ? 'Accompanying' : 'Carried by';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', 'Noto Sans Tamil', Arial, sans-serif;
    background: #f0f2f5;
    display: flex;
    justify-content: center;
    padding: 16px;
  }
  .card {
    width: 400px;
    max-width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
  }
  .header {
    padding: 20px 24px 16px;
    text-align: center;
    position: relative;
  }
  .header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 24px;
    right: 24px;
    height: 1px;
    background: rgba(255,255,255,0.2);
  }
  .header h1 {
    color: white;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 1px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .header .subtitle {
    color: rgba(255,255,255,0.8);
    font-size: 12px;
    margin-top: 4px;
    font-weight: 500;
  }
  .route-badge {
    margin: 16px 24px 0;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .route-badge .loc {
    color: white;
    font-weight: 700;
    font-size: 15px;
  }
  .route-badge .arrow {
    color: #fbbf24;
    font-size: 20px;
    font-weight: 800;
  }
  .body {
    background: white;
    margin: 16px;
    border-radius: 16px;
    overflow: hidden;
  }
  .body table {
    width: 100%;
    border-collapse: collapse;
  }
  .body table tr {
    border-bottom: 1px solid #f1f5f9;
  }
  .body table tr:last-child {
    border-bottom: none;
  }
  .body table td {
    padding: 10px 16px;
    font-size: 13px;
    vertical-align: middle;
  }
  .body table td.label {
    color: #64748b;
    font-weight: 500;
    width: 45%;
    white-space: nowrap;
  }
  .body table td.value {
    color: #1e293b;
    font-weight: 600;
    text-align: right;
  }
  .body table td.value.highlight {
    color: #7c3aed;
    font-size: 16px;
    font-weight: 800;
  }
  .body table td.value.fare {
    color: #059669;
    font-weight: 700;
  }
  .total-row {
    background: linear-gradient(90deg, #f5f3ff, #ede9fe) !important;
  }
  .transport-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #dbeafe;
    color: #1d4ed8;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
  .footer {
    padding: 12px 24px 20px;
    text-align: center;
  }
  .footer .time {
    color: rgba(255,255,255,0.9);
    font-size: 13px;
    font-weight: 600;
  }
  .footer .confirm {
    color: rgba(255,255,255,0.7);
    font-size: 11px;
    margin-top: 6px;
  }
  .notes-section {
    background: #fffbeb;
    padding: 10px 16px;
    border-top: 1px solid #fde68a;
  }
  .notes-section .notes-label {
    font-size: 11px;
    color: #92400e;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .notes-section .notes-text {
    font-size: 13px;
    color: #78350f;
    margin-top: 2px;
  }
  .actions {
    padding: 16px 24px;
    display: flex;
    gap: 8px;
  }
  .actions button {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: transform 0.15s;
  }
  .actions button:active { transform: scale(0.97); }
  .btn-copy {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }
  .btn-share {
    background: linear-gradient(135deg, #25d366, #128c7e);
    color: white;
  }
  .btn-close {
    background: #f1f5f9;
    color: #64748b;
  }
  @media print {
    body { background: white; padding: 0; }
    .actions { display: none !important; }
    .card { box-shadow: none; }
  }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>🚚 DISPATCH ALERT</h1>
    <div class="subtitle">Goods Movement Tracker</div>
  </div>

  <div class="route-badge">
    <span class="loc">${locationNames[data.source] || data.source}</span>
    <span class="arrow">➜</span>
    <span class="loc">${locationNames[data.destination] || data.destination}</span>
  </div>

  <div class="body">
    <table>
      <tr><td class="label">📦 Item</td><td class="value">${itemName}</td></tr>
      ${itemRows}
      <tr><td class="label">${transport.emoji} Transport</td><td class="value"><span class="transport-badge">${transport.label}</span></td></tr>
      ${autoRows}
      <tr><td class="label">👤 Sent By</td><td class="value">${data.sent_by_name}</td></tr>
      <tr><td class="label">🧑 ${personLabel}</td><td class="value">${data.accompanying_person || 'N/A'}</td></tr>
    </table>
    ${data.dispatch_notes ? `<div class="notes-section"><div class="notes-label">📝 Notes</div><div class="notes-text">${data.dispatch_notes}</div></div>` : ''}
  </div>

  <div class="footer">
    <div class="time">⏰ ${dateStr} • ${timeStr}</div>
    <div class="confirm">Please confirm receipt in app ✅</div>
  </div>

  <div class="actions">
    <button class="btn-copy" onclick="copyAsText()">📋 Copy Text</button>
    <button class="btn-share" onclick="shareImage()">📸 Save Image</button>
    <button class="btn-close" onclick="window.close()">✕ Close</button>
  </div>
</div>

<script>
function copyAsText() {
  const text = ${JSON.stringify(generatePlainText(data))};
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.btn-copy');
    btn.innerHTML = '✅ Copied!';
    setTimeout(() => btn.innerHTML = '📋 Copy Text', 2000);
  });
}

function shareImage() {
  // Use html2canvas-like approach: screenshot via print
  window.print();
}
</script>
</body>
</html>`;
}

function generatePlainText(data: DispatchImageData): string {
  const countLabel = data.movement_type === 'pieces' ? 'Pcs' : 'Bundles';
  const transport = transportLabels[data.transport_method || 'auto'] || transportLabels.auto;
  const itemName = data.item === 'both' ? 'Both (Shirt + Pant)' : data.item.charAt(0).toUpperCase() + data.item.slice(1);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  let text = `🚚 DISPATCH ALERT\n━━━━━━━━━━━━━━━\n\n`;
  text += `📦 Item: ${itemName}\n`;
  if (data.item === 'both') {
    text += `👕 Shirt: ${data.shirt_bundles || 0} ${countLabel}\n`;
    text += `👖 Pant: ${data.pant_bundles || 0} ${countLabel}\n`;
  }
  text += `📊 Total: ${data.bundles_count} ${countLabel}\n\n`;
  text += `🏭 From: ${locationNames[data.source] || data.source}\n`;
  text += `🏪 To: ${locationNames[data.destination] || data.destination}\n`;
  text += `${transport.emoji} Transport: ${transport.label}\n`;
  if (data.transport_method === 'auto' && data.auto_name) text += `🚗 Auto: ${data.auto_name}\n`;
  text += `👤 Sent by: ${data.sent_by_name}\n`;
  text += `🧑 ${data.transport_method === 'auto' ? 'Accompanying' : 'Carried by'}: ${data.accompanying_person || 'N/A'}\n`;
  if (data.transport_method === 'auto' && data.fare_display_msg) text += `💰 ${data.fare_display_msg}\n`;
  if (data.dispatch_notes) text += `📝 Notes: ${data.dispatch_notes}\n`;
  text += `\n⏰ ${dateStr}, ${timeStr}\n━━━━━━━━━━━━━━━\nPlease confirm receipt ✅`;
  return text;
}

export function openDispatchImageCard(data: DispatchImageData): void {
  const html = generateDispatchImageHTML(data);
  const newWindow = window.open('about:blank', '_blank', 'width=450,height=700');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }
}
