@echo off
title Comment Winner - Save Token
cd /d "%~dp0"

echo.
echo  ====================================
echo     Save your Meta access token
echo  ====================================
echo.
echo  Paste your token below, then press Enter.
echo  To paste: right-click inside this window.
echo.

set "TOKEN="
set /p TOKEN=Token:

if not defined TOKEN goto empty

> ".env" echo META_ACCESS_TOKEN=%TOKEN%

echo.
echo  [OK] Saved on THIS COMPUTER only, in a file named .env
echo       It is never uploaded and never leaves this machine.
echo.
echo  Next: close START-WINDOWS.bat and run it again.
echo  Your phone will then work without typing any token.
echo.
pause
exit /b 0

:empty
echo.
echo  Nothing was pasted. Run this file again.
echo.
pause
exit /b 1
