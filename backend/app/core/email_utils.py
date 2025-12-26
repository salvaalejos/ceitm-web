import logging
from pathlib import Path
from typing import Any, Dict
from fastapi import BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=settings.VALIDATE_CERTS,
    TEMPLATE_FOLDER=Path(__file__).parent.parent / 'templates/emails'
)

# Función para Background Tasks (Producción)
def send_email_background(
    background_tasks: BackgroundTasks,
    subject: str,
    email_to: str,
    template_name: str,
    context: Dict[str, Any]
):
    try:
        message = MessageSchema(
            subject=subject,
            recipients=[email_to],
            template_body=context,
            subtype=MessageType.html
        )
        fm = FastMail(conf)
        background_tasks.add_task(fm.send_message, message, template_name=template_name)
        print(f"✅ [Background] Tarea de correo encolada para: {email_to}") # Usamos print para asegurar visibilidad
    except Exception as e:
        print(f"❌ [Background] Error preparando correo: {str(e)}")

# 👇 NUEVA: Función para Envío Inmediato (Test/Debug)
async def send_email_async(
    subject: str,
    email_to: str,
    template_name: str,
    context: Dict[str, Any]
):
    """
    Envía el correo ESPERANDO la respuesta del servidor SMTP.
    Ideal para testing porque si falla, lanza la excepción aquí mismo.
    """
    print(f"⏳ Intentando enviar correo a {email_to}...")
    message = MessageSchema(
        subject=subject,
        recipients=[email_to],
        template_body=context,
        subtype=MessageType.html
    )
    fm = FastMail(conf)
    await fm.send_message(message, template_name=template_name)
    print(f"🚀 Correo enviado exitosamente a {email_to}")