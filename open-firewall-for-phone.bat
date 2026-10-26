@echo off
title RoutinePulse - Enable Phone Access in Windows Firewall
echo ===================================================================
echo  Enabling Mobile Phone Access (Port 5000) in Windows Firewall...
echo ===================================================================
echo.
echo Requesting Administrator permission to open Port 5000...
echo.

powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', 'New-NetFirewallRule -DisplayName \"RoutinePulse Phone Access (Port 5000)\" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow -Profile Any -ErrorAction SilentlyContinue; Write-Host \"[SUCCESS] Port 5000 has been allowed in Windows Firewall! Your phone can now connect.\"; Start-Sleep -Seconds 3'"

echo Done! If you clicked 'Yes' on the administrator prompt, Port 5000 is open.
echo.
pause
