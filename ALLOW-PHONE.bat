@echo off
title Comment Winner - Allow Phone Access
cd /d "%~dp0"

net session >nul 2>&1
if errorlevel 1 goto not_admin

echo.
echo  Opening port 3000 for your phone...
echo  فتح المنفذ 3000 للهاتف
echo.

powershell -NoProfile -Command "Remove-NetFirewallRule -DisplayName 'Comment Winner' -ErrorAction SilentlyContinue; New-NetFirewallRule -DisplayName 'Comment Winner' -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private | Out-Null"
if errorlevel 1 goto failed

echo  [OK] Done. / تم
echo.
echo  On your phone, open one of these:
echo  افتح في هاتفك احد هذه العناوين:
echo.
powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' } | ForEach-Object { '      http://' + $_.IPAddress + ':3000' }"
echo.
echo  The app must be running (START-WINDOWS.bat) at the same time.
echo  يجب ان يكون التطبيق شغالا في نفس الوقت
echo.
pause
exit /b 0

:not_admin
echo.
echo  [!] Administrator rights are required.
echo  [!] هذا الملف يحتاج صلاحية المسؤول
echo.
echo  Close this window. Then RIGHT-CLICK this file
echo  and choose "Run as administrator".
echo.
echo  اغلق هذه النافذة، ثم اضغط بالزر الايمن على هذا الملف
echo  واختر "Run as administrator"
echo.
pause
exit /b 1

:failed
echo.
echo  Failed. Please send a screenshot.
echo  فشل - صور الشاشة وارسلها
echo.
pause
exit /b 1
