@echo off
chcp 65001 >nul
setlocal
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

echo  [1/2] Installing... please wait 1-2 minutes
echo  جاري التجهيز... انتظر دقيقة أو دقيقتين
echo.
call npm install
if errorlevel 1 goto install_failed

:run
echo.
echo  [2/2] Starting...
echo  جاري التشغيل
echo.
echo  The browser will open in a few seconds.
echo  سيفتح المتصفح تلقائيا بعد ثوان
echo.
echo  To stop: close this window.
echo  للايقاف: اغلق هذه النافذة
echo.

start "" cmd /c "ping -n 6 127.0.0.1 >nul & start http://localhost:3000"
call npm start

echo.
echo  Stopped. / تم الايقاف
pause
exit /b 0

:no_node
echo  [!] Node.js is not installed
echo  [!] برنامج Node.js غير مثبت
echo.
echo  The download page will open now.
echo  Install it, then run this file again.
echo.
echo  سيفتح موقع التحميل الان
echo  ثبته ثم اضغط على هذا الملف مرة اخرى
echo.
start "" "https://nodejs.org/en/download"
pause
exit /b 1

:install_failed
echo.
echo  Install failed. Please send a screenshot.
echo  فشل التجهيز - صور الشاشة وارسلها
pause
exit /b 1
