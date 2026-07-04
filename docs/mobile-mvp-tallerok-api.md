# TallerOK Mobile — MVP con tallerok-api

La app móvil TallerOK consume **exclusivamente** la API independiente en:

```
https://tallerok-api.crabbahia.com.ar/api
```

No usa `crabb-api` para datos de TallerOK. La integración CRABB (`EXPO_PUBLIC_API_URL`) sigue disponible en Personalización como sistema separado.

## Variable de entorno

```env
EXPO_PUBLIC_TALLEROK_API_URL=https://tallerok-api.crabbahia.com.ar/api
```

Definida en `.env` y documentada en `.env.example`. El cliente HTTP está en `config/tallerokEnv.ts` y `services/tallerok/tallerokClient.ts`.

Si la variable no está en `.env`, la app usa el mismo URL como fallback en desarrollo, pero `isTallerOkApiConfigured` queda en `false` para mostrar avisos en la UI.

## Autenticación y modos

| Modo | Cómo se activa | Fuente de datos |
|------|----------------|-----------------|
| **Sin sesión** | Primera apertura en `/` | No hay acceso a tabs (AuthGate redirige) |
| **Demo** | "Continuar en modo demo" | `data/mock.ts` — **no llama API** |
| **TallerOK** | Login o registro en `/` | `tallerok-api` con Bearer token |

### Flujos

- **Primera apertura** (`app/index.tsx`): welcome con login, registro o demo.
- **Login / registro**: validación local (email válido, contraseña mín. 8 en registro) antes de llamar API.
- **Logout**: limpia token (`@tallerok/access_token`) y vuelve a welcome vía AuthGate.
- **401**: el cliente limpia sesión y marca `sessionExpired` en `TallerOkAuthContext`.
- **Demo persistente**: flag `@tallerok/demo_mode_chosen`.

Tokens y contraseñas **no se loguean** en consola.

## Pantallas conectadas a tallerok-api

Solo cuando `isAuthenticated === true` (no en demo):

| Pantalla | Endpoints |
|----------|-----------|
| Dashboard (`app/(tabs)/index.tsx`) | `GET /dashboard` |
| Clientes (`app/(tabs)/clientes.tsx`) | `GET/POST /clientes`, búsqueda local + filtros |
| Ficha cliente (`app/(flow)/cliente/[id].tsx`) | `GET/PATCH/DELETE /clientes/:id`, `GET/POST .../vehiculos` |
| Ficha vehículo (`app/(flow)/vehiculo/[id].tsx`) | `GET/PATCH /vehiculos/:id`, `GET .../historial` |
| Datos del taller (`TallerOkTallerSection` en Personalización) | `GET/PATCH /taller/me` |
| Cuenta TallerOK (`TallerOkAuthSection`) | `POST /auth/login`, `POST /auth/register-taller`, `GET /me` |

### Servicios API (`services/tallerok/`)

- `tallerokClient.ts` — cliente HTTP con auth
- `tallerokClientesApi.ts` — CRUD clientes
- `tallerokVehiculosApi.ts` — CRUD vehículos + historial
- `tallerokDashboardApi.ts` — dashboard
- `tallerokTallerApi.ts` — perfil del taller
- `tallerokMappers.ts` — normalización de respuestas API

## Pantallas que siguen en mock

No implementadas contra API real (por diseño del MVP):

- Diagnóstico IA (`app/(flow)/diagnostico/[id].tsx`)
- Órdenes de trabajo (`app/(flow)/orden/[id].tsx`)
- Presupuestos (`app/(flow)/presupuesto/[id].tsx`)
- Resumen / pagos (`app/(flow)/resumen/[id].tsx`)
- KPIs comerciales demo del dashboard (facturación, top trabajos, etc.)

En modo demo se mantienen los flujos mock de diagnóstico → orden → presupuesto.

## Estados vacíos

- Historial de vehículo sin órdenes: *"Todavía no hay órdenes registradas para este vehículo."*
- Dashboard sin actividad: *"Sin actividad reciente por ahora."*
- Clientes sin resultados de búsqueda: mensaje con opción de limpiar filtros.

## Badges de conexión

- Autenticado: **"Conectado a TallerOK: {taller.nombre}"** (dashboard y `ConnectionBadge`)
- Demo: **"Modo demo"**

## CRABB (separado)

- Variable: `EXPO_PUBLIC_API_URL`
- Contexto: `AuthContext` (token `@crabb/mobile_token`)
- UI: sección CRABB en Personalización
- No interfiere con auth TallerOK ni con datos de clientes/vehículos del MVP.

## Debug (solo desarrollo)

`TallerOkDebugPanel` en Personalización: health check, refresh `/me`, limpiar sesión. Visible cuando `EXPO_PUBLIC_APP_ENV=development`.

## Próximos módulos

1. Órdenes de trabajo (CRUD + estados)
2. Diagnósticos (integración real, no solo mock)
3. Presupuestos y cobros
4. `GET/PUT /taller/settings` para configuración avanzada del taller

## Comandos de validación (PowerShell)

```powershell
Set-Location "C:\Users\Usuario\Desktop\Javi\Ventura\tallerok"
npx tsc --noEmit
npx expo start -c
```

## Checklist manual

- [ ] Primera apertura → welcome
- [ ] Modo demo → tabs con mocks
- [ ] Login real → dashboard API
- [ ] Logout → vuelve a welcome
- [ ] Listar / crear / editar / eliminar clientes
- [ ] Crear vehículo desde ficha cliente
- [ ] Ver vehículo e historial vacío
- [ ] Editar datos del taller en Personalización
- [ ] CRABB login/logout sigue funcionando
