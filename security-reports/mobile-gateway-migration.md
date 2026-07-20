# Mobile Gateway / BFF — Propuesta de migración (TallerOK)

> Estado: **propuesta, no implementada**. Este documento no cambia código ni contratos.
> Objetivo: consolidar los backends detrás de un único **Mobile Gateway (BFF)** para que el
> bundle deje de exponer hosts, rutas descriptivas y reglas de negocio.

## 1. Por qué el frontend solo no alcanza

En una app **expo-router + Hermes**, tres categorías de exposición **no** se pueden ocultar de
forma segura desde el cliente:

1. **Rutas de pantalla** = rutas de archivo = deep links. Renombrarlas a `r07` rompe deep links,
   typed routes y restauración de estado (comportamiento funcional prohibido de romper).
2. **Hosts y rutas de API**: si el cliente conoce la URL real, la URL viaja como literal en el
   bundle. Cualquier tabla de mapeo `operaciónOpaca → URL` incrustada en el cliente **sigue
   conteniendo la URL**. Sólo desaparece si el destino real lo resuelve el servidor.
3. **Reglas de negocio**: mientras se evalúen en el cliente, son recuperables.

Conclusión: la opacidad real de APIs/hosts/reglas requiere un **BFF** que exponga operaciones
opacas y estables, y traduzca a los backends internos del lado servidor.

## 2. Hosts / bases URL inventariados (evidencia del bundle base)

| Host / base | Uso | Inyección | Visible en bundle |
| --- | --- | --- | --- |
| `https://tallerok-api.crabbahia.com.ar/api` | API propia TallerOK | `EXPO_PUBLIC_TALLEROK_API_URL` (+ fallback en `config/tallerokEnv.ts`) | Sí (literal) |
| CRABB API | Integración externa (login/logout, sync) | `EXPO_PUBLIC_API_URL` | Rutas sí (`/mobile/auth/logout`); base según env |
| Transcribe API (Whisper, flujo demo) | Demo dictado | `EXPO_PUBLIC_TRANSCRIBE_API_URL` | Según env |

## 3. Topología propuesta

```
App móvil ──HTTPS──> mobile-api (BFF)
                        ├── auth        → CRABB / TallerOK auth
                        ├── taller      → TallerOK API (clientes, vehículos, órdenes)
                        ├── presupuestos→ TallerOK API
                        └── (futuro)    → pagos / reportes
```

- El cliente **sólo** conoce `https://mobile-api.<dominio>` y una lista de **operaciones opacas**.
- El BFF mantiene el mapa `operationId → (backend, método, path, transformación)` en el servidor.
- Errores y logs del cliente usan **sólo** el `operationId` compacto.

## 4. Mapa endpoint → operación opaca → destino → regla a mover al servidor

| Endpoint actual (cliente) | Operación opaca propuesta | Backend destino | Regla que debe moverse al servidor | Impacto migración |
| --- | --- | --- | --- | --- |
| `POST /auth/login` | `op_a01` | auth | Selección CRABB vs TallerOK, emisión de token | Medio |
| `POST /auth/register` | `op_a02` | auth | Alta de taller + usuario | Medio |
| `GET /me` | `op_a03` | auth | Fallback de sesión / normalización de payload (`unwrapAuthPayload`) | **Alto** (hoy en cliente) |
| `POST /mobile/auth/logout` (CRABB) | `op_a04` | auth | Revocación de sesión | Bajo |
| `GET /dashboard` | `op_d01` | taller | Agregación de métricas | Medio |
| `GET /clientes` `GET /clientes/:id` | `op_c01` `op_c02` | taller | Filtro/scoping por taller (multi-tenant) | Medio |
| `POST/PATCH/DELETE /clientes...` | `op_c03..c05` | taller | Validación y ownership | Medio |
| `GET /vehiculos` `GET /clientes/:id/vehiculos` | `op_v01` `op_v02` | taller | Fallback de endpoint (hoy el cliente prueba 2 rutas) | **Alto** |
| `GET/POST/PATCH /ordenes...` | `op_o01..o04` | taller | Estados de orden, transiciones válidas | **Alto** |
| `.../presupuesto` | `op_p01` | presupuestos | Cálculo de totales/impuestos (hoy parcialmente en `data/calcPresupuesto.ts`) | **Alto** |

> Los identificadores `op_*` son ilustrativos. El diccionario completo `op_* → significado`
> **no** debe incluirse en el bundle: vive en el BFF y en documentación privada.

## 5. Reglas que hoy están en el cliente y deberían moverse

- Normalización de payload de auth (`services/tallerok/tallerokSessionNormalize.ts`,
  `unwrapAuthPayload`) — revela forma de la respuesta del backend.
- Fallback de endpoint de vehículos (`tallerokVehiculosApi.ts`) — revela dos rutas del backend.
- Cálculo de presupuesto (`data/calcPresupuesto.ts`) — lógica de negocio recuperable.
- Selección de backend/modo de conexión (`hooks/useConnectionMode.ts`, `context/*AuthContext`).

## 6. Impacto y orden de migración sugerido

1. Levantar `mobile-api` como passthrough (mismas respuestas) → riesgo bajo, sin cambio de UX.
2. Migrar auth (`op_a*`) y mover normalización/fallbacks al servidor.
3. Migrar taller (clientes/vehículos/órdenes) con scoping multi-tenant server-side.
4. Migrar presupuestos y mover el cálculo.
5. Retirar del cliente hosts y rutas descriptivas; dejar sólo `mobile-api` + `op_*`.

## 7. Qué se gana (y qué no)

- **Se oculta**: hosts internos, rutas descriptivas, forma de respuestas, reglas de negocio.
- **No se oculta por sí solo**: nombres de pantalla (necesita shielding/rediseño de rutas) ni
  símbolos de función en Hermes (necesita ofuscación post-build). Ver informe final.
