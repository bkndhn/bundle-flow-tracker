// Generate a clean, readable dispatch card image for WhatsApp sharing

const locationNames: Record<string, string> = {
  godown: 'Godown',
  big_shop: 'Big Shop',
  small_shop: 'Small Shop',
};

const transportLabels: Record<string, string> = {
  auto: 'Auto',
  bike: 'Bike',
  by_walk: 'By Walk',
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

// 3x scale for sharp rendering on mobile (~300 DPI)
const SCALE = 3;
const BASE_W = 480;
const PADDING = 24;
const CONTENT_W = BASE_W - PADDING * 2;

interface RowData {
  label: string;
  value: string;
  isTotal?: boolean;
}

function getShopRows(data: DispatchImageData): RowData[] {
  const unit = data.movement_type === 'pieces' ? 'Pcs' : 'Bundles';
  const rows: RowData[] = [];

  if (data.item === 'both') {
    rows.push({ label: 'Item', value: 'Both (Shirt + Pant)' });
    rows.push({ label: 'Shirt', value: `${data.shirt_bundles || 0} ${unit}` });
    rows.push({ label: 'Pant', value: `${data.pant_bundles || 0} ${unit}` });
    rows.push({ label: 'Total', value: `${data.bundles_count} ${unit}`, isTotal: true });
  } else {
    const name = data.item.charAt(0).toUpperCase() + data.item.slice(1);
    rows.push({ label: name, value: `${data.bundles_count} ${unit}`, isTotal: true });
  }

  rows.push({ label: 'Transport', value: transportLabels[data.transport_method || 'auto'] || 'Auto' });

  if (data.transport_method === 'auto' && data.auto_name) {
    rows.push({ label: 'Auto Name', value: data.auto_name });
  }
  if (data.transport_method === 'auto' && data.fare_display_msg) {
    rows.push({ label: 'Fare', value: data.fare_display_msg });
  }

  rows.push({ label: 'Sent By', value: data.sent_by_name });

  const personLabel = data.transport_method === 'auto' ? 'Accompanying' : 'Carried By';
  rows.push({ label: personLabel, value: data.accompanying_person || 'N/A' });

  if (data.dispatch_notes) {
    rows.push({ label: 'Notes', value: data.dispatch_notes });
  }

  return rows;
}

function measureSectionHeight(data: DispatchImageData): number {
  const rows = getShopRows(data);
  // Section header (44) + rows (each 38) + bottom padding (16)
  return 44 + rows.length * 38 + 16;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function renderSection(
  ctx: CanvasRenderingContext2D,
  data: DispatchImageData,
  y: number
): number {
  const x = PADDING;
  const w = CONTENT_W;
  const rows = getShopRows(data);
  const sectionH = 44 + rows.length * 38 + 8;
  const destName = locationNames[data.destination] || data.destination;

  // Section background
  ctx.fillStyle = '#f8fafc';
  drawRoundedRect(ctx, x, y, w, sectionH, 12);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Section header
  ctx.fillStyle = '#4f46e5';
  drawRoundedRect(ctx, x, y, w, 40, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`To: ${destName}`, x + 16, y + 26);
  ctx.textAlign = 'left';

  let rowY = y + 48;
  const ROW_H = 38;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Alternating row background
    if (i % 2 === 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#f1f5f9';
    }
    ctx.fillRect(x + 1, rowY - 4, w - 2, ROW_H);

    // Total row highlight
    if (row.isTotal) {
      ctx.fillStyle = '#eef2ff';
      ctx.fillRect(x + 1, rowY - 4, w - 2, ROW_H);
    }

    // Separator
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x + 12, rowY - 4);
    ctx.lineTo(x + w - 12, rowY - 4);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(row.label, x + 16, rowY + 16);

    // Value
    if (row.isTotal) {
      ctx.fillStyle = '#4338ca';
      ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    } else {
      ctx.fillStyle = '#1f2937';
      ctx.font = '600 14px "Segoe UI", Arial, sans-serif';
    }
    ctx.textAlign = 'right';
    ctx.fillText(row.value, x + w - 16, rowY + 16);
    ctx.textAlign = 'left';

    rowY += ROW_H;
  }

  return y + sectionH + 16;
}

export async function generateDispatchImageBlob(data: DispatchImageData | DispatchImageData[]): Promise<Blob | null> {
  const dispatches = Array.isArray(data) ? data : [data];

  // Deduplicate by destination
  const seen = new Set<string>();
  const unique = dispatches.filter(d => {
    if (seen.has(d.destination)) return false;
    seen.add(d.destination);
    return true;
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Calculate total height
  // Header: 100, sections, footer: 60, padding
  let totalH = 110;
  for (const d of unique) {
    totalH += measureSectionHeight(d) + 16;
  }
  totalH += 60;

  const canvasW = BASE_W;
  const canvasH = Math.max(totalH, 300);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW * SCALE;
  canvas.height = canvasH * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.scale(SCALE, SCALE);

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Header gradient bar
  const headerH = 96;
  const headerGrad = ctx.createLinearGradient(0, 0, canvasW, 0);
  headerGrad.addColorStop(0, '#4f46e5');
  headerGrad.addColorStop(1, '#7c3aed');
  ctx.fillStyle = headerGrad;
  drawRoundedRect(ctx, 0, 0, canvasW, headerH, 16);
  ctx.fill();

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DISPATCHED', canvasW / 2, 32);

  // Subtitle
  ctx.font = '13px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('Goods Movement Tracker', canvasW / 2, 50);

  // Route info
  const sourceLabel = locationNames[unique[0].source] || unique[0].source;
  const destLabels = unique.map(d => locationNames[d.destination] || d.destination).join(' & ');
  
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  drawRoundedRect(ctx, PADDING, 60, CONTENT_W, 28, 8);
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`${sourceLabel}  →  ${destLabels}`, canvasW / 2, 79);
  ctx.textAlign = 'left';

  // Render shop sections
  let currentY = headerH + 16;
  for (const d of unique) {
    currentY = renderSection(ctx, d, currentY);
  }

  // Footer
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${dateStr}  •  ${timeStr}`, canvasW / 2, currentY + 14);
  ctx.font = '11px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#b0b0b0';
  ctx.fillText('Please confirm receipt in app', canvasW / 2, currentY + 32);
  ctx.textAlign = 'left';

  // Trim canvas to actual content height
  const finalH = currentY + 48;
  if (finalH < canvasH) {
    const trimmed = document.createElement('canvas');
    trimmed.width = canvasW * SCALE;
    trimmed.height = finalH * SCALE;
    const tCtx = trimmed.getContext('2d');
    if (tCtx) {
      tCtx.drawImage(canvas, 0, 0);
      return new Promise((resolve) => {
        trimmed.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
}
