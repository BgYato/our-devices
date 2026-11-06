$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Invoke-Compose {
    param([string[]]$ComposeArguments)

    Push-Location $root
    try {
        & docker compose @ComposeArguments
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Docker Compose termino con codigo $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}

function Test-PortInUse {
    param([int]$Port)

    return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

function Start-LocalDevelopment {
    $backendPath = Join-Path $root "our-devices-backend"
    $frontendPath = Join-Path $root "our-devices-frontend"

    if (-not (Test-PortInUse 3306)) {
        Write-Warning "MySQL no escucha en localhost:3306. Inicia MySQL y confirma que exista la base our_devices."
        $continue = Read-Host "Abrir de todos modos las ventanas de desarrollo? (s/N)"
        if ($continue -notmatch '^(s|si)$') {
            return
        }
    }

    if (Test-PortInUse 8080) {
        Write-Warning "El puerto 8080 ya esta en uso; no iniciare otro backend."
    }
    else {
        Start-Process -FilePath "powershell.exe" -WorkingDirectory $backendPath -ArgumentList @(
            "-NoExit",
            "-Command",
            "& .\mvnw.cmd spring-boot:run"
        )
        Write-Host "Backend local iniciando en http://localhost:8080"
    }

    if (Test-PortInUse 5173) {
        Write-Warning "El puerto 5173 ya esta en uso; no iniciare otro frontend."
    }
    else {
        Start-Process -FilePath "powershell.exe" -WorkingDirectory $frontendPath -ArgumentList @(
            "-NoExit",
            "-Command",
            "npm run dev"
        )
        Write-Host "Frontend local iniciando en http://localhost:5173"
    }

    Write-Host "Este modo usa la conexion MySQL local de application.yml; no usa la base de Docker."
    Write-Host "Cierra las ventanas de backend y frontend con Ctrl+C para detener el modo local."
}

function Test-TunnelToken {
    $envFile = Join-Path $root ".env"
    if (-not (Test-Path $envFile)) {
        return $false
    }

    $tokenLine = Get-Content $envFile | Where-Object { $_ -match '^\s*CLOUDFLARE_TUNNEL_TOKEN\s*=\s*\S+' } | Select-Object -First 1
    return [bool]$tokenLine
}

function Show-Menu {
    Clear-Host
    Write-Host "OurDevices - panel de desarrollo y Docker"
    Write-Host "Carpeta: $root"
    Write-Host ""
    Write-Host " 1. Desarrollo local (MySQL de Windows + backend y frontend locales)"
    Write-Host " 2. Iniciar Docker (base + backend + frontend, sin tunel)"
    Write-Host " 3. Iniciar Docker con Cloudflare Tunnel"
    Write-Host " 4. Reconstruir y actualizar backend y frontend Docker"
    Write-Host " 5. Reconstruir y actualizar Docker con Cloudflare Tunnel"
    Write-Host " 6. Reiniciar contenedores Docker en ejecucion"
    Write-Host " 7. Ver estado de Docker"
    Write-Host " 8. Ver logs de un servicio Docker"
    Write-Host " 9. Detener contenedores Docker (conserva los datos)"
    Write-Host " 0. Salir"
    Write-Host ""
}

while ($true) {
    Show-Menu
    $choice = Read-Host "Selecciona una opcion"

    switch ($choice) {
        "1" {
            Start-LocalDevelopment
            Read-Host "Presiona Enter para volver al menu" | Out-Null
        }
        "2" {
            Invoke-Compose -ComposeArguments @("up", "-d", "db", "backend", "frontend")
            Read-Host "Presiona Enter para volver al menu" | Out-Null
        }
        "3" {
            if (-not (Test-TunnelToken)) {
                Write-Warning "CLOUDFLARE_TUNNEL_TOKEN no esta configurado en el .env de la raiz."
            }
            else {
                Invoke-Compose -ComposeArguments @("--profile", "tunnel", "up", "-d")
            }
            Read-Host "Presiona Enter para volver al menu" | Out-Null
        }
        "4" {
            Invoke-Compose -ComposeArguments @("up", "-d", "--build", "db", "backend", "frontend")
            Read-Host "Presiona Enter para volver al menu" | Out-Null
        }
        "5" {
            if (-not (Test-TunnelToken)) {
                Write-Warning "CLOUDFLARE_TUNNEL_TOKEN no esta configurado en el .env de la raiz."
            }
            else {
                Invoke-Compose -ComposeArguments @("--profile", "tunnel", "up", "-d", "--build")
            }
            Read-Host "Presiona Enter para volver al menu" | Out-Null
        }
        "6" {
            Invoke-Compose -ComposeArguments @("--profile", "tunnel", "restart")
            Read-Host "Presiona Enter para volver al menu" | Out-Null
        }
        "7" {
            Invoke-Compose -ComposeArguments @("--profile", "tunnel", "ps")
            Read-Host "Presiona Enter para volver al menu" | Out-Null
        }
        "8" {
            $service = Read-Host "Servicio (db, backend, frontend o cloudflared)"
            if ($service -in @("db", "backend", "frontend", "cloudflared")) {
                Invoke-Compose -ComposeArguments @("--profile", "tunnel", "logs", "--tail", "100", "-f", $service)
            }
            else {
                Write-Warning "Servicio desconocido."
                Read-Host "Presiona Enter para volver al menu" | Out-Null
            }
        }
        "9" {
            $confirm = Read-Host "Esto detiene Docker, pero conserva los datos. Continuar? (s/N)"
            if ($confirm -match '^(s|si)$') {
                Invoke-Compose -ComposeArguments @("--profile", "tunnel", "down")
            }
            Read-Host "Presiona Enter para volver al menu" | Out-Null
        }
        "0" {
            return
        }
        default {
            Write-Warning "Opcion no valida."
            Start-Sleep -Seconds 1
        }
    }
}
