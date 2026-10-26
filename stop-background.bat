@echo off
title RoutinePulse - Stop Background Service
echo Stopping any running RoutinePulse background servers...
powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*server/src/index.js*' -or $_.Path -like '*Reminder app*' } | Stop-Process -Force"
echo RoutinePulse background service stopped.
pause
