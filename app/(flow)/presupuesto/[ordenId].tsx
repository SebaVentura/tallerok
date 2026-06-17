import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card } from '@/components/talleria/Card';
import { FlowNavBar } from '@/components/talleria/FlowNavBar';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';
import { parseMontoInput, recalcularPresupuesto } from '@/data/calcPresupuesto';
import { formatMonto } from '@/data/mock';
import type { ManoObra, PresupuestoSesion, Repuesto } from '@/types/presupuesto';
import {
  buildMensajeCliente,
  buildMockPresupuestoSesion,
  formatWhatsAppPhone,
  getPresupuestoSesionByOrdenId,
  setPdfUri,
  updatePresupuestoSesion,
} from '@/data/presupuestoSession';
import { generatePresupuestoPdf, sharePresupuestoPdf } from '@/services/presupuestoPdf';

export default function PresupuestoScreen() {
  const { ordenId } = useLocalSearchParams<{ ordenId: string }>();
  const router = useRouter();

  const sesionReal = useMemo(
    () => getPresupuestoSesionByOrdenId(ordenId ?? ''),
    [ordenId],
  );
  const esEjemplo = sesionReal == null;
  const inicial = sesionReal ?? buildMockPresupuestoSesion(ordenId ?? '');

  const [presupuesto, setPresupuesto] = useState<PresupuestoSesion | null>(inicial);
  const [localPdfUri, setLocalPdfUri] = useState<string | null>(() => inicial?.pdfUri ?? null);
  const [mpVisible, setMpVisible] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [pdfStale, setPdfStale] = useState(false);

  if (!presupuesto) {
    return (
      <Screen title="Presupuesto no disponible">
        <FlowNavBar />
        <PrimaryButton title="Volver" onPress={() => router.back()} />
      </Screen>
    );
  }

  const presupuestoNavLinks = [
    {
      label: 'Volver a Orden',
      onPress: () => router.push(`/(flow)/orden/${presupuesto.ordenId}` as const),
    },
    {
      label: 'Volver al Dashboard',
      onPress: () => router.replace('/(tabs)'),
    },
  ];

  const aplicarCambio = (patch: Partial<PresupuestoSesion>) => {
    setPresupuesto((prev) => {
      if (!prev) return prev;
      const next = recalcularPresupuesto({ ...prev, ...patch });
      if (prev.pdfUri) setPdfStale(true);
      return next;
    });
    setGuardadoOk(false);
  };

  const actualizarRepuesto = (id: string, field: keyof Repuesto, value: string) => {
    aplicarCambio({
      repuestos: presupuesto.repuestos.map((item) => {
        if (item.id !== id) return item;
        if (field === 'nombre') return { ...item, nombre: value };
        if (field === 'cantidad') {
          return { ...item, cantidad: Math.max(1, parseMontoInput(value) || 1) };
        }
        if (field === 'precioUnitario') return { ...item, precioUnitario: parseMontoInput(value) };
        return item;
      }),
    });
  };

  const actualizarManoObra = (id: string, field: keyof ManoObra, value: string) => {
    aplicarCambio({
      manoObra: presupuesto.manoObra.map((item) => {
        if (item.id !== id) return item;
        if (field === 'descripcion') return { ...item, descripcion: value };
        if (field === 'monto') return { ...item, monto: parseMontoInput(value) };
        return item;
      }),
    });
  };

  const agregarRepuesto = () => {
    aplicarCambio({
      repuestos: [
        ...presupuesto.repuestos,
        { id: `rep-${Date.now()}`, nombre: '', cantidad: 1, precioUnitario: 0 },
      ],
    });
  };

  const agregarManoObra = () => {
    aplicarCambio({
      manoObra: [...presupuesto.manoObra, { id: `mo-${Date.now()}`, descripcion: '', monto: 0 }],
    });
  };

  const regenerarMensaje = () => {
    setPresupuesto((prev) =>
      prev ? { ...prev, mensajeCliente: buildMensajeCliente(prev) } : prev,
    );
    setGuardadoOk(false);
  };

  const sesionPdfUri = getPresupuestoSesionByOrdenId(presupuesto.ordenId)?.pdfUri ?? null;
  console.log('PDF DEBUG', {
    localPdfUri,
    presupuestoPdfUri: presupuesto.pdfUri,
    sesionPdfUri,
    pdfDisponible: Boolean(localPdfUri ?? presupuesto.pdfUri ?? sesionPdfUri),
  });
  const pdfDisponible = Boolean(localPdfUri ?? presupuesto.pdfUri ?? sesionPdfUri);

  const handleGuardar = () => {
    updatePresupuestoSesion(presupuesto);
    setGuardadoOk(true);
    Alert.alert('Presupuesto guardado', 'El borrador quedó guardado en memoria para esta demo.');
  };

  const handleGenerarPdf = async () => {
    setGenerandoPdf(true);
    try {
      console.log('ANTES generar PDF');
      console.log({
        localPdfUri,
        presupuestoPdfUri: presupuesto.pdfUri,
        sesionPdfUri,
      });

      const calculado = recalcularPresupuesto(presupuesto);
      updatePresupuestoSesion(calculado);

      const uri = await generatePresupuestoPdf(calculado);

      console.log('DESPUES generar PDF');
      console.log({ uri });

      const generadoEn = new Date().toISOString();
      const actualizado: PresupuestoSesion = {
        ...calculado,
        pdfUri: uri,
        pdfGeneradoEn: generadoEn,
      };

      setLocalPdfUri(uri);
      console.log('SET localPdfUri', uri);
      setPresupuesto(actualizado);
      updatePresupuestoSesion(actualizado);
      console.log('SET sesion pdfUri', uri);
      setPdfUri(presupuesto.ordenId, uri, generadoEn);
      setPdfStale(false);
      Alert.alert('PDF generado correctamente');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error al generar PDF', message);
    } finally {
      setGenerandoPdf(false);
    }
  };

  const handleCompartirPdf = async () => {
    const pdfUri = localPdfUri ?? presupuesto.pdfUri ?? sesionPdfUri;

    if (!pdfUri) {
      Alert.alert('Primero generá el PDF');
      return;
    }

    try {
      console.log('Compartir PDF uri:', pdfUri);
      await sharePresupuestoPdf(pdfUri);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo compartir el PDF';
      Alert.alert('Error al compartir', message);
    }
  };

  const handleWhatsApp = async () => {
    const phone = formatWhatsAppPhone(presupuesto.clienteTelefono);
    if (!phone) {
      Alert.alert('Sin teléfono', 'No hay un teléfono válido para abrir WhatsApp.');
      return;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(presupuesto.mensajeCliente)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('WhatsApp no disponible', 'No se pudo abrir WhatsApp en este dispositivo.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'No se pudo abrir la conversación de WhatsApp.');
    }
  };

  const handleCompartirMensaje = async () => {
    try {
      await Share.share({ message: presupuesto.mensajeCliente });
    } catch {
      Alert.alert('Mensaje para cliente', presupuesto.mensajeCliente);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Presupuesto' }} />
      <Screen subtitle={`Paso 3 · ${presupuesto.numeroOrden}`}>
        <FlowNavBar links={presupuestoNavLinks} />
        {esEjemplo ? (
          <View style={styles.bannerEjemplo}>
            <Text style={styles.bannerEjemploText}>Presupuesto de ejemplo</Text>
            <Text style={styles.bannerEjemploSub}>
              Generá el presupuesto desde la Orden para usar datos reales del diagnóstico.
            </Text>
          </View>
        ) : (
          <View style={styles.bannerReal}>
            <Text style={styles.bannerRealText}>Presupuesto listo para enviar al cliente</Text>
          </View>
        )}

        {guardadoOk ? (
          <View style={styles.savedBadge}>
            <Text style={styles.savedText}>✓ Guardado en memoria</Text>
          </View>
        ) : null}

        {generandoPdf ? (
          <View style={styles.pdfStatusRow}>
            <ActivityIndicator color={TalleriaColors.accent} />
            <Text style={styles.pdfStatusText}>Generando PDF…</Text>
          </View>
        ) : null}

        {pdfDisponible && !generandoPdf ? (
          <View style={styles.pdfOkBadge}>
            <Text style={styles.pdfOkText}>
              {pdfStale ? '✓ PDF disponible (desactualizado)' : '✓ PDF listo para compartir'}
            </Text>
          </View>
        ) : null}

        {pdfStale && pdfDisponible ? (
          <View style={styles.pdfStaleBadge}>
            <Text style={styles.pdfStaleText}>
              Editaste el presupuesto — regenerá el PDF para actualizarlo
            </Text>
          </View>
        ) : null}

        <Card>
          <Text style={styles.docTitle}>Presupuesto de trabajo</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Cliente</Text>
            <Text style={styles.metaValue}>{presupuesto.clienteNombre}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Teléfono</Text>
            <Text style={styles.metaValue}>{presupuesto.clienteTelefono}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Vehículo</Text>
            <Text style={styles.metaValue}>
              {presupuesto.vehiculoPatente} · {presupuesto.vehiculoDescripcion}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Fecha</Text>
            <Text style={styles.metaValue}>{presupuesto.fecha}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionLabel}>Diagnóstico / resumen para cliente</Text>
          <TextInput
            style={styles.textArea}
            value={presupuesto.diagnosticoTexto}
            onChangeText={(text) => aplicarCambio({ diagnosticoTexto: text })}
            multiline
            placeholder="Resumen del diagnóstico para el cliente..."
            placeholderTextColor={TalleriaColors.textMuted}
          />
        </Card>

        {presupuesto.fotoPrincipalUri ? (
          <Card>
            <Text style={styles.sectionLabel}>Foto principal</Text>
            <Image
              source={{ uri: presupuesto.fotoPrincipalUri }}
              style={styles.heroPhoto}
              contentFit="cover"
            />
          </Card>
        ) : null}

        <Card>
          <Text style={styles.sectionLabel}>Repuestos</Text>
          {presupuesto.repuestos.map((item) => (
            <View key={item.id} style={styles.editBlock}>
              <TextInput
                style={styles.input}
                value={item.nombre}
                onChangeText={(v) => actualizarRepuesto(item.id, 'nombre', v)}
                placeholder="Nombre"
                placeholderTextColor={TalleriaColors.textMuted}
              />
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Cant.</Text>
                  <TextInput
                    style={styles.input}
                    value={String(item.cantidad)}
                    onChangeText={(v) => actualizarRepuesto(item.id, 'cantidad', v)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Precio unit.</Text>
                  <TextInput
                    style={styles.input}
                    value={item.precioUnitario > 0 ? String(item.precioUnitario) : ''}
                    onChangeText={(v) => actualizarRepuesto(item.id, 'precioUnitario', v)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={TalleriaColors.textMuted}
                  />
                </View>
                <View style={styles.subtotalChip}>
                  <Text style={styles.subtotalChipText}>
                    {formatMonto(item.cantidad * item.precioUnitario)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          <Pressable onPress={agregarRepuesto} style={styles.linkBtn}>
            <Text style={styles.linkBtnText}>+ Agregar repuesto</Text>
          </Pressable>
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Total repuestos</Text>
            <Text style={styles.subtotalMonto}>{formatMonto(presupuesto.totalRepuestos)}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionLabel}>Mano de obra</Text>
          {presupuesto.manoObra.map((item) => (
            <View key={item.id} style={styles.editBlock}>
              <TextInput
                style={styles.input}
                value={item.descripcion}
                onChangeText={(v) => actualizarManoObra(item.id, 'descripcion', v)}
                placeholder="Descripción"
                placeholderTextColor={TalleriaColors.textMuted}
              />
              <Text style={styles.inputLabel}>Monto</Text>
              <TextInput
                style={styles.input}
                value={item.monto > 0 ? String(item.monto) : ''}
                onChangeText={(v) => actualizarManoObra(item.id, 'monto', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={TalleriaColors.textMuted}
              />
            </View>
          ))}
          <Pressable onPress={agregarManoObra} style={styles.linkBtn}>
            <Text style={styles.linkBtnText}>+ Agregar mano de obra</Text>
          </Pressable>
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Total mano de obra</Text>
            <Text style={styles.subtotalMonto}>{formatMonto(presupuesto.totalManoObra)}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionLabel}>Observaciones</Text>
          <TextInput
            style={styles.textArea}
            value={presupuesto.observaciones}
            onChangeText={(text) => aplicarCambio({ observaciones: text })}
            multiline
            placeholder="Notas adicionales para el cliente..."
            placeholderTextColor={TalleriaColors.textMuted}
          />
        </Card>

        <Card>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total general</Text>
            <Text style={styles.totalMonto}>{formatMonto(presupuesto.totalGeneral)}</Text>
          </View>
          <View style={styles.adelantoRow}>
            <Text style={styles.inputLabel}>Adelanto sugerido (%)</Text>
            <TextInput
              style={styles.pctInput}
              value={String(presupuesto.porcentajeAdelanto)}
              onChangeText={(v) =>
                aplicarCambio({
                  porcentajeAdelanto: Math.min(100, Math.max(0, parseMontoInput(v))),
                })
              }
              keyboardType="numeric"
            />
          </View>
          <View style={styles.adelantoBox}>
            <Text style={styles.adelantoLabel}>
              Adelanto sugerido ({presupuesto.porcentajeAdelanto}%)
            </Text>
            <Text style={styles.adelantoMonto}>{formatMonto(presupuesto.adelantoSugerido)}</Text>
          </View>
        </Card>

        <Card>
          <View style={styles.msgHeader}>
            <Text style={styles.sectionLabel}>Mensaje para cliente</Text>
            <Pressable onPress={regenerarMensaje}>
              <Text style={styles.linkBtnText}>Actualizar</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.textAreaTall}
            value={presupuesto.mensajeCliente}
            onChangeText={(text) => aplicarCambio({ mensajeCliente: text })}
            multiline
            placeholder="Mensaje para WhatsApp..."
            placeholderTextColor={TalleriaColors.textMuted}
          />
        </Card>

        <PrimaryButton title="Guardar presupuesto" onPress={handleGuardar} />
        <PrimaryButton
          title={
            generandoPdf
              ? 'Generando PDF…'
              : presupuesto.pdfUri
                ? 'Regenerar PDF'
                : 'Generar PDF'
          }
          onPress={handleGenerarPdf}
          disabled={generandoPdf}
        />
        <PrimaryButton
          title="Compartir PDF"
          onPress={handleCompartirPdf}
          disabled={generandoPdf || !pdfDisponible}
        />
        <PrimaryButton title="Enviar por WhatsApp" onPress={handleWhatsApp} />
        <PrimaryButton title="Compartir / copiar mensaje" onPress={handleCompartirMensaje} />
        <PrimaryButton
          title="Solicitar adelanto Mercado Pago"
          onPress={() => setMpVisible(true)}
        />
      </Screen>

      <Modal visible={mpVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mercado Pago (simulado)</Text>
            <Text style={styles.modalBody}>
              Link de cobro por adelanto de {formatMonto(presupuesto.adelantoSugerido)}
            </Text>
            <Text style={styles.modalHint}>Ref: MP-MOCK-8842 · Demo visual</Text>
            <PrimaryButton title="Cerrar" onPress={() => setMpVisible(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bannerReal: {
    backgroundColor: `${TalleriaColors.success}22`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${TalleriaColors.success}55`,
    padding: 14,
  },
  bannerRealText: {
    color: TalleriaColors.success,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  bannerEjemplo: {
    backgroundColor: `${TalleriaColors.warning}18`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${TalleriaColors.warning}55`,
    padding: 14,
    gap: 6,
  },
  bannerEjemploText: {
    color: TalleriaColors.warning,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  bannerEjemploSub: {
    color: TalleriaColors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  savedBadge: {
    alignSelf: 'center',
    backgroundColor: `${TalleriaColors.success}22`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  savedText: {
    color: TalleriaColors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  pdfStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  pdfStatusText: {
    color: TalleriaColors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  pdfOkBadge: {
    alignSelf: 'center',
    backgroundColor: `${TalleriaColors.accent}22`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pdfOkText: {
    color: TalleriaColors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  pdfStaleBadge: {
    backgroundColor: `${TalleriaColors.warning}18`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${TalleriaColors.warning}55`,
    padding: 12,
  },
  pdfStaleText: {
    color: TalleriaColors.warning,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  docTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TalleriaColors.text,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 13,
    color: TalleriaColors.textMuted,
    flex: 1,
  },
  metaValue: {
    fontSize: 14,
    color: TalleriaColors.text,
    fontWeight: '500',
    flex: 1.4,
    textAlign: 'right',
  },
  sectionLabel: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  textArea: {
    fontSize: 15,
    color: TalleriaColors.text,
    lineHeight: 22,
    minHeight: 96,
    textAlignVertical: 'top',
    backgroundColor: TalleriaColors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
  },
  textAreaTall: {
    fontSize: 15,
    color: TalleriaColors.text,
    lineHeight: 22,
    minHeight: 160,
    textAlignVertical: 'top',
    backgroundColor: TalleriaColors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
  },
  heroPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: TalleriaColors.surfaceElevated,
  },
  editBlock: {
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: TalleriaColors.border,
  },
  input: {
    fontSize: 15,
    color: TalleriaColors.text,
    backgroundColor: TalleriaColors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  inputHalf: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtotalChip: {
    justifyContent: 'center',
    paddingBottom: 12,
  },
  subtotalChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: TalleriaColors.accent,
  },
  linkBtn: {
    paddingVertical: 6,
  },
  linkBtnText: {
    color: TalleriaColors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 10,
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TalleriaColors.textMuted,
  },
  subtotalMonto: {
    fontSize: 15,
    fontWeight: '700',
    color: TalleriaColors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: TalleriaColors.text,
  },
  totalMonto: {
    fontSize: 24,
    fontWeight: '800',
    color: TalleriaColors.accent,
  },
  adelantoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  pctInput: {
    width: 72,
    fontSize: 16,
    fontWeight: '700',
    color: TalleriaColors.text,
    backgroundColor: TalleriaColors.background,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    textAlign: 'center',
  },
  adelantoBox: {
    backgroundColor: TalleriaColors.background,
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  adelantoLabel: {
    fontSize: 13,
    color: TalleriaColors.textMuted,
  },
  adelantoMonto: {
    fontSize: 20,
    fontWeight: '700',
    color: TalleriaColors.text,
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: TalleriaColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TalleriaColors.text,
  },
  modalBody: {
    fontSize: 16,
    color: TalleriaColors.text,
  },
  modalHint: {
    fontSize: 14,
    color: TalleriaColors.success,
    marginBottom: 8,
  },
});
