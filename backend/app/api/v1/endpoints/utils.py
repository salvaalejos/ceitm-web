import shutil
import os
from uuid import uuid4
from fastapi import APIRouter, UploadFile, File, HTTPException
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

    # 2. Generar nombre único (para evitar colisiones si suben dos "flyer.jpg")
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid4()}.{file_ext}"

    # 3. Ruta de guardado (dentro del volumen de Docker)
    upload_dir = "static/images"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    file_path = f"{upload_dir}/{unique_filename}"

    # 4. Guardar el archivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 5. Retornar la URL completa
    # Nota: En producción, esto debería ser la URL del dominio real.
    # Por ahora, construimos la URL local.
    url = f"http://localhost:8000/static/images/{unique_filename}"

    return {"url": url}