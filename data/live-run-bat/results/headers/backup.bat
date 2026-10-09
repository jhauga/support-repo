:: Purpose: Copies a given folder to a .bak sibling folder using robocopy, failing if no folder argument is given or the copy fails.
:: Usage: backup.bat C:\path\to\folder
:: Dependencies: robocopy.exe (built into Windows).
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
