:: Purpose: Print a greeting for the given name, or for "world" when no name is given.
:: Usage: greet.bat Alice
:: Dependencies: Windows CMD only; no external tools.
@echo off
setlocal
set "_NAME=%~1"
if not defined _NAME set "_NAME=world"
echo Hello, %_NAME%!
endlocal
