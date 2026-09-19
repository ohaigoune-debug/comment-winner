@echo off
chcp 65001 >nul
title Comment Winner
cd /d "%~dp0"

echo.
echo  ====================================
echo     Comment Winner
echo  ====================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo  [!] Node.js غير مثبت
  echo.
  echo  سيفتح موقع التحميل الآن.
  echo  ثبّت البرنامج ثم اضغط على هذا الملف مرة أخرى.
  echo.
  start https://nodejs.org/en/download
  pause
  exit /b 1
)

if exist "node_modules" goto run

echo  [1/2] تجهيز المكتبات... قد يستغرق دقيقة، انتظر من فضلك.
echo.
call npm install
if errorlevel 1 (
  echo.
  echo  تعذّر تجهيز المكتبات. صوّر الشاشة وأرسلها.
  pause
  exit /b 1
)
goto run

:run
echo.
echo  [2/2] تشغيل التطبيق...
echo.
echo  سيفتح المتصفح تلقائيًا خلال ثوانٍ.
echo  لإيقاف التطبيق: أغلق هذه النافذة.
echo.

start "" cmd /c "ping -n 5 127.0.0.1 >nul & start http://localhost:3000"
call npm start

echo.
echo  تم إيقاف التطبيق.
pause
exit /b 0
