@echo off
title Comment Winner
cd /d "%~dp0"

echo.
echo  ====================================
echo     Comment Winner
echo  ====================================
echo.

where node >nul 2>&1
if errorlevel 1 goto no_node
if exist "node_modules" goto run

echo  Installing. This takes 1-2 minutes, please wait...
echo.
call npm install
if errorlevel 1 goto install_failed

:run
echo.
echo  Starting the app. The browser will open by itself.
echo  To stop: close this window.
echo.
set OPEN_BROWSER=1
call npm start
echo.
echo  The app has stopped.
pause
exit /b 0

:no_node
echo  Node.js is NOT installed on this computer.
echo.
echo  The download page will open now.
echo  Install Node.js, then run this file again.
echo.
start "" "https://nodejs.org/en/download"
pause
exit /b 1

:install_failed
echo.
echo  Installation FAILED.
echo  Please send a screenshot of this window.
echo.
pause
exit /b 1
