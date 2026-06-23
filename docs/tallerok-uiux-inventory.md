# TallerOK — Inventario UI/UX

Documento de referencia para el rediseño UI/UX de la app móvil TallerOK (Expo / React Native).

**Última actualización:** junio 2026  
**API base:** `EXPO_PUBLIC_TALLEROK_API_URL` → `https://tallerok-api.crabbahia.com.ar/api`

---

## Leyenda

| Campo | Valores |
|-------|---------|
| **Estado** | `mock` · `real` · `parcial` · `pendiente` |
| **Prioridad UI/UX** | `alta` · `media` · `baja` |
| **Backend** | `sí` / `no` |

---

## A. Onboarding / Login / Registro

| Funcionalidad | Estado | Pantalla actual | Prioridad | Backend | Observaciones |
|---------------|--------|-----------------|-----------|---------|---------------|
| Login TallerOK | real | `app/(tabs)/personalizacion.tsx` → `TallerOkAuthSection` | alta | sí | Email + contraseña, loading, errores, guarda token |
| Registro taller | real | `app/(tabs)/personalizacion.tsx` → `TallerOkAuthSection` | alta | sí | `POST /auth/register-taller`, confirmación de contraseña |
| Modo demo | real | Sin bloqueo de rutas; badge en tabs | alta | no | `ConnectionBadge` + banner en dashboard |
| Logout TallerOK | real | `TallerOkAuthSection` + debug panel | media | no | Limpia token local |
| Sesión expirada | real | Dashboard + `TallerOkAuthSection` | alta | sí | 401 borra token y muestra mensaje |
| Estado conectado/desconectado | real | `ConnectionBadge`, dashboard, clientes | alta | no | `useConnectionMode` + contexto TallerOK |

---

## B. Dashboard

| Funcionalidad | Estado | Pantalla actual | Prioridad | Backend | Observaciones |
|---------------|--------|-----------------|-----------|---------|---------------|
| KPIs (demo) | mock | `app/(tabs)/index.tsx` | media | no | Facturación, ganancia, ticket, etc. desde `data/mock.ts` |
| KPIs (API) | real | `app/(tabs)/index.tsx` | alta | sí | `GET /dashboard`: clientes, vehículos, órdenes, presupuestos |
| Actividad reciente (demo) | mock | `app/(tabs)/index.tsx` | media | no | Historial mock con navegación a orden/vehículo |
| Actividad reciente (API) | parcial | `app/(tabs)/index.tsx` | alta | sí | Lista desde API; tap a orden puede ir a flujo demo |
| Accesos rápidos | parcial | `app/(tabs)/index.tsx` | media | no | "Ver clientes", orden demo activa |
| Estado API / modo | real | Dashboard + badge | alta | no | Banner demo, card taller conectado |
| Próximas tareas | pendiente | — | baja | sí | No implementado en UI |

---

## C. Clientes

| Funcionalidad | Estado | Pantalla actual | Prioridad | Backend | Observaciones |
|---------------|--------|-----------------|-----------|---------|---------------|
| Listado | real | `app/(tabs)/clientes.tsx` | alta | sí | API si hay sesión; mock si demo |
| Búsqueda general | real | `app/(tabs)/clientes.tsx` | alta | parcial | Filtro frontend; query params preparados en servicio |
| Filtros (nombre, tel, email, doc) | real | `app/(tabs)/clientes.tsx` | media | parcial | Panel avanzado colapsable |
| Crear cliente | pendiente | — | alta | sí | API `createCliente` existe, sin UI |
| Editar cliente | pendiente | — | alta | sí | API `updateCliente` existe, sin UI |
| Eliminar cliente | pendiente | — | media | sí | API `deleteCliente` existe, sin UI |
| Ver vehículos | parcial | Tap cliente → primer vehículo | media | sí | Sin selector si hay varios vehículos |

---

## D. Vehículos

| Funcionalidad | Estado | Pantalla actual | Prioridad | Backend | Observaciones |
|---------------|--------|-----------------|-----------|---------|---------------|
| Ficha técnica | real | `app/(flow)/vehiculo/[id].tsx` | alta | sí | Patente, marca, modelo, km, cliente |
| Historial | parcial | `app/(flow)/vehiculo/[id].tsx` | alta | sí | `GET /vehiculos/:id/historial`; empty state explicativo |
| Crear vehículo | pendiente | — | alta | sí | API lista, sin formulario |
| Editar vehículo | pendiente | — | media | sí | API lista, sin formulario |
| Buscar por patente | pendiente | — | media | sí | No hay pantalla de búsqueda global |
| Asociar a cliente | parcial | Implícito en API | media | sí | `clienteId` en vehículo |

---

## E. Diagnóstico

| Funcionalidad | Estado | Pantalla actual | Prioridad | Backend | Observaciones |
|---------------|--------|-----------------|-----------|---------|---------------|
| Crear diagnóstico | mock | `app/(flow)/diagnostico/[vehiculoId].tsx` | alta | no | Solo modo demo |
| Grabar audio | mock | `diagnostico/[vehiculoId].tsx` | alta | no | Simulado |
| Sacar fotos | mock | `diagnostico/[vehiculoId].tsx` | media | no | Evidencias mock |
| Adjuntar evidencias | mock | `diagnostico/[vehiculoId].tsx` | media | no | |
| Transcripción | parcial | `services/transcription.ts` | media | opcional | URL local opcional |
| Resumen IA | mock | `diagnostico/[vehiculoId].tsx` | alta | no | Texto generado en demo |
| Confirmar tareas | mock | `diagnostico/[vehiculoId].tsx` | alta | no | Deriva a orden demo |

---

## F. Órdenes de trabajo

| Funcionalidad | Estado | Pantalla actual | Prioridad | Backend | Observaciones |
|---------------|--------|-----------------|-----------|---------|---------------|
| Crear orden | mock | Flujo desde diagnóstico | alta | no | `data/demoSession.ts` |
| Estados | mock | `app/(flow)/orden/[id].tsx` | alta | no | Badge + estados demo |
| Tareas | mock | `orden/[id].tsx` | alta | no | |
| Repuestos | mock | `orden/[id].tsx` | media | no | |
| Mano de obra | mock | `orden/[id].tsx` | media | no | |
| Cierre de orden | mock | `orden/[id].tsx` | media | no | |

---

## G. Presupuestos

| Funcionalidad | Estado | Pantalla actual | Prioridad | Backend | Observaciones |
|---------------|--------|-----------------|-----------|---------|---------------|
| Ítems | mock | `app/(flow)/presupuesto/[ordenId].tsx` | alta | no | |
| Totales | mock | `presupuesto/[ordenId].tsx` | alta | no | `data/calcPresupuesto.ts` |
| PDF | mock | `services/presupuestoPdf.ts` | media | no | HTML → PDF local |
| WhatsApp | mock | `presupuesto/[ordenId].tsx` | media | no | Share sheet |
| Adelanto sugerido | mock | `presupuesto/[ordenId].tsx` | media | no | |
| Aprobación/rechazo | mock | `presupuesto/[ordenId].tsx` | alta | no | |

---

## H. Pagos

| Funcionalidad | Estado | Pantalla actual | Prioridad | Backend | Observaciones |
|---------------|--------|-----------------|-----------|---------|---------------|
| Adelantos | mock | `resumen/[ordenId].tsx` | media | no | KPI demo en dashboard |
| Pagos | mock | `resumen/[ordenId].tsx` | media | no | |
| Estado | pendiente | — | baja | sí | |
| Integración futura | pendiente | — | baja | sí | Pasarela / CRABB pagos |

---

## I. Configuración

| Funcionalidad | Estado | Pantalla actual | Prioridad | Backend | Observaciones |
|---------------|--------|-----------------|-----------|---------|---------------|
| Datos taller | parcial | `personalizacion.tsx` | alta | sí | Lectura desde `/me`; edición API pendiente en UI |
| Logo | parcial | `personalizacion.tsx` | media | sí | Iniciales locales; `logoUrl` en tipo settings sin UI |
| Color acento | mock | `personalizacion.tsx` | media | sí | Solo local, no persiste |
| Teléfono / Dirección | parcial | Sesión TallerOK | media | sí | Visible post-login; sin edición |
| Datos fiscales | pendiente | — | baja | sí | No en app |

---

## J. Debug / soporte

| Funcionalidad | Estado | Pantalla actual | Prioridad | Backend | Observaciones |
|---------------|--------|-----------------|-----------|---------|---------------|
| Estado API | real | `TallerOkDebugPanel` en personalización | media | sí | Solo en `development` |
| Último error | real | `TallerOkDebugPanel` | media | no | `tallerokApiLogger` |
| Probar conexión | real | `TallerOkDebugPanel` | media | sí | `GET /health` |
| Probar /me | real | `TallerOkDebugPanel` | media | sí | Requiere sesión |
| Limpiar sesión | real | `TallerOkDebugPanel` | media | no | |
| Ver modo actual | real | Badge + debug panel | media | no | `demo` / `tallerok_connected` / `crabb_connected` |
| Logs API (consola) | real | `services/tallerok/tallerokApiLogger.ts` | baja | no | Dev only, sin tokens |

---

## Arquitectura de conexión (referencia)

```
AuthProvider (CRABB)
  └── TallerOkAuthProvider
        ├── connectionMode: demo | tallerok_connected | crabb_connected
        ├── token TallerOK → @tallerok/access_token
        └── lastApiError / lastApiStatus / lastApiCheckAt

useConnectionMode() → prioridad: TallerOK > CRABB > demo
```

**Pantallas con datos reales TallerOK:** Dashboard, Clientes, Vehículo (lectura).  
**Flujos solo demo:** Diagnóstico, Orden, Presupuesto, Resumen.

---

## Prioridades sugeridas para rediseño

1. **Alta:** Login/registro, dashboard conectado, listado+búsqueda clientes, ficha vehículo, estados vacíos/loading.
2. **Media:** CRUD clientes/vehículos, configuración taller persistida, selector de vehículo por cliente.
3. **Baja:** Pagos, datos fiscales, plantilla `explore.tsx` (remover o reemplazar).
