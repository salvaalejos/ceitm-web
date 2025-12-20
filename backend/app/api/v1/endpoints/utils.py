import shutil
import os
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, UploadFile, File, HTTPException
# 👇 Importamos settings
from app.core.config import settings

router = APIRouter()


@router.post("/upload-image", response_model=dict)
async def upload_image(file: UploadFile = File(...)):
    """
    Sube una imagen al servidor y retorna su URL pública.
    """
    # 1. Validar formato
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    # 2. Generar nombre único
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid4()}.{file_ext}"

    # 3. Ruta de guardado
    upload_dir = "static/images"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    file_path = f"{upload_dir}/{unique_filename}"

    # 4. Guardar el archivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 5. Retornar la URL completa DINÁMICA
    # 👇 CAMBIO AQUÍ: Usamos settings.DOMAIN
    url = f"{settings.DOMAIN}/static/images/{unique_filename}"

    return {"url": url}


@router.post("/upload/file")
async def upload_file(file: UploadFile = File(...)):
    """
    Sube cualquier tipo de archivo (PDF, DOCX, ZIP).
    """
    try:
        # 1. Definir carpeta de destino
        upload_dir = Path("static/uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)

        # 2. Limpiar nombre
        clean_filename = file.filename.replace(" ", "_")
        destination = upload_dir / clean_filename

        # 3. Guardar
        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 4. Retornar la URL pública DINÁMICA
        # 👇 CAMBIO AQUÍ: Usamos settings.DOMAIN
        return f"{settings.DOMAIN}/static/uploads/{clean_filename}"

    except Exception as e:
        print(f"Error subiendo archivo: {e}")
        raise HTTPException(status_code=500, detail=f"No se pudo guardar el archivo: {str(e)}")