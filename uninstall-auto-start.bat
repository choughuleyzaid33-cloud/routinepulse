@echo off
title RoutinePulse - Remove Background Auto-Start
echo ===================================================================
echo  Removing RoutinePulse Auto-Start Service...
echo ===================================================================
echo.

set STARTUP_VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\RoutinePulseAutoStart.vbs
if exist "%STARTUP_VBS%" (
    del "%STARTUP_VBS%"
    echo [OK] Removed from Windows Startup folder.
)

schtasks /Delete /TN "RoutinePulseBackgroundDaemon" /F >nul 2>&1
echo [OK] Removed from Windows Task Scheduler.

echo.
echo RoutinePulse auto-start has been uninstalled.
echo.
pause
