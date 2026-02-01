# ==========================================
# 🐘 SCRIPT DE RESPALDO (CEITM) - Adaptado
# ==========================================

# 1. Configuración (Extraída de tu .env)
$CONTAINER_NAME = "ceitm-web-db-1"
$DB_USER = "ceitm_system_user"
$DB_NAME = "ceitm_platform_db"
# Esta contraseña es necesaria para que pg_dump no pida interactividad
$DB_PASS = "fbfddec107f0df8a74453836aa932e0f0a43ae70eac546ae6b9bbff946ff127a"

$DATE = Get-Date -Format "yyyy-MM-dd_HH-mm"
$BACKUP_FILE = "backup_ceitm_$DATE.sql"

Write-Host "🚀 Iniciando respaldo de la base de datos: $DB_NAME" -ForegroundColor Cyan

# 2. Verificar si el contenedor está corriendo
if (!(docker ps -q -f name=$CONTAINER_NAME)) {
    Write-Host "❌ Error: El contenedor '$CONTAINER_NAME' no está corriendo." -ForegroundColor Red
    Write-Host "👉 Intenta ejecutar: docker-compose up -d db" -ForegroundColor Yellow
    exit
}

# 3. Ejecutar el Dump
try {
    # Explicación del comando:
    # -e PGPASSWORD=$DB_PASS : Inyecta la contraseña para que no la pida
    # -i : Modo interactivo (necesario para la redirección correcta en Windows)
    # pg_dump : La herramienta de respaldo
    # --clean --if-exists : Añade comandos para borrar tablas viejas al restaurar

    # Nota: Usamos cmd /c para manejar la redirección '>' de forma nativa y evitar problemas de encoding en PowerShell
    $cmd = "docker exec -e PGPASSWORD=$DB_PASS -i $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME --clean --if-exists > $BACKUP_FILE"

    cmd /c $cmd

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ ¡Éxito! Respaldo guardado en: $BACKUP_FILE" -ForegroundColor Green
    } else {
        Write-Host "⚠️ El proceso terminó, pero verifica si el archivo $BACKUP_FILE tiene contenido." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error crítico: $_" -ForegroundColor Red
}