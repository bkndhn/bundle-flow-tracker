// Generate a colorful dispatch card as a high-resolution image blob for sharing

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

// High DPI scale factor for sharp images
const SCALE = 3; // 3x for ~300 DPI on mobile

function renderShopSection(data: DispatchImageData, ctx: CanvasRenderingContext2D, y: number, cardX: number, cardW: number): number {
  const countLabel = data.movement_type === 'pieces' ? 'Pcs' : 'Bundles';
  const transport = transportLabels[data.transport_method || 'auto'] || transportLabels.auto;
  const personLabel = data.transport_method === 'auto' ? 'Accompanying' : 'Carried by';

  // Shop destination header
  ctx.fillStyle = '#ede9fe';
  ctx.beginPath();
  ctx.roundRect(cardX + 16, y, cardW - 32, 40, 10);
  ctx.fill();
  ctx.fillStyle = '#5b21b6';
  ctx.font = `bold ${16 * SCALE}px Inter, Arial, sans-serif`;
  ctx.fillText(`🏪 To: ${locationNames[data.destination] || data.destination}`, cardX + 30, y + 28);
  y += 52;

  // Item details rows
  const rows: [string, string, boolean?][] = [];
  if (data.item === 'both') {
    rows.push(['📦 Item', 'Both (Shirt + Pant)']);
    rows.push([`👕 Shirt`, `${data.shirt_bundles || 0} ${countLabel}`]);
    rows.push([`👖 Pant`, `${data.pant_bundles || 0} ${countLabel}`]);
    rows.push([`📊 Total`, `${data.bundles_count} ${countLabel}`, true]);
  } else {
    const itemName = data.item.charAt(0).toUpperCase() + data.item.slice(1);
    const emoji = data.item === 'shirt' ? '👕' : '👖';
    rows.push([`${emoji} ${itemName}`, `${data.bundles_count} ${countLabel}`, true]);
  }
  rows.push([`${transport.emoji} Transport`, transport.label]);
  if (data.transport_method === 'auto' && data.auto_name) {
    rows.push(['🚗 Auto Name', data.auto_name]);
  }
  if (data.transport_method === 'auto' && data.fare_display_msg) {
    rows.push(['💰 Fare', data.fare_display_msg]);
  }
  rows.push(['👤 Sent By', data.sent_by_name]);
  rows.push([`🧑 ${personLabel}`, data.accompanying_person || 'N/A']);
  if (data.dispatch_notes) {
    rows.push(['📝 Notes', data.dispatch_notes]);
  }

  const rowH = 36;
  for (const [label, value, highlight] of rows) {
    // Separator line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 20, y);
    ctx.lineTo(cardX + cardW - 20, y);
    ctx.stroke();

    if (highlight) {
      ctx.fillStyle = '#f5f3ff';
      ctx.fillRect(cardX + 16, y, cardW - 32, rowH);
    }

    ctx.fillStyle = '#64748b';
    ctx.font = `${13 * SCALE}px Inter, Arial, sans-serif`;
    ctx.fillText(label, cardX + 28, y + 24);

    ctx.fillStyle = highlight ? '#7c3aed' : '#1e293b';
    ctx.font = highlight ? `bold ${15 * SCALE}px Inter, Arial, sans-serif` : `600 ${13 * SCALE}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(value, cardX + cardW - 28, y + 24);
    ctx.textAlign = 'left';

    y += rowH;
  }

  return y + 12;
}

export async function generateDispatchImageBlob(data: DispatchImageData | DispatchImageData[]): Promise<Blob | null> {
  const dispatches = Array.isArray(data) ? data : [data];
  const isBatch = dispatches.length > 1;

  // Deduplicate by destination to prevent duplicate sections
  const seenDestinations = new Set<string>();
  const uniqueDispatches = dispatches.filter(d => {
    if (seenDestinations.has(d.destination)) return false;
    seenDestinations.add(d.destination);
    return true;
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Base dimensions (will be scaled by SCALE factor)
  const baseW = 420;
  const cardX = 10;
  const cardW = baseW - 20;

  // Estimate height
  let estimatedH = 180;
  for (const d of uniqueDispatches) {
    estimatedH += 60;
    let rowCount = 5;
    if (d.item === 'both') rowCount += 3;
    if (d.transport_method === 'auto' && d.auto_name) rowCount++;
    if (d.transport_method === 'auto' && d.fare_display_msg) rowCount++;
    if (d.dispatch_notes) rowCount++;
    estimatedH += rowCount * 36 + 20;
  }

  const canvasW = baseW;
  const canvasH = Math.max(estimatedH, 420);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW * SCALE;
  canvas.height = canvasH * SCALE;
  canvas.style.width = canvasW + 'px';
  canvas.style.height = canvasH + 'px';
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Scale all drawing operations
  ctx.scale(SCALE, SCALE);

  // Clean white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Card background with gradient
  const grad = ctx.createLinearGradient(cardX, 0, cardX + cardW, 0);
  grad.addColorStop(0, '#667eea');
  grad.addColorStop(1, '#764ba2');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(cardX, 10, cardW, canvasH - 20, 20);
  ctx.fill();

  // Header
  ctx.fillStyle = 'white';
  ctx.font = `bold ${22 * SCALE}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('🚚 DISPATCH ALERT', canvasW / 2, 52);
  ctx.font = `${12 * SCALE}px Inter, Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('Goods Movement Tracker', canvasW / 2, 70);
  ctx.textAlign = 'left';

  // Route badge
  const routeY = 84;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.roundRect(cardX + 20, routeY, cardW - 40, 38, 10);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = `bold ${15 * SCALE}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'center';
  const sourceLabel = locationNames[uniqueDispatches[0].source] || uniqueDispatches[0].source;
  if (isBatch) {
    const dests = uniqueDispatches.map(d => locationNames[d.destination] || d.destination).join(' & ');
    ctx.fillText(`${sourceLabel}  ➜  ${dests}`, canvasW / 2, routeY + 25);
  } else {
    const destLabel = locationNames[uniqueDispatches[0].destination] || uniqueDispatches[0].destination;
    ctx.fillText(`${sourceLabel}  ➜  ${destLabel}`, canvasW / 2, routeY + 25);
  }
  ctx.textAlign = 'left';

  // White body card
  let bodyY = routeY + 50;
  const bodyEndY = canvasH - 76;
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.roundRect(cardX + 14, bodyY, cardW - 28, bodyEndY - bodyY, 14);
  ctx.fill();

  let currentY = bodyY + 12;
  for (const d of uniqueDispatches) {
    currentY = renderShopSection(d, ctx, currentY, cardX, cardW);
  }

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `600 ${13 * SCALE}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`⏰ ${dateStr} • ${timeStr}`, canvasW / 2, canvasH - 42);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `${11 * SCALE}px Inter, Arial, sans-serif`;
  ctx.fillText('Please confirm receipt in app ✅', canvasW / 2, canvasH - 24);
  ctx.textAlign = 'left';

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
}
