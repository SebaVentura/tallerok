# Variables de entorno — API TallerOK

La app móvil TallerOK usa Expo con variables públicas (`EXPO_PUBLIC_*`) para la API independiente del backend TallerOK.

## Configuración rápida

1. En la raíz del proyecto Expo, copiá el ejemplo:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Editá `.env` y definí la URL base (sin barra final):

   ```env
   EXPO_PUBLIC_TALLEROK_API_URL=https://tallerok-api.crabbahia.com.ar/api
   ```

3. **Reiniciá Expo** después de cualquier cambio en `.env` (Metro no recarga variables en caliente):

   ```powershell
   Set-Location "C:\Users\Usuario\Desktop\Javi\Ventura\tallerok"
   npx expo start -c
   ```

## Variable requerida

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `EXPO_PUBLIC_TALLEROK_API_URL` | URL base de la API TallerOK | `https://tallerok-api.crabbahia.com.ar/api` |

Endpoints usados por la app:

- `GET /health` — prueba de conexión (panel debug)
- `POST /auth/login` — login
- `POST /auth/register-taller` — registro de taller
- `GET /me` — perfil autenticado

## Dónde se usa en el código

- `config/tallerokEnv.ts` — lectura centralizada de `process.env.EXPO_PUBLIC_TALLEROK_API_URL`
- `services/tallerok/tallerokClient.ts` — cliente HTTP con `TALLEROK_API_URL`
- `components/talleria/TallerOkDebugPanel.tsx` — muestra URL y botón **Probar conexión**

## Validar TypeScript (Windows PowerShell)

```powershell
Set-Location "C:\Users\Usuario\Desktop\Javi\Ventura\tallerok"
npx tsc --noEmit
```

## Git

- `.env` está en `.gitignore` (no se versiona)
- `.env.example` sí se versiona como plantilla

## Modo demo

Si la API no responde o no configuraste la variable, podés **Continuar en modo demo** desde la pantalla inicial. Los mocks siguen disponibles; la integración CRABB no se mezcla con la auth TallerOK.

## Depuración

En desarrollo (`EXPO_PUBLIC_APP_ENV=development`):

1. Pantalla inicial: warning si falta la variable en `.env`
2. Personalización → **Debug API TallerOK**: URL, env configurado, **Probar conexión** (`GET /health`)

Tras modificar `.env`, siempre ejecutá `npx expo start -c`.
