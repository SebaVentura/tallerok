# TallerOK — Backend de transcripción local

API FastAPI + faster-whisper para transcribir audios del diagnóstico de **TallerOK** desde Expo Go en la misma red WiFi.
## Requisitos

- Python 3.11+
- PC y celular en la **misma red WiFi**
- ~1 GB libre (modelo `base` se descarga en el primer arranque)

## Instalación

```powershell
cd c:\proyectos\talleria\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Ejecución

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- `--host 0.0.0.0` permite conexiones desde el celular.
- La primera vez descarga el modelo `base` (puede tardar varios minutos).

## Obtener IP local de la PC

```powershell
ipconfig
```

Buscar **IPv4** de la interfaz WiFi, por ejemplo: `192.168.1.45`

Configurar esa IP en `services/transcription.ts` del frontend:

```ts
const TRANSCRIBE_API_URL = 'http://192.168.1.45:8000/transcribe';
```

## Firewall Windows

Si el celular no conecta, permitir entrada TCP en el puerto **8000** para redes privadas.

## Probar backend solo

### Health check

```powershell
curl http://127.0.0.1:8000/health
```

Respuesta esperada:

```json
{"status":"ok","model":"base","language":"es","model_loaded":true}
```

### Transcribir un audio

```powershell
curl -X POST "http://127.0.0.1:8000/transcribe" -F "file=@C:\ruta\test.m4a"
```

Respuesta esperada:

```json
{"text":"texto transcrito","language":"es","model":"base"}
```

Documentación interactiva (TallerOK API): http://127.0.0.1:8000/docs
## Probar desde Expo Go

1. Backend corriendo con `--host 0.0.0.0`.
2. IP configurada en `services/transcription.ts`.
3. `npx expo start` en la raíz del proyecto.
4. En TallerOK: Clientes → Vehículo → Diagnóstico IA.5. Grabar audio → Detener → debe aparecer "Transcribiendo diagnóstico…".
6. Tras unos segundos, el texto real reemplaza el mock.

## Modelo

- Actual: `base` (rápido en CPU).
- Si la precisión es baja, cambiar `MODEL_NAME` en `main.py` a `small` y reiniciar.
