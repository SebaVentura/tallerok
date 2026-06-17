import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { recalcularPresupuesto } from '@/data/calcPresupuesto';
import { buildPresupuestoHtml } from '@/templates/presupuestoPdfHtml';
import type { PresupuestoSesion } from '@/types/presupuesto';

function resolveFileUriForShare(uri: string): string {
  if (uri.startsWith('file://')) {
    return uri;
  }

  if (uri.startsWith('content://')) {
    throw new Error(
      'La URI del PDF no es válida para compartir (content://). Regenerá el PDF.',
    );
  }

  throw new Error('La URI del PDF no es una ruta local file:// válida.');
}

async function ensureShareablePdfUri(sourceUri: string, ordenId: string): Promise<string> {
  const safeId = ordenId.replace(/\W/g, '-');
  const dest = `${FileSystem.cacheDirectory}presupuesto-${safeId}.pdf`;

  const destInfo = await FileSystem.getInfoAsync(dest);
  if (destInfo.exists) {
    await FileSystem.deleteAsync(dest, { idempotent: true });
  }

  await FileSystem.copyAsync({ from: sourceUri, to: dest });

  if (!dest.startsWith('file://')) {
    return `file://${dest}`;
  }

  return dest;
}

export async function generatePresupuestoPdf(presupuesto: PresupuestoSesion): Promise<string> {
  const calculado = recalcularPresupuesto(presupuesto);
  const html = await buildPresupuestoHtml(calculado);
  const result = await Print.printToFileAsync({ html });

  console.log('printToFileAsync result:', result);
  if (result.uri) {
    console.log('printToFileAsync uri:', result.uri);
  }
  if (result.numberOfPages != null) {
    console.log('printToFileAsync numberOfPages:', result.numberOfPages);
  }

  const uri = result.uri;

  if (!uri) {
    throw new Error('No se pudo crear el archivo PDF');
  }

  const info = await FileSystem.getInfoAsync(uri);
  console.log('PDF info:', info);
  console.log('PDF uri original (print):', uri);

  const pdfUri = await ensureShareablePdfUri(uri, calculado.ordenId);
  console.log('PDF uri final guardada:', pdfUri);

  return pdfUri;
}

export async function sharePresupuestoPdf(pdfUri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Compartir no está disponible en este dispositivo');
  }

  const fileUri = resolveFileUriForShare(pdfUri);

  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists) {
    throw new Error('No se encontró el archivo PDF generado');
  }

  console.log('shareAsync uri:', fileUri);

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Compartir presupuesto PDF',
  });
}
