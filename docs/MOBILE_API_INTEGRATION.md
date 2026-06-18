# Integración móvil CRABB — Fase 1

Documentación de la primera fase de vinculación entre TallerOK (Expo) y la API Laravel CRABB.

## Configuración local

1. Copiar `.env.example` a `.env`
2. Definir `EXPO_PUBLIC_API_URL` (ej. `https://api.crabbahia.com.ar/api`)
3. Opcional: `EXPO_PUBLIC_TRANSCRIBE_API_URL` para diagnóstico por audio en dev
4. Reiniciar Metro: `npx expo start -c`

## Seguridad

- Token Sanctum guardado en AsyncStorage (migrar a SecureStore en Fase 2).
- La app **no** consume endpoints `/admin/*` que exponen datos globales.
- Servicios `cuotasService`, `collectionsService` y `contentService` apuntan a rutas `/mobile/*` pendientes en Laravel.
- Montos de cobro: solo el servidor debe generar links de pago (ver `collectionsService`).

## Backend requerido

Ver especificación completa en `docs/LARAVEL_MOBILE_ENDPOINTS.md`.

Mínimo para probar login:

- `POST /api/mobile/auth/login`
- `GET /api/mobile/me`
- `POST /api/mobile/auth/logout`
