import asyncio
# Ajusta la ruta del import según el archivo donde guardaste la función
from app.core.email_utils import send_email_async

async def main():
    try:
        await send_email_async(
            subject="Prueba SMTP TecNM",
            email_to="alejossalvador@gmail.com", # Tu correo personal para verificar recepción
            template_name="accepted.html",           # O cualquier plantilla que ya tengas en tu carpeta de templates
            context={"name": "Salvador"}         # Variables que espere tu template HTML
        )
    except Exception as e:
        print(f"\n❌ Error capturado al enviar: {repr(e)}")

if __name__ == "__main__":
    asyncio.run(main())