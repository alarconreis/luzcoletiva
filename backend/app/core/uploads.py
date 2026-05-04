"""
Utilitário de upload de arquivos.
Salva em /app/uploads/ (volume Docker) com nome UUID.
"""
import pathlib
import uuid

from fastapi import HTTPException, UploadFile

UPLOAD_DIR = pathlib.Path("/app/uploads")

ALLOWED_MIME: dict[str, str] = {
    "image/jpeg":      ".jpg",
    "image/png":       ".png",
    "image/webp":      ".webp",
    "application/pdf": ".pdf",
}

MAX_BYTES = 10 * 1024 * 1024  # 10 MB


async def save_upload(file: UploadFile) -> str:
    """Valida, salva e retorna o nome gerado (sem diretório)."""
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            400,
            "Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou PDF.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(400, "Arquivo vazio.")
    if len(content) > MAX_BYTES:
        raise HTTPException(400, "Arquivo muito grande. Tamanho máximo: 10 MB.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = ALLOWED_MIME[file.content_type]
    filename = f"{uuid.uuid4()}{ext}"
    (UPLOAD_DIR / filename).write_bytes(content)
    return filename
