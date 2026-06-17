import { File } from 'expo-file-system';

import { formatMonto } from '@/data/mock';
import type { PresupuestoSesion } from '@/types/presupuesto';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMontoPdf(value: number): string {
  return escapeHtml(formatMonto(value));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function guessImageMime(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function loadFotoBase64(uri: string): Promise<string | null> {
  try {
    const file = new File(uri);
    const buffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    return `data:${guessImageMime(uri)};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function buildPresupuestoHtml(presupuesto: PresupuestoSesion): Promise<string> {
  const fotoBase64 = presupuesto.fotoPrincipalUri
    ? await loadFotoBase64(presupuesto.fotoPrincipalUri)
    : null;

  const repuestosRows =
    presupuesto.repuestos.length === 0
      ? `<tr><td colspan="4" class="muted">Sin repuestos cargados</td></tr>`
      : presupuesto.repuestos
          .map((item) => {
            const subtotal = item.cantidad * item.precioUnitario;
            return `<tr>
              <td>${escapeHtml(item.nombre || 'Repuesto')}</td>
              <td class="num">${item.cantidad}</td>
              <td class="num">${formatMontoPdf(item.precioUnitario)}</td>
              <td class="num">${formatMontoPdf(subtotal)}</td>
            </tr>`;
          })
          .join('');

  const manoObraRows =
    presupuesto.manoObra.length === 0
      ? `<tr><td colspan="2" class="muted">Sin mano de obra cargada</td></tr>`
      : presupuesto.manoObra
          .map(
            (item) => `<tr>
              <td>${escapeHtml(item.descripcion || 'Concepto')}</td>
              <td class="num">${formatMontoPdf(item.monto)}</td>
            </tr>`,
          )
          .join('');

  const fotoBlock = fotoBase64
    ? `<div class="section section-compact section-photo">
        <h2>Evidencia fotográfica</h2>
        <img src="${fotoBase64}" class="evidence-photo" alt="Evidencia" />
      </div>`
    : '';

  const observaciones = presupuesto.observaciones.trim()
    ? escapeHtml(presupuesto.observaciones.trim())
    : '—';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4;
      margin: 12mm;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111827;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      padding: 0;
    }
    .header {
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 14px;
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .taller {
      font-size: 22px;
      font-weight: 800;
      color: #4f46e5;
      margin: 0 0 4px;
    }
    .doc-type {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .meta-table td {
      width: 50%;
      vertical-align: top;
      padding: 5px 8px 5px 0;
    }
    .meta-label {
      display: block;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-bottom: 2px;
    }
    .meta-value {
      font-weight: 600;
      color: #111827;
    }
    .section {
      margin-bottom: 18px;
    }
    .section-compact {
      page-break-inside: avoid;
    }
    .section-text {
      page-break-inside: auto;
    }
    h2 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
      margin: 0 0 10px;
    }
    .diagnostico {
      background: #f9fafb;
      border-left: 4px solid #4f46e5;
      padding: 10px 12px;
      white-space: pre-wrap;
      word-wrap: break-word;
      color: #111827;
    }
    .evidence-photo {
      display: block;
      max-width: 100%;
      width: auto;
      height: auto;
      border: 1px solid #e5e7eb;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }
    table.data-table thead {
      display: table-header-group;
    }
    table.data-table tr {
      page-break-inside: avoid;
    }
    table.data-table th,
    table.data-table td {
      padding: 7px 8px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      color: #111827;
    }
    table.data-table th {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      background: #f9fafb;
    }
    .num { text-align: right; white-space: nowrap; }
    .muted { color: #9ca3af; font-style: italic; }
    .observaciones {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      color: #111827;
    }
    .totals {
      margin-top: 18px;
      background: #f9fafb;
      padding: 12px;
      page-break-inside: avoid;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 0;
      border-bottom: 1px solid #e5e7eb;
      color: #111827;
    }
    .totals-table .num {
      text-align: right;
      font-weight: 700;
    }
    .totals-table .grand td {
      border-top: 2px solid #4f46e5;
      border-bottom: none;
      padding-top: 8px;
      font-size: 15px;
      font-weight: 800;
      color: #4f46e5;
    }
    .adelanto {
      margin-top: 10px;
      padding: 10px;
      background: #eef2ff;
      text-align: center;
      font-size: 12px;
      color: #111827;
      page-break-inside: avoid;
    }
    .adelanto strong {
      display: block;
      font-size: 17px;
      color: #4338ca;
      margin-top: 4px;
    }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="header">
    <p class="taller">${escapeHtml(presupuesto.nombreTaller)}</p>
    <p class="doc-type">Presupuesto de trabajo · ${escapeHtml(presupuesto.numeroOrden)}</p>
  </div>

  <table class="meta-table">
    <tr>
      <td><span class="meta-label">Cliente</span><span class="meta-value">${escapeHtml(presupuesto.clienteNombre)}</span></td>
      <td><span class="meta-label">Teléfono</span><span class="meta-value">${escapeHtml(presupuesto.clienteTelefono)}</span></td>
    </tr>
    <tr>
      <td><span class="meta-label">Vehículo</span><span class="meta-value">${escapeHtml(presupuesto.vehiculoDescripcion)}</span></td>
      <td><span class="meta-label">Patente</span><span class="meta-value">${escapeHtml(presupuesto.vehiculoPatente)}</span></td>
    </tr>
    <tr>
      <td><span class="meta-label">Fecha</span><span class="meta-value">${escapeHtml(presupuesto.fecha)}</span></td>
      <td><span class="meta-label">Orden</span><span class="meta-value">${escapeHtml(presupuesto.numeroOrden)}</span></td>
    </tr>
  </table>

  <div class="section section-text">
    <h2>Diagnóstico</h2>
    <div class="diagnostico">${escapeHtml(presupuesto.diagnosticoTexto.trim() || 'Sin diagnóstico cargado.')}</div>
  </div>

  ${fotoBlock}

  <div class="section">
    <h2>Repuestos</h2>
    <table class="data-table">
      <thead>
        <tr><th>Descripción</th><th class="num">Cant.</th><th class="num">P. unit.</th><th class="num">Subtotal</th></tr>
      </thead>
      <tbody>${repuestosRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>Mano de obra</h2>
    <table class="data-table">
      <thead><tr><th>Descripción</th><th class="num">Monto</th></tr></thead>
      <tbody>${manoObraRows}</tbody>
    </table>
  </div>

  <div class="section section-text">
    <h2>Observaciones</h2>
    <p class="observaciones">${observaciones}</p>
  </div>

  <div class="totals">
    <table class="totals-table">
      <tr><td>Total repuestos</td><td class="num">${formatMontoPdf(presupuesto.totalRepuestos)}</td></tr>
      <tr><td>Total mano de obra</td><td class="num">${formatMontoPdf(presupuesto.totalManoObra)}</td></tr>
      <tr class="grand"><td>Total general</td><td class="num">${formatMontoPdf(presupuesto.totalGeneral)}</td></tr>
    </table>
    <div class="adelanto">
      Adelanto sugerido (${presupuesto.porcentajeAdelanto}%)
      <strong>${formatMontoPdf(presupuesto.adelantoSugerido)}</strong>
    </div>
  </div>

  <div class="footer">Documento generado por TallerOK</div>
</body>
</html>`;
}
