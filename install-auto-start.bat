@echo off
title RoutinePulse - Install Background Auto-Start Service
echo ===================================================================
echo  RoutinePulse - Automatic 24/7 Background Service Setup
echo ===================================================================
echo.
echo Setting up RoutinePulse to run automatically in the background,
echo even when the browser or application is closed...
echo.

set APP_DIR=%~dp0
set VBS_PATH=%APP_DIR%start-silent.vbs
set STARTUP_VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\RoutinePulseAutoStart.vbs

:: 1. Add to Windows Startup Folder (runs invisibly on every login)
echo Creating startup launcher in:
echo "%STARTUP_VBS%"
echo.

(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.Run "wscript.exe ""%VBS_PATH%""", 0, False
) > "%STARTUP_VBS%"

if exist "%STARTUP_VBS%" (
    echo [SUCCESS] Windows Startup integration installed!
) else (
    echo [WARNING] Could not write to Startup folder, attempting Task Scheduler...
)

:: 2. Also register via schtasks for maximum reliability
echo.
echo Registering Windows Scheduled Task 'RoutinePulseBackgroundDaemon'...
schtasks /Create /TN "RoutinePulseBackgroundDaemon" /TR "wscript.exe \"%VBS_PATH%\"" /SC ONLOGON /RL HIGHEST /F >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Windows Scheduled Task registered successfully!
) else (
    schtasks /Create /TN "RoutinePulseBackgroundDaemon" /TR "wscript.exe \"%VBS_PATH%\"" /SC ONLOGON /F >nul 2>&1
    echo [INFO] Registered standard user Scheduled Task.
)

echo.
echo ===================================================================
echo  SETUP COMPLETE!
echo  RoutinePulse is now configured to start automatically on boot
echo  and run 24/7 silently in the background!
echo ===================================================================
echo.
echo To start it right now in the background, run 'start-silent.vbs'
echo or click any button below.
echo.
pause
