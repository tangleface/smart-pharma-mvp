from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from openai import OpenAI

from app.config import get_settings


router = APIRouter(prefix="/vnext", tags=["vnext-transcription"])


@router.post("/transcribe")
async def transcribe_field_report(audio: UploadFile = File(...)) -> dict[str, str]:
    settings = get_settings()

    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is required for voice transcription.",
        )

    content_type = audio.content_type or ""
    if not content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="An audio file is required.")

    payload = await audio.read()
    if not payload:
        raise HTTPException(status_code=400, detail="The audio recording is empty.")

    # Keep the prototype intentionally simple: audio is processed in memory and is
    # not persisted by this endpoint. The returned transcript is editable by the rep.
    buffer = BytesIO(payload)
    buffer.name = audio.filename or "field-report.webm"

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        result = client.audio.transcriptions.create(
            model=settings.openai_transcription_model,
            file=buffer,
            language="fr",
            prompt=(
                "Rapport de visite pharmaceutique. Conserver fidèlement les noms de produits, "
                "pharmacies, médecins, disponibilité, rotation, objections et prochaines étapes."
            ),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Voice transcription failed.") from exc

    text = getattr(result, "text", "") or ""
    return {
        "text": text.strip(),
        "status": "transcribed",
    }
