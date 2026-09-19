#!/bin/bash
cd "$(dirname "$0")" || exit 1

echo
echo " ===================================="
echo "    Comment Winner"
echo " ===================================="
echo

if ! command -v node >/dev/null 2>&1; then
  echo " [!] Node.js غير مثبت"
  echo
  echo " سيفتح موقع التحميل الآن."
  echo " ثبّت البرنامج ثم اضغط على هذا الملف مرة أخرى."
  echo
  open "https://nodejs.org/en/download" 2>/dev/null || xdg-open "https://nodejs.org/en/download" 2>/dev/null
  read -r -p " اضغط Enter للإغلاق..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo " [1/2] تجهيز المكتبات... قد يستغرق دقيقة، انتظر من فضلك."
  echo
  if ! npm install; then
    echo
    echo " حدث خطأ. صوّر الشاشة وأرسلها."
    read -r -p " اضغط Enter للإغلاق..."
    exit 1
  fi
else
  echo " [1/2] المكتبات جاهزة."
fi

echo
echo " [2/2] تشغيل التطبيق..."
echo
echo " سيفتح المتصفح تلقائيًا خلال ثوانٍ."
echo " لإيقاف التطبيق: أغلق هذه النافذة أو اضغط Ctrl+C."
echo

( sleep 4; open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null ) &

npm start
