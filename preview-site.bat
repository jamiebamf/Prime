@echo off
setlocal

cd /d "%~dp0prime-epos"

echo Starting Prime-EPOS preview...
echo.
echo If a browser does not open automatically, visit:
echo http://127.0.0.1:8088/index.html
echo.
echo Keep this window open while previewing the site.
echo Press Ctrl+C to stop the preview server.
echo.

start "" "http://127.0.0.1:8088/index.html"
py -m http.server 8088 --bind 127.0.0.1

if errorlevel 1 (
  echo.
  echo Python launcher failed; trying python directly...
  python -m http.server 8088 --bind 127.0.0.1
)

pause
