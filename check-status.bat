@echo off
title RoutinePulse - Service Status Check
echo =========================================================
echo  Checking RoutinePulse Daemon Status...
echo =========================================================
echo.
powershell -Command "try { $res = Invoke-RestMethod -Uri http://localhost:5000/api/status -TimeoutSec 3; Write-Host 'STATUS: ONLINE (Healthy)' -ForegroundColor Green; Write-Host ('Active Reminders: ' + $res.activeReminders); Write-Host ('Local Time: ' + $res.localTime); } catch { Write-Host 'STATUS: OFFLINE (Daemon is not currently running)' -ForegroundColor Red; }"
echo.
pause
