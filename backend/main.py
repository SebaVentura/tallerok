import os
import tempfile
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

MODEL_NAME = "base"
LANGUAGE = "es"

whisper_model: WhisperModel | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global whisper_model
    print(f"Cargando modelo faster-whisper '{MODEL_NAME}'...")
    whisper_model = WhisperModel(MODEL_NAME, device="cpu", compute_type="int8")
    print("Modelo listo.")
    yield


app = FastAPI(title="TallerOK API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "language": LANGUAGE,
        "model_loaded": whisper_model is not None,
    }


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if whisper_model is None:
        raise HTTPException(status_code=503, detail="Modelo no cargado")

    suffix = os.path.splitext(file.filename or "audio.m4a")[1] or ".m4a"
    tmp_path: str | None = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        segments, _info = whisper_model.transcribe(
            tmp_path,
            language=LANGUAGE,
            vad_filter=True,
        )
        text = " ".join(segment.text.strip() for segment in segments).strip()

        if not text:
            raise HTTPException(status_code=422, detail="No se detectó texto en el audio")

        return {
            "text": text,
            "language": LANGUAGE,
            "model": MODEL_NAME,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al transcribir: {exc}") from exc
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
