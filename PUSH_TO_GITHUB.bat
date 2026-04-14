@echo off
setlocal
cd /d "%~dp0"

echo.
echo ============================================
echo   PUSH TO GITHUB: 0415 (Anniversary)
echo ============================================
echo.

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set TS=%%i

git add .
git commit -m "Update anniversary site %TS%"
if errorlevel 1 (
  echo.
  echo No new changes to commit. Trying push anyway...
)

git push

echo.
echo Live URL:
echo https://jacobvillacorte.github.io/0415/
echo.
echo If this is your first deploy, enable Pages in GitHub:
echo Settings ^> Pages ^> Source: Deploy from branch ^> main / root
echo.
echo ============================================
pause
