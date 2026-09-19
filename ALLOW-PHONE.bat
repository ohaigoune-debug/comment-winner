@echo off
title Comment Winner - Allow Phone Access
cd /d "%~dp0"

net session >nul 2>&1
if errorlevel 1 goto not_admin

echo.
echo  Opening port 3000 for phones on your Wi-Fi...
echo.

powershell -NoProfile -Command "Remove-NetFirewallRule -DisplayName 'Comment Winner' -ErrorAction SilentlyContinue; New-NetFirewallRule -DisplayName 'Comment Winner' -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private | Out-Null"
if errorlevel 1 goto failed

echo  [OK] Done.
echo.
echo  Open one of these on your phone:
echo.
powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' } | ForEach-Object { '      http://' + $_.IPAddress + ':3000' }"
echo.
echo  START-WINDOWS.bat must be running at the same time.
echo.
pause
exit /b 0

:not_admin
echo.
echo  [!] Administrator rights are required.
echo.
echo  Close this window.
echo  Then RIGHT-CLICK this file and choose "Run as administrator".
echo.
pause
exit /b 1

:failed
echo.
echo  Failed. Please send a screenshot.
echo.
pause
exit /b 1
