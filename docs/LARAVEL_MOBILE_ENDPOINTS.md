# Endpoints mobile CRABB — especificación Laravel (Fase 1)

El backend Laravel **no está en este repositorio**. La app móvil ya apunta a estos paths.
Implementar en la API CRABB existente bajo el prefix `/api/mobile`.

## Auth (mínimo requerido para Fase 1)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/mobile/auth/login` | No | Login socio/taller. Body: `{ email, password }`. Respuesta: `{ token, user, socio? }` |
| GET | `/api/mobile/me` | Bearer Sanctum | Perfil usuario + socio vinculado |
| POST | `/api/mobile/auth/logout` | Bearer | Revocar token actual |

### Respuesta esperada `GET /api/mobile/me`

```json
{
  "user": {
    "id": 1,
    "name": "Nombre",
    "email": "email@example.com",
    "role": "socio"
  },
  "socio": {
    "id": 123,
    "nro_socio": 171,
    "nombre_apellido": "Carlos Tropiano",
    "denominacion_taller": "Nombre taller",
    "estado": "activo",
    "estado_cuota": "al_dia"
  }
}
```

Ajustar campos a los modelos `User` y `Socio` existentes.

## Implementación sugerida en Laravel

```
routes/api/mobile.php          → Route::prefix('mobile')->group(...)
app/Http/Controllers/Api/Mobile/AuthController.php
app/Http/Resources/Mobile/UserResource.php
app/Http/Resources/Mobile/SocioResource.php
app/Http/Resources/Mobile/MeResource.php
```

### Middleware y seguridad

- `auth:sanctum` en rutas protegidas.
- Ability/token name distinto de admin, ej. `mobile-access`.
- Policy: el socio solo ve **su** registro (`socio_id` del usuario autenticado).
- No reutilizar controllers admin sin filtrar por socio autenticado.

## Endpoints preparados en la app (Fase 2+)

| Método | Endpoint | Notas |
|--------|----------|-------|
| GET | `/api/mobile/me/cuotas` | Estado cuota del socio autenticado |
| GET | `/api/mobile/me/cuotas/historial` | Historial propio |
| GET | `/api/mobile/me/collections/summary` | Resumen cobranzas propias |
| POST | `/api/mobile/me/collections/payment-link` | Link MP generado en servidor |
| GET | `/api/mobile/institutional/home` | Contenido público publicado |
| GET | `/api/mobile/news` | Novedades publicadas |
| GET | `/api/mobile/events` | Eventos publicados |

## Endpoints admin que NO debe consumir la app

- `GET /api/admin/cuotas/resumen`
- `GET /api/admin/cuotas/deudores`
- `GET /api/admin/collections/summary`
- `GET /api/admin/collections/debtors`
- Listados completos del padrón de socios
