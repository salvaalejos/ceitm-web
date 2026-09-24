# ==========================================
# 🐘 SCRIPT DE RESPALDO (CEITM) - Adaptado
# ==========================================

# 1. Configuración (leída del .env raíz, nunca hardcodeada)
$ENV_PATH = Join-Path $PSScriptRoot ".env"
if (!(Test-Path -LiteralPath $ENV_PATH)) {
    Write-Host "❌ Error: No se encontró el archivo '.env' en $ENV_PATH" -ForegroundColor Red
    exit 1
}

function Get-DotEnvVar($name) {
    $line = Get-Content -LiteralPath $ENV_PATH | Where-Object { $_ -match "^$name=" } | Select-Object -First 1
    if (-not $line) { return $null }
    return ($line -split "=", 2)[1].Trim().Trim('"', "'")
}

$DB_USER = Get-DotEnvVar "POSTGRES_USER"
$DB_PASS = Get-DotEnvVar "POSTGRES_PASSWORD"
$DB_NAME = Get-DotEnvVar "POSTGRES_DB"

if (!$DB_USER -or !$DB_PASS -or !$DB_NAME) {
    Write-Host "❌ Error: Faltan variables POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB en .env" -ForegroundColor Red
    exit 1
}

$DB_CONTAINER = (docker compose -f (Join-Path $PSScriptRoot "docker-compose.yml") ps -q db | Select-Object -First 1)
if (!$DB_CONTAINER) {
    Write-Host "❌ Error: No se encontró el contenedor del servicio 'db'. Ejecuta primero: docker-compose up -d db" -ForegroundColor Red
    exit 1
}

$DATE = Get-Date -Format "yyyy-MM-dd_HH-mm"
$BACKUP_FILE = "backup_ceitm_$DATE.sql"

Write-Host "🚀 Iniciando respaldo de la base de datos: $DB_NAME" -ForegroundColor Cyan

# 2. Ejecutar el Dump
try {
    # Explicación del comando:
    # -e PGPASSWORD=$DB_PASS : Inyecta la contraseña para que no la pida
    # -i : Modo interactivo (necesario para la redirección correcta en Windows)
    # pg_dump : La herramienta de respaldo
    # --clean --if-exists : Añade comandos para borrar tablas viejas al restaurar

    # Nota: Usamos cmd /c para manejar la redirección '>' de forma nativa y evitar problemas de encoding en PowerShell
    $cmd = "docker exec -e PGPASSWORD=$DB_PASS -i $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME --clean --if-exists > $BACKUP_FILE"

    cmd /c $cmd

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ ¡Éxito! Respaldo guardado en: $BACKUP_FILE" -ForegroundColor Green
    } else {
        Write-Host "⚠️ El proceso terminó, pero verifica si el archivo $BACKUP_FILE tiene contenido." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error crítico: $_" -ForegroundColor Red
}