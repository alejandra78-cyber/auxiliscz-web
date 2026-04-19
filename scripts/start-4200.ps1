param(
  [switch]$open,
  [switch]$SkipServe
)

$ErrorActionPreference = "Continue"
$port = 4200

Write-Host "Verificando puerto $port..." -ForegroundColor Cyan

$listenLines = netstat -ano | Select-String ":$port" | Select-String "LISTENING"
$pids = @()
foreach ($line in $listenLines) {
  $parts = ($line.ToString() -split "\s+") | Where-Object { $_ -ne "" }
  if ($parts.Count -gt 0) {
    $pid = $parts[-1]
    if ($pid -match "^\d+$" -and $pid -ne "0") {
      $pids += [int]$pid
    }
  }
}

$pids = $pids | Sort-Object -Unique
foreach ($pid in $pids) {
  Write-Host "Cerrando proceso PID $pid en puerto $port..." -ForegroundColor Yellow
  taskkill /PID $pid /F | Out-Null
}

$stillBusy = netstat -ano | Select-String ":$port" | Select-String "LISTENING"
if ($stillBusy) {
  Write-Host "No se pudo liberar el puerto $port (probablemente por permisos)." -ForegroundColor Red
  Write-Host "Abre PowerShell como administrador y ejecuta: npm run start" -ForegroundColor Red
  exit 1
}

if ($SkipServe) {
  Write-Host "SkipServe activo. No se inicia Angular." -ForegroundColor DarkYellow
  exit 0
}

Write-Host "Iniciando Angular en http://localhost:$port ..." -ForegroundColor Green
$ngCmd = Join-Path $PSScriptRoot "..\\node_modules\\.bin\\ng.cmd"
if (-not (Test-Path $ngCmd)) {
  Write-Host "No se encontró Angular CLI local en node_modules. Ejecuta: npm install" -ForegroundColor Red
  exit 1
}
if ($open) {
  & $ngCmd serve --port $port --host localhost --open --proxy-config proxy.conf.json
} else {
  & $ngCmd serve --port $port --host localhost --proxy-config proxy.conf.json
}
