@echo off
setlocal
if "%~1"=="" (
  echo Usage: backup.bat ^<folder^>
  exit /b 1
)
set "_DEST=%~1.bak"
robocopy "%~1" "%_DEST%" /e /njh /njs >nul
if errorlevel 8 exit /b 1
echo Copied %~1 to %_DEST%
endlocal
