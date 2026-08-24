@echo off
REM Build script for WebView Prep Rhino plugin
REM Handles locked files when Rhino is running

echo Building WebView Prep...

REM Try to rename locked file if it exists (Rhino may have it loaded)
if exist "bin\Release\net8.0\WebViewPrep.rhp" (
    echo Checking if plugin file is locked...
    del "bin\Release\net8.0\WebViewPrep.rhp" 2>nul
    if exist "bin\Release\net8.0\WebViewPrep.rhp" (
        echo Plugin is locked by Rhino - renaming old version
        ren "bin\Release\net8.0\WebViewPrep.rhp" "WebViewPrep.rhp.locked-%RANDOM%"
    )
)

REM Clean up old locked files (from previous builds)
for /f %%F in ('dir /b "bin\Release\net8.0\WebViewPrep.rhp.locked-*" 2^>nul') do (
    del "bin\Release\net8.0\%%F" 2>nul
)

dotnet build -c Release

if errorlevel 1 (
    echo.
    echo Build failed! Check the errors above.
    exit /b 1
)

echo.
echo Build successful!
echo.
echo Plugin location: bin\Release\net8.0\WebViewPrep.rhp
echo.
echo To install:
echo   1. Close Rhino if running
echo   2. Drag WebViewPrep.rhp onto Rhino window, OR
echo   3. Copy to: %%APPDATA%%\McNeel\Rhinoceros\packages\8.0\WebViewPrep\
echo   4. Restart Rhino and open Panels menu to find "WebView Prep"
echo.
